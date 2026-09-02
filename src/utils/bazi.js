import { 
  Solar, 
  Lunar 
} from 'lunar-javascript';
import cnchar from 'cnchar';
import { calculationRules, birthEnvironments, BAZI_MAPPING } from './constants.js';
import { getWuXing, mapChinaAddress, mapWorldCountry } from './geoMapper.js';
import { translateGanZhi, ELEMENT_MAPPING, formatLocation, translateToTW } from './translations.js';

// 拼音转换工具 (Modified to use BAZI_MAPPING for consistency)
function toPinyin(char) {
  if (!char) return '';
  // Check BAZI_MAPPING first
  if (BAZI_MAPPING.stems[char]) return BAZI_MAPPING.stems[char].en;
  if (BAZI_MAPPING.branches[char]) return BAZI_MAPPING.branches[char].en;

  const pinyin = cnchar.spell(char); 
  if (Array.isArray(pinyin)) {
    return pinyin[0].charAt(0).toUpperCase() + pinyin[0].slice(1);
  }
  return pinyin.charAt(0).toUpperCase() + pinyin.slice(1);
}

function getRating(score, lang = 'zh-CN') {
  let rating = "中和";
  if (score >= 0.85) rating = "极旺";
  else if (score >= 0.65) rating = "偏旺";
  else if (score <= 0.15) rating = "极弱";
  else if (score <= 0.35) rating = "偏弱";

  if (lang === 'en') {
    return BAZI_MAPPING.ratings[rating] || rating;
  }
  return rating;
}

function getRelationActionDesc(relation, lang = 'zh-CN') {
  const map = {
    'same': lang === 'en' ? 'Support' : '帮扶',
    'support': lang === 'en' ? 'Support' : '生助',
    'restrict': lang === 'en' ? 'Restrict' : '克制',
    'exhaust': lang === 'en' ? 'Exhaust' : '泄气',
    'consume': lang === 'en' ? 'Consume' : '耗损'
  };
  return map[relation] || '';
}

// 辅助函数：获取十神描述（环境对日主）
function getTenGodEnvDesc(relation, lang = 'zh-CN') {
  if (lang === 'en') {
    const map = {
      'support': 'Resource Star (Support)',
      'same': 'Peer Star (Reinforce)',
      'restrict': 'Officer Star (Restrict)',
      'exhaust': 'Output Star (Drain)',
      'consume': 'Wealth Star (Consume)'
    };
    return map[relation] || '';
  }
  return ''; // Chinese version handled in logic text usually
}

// Career Analysis Helper
function analyzeCareer(favorable, unfavorable, lang = 'zh-CN') {
  const isEn = lang === 'en';
  
  const elementData = {
    'Wood': {
      industry: isEn 
        ? "Education, Culture, Fashion, Design, Furniture, Biology. Roles involving growth, nurturing, and planning." 
        : "教育文化、出版传媒、服装设计、家具园林、生物医药。适合策划、行政、培训等具有生长与仁慈属性的岗位。",
      avoid: isEn 
        ? "Avoid rigid/repetitive tasks. Avoid conflicts in the West direction. Do not suppress your creativity." 
        : "忌刻板机械的工作。避免在西方久居或办公。切勿压抑内心的创造力与仁慈之心，避免与人发生金钱纠纷。",
      action: isEn 
        ? "Wear Green/Cyan. Exercise in forests. Morning (3-7am) is your prime time." 
        : "多穿青/绿色系衣物。晨练首选森林公园。寅卯时（3-7点）是决策的最佳时机。多养绿植以补木气。"
    },
    'Fire': {
      industry: isEn 
        ? "Tech/AI, Energy, Entertainment, Culinary, Marketing. Roles involving visibility, passion, and rapid change." 
        : "科技互联网、能源化工、影视娱乐、餐饮烹饪、市场营销。适合演艺、公关、销售等需要展现力与爆发力的岗位。",
      avoid: isEn 
        ? "Avoid cold/damp environments. Avoid North direction. Don't be too impulsive or impatient." 
        : "忌阴暗潮湿的工作环境。避免在北方发展。切勿急躁冲动，避免因口舌之快而得罪人。注意心血管健康。",
      action: isEn 
        ? "Wear Red/Purple. Sunbathe. Mid-day (9am-1pm) is your prime time." 
        : "多穿红/紫色系衣物。多晒太阳，保持积极心态。巳午时（9-13点）灵感最旺。办公桌可摆放红色摆件。"
    },
    'Earth': {
      industry: isEn 
        ? "Real Estate, Agriculture, HR, Consulting, Warehousing. Roles involving stability, trust, and accumulation." 
        : "房地产、建筑工程、农业畜牧、人力资源、仓储管理。适合顾问、秘书、会计等需要诚信与稳重特质的岗位。",
      avoid: isEn 
        ? "Avoid risk-taking/speculation. Avoid East direction. Don't be too stubborn or stagnant." 
        : "忌高风险投机行业。避免在东方发展。切勿固步自封，避免因过于老实而被利用。注意脾胃保养。",
      action: isEn 
        ? "Wear Yellow/Brown. Hiking/Ceramics. Transitions (7-9am/1-3pm...) are prime times." 
        : "多穿黄/棕色系衣物。多接触泥土（如登山、陶艺）。辰戌丑未时（四季末）运势较强。佩戴玉石水晶可增运。"
    },
    'Metal': {
      industry: isEn 
        ? "Finance, Law, Engineering, Jewelry, Automotive. Roles involving logic, rules, and precision." 
        : "金融证券、司法军警、机械工程、珠宝五金、汽车交通。适合律师、外科医生、审计等需要决断力与严谨性的岗位。",
      avoid: isEn 
        ? "Avoid overly emotional/chaotic roles. Avoid South direction. Don't be too harsh or critical." 
        : "忌感性主导或无序的工作。避免在南方发展。切勿刚愎自用，避免言语犀利伤人。注意呼吸系统健康。",
      action: isEn 
        ? "Wear White/Gold. Weightlifting. Late afternoon (3-7pm) is your prime time." 
        : "多穿白/金色系衣物。佩戴金银饰品。申酉时（15-19点）执行力最强。多进行力量训练以增强金气。"
    },
    'Water': {
      industry: isEn 
        ? "Logistics, Trading, Tourism, Journalism, Psychology. Roles involving flow, wisdom, and adaptability." 
        : "物流运输、进出口贸易、旅游酒店、新闻传媒、心理咨询。适合需要高流动性、深层智力开发及应变能力的岗位。",
      avoid: isEn 
        ? "Avoid stagnant/fixed roles. Avoid Center/NE/SW directions. Don't drift without purpose." 
        : "忌固定死板的工作。避免在土旺方位（中/东北/西南）发展。切勿随波逐流，避免沉溺于情绪或欲望。",
      action: isEn 
        ? "Wear Black/Blue. Swimming. Night (9pm-1am) is your prime time." 
        : "多穿黑/蓝色系衣物。多喝水，尝试游泳或水疗。亥子时（21-1点）思维最活跃。家中可摆放鱼缸。"
    }
  };

  // Map CN keys to EN keys for lookup if needed
  const cnToEn = {'木':'Wood', '火':'Fire', '土':'Earth', '金':'Metal', '水':'Water'};
  
  // Get main favorable element (take the first one usually)
  const mainFavorable = favorable[0];
  const mainKey = cnToEn[mainFavorable] || mainFavorable;
  const data = elementData[mainKey] || elementData['Wood']; // Fallback

  return {
    suggestions: data.industry,
    avoid: data.avoid,
    action: data.action
  };
}

