import cnchar from 'cnchar';
import { getWuXing } from './geoMapper.js';
import { calculationRules } from './constants.js';

function getElement(num, isEnglish = false) {
  const lastDigit = num % 10;
  // 1,2 -> Wood; 3,4 -> Fire; 5,6 -> Earth; 7,8 -> Metal; 9,0 -> Water
  if (lastDigit === 1 || lastDigit === 2) return isEnglish ? 'Wood' : '木';
  if (lastDigit === 3 || lastDigit === 4) return isEnglish ? 'Fire' : '火';
  if (lastDigit === 5 || lastDigit === 6) return isEnglish ? 'Earth' : '土';
  if (lastDigit === 7 || lastDigit === 8) return isEnglish ? 'Metal' : '金';
  return isEnglish ? 'Water' : '水';
}

function getLuck(num, isEnglish = false) {
  // Simple luck logic based on 81 strokes
  const good = [1, 3, 5, 6, 7, 8, 11, 13, 15, 16, 17, 18, 21, 23, 24, 25, 29, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 57, 61, 63, 65, 67, 68, 81];
  const bad = [2, 4, 9, 10, 12, 14, 19, 20, 22, 26, 27, 28, 30, 34, 36, 40, 42, 43, 44, 46, 49, 50, 51, 53, 54, 55, 56, 58, 59, 60, 62, 64, 66, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80];
  
  const isGood = good.includes(num);
  const label = isEnglish ? (isGood ? 'Auspicious' : 'Inauspicious') : (isGood ? '吉' : '凶');
  
  return { luck: label, score: isGood ? 15 : 10 };
}

function analyzeSanCai(tian, ren, di, isEnglish = false) {
  // Simplified San Cai logic: Element interactions
  // Convert to CN for logic check if English
  const map = { 'Wood': '木', 'Fire': '火', 'Earth': '土', 'Metal': '金', 'Water': '水' };
  const t = isEnglish ? map[tian] : tian;
  const r = isEnglish ? map[ren] : ren;
  const d = isEnglish ? map[di] : di;
  
  const tr = calculationRules.getRelation(t, r); // Heaven -> Human
  const rd = calculationRules.getRelation(r, d); // Human -> Earth
  
  let score = 90;
  if (tr === 'support' || tr === 'same') score += 15;
  if (rd === 'support' || rd === 'same') score += 15;
  if (tr === 'restrict' || tr === 'consume') score -= 10;
  if (rd === 'restrict' || rd === 'consume') score -= 10;
  
  const desc = isEnglish 
    ? (score > 95 ? 'Excellent Configuration' : (score > 80 ? 'Good Configuration' : 'Average/Mixed Configuration'))
    : (score > 95 ? '大吉' : (score > 80 ? '中吉' : '吉多凶少'));
    
  return { score, description: desc };
}

export function analyzeNameUnified({ surname, givenName, surnameStrokes, givenNameStrokes, dayMasterElement, language }) {
  const isEnglish = language === 'en';
  
  // Calculate Wu Ge
  // Assuming simplified calculation:
  // Tian: Surname + 1 (if single char)
  // Ren: Surname + First char of Given Name
  // Di: Given Name
  // Wai: Total - Ren
  // Zong: Total
  
  // This is a very rough approximation. Real logic is complex.
  // Using user inputs directly for now.
  const sLen = surname ? surname.length : 0;
  const gLen = givenName ? givenName.length : 0;
  
  // Strokes calculation
  // Use cnchar if not provided
  let sStrokes = surnameStrokes;
  let gStrokes = givenNameStrokes;
  
  if (!sStrokes && surname && !isEnglish) {
    sStrokes = cnchar.stroke(surname);
  }
  if (!gStrokes && givenName && !isEnglish) {
    gStrokes = cnchar.stroke(givenName);
  }
  
  // For English names, map A=1...Z=26
  if (isEnglish) {
     const calcEn = (str) => {
       if (!str) return 0;
       return str.toUpperCase().split('').reduce((acc, char) => acc + (char.charCodeAt(0) - 64), 0);
     };
     sStrokes = calcEn(surname);
     gStrokes = calcEn(givenName);
  }
  
  const tianNum = sStrokes + 1; // Simplified
  const renNum = sStrokes + (gLen > 0 ? Math.floor(gStrokes / (gLen || 1)) : 0); // Simplified
  const diNum = gStrokes + 1; // Simplified
  const zongNum = sStrokes + gStrokes;
  const waiNum = zongNum - renNum + 1; // Simplified
  
  const wuGe = {
    tian: { num: tianNum, element: getElement(tianNum, isEnglish), ...getLuck(tianNum, isEnglish) },
    ren: { num: renNum, element: getElement(renNum, isEnglish), ...getLuck(renNum, isEnglish) },
    di: { num: diNum, element: getElement(diNum, isEnglish), ...getLuck(diNum, isEnglish) },
    wai: { num: waiNum, element: getElement(waiNum, isEnglish), ...getLuck(waiNum, isEnglish) },
    zong: { num: zongNum, element: getElement(zongNum, isEnglish), ...getLuck(zongNum, isEnglish) }
  };
  
  // English San Cai (Just use the elements derived)
  // Logic is same as Chinese for element interactions
  const sanCai = {
    config: `${wuGe.tian.element}-${wuGe.ren.element}-${wuGe.di.element}`,
    relation: analyzeSanCai(wuGe.tian.element, wuGe.ren.element, wuGe.di.element, isEnglish)
  };

  // Match with Day Master
  // Convert English element back to Chinese for calculation rules
  const enToCn = { 'Wood': '木', 'Fire': '火', 'Earth': '土', 'Metal': '金', 'Water': '水' };
  const renElementCn = isEnglish ? (enToCn[wuGe.ren.element] || wuGe.ren.element) : wuGe.ren.element;
  
  const matchRelation = calculationRules.getRelation(renElementCn, dayMasterElement);
  const matchScoreMap = {
    'same': 95,    
    'restrict': 75, 
    'exhaust': 85,  
    'consume': 80,
    'support': 100
  };
  const matchScore = matchScoreMap[matchRelation] || 85;
  
  const wugeAvg = Math.floor((wuGe.tian.score + wuGe.ren.score + wuGe.di.score + wuGe.wai.score + wuGe.zong.score) / 5);
  
  const rawTotal = Math.floor((wuGe.zong.score + sanCai.relation.score + matchScore + wugeAvg) / 4);
  
  const totalScore = Math.min(100, Math.floor(rawTotal * 1.25));
  
  return {
    wuGe,
    sanCai,
    totalScore,
    overallScore: totalScore
  };
}
