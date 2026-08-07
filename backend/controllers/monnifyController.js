const monnifyService = require('../services/monnifyService');

/**
 * @desc    Check Monnify service connection status
 * @route   GET /api/monnify/status
 * @access  Public
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

/**
 * @desc    Create a reserved account (virtual account)
 * @route   POST /api/monnify/reserved-account
 * @access  Private
 * @body    {
 *   "accountReference": "unique-ref-12345",
 *   "accountName": "John Doe Account",
 *   "currencyCode": "NGN" (optional),
 *   "incomeSplitConfig": [] (optional),
 *   "allocationPercentage": null (optional)
 * }
 */
exports.createReservedAccount = async (req, res, next) => {
  try {
    const {
      accountReference,
      accountName,
      currencyCode,
      incomeSplitConfig,
      allocationPercentage
    } = req.body;

    // Validate required fields
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

    // Validate accountReference format (alphanumeric with dashes/underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(accountReference)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid accountReference format. Use only alphanumeric characters, dashes, and underscores'
      });
    }

    const accountData = {
      accountReference,
      accountName,
      ...(currencyCode && { currencyCode }),
      ...(incomeSplitConfig && { incomeSplitConfig }),
      ...(allocationPercentage !== undefined && { allocationPercentage })
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
      message: 'Failed to create reserved account',
      error: error.message
    });
  }
};

/**
 * @desc    Get reserved account details
 * @route   GET /api/monnify/reserved-account/:accountReference
 * @access  Private
 */
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
      message: 'Failed to retrieve reserved account',
      error: error.message
    });
  }
};

/**
 * @desc    List all reserved accounts
 * @route   GET /api/monnify/reserved-accounts
 * @access  Private
 * @query   {
 *   "page": 0 (optional),
 *   "pageSize": 10 (optional)
 * }
 */
exports.listReservedAccounts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const pageSize = parseInt(req.query.pageSize) || 10;

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
      pagination: {
        page,
        pageSize
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next({
      statusCode: 400,
      message: 'Failed to list reserved accounts',
      error: error.message
    });
  }
};

/**
 * @desc    Deallocate a reserved account
 * @route   DELETE /api/monnify/reserved-account/:accountReference
 * @access  Private
 */
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
      message: 'Account deallocated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next({
      statusCode: 400,
      message: 'Failed to deallocate account',
      error: error.message
    });
  }
};

/**
 * @desc    Initialize a payment transaction
 * @route   POST /api/monnify/initialize
 * @access  Private
 * @body    {
 *   "amount": 10000,
 *   "customerName": "John Doe",
 *   "customerEmail": "john@example.com",
 *   "paymentReference": "unique-ref-123",
 *   "paymentDescription": "Payment for subscription" (optional),
 *   "currencyCode": "NGN" (optional),
 *   "redirectUrl": "https://yourapp.com/callback" (optional),
 *   "paymentMethods": ["CARD", "ACCOUNT_TRANSFER"] (optional),
 *   "incomeSplitConfig": [] (optional)
 * }
 */
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
      paymentMethods,
      incomeSplitConfig
    } = req.body;

    // Validate required fields
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

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'amount must be a positive number'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const paymentData = {
      amount,
      customerName,
      customerEmail,
      paymentReference,
      ...(paymentDescription && { paymentDescription }),
      ...(currencyCode && { currencyCode }),
      ...(redirectUrl && { redirectUrl }),
      ...(paymentMethods && { paymentMethods }),
      ...(incomeSplitConfig && { incomeSplitConfig })
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
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
};

/**
 * @desc    Verify payment transaction
 * @route   GET /api/monnify/verify
 * @access  Private
 * @query   {
 *   "transactionReference": "ref-12345" OR
 *   "paymentReference": "ref-12345"
 * }
 */
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

    let result;

    if (paymentReference) {
      result = await monnifyService.getTransactionStatus(paymentReference);
    } else {
      result = await monnifyService.verifyPayment(transactionReference);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentReference: result.data?.paymentReference || result.paymentReference,
        amount: result.data?.amount || result.amount,
        status: result.data?.paymentStatus || result.status,
        isPaid: result.data?.paymentStatus === 'PAID' || result.isPaid,
        paidAt: result.data?.paidOn || result.paidAt,
        transactionReference: result.data?.transactionReference || result.transactionReference
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next({
      statusCode: 400,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

/**
 * @desc    Handle Monnify webhook notification
 * @route   POST /api/monnify/webhook
 * @access  Public (but should validate signature)
 * @header  X-Monnify-Signature (webhook signature for validation)
 * @body    {
 *   "eventType": "SUCCESSFUL_CHARGE",
 *   "eventData": { ... }
 * }
 */
exports.handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-monnify-signature'];
    const payload = JSON.stringify(req.body);

    // Validate webhook signature
    const isValid = monnifyService.validateWebhookSignature(payload, signature);

    if (!isValid) {
      console.warn('Invalid webhook signature received');
      // Log but don't fail immediately - Monnify might send without proper signature in test mode
    }

    const webhookData = req.body;
    const processedData = await monnifyService.processWebhookNotification(webhookData);

    // TODO: Store webhook data in database for auditing
    // TODO: Update payment status in your application database
    // TODO: Send confirmation email to customer if payment successful

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data: processedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook processing error:', error.message);
    
    // Always return 200 to Monnify to acknowledge receipt
    res.status(200).json({
      success: false,
      message: 'Webhook received but processing failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * @desc    Get transaction status
 * @route   GET /api/monnify/transaction/:paymentReference
 * @access  Private
 */
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
      message: 'Failed to get transaction status',
      error: error.message
    });
  }
};
