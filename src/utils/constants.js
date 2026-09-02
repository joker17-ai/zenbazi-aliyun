/**
 * 命理学地理与环境五行映射常量数据
 */

// 1. 中国九州地理五行映射 (基于后天八卦与传统分野)
export const chinaRegions = {
  // 东方震巽：木旺
  east: {
    name: "华东/青州",
    provinces: ["山东", "江苏", "安徽", "浙江", "上海", "福建"],
    primaryElement: "木",
    weight: 0.8,
    description: "东方木旺，生发之气"
  },
  // 南方离：火旺
  south: {
    name: "华南/扬州",
    provinces: ["广东", "广西", "海南", "香港", "澳门", "台湾", "福建南部"],
    primaryElement: "火",
    weight: 0.8,
    description: "南方火旺，炎上之气"
  },
  // 西方兑：金旺
  west: {
    name: "西北/雍州/凉州",
    provinces: ["陕西", "甘肃", "宁夏", "青海", "新疆"],
    primaryElement: "金",
    weight: 0.8, // 干燥高寒，金气敛降
    description: "西方金旺，肃杀之气"
  },
  // 北方坎：水旺
  north: {
    name: "华北/幽州/冀州",
    provinces: ["北京", "天津", "河北", "山西", "内蒙古", "黑龙江", "吉林", "辽宁"],
    primaryElement: "水",
    weight: 0.8, // 寒冷多水，水气润下
    description: "北方水旺，寒凝之气"
  },
  // 中央坤艮/中原：土旺
  central: {
    name: "中原/豫州",
    provinces: ["河南", "湖北", "湖南", "江西"], // 广义中原泛指中部
    primaryElement: "土",
    weight: 0.8,
    description: "中央土旺，承载之气"
  },
  // 西南：土金交杂
  southwest: {
    name: "西南/益州",
    provinces: ["四川", "重庆", "贵州", "云南", "西藏"],
    primaryElement: "土",
    secondaryElement: "木", // 植被茂密
    weight: 0.6,
    description: "西南高地，土生万物"
  }
};

// 2. 全球大区五行映射 (基于气候特征与地理位置)
export const worldRegions = {
  northernEurope: {
    name: "北欧/俄罗斯",
    climate: "极寒、漫长冬季",
    primaryElement: "水",
    extremeWeight: 1.2, // 极端气候权重放大
    description: "极北之地，水气极旺，阴寒之极"
  },
  middleEast: {
    name: "中东/北非",
    climate: "干旱、沙漠、炎热",
    primaryElement: "火",
    secondaryElement: "燥土",
    extremeWeight: 1.2,
    description: "干旱沙漠，火土焦炎"
  },
  southeastAsia: {
    name: "东南亚/南亚",
    climate: "热带雨林、湿热",
    primaryElement: "木",
    secondaryElement: "火",
    extremeWeight: 1.0,
    description: "湿热雨林，木火交辉"
  },
  northAmerica: {
    name: "北美(中东部)",
    climate: "温带大陆性",
    primaryElement: "金", // 广袤平原与工业属性
    extremeWeight: 0.8,
    description: "大陆平原，金水相生"
  },
  australia: {
    name: "澳洲",
    climate: "四周环海，内陆干旱",
    primaryElement: "火", // 南半球，火土旺
    extremeWeight: 1.0,
    description: "南半球大陆，火炎土燥"
  },
  southAmerica: {
    name: "南美洲",
    climate: "热带雨林、草原",
    primaryElement: "木",
    secondaryElement: "土",
    extremeWeight: 1.1,
    description: "极木与湿土交织，生机盎然"
  },
  easternEurope: {
    name: "东欧/西伯利亚",
    climate: "极寒、大陆性",
    primaryElement: "水",
    secondaryElement: "金",
    extremeWeight: 1.2,
    description: "金寒水冷，阴气极重"
  },
  centralAsia: {
    name: "中亚",
    climate: "干旱、荒漠",
    primaryElement: "土",
    secondaryElement: "金",
    extremeWeight: 1.1,
    description: "燥土与矿产之地，土金相生"
  },
  africa: {
    name: "非洲",
    climate: "炎热、沙漠与草原",
    primaryElement: "火",
    secondaryElement: "土",
    extremeWeight: 1.2,
    description: "极火焦土，炎炎烈日"
  }
};

