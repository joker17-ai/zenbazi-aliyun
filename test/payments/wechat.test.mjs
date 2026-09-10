import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  assertWechatKeyIdentity,
  createWechatProvider,
  buildWechatAuthorization,
  decryptWechatResource,
  verifyWechatSignature
} from '../../server/payments/wechat.mjs';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

test('WeChat H5 and JSAPI orders carry scene fields and valid client signatures', async () => {
  const env = { WECHAT_PAY_APP_ID: 'wx-app', WECHAT_PAY_MCH_ID: 'merchant', WECHAT_PAY_API_V3_KEY: '1'.repeat(32), WECHAT_PAY_PRIVATE_KEY: privateKey.export({ type: 'pkcs8', format: 'pem' }), WECHAT_PAY_PUBLIC_KEY: publicKey.export({ type: 'spki', format: 'pem' }), WECHAT_PAY_SERIAL_NO: 'serial', WECHAT_PAY_PUBLIC_KEY_ID: 'key' };
  let sent;
  const provider = createWechatProvider({ env, fetchImpl: async (url, options) => {
    sent = { url, body: JSON.parse(options.body) };
    const body = JSON.stringify(url.endsWith('/jsapi') ? { prepay_id: 'prepay' } : { h5_url: 'https://wx.tenpay.com/pay?x=1' });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = crypto.sign('RSA-SHA256', Buffer.from(`${timestamp}\nnonce\n${body}\n`), privateKey).toString('base64');
    return new Response(body, { headers: { 'Wechatpay-Serial': 'key', 'Wechatpay-Timestamp': timestamp, 'Wechatpay-Nonce': 'nonce', 'Wechatpay-Signature': signature } });
  } });
  const order = { id: 'test-order', payableMinor: 6800, currency: 'CNY', notifyUrl: 'https://example.com/notify', returnUrl: 'https://example.com/?checkout=resume', expiresAt: new Date().toISOString(), clientIp: '1.2.3.4', description: 'Report' };
  const h5 = await provider.createOrder({ ...order, scene: 'h5' });
  assert.equal(sent.body.scene_info.payer_client_ip, '1.2.3.4');
  assert.equal(new URL(h5.redirectUrl).searchParams.get('redirect_url'), order.returnUrl);
  const { jsapi } = await provider.createOrder({ ...order, scene: 'jsapi', openId: 'openid' });
  assert.equal(sent.body.payer.openid, 'openid');
  assert.equal(crypto.verify('RSA-SHA256', Buffer.from(`${jsapi.appId}\n${jsapi.timeStamp}\n${jsapi.nonceStr}\n${jsapi.package}\n`), publicKey, Buffer.from(jsapi.paySign, 'base64')), true);
  await assert.rejects(() => provider.createOrder({ ...order, scene: 'jsapi' }), /授权/);
});

test('WeChat authorization signs the exact API v3 message', () => {
  const authorization = buildWechatAuthorization({
    method: 'POST',
    urlPath: '/v3/pay/transactions/native',
    body: '{"amount":{"total":6800}}',
    mchId: '1900000001',
    serialNo: 'ABC123',
    privateKey,
    timestamp: '1788750000',
    nonce: 'nonce-1'
  });
  const signature = authorization.match(/signature="([^"]+)"/)[1];
  const message = 'POST\n/v3/pay/transactions/native\n1788750000\nnonce-1\n{"amount":{"total":6800}}\n';
  assert.equal(crypto.verify('RSA-SHA256', Buffer.from(message), publicKey, Buffer.from(signature, 'base64')), true);
});

test('WeChat callback signature rejects a modified body', () => {
  const message = '1788750000\nnonce-1\n{"event_type":"TRANSACTION.SUCCESS"}\n';
  const signature = crypto.sign('RSA-SHA256', Buffer.from(message), privateKey).toString('base64');
  assert.equal(verifyWechatSignature({ timestamp: '1788750000', nonce: 'nonce-1', body: '{"event_type":"TRANSACTION.SUCCESS"}', signature, publicKey }), true);
  assert.equal(verifyWechatSignature({ timestamp: '1788750000', nonce: 'nonce-1', body: '{"event_type":"TRANSACTION.CLOSED"}', signature, publicKey }), false);
});

test('WeChat notification resource decrypts with API v3 key', () => {
  const key = '12345678901234567890123456789012';
  const nonce = '0123456789ab';
  const associatedData = 'transaction';
  const plaintext = JSON.stringify({ out_trade_no: 'order-1', trade_state: 'SUCCESS' });
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), Buffer.from(nonce));
  cipher.setAAD(Buffer.from(associatedData));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]).toString('base64');
  assert.deepEqual(decryptWechatResource({ nonce, associated_data: associatedData, ciphertext }, key), JSON.parse(plaintext));
  assert.throws(() => decryptWechatResource({ nonce, associated_data: associatedData, ciphertext }, `${key.slice(0, 31)}X`));
});

test('WeChat signed messages must use the configured public key id', () => {
  assert.doesNotThrow(() => assertWechatKeyIdentity('PUB_KEY_ID_1', { 'wechatpay-serial': 'PUB_KEY_ID_1' }));
  assert.throws(
    () => assertWechatKeyIdentity('PUB_KEY_ID_1', { 'wechatpay-serial': 'PUB_KEY_ID_2' }),
    /public key id/i
  );
});
