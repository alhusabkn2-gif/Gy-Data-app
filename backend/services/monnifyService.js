const axios = require('axios');

class MonnifyService {
  constructor() {
    this.baseURL = process.env.MONNIFY_BASE_URL || 'https://api.monnify.com';
    this.apiKey = process.env.MONNIFY_API_KEY;
    this.secretKey = process.env.MONNIFY_SECRET_KEY;
    this.contractCode = process.env.MONNIFY_CONTRACT_CODE;
    
    if (!this.apiKey || !this.secretKey || !this.contractCode) {
      throw new Error('Monnify credentials are not properly configured in environment variables');
    }

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Generate Basic Auth credentials for Monnify API
   * @returns {string} Base64 encoded credentials
   */
  getBasicAuth() {
    const credentials = `${this.apiKey}:${this.secretKey}`;
    return Buffer.from(credentials).toString('base64');
  }

  /**
   * Get authorization headers
   * @returns {object} Authorization headers
   */
  getAuthHeaders() {
    return {
      Authorization: `Basic ${this.getBasicAuth()}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get Bearer token headers (for authenticated requests)
   * @returns {object} Bearer token headers
   */
  async getBearerHeaders() {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get or refresh access token from Monnify
   * @returns {Promise<string>} Access token
   */
  async getAccessToken() {
    try {
      // Check if token is still valid
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await axios.post(
        `${this.baseURL}/api/v1/auth/login`,
        {},
        {
          headers: this.getAuthHeaders()
        }
      );

      if (!response.data || !response.data.responseBody || !response.data.responseBody.accessToken) {
        throw new Error('Failed to retrieve access token from Monnify');
      }

      const { accessToken, expiresIn } = response.data.responseBody;
      
      // Store token and calculate expiry time (subtract 5 minutes buffer)
      this.accessToken = accessToken;
      this.tokenExpiry = Date.now() + (expiresIn * 1000) - (5 * 60 * 1000);

      return accessToken;
    } catch (error) {
      console.error('Error getting Monnify access token:', error.response?.data || error.message);
      throw new Error(`Failed to authenticate with Monnify: ${error.message}`);
    }
  }

  /**
   * Create a Reserved Account (Virtual Account)
   * @param {object} accountData - Account details
   * @returns {Promise<object>} Created account details
   */
  async createReservedAccount(accountData) {
    try {
      const {
        accountReference,
        accountName,
        currencyCode = 'NGN',
        contractCode = this.contractCode,
        incomeSplitConfig = [],
        allocationPercentage = null
      } = accountData;

      if (!accountReference || !accountName) {
        throw new Error('accountReference and accountName are required');
      }

      const headers = await this.getBearerHeaders();

      const payload = {
        accountReference,
        accountName,
        currencyCode,
        contractCode,
        incomeSplitConfig,
        allocationPercentage
      };

      const response = await axios.post(
        `${this.baseURL}/api/v1/bank-transfer/reserved-accounts`,
        payload,
        { headers }
      );

      if (!response.data || !response.data.responseBody) {
        throw new Error('Invalid response from Monnify API');
      }

      return {
        success: response.data.requestSuccessful,
        data: response.data.responseBody,
        message: response.data.responseMessage
      };
    } catch (error) {
      console.error('Error creating reserved account:', error.response?.data || error.message);
      throw new Error(`Failed to create reserved account: ${error.response?.data?.responseMessage || error.message}`);
    }
  }

  /**
   * Get Reserved Account Details
   * @param {string} accountReference - The account reference
   * @returns {Promise<object>} Account details
   */
  async getReservedAccount(accountReference) {
    try {
      const headers = await this.getBearerHeaders();

      const response = await axios.get(
        `${this.baseURL}/api/v1/bank-transfer/reserved-accounts/${accountReference}`,
        { headers }
      );

      if (!response.data || !response.data.responseBody) {
        throw new Error('Invalid response from Monnify API');
      }

      return {
        success: response.data.requestSuccessful,
        data: response.data.responseBody,
        message: response.data.responseMessage
      };
    } catch (error) {
      console.error('Error fetching reserved account:', error.response?.data || error.message);
      throw new Error(`Failed to fetch reserved account: ${error.response?.data?.responseMessage || error.message}`);
    }
  }

  /**
   * Initialize a payment transaction
   * @param {object} paymentData - Payment details
   * @returns {Promise<object>} Payment initialization response
   */
  async initializePayment(paymentData) {
    try {
      const {
        amount,
        customerName,
        customerEmail,
        paymentReference,
        paymentDescription = 'Payment from Gy-Data App',
        currencyCode = 'NGN',
        contractCode = this.contractCode,
        redirectUrl,
        paymentMethods = ['CARD', 'ACCOUNT_TRANSFER', 'USSD'],
        incomeSplitConfig = []
      } = paymentData;

      if (!amount || !customerName || !customerEmail || !paymentReference) {
        throw new Error('amount, customerName, customerEmail, and paymentReference are required');
      }

      const headers = await this.getBearerHeaders();

      const payload = {
        amount,
        customerName,
        customerEmail,
        paymentReference,
        paymentDescription,
        currencyCode,
        contractCode,
        redirectUrl,
        paymentMethods,
        incomeSplitConfig
      };

      const response = await axios.post(
        `${this.baseURL}/api/v1/merchant/transactions/init-transaction`,
        payload,
        { headers }
      );

      if (!response.data || !response.data.responseBody) {
        throw new Error('Invalid response from Monnify API');
      }

      return {
        success: response.data.requestSuccessful,
        data: response.data.responseBody,
        message: response.data.responseMessage
      };
    } catch (error) {
      console.error('Error initializing payment:', error.response?.data || error.message);
      throw new Error(`Failed to initialize payment: ${error.response?.data?.responseMessage || error.message}`);
    }
  }

  /**
   * Verify a payment transaction
   * @param {string} transactionReference - Transaction reference or payment reference
   * @returns {Promise<object>} Transaction details
   */
  async verifyPayment(transactionReference) {
    try {
      if (!transactionReference) {
        throw new Error('transactionReference is required');
      }

      const headers = await this.getBearerHeaders();

      const response = await axios.get(
        `${this.baseURL}/api/v1/merchant/transactions/query?transactionReference=${transactionReference}`,
        { headers }
      );

      if (!response.data || !response.data.responseBody) {
        throw new Error('Invalid response from Monnify API');
      }

      return {
        success: response.data.requestSuccessful,
        data: response.data.responseBody,
        message: response.data.responseMessage,
        isPaid: response.data.responseBody.paymentStatus === 'PAID'
      };
    } catch (error) {
      console.error('Error verifying payment:', error.response?.data || error.message);
      throw new Error(`Failed to verify payment: ${error.response?.data?.responseMessage || error.message}`);
    }
  }

  /**
   * Get transaction status by paymentReference
   * @param {string} paymentReference - Payment reference
   * @returns {Promise<object>} Transaction status
   */
  async getTransactionStatus(paymentReference) {
    try {
      if (!paymentReference) {
        throw new Error('paymentReference is required');
      }

      const headers = await this.getBearerHeaders();

      const response = await axios.get(
        `${this.baseURL}/api/v1/merchant/transactions/query?paymentReference=${paymentReference}`,
        { headers }
      );

      if (!response.data || !response.data.responseBody) {
        throw new Error('Invalid response from Monnify API');
      }

      const transaction = response.data.responseBody;

      return {
        success: response.data.requestSuccessful,
        paymentReference: transaction.paymentReference,
        amount: transaction.amount,
        status: transaction.paymentStatus,
        isPaid: transaction.paymentStatus === 'PAID',
        paidAt: transaction.paidOn,
        transactionReference: transaction.transactionReference,
        message: response.data.responseMessage
      };
    } catch (error) {
      console.error('Error getting transaction status:', error.response?.data || error.message);
      throw new Error(`Failed to get transaction status: ${error.response?.data?.responseMessage || error.message}`);
    }
  }

  /**
   * Validate webhook signature from Monnify
   * @param {string} payload - Request body as string
   * @param {string} signature - Signature from header
   * @returns {boolean} Is signature valid
   */
  validateWebhookSignature(payload, signature) {
    try {
      const crypto = require('crypto');
      
      // Create HMAC SHA512 hash
      const hash = crypto
        .createHmac('sha512', this.secretKey)
        .update(payload)
        .digest('base64');

      return hash === signature;
    } catch (error) {
      console.error('Error validating webhook signature:', error.message);
      return false;
    }
  }

  /**
   * Process webhook notification from Monnify
   * @param {object} webhookData - Webhook payload
   * @returns {object} Processed webhook data
   */
  async processWebhookNotification(webhookData) {
    try {
      const {
        eventType,
        eventData
      } = webhookData;

      if (!eventType || !eventData) {
        throw new Error('Invalid webhook data structure');
      }

      // Handle different event types
      switch (eventType) {
        case 'SUCCESSFUL_CHARGE':
          return {
            eventType,
            status: 'success',
            transactionReference: eventData.transactionReference,
            paymentReference: eventData.paymentReference,
            amount: eventData.amount,
            paidBy: eventData.paidBy,
            paidOn: eventData.paidOn,
            message: 'Payment successful'
          };

        case 'FAILED_CHARGE':
          return {
            eventType,
            status: 'failed',
            transactionReference: eventData.transactionReference,
            paymentReference: eventData.paymentReference,
            amount: eventData.amount,
            message: 'Payment failed'
          };

        case 'PENDING_CHARGE':
          return {
            eventType,
            status: 'pending',
            transactionReference: eventData.transactionReference,
            paymentReference: eventData.paymentReference,
            amount: eventData.amount,
            message: 'Payment pending'
          };

        case 'REFUND_PROCESSED':
          return {
            eventType,
            status: 'refunded',
            transactionReference: eventData.transactionReference,
            refundReference: eventData.refundReference,
            amount: eventData.amount,
            message: 'Refund processed'
          };

        default:
          return {
            eventType,
            status: 'unknown',
            message: 'Unknown event type',
            data: eventData
          };
      }
    } catch (error) {
      console.error('Error processing webhook notification:', error.message);
      throw new Error(`Failed to process webhook: ${error.message}`);
    }
  }

  /**
   * List all reserved accounts
   * @param {number} page - Page number (default: 0)
   * @param {number} pageSize - Page size (default: 10)
   * @returns {Promise<object>} List of reserved accounts
   */
  async listReservedAccounts(page = 0, pageSize = 10) {
    try {
      const headers = await this.getBearerHeaders();

      const response = await axios.get(
        `${this.baseURL}/api/v1/bank-transfer/reserved-accounts?page=${page}&pageSize=${pageSize}`,
        { headers }
      );

      if (!response.data || !response.data.responseBody) {
        throw new Error('Invalid response from Monnify API');
      }

      return {
        success: response.data.requestSuccessful,
        data: response.data.responseBody,
        message: response.data.responseMessage
      };
    } catch (error) {
      console.error('Error listing reserved accounts:', error.response?.data || error.message);
      throw new Error(`Failed to list reserved accounts: ${error.response?.data?.responseMessage || error.message}`);
    }
  }

  /**
   * Deallocate a reserved account
   * @param {string} accountReference - Account reference to deallocate
   * @returns {Promise<object>} Deallocation response
   */
  async deallocateAccount(accountReference) {
    try {
      if (!accountReference) {
        throw new Error('accountReference is required');
      }

      const headers = await this.getBearerHeaders();

      const response = await axios.delete(
        `${this.baseURL}/api/v1/bank-transfer/reserved-accounts/${accountReference}`,
        { headers }
      );

      if (!response.data) {
        throw new Error('Invalid response from Monnify API');
      }

      return {
        success: response.data.requestSuccessful || true,
        message: response.data.responseMessage || 'Account deallocated successfully'
      };
    } catch (error) {
      console.error('Error deallocating account:', error.response?.data || error.message);
      throw new Error(`Failed to deallocate account: ${error.response?.data?.responseMessage || error.message}`);
    }
  }

  /**
   * Check if Monnify API is accessible
   * @returns {Promise<boolean>} API status
   */
  async checkApiStatus() {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('Monnify API status check failed:', error.message);
      return false;
    }
  }
}

module.exports = new MonnifyService();
