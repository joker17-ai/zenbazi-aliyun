import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  assertAlipaySellerIdentity,
  canonicalizeAlipayParameters,
  verifyAlipayNotificationSignature
} from '../../server/payments/alipay.mjs';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

test('Alipay RSA2 notification verification covers every signed field', () => {
  const payload = {
    app_id: '2026000000000000',
    out_trade_no: 'ZB2026090712345678901234567890',
    total_amount: '68.00',
    trade_status: 'TRADE_SUCCESS',
    sign_type: 'RSA2'
  };
  const signature = crypto.sign('RSA-SHA256', Buffer.from(canonicalizeAlipayParameters(payload), 'utf8'), privateKey).toString('base64');
  assert.equal(verifyAlipayNotificationSignature({ ...payload, sign: signature }, publicKey), true);
  assert.equal(verifyAlipayNotificationSignature({ ...payload, total_amount: '0.01', sign: signature }, publicKey), false);
});

test('Alipay notification seller must match the configured merchant', () => {
  assert.doesNotThrow(() => assertAlipaySellerIdentity('2088000000000000', '2088000000000000'));
  assert.throws(
    () => assertAlipaySellerIdentity('2088000000000000', '2088999999999999'),
    /seller/i
  );
});
