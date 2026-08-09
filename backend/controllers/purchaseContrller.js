const crypto = require('crypto');
const { supabaseAdmin } = require('../services/supabaseService');

function hashPin(pin) {
  return crypto
    .createHash('sha256')
    .update(String(pin))
    .digest('hex');
}

const SERVICE_PERCENT_KEY = {
  data: 'data_percent',
  airtime: 'airtime_percent',
  electricity: 'electricity_percent',
  cable: 'cable_percent',
  betting: 'betting_percent',
  waec: 'waec_percent',
  jamb: 'jamb_percent',
  smile: 'smile_percent',
  internet: 'internet_percent',
};

exports.purchase = async (req, res) => {
  let deducted = false;

  try {
    const {
      phone,
      service,
      product,
      amount,
      recipient,
      network,
      metadata,
      purchase_pin,
    } = req.body;

    if (
      !phone ||
      !service ||
      !product ||
      !recipient ||
      !purchase_pin ||
      amount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required purchase details',
      });
    }

    const purchaseAmount = Number(amount);

    if (!Number.isFinite(purchaseAmount) || purchaseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase amount',
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('phone, wallet_balance, purchase_pin, cashback_balance')
      .eq('phone', String(phone))
      .maybeSingle();

    if (profileError) {
      console.error(profileError);
      return res.status(500).json({
        success: false,
        message: 'Unable to verify account',
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    if (profile.purchase_pin !== hashPin(purchase_pin)) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect purchase PIN',
      });
    }

    const prevBalance = Number(profile.wallet_balance || 0);

    if (purchaseAmount > prevBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance. Please fund your wallet.',
      });
    }

    const newBalance =
      Math.round((prevBalance - purchaseAmount) * 100) / 100;

    // Server-side balance validation + deduction.
    const { data: updatedProfile, error: balanceError } =
      await supabaseAdmin
        .from('profiles')
        .update({
          wallet_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('phone', profile.phone)
        .gte('wallet_balance', purchaseAmount)
        .select('wallet_balance')
        .maybeSingle();

    if (balanceError || !updatedProfile) {
      return res.status(409).json({
        success: false,
        message: 'Wallet balance changed. Please try again.',
      });
    }

    deducted = true;

    // Server decides cashback percentage.
    let cashbackPercent = 0;

    const { data: settings } = await supabaseAdmin
      .from('cashback_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (settings?.is_enabled) {
      const { data: productData } = await supabaseAdmin
        .from('products')
        .select('cashback_percent')
        .eq('service', service)
        .eq('name', product)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const productPercent = Number(
        productData?.cashback_percent || 0
      );

      if (productPercent > 0) {
        cashbackPercent = productPercent;
      } else {
        const settingKey = SERVICE_PERCENT_KEY[service];
        cashbackPercent = Number(
          (settingKey && settings[settingKey]) || 0
        );
      }
    }

    const cashbackEarned = Math.round(
      ((purchaseAmount * cashbackPercent) / 100) * 100
    ) / 100;

    const reference =
      `GYD-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const { data: transaction, error: transactionError } =
      await supabaseAdmin
        .from('transactions')
        .insert({
          phone: profile.phone,
          type: 'purchase',
          service,
          product,
          amount: purchaseAmount,
          status: 'success',
          recipient,
          network: network || null,
          reference,
          metadata: metadata || {},
        })
        .select()
        .single();

    if (transactionError) {
      throw transactionError;
    }

    if (cashbackEarned > 0) {
      const oldCashback = Number(profile.cashback_balance || 0);
      const newCashback =
        Math.round((oldCashback + cashbackEarned) * 100) / 100;

      const { error: cashbackBalanceError } =
        await supabaseAdmin
          .from('profiles')
          .update({
            cashback_balance: newCashback,
            updated_at: new Date().toISOString(),
          })
          .eq('phone', profile.phone);

      if (cashbackBalanceError) {
        throw cashbackBalanceError;
      }

      const { error: cashbackLogError } =
        await supabaseAdmin
          .from('cashback_transactions')
          .insert({
            user_phone: profile.phone,
            transaction_id: transaction.id,
            transaction_reference: transaction.reference,
            service,
            product,
            transaction_amount: purchaseAmount,
            cashback_percent: cashbackPercent,
            cashback_amount: cashbackEarned,
            status: 'success',
          });

      if (cashbackLogError) {
        throw cashbackLogError;
      }
    }

    return res.status(200).json({
      success: true,
      transaction,
      newBalance,
      prevBalance,
      cashbackEarned,
    });
  } catch (error) {
    console.error('Purchase error:', error);

    // Refund wallet if money was deducted but purchase failed.
    if (deducted) {
      try {
        const { data: current } = await supabaseAdmin
          .from('profiles')
          .select('wallet_balance')
          .eq('phone', String(req.body.phone))
          .maybeSingle();

        if (current) {
          await supabaseAdmin
            .from('profiles')
            .update({
              wallet_balance:
                Number(current.wallet_balance || 0) +
                Number(req.body.amount || 0),
              updated_at: new Date().toISOString(),
            })
            .eq('phone', String(req.body.phone));
        }
      } catch (refundError) {
        console.error('Purchase refund error:', refundError);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Purchase failed. Your wallet was not charged.',
    });
  }
};
