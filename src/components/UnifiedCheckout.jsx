import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export async function paymentRequest(path, body) {
  const response = await fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(response.status === 503 ? '支付服务暂未开通，请稍后再试。' : data.error || '付款请求未完成，请重试。');
  return data;
}

export default function UnifiedCheckout({ order, onPaid, onClose }) {
  const [qr, setQr] = useState('');
  const [message, setMessage] = useState('等待付款，付款后将自动打开报告。');
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    let active = true;
    if (order.codeUrl) QRCode.toDataURL(order.codeUrl, { width: 280, margin: 2 }).then(url => { if (active) setQr(url); }).catch(() => setMessage('二维码生成失败，请关闭后重试。'));
    let timer;
    async function check() {
      try {
        const data = await paymentRequest(`/api/payments/orders/${encodeURIComponent(order.orderId)}?token=${encodeURIComponent(order.accessToken)}`);
        if (!active) return;
        if (data.status === 'paid') { onPaid(data); return; }
        if (new Date(order.expiresAt).getTime() <= Date.now()) { setExpired(true); setMessage('本次付款入口已过期。如已扣款，请勿重复支付，可点击查询付款结果。'); return; }
      } catch (error) { if (active) setMessage(error.message); }
      if (active) timer = setTimeout(check, 4000);
    }
    check();
    return () => { active = false; clearTimeout(timer); };
  }, [order, onPaid]);
  const launch = () => {
    if (order.redirectUrl) { window.location.assign(order.redirectUrl); return; }
    if (order.jsapi) {
      if (!window.WeixinJSBridge) { setMessage('微信支付正在准备，请稍后再点击付款。'); return; }
      window.WeixinJSBridge.invoke('getBrandWCPayRequest', order.jsapi, result => {
        setMessage(result.err_msg?.endsWith(':cancel') ? '你取消了付款，可以继续支付。' : '正在查询付款结果，请稍候。');
      });
    }
  };
  return <div role="dialog" aria-modal="true" aria-label="收银台" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-sm rounded-3xl bg-[#F5F0E6] p-7 text-center shadow-xl">
    <button onClick={onClose} className="float-right p-2" aria-label="关闭收银台">✕</button>
    <h2 className="font-serif text-2xl text-[#2C2C2C]">{order.provider === 'wechat' ? '微信支付' : '支付宝'}</h2>
    <p className="my-4 text-3xl font-bold text-[#B22222]">¥{(order.payableMinor / 100).toFixed(2)}</p>
    {qr && !expired && <img src={qr} alt="本订单付款二维码" className="mx-auto w-60 rounded-xl" />}
    {!expired && (order.redirectUrl || order.jsapi) && <button onClick={launch} className="my-4 w-full rounded-xl bg-[#B22222] py-3 font-bold text-white">立即付款</button>}
    <p role="status" className="mt-4 text-sm text-[#2C2C2C]/70">{message}</p>
    <button className="mt-4 text-sm underline" onClick={async () => { try { const data = await paymentRequest(`/api/payments/orders/${order.orderId}?token=${encodeURIComponent(order.accessToken)}`); if (data.status === 'paid') onPaid(data); else setMessage('暂未确认付款，请稍后再次查询。'); } catch (error) { setMessage(error.message); } }}>查询付款结果</button>
    <p className="mt-4 break-all text-xs text-[#2C2C2C]/50">订单号：{order.orderId}</p>
  </div></div>;
}
