import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  LocationRecord,
  DutyPoint,
  WeatherReading,
  RiskAssessment,
  Staff,
  DutyAssignment,
  CoolingFacility,
  Organization,
  OrganizationPolicy,
  RiskCategory,
  ThemeMode,
  AppLanguage
} from '../types';
import {
  INITIAL_LOCATIONS,
  INITIAL_DUTY_POINTS,
  INITIAL_WEATHER,
  INITIAL_STAFF,
  INITIAL_DUTY_ASSIGNMENTS,
  INITIAL_COOLING_FACILITIES,
  INITIAL_ORGANIZATIONS,
  generateInitialAssessments
} from '../services/mockData';
import { calculateHeatRisk, buildAssessmentRecord } from '../services/riskCalculator';
import { getTranslation } from '../services/translations';

interface AppContextType {
  // Language & Localization (English, Hindi, Marathi)
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string) => string;

  // Locations & Duty Points
  locations: LocationRecord[];
  selectedLocationId: string;
  selectedLocation: LocationRecord;
  setSelectedLocationId: (id: string) => void;
  addLocation: (loc: Omit<LocationRecord, 'id'>) => Promise<LocationRecord>;
  dutyPoints: DutyPoint[];
  currentLocationDutyPoints: DutyPoint[];
  addDutyPoint: (dp: Omit<DutyPoint, 'id' | 'registeredDate'>) => DutyPoint;
  updateDutyPoint: (id: string, updates: Partial<DutyPoint>) => void;
  deleteDutyPoint: (id: string) => void;

  // Weather
  weatherMap: Record<string, WeatherReading>;
  currentLocationWeather: WeatherReading;
  refreshWeatherForLocation: (locId: string) => Promise<WeatherReading>;
  updateManualWeather: (locId: string, temp: number, humidity: number, wind: number) => void;
  isWeatherLoading: boolean;

  // Risk Assessments
  riskAssessments: Record<string, RiskAssessment>;
  recalculateRiskForDutyPoint: (
    dpId: string,
    params?: {
      temperature?: number;
      humidity?: number;
      shadeCondition?: 'direct_sun' | 'partial_shade' | 'canopy_shaded';
      exposureDurationMinutes?: number;
      windSpeedKmH?: number;
      trafficDensity?: 'High' | 'Moderate' | 'Low';
    }
  ) => RiskAssessment;

  // Staff & Duty Planner
  staffList: Staff[];
  currentOrgStaff: Staff[];
  addStaff: (staff: Omit<Staff, 'id'>) => Staff;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  dutyAssignments: DutyAssignment[];
  currentLocationDutyAssignments: DutyAssignment[];
  addDutyAssignment: (assignment: Omit<DutyAssignment, 'id'>) => DutyAssignment;
  updateDutyAssignment: (id: string, updates: Partial<DutyAssignment>) => void;
  deleteDutyAssignment: (id: string) => void;
  autoOptimizeSchedule: () => { adjustedCount: number; recommendations: string[] };

  // Cooling Facilities
  coolingFacilities: CoolingFacility[];
  currentLocationCoolingFacilities: CoolingFacility[];
  addCoolingFacility: (fac: Omit<CoolingFacility, 'id'>) => CoolingFacility;
  updateCoolingFacility: (id: string, updates: Partial<CoolingFacility>) => void;
  recalculateCoolingPriorities: () => void;

  // Organization & Policies
  organizations: Organization[];
  activeOrgId: string;
  activeOrg: Organization;
  setActiveOrgId: (id: string) => void;
  updateOrgPolicy: (orgId: string, updates: Partial<OrganizationPolicy>) => void;

  // Global Geocoding & Utilities
  searchGeocode: (q: string) => Promise<any[]>;
  exportDutyAssignmentsToCSV: () => void;
  exportRiskAuditToCSV: () => void;

  // Aggregate Metrics
  dashboardStats: {
    totalMonitoredLocations: number;
    totalRegisteredDutyPoints: number;
    highRiskCount: number;
    modRiskCount: number;
    lowRiskCount: number;
    extremeRiskCount: number;
    locationsNeedingReview: number;
    assignmentsNeedingAttention: number;
    coolingInterventionsPending: number;
  };

  // Theme Mode
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'heatshield_ai_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language Management (English, Hindi, Marathi)
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('heatshield_language') as AppLanguage;
      if (saved === 'hi' || saved === 'mr' || saved === 'en') return saved;
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('heatshield_language', newLang);
    } catch {
      // ignore
    }
  };

  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  // Load from local storage with automatic merge of new initial data (prevents stale storage lockout)
  const [locations, setLocations] = useState<LocationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_locs`);
      if (saved) {
        const parsed: LocationRecord[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((l) => l.id));
        const merged = [...parsed];
        for (const loc of INITIAL_LOCATIONS) {
          if (!existingIds.has(loc.id)) {
            merged.push(loc);
          }
        }
        return merged;
      }
    } catch (e) {
      console.warn('Failed parsing stored locations:', e);
    }
    return INITIAL_LOCATIONS;
  });

  const [selectedLocationId, setSelectedLocationId] = useState<string>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_selected_loc`);
    return saved || 'loc_pune';
  });

  const [dutyPoints, setDutyPoints] = useState<DutyPoint[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_dps`);
      if (saved) {
        const parsed: DutyPoint[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((d) => d.id));
        const merged = [...parsed];
        for (const dp of INITIAL_DUTY_POINTS) {
          if (!existingIds.has(dp.id)) {
            merged.push(dp);
          }
        }
        return merged;
      }
    } catch (e) {
      console.warn('Failed parsing stored duty points:', e);
    }
    return INITIAL_DUTY_POINTS;
  });

  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherReading>>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_weather`);
      if (saved) {
        return { ...INITIAL_WEATHER, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed parsing stored weather:', e);
    }
    return INITIAL_WEATHER;
  });

  const [riskAssessments, setRiskAssessments] = useState<Record<string, RiskAssessment>>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_risks`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const initial = generateInitialAssessments(INITIAL_DUTY_POINTS, INITIAL_WEATHER);
        return { ...initial, ...parsed };
      }
    } catch (e) {
      console.warn('Failed parsing stored risks:', e);
    }
    return generateInitialAssessments(INITIAL_DUTY_POINTS, INITIAL_WEATHER);
  });

  const [staffList, setStaffList] = useState<Staff[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_staff`);
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [dutyAssignments, setDutyAssignments] = useState<DutyAssignment[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_assignments`);
    return saved ? JSON.parse(saved) : INITIAL_DUTY_ASSIGNMENTS;
  });

  const [coolingFacilities, setCoolingFacilities] = useState<CoolingFacility[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_cooling`);
    return saved ? JSON.parse(saved) : INITIAL_COOLING_FACILITIES;
  });

  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_orgs`);
    return saved ? JSON.parse(saved) : INITIAL_ORGANIZATIONS;
  });

  const [activeOrgId, setActiveOrgId] = useState<string>('org_pune');
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);

  // Theme Management (Light by default, with dark & nature modes)
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('heatshield_theme') as ThemeMode;
    return saved === 'dark' || saved === 'nature' || saved === 'light' ? saved : 'light';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('heatshield_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_locs`, JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_selected_loc`, selectedLocationId);
  }, [selectedLocationId]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_dps`, JSON.stringify(dutyPoints));
  }, [dutyPoints]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_weather`, JSON.stringify(weatherMap));
  }, [weatherMap]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_risks`, JSON.stringify(riskAssessments));
  }, [riskAssessments]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_staff`, JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_assignments`, JSON.stringify(dutyAssignments));
  }, [dutyAssignments]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_cooling`, JSON.stringify(coolingFacilities));
  }, [coolingFacilities]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_orgs`, JSON.stringify(organizations));
  }, [organizations]);

  // Active items
  const selectedLocation = useMemo(() => {
    return locations.find((l) => l.id === selectedLocationId) || locations[0];
  }, [locations, selectedLocationId]);

  const activeOrg = useMemo(() => {
    return organizations.find((o) => o.id === activeOrgId) || organizations[0];
  }, [organizations, activeOrgId]);

  const currentLocationDutyPoints = useMemo(() => {
    return dutyPoints.filter((dp) => dp.locationId === selectedLocationId);
  }, [dutyPoints, selectedLocationId]);

  const currentOrgStaff = useMemo(() => {
    return staffList.filter((s) => s.organizationId === activeOrgId);
  }, [staffList, activeOrgId]);

  const currentLocationWeather = useMemo<WeatherReading>(() => {
    if (weatherMap[selectedLocationId]) {
      return weatherMap[selectedLocationId];
    }
    // Default fallback
    return {
      id: `w_${selectedLocationId}`,
      locationId: selectedLocationId,
      temperature: 34.0,
      relativeHumidity: 45,
      apparentTemperature: 37.0,
      windSpeed: 10,
      conditions: 'Fair / Hazy',
      source: 'simulated_fallback',
      providerName: 'Default Fallback Baseline',
      observationTime: new Date().toISOString(),
      isSimulated: true
    };
  }, [weatherMap, selectedLocationId]);

  const currentLocationDutyAssignments = useMemo(() => {
    const locDpIds = new Set(currentLocationDutyPoints.map((d) => d.id));
    return dutyAssignments.filter((da) => locDpIds.has(da.dutyPointId));
  }, [dutyAssignments, currentLocationDutyPoints]);

  const currentLocationCoolingFacilities = useMemo(() => {
    const locDpIds = new Set(currentLocationDutyPoints.map((d) => d.id));
    return coolingFacilities.filter((cf) => cf.locationId === selectedLocationId || locDpIds.has(cf.dutyPointId));
  }, [coolingFacilities, currentLocationDutyPoints, selectedLocationId]);

  // Weather fetching
  const refreshWeatherForLocation = async (locId: string): Promise<WeatherReading> => {
    const targetLoc = locations.find((l) => l.id === locId);
    if (!targetLoc) throw new Error('Location not found');

    setIsWeatherLoading(true);
    try {
      const resp = await fetch(`/api/weather/live?lat=${targetLoc.latitude}&lon=${targetLoc.longitude}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const newWeather: WeatherReading = {
        id: `w_${locId}_${Date.now()}`,
        locationId: locId,
        temperature: data.temperature,
        relativeHumidity: data.relativeHumidity,
        apparentTemperature: data.apparentTemperature || data.temperature,
        windSpeed: data.windSpeed || 8,
        conditions: data.weatherCode ? `Code ${data.weatherCode}` : 'Clear / Live',
        source: data.isSimulated ? 'simulated_fallback' : 'live_verified',
        providerName: data.provider || 'Open-Meteo Global NWP',
        observationTime: data.observationTime || new Date().toISOString(),
        isSimulated: Boolean(data.isSimulated)
      };

      setWeatherMap((prev) => ({ ...prev, [locId]: newWeather }));

      // Recalculate risks for duty points in this location
      const points = dutyPoints.filter((dp) => dp.locationId === locId);
      const updatedAssessments = { ...riskAssessments };
      for (const pt of points) {
        const assessment = buildAssessmentRecord(pt.id, {
          temperature: newWeather.temperature,
          humidity: newWeather.relativeHumidity,
          shadeCondition: pt.shadeCondition,
          exposureDurationMinutes: 60,
          windSpeedKmH: newWeather.windSpeed,
          trafficDensity: pt.trafficDensity,
          dataSource: newWeather.source
        });
        updatedAssessments[pt.id] = assessment;
      }
      setRiskAssessments(updatedAssessments);
      return newWeather;
    } catch (err: any) {
      console.warn('Weather refresh failed, using offline fallback:', err.message);
      const fallbackWeather: WeatherReading = {
        id: `w_${locId}_err`,
        locationId: locId,
        temperature: 36.2,
        relativeHumidity: 48,
        apparentTemperature: 41.0,
        windSpeed: 9.0,
        conditions: 'Offline Model Estimate',
        source: 'simulated_fallback',
        providerName: 'HeatShield Offline Microclimate (Fallback)',
        observationTime: new Date().toISOString(),
        isSimulated: true
      };
      setWeatherMap((prev) => ({ ...prev, [locId]: fallbackWeather }));
      return fallbackWeather;
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const updateManualWeather = (locId: string, temp: number, humidity: number, wind: number) => {
    const manualWeather: WeatherReading = {
      id: `w_man_${locId}_${Date.now()}`,
      locationId: locId,
      temperature: temp,
      relativeHumidity: humidity,
      apparentTemperature: temp + (humidity > 50 ? 4 : 1),
      windSpeed: wind,
      conditions: 'Field Officer Manual Reading',
      source: 'user_manual',
      providerName: 'On-Site Handheld Anemometer / Thermometer',
      observationTime: new Date().toISOString(),
      isSimulated: false
    };

    setWeatherMap((prev) => ({ ...prev, [locId]: manualWeather }));

    // Recompute risks
    const points = dutyPoints.filter((dp) => dp.locationId === locId);
    setRiskAssessments((prev) => {
      const copy = { ...prev };
      for (const pt of points) {
        copy[pt.id] = buildAssessmentRecord(pt.id, {
          temperature: temp,
          humidity: humidity,
          shadeCondition: pt.shadeCondition,
          exposureDurationMinutes: 60,
          windSpeedKmH: wind,
          trafficDensity: pt.trafficDensity,
          dataSource: 'user_manual'
        });
      }
      return copy;
    });
  };

  // Add location
  const addLocation = async (locData: Omit<LocationRecord, 'id'>): Promise<LocationRecord> => {
    const id = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newLoc: LocationRecord = {
      ...locData,
      id
    };
    setLocations((prev) => [...prev, newLoc]);
    setSelectedLocationId(id);

    // Initial weather & assessment fetch
    refreshWeatherForLocation(id).catch(() => {});
    return newLoc;
  };

  // Add Duty Point
  const addDutyPoint = (dpData: Omit<DutyPoint, 'id' | 'registeredDate'>): DutyPoint => {
    const id = `dp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDp: DutyPoint = {
      ...dpData,
      id,
      registeredDate: new Date().toISOString().split('T')[0]
    };
    setDutyPoints((prev) => [...prev, newDp]);

    // Calculate immediate risk assessment
    const w = weatherMap[dpData.locationId] || currentLocationWeather;
    const assessment = buildAssessmentRecord(id, {
      temperature: w.temperature,
      humidity: w.relativeHumidity,
      shadeCondition: dpData.shadeCondition,
      exposureDurationMinutes: 60,
      windSpeedKmH: w.windSpeed,
      trafficDensity: dpData.trafficDensity,
      dataSource: w.source
    });
    setRiskAssessments((prev) => ({ ...prev, [id]: assessment }));

    // Create default facility profile
    const defaultShade: CoolingFacility = {
      id: `cf_${Date.now()}_shade`,
      dutyPointId: id,
      locationId: dpData.locationId,
      facilityType: 'shade_canopy',
      name: `${dpData.name} Overhead Canopy`,
      availability: dpData.shadeCondition === 'canopy_shaded' ? 'available' : 'missing',
      verificationStatus: 'unverified',
      priorityScore: dpData.shadeCondition === 'direct_sun' ? 85 : 30,
      recommendedIntervention: 'Deploy mobile shade canopy or umbrella shelter.',
      implementationStatus: dpData.shadeCondition === 'canopy_shaded' ? 'installed' : 'pending',
      lastInspectedDate: new Date().toISOString().split('T')[0]
    };

    const defaultWater: CoolingFacility = {
      id: `cf_${Date.now()}_water`,
      dutyPointId: id,
      locationId: dpData.locationId,
      facilityType: 'chilled_water_dispenser',
      name: `${dpData.name} Water & Electrolyte Station`,
      availability: 'missing',
      verificationStatus: 'unverified',
      priorityScore: 80,
      recommendedIntervention: 'Install thermal 20L chilled ORS dispenser.',
      implementationStatus: 'pending',
      lastInspectedDate: new Date().toISOString().split('T')[0]
    };

    setCoolingFacilities((prev) => [...prev, defaultShade, defaultWater]);

    return newDp;
  };

  const updateDutyPoint = (id: string, updates: Partial<DutyPoint>) => {
    setDutyPoints((prev) =>
      prev.map((dp) => {
        if (dp.id !== id) return dp;
        const updated = { ...dp, ...updates };
        // Recalculate risk if shade or traffic density changed
        const w = weatherMap[updated.locationId] || currentLocationWeather;
        const assessment = buildAssessmentRecord(id, {
          temperature: w.temperature,
          humidity: w.relativeHumidity,
          shadeCondition: updated.shadeCondition,
          exposureDurationMinutes: 60,
          windSpeedKmH: w.windSpeed,
          trafficDensity: updated.trafficDensity,
          dataSource: w.source
        });
        setRiskAssessments((r) => ({ ...r, [id]: assessment }));
        return updated;
      })
    );
  };

  const deleteDutyPoint = (id: string) => {
    setDutyPoints((prev) => prev.filter((dp) => dp.id !== id));
    setDutyAssignments((prev) => prev.filter((da) => da.dutyPointId !== id));
    setCoolingFacilities((prev) => prev.filter((cf) => cf.dutyPointId !== id));
    setRiskAssessments((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Recalculate risk for a single duty point
  const recalculateRiskForDutyPoint = (
    dpId: string,
    params?: {
      temperature?: number;
      humidity?: number;
      shadeCondition?: 'direct_sun' | 'partial_shade' | 'canopy_shaded';
      exposureDurationMinutes?: number;
      windSpeedKmH?: number;
      trafficDensity?: 'High' | 'Moderate' | 'Low';
    }
  ): RiskAssessment => {
    const dp = dutyPoints.find((d) => d.id === dpId);
    const locId = dp?.locationId || selectedLocationId;
    const w = weatherMap[locId] || currentLocationWeather;

    const temp = params?.temperature ?? w.temperature;
    const humid = params?.humidity ?? w.relativeHumidity;
    const shade = params?.shadeCondition ?? dp?.shadeCondition ?? 'direct_sun';
    const exposure = params?.exposureDurationMinutes ?? 60;
    const wind = params?.windSpeedKmH ?? w.windSpeed;
    const traffic = params?.trafficDensity ?? dp?.trafficDensity ?? 'Moderate';

    const assessment = buildAssessmentRecord(dpId, {
      temperature: temp,
      humidity: humid,
      shadeCondition: shade,
      exposureDurationMinutes: exposure,
      windSpeedKmH: wind,
      trafficDensity: traffic,
      dataSource: params?.temperature ? 'user_manual' : w.source
    });

    setRiskAssessments((prev) => ({ ...prev, [dpId]: assessment }));
    return assessment;
  };

  // Staff operations
  const addStaff = (data: Omit<Staff, 'id'>): Staff => {
    const id = `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newStaff: Staff = { ...data, id };
    setStaffList((prev) => [...prev, newStaff]);
    return newStaff;
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    setStaffList((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  // Duty assignment operations
  const addDutyAssignment = (data: Omit<DutyAssignment, 'id'>): DutyAssignment => {
    const id = `da_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAssignment: DutyAssignment = { ...data, id };

    // Validate against organization policy
    const assessment = riskAssessments[data.dutyPointId];
    const riskCat: RiskCategory = assessment?.category || 'Moderate';
    const maxAllowed =
      riskCat === 'Extreme' || riskCat === 'High'
        ? activeOrg.policies.maxContinuousExposureMinutesHighRisk
        : activeOrg.policies.maxContinuousExposureMinutesModRisk;

    if (data.plannedContinuousExposureMinutes > maxAllowed) {
      newAssignment.approvalStatus = 'flagged_overexposure';
      newAssignment.supervisorNotes = `Flagged: Continuous exposure of ${data.plannedContinuousExposureMinutes}m exceeds policy limit of ${maxAllowed}m for ${riskCat} heat risk.`;
      newAssignment.alternativeSuggestion = `Schedule 15m shade break or split shift with relief officer.`;
    }

    setDutyAssignments((prev) => [...prev, newAssignment]);
    return newAssignment;
  };

  const updateDutyAssignment = (id: string, updates: Partial<DutyAssignment>) => {
    setDutyAssignments((prev) => prev.map((da) => (da.id === id ? { ...da, ...updates } : da)));
  };

  const deleteDutyAssignment = (id: string) => {
    setDutyAssignments((prev) => prev.filter((da) => da.id !== id));
  };

  // Smart duty planner auto-optimizer
  const autoOptimizeSchedule = () => {
    let adjustedCount = 0;
    const recommendations: string[] = [];

    const updated = dutyAssignments.map((da) => {
      const assessment = riskAssessments[da.dutyPointId];
      const riskCat: RiskCategory = assessment?.category || 'Moderate';
      const staffMember = staffList.find((s) => s.id === da.staffId);
      const isVulnerable = staffMember?.vulnerabilityStatus !== 'standard';

      let maxContinuous =
        riskCat === 'Extreme' || riskCat === 'High'
          ? activeOrg.policies.maxContinuousExposureMinutesHighRisk
          : activeOrg.policies.maxContinuousExposureMinutesModRisk;

      if (isVulnerable) {
        maxContinuous = Math.min(maxContinuous, 40);
      }

      if (da.plannedContinuousExposureMinutes > maxContinuous) {
        adjustedCount++;
        const rec = `Optimized ${staffMember?.fullName || 'Officer'}: Continuous exposure capped from ${
          da.plannedContinuousExposureMinutes
        }m to ${maxContinuous}m, inserted ${activeOrg.policies.minRestIntervalMinutes}m mandatory hydration respite.`;
        recommendations.push(rec);

        return {
          ...da,
          plannedContinuousExposureMinutes: maxContinuous,
          breakDurationMinutes: Math.max(da.breakDurationMinutes, activeOrg.policies.minRestIntervalMinutes),
          breakFrequencyMinutes: maxContinuous,
          approvalStatus: 'approved' as const,
          supervisorNotes: `Auto-adjusted per ${activeOrg.policies.policyJurisdictionName}: capped to ${maxContinuous}m continuous stint with mandatory shade recovery.`
        };
      }
      return da;
    });

    setDutyAssignments(updated);
    return { adjustedCount, recommendations };
  };

  // Cooling facilities
  const addCoolingFacility = (facData: Omit<CoolingFacility, 'id'>): CoolingFacility => {
    const id = `cf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newFac: CoolingFacility = { ...facData, id };
    setCoolingFacilities((prev) => [...prev, newFac]);
    return newFac;
  };

  const updateCoolingFacility = (id: string, updates: Partial<CoolingFacility>) => {
    setCoolingFacilities((prev) => prev.map((cf) => (cf.id === id ? { ...cf, ...updates } : cf)));
  };

  const recalculateCoolingPriorities = () => {
    setCoolingFacilities((prev) =>
      prev.map((cf) => {
        const assessment = riskAssessments[cf.dutyPointId];
        const riskScore = assessment?.score || 50;

        let basePriority = riskScore * 0.7;
        if (cf.availability === 'missing') {
          basePriority += 30;
        } else if (cf.availability === 'under_maintenance') {
          basePriority += 20;
        } else {
          basePriority = Math.max(10, basePriority - 25);
        }

        const priorityScore = Math.min(100, Math.round(basePriority));
        return {
          ...cf,
          priorityScore
        };
      })
    );
  };

  // Organization policy updates
  const updateOrgPolicy = (orgId: string, updates: Partial<OrganizationPolicy>) => {
    setOrganizations((prev) =>
      prev.map((org) => {
        if (org.id !== orgId) return org;
        return {
          ...org,
          policies: { ...org.policies, ...updates }
        };
      })
    );
  };

  // Geocode search
  const searchGeocode = async (q: string): Promise<any[]> => {
    try {
      const resp = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`);
      if (!resp.ok) return [];
      const data = await resp.json();
      return data.results || [];
    } catch {
      return [];
    }
  };

  // CSV Export functions
  const exportDutyAssignmentsToCSV = () => {
    const headers = [
      'Assignment ID',
      'Staff Name',
      'Badge Number',
      'Vulnerability Status',
      'Duty Point',
      'Shift Date',
      'Start Time',
      'End Time',
      'Continuous Exposure (min)',
      'Break Frequency (min)',
      'Break Duration (min)',
      'Approval Status',
      'Supervisor Notes'
    ];

    const rows = dutyAssignments.map((da) => {
      const staff = staffList.find((s) => s.id === da.staffId);
      const dp = dutyPoints.find((d) => d.id === da.dutyPointId);
      return [
        da.id,
        `"${staff?.fullName || 'Unassigned'}"`,
        `"${staff?.badgeNumber || 'N/A'}"`,
        staff?.vulnerabilityStatus || 'standard',
        `"${dp?.name || 'Unknown Duty Point'}"`,
        da.shiftDate,
        da.startTime,
        da.endTime,
        da.plannedContinuousExposureMinutes,
        da.breakFrequencyMinutes,
        da.breakDurationMinutes,
        da.approvalStatus,
        `"${(da.supervisorNotes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HeatShield_Duty_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRiskAuditToCSV = () => {
    const headers = [
      'Duty Point ID',
      'Duty Point Name',
      'Location',
      'Country',
      'Latitude',
      'Longitude',
      'Temperature (°C)',
      'Humidity (%)',
      'Heat Risk Score (0-100)',
      'Category',
      'Heat Index (°C)',
      'Est WBGT (°C)',
      'Data Source',
      'Timestamp',
      'Key Precautions'
    ];

    const rows = dutyPoints.map((dp) => {
      const loc = locations.find((l) => l.id === dp.locationId);
      const risk = riskAssessments[dp.id];
      const w = weatherMap[dp.locationId];
      return [
        dp.id,
        `"${dp.name}"`,
        `"${loc?.name || 'N/A'}"`,
        `"${loc?.country || 'N/A'}"`,
        dp.latitude,
        dp.longitude,
        risk?.inputsUsed.temperature ?? w?.temperature ?? 'N/A',
        risk?.inputsUsed.humidity ?? w?.relativeHumidity ?? 'N/A',
        risk?.score ?? 'N/A',
        risk?.category ?? 'N/A',
        risk?.heatIndex ?? 'N/A',
        risk?.estimatedWbgt ?? 'N/A',
        risk?.dataQualityStatus ?? 'N/A',
        risk?.calculationTime ?? 'N/A',
        `"${(risk?.recommendedPrecautions || []).join(' | ').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HeatShield_Risk_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dashboard stats derived from unified data
  const dashboardStats = useMemo(() => {
    let high = 0;
    let mod = 0;
    let low = 0;
    let extreme = 0;

    for (const dp of dutyPoints) {
      const r = riskAssessments[dp.id];
      if (r) {
        if (r.category === 'Extreme') extreme++;
        else if (r.category === 'High') high++;
        else if (r.category === 'Moderate') mod++;
        else low++;
      }
    }

    const locationsNeedingReview = locations.filter((loc) => {
      const pts = dutyPoints.filter((dp) => dp.locationId === loc.id);
      return pts.some((p) => {
        const cat = riskAssessments[p.id]?.category;
        return cat === 'High' || cat === 'Extreme';
      });
    }).length;

    const assignmentsNeedingAttention = dutyAssignments.filter(
      (da) => da.approvalStatus === 'flagged_overexposure' || da.approvalStatus === 'pending_review'
    ).length;

    const coolingInterventionsPending = coolingFacilities.filter(
      (cf) => cf.implementationStatus === 'pending' || cf.availability === 'missing'
    ).length;

    return {
      totalMonitoredLocations: locations.length,
      totalRegisteredDutyPoints: dutyPoints.length,
      highRiskCount: high,
      modRiskCount: mod,
      lowRiskCount: low,
      extremeRiskCount: extreme,
      locationsNeedingReview,
      assignmentsNeedingAttention,
      coolingInterventionsPending
    };
  }, [locations, dutyPoints, riskAssessments, dutyAssignments, coolingFacilities]);

  return (
    <AppContext.Provider
      value={{
        locations,
        selectedLocationId,
        selectedLocation,
        setSelectedLocationId,
        addLocation,
        dutyPoints,
        currentLocationDutyPoints,
        addDutyPoint,
        updateDutyPoint,
        deleteDutyPoint,
        weatherMap,
        currentLocationWeather,
        refreshWeatherForLocation,
        updateManualWeather,
        isWeatherLoading,
        riskAssessments,
        recalculateRiskForDutyPoint,
        staffList,
        currentOrgStaff,
        addStaff,
        updateStaff,
        dutyAssignments,
        currentLocationDutyAssignments,
        addDutyAssignment,
        updateDutyAssignment,
        deleteDutyAssignment,
        autoOptimizeSchedule,
        coolingFacilities,
        currentLocationCoolingFacilities,
        addCoolingFacility,
        updateCoolingFacility,
        recalculateCoolingPriorities,
        organizations,
        activeOrgId,
        activeOrg,
        setActiveOrgId,
        updateOrgPolicy,
        searchGeocode,
        exportDutyAssignmentsToCSV,
        exportRiskAuditToCSV,
        dashboardStats,
        theme,
        setTheme,
        language,
        setLanguage,
        t
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
