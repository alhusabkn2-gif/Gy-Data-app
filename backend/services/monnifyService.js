const axios = require('axios');
const crypto = require('crypto');

class MonnifyService {
  constructor() {
    this.baseURL = (
      process.env.MONNIFY_BASE_URL || 'https://api.monnify.com'
    ).replace(/\/+$/, '');

    this.apiKey = process.env.MONNIFY_API_KEY;
    this.secretKey = process.env.MONNIFY_SECRET_KEY;
    this.contractCode = process.env.MONNIFY_CONTRACT_CODE;

    if (!this.apiKey || !this.secretKey || !this.contractCode) {
      throw new Error(
        'Monnify credentials are not properly configured in environment variables'
      );
    }

    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  getBasicAuth() {
    return Buffer.from(
      `${this.apiKey}:${this.secretKey}`
    ).toString('base64');
  }

  async getAccessToken() {
    if (
      this.accessToken &&
      this.tokenExpiry &&
      Date.now() < this.tokenExpiry
    ) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/auth/login`,
        null,
        {
          headers: {
            Authorization: `Basic ${this.getBasicAuth()}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const body = response.data;

      if (
        !body?.requestSuccessful ||
        !body?.responseBody?.accessToken
      ) {
        throw new Error(
          body?.responseMessage || 'Monnify authentication failed'
        );
      }

      const { accessToken, expiresIn = 3600 } = body.responseBody;

      this.accessToken = accessToken;

      // Refresh 5 minutes before expiry.
      this.tokenExpiry =
        Date.now() + Math.max(expiresIn - 300, 60) * 1000;

      return accessToken;
    } catch (error) {
      this.accessToken = null;
      this.tokenExpiry = 0;

      const message =
        error.response?.data?.responseMessage ||
        error.message ||
        'Authentication failed';

      throw new Error(`Failed to authenticate with Monnify: ${message}`);
    }
  }

