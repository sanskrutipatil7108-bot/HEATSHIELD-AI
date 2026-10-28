import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OrganizationPolicy } from '../types';
import {
  Building2,
  Shield,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  Save,
  Globe,
  Lock
} from 'lucide-react';

export const OrgPoliciesView: React.FC = () => {
  const { organizations, activeOrgId, setActiveOrgId, activeOrg, updateOrgPolicy, t, language } = useApp();

  const [formData, setFormData] = useState<OrganizationPolicy>({
    ...activeOrg.policies
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleOrgChange = (orgId: string) => {
    setActiveOrgId(orgId);
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setFormData({ ...org.policies });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgPolicy(activeOrgId, formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase text-teal-600 dark:text-teal-400 font-semibold">
                {language === 'hi' ? 'विभागीय प्रशासन एवं नीति मानक' : language === 'mr' ? 'प्रशासकीय नियम व धोरण मानके' : 'Multi-Tenant Governance & Policy Standards'}
              </div>
              <h1 className="text-2xl font-bold text-main-theme tracking-tight">
                {t('policies.title')}
              </h1>
              <p className="text-xs text-muted-theme mt-0.5">
                {t('policies.subtitle')}
              </p>
            </div>
          </div>

          {/* Org Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-theme font-medium">{t('policies.activeOrg')}:</span>
            <select
              value={activeOrgId}
              onChange={(e) => handleOrgChange(e.target.value)}
              className="px-3 py-2 text-xs input-theme rounded-lg font-medium focus:outline-none"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.country})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Policy Form */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-xl p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h2 className="text-sm font-bold text-main-theme flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2563EB]" />
              <span>
                {language === 'hi' ? 'मानक परिचालन निर्देश पैरामीटर' : language === 'mr' ? 'प्रमाणित कार्यपद्धती निकष' : 'Standard Operational Directive Parameters'}
              </span>
            </h2>
            <p className="text-xs text-muted-theme mt-1">
              {language === 'hi'
                ? 'ये सीमाएं स्वचालित शिफ्ट सत्यापन, रोस्टर चेतावनियों और ड्यूटी रोटेशन को नियंत्रित करती हैं।'
                : language === 'mr'
                ? 'हे निकष ड्युटीचे प्रमाणीकरण, वेळापत्रक इशारे व रोटेशनचे नियंत्रण करतात.'
                : 'These thresholds govern automated shift validation, roster flags, and duty rotation triggers.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-theme mb-1">
                {language === 'hi' ? 'निर्देशिका / मानक शीर्षक *' : language === 'mr' ? 'मार्गदर्शक / मानक शीर्षक *' : 'Directive / Standard Title *'}
              </label>
              <input
                type="text"
                required
                value={formData.policyJurisdictionName}
                onChange={(e) =>
                  setFormData({ ...formData, policyJurisdictionName: e.target.value })
                }
                className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-theme mb-1">
                {language === 'hi' ? 'आपातकालीन चिकित्सा हेल्पलाइन *' : language === 'mr' ? 'तातडीची वैद्यकीय मदत हेल्पलाइन *' : 'Emergency Medical Escalation Hotline *'}
              </label>
              <input
                type="text"
                required
                value={formData.emergencyEscalationPhone}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyEscalationPhone: e.target.value })
                }
                className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-theme grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-theme mb-1">
                {t('policies.maxContinuousHigh')}
              </label>
              <input
                type="number"
                min="15"
                max="120"
                step="5"
                value={formData.maxContinuousExposureMinutesHighRisk}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxContinuousExposureMinutesHighRisk: parseInt(e.target.value, 10)
                  })
                }
                className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
              />
              <span className="text-[10px] text-muted-theme mt-1 block">
                {language === 'hi' ? 'अनुशंसित: पीक धूप में 30–45 मिनट' : language === 'mr' ? 'शिफारस: दुपारच्या कडक उन्हात ३०–४५ मिनिटे' : 'Recommended: 30–45 mins during peak midday sun'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-theme mb-1">
                {language === 'hi' ? 'मध्यम गर्मी में अधिकतम लगातार ड्यूटी (मिनट)' : language === 'mr' ? 'मध्यम उष्णतेत सलग ड्युटी मर्यादा (मिनिटे)' : 'Max Continuous Stint in Moderate Heat (mins)'}
              </label>
              <input
                type="number"
                min="30"
                max="180"
                step="15"
                value={formData.maxContinuousExposureMinutesModRisk}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxContinuousExposureMinutesModRisk: parseInt(e.target.value, 10)
                  })
                }
                className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
              />
              <span className="text-[10px] text-muted-theme mt-1 block">
                {language === 'hi' ? 'अनुशंसित: 60–90 मिनट' : language === 'mr' ? 'शिफारस: ६०–९० मिनिटे' : 'Recommended: 60–90 mins'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-theme mb-1">
                {t('policies.breakHigh')}
              </label>
              <input
                type="number"
                min="10"
                max="60"
                step="5"
                value={formData.minRestIntervalMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minRestIntervalMinutes: parseInt(e.target.value, 10)
                  })
                }
                className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
              />
              <span className="text-[10px] text-muted-theme mt-1 block">
                {language === 'hi' ? 'पुनः तैनाती से पहले छाया में अनिवार्य विश्राम' : language === 'mr' ? 'पुढील तैनातीपूर्वी सावलीत अनिवार्य विश्रांती' : 'Mandatory shaded cool-down before redeployment'}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="shadeStrict"
                checked={!formData.allowHighRiskShiftsWithoutShade}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    allowHighRiskShiftsWithoutShade: !e.target.checked
                  })
                }
                className="w-4 h-4 accent-[#2563EB] rounded cursor-pointer"
              />
              <label htmlFor="shadeStrict" className="text-xs text-secondary-theme cursor-pointer font-medium">
                {language === 'hi'
                  ? 'कड़ा छाया नियम: उच्च/अत्यधिक गर्मी में बिना छाया वाली चौकियां प्रतिबंधित करें'
                  : language === 'mr'
                  ? 'कडक सावली नियम: जास्त/अति उष्णतेत सावली नसलेल्या चौकांवर ड्युटी बंदी करा'
                  : 'Strict Shade Enforcement: Disallow unattended unshaded traffic points during High/Extreme heat'}
              </label>
            </div>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t('policies.save')}</span>
            </button>
          </div>

          {isSaved && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-[#16A34A] flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span className="font-medium">{t('policies.savedSuccess')}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
