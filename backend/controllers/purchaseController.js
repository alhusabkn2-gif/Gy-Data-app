const crypto = require('crypto');
const axios = require('axios');
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

const NETWORK_CODES = {
  MTN: '01',
  GLO: '02',
  '9MOBILE': '03',
  AIRTEL: '04',
};

const CLUBKONNECT_BASE_URL =
  process.env.CLUBKONNECT_BASE_URL ||
  'https://www.nellobytesystems.com';

function makeRequestId() {
  return `GYD${Date.now()}${crypto
    .randomBytes(4)
    .toString('hex')}`;
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function responseText(payload) {
  if (typeof payload === 'string') {
    return payload.toUpperCase();
  }

  try {
    return JSON.stringify(payload).toUpperCase();
  } catch {
    return '';
  }
}

function providerFailed(payload) {
  const text = responseText(payload);

  return (
    text.includes('FAILED') ||
    text.includes('FAILURE') ||
    text.includes('ERROR') ||
    text.includes('INVALID') ||
    text.includes('INSUFFICIENT')
  );
}

function providerSucceeded(payload) {
  if (providerFailed(payload)) {
    return false;
  }

  if (payload?.success === true) {
    return true;
  }

  if (payload?.status === true) {
    return true;
  }

  const text = responseText(payload);

  return (
    text.includes('SUCCESS') ||
    text.includes('SUCCESSFUL') ||
    text.includes('COMPLETED') ||
    text.includes('DELIVERED')
  );
}

function providerReference(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return (
    payload.ORDERID ||
    payload.OrderID ||
    payload.orderId ||
    payload.ORDER_ID ||
    payload.reference ||
    payload.Reference ||
    payload.transactionId ||
    payload.TransactionID ||
    null
  );
}

function extractPlanSize(name) {
  const match = String(name || '')
    .toLowerCase()
    .match(/(\d+(?:\.\d+)?)\s*gb/);

  return match ? Number(match[1]) : null;
}

function categoryMatches(productName, providerName) {
  const product = String(productName || '').toLowerCase();
  const provider = String(providerName || '').toLowerCase();

  if (product.includes('sme')) {
    return provider.includes('sme');
  }

  if (product.includes('corporate')) {
    return provider.includes('corporate');
  }

  if (product.includes('gifting')) {
    return (
      provider.includes('gifting') ||
      provider.includes('gift')
    );
  }

  if (product.includes('direct')) {
    return provider.includes('direct');
  }

  return true;
}

async function getClubKonnectPlans() {
  const userId = process.env.CLUBKONNECT_USER_ID;
  const apiKey = process.env.CLUBKONNECT_API_KEY;

  if (!userId || !apiKey) {
    throw new Error(
      'ClubKonnect credentials are not configured on the server'
    );
  }

  const response = await axios.get(
    `${CLUBKONNECT_BASE_URL}/APIDatabundlePlansV2.asp`,
    {
      params: {
        UserID: userId,
        APIKey: apiKey,
      },
      timeout: 30000,
    }
  );

  return response.data;
}

function findProviderPlan(plans, network, productName) {
  const networkCode =
    NETWORK_CODES[
      String(network || '').toUpperCase()
    ];

  if (!networkCode || !plans?.MOBILE_NETWORK) {
    return null;
  }

  const networkEntry = Object.entries(
    plans.MOBILE_NETWORK
  ).find(([, value]) => {
    return (
      Array.isArray(value) &&
      value.some(
        (item) => String(item.ID) === networkCode
      )
    );
  });

  if (!networkEntry) {
    return null;
  }

  const products =
    networkEntry[1]?.[0]?.PRODUCT || [];

  const localSize = extractPlanSize(productName);

  const candidates = products.filter((item) => {
    if (
      !categoryMatches(
        productName,
        item.PRODUCT_NAME
      )
    ) {
      return false;
    }

    if (localSize === null) {
      return true;
    }

    return (
      extractPlanSize(item.PRODUCT_NAME) ===
      localSize
    );
  });

  if (!candidates.length) {
    return null;
  }

  const productLower =
    String(productName).toLowerCase();

  const preferred = candidates.find((item) => {
    const providerName =
      String(item.PRODUCT_NAME).toLowerCase();

    if (
      productLower.includes('direct') ||
      productLower.includes('sme')
    ) {
      return (
        providerName.includes('30 days') ||
        providerName.includes('monthly')
      );
    }

    return true;
  });

  return preferred || candidates[0];
}

async function buyClubKonnectData({
  network,
  productName,
  recipient,
}) {
  const userId = process.env.CLUBKONNECT_USER_ID;
  const apiKey = process.env.CLUBKONNECT_API_KEY;

  if (!userId || !apiKey) {
    throw new Error(
      'ClubKonnect credentials are not configured on the server'
    );
  }

  const plans = await getClubKonnectPlans();

  const providerPlan = findProviderPlan(
    plans,
    network,
    productName
  );

  if (!providerPlan) {
    throw new Error(
      `No ClubKonnect plan mapping found for ${productName} (${network})`
    );
  }

  const requestId = makeRequestId();

  const params = {
    UserID: userId,
    APIKey: apiKey,
    MobileNetwork:
      NETWORK_CODES[
        String(network || '').toUpperCase()
      ],
    DataPlan: providerPlan.PRODUCT_CODE,
    MobileNumber: recipient,
    RequestID: requestId,
  };

  if (process.env.CLUBKONNECT_CALLBACK_URL) {
    params.CallBackURL =
      process.env.CLUBKONNECT_CALLBACK_URL;
  }

  const response = await axios.get(
    `${CLUBKONNECT_BASE_URL}/APIDatabundleV1.asp`,
    {
      params,
      timeout: 45000,
    }
  );

  return {
    requestId,
    providerPlan,
    response: response.data,
  };
}

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

    const purchaseAmount = asNumber(amount);

    if (purchaseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase amount',
      });
    }

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .select(
          'phone, wallet_balance, purchase_pin, cashback_balance'
        )
        .eq('phone', String(phone))
        .maybeSingle();

    if (profileError) {
      console.error(
        'Profile lookup error:',
        profileError.message
      );

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

    if (
      profile.purchase_pin !==
      hashPin(purchase_pin)
    ) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect purchase PIN',
      });
    }

    const prevBalance = asNumber(
      profile.wallet_balance
    );

    if (purchaseAmount > prevBalance) {
      return res.status(400).json({
        success: false,
        message:
          'Insufficient wallet balance. Please fund your wallet.',
      });
    }

    let providerResult = null;

    if (service === 'data') {
      providerResult = await buyClubKonnectData({
        network,
        productName: product,
        recipient: String(recipient).replace(
          /\D/g,
          ''
        ),
      });

      if (
        providerFailed(providerResult.response) ||
        !providerSucceeded(providerResult.response)
      ) {
        throw new Error(
          'ClubKonnect did not confirm the data purchase'
        );
      }
    }

    const newBalance =
      Math.round(
        (prevBalance - purchaseAmount) * 100
      ) / 100;

    const {
      data: updatedProfile,
      error: balanceError,
    } = await supabaseAdmin
      .from('profiles')
      .update({
        wallet_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('phone', profile.phone)
      .gte(
        'wallet_balance',
        purchaseAmount
      )
      .select('wallet_balance')
      .maybeSingle();

    if (balanceError) {
      console.error(
        'Balance update error:',
        balanceError.message
      );

      throw new Error(
        'Unable to update wallet balance'
      );
    }

    if (!updatedProfile) {
      return res.status(409).json({
        success: false,
        message:
          'Wallet balance changed. Please try again.',
      });
    }

    deducted = true;

    let cashbackPercent = 0;

    const { data: settings } =
      await supabaseAdmin
        .from('cashback_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

    if (settings?.is_enabled) {
      const { data: productData } =
        await supabaseAdmin
          .from('products')
          .select('cashback_percent')
          .eq('service', service)
          .eq('name', product)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

      const productPercent = asNumber(
        productData?.cashback_percent
      );

      if (productPercent > 0) {
        cashbackPercent = productPercent;
      } else {
        const settingKey =
          SERVICE_PERCENT_KEY[service];

        cashbackPercent = asNumber(
          settingKey
            ? settings[settingKey]
            : 0
        );
      }
    }

    const cashbackEarned =
      Math.round(
        ((purchaseAmount *
          cashbackPercent) /
          100) *
          100
      ) / 100;

    const reference =
      `GYD-${crypto
        .randomBytes(8)
        .toString('hex')
        .toUpperCase()}`;

    const finalMetadata = {
      ...(metadata || {}),
      ...(providerResult
        ? {
            provider: 'clubkonnect',
            provider_request_id:
              providerResult.requestId,
            provider_reference:
              providerReference(
                providerResult.response
              ),
            provider_product_code:
              providerResult.providerPlan
                ?.PRODUCT_CODE,
            provider_product_id:
              providerResult.providerPlan
                ?.PRODUCT_ID,
            provider_product_name:
              providerResult.providerPlan
                ?.PRODUCT_NAME,
          }
        : {}),
    };

    const {
      data: transaction,
      error: transactionError,
    } = await supabaseAdmin
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
        metadata: finalMetadata,
      })
      .select()
      .single();

    if (transactionError) {
      throw transactionError;
    }

    if (cashbackEarned > 0) {
      const oldCashback = asNumber(
        profile.cashback_balance
      );

      const newCashback =
        Math.round(
          (oldCashback + cashbackEarned) *
            100
        ) / 100;

      const {
        error: cashbackBalanceError,
      } = await supabaseAdmin
        .from('profiles')
        .update({
          cashback_balance: newCashback,
          updated_at:
            new Date().toISOString(),
        })
        .eq('phone', profile.phone);

      if (cashbackBalanceError) {
        throw cashbackBalanceError;
      }

      const {
        error: cashbackLogError,
      } = await supabaseAdmin
        .from('cashback_transactions')
        .insert({
          user_phone: profile.phone,
          transaction_id: transaction.id,
          transaction_reference:
            transaction.reference,
          service,
          product,
          transaction_amount:
            purchaseAmount,
          cashback_percent:
            cashbackPercent,
          cashback_amount:
            cashbackEarned,
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
      provider: providerResult
        ? {
            name: 'ClubKonnect',
            requestId:
              providerResult.requestId,
            reference:
              providerReference(
                providerResult.response
              ),
          }
        : null,
    });
  } catch (error) {
    console.error(
      'Purchase error:',
      error
    );

    if (deducted) {
      try {
        const currentAmount =
          asNumber(req.body.amount);

        const {
          data: currentProfile,
        } = await supabaseAdmin
          .from('profiles')
          .select('wallet_balance')
          .eq(
            'phone',
            String(req.body.phone)
          )
          .maybeSingle();

        if (currentProfile) {
          await supabaseAdmin
            .from('profiles')
            .update({
              wallet_balance:
                asNumber(
                  currentProfile.wallet_balance
                ) + currentAmount,
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              'phone',
              String(req.body.phone)
            );
        }
      } catch (refundError) {
        console.error(
          'Wallet refund error:',
          refundError
        );
      }
    }

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Purchase failed. Please try again.',
    });
  }
};
