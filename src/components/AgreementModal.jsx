import { X } from 'lucide-react';
import { getAgreementData } from '../data/agreement_db.js';
import { translations } from '../utils/translations.js';

export default function AgreementModal({ isOpen, onClose, lang = 'zh-CN' }) {
  if (!isOpen) return null;
  const t = translations[lang] || translations['zh-CN'];
  const agreementData = getAgreementData(lang);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#F5F0E6] w-full max-w-2xl max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden relative border border-[#2C2C2C]/20">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#2C2C2C]/10 bg-[#E8E2D5]">
          <h2 className="text-xl font-bold font-serif text-[#2C2C2C]">{agreementData.title}</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-[#2C2C2C]/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-[#2C2C2C]/70" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-[#2C2C2C]/80 font-serif leading-relaxed">
          <div className="text-sm opacity-70 text-center mb-4">
            {t.agreement.updateDate}：{agreementData.updateDate} | {t.agreement.effectiveDate}：{agreementData.effectiveDate}
          </div>

          <div className="space-y-6 mt-6">
            {agreementData.sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">{section.title}</h3>
                <p className="text-[15px] text-justify" dangerouslySetInnerHTML={{ __html: section.content }}></p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-right font-bold text-sm opacity-80">
            {t.agreement.company}：{agreementData.company}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-[#2C2C2C]/10 bg-[#E8E2D5] flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-[#B22222] text-[#F5F0E6] rounded font-bold hover:bg-[#8B1A1A] transition-colors"
          >
            {t.agreement.close}
          </button>
        </div>
      </div>
    </div>
  );
}
