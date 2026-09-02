import { useState } from 'react';
import { translations } from '../utils/translations.js';

const SERVICE_CONFIG = [
  { key: 'career', cn: '人生事业', en: 'Life & Career', priceCN: '¥2000', priceEN: '¥2000', color: 'from-red-500 to-red-700', bg: 'bg-red-50' },
  { key: 'study', cn: '学业成长', en: 'Study & Personal Growth', priceCN: '¥2000', priceEN: '¥2000', color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50' },
  { key: 'relationship', cn: '情感姻缘', en: 'Relationship & Marriage', priceCN: '¥2000', priceEN: '¥2000', color: 'from-pink-500 to-pink-700', bg: 'bg-pink-50' },
  { key: 'wealth', cn: '财富规划', en: 'Wealth & Fortune Planning', priceCN: '¥2000', priceEN: '¥2000', color: 'from-yellow-500 to-yellow-700', bg: 'bg-yellow-50' },
  { key: 'choices', cn: '人生抉择', en: 'Life Choices & Decisions', priceCN: '¥2000', priceEN: '¥2000', color: 'from-purple-500 to-purple-700', bg: 'bg-purple-50' },
  { key: 'mood', cn: '心境情志', en: 'Inner Mood Regulation', priceCN: '¥2000', priceEN: '¥2000', color: 'from-green-500 to-green-700', bg: 'bg-green-50' },
  { key: 'worldly', cn: '凡尘俗运', en: 'Worldly Fortunes', priceCN: '¥2000', priceEN: '¥2000', color: 'from-orange-500 to-orange-700', bg: 'bg-orange-50' },
];

export default function PersonalizedServices({ lang }) {
  const t = translations[lang] || translations['zh-CN'];
  const services = t.personalizedServices || {};
  const [contact, setContact] = useState({ email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitOrder = async () => {
    if (!contact.email && !contact.phone) {
      alert(lang === 'en' ? 'Please leave your email or phone number.' : (lang === 'zh-TW' ? '請留下您的郵箱或電話。' : '请留下您的邮箱或电话。'));
      return;
    }
    setSubmitting(true);
    try {
      await fetch('/api/personalized/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contact.email, phone: contact.phone, amount: 2000, currency: 'CNY', lang }),
      });
      setSubmitted(true);
    } catch (e) {
      alert(lang === 'en' ? 'Submission failed, please try again.' : (lang === 'zh-TW' ? '提交失敗，請重試。' : '提交失败，请重试。'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-6 shadow-sm">
      <div className="mb-6 border-b border-[#2C2C2C]/10 pb-4">
        <h3 className="text-2xl font-bold font-serif text-[#2C2C2C]">{services.title}</h3>
        <p className="mt-2 text-sm text-[#2C2C2C]/70">{services.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {SERVICE_CONFIG.map((service) => (
          <div
            key={service.key}
            className={`${service.bg} rounded-xl border border-[#2C2C2C]/10 p-4 transition-transform hover:scale-105`}
          >
            <div className={`bg-gradient-to-r ${service.color} text-white text-center py-2 px-3 rounded-lg mb-3`}>
              <span className="font-bold text-lg">
                {lang === 'en' ? service.en : service.cn}
              </span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-[#B22222]">
                {lang === 'en' ? service.priceEN : service.priceCN}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/70 rounded-xl p-5 border border-[#2C2C2C]/10 mb-4">
        <h4 className="text-lg font-bold text-[#2C2C2C] mb-3">{services.contactTitle}</h4>
        <div className="space-y-2 text-sm text-[#2C2C2C]/80">
          <p><span className="font-bold">Email:</span> btswws@163.com</p>
          <p><span className="font-bold">WeChat:</span> smskmima</p>
          <p><span className="font-bold">WhatsApp:</span> {services.contactWhatsapp || 'WhatsApp'}</p>
        </div>
        <div className="mt-4 p-4 bg-[#B22222]/5 rounded-lg border border-[#B22222]/20">
          <p className="text-sm text-[#2C2C2C] font-medium">{services.notice}</p>
        </div>
      </div>

      <div className="bg-white/70 rounded-xl p-5 border border-[#2C2C2C]/10">
        <h4 className="text-lg font-bold text-[#2C2C2C] mb-4">
          {lang === 'en' ? 'Payment — Scan to Pay ¥2000' : (lang === 'zh-TW' ? '支付 — 掃碼支付 ¥2000' : '支付 — 扫码支付 ¥2000')}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="flex flex-col items-center p-4 bg-[#1677FF]/5 rounded-xl border border-[#1677FF]/20">
            <div className="w-44 h-44 rounded-xl overflow-hidden bg-white border border-[#2C2C2C]/10 shadow-sm">
              <img src="/qr/personalized-alipay-2000.jpg" alt="Alipay ¥2000" className="w-full h-full object-contain" />
            </div>
            <span className="mt-2 font-bold text-[#1677FF]">
              {lang === 'en' ? 'Alipay · ¥2000' : (lang === 'zh-TW' ? '支付寶 · ¥2000' : '支付宝 · ¥2000')}
            </span>
          </div>
          <div className="flex flex-col items-center p-4 bg-[#07C160]/5 rounded-xl border border-[#07C160]/20">
            <div className="w-44 h-44 rounded-xl overflow-hidden bg-white border border-[#2C2C2C]/10 shadow-sm">
              <img src="/qr/personalized-wechat-2000.jpg" alt="WeChat Pay ¥2000" className="w-full h-full object-contain" />
            </div>
            <span className="mt-2 font-bold text-[#07C160]">
              {lang === 'en' ? 'WeChat Pay · ¥2000' : (lang === 'zh-TW' ? '微信支付 · ¥2000' : '微信支付 · ¥2000')}
            </span>
          </div>
        </div>

        <div className="p-3 bg-[#B22222]/5 rounded-lg border border-[#B22222]/20 mb-4">
          <p className="text-sm text-[#2C2C2C] font-medium">
            {lang === 'en'
              ? 'After scanning and paying, please leave your email and phone below, then click the button. We will confirm receipt by email and SMS, and ask you to send your detailed situation via email.'
              : (lang === 'zh-TW'
                ? '掃碼支付後，請在下方留下您的郵箱和電話，然後點擊按鈕。我們將通過郵件和短信確認收款，並請您將詳細情況發往郵箱。'
                : '扫码支付后，请在下方留下您的邮箱和电话，然后点击按钮。我们将通过邮件和短信确认收款，并请您将详细情况发往邮箱。'
              )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <input
            type="email"
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            placeholder={lang === 'en' ? 'Email' : (lang === 'zh-TW' ? '郵箱' : '邮箱')}
            className="px-4 py-3 rounded-lg border border-[#2C2C2C]/20 bg-white text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#B22222]/30"
          />
          <input
            type="tel"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            placeholder={lang === 'en' ? 'Phone' : (lang === 'zh-TW' ? '電話' : '电话')}
            className="px-4 py-3 rounded-lg border border-[#2C2C2C]/20 bg-white text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#B22222]/30"
          />
        </div>

        {submitted ? (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <p className="text-green-800 font-medium">
              {lang === 'en'
                ? 'Submitted. We will confirm receipt by email/SMS and contact you for details.'
                : (lang === 'zh-TW'
                  ? '已提交。我們將通過郵件/短信確認收款，並與您聯繫詳情。'
                  : '已提交。我们将通过邮件/短信确认收款，并与您联系详情。'
                )}
            </p>
          </div>
        ) : (
          <button
            onClick={handleSubmitOrder}
            disabled={submitting}
            className="w-full py-3 bg-[#B22222] hover:bg-[#8B1A1A] disabled:opacity-60 text-white font-bold rounded-lg transition-colors shadow-md"
          >
            {submitting
              ? (lang === 'en' ? 'Submitting...' : (lang === 'zh-TW' ? '提交中...' : '提交中...'))
              : (lang === 'en' ? "I've Paid — Submit" : (lang === 'zh-TW' ? '我已完成支付，提交' : '我已完成支付，提交'))
            }
          </button>
        )}
      </div>
    </div>
  );
}
