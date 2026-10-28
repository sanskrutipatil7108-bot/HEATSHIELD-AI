import {
  LocationRecord,
  DutyPoint,
  WeatherReading,
  Staff,
  DutyAssignment,
  CoolingFacility,
  Organization,
  RiskAssessment
} from '../types';
import { calculateHeatRisk } from './riskCalculator';

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org_pune',
    name: 'Pune Traffic Safety & Climate Directorate',
    country: 'India',
    jurisdiction: 'Maharashtra State Police',
    policies: {
      maxContinuousExposureMinutesHighRisk: 45,
      maxContinuousExposureMinutesModRisk: 90,
      maxContinuousExposureMinutesLowRisk: 180,
      minRestIntervalMinutes: 15,
      mandatoryHydrationIntervalMinutes: 20,
      emergencyEscalationPhone: '+91-20-2612-3333',
      allowHighRiskShiftsWithoutShade: false,
      policyJurisdictionName: 'Maharashtra Traffic Safety Directive 2026-B'
    }
  },
  {
    id: 'org_phoenix',
    name: 'Maricopa Heat Resiliency Transport Bureau',
    country: 'United States',
    jurisdiction: 'City of Phoenix',
    policies: {
      maxContinuousExposureMinutesHighRisk: 30,
      maxContinuousExposureMinutesModRisk: 60,
      maxContinuousExposureMinutesLowRisk: 120,
      minRestIntervalMinutes: 20,
      mandatoryHydrationIntervalMinutes: 15,
      emergencyEscalationPhone: '911 / (602) 262-6151',
      allowHighRiskShiftsWithoutShade: false,
      policyJurisdictionName: 'Phoenix Heat Response Standard 44-A'
    }
  },
  {
    id: 'org_dubai',
    name: 'Dubai RTA Outdoor Safety Division',
    country: 'United Arab Emirates',
    jurisdiction: 'RTA Dubai',
    policies: {
      maxContinuousExposureMinutesHighRisk: 30,
      maxContinuousExposureMinutesModRisk: 60,
      maxContinuousExposureMinutesLowRisk: 120,
      minRestIntervalMinutes: 30,
      mandatoryHydrationIntervalMinutes: 15,
      emergencyEscalationPhone: '999 / 800-9090',
      allowHighRiskShiftsWithoutShade: false,
      policyJurisdictionName: 'Midday Heat Regulatory Standard UAE'
    }
  }
];