  async request(config, retry = true) {
    try {
      const token = await this.getAccessToken();

      const response = await axios({
        ...config,
        baseURL: this.baseURL,
        headers: {
          'Content-Type': 'application/json',
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`
        },
        timeout: config.timeout || 30000
      });

      return response;
    } catch (error) {
      const status = error.response?.status;

      if (retry && (status === 401 || status === 403)) {
        this.accessToken = null;
        this.tokenExpiry = 0;

        return this.request(config, false);
      }

      const message =
        error.response?.data?.responseMessage ||
        error.message ||
        'Monnify request failed';

      const wrapped = new Error(message);
      wrapped.statusCode = status || 500;
      wrapped.monnifyResponse = error.response?.data;

      throw wrapped;
    }
  }

  normalizeResponse(response) {
    const body = response.data;

    if (!body?.requestSuccessful) {
      throw new Error(
        body?.responseMessage || 'Monnify request was unsuccessful'
      );
    }

    return {
      success: true,
      data: body.responseBody,
      message: body.responseMessage,
      responseCode: body.responseCode
    };
  }

  async createReservedAccount(accountData) {
    const {
      accountReference,
      accountName,
      customerEmail,
      customerBvn,
      customerNin,
      currencyCode = 'NGN',
      getAllAvailableBanks = false,
      preferredBanks,
      incomeSplitConfig,
      restrictPaymentSource,
      allowedPaymentSources
    } = accountData;

    if (!accountReference || !accountName) {
      throw new Error(
        'accountReference and accountName are required'
      );
    }

    if (!customerBvn && !customerNin) {
      throw new Error(
        'customerBvn or customerNin is required for a reserved account'
      );
    }

    const payload = {
      accountReference,
      accountName,
      customerEmail,
      customerBvn,
      customerNin,
      currencyCode,
      contractCode: this.contractCode,
      getAllAvailableBanks
    };

    if (Array.isArray(preferredBanks) && preferredBanks.length) {
      payload.preferredBanks = preferredBanks;
    }

    if (Array.isArray(incomeSplitConfig)) {
      payload.incomeSplitConfig = incomeSplitConfig;
    }

    if (restrictPaymentSource !== undefined) {
      payload.restrictPaymentSource = restrictPaymentSource;
    }

    if (allowedPaymentSources) {
      payload.allowedPaymentSources = allowedPaymentSources;
    }

    const response = await this.request({
      method: 'POST',
      url: '/api/v2/bank-transfer/reserved-accounts',
      data: payload
    });

    return this.normalizeResponse(response);
  }

  async getReservedAccount(accountReference) {
    if (!accountReference) {
      throw new Error('accountReference is required');
    }

    const response = await this.request({
      method: 'GET',
      url: `/api/v2/bank-transfer/reserved-accounts/${encodeURIComponent(
        accountReference
      )}`
    });

    return this.normalizeResponse(response);
  }

  async listReservedAccounts(page = 0, pageSize = 10) {
    const safePage = Number.isInteger(page) && page >= 0 ? page : 0;
    const safePageSize =
      Number.isInteger(pageSize) &&
      pageSize > 0 &&
      pageSize <= 100
        ? pageSize
        : 10;

    const response = await this.request({
      method: 'GET',
      url: '/api/v2/bank-transfer/reserved-accounts',
      params: {
        page: safePage,
        pageSize: safePageSize
      }
    });

    return this.normalizeResponse(response);
  }

  async deallocateAccount(accountReference) {
    if (!accountReference) {
      throw new Error('accountReference is required');
    }

    const response = await this.request({
      method: 'DELETE',
      url: `/api/v1/bank-transfer/reserved-accounts/reference/${encodeURIComponent(
        accountReference
      )}`
    });

    return {
      success: response.data?.requestSuccessful ?? true,
      message:
        response.data?.responseMessage ||
        'Account deallocated successfully',
      data: response.data?.responseBody
    };
  }

  async initializePayment(paymentData) {
    const {
      amount,
      customerName,
      customerEmail,
      paymentReference,
      paymentDescription = 'Payment from Gy-Data App',
      currencyCode = 'NGN',
      redirectUrl,
      paymentMethods,
      incomeSplitConfig
    } = paymentData;

    if (
      amount === undefined ||
      amount === null ||
      !customerName ||
      !customerEmail ||
      !paymentReference
    ) {
      throw new Error(
        'amount, customerName, customerEmail, and paymentReference are required'
      );
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new Error('amount must be a positive number');
    }

    const payload = {
      amount: Number(amount),
      customerName,
      customerEmail,
      paymentReference,
      paymentDescription,
      currencyCode,
      contractCode: this.contractCode
    };

    if (redirectUrl) {
      payload.redirectUrl = redirectUrl;
    }

    if (Array.isArray(paymentMethods) && paymentMethods.length) {
      payload.paymentMethods = paymentMethods;
    }

    if (Array.isArray(incomeSplitConfig)) {
      payload.incomeSplitConfig = incomeSplitConfig;
    }

    const response = await this.request({
      method: 'POST',
      url: '/api/v1/merchant/transactions/init-transaction',
      data: payload
    });

    return this.normalizeResponse(response);
  }

  async verifyPayment(transactionReference) {
    if (!transactionReference) {
      throw new Error('transactionReference is required');
    }

    const response = await this.request({
      method: 'GET',
      url: '/api/v2/merchant/transactions/query',
      params: {
        transactionReference
      }
    });

    return this.normalizeResponse(response);
  }

  async getTransactionStatus(paymentReference) {
    if (!paymentReference) {
      throw new Error('paymentReference is required');
    }

    const response = await this.request({
      method: 'GET',
      url: '/api/v2/merchant/transactions/query',
      params: {
        paymentReference
      }
    });

    const result = this.normalizeResponse(response);
    const transaction = result.data || {};

    return {
      ...result,
      paymentReference: transaction.paymentReference,
      transactionReference: transaction.transactionReference,
      amount: transaction.amountPaid,
      amountPaid: transaction.amountPaid,
      totalPayable: transaction.totalPayable,
      status: transaction.paymentStatus,
      isPaid: transaction.paymentStatus === 'PAID',
      paidAt: transaction.paidOn
    };
  }

  validateWebhookSignature(payload, signature) {
    if (!signature || !this.secretKey) {
      return false;
    }

    try {
      const bodyBuffer = Buffer.isBuffer(payload)
        ? payload
        : Buffer.from(payload);

      // Monnify documents SHA-512(clientSecret + requestBody).
      const expected = crypto
        .createHash('sha512')
        .update(this.secretKey)
        .update(bodyBuffer)
        .digest('hex');

      const received = String(signature)
        .trim()
        .replace(/^sha512=/i, '')
        .trim()
        .toLowerCase();

      if (!/^[a-f0-9]{128}$/.test(received)) {
        return false;
      }

      const expectedBuffer = Buffer.from(expected, 'hex');
      const receivedBuffer = Buffer.from(received, 'hex');

      return (
        expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(
          expectedBuffer,
          receivedBuffer
        )
      );
    } catch (error) {
      return false;
    }
  }

  async processWebhookNotification(webhookData) {
    const { eventType, eventData } = webhookData || {};

    if (!eventType || !eventData) {
      throw new Error('Invalid webhook data structure');
    }

    switch (eventType) {
      case 'SUCCESSFUL_TRANSACTION':
        return {
          eventType,
          status: 'success',
          transactionReference:
            eventData.transactionReference,
          paymentReference: eventData.paymentReference,
          amountPaid: eventData.amountPaid,
          totalPayable: eventData.totalPayable,
          paymentStatus: eventData.paymentStatus,
          paymentMethod: eventData.paymentMethod,
          currency: eventData.currency,
          paidOn: eventData.paidOn,
          customer: eventData.customer,
          product: eventData.product
        };

      case 'FAILED_TRANSACTION':
        return {
          eventType,
          status: 'failed',
          transactionReference:
            eventData.transactionReference,
          paymentReference: eventData.paymentReference,
          amountPaid: eventData.amountPaid,
          paymentStatus: eventData.paymentStatus
        };

      case 'SUCCESSFUL_REFUND':
      case 'FAILED_REFUND':
        return {
          eventType,
          status:
            eventType === 'SUCCESSFUL_REFUND'
              ? 'refunded'
              : 'refund_failed',
          transactionReference:
            eventData.transactionReference,
          refundReference: eventData.refundReference,
          refundAmount: eventData.refundAmount,
          refundStatus: eventData.refundStatus
        };

      default:
        return {
          eventType,
          status: 'received',
          data: eventData
        };
    }
  }

  async checkApiStatus() {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error(
        'Monnify API status check failed:',
        error.message
      );
      return false;
    }
  }
}

module.exports = new MonnifyService();
