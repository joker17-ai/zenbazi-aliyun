import { lazy, Suspense, useEffect, useState } from 'react'
import { Sparkles, Loader2, AlertCircle, TrendingUp, Lock, BadgeCheck, QrCode, CreditCard, Wallet, Globe, TicketPercent, Smartphone } from 'lucide-react'
import { createJob, runOptionalJob, waitForJob } from './utils/cloudClient'
import { translations, ELEMENT_MAPPING } from './utils/translations'
import { getCouponBalance, setCouponBalance } from './utils/couponStore'
import {
  getPart1VariationsEn,
  getPart2VariationsEn,
  getPart3VariationsEn,
  getPart4VariationsEn,
  getPart5VariationsEn
} from './utils/aiVariations.js'

const BaZiForm = lazy(() => import('./components/BaZiForm'))
const NamingAnalysis = lazy(() => import('./components/NamingAnalysis'))
const PremiumAdvice = lazy(() => import('./components/PremiumAdvice'))
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const SESSION_SNAPSHOT_KEY = 'zenbazi-app-state'
const LEGACY_TRANSLATION_PLACEHOLDERS = [
  'English translation is syncing. The original Chinese content has been withheld to keep the English interface fully language-pure.',
  'Translation Gate is cleansing the analysis...'
]

function readSessionSnapshot() {
  try {
    const raw = sessionStorage.getItem(SESSION_SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    parsed.baziResult = normalizeBaziResult(parsed?.baziResult)
    return parsed
  } catch {
    return null
  }
}

function normalizeBaziResult(result) {
  if (!result) return null
  if (!result.birthDate) return result
  return {
    ...result,
    birthDate: result.birthDate instanceof Date ? result.birthDate : new Date(result.birthDate)
  }
}

function translateToken(value) {
  const raw = typeof value === 'object' ? (value?.char || value?.ganZhi || '') : String(value || '')
  if (!raw) return 'N/A'
  const translated = raw.split('').map((char) => ELEMENT_MAPPING[char] || char).join('')
  return translated.replace(/\s{2,}/g, ' ').trim() || 'N/A'
}

function cleanEnglishText(value, fallback = 'N/A') {
  const raw = String(value || '').replace(/[\u3400-\u9FFF]/g, ' ').replace(/\s{2,}/g, ' ').trim()
  return raw || fallback
}

function getEnglishZodiacLabel(branch) {
  const enMap = { '子': 'Rat', '丑': 'Ox', '寅': 'Tiger', '卯': 'Rabbit', '辰': 'Dragon', '巳': 'Snake', '午': 'Horse', '未': 'Goat', '申': 'Monkey', '酉': 'Rooster', '戌': 'Dog', '亥': 'Pig' }
  return enMap[branch] || branch || 'N/A'
}

function buildLocalEnglishAnalysisContent(result, copy) {
  if (!result) {
    return ''
  }

  const dayMaster = translateToken(result.dayMaster)
  const dayMasterElement = translateToken(result.dayMasterElement)
  const monthBranch = translateToken(result.monthBranch)
  const currentDaYun = translateToken(result.currentDaYun?.ganZhi)
  const strengthRating = cleanEnglishText(result.strengthAnalysis?.rating, 'Balanced')
  const relationSummary = result.strengthAnalysis?.relations?.hasHe
    ? 'The branch layer shows active harmony patterns that can improve cooperation when timing is handled well.'
    : result.strengthAnalysis?.relations?.hasChong
      ? 'The branch layer shows clash patterns, so timing and pacing matter more than force.'
      : result.strengthAnalysis?.relations?.hasXing
        ? 'The branch layer shows penalty patterns, so internal pressure must be managed with structure and restraint.'
        : 'The branch layer is relatively steady, so consistent execution matters more than dramatic moves.'
  const careerSuggestion = cleanEnglishText(result.careerAnalysis?.suggestions, 'A steady path that matches your existing strengths is more reliable than a sudden pivot.')
  const riskSuggestion = cleanEnglishText(result.careerAnalysis?.avoid, 'Reduce impulsive decisions and keep execution disciplined.')

  const mockContext = {
    dayMaster: result.dayMaster,
    dayMasterElement: result.dayMasterElement,
    monthBranch: result.monthBranch,
    monthCommand: {
      season: translateToken(result.monthBranch),
      state: strengthRating
    },
    potentialDirection: {
      englishText: 'building structured, repeatable systems that leverage your natural strengths'
    },
    daYunAnalysis: {
      ganZhi: result.currentDaYun?.ganZhi,
      trend: 'supportive',
      interactions: []
    },
    liuNianAnalysis: {
      ganZhi: 'current year',
      wealthActive: false,
      wealthState: 'neutral',
      interactions: []
    },
    wealthElement: 'Earth',
    personalityBase: 'your core tendencies',
    exposedHiddenStems: []
  }

  const mockBaziResult = {
    strengthAnalysis: {
      description: `${relationSummary}`
    }
  }

  const mockUserInfo = {
    birthDate: result.birthDate
  }

  const part1 = getPart1VariationsEn(mockContext, mockBaziResult, mockUserInfo, translateToken)
  const part2 = getPart2VariationsEn(mockContext, mockUserInfo, {}, translateToken, 'not strongly surfaced')
  const part3 = getPart3VariationsEn(mockContext, {
    englishDaYunRelationText: 'neutral',
    englishWealthOpportunity: `Career signals point toward **${careerSuggestion}**. Focus on opportunities that build on existing strengths rather than new ventures.`,
    englishWealthRisk: `${riskSuggestion}`
  }, mockUserInfo, translateToken)
  const part4 = getPart4VariationsEn(mockContext, { englishLiuNianRelationText: 'neutral' }, mockUserInfo, translateToken)
  const part5 = getPart5VariationsEn(mockContext, mockUserInfo)

  return [
    `# 🌿 ${copy.analysis.title}`,
    '',
    `## ${copy.analysis.anchor}`,
    part1,
    '',
    `## ${copy.analysis.personality_potential}`,
    part2,
    '',
    `## ${copy.analysis.career_wealth}`,
    part3,
    '',
    `## ${copy.analysis.action}`,
    part4,
    '',
    `## ${copy.analysis.closing}`,
    part5
  ].join('\n')
}

function parseAnalysisContent(content, copy, lang) {
  const raw = String(content || '').trim()
  const fallbackTitle = copy.analysis.title
  const normalizedHeadings = [
    copy.analysis.anchor,
    copy.analysis.personality_potential,
    copy.analysis.career_wealth,
    copy.analysis.action,
    copy.analysis.closing
  ]

  if (!raw) {
    return { title: fallbackTitle, sections: [] }
  }

  const lines = raw.split(/\r?\n/)
  let title = fallbackTitle
  const sections = []
  let currentSection = null
  let preamble = []

  const flushSection = () => {
    if (!currentSection) return
    currentSection.body = currentSection.body.join('\n').trim()
    sections.push(currentSection)
    currentSection = null
  }

  lines.forEach((line) => {
    const trimmed = line.trim()
    const normalizedLine = trimmed.replace(/^\*\*(.+)\*\*$/, '$1').trim()
    const numberedHeadingMatch = normalizedLine.match(/^(?:##\s*)?([1-5])[\.\)]\s+(.+)$/)
    if (!trimmed) {
      if (currentSection) currentSection.body.push('')
      return
    }
    if (/^#\s+/.test(normalizedLine)) {
      title = normalizedLine.replace(/^#\s+/, '').trim() || fallbackTitle
      return
    }
    if (/^##\s+/.test(normalizedLine) || numberedHeadingMatch) {
      flushSection()
      currentSection = {
        heading: numberedHeadingMatch ? `${numberedHeadingMatch[1]}. ${numberedHeadingMatch[2].trim()}` : normalizedLine.replace(/^##\s+/, '').trim(),
        body: []
      }
      return
    }
    if (currentSection) {
      currentSection.body.push(normalizedLine)
    } else {
      preamble.push(normalizedLine)
    }
  })

  flushSection()

  if (preamble.length) {
    sections.unshift({
      heading: normalizedHeadings[0],
      body: preamble.join('\n').trim()
    })
  }

  const normalizedSections = sections.map((section, index) => ({
    heading: lang === 'en' && normalizedHeadings[index] ? normalizedHeadings[index] : section.heading,
    body: section.body
  })).filter((section) => section.body)

  if (!normalizedSections.length) {
    return {
      title: fallbackTitle,
      sections: [{ heading: normalizedHeadings[0], body: raw }]
    }
  }

  return {
    title: lang === 'en' ? fallbackTitle : title,
    sections: normalizedSections
  }
}

function App() {
  // 优先清除可能有问题的 sessionStorage
  try {
    sessionStorage.clear()
  } catch {}
  
  const restoredState = null
  const [stage, setStage] = useState(1);
  const [baziResult, setBaziResult] = useState(null);
  const [namingResult, setNamingResult] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [rawAiAnalysis, setRawAiAnalysis] = useState(null);
  const [analysisZenMessage, setAnalysisZenMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [isEnglishTranslationPending, setIsEnglishTranslationPending] = useState(false);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('zh-CN');
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState('');
  const [useCouponDeduction, setUseCouponDeduction] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [route, setRoute] = useState(() => window.location.hash === '#/admin' ? 'admin' : 'app');
  const [userCount, setUserCount] = useState(null); // 动态用户计数
  const premiumUnlocked = isPremiumUnlocked || stage === 4
  const hasPaidPlan = userInfo?.plan === 'paid'
  // 地区检测逻辑
  const useGlobalPaymentMethods = lang === 'en' || Boolean(userInfo?.isOverseas)
  // 国内：¥68，国际：¥128（统一人民币）
  const basePriceCny = useGlobalPaymentMethods ? 128 : 68
  // 统一人民币计价
  let priceCurrencySymbol = '¥'
  let paymentCurrencyCode = 'CNY'
  let displayPrice = useGlobalPaymentMethods ? '128' : '68'
  // 多货币展示位统一显示人民币 ¥128
  let multiCurrencyDisplay = useGlobalPaymentMethods ? '¥128 / ¥128 / ¥128' : '¥68'
  
  // 检测用户地区（简单实现：基于浏览器语言和时区）
  const detectUserRegion = () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const language = navigator.language
      
      // 简单判断：如果时区不是Asia/Shanghai、Asia/Beijing等，或语言不是zh-CN/zh，就认为是国际用户
      const isChinaTimezone = timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Beijing') || timezone.includes('Asia/Chongqing')
      const isChineseLanguage = language.startsWith('zh')
      
      return !(isChinaTimezone || isChineseLanguage)
    } catch {
      return lang === 'en'
    }
  }
  const availableCoupons = Number(userInfo?.couponBalance || 0)
  const couponDeduction = useCouponDeduction ? Math.min(availableCoupons, basePriceCny) : 0
  const payableCny = Math.max(basePriceCny - couponDeduction, 0)

  const t = translations[lang] || translations['zh-CN'];

  const containsChinese = (value = '') => /[\u3400-\u9FFF]/.test(String(value))
  const isLegacyPlaceholder = (value = '') => LEGACY_TRANSLATION_PLACEHOLDERS.includes(String(value || '').trim())
  const displayAnalysisContent = lang === 'en' && isLegacyPlaceholder(aiAnalysis) ? (rawAiAnalysis || aiAnalysis) : aiAnalysis
  const reportContainsChinese = lang === 'en' && containsChinese(displayAnalysisContent)
  const zenContainsChinese = lang === 'en' && containsChinese(analysisZenMessage)
  const englishGateBlocked = lang === 'en' && (reportContainsChinese || zenContainsChinese)
  const localEnglishAnalysis = lang === 'en' ? buildLocalEnglishAnalysisContent(baziResult, t) : ''
  const visibleAnalysisContent = lang === 'en'
    ? ((displayAnalysisContent && !reportContainsChinese) ? displayAnalysisContent : (localEnglishAnalysis || displayAnalysisContent))
    : displayAnalysisContent
  const visibleZenMessage = lang === 'en'
    ? ((!zenContainsChinese && analysisZenMessage) ? analysisZenMessage : cleanEnglishText(baziResult?.zenMessage || analysisZenMessage, 'Stay grounded, move with timing, and let clarity guide each next step.'))
    : (analysisZenMessage || baziResult?.zenMessage || '')
  const visibleStrengthRating = lang === 'en'
    ? cleanEnglishText(baziResult?.strengthAnalysis?.rating, 'Balanced')
    : baziResult?.strengthAnalysis?.rating
  const visibleStrengthDescription = lang === 'en'
    ? cleanEnglishText(
        baziResult?.strengthAnalysis?.description,
        'Chart strength is best judged through seasonal support, internal structure, and the balance between reinforcement and restraint.'
      )
    : baziResult?.strengthAnalysis?.description
  const strengthBadgeIsStrong = lang === 'en'
    ? /strong/i.test(visibleStrengthRating || '')
    : /旺/.test(String(baziResult?.strengthAnalysis?.rating || ''))

  // Helper to split quadratic Bezier curve
  const getSplitPathD = (x1, x2, yBase, gap) => {
    const xMid = (x1 + x2) / 2;
    const w = Math.abs(x2 - x1);
    if (w === 0) return { leftD: '', rightD: '' };
    
    const t1 = 0.5 - gap / w;
    
    const Q1_x = (1 - t1) * x1 + t1 * xMid;
    const Q1_y = t1 * 2 * yBase;
    const E1_x = xMid - gap;
    const E1_y = 4 * t1 * (1 - t1) * yBase;
    
    const E2_x = xMid + gap;
    const E2_y = E1_y;
    const Q2_x = t1 * xMid + (1 - t1) * x2;
    const Q2_y = Q1_y;
    
    const leftD = `M ${x1} 0 Q ${Q1_x} ${Q1_y} ${E1_x} ${E1_y}`;
    const rightD = `M ${E2_x} ${E2_y} Q ${Q2_x} ${Q2_y} ${x2} 0`;
    
    return { leftD, rightD };
  };

  const clearSessionArtifacts = async () => {
    try {
      localStorage.clear();
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }
    } catch (_) {
      return;
    }
  };

  useEffect(() => {
    const cleanup = () => {
      clearSessionArtifacts();
    };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);

    return () => {
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('pagehide', cleanup);
    };
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      setRoute(window.location.hash === '#/admin' ? 'admin' : 'app');
    };
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  // 获取动态用户计数
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const res = await fetch('/api/user/count');
        if (res.ok) {
          const data = await res.json();
          setUserCount(data.count);
        }
      } catch (e) {
        console.warn('Failed to fetch user count:', e);
      }
    };
    fetchUserCount();
  }, []);

  // 暂时禁用 sessionStorage 保存，避免导致问题
  // useEffect(() => {
  //   if (route !== 'app') return
  //   try {
  //     sessionStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify({
  //       stage,
  //       baziResult,
  //       namingResult,
  //       userInfo,
  //       aiAnalysis,
  //       rawAiAnalysis,
  //       analysisZenMessage,
  //       lang,
  //       isPremiumUnlocked: premiumUnlocked,
  //       feedbackToast,
  //       useCouponDeduction,
  //       paymentMethod
  //     }))
  //   } catch {
  //     return
  //   }
  // }, [route, stage, baziResult, namingResult, userInfo, aiAnalysis, rawAiAnalysis, analysisZenMessage, lang, premiumUnlocked, feedbackToast, useCouponDeduction, paymentMethod]);

  useEffect(() => {
    if (!userInfo) return
    setPaymentMethod(useGlobalPaymentMethods ? 'applepay' : 'wechat')
  }, [useGlobalPaymentMethods, userInfo?.sequence])

  useEffect(() => {
    if (lang !== 'en' || !stage || isLoading || !englishGateBlocked) return

    let cancelled = false

    const runGate = async () => {
      setIsEnglishTranslationPending(true)
      try {
        const translated = await runOptionalJob('translate', {
          targetLang: 'en',
          texts: {
            report: rawAiAnalysis || displayAnalysisContent || '',
            zenMessage: analysisZenMessage || ''
          },
          userInfo,
          baziResult,
          namingResult
        }, {
          logLabel: 'DeepSeek translation gate'
        })
        if (cancelled || !translated) return
        setAiAnalysis(translated.texts?.report || rawAiAnalysis || displayAnalysisContent || '')
        setAnalysisZenMessage(translated.texts?.zenMessage || analysisZenMessage || '')
      } finally {
        if (!cancelled) {
          setIsEnglishTranslationPending(false)
        }
      }
    }

    runGate()

    return () => {
      cancelled = true
    }
  }, [analysisZenMessage, baziResult, displayAnalysisContent, englishGateBlocked, isLoading, lang, namingResult, rawAiAnalysis, stage, userInfo])

  useEffect(() => {
    if (lang !== 'en' || stage !== 3 || isLoading || rawAiAnalysis || (aiAnalysis && !isLegacyPlaceholder(aiAnalysis)) || !baziResult || !userInfo) {
      return
    }

    let cancelled = false

    const recoverEnglishAnalysis = async () => {
      setIsLoading(true)
      setIsEnglishTranslationPending(true)
      try {
        const { jobId } = await createJob('report', {
          userInfo,
          baziResult,
          namingResult
        })
        const result = await waitForJob(jobId)
        if (cancelled) return
        const rawReport = result.report || ''
        const rawZenMessage = baziResult.zenMessage || ''
        setRawAiAnalysis(rawReport)
        setAiAnalysis(rawReport)
        setAnalysisZenMessage(rawZenMessage)
      } catch {
        if (cancelled) return
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setIsEnglishTranslationPending(false)
        }
      }
    }

    recoverEnglishAnalysis()

    return () => {
      cancelled = true
    }
  }, [aiAnalysis, baziResult, isLoading, lang, namingResult, rawAiAnalysis, stage, userInfo])

  const requestChartAnalysis = async (payload, options = {}) => {
    const finalData = { ...payload, isEnglish: lang === 'en', lang };
    setIsSubmitting(true);
    setError(null);

    try {
      const { jobId } = await createJob('chart', finalData);
      const result = await waitForJob(jobId);
      setBaziResult(normalizeBaziResult(result.baziResult));
      setNamingResult(result.namingResult);
      // 跨会话消费券：新会话服务端返回 0，用 localStorage 桥接上一次反馈奖励的余额
      const carriedCoupon = getCouponBalance();
      setUserInfo({ ...result.userInfo, couponBalance: Math.max(Number(result.userInfo?.couponBalance || 0), carriedCoupon) });
      setAiAnalysis(options.keepAnalysis ? aiAnalysis : null);
      setRawAiAnalysis(options.keepAnalysis ? rawAiAnalysis : null);
      setAnalysisZenMessage(options.keepAnalysis ? analysisZenMessage : '');
      setFeedbackToast('');
      setIsPremiumUnlocked(Boolean(options.keepPremium));
      setIsEnglishTranslationPending(false);
      if (!options.preserveStage) {
        setStage(2);
      }
    } catch (err) {
      setError(err.message || (lang === 'en' ? 'Cloud analysis failed.' : '云端排盘失败，请稍后重试。'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll to top when stage changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage]);

  const handleCalculate = async (data) => {
    await requestChartAnalysis(data, {
      preserveStage: false,
      keepPremium: false,
      keepAnalysis: false
    });
  }

  const handleAiAnalysis = async () => {
    if (!baziResult || !userInfo) return;
    
    setStage(3);
    setIsLoading(true);
    setIsEnglishTranslationPending(lang === 'en');
    try {
      const { jobId } = await createJob('report', {
        userInfo,
        baziResult,
        namingResult
      });
      const result = await waitForJob(jobId);
      if (lang === 'en') {
        const rawReport = result.report || ''
        const rawZenMessage = baziResult.zenMessage || ''
        const localMirrorReport = buildLocalEnglishAnalysisContent(baziResult, t)
        setRawAiAnalysis(rawReport)
        setAiAnalysis(rawReport && !containsChinese(rawReport) ? rawReport : localMirrorReport)
        setAnalysisZenMessage(cleanEnglishText(rawZenMessage, 'Stay grounded, move with timing, and let clarity guide each next step.'))
        setIsLoading(false);
        const translated = await runOptionalJob('translate', {
          targetLang: 'en',
          texts: {
            report: rawReport,
            zenMessage: rawZenMessage
          },
          userInfo,
          baziResult,
          namingResult
        }, {
          logLabel: 'DeepSeek background translation'
        })
        if (translated) {
          setAiAnalysis(translated.texts?.report || rawReport)
          setAnalysisZenMessage(translated.texts?.zenMessage || rawZenMessage)
        }
      } else {
        setRawAiAnalysis(result.report);
        setAiAnalysis(result.report);
        setAnalysisZenMessage(baziResult.zenMessage || '')
      }
    } catch (err) {
      setError(err.message || (lang === 'en' ? 'Cloud report generation failed.' : '云端报告生成失败，请稍后重试。'));
    } finally {
      setIsEnglishTranslationPending(false)
      if (lang !== 'en') {
        setIsLoading(false);
      }
    }
  }

  const handleFeedbackSubmit = async (dimensions) => {
    if (!userInfo || !baziResult) return;
    setIsFeedbackSubmitting(true);
    try {
      const { jobId } = await createJob('feedback', {
        sequence: userInfo.sequence,
        sessionId: userInfo.sessionId,
        ip: userInfo.ip,
        plan: userInfo.plan || 'free',
        birthBazi: baziResult.pillars.map((pillar) => typeof pillar === 'object' ? pillar.char : pillar).reverse().join(' '),
        name: userInfo.name,
        birthPlace: userInfo.isOverseas ? userInfo.worldCountry : userInfo.chinaAddress,
        gender: userInfo.gender,
        reportDurationMs: 0,
        mediaSource: userInfo.mediaSource || 'organic',
        couponBalance: userInfo.couponBalance || 0,
        dimensions
      });
      const result = await waitForJob(jobId);
      setUserInfo((prev) => ({ ...prev, couponBalance: result.couponBalance }));
      setCouponBalance(result.couponBalance);
      setFeedbackToast(t.feedbackPanel.rewardToast);
    } catch (err) {
      setError(err.message || (lang === 'en' ? 'Feedback submission failed.' : '反馈提交失败，请稍后重试。'));
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  const handleUnlockPremium = () => {
    setIsPremiumUnlocked(true);
    setStage(4);
  };

  const handlePremiumPayment = async () => {
    if (!userInfo || !baziResult) return
    if (premiumUnlocked || hasPaidPlan) {
      handleUnlockPremium()
      return
    }

    setIsPaymentSubmitting(true)
    setError(null)

    try {
      const { jobId } = await createJob('payment', {
        sequence: userInfo.sequence,
        sessionId: userInfo.sessionId,
        ip: userInfo.ip,
        plan: userInfo.plan || 'free',
        birthBazi: baziResult.pillars.map((pillar) => typeof pillar === 'object' ? pillar.char : pillar).reverse().join(' '),
        name: userInfo.name,
        birthPlace: userInfo.isOverseas ? userInfo.worldCountry : userInfo.chinaAddress,
        gender: userInfo.gender,
        reportDurationMs: 0,
        mediaSource: userInfo.mediaSource || 'organic',
        couponBalance: availableCoupons,
        paymentMethod,
        useCouponDeduction,
        priceCny: basePriceCny,
        currencyCode: paymentCurrencyCode
      })
      const result = await waitForJob(jobId)
      setUserInfo((prev) => ({
        ...prev,
        ...result.userInfo
      }))
      setCouponBalance(result.userInfo?.couponBalance ?? 0)
      setIsPremiumUnlocked(true)
      setStage(4)
    } catch (err) {
      setError(err.message || (lang === 'en' ? 'Payment bridge failed.' : '支付桥梁失败，请稍后重试。'))
    } finally {
      setIsPaymentSubmitting(false)
    }
  }

  const handleRestart = () => {
    setStage(1)
    setBaziResult(null)
    setNamingResult(null)
    setUserInfo(null)
    setAiAnalysis(null)
    setRawAiAnalysis(null)
    setAnalysisZenMessage('')
    setIsLoading(false)
    setIsSubmitting(false)
    setIsFeedbackSubmitting(false)
    setIsPaymentSubmitting(false)
    setIsEnglishTranslationPending(false)
    setError(null)
    setIsPremiumUnlocked(false)
    setFeedbackToast('')
    setUseCouponDeduction(false)
    setPaymentMethod(lang === 'en' ? 'applepay' : 'wechat')
    sessionStorage.removeItem(SESSION_SNAPSHOT_KEY)
  }

  const getElementColor = (el) => {
    const map = {
      'Wood': 'text-emerald-600',
      'Fire': 'text-red-600',
      'Earth': 'text-amber-600',
      'Metal': 'text-gray-400',
      'Water': 'text-blue-600'
    };
    // If element is in Chinese
    const cnMap = { '木': 'Wood', '火': 'Fire', '土': 'Earth', '金': 'Metal', '水': 'Water' };
    const key = cnMap[el] || el;
    return map[key] || 'text-[#2C2C2C]';
  };

  const paymentCopy = t.paymentBridge;
  const parsedAnalysis = parseAnalysisContent(visibleAnalysisContent, t, lang)
  const hasAnalysisContent = Boolean(String(visibleAnalysisContent || '').trim())
  const showEnglishAnalysisPlaceholder = lang === 'en' && isLoading && !hasAnalysisContent
  const showEnglishZenPlaceholder = lang === 'en' && isLoading && !String(visibleZenMessage || '').trim()
  const paymentMethods = useGlobalPaymentMethods
    ? [
        { id: 'applepay', label: paymentCopy.applePay, icon: Smartphone, tone: 'from-zinc-50 to-white' },
        { id: 'googlepay', label: paymentCopy.googlePay, icon: Globe, tone: 'from-blue-50 to-white' },
        { id: 'card', label: paymentCopy.creditCard, icon: CreditCard, tone: 'from-sky-50 to-white' },
        { id: 'bnpl', label: paymentCopy.bnpl, icon: Wallet, tone: 'from-violet-50 to-white' },
        { id: 'alipay', label: paymentCopy.alipay, icon: QrCode, tone: 'from-cyan-50 to-white' }
      ]
    : [
        { id: 'wechat', label: paymentCopy.wechat, icon: QrCode, tone: 'from-emerald-50 to-white' },
        { id: 'alipay', label: paymentCopy.alipay, icon: Wallet, tone: 'from-cyan-50 to-white' }
      ];
  const paymentActionLabel = payableCny === 0 ? paymentCopy.unlockFree : paymentCopy.unlockPaid;
  // 真实收款二维码映射：(语言地区, 支付方式) -> 图片路径
  const paymentQrSrc = useGlobalPaymentMethods
    ? (paymentMethod === 'alipay' ? '/qr/alipay-128.jpg' : '')
    : (paymentMethod === 'wechat' ? '/qr/wechat-68.jpg' : paymentMethod === 'alipay' ? '/qr/alipay-68.jpg' : '');
  const paymentQrAmount = useGlobalPaymentMethods ? 128 : 68;

  if (route === 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F0E6] px-4 py-10 text-[#2C2C2C]">
        <Suspense fallback={<div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center text-[#2C2C2C]/70">{t.calculating}</div>}>
          <AdminDashboard
            lang={lang}
            onExit={() => {
              window.location.hash = '';
            }}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#2C2C2C] font-sans selection:bg-[#B22222] selection:text-[#F5F0E6] text-lg">
      <header className="bg-[#F5F0E6] border-b border-[#2C2C2C]/10 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
          {/* Logo & Title & Slogan Container */}
          <div className="flex flex-col gap-4 cursor-pointer w-full" onClick={() => setStage(1)}>
            
            {/* Top Row: Logo & Title + Taiji (Mobile only right aligned) */}
            <div className="flex justify-between items-start w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#B22222] rounded-lg flex items-center justify-center text-[#F5F0E6] shadow-lg flex-shrink-0">
                  <span className={lang === 'en' ? 'font-serif font-bold text-[11px] uppercase tracking-[0.24em] pl-1' : 'font-serif font-bold text-xl'}>
                    {t.logoGlyph || '禅'}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-bold font-serif tracking-wide whitespace-nowrap">{t.title}</h1>
                  <p className="text-xs opacity-60 uppercase tracking-widest whitespace-nowrap">{t.brandLatin}</p>
                </div>
              </div>
              
              {/* Taiji Icon (Mobile visible here, hidden on Desktop to show in correct place) */}
              <div className="md:hidden w-10 h-10 opacity-90 hover:rotate-180 transition-transform duration-700 ease-in-out cursor-pointer flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <circle cx="50" cy="50" r="50" fill="#2C2C2C" />
                  <path d="M50,100 A50,50 0 0,1 50,0 A25,25 0 0,1 50,50 A25,25 0 0,0 50,100 Z" fill="#F5F0E6" />
                  <circle cx="50" cy="25" r="6" fill="#2C2C2C" />
                  <circle cx="50" cy="75" r="6" fill="#F5F0E6" />
                </svg>
              </div>
            </div>
            
            {/* Bottom Row: Slogans */}
            <div className="pl-0 md:pl-[3.25rem] w-full">
              <p className={`${lang === 'en' ? 'font-serif tracking-normal' : "font-['STKaiti','楷体','BiaoKai','serif'] tracking-wide"} text-sm md:text-base text-[#8B6508] opacity-85`}>
                {t.subtitle}
              </p>
            </div>
          </div>
          
          {/* Taiji Icon (Desktop Only - Right Aligned) */}
          <div className="hidden md:flex w-12 h-12 opacity-90 hover:rotate-180 transition-transform duration-700 ease-in-out cursor-pointer flex-shrink-0 ml-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="50" cy="50" r="50" fill="#2C2C2C" />
              <path d="M50,100 A50,50 0 0,1 50,0 A25,25 0 0,1 50,50 A25,25 0 0,0 50,100 Z" fill="#F5F0E6" />
              <circle cx="50" cy="25" r="6" fill="#2C2C2C" />
              <circle cx="50" cy="75" r="6" fill="#F5F0E6" />
            </svg>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        
        {/* Stage 1: Input Form */}
        {stage === 1 && (
          <div className="w-full max-w-2xl animate-in fade-in zoom-in duration-500 space-y-8">
            {/* Intro Text Box */}
            <div className="bg-[#F5F0E6] p-8 md:p-10 rounded-xl border border-[#2C2C2C]/10 shadow-sm relative overflow-hidden">
              {/* Decorative Corner Elements */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#8B6508]/20 rounded-tl-xl m-2 pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#8B6508]/20 rounded-br-xl m-2 pointer-events-none"></div>
              
              {/* Background Watermark */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
                <span className="font-serif text-[12rem] whitespace-nowrap">{t.introWatermark || '命理'}</span>
              </div>

              <div className={`${lang === 'en' ? 'font-serif text-[15px] leading-7 md:text-[16px] md:leading-8 tracking-normal' : "font-['STKaiti','楷体','BiaoKai','serif'] text-[15px] leading-loose md:text-[16px] md:leading-[2.2] tracking-wide"} relative z-10 text-[#4A3C31] space-y-4 text-justify`}>
                <p className={lang === 'en' ? '' : 'indent-8'}>{t.introP1}</p>
                <p className={lang === 'en' ? '' : 'indent-8'}>{t.introP2}</p>
                <p className={lang === 'en' ? '' : 'indent-8'}>{t.introP3}</p>
                <p className={lang === 'en' ? '' : 'indent-8'}>{t.introP4}</p>
                <p className={lang === 'en' ? '' : 'indent-8'}>{t.introP5}</p>
              </div>
            </div>

             <Suspense fallback={<div className="rounded-xl bg-white/60 p-6 text-center text-[#2C2C2C]/70">{t.calculating}</div>}>
               <BaZiForm onSubmit={handleCalculate} lang={lang} setLang={setLang} />
             </Suspense>
             {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Stage 2: BaZi Chart & Naming */}
        {stage === 2 && baziResult && (
          <div className="w-full max-w-4xl space-y-8 animate-in slide-in-from-right duration-700">
             
             {/* 1. BaZi Core Chart */}
             <div className="bg-[#F5F0E6] p-8 rounded-xl border border-[#2C2C2C]/10 shadow-lg relative overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10">
                 {/* Pillars */}
                 <div className="md:col-span-7">
                   <h2 className="text-2xl font-bold text-[#B22222] font-serif border-l-4 border-[#B22222] pl-4 mb-8">
                     {t.baziCore}
                   </h2>
                   <div className="relative mb-24">
                     {/* SVG Connection Lines for Branch Relations with Gap for Text */}
                     {baziResult.strengthAnalysis?.relations && (
                       <>
                         <svg className="absolute top-[100%] left-0 w-full h-24 pointer-events-none z-10" viewBox="0 0 100 60" preserveAspectRatio="none" style={{ overflow: 'visible', marginTop: '0.5rem' }}>
                           {/* Render He (Harmony) relations */}
                           {baziResult.strengthAnalysis.relations.hasHe && baziResult.strengthAnalysis.relations.heDetails.map((he, idx) => {
                             if (he.indices && he.indices.length >= 2) {
                               const sortedIndices = [...he.indices].sort((a, b) => b - a);
                               const col1Idx = 3 - sortedIndices[0];
                               const col2Idx = 3 - sortedIndices[sortedIndices.length - 1];
                               
                               const x1 = 12.5 + col1Idx * 25;
                               const x2 = 12.5 + col2Idx * 25;
                               const xMid = (x1 + x2) / 2;
                               const yBase = 15 + idx * 13;
                               
                               const isGongHeOrBanHe = he.type === 'gonghe' || he.type === 'banhe';
                               const color = '#D4AF37'; // Golden
                               const dash = isGongHeOrBanHe ? '4 4' : 'none';
                               
                               const gap = 5; // Percentage gap for text
                               const { leftD, rightD } = getSplitPathD(x1, x2, yBase, gap);

                               return (
                                 <g key={`he-path-${idx}`}>
                                   <path 
                                     d={leftD} 
                                     fill="none" 
                                     stroke={color} 
                                     strokeWidth="1.5" 
                                     strokeDasharray={dash} 
                                     vectorEffect="non-scaling-stroke"
                                   />
                                   <path 
                                     d={rightD} 
                                     fill="none" 
                                     stroke={color} 
                                     strokeWidth="1.5" 
                                     strokeDasharray={dash} 
                                     vectorEffect="non-scaling-stroke"
                                   />
                                 </g>
                               );
                             }
                             return null;
                           })}

                           {/* Render Chong (Clash) relations */}
                           {baziResult.strengthAnalysis.relations.hasChong && baziResult.strengthAnalysis.relations.chongDetails.map((chong, idx) => {
                             if (chong.indices && chong.indices.length === 2) {
                               const sortedIndices = [...chong.indices].sort((a, b) => b - a);
                               const col1Idx = 3 - sortedIndices[0];
                               const col2Idx = 3 - sortedIndices[1];
                               
                               const x1 = 12.5 + col1Idx * 25;
                               const x2 = 12.5 + col2Idx * 25;
                               const xMid = (x1 + x2) / 2;
                               const heOffset = baziResult.strengthAnalysis.relations.heDetails?.length || 0;
                               const yBase = 15 + (heOffset + idx) * 13;
                               
                               const color = '#111827'; // Black
                               const dash = '4 4';
                               const gap = 5;
                               const { leftD, rightD } = getSplitPathD(x1, x2, yBase, gap);

                               return (
                                 <g key={`chong-path-${idx}`}>
                                   <path 
                                     d={leftD} 
                                     fill="none" 
                                     stroke={color} 
                                     strokeWidth="1.5" 
                                     strokeDasharray={dash} 
                                     vectorEffect="non-scaling-stroke"
                                   />
                                   <path 
                                     d={rightD} 
                                     fill="none" 
                                     stroke={color} 
                                     strokeWidth="1.5" 
                                     strokeDasharray={dash} 
                                     vectorEffect="non-scaling-stroke"
                                   />
                                 </g>
                               );
                             }
                             return null;
                           })}

                           {/* Render Xing (Penalty) relations */}
                           {baziResult.strengthAnalysis.relations.hasXing && baziResult.strengthAnalysis.relations.xingDetails.map((xing, idx) => {
                             if (xing.indices && xing.indices.length >= 2) {
                               const sortedIndices = [...xing.indices].sort((a, b) => b - a);
                               const col1Idx = 3 - sortedIndices[0];
                               const col2Idx = 3 - sortedIndices[sortedIndices.length - 1];
                               
                               const x1 = 12.5 + col1Idx * 25;
                               const x2 = 12.5 + col2Idx * 25;
                               const xMid = (x1 + x2) / 2;
                               const heOffset = baziResult.strengthAnalysis.relations.heDetails?.length || 0;
                               const chongOffset = baziResult.strengthAnalysis.relations.chongDetails?.length || 0;
                               const yBase = 15 + (heOffset + chongOffset + idx) * 13;
                               
                               const color = '#111827'; // Black
                               const dash = '4 4';
                               const gap = 5;
                               const { leftD, rightD } = getSplitPathD(x1, x2, yBase, gap);

                               return (
                                 <g key={`xing-path-${idx}`}>
                                   <path 
                                     d={leftD} 
                                     fill="none" 
                                     stroke={color} 
                                     strokeWidth="1.5" 
                                     strokeDasharray={dash} 
                                     vectorEffect="non-scaling-stroke"
                                   />
                                   <path 
                                     d={rightD} 
                                     fill="none" 
                                     stroke={color} 
                                     strokeWidth="1.5" 
                                     strokeDasharray={dash} 
                                     vectorEffect="non-scaling-stroke"
                                   />
                                 </g>
                               );
                             }
                             return null;
                           })}
                         </svg>

                         {/* Layer 2: Embedded HTML Text Overlay */}
                         <div className="absolute top-[100%] left-0 w-full h-24 pointer-events-none z-20" style={{ marginTop: '0.5rem' }}>
                           {/* He Labels */}
                           {baziResult.strengthAnalysis.relations.hasHe && baziResult.strengthAnalysis.relations.heDetails.map((he, idx) => {
                             if (he.indices && he.indices.length >= 2) {
                               const sortedIndices = [...he.indices].sort((a, b) => b - a);
                               const col1Idx = 3 - sortedIndices[0];
                               const col2Idx = 3 - sortedIndices[sortedIndices.length - 1];
                               
                               const isGongHeOrBanHe = he.type === 'gonghe' || he.type === 'banhe';
                               const color = '#D4AF37';
                               const label = isGongHeOrBanHe ? (lang === 'en' ? 'Half/Arch' : (lang === 'zh-TW' ? '暗/半合' : '暗/半合')) : (lang === 'en' ? 'Harmony' : '合');
                               const yBase = 15 + idx * 13;

                               const avgColIdx = (col1Idx + col2Idx) / 2;
                               const leftPct = 12.5 + avgColIdx * 25;
                               const topPct = (yBase / 60) * 100; 

                               return (
                                 <div 
                                   key={`he-label-${idx}`}
                                   className="absolute transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold z-30"
                                   style={{ 
                                     left: `${leftPct}%`, 
                                     top: `${topPct}%`, 
                                     color: color,
                                   }}
                                 >
                                   {label}
                                 </div>
                               );
                             }
                             return null;
                           })}

                           {/* Chong Labels */}
                           {baziResult.strengthAnalysis.relations.hasChong && baziResult.strengthAnalysis.relations.chongDetails.map((chong, idx) => {
                             if (chong.indices && chong.indices.length === 2) {
                               const sortedIndices = [...chong.indices].sort((a, b) => b - a);
                               const col1Idx = 3 - sortedIndices[0];
                               const col2Idx = 3 - sortedIndices[1];
                               
                               const heOffset = baziResult.strengthAnalysis.relations.heDetails?.length || 0;
                               const yBase = 15 + (heOffset + idx) * 13;
                               
                               const color = '#111827';
                               const avgColIdx = (col1Idx + col2Idx) / 2;
                               const leftPct = 12.5 + avgColIdx * 25;
                               const topPct = (yBase / 60) * 100;

                               return (
                                 <div 
                                   key={`chong-label-${idx}`}
                                   className="absolute transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold z-30"
                                   style={{ 
                                     left: `${leftPct}%`, 
                                     top: `${topPct}%`, 
                                     color: color,
                                   }}
                                 >
                                   {lang === 'en' ? 'Clash' : lang === 'zh-TW' ? '沖' : '冲'}
                                 </div>
                               );
                             }
                             return null;
                           })}

                           {/* Xing Labels */}
                           {baziResult.strengthAnalysis.relations.hasXing && baziResult.strengthAnalysis.relations.xingDetails.map((xing, idx) => {
                             if (xing.indices && xing.indices.length >= 2) {
                               const sortedIndices = [...xing.indices].sort((a, b) => b - a);
                               const col1Idx = 3 - sortedIndices[0];
                               const col2Idx = 3 - sortedIndices[sortedIndices.length - 1];
                               
                               const heOffset = baziResult.strengthAnalysis.relations.heDetails?.length || 0;
                               const chongOffset = baziResult.strengthAnalysis.relations.chongDetails?.length || 0;
                               const yBase = 15 + (heOffset + chongOffset + idx) * 13;
                               
                               const color = '#111827';
                               const avgColIdx = (col1Idx + col2Idx) / 2;
                               const leftPct = 12.5 + avgColIdx * 25;
                               const topPct = (yBase / 60) * 100;

                               return (
                                 <div 
                                   key={`xing-label-${idx}`}
                                   className="absolute transform -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold z-30"
                                   style={{ 
                                     left: `${leftPct}%`, 
                                     top: `${topPct}%`, 
                                     color: color,
                                   }}
                                 >
                                   {lang === 'en' ? 'Penalty' : '刑'}
                                 </div>
                               );
                             }
                             return null;
                           })}
                         </div>
                       </>
                     )}
                   <div className="flex justify-between md:justify-around gap-2 text-center w-full items-stretch">
                      {[3, 2, 1, 0].map((idx, i) => {
                        const pillar = baziResult.pillars[idx];
                        const isObj = typeof pillar === 'object';
                        return (
                               <div key={i} className="flex flex-col items-center flex-1 min-w-[70px] md:min-w-[80px]">
                                 <span className="text-xs text-[#2C2C2C]/50 mb-2">{t.pillars[i]}</span>
                                 <div className="border border-[#2C2C2C]/10 rounded-lg bg-[#F5F0E6] w-full flex flex-col items-center shadow-inner text-[#2C2C2C] transition-transform hover:scale-105 duration-300 h-full min-h-[22rem] justify-between">
                                     {/* Chinese Char (Vertical Display, Centered) */}
                                       <div className="flex flex-col items-center justify-start text-3xl md:text-4xl font-bold pb-4 border-b border-[#2C2C2C]/5 w-full pt-4 min-h-[8rem] gap-2 md:gap-4 tracking-widest">
                                         <span className="block leading-none">{isObj ? pillar.char[0] : pillar[0]}</span>
                                         <span className="block leading-none">{isObj ? pillar.char[1] : pillar[1]}</span>
                                       </div>
                                     
                                     {/* Hidden Stems */}
                                    <div className="w-full bg-[#2C2C2C]/5 p-1 flex flex-col gap-1 text-center justify-end mb-1 mt-auto">
                                     {isObj && pillar.hiddenStems && pillar.hiddenStems.map((hs, idx) => (
                                       <div key={idx} className="flex flex-col md:flex-row justify-center md:justify-between items-center px-0.5 py-0.5 border-b border-[#2C2C2C]/5 last:border-0">
                                          <span className={`font-bold ${getElementColor(hs.element)} text-xs md:text-[11px] text-center shrink-0 mb-0.5 md:mb-0`}>
                                            {lang === 'en' ? (ELEMENT_MAPPING[hs.stem] || hs.stem) : hs.stem}
                                          </span>
                                          {lang === 'en' ? (
                                            <div className="flex flex-col items-center md:items-start justify-center md:ml-1 w-full text-[9px] md:text-[8px] text-[#2C2C2C]/80 font-medium leading-tight">
                                              <span className="w-full text-center md:text-left break-words">[{hs.shiShen?.en || 'N/A'}]</span>
                                              <span className="w-full text-center md:text-left break-words">[{hs.shiShen?.enRel || 'N/A'}]</span>
                                            </div>
                                          ) : (
                                            <span className="text-[10px] md:text-[9px] text-[#2C2C2C]/80 font-medium md:ml-1 leading-tight text-center md:text-left break-words" style={{ letterSpacing: '-0.5px', wordBreak: 'break-all', whiteSpace: 'normal' }}>
                                              [{`${hs.shiShen?.name}/${hs.shiShen?.relative}`}]
                                            </span>
                                          )}
                                       </div>
                                     ))}
                                  </div>

                                  {/* English Details */}
                                  {isObj && pillar.gan && pillar.zhi && lang === 'en' && (
                                    <div className="w-full bg-white/40 border-t border-[#2C2C2C]/10 py-2 px-1 flex flex-col gap-0.5 text-center min-h-[2.5rem] justify-center">
                                      <div className="text-[10px] font-bold text-[#A83232] leading-tight">
                                        {pillar.gan.en} {pillar.zhi.en}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                   </div>
                 </div>
                 </div>

                 {/* Strength & Day Master */}
                 <div className="md:col-span-5 flex flex-col justify-between h-full">
                   <div>
                     <h3 className="text-base font-bold text-[#2C2C2C]/60 uppercase tracking-wider mb-4">{t.strength}</h3>
                     <div className="bg-[#B22222]/5 p-6 rounded-xl border border-[#B22222]/10">
                       <div className="flex justify-between items-center mb-4">
                         <span className="font-bold text-[#2C2C2C] text-xl flex items-center gap-4">
                           <span>
                             {t.dayMaster}: {lang === 'en' ? (ELEMENT_MAPPING[baziResult.dayMaster] || baziResult.dayMaster) : baziResult.dayMaster} ({lang === 'en' ? (ELEMENT_MAPPING[baziResult.dayMasterElement] || baziResult.dayMasterElement) : baziResult.dayMasterElement})
                           </span>
                           <span className="text-base font-normal opacity-80 border-l border-[#2C2C2C]/20 pl-4">
                             {lang === 'en' ? 'Chinese Zodiac: ' : (lang === 'zh-TW' ? '屬相：' : '属相：')}
                            {(() => {
                              const branch = baziResult.pillars[3].char[1];
                              const cnMap = { '子':'鼠', '丑':'牛', '寅':'虎', '卯':'兔', '辰':'龙', '巳':'蛇', '午':'马', '未':'羊', '申':'猴', '酉':'鸡', '戌':'狗', '亥':'猪' };
                              const tcMap = { '子':'鼠', '丑':'牛', '寅':'虎', '卯':'兔', '辰':'龍', '巳':'蛇', '午':'馬', '未':'羊', '申':'猴', '酉':'雞', '戌':'狗', '亥':'豬' };
                              if (lang === 'en') return getEnglishZodiacLabel(branch);
                              if (lang === 'zh-TW') return tcMap[branch] || branch;
                              return cnMap[branch] || branch;
                            })()}
                           </span>
                         </span>
                         <span className={`px-3 py-1.5 rounded text-sm font-bold ${
                          strengthBadgeIsStrong
                           ? 'bg-red-100 text-red-800' 
                           : 'bg-blue-100 text-blue-800'
                         }`}>
                          {visibleStrengthRating}
                         </span>
                       </div>
                       <p className="text-base opacity-80 leading-relaxed text-justify">
                        {visibleStrengthDescription}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Major Luck Pillars */}
               <div className="w-full mt-10 border-t border-[#2C2C2C]/10 pt-8">
                  <h3 className="text-base font-bold text-[#2C2C2C]/60 uppercase tracking-wider mb-6">{t.daYun}</h3>
                  <div className="flex flex-wrap justify-between gap-3 w-full">
                    {baziResult.daYunList.map((yun, index) => {
                      const isCurrent = baziResult.currentDaYun && baziResult.currentDaYun.startAge === yun.startAge;
                      const isObj = typeof yun.ganZhi === 'object';
                      return (
                        <div key={index} className={`flex-1 min-w-[5rem] py-4 px-2 rounded-xl border ${isCurrent ? 'bg-[#B22222] text-[#F5F0E6] border-[#B22222] shadow-lg scale-105' : 'bg-[#F5F0E6] border-[#2C2C2C]/10 text-gray-600'} flex flex-col items-center justify-center gap-2 transition-all duration-300`}>
                          <span className="text-base opacity-70 font-medium">{yun.startAge}</span>
                          <span className={`text-2xl font-bold ${isCurrent ? 'text-[#F5F0E6]' : 'text-[#2C2C2C]'}`}>{isObj ? yun.ganZhi.char : yun.ganZhi}</span>
                          {isObj && yun.ganZhi.enShort && <span className={`text-xs font-medium ${isCurrent ? 'opacity-90' : 'opacity-80'}`}>{yun.ganZhi.enShort}</span>}
                          <span className={`text-xs whitespace-nowrap ${isCurrent ? 'opacity-80' : 'opacity-60'}`}>{lang === 'en' ? yun.timeRange : yun.startYear}</span>
                        </div>
                      );
                    })}
                  </div>
               </div>
             </div>

             {/* 2. Naming Analysis */}
             {namingResult && (
               <Suspense fallback={<div className="rounded-xl bg-white/60 p-6 text-center text-[#2C2C2C]/70">{t.calculating}</div>}>
                 <NamingAnalysis result={namingResult} lang={lang} />
               </Suspense>
             )}

             {/* Navigation to Stage 3 */}
             <div className="flex justify-center pt-8">
               <button
                 onClick={handleAiAnalysis}
                 className="bg-[#B22222] text-[#F5F0E6] px-10 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-3 text-xl group"
               >
                 <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                 {t.cloud.viewFullAnalysis}
                 <TrendingUp className="w-5 h-5 ml-2" />
               </button>
             </div>
          </div>
        )}

        {/* Stage 3: AI Report */}
        {stage === 3 && (
          <div className="w-full max-w-4xl animate-in slide-in-from-right duration-700">
            <div className="bg-white p-10 rounded-xl border border-[#2C2C2C]/10 shadow-lg min-h-[60vh]">
               {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 space-y-6">
                      <Loader2 className="w-12 h-12 animate-spin text-[#B22222]" />
                      <p className="text-xl font-serif text-[#2C2C2C]/60 animate-pulse">
                          {t.cloud.divining}
                      </p>
                  </div>
               ) : (
                   <div className="space-y-8">
                     <div className="flex items-center gap-3 mb-6 border-b border-[#2C2C2C]/10 pb-4">
                        <Sparkles className="w-6 h-6 text-[#B22222]" />
                        <h2 className="text-2xl font-bold font-serif text-[#2C2C2C]">{t.aiReport}</h2>
                     </div>
                     <div className="space-y-6 text-[#2C2C2C]/90">
                       <div className="border-b border-[#2C2C2C]/8 pb-4">
                         <h3 className="text-2xl font-bold font-serif text-[#2C2C2C]">
                           {parsedAnalysis.title}
                         </h3>
                       </div>
                       {showEnglishAnalysisPlaceholder ? (
                         <div className="space-y-6 py-2">
                           <div className="flex items-center gap-3 text-[#B22222]">
                             <Loader2 className="h-5 w-5 animate-spin" />
                             <span className="font-serif text-lg">{t.cloud.divining}</span>
                           </div>
                           {[0, 1, 2].map((block) => (
                             <div key={block} className="space-y-3 rounded-2xl border border-[#2C2C2C]/8 bg-[#F5F0E6]/45 p-5">
                               <div className="h-6 w-56 animate-pulse rounded-full bg-[#B22222]/10" />
                               <div className="space-y-2">
                                 <div className="h-4 w-full animate-pulse rounded-full bg-[#2C2C2C]/8" />
                                 <div className="h-4 w-11/12 animate-pulse rounded-full bg-[#2C2C2C]/8" />
                                 <div className="h-4 w-4/5 animate-pulse rounded-full bg-[#2C2C2C]/8" />
                               </div>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="space-y-6">
                           {parsedAnalysis.sections.map((section) => (
                             <section key={section.heading} className="space-y-3">
                               <h4 className="text-xl font-bold font-serif text-[#B22222]">
                                 {section.heading}
                               </h4>
                               <div className="whitespace-pre-wrap break-words leading-relaxed">
                                 {section.body}
                               </div>
                             </section>
                           ))}
                         </div>
                       )}
                     </div>

                     {/* AI Zen Message */}
                     <div className="mt-8 pt-8 border-t border-[#2C2C2C]/10">
                       <h3 className="text-xl font-bold font-serif text-[#B22222] mb-4 flex items-center gap-2">
                         <span className="text-2xl">🌱</span> 
                         {t.cloud.zenWisdom}
                       </h3>
                       <div className="bg-[#F5F0E6] p-6 rounded-xl border border-[#2C2C2C]/10 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                          <span className="text-4xl font-serif tracking-[0.3em]">ZEN</span>
                         </div>
                        {showEnglishZenPlaceholder ? (
                          <div className="relative z-10 space-y-3 py-1">
                            <div className="h-4 w-full animate-pulse rounded-full bg-[#2C2C2C]/8" />
                            <div className="h-4 w-10/12 animate-pulse rounded-full bg-[#2C2C2C]/8" />
                            <div className="h-4 w-8/12 animate-pulse rounded-full bg-[#2C2C2C]/8" />
                          </div>
                        ) : (
                          <p className="text-lg text-[#2C2C2C]/80 leading-relaxed font-serif italic relative z-10 text-justify">
                            {visibleZenMessage}
                          </p>
                        )}
                       </div>
                     </div>

                     <div className="mt-10 rounded-3xl border border-[#8B6508]/15 bg-[#F5F0E6] p-6 md:p-8 shadow-sm">
                       <div className="flex flex-col gap-6">
                         <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                           <div className="space-y-3">
                             <div className="inline-flex items-center gap-2 rounded-full bg-[#B22222]/8 px-4 py-2 text-sm font-semibold text-[#B22222]">
                               <BadgeCheck className="h-4 w-4" />
                               {userCount !== null
                                 ? (lang === 'zh-CN'
                                   ? `已有 ${userCount.toLocaleString()} 用户获取了深度解析`
                                   : lang === 'zh-TW'
                                   ? `已有 ${userCount.toLocaleString()} 用戶獲取了深度解析`
                                   : `${userCount.toLocaleString()} users have unlocked the deep analysis`)
                                 : paymentCopy.socialProof}
                             </div>
                             <div>
                               <h3 className="text-2xl font-bold font-serif text-[#2C2C2C]">{paymentCopy.title}</h3>
                             </div>
                           </div>

                           <div className="rounded-2xl border border-[#2C2C2C]/10 bg-white/80 p-5 text-sm text-[#2C2C2C]/75 min-w-[17rem]">
                             <div className="space-y-3">
                               <div className="flex items-center justify-between gap-4">
                                 <span className="font-semibold text-[#2C2C2C]">Price</span>
                                 <span className="text-right font-mono text-[#B22222]">{multiCurrencyDisplay}</span>
                               </div>
                               <div className="flex items-center justify-between gap-4">
                                 <span className="font-semibold text-[#2C2C2C]">Coupons</span>
                                 <span className="font-mono text-[#8B6508]">{availableCoupons}</span>
                               </div>
                               <div className="flex items-center justify-between gap-4">
                                 <span className="font-semibold text-[#2C2C2C]">{paymentCopy.planLabel}</span>
                                 <span className="font-mono text-[#2C2C2C]">{paymentCopy.planValuePaid}</span>
                               </div>
                             </div>
                             <div className="mt-4 space-y-2 border-t border-[#2C2C2C]/8 pt-4">
                               <div className="flex items-center justify-between">
                                 <span>{paymentCopy.paymentMethod}</span>
                                 <span>{paymentMethods.find((item) => item.id === paymentMethod)?.label || paymentMethods[0]?.label}</span>
                               </div>
                               <div className="flex items-center justify-between">
                                 <span>{paymentCopy.originalPrice}</span>
                                <span>{multiCurrencyDisplay}</span>
                               </div>
                               <div className="flex items-center justify-between text-[#8B6508]">
                                 <span>{paymentCopy.deduction}</span>
                                <span>-{priceCurrencySymbol}{couponDeduction}</span>
                               </div>
                               <div className="flex items-center justify-between font-bold text-[#B22222]">
                                 <span>{paymentCopy.finalPrice}</span>
                                <span>{priceCurrencySymbol}{Math.max(parseInt(displayPrice) - couponDeduction, 0)}</span>
                               </div>
                             </div>
                           </div>
                         </div>

                         <div className="grid gap-4 md:grid-cols-2">
                           <div className="rounded-2xl border border-[#2C2C2C]/10 bg-white/70 p-5">
                             <div className="mb-4 flex items-center gap-2 text-lg font-bold text-[#2C2C2C]">
                               <Lock className="h-5 w-5 text-[#B22222]" />
                              {useGlobalPaymentMethods ? paymentCopy.globalTitle : paymentCopy.domesticTitle}
                             </div>
                             <div className="grid gap-3">
                               {paymentMethods.map((item) => {
                                 const Icon = item.icon
                                 const selected = paymentMethod === item.id
                                 return (
                                   <button
                                     key={item.id}
                                     type="button"
                                     onClick={() => setPaymentMethod(item.id)}
                                     className={`rounded-2xl border p-4 text-left transition-all ${selected ? 'border-[#B22222] bg-[#B22222]/5 shadow-sm' : 'border-[#2C2C2C]/10 bg-gradient-to-br ' + item.tone}`}
                                   >
                                     <div className="flex items-center justify-between gap-3">
                                       <div className="flex items-center gap-3">
                                         <div className="rounded-xl bg-white p-3 shadow-sm">
                                           <Icon className="h-5 w-5 text-[#B22222]" />
                                         </div>
                                         <div>
                                           <p className="font-semibold text-[#2C2C2C]">{item.label}</p>
                                           <p className="text-sm text-[#2C2C2C]/55">
                                            {useGlobalPaymentMethods ? paymentCopy.apiPlaceholder : paymentCopy.qrPlaceholder}
                                           </p>
                                         </div>
                                       </div>
                                       <div className={`h-3 w-3 rounded-full ${selected ? 'bg-[#B22222]' : 'bg-[#2C2C2C]/15'}`} />
                                     </div>
                                   </button>
                                 )
                               })}
                             </div>
                           </div>
                           
                           {/* 真实收款二维码显示区域 */}
                           <div className="rounded-2xl border border-[#2C2C2C]/10 bg-white/70 p-5">
                             <div className="mb-4 flex items-center gap-2 text-lg font-bold text-[#2C2C2C]">
                               <QrCode className="h-5 w-5 text-[#B22222]" />
                               {useGlobalPaymentMethods ? (lang === 'en' ? 'Payment QR Code' : '支付二维码') : (lang === 'en' ? 'Payment QR Code' : '支付二维码')}
                             </div>
                             <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                               {paymentQrSrc ? (
                                 <>
                                   <div className="w-56 h-56 rounded-xl overflow-hidden bg-white border border-[#2C2C2C]/10 shadow-sm">
                                     <img src={paymentQrSrc} alt={paymentMethods.find((item) => item.id === paymentMethod)?.label || 'QR'} className="w-full h-full object-contain" />
                                   </div>
                                   <p className="mt-3 text-sm font-semibold text-[#2C2C2C] text-center">
                                     {paymentMethods.find((item) => item.id === paymentMethod)?.label} · ¥{paymentQrAmount}
                                   </p>
                                   <p className="mt-1 text-xs text-[#B22222] text-center">
                                     {paymentCopy.qrHint}
                                   </p>
                                 </>
                               ) : (
                                 <>
                                   <div className="w-56 h-56 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-white px-4 text-center">
                                     <span className="text-sm text-[#2C2C2C]/50">{paymentCopy.qrUnavailable}</span>
                                   </div>
                                   <p className="mt-3 text-xs text-[#2C2C2C]/40 text-center">
                                     {paymentCopy.qrHint}
                                   </p>
                                 </>
                               )}
                             </div>
                           </div>

                           <div className="rounded-2xl border border-[#2C2C2C]/10 bg-white/70 p-5">
                             <div className="mb-4 flex items-center gap-2 text-lg font-bold text-[#2C2C2C]">
                               <TicketPercent className="h-5 w-5 text-[#8B6508]" />
                               {paymentCopy.couponToggle}
                             </div>
                             <div className="rounded-2xl border border-[#8B6508]/15 bg-[#8B6508]/5 p-4">
                               <p className="text-sm text-[#2C2C2C]/60">{paymentCopy.couponAvailable}</p>
                              <p className="mt-2 text-3xl font-bold text-[#8B6508]">{priceCurrencySymbol}{availableCoupons}</p>
                               <button
                                 type="button"
                                 onClick={() => setUseCouponDeduction((prev) => !prev)}
                                 className={`mt-4 w-full rounded-xl px-4 py-3 font-semibold transition-colors ${useCouponDeduction ? 'bg-[#8B6508] text-white' : 'bg-white text-[#8B6508] border border-[#8B6508]/20'}`}
                               >
                                {useCouponDeduction ? `${paymentCopy.couponApplied}: ${priceCurrencySymbol}${couponDeduction}` : `${paymentCopy.couponToggle} (${priceCurrencySymbol}${availableCoupons})`}
                               </button>
                             </div>
                           </div>
                         </div>

                         <div className="flex justify-center pt-4 md:pt-6">
                           <button
                             onClick={handlePremiumPayment}
                             disabled={isPaymentSubmitting}
                             className="bg-[#B22222] text-white px-10 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-3 text-xl disabled:cursor-not-allowed disabled:opacity-60"
                           >
                             <Lock className="w-6 h-6" />
                             {isPaymentSubmitting ? paymentCopy.processing : (hasPaidPlan ? paymentCopy.enterAdvice : paymentActionLabel)}
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
               )}
            </div>
          </div>
        )}

        {/* Stage 4: Premium Advice */}
        {stage === 4 && (
          <div className="w-full max-w-4xl animate-in slide-in-from-right duration-700">
             <Suspense fallback={<div className="rounded-xl bg-white/60 p-6 text-center text-[#2C2C2C]/70">{t.calculating}</div>}>
               <PremiumAdvice
                 result={baziResult}
                 lang={lang}
                 isUnlocked={premiumUnlocked}
                 couponBalance={userInfo?.couponBalance || 0}
                 plan={userInfo?.plan || 'free'}
                 onFeedbackSubmit={handleFeedbackSubmit}
                 isFeedbackSubmitting={isFeedbackSubmitting}
                 feedbackToast={feedbackToast}
                 onRestart={handleRestart}
               />
             </Suspense>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
