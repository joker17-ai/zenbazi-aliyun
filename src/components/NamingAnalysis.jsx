import { translations } from '../utils/translations';

const ELEMENT_EN_MAP = {
  '木': 'Wood',
  '火': 'Fire',
  '土': 'Earth',
  '金': 'Metal',
  '水': 'Water'
};

const LUCK_EN_MAP = {
  '吉': 'Auspicious',
  '凶': 'Inauspicious'
};

const SAN_CAI_EN_MAP = {
  '大吉': 'Excellent Configuration',
  '中吉': 'Good Configuration',
  '凶多吉少': 'Average / Mixed Configuration'
};

export default function NamingAnalysis({ result, lang }) {
  if (!result) return null;
  const t = translations[lang] || translations['zh-CN'];
  const normalizeElement = (value) => lang === 'en' ? (ELEMENT_EN_MAP[value] || value) : value;
  const normalizeLuck = (value) => lang === 'en' ? (LUCK_EN_MAP[value] || value) : value;
  const sanCaiDescription = lang === 'en'
    ? (SAN_CAI_EN_MAP[result.sanCai?.relation?.description] || result.sanCai?.relation?.description)
    : result.sanCai?.relation?.description;
  
  return (
    <div className="bg-[#F5F0E6] p-6 rounded-xl border border-[#2C2C2C]/10 shadow-sm mt-6">
      
      <h2 className="text-xl font-bold text-[#B22222] font-serif border-b border-[#B22222]/20 pb-2 mb-4">
        {t.fiveGe}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Five Ge */}
        <div>
          <div className="space-y-2 text-sm">
            {Object.entries(result.wuGe).map(([key, val]) => {
              const gridNames = {
                tian: { zh: '天格', en: 'Heavenly Grid' },
                ren: { zh: '人格', en: 'Personality Grid' },
                di: { zh: '地格', en: 'Earthly Grid' },
                wai: { zh: '外格', en: 'Outer Grid' },
                zong: { zh: '总格', en: 'Total Grid' }
              };
              const displayName = gridNames[key] 
                ? (lang === 'en' ? gridNames[key].en : gridNames[key].zh) 
                : key;

              return (
                <div key={key} className="flex justify-between items-center border-b border-[#2C2C2C]/5 pb-1">
                  <span className="opacity-70 font-medium">{displayName}</span>
                  <div className="flex gap-2">
                    <span className="font-mono font-bold">{val.num}</span>
                    <span className={`px-1.5 rounded text-xs ${normalizeElement(val.element) === 'Fire' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>
                      {normalizeElement(val.element)}
                    </span>
                    <span className={`font-bold ${normalizeLuck(val.luck) === 'Auspicious' ? 'text-green-600' : 'text-red-500'}`}>
                      {normalizeLuck(val.luck)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* San Cai */}
        <div>
          <h3 className="text-sm font-bold text-[#2C2C2C]/60 uppercase tracking-wider mb-3">{t.sanCai}</h3>
          <div className="bg-white/50 p-4 rounded-lg border border-[#2C2C2C]/5 text-center">
            <div className="text-2xl font-bold text-[#2C2C2C] mb-2">{result.sanCai.config}</div>
            <div className="text-sm opacity-80 mb-2">{sanCaiDescription}</div>
            <div className="text-xs opacity-50">Score: {result.sanCai.relation.score}</div>
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-sm opacity-60 mr-2">{t.totalScore}:</span>
            <span className="text-3xl font-bold text-[#B22222]">{result.totalScore}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
