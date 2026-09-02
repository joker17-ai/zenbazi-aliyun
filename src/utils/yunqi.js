
import { Solar } from 'lunar-javascript';

// --- Authoritative Wu Yun Liu Qi Database ---

// 1. 中运 (Zhong Yun / Sui Yun) Database - Year Level
const ZHONG_YUN_DB = {
  '甲': { name: '土运太过', cn: '土运太过', en: 'Excessive Earth', element: 'Earth', organ: '脾胃', enOrgan: 'Spleen/Stomach',
          effect: '湿气偏胜，容易出现腹胀、体重、肌肉酸痛。脾土克肾水，需防肾水受邪（腰痛、耳鸣）。',
          enEffect: 'Excessive Dampness. Prone to bloating, heaviness, and muscle aches. Earth suppresses Water, watch for Kidney issues (lower back pain).' },
  '己': { name: '土运不及', cn: '土运不及', en: 'Deficient Earth', element: 'Earth', organ: '脾胃', enOrgan: 'Spleen/Stomach',
          effect: '脾土虚弱，肝木乘虚而入。易出现消化不良、腹泻，以及肝气郁结之症。',
          enEffect: 'Weak Spleen/Stomach. Wood overacts on Earth. Prone to indigestion, diarrhea, and Liver Qi stagnation.' },
  '庚': { name: '金运太过', cn: '金运太过', en: 'Excessive Metal', element: 'Metal', organ: '肺/大肠', enOrgan: 'Lungs/Large Intestine',
          effect: '燥气偏胜，易伤津液。表现为干咳、皮肤干燥。金克木，需防肝胆受邪，易怒或筋骨酸痛。',
          enEffect: 'Excessive Dryness. Prone to dry cough and dry skin. Metal suppresses Wood, watch for Liver/Gallbladder issues (irritability, joint pain).' },
  '乙': { name: '金运不及', cn: '金运不及', en: 'Deficient Metal', element: 'Metal', organ: '肺/大肠', enOrgan: 'Lungs/Large Intestine',
          effect: '肺气虚弱，抵抗力差。心火乘虚而克金，易出现咳嗽气喘、肩背酸痛、心火旺盛。',
          enEffect: 'Weak Lungs. Fire overacts on Metal. Prone to coughing, shortness of breath, and excessive Heart Fire.' },
  '壬': { name: '木运太过', cn: '木运太过', en: 'Excessive Wood', element: 'Wood', organ: '肝胆', enOrgan: 'Liver/Gallbladder',
          effect: '风气偏胜，肝气偏亢。易出现头晕、目眩、急躁易怒。木克土，脾胃易受邪，消化变差。',
          enEffect: 'Excessive Wind/Liver Qi. Prone to dizziness, irritability. Wood suppresses Earth, watch for Spleen/Stomach issues.' },
  '丁': { name: '木运不及', cn: '木运不及', en: 'Deficient Wood', element: 'Wood', organ: '肝胆', enOrgan: 'Liver/Gallbladder',
          effect: '肝气不足，筋骨无力，易疲劳。肺金乘虚克木，易感风寒，情绪容易抑郁。',
          enEffect: 'Weak Liver Qi. Prone to fatigue, weak tendons. Metal overacts on Wood, easy to catch cold, prone to depression.' },
  '戊': { name: '火运太过', cn: '火运太过', en: 'Excessive Fire', element: 'Fire', organ: '心/小肠', enOrgan: 'Heart/Small Intestine',
          effect: '热气偏胜，心火亢盛。易出现失眠、心悸、口腔溃疡。火克金，肺金受邪，易发热咳嗽。',
          enEffect: 'Excessive Heat/Heart Fire. Prone to insomnia, palpitations, ulcers. Fire suppresses Metal, watch for Lung issues (fever, cough).' },
  '癸': { name: '火运不及', cn: '火运不及', en: 'Deficient Fire', element: 'Fire', organ: '心/小肠', enOrgan: 'Heart/Small Intestine',
          effect: '心阳不足，手足易冷，气血运行不畅。肾水乘虚克火，易现寒湿之症、腰膝酸软。',
          enEffect: 'Weak Heart Yang. Prone to cold extremities, poor circulation. Water overacts on Fire, watch for cold-dampness and weak lower back.' },
  '丙': { name: '水运太过', cn: '水运太过', en: 'Excessive Water', element: 'Water', organ: '肾/膀胱', enOrgan: 'Kidneys/Bladder',
          effect: '寒气偏胜，肾水泛滥。易出现畏寒、水肿、关节冷痛。水克火，心阳受邪，易心神不宁。',
          enEffect: 'Excessive Cold/Water. Prone to aversion to cold, edema, joint pain. Water suppresses Fire, watch for Heart issues (restlessness).' },
  '辛': { name: '水运不及', cn: '水运不及', en: 'Deficient Water', element: 'Water', organ: '肾/膀胱', enOrgan: 'Kidneys/Bladder',
          effect: '肾水不足，阴虚火旺。易出现耳鸣、盗汗、腰膝酸软。脾土乘虚克水，湿气易滞留体内。',
          enEffect: 'Weak Kidneys (Yin deficiency). Prone to tinnitus, night sweats, weak lower back. Earth overacts on Water, prone to dampness retention.' }
};

