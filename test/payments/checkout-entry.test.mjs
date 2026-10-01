import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('QR area provides a direct order-generation button instead of a blank image placeholder', () => {
  const app = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
  assert.ok(app.includes('生成微信付款二维码'));
  assert.ok(!app.includes("const paymentQrSrc = '';"));
  const area = app.slice(app.indexOf('{/* 真实收款二维码显示区域 */}'), app.indexOf('{/* 真实收款二维码显示区域 */}') + 2300);
  assert.match(area, /onClick=\{handlePremiumPayment\}/);
  assert.match(area, /disabled=\{isPaymentSubmitting\}/);
  assert.match(area, /role="alert"/);
});
