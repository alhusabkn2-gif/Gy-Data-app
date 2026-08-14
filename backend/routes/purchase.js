const express = require('express');

const router = express.Router();

const purchaseController = require('../controllers/PurchaseController');


// =====================================================
// DATA PURCHASE
// =====================================================

router.post(
  '/',
  purchaseController.purchase
);


// =====================================================
// CLUBKONNECT CALLBACK
// =====================================================

router.post(
  '/clubkonnect/callback',
  purchaseController.clubKonnectCallback
);


// =====================================================
// PURCHASE STATUS / QUERY
// =====================================================

router.get(
  '/query',
  purchaseController.queryPurchase
);

router.post(
  '/query',
  purchaseController.queryPurchase
);


// =====================================================
// PURCHASE HISTORY
// =====================================================

router.get(
  '/history',
  purchaseController.history
);

router.post(
  '/history',
  purchaseController.history
);


module.exports = router;
