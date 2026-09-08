import {
  appendPaymentCallback,
  completePaymentOrder,
  createPaymentOrder,
  getPaymentOrderById,
  getUserRecordBySessionId,
  isDatabaseEnabled,
  updatePaymentOrder
} from '../database.mjs';
import { createAlipayProvider } from './alipay.mjs';
import { createWechatProvider } from './wechat.mjs';
import {
  createMerchantOrderNo,
  createPaymentAccessToken,
  getProduct,
  PaymentError,
  verifyPaymentAccessToken
} from './shared.mjs';

function createDatabaseRepository() {
  return {
    get enabled() { return isDatabaseEnabled(); },
    getUserBySessionId: getUserRecordBySessionId,
    createOrder: createPaymentOrder,
    updateOrder: updatePaymentOrder,
    getOrder: getPaymentOrderById,
    appendCallback: appendPaymentCallback,
    completeOrder: completePaymentOrder
  };
}

function normalizeBaseUrl(value = '') {
  return String(value).trim().replace(/\/+$/, '');
}

function assertRepository(repository) {
  if (repository.enabled === false) {
    throw new PaymentError('Payment database is not configured', { code: 'PAYMENT_DATABASE_REQUIRED', status: 503 });
  }
}

function assertProvider(providers, providerName) {
  const provider = providers[providerName];
  if (!provider || !['wechat', 'alipay'].includes(providerName)) {
    throw new PaymentError('Unsupported payment provider', { code: 'PAYMENT_PROVIDER_UNSUPPORTED', status: 400 });
  }
  if (!provider.configured) {
    throw new PaymentError(`${providerName} is not configured: ${(provider.missing || []).join(', ')}`, { code: 'PAYMENT_PROVIDER_NOT_CONFIGURED', status: 503 });
  }
  return provider;
}

function publicOrder(order, accessToken, codeUrl = order.responsePayload?.codeUrl || null) {
  return {
    orderId: order.id,
    provider: order.provider,
    productId: order.requestPayload?.productId || 'premium',
    status: order.status,
    amountMinor: order.amountMinor,
    couponUsedMinor: order.couponUsedMinor,
    payableMinor: order.payableMinor,
    currency: order.currency,
    codeUrl,
    expiresAt: order.requestPayload?.expiresAt,
    accessToken
  };
}

function assertPaymentMatches(order, result) {
  if (!result || result.orderId !== order.id
    || result.amountMinor !== order.payableMinor
    || result.currency !== order.currency) {
    throw new PaymentError('Provider payment does not match stored order', { code: 'PAYMENT_RESULT_MISMATCH', status: 400 });
  }
}

