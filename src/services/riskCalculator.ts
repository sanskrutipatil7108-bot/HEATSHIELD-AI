import { RiskAssessment, RiskCategory, DataSourceType, RiskContributingFactors } from '../types';

export interface RiskInputParams {
  temperature: number; // °C
  humidity: number; // % 0-100
  shadeCondition: 'direct_sun' | 'partial_shade' | 'canopy_shaded';
  exposureDurationMinutes: number; // Continuous minutes on duty
  windSpeedKmH?: number; // km/h
  trafficDensity?: 'High' | 'Moderate' | 'Low';
  dataSource?: DataSourceType;
}

export interface RiskCalculationResult {
  score: number; // 0-100
  category: RiskCategory;
  heatIndex: number; // Estimated Heat Index in °C
  estimatedWbgt: number; // Estimated WBGT in °C
  contributingFactors: RiskContributingFactors;
  recommendedPrecautions: string[];
  explanation: string;
  dataQualityWarning?: string;
  isDemonstrationModel: true;
}

/**
 * Standard Rothfusz Heat Index Formula (converted to °C)
 * Note: Presented strictly as an empirical demonstration estimate.
 */
export function calculateHeatIndex(tempC: number, humidityPct: number): number {
  const T = (tempC * 9) / 5 + 32; // Fahrenheit
  const R = humidityPct;

  let HI = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + R * 0.094);

  if (HI >= 80) {
    HI =
      -42.379 +
      2.04901523 * T +
      10.14333127 * R -
      0.22475541 * T * R -
      0.00683783 * T * T -
      0.05481717 * R * R +
      0.00122874 * T * T * R +
      0.00085282 * T * R * R -
      0.00000199 * T * T * R * R;

    if (R < 13 && T >= 80 && T <= 112) {
      const adj1 = ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95.0)) / 17);
      HI -= adj1;
    } else if (R > 85 && T >= 80 && T <= 87) {
      const adj2 = ((R - 85) / 10) * ((87 - T) / 5);
      HI += adj2;
    }
  }

  const hiCelsius = ((HI - 32) * 5) / 9;
  return Math.round(hiCelsius * 10) / 10;
}

/**
 * Simplified Outdoor WBGT Demonstration Approximation
 * Estimates Natural Wet Bulb + Globe Temperature + Ambient Temperature
 */
export function estimateOutdoorWbgt(
  tempC: number,
  humidityPct: number,
  isDirectSun: boolean,
  windSpeed: number
): number {
  // Stull (2011) wet-bulb temperature approximation
  const T = tempC;
  const RH = humidityPct;
  const Tw =
    T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035;

  // Globe temp approximation based on direct solar load vs shaded
  const solarElevationLoad = isDirectSun ? 4.5 : 1.2;
  const windCooling = Math.min(2.5, (windSpeed / 10) * 0.8);
  const Tg = T + solarElevationLoad - windCooling;

  // Standard Outdoor WBGT equation: 0.7*Tw + 0.2*Tg + 0.1*T
  const wbgt = 0.7 * Tw + 0.2 * Tg + 0.1 * T;
  return Math.round(wbgt * 10) / 10;
}

/**
 * Universal Demonstration Heat-Risk Score (0 - 100)
 * Reusable across any global coordinate, city, village, or junction.
 */
