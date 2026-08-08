const express = require('express');

/**
 * Raw Body Middleware
 * Captures raw request body for webhook signature verification
 * This middleware must run before JSON parsing for the webhook route
 * 
 * Usage in routes:
 * router.post('/webhook', rawBody, monnifyController.handleWebhook);
 */
const rawBody = express.raw({ type: 'application/json' });

module.exports = rawBody;