export function createPaymentService({
  repository = createDatabaseRepository(),
  providers = { wechat: createWechatProvider(), alipay: createAlipayProvider() },
  tokenSecret,
  callbackBaseUrl = process.env.PAYMENT_CALLBACK_BASE_URL
} = {}) {
  const callbackOrigin = normalizeBaseUrl(callbackBaseUrl);

  async function completeVerifiedOrder(providerName, result) {
    const order = await repository.getOrder(result.orderId);
    if (!order) {
      throw new PaymentError('Payment order not found', { code: 'PAYMENT_ORDER_NOT_FOUND', status: 404 });
    }
    if (order.provider !== providerName) {
      throw new PaymentError('Payment provider mismatch', { code: 'PAYMENT_RESULT_MISMATCH', status: 400 });
    }
    assertPaymentMatches(order, result);
    await repository.appendCallback({
      paymentOrderId: order.id,
      provider: providerName,
      callbackStatus: result.status,
      monthKey: order.monthKey,
      payload: { eventId: result.eventId, gatewayOrderNo: result.gatewayOrderNo, status: result.status }
    });
    if (result.status !== 'paid') return { order, completed: false };
    return repository.completeOrder(order.id, { ...result, provider: providerName });
  }

  return {
    getConfigStatus() {
      return {
        database: repository.enabled !== false,
        providers: Object.fromEntries(['wechat', 'alipay'].map((name) => [name, {
          configured: Boolean(providers[name]?.configured),
          missing: providers[name]?.missing || []
        }]))
      };
    },

    async createOrder(input = {}) {
      assertRepository(repository);
      const providerName = String(input.provider || '');
      const provider = assertProvider(providers, providerName);
      if (!callbackOrigin.startsWith('https://')) {
        throw new PaymentError('HTTPS payment callback base URL is not configured', { code: 'PAYMENT_CALLBACK_URL_REQUIRED', status: 503 });
      }
      const sessionId = String(input.sessionId || '').trim();
      if (!sessionId) {
        throw new PaymentError('Session ID is required', { code: 'PAYMENT_INPUT_INVALID', status: 400 });
      }
      const user = await repository.getUserBySessionId(sessionId);
      if (!user) {
        throw new PaymentError('Payment user session not found', { code: 'PAYMENT_USER_NOT_FOUND', status: 404 });
      }
      const product = getProduct(input.productId || 'premium');
      const couponUsedMinor = input.useCouponDeduction
        ? Math.min(Math.max(0, user.couponBalance) * 100, product.amountMinor)
        : 0;
      const payableMinor = product.amountMinor - couponUsedMinor;
      const orderId = createMerchantOrderNo();
      const expiresAtDate = new Date(Date.now() + 15 * 60_000);
      const expiresAt = expiresAtDate.toISOString();
      const order = await repository.createOrder({
        id: orderId,
        monthKey: user.monthKey,
        sequence: user.sequence,
        sessionId,
        provider: providerName,
        channel: 'domestic',
        status: 'pending',
        currency: product.currency,
        amountMinor: product.amountMinor,
        couponUsedMinor,
        payableMinor,
        planAfterSuccess: product.plan,
        requestPayload: { productId: product.id, expiresAt, useCouponDeduction: Boolean(input.useCouponDeduction) }
      });

      const tokenExpiresAt = Date.now() + 30 * 60_000;
      const accessToken = createPaymentAccessToken({ orderId, sessionId, expiresAt: tokenExpiresAt }, tokenSecret);
      if (payableMinor === 0) {
        const completed = await repository.completeOrder(orderId, {
          provider: providerName,
          currency: product.currency,
          amountMinor: 0,
          gatewayOrderNo: `COUPON-${orderId}`,
          raw: { couponOnly: true }
        });
        return publicOrder(completed.order, accessToken, null);
      }

      const gateway = await provider.createOrder({
        ...order,
        description: product.description,
        notifyUrl: `${callbackOrigin}/api/payments/${providerName}/notify`,
        expiresAt
      });
      const updated = await repository.updateOrder(orderId, {
        status: 'pending',
        gatewayOrderNo: gateway.gatewayOrderNo,
        responsePayload: { codeUrl: gateway.codeUrl }
      });
      return publicOrder(updated || { ...order, responsePayload: { codeUrl: gateway.codeUrl } }, accessToken, gateway.codeUrl);
    },

    async getOrder({ orderId, token }) {
      assertRepository(repository);
      const tokenPayload = verifyPaymentAccessToken(token, { orderId }, tokenSecret);
      let order = await repository.getOrder(orderId);
      if (!order || order.sessionId !== tokenPayload.sessionId) {
        throw new PaymentError('Payment order not found', { code: 'PAYMENT_ORDER_NOT_FOUND', status: 404 });
      }
      if (order.status === 'pending') {
        const provider = assertProvider(providers, order.provider);
        const result = await provider.queryOrder(order);
        if (result.status === 'paid') {
          const completed = await completeVerifiedOrder(order.provider, result);
          order = completed.order;
        }
      }
      return publicOrder(order, token);
    },

    async handleNotification(providerName, notification) {
      assertRepository(repository);
      const provider = assertProvider(providers, providerName);
      const result = await provider.parseNotification(notification);
      return completeVerifiedOrder(providerName, result);
    }
  };
}
