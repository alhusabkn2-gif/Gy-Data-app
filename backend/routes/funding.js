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
| CUSTOMER FUNDING
|--------------------------------------------------------------------------
|
| Customer submits a manual funding request.
|
| This is the ONLY flow that creates funding_requests.
|--------------------------------------------------------------------------
*/

router.post(
  '/request',
  submitFundingRequest
);


/*
|--------------------------------------------------------------------------
| SUPER ADMIN - LIST FUNDING REQUESTS
|--------------------------------------------------------------------------
*/

router.get(
  '/requests',
  listFundingRequests
);


/*
|--------------------------------------------------------------------------
| SUPER ADMIN - APPROVE CUSTOMER REQUEST
|--------------------------------------------------------------------------
*/

router.post(
  '/approve',
  approveFundingRequest
);


/*
|--------------------------------------------------------------------------
| SUPER ADMIN - REJECT CUSTOMER REQUEST
|--------------------------------------------------------------------------
*/

router.post(
  '/reject',
  rejectFundingRequest
);


/*
|--------------------------------------------------------------------------
| SUPER ADMIN - DIRECT WALLET ADJUSTMENT
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This route:
|
|   DOES NOT create funding_requests
|
| It directly calls:
|
|   admin_adjust_wallet()
|
| Supported:
|
|   type = fund
|   type = refund
|--------------------------------------------------------------------------
*/

router.post(
  '/admin-adjust',
  adminAdjustWallet
);


module.exports = router;
