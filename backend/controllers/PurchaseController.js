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
    .select(
      'id, phone, purchase_pin, wallet_balance, cashback_balance'
    )
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

/*
 * =========================================================
 * CASHBACK
 * =========================================================
 *
 * cashback_amount has priority.
 *
 * Example:
 *
 * selling price = 600
 * cashback_amount = 150
 *
 * Customer wallet:
 *   -600
 *
 * Customer cashback:
 *   +150
 *
 * If cashback_amount = 0 but cashback_percent = 25:
 *
 * 600 x 25% = 150
 *
 * Cashback is only credited after SUCCESS.
 */
function calculateCashback(product, sellingPrice) {
  const fixedCashback = Number(
    product.cashback_amount
  );

  const cashbackPercent = Number(
    product.cashback_percent
  );

  if (
    Number.isFinite(fixedCashback) &&
    fixedCashback > 0
  ) {
    return Math.min(
      fixedCashback,
      sellingPrice
    );
  }

  if (
    Number.isFinite(cashbackPercent) &&
    cashbackPercent > 0
  ) {
    return Math.min(
      sellingPrice * cashbackPercent / 100,
      sellingPrice
    );
  }

  return 0;
}


/*
 * Credit cashback once.
 *
 * The transaction metadata contains:
 * cashback_credited: true
 *
 * so callback/query cannot intentionally credit the
 * same transaction twice.
 */
async function creditCashback({
  transaction,
  product,
  sellingPrice,
}) {
  const existingMetadata =
    transaction.metadata || {};

  if (
    existingMetadata.cashback_credited === true
  ) {
    return {
      credited: false,
      amount: Number(
        existingMetadata.cashback_amount || 0
      ),
      alreadyCredited: true,
    };
  }

  const cashback =
    calculateCashback(
      product,
      sellingPrice
    );

  if (cashback <= 0) {
    return {
      credited: false,
      amount: 0,
      alreadyCredited: false,
    };
  }

  const customer =
    await getCustomer(
      transaction.phone
    );

  if (!customer) {
    throw new Error(
      'Customer account not found while crediting cashback'
    );
  }

  const oldCashbackBalance =
    Number(
      customer.cashback_balance || 0
    );

  const newCashbackBalance =
    oldCashbackBalance + cashback;

  const updatedMetadata = {
    ...existingMetadata,
    cashback_credited: true,
    cashback_amount: cashback,
    cashback_percent:
      Number(
        product.cashback_percent || 0
      ),
    cashback_previous_balance:
      oldCashbackBalance,
    cashback_new_balance:
      newCashbackBalance,
    cashback_credited_at:
      new Date().toISOString(),
  };

  const { data: updatedProfile, error } =
    await supabaseAdmin
      .from('profiles')
      .update({
        cashback_balance:
          newCashbackBalance,
      })
      .eq('id', customer.id)
      .select(
        'id, phone, wallet_balance, cashback_balance'
      )
      .single();

  if (error) {
    throw new Error(
      `Cashback credit failed: ${error.message}`
    );
  }

  const { data: updatedTransaction, error: txError } =
    await supabaseAdmin
      .from('transactions')
      .update({
        metadata: updatedMetadata,
      })
      .eq('id', transaction.id)
      .select()
      .single();

  if (txError) {
    throw new Error(
      `Cashback transaction update failed: ${txError.message}`
    );
  }

  return {
    credited: true,
    amount: cashback,
    previousBalance:
      oldCashbackBalance,
    newBalance:
      Number(
        updatedProfile.cashback_balance
      ),
    transaction:
      updatedTransaction,
  };
}


/*
 * Make transaction SUCCESS and then apply cashback.
 */
