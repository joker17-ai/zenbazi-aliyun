import crypto from 'node:crypto';
import { AlipaySdk } from 'alipay-sdk';
import { normalizePem, PaymentError, requirePaymentFields } from './shared.mjs';

export function canonicalizeAlipayParameters(params = {}) {
  return Object.entries(params)
    .filter(([key, value]) => key !== 'sign' && key !== 'sign_type' && value !== '' && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

export function verifyAlipayNotificationSignature(params, publicKey) {
  const signature = params?.sign;
  if (!signature || !publicKey) return false;
  try {
    return crypto.verify(
      'RSA-SHA256',
      Buffer.from(canonicalizeAlipayParameters(params), 'utf8'),
      publicKey,
      Buffer.from(signature, 'base64')
    );
  } catch {
    return false;
  }
}

export function getAlipayConfig(env = process.env) {
  const config = {
    appId: env.ALIPAY_APP_ID,
    sellerId: env.ALIPAY_SELLER_ID,
    privateKey: normalizePem(env.ALIPAY_PRIVATE_KEY),
    publicKey: normalizePem(env.ALIPAY_PUBLIC_KEY),
    keyType: env.ALIPAY_KEY_TYPE || 'PKCS8',
    gateway: env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do'
  };
  return { ...config, ...requirePaymentFields(config, ['appId', 'sellerId', 'privateKey', 'publicKey'], 'alipay') };
}

export function assertAlipaySellerIdentity(expectedSellerId, actualSellerId) {
  if (!expectedSellerId || actualSellerId !== expectedSellerId) {
    throw new PaymentError('Alipay seller identity mismatch', { code: 'ALIPAY_SELLER_MISMATCH', status: 400 });
  }
}

function assertConfigured(config) {
  if (!config.configured) {
    throw new PaymentError(`Alipay is not configured: ${config.missing.join(', ')}`, { code: 'ALIPAY_NOT_CONFIGURED', status: 503 });
  }
}

export function createAlipayProvider({ env = process.env, sdk } = {}) {
  const config = getAlipayConfig(env);
  let client = sdk;
  const getClient = () => {
    assertConfigured(config);
    if (!client) {
      client = new AlipaySdk({
        appId: config.appId,
        privateKey: config.privateKey,
        alipayPublicKey: config.publicKey,
        keyType: config.keyType,
        signType: 'RSA2',
        gateway: config.gateway,
        timeout: 10_000,
        camelcase: true
      });
    }
    return client;
  };
  return {
    ...config,
    async createOrder(order) {
      const data = await getClient().exec('alipay.trade.precreate', {
        notifyUrl: order.notifyUrl,
        bizContent: {
          outTradeNo: order.id,
          totalAmount: (order.payableMinor / 100).toFixed(2),
          subject: order.description,
          timeoutExpress: '15m'
        }
      });
      if (data.code !== '10000' || !data.qrCode) {
        throw new PaymentError(data.subMsg || data.msg || 'Alipay order creation failed', { code: data.subCode || 'ALIPAY_REQUEST_FAILED', status: 502 });
      }
      return { codeUrl: data.qrCode, gatewayOrderNo: data.tradeNo || null, raw: data };
    },
    async queryOrder(order) {
      const data = await getClient().exec('alipay.trade.query', { bizContent: { outTradeNo: order.id } });
      return {
        orderId: data.outTradeNo || order.id,
        gatewayOrderNo: data.tradeNo,
        status: ['TRADE_SUCCESS', 'TRADE_FINISHED'].includes(data.tradeStatus) ? 'paid' : String(data.tradeStatus || 'pending').toLowerCase(),
        amountMinor: Math.round(Number(data.totalAmount || 0) * 100),
        currency: 'CNY',
        appId: config.appId,
        raw: data
      };
    },
    async parseNotification({ params }) {
      assertConfigured(config);
      if (!verifyAlipayNotificationSignature(params, config.publicKey)) {
        throw new PaymentError('Invalid Alipay notification signature', { code: 'ALIPAY_NOTIFY_INVALID', status: 401 });
      }
      if (params.app_id !== config.appId) {
        throw new PaymentError('Alipay application identity mismatch', { code: 'ALIPAY_NOTIFY_MISMATCH', status: 400 });
      }
      assertAlipaySellerIdentity(config.sellerId, params.seller_id);
      return {
        orderId: params.out_trade_no,
        gatewayOrderNo: params.trade_no,
        status: ['TRADE_SUCCESS', 'TRADE_FINISHED'].includes(params.trade_status) ? 'paid' : String(params.trade_status || 'pending').toLowerCase(),
        amountMinor: Math.round(Number(params.total_amount || 0) * 100),
        currency: 'CNY',
        appId: params.app_id,
        eventId: params.notify_id || params.trade_no,
        raw: params
      };
    }
  };
}