export const INITIAL_LOCATIONS: LocationRecord[] = [
  {
    id: 'loc_pune',
    name: 'Pune Metropolitan Region',
    locationType: 'city',
    country: 'India',
    state: 'Maharashtra',
    district: 'Pune District',
    city: 'Pune',
    latitude: 18.5204,
    longitude: 73.8567,
    verificationStatus: 'verified',
    organizationId: 'org_pune'
  },
  {
    id: 'loc_mumbai',
    name: 'Mumbai Coastal Corridor',
    locationType: 'city',
    country: 'India',
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
    city: 'Mumbai',
    latitude: 19.076,
    longitude: 72.8777,
    verificationStatus: 'verified',
    organizationId: 'org_pune'
  },
  {
    id: 'loc_delhi',
    name: 'Delhi Central Traffic Ring',
    locationType: 'city',
    country: 'India',
    state: 'Delhi NCR',
    district: 'New Delhi',
    city: 'New Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    verificationStatus: 'verified',
    organizationId: 'org_pune'
  },
  {
    id: 'loc_bengaluru',
    name: 'Bengaluru Urban Corridor',
    locationType: 'city',
    country: 'India',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946,
    verificationStatus: 'verified',
    organizationId: 'org_pune'
  },
  {
    id: 'loc_lonavala',
    name: 'Lonavala Hill Pass & Ghat',
    locationType: 'town',
    country: 'India',
    state: 'Maharashtra',
    district: 'Pune District',
    city: 'Lonavala',
    latitude: 18.7557,
    longitude: 73.4091,
    verificationStatus: 'verified',
    organizationId: 'org_pune'
  },
  {
    id: 'loc_baramati',
    name: 'Baramati Agro Hub',
    locationType: 'town',
    country: 'India',
    state: 'Maharashtra',
    district: 'Pune District',
    city: 'Baramati',
    latitude: 18.1517,
    longitude: 74.577,
    verificationStatus: 'verified',
    organizationId: 'org_pune'
  },
  {
    id: 'loc_shirdi',
    name: 'Shirdi Pilgrim Highway Hub',
    locationType: 'town',
    country: 'India',
    state: 'Maharashtra',
    district: 'Ahmednagar',
    city: 'Shirdi',
    latitude: 19.7667,
    longitude: 74.4764,
    verificationStatus: 'verified',
    organizationId: 'org_pune'
  },
  {
    id: 'loc_shirur',
    name: 'Shirur Rural Agro Sector',
    locationType: 'village',
    country: 'India',
    state: 'Maharashtra',
    district: 'Pune District',
    city: 'Shirur',
    latitude: 18.8272,
    longitude: 74.3756,
    verificationStatus: 'verified',
    organizationId: 'org_pune'
  },
  {
    id: 'loc_junnar',
    name: 'Junnar Rural Farmbelt Checkpost',
    locationType: 'village',
    country: 'India',
    state: 'Maharashtra',
    district: 'Pune District',
    city: 'Junnar',
    latitude: 19.2067,
    longitude: 73.8767,
    verificationStatus: 'verified',
    organizationId: 'org_pune'
  },
  {
    id: 'loc_khed',
    name: 'Khed Shivapur Highway Rural Post',
    locationType: 'village',
    country: 'India',
    state: 'Maharashtra',
    district: 'Pune District',
    city: 'Khed Shivapur',
    latitude: 18.3512,
    longitude: 73.8524,
    verificationStatus: 'verified',
    organizationId: 'org_pune'
  },
  {
    id: 'loc_phoenix',
    name: 'Phoenix Metro Area',
    locationType: 'city',
    country: 'United States',
    state: 'Arizona',
    district: 'Maricopa County',
    city: 'Phoenix',
    latitude: 33.4484,
    longitude: -112.074,
    verificationStatus: 'verified',
    organizationId: 'org_phoenix'
  },
  {
    id: 'loc_dubai',
    name: 'Dubai Central District',
    locationType: 'city',
    country: 'United Arab Emirates',
    city: 'Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    verificationStatus: 'verified',
    organizationId: 'org_dubai'
  },
  {
    id: 'loc_seville',
    name: 'Seville Historic Center',
    locationType: 'city',
    country: 'Spain',
    state: 'Andalusia',
    district: 'Seville',
    city: 'Seville',
    latitude: 37.3891,
    longitude: -5.9845,
    verificationStatus: 'verified',
    organizationId: 'org_pune'
  },
  {
    id: 'loc_nairobi',
    name: 'Nairobi Central Corridor',
    locationType: 'city',
    country: 'Kenya',
    state: 'Nairobi County',
    city: 'Nairobi',
    latitude: -1.2921,
    longitude: 36.8219,
    verificationStatus: 'verified',
    organizationId: 'org_pune'
  }
];

