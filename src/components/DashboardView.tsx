import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { RiskCategory, DutyPoint, RiskAssessment } from '../types';
import {
  getRiskCategoryName,
  getShadeConditionName,
  getTrafficDensityName,
  getLocationDisplayName,
  getDutyPointDisplayName,
  getPrecautionDisplayName,
  formatNumberLocale
} from '../services/translations';
import L from 'leaflet';
import {
  ShieldAlert,
  Flame,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Plus,
  ExternalLink,
  ChevronRight,
  SunMedium,
  Umbrella,
  Users,
  MapPin,
  Map as MapIcon,
  LayoutGrid
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardViewProps {
  onSelectDutyPoint: (dpId: string) => void;
  onOpenLocationModal: () => void;
  onOpenAddPointModal: () => void;
  onNavigateToTab: (tab: string) => void;
}

const DashboardEmbeddedMap: React.FC<{
  points: DutyPoint[];
  location: any;
  riskAssessments: Record<string, RiskAssessment>;
  weatherMap: any;
  currentLocationWeather: any;
  theme: string;
  language: any;
  t: (k: string) => string;
  onSelectDutyPoint: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
}> = ({ points, location, riskAssessments, weatherMap, currentLocationWeather, theme, language, t, onSelectDutyPoint, onNavigateToTab }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isTileLoading, setIsTileLoading] = useState(false);
  const [tileError, setTileError] = useState<string | null>(null);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Clean container children before mount
    container.innerHTML = '';

    const map = L.map(container, {
      center: [location.latitude, location.longitude],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    const tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; OpenStreetMap & GIS datasets'
    }).addTo(map);

    tiles.on('loading', () => {
      setIsTileLoading(true);
      setTileError(null);
    });

    tiles.on('load', () => {
      setIsTileLoading(false);
      setTileError(null);
    });

    tiles.on('tileerror', () => {
      setIsTileLoading(false);
      setTileError(t('dashboard.tileError'));
    });

    for (const dp of points) {
      const assessment = riskAssessments[dp.id];
      const score = assessment?.score ?? 50;
      const cat = assessment?.category ?? 'Moderate';
      const w = weatherMap[dp.locationId] || currentLocationWeather;

      let colorHex = '#16A34A';
      let ringColor = 'rgba(22, 163, 74, 0.45)';
      if (cat === 'Extreme') {
        colorHex = '#DC2626';
        ringColor = 'rgba(220, 38, 38, 0.55)';
      } else if (cat === 'High') {
        colorHex = '#F97316';
        ringColor = 'rgba(249, 115, 22, 0.5)';
      } else if (cat === 'Moderate') {
        colorHex = '#F59E0B';
        ringColor = 'rgba(245, 158, 11, 0.45)';
      }

      const icon = L.divIcon({
        className: 'dashboard-map-pin',
        html: `
          <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#FFFFFF;border:2.5px solid ${colorHex};box-shadow:0 0 10px ${ringColor};cursor:pointer;">
            <span style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:${colorHex};">${score}</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const dpName = getDutyPointDisplayName(dp, language);
      const catLabel = getRiskCategoryName(cat, language);
      const shadeLabel = getShadeConditionName(dp.shadeCondition, language);
      const trafficLabel = getTrafficDensityName(dp.trafficDensity, language);

      const marker = L.marker([dp.latitude, dp.longitude], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:'Plus Jakarta Sans','Noto Sans Devanagari',sans-serif;padding:6px;min-width:240px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 6px;">
            <span style="font-size:10px;color:#64748B;text-transform:uppercase;font-family:'JetBrains Mono',monospace;">${dp.type} · ${dp.verificationStatus === 'verified' ? t('common.verified') : t('common.unverified')}</span>
            <span style="font-size:10px;font-weight:700;color:${colorHex};text-transform:uppercase;">${catLabel}</span>
          </div>
          <div style="font-size:13px;font-weight:700;color:#0F172A;line-height:1.3;">${dpName}</div>
          <div style="font-size:11px;font-family:'JetBrains Mono',monospace;color:#2563EB;margin-top:3px;">
            📍 ${formatNumberLocale(dp.latitude, language, 4)}°N, ${formatNumberLocale(dp.longitude, language, 4)}°E
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:6px 8px;background:#F8FAFC;border-radius:6px;border:1px solid #E2E8F0;">
            <div>
              <div style="font-size:10px;color:#64748B;">${t('risk.score')}</div>
              <div style="font-size:14px;font-weight:800;color:${colorHex};font-family:'JetBrains Mono',monospace;">${score} / 100</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:10px;color:#64748B;">${t('map.weatherReading')}</div>
              <div style="font-size:13px;font-weight:700;color:#0F172A;font-family:'JetBrains Mono',monospace;">${formatNumberLocale(w.temperature, language, 1)}°C</div>
              <div style="font-size:10px;color:#2563EB;font-family:'JetBrains Mono',monospace;">${formatNumberLocale(w.relativeHumidity, language, 0)}% RH</div>
            </div>
          </div>
          <div style="font-size:11px;color:#475569;margin-top:6px;">
            <strong>${t('shade.shadeCondition')}:</strong> ${shadeLabel} · <strong>${t('calculator.trafficDensity')}:</strong> ${trafficLabel}
          </div>
        </div>
      `);
      marker.on('click', () => onSelectDutyPoint(dp.id));
    }

    mapInstanceRef.current = map;
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 150);

    const ro = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    if (mapRef.current) ro.observe(mapRef.current);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points, location, riskAssessments, weatherMap, language]);

  const locationDisplay = getLocationDisplayName(location, language);

  return (
    <div className="relative w-full h-[480px] min-h-[480px] rounded-xl overflow-hidden bg-white border border-[#DCE5EF] shadow-card-theme">
      <div ref={mapRef} style={{ height: '480px', width: '100%', minHeight: '480px' }} className="w-full h-full" />
      <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-[#DCE5EF] shadow-card-theme text-[11px] font-mono text-[#0F172A] flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
        <span>{t('dashboard.liveGeographicRoads')}: {locationDisplay}</span>
      </div>

      {isTileLoading && (
        <div className="absolute top-3 right-3 z-20 bg-card-theme/90 backdrop-blur px-2.5 py-1 rounded-lg border-theme text-[10px] text-teal-600 dark:text-teal-400 flex items-center gap-1.5 shadow-sm">
          <RefreshCw className="w-3 h-3 animate-spin text-teal-500" />
          <span>{t('dashboard.loadingTiles')}</span>
        </div>
      )}

      {tileError && (
        <div className="absolute top-3 right-3 z-20 bg-red-50 dark:bg-red-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-[11px] text-red-700 dark:text-red-300 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span>{tileError}</span>
        </div>
      )}

      <button
        onClick={() => onNavigateToTab('map')}
        className="absolute bottom-3 right-3 z-20 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-md transition-colors flex items-center gap-1.5"
      >
        <span>{t('dashboard.openFullInteractiveMap')}</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectDutyPoint,
  onOpenLocationModal,
  onOpenAddPointModal,
  onNavigateToTab
}) => {
  const {
    selectedLocation,
    currentLocationDutyPoints,
    dutyPoints,
    locations,
    weatherMap,
    currentLocationWeather,
    riskAssessments,
    refreshWeatherForLocation,
    isWeatherLoading,
    dashboardStats,
    dutyAssignments,
    coolingFacilities,
    theme,
    language,
    t
  } = useApp();

  // Filters & Search
  const [searchFilter, setSearchFilter] = useState('');
  const [riskCategoryFilter, setRiskCategoryFilter] = useState<string>('all');
  const [trafficFilter, setTrafficFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'risk_desc' | 'risk_asc' | 'name' | 'temp'>('risk_desc');
  const [scopeFilter, setScopeFilter] = useState<'current_location' | 'all_global'>('current_location');
  const [viewLayout, setViewLayout] = useState<'grid' | 'map'>('grid');

  // List of points based on scope
  const targetPoints = useMemo(() => {
    return scopeFilter === 'current_location' ? currentLocationDutyPoints : dutyPoints;
  }, [scopeFilter, currentLocationDutyPoints, dutyPoints]);

  const selectedLocationDisplay = getLocationDisplayName(selectedLocation, language);

  // Filtered & Sorted Points
  const filteredPoints = useMemo(() => {
    return targetPoints
      .filter((dp) => {
        const assessment = riskAssessments[dp.id];
        const loc = locations.find((l) => l.id === dp.locationId);
        const dpDisplay = getDutyPointDisplayName(dp, language);
        const locDisplay = getLocationDisplayName(loc, language);
        const q = searchFilter.toLowerCase();

        const matchesSearch =
          dp.name.toLowerCase().includes(q) ||
          dpDisplay.toLowerCase().includes(q) ||
          (loc?.name && loc.name.toLowerCase().includes(q)) ||
          locDisplay.toLowerCase().includes(q) ||
          (loc?.country && loc.country.toLowerCase().includes(q));

        const matchesRisk =
          riskCategoryFilter === 'all' || assessment?.category.toLowerCase() === riskCategoryFilter.toLowerCase();

        const matchesTraffic =
          trafficFilter === 'all' || dp.trafficDensity.toLowerCase() === trafficFilter.toLowerCase();

        return matchesSearch && matchesRisk && matchesTraffic;
      })
      .sort((a, b) => {
        const scoreA = riskAssessments[a.id]?.score ?? 0;
        const scoreB = riskAssessments[b.id]?.score ?? 0;
        const weatherA = weatherMap[a.locationId]?.temperature ?? 0;
        const weatherB = weatherMap[b.locationId]?.temperature ?? 0;

        if (sortBy === 'risk_desc') return scoreB - scoreA;
        if (sortBy === 'risk_asc') return scoreA - scoreB;
        if (sortBy === 'temp') return weatherB - weatherA;
        return getDutyPointDisplayName(a, language).localeCompare(getDutyPointDisplayName(b, language));
      });
  }, [targetPoints, searchFilter, riskCategoryFilter, trafficFilter, sortBy, riskAssessments, locations, weatherMap, language]);

  // Chart data: Risk Distribution across monitored points
  const chartData = useMemo(() => {
    const counts = { Low: 0, Moderate: 0, High: 0, Extreme: 0 };
    for (const dp of targetPoints) {
      const cat = riskAssessments[dp.id]?.category || 'Moderate';
      counts[cat]++;
    }
    return [
      { name: `${t('risk.low')} (<36)`, count: counts.Low, color: '#16A34A' },
      { name: `${t('risk.moderate')} (36-65)`, count: counts.Moderate, color: '#F59E0B' },
      { name: `${t('risk.high')} (66-84)`, count: counts.High, color: '#F97316' },
      { name: `${t('risk.extreme')} (85+)`, count: counts.Extreme, color: '#DC2626' }
    ];
  }, [targetPoints, riskAssessments, t]);

  const getRiskColor = (score: number, category: RiskCategory) => {
    if (category === 'Extreme') {
      return {
        bg: 'bg-red-50 dark:bg-red-950/40',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        hex: '#DC2626'
      };
    }
    if (category === 'High') {
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/40',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
        hex: '#F97316'
      };
    }
    if (category === 'Moderate') {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        hex: '#F59E0B'
      };
    }
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      hex: '#16A34A'
    };
  };

  return (
    <div className="space-y-6">
      {/* Hero Operational Banner */}
      <div className="relative rounded-2xl border border-slate-800 bg-[#14213D] text-white overflow-hidden shadow-card-theme">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-8 p-6 lg:p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-[11px] font-semibold uppercase tracking-wider mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                {t('dashboard.activeMonitoringZone')} · {selectedLocationDisplay}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
                {t('app.tagline')}
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                {t('dashboard.empowermentText')}
              </p>

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigateToTab('map')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5 text-teal-300" />
                  <span>{t('dashboard.openFullMap')}</span>
                </button>
                <button
                  onClick={() => setViewLayout(viewLayout === 'map' ? 'grid' : 'map')}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-white transition-colors flex items-center gap-1.5"
                >
                  <MapIcon className="w-3.5 h-3.5 text-teal-400" />
                  <span>{viewLayout === 'map' ? t('dashboard.cardGrid') : t('dashboard.mapView')}</span>
                </button>
              </div>
            </div>

            {/* Quick Context Strip */}
            <div className="mt-6 pt-5 border-t border-slate-700/60 flex flex-wrap items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-teal-400" />
                <span className="text-slate-300">{t('weather.airTemp')}:</span>
                <span className="font-mono font-semibold text-white">
                  {formatNumberLocale(currentLocationWeather.temperature, language, 1)}°C
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-400" />
                <span className="text-slate-300">{t('weather.humidity')}:</span>
                <span className="font-mono font-semibold text-white">
                  {formatNumberLocale(currentLocationWeather.relativeHumidity, language, 0)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-slate-300" />
                <span className="text-slate-300">{t('weather.wind')}:</span>
                <span className="font-mono font-semibold text-white">
                  {formatNumberLocale(currentLocationWeather.windSpeed, language, 1)} km/h
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SunMedium className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">{t('risk.apparentTemp')}:</span>
                <span className="font-mono font-semibold text-amber-300">
                  {formatNumberLocale(currentLocationWeather.apparentTemperature, language, 1)}°C
                </span>
              </div>
            </div>
          </div>

          {/* Hero Image Showcase */}
          <div className="lg:col-span-4 relative min-h-[180px] lg:min-h-full border-t lg:border-t-0 lg:border-l border-slate-700/60">
            <img
              src="/src/assets/images/hero_traffic_heat_junction_1792600965103.jpg"
              alt="Traffic officer managing midday heat junction"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#14213D] via-transparent to-transparent opacity-85" />
            <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-200 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
              {t('dashboard.activeMonitoringZone')}
            </div>
          </div>
        </div>
      </div>

      {/* 6-Metric Operational KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-card-theme border-theme shadow-card-theme p-4 rounded-xl">
          <div className="text-[11px] font-medium text-muted-theme truncate">{t('dashboard.monitoredLocations')}</div>
          <div className="text-2xl font-bold font-mono text-main-theme mt-1 tabular-nums">
            {formatNumberLocale(dashboardStats.totalMonitoredLocations, language, 0)}
          </div>
          <div className="text-[10px] text-muted-theme mt-1">{t('dashboard.multiRegionCoverage')}</div>
        </div>

        <div className="bg-card-theme border-theme shadow-card-theme p-4 rounded-xl">
          <div className="text-[11px] font-medium text-muted-theme truncate">{t('dashboard.registeredDutyPoints')}</div>
          <div className="text-2xl font-bold font-mono text-[#2563EB] mt-1 tabular-nums">
            {formatNumberLocale(dashboardStats.totalRegisteredDutyPoints, language, 0)}
          </div>
          <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-1 font-medium">
            {currentLocationDutyPoints.length} {t('dashboard.inLocation')} {selectedLocationDisplay.split(' ')[0]}
          </div>
        </div>

        <div className="bg-card-theme border-theme shadow-card-theme p-4 rounded-xl">
          <div className="text-[11px] font-medium text-muted-theme truncate">{t('dashboard.highExtremeHeat')}</div>
          <div className="text-2xl font-bold font-mono text-[#DC2626] mt-1 tabular-nums flex items-baseline gap-1.5">
            <span>{formatNumberLocale(dashboardStats.highRiskCount + dashboardStats.extremeRiskCount, language, 0)}</span>
            <span className="text-xs font-normal text-muted-theme">{t('dashboard.posts')}</span>
          </div>
          <div className="text-[10px] text-red-600 dark:text-red-400 mt-1 font-medium">{t('dashboard.requiresShadeBreaks')}</div>
        </div>

        <div className="bg-card-theme border-theme shadow-card-theme p-4 rounded-xl">
          <div className="text-[11px] font-medium text-muted-theme truncate">{t('dashboard.moderateRiskPoints')}</div>
          <div className="text-2xl font-bold font-mono text-[#F59E0B] mt-1 tabular-nums">
            {formatNumberLocale(dashboardStats.modRiskCount, language, 0)}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">{t('dashboard.standardHydration')}</div>
        </div>

        <div className="bg-card-theme border-theme shadow-card-theme p-4 rounded-xl">
          <div className="text-[11px] font-medium text-muted-theme truncate">{t('dashboard.rosterAlerts')}</div>
          <div className="text-2xl font-bold font-mono text-[#F97316] mt-1 tabular-nums">
            {formatNumberLocale(dashboardStats.assignmentsNeedingAttention, language, 0)}
          </div>
          <div className="text-[10px] text-orange-600 dark:text-orange-400 mt-1 font-medium">{t('dashboard.overexposureFlags')}</div>
        </div>

        <div className="bg-card-theme border-theme shadow-card-theme p-4 rounded-xl">
          <div className="text-[11px] font-medium text-muted-theme truncate">{t('dashboard.pendingCoolingShelter')}</div>
          <div className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1 tabular-nums">
            {formatNumberLocale(dashboardStats.coolingInterventionsPending, language, 0)}
          </div>
          <div className="text-[10px] text-muted-theme mt-1">{t('dashboard.awaitingInstallation')}</div>
        </div>
      </div>

      {/* Analytics Breakdown & Quick Action Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recharts Risk Distribution Chart */}
        <div className="lg:col-span-5 bg-card-theme border-theme shadow-card-theme rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-main-theme">{t('dashboard.categoryDistribution')}</h3>
                <p className="text-xs text-muted-theme">
                  {scopeFilter === 'current_location' ? selectedLocationDisplay : t('dashboard.allGlobalRegions')}
                </p>
              </div>
              <div className="flex gap-1 p-0.5 bg-[#E8F2FF] rounded-lg border border-[#DCE5EF]">
                <button
                  onClick={() => setScopeFilter('current_location')}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                    scopeFilter === 'current_location'
                      ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                      : 'text-[#0F172A] hover:bg-white/80 font-medium'
                  }`}
                >
                  {t('dashboard.local')}
                </button>
                <button
                  onClick={() => setScopeFilter('all_global')}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                    scopeFilter === 'all_global'
                      ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                      : 'text-[#0F172A] hover:bg-white/80 font-medium'
                  }`}
                >
                  {t('dashboard.global')}
                </button>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF',
                      borderColor: theme === 'dark' ? '#1E293B' : '#E2E8F0',
                      color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-theme text-[11px] text-muted-theme flex items-center justify-between">
            <span>{t('dashboard.modelEngine')}</span>
            <button
              onClick={() => onNavigateToTab('calculator')}
              className="text-[#2563EB] hover:underline flex items-center gap-1 font-medium"
            >
              <span>{t('dashboard.inspectFormula')}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right: Roster Safety & Cooling Shelter Quick Alerts */}
        <div className="lg:col-span-7 bg-card-theme border-theme shadow-card-theme rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-main-theme">{t('dashboard.supervisorReviewQueue')}</h3>
                <p className="text-xs text-muted-theme">
                  {t('dashboard.reviewQueueSubtitle')}
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('planner')}
                className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 font-medium"
              >
                <span>{t('dashboard.viewFullRoster')}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {dutyAssignments
                .filter((da) => da.approvalStatus === 'flagged_overexposure')
                .slice(0, 2)
                .map((da) => {
                  const dp = dutyPoints.find((d) => d.id === da.dutyPointId);
                  const dpName = getDutyPointDisplayName(dp, language);
                  return (
                    <div
                      key={da.id}
                      className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-red-900 dark:text-red-300">
                            {t('dashboard.overexposureFlag')}: {dpName}
                          </div>
                          <div className="text-red-700 dark:text-red-400 mt-0.5">
                            {da.supervisorNotes || t('dashboard.continuousExceedsLimit')}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigateToTab('planner')}
                        className="px-2.5 py-1 text-[11px] font-medium rounded bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-800 dark:text-red-200 shrink-0 transition-colors"
                      >
                        {t('dashboard.adjust')}
                      </button>
                    </div>
                  );
                })}

              {coolingFacilities
                .filter((cf) => cf.priorityScore >= 80 && cf.availability === 'missing')
                .slice(0, 1)
                .map((cf) => {
                  const dp = dutyPoints.find((d) => d.id === cf.dutyPointId);
                  const dpName = getDutyPointDisplayName(dp, language);
                  return (
                    <div
                      key={cf.id}
                      className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <Umbrella className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-amber-900 dark:text-amber-300">
                            {t('dashboard.criticalInfrastructureDeficit')}: {dpName}
                          </div>
                          <div className="text-amber-700 dark:text-amber-400 mt-0.5">
                            {cf.recommendedIntervention} ({t('dashboard.priorityScoreLabel')}: {cf.priorityScore}/100)
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigateToTab('cooling')}
                        className="px-2.5 py-1 text-[11px] font-medium rounded bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0 transition-colors"
                      >
                        {t('dashboard.prioritize')}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="pt-3 border-t border-theme text-[11px] text-muted-theme flex items-center justify-between">
            <span>{t('dashboard.humanSignoffRequired')}</span>
            <span className="text-teal-600 dark:text-teal-400 font-medium">{t('dashboard.policyCompliant')}</span>
          </div>
        </div>
      </div>

      {/* Junction & Duty Point Directory or Live Embedded Map */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-xl overflow-hidden">
        {/* Table & Directory Header with Filters */}
        <div className="p-5 border-b border-theme space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-main-theme flex items-center gap-2">
                <span>{t('dashboard.outdoorDutyPointsAndJunctions')}</span>
                <span className="text-xs font-mono font-normal text-muted-theme px-2 py-0.5 rounded bg-subtle-theme border-theme">
                  {filteredPoints.length} {t('dashboard.active')}
                </span>
              </h2>
              <p className="text-xs text-muted-theme mt-0.5">
                {t('dashboard.directorySubtitle')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Layout Switcher (Grid vs Map) */}
              <div className="flex items-center gap-1 bg-[#E8F2FF] p-0.5 rounded-lg border border-[#DCE5EF] text-xs">
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                    viewLayout === 'grid'
                      ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                      : 'text-[#0F172A] hover:bg-white/80 font-medium'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{t('dashboard.cardGrid')}</span>
                </button>
                <button
                  onClick={() => setViewLayout('map')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                    viewLayout === 'map'
                      ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                      : 'text-[#0F172A] hover:bg-white/80 font-medium'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>{t('dashboard.mapView')}</span>
                </button>
              </div>

              <button
                onClick={() => refreshWeatherForLocation(selectedLocation.id)}
                disabled={isWeatherLoading}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-card-theme border-theme text-secondary-theme hover:text-main-theme hover:bg-subtle-theme flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isWeatherLoading ? 'animate-spin text-teal-500' : 'text-muted-theme'}`} />
                <span>{t('weather.refreshWeather')}</span>
              </button>
              <button
                onClick={onOpenAddPointModal}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('nav.addJunction')}</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-theme" />
              <input
                type="text"
                placeholder={t('dashboard.searchPlaceholder')}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs input-theme rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={riskCategoryFilter}
                onChange={(e) => setRiskCategoryFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs input-theme rounded-lg focus:outline-none"
              >
                <option value="all">{t('dashboard.allRiskLevels')}</option>
                <option value="extreme">{t('risk.extremeRisk')} (85+)</option>
                <option value="high">{t('risk.highRisk')} (66-84)</option>
                <option value="moderate">{t('risk.moderateRisk')} (36-65)</option>
                <option value="low">{t('risk.lowRisk')} (&lt;36)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={trafficFilter}
                onChange={(e) => setTrafficFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs input-theme rounded-lg focus:outline-none"
              >
                <option value="all">{t('dashboard.allTrafficVolumes')}</option>
                <option value="high">{t('traffic.High')}</option>
                <option value="moderate">{t('traffic.Moderate')}</option>
                <option value="low">{t('traffic.Low')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs input-theme rounded-lg focus:outline-none"
              >
                <option value="risk_desc">{t('dashboard.sortHighToLow')} ↓</option>
                <option value="risk_asc">{t('dashboard.sortLowToHigh')} ↑</option>
                <option value="temp">{t('dashboard.sortTemp')} (°C) ↓</option>
                <option value="name">{t('dashboard.sortName')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Display: Embedded Map or Card Grid */}
        <div className="p-5">
          {viewLayout === 'map' ? (
            <DashboardEmbeddedMap
              points={filteredPoints}
              location={selectedLocation}
              riskAssessments={riskAssessments}
              weatherMap={weatherMap}
              currentLocationWeather={currentLocationWeather}
              theme={theme}
              language={language}
              t={t}
              onSelectDutyPoint={onSelectDutyPoint}
              onNavigateToTab={onNavigateToTab}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPoints.map((dp) => {
                const assessment = riskAssessments[dp.id];
                const loc = locations.find((l) => l.id === dp.locationId) || selectedLocation;
                const locName = getLocationDisplayName(loc, language);
                const dpName = getDutyPointDisplayName(dp, language);
                const w = weatherMap[dp.locationId] || currentLocationWeather;
                const score = assessment?.score ?? 50;
                const category = assessment?.category ?? 'Moderate';
                const colors = getRiskColor(score, category);

                return (
                  <div
                    key={dp.id}
                    onClick={() => onSelectDutyPoint(dp.id)}
                    className="bg-card-theme border-theme hover:border-[#2563EB]/60 rounded-xl p-4.5 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group shadow-card-theme"
                  >
                    <div>
                      {/* Top card bar */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-mono uppercase text-muted-theme flex items-center gap-1.5">
                            <span>{locName.split(' ')[0]}</span>
                            <span>·</span>
                            <span>{dp.type.replace('_', ' ')}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-main-theme mt-1 group-hover:text-[#2563EB] transition-colors">
                            {dpName}
                          </h3>
                        </div>

                        <div
                          className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${colors.bg} ${colors.text} ${colors.border} tabular-nums`}
                        >
                          {score}/100
                        </div>
                      </div>

                      {/* Microclimate values */}
                      <div className="mt-3.5 grid grid-cols-3 gap-2 p-2 bg-subtle-theme rounded-lg border-subtle-theme text-center font-mono">
                        <div>
                          <div className="text-[10px] text-muted-theme">{t('weather.airTemp')}</div>
                          <div className="text-xs font-semibold text-main-theme mt-0.5">
                            {formatNumberLocale(w.temperature, language, 1)}°C
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-theme">{t('weather.humidity')}</div>
                          <div className="text-xs font-semibold text-main-theme mt-0.5">
                            {formatNumberLocale(w.relativeHumidity, language, 0)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-theme">{t('risk.wbgt')}</div>
                          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                            {assessment?.estimatedWbgt ? `${formatNumberLocale(assessment.estimatedWbgt, language, 1)}°C` : '30.2°C'}
                          </div>
                        </div>
                      </div>

                      {/* Environmental factors */}
                      <div className="mt-3 text-xs text-secondary-theme space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-theme">{t('shade.shadeCondition')}:</span>
                          <span className="font-medium">{getShadeConditionName(dp.shadeCondition, language)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-theme">{t('calculator.trafficDensity')}:</span>
                          <span>{getTrafficDensityName(dp.trafficDensity, language)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-theme">{t('weather.lastUpdated')}:</span>
                          <span className="text-muted-theme font-mono text-[11px]">{w.providerName}</span>
                        </div>
                      </div>

                      {/* Precaution */}
                      <div className="mt-3 pt-3 border-t border-theme text-xs">
                        <div className="text-[11px] font-medium text-muted-theme">{t('calculator.actionProtocols')}:</div>
                        <p className="text-secondary-theme line-clamp-2 mt-0.5 text-[11px] leading-relaxed">
                          {getPrecautionDisplayName(assessment?.recommendedPrecautions?.[0] || '', language) || t('dashboard.highExposureAlert')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-theme flex items-center justify-between text-xs text-[#2563EB] group-hover:text-[#1D4ED8] font-medium">
                      <span>{t('common.viewDetails')}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}

              {filteredPoints.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-theme text-xs">
                  {t('dashboard.noDutyPointsFound')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