async function finalizeSuccessfulPurchase({
  transaction,
  providerBody,
  providerStatus,
  source,
}) {
  const productId =
    transaction.metadata?.product_id;

  if (!productId) {
    throw new Error(
      'Product ID missing from transaction metadata'
    );
  }

  const product =
    await getProduct(productId);

  if (!product) {
    throw new Error(
      'Product attached to transaction was not found'
    );
  }

  const sellingPrice =
    getSellingPrice(product);

  const metadata = {
    ...(transaction.metadata || {}),
    provider: 'ClubKonnect',
    provider_status: providerStatus,
    provider_response: providerBody,
    status_source: source,
    status_checked_at:
      new Date().toISOString(),
    selling_price: sellingPrice,
  };

  const { data: successTransaction, error } =
    await supabaseAdmin
      .from('transactions')
      .update({
        status: 'success',
        metadata,
      })
      .eq('id', transaction.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle();

  if (error) {
    throw new Error(
      `Transaction success update failed: ${error.message}`
    );
  }

  /*
   * If another callback/query already finalized it,
   * don't credit again.
   */
  if (!successTransaction) {
    const { data: existing } =
      await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('id', transaction.id)
        .maybeSingle();

    return {
      status:
        existing?.status || 'success',
      transaction:
        existing || transaction,
      cashback: {
        credited: false,
        amount: 0,
        alreadyCredited: true,
      },
      final: true,
    };
  }

  const cashback =
    await creditCashback({
      transaction:
        successTransaction,
      product,
      sellingPrice,
    });

  const finalTransaction =
    cashback.transaction ||
    successTransaction;

  return {
    status: 'success',
    transaction:
      finalTransaction,
    cashback,
    final: true,
  };
}


/*
 * =========================================================
 * WALLET RESERVATION
 * =========================================================
 */
async function reserveWallet({
  phone,
  product,
  recipient,
  network,
  requestId,
}) {
  const { data, error } =
    await supabaseAdmin.rpc(
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
      data?.message ||
        'Unable to debit wallet'
    );
  }

  return data;
}


/*
 * =========================================================
 * REFUND
 * =========================================================
 */
async function refundPurchase({
  transactionId,
  phone,
  reason,
  providerStatus,
}) {
  const { data, error } =
    await supabaseAdmin.rpc(
      'refund_failed_data_purchase',
      {
        p_transaction_id:
          transactionId,
        p_phone: phone,
        p_reason: reason,
        p_provider_status:
          providerStatus || null,
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.success !== true) {
    throw new Error(
      data?.message ||
        'Unable to refund purchase'
    );
  }

  return data;
}


/*
 * =========================================================
 * PROVIDER STATUS
 * =========================================================
 */
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
    String(status)
      .trim()
      .toUpperCase() ===
    'ORDER_COMPLETED'
  );
}

function isPending(status) {
  return (
    String(status)
      .trim()
      .toUpperCase() ===
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
    String(status)
      .trim()
      .toUpperCase()
  );
}


/*
 * =========================================================
 * CLUBKONNECT REQUEST
 * =========================================================
 */
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
    UserID:
      CLUBKONNECT_USER_ID,
    APIKey:
      CLUBKONNECT_API_KEY,
    MobileNetwork:
      NETWORK_CODES[network],
    DataPlan:
      dataPlan,
    MobileNumber:
      recipient,
    RequestID:
      requestId,
  };

  if (callbackUrl) {
    params.CallBackURL =
      callbackUrl;
  }

  const response =
    await axios.get(
      `${CLUBKONNECT_BASE_URL}/APIDatabundleV1.asp`,
      {
        params,
        timeout: 30000,
        validateStatus:
          () => true,
      }
    );

  let body =
    response.data;

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = body.trim();
    }
  }

  return {
    httpStatus:
      response.status,
    body,
    status:
      getProviderStatus(body),
  };
}


/*
 * =========================================================
 * QUERY CLUBKONNECT
 * =========================================================
 */
async function queryClubKonnect(
  requestId
) {
  const response =
    await axios.get(
      `${CLUBKONNECT_BASE_URL}/APIQueryV1.asp`,
      {
        params: {
          UserID:
            CLUBKONNECT_USER_ID,
          APIKey:
            CLUBKONNECT_API_KEY,
          RequestID:
            requestId,
        },
        timeout: 30000,
        validateStatus:
          () => true,
      }
    );

  let body =
    response.data;

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = body.trim();
    }
  }

  return {
    httpStatus:
      response.status,
    body,
    status:
      getProviderStatus(body),
  };
}


/*
 * =========================================================
 * FIND TRANSACTION
 * =========================================================
 */
