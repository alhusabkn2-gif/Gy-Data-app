const express = require('express');
const router = express.Router();

const purchaseController = require('../controllers/purchaseController');

/*
 * Customer data purchase
 *
 * POST /api/purchase
 */
router.post(
  '/',
  purchaseController.purchase
);

/*
 * ClubKonnect callback
 *
 * POST /api/purchase/clubkonnect/callback
 */
router.post(
  '/clubkonnect/callback',
  purchaseController.clubKonnectCallback
);

/*
 * Query pending purchase
 *
 * GET  /api/purchase/query
 * POST /api/purchase/query
 */
router.get(
  '/query',
  purchaseController.queryPurchase
);

router.post(
  '/query',
  purchaseController.queryPurchase
);

/*
 * Customer purchase history
 *
 * GET /api/purchase/history?phone=080...
 */
router.get(
  '/history',
  purchaseController.history
);

module.exports = router;
