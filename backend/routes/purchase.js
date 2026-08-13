const express = require('express');

const router = express.Router();

const purchaseController =
  require('../controllers/purchaseController');

/*
 * Customer data purchase.
 */
router.post(
  '/',
  purchaseController.purchase
);

/*
 * ClubKonnect final-status callback.
 */
router.post(
  '/clubkonnect/callback',
  purchaseController.clubKonnectCallback
);

module.exports = router;