export const INITIAL_DUTY_POINTS: DutyPoint[] = [
  // Pune Junctions (Demonstration core data)
  {
    id: 'dp_swargate',
    locationId: 'loc_pune',
    name: 'Swargate Chowk Multi-Way Junction',
    type: 'junction',
    latitude: 18.5018,
    longitude: 73.8586,
    verificationStatus: 'verified',
    trafficDensity: 'High',
    shadeCondition: 'direct_sun',
    registeredDate: '2026-03-01'
  },
  {
    id: 'dp_shivajinagar',
    locationId: 'loc_pune',
    name: 'Shivajinagar Station Flyover Intersection',
    type: 'junction',
    latitude: 18.5314,
    longitude: 73.8446,
    verificationStatus: 'verified',
    trafficDensity: 'High',
    shadeCondition: 'partial_shade',
    registeredDate: '2026-03-02'
  },
  {
    id: 'dp_hinjawadi',
    locationId: 'loc_pune',
    name: 'Hinjawadi Phase 1 Tech Gateway Chowk',
    type: 'roundabout',
    latitude: 18.5913,
    longitude: 73.7389,
    verificationStatus: 'verified',
    trafficDensity: 'High',
    shadeCondition: 'direct_sun',
    registeredDate: '2026-03-03'
  },
  {
    id: 'dp_chandani',
    locationId: 'loc_pune',
    name: 'Chandani Chowk Expressway Interchange',
    type: 'junction',
    latitude: 18.5074,
    longitude: 73.7806,
    verificationStatus: 'verified',
    trafficDensity: 'Moderate',
    shadeCondition: 'direct_sun',
    registeredDate: '2026-03-04'
  },
  {
    id: 'dp_deccan',
    locationId: 'loc_pune',
    name: 'Deccan Gymkhana FC Road Crossing',
    type: 'junction',
    latitude: 18.5167,
    longitude: 73.8415,
    verificationStatus: 'verified',
    trafficDensity: 'Moderate',
    shadeCondition: 'canopy_shaded',
    registeredDate: '2026-03-05'
  },

  // Mumbai Point
  {
    id: 'dp_mumbai_dadar',
    locationId: 'loc_mumbai',
    name: 'Dadar TT Circle Arterial Junction',
    type: 'roundabout',
    latitude: 19.0178,
    longitude: 72.8478,
    verificationStatus: 'verified',
    trafficDensity: 'High',
    shadeCondition: 'direct_sun',
    registeredDate: '2026-03-10'
  },
  // Delhi Point
  {
    id: 'dp_delhi_ito',
    locationId: 'loc_delhi',
    name: 'ITO Central Transit Intersection',
    type: 'junction',
    latitude: 28.6289,
    longitude: 77.2415,
    verificationStatus: 'verified',
    trafficDensity: 'High',
    shadeCondition: 'direct_sun',
    registeredDate: '2026-03-12'
  },
  // Bengaluru Point
  {
    id: 'dp_blr_silkboard',
    locationId: 'loc_bengaluru',
    name: 'Silk Board Tech Corridor Crossing',
    type: 'junction',
    latitude: 12.9174,
    longitude: 77.6238,
    verificationStatus: 'verified',
    trafficDensity: 'High',
    shadeCondition: 'partial_shade',
    registeredDate: '2026-03-15'
  },
  // Lonavala Town Point
  {
    id: 'dp_lon_ghat',
    locationId: 'loc_lonavala',
    name: 'Khandala Ghat Bypass Checkpost',
    type: 'checkpoint',
    latitude: 18.7521,
    longitude: 73.3854,
    verificationStatus: 'verified',
    trafficDensity: 'Moderate',
    shadeCondition: 'partial_shade',
    registeredDate: '2026-03-18'
  },
  // Baramati Town Point
  {
    id: 'dp_baramati_midc',
    locationId: 'loc_baramati',
    name: 'Baramati MIDC Agro Industrial Circle',
    type: 'roundabout',
    latitude: 18.175,
    longitude: 74.582,
    verificationStatus: 'verified',
    trafficDensity: 'Moderate',
    shadeCondition: 'direct_sun',
    registeredDate: '2026-03-20'
  },
  // Shirdi Town Point
  {
    id: 'dp_shirdi_bypass',
    locationId: 'loc_shirdi',
    name: 'Shirdi Pilgrim Highway Bypass Chowk',
    type: 'junction',
    latitude: 19.7712,
    longitude: 74.4812,
    verificationStatus: 'verified',
    trafficDensity: 'High',
    shadeCondition: 'direct_sun',
    registeredDate: '2026-03-22'
  },
  // Shirur Village Point
  {
    id: 'dp_shirur_rural',
    locationId: 'loc_shirur',
    name: 'Shirur Agro-Mandi Highway Checkpoint',
    type: 'checkpoint',
    latitude: 18.8312,
    longitude: 74.3789,
    verificationStatus: 'verified',
    trafficDensity: 'Moderate',
    shadeCondition: 'direct_sun',
    registeredDate: '2026-03-25'
  },
  // Junnar Village Point
  {
    id: 'dp_junnar_fort',
    locationId: 'loc_junnar',
    name: 'Junnar Rural Farmbelt Crossing',
    type: 'junction',
    latitude: 19.2089,
    longitude: 73.8795,
    verificationStatus: 'verified',
    trafficDensity: 'Low',
    shadeCondition: 'partial_shade',
    registeredDate: '2026-03-28'
  },
  // Khed Shivapur Village Point
  {
    id: 'dp_khed_plaza',
    locationId: 'loc_khed',
    name: 'Khed Shivapur Rural Highway Post',
    type: 'toll_plaza',
    latitude: 18.3545,
    longitude: 73.8548,
    verificationStatus: 'verified',
    trafficDensity: 'High',
    shadeCondition: 'direct_sun',
    registeredDate: '2026-04-01'
  },

  // Phoenix Point
  {
    id: 'dp_phx_mcdowell',
    locationId: 'loc_phoenix',
    name: 'Central Ave & McDowell Rd Checkpoint',
    type: 'checkpoint',
    latitude: 33.4658,
    longitude: -112.0738,
    verificationStatus: 'verified',
    trafficDensity: 'High',
    shadeCondition: 'direct_sun',
    registeredDate: '2026-04-10'
  },

  // Dubai Point
  {
    id: 'dp_dxb_rigga',
    locationId: 'loc_dubai',
    name: 'Al Rigga & Al Maktoum Arterial Junction',
    type: 'junction',
    latitude: 25.2631,
    longitude: 55.3188,
    verificationStatus: 'verified',
    trafficDensity: 'High',
    shadeCondition: 'direct_sun',
    registeredDate: '2026-05-15'
  },

  // Seville Point
  {
    id: 'dp_sev_armas',
    locationId: 'loc_seville',
    name: 'Plaza de Armas Bus Corridor Checkpoint',
    type: 'checkpoint',
    latitude: 37.3912,
    longitude: -6.0022,
    verificationStatus: 'verified',
    trafficDensity: 'Moderate',
    shadeCondition: 'partial_shade',
    registeredDate: '2026-06-01'
  },

  // Nairobi Point
  {
    id: 'dp_nbo_nyayo',
    locationId: 'loc_nairobi',
    name: 'Nyayo National Stadium Roundabout',
    type: 'roundabout',
    latitude: -1.3065,
    longitude: 36.8252,
    verificationStatus: 'verified',
    trafficDensity: 'High',
    shadeCondition: 'partial_shade',
    registeredDate: '2026-06-15'
  }
];