// 3. 出生微观环境五行映射 (影响出生那一刻的五行气场)
export const birthEnvironments = {
  home: {
    name: "家庭/家中",
    primaryElement: "木", // 木主生发、庇护
    secondaryElement: "土", // 土主安稳、承载
    description: "稳固、生机、印星加持，提供天然的庇护与安全感。"
  },
  hospitalModern: {
    name: "现代医院/手术室",
    primaryElement: "金",
    description: "金属器械、消毒水、冷色调，金气极旺，肃杀气重。"
  },
  waterSide: {
    name: "河道边/船上/水乡",
    primaryElement: "水",
    description: "水气氤氲，波光流动，水性润下且多变。"
  },
  vehicle: {
    name: "行车上/交通工具",
    primaryElement: "火", // 引擎、动力
    secondaryElement: "金", // 钢铁外壳
    description: "引擎轰鸣，金属外壳，动荡不居，火金交战。"
  },
  mountainForest: {
    name: "山区/森林/乡村老屋",
    primaryElement: "木",
    secondaryElement: "土",
    description: "草木繁盛，土地厚实，生机勃勃，木土之气淳厚。"
  },
  underground: {
    name: "地下室/防空洞",
    primaryElement: "土",
    secondaryElement: "水", // 阴暗潮湿
    description: "不见天日，阴冷潮湿，土气沉滞，水气阴寒。"
  }
};

// 4. 五行生克计算系数 (用于后期量化分析)
// 以日干（日主）为中心，计算地理/环境五行对日主的影响
export const calculationRules = {
  coefficients: {
    support: 0.2,    // 生扶日干 (如木生火，环境为木，日干为火) -> +0.2
    same: 0.15,      // 同类比劫 (如火见火) -> +0.15
    restrict: -0.15, // 克制日干 (如水克火，环境为水，日干为火) -> -0.15
    exhaust: -0.1,   // 日干泄气 (如火生土，环境为土，日干为火) -> -0.1
    consume: -0.05   // 日干耗气 (如火克金，环境为金，日干为火) -> -0.05
  },
  
  // 辅助函数：判断元素1对元素2的作用关系
  // elements: 金, 木, 水, 火, 土
  getRelation: (envElement, dayMasterElement) => {
    const sheng = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
    const ke = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };

    if (envElement === dayMasterElement) return 'same';
    if (sheng[envElement] === dayMasterElement) return 'support';
    if (ke[envElement] === dayMasterElement) return 'restrict';
    if (sheng[dayMasterElement] === envElement) return 'exhaust';
    if (ke[dayMasterElement] === envElement) return 'consume';
    
    return 'none';
  }
};

// 5. 天干地支五行全量映射表
export const BAZI_MAPPING = {
  // 天干 (Heavenly Stems)
  stems: {
    '甲': { en: 'Jia', element: 'Wood', polarity: 'Yang' },
    '乙': { en: 'Yi', element: 'Wood', polarity: 'Yin' },
    '丙': { en: 'Bing', element: 'Fire', polarity: 'Yang' },
    '丁': { en: 'Ding', element: 'Fire', polarity: 'Yin' },
    '戊': { en: 'Wu', element: 'Earth', polarity: 'Yang' },
    '己': { en: 'Ji', element: 'Earth', polarity: 'Yin' },
    '庚': { en: 'Geng', element: 'Metal', polarity: 'Yang' },
    '辛': { en: 'Xin', element: 'Metal', polarity: 'Yin' },
    '壬': { en: 'Ren', element: 'Water', polarity: 'Yang' },
    '癸': { en: 'Gui', element: 'Water', polarity: 'Yin' }
  },
  // 地支 (Earthly Branches)
  branches: {
    '子': { en: 'Zi', animal: 'Rat', element: 'Water' },
    '丑': { en: 'Chou', animal: 'Ox', element: 'Earth' },
    '寅': { en: 'Yin', animal: 'Tiger', element: 'Wood' },
    '卯': { en: 'Mao', animal: 'Rabbit', element: 'Wood' },
    '辰': { en: 'Chen', animal: 'Dragon', element: 'Earth' },
    '巳': { en: 'Si', animal: 'Snake', element: 'Fire' },
    '午': { en: 'Wu', animal: 'Horse', element: 'Fire' },
    '未': { en: 'Wei', animal: 'Goat', element: 'Earth' },
    '申': { en: 'Shen', animal: 'Monkey', element: 'Metal' },
    '酉': { en: 'You', animal: 'Rooster', element: 'Metal' },
    '戌': { en: 'Xu', animal: 'Dog', element: 'Earth' },
    '亥': { en: 'Hai', animal: 'Pig', element: 'Water' }
  },
  // 旺衰状态 (Energy Ratings)
  ratings: {
    '极弱': 'Extremely Weak',
    '偏弱': 'Weak',
    '中和': 'Balanced',
    '偏旺': 'Strong',
    '极旺': 'Extremely Strong'
  },
  // Relationships (Preserved for compatibility)
  relations: {
    'support': 'Support',
    'same': 'Reinforce',
    'restrict': 'Restrict',
    'exhaust': 'Exhaust',
    'consume': 'Consume'
  },
  // Five Elements (Preserved for compatibility)
  elements: {
    '木': 'Wood',
    '火': 'Fire',
    '土': 'Earth',
    '金': 'Metal',
    '水': 'Water'
  }
};
