import { Solar } from 'lunar-javascript';
import { ELEMENT_MAPPING } from './translations.js';
import { BAZI_MAPPING, calculationRules } from './constants.js';
import {
  getPart1Variations,
  getPart2Variations,
  getPart3Variations,
  getPart4Variations,
  getPart5Variations,
  getPart1VariationsEn,
  getPart2VariationsEn,
  getPart3VariationsEn,
  getPart4VariationsEn,
  getPart5VariationsEn
} from './aiVariations.js';

const API_KEY = process.env.DEEPSEEK_API_KEY || '';
const API_URL = 'https://api.deepseek.com/chat/completions';

function hasRemoteAiConfig() {
  return Boolean(String(API_KEY || '').trim());
}

const BRANCH_RELATIONS = {
  hui: {
    木: ['寅', '卯', '辰'],
    火: ['巳', '午', '未'],
    金: ['申', '酉', '戌'],
    水: ['亥', '子', '丑']
  },
  sanHe: {
    水: ['申', '子', '辰'],
    木: ['亥', '卯', '未'],
    火: ['寅', '午', '戌'],
    金: ['巳', '酉', '丑']
  },
  liuHe: [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']],
  banHe: [['申', '子'], ['子', '辰'], ['亥', '卯'], ['卯', '未'], ['寅', '午'], ['午', '戌'], ['巳', '酉'], ['酉', '丑']],
  gongHe: [['申', '辰'], ['亥', '未'], ['寅', '戌'], ['巳', '丑']],
  liuChong: [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']],
  sanXing: [['寅', '巳'], ['巳', '申'], ['申', '寅'], ['丑', '戌'], ['戌', '未'], ['未', '丑'], ['子', '卯'], ['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥']],
  liuHai: [['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']],
  xiangPo: [['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌']]
};

const SEASON_BRANCHES = {
  春季: ['寅', '卯', '辰'],
  夏季: ['巳', '午', '未'],
  秋季: ['申', '酉', '戌'],
  冬季: ['亥', '子', '丑']
};

const FIVE_STATE_MAP = {
  春季: { 木: '旺', 火: '衰', 水: '休', 金: '囚', 土: '死' },
  夏季: { 火: '旺', 土: '衰', 木: '休', 水: '囚', 金: '死' },
  秋季: { 金: '旺', 水: '衰', 土: '休', 火: '囚', 木: '死' },
  冬季: { 水: '旺', 木: '衰', 金: '休', 土: '囚', 火: '死' }
};

const PERSONALITY_VARIATIONS = {
  木: {
    旺: [
      '木气当令，心性仁厚而主动，判断快，但容易把原则顶得过硬，在压力下可能表现为非黑即白的坚持',
      '木得春令，直上直下，为人有风骨，但说话易太直，需要学会软着陆的表达方式',
      '木旺则直，心地光明，有理想感，但易忽略现实细节，需要落地能力的配合'
    ],
    衰: [
      '木气有根却不横生，具理想感与延展性，做事更讲节奏与环境配合，懂得等待时机',
      '木气虽衰，根系仍在，有韧性，擅长在限制中寻找生长空间，适应力强',
      '木逢弱地，不急于伸展，先观察环境再行动，往往能找到更稳妥的路径'
    ],
    休: [
      '木逢泄气，心里有方向感，但表达常先收后放，容易把压力留在自己体内，需要找到释放的出口',
      '木处休地，先养精蓄锐，不是没有想法，而是在暗中蓄力，等待合适的春天',
      '木气内敛，心里清楚方向，但行动上会更谨慎，避免过早暴露目标'
    ],
    囚: [
      '木受围困，外柔内紧，敏感、警觉，对关系与边界格外在意，需要安全空间才能舒展',
      '木困则曲，不会硬碰硬，但会用迂回的方式达到目标，韧性反而更强',
      '木被约束，外表温和，内心却有自己的坚持，只是表达方式更婉转'
    ],
    死: [
      '木临死地，更多以内敛、自我压抑与延迟表达的方式保护自己，需要信任才能打开',
      '木气沉潜，不轻易外露，内心有自己的天地，只是需要被理解和激活',
      '木处绝地，看似沉寂，实则在暗中积累，一旦时机成熟可以焕发生机'
    ]
  },
  火: {
    旺: [
      '火势得令，反应快、感染力强，愿意主动点亮局面，但易急于推进，需要学会放慢节奏',
      '火炎上，热情奔放，善于调动气氛，但有时过于急躁，忽略了他人的节奏',
      '火旺则明，有号召力和感染力，但容易燃烧太快，需要学会收放自如'
    ],
    衰: [
      '火有余温，表达欲与行动力并存，只是更需要明确目标来点燃持续性，一旦找到方向就很专注',
      '火虽衰微，光芒仍在，需要具体的目标来激发能量，不是没有热情，而是需要点燃',
      '火气收敛，不轻易外放，但遇到真正在意的事会全力以赴，后劲很足'
    ],
    休: [
      '火入休地，热情不外放，往往先观察氛围，再决定是否投入能量，懂得保护自己的能量',
      '火处休眠，不是冷漠，而是在选择值得投入的人和事，一旦认准会很温暖',
      '火气内藏，外表平静，内心有自己的热情，只给真正值得的人看'
    ],
    囚: [
      '火受困时，情绪与表达容易卡住，外冷内热，偶尔会突然爆发，需要找到健康的释放方式',
      '火被压抑，外表冷静，内心却在积聚能量，需要适当的出口才能避免积压',
      '火困则郁，热情无处释放，容易变得烦躁，需要找到适合的表达方式'
    ],
    死: [
      '火临死地，很多锋芒收在心里，自我要求重，容易出现能量耗竭，需要学会放过自己',
      '火气将熄，不是没有能量，而是需要重新找到燃烧的意义，找回内在的光',
      '火处绝地，看似沉寂，实则在暗中守护着什么，需要被理解和看见'
    ]
  },
  土: {
    旺: [
      '土旺则稳，重秩序与兑现，抗压强，但容易保守与慢热，需要学会灵活变通',
      '土厚载物，踏实可靠，值得信赖，但有时过于固守，需要打开一些边界',
      '土旺则实，做事稳健，有始有终，但创新能力需要被激活，避免陷入固化'
    ],
    衰: [
      '土有承载力，做事讲分寸，既想稳定，也愿意根据局势调整，平衡感很好',
      '土虽不厚，仍能载物，懂得适可而止，不会过度承担，反而能走得更远',
      '土气平和，不极端，能包容不同的人和事，适应性强，容易与人合作'
    ],
    休: [
      '土处休地，责任心仍在，但容易一边扛事一边怀疑自己扛得够不够，需要学会相信自己',
      '土在修养，不是没有能力，而是在沉淀和积累，等待更合适的时机',
      '土气内敛，默默承担，不张扬，但需要被看见和认可'
    ],
    囚: [
      '土被困时，顾虑多、行动慢，容易陷入反复权衡与迟迟不决，需要学会先行动再调整',
      '土受约束，不敢放开，害怕承担风险，但其实你的承载力比你想象的强',
      '土困则疑，对自己和他人都有顾虑，需要建立信任才能放开手脚'
    ],
    死: [
      '土临死地，安全感需求强，若外部支持不足，容易表现为闷和忍，需要建立内在的安全感',
      '土气固结，不容易打开，但一旦建立信任会非常可靠，只是需要时间',
      '土处绝地，看似固执，实则在寻求稳定的根基，需要找到可以依靠的东西'
    ]
  },
  金: {
    旺: [
      '金旺则决断清楚，重规则、效率与边界，但锋芒太直时易伤人，需要学会柔和表达',
      '金锋利，有决断力，能看清本质，但有时过于直接，需要学会照顾他人感受',
      '金坚则刚，有原则，不妥协，但过于刚硬容易折断，需要学会韧性'
    ],
    衰: [
      '金有骨架感，思路偏理性，既追求标准，也能根据现实修正方法，弹性很好',
      '金虽不锐，仍有锋芒，只是懂得收敛，不会轻易伤人，反而更有力量',
      '金气平和，有原则但不极端，能在理想和现实之间找到平衡'
    ],
    休: [
      '金入休地，判断力仍在，但更倾向先磨细节，再出手定夺，做事很精致',
      '金在修养，不是没有判断力，而是在深思熟虑，一旦出手往往很精准',
      '金气内敛，不轻易表态，但在关键时能给出清晰的判断'
    ],
    囚: [
      '金受困时，容易对自己和他人都过于苛刻，心里常有紧绷感，需要学会放松',
      '金被约束，无法施展，容易变得挑剔，其实是对自己不满意的投射',
      '金困则锐，更容易伤人伤己，需要学会放下完美主义，接受不完美'
    ],
    死: [
      '金临死地，防御性强，很多想法不轻易说透，先求不失再求得，需要学会信任',
      '金气沉潜，看似封闭，实则在保护自己，需要安全的环境才能打开',
      '金处绝地，看似没有锋芒，实则在积蓄力量，等待重新焕发光彩'
    ]
  },
  水: {
    旺: [
      '水旺则思维灵活、直觉敏锐，擅观察与周旋，但容易多线分心，需要学会专注',
      '水流动，适应性强，能应对各种变化，但有时过于分散，需要聚焦',
      '水智则灵，聪明灵活，点子多，但需要学会落地执行，避免只停留在想法'
    ],
    衰: [
      '水有流动性，理解快、适应强，遇事会先判断空间再选择路径，很有智慧',
      '水虽不旺，仍能流动，懂得顺势而为，不强行推进，反而能达到目标',
      '水气平和，不急不躁，能耐心等待时机，一旦抓住机会就能顺势而为'
    ],
    休: [
      '水处休地，想法多而藏得深，宁可自己消化，也不愿立刻摊开，需要学会表达',
      '水在修养，不是没有想法，而是在沉淀，等待更清晰的时机再行动',
      '水气内敛，内心丰富，但不轻易外露，需要被理解才能打开'
    ],
    囚: [
      '水受困时，焦虑更容易内化，表面平静，心里其实一直在盘算，需要学会释放',
      '水被约束，无法流动，容易淤积，需要找到出口，避免情绪积压',
      '水困则郁，情绪容易下沉，需要找到健康的方式释放和流动'
    ],
    死: [
      '水临死地，情绪收束感强，对信任与安全的要求会明显提高，需要建立安全感',
      '水将凝固，看似停滞，实则在等待解冻，需要温暖和信任才能重新流动',
      '水处绝地，看似没有活力，实则在积蓄势能，一旦打开会很有力量'
    ]
  }
};

const PERSONALITY_BASE = {
  木: {
    旺: '木气当令，心性仁厚而主动，判断快，但容易把原则顶得过硬',
    衰: '木气有根却不横生，具理想感与延展性，做事更讲节奏与环境配合',
    休: '木逢泄气，心里有方向感，但表达常先收后放，容易把压力留在自己体内',
    囚: '木受围困，外柔内紧，敏感、警觉，对关系与边界格外在意',
    死: '木临死地，更多以内敛、自我压抑与延迟表达的方式保护自己'
  },
  火: {
    旺: '火势得令，反应快、感染力强，愿意主动点亮局面，但易急于推进',
    衰: '火有余温，表达欲与行动力并存，只是更需要明确目标来点燃持续性',
    休: '火入休地，热情不外放，往往先观察氛围，再决定是否投入能量',
    囚: '火受困时，情绪与表达容易卡住，外冷内热，偶尔会突然爆发',
    死: '火临死地，很多锋芒收在心里，自我要求重，容易出现能量耗竭'
  },
  土: {
    旺: '土旺则稳，重秩序与兑现，抗压强，但容易保守与慢热',
    衰: '土有承载力，做事讲分寸，既想稳定，也愿意根据局势调整',
    休: '土处休地，责任心仍在，但容易一边扛事一边怀疑自己扛得够不够',
    囚: '土被困时，顾虑多、行动慢，容易陷入反复权衡与迟迟不决',
    死: '土临死地，安全感需求强，若外部支持不足，容易表现为闷和忍'
  },
  金: {
    旺: '金旺则决断清楚，重规则、效率与边界，但锋芒太直时易伤人',
    衰: '金有骨架感，思路偏理性，既追求标准，也能根据现实修正方法',
    休: '金入休地，判断力仍在，但更倾向先磨细节，再出手定夺',
    囚: '金受困时，容易对自己和他人都过于苛刻，心里常有紧绷感',
    死: '金临死地，防御性强，很多想法不轻易说透，先求不失再求得'
  },
  水: {
    旺: '水旺则思维灵活、直觉敏锐，擅观察与周旋，但容易多线分心',
    衰: '水有流动性，理解快、适应强，遇事会先判断空间再选择路径',
    休: '水处休地，想法多而藏得深，宁可自己消化，也不愿立刻摊开',
    囚: '水受困时，焦虑更容易内化，表面平静，心里其实一直在盘算',
    死: '水临死地，情绪收束感强，对信任与安全的要求会明显提高'
  }
};

const PERSONALITY_BASE_EN = {
  木: {
    旺: 'Wood is in command, so the mind is humane, proactive, and fast to judge, yet principles can become too rigid under pressure.',
    衰: 'Wood still has roots without over-expanding, so ideals and adaptability coexist, and action depends heavily on timing and context.',
    休: 'Wood is being drained, so direction exists internally, but expression often stays contained first and pressure is easily absorbed inward.',
    囚: 'Wood is constrained, so the outer style looks gentle while the inner state stays tense, highly alert to relationships and boundaries.',
    死: 'Wood in a dead phase tends to protect itself through restraint, self-suppression, and delayed expression.'
  },
  火: {
    旺: 'Fire is in season, so response speed and influence are strong, with a natural urge to light up the situation, though impatience can rise easily.',
    衰: 'Fire still keeps warmth, so expression and drive remain present, but sustained momentum depends on a clearly defined target.',
    休: 'Fire in rest does not display passion loudly; it reads the atmosphere first and then decides whether to invest energy.',
    囚: 'Fire under constraint can jam emotion and expression, creating a cool exterior with sudden bursts from a heated interior.',
    死: 'Fire in a dead phase stores much of its sharpness inside, sets heavy standards for itself, and can slide into depletion.'
  },
  土: {
    旺: 'Strong Earth values order, reliability, and delivery, carrying pressure well but tending toward caution and slow warming.',
    衰: 'Earth still has carrying capacity, so it acts with proportion, seeking stability while remaining willing to adapt to circumstances.',
    休: 'Earth in rest keeps its sense of duty, yet often shoulders responsibility while quietly doubting whether it can carry enough.',
    囚: 'Constrained Earth worries more and moves more slowly, often getting stuck in repeated weighing and delayed decisions.',
    死: 'Earth in a dead phase has a strong need for security, and when external support is weak it tends to turn quiet and endure.'
  },
  金: {
    旺: 'Strong Metal makes judgment clear, values rules, efficiency, and boundaries, but its edge can become too direct and cut others.',
    衰: 'Metal still has structure, so thinking stays rational, balancing standards with a willingness to adjust methods to reality.',
    休: 'Metal in rest keeps discernment, yet prefers to refine details before stepping in and making the final call.',
    囚: 'Constrained Metal can become overly harsh toward both self and others, carrying a constant inner tension.',
    死: 'Metal in a dead phase is defensive, reveals little too quickly, and chooses not losing before pursuing gain.'
  },
  水: {
    旺: 'Strong Water brings agile thinking, sharp intuition, and skill in observation and maneuvering, though it can scatter attention across too many lines.',
    衰: 'Water keeps its fluidity, learning quickly and adapting well, first judging available space before choosing a path.',
    休: 'Water in rest hides many thoughts beneath the surface, preferring to digest them internally rather than exposing them at once.',
    囚: 'Constrained Water internalizes anxiety more easily; it may look calm outside while calculation continues underneath.',
    死: 'Water in a dead phase compresses emotion and raises its demand for trust and safety.'
  }
};

const POTENTIAL_DIRECTION_EN = {
  印星: 'knowledge integration, consulting, research, education, and credential-based pathways',
  比劫: 'independent expansion, team collaboration, resource integration, and project execution',
  食伤: 'content expression, product design, technical output, and creative monetization',
  财星: 'commercial conversion, client operations, resource allocation, and business management',
  官杀: 'rule-based systems, management roles, audit, legal work, and risk control'
};

const ENGLISH_TERM_REPLACEMENTS = [
  ['生命时空密码解析', 'Life Space-Time Code Analysis'],
  ['生命時空密碼解析', 'Life Space-Time Code Analysis'],
  ['全息时空 · 核心锚点', 'Holographic Time-Space Anchor'],
  ['全息時空 · 核心錨點', 'Holographic Time-Space Anchor'],
  ['性格底色与潜能', 'Personality Background & Potential'],
  ['性格底色與潛能', 'Personality Background & Potential'],
  ['事业与财运即明', 'Career & Wealth'],
  ['事業與財運即明', 'Career & Wealth'],
  ['流年大运下的行动建议', 'DaYun and LiuNian Action'],
  ['流年大運下的行動建議', 'DaYun and LiuNian Action'],
  ['一句话收束', 'Closing Line'],
  ['一句話收束', 'Closing Line'],
  ['智能禅语', 'Zen Wisdom'],
  ['智慧禪語', 'Zen Wisdom'],
  ['日主', 'Day Master'],
  ['日干', 'Day Master'],
  ['月令', 'Month Command'],
  ['月支', 'Month Branch'],
  ['月令季节', 'Month Command Season'],
  ['月令季節', 'Month Command Season'],
  ['月令状态', 'Month Command State'],
  ['月令狀態', 'Month Command State'],
  ['大运', 'DaYun'],
  ['大運', 'DaYun'],
  ['流年', 'LiuNian'],
  ['财星', 'Wealth Star'],
  ['財星', 'Wealth Star'],
  ['藏干透出', 'Surfaced Hidden Stems'],
  ['藏干', 'Hidden Stems'],
  ['透出', 'surfaced'],
  ['命局强弱评级', 'Chart Strength Rating'],
  ['命局強弱評級', 'Chart Strength Rating'],
  ['命局强弱说明', 'Chart Strength Summary'],
  ['命局強弱說明', 'Chart Strength Summary'],
  ['性格基底', 'Personality Base'],
  ['潜能方向', 'Potential Direction'],
  ['潛能方向', 'Potential Direction'],
  ['喜用神', 'Beneficial Elements'],
  ['忌神', 'Unfavorable Elements'],
  ['五行', 'Five Elements'],
  ['印星', 'Resource Star'],
  ['比劫', 'Peers'],
  ['食伤', 'Output Star'],
  ['食傷', 'Output Star'],
  ['官杀', 'Officer and Seven Killings'],
  ['官殺', 'Officer and Seven Killings'],
  ['会合刑冲破害', 'harmony, combination, penalty, clash, break, and harm'],
  ['會合刑沖破害', 'harmony, combination, penalty, clash, break, and harm'],
  ['会', 'harmony'],
  ['會', 'harmony'],
  ['合', 'combination'],
  ['冲', 'clash'],
  ['沖', 'clash'],
  ['刑', 'penalty'],
  ['破', 'break'],
  ['害', 'harm'],
  ['旺', 'prosperous'],
  ['衰', 'declining'],
  ['休', 'resting'],
  ['囚', 'confined'],
  ['死', 'dead'],
  ['平衡', 'balanced'],
  ['平', 'balanced'],
  ['生扶', 'supportive'],
  ['克泄', 'draining'],
  ['春季', 'Spring'],
  ['夏季', 'Summer'],
  ['秋季', 'Autumn'],
  ['冬季', 'Winter'],
  ['四季', 'All-Season Pivot']
];

function getLang(userInfo) {
  if (userInfo.lang) return userInfo.lang;
  return userInfo.isEnglish ? 'en' : 'zh-CN';
}

function getUniqueSeedFromBazi(pillars, name = '') {
  const pillarChars = pillars.map(getPillarChar).join('') + name;
  let hash = 0;
  for (let i = 0; i < pillarChars.length; i++) {
    const char = pillarChars.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function selectPersonalizedText(element, state, seed, lang = 'zh-CN') {
  if (lang === 'en') {
    return PERSONALITY_BASE_EN[element]?.[state] || `${element} Day Master in ${state} state`;
  }
  
  const variations = PERSONALITY_VARIATIONS[element]?.[state];
  if (!variations || !variations.length) {
    return PERSONALITY_BASE[element]?.[state] || `${element}日主呈现${state}势`;
  }
  
  const index = seed % variations.length;
  return variations[index];
}

function getPillarChar(pillar) {
  if (!pillar) return '';
  if (typeof pillar === 'string') return pillar;
  return pillar.char || '';
}

function getPillarStem(pillar) {
  return getPillarChar(pillar).substring(0, 1);
}

function getPillarBranch(pillar) {
  return getPillarChar(pillar).substring(1, 2);
}

function getCurrentLiuNian() {
  const now = new Date();
  const solar = Solar.fromYmdHms(now.getFullYear(), now.getMonth() + 1, now.getDate(), 12, 0, 0);
  return solar.getLunar().getYearInGanZhi();
}

function getSeasonByBranch(branch) {
  return Object.entries(SEASON_BRANCHES).find(([, branches]) => branches.includes(branch))?.[0] || '四季';
}

function getMonthCommandState(element, monthBranch) {
  const season = getSeasonByBranch(monthBranch);
  return {
    season,
    state: FIVE_STATE_MAP[season]?.[element] || '平'
  };
}

function getElementRelation(element, dayMasterElement) {
  return calculationRules.getRelation(element, dayMasterElement);
}

function getRelationLabel(relation) {
  const map = {
    same: '比劫',
    support: '印星',
    restrict: '官杀',
    exhaust: '食伤',
    consume: '财星'
  };
  return map[relation] || '中性';
}

function getWealthElement(dayMasterElement) {
  const map = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
  return map[dayMasterElement] || '';
}

function getElementFromStem(stem) {
  const info = BAZI_MAPPING.stems[stem];
  const map = { Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水' };
  return info ? (map[info.element] || info.element) : '';
}

function getElementFromBranch(branch) {
  const info = BAZI_MAPPING.branches[branch];
  const map = { Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水' };
  return info ? (map[info.element] || info.element) : '';
}

function hasAll(target, source) {
  return target.every((v) => source.includes(v));
}

function collectBranchInteractions(targetBranch, otherBranches) {
  const allBranches = [targetBranch, ...otherBranches];
  const records = [];

  Object.entries(BRANCH_RELATIONS.hui).forEach(([element, group]) => {
    if (group.includes(targetBranch) && hasAll(group, allBranches)) {
      records.push(`会${element}`);
    }
  });

  Object.entries(BRANCH_RELATIONS.sanHe).forEach(([element, group]) => {
    if (group.includes(targetBranch) && hasAll(group, allBranches)) {
      records.push(`三合${element}`);
    }
  });

  [
    ['六合', BRANCH_RELATIONS.liuHe],
    ['半合', BRANCH_RELATIONS.banHe],
    ['拱合', BRANCH_RELATIONS.gongHe],
    ['冲', BRANCH_RELATIONS.liuChong],
    ['刑', BRANCH_RELATIONS.sanXing],
    ['害', BRANCH_RELATIONS.liuHai],
    ['破', BRANCH_RELATIONS.xiangPo]
  ].forEach(([label, groups]) => {
    groups.forEach((group) => {
      if (group.includes(targetBranch) && hasAll(group, allBranches)) {
        records.push(`${label}${group.join('')}`);
      }
    });
  });

  return Array.from(new Set(records));
}

function getExposedHiddenStems(pillars) {
  const visibleStems = pillars.map(getPillarStem);
  const exposed = [];
  pillars.forEach((pillar) => {
    (pillar.hiddenStems || []).forEach((item) => {
      if (visibleStems.includes(item.stem)) {
        exposed.push({
          stem: item.stem,
          relation: getRelationLabel(getElementRelation(getElementFromStem(item.stem), getElementFromStem(getPillarStem(pillars[1]))))
        });
      }
    });
  });
  return exposed;
}

function getPotentialDirection(exposedRelations) {
  const count = exposedRelations.reduce((acc, item) => {
    acc[item.relation] = (acc[item.relation] || 0) + 1;
    return acc;
  }, {});
  const dominant = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || '比劫';
  const map = {
    印星: '更适合知识整合、咨询、研究、教育、资质型路径',
    比劫: '更适合自主开拓、团队协作、资源整合、项目推进',
    食伤: '更适合内容表达、产品设计、技术输出、创意变现',
    财星: '更适合商业转化、客户经营、资源配置、经营管理',
    官杀: '更适合规则体系、管理岗位、审计法务、风险控制'
  };
  return {
    dominant,
    text: map[dominant] || map.比劫,
    englishText: POTENTIAL_DIRECTION_EN[dominant] || POTENTIAL_DIRECTION_EN.比劫
  };
}

function analyzeTransit(ganZhi, dayMasterElement, natalBranches, wealthElement) {
  if (!ganZhi) {
    return {
      ganZhi: '',
      stem: '',
      branch: '',
      stemElement: '',
      branchElement: '',
      stemRelation: '',
      branchRelation: '',
      trend: '平',
      interactions: [],
      wealthActive: false,
      wealthState: '平'
    };
  }

  const stem = ganZhi.substring(0, 1);
  const branch = ganZhi.substring(1, 2);
  const stemElement = getElementFromStem(stem);
  const branchElement = getElementFromBranch(branch);
  const stemRelation = getElementRelation(stemElement, dayMasterElement);
  const branchRelation = getElementRelation(branchElement, dayMasterElement);
  const score = (calculationRules.coefficients[stemRelation] || 0) + (calculationRules.coefficients[branchRelation] || 0);
  const trend = score > 0.08 ? '生扶' : score < -0.08 ? '克泄' : '平衡';
  const interactions = collectBranchInteractions(branch, natalBranches);
  const wealthActive = stemElement === wealthElement || branchElement === wealthElement;
  const wealthState = getMonthCommandState(wealthElement, branch).state;

  return {
    ganZhi,
    stem,
    branch,
    stemElement,
    branchElement,
    stemRelation,
    branchRelation,
    trend,
    interactions,
    wealthActive,
    wealthState
  };
}

function buildAnalysisContext(userInfo, baziResult, namingResult) {
  const pillars = baziResult.pillars || [];
  const dayMaster = baziResult.dayMaster;
  const dayMasterElement = baziResult.dayMasterElement;
  const monthBranch = baziResult.monthBranch;
  const monthCommand = getMonthCommandState(dayMasterElement, monthBranch);
  const natalBranches = pillars.map(getPillarBranch).filter(Boolean);
  const currentDaYunRaw = typeof baziResult.currentDaYun?.ganZhi === 'object'
    ? baziResult.currentDaYun?.ganZhi?.char
    : baziResult.currentDaYun?.ganZhi;
  const currentLiuNian = getCurrentLiuNian();
  const wealthElement = getWealthElement(dayMasterElement);
  const exposedHiddenStems = getExposedHiddenStems(pillars);
  const potentialDirection = getPotentialDirection(exposedHiddenStems);
  const daYunAnalysis = analyzeTransit(currentDaYunRaw, dayMasterElement, natalBranches, wealthElement);
  const liuNianAnalysis = analyzeTransit(currentLiuNian, dayMasterElement, natalBranches, wealthElement);
  
  const userName = userInfo.name || userInfo.fullName || '';
  const uniqueSeed = getUniqueSeedFromBazi(pillars, userName);
  const lang = getLang(userInfo);
  const personalityBase = selectPersonalizedText(dayMasterElement, monthCommand.state, uniqueSeed, lang);
  
  const wealthSummary = liuNianAnalysis.wealthActive
    ? `流年已触发财星，且财星处于${liuNianAnalysis.wealthState}位`
    : `流年未直接触发财星，但可通过${liuNianAnalysis.trend === '生扶' ? '先补身后取财' : '收缩风险敞口'}来处理财务节奏`;
  const pillarText = {
    year: getPillarChar(pillars[3]),
    month: getPillarChar(pillars[2]),
    day: getPillarChar(pillars[1]),
    hour: getPillarChar(pillars[0])
  };

  return {
    pillarText,
    dayMaster,
    dayMasterElement,
    monthBranch,
    monthCommand,
    natalBranches,
    wealthElement,
    exposedHiddenStems,
    potentialDirection,
    daYunAnalysis,
    liuNianAnalysis,
    personalityBase,
    wealthSummary,
    strengthRating: baziResult.strengthAnalysis?.rating,
    strengthDescription: baziResult.strengthAnalysis?.description,
    careerSuggestions: baziResult.careerAnalysis?.suggestions,
    namingScore: namingResult?.totalScore,
    uniqueSeed,
    userName
  };
}

function buildPrompt(userInfo, baziResult, namingResult, lang, context, retry = false) {
  let languageInstruction = '【语言指令】请使用简体中文输出最终分析。';
  if (lang === 'zh-TW') {
    languageInstruction = '【语言指令】请使用繁體中文輸出最終分析。';
  } else if (lang === 'en') {
    languageInstruction = '【语言指令】请使用英文输出最终分析，但内部推演仍用中文命理逻辑。';
  }

  const retryInstruction = retry
    ? '【重生成要求】上一版未明确写出“月令对日干的具体影响”或未点明旺、衰、休、囚、死，请完全重写。'
    : '';

  return `
你是一名只按子平八字底层规则推演的命理分析师。
${languageInstruction}
${retryInstruction}
请基于日主的旺衰状态，结合流年大运的会、合、刑、冲、破、害，撰写一份具有唯一性的深度分析报告。

【重要提示】这份分析必须具有高度的个性化和唯一性，绝不能用模板化语言。同一个八字不同的人看，也应该有不同的侧重和表述方式。

【硬性规则】
1. 必须以日干（日主）为绝对核心，不得先写泛泛结论。
2. 第一部分必须明确写出：日主、月令、月令对日干的具体影响、对应状态（旺/衰/休/囚/死）。
3. 第二部分“性格底色与潜能”必须由“日干 + 月令状态 + 藏干透出”推导，不得出现“你性格坚毅/你很优秀”之类套话。要具体、要有细节、要有针对性。
4. 第三部分“事业与财运”必须围绕财星在大运、流年中的表现展开：若流年正好触发财星且财星在流年支中处于旺位或衰位，要具体写机会点、变现方式与避险动作；若流年逢冲克，要明确指出风险来自哪里。
5. 必须主动分析会、合、刑、冲、破、害对当前大运与流年的影响，不得漏写。
6. 如果命局信息不足以支持某个结论，必须说明“证据不足”，不要编造。
7. 全文禁止空泛鸡汤、禁止模板化口号、禁止“总体不错”“未来可期”这类模糊词。要有具体的描述、具体的建议、具体的场景。
8. 输出前自查：是否明确提到了“月令”对“日干”的具体影响；如果没有，请自动重写。
9. 全文必须具有唯一性，每一句话都应该像是专门为这个人写的，而不是任何人都能用的通用描述。

【命盘核心数据】
四柱：年柱 ${context.pillarText.year}，月柱 ${context.pillarText.month}，日柱 ${context.pillarText.day}，时柱 ${context.pillarText.hour}
日主：${context.dayMaster}（${context.dayMasterElement}）
月令：${context.monthBranch}
月令季节：${context.monthCommand.season}
月令状态：${context.monthCommand.state}
命局强弱评级：${context.strengthRating}
命局强弱说明：${context.strengthDescription}
独特种子值：${context.uniqueSeed}（用于确保分析的唯一性）

【推演种子】
性格基底：${context.personalityBase}
藏干透出：${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂无明显透出'}
潜能方向：${context.potentialDirection.dominant}，${context.potentialDirection.text}
财星五行：${context.wealthElement}

【大运介入】
当前大运：${context.daYunAnalysis.ganZhi || '未进入可识别大运'}
大运天干五行：${context.daYunAnalysis.stemElement || '无'}
大运地支五行：${context.daYunAnalysis.branchElement || '无'}
大运对日主：天干${context.daYunAnalysis.stemRelation || '无'}，地支${context.daYunAnalysis.branchRelation || '无'}，总体${context.daYunAnalysis.trend}
大运与原局关系：${context.daYunAnalysis.interactions.length ? context.daYunAnalysis.interactions.join('、') : '暂无明显会合刑冲破害'}

【流年介入】
当前流年：${context.liuNianAnalysis.ganZhi}
流年天干五行：${context.liuNianAnalysis.stemElement}
流年地支五行：${context.liuNianAnalysis.branchElement}
流年对日主：天干${context.liuNianAnalysis.stemRelation}，地支${context.liuNianAnalysis.branchRelation}，总体${context.liuNianAnalysis.trend}
流年与原局关系：${context.liuNianAnalysis.interactions.length ? context.liuNianAnalysis.interactions.join('、') : '暂无明显会合刑冲破害'}
财星判断：${context.wealthSummary}

【辅助信息】
事业喜用建议：${context.careerSuggestions}
姓名总分：${context.namingScore ?? '暂无'}

【输出结构】
1. 全息时空 · 核心锚点
2. 性格底色与潜能
3. 事业与财运即明
4. 流年大运下的行动建议
5. 一句话收束
`;
}

function validateAnalysisContent(content, lang) {
  if (!content) return false;
  if (lang === 'en') {
    const hasMonth = /month command|month branch/i.test(content);
    const hasState = /prosperous|declining|resting|confined|dead/i.test(content);
    return hasMonth && hasState;
  }
  const hasMonth = /月令/.test(content);
  const hasDayMaster = /日干|日主/.test(content);
  const hasState = /旺|衰|休|囚|死/.test(content);
  return hasMonth && hasDayMaster && hasState;
}

function generateFallbackResponse(userInfo, baziResult, namingResult, lang) {
  const context = buildAnalysisContext(userInfo, baziResult, namingResult);
  const daYunRelationText = context.daYunAnalysis.interactions.length ? context.daYunAnalysis.interactions.join('、') : '暂未形成明显会合刑冲破害';
  const liuNianRelationText = context.liuNianAnalysis.interactions.length ? context.liuNianAnalysis.interactions.join('、') : '暂未形成明显会合刑冲破害';
  const wealthOpportunity = context.liuNianAnalysis.wealthActive
    ? `当前流年 ${context.liuNianAnalysis.ganZhi} 已直接触发财星 ${context.wealthElement}，且财星在流年支中处于 ${context.liuNianAnalysis.wealthState} 位。若你从事销售、项目成交、资源撮合、客户经营、现金流管理类事项，更容易在“已有资源的再分配”中看到回款或订单。`
    : `当前流年 ${context.liuNianAnalysis.ganZhi} 并未直接把财星推到台前，求财不宜用“重仓冒进”的方式，更适合先修复日主承压点，再通过专业能力、信用积累与长期客户关系来换财。`;
  const wealthRisk = context.liuNianAnalysis.interactions.some(item => item.includes('冲') || item.includes('破') || item.includes('害'))
    ? `流年地支与原局存在 ${liuNianRelationText}，这意味着钱财机会往往伴随结构性扰动，尤其要防止合约反复、合作方变卦、情绪性交易和现金流断点。`
    : `流年地支没有形成过强的冲破害，说明今年的风险更偏“节奏失衡”，不是机会不存在，而是节奏要稳。`;

  if (lang === 'en') {
    const englishDaYunRelationText = context.daYunAnalysis.interactions.length
      ? sanitizeEnglishText(context.daYunAnalysis.interactions.join(', '))
      : 'no dominant harmony, clash, penalty, break, or harm pattern yet';
    const englishLiuNianRelationText = context.liuNianAnalysis.interactions.length
      ? sanitizeEnglishText(context.liuNianAnalysis.interactions.join(', '))
      : 'no dominant harmony, clash, penalty, break, or harm pattern yet';
    const englishExposedHiddenStems = context.exposedHiddenStems.length
      ? context.exposedHiddenStems.map((item) => sanitizeEnglishText(`${item.stem}-${item.relation}`)).join(', ')
      : 'not strongly surfaced';
    const englishWealthOpportunity = context.liuNianAnalysis.wealthActive
      ? `The current LiuNian ${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)} directly activates the Wealth Star ${sanitizeEnglishText(context.wealthElement)}, and that Wealth Star sits in a ${sanitizeEnglishText(context.liuNianAnalysis.wealthState)} state within the yearly branch. If your work touches sales, deal-making, resource brokerage, client operations, or cash-flow management, returns are easier to see through the secondary expansion of resources already in hand.`
      : `The current LiuNian ${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)} does not push the Wealth Star to the front directly, so wealth strategy works better through repairing the Day Master's pressure points first and converting professional credibility, accumulated trust, and long-term client relationships into financial results.`;
    const englishWealthRisk = context.liuNianAnalysis.interactions.some(item => item.includes('冲') || item.includes('破') || item.includes('害'))
      ? `Because the yearly branch forms ${englishLiuNianRelationText} with the natal chart, financial openings tend to arrive together with structural disturbance, so contract reversals, partner instability, emotional trading, and cash-flow breaks need extra caution.`
      : 'The yearly branch does not create an excessive clash-break-harm pattern, which means the main risk is rhythm imbalance rather than the absence of opportunity.';

    const part1 = getPart1VariationsEn(context, baziResult, userInfo, sanitizeEnglishText);
    const part2 = getPart2VariationsEn(context, userInfo, PERSONALITY_BASE_EN, sanitizeEnglishText, englishExposedHiddenStems);
    const part3 = getPart3VariationsEn(context, {englishDaYunRelationText, englishWealthOpportunity, englishWealthRisk}, userInfo, sanitizeEnglishText);
    const part4 = getPart4VariationsEn(context, {englishLiuNianRelationText}, userInfo, sanitizeEnglishText);
    const part5 = getPart5VariationsEn(context, userInfo);
    return `
# 🌿 Life Space-Time Code Analysis

## 1. Holographic Time-Space Anchor
${part1}

## 2. Personality Background & Potential
${part2}

## 3. Career & Wealth
${part3}

## 4. DaYun and LiuNian Action
${part4}

## 5. Closing Line
${part5}
    `.trim();
  }

  const part1 = getPart1Variations(context, baziResult, userInfo);
  const part2 = getPart2Variations(context, userInfo);
  const part3 = getPart3Variations(context, {daYunRelationText, wealthOpportunity, wealthRisk}, userInfo);
  const part4 = getPart4Variations(context, {liuNianRelationText}, userInfo);
  const part5 = getPart5Variations(context, userInfo);
  return `
# 🌿 生命时空密码解析

## 1. 全息时空 · 核心锚点
${part1}

## 2. 性格底色与潜能
${part2}

## 3. 事业与财运即明
${part3}

## 4. 流年大运下的行动建议
${part4}

## 5. 一句话收束
${part5}
  `;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceTerms(text, replacements) {
  return replacements.reduce((output, [source, target]) => {
    return output.replace(new RegExp(escapeRegExp(source), 'g'), target);
  }, String(text || ''));
}

function normalizeEnglishHeadings(text) {
  return String(text || '')
    .replace(/^#.*$/m, '# 🌿 Life Space-Time Code Analysis')
    .replace(/^##\s*1[^\n]*$/gm, '## 1. Holographic Time-Space Anchor')
    .replace(/^##\s*2[^\n]*$/gm, '## 2. Personality Background & Potential')
    .replace(/^##\s*3[^\n]*$/gm, '## 3. Career & Wealth')
    .replace(/^##\s*4[^\n]*$/gm, '## 4. DaYun and LiuNian Action')
    .replace(/^##\s*5[^\n]*$/gm, '## 5. Closing Line');
}

function sanitizeEnglishText(text) {
  const mappedTerms = Object.entries(ELEMENT_MAPPING)
    .filter(([key]) => /[\u3400-\u9FFF]/.test(key))
    .sort((a, b) => b[0].length - a[0].length);
  let output = String(text || '')
    .replace(/[，、]/g, ', ')
    .replace(/。/g, '. ')
    .replace(/：/g, ': ')
    .replace(/；/g, '; ')
    .replace(/[（）]/g, (value) => (value === '（' ? '(' : ')'))
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
  output = replaceTerms(output, ENGLISH_TERM_REPLACEMENTS);
  output = replaceTerms(output, mappedTerms);
  output = normalizeEnglishHeadings(output);
  output = output
    .replace(/[\u3400-\u9FFF]+/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
  return output;
}

async function requestAnalysis(prompt, options = {}) {
  const { systemPrompt = '你是精通子平八字、流年大运推演与结构化写作的命理分析师。', temperature = 0.65 } = options;
  if (!hasRemoteAiConfig()) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function containsChinese(text = '') {
  return /[\u3400-\u9FFF]/.test(String(text));
}

function buildEnglishTranslationPrompt(text) {
  return `
You are the Life Space-Time Code Translation Engine modeled after a DeepSeek-grade second-pass translator.

Translate the following content into polished, natural English.

Hard rules:
1. Do not leave any Chinese characters in the output.
2. Preserve the original structure, Markdown headings, paragraph rhythm, and tone.
3. Keep metaphysical terminology understandable for English readers.
4. Use these exact Markdown headings when they appear in the source:
   # 🌿 Life Space-Time Code Analysis
   ## 1. Holographic Time-Space Anchor
   ## 2. Personality Background & Potential
   ## 3. Career & Wealth
   ## 4. DaYun and LiuNian Action
   ## 5. Closing Line
5. If the source is poetic, preserve the poetic tone in English.
6. Return only the translated English Markdown.

Source:
${text}
  `.trim();
}

function buildEnglishTranslationRevisionPrompt(source, draft) {
  return `
You are performing a final DeepSeek-style cleanup pass for an English translation.

Hard rules:
1. Remove every remaining Chinese character.
2. Keep the Markdown structure complete.
3. Keep the meaning faithful to the source.
4. Use the exact report headings below if the text is a report:
   # 🌿 Life Space-Time Code Analysis
   ## 1. Holographic Time-Space Anchor
   ## 2. Personality Background & Potential
   ## 3. Career & Wealth
   ## 4. DaYun and LiuNian Action
   ## 5. Closing Line
5. Return only the corrected English Markdown.

Source:
${source}

Draft to repair:
${draft}
  `.trim();
}

function fallbackEnglishTranslation(text) {
  return sanitizeEnglishText(text);
}

export async function enforceEnglishTranslationGate(text) {
  if (!text) {
    return '';
  }
  if (!containsChinese(text)) {
    return sanitizeEnglishText(text);
  }

  try {
    const translated = sanitizeEnglishText(await requestAnalysis(buildEnglishTranslationPrompt(text), {
      systemPrompt: 'You are a precise English translator for metaphysical reports. You preserve structure, remove every Chinese character, and keep the final output natural, complete, and publication-ready.',
      temperature: 0.2
    }));
    if (translated && !containsChinese(translated)) {
      return translated;
    }
    const repaired = sanitizeEnglishText(await requestAnalysis(buildEnglishTranslationRevisionPrompt(text, translated), {
      systemPrompt: 'You are a strict English translation reviewer. Repair incomplete translations, preserve Markdown, and guarantee that no Chinese characters remain.',
      temperature: 0.1
    }));
    if (!repaired || containsChinese(repaired)) {
      throw new Error('Translation gate validation failed');
    }
    return repaired;
  } catch {
    return fallbackEnglishTranslation(text);
  }
}

export async function getBaZiAnalysis(userInfo, baziResult, namingResult) {
  const lang = getLang(userInfo);
  const context = buildAnalysisContext(userInfo, baziResult, namingResult);
  const prompt = buildPrompt(userInfo, baziResult, namingResult, lang, context, false);

  try {
    let content = await requestAnalysis(prompt);
    if (!validateAnalysisContent(content, lang)) {
      const retryPrompt = buildPrompt(userInfo, baziResult, namingResult, lang, context, true);
      content = await requestAnalysis(retryPrompt);
    }
    if (!validateAnalysisContent(content, lang)) {
      throw new Error('Analysis missing month-command validation');
    }
    return content;
  } catch (error) {
    console.warn('AI API call failed or validation did not pass. Using deterministic fallback.', error);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return generateFallbackResponse(userInfo, baziResult, namingResult, lang);
  }
}