export const INITIAL_WEATHER: Record<string, WeatherReading> = {
  loc_pune: {
    id: 'w_pune',
    locationId: 'loc_pune',
    temperature: 38.5,
    relativeHumidity: 46,
    apparentTemperature: 44.2,
    windSpeed: 9.2,
    conditions: 'Intense Sun / Dry Haze',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T13:30:00Z',
    isSimulated: false
  },
  loc_mumbai: {
    id: 'w_mumbai',
    locationId: 'loc_mumbai',
    temperature: 34.8,
    relativeHumidity: 72,
    apparentTemperature: 43.6,
    windSpeed: 14.5,
    conditions: 'Humid Coastal Heat',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T13:30:00Z',
    isSimulated: false
  },
  loc_delhi: {
    id: 'w_delhi',
    locationId: 'loc_delhi',
    temperature: 41.2,
    relativeHumidity: 32,
    apparentTemperature: 44.8,
    windSpeed: 10.0,
    conditions: 'Northern Plain Arid Heat',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T13:30:00Z',
    isSimulated: false
  },
  loc_bengaluru: {
    id: 'w_bengaluru',
    locationId: 'loc_bengaluru',
    temperature: 31.0,
    relativeHumidity: 48,
    apparentTemperature: 32.5,
    windSpeed: 12.0,
    conditions: 'Partly Sunny Plateau',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T13:30:00Z',
    isSimulated: false
  },
  loc_lonavala: {
    id: 'w_lonavala',
    locationId: 'loc_lonavala',
    temperature: 32.4,
    relativeHumidity: 54,
    apparentTemperature: 35.1,
    windSpeed: 15.0,
    conditions: 'Hill Pass Solar Radiance',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T13:30:00Z',
    isSimulated: false
  },
  loc_baramati: {
    id: 'w_baramati',
    locationId: 'loc_baramati',
    temperature: 39.2,
    relativeHumidity: 40,
    apparentTemperature: 43.5,
    windSpeed: 8.5,
    conditions: 'Intense Agro Basin Sun',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T13:30:00Z',
    isSimulated: false
  },
  loc_shirdi: {
    id: 'w_shirdi',
    locationId: 'loc_shirdi',
    temperature: 39.8,
    relativeHumidity: 37,
    apparentTemperature: 43.8,
    windSpeed: 9.0,
    conditions: 'Semi-Arid Pilgrim Highway Heat',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T13:30:00Z',
    isSimulated: false
  },
  loc_shirur: {
    id: 'w_shirur',
    locationId: 'loc_shirur',
    temperature: 40.1,
    relativeHumidity: 35,
    apparentTemperature: 44.0,
    windSpeed: 8.0,
    conditions: 'Rural Highway Direct Sun',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T13:30:00Z',
    isSimulated: false
  },
  loc_junnar: {
    id: 'w_junnar',
    locationId: 'loc_junnar',
    temperature: 36.8,
    relativeHumidity: 44,
    apparentTemperature: 39.5,
    windSpeed: 10.5,
    conditions: 'Rural Farm Belt Breeze',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T13:30:00Z',
    isSimulated: false
  },
  loc_khed: {
    id: 'w_khed',
    locationId: 'loc_khed',
    temperature: 37.8,
    relativeHumidity: 45,
    apparentTemperature: 42.0,
    windSpeed: 9.5,
    conditions: 'Highway Asphalt Radiance',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T13:30:00Z',
    isSimulated: false
  },
  loc_phoenix: {
    id: 'w_phoenix',
    locationId: 'loc_phoenix',
    temperature: 42.0,
    relativeHumidity: 18,
    apparentTemperature: 43.8,
    windSpeed: 11.0,
    conditions: 'Extreme Arid Heat',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T14:00:00Z',
    isSimulated: false
  },
  loc_dubai: {
    id: 'w_dubai',
    locationId: 'loc_dubai',
    temperature: 40.5,
    relativeHumidity: 58,
    apparentTemperature: 51.3,
    windSpeed: 12.5,
    conditions: 'Humid Coastal Heatwave',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T13:45:00Z',
    isSimulated: false
  },
  loc_seville: {
    id: 'w_seville',
    locationId: 'loc_seville',
    temperature: 36.8,
    relativeHumidity: 28,
    apparentTemperature: 37.5,
    windSpeed: 8.0,
    conditions: 'Clear Mediterranean Sun',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T15:10:00Z',
    isSimulated: false
  },
  loc_nairobi: {
    id: 'w_nairobi',
    locationId: 'loc_nairobi',
    temperature: 26.5,
    relativeHumidity: 52,
    apparentTemperature: 27.0,
    windSpeed: 14.0,
    conditions: 'Partly Cloudy Breeze',
    source: 'live_verified',
    providerName: 'Open-Meteo Global NWP',
    observationTime: '2026-10-21T12:00:00Z',
    isSimulated: false
  }
};

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'st_01',
    organizationId: 'org_pune',
    badgeNumber: 'MH-12-TP-401',
    fullName: 'Sunil R. Deshmukh',
    rank: 'Assistant Sub-Inspector',
    vulnerabilityStatus: 'heat_sensitized',
    contactPhone: '+91 98230 11201',
    availability: 'on_duty'
  },
  {
    id: 'st_02',
    organizationId: 'org_pune',
    badgeNumber: 'MH-12-TP-408',
    fullName: 'Pooja V. Jadhav',
    rank: 'Head Constable',
    vulnerabilityStatus: 'standard',
    contactPhone: '+91 98230 11208',
    availability: 'on_duty'
  },
  {
    id: 'st_03',
    organizationId: 'org_pune',
    badgeNumber: 'MH-12-TP-512',
    fullName: 'Aniket M. Kulkarni',
    rank: 'Police Constable',
    vulnerabilityStatus: 'standard',
    contactPhone: '+91 98230 11512',
    availability: 'rest_recovery'
  },
  {
    id: 'st_04',
    organizationId: 'org_pune',
    badgeNumber: 'MH-12-TP-520',
    fullName: 'Ramesh K. Shinde',
    rank: 'Police Constable',
    vulnerabilityStatus: 'high_vulnerability',
    contactPhone: '+91 98230 11520',
    availability: 'available'
  },
  {
    id: 'st_05',
    organizationId: 'org_pune',
    badgeNumber: 'MH-12-TP-535',
    fullName: 'Deepika S. More',
    rank: 'Police Constable',
    vulnerabilityStatus: 'standard',
    contactPhone: '+91 98230 11535',
    availability: 'available'
  },
  {
    id: 'st_06',
    organizationId: 'org_phoenix',
    badgeNumber: 'PHX-T-104',
    fullName: 'Marcus Vance',
    rank: 'Traffic Officer II',
    vulnerabilityStatus: 'standard',
    contactPhone: '+1 (602) 555-0192',
    availability: 'on_duty'
  },
  {
    id: 'st_07',
    organizationId: 'org_dubai',
    badgeNumber: 'DXB-RTA-88',
    fullName: 'Tariq Al-Mansoor',
    rank: 'Senior Traffic Inspector',
    vulnerabilityStatus: 'standard',
    contactPhone: '+971 50 555 4321',
    availability: 'on_duty'
  }
];

