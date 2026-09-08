import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  assertWechatKeyIdentity,
  buildWechatAuthorization,
  decryptWechatResource,
  verifyWechatSignature
} from '../../server/payments/wechat.mjs';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

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