function getMotherElement(el) {
  const map = {'木':'水', '火':'木', '土':'火', '金':'土', '水':'金'};
  return map[el];
}

function getOppositeElements(el) {
  const map = {
    '木': ['金', '火'], // 克我者，我生者（泄）
    '火': ['水', '土'],
    '土': ['木', '金'],
    '金': ['火', '水'],
    '水': ['土', '木']
  };
  return map[el] || [];
}

function getKEO(el) {
   // Ke (Restrict), Exhaust (Drain), Opposite
   // For weak Day Master, we want Support (Mother) and Same (Peer). 
   // Unfavorable are Restrict (Officer), Exhaust (Output), Consume (Wealth).
   const map = {
    '木': ['水', '木'], // Favorable
    '火': ['木', '火'],
    '土': ['火', '土'],
    '金': ['土', '金'],
    '水': ['金', '水']
   };
   return map[el] || [];
}


// Import removed because sixRelatives.js does not exist

// --- Branch Relations Logic ---
const BRANCH_RELATIONS = {
  // 1. Hui (Season) - 3 branches
  hui: {
    'Wood': ['寅', '卯', '辰'],
    'Fire': ['巳', '午', '未'],
    'Metal': ['申', '酉', '戌'],
    'Water': ['亥', '子', '丑']
  },
  // 2. San He (Three Harmony) - 3 branches
  sanHe: {
    'Water': ['申', '子', '辰'],
    'Wood': ['亥', '卯', '未'],
    'Fire': ['寅', '午', '戌'],
    'Metal': ['巳', '酉', '丑']
  },
  // 3. Liu He (Six Harmony) - Pair
  liuHe: [
    ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']
  ],
  // 4. Ban He (Half Harmony) - Pair (Center + Adj)
  banHe: [
    // Water
    ['申', '子'], ['子', '辰'],
    // Wood
    ['亥', '卯'], ['卯', '未'],
    // Fire
    ['寅', '午'], ['午', '戌'],
    // Metal
    ['巳', '酉'], ['酉', '丑']
  ],
  // 5. Gong He (Arch Harmony) - Pair (Ends)
  gongHe: [
    ['申', '辰'], ['亥', '未'], ['寅', '戌'], ['巳', '丑']
  ],
  // 6. Liu Chong (Clash) - Pair
  liuChong: [
    ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']
  ],
  // 7. San Xing (Penalty)
  sanXing: [
    ['寅', '巳'], ['巳', '申'], ['申', '寅'], // Ungrateful (Pairwise checks)
    ['丑', '戌'], ['戌', '未'], ['未', '丑'], // Bullying
    ['子', '卯'], // Uncivilized
    ['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥'] // Self
  ],
  // 8. Liu Hai (Harm)
  liuHai: [
    ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']
  ],
  // 9. Xiang Po (Destruction)
  xiangPo: [
    ['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌']
  ]
};

