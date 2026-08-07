const express = require('express');
const router = express.Router();
const monnifyController = require('../controllers/monnifyController');

/**
 * Monnify Routes
 * Base URL: /api/monnify
 */

/**
 * @route   GET /api/monnify/status
 * @desc    Check Monnify service connection status
 * @access  Public
 */
router.get('/status', monnifyController.getMonnifyStatus);

/**
 * RESERVED ACCOUNT ENDPOINTS
 */

/**
 * @route   POST /api/monnify/reserved-account
 * @desc    Create a new reserved account (virtual account)
 * @access  Private
 * @body    {
 *   "accountReference": "unique-reference-string",
 *   "accountName": "Customer Name",
 *   "currencyCode": "NGN" (optional, default: NGN),
 *   "incomeSplitConfig": [] (optional),
 *   "allocationPercentage": null (optional)
 * }
 * @example
 * POST /api/monnify/reserved-account
 * {
 *   "accountReference": "CUST-12345",
 *   "accountName": "John Doe"
 * }
 */
router.post('/reserved-account', monnifyController.createReservedAccount);

/**
 * @route   GET /api/monnify/reserved-accounts
 * @desc    List all reserved accounts with pagination
 * @access  Private
 * @query   page=0&pageSize=10
 */
router.get('/reserved-accounts', monnifyController.listReservedAccounts);

/**
 * @route   GET /api/monnify/reserved-account/:accountReference
 * @desc    Get details of a specific reserved account
 * @access  Private
 * @params  accountReference - The account reference identifier
 */
router.get('/reserved-account/:accountReference', monnifyController.getReservedAccount);

/**
 * @route   DELETE /api/monnify/reserved-account/:accountReference
 * @desc    Deallocate a reserved account
 * @access  Private
 * @params  accountReference - The account reference to deallocate
 */
router.delete('/reserved-account/:accountReference', monnifyController.deallocateAccount);

/**
 * PAYMENT ENDPOINTS
 */

/**
 * @route   POST /api/monnify/initialize
 * @desc    Initialize a payment transaction
 * @access  Private
 * @body    {
 *   "amount": 50000,
 *   "customerName": "John Doe",
 *   "customerEmail": "john@example.com",
 *   "paymentReference": "unique-payment-ref",
 *   "paymentDescription": "Payment description" (optional),
 *   "currencyCode": "NGN" (optional),
 *   "redirectUrl": "https://yourapp.com/callback" (optional),
 *   "paymentMethods": ["CARD", "ACCOUNT_TRANSFER", "USSD"] (optional),
 *   "incomeSplitConfig": [] (optional)
 * }
 * @example
 * POST /api/monnify/initialize
 * {
 *   "amount": 100000,
 *   "customerName": "Jane Smith",
 *   "customerEmail": "jane@example.com",
 *   "paymentReference": "INV-2024-001",
 *   "paymentDescription": "Premium Subscription Payment"
 * }
 */
router.post('/initialize', monnifyController.initializePayment);

/**
 * @route   GET /api/monnify/verify
 * @desc    Verify payment status using transaction or payment reference
 * @access  Private
 * @query   transactionReference=ref OR paymentReference=ref
 * @example
 * GET /api/monnify/verify?paymentReference=INV-2024-001
 * GET /api/monnify/verify?transactionReference=MON123456789
 */
router.get('/verify', monnifyController.verifyPayment);

/**
 * @route   GET /api/monnify/transaction/:paymentReference
 * @desc    Get transaction status using payment reference
 * @access  Private
 * @params  paymentReference - The payment reference
 */
router.get('/transaction/:paymentReference', monnifyController.getTransactionStatus);

/**
 * WEBHOOK ENDPOINT
 */

/**
 * @route   POST /api/monnify/webhook
 * @desc    Handle Monnify webhook notifications
 * @access  Public (but should validate signature)
 * @header  X-Monnify-Signature (HMAC-SHA512 signature)
 * @body    {
 *   "eventType": "SUCCESSFUL_CHARGE|FAILED_CHARGE|PENDING_CHARGE|REFUND_PROCESSED",
 *   "eventData": {
 *     "transactionReference": "...",
 *     "paymentReference": "...",
 *     "amount": 50000,
 *     "paidBy": "customer details",
 *     "paidOn": "2024-01-01T12:00:00Z",
 *     ...
 *   }
 * }
 */
router.post('/webhook', monnifyController.handleWebhook);

module.exports = router;
