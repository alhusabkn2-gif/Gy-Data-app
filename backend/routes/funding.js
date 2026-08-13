const express = require('express');

const router = express.Router();

const {
  submitFundingRequest,
  listFundingRequests,
  approveFundingRequest,
  rejectFundingRequest,
  adminAdjustWallet,
} = require('../controllers/fundingController');


/*
|--------------------------------------------------------------------------
| CUSTOMER MANUAL FUNDING
|--------------------------------------------------------------------------
*/

router.post(
  '/request',
  submitFundingRequest
);


/*
|--------------------------------------------------------------------------
| SUPER ADMIN FUNDING REQUESTS
|--------------------------------------------------------------------------
*/

router.get(
  '/requests',
  listFundingRequests
);


/*
|--------------------------------------------------------------------------
| SUPER ADMIN APPROVE FUNDING
|--------------------------------------------------------------------------
*/

router.post(
  '/approve',
  approveFundingRequest
);


/*
|--------------------------------------------------------------------------
| SUPER ADMIN REJECT FUNDING
|--------------------------------------------------------------------------
*/

router.post(
  '/reject',
  rejectFundingRequest
);


/*
|--------------------------------------------------------------------------
| SUPER ADMIN DIRECT WALLET FUND / REFUND
|--------------------------------------------------------------------------
|
| type:
|   fund   = add money to customer wallet
|   refund = remove money from customer wallet
|
*/

router.post(
  '/admin-adjust',
  adminAdjustWallet
);


module.exports = router;