function getBranchRelations(currentBranch, otherBranches) {
  if (!currentBranch) return [];
  const relations = [];
  
  // Helper to check if array contains subset
  const hasAll = (target, source) => target.every(v => source.includes(v));
  const otherChars = otherBranches.map(b => b.char);
  const allChars = [currentBranch, ...otherChars];
  
  // 1. Hui (Priority 1)
  for (const [element, group] of Object.entries(BRANCH_RELATIONS.hui)) {
    if (group.includes(currentBranch)) {
      // Check if chart has all 3
      if (hasAll(group, allChars)) {
        relations.push({ type: '会', name: `San Hui (${element})`, priority: 1 });
        return relations; // Return immediately if highest priority found? User said "according to priority", maybe list top one.
      }
    }
  }

  // 2. San He (Priority 2)
  for (const [element, group] of Object.entries(BRANCH_RELATIONS.sanHe)) {
    if (group.includes(currentBranch)) {
      if (hasAll(group, allChars)) {
        relations.push({ type: '合', name: `San He (${element})`, priority: 2 });
        return relations;
      }
    }
  }

  // Check pairs with other branches
  // We want to find the "best" relation this branch has with ANY other branch.
  let bestRelation = null;

  for (const other of otherChars) {
    const pair = [currentBranch, other];
    
    // 3. Liu He
    for (const group of BRANCH_RELATIONS.liuHe) {
      if (hasAll(group, pair) && group.includes(currentBranch) && group.includes(other)) { // Strict pair check
         // Double check logic: hasAll(['Zi', 'Chou'], ['Zi', 'Wu']) -> false. Correct.
         // But hasAll(['Zi', 'Chou'], ['Zi', 'Chou']) -> true.
         if (!bestRelation || bestRelation.priority > 3) {
            bestRelation = { type: '六合', name: 'Liu He', priority: 3 };
         }
      }
    }
    
    // 4. Ban He
    for (const group of BRANCH_RELATIONS.banHe) {
      if (hasAll(group, pair)) {
         if (!bestRelation || bestRelation.priority > 4) {
            bestRelation = { type: '半合', name: 'Ban He', priority: 4 };
         }
      }
    }
    
    // 5. Gong He
    for (const group of BRANCH_RELATIONS.gongHe) {
      if (hasAll(group, pair)) {
         if (!bestRelation || bestRelation.priority > 5) {
            bestRelation = { type: '拱合', name: 'Gong He', priority: 5 };
         }
      }
    }
    
    // 6. Liu Chong
    for (const group of BRANCH_RELATIONS.liuChong) {
      if (hasAll(group, pair)) {
         if (!bestRelation || bestRelation.priority > 6) {
            bestRelation = { type: '冲', name: 'Liu Chong', priority: 6 };
         }
      }
    }
    
    // 7. San Xing
    for (const group of BRANCH_RELATIONS.sanXing) {
      if (hasAll(group, pair)) {
         if (!bestRelation || bestRelation.priority > 7) {
            bestRelation = { type: '刑', name: 'San Xing', priority: 7 };
         }
      }
    }
    
    // 8. Liu Hai
    for (const group of BRANCH_RELATIONS.liuHai) {
      if (hasAll(group, pair)) {
         if (!bestRelation || bestRelation.priority > 8) {
            bestRelation = { type: '害', name: 'Liu Hai', priority: 8 };
         }
      }
    }
    
    // 9. Xiang Po
    for (const group of BRANCH_RELATIONS.xiangPo) {
      if (hasAll(group, pair)) {
         if (!bestRelation || bestRelation.priority > 9) {
            bestRelation = { type: '破', name: 'Xiang Po', priority: 9 };
         }
      }
    }
  }
  
  // Check Self Penalty (Chen-Chen, etc) which is not a "pair" with *other* distinct char, but if chart has multiple same chars.
  // The loop `for (const other of otherChars)` handles `pair = [current, other]`. 
  // If current='Chen' and other='Chen', pair=['Chen', 'Chen']. hasAll(['Chen','Chen'], pair) is true.
  // So San Xing self penalty is covered.

  if (bestRelation) {
    relations.push(bestRelation);
  }

  return relations;
}

// --- 十神与六亲模型 (三命通会) ---
// This generic function is kept for fallback, but main logic now uses SIX_RELATIVES_MAPPING
export function getShiShen(stem, dm) {
  // Translate element names back to Chinese for relation calculation if needed
  const elementToChinese = {
    'Wood': '木', 'Fire': '火', 'Earth': '土', 'Metal': '金', 'Water': '水'
  };

  const stemInfo = BAZI_MAPPING.stems[stem];
  const dmInfo = BAZI_MAPPING.stems[dm];
  if (!stemInfo || !dmInfo) return null;

  let stemEl = stemInfo.element;
  let dmEl = dmInfo.element;
  
  // Ensure elements are in Chinese for calculationRules.getRelation which expects Chinese characters
  if (['Wood', 'Fire', 'Earth', 'Metal', 'Water'].includes(stemEl)) stemEl = elementToChinese[stemEl];
  if (['Wood', 'Fire', 'Earth', 'Metal', 'Water'].includes(dmEl)) dmEl = elementToChinese[dmEl];

  const stemPol = stemInfo.polarity;
  const dmPol = dmInfo.polarity;

  const relation = calculationRules.getRelation(stemEl, dmEl);
  const samePolarity = stemPol === dmPol;
  
  const models = {
    'same': {
       true: { name: '比肩', relative: '兄弟/同行', en: 'Bi Jian', enRel: 'Brother' },
       false: { name: '劫财', relative: '竞争/下属', en: 'Jie Cai', enRel: 'Competitor' }
     },
     'support': { // stem生dm (印)
       true: { name: '偏印', relative: '枭神/继母', en: 'Pian Yin', enRel: 'Stepmother' },
       false: { name: '正印', relative: '母亲/贵人', en: 'Zheng Yin', enRel: 'Mother' }
     },
     'restrict': { // stem克dm (官杀)
       true: { name: '七杀', relative: '偏官/事业', en: 'Qi Sha', enRel: 'Son' }, 
       false: { name: '正官', relative: '丈夫/上司', en: 'Zheng Guan', enRel: 'Daughter' } 
     },
     'exhaust': { // dm生stem (食伤)
       true: { name: '食神', relative: '子女/福气', en: 'Shi Shen', enRel: 'Child' },
       false: { name: '伤官', relative: '才华/傲气', en: 'Shang Guan', enRel: 'Talent' }
     },
     'consume': { // dm克stem (财)
       true: { name: '偏财', relative: '父亲/偏财', en: 'Pian Cai', enRel: 'Father' },
       false: { name: '正财', relative: '妻子/薪资', en: 'Zheng Cai', enRel: 'Wife' }
     }
  };
  
  let result = models[relation] ? models[relation][samePolarity] : null;
  return result;
}

