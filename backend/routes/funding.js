const express = require('express');
const router = express.Router();

const {
  createFundingRequest,
  getFundingRequests,
  approveFunding,
  rejectFunding,
  adminAdjustWallet,
} = require('../controllers/fundingController');

/*
 * CUSTOMER FUNDING
 */
router.post('/request', createFundingRequest);

/*
 * SUPER ADMIN FUNDING MANAGEMENT
 */
router.get('/requests', getFundingRequests);
router.post('/approve', approveFunding);
router.post('/reject', rejectFunding);

/*
 * SUPER ADMIN DIRECT WALLET ADJUSTMENT
 *
 * type:
 *   fund   = add money
 *   refund = remove money
 */
router.post('/admin-adjust', adminAdjustWallet);

module.exports = router;