// 2. 司天在泉 (Si Tian / Zai Quan) Database - Half-Year Level
const ZHI_YUNQI_DB = {
  '子': { siTian: '少阴君火', zaiQuan: '阳明燥金', stElement: 'Fire', zqElement: 'Metal', enSiTian: 'Shao Yin Jun Huo', enZaiQuan: 'Yang Ming Zao Jin',
          desc: '上半年气候偏于温热，容易引动心火；下半年气候偏于凉燥，需防肺气受损。',
          enDesc: 'First half: Warm/hot climate, affects Heart Fire. Second half: Cool/dry climate, affects Lungs.' },
  '午': { siTian: '少阴君火', zaiQuan: '阳明燥金', stElement: 'Fire', zqElement: 'Metal', enSiTian: 'Shao Yin Jun Huo', enZaiQuan: 'Yang Ming Zao Jin',
          desc: '上半年气候偏于温热，容易引动心火；下半年气候偏于凉燥，需防肺气受损。',
          enDesc: 'First half: Warm/hot climate, affects Heart Fire. Second half: Cool/dry climate, affects Lungs.' },
  '丑': { siTian: '太阴湿土', zaiQuan: '太阳寒水', stElement: 'Earth', zqElement: 'Water', enSiTian: 'Tai Yin Shi Tu', enZaiQuan: 'Tai Yang Han Shui',
          desc: '上半年雨水较多，湿气偏重，脾胃易困；下半年气候偏寒冷，需防寒邪伤肾与关节。',
          enDesc: 'First half: Rainy/damp, affects Spleen. Second half: Cold climate, affects Kidneys/joints.' },
  '未': { siTian: '太阴湿土', zaiQuan: '太阳寒水', stElement: 'Earth', zqElement: 'Water', enSiTian: 'Tai Yin Shi Tu', enZaiQuan: 'Tai Yang Han Shui',
          desc: '上半年雨水较多，湿气偏重，脾胃易困；下半年气候偏寒冷，需防寒邪伤肾与关节。',
          enDesc: 'First half: Rainy/damp, affects Spleen. Second half: Cold climate, affects Kidneys/joints.' },
  '寅': { siTian: '少阳相火', zaiQuan: '厥阴风木', stElement: 'Fire', zqElement: 'Wood', enSiTian: 'Shao Yang Xiang Huo', enZaiQuan: 'Jue Yin Feng Mu',
          desc: '上半年暑热当令，气温偏高，易心烦气躁；下半年多风，肝胆易受扰，情绪多变。',
          enDesc: 'First half: Hot/summer heat, causes restlessness. Second half: Windy, affects Liver/emotions.' },
  '申': { siTian: '少阳相火', zaiQuan: '厥阴风木', stElement: 'Fire', zqElement: 'Wood', enSiTian: 'Shao Yang Xiang Huo', enZaiQuan: 'Jue Yin Feng Mu',
          desc: '上半年暑热当令，气温偏高，易心烦气躁；下半年多风，肝胆易受扰，情绪多变。',
          enDesc: 'First half: Hot/summer heat, causes restlessness. Second half: Windy, affects Liver/emotions.' },
  '卯': { siTian: '阳明燥金', zaiQuan: '少阴君火', stElement: 'Metal', zqElement: 'Fire', enSiTian: 'Yang Ming Zao Jin', enZaiQuan: 'Shao Yin Jun Huo',
          desc: '上半年气候偏干旱少雨，燥气易伤肺津；下半年气候反常偏暖，易生内热与心火。',
          enDesc: 'First half: Dry/arid, injures Lung fluids. Second half: Unseasonably warm, causes inner heat.' },
  '酉': { siTian: '阳明燥金', zaiQuan: '少阴君火', stElement: 'Metal', zqElement: 'Fire', enSiTian: 'Yang Ming Zao Jin', enZaiQuan: 'Shao Yin Jun Huo',
          desc: '上半年气候偏干旱少雨，燥气易伤肺津；下半年气候反常偏暖，易生内热与心火。',
          enDesc: 'First half: Dry/arid, injures Lung fluids. Second half: Unseasonably warm, causes inner heat.' },
  '辰': { siTian: '太阳寒水', zaiQuan: '太阴湿土', stElement: 'Water', zqElement: 'Earth', enSiTian: 'Tai Yang Han Shui', enZaiQuan: 'Tai Yin Shi Tu',
          desc: '上半年气候偏于寒冷，需注意防寒保暖护阳；下半年湿气较重，易感身体沉重与消化不畅。',
          enDesc: 'First half: Cold climate, protect Yang energy. Second half: Dampness, causes heavy body/poor digestion.' },
  '戌': { siTian: '太阳寒水', zaiQuan: '太阴湿土', stElement: 'Water', zqElement: 'Earth', enSiTian: 'Tai Yang Han Shui', enZaiQuan: 'Tai Yin Shi Tu',
          desc: '上半年气候偏于寒冷，需注意防寒保暖护阳；下半年湿气较重，易感身体沉重与消化不畅。',
          enDesc: 'First half: Cold climate, protect Yang energy. Second half: Dampness, causes heavy body/poor digestion.' },
  '巳': { siTian: '厥阴风木', zaiQuan: '少阳相火', stElement: 'Wood', zqElement: 'Fire', enSiTian: 'Jue Yin Feng Mu', enZaiQuan: 'Shao Yang Xiang Huo',
          desc: '上半年多风善变，易引发头晕及肝气不舒；下半年气温偏高，暑热易耗气伤津。',
          enDesc: 'First half: Windy/changeable, causes dizziness/Liver issues. Second half: Hot, depletes energy/fluids.' },
  '亥': { siTian: '厥阴风木', zaiQuan: '少阳相火', stElement: 'Wood', zqElement: 'Fire', enSiTian: 'Jue Yin Feng Mu', enZaiQuan: 'Shao Yang Xiang Huo',
          desc: '上半年多风善变，易引发头晕及肝气不舒；下半年气温偏高，暑热易耗气伤津。',
          enDesc: 'First half: Windy/changeable, causes dizziness/Liver issues. Second half: Hot, depletes energy/fluids.' }
};