// 地支藏干映射表
// Standard Hidden Stems (Ben Qi, Zhong Qi, Yu Qi)
const HIDDEN_STEMS_STANDARD = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'], // Corrected order: Ben(Wu), Zhong(Xin), Yu(Ding) or Ben(Wu), Zhong(Ding), Yu(Xin)? Standard: Wu, Xin, Ding
  '亥': ['壬', '甲']
};

export function getHiddenStemsInfo(branch, dm) {
  // Fallback to generic calculation
  const stems = HIDDEN_STEMS_STANDARD[branch] || [];
  return stems.map(stemChar => ({
    stem: stemChar,
    type: '藏干',
    shiShen: getShiShen(stemChar, dm),
    element: BAZI_MAPPING.stems[stemChar].element
  }));
}

/**
 * Calculate BaZi (Four Pillars) from birth date and time.
 */
export function calculateBaZi(data) {
  const { birthDate, gender, isOverseas, chinaAddress, worldCountry, birthEnv, isEnglish } = data;
  const lang = isEnglish ? 'en' : 'zh-CN';
  
  if (!birthDate) {
    throw new Error('Birth date is required');
  }

  const date = new Date(birthDate);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid birth date');
  }

  const timeStr = data.birthTime || '12:00';
  const [hour, minute] = timeStr.split(':').map(Number);

  const solar = Solar.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    hour || 12,
    minute || 0,
    0
  );

  const lunar = solar.getLunar();

  // 获取四柱干支
  const yearPillar = lunar.getYearInGanZhi();
  const monthPillar = lunar.getMonthInGanZhi();
  const dayPillar = lunar.getDayInGanZhi();
  const timePillar = lunar.getTimeInGanZhi();

  // 拼音/翻译处理
  let pillarsDisplay = [timePillar, dayPillar, monthPillar, yearPillar];
  if (lang === 'en') {
    pillarsDisplay = pillarsDisplay.map(p => translateGanZhi(p, 'en'));
  }

  // 提取日主（日柱天干）
  const dayMaster = dayPillar.substring(0, 1);
  const dayMasterElement = getWuXing(dayMaster); // 获取日干五行

  // Prepare branch list for relation check
  // Note: timePillar is index 0, day 1, month 2, year 3 in pillarsDisplay array?
  // pillarsDisplay = [timePillar, dayPillar, monthPillar, yearPillar];
  // So index 0=Time, 1=Day, 2=Month, 3=Year.
  const branchList = pillarsDisplay.map((p, idx) => {
     // p is string or object. If object (EN), p.zhi.char is the char. If string (ZH), p[1] is the char.
     // But translateGanZhi returns object with char property being the full GanZhi? No, char is full.
     // Let's rely on substring(1,2) of the original string if available, or check structure.
     // translateGanZhi returns { char: '庚戌', gan: {...}, zhi: {...} }
     // So p.zhi.char is safe if object. If string, p[1].
     const char = (typeof p === 'object') ? p.zhi.char : p.substring(1, 2);
     return { char, index: idx };
  });

  // 增强柱信息：加入藏干
  pillarsDisplay = pillarsDisplay.map((p, index) => {
    // Determine branch character
    let branchChar = '';
    if (typeof p === 'object') {
        branchChar = p.zhi.char;
    } else {
        branchChar = p.substring(1, 2);
    }
    
    const hiddenStems = getHiddenStemsInfo(branchChar, dayMaster);
    
    // Calculate Relations
    const otherBranches = branchList.filter(b => b.index !== index);
    const relations = getBranchRelations(branchChar, otherBranches);
    
    if (typeof p === 'object') {
        return { ...p, hiddenStems, relations };
    } else {
        return { char: p, hiddenStems, relations };
    }
  });

  // 提取月令（月柱地支）
  const monthBranch = monthPillar.substring(1, 2);
  const monthBranchElement = getWuXing(monthBranch); // 获取月支五行

  // 判定季节
  let season = '';
  const spring = ['寅', '卯', '辰'];
  const summer = ['巳', '午', '未'];
  const autumn = ['申', '酉', '戌'];
  const winter = ['亥', '子', '丑'];

  if (spring.includes(monthBranch)) season = '春季';
  else if (summer.includes(monthBranch)) season = '夏季';
  else if (autumn.includes(monthBranch)) season = '秋季';
  else if (winter.includes(monthBranch)) season = '冬季';
  else season = '四季';

  if (lang === 'en') {
    const sMap = {'春季': 'Spring', '夏季': 'Summer', '秋季': 'Autumn', '冬季': 'Winter', '四季': 'All Seasons'};
    season = sMap[season] || season;
  }

  // --- 强弱计算逻辑重构 ---
  
  // 1. 基础分值 (得令)
  let strengthScore = 0.5; // 基础中和分为 0.5
  let baseDesc = "";
  
  const monthRelation = calculationRules.getRelation(monthBranchElement, dayMasterElement);
  if (monthRelation === 'same' || monthRelation === 'support') {
    strengthScore += 0.2; // 得令
    baseDesc = lang === 'en' 
      ? "The Day Master gains seasonal support (Month Command)." 
      : "日主得月令，基础偏旺。";
  } else {
    strengthScore -= 0.2; // 不得令
    baseDesc = lang === 'en' 
      ? "The Day Master lacks seasonal support (Month Command)." 
      : "日主不得月令，基础偏弱。";
  }

  // 2. 空间环境修正
  let spaceModifiers = [];
  let mappedCRegion = null;
  let mappedWRegion = null;
  
  const getEnElement = (cn) => ELEMENT_MAPPING[cn] || cn;

  if (!isOverseas) {
    // A. 中国大区影响
    const mapped = mapChinaAddress(chinaAddress, lang);
    if (mapped) {
      mappedCRegion = mapped.data;
      const relation = calculationRules.getRelation(mapped.data.primaryElement, dayMasterElement);
      const mod = calculationRules.coefficients[relation] || 0;
      strengthScore += mod * mapped.data.weight;
      if (mod !== 0) {
        const action = getRelationActionDesc(relation, lang);
        const elEn = getEnElement(mapped.data.primaryElement);
        // Use formatLocation for strict translation
        const regionName = formatLocation(mapped.data.name, lang);
        const desc = lang === 'en'
          ? `China Region [${mapped.matchedKeyword}] is ${regionName} (${elEn}), producing ${action} influence`
          : `中国地理[${mapped.matchedKeyword}]属${mapped.data.name}(${mapped.data.primaryElement})，对日主起${action}作用`;
        spaceModifiers.push(desc);
      }
    }
  } else {
    // B. 世界大区影响
    const mapped = mapWorldCountry(worldCountry, lang);
    if (mapped) {
      mappedWRegion = mapped.data;
      const relation = calculationRules.getRelation(mapped.data.primaryElement, dayMasterElement);
      const mod = calculationRules.coefficients[relation] || 0;
      strengthScore += mod * mapped.data.extremeWeight;
      if (mod !== 0) {
        const action = getRelationActionDesc(relation, lang);
        const elEn = getEnElement(mapped.data.primaryElement);
        // Use formatLocation for strict translation
        const regionName = formatLocation(mapped.data.name, lang);
        // Ensure element is translated
        const elementEn = lang === 'en' ? getEnElement(mapped.data.primaryElement) : mapped.data.primaryElement;
        
        const desc = lang === 'en'
          ? `World Region [${mapped.matchedKeyword}] is ${regionName} (${elementEn}), extreme climate producing ${action} influence`
          : `海外地理[${mapped.matchedKeyword}]属${mapped.data.name}(${mapped.data.primaryElement})，极端气候对日主起${action}作用`;
        spaceModifiers.push(desc);
      }
    }
  }

  // C. 微观环境影响
  let mappedBEnv = null;
  if (birthEnv && birthEnvironments[birthEnv]) {
    mappedBEnv = birthEnvironments[birthEnv];
    const env = birthEnvironments[birthEnv];
    const relation = calculationRules.getRelation(env.primaryElement, dayMasterElement);
    const mod = calculationRules.coefficients[relation] || 0;
    // 微环境权重稍小，乘以 0.05
    strengthScore += mod * 0.05;
    
    // Environment Name translation handled in UI mostly, but for logic desc we map element
    const elName = lang === 'en' 
      ? getEnElement(env.primaryElement)
      : env.primaryElement;
      
    // Handle specific phrasing for English
    if (lang === 'en') {
       const envName = (birthEnv === 'home') ? 'Home' : 
                       (birthEnv === 'hospitalModern' ? 'Hospital' : 
                       (birthEnv === 'waterSide' ? 'Riverside' : 
                       (birthEnv === 'vehicle' ? 'Vehicle' : 
                       (birthEnv === 'mountainForest' ? 'Mountain' : 'Underground'))));
       
       // Construct specific English phrasing
       let effectPhrase = "";
       if (relation === 'exhaust') effectPhrase = "an exhausting (Drain)";
       else if (relation === 'consume') effectPhrase = "a consuming";
       else if (relation === 'restrict') effectPhrase = "a restricting";
       else if (relation === 'support') effectPhrase = "a supporting";
       else effectPhrase = "a reinforcing";
       
       let desc = `Micro Environment (${envName}) is ${elName}, producing ${effectPhrase} influence`;
       spaceModifiers.push(desc);
    } else {
       const envName = birthEnvironments[birthEnv].name; // Get CN name
       const action = getRelationActionDesc(relation, lang);
       let desc = `微观出生环境(${envName})属${env.primaryElement}`;
       if (birthEnv === 'home' && (relation === 'support' || relation === 'same')) {
          desc += `(印星加持)`;
       }
       desc += `，对日主气场产生${action}影响`;
       spaceModifiers.push(desc);
    }
  }

  // 3. 综合评级
  const rating = getRating(strengthScore, lang);
  const ratingRaw = getRating(strengthScore, 'zh-CN'); // Keep raw for logic calculation (favorable elements)

  // Calculate overall branch relations for Energy Rating description
  const allBranches = branchList.map(b => b.char);
  let hasHe = false;
  let heName = '';
  let heEffect = '';
  let hasChong = false;
  let hasXing = false;
  let heDetails = [];

  // Helper to find intersections and their indices
  const getMatchIndices = (group) => {
    let indices = [];
    group.forEach(gChar => {
      branchList.forEach(b => {
        if (b.char === gChar) indices.push(b.index); // 0=Time, 1=Day, 2=Month, 3=Year
      });
    });
    return [...new Set(indices)];
  };

  const hasAll = (target, source) => target.every(v => source.includes(v));

  // Check Hui & SanHe & LiuHe & BanHe
  for (const [element, group] of Object.entries(BRANCH_RELATIONS.hui)) {
    if (hasAll(group, allBranches)) {
      hasHe = true; 
      heName = lang === 'en' ? `Hui of ${element}` : `三会${element === 'Wood' ? '木' : element === 'Fire' ? '火' : element === 'Metal' ? '金' : '水'}局`;
      heEffect = lang === 'en' ? `Strong ${element} energy gathers` : `${element === 'Wood' ? '木' : element === 'Fire' ? '火' : element === 'Metal' ? '金' : '水'}气极旺，能量汇聚`;
      heDetails.push({ name: heName, effect: heEffect, chars: group, indices: getMatchIndices(group), type: 'hui' });
    }
  }
  for (const [element, group] of Object.entries(BRANCH_RELATIONS.sanHe)) {
    if (hasAll(group, allBranches)) {
      hasHe = true; 
      heName = lang === 'en' ? `SanHe of ${element}` : `三合${element === 'Wood' ? '木' : element === 'Fire' ? '火' : element === 'Metal' ? '金' : '水'}局`;
      heEffect = lang === 'en' ? `${element} energy harmonizes` : `${element === 'Wood' ? '木' : element === 'Fire' ? '火' : element === 'Metal' ? '金' : '水'}局成形，气势强盛`;
      heDetails.push({ name: heName, effect: heEffect, chars: group, indices: getMatchIndices(group), type: 'sanhe' });
    }
  }
  BRANCH_RELATIONS.liuHe.forEach(pair => {
    if (hasAll(pair, allBranches)) {
      hasHe = true; 
      const enPair = pair.map(p => BAZI_MAPPING.branches[p]?.en || p).join('-');
      heName = lang === 'en' ? `LiuHe (${enPair})` : `${pair[0]}${pair[1]}六合`;
      // determine element based on LiuHe pair
      let heElement = '';
      let enElement = '';
      if (pair.includes('子') && pair.includes('丑')) { heElement = '土'; enElement = 'Earth'; }
      if (pair.includes('寅') && pair.includes('亥')) { heElement = '木'; enElement = 'Wood'; }
      if (pair.includes('卯') && pair.includes('戌')) { heElement = '火'; enElement = 'Fire'; }
      if (pair.includes('辰') && pair.includes('酉')) { heElement = '金'; enElement = 'Metal'; }
      if (pair.includes('巳') && pair.includes('申')) { heElement = '水'; enElement = 'Water'; }
      if (pair.includes('午') && pair.includes('未')) { heElement = '火土'; enElement = 'Fire/Earth'; }
      
      heEffect = lang === 'en' ? `${enElement} energy gathers` : `${heElement}气凝聚，化解五行之杂`;
      heDetails.push({ name: heName, effect: heEffect, chars: pair, indices: getMatchIndices(pair), type: 'liuhe' });
    }
  });

  // Ban He and Gong He (treated as He in UI logic for golden dashed lines)
  BRANCH_RELATIONS.banHe.forEach(pair => {
    if (hasAll(pair, allBranches)) {
      const enPair = pair.map(p => BAZI_MAPPING.branches[p]?.en || p).join('-');
      heDetails.push({ name: lang === 'en' ? `BanHe (${enPair})` : `${pair[0]}${pair[1]}半合`, effect: '', chars: pair, indices: getMatchIndices(pair), type: 'banhe' });
    }
  });
  BRANCH_RELATIONS.gongHe.forEach(pair => {
    if (hasAll(pair, allBranches)) {
      const enPair = pair.map(p => BAZI_MAPPING.branches[p]?.en || p).join('-');
      heDetails.push({ name: lang === 'en' ? `GongHe (${enPair})` : `${pair[0]}${pair[1]}拱合`, effect: '', chars: pair, indices: getMatchIndices(pair), type: 'gonghe' });
    }
  });

  let chongDetails = [];
  BRANCH_RELATIONS.liuChong.forEach(pair => {
    if (hasAll(pair, allBranches)) {
      hasChong = true;
      chongDetails.push({ chars: pair, indices: getMatchIndices(pair), type: 'chong' });
    }
  });
  
  let xingDetails = [];
  BRANCH_RELATIONS.sanXing.forEach(group => {
    if (hasAll(group, allBranches)) {
      hasXing = true;
      xingDetails.push({ chars: group, indices: getMatchIndices(group), type: 'xing' });
    }
  });

  let relationText = '';
  if (hasHe) {
    const mainHe = heDetails[0];
    relationText = `[${mainHe.name}] ${mainHe.effect}`;
    if (hasChong) {
      relationText += lang === 'en' ? ' (Harmony resolves Clash)' : '，合能解冲';
    } else if (hasXing) {
      relationText += lang === 'en' ? ' (Harmony controls Penalty)' : '，合能制刑';
    }
  } else if (hasChong) {
    relationText = lang === 'en' ? '[Branch Clash] Energy fluctuates' : '[地支相冲] 气场激荡，能量波动';
  } else if (hasXing) {
    relationText = lang === 'en' ? '[Branch Penalty] Energy restricts' : '[地支相刑] 能量互相牵制';
  } else {
    relationText = lang === 'en' ? '[Peaceful Branches] Stable energy' : '[地支平稳] 气场平和，能量稳定';
  }

  // Construct final description: Original detailed text first, then branch relation summary
  const originalDetailedDesc = lang === 'en'
    ? `${baseDesc} Combined with space-time environment: ${spaceModifiers.join('; ')}. After comprehensive environmental adjustment, Day Master status is determined as: ${rating}.`
    : `${baseDesc} 结合空间环境：${spaceModifiers.join('；')}。综合环境补正后，日主状态判定为：${rating}。`;

  const finalDesc = `${originalDetailedDesc} ${relationText}`;

  const strengthAnalysis = {
    score: strengthScore.toFixed(2),
    rating: rating,
    description: finalDesc,
    relations: { hasHe, hasChong, hasXing, heDetails, chongDetails, xingDetails }
  };

  // --- 大运计算 ---
  const yun = lunar.getEightChar().getYun(gender === 'male' ? 1 : 0);
  const startAge = yun.getStartYear(); // 起运岁数
  const daYunArr = yun.getDaYun();
  
  // 提取未来 8 部大运
  const daYunList = [];
  for (let i = 1; i <= 8; i++) {
    const dy = daYunArr[i];
    if (dy) {
      let ganZhi = dy.getGanZhi();
      let ganZhiDisplay = ganZhi;
      if (lang === 'en') {
        ganZhiDisplay = translateGanZhi(ganZhi, 'en');
      }
      daYunList.push({
        startAge: dy.getStartAge(),
        ganZhi: ganZhiDisplay,
        startYear: dy.getStartYear(),
        endYear: dy.getStartYear() + 9, // Add end year
        timeRange: `${dy.getStartYear()}-${dy.getStartYear() + 9}` // Add time range
      });
    }
  }
  
  // 找出当前大运
  const currentYear = new Date().getFullYear();
  let currentDaYun = null;
  
  for (let i = 0; i < daYunList.length; i++) {
    const dy = daYunList[i];
    const nextDy = daYunList[i + 1];
    
    if (currentYear >= dy.startYear && (!nextDy || currentYear < nextDy.startYear)) {
      currentDaYun = dy;
      break;
    }
  }

  // Analyze Career/Advice
  // Simple logic: if weak, favor Support/Same. If strong, favor Restrict/Exhaust/Consume.
  let favorableElements = [];
  let unfavorableElements = [];
  
  if (strengthScore < 0.45) { // Weak
    favorableElements = getKEO(dayMasterElement); // Actually this logic needs fix. Weak needs support.
    // Re-implement simple logic
    const mother = getMotherElement(dayMasterElement);
    favorableElements = [mother, dayMasterElement]; // Resource + Peer
    unfavorableElements = getOppositeElements(dayMasterElement); // Restrict/Consume/Exhaust
  } else { // Strong
    favorableElements = getOppositeElements(dayMasterElement); // Restrict/Consume/Exhaust
    const mother = getMotherElement(dayMasterElement);
    unfavorableElements = [mother, dayMasterElement];
  }
  
  const careerAnalysis = analyzeCareer(favorableElements, unfavorableElements, lang);

  // --- 动态智能禅语生成 (Deep Dynamic Zen Message) ---
  let zenMessage = "";
  
  // 结合五行、旺衰与特定十神结构提供更深度的寄语
  const isStrong = strengthScore > 0.55;
  const isWeak = strengthScore < 0.45;
  
  if (lang === 'en') {
    if (dayMasterElement === 'Wood' || dayMasterElement === '木') {
      zenMessage = isStrong 
        ? "Like a towering forest, your Life Energy is expansive and unyielding. Yet, the stiffest tree is most easily cracked by the storm. True wisdom lies in learning to bend like the bamboo. Embrace flexibility and allow the winds of change to guide your growth rather than resist them."
        : "Like a delicate sapling, your Life Energy requires nurturing and patience. Do not fear the slow pace of your growth. Remember that the mightiest oak was once a tiny seed. Draw strength from your roots, seek supportive environments, and trust in the profound power of quiet persistence.";
    } else if (dayMasterElement === 'Fire' || dayMasterElement === '火') {
      zenMessage = isStrong 
        ? "Your Life Energy blazes with the intensity of the midday sun, illuminating all around you. While your passion is your greatest asset, unchecked fire consumes itself. Practice the art of stillness. Let your warmth nurture others rather than scorch them, and find peace in a steady, gentle glow."
        : "Like a flickering candle in the wind, your inner fire needs careful tending. You may feel easily overwhelmed by the darkness, but remember that even the smallest flame can light up a room. Protect your spark, surround yourself with those who fuel your inspiration, and let your light shine steadily.";
    } else if (dayMasterElement === 'Earth' || dayMasterElement === '土') {
      zenMessage = isStrong 
        ? "Your Life Energy is as solid and immovable as a mountain. This profound stability anchors those around you. However, a mountain that never moves becomes barren. Allow the waters of change to carve new rivers through your landscape. Embrace transformation, for true strength includes the capacity to evolve."
        : "Like fertile soil waiting for the rain, your Life Energy is receptive and deeply accommodating. While you give much to others, beware of becoming depleted. Cultivate boundaries and remember that to nurture the world, you must first nourish the earth within. True grounding begins with self-care.";
    } else if (dayMasterElement === 'Metal' || dayMasterElement === '金') {
      zenMessage = isStrong 
        ? "Your Life Energy is forged like tempered steel—sharp, clear, and resolute. Your sense of justice and structure is impeccable. Yet, absolute rigidity leads to fracture. Water dulls the sharpest blade over time. Soften your edges with compassion and learn that true perfection often lies in embracing life's beautiful imperfections."
        : "Like precious ore hidden deep within the earth, your true value may not always be immediately visible. Do not let the heavy pressures of the world crush your spirit. The finest diamonds are born under pressure. Endure the tempering process with grace, and you will emerge with unbreakable clarity and brilliance.";
    } else { // Water
      zenMessage = isStrong 
        ? "Your Life Energy flows with the overwhelming force of a mighty river or a vast ocean. You possess immense momentum and depth. But water that rages uncontrollably causes destruction. Learn the wisdom of the tranquil lake. Channel your power into deliberate, mindful actions, and let your depth be a source of calm reflection."
        : "Like a gentle mist or a quiet stream, your Life Energy is subtle, adaptable, and deeply intuitive. You navigate the cracks and crevices of life with ease. 'The supreme good is like water, benefiting all things without contending.' Trust your intuition; your soft persistence is capable of wearing away the hardest stone over time.";
    }
  } else {
    if (dayMasterElement === 'Wood' || dayMasterElement === '木') {
      zenMessage = isStrong 
        ? "命局木气极旺，如参天巨木，势不可挡。然『木强则折』，过刚易生无明之火。真正的修行，在于学竹之柔韧，风过而低头，风息而复挺。将执念化为悲悯，在进退之间寻找生命的从容，方能生生不息。"
        : "命如幼苗初绽，木气柔弱，易受风雨之惊。切勿焦躁于眼前的停滞，要知『十年树木』，根基未深时，最忌拔苗助长。多近水木相生之地，借贵人之力，向阳而生。守住内心的仁慈与坚韧，静待春风化雨时。";
    } else if (dayMasterElement === 'Fire' || dayMasterElement === '火') {
      zenMessage = isStrong 
        ? "命局火炎土燥，如烈日当空，光芒万丈。你的热情与爆发力是破局的利刃。然『火炎易灭』，急躁与冲动往往是命运的暗礁。当修水之静慧，学会适时收敛光芒，将外散的能量转为内心的觉照。温和的篝火，远比燎原的烈焰更能长久暖人。"
        : "命局星火微弱，如风中残烛。外境的冷雨易让你感到心力交瘁。然『星星之火，可以燎原』，切勿因势弱而熄灭内心的光明。善借木之生发，多与良师益友同行。保护好心底的热忱，在暗夜中默默积蓄能量，终有一日能照亮自己的宇宙。";
    } else if (dayMasterElement === 'Earth' || dayMasterElement === '土') {
      zenMessage = isStrong 
        ? "命局土气厚重，如崇山峻岭，稳如泰山。你天生具有承载万物的胸怀。然『土重则滞』，固步自封会阻碍生命的灵动。试着打破内心的围墙，接纳金水的流通与变化。让思想如流水般灵动，在安稳中拥抱未知，生命方能焕发勃勃生机。"
        : "命局土气虚浮，如沙上建塔，根基不稳。你常怀慈悲，乐于奉献，却易在纷繁的人际中失去自我。要知『厚德方能载物』，在承载他人之前，必先沉淀自身。学会拒绝，建立边界，于静默中培植内心的力量，方是长久安身立命之道。";
    } else if (dayMasterElement === 'Metal' || dayMasterElement === '金') {
      zenMessage = isStrong 
        ? "命局金气肃杀，如出匣之剑，锋芒毕露。你重义气、讲原则，行事果断。然『过刚者易折，善柔者不败』。极致的完美主义往往伤人伤己。试着以水之柔情化解金之锐气，在黑白之间容纳灰度。宽恕他人的不完美，也是对自己的救赎。"
        : "命局金气沉埋，如深山璞玉，光华未显。面对世俗的重压与打磨，你或许时感煎熬。然『百炼方能成钢』，每一次挫折，都是雕琢灵魂的刻刀。无需急于证明自己，在孤独中忍耐与蜕变，待到锋芒淬炼成形，自会有惊艳岁月的光芒。";
    } else { // Water
      zenMessage = isStrong 
        ? "命局水势浩荡，如江河奔涌，深不可测。你拥有极强的直觉与智慧。然『水满则溢』，过于放纵的情绪与欲望易成洪灾。修行之要，在于筑起理智的堤坝，将泛滥的才华引入正轨。学会专注与节制，让波涛汹涌化为静水流深，方能润泽万物。"
        : "命局水气清浅，如山间雨露，柔弱多变。你心思细腻，极具包容力，却也容易随波逐流，迷失方向。『上善若水，水善利万物而不争』。你的力量不在于强攻，而在于水滴石穿的韧性。坚守内心的清明，以柔克刚，在悄无声息中，你自能改变世界的轮廓。";
    }
  }

  const result = {
    birthDate: date, // Return Date object for further calculations
    pillars: pillarsDisplay,
    dayMaster,
    dayMasterElement,
    monthBranch,
    season,
    daYunList,
    currentDaYun,
    strengthAnalysis,
    careerAnalysis, 
    zenMessage, // Added dynamic zen message
    envData: {
      cRegion: mappedCRegion,
      wRegion: mappedWRegion,
      bEnv: mappedBEnv,
      rawAddress: isOverseas ? worldCountry : chinaAddress
    }
  };

  // 递归将对象中的中文字符串转换为繁体
  if (data.lang === 'zh-TW') {
    const deepTranslate = (obj) => {
      if (typeof obj === 'string') return translateToTW(obj);
      if (Array.isArray(obj)) return obj.map(deepTranslate);
      if (obj instanceof Date) return obj; // 保留 Date 对象
      if (obj && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
          newObj[key] = deepTranslate(obj[key]);
        }
        return newObj;
      }
      return obj;
    };
    return deepTranslate(result);
  }

  return result;
}
