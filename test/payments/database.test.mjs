import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPaymentUserUpdated, mapPaymentOrderRecord } from '../../server/database.mjs';

test('database payment rows map to service field names', () => {
  const row = mapPaymentOrderRecord({
    id: 'ZB1',
    month_key: '202609',
    sequence: 7,
    session_id: 'session-1',
    provider: 'wechat',
    channel: 'domestic',
    status: 'pending',
    currency: 'CNY',
    amount_minor: 6800,
    coupon_used_minor: 1000,
    payable_minor: 5800,
    plan_after_success: 'paid',
    gateway_order_no: null,
    request_cipher: null,
    response_cipher: null
  });
  assert.equal(row.amountMinor, 6800);
  assert.equal(row.couponUsedMinor, 1000);
  assert.equal(row.payableMinor, 5800);
  assert.equal(row.sessionId, 'session-1');
});

test('paid entitlement completion requires a matching user record', () => {
  assert.doesNotThrow(() => assertPaymentUserUpdated(1));
  assert.throws(() => assertPaymentUserUpdated(0), /user record/i);
});