export const INITIAL_DUTY_ASSIGNMENTS: DutyAssignment[] = [
  {
    id: 'da_01',
    staffId: 'st_01',
    dutyPointId: 'dp_swargate',
    shiftDate: '2026-10-21',
    startTime: '11:00',
    endTime: '15:00',
    breakDurationMinutes: 10,
    breakFrequencyMinutes: 90,
    plannedContinuousExposureMinutes: 90, // Exceeds high-risk policy (45m max)
    approvalStatus: 'flagged_overexposure',
    supervisorNotes: 'Exceeds continuous heat exposure threshold (planned 90m vs maximum 45m). Needs immediate rest break.',
    alternativeSuggestion: 'Rotate with Officer Kulkarni at 12:30 or provide shaded traffic booth respite.'
  },
  {
    id: 'da_02',
    staffId: 'st_02',
    dutyPointId: 'dp_shivajinagar',
    shiftDate: '2026-10-21',
    startTime: '10:00',
    endTime: '16:00',
    breakDurationMinutes: 15,
    breakFrequencyMinutes: 60,
    plannedContinuousExposureMinutes: 60,
    approvalStatus: 'approved',
    supervisorNotes: 'Partial flyover shadow provides baseline relief. 15-minute rotation followed.'
  },
  {
    id: 'da_03',
    staffId: 'st_03',
    dutyPointId: 'dp_hinjawadi',
    shiftDate: '2026-10-21',
    startTime: '12:00',
    endTime: '16:00',
    breakDurationMinutes: 15,
    breakFrequencyMinutes: 45,
    plannedContinuousExposureMinutes: 45,
    approvalStatus: 'approved',
    supervisorNotes: 'Frequent hydration check-in schedule active.'
  },
  {
    id: 'da_04',
    staffId: 'st_04',
    dutyPointId: 'dp_chandani',
    shiftDate: '2026-10-21',
    startTime: '13:00',
    endTime: '17:00',
    breakDurationMinutes: 15,
    breakFrequencyMinutes: 60,
    plannedContinuousExposureMinutes: 75,
    approvalStatus: 'flagged_overexposure',
    supervisorNotes: 'Officer has declared heat-vulnerability status. High-sun duty assignment requires supervisor review.'
  },
  {
    id: 'da_05',
    staffId: 'st_05',
    dutyPointId: 'dp_deccan',
    shiftDate: '2026-10-21',
    startTime: '08:00',
    endTime: '14:00',
    breakDurationMinutes: 20,
    breakFrequencyMinutes: 90,
    plannedContinuousExposureMinutes: 60,
    approvalStatus: 'approved',
    supervisorNotes: 'Canopy shade available at FC Road junction.'
  },
  {
    id: 'da_06',
    staffId: 'st_06',
    dutyPointId: 'dp_phx_mcdowell',
    shiftDate: '2026-10-21',
    startTime: '11:00',
    endTime: '15:00',
    breakDurationMinutes: 20,
    breakFrequencyMinutes: 45,
    plannedContinuousExposureMinutes: 40,
    approvalStatus: 'approved',
    supervisorNotes: 'Misting station active at checkpoint.'
  }
];

