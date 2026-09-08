import { PaymentError } from './shared.mjs';

export function matchPaymentRoute(method, pathname) {
  if (method === 'GET' && pathname === '/api/payments/config') return { action: 'config' };
  if (method === 'POST' && pathname === '/api/payments/orders') return { action: 'create' };
  const statusMatch = method === 'GET' && pathname.match(/^\/api\/payments\/orders\/([A-Za-z0-9_-]{1,64})$/);
  if (statusMatch) return { action: 'status', orderId: statusMatch[1] };
  const notifyMatch = method === 'POST' && pathname.match(/^\/api\/payments\/(wechat|alipay)\/notify$/);
  if (notifyMatch) return { action: 'notify', provider: notifyMatch[1] };
  return null;
}

export function parseFormBody(raw = '') {
  return Object.fromEntries(new URLSearchParams(raw));
}

export async function readBoundedBody(req, maxBytes = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new PaymentError('Request body is too large', { code: 'PAYMENT_BODY_TOO_LARGE', status: 413 });
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