// 3. 客气六步 (6 Steps of Guest Qi)
const SIX_QI_ORDER = [
  { cn: '厥阴风木', en: 'Jue Yin Feng Mu', element: 'Wood', symptom: '风邪偏盛，注意肝胆及神经系统。', enSymptom: 'Wind prevails, protect Liver and nervous system.' },
  { cn: '少阴君火', en: 'Shao Yin Jun Huo', element: 'Fire', symptom: '热邪初盛，注意心血管及情绪波动。', enSymptom: 'Heat begins, protect Heart and manage emotions.' },
  { cn: '太阴湿土', en: 'Tai Yin Shi Tu', element: 'Earth', symptom: '湿气偏重，注意脾胃运化及关节沉重。', enSymptom: 'Dampness prevails, protect Spleen/Stomach and joints.' },
  { cn: '少阳相火', en: 'Shao Yang Xiang Huo', element: 'Fire', symptom: '暑热当令，注意防暑降温、心神烦躁。', enSymptom: 'Summer heat prevails, prevent heatstroke and restlessness.' },
  { cn: '阳明燥金', en: 'Yang Ming Zao Jin', element: 'Metal', symptom: '秋燥伤人，注意润肺生津、皮肤保养。', enSymptom: 'Dryness prevails, moisten Lungs and skin.' },
  { cn: '太阳寒水', en: 'Tai Yang Han Shui', element: 'Water', symptom: '寒邪凝滞，注意保暖、护肾及骨关节。', enSymptom: 'Cold prevails, keep warm, protect Kidneys and joints.' }
];

