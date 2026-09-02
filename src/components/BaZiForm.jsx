import { useState, useRef, useMemo } from 'react';
import { translations, translateToTW } from '../utils/translations';
import { birthEnvironments, BAZI_MAPPING } from '../utils/constants';
import { Solar, Lunar } from 'lunar-javascript';
import AgreementModal from './AgreementModal';

export default function BaZiForm({ onSubmit, lang, setLang }) {
  const t = translations[lang] || translations['zh-CN'];
  const getSolarMonthLabel = (monthNumber) => {
    const labels = t.solarMonthShort || t.monthShort;
    if (Array.isArray(labels) && labels[monthNumber - 1]) {
      return labels[monthNumber - 1];
    }
    return lang === 'en' ? `${t.month} ${monthNumber}` : `${monthNumber}${t.month}`;
  };
  const getLunarMonthLabel = (monthNumber, isLeapMonth = false) => {
    const labels = t.lunarMonthNames;
    const baseLabel = Array.isArray(labels) && labels[monthNumber - 1]
      ? labels[monthNumber - 1]
      : (lang === 'en' ? `${monthNumber}${t.month}` : `${monthNumber}${t.month}`);
    return isLeapMonth ? `${t.leap} ${baseLabel}` : baseLabel;
  };
  const getGanZhiRomanization = (ganZhi) => {
    const stem = ganZhi?.[0];
    const branch = ganZhi?.[1];
    const stemInfo = BAZI_MAPPING.stems[stem];
    const branchInfo = BAZI_MAPPING.branches[branch];

    if (!stemInfo || !branchInfo) {
      return ganZhi || '';
    }

    return `${stemInfo.en}${branchInfo.en.toLowerCase()}`;
  };
  const formatEnglishLunarYear = (ganZhi) => {
    const branch = ganZhi?.[1];
    const branchInfo = BAZI_MAPPING.branches[branch];
    const romanizedYear = getGanZhiRomanization(ganZhi);

    if (!romanizedYear || !branchInfo) {
      return ganZhi || '';
    }

    return `${romanizedYear} Year (${branchInfo.animal})`;
  };
  const formatLunarYearOption = (year) => {
    const tempLunar = Lunar.fromYmd(year, 1, 1);
    const ganZhi = tempLunar.getYearInGanZhi();

    if (lang === 'en') {
      return `${year}: ${formatEnglishLunarYear(ganZhi)}`;
    }

    return `${year}${ganZhi}${t.yearSuffix}`;
  };
  
  // 简繁转换辅助函数
  const text = (str) => lang === 'zh-TW' ? translateToTW(str) : str;
  
  const [isAgreed, setIsAgreed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 1. 唯一事实源：核心日期
  const [coreDate, setCoreDate] = useState(() => {
    const today = new Date();
    // 抹平时间，只保留日期部分作为核心状态的初始值，避免时区带来的干扰
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });
  
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    birthTime: '12:00',
    isOverseas: false,
    chinaAddress: '',
    worldCountry: '',
    birthEnv: 'home',
    fatherBirthYear: '',
    motherBirthYear: '',
    surname: '',
    givenName: '',
    surnameStrokes: '',
    givenNameStrokes: ''
  });

  // 2. 哨兵锁：防止镜像同步死循环
  const isSyncing = useRef(false);

  // 3. 衍生计算：农历显示视图（不存 State，随 coreDate 实时变动）
  const lunarView = useMemo(() => {
    // 强制使用中午 12 点来获取农历，确保跨时区或边界时间的稳定性
    // 加上安全判断，防止 coreDate 未初始化导致白屏
    if (!coreDate || isNaN(coreDate.getTime())) {
      return Lunar.fromDate(new Date());
    }
    const safeDate = new Date(coreDate.getFullYear(), coreDate.getMonth(), coreDate.getDate(), 12, 0, 0);
    return Lunar.fromDate(safeDate);
  }, [coreDate]);

  // 提取当前农历的数值，作为 Select 的 value
  const currentLunarYear = lunarView.getYear();
  const currentLunarMonth = Math.abs(lunarView.getMonth());
  const currentLunarDay = lunarView.getDay();
  const isCurrentlyLeap = lunarView.getMonth() < 0;

  // 生成农历年份选项 (前后100年)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 200 }, (_, i) => currentYear - 100 + i);

  // 4. 处理函数：公历 -> 全局
  const handleSolarChange = (e) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    
    const { name, value } = e.target;
    const parsedValue = Number(value);
    
    let targetY = coreDate ? coreDate.getFullYear() : new Date().getFullYear();
    let targetM = coreDate ? coreDate.getMonth() : new Date().getMonth(); // 0-11
    let targetD = coreDate ? coreDate.getDate() : new Date().getDate();
    
    if (name === 'solarYear') targetY = parsedValue;
    if (name === 'solarMonth') targetM = parsedValue - 1;
    if (name === 'solarDay') targetD = parsedValue;
    
    // JS Date handles overflow automatically (e.g. Feb 30 -> Mar 2), 
    // but to be perfectly safe and mirror-like, we can constrain it
    const daysInMonth = new Date(targetY, targetM + 1, 0).getDate();
    if (targetD > daysInMonth) {
      targetD = daysInMonth;
    }
    
    const newDate = new Date(targetY, targetM, targetD);
    setCoreDate(newDate);
    
    setTimeout(() => { isSyncing.current = false; }, 50);
  };

  // 通用表单变更 (非日期类)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };
  // 5. 处理函数：农历 -> 全局 (核心：纯数字输入)
  const handleLunarChange = (e) => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    const { name, value, type, checked } = e.target;
    const parsedValue = type === 'checkbox' ? checked : Number(value);
    
    if (type !== 'checkbox' && isNaN(parsedValue)) {
      isSyncing.current = false;
      return;
    }

    // 组合将要计算的农历参数
    let targetY = Number(currentLunarYear);
    let targetM = Number(currentLunarMonth);
    let targetD = Number(currentLunarDay);
    let targetLeap = isCurrentlyLeap;

    if (name === 'year') targetY = parsedValue;
    if (name === 'month') targetM = parsedValue;
    if (name === 'day') targetD = parsedValue;
    if (name === 'isLeap') targetLeap = parsedValue;

    try {
      // 核心：用数字进行物理计算
      // 处理闰月逻辑（传递负数月份）
      const lunarMonthNum = targetLeap ? -targetM : targetM;
      
      let lunar;
      try {
        lunar = Lunar.fromYmd(targetY, lunarMonthNum, targetD);
      } catch (err) {
        // 兼容农历小月（29天）的溢出：当目标月只有29天但当前选中30日时，退回29日
        if (targetD === 30) {
          targetD = 29;
          lunar = Lunar.fromYmd(targetY, lunarMonthNum, targetD);
        } else {
          throw err; // 如果不是30日溢出问题，则正常抛出
        }
      }
      
      const solar = lunar.getSolar();
      
      const newDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
      setCoreDate(newDate);
    } catch (err) {
      console.error("Lunar logic error:", err);
    } finally {
      // 延迟释放锁，确保 React 完成渲染周期
      setTimeout(() => { isSyncing.current = false; }, 50);
    }
  };

  // 生成底部农历字符串
  let lunarStrCN = '';
  let lunarStrEN = '';
  if (coreDate && lunarView) {
    // Fallback to 12:00 if birthTime is empty or invalid
    let hour = 12;
    if (formData.birthTime) {
      const parts = formData.birthTime.split(':');
      if (parts.length > 0 && !isNaN(Number(parts[0]))) {
        hour = Number(parts[0]);
      }
    }
    
    // Temporarily create a Lunar object with time to get the correct hour pillar (baziTime)
    const tempSolar = Solar.fromYmdHms(coreDate.getFullYear(), coreDate.getMonth() + 1, coreDate.getDate(), hour, 0, 0);
    const tempLunarWithTime = tempSolar.getLunar();
    
    const baziTime = tempLunarWithTime.getTimeInGanZhi();
    const zhiTime = baziTime.substring(1, 2);
    
    const enTime = BAZI_MAPPING.branches[zhiTime]?.en || zhiTime;
    lunarStrCN = `${zhiTime}时`;
    lunarStrEN = `${enTime} Hour`;
  }

  // 重置表单数据
  const resetForm = () => {
    setFormData({
      name: '',
      gender: 'male',
      birthTime: '12:00',
      isOverseas: false,
      chinaAddress: '',
      worldCountry: '',
      birthEnv: 'home',
      fatherBirthYear: '',
      motherBirthYear: '',
      surname: '',
      givenName: '',
      surnameStrokes: '',
      givenNameStrokes: ''
    });
    setIsAgreed(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAgreed) {
      alert(t.agreement.required);
      return;
    }
    const safeDate = coreDate || new Date();
    const solarDateStr = `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, '0')}-${String(safeDate.getDate()).padStart(2, '0')}`;
    onSubmit({ ...formData, birthDate: solarDateStr, isEnglish: lang === 'en', lunarStrCN, lunarStrEN });
    // 提交后清除姓名和国家字段（保留其他设置以便用户重新排盘）
    setFormData(prev => ({
      ...prev,
      name: '',
      chinaAddress: '',
      worldCountry: ''
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-[#F5F0E6] rounded-xl border border-[#2C2C2C]/10 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[#2C2C2C] font-serif">{lang === 'en' ? 'Input Information' : (lang === 'zh-TW' ? '輸入資訊' : '输入信息')}</h2>
        <button
          type="button"
          onClick={() => {
            if (lang === 'zh-CN') setLang('zh-TW');
            else if (lang === 'zh-TW') setLang('en');
            else setLang('zh-CN');
          }}
          className="px-3 py-1 text-xs border border-[#2C2C2C]/30 rounded-full hover:bg-[#2C2C2C] hover:text-[#F5F0E6] transition-colors"
        >
          {lang === 'zh-CN' ? '简体' : lang === 'zh-TW' ? '繁體' : 'EN'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#2C2C2C]/70 mb-1">{lang === 'en' ? 'Name' : (lang === 'zh-TW' ? '姓名' : '名称')}</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-[#2C2C2C]/20 rounded bg-white/50 focus:ring-1 focus:ring-[#B22222] outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#2C2C2C]/70 mb-1">{lang === 'en' ? 'Gender' : (lang === 'zh-TW' ? '性別' : '性别')}</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full p-2 border border-[#2C2C2C]/20 rounded bg-white/50 focus:ring-1 focus:ring-[#B22222] outline-none"
          >
            <option value="male">{lang === 'en' ? 'Male' : (lang === 'zh-TW' ? '男性' : '男性')}</option>
            <option value="female">{lang === 'en' ? 'Female' : (lang === 'zh-TW' ? '女性' : '女性')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Solar Sequence */}
        <div className="col-span-2 md:col-span-1 p-4 bg-white/50 border border-[#2C2C2C]/10 rounded-xl flex flex-col gap-3">
          <div className="mb-1 text-[13px] font-medium leading-none text-[#2C2C2C]/70 font-serif whitespace-nowrap sm:text-sm">
            {lang === 'en' ? 'Birth Time (Gregorian)' : (lang === 'zh-TW' ? '出生時間(公曆)' : '出生时间(公历)')}
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {/* Solar Year Select */}
            <select
              name="solarYear"
              value={coreDate ? coreDate.getFullYear() : new Date().getFullYear()}
              onChange={handleSolarChange}
              className="w-full p-2 text-sm border border-[#2C2C2C]/20 rounded bg-white/80 focus:ring-1 focus:ring-[#B22222] outline-none"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}{t.yearSuffix}</option>
              ))}
            </select>

            <div className="flex gap-2">
              {/* Solar Month Select */}
              <select
                name="solarMonth"
                value={coreDate ? coreDate.getMonth() + 1 : new Date().getMonth() + 1}
                onChange={handleSolarChange}
                className="flex-[2.1] p-2 text-sm border border-[#2C2C2C]/20 rounded bg-white/80 focus:ring-1 focus:ring-[#B22222] outline-none text-left"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {getSolarMonthLabel(m)}
                  </option>
                ))}
              </select>

              {/* Solar Day Select */}
              <select
                name="solarDay"
                value={coreDate ? coreDate.getDate() : new Date().getDate()}
                onChange={handleSolarChange}
                className="flex-1 p-2 text-sm border border-[#2C2C2C]/20 rounded bg-white/80 focus:ring-1 focus:ring-[#B22222] outline-none text-left"
              >
                {Array.from({ length: coreDate ? new Date(coreDate.getFullYear(), coreDate.getMonth() + 1, 0).getDate() : 30 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>
                    {lang === 'en' ? `${t.day} ${d}` : d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <input
              type="time"
              name="birthTime"
              value={formData.birthTime}
              onChange={handleChange}
              className="w-full p-2 text-sm border border-[#2C2C2C]/20 rounded bg-white/80 focus:ring-1 focus:ring-[#B22222] outline-none mt-1"
            />
          </div>
        </div>

        {/* Lunar Sequence Display / Input */}
        <div className="col-span-2 md:col-span-1 p-4 bg-[#F5F5F0] border border-[#2C2C2C]/10 rounded-xl flex flex-col gap-3 shadow-inner">
          <div className="mb-1 text-[13px] font-medium leading-none text-[#2C2C2C]/70 font-serif whitespace-nowrap sm:text-sm">
            {lang === 'en' ? 'Chinese Lunar Calendar' : (lang === 'zh-TW' ? '中國農曆' : '中国农历')}
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {/* Year Select */}
            <select 
              name="year" 
              value={currentLunarYear} 
              onChange={handleLunarChange}
              className="w-full p-2 text-sm border border-[#2C2C2C]/20 rounded bg-white/50 focus:ring-1 focus:ring-[#B22222] outline-none"
            >
              {yearOptions.map(y => {
                return (
                  <option key={y} value={y}>
                    {formatLunarYearOption(y)}
                  </option>
                );
              })}
            </select>

            <div className="flex gap-2">
              {/* Month Select - 增加 110% 的容器宽度 (原 flex-1 占比现调大) */}
              <div className="flex-[2.1] flex gap-1">
                <select 
                  name="month" 
                  value={currentLunarMonth} 
                  onChange={handleLunarChange}
                  className="w-full p-2 text-sm border border-[#2C2C2C]/20 rounded bg-white/50 focus:ring-1 focus:ring-[#B22222] outline-none text-left"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                    return (
                      <option key={m} value={m}>
                        {getLunarMonthLabel(m)}
                      </option>
                    );
                  })}
                </select>
                <div className={`flex items-center gap-1 bg-white/50 px-2 border border-[#2C2C2C]/20 rounded text-xs shrink-0`}>
                  <input 
                    type="checkbox" 
                    name="isLeap" 
                    checked={isCurrentlyLeap} 
                    onChange={handleLunarChange}
                    className="w-3 h-3 accent-[#B22222]"
                    id="leapCheck"
                  />
                  <label htmlFor="leapCheck" className={`cursor-pointer text-[#2C2C2C]/70 whitespace-nowrap`}>
                    {t.leap}
                  </label>
                </div>
              </div>

              {/* Day Select - 相应缩小比例以保持整行总宽度对齐，并动态限制天数 */}
              <select 
                name="day" 
                value={currentLunarDay} 
                onChange={handleLunarChange}
                className="flex-1 p-2 text-sm border border-[#2C2C2C]/20 rounded bg-white/50 focus:ring-1 focus:ring-[#B22222] outline-none text-left"
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
                  return (
                    <option key={d} value={d}>
                      {lang === 'en' ? `${t.day} ${d}` : d}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          
          {lunarStrCN && (
            <div className="text-center text-[#2C2C2C]/80 font-bold font-serif text-[11px] mt-1 border-t border-[#2C2C2C]/5 pt-2 truncate">
              {lang === 'en' ? lunarStrEN : text(lunarStrCN)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#2C2C2C]/70 mb-1">{lang === 'en' ? 'Birth Place' : (lang === 'zh-TW' ? '出生地' : '出生地')}</label>
          <select
            name="isOverseas"
            value={formData.isOverseas}
            onChange={(e) => setFormData(prev => ({ ...prev, isOverseas: e.target.value === 'true' }))}
            className="w-full p-2 border border-[#2C2C2C]/20 rounded bg-white/50 focus:ring-1 focus:ring-[#B22222] outline-none"
          >
            <option value="false">{lang === 'en' ? 'China' : (lang === 'zh-TW' ? '國內' : '国内')}</option>
            <option value="true">{lang === 'en' ? 'Overseas/Other' : (lang === 'zh-TW' ? '海外/其他' : '海外/其他')}</option>
          </select>
        </div>
        <div>
           {/* Dynamic Region Input */}
           {!formData.isOverseas ? (
             <>
               <label className="block text-sm font-medium text-[#2C2C2C]/70 mb-1">{lang === 'en' ? 'China Region' : (lang === 'zh-TW' ? '中國地區' : '中国区域')}</label>
               <input 
                 type="text" 
                 name="chinaAddress"
                 placeholder={lang === 'en' ? 'Province/City (e.g. Shandong)' : (lang === 'zh-TW' ? '省份/城市 (如: 山東)' : '省份/城市 (如: 山东)')} 
                 value={formData.chinaAddress}
                 onChange={handleChange}
                 className="w-full p-2 border border-[#2C2C2C]/20 rounded bg-white/50 focus:ring-1 focus:ring-[#B22222] outline-none"
               />
             </>
           ) : (
             <>
               <label className="block text-sm font-medium text-[#2C2C2C]/70 mb-1">{lang === 'en' ? 'World Region' : (lang === 'zh-TW' ? '世界區域' : '世界区域')}</label>
               <input 
                 type="text" 
                 name="worldCountry"
                 placeholder={lang === 'en' ? 'Country (e.g. United States)' : (lang === 'zh-TW' ? '國家 (如: 美國)' : '国家 (如: 美国)')} 
                 value={formData.worldCountry}
                 onChange={handleChange}
                 className="w-full p-2 border border-[#2C2C2C]/20 rounded bg-white/50 focus:ring-1 focus:ring-[#B22222] outline-none"
               />
             </>
           )}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[#2C2C2C]/70 mb-1">{lang === 'en' ? 'Birth Environment' : (lang === 'zh-TW' ? '出生環境' : '出生环境')}</label>
        <select
          name="birthEnv"
          value={formData.birthEnv}
          onChange={handleChange}
          className="w-full p-2 border border-[#2C2C2C]/20 rounded bg-white/50 focus:ring-1 focus:ring-[#B22222] outline-none"
        >
          {Object.keys(birthEnvironments).map(key => (
            <option key={key} value={key}>
              {lang === 'en' 
                ? (t.birthEnvMap[key] || birthEnvironments[key].nameEn || birthEnvironments[key].name)
                : (lang === 'zh-TW' ? birthEnvironments[key].nameTW || birthEnvironments[key].name : birthEnvironments[key].name)
              }
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 mt-4 text-sm text-[#2C2C2C]/80">
        <input 
          type="checkbox" 
          id="agreement" 
          checked={isAgreed}
          onChange={(e) => setIsAgreed(e.target.checked)}
          className="w-4 h-4 accent-[#B22222] cursor-pointer"
        />
        <label htmlFor="agreement" className="cursor-pointer select-none">
          {lang === 'en' ? 'I have read and agree to the ' : (lang === 'zh-TW' ? '我已閱讀並同意' : '我已经阅读并同意')}
          <span 
            onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
            className="text-[#B22222] hover:underline cursor-pointer font-medium"
          >
            {lang === 'en' ? 'Service Agreement' : (lang === 'zh-TW' ? '《服務協議》' : '《服务协议》')}
          </span>
        </label>
      </div>
      
      <button
        type="submit"
        className={`w-full py-3 text-[#F5F0E6] font-bold rounded transition-colors shadow-md mt-4 ${isAgreed ? 'bg-[#B22222] hover:bg-[#8B1A1A]' : 'bg-[#2C2C2C]/30 cursor-not-allowed'}`}
        disabled={!isAgreed}
      >
        {lang === 'en' ? 'Analyze' : (lang === 'zh-TW' ? '分析' : '计算')}
      </button>

      <AgreementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} lang={lang} />
    </form>
  );
}
