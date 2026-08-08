*** Begin Patch
*** Update File: backend/services/monnifyService.js
@@
   constructor() {
@@
     this.tokenExpiry = null; // timestamp in ms
   }
+
+  // Centralized axios request wrapper: retries once on 401 by clearing cached token
+  async _request(config, retry = true) {
+    try {
+      return await axios(config);
+    } catch (err) {
+      const status = err.response?.status;
+      // If unauthorized, clear token and retry once (useful if token expired)
+      if ((status === 401 || status === 403) && retry) {
+        this.accessToken = null;
+        this.tokenExpiry = null;
+        try {
+          // ensure new token
+          const token = await this.getAccessToken();
+          config.headers = Object.assign({}, config.headers || {}, { Authorization: `Bearer ${token}` });
+          return await this._request(config, false);
+        } catch (err2) {
+          // fall through to original error handling
+        }
+      }
+      throw err;
+    }
+  }
@@
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
+        ,
+        allocationPercentage,
+        incomeSplitConfig
       } = accountData;
@@
-      const response = await axios.post(
-        `${this.baseURL}/api/v2/bank-transfer/reserved-accounts`,
-        payload,
-        { headers, timeout: 10000 }
-      );
+      const response = await this._request({
+        method: 'post',
+        url: `${this.baseURL}/api/v2/bank-transfer/reserved-accounts`,
+        data: payload,
+        headers,
+        timeout: 10000
+      });
@@
   async getReservedAccount(accountReference) {
@@
-      const response = await axios.get(
-        `${this.baseURL}/api/v2/bank-transfer/reserved-accounts/${encodeURIComponent(accountReference)}`,
-        { headers, timeout: 10000 }
-      );
+      const response = await this._request({
+        method: 'get',
+        url: `${this.baseURL}/api/v2/bank-transfer/reserved-accounts/${encodeURIComponent(accountReference)}`,
+        headers,
+        timeout: 10000
+      });
@@
   async listReservedAccounts(page = 0, pageSize = 10) {
@@
-      const response = await axios.get(
-        `${this.baseURL}/api/v2/bank-transfer/reserved-accounts?page=${Number(page)}&pageSize=${Number(pageSize)}`,
-        { headers, timeout: 10000 }
-      );
+      const response = await this._request({
+        method: 'get',
+        url: `${this.baseURL}/api/v2/bank-transfer/reserved-accounts?page=${Number(page)}&pageSize=${Number(pageSize)}`,
+        headers,
+        timeout: 10000
+      });
@@
   async deallocateAccount(accountReference) {
@@
-      const response = await axios.delete(
-        `${this.baseURL}/api/v2/bank-transfer/reserved-accounts/${encodeURIComponent(accountReference)}`,
-        { headers, timeout: 10000 }
-      );
+      const response = await this._request({
+        method: 'delete',
+        url: `${this.baseURL}/api/v2/bank-transfer/reserved-accounts/${encodeURIComponent(accountReference)}`,
+        headers,
+        timeout: 10000
+      });
@@
   async initializePayment(paymentData) {
@@
-      const response = await axios.post(
-        `${this.baseURL}/api/v2/merchant/transactions/init-transaction`,
-        payload,
-        { headers, timeout: 10000 }
-      );
+      const response = await this._request({
+        method: 'post',
+        url: `${this.baseURL}/api/v2/merchant/transactions/init-transaction`,
+        data: payload,
+        headers,
+        timeout: 10000
+      });
@@
   async verifyPayment(reference) {
     try {
       if (!reference) throw new Error('transactionReference or paymentReference is required');
 
       const headers = await this.getBearerHeaders();
-      
-      const url = `${this.baseURL}/api/v2/merchant/transactions/query`;
-      // Try as transactionReference first; callers should pass the right name
-      const response = await axios.get(`${url}?transactionReference=${encodeURIComponent(reference)}`, { headers, timeout: 10000 });
+      const urlBase = `${this.baseURL}/api/v2/merchant/transactions/query`;
+
+      // Primary: transactionReference
+      const tryUrl = `${urlBase}?transactionReference=${encodeURIComponent(reference)}`;
+
+      const response = await this._request({ method: 'get', url: tryUrl, headers, timeout: 10000 });
@@
     } catch (err) {
-      // If transactionReference query failed, attempt paymentReference
-      if (err.response && err.response.status === 404) {
-        try {
-          const headers = await this.getBearerHeaders();
-          const url = `${this.baseURL}/api/v2/merchant/transactions/query?paymentReference=${encodeURIComponent(reference)}`;
-          const response = await axios.get(url, { headers, timeout: 10000 });
-          const body = response.data.responseBody || {};
-          const paymentStatus = body.paymentStatus || body.status || null;
-          return {
-            success: !!response.data.requestSuccessful,
-            data: body,
-            message: response.data.responseMessage || null,
-            isPaid: paymentStatus === 'PAID' || paymentStatus === 'SUCCESS'
-          };
-        } catch (err2) {
-          console.error('Error verifying payment by paymentReference:', err2.response?.data || err2.message);
-          throw new Error(err2.response?.data?.responseMessage || 'Failed to verify payment');
-        }
-      }
-
-      console.error('Error verifying payment:', err.response?.data || err.message);
-      throw new Error(err.response?.data?.responseMessage || 'Failed to verify payment');
+      // try paymentReference fallback for common "not found" scenarios or if first attempt failed
+      try {
+        const headers = await this.getBearerHeaders();
+        const url = `${this.baseURL}/api/v2/merchant/transactions/query?paymentReference=${encodeURIComponent(reference)}`;
+        const response = await this._request({ method: 'get', url, headers, timeout: 10000 });
+        const body = response.data?.responseBody || {};
+        const paymentStatus = body.paymentStatus || body.status || null;
+        return {
+          success: !!response.data.requestSuccessful,
+          data: body,
+          message: response.data.responseMessage || null,
+          isPaid: paymentStatus === 'PAID' || paymentStatus === 'SUCCESS'
+        };
+      } catch (err2) {
+        console.error('Error verifying payment (both transactionReference and paymentReference attempts):', err2.response?.data || err2.message);
+        throw new Error(err2.response?.data?.responseMessage || 'Failed to verify payment');
+      }
     }
   }
@@
   validateWebhookSignature(payload, signature) {
-    try {
-      const key = this.webhookSecret || this.secretKey;
-      if (!key) return false;
-      if (!signature) return false;
-      // payload must be a Buffer or string.
-      const hmac = crypto.createHmac('sha512', key).update(payload).digest();
-      const signatureBase64 = hmac.toString('base64');
-      const signatureHex = hmac.toString('hex');
-
-      // Accept the signature if it matches base64 or hex representation.
-      return signature === signatureBase64 || signature === signatureHex;
-    } catch (err) {
-      console.error('Error validating webhook signature:', err.message);
-      return false;
-    }
+    try {
+      const key = this.webhookSecret || this.secretKey;
+      if (!key) return false;
+      if (!signature) return false;
+
+      // Normalize signature: allow forms like "sha512=..." or just encoded string
+      const rawSig = signature.toString().trim().replace(/^sha512[:=]\s*/i, '');
+
+      // Ensure payload is Buffer
+      const payloadBuffer = Buffer.isBuffer(payload)
+        ? payload
+        : Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload));
+
+      const hmac = crypto.createHmac('sha512', key).update(payloadBuffer).digest();
+
+      // Try hex comparison
+      const hex = hmac.toString('hex');
+      if (rawSig.length === hex.length) {
+        const incoming = Buffer.from(rawSig, 'utf8');
+        const expected = Buffer.from(hex, 'utf8');
+        if (incoming.length === expected.length && crypto.timingSafeEqual(incoming, expected)) return true;
+      }
+
+      // Try base64 comparison (common)
+      const b64 = hmac.toString('base64');
+      if (rawSig.length === b64.length) {
+        const incoming = Buffer.from(rawSig, 'utf8');
+        const expected = Buffer.from(b64, 'utf8');
+        if (incoming.length === expected.length && crypto.timingSafeEqual(incoming, expected)) return true;
+      }
+
+      // Try decoding incoming as base64 and comparing raw bytes (robust)
+      try {
+        const incomingDecoded = Buffer.from(rawSig, 'base64');
+        if (incomingDecoded.length === hmac.length && crypto.timingSafeEqual(incomingDecoded, hmac)) return true;
+      } catch (e) {
+        // ignore decode errors
+      }
+
+      return false;
+    } catch (err) {
+      console.error('Error validating webhook signature:', err.message);
+      return false;
+    }
   }
*** End Patch
