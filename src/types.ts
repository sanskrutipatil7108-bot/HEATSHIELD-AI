export type ThemeMode = 'light' | 'dark' | 'nature';

export type AppLanguage = 'en' | 'hi' | 'mr';

export type RiskCategory = 'Low' | 'Moderate' | 'High' | 'Extreme';

export type VerificationStatus = 'verified' | 'manual' | 'unverified' | 'illustrative';

export type DataSourceType = 'live_verified' | 'recent_forecast' | 'user_manual' | 'simulated_fallback';

export interface LocationRecord {
  id: string;
  name: string;
  locationType: 'city' | 'town' | 'village' | 'district' | 'checkpoint' | 'custom';
  country: string;
  state?: string;
  district?: string;
  city?: string;
  latitude: number;
  longitude: number;
  verificationStatus: VerificationStatus;
  organizationId: string;
}

export interface DutyPoint {
  id: string;
  locationId: string;
  name: string;
  type: 'junction' | 'checkpoint' | 'outdoor_post' | 'roundabout' | 'toll_plaza';
  latitude: number;
  longitude: number;
  verificationStatus: VerificationStatus;
  trafficDensity: 'High' | 'Moderate' | 'Low';
  shadeCondition: 'direct_sun' | 'partial_shade' | 'canopy_shaded';
  registeredDate: string;
}

export interface WeatherReading {
  id: string;
  dutyPointId?: string;
  locationId: string;
  temperature: number; // Celsius
  relativeHumidity: number; // Percentage 0-100
  apparentTemperature: number;
  windSpeed: number; // km/h
  conditions: string;
  source: DataSourceType;
  providerName: string;
  observationTime: string;
  isSimulated: boolean;
}

export interface RiskContributingFactors {
  ambientTempImpact: number; // 0-100 scale contribution
  humiditySuppressionImpact: number;
  solarExposureImpact: number;
  asphaltRadianceImpact: number;
  windMitigationFactor: number;
}

export interface RiskAssessment {
  id: string;
  dutyPointId: string;
  score: number; // 0 to 100
  category: RiskCategory;
  heatIndex: number;
  estimatedWbgt: number; // Wet-Bulb Globe Temp approximation
  modelFormulaVersion: string;
  contributingFactors: RiskContributingFactors;
  recommendedPrecautions: string[];
  dataQualityStatus: DataSourceType;
  calculationTime: string;
  inputsUsed: {
    temperature: number;
    humidity: number;
    shadeCondition: string;
    exposureDurationMinutes: number;
    windSpeed: number;
    trafficDensity: string;
  };
}

export interface Staff {
  id: string;
  organizationId: string;
  badgeNumber: string;
  fullName: string;
  rank: string;
  vulnerabilityStatus: 'standard' | 'high_vulnerability' | 'heat_sensitized';
  contactPhone: string;
  availability: 'available' | 'on_duty' | 'rest_recovery' | 'off_duty';
}

export interface DutyAssignment {
  id: string;
  staffId: string;
  dutyPointId: string;
  shiftDate: string;
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "14:00"
  breakDurationMinutes: number;
  breakFrequencyMinutes: number;
  plannedContinuousExposureMinutes: number;
  approvalStatus: 'pending_review' | 'approved' | 'flagged_overexposure' | 'reassigned';
  supervisorNotes?: string;
  alternativeSuggestion?: string;
}

export type FacilityType =
  | 'shade_canopy'
  | 'misting_fan'
  | 'chilled_water_dispenser'
  | 'cooling_shelter'
  | 'first_aid_ors_station';

export interface CoolingFacility {
  id: string;
  dutyPointId: string;
  locationId: string;
  facilityType: FacilityType;
  name: string;
  availability: 'available' | 'under_maintenance' | 'missing';
  verificationStatus: VerificationStatus;
  priorityScore: number; // 0 - 100
  recommendedIntervention: string;
  implementationStatus: 'pending' | 'approved' | 'in_progress' | 'installed';
  lastInspectedDate: string;
}

export interface OrganizationPolicy {
  maxContinuousExposureMinutesHighRisk: number; // e.g. 45
  maxContinuousExposureMinutesModRisk: number; // e.g. 90
  maxContinuousExposureMinutesLowRisk: number; // e.g. 180
  minRestIntervalMinutes: number; // e.g. 15
  mandatoryHydrationIntervalMinutes: number; // e.g. 20
  emergencyEscalationPhone: string;
  allowHighRiskShiftsWithoutShade: boolean;
  policyJurisdictionName: string;
}

export interface Organization {
  id: string;
  name: string;
  country: string;
  jurisdiction: string;
  policies: OrganizationPolicy;
}
