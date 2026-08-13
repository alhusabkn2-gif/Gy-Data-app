const axios = require('axios');
const { supabaseAdmin } = require('../services/supabaseService');

const CLUBKONNECT_BASE_URL =
  process.env.CLUBKONNECT_BASE_URL ||
  'https://www.nellobytesystems.com';

const CLUBKONNECT_USER_ID =
  process.env.CLUBKONNECT_USER_ID ||
  '';

const CLUBKONNECT_API_KEY =
  process.env.CLUBKONNECT_API_KEY ||
  '';

const NETWORK_CODES = {
  MTN: '01',
  GLO: '02',
  AIRTEL: '04',
  '9MOBILE': '03',
  ETISALAT: '03',
};

function normalizeNetwork(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');

  if (digits.startsWith('234') && digits.length === 13) {
    return `0${digits.slice(3)}`;
  }

  if (digits.length === 10) {
    return `0${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return digits;
  }

  return digits;
}

function isValidNigerianPhone(phone) {
  return /^0[789][01]\d{8}$/.test(phone);
}

function makeRequestId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase();

  return `GYD-${timestamp}-${random}`;
}

function getCallbackUrl(req) {
  if (process.env.CLUBKONNECT_CALLBACK_URL) {
    return process.env.CLUBKONNECT_CALLBACK_URL;
  }

  const protocol =
    req.headers['x-forwarded-proto'] ||
    req.protocol ||
    'https';

  const host =
    req.headers['x-forwarded-host'] ||
    req.get('host');

  if (!host) {
    return '';
  }

  return `${protocol}://${host}/api/purchase/clubkonnect/callback`;
}

async function getCustomer(phone) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(
      'id, phone, purchase_pin, wallet_balance, cashback_balance'
    )
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Customer lookup failed: ${error.message}`
    );
  }

  return data;
}

async function getProduct(productId) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('service', 'data')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Product lookup failed: ${error.message}`
    );
  }

  return data;
}

async function debitWalletAndCreateTransaction({
  phone,
  product,
  recipient,
  network,
  requestId,
}) {
  const { data, error } = await supabaseAdmin.rpc(
    'create_data_purchase',
    {
      p_phone: phone,
      p_product_id: product.id,
      p_recipient: recipient,
      p_network: network,
      p_request_id: requestId,
    }
  );

  if (error) {
    throw new Error(
      error.message || 'Unable to reserve wallet balance'
    );
  }

  if (!data || data.success !== true) {
    throw new Error(
      data?.message ||
        'Unable to reserve wallet balance'
    );
  }

  return data;
}

