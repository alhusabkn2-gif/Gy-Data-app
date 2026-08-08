const express = require('express');

/**
 * Raw Body Middleware
 * Captures raw request body for webhook signature verification
 * This middleware must run before JSON parsing for the webhook route
 */
const rawBody = express.raw({ type: 'application/json' });

module.exports = rawBody;
