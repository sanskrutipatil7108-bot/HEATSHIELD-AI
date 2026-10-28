import React from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  X,
  PhoneCall,
  Activity,
  Droplets,
  Wind,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { getLocationDisplayName } from '../services/translations';

interface EmergencyProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyProtocolModal: React.FC<EmergencyProtocolModalProps> = ({
  isOpen,
  onClose
}) => {
  const { activeOrg, selectedLocation, t, language } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card-theme border border-red-200 dark:border-red-800 rounded-2xl w-full max-w-xl shadow-modal-theme overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
            <div>
              <h2 className="text-base font-bold text-red-950 dark:text-red-300">
                {t('modals.emergencyTitle')}
              </h2>
              <p className="text-xs text-red-700 dark:text-red-400">
                {t('modals.emergencySubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-theme hover:text-main-theme rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-secondary-theme overflow-y-auto max-h-[80vh]">
          {/* Hotline Box */}
          <div className="p-4 bg-red-50/80 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl flex items-center justify-between shadow-xs">
            <div>
              <div className="text-[11px] uppercase font-mono text-[#DC2626] font-bold">
                {language === 'hi' ? 'आपातकालीन हेल्पलाइन' : language === 'mr' ? 'तातडीची मदत हेल्पलाइन' : 'Emergency Escalation Hotline'}
              </div>
              <div className="text-lg font-mono font-bold text-main-theme mt-0.5">
                {activeOrg.policies.emergencyEscalationPhone}
              </div>
              <div className="text-[11px] text-muted-theme">
                {activeOrg.name} · {getLocationDisplayName(selectedLocation, language)}
              </div>
            </div>
            <a
              href={`tel:${activeOrg.policies.emergencyEscalationPhone}`}
              className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{t('modals.callAmbulanceBtn')}</span>
            </a>
          </div>

          {/* Differentiating Heat Exhaustion vs Heat Stroke */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-subtle-theme border border-amber-200 dark:border-amber-900/40 rounded-xl">
              <div className="font-bold text-amber-900 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span>{language === 'hi' ? 'हीट एग्जॉशन (लू लगना)' : language === 'mr' ? 'उष्मा थकवा (Heat Exhaustion)' : 'Heat Exhaustion'}</span>
              </div>
              <ul className="space-y-1 text-[11px] text-secondary-theme">
                <li>• {language === 'hi' ? 'अत्यधिक पसीना आना' : language === 'mr' ? 'भरपूर घाम येणे' : 'Heavy, profuse sweating'}</li>
                <li>• {language === 'hi' ? 'त्वचा ठंडी व चिपचिपी' : language === 'mr' ? 'त्वचा थंड व चिकट' : 'Cold, pale, clammy skin'}</li>
                <li>• {language === 'hi' ? 'तेज व कमजोर नब्ज' : language === 'mr' ? 'जलद पण मंद नाडी' : 'Fast, weak pulse'}</li>
                <li>• {language === 'hi' ? 'मांसपेशियों में ऐंठन' : language === 'mr' ? 'स्नायूंमध्ये पेटके' : 'Nausea, muscle cramps'}</li>
                <li>• {language === 'hi' ? 'चक्कर एवं कमजोरी' : language === 'mr' ? 'चक्कर व अशक्तपणा' : 'Dizziness, weakness'}</li>
              </ul>
            </div>

            <div className="p-3 bg-subtle-theme border border-red-200 dark:border-red-900/40 rounded-xl">
              <div className="font-bold text-red-900 dark:text-red-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <span>{language === 'hi' ? 'हीट स्ट्रोक (अति गंभीर)' : language === 'mr' ? 'उष्माघात (Heat Stroke - गंभीर)' : 'Heat Stroke (Critical)'}</span>
              </div>
              <ul className="space-y-1 text-[11px] text-secondary-theme">
                <li>• {language === 'hi' ? 'तापमान > 40°C (104°F)' : language === 'mr' ? 'तापमान > ४०°C (१०४°F)' : 'Core temp > 40°C (104°F)'}</li>
                <li>• {language === 'hi' ? 'मानसिक भ्रम या लड़खड़ाहट' : language === 'mr' ? 'गोंधळलेली अवस्था / अडखळणे' : 'Confusion, slurred speech'}</li>
                <li>• {language === 'hi' ? 'त्वचा गर्म व सूखी' : language === 'mr' ? 'त्वचा अतिउष्ण व कोरडी' : 'Hot, red, dry skin'}</li>
                <li>• {language === 'hi' ? 'बेहोशी की स्थिति' : language === 'mr' ? 'बेशुद्ध पडणे' : 'Loss of consciousness'}</li>
                <li>• {language === 'hi' ? 'उल्टी या दौरे पड़ना' : language === 'mr' ? 'उलट्या किंवा झटके' : 'Vomiting / seizures'}</li>
              </ul>
            </div>
          </div>

          {/* Immediate 4-Step Field Action Plan */}
          <div className="space-y-2">
            <div className="font-bold text-main-theme flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#2563EB]" />
              <span>{language === 'hi' ? 'तत्काल 4-चरणीय फील्ड कार्ययोजना:' : language === 'mr' ? 'तातडीची ४-टप्प्यांची कृती योजना:' : 'Immediate 4-Step Field Action:'}</span>
            </div>

            <div className="p-3.5 bg-subtle-theme border border-theme rounded-xl space-y-2 text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#2563EB]">1.</span>
                <span>
                  <strong className="text-main-theme">{t('modals.step1Title')}: </strong>
                  {t('modals.step1Desc')}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#2563EB]">2.</span>
                <span>
                  <strong className="text-main-theme">{t('modals.step2Title')}: </strong>
                  {t('modals.step2Desc')}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#2563EB]">3.</span>
                <span>
                  <strong className="text-main-theme">{t('modals.step3Title')}: </strong>
                  {t('modals.step3Desc')}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#2563EB]">4.</span>
                <span>
                  <strong className="text-main-theme">{t('modals.step4Title')}: </strong>
                  {t('modals.step4Desc')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-subtle-theme border-t border-theme flex items-center justify-between text-xs">
          <span className="text-muted-theme text-[11px]">
            {language === 'hi'
              ? 'सूचना: यह प्राथमिक चिकित्सा मार्गदर्शन है। डॉक्टर के उपचार का विकल्प नहीं।'
              : language === 'mr'
              ? 'सूचना: हे प्रथमोपचार मार्गदर्शन आहे. डॉक्टरांच्या उपचारांना पर्याय नाही.'
              : 'Notice: First-aid operational guidance. Not a substitute for physician diagnosis.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg transition-colors shadow-xs"
          >
            {language === 'hi' ? 'समझ लिया' : language === 'mr' ? 'समजले' : 'Acknowledge'}
          </button>
        </div>
      </div>
    </div>
  );
};