export const INITIAL_COOLING_FACILITIES: CoolingFacility[] = [
  {
    id: 'cf_01',
    dutyPointId: 'dp_swargate',
    locationId: 'loc_pune',
    facilityType: 'shade_canopy',
    name: 'North-West Traffic Island Portable Umbrella',
    availability: 'missing',
    verificationStatus: 'verified',
    priorityScore: 92,
    recommendedIntervention: 'Urgent deployment of heavy-duty cantilever shade canopy (min 3m span).',
    implementationStatus: 'pending',
    lastInspectedDate: '2026-10-18'
  },
  {
    id: 'cf_02',
    dutyPointId: 'dp_swargate',
    locationId: 'loc_pune',
    facilityType: 'chilled_water_dispenser',
    name: 'Swargate Chowk 20L Electrolyte Water Point',
    availability: 'available',
    verificationStatus: 'verified',
    priorityScore: 30,
    recommendedIntervention: 'Maintain morning ice and electrolyte sachet replenishment.',
    implementationStatus: 'installed',
    lastInspectedDate: '2026-10-20'
  },
  {
    id: 'cf_03',
    dutyPointId: 'dp_swargate',
    locationId: 'loc_pune',
    facilityType: 'misting_fan',
    name: 'High-Pressure Microclimate Misting Unit',
    availability: 'missing',
    verificationStatus: 'verified',
    priorityScore: 88,
    recommendedIntervention: 'Install solar-battery misting fan system on central divider island.',
    implementationStatus: 'approved',
    lastInspectedDate: '2026-10-18'
  },
  {
    id: 'cf_04',
    dutyPointId: 'dp_hinjawadi',
    locationId: 'loc_pune',
    facilityType: 'cooling_shelter',
    name: 'Hinjawadi Phase 1 Modular Officer Respite Pod',
    availability: 'under_maintenance',
    verificationStatus: 'verified',
    priorityScore: 85,
    recommendedIntervention: 'Complete inverter repair for shaded cooling pod air-filtration fan.',
    implementationStatus: 'in_progress',
    lastInspectedDate: '2026-10-19'
  },
  {
    id: 'cf_05',
    dutyPointId: 'dp_chandani',
    locationId: 'loc_pune',
    facilityType: 'chilled_water_dispenser',
    name: 'Expressway Interchange Water Post',
    availability: 'missing',
    verificationStatus: 'unverified',
    priorityScore: 78,
    recommendedIntervention: 'Install thermal insulated dispenser within 25m of patrol booth.',
    implementationStatus: 'pending',
    lastInspectedDate: '2026-10-15'
  },
  {
    id: 'cf_06',
    dutyPointId: 'dp_deccan',
    locationId: 'loc_pune',
    facilityType: 'shade_canopy',
    name: 'FC Road Permanent Cantilever Canopy',
    availability: 'available',
    verificationStatus: 'verified',
    priorityScore: 15,
    recommendedIntervention: 'Routine weekly inspection; clean canopy fabric of road soot.',
    implementationStatus: 'installed',
    lastInspectedDate: '2026-10-17'
  },
  {
    id: 'cf_07',
    dutyPointId: 'dp_phx_mcdowell',
    locationId: 'loc_phoenix',
    facilityType: 'misting_fan',
    name: 'McDowell Checkpoint Misting Fan Trailer',
    availability: 'available',
    verificationStatus: 'verified',
    priorityScore: 20,
    recommendedIntervention: 'Refill 500-gallon water tank every 48 hours.',
    implementationStatus: 'installed',
    lastInspectedDate: '2026-10-20'
  }
];

