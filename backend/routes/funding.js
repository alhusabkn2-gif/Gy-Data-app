const express = require('express');
const router = express.Router();

const fundingController = require('../controllers/fundingController');

/**
 * Funding Routes
 * Base URL: /api/funding
 */

// User submits funding request
router.post('/request', fundingController.submitFundingRequest);

// Admin: List pending/all funding requests
router.get('/requests', fundingController.listFundingRequests);

// Admin: Approve funding request
router.post('/approve', fundingController.approveFundingRequest);

// Admin: Reject funding request
router.post('/reject', fundingController.rejectFundingRequest);

module.exports = router;
