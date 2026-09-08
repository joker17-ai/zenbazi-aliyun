import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMerchantOrderNo,
  createPaymentAccessToken,
  getProduct,
  verifyPaymentAccessToken
} from '../../server/payments/shared.mjs';

test('payment access token only authorizes the exact order and session', () => {
  const secret = 'test-secret-with-enough-entropy';
  const token = createPaymentAccessToken({
    orderId: 'ZB2026090712345678901234567890',
    sessionId: 'session-1',
    expiresAt: Date.now() + 60_000
  }, secret);

  const payload = verifyPaymentAccessToken(token, {
    orderId: 'ZB2026090712345678901234567890',
    sessionId: 'session-1'
  }, secret);
  assert.equal(payload.sessionId, 'session-1');
  assert.throws(() => verifyPaymentAccessToken(token, {
    orderId: 'ZB2026090712345678901234567899',
    sessionId: 'session-1'
  }, secret), /invalid/i);
});

test('expired payment access token is rejected', () => {
  const secret = 'test-secret-with-enough-entropy';
  const token = createPaymentAccessToken({
    orderId: 'order-1',
    sessionId: 'session-1',
    expiresAt: Date.now() - 1
  }, secret);
  assert.throws(() => verifyPaymentAccessToken(token, {
    orderId: 'order-1',
    sessionId: 'session-1'
  }, secret), /expired/i);
});

test('premium product price is owned by the server', () => {
  assert.deepEqual(getProduct('premium'), {
    id: 'premium',
    description: '生命时空密码深度解析',
    currency: 'CNY',
    amountMinor: 6800,
    plan: 'paid'
  });
});

test('merchant order numbers fit both providers', () => {
  const orderNo = createMerchantOrderNo(new Date('2026-09-07T03:00:00Z'));
  assert.match(orderNo, /^ZB\d{14}[A-F0-9]{16}$/);
  assert.equal(orderNo.length, 32);
});
