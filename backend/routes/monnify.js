const express = require('express');
const router = express.Router();

const monnifyController = require('../controllers/monnifyController');

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
// The server captures req.rawBody via express.json({ verify }), so no route-level rawBody middleware is needed.
router.post(
  '/webhook',
  monnifyController.handleWebhook
);

module.exports = router;
