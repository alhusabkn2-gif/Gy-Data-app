const crypto = require('crypto');
const axios = require('axios');
const { supabaseAdmin } = require('../services/supabaseService');

function hashPin(pin) {
  return crypto
    .createHash('sha256')
    .update(String(pin))
    .digest('hex');
}

const SERVICE_PERCENT_KEY = {
  data: 'data_percent',
  airtime: 'airtime_percent',
  electricity: 'electricity_percent',
  cable: 'cable_percent',
  betting: 'betting_percent',
  waec: 'waec_percent',
  jamb: 'jamb_percent',
  smile: 'smile_percent',
  internet: 'internet_percent',
};

const NETWORK_CODES = {
  MTN: '01',
  GLO: '02',
  '9MOBILE': '03',
  AIRTEL: '04',
};

const CLUBKONNECT_BASE_URL =
  process.env.CLUBKONNECT_BASE_URL ||
  'https://www.nellobytesystems.com';

function makeRequestId() {
  return `GYD${Date.now()}${crypto
    .randomBytes(4)
    .toString('hex')}`;
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function responseText(payload) {
  if (typeof payload === 'string') {
    return payload.toUpperCase();
  }

  try {
    return JSON.stringify(payload).toUpperCase();
  } catch {
    return '';
  }
}

function providerFailed(payload) {
  const text = responseText(payload);

  return (
    text.includes('FAILED') ||
    text.includes('FAILURE') ||
    text.includes('ERROR') ||
    text.includes('INVALID') ||
    text.includes('INSUFFICIENT')
  );
}

function providerSucceeded(payload) {
  if (providerFailed(payload)) {
    return false;
  }

  if (payload?.success === true) {
    return true;
  }

  if (payload?.status === true) {
    return true;
  }

  const text = responseText(payload);

  return (
    text.includes('SUCCESS') ||
    text.includes('SUCCESSFUL') ||
    text.includes('COMPLETED') ||
    text.includes('DELIVERED')
  );
}

function providerReference(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return (
    payload.ORDERID ||
    payload.OrderID ||
    payload.orderId ||
    payload.ORDER_ID ||
    payload.reference ||
    payload.Reference ||
    payload.transactionId ||
    payload.TransactionID ||
    null
  );
}

function extractPlanSize(name) {
  const match = String(name || '')
    .toLowerCase()
    .match(/(\d+(?:\.\d+)?)\s*gb/);

  return match ? Number(match[1]) : null;
}

function categoryMatches(productName, providerName) {
  const product = String(productName || '').toLowerCase();
  const provider = String(providerName || '').toLowerCase();

  if (product.includes('sme')) {
    return provider.includes('sme');
  }

  if (product.includes('corporate')) {
    return provider.includes('corporate');
  }

  if (product.includes('gifting')) {
    return (
      provider.includes('gifting') ||
      provider.includes('gift')
    );
  }

  if (product.includes('direct')) {
    return provider.includes('direct');
  }

  return true;
}

async function getClubKonnectPlans() {
  const userId = process.env.CLUBKONNECT_USER_ID;
  const apiKey = process.env.CLUBKONNECT_API_KEY;

  if (!userId || !apiKey) {
    throw new Error(
      'ClubKonnect credentials are not configured on the server'
    );
  }

  const response = await axios.get(
    `${CLUBKONNECT_BASE_URL}/APIDatabundlePlansV2.asp`,
    {
      params: {
        UserID: userId,
        APIKey: apiKey,
      },
      timeout: 30000,
    }
  );

  return response.data;
}

function findProviderPlan(plans, network, productName) {
  const networkCode =
    NETWORK_CODES[
      String(network || '').toUpperCase()
    ];

  if (!networkCode || !plans?.MOBILE_NETWORK) {
    return null;
  }

  const networkEntry = Object.entries(
    plans.MOBILE_NETWORK
  ).find(([, value]) => {
    return (
      Array.isArray(value) &&
      value.some(
        (item) => String(item.ID) === networkCode
      )
    );
  });

  if (!networkEntry) {
    return null;
  }

  const products =
    networkEntry[1]?.[0]?.PRODUCT || [];

  const localSize = extractPlanSize(productName);

  const candidates = products.filter((item) => {
    if (
      !categoryMatches(
        productName,
        item.PRODUCT_NAME
      )
    ) {
      return false;
    }

    if (localSize === null) {
      return true;
    }

    return
