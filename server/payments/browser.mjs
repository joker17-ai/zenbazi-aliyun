import crypto from 'node:crypto';
import { createPaymentAccessToken, verifyPaymentAccessToken, PaymentError } from './shared.mjs';

export function chooseScene(provider, userAgent = '') {
  const wechat = /MicroMessenger/i.test(userAgent);
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
  if (provider === 'wechat') return wechat ? 'jsapi' : mobile ? 'h5' : 'native';
  if (provider === 'alipay' && wechat) throw new PaymentError('请点击微信右上角“…”并选择在浏览器打开，再使用支付宝付款。', { code: 'OPEN_IN_BROWSER', status: 400 });
  return mobile ? 'wap' : 'native';
}

function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(s => s.trim().split('=')));
}

export function wechatIdentity(req) {
  try {
    const value = verifyPaymentAccessToken(cookies(req).zb_wx);
    return value.purpose === 'wechat_identity' && value.appId === process.env.WECHAT_PAY_APP_ID ? value.openId : undefined;
  } catch { return undefined; }
}

export async function handleWechatOAuth(req, res, url) {
  if (req.method !== 'GET' || !['/api/payments/wechat/authorize', '/api/payments/wechat/callback'].includes(url.pathname)) return false;
  const appId = process.env.WECHAT_PAY_APP_ID;
  const secret = process.env.WECHAT_PAY_APP_SECRET;
  const origin = new URL(process.env.PAYMENT_CALLBACK_BASE_URL).origin;
  if (!appId || !secret) throw new PaymentError('微信内支付暂未开通，请稍后再试。', { status: 503 });
  const secureCookie = '; Path=/api/payments; HttpOnly; Secure; SameSite=Lax';
  res.setHeader('Cache-Control', 'no-store');
  if (url.pathname.endsWith('/authorize')) {
    const state = crypto.randomBytes(24).toString('hex');
    const token = createPaymentAccessToken({ purpose: 'wechat_oauth', state, expiresAt: Date.now() + 600000 });
    res.setHeader('Set-Cookie', `zb_wx_state=${token}; Max-Age=600${secureCookie}`);
    const params = new URLSearchParams({ appid: appId, redirect_uri: `${origin}/api/payments/wechat/callback`, response_type: 'code', scope: 'snsapi_base', state });
    res.writeHead(302, { Location: `https://open.weixin.qq.com/connect/oauth2/authorize?${params}#wechat_redirect` });
  } else {
    const token = verifyPaymentAccessToken(cookies(req).zb_wx_state);
    if (token.purpose !== 'wechat_oauth' || token.state !== url.searchParams.get('state') || !url.searchParams.get('code')) throw new PaymentError('微信授权已过期，请重新打开收银台。', { status: 400 });
    const params = new URLSearchParams({ appid: appId, secret, code: url.searchParams.get('code'), grant_type: 'authorization_code' });
    const response = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?${params}`, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (!response.ok || !data.openid || data.errcode) throw new PaymentError('微信授权未完成，请重试。', { status: 502 });
    const identity = createPaymentAccessToken({ purpose: 'wechat_identity', appId, openId: data.openid, expiresAt: Date.now() + 3600000 });
    res.setHeader('Set-Cookie', [`zb_wx=${identity}; Max-Age=3600${secureCookie}`, `zb_wx_state=; Max-Age=0${secureCookie}`]);
    res.writeHead(302, { Location: `${origin}/?checkout=resume` });
  }
  res.end();
  return true;
}
