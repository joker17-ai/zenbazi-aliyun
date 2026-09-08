import test from 'node:test';
import assert from 'node:assert/strict';
import { createPaymentService } from '../../server/payments/service.mjs';

function createRepository() {
  const orders = new Map();
  let completions = 0;
  return {
    orders,
    get completions() { return completions; },
    async getUserBySessionId(sessionId) {
      return { sessionId, sequence: 7, monthKey: '202609', couponBalance: 0, plan: 'free' };
    },
    async createOrder(order) { orders.set(order.id, { ...order }); return orders.get(order.id); },
    async updateOrder(id, patch) { Object.assign(orders.get(id), patch); return orders.get(id); },
    async getOrder(id) { return orders.get(id) || null; },
    async appendCallback() {},
    async completeOrder(id, result) {
      const order = orders.get(id);
      if (order.status === 'paid') return { order, completed: false };
      Object.assign(order, { status: 'paid', gatewayOrderNo: result.gatewayOrderNo });
      completions += 1;
      return { order, completed: true };
    }
  };
}

test('payment creation fails closed when provider is not configured', async () => {
  const service = createPaymentService({
    repository: createRepository(),
    providers: { wechat: { configured: false, missing: ['WECHAT_PAY_MCH_ID'] } },
    tokenSecret: 'test-secret-with-enough-entropy'
  });
  await assert.rejects(() => service.createOrder({ provider: 'wechat', productId: 'premium', sessionId: 'session-1' }), /not configured/i);
});

test('browser supplied amount is ignored when creating an order', async () => {
  const repository = createRepository();
  const service = createPaymentService({
    repository,
    providers: { wechat: { configured: true, async createOrder(order) { return { codeUrl: 'weixin://pay/test', gatewayOrderNo: order.id }; } } },
    tokenSecret: 'test-secret-with-enough-entropy',
    callbackBaseUrl: 'https://yuandestiny.cn'
  });
  const result = await service.createOrder({ provider: 'wechat', productId: 'premium', sessionId: 'session-1', amountMinor: 1 });
  assert.equal(result.amountMinor, 6800);
  assert.equal(repository.orders.get(result.orderId).payableMinor, 6800);
});

test('duplicate verified callbacks complete an order once', async () => {
  const repository = createRepository();
  const provider = {
    configured: true,
    async createOrder(order) { return { codeUrl: 'weixin://pay/test', gatewayOrderNo: order.id }; },
    async parseNotification() { return { orderId: [...repository.orders.keys()][0], status: 'paid', amountMinor: 6800, currency: 'CNY', gatewayOrderNo: 'WX-1' }; }
  };
  const service = createPaymentService({ repository, providers: { wechat: provider }, tokenSecret: 'test-secret-with-enough-entropy', callbackBaseUrl: 'https://yuandestiny.cn' });
  await service.createOrder({ provider: 'wechat', productId: 'premium', sessionId: 'session-1' });
  await service.handleNotification('wechat', {});
  await service.handleNotification('wechat', {});
  assert.equal(repository.completions, 1);
});