const QI_STEPS = [
  { startTerm: '大寒', cn: '初之气 (大寒-春分)', en: 'Step 1 (Da Han - Chun Fen)' },
  { startTerm: '春分', cn: '二之气 (春分-小满)', en: 'Step 2 (Chun Fen - Xiao Man)' },
  { startTerm: '小满', cn: '三之气 (小满-大暑)', en: 'Step 3 (Xiao Man - Da Shu)' },
  { startTerm: '大暑', cn: '四之气 (大暑-秋分)', en: 'Step 4 (Da Shu - Qiu Fen)' },
  { startTerm: '秋分', cn: '五之气 (秋分-小雪)', en: 'Step 5 (Qiu Fen - Xiao Xue)' },
  { startTerm: '小雪', cn: '终之气 (小雪-大寒)', en: 'Step 6 (Xiao Xue - Da Han)' }
];

export function calculateYunqi(date, lang = 'zh-CN') {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  
  const yearGanZhi = lunar.getYearInGanZhi();
  const yearGan = yearGanZhi.substring(0, 1);
  const yearZhi = yearGanZhi.substring(1, 2);
  
  // Layer 1: Year (Zhong Yun)
  const zhongYun = ZHONG_YUN_DB[yearGan];
  
  // Layer 2: Half-Year (Si Tian / Zai Quan)
  const halfYear = ZHI_YUNQI_DB[yearZhi];
  
  // Find current step
  const month = date.getMonth() + 1;
  const day = date.getDate();
  let stepIndex = 0;
  if ((month === 1 && day >= 20) || month === 2 || (month === 3 && day < 20)) stepIndex = 0;
  else if ((month === 3 && day >= 20) || month === 4 || (month === 5 && day < 21)) stepIndex = 1;
  else if ((month === 5 && day >= 21) || month === 6 || (month === 7 && day < 23)) stepIndex = 2;
  else if ((month === 7 && day >= 23) || month === 8 || (month === 9 && day < 23)) stepIndex = 3;
  else if ((month === 9 && day >= 23) || month === 10 || (month === 11 && day < 22)) stepIndex = 4;
  else stepIndex = 5;

  // Layer 3: Month Step (Ke Qi)
  const siTianIndex = SIX_QI_ORDER.findIndex(q => q.cn === halfYear.siTian);
  let guestQiIndex = (siTianIndex + (stepIndex - 2)) % 6;
  if (guestQiIndex < 0) guestQiIndex += 6;
  const guestQi = SIX_QI_ORDER[guestQiIndex];
  const stepInfo = QI_STEPS[stepIndex];

  // Combine into robust 4-layer object
  return {
    yearGanZhi,
    layer1: {
      title: lang === 'en' ? '1. Year (Zhong Yun)' : '1. 定岁运',
      name: lang === 'en' ? zhongYun.en : zhongYun.cn,
      organ: lang === 'en' ? zhongYun.enOrgan : zhongYun.organ,
      effect: lang === 'en' ? zhongYun.enEffect : zhongYun.effect
    },
    layer2: {
      title: lang === 'en' ? '2. Half-Year' : '2. 找司天在泉',
      siTian: lang === 'en' ? halfYear.enSiTian : halfYear.siTian,
      zaiQuan: lang === 'en' ? halfYear.enZaiQuan : halfYear.zaiQuan,
      desc: lang === 'en' 
        ? `${halfYear.enDesc}`
        : `上半年【${halfYear.siTian}】主事，下半年【${halfYear.zaiQuan}】主事。${halfYear.desc}`
    },
    layer3: {
      title: lang === 'en' ? '3. Current Step' : '3. 拆客气六步',
      step: lang === 'en' ? stepInfo.en : stepInfo.cn,
      guestQi: lang === 'en' ? guestQi.en : guestQi.cn,
      symptom: lang === 'en' ? guestQi.enSymptom : guestQi.symptom
    },
    layer4: {
      title: lang === 'en' ? '4. Body & Health' : '4. 对应脏腑与病症',
      advice: lang === 'en' 
        ? `Core Vulnerability: ${zhongYun.enOrgan}. Current Environment: ${guestQi.enSymptom} Action: Guard against ${guestQi.element} extremes.`
        : `【先天脏腑底色】：${zhongYun.organ}。\n【当月外邪冲击】：${guestQi.symptom}\n【精准调理】：防范${zhongYun.organ}受邪，顺应本月${guestQi.cn}的特点进行调理。`
    }
  };
}
