const axios = require('axios');
const { supabaseAdmin } = require('../services/supabaseService');

const CLUBKONNECT_BASE_URL =
  process.env.CLUBKONNECT_BASE_URL ||
  'https://www.nellobytesystems.com';

const CLUBKONNECT_USER_ID =
  process.env.CLUBKONNECT_USER_ID || '';

const CLUBKONNECT_API_KEY =
  process.env.CLUBKONNECT_API_KEY || '';

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
    .replace(/[\s_-]+/g, '');
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');

  if (digits.startsWith('234') && digits.length === 13) {
    return `0${digits.slice(3)}`;
  }

  if (digits.length === 10) {
    return `0${digits}`;
  }

  return digits;
}

function isValidNigerianPhone(phone) {
  return /^0[789][01]\d{8}$/.test(phone);
}

function makeRequestId() {
  return `GYD-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase()}`;
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

  if (!host) return '';

  return `${protocol}://${host}/api/purchase/clubkonnect/callback`;
}

async function getCustomer(phone) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, phone, purchase_pin, wallet_balance')
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    throw new Error(`Customer lookup failed: ${error.message}`);
  }

  return data;
}

async function getProduct(productId) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Product lookup failed: ${error.message}`);
  }

  return data;
}

function getProviderPlanCode(product) {
  return String(
    product.provider_plan_code ||
      product.provider_code ||
      product.clubkonnect_plan ||
      product.plan_code ||
      product.dataplan ||
      product.data_plan ||
      ''
  ).trim();
}

function getSellingPrice(product) {
  return Number(
    product.selling_price ??
      product.price ??
      product.customer_price
  );
}

async function reserveWallet({
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
    throw new Error(error.message);
  }

  if (!data || data.success !== true) {
    throw new Error(
      data?.message || 'Unable to debit wallet'
    );
  }

  return data;
}

async function refundPurchase({
  transactionId,
  phone,
  reason,
  providerStatus,
}) {
  const { data, error } = await supabaseAdmin.rpc(
    'refund_failed_data_purchase',
    {
      p_transaction_id: transactionId,
      p_phone: phone,
      p_reason: reason,
      p_provider_status: providerStatus || null,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.success !== true) {
    throw new Error(
      data?.message || 'Unable to refund purchase'
    );
  }

  return data;
}

async function updateTransaction(
  transactionId,
  status,
  metadata
) {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .update({
      status,
      metadata,
    })
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

function getProviderStatus(body) {
  if (!body) return '';

  if (typeof body === 'string') {
    return body.trim();
  }

  return String(
    body.status ||
      body.Status ||
      body.STATUS ||
      body.message ||
      body.Message ||
      body.result ||
      body.Result ||
      ''
  ).trim();
}

function isSuccess(status) {
  return (
    String(status).trim().toUpperCase() ===
    'ORDER_COMPLETED'
  );
}

function isPending(status) {
  return (
    String(status).trim().toUpperCase() ===
    'ORDER_RECEIVED'
  );
}

function isFailed(status) {
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
    'FAILURE',
    'REJECTED',
  ].includes(
    String(status).trim().toUpperCase()
  );
}

async function callClubKonnect({
  network,
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

  if (!dataPlan) {
    throw new Error(
      'ClubKonnect plan code is missing for this product'
    );
  }

  const params = {
    UserID: CLUBKONNECT_USER_ID,
    APIKey: CLUBKONNECT_API_KEY,
    MobileNetwork: NETWORK_CODES[network],
    DataPlan: dataPlan,
    MobileNumber: recipient,
    RequestID: requestId,
  };

  if (callbackUrl) {
    params.CallBackURL = callbackUrl;
  }

  const response = await axios.get(
    `${CLUBKONNECT_BASE_URL}/APIDatabundleV1.asp`,
    {
      params,
      timeout: 30000,
      validateStatus: () => true,
    }
  );

  let body = response.data;

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = body.trim();
    }
  }

  return {
    httpStatus: response.status,
    body,
    status: getProviderStatus(body),
  };
}

async function queryClubKonnect(requestId) {
  const response = await axios.get(
    `${CLUBKONNECT_BASE_URL}/APIQueryV1.asp`,
    {
      params: {
        UserID: CLUBKONNECT_USER_ID,
        APIKey: CLUBKONNECT_API_KEY,
        RequestID: requestId,
      },
      timeout: 30000,
      validateStatus: () => true,
    }
  );

  let body = response.data;

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = body.trim();
    }
  }

  return {
    httpStatus: response.status,
    body,
    status: getProviderStatus(body),
  };
}

async function findTransaction(requestId) {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('metadata->>request_id', requestId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function processFinalStatus({
  transaction,
  status,
  body,
  source,
}) {
  const normalizedStatus =
    String(status || '').trim().toUpperCase();

  const metadata = {
    ...(transaction.metadata || {}),
    provider: 'ClubKonnect',
    provider_status: normalizedStatus,
    provider_response: body,
    status_source: source,
    status_checked_at: new Date().toISOString(),
  };

  if (
    transaction.status === 'success' ||
    transaction.status === 'failed'
  ) {
    return {
      status: transaction.status,
      transaction,
      final: true,
    };
  }

  if (isSuccess(normalizedStatus)) {
    const updated = await updateTransaction(
      transaction.id,
      'success',
      metadata
    );

    return {
      status: 'success',
      transaction: updated,
      final: true,
    };
  }

  if (isFailed(normalizedStatus)) {
    const refund = await refundPurchase({
      transactionId: transaction.id,
      phone: transaction.phone,
      reason: 'ClubKonnect reported purchase failure',
      providerStatus: normalizedStatus,
    });

    return {
      status: 'failed',
      transaction: refund.transaction,
      refunded: true,
      newBalance: refund.new_wallet_balance,
      final: true,
    };
  }

  const updated = await updateTransaction(
    transaction.id,
    'pending',
    metadata
  );

  return {
    status: 'pending',
    transaction: updated,
    final: false,
  };
}


/*
===========================================================
CUSTOMER DATA PURCHASE
POST /api/purchase
===========================================================
*/
exports.purchase = async (req, res) => {
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

    const customerPhone =
      String(phone || '').trim();

    const selectedProductId =
      product_id || productId;

    const selectedNetwork =
      normalizeNetwork(network);

    const recipientPhone =
      normalizePhone(recipient);

    const pin =
      String(
        purchase_pin ||
          purchasePin ||
          ''
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
        message: 'Data plan is required',
      });
    }

    if (!NETWORK_CODES[selectedNetwork]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid network',
      });
    }

    if (!isValidNigerianPhone(recipientPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Nigerian recipient phone number',
      });
    }

    if (!/^\d{4}$/.test(pin)) {
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

    if (String(customer.purchase_pin) !== pin) {
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
      normalizeNetwork(
        product.network ||
          product.network_name ||
          product.category
      );

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

    const sellingPrice =
      getSellingPrice(product);

    if (
      !Number.isFinite(sellingPrice) ||
      sellingPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'This data plan has an invalid selling price',
      });
    }

    const providerPlanCode =
      getProviderPlanCode(product);

    if (!providerPlanCode) {
      return res.status(400).json({
        success: false,
        message:
          'This data plan has no ClubKonnect plan code',
      });
    }

    const requestId =
      makeRequestId();

    /*
     * PostgreSQL RPC:
     * debit wallet + create pending transaction atomically.
     */
    const reservation =
      await reserveWallet({
        phone: customerPhone,
        product,
        recipient: recipientPhone,
        network: selectedNetwork,
        requestId,
      });

    const callbackUrl =
      getCallbackUrl(req);

    let provider;

    try {
      provider =
        await callClubKonnect({
          network: selectedNetwork,
          dataPlan: providerPlanCode,
          recipient: recipientPhone,
          requestId,
          callbackUrl,
        });
    } catch (providerError) {
      console.error(
        'ClubKonnect request error:',
        providerError.message
      );

      try {
        const refund =
          await refundPurchase({
            transactionId:
              reservation.transaction_id,
            phone: customerPhone,
            reason:
              'ClubKonnect request failed before provider response',
            providerStatus:
              'REQUEST_ERROR',
          });

        return res.status(502).json({
          success: false,
          message:
            'Data purchase failed. Your wallet has been refunded.',
          refunded: true,
          transaction:
            refund.transaction,
          newBalance:
            refund.new_wallet_balance,
        });
      } catch (refundError) {
        console.error(
          'Refund error:',
          refundError.message
        );

        return res.status(500).json({
          success: false,
          message:
            'Purchase failed and automatic refund needs admin attention.',
          transactionId:
            reservation.transaction_id,
        });
      }
    }

    const providerStatus =
      String(provider.status || '')
        .trim()
        .toUpperCase();

    const metadata = {
      provider: 'ClubKonnect',
      request_id: requestId,
      provider_status: providerStatus,
      provider_response: provider.body,
      http_status: provider.httpStatus,
      product_id: product.id,
      product_name: product.name,
      provider_plan_code: providerPlanCode,
      selling_price: sellingPrice,
      network: selectedNetwork,
      network_code:
        NETWORK_CODES[selectedNetwork],
      recipient: recipientPhone,
    };

    /*
     * ORDER_RECEIVED is NOT success.
     */
    if (isPending(providerStatus)) {
      const transaction =
        await updateTransaction(
          reservation.transaction_id,
          'pending',
          metadata
        );

      return res.status(202).json({
        success: true,
        pending: true,
        message:
          'Data purchase received and is pending confirmation.',
        transaction,
        requestId,
        newBalance:
          reservation.new_balance,
        providerStatus,
      });
    }

    /*
     * Immediate success.
     */
    if (isSuccess(providerStatus)) {
      const transaction =
        await updateTransaction(
          reservation.transaction_id,
          'success',
          metadata
        );

      return res.json({
        success: true,
        pending: false,
        message:
          'Data purchase completed successfully.',
        transaction,
        requestId,
        newBalance:
          reservation.new_balance,
        providerStatus,
      });
    }

    /*
     * Immediate failure => refund.
     */
    if (isFailed(providerStatus)) {
      try {
        const refund =
          await refundPurchase({
            transactionId:
              reservation.transaction_id,
            phone: customerPhone,
            reason:
              'ClubKonnect rejected the data purchase',
            providerStatus,
          });

        return res.status(400).json({
          success: false,
          message:
            'Data purchase failed. Your wallet has been refunded.',
          refunded: true,
          transaction:
            refund.transaction,
          newBalance:
            refund.new_wallet_balance,
          providerStatus,
        });
      } catch (refundError) {
        console.error(
          'Refund error:',
          refundError.message
        );

        return res.status(500).json({
          success: false,
          message:
            'Purchase failed but automatic refund needs admin attention.',
          transactionId:
            reservation.transaction_id,
        });
      }
    }

    /*
     * Unknown provider response:
     * keep transaction pending.
     */
    const transaction =
      await updateTransaction(
        reservation.transaction_id,
        'pending',
        metadata
      );

    return res.status(202).json({
      success: true,
      pending: true,
      message:
        'Data purchase is pending provider confirmation.',
      transaction,
      requestId,
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
===========================================================
CLUBKONNECT CALLBACK
POST /api/purchase/clubkonnect/callback
===========================================================
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
      payload.request_id ||
      payload.reference ||
      payload.Reference;

    const status =
      getProviderStatus(payload);

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'RequestID is required',
      });
    }

    const transaction =
      await findTransaction(requestId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message:
          'Purchase transaction not found',
      });
    }

    const result =
      await processFinalStatus({
        transaction,
        status,
        body: payload,
        source: 'callback',
      });

    return res.json({
      success: true,
      status: result.status,
      pending: !result.final,
      refunded:
        result.refunded || false,
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


/*
===========================================================
QUERY PURCHASE
GET/POST /api/purchase/query
===========================================================
*/
exports.queryPurchase = async (
  req,
  res
) => {
  try {
    const source =
      req.method === 'GET'
        ? req.query
        : req.body || {};

    const transactionId =
      source.transaction_id ||
      source.transactionId;

    const requestId =
      source.request_id ||
      source.requestId;

    let transaction = null;

    if (transactionId) {
      const { data, error } =
        await supabaseAdmin
          .from('transactions')
          .select('*')
          .eq('id', transactionId)
          .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      transaction = data;
    } else if (requestId) {
      transaction =
        await findTransaction(
          requestId
        );
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message:
          'Purchase transaction not found',
      });
    }

    if (
      transaction.status === 'success' ||
      transaction.status === 'failed'
    ) {
      return res.json({
        success: true,
        pending: false,
        status:
          transaction.status,
        transaction,
      });
    }

    const storedRequestId =
      transaction.metadata?.request_id;

    if (!storedRequestId) {
      return res.status(400).json({
        success: false,
        message:
          'Purchase RequestID is missing',
      });
    }

    const provider =
      await queryClubKonnect(
        storedRequestId
      );

    const result =
      await processFinalStatus({
        transaction,
        status: provider.status,
        body: provider.body,
        source: 'query',
      });

    return res.json({
      success: true,
      pending: !result.final,
      status: result.status,
      refunded:
        result.refunded || false,
      transaction:
        result.transaction,
      newBalance:
        result.newBalance,
    });
  } catch (error) {
    console.error(
      'Purchase query error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Unable to query purchase status',
    });
  }
};


/*
===========================================================
CUSTOMER PURCHASE HISTORY
GET /api/purchase/history?phone=080...
===========================================================
*/
exports.history = async (
  req,
  res
) => {
  try {
    const phone =
      String(
        req.query.phone ||
          req.body?.phone ||
          ''
      ).trim();

    if (!phone) {
      return res.status(400).json({
        success: false,
        message:
          'Customer phone is required',
      });
    }

    const { data, error } =
      await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('phone', phone)
        .eq('service', 'data')
        .order(
          'created_at',
          {
            ascending: false,
          }
        )
        .limit(100);

    if (error) {
      throw new Error(error.message);
    }

    return res.json({
      success: true,
      transactions: data || [],
    });
  } catch (error) {
    console.error(
      'Purchase history error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Unable to load purchase history',
    });
  }
};