/**
 * Computes pre-calculated initial assessments for duty points
 */
export function generateInitialAssessments(
  dutyPoints: DutyPoint[],
  weathers: Record<string, WeatherReading>
): Record<string, RiskAssessment> {
  const map: Record<string, RiskAssessment> = {};

  for (const dp of dutyPoints) {
    const w = weathers[dp.locationId] || {
      temperature: 35.0,
      relativeHumidity: 40,
      apparentTemperature: 38.0,
      windSpeed: 10,
      conditions: 'Moderate Sun',
      source: 'simulated_fallback',
      providerName: 'Offline Fallback',
      observationTime: new Date().toISOString(),
      isSimulated: true
    };

    const calc = calculateHeatRisk({
      temperature: w.temperature,
      humidity: w.relativeHumidity,
      shadeCondition: dp.shadeCondition,
      exposureDurationMinutes: 60,
      windSpeedKmH: w.windSpeed,
      trafficDensity: dp.trafficDensity,
      dataSource: w.source
    });

    map[dp.id] = {
      id: `init_risk_${dp.id}`,
      dutyPointId: dp.id,
      score: calc.score,
      category: calc.category,
      heatIndex: calc.heatIndex,
      estimatedWbgt: calc.estimatedWbgt,
      modelFormulaVersion: 'HeatShield-Demonstration-v2.1',
      contributingFactors: calc.contributingFactors,
      recommendedPrecautions: calc.recommendedPrecautions,
      dataQualityStatus: w.source,
      calculationTime: w.observationTime,
      inputsUsed: {
        temperature: w.temperature,
        humidity: w.relativeHumidity,
        shadeCondition: dp.shadeCondition,
        exposureDurationMinutes: 60,
        windSpeed: w.windSpeed,
        trafficDensity: dp.trafficDensity
      }
    };
  }

  return map;
}
