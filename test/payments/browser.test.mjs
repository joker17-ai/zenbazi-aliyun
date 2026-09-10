import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseScene, wechatIdentity, handleWechatOAuth } from '../../server/payments/browser.mjs';
import { createAlipayProvider } from '../../server/payments/alipay.mjs';

test('desktop and mobile choose the appropriate direct payment scene', () => {
  assert.equal(chooseScene('wechat', 'Windows Chrome'), 'native');
  assert.equal(chooseScene('wechat', 'iPhone Safari'), 'h5');
  assert.equal(chooseScene('wechat', 'Android MicroMessenger'), 'jsapi');
  assert.equal(chooseScene('alipay', 'Android Chrome'), 'wap');
  assert.equal(chooseScene('alipay', 'Windows Chrome'), 'native');
  assert.throws(() => chooseScene('alipay', 'MicroMessenger'), /浏览器/);
});

test('untrusted openid cookies cannot authorize a payer', () => {
  assert.equal(wechatIdentity({ headers: { cookie: 'zb_wx=fake.openid' } }), undefined);
});

test('unrelated GET routes never initiate OAuth or read merchant credentials', async () => {
  assert.equal(await handleWechatOAuth({ method: 'GET' }, {}, new URL('https://example.com/')), false);
});

test('Alipay mobile payment uses signed wap request with server amount and return URL', async () => {
  let captured;
  const provider = createAlipayProvider({ env: { ALIPAY_APP_ID: 'app', ALIPAY_SELLER_ID: 'seller', ALIPAY_PRIVATE_KEY: 'private', ALIPAY_PUBLIC_KEY: 'public' }, sdk: { pageExec(...args) { captured = args; return 'https://openapi.alipay.com/gateway.do?signed=yes'; } } });
  const result = await provider.createOrder({ scene: 'wap', id: 'order', payableMinor: 6800, description: 'Report', notifyUrl: 'https://example.com/notify', returnUrl: 'https://example.com/?checkout=resume' });
  assert.equal(captured[0], 'alipay.trade.wap.pay');
  assert.equal(captured[2].bizContent.totalAmount, '68.00');
  assert.equal(captured[2].bizContent.productCode, 'QUICK_WAP_WAY');
  assert.equal(captured[2].returnUrl, 'https://example.com/?checkout=resume');
  assert.match(result.redirectUrl, /^https:/);
});
