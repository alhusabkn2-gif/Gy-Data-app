const express = require('express');
const router = express.Router();

const monnifyController = require('../controllers/monnifyController');
const rawBody = require('../middlewares/rawBody');

/**
 * Monnify Routes
 * Base URL: /api/monnify
 */

// Connection status
router.get('/status', monnifyController.getMonnifyStatus);

// Reserved accounts
router.post('/reserved-account', monnifyController.createReservedAccount);

router.get(
  '/reserved-accounts',
  monnifyController.listReservedAccounts
);

router.get(
  '/reserved-account/:accountReference',
  monnifyController.getReservedAccount
);

router.delete(
  '/reserved-account/:accountReference',
  monnifyController.deallocateAccount
);

// Payments
router.post(
  '/initialize',
  monnifyController.initializePayment
);

router.get(
  '/verify',
  monnifyController.verifyPayment
);

router.get(
  '/transaction/:paymentReference',
  monnifyController.getTransactionStatus
);

// Webhook
// rawBody must run before JSON parsing for this route.
router.post(
  '/webhook',
  rawBody,
  monnifyController.handleWebhook
);

module.exports = router;
