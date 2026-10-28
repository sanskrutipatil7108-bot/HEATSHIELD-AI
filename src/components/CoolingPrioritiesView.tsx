import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CoolingFacility, FacilityType } from '../types';
import {
  getFacilityTypeName,
  getFacilityAvailabilityName,
  getImplementationStatusName,
  getRiskCategoryName,
  getLocationDisplayName,
  getDutyPointDisplayName,
  formatNumberLocale
} from '../services/translations';
import {
  Umbrella,
  Droplets,
  Wind,
  Home,
  HeartPulse,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  ShieldCheck,
  Building
} from 'lucide-react';

export const CoolingPrioritiesView: React.FC = () => {
  const {
    language,
    t,
    selectedLocation,
    currentLocationDutyPoints,
    coolingFacilities,
    currentLocationCoolingFacilities,
    addCoolingFacility,
    updateCoolingFacility,
    recalculateCoolingPriorities,
    riskAssessments
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [targetDutyPointId, setTargetDutyPointId] = useState(
    currentLocationDutyPoints[0]?.id || ''
  );
  const [facilityType, setFacilityType] = useState<FacilityType>('shade_canopy');
  const [facilityName, setFacilityName] = useState('');
  const [availability, setAvailability] = useState<CoolingFacility['availability']>('missing');
  const [intervention, setIntervention] = useState('');

  const filteredFacilities = currentLocationCoolingFacilities.filter((cf) => {
    if (filterType !== 'all' && cf.facilityType !== filterType) return false;
    if (filterStatus !== 'all' && cf.implementationStatus !== filterStatus) return false;
    return true;
  });

  const handleAddFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDutyPointId || !facilityName.trim()) return;

    const dp = currentLocationDutyPoints.find((d) => d.id === targetDutyPointId);
    const riskScore = riskAssessments[targetDutyPointId]?.score || 60;
    const basePriority = Math.min(
      100,
      Math.round(riskScore * 0.7 + (availability === 'missing' ? 30 : 10))
    );

    addCoolingFacility({
      dutyPointId: targetDutyPointId,
      locationId: selectedLocation.id,
      facilityType,
      name: facilityName.trim(),
      availability,
      verificationStatus: 'verified',
      priorityScore: basePriority,
      recommendedIntervention:
        intervention.trim() || `Install verified ${facilityType.replace('_', ' ')} within 30m of duty line.`,
      implementationStatus: availability === 'available' ? 'installed' : 'pending',
      lastInspectedDate: new Date().toISOString().split('T')[0]
    });

    setFacilityName('');
    setIntervention('');
    setIsAddModalOpen(false);
  };

  const getFacilityIcon = (type: FacilityType) => {
    switch (type) {
      case 'shade_canopy':
        return <Umbrella className="w-4 h-4 text-[#F59E0B]" />;
      case 'misting_fan':
        return <Wind className="w-4 h-4 text-[#2563EB]" />;
      case 'chilled_water_dispenser':
        return <Droplets className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'cooling_shelter':
        return <Home className="w-4 h-4 text-[#16A34A]" />;
      case 'first_aid_ors_station':
        return <HeartPulse className="w-4 h-4 text-[#DC2626]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Infrastructure Image */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-8 p-6 lg:p-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-[11px] font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              {t('cooling.badgeTitle')} · {getLocationDisplayName(selectedLocation, language)}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-main-theme tracking-tight">
              {t('cooling.title')}
            </h1>
            <p className="text-xs text-muted-theme leading-relaxed max-w-2xl">
              {t('cooling.subtitle')}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={recalculateCoolingPriorities}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-card-theme border-theme text-secondary-theme hover:text-main-theme hover:bg-subtle-theme flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-muted-theme" />
                <span>{t('cooling.recalculate')}</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('cooling.addFacility')}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 relative min-h-[160px] lg:min-h-full border-t lg:border-t-0 lg:border-l border-theme">
            <img
              src="/src/assets/images/cooling_shelter_station_1792600963830.jpg"
              alt="Roadside misting station and shade shelter"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-card-theme via-transparent to-transparent opacity-60" />
          </div>
        </div>
      </div>

      {/* Facilities List & Action Table */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-xl overflow-hidden">
        {/* Filter controls */}
        <div className="p-4 border-b border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-main-theme">{t('cooling.tableTitle')}</span>
            <span className="text-[11px] font-mono text-muted-theme">
              ({filteredFacilities.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 text-xs input-theme rounded-lg focus:outline-none"
            >
              <option value="all">{t('cooling.filterAllTypes')}</option>
              <option value="shade_canopy">{t('cooling.shadedShelter')}</option>
              <option value="misting_fan">{t('cooling.mistingFans')}</option>
              <option value="chilled_water_dispenser">{t('cooling.drinkingWater')}</option>
              <option value="cooling_shelter">{getFacilityTypeName('cooling_shelter', language)}</option>
              <option value="first_aid_ors_station">{t('cooling.medicalFirstAid')}</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs input-theme rounded-lg focus:outline-none"
            >
              <option value="all">{t('cooling.filterAllStatuses')}</option>
              <option value="pending">{getImplementationStatusName('pending', language)}</option>
              <option value="approved">{getImplementationStatusName('approved', language)}</option>
              <option value="in_progress">{getImplementationStatusName('in_progress', language)}</option>
              <option value="installed">{getImplementationStatusName('installed', language)}</option>
            </select>
          </div>
        </div>

        {/* Priority Ranking Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-secondary-theme">
            <thead className="bg-subtle-theme text-[11px] uppercase font-mono text-muted-theme border-b border-theme">
              <tr>
                <th className="px-4 py-3">{t('cooling.thAsset')}</th>
                <th className="px-4 py-3">{t('cooling.thJunction')}</th>
                <th className="px-4 py-3">{t('cooling.thAvailability')}</th>
                <th className="px-4 py-3">{t('cooling.thPriority')}</th>
                <th className="px-4 py-3">{t('cooling.thIntervention')}</th>
                <th className="px-4 py-3">{t('cooling.thDeployment')}</th>
                <th className="px-4 py-3 text-right">{t('cooling.thAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle-theme font-normal">
              {filteredFacilities.map((cf) => {
                const dp = currentLocationDutyPoints.find((d) => d.id === cf.dutyPointId);
                const assessment = riskAssessments[cf.dutyPointId];

                return (
                  <tr key={cf.id} className="hover:bg-subtle-theme transition-colors">
                    {/* Facility Asset */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {getFacilityIcon(cf.facilityType)}
                        <span className="font-semibold text-main-theme">{cf.name}</span>
                      </div>
                      <div className="text-[10px] text-muted-theme font-mono mt-0.5">
                        {getFacilityTypeName(cf.facilityType, language)}
                      </div>
                    </td>

                    {/* Duty Point */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-main-theme">{dp ? getDutyPointDisplayName(dp, language) : t('common.location')}</div>
                      <div className="text-[10px] text-muted-theme mt-0.5">
                        {t('cooling.priorityScore')}: {formatNumberLocale(assessment?.score ?? 50, language)}/100 ({getRiskCategoryName(assessment?.category ?? 'Moderate', language)})
                      </div>
                    </td>

                    {/* Availability */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono capitalize border ${
                          cf.availability === 'available'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#16A34A] border-emerald-200 dark:border-emerald-800'
                            : cf.availability === 'under_maintenance'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-[#F59E0B] border-amber-200 dark:border-amber-800'
                            : 'bg-red-50 dark:bg-red-950/40 text-[#DC2626] border-red-200 dark:border-red-800 font-semibold'
                        }`}
                      >
                        {getFacilityAvailabilityName(cf.availability, language)}
                      </span>
                    </td>

                    {/* Priority Score */}
                    <td className="px-4 py-3.5 font-mono">
                      <div
                        className={`text-sm font-bold tabular-nums ${
                          cf.priorityScore >= 80
                            ? 'text-[#DC2626]'
                            : cf.priorityScore >= 50
                            ? 'text-[#F59E0B]'
                            : 'text-[#16A34A]'
                        }`}
                      >
                        {cf.priorityScore}/100
                      </div>
                      <div className="text-[10px] text-muted-theme">
                        {cf.priorityScore >= 80 ? t('cooling.urgentNeed') : t('cooling.standardQueue')}
                      </div>
                    </td>

                    {/* Intervention */}
                    <td className="px-4 py-3.5 text-secondary-theme max-w-xs leading-relaxed">
                      {cf.recommendedIntervention}
                    </td>

                    {/* Deployment Status */}
                    <td className="px-4 py-3.5">
                      <select
                        value={cf.implementationStatus}
                        onChange={(e) =>
                          updateCoolingFacility(cf.id, {
                            implementationStatus: e.target.value as any
                          })
                        }
                        className="px-2 py-1 text-xs input-theme rounded focus:outline-none"
                      >
                        <option value="pending">{getImplementationStatusName('pending', language)}</option>
                        <option value="approved">{getImplementationStatusName('approved', language)}</option>
                        <option value="in_progress">{getImplementationStatusName('in_progress', language)}</option>
                        <option value="installed">{getImplementationStatusName('installed', language)}</option>
                      </select>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() =>
                          updateCoolingFacility(cf.id, {
                            availability: cf.availability === 'available' ? 'missing' : 'available'
                          })
                        }
                        className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium"
                      >
                        {t('cooling.toggleAvail')}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredFacilities.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-theme text-xs">
                    {t('cooling.emptyList')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Facility Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card-theme border-theme rounded-2xl w-full max-w-md p-6 space-y-4 shadow-modal-theme">
            <h2 className="text-base font-bold text-main-theme">{t('cooling.modalRegisterTitle')}</h2>
            <form onSubmit={handleAddFacility} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('cooling.modalTargetPost')}</label>
                <select
                  value={targetDutyPointId}
                  onChange={(e) => setTargetDutyPointId(e.target.value)}
                  className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                >
                  {currentLocationDutyPoints.map((dp) => (
                    <option key={dp.id} value={dp.id}>
                      {getDutyPointDisplayName(dp, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('cooling.modalCategory')}</label>
                <select
                  value={facilityType}
                  onChange={(e) => setFacilityType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                >
                  <option value="shade_canopy">{t('cooling.shadedShelter')}</option>
                  <option value="misting_fan">{t('cooling.mistingFans')}</option>
                  <option value="chilled_water_dispenser">{t('cooling.drinkingWater')}</option>
                  <option value="cooling_shelter">{getFacilityTypeName('cooling_shelter', language)}</option>
                  <option value="first_aid_ors_station">{t('cooling.medicalFirstAid')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('cooling.modalAssetLabel')}</label>
                <input
                  type="text"
                  required
                  placeholder={language === 'hi' ? 'उदा. मिस्टिंग पंखा चौकी #2' : language === 'mr' ? 'उदा. मिस्टिंग फॅन चौकी #2' : 'e.g. Solar Misting Fan Post #2'}
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('cooling.modalState')}</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                >
                  <option value="missing">{t('cooling.modalStateMissing')}</option>
                  <option value="available">{t('cooling.modalStateAvailable')}</option>
                  <option value="under_maintenance">{t('cooling.modalStateMaintenance')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('cooling.modalInterventionPlan')}</label>
                <textarea
                  rows={2}
                  placeholder={language === 'hi' ? 'उदा. ट्रैफिक कंट्रोल आइलैंड के लिए 4-नोजल मिस्टिंग रिंग लगाएं।' : language === 'mr' ? 'उदा. वाहतूक बेटासाठी ४-नोझल मिस्टिंग रिंग बसवा.' : 'e.g. Procure 4-nozzle high pressure misting ring for traffic control island.'}
                  value={intervention}
                  onChange={(e) => setIntervention(e.target.value)}
                  className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-muted-theme hover:text-main-theme"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm"
                >
                  {t('cooling.modalSaveAsset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
