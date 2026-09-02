import { useRef, useState } from 'react';
import { translations } from '../utils/translations.js';

const BAR_CONFIG = [
  { key: 'industry', element: 'wood', color: 'from-[#75C36A] to-[#2E7D32]', accent: '#2E7D32' },
  { key: 'role', element: 'fire', color: 'from-[#FF7A70] to-[#B91C1C]', accent: '#B91C1C' },
  { key: 'wealth', element: 'metal', color: 'from-[#F5E6A8] to-[#C9B458]', accent: '#C9B458' },
  { key: 'body', element: 'earth', color: 'from-[#C49A6C] to-[#7C4A1F]', accent: '#7C4A1F' },
  { key: 'status', element: 'water', color: 'from-[#6BA9FF] to-[#1E40AF]', accent: '#1E40AF' }
];

export default function FeedbackPanel({ lang, onSubmit, couponBalance = 0, plan = 'free', isSubmitting = false }) {
  const [values, setValues] = useState({
    industry: 50,
    role: 50,
    wealth: 50,
    body: 50,
    status: 50
  });

  const t = translations[lang] || translations['zh-CN'];
  const copy = {
    ...t.feedbackPanel,
    plan: t.cloud.planLabel,
    coupon: t.cloud.couponLabel
  };
  const barRefs = useRef({});

  const updateValue = (key, clientY) => {
    const bar = barRefs.current[key];
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const raw = ((rect.bottom - clientY) / rect.height) * 100;
    const nextValue = Math.max(0, Math.min(100, Math.round(raw)));
    setValues((prev) => ({ ...prev, [key]: nextValue }));
  };

  const beginDrag = (key, event) => {
    event.preventDefault();
    updateValue(key, event.clientY);

    const move = (moveEvent) => updateValue(key, moveEvent.clientY);
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  return (
    <div className="mt-10 rounded-2xl border border-[#2C2C2C]/10 bg-[#F5F0E6] p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#2C2C2C]/10 pb-4">
        <div>
          <h3 className="text-xl font-bold font-serif text-[#2C2C2C]">{copy.title}</h3>
          <p className="mt-1 text-sm text-[#2C2C2C]/70">{copy.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-[#2C2C2C]/10 bg-white px-4 py-2 text-sm text-[#2C2C2C]/80">
            {copy.plan}: <span className="font-bold uppercase text-[#B22222]">{plan}</span>
          </div>
          <div className="rounded-full border border-[#B22222]/20 bg-[#B22222]/5 px-4 py-2 text-sm text-[#2C2C2C]/80">
            {copy.coupon}: <span className="font-bold text-[#B22222]">{couponBalance}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 md:gap-5">
        {BAR_CONFIG.map((item) => (
          <div key={item.key} className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <div className="text-lg font-bold font-serif text-[#2C2C2C]">{copy.elements[item.element]}</div>
              <div className="whitespace-pre-line text-xs leading-5 text-[#2C2C2C]/65 md:text-[13px]">{copy[item.key]}</div>
            </div>
            <div
              ref={(node) => {
                barRefs.current[item.key] = node;
              }}
              onPointerDown={(event) => beginDrag(item.key, event)}
              className="relative h-56 w-full max-w-[4.5rem] cursor-pointer rounded-full border border-[#2C2C2C]/10 bg-white/70 px-3 py-3 touch-none"
            >
              <div className="relative mx-auto h-full w-6 rounded-full bg-[#2C2C2C]/10">
                <div
                  className={`absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t ${item.color}`}
                  style={{ height: `${values[item.key]}%` }}
                />
                <div
                  className="absolute left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-white shadow-md"
                  style={{
                    bottom: `calc(${values[item.key]}% - 10px)`,
                    backgroundColor: item.accent
                  }}
                />
              </div>
            </div>
            <div className="mt-3 rounded-full bg-white px-3 py-1 text-sm font-bold text-[#B22222] shadow-sm">
              {values[item.key]}%
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onSubmit(values)}
        disabled={isSubmitting}
        className="mt-6 w-full rounded-xl bg-[#B22222] px-5 py-3 font-bold text-[#F5F0E6] transition-colors hover:bg-[#8B1A1A] disabled:cursor-not-allowed disabled:bg-[#2C2C2C]/30"
      >
        {copy.submit}
      </button>
    </div>
  );
}
