import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Staff, DutyAssignment, RiskCategory } from '../types';
import {
  getRiskCategoryName,
  getDutyPointDisplayName,
  getStaffRankDisplayName,
  getStaffAvailabilityDisplayName,
  getStaffVulnerabilityDisplayName,
  formatDateLocale,
  formatNumberLocale
} from '../services/translations';
import {
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Download,
  Sparkles,
  Shield,
  Phone,
  UserCheck,
  Edit2,
  Trash2,
  RefreshCw,
  Umbrella,
  FileSpreadsheet
} from 'lucide-react';

export const DutyPlannerView: React.FC = () => {
  const {
    staffList,
    currentOrgStaff,
    addStaff,
    updateStaff,
    dutyPoints,
    currentLocationDutyPoints,
    dutyAssignments,
    currentLocationDutyAssignments,
    addDutyAssignment,
    updateDutyAssignment,
    deleteDutyAssignment,
    autoOptimizeSchedule,
    riskAssessments,
    activeOrg,
    exportDutyAssignmentsToCSV,
    language,
    t
  } = useApp();

  // Modals & Forms State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [optimizationSummary, setOptimizationSummary] = useState<{
    adjustedCount: number;
    recommendations: string[];
  } | null>(null);

  // New Staff form
  const [staffName, setStaffName] = useState('');
  const [staffBadge, setStaffBadge] = useState('');
  const [staffRank, setStaffRank] = useState('Police Constable');
  const [staffVulnerability, setStaffVulnerability] = useState<Staff['vulnerabilityStatus']>('standard');
  const [staffPhone, setStaffPhone] = useState('');

  // New Assignment form
  const [assignStaffId, setAssignStaffId] = useState(currentOrgStaff[0]?.id || '');
  const [assignDutyPointId, setAssignDutyPointId] = useState(currentLocationDutyPoints[0]?.id || '');
  const [shiftDate, setShiftDate] = useState('2026-10-21');
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('15:00');
  const [continuousDuration, setContinuousDuration] = useState(90);
  const [breakDuration, setBreakDuration] = useState(15);
  const [breakFrequency, setBreakFrequency] = useState(60);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'approved'>('all');

  const filteredAssignments = useMemo(() => {
    return currentLocationDutyAssignments.filter((da) => {
      if (statusFilter === 'flagged') return da.approvalStatus === 'flagged_overexposure';
      if (statusFilter === 'approved') return da.approvalStatus === 'approved';
      return true;
    });
  }, [currentLocationDutyAssignments, statusFilter]);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffBadge) return;
    addStaff({
      organizationId: activeOrg.id,
      fullName: staffName.trim(),
      badgeNumber: staffBadge.trim(),
      rank: staffRank,
      vulnerabilityStatus: staffVulnerability,
      contactPhone: staffPhone || '+91 90000 00000',
      availability: 'available'
    });
    setStaffName('');
    setStaffBadge('');
    setIsAddStaffOpen(false);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignmentError(null);
    if (!assignStaffId || !assignDutyPointId) {
      setAssignmentError(t('planner.selectStaffAndLocationError'));
      return;
    }

    addDutyAssignment({
      staffId: assignStaffId,
      dutyPointId: assignDutyPointId,
      shiftDate,
      startTime,
      endTime,
      plannedContinuousExposureMinutes: Number(continuousDuration),
      breakDurationMinutes: Number(breakDuration),
      breakFrequencyMinutes: Number(breakFrequency),
      approvalStatus: 'approved'
    });

    setIsAddAssignmentOpen(false);
  };

  const handleRunOptimizer = () => {
    const res = autoOptimizeSchedule();
    setOptimizationSummary(res);
  };

  return (
    <div className="space-y-6">
      {/* View Header with Supervisor Profile & Stats */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-teal-500/40 overflow-hidden shrink-0 bg-subtle-theme shadow-sm">
              <img
                src="/src/assets/images/avatar_supervisor_officer_1792600965722.jpg"
                alt="Duty Planning Supervisor"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-xs font-mono uppercase text-teal-600 dark:text-teal-400 font-semibold">
                {t('planner.supervisorCommand')} · {activeOrg.name}
              </div>
              <h1 className="text-2xl font-bold text-main-theme tracking-tight">
                {t('planner.title')}
              </h1>
              <p className="text-xs text-muted-theme mt-1">
                {t('planner.subtitle')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={exportDutyAssignmentsToCSV}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-card-theme border-theme text-secondary-theme hover:text-main-theme hover:bg-subtle-theme flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-muted-theme" />
              <span>{t('planner.exportCsv')}</span>
            </button>
            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-card-theme border-theme text-secondary-theme hover:text-main-theme hover:bg-subtle-theme flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{t('planner.addStaffBtn')}</span>
            </button>
            <button
              onClick={() => setIsAddAssignmentOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('planner.createAssignment')}</span>
            </button>
          </div>
        </div>

        {/* 1-Click Optimizer Banner */}
        <div className="mt-6 pt-5 border-t border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900/40">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-main-theme">{t('planner.autoOptimize')}</div>
              <div className="text-[11px] text-muted-theme mt-0.5">
                {t('planner.subtitle')}
              </div>
            </div>
          </div>
          <button
            onClick={handleRunOptimizer}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-300" />
            <span>{t('planner.autoOptimize')}</span>
          </button>
        </div>

        {/* Optimization results banner */}
        {optimizationSummary && (
          <div className="mt-3 p-3.5 bg-subtle-theme border border-teal-500/40 rounded-lg text-xs text-secondary-theme space-y-1 animate-in fade-in">
            <div className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>
                {language === 'mr'
                  ? `${t('planner.scheduleOptimized')}: ${optimizationSummary.adjustedCount} शिफ्ट्स सुरक्षित नियमांनुसार अपडेट केल्या.`
                  : language === 'hi'
                  ? `${t('planner.scheduleOptimized')}: ${optimizationSummary.adjustedCount} शिफ्ट्स को सुरक्षित मानकों के अनुसार अपडेट किया गया।`
                  : `${t('planner.scheduleOptimized')}: ${optimizationSummary.adjustedCount} ${t('planner.shiftsUpdated')}`}
              </span>
            </div>
            {optimizationSummary.recommendations.map((rec, i) => (
              <div key={i} className="text-[11px] text-muted-theme pl-6">
                • {rec}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roster & Assignments Table */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-xl overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-theme flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-main-theme">{t('planner.title')}</span>
            <span className="text-[11px] text-muted-theme font-mono">
              ({filteredAssignments.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-theme hidden sm:inline">{t('common.filter')}:</span>
            <div className="flex gap-1 p-0.5 bg-[#E8F2FF] rounded-lg border border-[#DCE5EF] text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                    : 'text-[#0F172A] hover:bg-white/80 font-medium'
                }`}
              >
                {t('planner.filterAll')}
              </button>
              <button
                onClick={() => setStatusFilter('flagged')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'flagged'
                    ? 'bg-[#DC2626] text-white font-semibold shadow-xs'
                    : 'text-[#DC2626] hover:bg-white/80 font-medium'
                }`}
              >
                {t('planner.filterFlagged')}
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === 'approved'
                    ? 'bg-[#16A34A] text-white font-semibold shadow-xs'
                    : 'text-[#16A34A] hover:bg-white/80 font-medium'
                }`}
              >
                {t('planner.filterApproved')}
              </button>
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-secondary-theme">
            <thead className="bg-subtle-theme text-[11px] uppercase font-mono text-muted-theme border-b border-theme">
              <tr>
                <th className="px-4 py-3">{t('planner.officer')}</th>
                <th className="px-4 py-3">{t('planner.dutyLocation')}</th>
                <th className="px-4 py-3">{t('planner.shiftHours')}</th>
                <th className="px-4 py-3">{t('planner.continuousExposure')}</th>
                <th className="px-4 py-3">{t('planner.restBreak')}</th>
                <th className="px-4 py-3">{t('risk.level')}</th>
                <th className="px-4 py-3">{t('planner.complianceStatus')}</th>
                <th className="px-4 py-3 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle-theme font-normal">
              {filteredAssignments.map((da) => {
                const staff = staffList.find((s) => s.id === da.staffId);
                const dp = dutyPoints.find((d) => d.id === da.dutyPointId);
                const dpName = getDutyPointDisplayName(dp, language);
                const rankDisplay = getStaffRankDisplayName(staff?.rank || '', language);
                const risk = riskAssessments[da.dutyPointId];
                const riskCat: RiskCategory = risk?.category || 'Moderate';

                return (
                  <tr key={da.id} className="hover:bg-subtle-theme transition-colors">
                    {/* Staff */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-main-theme">{staff?.fullName || 'Unassigned'}</div>
                      <div className="text-[11px] text-muted-theme font-mono mt-0.5">
                        {staff?.badgeNumber} · {rankDisplay}
                      </div>
                      {staff?.vulnerabilityStatus !== 'standard' && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5 font-medium">
                          ⚠️ {t('planner.vulnerabilityDeclared')}
                        </div>
                      )}
                    </td>

                    {/* Duty Point */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-main-theme">{dpName}</div>
                      <div className="text-[11px] text-muted-theme capitalize mt-0.5">
                        {dp?.shadeCondition.replace('_', ' ')} · {dp?.trafficDensity}
                      </div>
                    </td>

                    {/* Shift Hours */}
                    <td className="px-4 py-3.5 font-mono tabular-nums">
                      <div className="font-medium text-main-theme">
                        {da.startTime} – {da.endTime}
                      </div>
                      <div className="text-[10px] text-muted-theme">{da.shiftDate}</div>
                    </td>

                    {/* Continuous Stint */}
                    <td className="px-4 py-3.5 font-mono tabular-nums">
                      <div
                        className={
                          da.plannedContinuousExposureMinutes > 60 ? 'text-[#DC2626] font-bold' : 'text-main-theme font-medium'
                        }
                      >
                        {formatNumberLocale(da.plannedContinuousExposureMinutes, language, 0)} {t('planner.mins')}
                      </div>
                      <div className="text-[10px] text-muted-theme">{t('planner.unshadedStint')}</div>
                    </td>

                    {/* Break Plan */}
                    <td className="px-4 py-3.5 font-mono">
                      <div className="font-medium text-main-theme">
                        {formatNumberLocale(da.breakDurationMinutes, language, 0)}m {t('planner.shadeRest')}
                      </div>
                      <div className="text-[10px] text-muted-theme">
                        {t('planner.every')} {formatNumberLocale(da.breakFrequencyMinutes, language, 0)}m
                      </div>
                    </td>

                    {/* Risk Level */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          riskCat === 'Extreme'
                            ? 'bg-red-50 dark:bg-red-950/40 text-[#DC2626] border-red-200 dark:border-red-800'
                            : riskCat === 'High'
                            ? 'bg-orange-50 dark:bg-orange-950/40 text-[#F97316] border-orange-200 dark:border-orange-800'
                            : riskCat === 'Moderate'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-[#F59E0B] border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#16A34A] border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {getRiskCategoryName(riskCat, language)} ({risk?.score ?? 50})
                      </span>
                    </td>

                    {/* Safety Status */}
                    <td className="px-4 py-3.5">
                      {da.approvalStatus === 'flagged_overexposure' ? (
                        <div>
                          <div className="inline-flex items-center gap-1 text-[#DC2626] font-semibold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{t('planner.flaggedOverexposure')}</span>
                          </div>
                          <div className="text-[10px] text-muted-theme line-clamp-1 mt-0.5">
                            {da.supervisorNotes}
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[#16A34A] font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('planner.compliant')}</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            updateDutyAssignment(da.id, {
                              approvalStatus:
                                da.approvalStatus === 'flagged_overexposure' ? 'approved' : 'flagged_overexposure'
                            });
                          }}
                          className="p-1 text-muted-theme hover:text-main-theme rounded hover:bg-subtle-theme"
                          title={t('planner.toggleApprovalState')}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteDutyAssignment(da.id)}
                          className="p-1 text-muted-theme hover:text-[#DC2626] rounded hover:bg-subtle-theme"
                          title={t('planner.deleteShift')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-theme text-xs">
                    {t('planner.noAssignments')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Roster Drawer / Summary Section */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-main-theme">{t('planner.registeredOfficers')} ({currentOrgStaff.length})</h3>
            <p className="text-xs text-muted-theme">{t('planner.authorizedPersonnel')}</p>
          </div>
          <button
            onClick={() => setIsAddStaffOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-card-theme border-theme hover:bg-subtle-theme text-secondary-theme flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{t('planner.addOfficer')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentOrgStaff.map((staff) => (
            <div
              key={staff.id}
              className="p-3 bg-subtle-theme border border-theme rounded-lg text-xs flex items-start justify-between"
            >
              <div>
                <div className="font-semibold text-main-theme">{staff.fullName}</div>
                <div className="text-[11px] text-muted-theme font-mono mt-0.5">
                  {staff.badgeNumber} · {getStaffRankDisplayName(staff.rank, language)}
                </div>
                <div className="text-[11px] text-muted-theme mt-1 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-muted-theme" />
                  <span>{staff.contactPhone}</span>
                </div>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
                  staff.availability === 'on_duty'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#16A34A] border-emerald-200 dark:border-emerald-800'
                    : staff.availability === 'rest_recovery'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-[#F59E0B] border-amber-200 dark:border-amber-800'
                    : 'bg-card-theme text-muted-theme border-theme'
                }`}
              >
                {getStaffAvailabilityDisplayName(staff.availability, language)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card-theme border-theme rounded-2xl w-full max-w-md p-6 space-y-4 shadow-modal-theme">
            <h2 className="text-base font-bold text-main-theme">{t('planner.addStaffTitle')}</h2>
            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.fullName')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh K. Shinde"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.badge')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH-12-TP-409"
                  value={staffBadge}
                  onChange={(e) => setStaffBadge(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.rank')}</label>
                <select
                  value={staffRank}
                  onChange={(e) => setStaffRank(e.target.value)}
                  className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                >
                  <option value="Police Constable">{getStaffRankDisplayName('Police Constable', language)}</option>
                  <option value="Head Constable">{getStaffRankDisplayName('Head Constable', language)}</option>
                  <option value="Assistant Sub-Inspector">{getStaffRankDisplayName('Assistant Sub-Inspector', language)}</option>
                  <option value="Traffic Inspector">{getStaffRankDisplayName('Traffic Inspector', language)}</option>
                  <option value="Community Safety Warden">{getStaffRankDisplayName('Community Safety Warden', language)}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.vulnerabilityStatus')}</label>
                <select
                  value={staffVulnerability}
                  onChange={(e) => setStaffVulnerability(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                >
                  <option value="standard">{t('planner.standardHealth')}</option>
                  <option value="heat_sensitized">{t('planner.highSensitivity')}</option>
                  <option value="high_vulnerability">{t('planner.chronicCondition')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.phone')}</label>
                <input
                  type="text"
                  placeholder="+91 98220 12345"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-secondary-theme hover:bg-subtle-theme"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs"
                >
                  {t('planner.createStaffSubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {isAddAssignmentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card-theme border-theme rounded-2xl w-full max-w-md p-6 space-y-4 shadow-modal-theme">
            <h2 className="text-base font-bold text-main-theme">{t('planner.createAssignmentTitle')}</h2>

            {assignmentError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                {assignmentError}
              </div>
            )}

            <form onSubmit={handleCreateAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.selectOfficer')}</label>
                <select
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                >
                  {currentOrgStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.fullName} ({getStaffRankDisplayName(staff.rank, language)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.selectDutyPoint')}</label>
                <select
                  value={assignDutyPointId}
                  onChange={(e) => setAssignDutyPointId(e.target.value)}
                  className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                >
                  {currentLocationDutyPoints.map((dp) => (
                    <option key={dp.id} value={dp.id}>
                      {getDutyPointDisplayName(dp, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.shiftDate')}</label>
                  <input
                    type="date"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono input-theme rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.startTime')}</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono input-theme rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.endTime')}</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono input-theme rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.continuousMinutes')}</label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  step="15"
                  value={continuousDuration}
                  onChange={(e) => setContinuousDuration(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.breakMinutes')}</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    step="5"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary-theme mb-1">{t('planner.breakInterval')}</label>
                  <input
                    type="number"
                    min="30"
                    max="180"
                    step="15"
                    value={breakFrequency}
                    onChange={(e) => setBreakFrequency(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAssignmentOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-secondary-theme hover:bg-subtle-theme"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs"
                >
                  {t('planner.createAssignmentSubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