async function findTransaction(
  requestId
) {
  const { data, error } =
    await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq(
        'metadata->>request_id',
        requestId
      )
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


/*
 * =========================================================
 * FINAL STATUS PROCESSOR
 * =========================================================
 */
async function processFinalStatus({
  transaction,
  status,
  body,
  source,
}) {
  const normalizedStatus =
    String(status || '')
      .trim()
      .toUpperCase();

  /*
   * Already finalized.
   */
  if (
    transaction.status ===
      'success' ||
    transaction.status ===
      'failed'
  ) {
    return {
      status:
        transaction.status,
      transaction,
      final: true,
    };
  }

  /*
   * SUCCESS
   *
   * This is where cashback is credited.
   */
  if (
    isSuccess(
      normalizedStatus
    )
  ) {
    return finalizeSuccessfulPurchase({
      transaction,
      providerBody: body,
      providerStatus:
        normalizedStatus,
      source,
    });
  }

  /*
   * FAILURE
   *
   * Refund wallet.
   */
  if (
    isFailed(
      normalizedStatus
    )
  ) {
    const refund =
      await refundPurchase({
        transactionId:
          transaction.id,
        phone:
          transaction.phone,
        reason:
          'ClubKonnect reported purchase failure',
        providerStatus:
          normalizedStatus,
      });

    return {
      status: 'failed',
      transaction:
        refund.transaction,
      refunded: true,
      newBalance:
        refund.new_wallet_balance,
      final: true,
    };
  }

  /*
   * PENDING / UNKNOWN
   */
  const metadata = {
    ...(transaction.metadata || {}),
    provider:
      'ClubKonnect',
    provider_status:
      normalizedStatus,
    provider_response:
      body,
    status_source:
      source,
    status_checked_at:
      new Date().toISOString(),
  };

  const { data: updated, error } =
    await supabaseAdmin
      .from('transactions')
      .update({
        status: 'pending',
        metadata,
      })
      .eq('id', transaction.id)
      .select()
      .single();

  if (error) {
    throw new Error(
      `Transaction update failed: ${error.message}`
    );
  }

  return {
    status: 'pending',
    transaction:
      updated,
    final: false,
  };
}


/*
 * =========================================================
 * CUSTOMER DATA PURCHASE
 * POST /api/purchase
 * =========================================================
 */
exports.purchase = async (
  req,
  res
) => {
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
      String(
        phone || ''
      ).trim();

    const selectedProductId =
      product_id ||
      productId;

    const selectedNetwork =
      normalizeNetwork(
        network
      );

    const recipientPhone =
      normalizePhone(
        recipient
      );

    const pin =
      String(
        purchase_pin ||
          purchasePin ||
          ''
      ).trim();

    if (!customerPhone) {
      return res.status(400).json({
        success: false,
        message:
          'Customer phone is required',
      });
    }

    if (!selectedProductId) {
      return res.status(400).json({
        success: false,
        message:
          'Data plan is required',
      });
    }

    if (!NETWORK_CODES[selectedNetwork]) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid network',
      });
    }

    if (
      !isValidNigerianPhone(
        recipientPhone
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid Nigerian recipient phone number',
      });
    }

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message:
          'Purchase PIN must be 4 digits',
      });
    }

    const customer =
      await getCustomer(
        customerPhone
      );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message:
          'Customer account not found',
      });
    }

    if (
      String(
        customer.purchase_pin
      ) !== pin
    ) {
      return res.status(401).json({
        success: false,
        message:
          'Incorrect purchase PIN',
      });
    }

    const product =
      await getProduct(
        selectedProductId
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          'Selected data plan is not available',
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
      productNetwork !==
        selectedNetwork
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Selected data plan does not belong to this network',
      });
    }

    const sellingPrice =
      getSellingPrice(
        product
      );

    if (
      !Number.isFinite(
        sellingPrice
      ) ||
      sellingPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'This data plan has an invalid selling price',
      });
    }

    const providerPlanCode =
      getProviderPlanCode(
        product
      );

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
     * Wallet debit + pending transaction
     * happens atomically in PostgreSQL.
     */
    const reservation =
      await reserveWallet({
        phone:
          customerPhone,
        product,
        recipient:
          recipientPhone,
        network:
          selectedNetwork,
        requestId,
      });

    const callbackUrl =
      getCallbackUrl(req);

    let provider;

    try {
      provider =
        await callClubKonnect({
          network:
            selectedNetwork,
          dataPlan:
            providerPlanCode,
          recipient:
            recipientPhone,
          requestId,
          callbackUrl,
        });
    } catch (
      providerError
    ) {
      console.error(
        'ClubKonnect request error:',
        providerError.message
      );

      try {
        const refund =
          await refundPurchase({
            transactionId:
              reservation.transaction_id,
            phone:
              customerPhone,
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
      } catch (
        refundError
      ) {
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
      String(
        provider.status || ''
      )
        .trim()
        .toUpperCase();

    const cashbackPreview =
      calculateCashback(
        product,
        sellingPrice
      );

    const metadata = {
      provider:
        'ClubKonnect',
      request_id:
        requestId,
      provider_status:
        providerStatus,
      provider_response:
        provider.body,
      http_status:
        provider.httpStatus,
      product_id:
        product.id,
      product_name:
        product.name,
      provider_plan_code:
        providerPlanCode,
      selling_price:
        sellingPrice,
      cashback_amount:
        cashbackPreview,
      cashback_percent:
        Number(
          product.cashback_percent ||
            0
        ),
      cashback_credited:
        false,
      network:
        selectedNetwork,
      network_code:
        NETWORK_CODES[
          selectedNetwork
        ],
      recipient:
        recipientPhone,
    };

    /*
     * PENDING
     *
     * No cashback yet.
     */
    if (
      isPending(
        providerStatus
      )
    ) {
      const { data: transaction, error } =
        await supabaseAdmin
          .from('transactions')
          .update({
            status:
              'pending',
            metadata,
          })
          .eq(
            'id',
            reservation.transaction_id
          )
          .select()
          .single();

      if (error) {
        throw new Error(
          `Transaction update failed: ${error.message}`
        );
      }

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
        cashbackPending:
          cashbackPreview,
      });
    }

    /*
     * IMMEDIATE SUCCESS
     *
     * Debit already happened.
     * Now transaction becomes success
     * and cashback is credited.
     */
    if (
      isSuccess(
        providerStatus
      )
    ) {
      const { data: pendingTransaction, error } =
        await supabaseAdmin
          .from('transactions')
          .update({
            status:
              'pending',
            metadata,
          })
          .eq(
            'id',
            reservation.transaction_id
          )
          .select()
          .single();

      if (error) {
        throw new Error(
          `Transaction preparation failed: ${error.message}`
        );
      }

      const result =
        await finalizeSuccessfulPurchase({
          transaction:
            pendingTransaction,
          providerBody:
            provider.body,
          providerStatus,
          source:
            'purchase',
        });

      return res.json({
        success: true,
        pending: false,
        message:
          'Data purchase completed successfully.',
        transaction:
          result.transaction,
        requestId,
        newBalance:
          reservation.new_balance,
        cashbackEarned:
          result.cashback?.amount ||
          0,
        cashbackBalance:
          result.cashback?.newBalance,
        providerStatus,
      });
    }

    /*
     * FAILURE
     */
    if (
      isFailed(
        providerStatus
      )
    ) {
      try {
        const refund =
          await refundPurchase({
            transactionId:
              reservation.transaction_id,
            phone:
              customerPhone,
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
      } catch (
        refundError
      ) {
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
     * UNKNOWN RESPONSE
     *
     * Keep pending.
     */
    const { data: transaction, error } =
      await supabaseAdmin
        .from('transactions')
        .update({
          status:
            'pending',
          metadata,
        })
        .eq(
          'id',
          reservation.transaction_id
        )
        .select()
        .single();

    if (error) {
      throw new Error(
        `Transaction update failed: ${error.message}`
      );
    }

    return res.status(202).json({
      success: true,
      pending: true,
      message:
        'Data purchase is pending provider confirmation.',
      transaction,
      requestId,
      providerStatus:
        providerStatus ||
        'UNKNOWN',
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
 * =========================================================
 * CLUBKONNECT CALLBACK
 * =========================================================
 */
exports.clubKonnectCallback =
  async (
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
        getProviderStatus(
          payload
        );

      if (!requestId) {
        return res.status(400).json({
          success: false,
          message:
            'RequestID is required',
        });
      }

      const transaction =
        await findTransaction(
          requestId
        );

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
          body:
            payload,
          source:
            'callback',
        });

      return res.json({
        success: true,
        status:
          result.status,
        pending:
          !result.final,
        refunded:
          result.refunded ||
          false,
        cashbackEarned:
          result.cashback?.amount ||
          0,
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
 * =========================================================
 * QUERY PURCHASE
 * =========================================================
 */
exports.queryPurchase =
  async (
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

      let transaction =
        null;

      if (transactionId) {
        const { data, error } =
          await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq(
              'id',
              transactionId
            )
            .maybeSingle();

        if (error) {
          throw new Error(
            error.message
          );
        }

        transaction =
          data;
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
        transaction.status ===
          'success' ||
        transaction.status ===
          'failed'
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
        transaction.metadata
          ?.request_id;

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
          status:
            provider.status,
          body:
            provider.body,
          source:
            'query',
        });

      return res.json({
        success: true,
        pending:
          !result.final,
        status:
          result.status,
        refunded:
          result.refunded ||
          false,
        transaction:
          result.transaction,
        newBalance:
          result.newBalance,
        cashbackEarned:
          result.cashback?.amount ||
          0,
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
 * =========================================================
 * PURCHASE HISTORY
 * =========================================================
 */
exports.history =
  async (
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
          .eq(
            'phone',
            phone
          )
          .eq(
            'service',
            'data'
          )
          .order(
            'created_at',
            {
              ascending:
                false,
            }
          )
          .limit(100);

      if (error) {
        throw new Error(
          error.message
        );
      }

      return res.json({
        success: true,
        transactions:
          data || [],
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
