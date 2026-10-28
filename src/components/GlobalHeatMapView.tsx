import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { DutyPoint, RiskCategory } from '../types';
import {
  getRiskCategoryName,
  getShadeConditionName,
  getTrafficDensityName,
  getLocationDisplayName,
  getDutyPointDisplayName,
  formatNumberLocale
} from '../services/translations';
import L from 'leaflet';
import {
  Globe,
  Plus,
  Compass,
  Layers,
  Thermometer,
  ShieldAlert,
  Umbrella,
  Navigation,
  RefreshCw,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  X,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';

interface GlobalHeatMapViewProps {
  onOpenAddPointWithCoords: (lat: number, lon: number) => void;
  onNavigateToTab: (tab: string) => void;
}

type TileProvider = 'streets' | 'osm' | 'dark' | 'satellite';

export const GlobalHeatMapView: React.FC<GlobalHeatMapViewProps> = ({
  onOpenAddPointWithCoords,
  onNavigateToTab
}) => {
  const {
    locations,
    selectedLocation,
    setSelectedLocationId,
    dutyPoints,
    weatherMap,
    riskAssessments,
    currentLocationWeather,
    theme,
    language,
    t
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const secondaryTileLayerRef = useRef<L.TileLayer | null>(null);
  const isInitialMount = useRef(true);

  const [activeRiskFilter, setActiveRiskFilter] = useState<'all' | 'extreme' | 'high' | 'moderate' | 'low'>('all');
  const [selectedPoint, setSelectedPoint] = useState<DutyPoint | null>(null);
  const [clickCoords, setClickCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [activeTileProvider, setActiveTileProvider] = useState<TileProvider>('osm');
  const [isTileLoading, setIsTileLoading] = useState(false);
  const [tileError, setTileError] = useState<string | null>(null);
  const [isInfoCardCollapsed, setIsInfoCardCollapsed] = useState(false);

  // Synchronize tile layer with selected provider
  const applyTileLayer = useCallback((provider: TileProvider, map: L.Map) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (secondaryTileLayerRef.current) {
      map.removeLayer(secondaryTileLayerRef.current);
      secondaryTileLayerRef.current = null;
    }

    setIsTileLoading(true);
    setTileError(null);

    let mainUrl = '';
    let mainOptions: L.TileLayerOptions = {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    };
    let overlayUrl: string | null = null;
    let overlayOptions: L.TileLayerOptions = { maxZoom: 19 };

    if (provider === 'osm') {
      mainUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      mainOptions = {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
      };
    } else if (provider === 'streets') {
      mainUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      mainOptions = {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Sources: Esri, DeLorme, NAVTEQ, USGS, Intermap, METI, TomTom'
      };
    } else if (provider === 'satellite') {
      mainUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      mainOptions = {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
      };
      overlayUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
      overlayOptions = {
        maxZoom: 19,
        attribution: ''
      };
    } else if (provider === 'dark') {
      mainUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      mainOptions = {
        maxZoom: 16,
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
      };
      overlayUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';
      overlayOptions = {
        maxZoom: 16,
        attribution: ''
      };
    }

    const layer = L.tileLayer(mainUrl, mainOptions).addTo(map);
    tileLayerRef.current = layer;

    if (overlayUrl) {
      const overlayLayer = L.tileLayer(overlayUrl, overlayOptions).addTo(map);
      secondaryTileLayerRef.current = overlayLayer;
    }

    let failedTileCount = 0;
    layer.on('loading', () => {
      setIsTileLoading(true);
    });

    layer.on('load', () => {
      setIsTileLoading(false);
      setTileError(null);
      failedTileCount = 0;
    });

    layer.on('tileerror', () => {
      failedTileCount++;
      if (failedTileCount > 4) {
        setIsTileLoading(false);
        setTileError(t('map.tileError'));
      }
    });

    return layer;
  }, [t]);

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    container.innerHTML = '';

    const map = L.map(container, {
      center: [selectedLocation.latitude, selectedLocation.longitude],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    mapInstanceRef.current = map;

    applyTileLayer(activeTileProvider, map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    map.on('click', (e: L.LeafletMouseEvent) => {
      setClickCoords({ lat: e.latlng.lat, lon: e.latlng.lng });
    });

    map.invalidateSize();
    const timer1 = setTimeout(() => map.invalidateSize(), 80);
    const timer2 = setTimeout(() => map.invalidateSize(), 300);
    const timer3 = setTimeout(() => map.invalidateSize(), 600);

    const ro = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    ro.observe(container);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      ro.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layer when provider changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (mapInstanceRef.current) {
      applyTileLayer(activeTileProvider, mapInstanceRef.current);
    }
  }, [activeTileProvider, applyTileLayer]);

  // Update center when selected location changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedLocation) {
      mapInstanceRef.current.flyTo(
        [selectedLocation.latitude, selectedLocation.longitude],
        13,
        { duration: 1.0 }
      );
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 350);
    }
  }, [selectedLocation]);

  // Render Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = dutyPoints.filter((dp) => {
      const assessment = riskAssessments[dp.id];
      const cat = assessment?.category?.toLowerCase() || 'moderate';
      if (activeRiskFilter === 'all') return true;
      return cat === activeRiskFilter;
    });

    for (const dp of filtered) {
      const assessment = riskAssessments[dp.id];
      const score = assessment?.score ?? 50;
      const cat: RiskCategory = assessment?.category ?? 'Moderate';
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

      const isSelected = selectedPoint?.id === dp.id;

      const customIcon = L.divIcon({
        className: 'custom-heat-pin',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: #FFFFFF;
            border: 2.5px solid ${colorHex};
            box-shadow: 0 0 ${isSelected ? '18px' : '10px'} ${ringColor};
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <span style="
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              font-weight: 700;
              color: ${colorHex};
            ">${score}</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([dp.latitude, dp.longitude], { icon: customIcon });

      const dpDisplayName = getDutyPointDisplayName(dp, language);
      const catDisplayName = getRiskCategoryName(cat, language);
      const shadeDisplayName = getShadeConditionName(dp.shadeCondition, language);
      const trafficDisplayName = getTrafficDensityName(dp.trafficDensity, language);

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', 'Noto Sans Devanagari', sans-serif; padding: 6px; min-width: 250px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #DCE5EF; padding-bottom: 4px; margin-bottom: 6px;">
            <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; font-family: 'JetBrains Mono', monospace;">
              ${dp.type.toUpperCase()} · ${dp.verificationStatus === 'verified' ? t('common.verified') : t('common.unverified')}
            </span>
            <span style="font-size: 10px; font-weight: 700; color: ${colorHex}; text-transform: uppercase;">
              ${catDisplayName}
            </span>
          </div>

          <div style="font-size: 14px; font-weight: 700; color: #0F172A; line-height: 1.3;">
            ${dpDisplayName}
          </div>

          <div style="font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #2563EB; margin-top: 4px;">
            📍 ${t('map.coordinates')}: ${formatNumberLocale(dp.latitude, language, 4)}°N, ${formatNumberLocale(dp.longitude, language, 4)}°E
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding: 8px; background: #F8FAFC; border-radius: 8px; border: 1px solid #DCE5EF;">
            <div>
              <div style="font-size: 10px; color: #64748B;">${t('map.heatRiskScore')}</div>
              <div style="font-size: 16px; font-weight: 800; color: ${colorHex}; font-family: 'JetBrains Mono', monospace; margin-top: 1px;">
                ${score}<span style="font-size: 11px; font-weight: 500; color: #64748B;"> / 100</span>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; color: #64748B;">${t('map.weatherReading')}</div>
              <div style="font-size: 14px; font-weight: 700; color: #0F172A; font-family: 'JetBrains Mono', monospace; margin-top: 1px;">
                ${formatNumberLocale(w.temperature, language, 1)}°C
              </div>
              <div style="font-size: 10px; color: #2563EB; font-family: 'JetBrains Mono', monospace;">
                ${formatNumberLocale(w.relativeHumidity, language, 0)}% ${t('map.humidityLabel')}
              </div>
            </div>
          </div>

          <div style="font-size: 11px; color: #475569; margin-top: 8px; line-height: 1.4;">
            <strong>${t('shade.shadeCondition')}:</strong> ${shadeDisplayName} · <strong>${t('map.trafficHeat')}:</strong> ${trafficDisplayName}
          </div>

          <div style="font-size: 10px; color: #64748B; margin-top: 4px;">
            ${t('map.source')}: ${w.providerName} (${w.isSimulated ? t('map.simulated') : t('map.liveNwp')})
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedPoint(dp);
      });

      markersLayerRef.current.addLayer(marker);
    }
  }, [dutyPoints, riskAssessments, activeRiskFilter, weatherMap, selectedPoint, language, t]);

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Region Switchers */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-secondary-theme mr-1 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{t('dashboard.monitoredJurisdiction')}:</span>
          </span>
          {locations.map((loc) => {
            const isCurrent = loc.id === selectedLocation.id;
            const locName = getLocationDisplayName(loc, language);
            return (
              <button
                key={loc.id}
                onClick={() => setSelectedLocationId(loc.id)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                  isCurrent
                    ? 'bg-[#2563EB] text-white font-semibold shadow-xs border border-[#2563EB]'
                    : 'bg-[#E8F2FF] hover:bg-[#d8e8fe] text-[#0F172A] border border-[#DCE5EF] font-medium'
                }`}
              >
                {locName.split(' ')[0]} ({loc.country})
              </button>
            );
          })}
        </div>

        {/* Right: Map Style & Risk Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tile layer selector */}
          <div className="flex items-center gap-1 bg-[#E8F2FF] p-0.5 rounded-lg border border-[#DCE5EF] text-xs">
            <button
              onClick={() => setActiveTileProvider('osm')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTileProvider === 'osm'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'text-[#0F172A] hover:bg-white/80 font-medium'
              }`}
            >
              {t('map.layerOsm')}
            </button>
            <button
              onClick={() => setActiveTileProvider('streets')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTileProvider === 'streets'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'text-[#0F172A] hover:bg-white/80 font-medium'
              }`}
            >
              {t('map.layerStreets')}
            </button>
            <button
              onClick={() => setActiveTileProvider('satellite')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTileProvider === 'satellite'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'text-[#0F172A] hover:bg-white/80 font-medium'
              }`}
            >
              {t('map.layerSatellite')}
            </button>
            <button
              onClick={() => setActiveTileProvider('dark')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTileProvider === 'dark'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'text-[#0F172A] hover:bg-white/80 font-medium'
              }`}
            >
              {t('map.layerDark')}
            </button>
          </div>

          {/* Risk Level Filters */}
          <div className="flex items-center gap-1 bg-[#E8F2FF] p-0.5 rounded-lg border border-[#DCE5EF] text-xs">
            <button
              onClick={() => setActiveRiskFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeRiskFilter === 'all'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'text-[#0F172A] hover:bg-white/80 font-medium'
              }`}
            >
              {t('common.all')} ({dutyPoints.length})
            </button>
            <button
              onClick={() => setActiveRiskFilter('extreme')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeRiskFilter === 'extreme'
                  ? 'bg-[#DC2626] text-white font-semibold shadow-xs'
                  : 'text-[#DC2626] hover:bg-white/80 font-medium'
              }`}
            >
              {t('risk.extreme')}
            </button>
            <button
              onClick={() => setActiveRiskFilter('high')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeRiskFilter === 'high'
                  ? 'bg-[#F97316] text-white font-semibold shadow-xs'
                  : 'text-[#F97316] hover:bg-white/80 font-medium'
              }`}
            >
              {t('risk.high')}
            </button>
            <button
              onClick={() => setActiveRiskFilter('moderate')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeRiskFilter === 'moderate'
                  ? 'bg-[#F59E0B] text-white font-semibold shadow-xs'
                  : 'text-[#b45309] hover:bg-white/80 font-medium'
              }`}
            >
              {t('risk.moderate')}
            </button>
            <button
              onClick={() => setActiveRiskFilter('low')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeRiskFilter === 'low'
                  ? 'bg-[#16A34A] text-white font-semibold shadow-xs'
                  : 'text-[#16A34A] hover:bg-white/80 font-medium'
              }`}
            >
              {t('risk.low')}
            </button>
          </div>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="relative w-full h-[600px] min-h-[600px] bg-white rounded-xl border border-[#DCE5EF] overflow-hidden shadow-card-theme">
        <div
          ref={mapContainerRef}
          style={{ height: '600px', width: '100%', minHeight: '600px' }}
          className="w-full h-full"
        />

        {/* Tile Loading Indicator */}
        {isTileLoading && (
          <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#DCE5EF] flex items-center gap-2 text-xs text-[#2563EB] shadow-md animate-in fade-in">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
            <span className="font-medium">{t('map.loadingMapTiles')}</span>
          </div>
        )}

        {/* Tile Error Message Banner */}
        {tileError && (
          <div className="absolute top-4 right-4 z-20 bg-red-50/95 backdrop-blur-md px-3.5 py-2 rounded-lg border border-red-200 flex items-center gap-2 text-xs text-[#DC2626] max-w-sm animate-in fade-in shadow-md">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span className="flex-1 text-[11px] font-medium">{tileError}</span>
            <button
              onClick={() => setActiveTileProvider(activeTileProvider === 'osm' ? 'streets' : 'osm')}
              className="px-2 py-0.5 rounded bg-red-100 hover:bg-red-200 text-[#DC2626] font-semibold text-[10px]"
            >
              {activeTileProvider === 'osm' ? t('map.switchToStreets') : t('map.switchToOsm')}
            </button>
            <button
              onClick={() => setTileError(null)}
              className="p-1 hover:text-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Floating Instructions Banner */}
        <div className="absolute top-4 left-4 z-20 bg-white/95 border border-[#DCE5EF] rounded-xl p-3 text-xs text-[#0F172A] backdrop-blur-md max-w-xs shadow-modal-theme">
          <div className="flex items-center justify-between mb-1">
            <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#2563EB]" />
              <span>{t('map.title')}</span>
            </div>
            <button
              onClick={() => setIsInfoCardCollapsed(!isInfoCardCollapsed)}
              className="p-0.5 text-[#64748B] hover:text-[#0F172A] rounded transition-colors"
              title={isInfoCardCollapsed ? t('map.showInfo') : t('map.hideInfo')}
            >
              {isInfoCardCollapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!isInfoCardCollapsed && (
            <>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                {t('map.clickToPin')}
              </p>
              {clickCoords && (
                <div className="mt-2.5 pt-2 border-t border-[#DCE5EF] text-[11px]">
                  <div className="font-mono text-[#2563EB] font-semibold">
                    {t('map.pinPrompt')}: {formatNumberLocale(clickCoords.lat, language, 4)}°N, {formatNumberLocale(clickCoords.lon, language, 4)}°E
                  </div>
                  <button
                    onClick={() => onOpenAddPointWithCoords(clickCoords.lat, clickCoords.lon)}
                    className="mt-2 w-full py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('map.registerAtPin')}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Selected Junction Inspector Sidebar Drawer */}
        {selectedPoint && (
          <div className="absolute bottom-4 right-4 z-20 bg-white/95 border border-[#DCE5EF] rounded-2xl p-4 text-xs text-[#0F172A] backdrop-blur-md max-w-sm shadow-modal-theme animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#64748B]">
                  {selectedPoint.type} · {selectedPoint.verificationStatus === 'verified' ? t('common.verified') : t('common.unverified')}
                </span>
                <h4 className="text-sm font-bold text-[#0F172A] mt-0.5">
                  {getDutyPointDisplayName(selectedPoint, language)}
                </h4>
                <div className="text-[11px] font-mono text-[#2563EB] mt-0.5">
                  {formatNumberLocale(selectedPoint.latitude, language, 4)}°N, {formatNumberLocale(selectedPoint.longitude, language, 4)}°E
                </div>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-[#64748B] hover:text-[#0F172A] p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center font-mono">
              <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#DCE5EF]">
                <div className="text-[10px] text-[#64748B]">{t('risk.score')}</div>
                <div className="text-sm font-bold text-[#DC2626]">
                  {riskAssessments[selectedPoint.id]?.score ?? 50}/100
                </div>
              </div>
              <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#DCE5EF]">
                <div className="text-[10px] text-[#64748B]">{t('risk.wbgt')}</div>
                <div className="text-sm font-bold text-[#F59E0B]">
                  {formatNumberLocale(riskAssessments[selectedPoint.id]?.estimatedWbgt ?? 31.0, language, 1)}°C
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-[#334155] space-y-1">
              <div>
                <span className="text-[#64748B]">{t('shade.shadeCondition')}:</span>{' '}
                <span className="font-medium">{getShadeConditionName(selectedPoint.shadeCondition, language)}</span>
              </div>
              <div>
                <span className="text-[#64748B]">{t('calculator.trafficDensity')}:</span> {getTrafficDensityName(selectedPoint.trafficDensity, language)}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#DCE5EF] flex gap-2">
              <button
                onClick={() => onNavigateToTab('planner')}
                className="flex-1 py-1.5 bg-[#E8F2FF] hover:bg-[#d8e8fe] border border-[#DCE5EF] text-[#0F172A] rounded-lg font-medium text-[11px] transition-colors shadow-xs"
              >
                {t('map.openInPlanner')}
              </button>
              <button
                onClick={() => onNavigateToTab('cooling')}
                className="flex-1 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg text-[11px] transition-colors shadow-xs"
              >
                {t('cooling.title')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