async function updateTransactionStatus({
  transactionId,
  status,
  metadata,
}) {
  const update = {
    status,
    metadata,
  };

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .update(update)
    .eq('id', transactionId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Transaction update failed: ${error.message}`
    );
  }

  return data;
}

async function refundFailedPurchase({
  transactionId,
  phone,
  reason,
  clubkonnectStatus,
}) {
  const { data, error } = await supabaseAdmin.rpc(
    'refund_failed_data_purchase',
    {
      p_transaction_id: transactionId,
      p_phone: phone,
      p_reason: reason || 'ClubKonnect purchase failed',
      p_provider_status: clubkonnectStatus || null,
    }
  );

  if (error) {
    throw new Error(
      error.message || 'Failed to refund purchase'
    );
  }

  if (!data || data.success !== true) {
    throw new Error(
      data?.message || 'Failed to refund purchase'
    );
  }

  return data;
}

function isCompletedStatus(status) {
  return String(status || '')
    .trim()
    .toUpperCase() === 'ORDER_COMPLETED';
}

function isReceivedStatus(status) {
  return String(status || '')
    .trim()
    .toUpperCase() === 'ORDER_RECEIVED';
}

function isFailedStatus(status) {
  const value = String(status || '')
    .trim()
    .toUpperCase();

  return [
    'FAILED',
    'ORDER_FAILED',
    'TRANSACTION_FAILED',
    'INVALID_CREDENTIALS',
    'MISSING_CREDENTIALS',
    'MISSING_USERID',
    'MISSING_APIKEY',
    'MISSING_MOBILENETWORK',
    'MISSING_DATAPLAN',
    'INVALID_DATAPLAN',
    'INVALID_RECIPIENT',
    'INSUFFICIENT_BALANCE',
    'ERROR',
  ].includes(value);
}

async function callClubKonnect({
  networkCode,
  dataPlan,
  recipient,
  requestId,
  callbackUrl,
}) {
  if (!CLUBKONNECT_USER_ID) {
    throw new Error(
      'CLUBKONNECT_USER_ID is not configured'
    );
  }

  if (!CLUBKONNECT_API_KEY) {
    throw new Error(
      'CLUBKONNECT_API_KEY is not configured'
    );
  }

  const url = `${CLUBKONNECT_BASE_URL}/APIDatabundleV1.asp`;

  const params = {
    UserID: CLUBKONNECT_USER_ID,
    APIKey: CLUBKONNECT_API_KEY,
    MobileNetwork: networkCode,
    DataPlan: dataPlan,
    MobileNumber: recipient,
    RequestID: requestId,
  };

  if (callbackUrl) {
    params.CallBackURL = callbackUrl;
  }

  const response = await axios.get(url, {
    params,
    timeout: 30000,
    validateStatus: () => true,
  });

  let body = response.data;

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {
        raw: body,
      };
    }
  }

  return {
    httpStatus: response.status,
    body,
    status:
      body?.status ||
      body?.Status ||
      body?.message ||
      body?.Message ||
      '',
  };
}

exports.purchase = async (req, res) => {
  let reservedTransaction = null;

  try {
    const {
      phone,
      product_id,
      productId,
      recipient,
      network,
      purchase_pin,
      purchasePin,
    } = req.body || {};

    const customerPhone = String(phone || '').trim();

    const selectedProductId =
      product_id || productId;

    const selectedNetwork =
      normalizeNetwork(network);

    const normalizedRecipient =
      normalizePhone(recipient);

    const enteredPin =
      String(
        purchase_pin || purchasePin || ''
      ).trim();

    if (!customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Customer phone is required',
      });
    }

    if (!selectedProductId) {
      return res.status(400).json({
        success: false,
        message: 'Data product is required',
      });
    }

    if (!selectedNetwork) {
      return res.status(400).json({
        success: false,
        message: 'Network is required',
      });
    }

    if (!NETWORK_CODES[selectedNetwork]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid network',
      });
    }

    if (!isValidNigerianPhone(normalizedRecipient)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Nigerian recipient phone number',
      });
    }

    if (!/^\d{4}$/.test(enteredPin)) {
      return res.status(400).json({
        success: false,
        message: 'Purchase PIN must be 4 digits',
      });
    }

    const customer =
      await getCustomer(customerPhone);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer account not found',
      });
    }

    if (
      String(customer.purchase_pin) !==
      enteredPin
    ) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect purchase PIN',
      });
    }

    const product =
      await getProduct(selectedProductId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Selected data plan is not available',
      });
    }

    const productNetwork =
      normalizeNetwork(product.network);

    if (
      productNetwork &&
      productNetwork !== selectedNetwork
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Selected data plan does not belong to this network',
      });
    }

    /*
     * IMPORTANT:
     *
     * The price below comes ONLY from products.price.
     * We intentionally ignore any amount sent by the customer.
     */
    const sellingPrice = Number(product.price);

    if (
      !Number.isFinite(sellingPrice) ||
      sellingPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'This data plan does not have a valid selling price',
      });
    }

    const requestId = makeRequestId();

    /*
     * Atomic operation:
     *
     * 1. Lock customer wallet.
     * 2. Verify sufficient balance.
     * 3. Debit wallet.
     * 4. Create PENDING transaction.
     *
     * All happen inside PostgreSQL.
     */
    const reservation =
      await debitWalletAndCreateTransaction({
        phone: customerPhone,
        product,
        recipient: normalizedRecipient,
        network: selectedNetwork,
        requestId,
      });

    reservedTransaction = reservation;

    const callbackUrl =
      getCallbackUrl(req);

    let providerResult;

    try {
      providerResult =
        await callClubKonnect({
          networkCode:
            NETWORK_CODES[selectedNetwork],
          dataPlan: product.name,
          recipient: normalizedRecipient,
          requestId,
          callbackUrl,
        });
    } catch (providerError) {
      console.error(
        'ClubKonnect request error:',
        providerError.message
      );

      const refund =
        await refundFailedPurchase({
          transactionId:
            reservation.transaction_id,
          phone: customerPhone,
          reason:
            'ClubKonnect request failed before a provider response was received',
          clubkonnectStatus:
            'REQUEST_ERROR',
        });

      return res.status(502).json({
        success: false,
        message:
          'Data purchase failed. Your wallet has been refunded.',
        refunded: true,
        transaction: refund.transaction,
        newBalance:
          refund.new_wallet_balance,
      });
    }

    const providerStatus =
      String(
        providerResult.status || ''
      )
        .trim()
        .toUpperCase();

    const providerMetadata = {
      provider: 'ClubKonnect',
      request_id: requestId,
      provider_status: providerStatus,
      provider_response:
        providerResult.body,
      http_status:
        providerResult.httpStatus,
      product_id: product.id,
      product_name: product.name,
      selling_price: sellingPrice,
      network: selectedNetwork,
      network_code:
        NETWORK_CODES[selectedNetwork],
      recipient: normalizedRecipient,
    };

    /*
     * ClubKonnect has accepted the order.
     *
     * This is NOT final success.
     */
    if (isReceivedStatus(providerStatus)) {
      const transaction =
        await updateTransactionStatus({
          transactionId:
            reservation.transaction_id,
          status: 'pending',
          metadata: providerMetadata,
        });

      return res.status(202).json({
        success: true,
        pending: true,
        message:
          'Data purchase request received and is pending confirmation.',
        transaction,
        prevBalance:
          reservation.previous_balance,
        newBalance:
          reservation.new_balance,
        providerStatus,
      });
    }

    /*
     * Some provider responses may already report completion.
     */
    if (isCompletedStatus(providerStatus)) {
      const transaction =
        await updateTransactionStatus({
          transactionId:
            reservation.transaction_id,
          status: 'success',
          metadata: providerMetadata,
        });

      return res.json({
        success: true,
        pending: false,
        message:
          'Data purchase completed successfully.',
        transaction,
        prevBalance:
          reservation.previous_balance,
        newBalance:
          reservation.new_balance,
        cashbackEarned: 0,
        providerStatus,
      });
    }

    /*
     * Provider explicitly rejected/failed the order.
     *
     * Refund atomically.
     */
    if (isFailedStatus(providerStatus)) {
      const refund =
        await refundFailedPurchase({
          transactionId:
            reservation.transaction_id,
          phone: customerPhone,
          reason:
            'ClubKonnect rejected the data purchase',
          clubkonnectStatus:
            providerStatus,
        });

      return res.status(400).json({
        success: false,
        message:
          'Data purchase failed. Your wallet has been refunded.',
        refunded: true,
        transaction: refund.transaction,
        newBalance:
          refund.new_wallet_balance,
        providerStatus,
      });
    }

    /*
     * Unknown provider response:
     *
     * Do NOT refund automatically because we do not know
     * whether ClubKonnect accepted the order.
     *
     * Keep it PENDING for query/callback confirmation.
     */
    const transaction =
      await updateTransactionStatus({
        transactionId:
          reservation.transaction_id,
        status: 'pending',
        metadata: providerMetadata,
      });

    return res.status(202).json({
      success: true,
      pending: true,
      message:
        'Data purchase is pending provider confirmation.',
      transaction,
      prevBalance:
        reservation.previous_balance,
      newBalance:
        reservation.new_balance,
      providerStatus:
        providerStatus || 'UNKNOWN',
    });
  } catch (error) {
    console.error(
      'Data purchase error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Data purchase failed',
    });
  }
};


/*
 * ClubKonnect callback.
 *
 * ClubKonnect can notify this endpoint after the order
 * changes from ORDER_RECEIVED to its final status.
 */
exports.clubKonnectCallback = async (
  req,
  res
) => {
  try {
    const payload =
      req.body || {};

    const requestId =
      payload.RequestID ||
      payload.requestId ||
      payload.REQUESTID ||
      payload.reference ||
      payload.Reference;

    const status =
      payload.status ||
      payload.Status ||
      payload.STATUS ||
      '';

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message:
          'RequestID is required',
      });
    }

    const { data: transaction, error } =
      await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('metadata->>request_id', requestId)
        .maybeSingle();

    if (error) {
      console.error(
        'Callback transaction lookup error:',
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to find purchase transaction',
      });
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message:
          'Purchase transaction not found',
      });
    }

    const normalizedStatus =
      String(status)
        .trim()
        .toUpperCase();

    const metadata = {
      ...(transaction.metadata || {}),
      callback_received_at:
        new Date().toISOString(),
      callback_payload:
        payload,
      provider_status:
        normalizedStatus,
    };

    if (
      transaction.status ===
        'success' ||
      transaction.status ===
        'failed'
    ) {
      return res.json({
        success: true,
        message:
          'Transaction already finalized',
      });
    }

    if (
      isCompletedStatus(
        normalizedStatus
      )
    ) {
      await supabaseAdmin
        .from('transactions')
        .update({
          status: 'success',
          metadata,
        })
        .eq('id', transaction.id);

      return res.json({
        success: true,
        status: 'success',
      });
    }

    if (
      isFailedStatus(
        normalizedStatus
      )
    ) {
      const refund =
        await refundFailedPurchase({
          transactionId:
            transaction.id,
          phone: transaction.phone,
          reason:
            'ClubKonnect callback reported purchase failure',
          clubkonnectStatus:
            normalizedStatus,
        });

      return res.json({
        success: true,
        status: 'failed',
        refunded: true,
        transaction:
          refund.transaction,
      });
    }

    await supabaseAdmin
      .from('transactions')
      .update({
        status: 'pending',
        metadata,
      })
      .eq('id', transaction.id);

    return res.json({
      success: true,
      status: 'pending',
    });
  } catch (error) {
    console.error(
      'ClubKonnect callback error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Callback processing failed',
    });
  }
};
