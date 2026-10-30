import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DutyPoint, RiskCategory, LocationRecord } from '../types';
import {
  getRiskCategoryName,
  getShadeConditionName,
  getTrafficDensityName,
  getLocationDisplayName,
  getLocationTypeName,
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
  EyeOff,
  Search,
  Sliders,
  Calendar,
  ArrowUp,
  MousePointer,
  Maximize2
} from 'lucide-react';

interface GlobalHeatMapViewProps {
  onOpenAddPointWithCoords: (lat: number, lon: number) => void;
  onOpenLocationModal?: () => void;
  onNavigateToTab: (tab: string) => void;
}

type TileProvider = 'streets' | 'osm' | 'dark' | 'satellite';

export const GlobalHeatMapView: React.FC<GlobalHeatMapViewProps> = ({
  onOpenAddPointWithCoords,
  onOpenLocationModal,
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
  const markerLookupRef = useRef<Record<string, L.Marker>>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const secondaryTileLayerRef = useRef<L.TileLayer | null>(null);
  const isInitialMount = useRef(true);

  // Risk and Filter states
  const [activeRiskFilter, setActiveRiskFilter] = useState<'all' | 'extreme' | 'high' | 'moderate' | 'low'>('all');
  const [selectedPoint, setSelectedPoint] = useState<DutyPoint | null>(null);
  const [clickCoords, setClickCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [activeTileProvider, setActiveTileProvider] = useState<TileProvider>('osm');
  const [isTileLoading, setIsTileLoading] = useState(false);
  const [tileError, setTileError] = useState<string | null>(null);
  const [isInfoCardCollapsed, setIsInfoCardCollapsed] = useState(false);

  // Wheel Zoom and Scroll states (safe scrolling by default)
  const [isWheelZoomEnabled, setIsWheelZoomEnabled] = useState(false);

  // Location search and category filter state
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState<'all' | 'city' | 'town' | 'village'>('all');

  // Filter locations based on search and type
  const filteredLocationList = useMemo(() => {
    const q = locationSearchQuery.trim().toLowerCase();
    return locations.filter((loc) => {
      const matchesSearch =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q) ||
        (loc.city && loc.city.toLowerCase().includes(q)) ||
        (loc.district && loc.district.toLowerCase().includes(q)) ||
        (loc.state && loc.state.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (locationTypeFilter === 'all') return true;
      if (locationTypeFilter === 'village') return loc.locationType === 'village' || loc.locationType === 'checkpoint';
      return loc.locationType === locationTypeFilter;
    });
  }, [locations, locationSearchQuery, locationTypeFilter]);

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

  // Initialize Leaflet Map (scrollWheelZoom defaults to isWheelZoomEnabled = false to prevent scroll trapping)
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
      attributionControl: true,
      scrollWheelZoom: isWheelZoomEnabled
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

  // Sync scrollWheelZoom with state
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (isWheelZoomEnabled) {
      mapInstanceRef.current.scrollWheelZoom.enable();
    } else {
      mapInstanceRef.current.scrollWheelZoom.disable();
    }
  }, [isWheelZoomEnabled]);

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

  // Render Markers and store reference for focus
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    markerLookupRef.current = {};

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
      markerLookupRef.current[dp.id] = marker;
    }
  }, [dutyPoints, riskAssessments, activeRiskFilter, weatherMap, selectedPoint, language, t, currentLocationWeather]);

  // Handle focus on duty point from lower section
  const handleFocusDutyPoint = (dp: DutyPoint) => {
    setSelectedPoint(dp);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([dp.latitude, dp.longitude], 15, { duration: 1.0 });
      const targetMarker = markerLookupRef.current[dp.id];
      if (targetMarker) {
        targetMarker.openPopup();
      }
    }
    mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // High & Extreme risk counts
  const highRiskCount = dutyPoints.filter((dp) => {
    const cat = riskAssessments[dp.id]?.category;
    return cat === 'High' || cat === 'Extreme';
  }).length;

  return (
    <div className="space-y-4 pb-12">
      {/* ============================================================ */}
      {/* 1. TOP SECTION: ACCESSIBLE LOCATION SELECTOR & SEARCH BAR */}
      {/* ============================================================ */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-2xl p-4 sm:p-5 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-theme pb-3.5 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-[#2563EB] shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-main-theme flex items-center gap-2">
                <span>{t('map.locationSelectHeading')}</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-semibold border border-[#2563EB]/25">
                  {getLocationDisplayName(selectedLocation, language)}
                </span>
              </h2>
              <p className="text-xs text-muted-theme mt-0.5">
                {selectedLocation.country} · {formatNumberLocale(selectedLocation.latitude, language, 4)}°N, {formatNumberLocale(selectedLocation.longitude, language, 4)}°E
              </p>
            </div>
          </div>

          {/* Quick Browse All Locations Button */}
          {onOpenLocationModal && (
            <button
              onClick={onOpenLocationModal}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 self-start md:self-auto"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('map.changeOrAddLocation')}</span>
            </button>
          )}
        </div>

        {/* Search input & Filter category pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 mb-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-theme" />
            <input
              type="text"
              value={locationSearchQuery}
              onChange={(e) => setLocationSearchQuery(e.target.value)}
              placeholder={t('map.searchPlacesPlaceholder')}
              className="w-full pl-8.5 pr-8 py-1.5 text-xs rounded-xl bg-subtle-theme border border-theme text-main-theme placeholder:text-muted-theme focus:outline-hidden focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/30 transition-all"
            />
            {locationSearchQuery && (
              <button
                onClick={() => setLocationSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-theme hover:text-main-theme p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setLocationTypeFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors font-medium ${
                locationTypeFilter === 'all'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'bg-subtle-theme hover:bg-hover-theme text-secondary-theme border border-theme'
              }`}
            >
              {t('map.allLocations')} ({locations.length})
            </button>
            <button
              onClick={() => setLocationTypeFilter('city')}
              className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors font-medium ${
                locationTypeFilter === 'city'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'bg-subtle-theme hover:bg-hover-theme text-secondary-theme border border-theme'
              }`}
            >
              🏙️ {t('map.citiesFilter')} ({locations.filter((l) => l.locationType === 'city').length})
            </button>
            <button
              onClick={() => setLocationTypeFilter('town')}
              className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors font-medium ${
                locationTypeFilter === 'town'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'bg-subtle-theme hover:bg-hover-theme text-secondary-theme border border-theme'
              }`}
            >
              🏘️ {t('map.townsFilter')} ({locations.filter((l) => l.locationType === 'town').length})
            </button>
            <button
              onClick={() => setLocationTypeFilter('village')}
              className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors font-medium ${
                locationTypeFilter === 'village'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'bg-subtle-theme hover:bg-hover-theme text-secondary-theme border border-theme'
              }`}
            >
              🌾 {t('map.villagesFilter')} ({locations.filter((l) => l.locationType === 'village' || l.locationType === 'checkpoint').length})
            </button>
          </div>
        </div>

        {/* Fast Location Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {filteredLocationList.map((loc) => {
            const isCurrent = loc.id === selectedLocation.id;
            const locName = getLocationDisplayName(loc, language);
            return (
              <button
                key={loc.id}
                onClick={() => setSelectedLocationId(loc.id)}
                className={`px-3 py-1.5 text-xs rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-[#2563EB] text-white font-bold shadow-xs border border-[#2563EB]'
                    : 'bg-subtle-theme hover:bg-hover-theme text-main-theme border border-theme font-medium'
                }`}
              >
                <MapPin className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-[#2563EB]'}`} />
                <span>{locName.split(' ')[0]}</span>
                <span className={`text-[10px] ${isCurrent ? 'text-blue-100' : 'text-muted-theme'}`}>
                  ({loc.country})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MAP CONTROL BAR: TILE STYLES, RISK FILTERS & SCROLL MODE */}
      {/* ============================================================ */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-xl p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Tile Layer Providers */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-secondary-theme mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{t('map.layerStreets')}:</span>
          </span>
          <div className="flex items-center gap-1 bg-subtle-theme p-0.5 rounded-lg border border-theme text-xs">
            <button
              onClick={() => setActiveTileProvider('osm')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTileProvider === 'osm'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'text-main-theme hover:bg-card-theme font-medium'
              }`}
            >
              {t('map.layerOsm')}
            </button>
            <button
              onClick={() => setActiveTileProvider('streets')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTileProvider === 'streets'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'text-main-theme hover:bg-card-theme font-medium'
              }`}
            >
              {t('map.layerStreets')}
            </button>
            <button
              onClick={() => setActiveTileProvider('satellite')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTileProvider === 'satellite'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'text-main-theme hover:bg-card-theme font-medium'
              }`}
            >
              {t('map.layerSatellite')}
            </button>
            <button
              onClick={() => setActiveTileProvider('dark')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTileProvider === 'dark'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'text-main-theme hover:bg-card-theme font-medium'
              }`}
            >
              {t('map.layerDark')}
            </button>
          </div>
        </div>

        {/* Right: Risk Filters & Wheel Zoom Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Wheel Zoom Toggle (Prevents Scroll Trapping) */}
          <button
            onClick={() => setIsWheelZoomEnabled(!isWheelZoomEnabled)}
            className={`px-2.5 py-1 text-xs rounded-lg border font-medium flex items-center gap-1.5 transition-all shadow-xs ${
              isWheelZoomEnabled
                ? 'bg-amber-500 text-white border-amber-600 font-semibold'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
            }`}
            title={t('map.wheelScrollHint')}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>{isWheelZoomEnabled ? t('map.wheelZoomActive') : t('map.wheelZoomDisable')}</span>
          </button>

          {/* Risk Level Filters */}
          <div className="flex items-center gap-1 bg-subtle-theme p-0.5 rounded-lg border border-theme text-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveRiskFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeRiskFilter === 'all'
                  ? 'bg-[#2563EB] text-white font-semibold shadow-xs'
                  : 'text-main-theme hover:bg-card-theme font-medium'
              }`}
            >
              {t('common.all')} ({dutyPoints.length})
            </button>
            <button
              onClick={() => setActiveRiskFilter('extreme')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeRiskFilter === 'extreme'
                  ? 'bg-[#DC2626] text-white font-semibold shadow-xs'
                  : 'text-[#DC2626] hover:bg-card-theme font-medium'
              }`}
            >
              {t('risk.extreme')}
            </button>
            <button
              onClick={() => setActiveRiskFilter('high')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeRiskFilter === 'high'
                  ? 'bg-[#F97316] text-white font-semibold shadow-xs'
                  : 'text-[#F97316] hover:bg-card-theme font-medium'
              }`}
            >
              {t('risk.high')}
            </button>
            <button
              onClick={() => setActiveRiskFilter('moderate')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeRiskFilter === 'moderate'
                  ? 'bg-[#F59E0B] text-white font-semibold shadow-xs'
                  : 'text-[#b45309] hover:bg-card-theme font-medium'
              }`}
            >
              {t('risk.moderate')}
            </button>
            <button
              onClick={() => setActiveRiskFilter('low')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeRiskFilter === 'low'
                  ? 'bg-[#16A34A] text-white font-semibold shadow-xs'
                  : 'text-[#16A34A] hover:bg-card-theme font-medium'
              }`}
            >
              {t('risk.low')}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. RESPONSIVE MAP CONTAINER WITH SMOOTH SCROLL ISOLATION */}
      {/* ============================================================ */}
      <div className="relative isolate z-0 w-full h-[420px] sm:h-[480px] lg:h-[530px] bg-white rounded-2xl border border-theme overflow-hidden shadow-card-theme">
        <div
          ref={mapContainerRef}
          style={{ height: '100%', width: '100%' }}
          className="w-full h-full"
        />

        {/* Scroll Safety Hint Overlay Pill */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium shadow-md border border-white/10">
          <MousePointer className="w-3 h-3 text-[#14B8A6]" />
          <span>{isWheelZoomEnabled ? t('map.wheelZoomActive') : t('map.wheelScrollHint')}</span>
        </div>

        {/* Tile Loading Indicator */}
        {isTileLoading && (
          <div className="absolute top-12 right-3 z-20 bg-card-theme/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-theme flex items-center gap-2 text-xs text-[#2563EB] shadow-md animate-in fade-in">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
            <span className="font-medium">{t('map.loadingMapTiles')}</span>
          </div>
        )}

        {/* Tile Error Message Banner */}
        {tileError && (
          <div className="absolute top-12 right-3 z-20 bg-red-50/95 backdrop-blur-md px-3.5 py-2 rounded-lg border border-red-200 flex items-center gap-2 text-xs text-[#DC2626] max-w-sm animate-in fade-in shadow-md">
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

        {/* Floating Instructions Banner (Top-Left) */}
        <div className="absolute top-3 left-3 z-20 bg-card-theme/95 border-theme rounded-xl p-3 text-xs text-main-theme backdrop-blur-md max-w-xs shadow-modal-theme">
          <div className="flex items-center justify-between mb-1 gap-2">
            <div className="font-bold text-main-theme flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#2563EB]" />
              <span>{t('map.title')}</span>
            </div>
            <button
              onClick={() => setIsInfoCardCollapsed(!isInfoCardCollapsed)}
              className="p-0.5 text-muted-theme hover:text-main-theme rounded transition-colors"
              title={isInfoCardCollapsed ? t('map.showInfo') : t('map.hideInfo')}
            >
              {isInfoCardCollapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!isInfoCardCollapsed && (
            <>
              <p className="text-[11px] text-muted-theme leading-relaxed">
                {t('map.clickToPin')}
              </p>
              {clickCoords && (
                <div className="mt-2.5 pt-2 border-t border-theme text-[11px]">
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

        {/* Selected Junction Floating Drawer (Bottom-Right) */}
        {selectedPoint && (
          <div className="absolute bottom-3 right-3 z-20 bg-card-theme/95 border-theme rounded-2xl p-4 text-xs text-main-theme backdrop-blur-md max-w-sm shadow-modal-theme animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-muted-theme">
                  {selectedPoint.type} · {selectedPoint.verificationStatus === 'verified' ? t('common.verified') : t('common.unverified')}
                </span>
                <h4 className="text-sm font-bold text-main-theme mt-0.5">
                  {getDutyPointDisplayName(selectedPoint, language)}
                </h4>
                <div className="text-[11px] font-mono text-[#2563EB] mt-0.5">
                  {formatNumberLocale(selectedPoint.latitude, language, 4)}°N, {formatNumberLocale(selectedPoint.longitude, language, 4)}°E
                </div>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-muted-theme hover:text-main-theme p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center font-mono">
              <div className="p-2 bg-subtle-theme rounded-lg border border-theme">
                <div className="text-[10px] text-muted-theme">{t('risk.score')}</div>
                <div className="text-sm font-bold text-[#DC2626]">
                  {riskAssessments[selectedPoint.id]?.score ?? 50}/100
                </div>
              </div>
              <div className="p-2 bg-subtle-theme rounded-lg border border-theme">
                <div className="text-[10px] text-muted-theme">{t('risk.wbgt')}</div>
                <div className="text-sm font-bold text-[#F59E0B]">
                  {formatNumberLocale(riskAssessments[selectedPoint.id]?.estimatedWbgt ?? 31.0, language, 1)}°C
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-secondary-theme space-y-1">
              <div>
                <span className="text-muted-theme">{t('shade.shadeCondition')}:</span>{' '}
                <span className="font-medium">{getShadeConditionName(selectedPoint.shadeCondition, language)}</span>
              </div>
              <div>
                <span className="text-muted-theme">{t('calculator.trafficDensity')}:</span> {getTrafficDensityName(selectedPoint.trafficDensity, language)}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-theme flex gap-2">
              <button
                onClick={() => onNavigateToTab('planner')}
                className="flex-1 py-1.5 bg-subtle-theme hover:bg-hover-theme border border-theme text-main-theme rounded-lg font-medium text-[11px] transition-colors shadow-xs"
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

      {/* ============================================================ */}
      {/* 4. LOWER SECTION: CURRENT AREA THERMAL STATUS CARD */}
      {/* ============================================================ */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-2xl p-4 sm:p-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-main-theme">
                {getLocationDisplayName(selectedLocation, language)}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-subtle-theme text-muted-theme border border-theme">
                {getLocationTypeName(selectedLocation.locationType, language)}
              </span>
            </div>
            <p className="text-xs text-muted-theme mt-0.5">
              {[selectedLocation.city, selectedLocation.district, selectedLocation.state, selectedLocation.country].filter(Boolean).join(', ')} · {t('map.currentLocationOverview')}
            </p>
          </div>

          {/* Quick change location button accessible below the map */}
          {onOpenLocationModal && (
            <button
              onClick={onOpenLocationModal}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-subtle-theme hover:bg-hover-theme text-[#2563EB] border border-theme shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{t('nav.changeLocation')}</span>
            </button>
          )}
        </div>

        {/* Microclimate & Thermal Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-subtle-theme border border-theme">
            <div className="flex items-center gap-1.5 text-xs text-muted-theme mb-1">
              <Thermometer className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>{t('weather.airTemp')}</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-main-theme">
              {formatNumberLocale(currentLocationWeather.temperature, language, 1)}°C
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-subtle-theme border border-theme">
            <div className="flex items-center gap-1.5 text-xs text-muted-theme mb-1">
              <Umbrella className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{t('weather.humidity')}</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#2563EB]">
              {formatNumberLocale(currentLocationWeather.relativeHumidity, language, 0)}% RH
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-subtle-theme border border-theme">
            <div className="flex items-center gap-1.5 text-xs text-muted-theme mb-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('dashboard.registeredDutyPoints')}</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-main-theme">
              {dutyPoints.length}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-subtle-theme border border-theme">
            <div className="flex items-center gap-1.5 text-xs text-muted-theme mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>{t('dashboard.highExtremeHeat')}</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#DC2626]">
              {highRiskCount}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. MONITORED TRAFFIC JUNCTIONS DIRECTORY (ACCESSIBLE BY SCROLL) */}
      {/* ============================================================ */}
      <div className="bg-card-theme border-theme shadow-card-theme rounded-2xl p-4 sm:p-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-main-theme flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2563EB]" />
              <span>{t('map.junctionsBelowTitle')}</span>
              <span className="text-xs font-normal text-muted-theme">({dutyPoints.length})</span>
            </h3>
            <p className="text-xs text-muted-theme mt-0.5">
              {t('dashboard.directorySubtitle')}
            </p>
          </div>

          {/* Quick tab jump */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('planner')}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-subtle-theme hover:bg-hover-theme border border-theme text-main-theme transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span>{t('nav.planner')}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('cooling')}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-subtle-theme hover:bg-hover-theme border border-theme text-main-theme transition-colors flex items-center gap-1.5"
            >
              <Umbrella className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{t('cooling.title')}</span>
            </button>
          </div>
        </div>

        {/* Junction Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {dutyPoints.map((dp) => {
            const assessment = riskAssessments[dp.id];
            const score = assessment?.score ?? 50;
            const cat: RiskCategory = assessment?.category ?? 'Moderate';
            const catName = getRiskCategoryName(cat, language);
            const dpName = getDutyPointDisplayName(dp, language);
            const w = weatherMap[dp.locationId] || currentLocationWeather;

            let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            if (cat === 'Extreme') badgeClass = 'bg-red-50 text-[#DC2626] border-red-200';
            else if (cat === 'High') badgeClass = 'bg-orange-50 text-[#F97316] border-orange-200';
            else if (cat === 'Moderate') badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

            return (
              <div
                key={dp.id}
                className="p-4 rounded-xl border border-theme bg-subtle-theme hover:border-[#2563EB]/40 transition-all flex flex-col justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono uppercase text-muted-theme">
                      {dp.type} · {dp.verificationStatus === 'verified' ? t('common.verified') : t('common.unverified')}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badgeClass}`}>
                      {catName}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-main-theme leading-snug">
                    {dpName}
                  </h4>

                  <div className="text-[11px] font-mono text-[#2563EB] mt-1">
                    📍 {formatNumberLocale(dp.latitude, language, 4)}°N, {formatNumberLocale(dp.longitude, language, 4)}°E
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-lg bg-card-theme border border-theme text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-muted-theme">{t('risk.score')}</div>
                      <div className="text-sm font-bold text-main-theme mt-0.5">{score} / 100</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-theme">{t('weather.airTemp')}</div>
                      <div className="text-sm font-bold text-main-theme mt-0.5">
                        {formatNumberLocale(w.temperature, language, 1)}°C
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 text-[11px] text-muted-theme space-y-0.5">
                    <div>
                      <span>{t('shade.shadeCondition')}:</span>{' '}
                      <span className="font-semibold text-secondary-theme">{getShadeConditionName(dp.shadeCondition, language)}</span>
                    </div>
                    <div>
                      <span>{t('calculator.trafficDensity')}:</span>{' '}
                      <span className="font-semibold text-secondary-theme">{getTrafficDensityName(dp.trafficDensity, language)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-theme flex items-center gap-2">
                  <button
                    onClick={() => handleFocusDutyPoint(dp)}
                    className="flex-1 py-1.5 px-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                    title={t('map.focusOnMap')}
                  >
                    <Navigation className="w-3 h-3" />
                    <span>{t('map.focusOnMap')}</span>
                  </button>

                  <button
                    onClick={() => onNavigateToTab('planner')}
                    className="py-1.5 px-2.5 bg-card-theme hover:bg-hover-theme border border-theme text-secondary-theme text-xs font-medium rounded-lg transition-colors"
                    title={t('map.openInPlanner')}
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#14B8A6]" />
                  </button>

                  <button
                    onClick={() => onNavigateToTab('calculator')}
                    className="py-1.5 px-2.5 bg-card-theme hover:bg-hover-theme border border-theme text-secondary-theme text-xs font-medium rounded-lg transition-colors"
                    title={t('map.openInCalculator')}
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#2563EB]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. BOTTOM NAVIGATION AND BACK-TO-TOP BUTTON */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-theme">
          <Globe className="w-4 h-4 text-[#2563EB]" />
          <span>
            {t('dashboard.monitoredJurisdiction')}: <strong>{getLocationDisplayName(selectedLocation, language)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenLocationModal && (
            <button
              onClick={onOpenLocationModal}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-subtle-theme hover:bg-hover-theme text-[#2563EB] border border-theme transition-colors shadow-xs"
            >
              {t('nav.changeLocation')}
            </button>
          )}

          <button
            onClick={scrollToTop}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>{t('map.backToTop')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
