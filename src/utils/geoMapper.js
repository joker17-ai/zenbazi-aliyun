import { chinaRegions, worldRegions } from './constants.js';

export function mapChinaAddress(address, lang = 'zh-CN') {
  if (!address) return null;
  
  // Normalize address
  const addr = address.trim();
  
  // Iterate through regions to find a match
  for (const [key, region] of Object.entries(chinaRegions)) {
    // Check provinces
    for (const province of region.provinces) {
      if (addr.includes(province)) {
        return {
          key,
          data: region,
          matchedKeyword: province
        };
      }
    }
  }
  
  // Default fallback if no match (optional)
  return null;
}

export function mapWorldCountry(country, lang = 'zh-CN') {
  if (!country) return null;
  
  // Use new helper for comprehensive lookup (Global Five Elements Mapping)
  const regionInfo = getRegionElement(country);
  
  if (regionInfo) {
    return {
      key: regionInfo.key,
      data: {
        name: regionInfo.name,
        primaryElement: regionInfo.element,
        extremeWeight: 0.20, // Increased weight for global influence
        weight: 0.15
      },
      matchedKeyword: country
    };
  }
  
  // Fallback for unmapped but recognized regions (Legacy support)
  if (['Russia', 'Sweden', 'Norway', 'Finland', 'Iceland', 'Canada'].some(c => country.includes(c))) {
    return { key: 'northernEurope', data: worldRegions.northernEurope, matchedKeyword: country };
  }
  
  return null;
}

export function getRegionElement(country) {
  if (!country) return null;
  const c = country.trim().toLowerCase();

  // --- FIRE GROUP ---
  // Middle East / North Africa
  if (['libya', 'egypt', 'morocco', 'algeria', 'tunisia', 'saudi', 'uae', 'oman', 'yemen', 'qatar', 'kuwait', 'bahrain', 'jordan', 'lebanon', 'iraq', 'iran', 'syria', 'israel', 'turkey', 'sudan'].some(n => c.includes(n))) {
    return { key: 'fire_mena', name: '中东/北非', element: '火' };
  }
  // Sub-Saharan Africa
  if (['nigeria', 'kenya', 'ethiopia', 'south africa', 'congo', 'uganda', 'angola', 'ghana', 'zambia', 'zimbabwe'].some(n => c.includes(n))) {
    return { key: 'fire_africa', name: '非洲', element: '火' };
  }
  // Latin America
  if (['mexico', 'brazil', 'argentina', 'colombia', 'peru', 'venezuela', 'chile', 'ecuador'].some(n => c.includes(n))) {
    return { key: 'fire_latam', name: '拉丁美洲', element: '火' };
  }
  // Oceania
  if (['australia', 'new zealand'].some(n => c.includes(n))) {
    return { key: 'fire_oceania', name: '大洋洲', element: '火' };
  }

  // --- WATER GROUP ---
  // Northern Europe
  if (['sweden', 'norway', 'finland', 'denmark', 'iceland', 'estonia', 'latvia', 'lithuania'].some(n => c.includes(n))) {
    return { key: 'water_nordic', name: '北欧', element: '水' };
  }
  // Russia / Eastern Europe (Cold)
  if (['russia', 'belarus', 'ukraine', 'poland'].some(n => c.includes(n))) {
    return { key: 'water_russia', name: '俄罗斯/东欧', element: '水' };
  }
  // Canada / Polar
  if (['canada', 'alaska', 'greenland'].some(n => c.includes(n))) {
    return { key: 'water_polar', name: '加拿大/寒带', element: '水' };
  }

  // --- METAL GROUP ---
  // North America (USA)
  if (['usa', 'united states', 'america'].some(n => c.includes(n))) {
    return { key: 'metal_na', name: '北美', element: '金' };
  }
  // Western Europe
  if (['uk', 'britain', 'england', 'germany', 'france', 'italy', 'spain', 'netherlands', 'belgium', 'switzerland', 'austria', 'ireland', 'portugal', 'luxembourg', 'greece'].some(n => c.includes(n))) {
    return { key: 'metal_we', name: '西欧', element: '金' };
  }

  // --- WOOD GROUP ---
  // Southeast Asia
  if (['thailand', 'vietnam', 'malaysia', 'singapore', 'indonesia', 'philippines', 'cambodia', 'laos', 'myanmar'].some(n => c.includes(n))) {
    return { key: 'wood_sea', name: '东南亚', element: '木' };
  }
  // East Asia
  if (['japan', 'korea', 'taiwan', 'hong kong'].some(n => c.includes(n))) {
    return { key: 'wood_ea', name: '东亚', element: '木' };
  }

  // --- EARTH GROUP ---
  // Central / South Asia
  if (['india', 'pakistan', 'afghanistan', 'kazakhstan', 'uzbekistan', 'mongolia', 'nepal', 'sri lanka'].some(n => c.includes(n))) {
    return { key: 'earth_central', name: '中亚/南亚', element: '土' };
  }

  return null;
}

export function getWuXing(char) {
  // Simple mapping for Stems/Branches to Element
  const map = {
    '甲': '木', '乙': '木', '寅': '木', '卯': '木',
    '丙': '火', '丁': '火', '巳': '火', '午': '火',
    '戊': '土', '己': '土', '辰': '土', '戌': '土', '丑': '土', '未': '土',
    '庚': '金', '辛': '金', '申': '金', '酉': '金',
    '壬': '水', '癸': '水', '亥': '水', '子': '水'
  };
  return map[char];
}
