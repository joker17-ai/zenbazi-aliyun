import test from 'node:test';
import assert from 'node:assert/strict';
import { matchPaymentRoute, parseFormBody } from '../../server/payments/http.mjs';

test('payment HTTP routes are matched without exposing arbitrary paths', () => {
  assert.deepEqual(matchPaymentRoute('GET', '/api/payments/config'), { action: 'config' });
  assert.deepEqual(matchPaymentRoute('POST', '/api/payments/orders'), { action: 'create' });
  assert.deepEqual(matchPaymentRoute('GET', '/api/payments/orders/ZB123'), { action: 'status', orderId: 'ZB123' });
  assert.deepEqual(matchPaymentRoute('POST', '/api/payments/wechat/notify'), { action: 'notify', provider: 'wechat' });
  assert.deepEqual(matchPaymentRoute('POST', '/api/payments/alipay/notify'), { action: 'notify', provider: 'alipay' });
  assert.equal(matchPaymentRoute('DELETE', '/api/payments/orders/ZB123'), null);
});

test('Alipay form parsing preserves signed values', () => {
  assert.deepEqual(parseFormBody('trade_status=TRADE_SUCCESS&total_amount=68.00&subject=%E6%B7%B1%E5%BA%A6%E8%A7%A3%E6%9E%90'), {
    trade_status: 'TRADE_SUCCESS',
    total_amount: '68.00',
    subject: '深度解析'
  });
});