export function calculateHeatRisk(params: RiskInputParams): RiskCalculationResult {
  const {
    temperature,
    humidity,
    shadeCondition,
    exposureDurationMinutes,
    windSpeedKmH = 8,
    trafficDensity = 'Moderate',
    dataSource = 'user_manual'
  } = params;

  // Validation
  let dataQualityWarning: string | undefined = undefined;
  if (temperature < -20 || temperature > 60) {
    dataQualityWarning = `Extreme temperature reading (${temperature}°C) outside typical operational bounds.`;
  }
  if (humidity < 0 || humidity > 100) {
    dataQualityWarning = `Relative humidity (${humidity}%) must be between 0% and 100%.`;
  }

  const hi = calculateHeatIndex(temperature, Math.max(5, Math.min(100, humidity)));
  const isDirectSun = shadeCondition === 'direct_sun';
  const wbgt = estimateOutdoorWbgt(temperature, humidity, isDirectSun, windSpeedKmH);

  // 1. Ambient Thermal Base (0 - 45 points)
  // 20°C = 0 points, 45°C = 45 points
  const ambientBase = Math.min(45, Math.max(0, (temperature - 20) * 1.8));

  // 2. Humidity Evaporative Suppression (0 - 25 points)
  // Higher humidity suppresses sweat cooling efficiency
  const humidityScore = Math.min(25, Math.max(0, ((humidity - 20) / 80) * 25));

  // 3. Solar Radiation & Shade Factor (0 - 18 points)
  let solarFactor = 0;
  if (shadeCondition === 'direct_sun') {
    solarFactor = 16;
  } else if (shadeCondition === 'partial_shade') {
    solarFactor = 8;
  } else {
    solarFactor = 2; // Under canopy shelter
  }

  // 4. Asphalt & Vehicular Radiant Heat (0 - 12 points)
  // Urban street surfaces and idling vehicle exhaust reflect radiant heat
  let asphaltFactor = 4;
  if (trafficDensity === 'High') {
    asphaltFactor = 12;
  } else if (trafficDensity === 'Moderate') {
    asphaltFactor = 7;
  } else {
    asphaltFactor = 2;
  }

  // 5. Exposure Duration Multiplier (0 - 12 points)
  const durationFactor = Math.min(12, Math.max(0, (exposureDurationMinutes / 60) * 3));

  // 6. Wind Convective Relief (-8 to 0 points)
  const windRelief = Math.min(8, Math.max(0, (windSpeedKmH / 20) * 6));

  // Compute Raw Composite Score (0 - 100)
  const rawScore = ambientBase + humidityScore + solarFactor + asphaltFactor + durationFactor - windRelief;
  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  // Categorization
  let category: RiskCategory;
  if (score < 36) {
    category = 'Low';
  } else if (score < 66) {
    category = 'Moderate';
  } else if (score < 85) {
    category = 'High';
  } else {
    category = 'Extreme';
  }

  // Actionable precautions tailored to score and conditions
  const precautions: string[] = [];
  if (score >= 85) {
    precautions.push('Mandatory 15-minute shaded cool-down rest every 30-45 minutes of active traffic control.');
    precautions.push('Enforce 250ml electrolyte/chilled water consumption every 15 minutes.');
    precautions.push('Deploy immediate canopy umbrella or rotate officer to indoor/mobile shaded post.');
    precautions.push('Monitor officer for acute symptoms (headache, dizziness, confusion, nausea).');
  } else if (score >= 66) {
    precautions.push('Maximum 60 minutes continuous roadway exposure before mandatory shade break.');
    precautions.push('Drink at least 250ml water every 20 minutes; avoid caffeinated beverages.');
    precautions.push('Position traffic directing post under nearest shade or portable umbrella.');
    precautions.push('Ensure cooling water supply is within 30 meters of the duty point.');
  } else if (score >= 36) {
    precautions.push('Standard 15-minute rest interval every 90 minutes of duty.');
    precautions.push('Maintain regular hydration routine (200ml every 30 minutes).');
    precautions.push('Utilize available road island shade structures during peak sun (12:00-15:00).');
  } else {
    precautions.push('Routine outdoor duty protocols; maintain baseline water availability.');
    precautions.push('Monitor weather changes if afternoon temperature is forecasted to rise.');
  }

  if (isDirectSun && score >= 50) {
    precautions.push('Direct sun exposure identified: UV-protective headgear and neck covers strongly recommended.');
  }

  if (trafficDensity === 'High' && temperature >= 32) {
    precautions.push('High traffic exhaust and asphalt re-radiation adds up to +5°C microclimate heat load.');
  }

  // Detailed human-readable explanation of contributing factors
  const explanation = `Heat-Risk Score ${score}/100 (${category}): Driven by ${temperature}°C ambient air, ${humidity}% relative humidity (evaporative cooling suppression: ${Math.round(
    humidityScore
  )} pts), ${shadeCondition.replace('_', ' ')} exposure (${solarFactor} pts), and ${trafficDensity.toLowerCase()} traffic road heat (${asphaltFactor} pts). Exposure duration of ${exposureDurationMinutes} min contributed ${Math.round(
    durationFactor
  )} pts, offset by ${Math.round(windRelief)} pts of convective wind relief (${windSpeedKmH} km/h).`;

  return {
    score,
    category,
    heatIndex: hi,
    estimatedWbgt: wbgt,
    contributingFactors: {
      ambientTempImpact: Math.round(ambientBase),
      humiditySuppressionImpact: Math.round(humidityScore),
      solarExposureImpact: Math.round(solarFactor),
      asphaltRadianceImpact: Math.round(asphaltFactor),
      windMitigationFactor: Math.round(windRelief)
    },
    recommendedPrecautions: precautions,
    explanation,
    dataQualityWarning,
    isDemonstrationModel: true
  };
}

/**
 * Creates a complete RiskAssessment record for a DutyPoint
 */
export function buildAssessmentRecord(
  dutyPointId: string,
  params: RiskInputParams
): RiskAssessment {
  const result = calculateHeatRisk(params);
  return {
    id: `risk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dutyPointId,
    score: result.score,
    category: result.category,
    heatIndex: result.heatIndex,
    estimatedWbgt: result.estimatedWbgt,
    modelFormulaVersion: 'HeatShield-Demonstration-v2.1',
    contributingFactors: result.contributingFactors,
    recommendedPrecautions: result.recommendedPrecautions,
    dataQualityStatus: params.dataSource || 'user_manual',
    calculationTime: new Date().toISOString(),
    inputsUsed: {
      temperature: params.temperature,
      humidity: params.humidity,
      shadeCondition: params.shadeCondition,
      exposureDurationMinutes: params.exposureDurationMinutes,
      windSpeed: params.windSpeedKmH || 8,
      trafficDensity: params.trafficDensity || 'Moderate'
    }
  };
}
