import { useState } from 'react';
import { translations } from '../utils/translations';
import { calculateYunqi } from '../utils/yunqi';
import { Sparkles, Lock, Activity, ThermometerSun } from 'lucide-react';
import { BAZI_MAPPING } from '../utils/constants';
import FeedbackPanel from './FeedbackPanel';
import PersonalizedServices from './PersonalizedServices';

export default function PremiumAdvice({
  result,
  lang,
  isUnlocked,
  couponBalance = 0,
  plan = 'free',
  onFeedbackSubmit,
  isFeedbackSubmitting = false,
  feedbackToast = '',
  onRestart
}) {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const t = translations[lang] || translations['zh-CN'];
  const premiumText = t.premiumPanel;

  const generateReport = async () => {
    if (!phoneNumber.trim()) {
      alert(lang === 'en' ? 'Please enter your phone number' : '请输入手机号码');
      return;
    }

    setIsGeneratingReport(true);
    try {
      const response = await fetch('/api/report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userInfo: result?.userInfo || {
            name: result?.name || 'Unknown',
            gender: result?.gender,
            birthDate: result?.birthDate,
            birthTime: result?.birthTime,
            chinaAddress: result?.birthPlace,
            sequence: result?.sequence,
            monthKey: result?.monthKey
          },
          baziResult: result,
          namingResult: result?.namingResult,
          report: result?.analysis,
          lang,
          phone: phoneNumber
        })
      });

      const data = await response.json();
      if (data.success) {
        setReportResult(data);
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      alert(lang === 'en' ? 'Failed to generate report' : '生成报告失败');
    } finally {
      setIsGeneratingReport(false);
    }
  };
  const cleanEnglishText = (value, fallback) => {
    const raw = String(value || '').replace(/[\u3400-\u9FFF]/g, ' ').replace(/\s{2,}/g, ' ').trim();
    return raw || fallback;
  };
  const careerAnalysis = result?.careerAnalysis || {
    suggestions: premiumText.syncing,
    avoid: premiumText.syncing,
    action: premiumText.syncing
  };
  const visibleCareerAnalysis = lang === 'en'
    ? {
        suggestions: cleanEnglishText(careerAnalysis.suggestions, premiumText.syncing),
        avoid: cleanEnglishText(careerAnalysis.avoid, premiumText.syncing),
        action: cleanEnglishText(careerAnalysis.action, premiumText.syncing)
      }
    : careerAnalysis;
  const birthDate = result?.birthDate
    ? result.birthDate instanceof Date ? result.birthDate : new Date(result.birthDate)
    : null;
  const birthConstitutionText = (birthYunqi) => premiumText.birthConstitution
    .replace('{year}', birthYunqi.yearGanZhi)
    .replace('{name}', birthYunqi.layer1.name)
    .replace('{organ}', birthYunqi.layer1.organ);

  // Calculate Yunqi Data
  // 1. Constitution (from Birth Date)
  const birthYunqi = birthDate && !Number.isNaN(birthDate.getTime()) ? calculateYunqi(birthDate, lang) : null;
  // 2. Current Month Advice (from Current Date)
  const currentYunqi = calculateYunqi(new Date(), lang);

  return (
    <div className="mt-8 overflow-visible border-t border-[#2C2C2C]/10 pt-8">
      <div className="mb-6 relative z-10">
        <div>
          <h2 className="text-3xl font-bold text-[#B22222] font-serif flex items-center gap-2">
            <Sparkles className="w-8 h-8" />
            {t.premium}
          </h2>
          <p className="text-lg text-[#2C2C2C]/60 mt-2 max-w-md">
            {premiumText.subtitle}
          </p>
        </div>
      </div>

      <div className="relative z-10 space-y-8 overflow-visible animate-in fade-in duration-700">
        {!isUnlocked && (
          <div className="space-y-6 h-full flex flex-col justify-center">
            <div className="opacity-50 blur-[2px] select-none pointer-events-none space-y-6">
               <div className="h-32 bg-gray-100 rounded-xl"></div>
               <div className="h-32 bg-gray-100 rounded-xl"></div>
               <div className="h-32 bg-gray-100 rounded-xl"></div>
            </div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
               <div className="bg-[#F5F0E6]/90 backdrop-blur-sm p-6 rounded-xl border border-[#B22222]/10 shadow-lg text-center">
                 <Lock className="w-8 h-8 text-[#B22222] mx-auto mb-3" />
                 <p className="text-[#2C2C2C]/60 font-serif text-lg">
                   {premiumText.locked}
                 </p>
                 <p className="text-sm text-[#2C2C2C]/40 mt-1">
                   {premiumText.lockedHint}
                 </p>
               </div>
            </div>
          </div>
        )}

        {/* Unlocked State: Full Content */}
        {isUnlocked && (
          <div className="animate-in slide-in-from-bottom-4 duration-700 space-y-8">
            
            {currentYunqi && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 md:p-8 rounded-xl border border-amber-200/60 shadow-md relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                <div className="absolute -top-6 -right-6 p-6 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-500">
                  <ThermometerSun className="w-40 h-40 text-amber-900 rotate-12" />
                </div>
                
                <h3 className={`${lang === 'en' ? 'font-serif' : "font-['STXinwei','华文新魏','serif']"} text-2xl md:text-3xl font-bold text-amber-900/90 mb-6 flex items-center gap-3 border-b border-amber-900/10 pb-4`}>
                  <Activity className="w-8 h-8 text-amber-700" />
                  {premiumText.health}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                  <div className="bg-white/80 p-5 rounded-xl border border-amber-100 shadow-sm flex flex-col hover:bg-white transition-colors">
                     <h4 className="text-sm font-bold text-amber-700/70 mb-2">{currentYunqi.layer1.title}</h4>
                     <div className="text-xl font-bold text-amber-900 mb-2">{currentYunqi.layer1.name}</div>
                     <p className="text-sm text-amber-800/80 flex-1 leading-relaxed">{currentYunqi.layer1.effect}</p>
                  </div>

                  <div className="bg-white/80 p-5 rounded-xl border border-amber-100 shadow-sm flex flex-col hover:bg-white transition-colors">
                     <h4 className="text-sm font-bold text-amber-700/70 mb-2">{currentYunqi.layer2.title}</h4>
                     <div className="text-xl font-bold text-amber-900 mb-2">{currentYunqi.layer2.siTian}</div>
                     <p className="text-sm text-amber-800/80 flex-1 leading-relaxed">{currentYunqi.layer2.desc}</p>
                  </div>

                  <div className="bg-white/80 p-5 rounded-xl border border-amber-100 shadow-sm flex flex-col hover:bg-white transition-colors">
                     <h4 className="text-sm font-bold text-amber-700/70 mb-2">{currentYunqi.layer3.title}</h4>
                     <div className="text-xl font-bold text-amber-900 mb-1">{currentYunqi.layer3.guestQi}</div>
                     <div className="text-xs text-amber-600 mb-2 bg-amber-100/50 inline-block px-2 py-0.5 rounded">{currentYunqi.layer3.step}</div>
                     <p className="text-sm text-amber-800/80 flex-1 leading-relaxed">{currentYunqi.layer3.symptom}</p>
                  </div>

                  <div className="bg-amber-100/80 p-5 rounded-xl border border-amber-200 shadow-sm flex flex-col hover:bg-amber-100 transition-colors">
                     <h4 className="text-sm font-bold text-amber-800/70 mb-2">{currentYunqi.layer4.title}</h4>
                     <p className="text-sm text-amber-900 font-medium whitespace-pre-line leading-relaxed">
                       {currentYunqi.layer4.advice}
                     </p>
                  </div>
                </div>

                {birthYunqi && (
                  <div className="mt-6 pt-4 border-t border-amber-900/10 text-sm text-amber-800/70 flex items-start gap-2 bg-white/40 p-4 rounded-lg">
                    <span className="shrink-0 mt-0.5 font-bold">※</span>
                    <span className="leading-relaxed">
                      {birthConstitutionText({
                        ...birthYunqi,
                        yearGanZhi: lang === 'en'
                          ? birthYunqi.yearGanZhi.split('').map((c, i) => i === 0 ? (BAZI_MAPPING.stems[c]?.en || c) : (BAZI_MAPPING.branches[c]?.en || c)).join('-')
                          : birthYunqi.yearGanZhi
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-[#2C2C2C]/60 uppercase tracking-wider mb-4">
                {premiumText.direction}
              </h3>
              <div className="overflow-visible break-words whitespace-pre-wrap bg-white/60 p-6 rounded-xl border border-[#2C2C2C]/5 text-[#2C2C2C] leading-relaxed text-lg">
                {visibleCareerAnalysis.suggestions}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#2C2C2C]/60 uppercase tracking-wider mb-4">
                {premiumText.avoidance}
              </h3>
              <div className="overflow-visible break-words whitespace-pre-wrap bg-red-50/50 p-6 rounded-xl border border-red-100 text-[#2C2C2C] leading-relaxed text-lg">
                {visibleCareerAnalysis.avoid}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#2C2C2C]/60 uppercase tracking-wider mb-4">
                {premiumText.actions}
              </h3>
              <div className="overflow-visible break-words whitespace-pre-wrap bg-emerald-50/50 p-6 rounded-xl border border-emerald-100 text-[#2C2C2C] leading-relaxed text-lg">
                {visibleCareerAnalysis.action}
              </div>
            </div>

            {feedbackToast && (
              <div className="rounded-xl border border-[#8B6508]/20 bg-[#8B6508]/5 px-4 py-3 text-[#8B6508]">
                {feedbackToast}
              </div>
            )}

            {!feedbackSubmitted ? (
              <FeedbackPanel
                lang={lang}
                onSubmit={(values) => {
                  onFeedbackSubmit(values);
                  setFeedbackSubmitted(true);
                }}
                couponBalance={couponBalance}
                plan={plan}
                isSubmitting={isFeedbackSubmitting}
              />
            ) : !reportResult ? (
              <div className="rounded-xl border border-[#2C2C2C]/10 bg-white p-6 shadow-sm">
                <PersonalizedServices lang={lang} />
                
                <div className="mt-8 pt-6 border-t border-[#2C2C2C]/10">
                  <h3 className="text-xl font-bold font-serif text-[#2C2C2C] mb-4">
                    {lang === 'en' ? 'Get Your Digital Report' : '获取数字报告'}
                  </h3>
                  <p className="text-sm text-[#2C2C2C]/70 mb-4">
                    {lang === 'en'
                      ? 'Leave your phone number, and we will send you a report link valid for 7 days.'
                      : '留下您的手机号码，我们会为您发送一个7天有效的报告链接。'}
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
                        {lang === 'en' ? 'Phone Number' : '手机号码'}
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={lang === 'en' ? 'Enter your phone number' : '请输入手机号码'}
                        className="w-full px-4 py-3 border border-[#2C2C2C]/20 rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] outline-none"
                      />
                    </div>
                    
                    <button
                      onClick={generateReport}
                      disabled={isGeneratingReport}
                      className="w-full bg-gradient-to-r from-[#8B4513] to-[#D2691E] text-white font-bold py-3 px-6 rounded-lg hover:from-[#703A10] hover:to-[#B85A19] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingReport
                        ? (lang === 'en' ? 'Generating...' : '生成中...')
                        : (lang === 'en' ? 'Generate Report' : '生成报告')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
                <h3 className="text-xl font-bold font-serif text-green-800 mb-4">
                  {lang === 'en' ? 'Report Generated!' : '报告已生成！'}
                </h3>
                
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-sm text-[#2C2C2C]/70 mb-2">
                    {lang === 'en' ? 'Phone Number:' : '手机号码：'}
                  </p>
                  <p className="text-lg font-medium text-[#2C2C2C]">
                    {reportResult.phone}
                  </p>
                </div>
                
                {reportResult.signedUrl ? (
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-sm text-[#2C2C2C]/70 mb-2">
                      {lang === 'en' ? 'Report Link (valid for 7 days):' : '报告链接（7天有效）：'}
                    </p>
                    <a
                      href={reportResult.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                    >
                      {reportResult.signedUrl}
                    </a>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      {lang === 'en'
                        ? 'Report saved locally. OSS is not configured.'
                        : '报告已保存在本地。OSS未配置。'}
                    </p>
                  </div>
                )}
                
                {reportResult.smsSent !== undefined && (
                  <div className={`rounded-lg p-4 mb-4 ${reportResult.smsSent ? 'bg-green-100 border border-green-300' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <p className="text-sm">
                      {reportResult.smsSent ? (
                        <span className="text-green-700">
                          {lang === 'en' ? '✅ SMS sent successfully!' : '✅ 短信已成功发送！'}
                        </span>
                      ) : (
                        <span className="text-yellow-700">
                          {lang === 'en' ? '⚠️ SMS not sent' : '⚠️ 短信未发送'}
                          {reportResult.smsMessage && `: ${reportResult.smsMessage}`}
                        </span>
                      )}
                    </p>
                  </div>
                )}
                
                <div className="text-sm text-green-700">
                  {lang === 'en'
                    ? 'Report generated at:'
                    : '报告生成时间：'}
                  {new Date(reportResult.createdAt).toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN')}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-[#2C2C2C]/10 text-center">
               {onRestart && (
                 <button
                   onClick={onRestart}
                   className="mb-5 inline-flex items-center gap-2 px-6 py-3 bg-[#2C2C2C] hover:bg-[#1a1a1a] text-white font-bold rounded-lg transition-colors shadow-md"
                 >
                   {t.restartAnalysis}
                 </button>
               )}
               {couponBalance > 0 && (
                 <p className="text-sm text-[#B22222] mb-3">
                   {lang === 'en'
                     ? `You have a ¥${couponBalance} coupon available for your next consultation.`
                     : (lang === 'zh-TW'
                       ? `您有 ¥${couponBalance} 消費券可用於下次諮詢抵扣。`
                       : `您有 ¥${couponBalance} 消费券可用于下次咨询抵扣。`
                     )}
                 </p>
               )}
               <p className="text-sm text-[#2C2C2C]/40 italic">
                 {premiumText.disclaimer}
               </p>
               <p className="text-sm text-[#2C2C2C]/30 mt-2 font-serif">
                 {t.brandLatin} © {new Date().getFullYear()}
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
