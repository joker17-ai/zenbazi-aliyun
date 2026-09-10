import crypto from 'node:crypto';
import { normalizePem, PaymentError, requirePaymentFields } from './shared.mjs';

const WECHAT_API_ORIGIN = 'https://api.mch.weixin.qq.com';

export function getWechatConfig(env = process.env) {
  const config = {
    appId: env.WECHAT_PAY_APP_ID,
    mchId: env.WECHAT_PAY_MCH_ID,
    apiV3Key: env.WECHAT_PAY_API_V3_KEY,
    privateKey: normalizePem(env.WECHAT_PAY_PRIVATE_KEY),
    serialNo: env.WECHAT_PAY_SERIAL_NO,
    publicKey: normalizePem(env.WECHAT_PAY_PUBLIC_KEY),
    publicKeyId: env.WECHAT_PAY_PUBLIC_KEY_ID
  };
  return { ...config, ...requirePaymentFields(config, ['appId', 'mchId', 'apiV3Key', 'privateKey', 'serialNo', 'publicKey', 'publicKeyId'], 'wechat') };
}

export function buildWechatAuthorization({ method, urlPath, body = '', mchId, serialNo, privateKey, timestamp = String(Math.floor(Date.now() / 1000)), nonce = crypto.randomBytes(16).toString('hex') }) {
  const message = `${String(method).toUpperCase()}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(message), privateKey).toString('base64');
  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${serialNo}",signature="${signature}"`;
}

export function verifyWechatSignature({ timestamp, nonce, body, signature, publicKey }) {
  if (!timestamp || !nonce || !body || !signature || !publicKey) return false;
  const message = `${timestamp}\n${nonce}\n${body}\n`;
  try {
    return crypto.verify('RSA-SHA256', Buffer.from(message), publicKey, Buffer.from(signature, 'base64'));
  } catch {
    return false;
  }
}

export function decryptWechatResource(resource, apiV3Key) {
  const key = Buffer.from(String(apiV3Key), 'utf8');
  if (key.length !== 32) {
    throw new PaymentError('WeChat API v3 key must be 32 bytes', { code: 'WECHAT_KEY_INVALID', status: 503 });
  }
  const encrypted = Buffer.from(resource.ciphertext, 'base64');
  if (encrypted.length <= 16) {
    throw new PaymentError('Invalid WeChat encrypted resource', { code: 'WECHAT_NOTIFY_INVALID', status: 400 });
  }
  const ciphertext = encrypted.subarray(0, -16);
  const authTag = encrypted.subarray(-16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(resource.nonce, 'utf8'));
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(resource.associated_data || '', 'utf8'));
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  return JSON.parse(plaintext);
}

function getHeader(headers, name) {
  if (typeof headers?.get === 'function') return headers.get(name);
  const target = name.toLowerCase();
  const entry = Object.entries(headers || {}).find(([key]) => key.toLowerCase() === target);
  return entry?.[1];
}

export function assertWechatKeyIdentity(expectedPublicKeyId, headers) {
  const signedKeyId = getHeader(headers, 'Wechatpay-Serial');
  if (!expectedPublicKeyId || signedKeyId !== expectedPublicKeyId) {
    throw new PaymentError('WeChat Pay public key id mismatch', { code: 'WECHAT_KEY_ID_MISMATCH', status: 401 });
  }
}

function assertConfigured(config) {
  if (!config.configured) {
    throw new PaymentError(`WeChat Pay is not configured: ${config.missing.join(', ')}`, { code: 'WECHAT_NOT_CONFIGURED', status: 503 });
  }
}

async function callWechatApi({ method, path, body, config, fetchImpl }) {
  assertConfigured(config);
  const bodyText = body ? JSON.stringify(body) : '';
  const authorization = buildWechatAuthorization({
    method,
    urlPath: path,
    body: bodyText,
    mchId: config.mchId,
    serialNo: config.serialNo,
    privateKey: config.privateKey
  });
  const response = await fetchImpl(`${WECHAT_API_ORIGIN}${path}`, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: authorization },
    body: bodyText || undefined,
    signal: AbortSignal.timeout(10_000)
  });
  const responseText = await response.text();
  assertWechatKeyIdentity(config.publicKeyId, response.headers);
  const signatureValid = verifyWechatSignature({
    timestamp: getHeader(response.headers, 'Wechatpay-Timestamp'),
    nonce: getHeader(response.headers, 'Wechatpay-Nonce'),
    body: responseText,
    signature: getHeader(response.headers, 'Wechatpay-Signature'),
    publicKey: config.publicKey
  });
  if (!signatureValid) {
    throw new PaymentError('Invalid WeChat Pay response signature', { code: 'WECHAT_RESPONSE_INVALID', status: 502 });
  }
  const data = responseText ? JSON.parse(responseText) : {};
  if (!response.ok) {
    throw new PaymentError(data.message || 'WeChat Pay request failed', { code: data.code || 'WECHAT_REQUEST_FAILED', status: 502 });
  }
  return data;
}

