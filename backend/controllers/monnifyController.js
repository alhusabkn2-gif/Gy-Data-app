const monnifyService = require('../services/monnifyService');

/**
 * Check Monnify service connection status
 */
exports.getMonnifyStatus = async (req, res, next) => {
  try {
    const isConnected = await monnifyService.checkApiStatus();

    res.status(200).json({
      status: isConnected ? 'connected' : 'disconnected',
      message: isConnected ? 'Monnify API connection successful' : 'Monnify API connection failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next({
      statusCode: 500,
      message: 'Failed to check Monnify status',
      error: error.message
    });
  }
};

exports.createReservedAccount = async (req, res, next) => {
  try {
    const {
      accountReference,
      accountName,
      currencyCode,
      incomeSplitConfig,
      allocationPercentage,
      customerEmail,
      customerName,
      bvn,
      customerPhoneNumber
    } = req.body;

    if (!accountReference || !accountName) {
      return res.status(400).json({
        success: false,
        message: 'accountReference and accountName are required',
        errors: {
          accountReference: !accountReference ? 'Required' : undefined,
          accountName: !accountName ? 'Required' : undefined
        }
      });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(accountReference)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid accountReference format. Use only alphanumeric characters, dashes, and underscores'
      });
    }

    const accountData = {
      accountReference,
      accountName,
      currencyCode,
      incomeSplitConfig,
      allocationPercentage,
      customerEmail,
      customerName,
      bvn,
      customerPhoneNumber
    };

    const result = await monnifyService.createReservedAccount(accountData);

    res.status(201).json({
      success: true,
      message: 'Reserved account created successfully',
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next({
      statusCode: 400,
      message: error.message || 'Failed to create reserved account',
      error: error.message
    });
  }
};

exports.getReservedAccount = async (req, res, next) => {
  try {
    const { accountReference } = req.params;

    if (!accountReference) {
      return res.status(400).json({
        success: false,
        message: 'accountReference is required'
      });
    }

    const result = await monnifyService.getReservedAccount(accountReference);

    res.status(200).json({
      success: true,
      message: 'Reserved account retrieved successfully',
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next({
      statusCode: 400,
      message: error.message || 'Failed to retrieve reserved account',
      error: error.message
    });
  }
};

exports.listReservedAccounts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;

    if (pageSize > 100) {
      return res.status(400).json({
        success: false,
        message: 'pageSize cannot exceed 100'
      });
    }

    const result = await monnifyService.listReservedAccounts(page, pageSize);

    res.status(200).json({
      success: true,
      message: 'Reserved accounts retrieved successfully',
      data: result.data,
      pagination: { page, pageSize },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next({
      statusCode: 400,
      message: error.message || 'Failed to list reserved accounts',
      error: error.message
    });
  }
};

exports.deallocateAccount = async (req, res, next) => {
  try {
    const { accountReference } = req.params;

    if (!accountReference) {
      return res.status(400).json({
        success: false,
        message: 'accountReference is required'
      });
    }

    const result = await monnifyService.deallocateAccount(accountReference);

    res.status(200).json({
      success: true,
      message: result.message || 'Account deallocated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next({
      statusCode: 400,
      message: error.message || 'Failed to deallocate account',
      error: error.message
    });
  }
};

exports.initializePayment = async (req, res, next) => {
  try {
    const {
      amount,
      customerName,
      customerEmail,
      paymentReference,
      paymentDescription,
      currencyCode,
      redirectUrl,
      paymentMethods
    } = req.body;

    if (!amount || !customerName || !customerEmail || !paymentReference) {
      return res.status(400).json({
        success: false,
        message: 'amount, customerName, customerEmail, and paymentReference are required',
        errors: {
          amount: !amount ? 'Required' : undefined,
          customerName: !customerName ? 'Required' : undefined,
          customerEmail: !customerEmail ? 'Required' : undefined,
          paymentReference: !paymentReference ? 'Required' : undefined
        }
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const paymentData = {
      amount,
      customerName,
      customerEmail,
      paymentReference,
      paymentDescription,
      currencyCode,
      redirectUrl,
      paymentMethods
    };

    const result = await monnifyService.initializePayment(paymentData);

    res.status(201).json({
      success: true,
      message: 'Payment initialized successfully',
      data: result.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next({
      statusCode: 400,
      message: error.message || 'Failed to initialize payment',
      error: error.message
    });
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { transactionReference, paymentReference } = req.query;
    const reference = transactionReference || paymentReference;
    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Either transactionReference or paymentReference is required'
      });
    }

    const result = await monnifyService.verifyPayment(reference);

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentReference: result.data?.paymentReference || result.paymentReference,
        amount: result.data?.amount || result.amount,
        status: result.data?.paymentStatus || result.status,
        isPaid: result.isPaid || (result.data?.paymentStatus === 'PAID'),
        paidAt: result.data?.paidOn || result.paidAt,
        transactionReference: result.data?.transactionReference || result.transactionReference
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next({
      statusCode: 400,
      message: error.message || 'Failed to verify payment',
      error: error.message
    });
  }
};

exports.getTransactionStatus = async (req, res, next) => {
  try {
    const { paymentReference } = req.params;

    if (!paymentReference) {
      return res.status(400).json({
        success: false,
        message: 'paymentReference is required'
      });
    }

    const result = await monnifyService.getTransactionStatus(paymentReference);

    res.status(200).json({
      success: true,
      message: 'Transaction status retrieved successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next({
      statusCode: 400,
      message: error.message || 'Failed to get transaction status',
      error: error.message
    });
  }
};

exports.handleWebhook = async (req, res, next) => {
  try {
    // Accept signature header alternatives: X-Monnify-Signature, monnify-signature
    const signature = req.headers['x-monnify-signature'] || req.headers['monnify-signature'] || req.headers['monnify_signature'];
    // Prefer raw body if provided (see server configuration note). Fallback to JSON stringify.
    const payload = req.rawBody ? req.rawBody : Buffer.from(JSON.stringify(req.body || {}));

    // Validate webhook signature and reject invalid signatures
    const isValid = monnifyService.validateWebhookSignature(payload, signature);

    if (!isValid) {
      console.warn('Invalid Monnify webhook signature received. Rejecting request.');
      // Per requirements: reject invalid webhook signatures and do not process them.
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const webhookData = req.body;

    // Process the webhook and return the normalized result
    const processedData = await monnifyService.processWebhookNotification(webhookData);

    // Important: Do not expose Monnify secrets in logs or responses
    console.info('Monnify webhook processed:', {
      eventType: processedData.eventType,
      paymentReference: processedData.paymentReference || null,
      transactionReference: processedData.transactionReference || null,
      status: processedData.status
    });

    // Application integration point:
    // - Update payment records in your DB
    // - Emit internal events / notifications
    // Note: This controller intentionally does not write to your DB; hook into processedData where appropriate.

    // Acknowledge receipt
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data: processedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook handling error:', error.message);
    // Return 500 to indicate not processed; Monnify may retry depending on configuration.
    return res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};
