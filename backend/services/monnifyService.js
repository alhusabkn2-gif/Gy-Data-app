const axios = require('axios');
const crypto = require('crypto');

class MonnifyService {
  constructor() {
    this.baseURL = process.env.MONNIFY_BASE_URL || 'https://api.monnify.com';
    this.apiKey = process.env.MONNIFY_API_KEY;
    this.secretKey = process.env.MONNIFY_SECRET_KEY;
    this.contractCode = process.env.MONNIFY_CONTRACT_CODE;
    // Dedicated webhook secret recommended (do not expose API secret to webhooks)
    this.webhookSecret = process.env.MONNIFY_WEBHOOK_SECRET || null;

    if (!this.apiKey || !this.secretKey || !this.contractCode) {
      throw new Error('Monnify credentials are not properly configured in environment variables');
    }

    this.accessToken = null;
    this.tokenExpiry = null; // timestamp in ms
  }

  // Base64 Basic auth for token request
  getBasicAuth() {
    const credentials = `${this.apiKey}:${this.secretKey}`;
    return Buffer.from(credentials).toString('base64');
  }

  getAuthHeaders() {
    return {
      Authorization: `Basic ${this.getBasicAuth()}`,
      'Content-Type': 'application/json'
    };
  }

  // Ensure we have a valid bearer token
  async getBearerHeaders() {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Retrieve access token from Monnify (caches until expiry)
  async getAccessToken() {
    try {
      // return cached if still valid
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await axios.post(
        `${this.baseURL}/api/v1/auth/login`,
        {},
        { headers: this.getAuthHeaders(), timeout: 10000 }
      );

      if (!response.data || !response.data.responseBody || !response.data.responseBody.accessToken) {
        throw new Error('Invalid authentication response from Monnify');
      }

      const { accessToken, expiresIn } = response.data.responseBody;

      // expiresIn is in seconds. Add a safety buffer of 2 minutes.
      const bufferMs = 2 * 60 * 1000;
      this.accessToken = accessToken;
      this.tokenExpiry = Date.now() + expiresIn * 1000 - bufferMs;

      return accessToken;
    } catch (err) {
      // Avoid leaking sensitive info. Log internal details to server logs.
      console.error('Monnify getAccessToken error:', err.response?.data || err.message);
      throw new Error('Failed to authenticate with Monnify');
    }
  }

  // Create a reserved (virtual) account - use v2 endpoint
  async createReservedAccount(accountData) {
    try {
      const {
        accountReference,
        accountName,
        currencyCode = 'NGN',
        contractCode = this.contractCode,
        customerEmail,
        customerName,
        bvn,
        customerPhoneNumber
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
        ...(customerEmail && { customerEmail }),
        ...(customerName && { customerName }),
        ...(bvn && { bvn }),
        ...(customerPhoneNumber && { customerPhoneNumber })
      };

      const response = await axios.post(
        `${this.baseURL}/api/v2/bank-transfer/reserved-accounts`,
        payload,
        { headers, timeout: 10000 }
      );

      if (!response.data) {
        throw new Error('Invalid response from Monnify API');
      }

      return {
        success: !!response.data.requestSuccessful,
        data: response.data.responseBody || {},
        message: response.data.responseMessage || null
      };
    } catch (err) {
      console.error('Error creating reserved account:', err.response?.data || err.message);
      const safeMessage = err.response?.data?.responseMessage || 'Failed to create reserved account';
      throw new Error(safeMessage);
    }
  }

  // Get reserved account details (v2)
  async getReservedAccount(accountReference) {
    try {
      if (!accountReference) throw new Error('accountReference is required');

      const headers = await this.getBearerHeaders();

      const response = await axios.get(
        `${this.baseURL}/api/v2/bank-transfer/reserved-accounts/${encodeURIComponent(accountReference)}`,
        { headers, timeout: 10000 }
      );

      if (!response.data) {
        throw new Error('Invalid response from Monnify API');
      }

      return {
        success: !!response.data.requestSuccessful,
        data: response.data.responseBody || {},
        message: response.data.responseMessage || null
      };
    } catch (err) {
      console.error('Error fetching reserved account:', err.response?.data || err.message);
      const safeMessage = err.response?.data?.responseMessage || 'Failed to fetch reserved account';
      throw new Error(safeMessage);
    }
  }

  // List reserved accounts (v2, paginated)
  async listReservedAccounts(page = 0, pageSize = 10) {
    try {
      const headers = await this.getBearerHeaders();

      const response = await axios.get(
        `${this.baseURL}/api/v2/bank-transfer/reserved-accounts?page=${Number(page)}&pageSize=${Number(pageSize)}`,
        { headers, timeout: 10000 }
      );

      if (!response.data) {
        throw new Error('Invalid response from Monnify API');
      }

      return {
        success: !!response.data.requestSuccessful,
        data: response.data.responseBody || {},
        message: response.data.responseMessage || null
      };
    } catch (err) {
      console.error('Error listing reserved accounts:', err.response?.data || err.message);
      const safeMessage = err.response?.data?.responseMessage || 'Failed to list reserved accounts';
      throw new Error(safeMessage);
    }
  }

  // Deallocate reserved account (v2)
  async deallocateAccount(accountReference) {
    try {
      if (!accountReference) throw new Error('accountReference is required');

      const headers = await this.getBearerHeaders();

      const response = await axios.delete(
        `${this.baseURL}/api/v2/bank-transfer/reserved-accounts/${encodeURIComponent(accountReference)}`,
        { headers, timeout: 10000 }
      );

      if (!response.data) {
        throw new Error('Invalid response from Monnify API');
      }

      return {
        success: response.data.requestSuccessful === undefined ? true : !!response.data.requestSuccessful,
        message: response.data.responseMessage || 'Account deallocated successfully'
      };
    } catch (err) {
      console.error('Error deallocating reserved account:', err.response?.data || err.message);
      const safeMessage = err.response?.data?.responseMessage || 'Failed to deallocate account';
      throw new Error(safeMessage);
    }
  }

  // Initialize a payment (use v2 merchant init-transaction)
  async initializePayment(paymentData) {
    try {
      const {
        amount,
        customerName,
        customerEmail,
        paymentReference,
        paymentDescription = 'Payment',
        currencyCode = 'NGN',
        contractCode = this.contractCode,
        redirectUrl,
        paymentMethods = ['CARD', 'ACCOUNT_TRANSFER', 'USSD']
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
        ...(redirectUrl && { redirectUrl }),
        ...(paymentMethods && { paymentMethods })
      };

      const response = await axios.post(
        `${this.baseURL}/api/v2/merchant/transactions/init-transaction`,
        payload,
        { headers, timeout: 10000 }
      );

      if (!response.data) {
        throw new Error('Invalid response from Monnify API');
      }

      return {
        success: !!response.data.requestSuccessful,
        data: response.data.responseBody || {},
        message: response.data.responseMessage || null
      };
    } catch (err) {
      console.error('Error initializing payment:', err.response?.data || err.message);
      const safeMessage = err.response?.data?.responseMessage || 'Failed to initialize payment';
      throw new Error(safeMessage);
    }
  }

  // Verify a payment by transactionReference or paymentReference (v2 query)
  async verifyPayment(reference) {
    try {
      if (!reference) throw new Error('transactionReference or paymentReference is required');

      const headers = await this.getBearerHeaders();

      const url = `${this.baseURL}/api/v2/merchant/transactions/query`;
      // Try as transactionReference first; callers should pass the right name
      const response = await axios.get(`${url}?transactionReference=${encodeURIComponent(reference)}`, { headers, timeout: 10000 });

      if (!response.data) {
        throw new Error('Invalid response from Monnify API');
      }

      // If responseBody empty, still return safe structure
      const body = response.data.responseBody || {};

      const paymentStatus = body.paymentStatus || body.status || null;

      return {
        success: !!response.data.requestSuccessful,
        data: body,
        message: response.data.responseMessage || null,
        isPaid: paymentStatus === 'PAID' || paymentStatus === 'SUCCESS'
      };
    } catch (err) {
      // If transactionReference query failed, attempt paymentReference
      if (err.response && err.response.status === 404) {
        try {
          const headers = await this.getBearerHeaders();
          const url = `${this.baseURL}/api/v2/merchant/transactions/query?paymentReference=${encodeURIComponent(reference)}`;
          const response = await axios.get(url, { headers, timeout: 10000 });
          const body = response.data.responseBody || {};
          const paymentStatus = body.paymentStatus || body.status || null;
          return {
            success: !!response.data.requestSuccessful,
            data: body,
            message: response.data.responseMessage || null,
            isPaid: paymentStatus === 'PAID' || paymentStatus === 'SUCCESS'
          };
        } catch (err2) {
          console.error('Error verifying payment by paymentReference:', err2.response?.data || err2.message);
          throw new Error(err2.response?.data?.responseMessage || 'Failed to verify payment');
        }
      }

      console.error('Error verifying payment:', err.response?.data || err.message);
      throw new Error(err.response?.data?.responseMessage || 'Failed to verify payment');
    }
  }

  // Get transaction status by paymentReference (wrapper - v2)
  async getTransactionStatus(paymentReference) {
    try {
      if (!paymentReference) throw new Error('paymentReference is required');

      const headers = await this.getBearerHeaders();

      const response = await axios.get(
        `${this.baseURL}/api/v2/merchant/transactions/query?paymentReference=${encodeURIComponent(paymentReference)}`,
        { headers, timeout: 10000 }
      );

      if (!response.data) {
        throw new Error('Invalid response from Monnify API');
      }

      const transaction = response.data.responseBody || {};

      return {
        success: !!response.data.requestSuccessful,
        paymentReference: transaction.paymentReference,
        amount: transaction.amount || transaction.amountPaid,
        status: transaction.paymentStatus || transaction.status,
        isPaid: transaction.paymentStatus === 'PAID' || transaction.status === 'SUCCESS',
        paidAt: transaction.paidOn || transaction.settledAt || null,
        transactionReference: transaction.transactionReference,
        message: response.data.responseMessage || null
      };
    } catch (err) {
      console.error('Error getting transaction status:', err.response?.data || err.message);
      throw new Error(err.response?.data?.responseMessage || 'Failed to get transaction status');
    }
  }

  // Validate webhook signature. Use MONNIFY_WEBHOOK_SECRET when present; fallback to secretKey is possible but not recommended.
  validateWebhookSignature(payload, signature) {
    try {
      const key = this.webhookSecret || this.secretKey;
      if (!key) return false;
      if (!signature) return false;
      // payload must be a Buffer or string.
      const hmac = crypto.createHmac('sha512', key).update(payload).digest();
      const signatureBase64 = hmac.toString('base64');
      const signatureHex = hmac.toString('hex');

      // Accept the signature if it matches base64 or hex representation.
      return signature === signatureBase64 || signature === signatureHex;
    } catch (err) {
      console.error('Error validating webhook signature:', err.message);
      return false;
    }
  }

  // Process webhook payloads - map known event types to normalized objects
  async processWebhookNotification(webhookData) {
    try {
      // Monnify may use a variety of eventType names. Normalize common ones.
      const eventType = webhookData.eventType || webhookData.event || null;
      const eventData = webhookData.eventData || webhookData.data || webhookData.data || {};

      if (!eventType || !eventData) {
        throw new Error('Invalid webhook payload');
      }

      // Normalize fields from eventData
      const paymentReference = eventData.paymentReference || eventData.paymentreference || eventData.reference || null;
      const transactionReference = eventData.transactionReference || eventData.transactionreference || eventData.transaction_id || null;
      const amount = eventData.amountPaid || eventData.amount || eventData.paymentAmount || null;
      const status = (eventData.status || eventData.paymentStatus || '').toString().toUpperCase();

      // Map common eventTypes to normalized statuses
      const lowered = eventType.toString().toUpperCase();

      switch (lowered) {
        case 'SUCCESSFUL_CHARGE':
        case 'TRANSACTION_SUCCESSFUL':
        case 'TRANSACTION_SUCCESS':
        case 'SUCCESSFUL_TRANSACTION':
        case 'PAYMENT_SUCCESSFUL':
        case 'CHARGE.SUCCESS':
          return {
            eventType,
            status: 'success',
            paymentReference,
            transactionReference,
            amount,
            raw: webhookData
          };

        case 'FAILED_CHARGE':
        case 'TRANSACTION_FAILED':
        case 'PAYMENT_FAILED':
        case 'CHARGE.FAILED':
          return {
            eventType,
            status: 'failed',
            paymentReference,
            transactionReference,
            amount,
            raw: webhookData
          };

        case 'PENDING_CHARGE':
        case 'TRANSACTION_PENDING':
        case 'PENDING':
          return {
            eventType,
            status: 'pending',
            paymentReference,
            transactionReference,
            amount,
            raw: webhookData
          };

        case 'REFUND_PROCESSED':
        case 'REFUND':
        case 'REFUND_SUCCESS':
          return {
            eventType,
            status: 'refunded',
            paymentReference,
            transactionReference,
            amount,
            raw: webhookData
          };

        default:
          return {
            eventType,
            status: status || 'unknown',
            paymentReference,
            transactionReference,
            amount,
            raw: webhookData
          };
      }
    } catch (err) {
      console.error('Error processing webhook notification:', err.message);
      throw new Error('Failed to process webhook');
    }
  }

  // Check API connectivity by attempting to fetch an access token
  async checkApiStatus() {
    try {
      await this.getAccessToken();
      return true;
    } catch (err) {
      console.error('Monnify API status check failed:', err.message);
      return false;
    }
  }
}

module.exports = new MonnifyService();