export function createWechatProvider({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const config = getWechatConfig(env);
  return {
    ...config,
    async createOrder(order) {
      const scene = order.scene || 'native';
      if (!['native', 'h5', 'jsapi'].includes(scene)) throw new PaymentError('Invalid payment scene', { status: 400 });
      if (scene === 'jsapi' && !order.openId) throw new PaymentError('请先完成微信身份授权', { status: 400 });
      const data = await callWechatApi({
        method: 'POST',
        path: `/v3/pay/transactions/${scene}`,
        config,
        fetchImpl,
        body: {
          appid: config.appId,
          mchid: config.mchId,
          description: order.description,
          out_trade_no: order.id,
          notify_url: order.notifyUrl,
          time_expire: order.expiresAt,
          amount: { total: order.payableMinor, currency: order.currency },
          ...(scene === 'h5' ? { scene_info: { payer_client_ip: order.clientIp, h5_info: { type: 'Wap' } } } : {}),
          ...(scene === 'jsapi' ? { payer: { openid: order.openId } } : {})
        }
      });
      let jsapi;
      if (scene === 'jsapi') {
        if (!data.prepay_id) throw new PaymentError('Missing prepay id', { status: 502 });
        jsapi = { appId: config.appId, timeStamp: String(Math.floor(Date.now() / 1000)), nonceStr: crypto.randomBytes(16).toString('hex'), package: `prepay_id=${data.prepay_id}`, signType: 'RSA' };
        jsapi.paySign = crypto.sign('RSA-SHA256', Buffer.from(`${jsapi.appId}\n${jsapi.timeStamp}\n${jsapi.nonceStr}\n${jsapi.package}\n`), config.privateKey).toString('base64');
      }
      return { codeUrl: data.code_url, redirectUrl: data.h5_url ? `${data.h5_url}&redirect_url=${encodeURIComponent(order.returnUrl)}` : undefined, jsapi, gatewayOrderNo: null, raw: data };
    },
    async queryOrder(order) {
      const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(order.id)}?mchid=${encodeURIComponent(config.mchId)}`;
      const data = await callWechatApi({ method: 'GET', path, config, fetchImpl });
      return {
        orderId: data.out_trade_no,
        gatewayOrderNo: data.transaction_id,
        status: data.trade_state === 'SUCCESS' ? 'paid' : String(data.trade_state || 'pending').toLowerCase(),
        amountMinor: Number(data.amount?.total || 0),
        currency: data.amount?.currency || 'CNY',
        appId: data.appid,
        mchId: data.mchid,
        raw: data
      };
    },
    async parseNotification({ headers, body }) {
      assertConfigured(config);
      assertWechatKeyIdentity(config.publicKeyId, headers);
      const valid = verifyWechatSignature({
        timestamp: getHeader(headers, 'Wechatpay-Timestamp'),
        nonce: getHeader(headers, 'Wechatpay-Nonce'),
        body,
        signature: getHeader(headers, 'Wechatpay-Signature'),
        publicKey: config.publicKey
      });
      if (!valid) {
        throw new PaymentError('Invalid WeChat Pay notification signature', { code: 'WECHAT_NOTIFY_INVALID', status: 401 });
      }
      const notification = JSON.parse(body);
      const data = decryptWechatResource(notification.resource, config.apiV3Key);
      if (data.appid !== config.appId || data.mchid !== config.mchId) {
        throw new PaymentError('WeChat merchant identity mismatch', { code: 'WECHAT_NOTIFY_MISMATCH', status: 400 });
      }
      return {
        orderId: data.out_trade_no,
        gatewayOrderNo: data.transaction_id,
        status: data.trade_state === 'SUCCESS' ? 'paid' : String(data.trade_state || 'pending').toLowerCase(),
        amountMinor: Number(data.amount?.total || 0),
        currency: data.amount?.currency || 'CNY',
        appId: data.appid,
        mchId: data.mchid,
        eventId: notification.id,
        raw: data
      };
    }
  };
}
