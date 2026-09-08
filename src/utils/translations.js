import { BAZI_MAPPING } from './constants.js';

export function translateGanZhi(char, lang = 'zh-CN') {
  if (lang !== 'en') return char;
  
  // char should be a 2-character string like '庚戌'
  const gan = char[0];
  const zhi = char[1];
  
  const ganInfo = BAZI_MAPPING.stems[gan];
  const zhiInfo = BAZI_MAPPING.branches[zhi];
  
  if (!ganInfo || !zhiInfo) return char;
  
  return {
    char: char,
    gan: { 
      char: gan, 
      en: ganInfo.en, 
      element: ganInfo.element, 
      polarity: ganInfo.polarity 
    },
    zhi: { 
      char: zhi, 
      en: zhiInfo.en, 
      animal: zhiInfo.animal, 
      element: zhiInfo.element 
    },
    enShort: `${ganInfo.en} ${zhiInfo.en}`
  };
}

export const translations = {
  'zh-CN': {
    title: "生命时空密码",
    brandLatin: "Life Space-Time Code",
    subtitle: "融合古法命理与现代AI的深度解析系统",
    inputForm: "输入信息",
    baziCore: "八字命盘",
    nameAnalysis: "姓名(可选)",
    aiReport: "AI 深度解读",
    premium: "锦囊建议",
    calculate: "开始排盘",
    calculating: "排盘中...",
    
    // Intro Text
    introTitle: "缘起",
    introP1: "人海万千，唯心自成。众生各异，使命殊途，这正是独一无二者的珍贵。",
    introP2: "我们皆是人海中匆匆的行者，亦是宇宙间璀璨的星辰。",
    introP3: "特殊的时空，孕育独特的你——如一枚待雕的蓝宝石，潜藏无限可能，静待被唤醒的，是专属你的生命密码。",
    introP4: "选定一个方向，默默深耕，持之以恒，终将迎来曙光。既为社会发光，亦活出自己的分量。",
    introP5: "无论你关切健康、事业、婚姻，还是规划产业与发展之地，我都在你身旁。陪你解锁生命密码，在这片时空中，绽放属于你的，那一抹光。",

    // Form Labels
    name: "名字",
    gender: "性别",
    male: "男",
    female: "女",
    birthDate: "出生日期",
    birthTime: "出生时间",
    unknownTime: "时辰不详",
    birthEnv: "出生环境",
    isOverseas: "出生地",
    domestic: "中国",
    overseas: "海外/其他",
    chinaRegion: "中国大区",
    worldRegion: "世界大区",
    
    // Pillars
    pillars: ["年柱", "月柱", "日柱", "时柱"],
    
    // Results
    dayMaster: "日主",
    strength: "能量评级",
    favorable: "喜用神",
    unfavorable: "忌神",
    daYun: "大运",
    
    // Name Analysis
    surname: "姓",
    givenName: "名",
    strokes: "笔画",
    fiveGe: "姓名五格分析",
    sanCai: "三才配置",
    totalScore: "总评",
    
    // Date
    solarLabel: "出生时间(公历)",
    lunar: "中国农历",
    leap: "闰",
    yearSuffix: "年",
    month: "月",
    day: "日",
    monthShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    solarMonthShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    lunarMonthNames: ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"],
    lunarYearPrefix: "农历",
    logoGlyph: "禅",
    introWatermark: "命理",
    chinaRegionPlaceholder: "省份/城市 (如: 山东)",
    worldRegionPlaceholder: "国家/地区 (如: 美国)",
    
    // Environment Map (for dropdown)
    birthEnvMap: {
      home: "家庭/家中",
      hospitalModern: "现代医院/手术室",
      waterSide: "河道边/船上/水乡",
      vehicle: "行车上/交通工具",
      mountainForest: "山区/森林/乡村老屋",
      underground: "地下室/防空洞"
    },
    cloud: {
      modeLabel: "模式",
      modeValue: "云端镜像",
      planLabel: "方案",
      couponLabel: "消费券",
      viewFullAnalysis: "查看完整解析",
      unlockAdvice: "解锁锦囊建议",
      divining: "正在测算天机...",
      zenWisdom: "智能禅语",
      translationChecking: "翻译门槛校验中...",
      translationBlocked: "英文净化中，原中文内容已被拦截。"
    },
    analysis: {
      title: "生命时空密码解析",
      anchor: "1. 全息时空 · 核心锚点",
      personality_potential: "2. 性格底色与潜能",
      career_wealth: "3. 事业与财运即明",
      action: "4. 流年大运下的行动建议",
      closing: "5. 一句话收束"
    },
    agreement: {
      updateDate: "更新日期",
      effectiveDate: "生效日期",
      company: "公司主体",
      close: "我知道了",
      consentPrefix: "我已阅读并同意",
      consentTitle: "《生命时空密码软件咨询服务协议》",
      required: "请先阅读并同意《生命时空密码软件咨询服务协议》"
    },
    feedbackPanel: {
      title: "五行反馈校准",
      description: "请拖动五行能量柱，校准本次报告在行业匹配、角色感受、财富表现、身体状况与社会地位五个维度上的准确度。",
      elements: {
        metal: "金",
        wood: "木",
        water: "水",
        fire: "火",
        earth: "土"
      },
      body: "基层根基\n与身体素质",
      industry: "事业起步\n与行业契合度",
      role: "情感表达\n与日常心理状态",
      wealth: "物质成果\n与财运精准度",
      status: "资源位阶\n与社会流动性",
      time: "时间",
      submit: "提交反馈",
      rewardToast: "感谢您的反馈，已为您送出 10 元消费券！"
    },
    premiumPanel: {
      subtitle: "深度事业指引、财运机遇与个性化避坑指南。",
      price: "付费栏",
      priceValue: "¥98",
      locked: "内容已锁定",
      lockedHint: "请在上一页解锁查看",
      syncing: "锦囊内容同步中，请稍候重新查看。",
      health: "五运六气 · 精准健康推演",
      direction: "行业赛道与岗位取向",
      avoidance: "职场避坑与行为禁忌",
      actions: "增运实操建议",
      birthConstitution: "先天体质底色（基于出生年 {year}）：{name}，易受损脏腑为【{organ}】。建议结合当月的外邪气场进行针对性养生与防范。",
      disclaimer: "免责声明：本解析基于传统命理与AI算法生成，仅供参考。请理性决策，切勿迷信。"
    },
    paymentBridge: {
      title: "深度解析支付桥梁",
      subtitle: "于此完成支付与消费券抵扣。",
      socialProof: "已有 10,000+ 用户获取了深度解析",
      capacityProof: "",
      domesticTitle: "国内收款",
      globalTitle: "国际收款",
      wechat: "微信支付",
      alipay: "支付宝",
      creditCard: "信用卡",
      paypal: "PayPal",
      applePay: "Apple Pay",
      googlePay: "Google Pay",
      bnpl: "先买后付",
      qrPlaceholder: "二维码占位",
      apiPlaceholder: "接口占位",
      couponToggle: "消费券抵扣",
      couponApplied: "已使用消费券",
      couponAvailable: "可用消费券",
      originalPrice: "原价",
      deduction: "抵扣",
      finalPrice: "应付金额",
      planLabel: "Plan",
      planValuePaid: "Paid",
      paymentMethod: "支付方式",
      unlockPaid: "我已完成支付，解锁锦囊建议",
      unlockFree: "使用消费券直接解锁锦囊建议",
      processing: "支付桥梁处理中...",
      paid: "已完成支付闭环",
      enterAdvice: "进入锦囊建议",
      qrHint: "请扫码完成支付后，点击下方按钮",
      qrUnavailable: "该支付方式暂未提供二维码，请选择微信支付或支付宝"
    },
    personalizedServices: {
      title: "个性化服务",
      description: "如果您想针对以下某一方面的事件，请留下您的联系方式并发咨询内容至邮箱btswws@163.com，并支付相应费用后，以便7天内电子文件（PDF格式）答复。",
      contactTitle: "联系方式",
      contactWechat: "微信",
      contactWhatsapp: "WhatsApp",
      notice: "请留下您的联系方式（邮箱、微信、WhatsApp），并支付相应费用后，我们将在7天内以PDF格式电子文件答复您。"
    },
    restartAnalysis: "重新排盘",
    admin: {
      title: "云端镜像安全后台",
      subtitle: "管理员可查看用户、付款订单与付款后生成内容。",
      login: "管理员登录",
      username: "用户名",
      password: "密码",
      signIn: "登录",
      signOut: "退出",
      month: "月份",
      refresh: "刷新统计",
      metrics: "反馈概览",
      totalRecords: "总记录数",
      paidUsers: "付费用户",
      freeUsers: "免费用户",
      totalCoupons: "消费券总额",
      avgDuration: "平均报告历时",
      accuracy: "准确度",
      latestRecords: "最近记录",
      ip: "IP",
      birthBazi: "八字",
      birthPlace: "出生地",
      mediaSource: "引导媒体",
      decryptTitle: "报告解密入口",
      sequence: "序号",
      decrypt: "解密报告",
      decryptedReport: "解密结果",
      loginHint: "请使用管理员账号进入后台。",
      overview: "数据总览",
      users: "用户管理",
      payments: "付款订单",
      reports: "生成内容",
      search: "搜索",
      empty: "暂无符合条件的数据",
      databaseRequired: "后台数据库尚未启用"
    }
  },
  'zh-TW': {
    title: "生命時空密碼",
    brandLatin: "Life Space-Time Code",
    subtitle: "融合古法命理與現代AI的深度解析系統",
    inputForm: "輸入資訊",
    baziCore: "八字命盤",
    nameAnalysis: "姓名(可選)",
    aiReport: "AI 深度解讀",
    premium: "錦囊建議",
    calculate: "開始排盤",
    calculating: "排盤中...",
    
    // Intro Text
    introTitle: "緣起",
    introP1: "人海萬千，唯心自成。眾生各異，使命殊途，這正是獨一無二者的珍貴。",
    introP2: "我們皆是人海中匆匆的行者，亦是宇宙間璀璨的星辰。",
    introP3: "特殊的時空，孕育獨特的你——如一枚待雕的藍寶石，潛藏無限可能，靜待被喚醒的，是專屬你的生命密碼。",
    introP4: "選定一個方向，默默深耕，持之以恆，終將迎來曙光。既為社會發光，亦活出自己的分量。",
    introP5: "無論你關切健康、事業、婚姻，還是規劃產業與發展之地，我都在你身旁。陪你解鎖生命密碼，在這片時空中，綻放屬於你的，那一抹光。",

    // Form Labels
    name: "名字",
    gender: "性別",
    male: "男",
    female: "女",
    birthDate: "出生日期",
    birthTime: "出生時間",
    unknownTime: "時辰不詳",
    birthEnv: "出生環境",
    isOverseas: "出生地",
    domestic: "中國",
    overseas: "海外/其他",
    chinaRegion: "中國大區",
    worldRegion: "世界大區",
    
    // Pillars
    pillars: ["年柱", "月柱", "日柱", "時柱"],
    
    // Results
    dayMaster: "日主",
    strength: "能量評級",
    favorable: "喜用神",
    unfavorable: "忌神",
    daYun: "大運",
    
    // Name Analysis
    surname: "姓",
    givenName: "名",
    strokes: "筆畫",
    fiveGe: "姓名五格分析",
    sanCai: "三才配置",
    totalScore: "總評",
    
    // Date
    solarLabel: "出生時間(公曆)",
    lunar: "中國農曆",
    leap: "閏",
    yearSuffix: "年",
    month: "月",
    day: "日",
    monthShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    solarMonthShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    lunarMonthNames: ["正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "臘月"],
    lunarYearPrefix: "農曆",
    logoGlyph: "禪",
    introWatermark: "命理",
    chinaRegionPlaceholder: "省份/城市 (如: 山東)",
    worldRegionPlaceholder: "國家/地區 (如: 美國)",
    clash: "沖",
    extremely: "極旺",
    attribute: "屬",
    hospital: "醫院",
    
    // Environment Map (for dropdown)
    birthEnvMap: {
      home: "家庭/家中",
      hospitalModern: "現代醫院/手術室",
      waterSide: "河道邊/船上/水鄉",
      vehicle: "行車上/交通工具",
      mountainForest: "山區/森林/鄉村老屋",
      underground: "地下室/防空洞"
    },
    cloud: {
      modeLabel: "模式",
      modeValue: "雲端鏡像",
      planLabel: "方案",
      couponLabel: "消費券",
      viewFullAnalysis: "查看完整解析",
      unlockAdvice: "解鎖錦囊建議",
      divining: "正在測算天機...",
      zenWisdom: "智慧禪語",
      translationChecking: "翻譯門檻校驗中...",
      translationBlocked: "英文淨化中，原中文內容已被攔截。"
    },
    analysis: {
      title: "生命時空密碼解析",
      anchor: "1. 全息時空 · 核心錨點",
      personality_potential: "2. 性格底色與潛能",
      career_wealth: "3. 事業與財運即明",
      action: "4. 流年大運下的行動建議",
      closing: "5. 一句話收束"
    },
    agreement: {
      updateDate: "更新日期",
      effectiveDate: "生效日期",
      company: "公司主體",
      close: "我知道了",
      consentPrefix: "我已閱讀並同意",
      consentTitle: "《生命時空密碼軟體諮詢服務協議》",
      required: "請先閱讀並同意《生命時空密碼軟體諮詢服務協議》"
    },
    feedbackPanel: {
      title: "五行回饋校準",
      description: "請拖動五行能量柱，校準本次報告在行業匹配、角色感受、財富表現、身體狀況與社會地位五個維度上的準確度。",
      elements: {
        metal: "金",
        wood: "木",
        water: "水",
        fire: "火",
        earth: "土"
      },
      body: "基層根基\n與身體素質",
      industry: "事業起步\n與行業契合度",
      role: "情感表達\n與日常心理狀態",
      wealth: "物質成果\n與財運精準度",
      status: "資源位階\n與社會流動性",
      time: "時間",
      submit: "提交回饋",
      rewardToast: "感謝您的回饋，已為您送出 10 元消費券！"
    },
    premiumPanel: {
      subtitle: "深度事業指引、財運機遇與個性化避坑指南。",
      price: "付費欄",
      priceValue: "¥98",
      locked: "內容已鎖定",
      lockedHint: "請在上一頁解鎖查看",
      syncing: "錦囊內容同步中，請稍候重新查看。",
      health: "五運六氣 · 精準健康推演",
      direction: "行業賽道與崗位取向",
      avoidance: "職場避坑與行為禁忌",
      actions: "增運實操建議",
      birthConstitution: "先天體質底色（基於出生年 {year}）：{name}，易受損臟腑為【{organ}】。建議結合當月的外邪氣場進行針對性養生與防範。",
      disclaimer: "免責聲明：本解析基於傳統命理與AI算法生成，僅供參考。請理性決策，切勿迷信。"
    },
    paymentBridge: {
      title: "深度解析支付橋梁",
      subtitle: "於此完成支付與消費券抵扣。",
      socialProof: "已有 10,000+ 用戶獲取了深度解析",
      capacityProof: "",
      domesticTitle: "國內收款",
      globalTitle: "國際收款",
      wechat: "微信支付",
      alipay: "支付寶",
      creditCard: "信用卡",
      paypal: "PayPal",
      applePay: "Apple Pay",
      googlePay: "Google Pay",
      bnpl: "先買後付",
      qrPlaceholder: "二維碼占位",
      apiPlaceholder: "接口占位",
      couponToggle: "消費券抵扣",
      couponApplied: "已使用消費券",
      couponAvailable: "可用消費券",
      originalPrice: "原價",
      deduction: "抵扣",
      finalPrice: "應付金額",
      planLabel: "Plan",
      planValuePaid: "Paid",
      paymentMethod: "支付方式",
      unlockPaid: "我已完成支付，解鎖錦囊建議",
      unlockFree: "使用消費券直接解鎖錦囊建議",
      processing: "支付橋梁處理中...",
      paid: "已完成支付閉環",
      enterAdvice: "進入錦囊建議",
      qrHint: "請掃碼完成支付後，點擊下方按鈕",
      qrUnavailable: "該支付方式暫未提供二維碼，請選擇微信支付或支付寶"
    },
    personalizedServices: {
      title: "個性化服務",
      description: "如果您想針對以下某一方面的事件，請留下您的聯繫方式並發諮詢內容至郵箱btswws@163.com，並支付相應費用後，以便7天內電子文件（PDF格式）答覆。",
      contactTitle: "聯繫方式",
      contactWechat: "微信",
      contactWhatsapp: "WhatsApp",
      notice: "請留下您的聯繫方式（郵箱、微信、WhatsApp），並支付相應費用後，我們將在7天內以PDF格式電子文件答覆您。"
    },
    restartAnalysis: "重新排盤",
    admin: {
      title: "雲端鏡像安全後台",
      subtitle: "管理員可查看回饋統計、最近記錄，並在線解密 Notebook 報告。",
      login: "管理員登入",
      username: "使用者名稱",
      password: "密碼",
      signIn: "登入",
      signOut: "退出",
      month: "月份",
      refresh: "刷新統計",
      metrics: "回饋概覽",
      totalRecords: "總記錄數",
      paidUsers: "付費用戶",
      freeUsers: "免費用戶",
      totalCoupons: "消費券總額",
      avgDuration: "平均報告歷時",
      accuracy: "準確度",
      latestRecords: "最近記錄",
      ip: "IP",
      birthBazi: "八字",
      birthPlace: "出生地",
      mediaSource: "引導媒體",
      decryptTitle: "報告解密入口",
      sequence: "序號",
      decrypt: "解密報告",
      decryptedReport: "解密結果",
      loginHint: "請使用管理員帳號進入後台。"
    }
  },
  'en': {
    title: "Life Space-Time Code",
    brandLatin: "Life Space-Time Code",
    subtitle: "Deep Analysis System Fusing Ancient Metaphysics & Modern AI",
    inputForm: "Input Information",
    baziCore: "BaZi Chart",
    nameAnalysis: "Name (Optional)",
    aiReport: "AI Deep Analysis",
    premium: "Expert Advice",
    calculate: "Analyze",
    calculating: "Analyzing...",
    
    // Intro Text
    introTitle: "Destiny's Call",
    introP1: "Amidst the vast sea of humanity, each soul forms its own universe. With diverse paths and unique missions, the true value lies in one's unparalleled individuality.",
    introP2: "We are but fleeting travelers in this human tide, yet also radiant stars within the cosmos.",
    introP3: "A unique alignment of space and time has nurtured the extraordinary you—like an uncut sapphire, harboring infinite possibilities, awaiting the awakening of your exclusive life code.",
    introP4: "Choose a direction, cultivate it silently with unwavering persistence, and the dawn will surely come. Shine for the world, and live out the true weight of your being.",
    introP5: "Whether your concerns lie in health, career, marriage, or planning for your future endeavors, I am by your side. Together, we will unlock your life code, letting your unique light bloom in this expanse of time and space.",

    // Form Labels
    name: "Name",
    gender: "Gender",
    male: "Male",
    female: "Female",
    birthDate: "Birth Date",
    birthTime: "Birth Time",
    unknownTime: "Unknown Time",
    birthEnv: "Birth Environment",
    isOverseas: "Birth Place",
    domestic: "China",
    overseas: "Overseas/Other",
    chinaRegion: "China Region",
    worldRegion: "World Region",
    
    // Pillars
    pillars: ["Year Pillar", "Month Pillar", "Day Pillar", "Hour Pillar"],
    
    // Results
    dayMaster: "Day Master",
    strength: "Energy Rating",
    favorable: "Beneficial Elements",
    unfavorable: "Unfavorable Elements",
    daYun: "Major Luck Pillars",
    
    // Name Analysis
    surname: "Surname",
    givenName: "Given Name",
    strokes: "Strokes",
    fiveGe: "Name's Five-Grid Analysis",
    sanCai: "San Cai Configuration",
    totalScore: "Total Score",
    
    // Date
    solarLabel: "Birth Time (Gregorian)",
    lunar: "Chinese Lunar Calendar",
    leap: "Leap",
    yearSuffix: "",
    month: "Mo.",
    day: "Day",
    monthShort: ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."],
    solarMonthShort: ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."],
    lunarMonthNames: ["Zheng Month (First Month)", "Second Month", "Third Month", "Fourth Month", "Fifth Month", "Sixth Month", "Seventh Month", "Eighth Month", "Ninth Month", "Tenth Month", "Winter Month (Eleventh Month)", "La Month (Twelfth Month)"],
    lunarYearPrefix: "Lunar",
    logoGlyph: "Zen",
    introWatermark: "BaZi",
    chinaRegionPlaceholder: "Province / City (e.g. Shandong)",
    worldRegionPlaceholder: "Country / Region (e.g. United States)",
    
    // Environment Map (for dropdown)
    birthEnvMap: {
      home: "Home/Family",
      hospitalModern: "Modern Hospital/OR",
      waterSide: "Riverside/Water Town",
      vehicle: "Vehicle/Transit",
      mountainForest: "Mountain/Forest",
      underground: "Underground/Basement"
    },
    cloud: {
      modeLabel: "Mode",
      modeValue: "Cloud Mirror",
      planLabel: "Plan",
      couponLabel: "Coupons",
      viewFullAnalysis: "View Full Analysis",
      unlockAdvice: "Unlock Expert Advice",
      divining: "Divining the heavenly secrets...",
      zenWisdom: "Zen Wisdom",
      translationChecking: "Translation Gate is cleansing the analysis...",
      translationBlocked: "Chinese content has been intercepted to keep the English interface language-pure."
    },
    analysis: {
      title: "Life Space-Time Code Analysis",
      anchor: "1. Holographic Time-Space Anchor",
      personality_potential: "2. Personality Background & Potential",
      career_wealth: "3. Career & Wealth",
      action: "4. DaYun and LiuNian Action",
      closing: "5. Closing Line"
    },
    agreement: {
      updateDate: "Updated",
      effectiveDate: "Effective",
      company: "Company",
      close: "Close",
      consentPrefix: "I have read and agree to ",
      consentTitle: "《Service Agreement》",
      required: "Please read and agree to the Service Agreement first."
    },
    feedbackPanel: {
      title: "Five-Element Feedback",
      description: "Drag the five elemental energy bars to calibrate the report across industry fit, role experience, wealth, physical health, and social status.",
      elements: {
        metal: "Metal",
        wood: "Wood",
        water: "Water",
        fire: "Fire",
        earth: "Earth"
      },
      body: "Foundational vitality\nand physical fitness",
      industry: "Career launch\nand industry alignment",
      role: "Emotional expression\nand daily mental state",
      wealth: "Material outcomes\nand wealth accuracy",
      status: "Resource tier\nand social mobility",
      time: "Timing",
      submit: "Submit Feedback",
      rewardToast: "Thank you for your feedback. A ¥10 coupon has been added to your balance."
    },
    premiumPanel: {
      subtitle: "Deep career insights, wealth opportunities, and personalized avoidance strategies.",
      price: "Price",
      priceValue: "¥128 / ¥128 / ¥128",
      locked: "Content Locked",
      lockedHint: "Unlock it in the previous step to view",
      syncing: "Advice content is still syncing. Please check again in a moment.",
      health: "Wu Yun Liu Qi Health Deduction",
      direction: "Industry & Role Direction",
      avoidance: "Risk Avoidance & Taboos",
      actions: "Luck Enhancement Actions",
      birthConstitution: "Innate constitution tone (birth year {year}): {name}; the organ most prone to imbalance is [{organ}]. Combine this with the current month's advice for targeted wellness and prevention.",
      disclaimer: "Disclaimer: This analysis is generated from traditional metaphysics and AI algorithms for reference only. Please make rational decisions."
    },
    paymentBridge: {
      title: "Deep Analysis Payment Bridge",
      subtitle: "Complete payment and coupon deduction here.",
      socialProof: "10,000+ users have already unlocked the deep analysis",
      capacityProof: "",
      domesticTitle: "Domestic Checkout",
      globalTitle: "Global Checkout",
      wechat: "WeChat Pay",
      alipay: "Alipay",
      applePay: "Apple Pay",
      googlePay: "Google Pay",
      creditCard: "Credit Card",
      bnpl: "BNPL",
      qrPlaceholder: "QR Placeholder",
      apiPlaceholder: "Scan the QR code you provided to complete payment.",
      couponToggle: "Apply Coupons",
      couponApplied: "Coupons Applied",
      couponAvailable: "Available Coupons",
      originalPrice: "Original Price",
      deduction: "Deduction",
      finalPrice: "Amount Due",
      planLabel: "Plan",
      planValuePaid: "Paid",
      paymentMethod: "Payment Method",
      unlockPaid: "I've Paid — Unlock Expert Advice",
      unlockFree: "Unlock Expert Advice with coupons",
      processing: "Payment bridge is syncing...",
      paid: "Payment loop completed",
      enterAdvice: "Enter Expert Advice",
      qrHint: "Scan to pay, then click the button below",
      qrUnavailable: "QR code unavailable for this method. Please choose Alipay."
    },
    personalizedServices: {
      title: "Personalized Services",
      description: "If you would like to seek consultation on any of the following areas, please leave your contact information and send your inquiry to email btswws@163.com. After making the corresponding payment, we will respond with an electronic document (PDF format) within 7 days.",
      contactTitle: "Contact Information",
      contactWechat: "WeChat",
      contactWhatsapp: "WhatsApp",
      notice: "Please leave your contact information (Email, WeChat, WhatsApp) and make the corresponding payment. We will respond with a PDF document within 7 days."
    },
    restartAnalysis: "Start New Analysis",
    admin: {
      title: "Cloud Mirror Security Console",
      subtitle: "Administrators can review feedback metrics, recent records, and decrypt notebook reports online.",
      login: "Admin Login",
      username: "Username",
      password: "Password",
      signIn: "Sign In",
      signOut: "Sign Out",
      month: "Month",
      refresh: "Refresh Metrics",
      metrics: "Feedback Metrics",
      totalRecords: "Total Records",
      paidUsers: "Paid Users",
      freeUsers: "Free Users",
      totalCoupons: "Total Coupons",
      avgDuration: "Avg Report Duration",
      accuracy: "Accuracy",
      latestRecords: "Recent Records",
      ip: "IP",
      birthBazi: "BaZi",
      birthPlace: "Birth Place",
      mediaSource: "Media Source",
      decryptTitle: "Report Decryption",
      sequence: "Sequence",
      decrypt: "Decrypt Report",
      decryptedReport: "Decrypted Output",
      loginHint: "Use administrator credentials to access the console."
    }
  }
};

export const ELEMENT_MAPPING = {
  // Elements
  '木': 'Wood', '火': 'Fire', '土': 'Earth', '金': 'Metal', '水': 'Water',
  
  // Heavenly Stems (Gan)
  '甲': 'Jia', '乙': 'Yi', '丙': 'Bing', '丁': 'Ding', '戊': 'Wu',
  '己': 'Ji', '庚': 'Geng', '辛': 'Xin', '壬': 'Ren', '癸': 'Kui',
  
  // Earthly Branches (Zhi)
  '子': 'Zi', '丑': 'Chou', '寅': 'Yin', '卯': 'Mao', '辰': 'Chen', '巳': 'Si',
  '午': 'Wu', '未': 'Wei', '申': 'Shen', '酉': 'You', '戌': 'Xu', '亥': 'Hai',
  
  // Ten Gods / Six Relatives (English Labels)
  '比肩': 'Friend', '劫财': 'Rob Wealth',
  '食神': 'Eating God', '伤官': 'Hurting Officer',
  '偏财': 'Indirect Wealth', '正财': 'Direct Wealth',
  '七杀': 'Seven Killings', '正官': 'Direct Officer',
  '偏印': 'Indirect Resource', '正印': 'Direct Resource',

  // Specific Relatives
  '父亲': 'Father', '母亲': 'Mother', '继母': 'Stepmother',
  '妻': 'Wife', '夫': 'Husband',
  '子': 'Son', '女': 'Daughter',
  '兄弟': 'Brother', '姐妹': 'Sister',
  '竞争': 'Competitor', '下属': 'Subordinate',
  '贵人': 'Mentor', '上司': 'Boss',
  '才华': 'Talent', '傲气': 'Pride',
  '薪资': 'Salary', '意外财': 'Windfall',
  '事业': 'Career', '约束': 'Discipline',
  '福气': 'Blessing',
  
  // Directions/Regions (Comprehensive)
  '北美(中东部)': 'North America (East-Central)',
  '北美(西部)': 'North America (West)',
  '欧洲': 'Europe',
  '澳洲': 'Australia',
  '东南亚': 'Southeast Asia',
  '东亚': 'East Asia',
  '南亚': 'South Asia',
  '中东': 'Middle East',
  '非洲': 'Africa',
  '南美': 'South America',
  '北欧/俄罗斯': 'Northern Europe / Russia',
  '中东/北非': 'Middle East / North Africa',
  '非洲': 'Africa',
  '拉丁美洲': 'Latin America',
  '大洋洲': 'Oceania',
  '北欧': 'Northern Europe',
  '俄罗斯/东欧': 'Russia / Eastern Europe',
  '加拿大/寒带': 'Canada / Polar Region',
  '北美': 'North America',
  '西欧': 'Western Europe',
  '东南亚': 'Southeast Asia',
  '东亚': 'East Asia',
  '中亚/南亚': 'Central Asia / South Asia',
  '东北(黑吉辽)': 'Northeast China (Hei-Ji-Liao)',
  '华北(京津冀)': 'North China (Jing-Jin-Ji)',
  '华东(鲁苏沪浙皖)': 'East China (Lu-Su-Hu-Zhe-Wan)',
  '华南(闽粤桂琼)': 'South China (Min-Yue-Gui-Qiong)',
  '华中(豫鄂湘)': 'Central China (Yu-E-Xiang)',
  '西北(晋陕甘宁青新)': 'Northwest China (Jin-Shan-Gan-Ning-Qing-Xin)',
  '西南(川渝云贵藏)': 'Southwest China (Chuan-Yu-Yun-Gui-Zang)',
  '港澳台': 'Hong Kong, Macau, Taiwan',
  
  // Country Mapping (Common)
  '中国': 'China',
  '韩国': 'Korea',
  '朝鲜': 'DPRK',
  '日本': 'Japan',
  '越南': 'Vietnam',
  '新加坡': 'Singapore',
  '马来西亚': 'Malaysia',
  '印度尼西亚': 'Indonesia',
  '菲律宾': 'Philippines',
  '泰国': 'Thailand',
  '缅甸': 'Myanmar',
  '文莱': 'Brunei',
  '蒙古': 'Mongolia',
  '柬埔寨': 'Cambodia',
  '老挝': 'Laos',
  '印度': 'India',
  '巴基斯坦': 'Pakistan',
  '斯里兰卡': 'Sri Lanka',
  '毛里求斯': 'Mauritius',
  '南非': 'South Africa',
  '尼日利亚': 'Nigeria',
  '肯尼亚': 'Kenya',
  '坦桑尼亚': 'Tanzania',
  '埃塞俄比亚': 'Ethiopia',
  '加纳': 'Ghana',
  '塞舌尔': 'Seychelles',
  '加拿大': 'Canada',
  '美国': 'USA',
  '巴西': 'Brazil',
  '阿根廷': 'Argentina',
  '苏里南': 'Suriname',
  '巴拿马': 'Panama',
  '秘鲁': 'Peru',
  '哥伦比亚': 'Colombia',
  '智利': 'Chile',
  '墨西哥': 'Mexico',
  '俄罗斯': 'Russia',
  '英国': 'UK',
  '法国': 'France',
  '德国': 'Germany',
  '意大利': 'Italy',
  '西班牙': 'Spain',
  '匈牙利': 'Hungary',
  '荷兰': 'Netherlands',
  '比利时': 'Belgium',
  '保加利亚': 'Bulgaria',
  '澳大利亚': 'Australia',
  '新西兰': 'New Zealand',
  '阿联酋': 'UAE',
  '卡塔尔': 'Qatar'
};

// Utility to enforce location translation
export function formatLocation(loc, lang) {
  if (!loc) return '';
  if (lang !== 'en') return loc;
  
  // 1. Check direct mapping
  if (ELEMENT_MAPPING[loc]) return ELEMENT_MAPPING[loc];
  
  // 2. Fallback logic: If input is already English-like (ASCII), return as is
  if (/^[A-Za-z\s\-,.]+$/.test(loc)) return loc;
  
  // 3. Fallback for unmapped Chinese: Return original (or pinyin if library available, but here just raw)
  return loc; 
}

// Convert Simplified Chinese terms to Traditional Chinese for BaZi outputs
export function translateToTW(text) {
  if (!text || typeof text !== 'string') return text;
  
  const tcMap = {
    '冲': '沖',
    '极': '極',
    '阳': '陽',
    '阴': '陰',
    '气': '氣',
    '变': '變',
    '杀': '殺',
    '伤': '傷',
    '财': '財',
    '食': '食',
    '干': '干',
    '支': '支',
    '时': '時',
    '运': '運',
    '岁': '歲',
    '长': '長',
    '生': '生',
    '旺': '旺',
    '弱': '弱',
    '从': '從',
    '化': '化',
    '克': '剋',
    '泄': '洩',
    '补': '補',
    '库': '庫',
    '墓': '墓',
    '藏': '藏',
    '合': '合',
    '刑': '刑',
    '害': '害',
    '绝': '絕',
    '无': '無',
    '有': '有',
    '天': '天',
    '地': '地',
    '人': '人',
    '男': '男',
    '女': '女',
    '闰': '閏',
    '属': '屬',
    '医': '醫',
    '医院': '醫院',
    '总评': '總評',
    '笔画': '筆畫',
    '八字命盘': '八字命盤',
    '能量评级': '能量評級',
    '公历': '公曆',
    '农历时间序列': '農曆時間序列'
  };

  // Replace all occurrences based on the map
  let translated = text;
  for (const [sc, tc] of Object.entries(tcMap)) {
    translated = translated.replace(new RegExp(sc, 'g'), tc);
  }
  return translated;
}
