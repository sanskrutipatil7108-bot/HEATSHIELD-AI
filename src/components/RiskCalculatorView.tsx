import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateHeatRisk,
  calculateHeatIndex,
  estimateOutdoorWbgt,
  RiskCalculationResult
} from '../services/riskCalculator';
import { RiskCategory } from '../types';
import {
  getRiskCategoryName,
  getShadeConditionName,
  getTrafficDensityName,
  getLocationDisplayName,
  getDutyPointDisplayName,
  getExplanationDisplayName,
  getPrecautionDisplayName,
  formatNumberLocale
} from '../services/translations';
import {
  Flame,
  Thermometer,
  Droplets,
  Sun,
  Clock,
  Wind,
  Car,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  RefreshCw,
  FileText,
  Sliders
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

export const RiskCalculatorView: React.FC = () => {
  const {
    selectedLocation,
    currentLocationWeather,
    currentLocationDutyPoints,
    recalculateRiskForDutyPoint,
    theme: appTheme,
    language,
    t
  } = useApp();

  // Selected duty point to seed from or manual
  const [selectedPointId, setSelectedPointId] = useState<string>('custom');

  // Input States
  const [temp, setTemp] = useState<number>(currentLocationWeather.temperature);
  const [humidity, setHumidity] = useState<number>(currentLocationWeather.relativeHumidity);
  const [shade, setShade] = useState<'direct_sun' | 'partial_shade' | 'canopy_shaded'>('direct_sun');
  const [duration, setDuration] = useState<number>(60);
  const [wind, setWind] = useState<number>(currentLocationWeather.windSpeed || 8);
  const [traffic, setTraffic] = useState<'High' | 'Moderate' | 'Low'>('High');
  const [dataSourceLabel, setDataSourceLabel] = useState<string>(
    currentLocationWeather.isSimulated ? 'Simulated Baseline (Offline)' : 'Live Observation Preset'
  );

  // Result state
  const [result, setResult] = useState<RiskCalculationResult>(() =>
    calculateHeatRisk({
      temperature: currentLocationWeather.temperature,
      humidity: currentLocationWeather.relativeHumidity,
      shadeCondition: 'direct_sun',
      exposureDurationMinutes: 60,
      windSpeedKmH: currentLocationWeather.windSpeed || 8,
      trafficDensity: 'High'
    })
  );

  const [hasCalculated, setHasCalculated] = useState<boolean>(true);
  const [previousScore, setPreviousScore] = useState<number | null>(null);

  // Handle duty point selection change
  const handleSelectPoint = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPointId(val);

    if (val !== 'custom') {
      const pt = currentLocationDutyPoints.find((d) => d.id === val);
      if (pt) {
        setShade(pt.shadeCondition);
        setTraffic(pt.trafficDensity);
      }
    }
  };

  // Run calculation
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setPreviousScore(result.score);

    const newResult = calculateHeatRisk({
      temperature: Number(temp),
      humidity: Number(humidity),
      shadeCondition: shade,
      exposureDurationMinutes: Number(duration),
      windSpeedKmH: Number(wind),
      trafficDensity: traffic,
      dataSource: 'user_manual'
    });

    setResult(newResult);
    setHasCalculated(true);
    setDataSourceLabel('Manual Parameter Test (User Field Entry)');

    // If a registered duty point was selected, update its stored assessment
    if (selectedPointId !== 'custom') {
      recalculateRiskForDutyPoint(selectedPointId, {
        temperature: Number(temp),
        humidity: Number(humidity),
        shadeCondition: shade,
        exposureDurationMinutes: Number(duration),
        windSpeedKmH: Number(wind),
        trafficDensity: traffic
      });
    }
  };

  // Reset to live current weather
  const handleResetToLive = () => {
    setTemp(currentLocationWeather.temperature);
    setHumidity(currentLocationWeather.relativeHumidity);
    setWind(currentLocationWeather.windSpeed);
    setDataSourceLabel(
      currentLocationWeather.isSimulated
        ? 'Offline Simulated Baseline'
        : `Verified Live NWP (${currentLocationWeather.providerName})`
    );
  };

  // Contributing factors chart format using defined risk colors
  const factorChartData = [
    { factor: t('weather.airTemp'), points: result.contributingFactors.ambientTempImpact, fill: '#DC2626' },
    { factor: t('weather.humidity'), points: result.contributingFactors.humiditySuppressionImpact, fill: '#2563EB' },
    { factor: t('weather.solarRadiation'), points: result.contributingFactors.solarExposureImpact, fill: '#F59E0B' },
    { factor: t('calculator.trafficDensity'), points: result.contributingFactors.asphaltRadianceImpact, fill: '#F97316' },
    { factor: t('weather.wind'), points: -result.contributingFactors.windMitigationFactor, fill: '#16A34A' }
  ];

  const getScoreTheme = (category: RiskCategory) => {
    if (category === 'Extreme') {
      return {
        text: 'text-[#DC2626]',
        bg: 'bg-red-50 dark:bg-red-950/40',
        border: 'border-red-200 dark:border-red-800'
      };
    }
    if (category === 'High') {
      return {
        text: 'text-[#F97316]',
        bg: 'bg-orange-50 dark:bg-orange-950/40',
        border: 'border-orange-200 dark:border-orange-800'
      };
    }
    if (category === 'Moderate') {
      return {
        text: 'text-[#F59E0B]',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800'
      };
    }
    return {
      text: 'text-[#16A34A]',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800'
    };
  };

  const scoreTheme = getScoreTheme(result.category);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-mono uppercase text-teal-600 dark:text-teal-400 font-semibold">
            {language === 'hi' ? 'इंटरैक्टिव जोखिम कैलकुलेटर' : language === 'mr' ? 'परस्पर संवादी धोका कॅल्क्युलेटर' : 'Interactive Risk Sandbox'} · {getLocationDisplayName(selectedLocation, language)}
          </div>
          <h1 className="text-2xl font-bold text-main-theme tracking-tight">
            {t('calculator.title')}
          </h1>
          <p className="text-xs text-muted-theme mt-1">
            {t('calculator.subtitle')}
          </p>
        </div>

        <button
          onClick={handleResetToLive}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-card-theme border-theme text-secondary-theme hover:text-main-theme hover:bg-subtle-theme flex items-center gap-1.5 self-start sm:self-auto transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-teal-500" />
          <span>{t('calculator.resetDefaults')}</span>
        </button>
      </div>

      {/* Mandatory Scientific Disclaimer Notice */}
      <div className="p-4 rounded-xl bg-card-theme border-theme shadow-card-theme text-xs text-secondary-theme flex items-start gap-3">
        <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-main-theme">{t('app.modelBadge')}:</div>
          <p className="text-muted-theme leading-relaxed text-[11px]">
            {t('nugen.disclaimer')}
          </p>
        </div>
      </div>

      {/* Main 2-Column Split: Inputs Form vs Live Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Parameters Form (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-card-theme border-theme shadow-card-theme rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-theme">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm font-semibold text-main-theme">{t('calculator.parameters')}</h2>
            </div>
            <span className="text-[11px] font-mono text-muted-theme">{dataSourceLabel}</span>
          </div>

          <form onSubmit={handleCalculate} className="space-y-4 mt-4">
            {/* Target Junction Selector */}
            <div>
              <label className="block text-xs font-medium text-secondary-theme mb-1">
                {t('planner.dutyLocation')}
              </label>
              <select
                value={selectedPointId}
                onChange={handleSelectPoint}
                className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
              >
                <option value="custom">-- {t('locationTypes.custom')} --</option>
                {currentLocationDutyPoints.map((dp) => (
                  <option key={dp.id} value={dp.id}>
                    {getDutyPointDisplayName(dp, language)}
                  </option>
                ))}
              </select>
            </div>

            {/* Temperature Slider & Number */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-secondary-theme font-medium flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>{t('calculator.ambientTemp')}</span>
                </span>
                <span className="font-mono text-main-theme font-bold">{temp}°C</span>
              </div>
              <input
                type="range"
                min="15"
                max="52"
                step="0.5"
                value={temp}
                onChange={(e) => setTemp(parseFloat(e.target.value))}
                className="w-full accent-[#2563EB] h-1.5 bg-subtle-theme rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-theme font-mono mt-0.5">
                <span>15°C</span>
                <span>35°C</span>
                <span>52°C</span>
              </div>
            </div>

            {/* Relative Humidity Slider & Number */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-secondary-theme font-medium flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{t('calculator.relativeHumidity')}</span>
                </span>
                <span className="font-mono text-main-theme font-bold">{humidity}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="98"
                step="1"
                value={humidity}
                onChange={(e) => setHumidity(parseInt(e.target.value, 10))}
                className="w-full accent-[#2563EB] h-1.5 bg-subtle-theme rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-theme font-mono mt-0.5">
                <span>5%</span>
                <span>50%</span>
                <span>98%</span>
              </div>
            </div>

            {/* Direct Sun / Shade Condition */}
            <div>
              <label className="block text-xs font-medium text-secondary-theme mb-1 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>{t('calculator.shadeCondition')}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'direct_sun', label: t('shade.direct_sun') },
                  { id: 'partial_shade', label: t('shade.partial_shade') },
                  { id: 'canopy_shaded', label: t('shade.overhead_tent') }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setShade(item.id as any)}
                    className={`py-2 px-2 text-xs rounded-lg border transition-all text-center ${
                      shade === item.id
                        ? 'bg-[#2563EB] text-white font-semibold border-[#2563EB] shadow-xs'
                        : 'bg-[#E8F2FF] border-[#DCE5EF] text-[#0F172A] hover:bg-[#d8e8fe] font-medium'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Continuous Exposure Duration */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-secondary-theme font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-theme" />
                  <span>{t('planner.continuousExposure')}</span>
                </span>
                <span className="font-mono text-main-theme font-bold">{duration} {t('common.minutes')}</span>
              </div>
              <input
                type="range"
                min="15"
                max="240"
                step="15"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full accent-[#2563EB] h-1.5 bg-subtle-theme rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-theme font-mono mt-0.5">
                <span>15m</span>
                <span>60m (1h)</span>
                <span>120m (2h)</span>
                <span>240m (4h)</span>
              </div>
            </div>

            {/* Traffic & Wind row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-muted-theme" />
                  <span>{t('calculator.trafficDensity')}</span>
                </label>
                <select
                  value={traffic}
                  onChange={(e) => setTraffic(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs input-theme rounded-lg focus:outline-none"
                >
                  <option value="High">{t('traffic.High')}</option>
                  <option value="Moderate">{t('traffic.Moderate')}</option>
                  <option value="Low">{t('traffic.Low')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-theme mb-1 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-muted-theme" />
                  <span>{t('calculator.windSpeed')}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={wind}
                  onChange={(e) => setWind(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono input-theme rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Calculate Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4 text-amber-300" />
                <span>{t('calculator.calculateBtn')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Calculated Assessment Results (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Composite Score Card */}
          <div className={`p-6 rounded-xl border bg-card-theme shadow-card-theme ${scoreTheme.border}`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-muted-theme">
                  {t('risk.score')} (0 - 100)
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className={`text-4xl font-extrabold font-mono ${scoreTheme.text} tabular-nums`}>
                    {formatNumberLocale(result.score, language)}
                  </span>
                  <span className="text-sm font-semibold text-secondary-theme">/ 100</span>
                  <span
                    className={`ml-2 px-2.5 py-0.5 rounded text-xs font-bold uppercase font-mono ${scoreTheme.bg} ${scoreTheme.text} border ${scoreTheme.border}`}
                  >
                    {getRiskCategoryName(result.category, language)} {t('risk.level')}
                  </span>
                </div>
              </div>

              {previousScore !== null && (
                <div className="text-right text-xs">
                  <span className="text-muted-theme">{language === 'hi' ? 'परिवर्तन:' : language === 'mr' ? 'बदल:' : 'Delta:'}</span>
                  <div
                    className={`font-mono font-semibold ${
                      result.score > previousScore
                        ? 'text-[#DC2626]'
                        : result.score < previousScore
                        ? 'text-[#16A34A]'
                        : 'text-muted-theme'
                    }`}
                  >
                    {result.score > previousScore ? `+${result.score - previousScore}` : result.score - previousScore} pts
                  </div>
                </div>
              )}
            </div>

            {/* Secondary Indices (Heat Index & WBGT) */}
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-theme font-mono text-xs">
              <div className="p-3 bg-subtle-theme rounded-lg border-theme">
                <div className="text-muted-theme text-[11px]">{t('calculator.calculatedHeatIndex')}</div>
                <div className="text-base font-bold text-main-theme mt-0.5">
                  {result.heatIndex.toFixed(1)}°C
                </div>
                <div className="text-[10px] text-muted-theme">{t('risk.apparentTemp')}</div>
              </div>

              <div className="p-3 bg-subtle-theme rounded-lg border-theme">
                <div className="text-muted-theme text-[11px]">{t('calculator.calculatedWbgt')}</div>
                <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {result.estimatedWbgt.toFixed(1)}°C
                </div>
                <div className="text-[10px] text-muted-theme">{t('risk.wbgt')}</div>
              </div>
            </div>

            {/* Contributing Explanation */}
            <div className="mt-4 text-xs text-secondary-theme leading-relaxed bg-subtle-theme p-3 rounded-lg border-subtle-theme">
              <span className="font-semibold text-main-theme">{t('calculator.parameters')}: </span>
              {getExplanationDisplayName(result.explanation, language)}
            </div>
          </div>

          {/* Factor Breakdown Bar Chart */}
          <div className="bg-card-theme border-theme shadow-card-theme rounded-xl p-5">
            <h3 className="text-xs font-semibold text-main-theme mb-2">{t('calculator.heatStressScore')}</h3>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factorChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis dataKey="factor" type="category" width={110} tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: appTheme === 'dark' ? '#0F172A' : '#FFFFFF',
                      borderColor: appTheme === 'dark' ? '#1E293B' : '#E2E8F0',
                      color: appTheme === 'dark' ? '#F8FAFC' : '#0F172A',
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="points" radius={[0, 4, 4, 0]}>
                    {factorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Operational Precautions Checklist */}
          <div className="bg-card-theme border-theme shadow-card-theme rounded-xl p-5">
            <h3 className="text-xs font-semibold text-main-theme mb-2.5 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{t('calculator.actionProtocols')}</span>
            </h3>
            <ul className="space-y-2 text-xs text-secondary-theme">
              {result.recommendedPrecautions.map((prec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#2563EB] font-bold shrink-0 mt-0.5">•</span>
                  <span>{getPrecautionDisplayName(prec, language)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
