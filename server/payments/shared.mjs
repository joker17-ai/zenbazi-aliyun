import crypto from 'node:crypto';

const PRODUCTS = Object.freeze({
  premium: Object.freeze({
    id: 'premium',
    description: '生命时空密码深度解析',
    currency: 'CNY',
    amountMinor: 6800,
    plan: 'paid'
  })
});

export class PaymentError extends Error {
  constructor(message, { code = 'PAYMENT_ERROR', status = 400, cause } = {}) {
    super(message, { cause });
    this.name = 'PaymentError';
    this.code = code;
    this.status = status;
  }
}

export function normalizePem(value = '') {
  return String(value).trim().replace(/\\n/g, '\n');
}

export function getProduct(productId = 'premium') {
  const product = PRODUCTS[productId];
  if (!product) {
    throw new PaymentError('Unsupported payment product', { code: 'PRODUCT_NOT_FOUND', status: 404 });
  }
  return { ...product };
}

export function createMerchantOrderNo(date = new Date()) {
  const digits = date.toISOString().replace(/\D/g, '').slice(0, 14);
  return `ZB${digits}${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

function getTokenSecret(explicitSecret) {
  const secret = explicitSecret || process.env.PAYMENT_TOKEN_SECRET;
  if (!secret || secret.length < 24) {
    throw new PaymentError('Payment token secret is not configured', { code: 'PAYMENT_NOT_CONFIGURED', status: 503 });
  }
  return secret;
}

function signTokenPayload(encoded, secret) {
  return crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
}

function constantTimeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createPaymentAccessToken(payload, explicitSecret) {
  const secret = getTokenSecret(explicitSecret);
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encoded}.${signTokenPayload(encoded, secret)}`;
}

export function verifyPaymentAccessToken(token, expected = {}, explicitSecret) {
  const secret = getTokenSecret(explicitSecret);
  const [encoded, signature] = String(token || '').split('.');
  if (!encoded || !signature || !constantTimeEqual(signature, signTokenPayload(encoded, secret))) {
    throw new PaymentError('Invalid payment access token', { code: 'PAYMENT_TOKEN_INVALID', status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    throw new PaymentError('Invalid payment access token', { code: 'PAYMENT_TOKEN_INVALID', status: 401 });
  }
  if (!payload.expiresAt || payload.expiresAt <= Date.now()) {
    throw new PaymentError('Payment access token expired', { code: 'PAYMENT_TOKEN_EXPIRED', status: 401 });
  }
  if ((expected.orderId && payload.orderId !== expected.orderId)
    || (expected.sessionId && payload.sessionId !== expected.sessionId)) {
    throw new PaymentError('Invalid payment access token', { code: 'PAYMENT_TOKEN_INVALID', status: 401 });
  }
  return payload;
}

export function requirePaymentFields(config, fields, provider) {
  const missing = fields.filter((field) => !config[field]);
  return {
    configured: missing.length === 0,
    missing,
    provider
  };
}
