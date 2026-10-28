import enDict from '../translations/en.json';
import hiDict from '../translations/hi.json';
import mrDict from '../translations/mr.json';
import { RiskCategory, DutyPoint, LocationRecord } from '../types';

export type AppLanguage = 'en' | 'hi' | 'mr';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
    mr: string;
  };
}

const dictionaries: Record<AppLanguage, Record<string, any>> = {
  en: enDict,
  hi: hiDict,
  mr: mrDict
};

// Helper to look up nested key like 'dashboard.title' or 'nav.dashboard'
function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

// Flat key aliases for backwards compatibility
export const flatKeyAliases: Record<string, string> = {
  appTitle: 'app.title',
  appTagline: 'app.tagline',
  emergencyTriage: 'nav.emergencyTriage',
  addJunction: 'nav.addJunction',
  changeLocation: 'nav.changeLocation',
  navDashboard: 'nav.dashboard',
  navMap: 'nav.map',
  navCalculator: 'nav.calculator',
  navPlanner: 'nav.planner',
  navCooling: 'nav.cooling',
  navNugen: 'nav.nugen',
  navPolicies: 'nav.policies',
  monitoredLocations: 'dashboard.monitoredLocations',
  registeredDutyPoints: 'dashboard.registeredDutyPoints',
  highExtremeHeat: 'dashboard.highExtremeHeat',
  moderateRiskPoints: 'dashboard.moderateRiskPoints',
  rosterAlerts: 'dashboard.rosterAlerts',
  pendingCoolingShelter: 'dashboard.pendingCoolingShelter',
  airTemp: 'weather.airTemp',
  humidity: 'weather.humidity',
  wind: 'weather.wind',
  apparentHeat: 'weather.apparentHeat',
  refreshWeather: 'weather.refreshWeather',
  verifiedCoords: 'weather.verifiedCoords',
  lowRisk: 'risk.lowRisk',
  moderateRisk: 'risk.moderateRisk',
  highRisk: 'risk.highRisk',
  extremeRisk: 'risk.extremeRisk',
  openFullMap: 'dashboard.openFullMap',
  cardGrid: 'dashboard.cardGrid',
  mapView: 'dashboard.mapView',
  searchPlaceholder: 'dashboard.searchPlaceholder',
  allRiskLevels: 'dashboard.allRiskLevels',
  allTrafficVolumes: 'dashboard.allTrafficVolumes',
  shadeCondition: 'shade.shadeCondition',
  directSun: 'shade.direct_sun',
  partialShade: 'shade.partial_shade',
  canopyShaded: 'shade.overhead_tent',
  save: 'common.save',
  cancel: 'common.cancel',
  submit: 'common.submit',
  close: 'common.close',
  loading: 'common.loading',
  error: 'common.error',
  retry: 'common.retry',
  language: 'common.language'
};

export function getTranslation(key: string, lang: AppLanguage): string {
  const targetDict = dictionaries[lang] || dictionaries.en;
  const enFallback = dictionaries.en;

  // 1. Try direct nested path in target dictionary
  let res = getNestedValue(targetDict, key);
  if (res) return res;

  // 2. Check if it's an alias for a nested path
  const aliasPath = flatKeyAliases[key];
  if (aliasPath) {
    res = getNestedValue(targetDict, aliasPath);
    if (res) return res;
    res = getNestedValue(enFallback, aliasPath);
    if (res) return res;
  }

  // 3. Fallback to English nested path
  res = getNestedValue(enFallback, key);
  if (res) return res;

  return key;
}

export function getRiskCategoryName(risk: RiskCategory | string, lang: AppLanguage): string {
  const normalized = String(risk).toLowerCase();
  switch (normalized) {
    case 'low':
      return getTranslation('risk.low', lang);
    case 'moderate':
      return getTranslation('risk.moderate', lang);
    case 'high':
      return getTranslation('risk.high', lang);
    case 'extreme':
      return getTranslation('risk.extreme', lang);
    default:
      return String(risk);
  }
}

export function getShadeConditionName(
  shade: DutyPoint['shadeCondition'] | string,
  lang: AppLanguage
): string {
  switch (shade) {
    case 'direct_sun':
      return getTranslation('shade.direct_sun', lang);
    case 'partial_shade':
      return getTranslation('shade.partial_shade', lang);
    case 'tree_canopy':
      return getTranslation('shade.tree_canopy', lang);
    case 'overhead_tent':
    case 'canopy_shaded':
      return getTranslation('shade.overhead_tent', lang);
    default:
      return String(shade).replace(/_/g, ' ');
  }
}

export function getTrafficDensityName(
  density: DutyPoint['trafficDensity'] | string,
  lang: AppLanguage
): string {
  switch (density) {
    case 'Low':
      return getTranslation('traffic.Low', lang);
    case 'Moderate':
      return getTranslation('traffic.Moderate', lang);
    case 'High':
      return getTranslation('traffic.High', lang);
    case 'Gridlock':
      return getTranslation('traffic.Gridlock', lang);
    default:
      return String(density);
  }
}

export function getLocationTypeName(
  type: LocationRecord['locationType'] | string,
  lang: AppLanguage
): string {
  switch (type) {
    case 'city':
      return getTranslation('locationTypes.city', lang);
    case 'town':
      return getTranslation('locationTypes.town', lang);
    case 'village':
      return getTranslation('locationTypes.village', lang);
    case 'district':
      return getTranslation('locationTypes.district', lang);
    case 'checkpoint':
      return getTranslation('locationTypes.checkpoint', lang);
    case 'custom':
      return getTranslation('locationTypes.custom', lang);
    default:
      return String(type);
  }
}

export function getFacilityTypeName(type: string, lang: AppLanguage): string {
  switch (type) {
    case 'shade_canopy':
      return getTranslation('cooling.shadedShelter', lang);
    case 'misting_fan':
      return getTranslation('cooling.mistingFans', lang);
    case 'chilled_water_dispenser':
      return getTranslation('cooling.drinkingWater', lang);
    case 'cooling_shelter':
      return getTranslation('cooling.coolingShelterPod', lang);
    case 'first_aid_ors_station':
      return getTranslation('cooling.medicalFirstAid', lang);
    default:
      return type.replace(/_/g, ' ');
  }
}

export function getFacilityAvailabilityName(avail: string, lang: AppLanguage): string {
  switch (avail) {
    case 'available':
      return getTranslation('cooling.modalStateAvailable', lang);
    case 'missing':
      return getTranslation('cooling.modalStateMissing', lang);
    case 'under_maintenance':
      return getTranslation('cooling.modalStateMaintenance', lang);
    default:
      return avail;
  }
}

export function getImplementationStatusName(status: string, lang: AppLanguage): string {
  switch (status) {
    case 'pending':
      return lang === 'hi' ? 'लंबित' : lang === 'mr' ? 'प्रलंबित' : 'Pending';
    case 'approved':
      return lang === 'hi' ? 'स्वीकृत' : lang === 'mr' ? 'मंजूर' : 'Approved';
    case 'in_progress':
      return lang === 'hi' ? 'प्रगति पर' : lang === 'mr' ? 'प्रगतीपथावर' : 'In Progress';
    case 'installed':
      return lang === 'hi' ? 'स्थापित एवं सत्यापित' : lang === 'mr' ? 'स्थापित व प्रमाणित' : 'Installed & Verified';
    default:
      return status;
  }
}

export function getStaffRankDisplayName(rank: string, lang: AppLanguage): string {
  if (lang === 'en') return rank;
  if (rank === 'Police Constable') {
    return lang === 'mr' ? 'पोलीस शिपाई' : 'पुलिस आरक्षी (कांस्टेबल)';
  }
  if (rank === 'Head Constable') {
    return lang === 'mr' ? 'पोलीस हवालदार' : 'हेड कांस्टेबल (मुख्य आरक्षी)';
  }
  if (rank === 'Assistant Sub-Inspector') {
    return lang === 'mr' ? 'सहाय्यक पोलीस उपनिरीक्षक (ASI)' : 'सहायक उपनिरीक्षक (एएसआई)';
  }
  if (rank === 'Traffic Inspector') {
    return lang === 'mr' ? 'वाहतूक पोलीस निरीक्षक' : 'ट्रैफिक इंस्पेक्टर';
  }
  if (rank === 'Community Safety Warden') {
    return lang === 'mr' ? 'वाहतूक सुरक्षा रक्षक' : 'सामुदायिक सुरक्षा वार्डन';
  }
  return rank;
}

export function getStaffAvailabilityDisplayName(avail: string, lang: AppLanguage): string {
  switch (avail) {
    case 'on_duty':
      return getTranslation('availability.on_duty', lang);
    case 'rest_recovery':
      return getTranslation('availability.rest_recovery', lang);
    case 'off_duty':
      return getTranslation('availability.off_duty', lang);
    case 'available':
    default:
      return getTranslation('availability.available', lang);
  }
}

export function getStaffVulnerabilityDisplayName(status: string, lang: AppLanguage): string {
  switch (status) {
    case 'standard':
      return getTranslation('vulnerability.standard', lang);
    case 'heat_sensitized':
      return getTranslation('vulnerability.heat_sensitized', lang);
    case 'high_vulnerability':
      return getTranslation('vulnerability.high_vulnerability', lang);
    default:
      return status;
  }
}

// Location names translated for natural display without changing location.id or coordinates
const locationNameMap: Record<string, { hi: string; mr: string }> = {
  loc_pune: { hi: 'पुणे महानगर क्षेत्र', mr: 'पुणे महानगर क्षेत्र' },
  loc_mumbai: { hi: 'मुंबई कोस्टल कॉरिडोर', mr: 'मुंबई सागरी मार्ग कॉरिडॉर' },
  loc_delhi: { hi: 'दिल्ली सेंट्रल ट्रैफिक रिंग', mr: 'दिल्ली मध्यवर्ती वाहतूक रिंग' },
  loc_bengaluru: { hi: 'बेंगलुरु अर्बन कॉरिडोर', mr: 'बेंगळुरू नागरी कॉरिडॉर' },
  loc_lonavala: { hi: 'लोनावाला हिल पास एवं घाट', mr: 'लोणावळा घाट व बायपास' },
  loc_baramati: { hi: 'बारामती एग्रो हब', mr: 'बारामती कृषी केंद्र' },
  loc_shirdi: { hi: 'शिरडी तीर्थयात्री हाईवे हब', mr: 'शिर्डी भाविक महामार्ग केंद्र' },
  loc_shirur: { hi: 'शिरूर ग्रामीण कृषि सेक्टर', mr: 'शिरूर ग्रामीण कृषी विभाग' },
  loc_junnar: { hi: 'जुन्नर ग्रामीण फार्मबेल्ट चेकपोस्ट', mr: 'जुन्नर ग्रामीण शेत परिसर चौकी' },
  loc_khed: { hi: 'खेड शिवापुर हाईवे ग्रामीण पोस्ट', mr: 'खेड शिवापूर महामार्ग ग्रामीण चौकी' },
  loc_phoenix: { hi: 'फीनिक्स मेट्रो क्षेत्र', mr: 'फिनिक्स मेट्रो क्षेत्र' },
  loc_dubai: { hi: 'दुबई सेंट्रल डिस्ट्रिक्ट', mr: 'दुबई मध्यवर्ती विभाग' },
  loc_seville: { hi: 'सेविले ऐतिहासिक केंद्र', mr: 'सेव्हिल ऐतिहासिक केंद्र' },
  loc_nairobi: { hi: 'नैरोबी सेंट्रल कॉरिडोर', mr: 'नैरोबी मध्यवर्ती कॉरिडॉर' }
};

export function getLocationDisplayName(
  loc: { id: string; name: string } | null | undefined,
  lang: AppLanguage
): string {
  if (!loc) return '';
  if (lang === 'en') return loc.name;
  const mapped = locationNameMap[loc.id];
  if (mapped && mapped[lang]) return mapped[lang];
  return loc.name;
}

// Duty point names translated for natural display
const dutyPointNameMap: Record<string, { hi: string; mr: string }> = {
  dp_swargate: {
    hi: 'स्वारगेट चौक मल्टी-वे चौराहा',
    mr: 'स्वारगेट चौक बहुमार्ग जंक्शन'
  },
  dp_shivajinagar: {
    hi: 'शिवाजीनगर स्टेशन फ्लाईओवर चौराहा',
    mr: 'शिवाजीनगर स्टेशन उड्डाणपूल चौक'
  },
  dp_hinjawadi: {
    hi: 'हिंजवडी फेज 1 टेक गेटवे चौक',
    mr: 'हिंजवडी फेज १ टेक गेटवे चौक'
  },
  dp_chandani: {
    hi: 'चांदनी चौक एक्सप्रेसवे इंटरचेंज',
    mr: 'चांदणी चौक द्रुतगती महामार्ग इंटरचेंज'
  },
  dp_deccan: {
    hi: 'डेक्कन जिमखाना एफसी रोड क्रॉसिंग',
    mr: 'डेक्कन जिमखाना एफसी रोड क्रॉसिंग'
  },
  dp_mumbai_dadar: {
    hi: 'दादर टीटी सर्कल मुख्य चौराहा',
    mr: 'दादर टीटी सर्कल मुख्य जंक्शन'
  },
  dp_delhi_ito: {
    hi: 'आईटीओ सेंट्रल ट्रांजिट चौराहा',
    mr: 'आयटीओ मध्यवर्ती वाहतूक चौक'
  },
  dp_blr_silkboard: {
    hi: 'सिल्क बोर्ड टेक कॉरिडोर क्रॉसिंग',
    mr: 'सिल्क बोर्ड टेक कॉरिडॉर क्रॉसिंग'
  },
  dp_lon_ghat: {
    hi: 'खंडाला घाट बाईपास चेकपोस्ट',
    mr: 'खंडाळा घाट बायपास नाका'
  },
  dp_baramati_midc: {
    hi: 'बारामती एमआईडीसी एग्रो इंडस्ट्रियल सर्कल',
    mr: 'बारामती एमआयडीसी कृषी औद्योगिक सर्कल'
  },
  dp_shirdi_bypass: {
    hi: 'शिरडी तीर्थयात्री हाईवे बाईपास चौक',
    mr: 'शिर्डी भाविक महामार्ग बायपास चौक'
  },
  dp_shirur_rural: {
    hi: 'शिरूर एग्रो-मंडी हाईवे चेकपॉइंट',
    mr: 'शिरूर कृषी उत्पन्न महामार्ग नाका'
  },
  dp_junnar_fort: {
    hi: 'जुन्नर ग्रामीण फार्मबेल्ट क्रॉसिंग',
    mr: 'जुन्नर ग्रामीण शेत परिसर चौक'
  },
  dp_khed_plaza: {
    hi: 'खेड शिवापुर ग्रामीण हाईवे पोस्ट',
    mr: 'खेड शिवापूर ग्रामीण महामार्ग चौकी'
  },
  dp_phx_mcdowell: {
    hi: 'सेंट्रल एवेन्यू व मैकडॉवेल रोड चेकपॉइंट',
    mr: 'सेंट्रल अव्हेन्यू व मॅकडॉवेल रोड चेकपॉईंट'
  },
  dp_dxb_rigga: {
    hi: 'अल रिग्गा व अल मकतूम आर्टेरियल जंक्शन',
    mr: 'अल रिग्गा व अल मकतूम जंक्शन'
  },
  dp_sev_armas: {
    hi: 'प्लाजा डे अरमास बस कॉरिडोर चेकपॉइंट',
    mr: 'प्लाझा दे अरमास बस कॉरिडॉर चेकपॉईंट'
  },
  dp_nbo_nyayo: {
    hi: 'न्यायो नेशनल स्टेडियम राउंडअबाउट',
    mr: 'न्यायो राष्ट्रीय स्टेडियम गोल चक्कर'
  }
};

export function getDutyPointDisplayName(
  dp: { id: string; name: string } | null | undefined,
  lang: AppLanguage
): string {
  if (!dp) return '';
  if (lang === 'en') return dp.name;
  const mapped = dutyPointNameMap[dp.id];
  if (mapped && mapped[lang]) return mapped[lang];
  return dp.name;
}

// Precaution translation dictionary for real-time risk assessment advice
export function getPrecautionDisplayName(text: string, lang: AppLanguage): string {
  if (lang === 'en' || !text) return text;

  // Extreme Risk precautions
  if (text.includes('Mandatory 15-minute shaded cool-down rest every 30-45 minutes')) {
    return lang === 'mr'
      ? 'सक्रिय वाहतूक नियंत्रणादरम्यान दर ३०-४५ मिनिटांनी १५ मिनिटे सावलीत विश्रांती अनिवार्य.'
      : 'सक्रिय ट्रैफिक नियंत्रण के दौरान हर 30-45 मिनट में 15 मिनट की छायादार विश्रांति अनिवार्य है।';
  }
  if (text.includes('Enforce 250ml electrolyte/chilled water consumption every 15 minutes')) {
    return lang === 'mr'
      ? 'दर १५ मिनिटांनी २५० मिली इलेक्ट्रोलाइट किंवा थंड पाण्याचे सेवन अनिवार्य करा.'
      : 'हर 15 मिनट में 250 मिली इलेक्ट्रोलाइट या ठंडा पानी पीने का नियम लागू करें।';
  }
  if (text.includes('Deploy immediate canopy umbrella or rotate officer')) {
    return lang === 'mr'
      ? 'चौकात तात्काळ छत्री/कॅनोपी लावा किंवा कर्मचाऱ्याला सावलीच्या पॉईंटवर बदला.'
      : 'तुरंत कैनोपी छतरी लगाएं या अधिकारी को छायादार पोस्ट पर रोटेट करें।';
  }
  if (text.includes('Monitor officer for acute symptoms')) {
    return lang === 'mr'
      ? 'डोकेदुखी, चक्कर, गोंधळ किंवा मळमळ यांसारख्या गंभीर लक्षणांवर बारकाईने लक्ष ठेवा.'
      : 'सिरदर्द, चक्कर, भ्रम या उल्टी जैसे गंभीर लक्षणों पर तुरंत नजर रखें।';
  }

  // High Risk precautions
  if (text.includes('Maximum 60 minutes continuous roadway exposure')) {
    return lang === 'mr'
      ? 'अनिवार्य सावली विश्रांतीपूर्वी रस्त्यावर सलग ड्युटीची मर्यादा जास्तीत जास्त ६० मिनिटे.'
      : 'अनिवार्य छाया ब्रेक से पहले सड़क पर अधिकतम 60 मिनट की निरंतर ड्यूटी सीमित करें।';
  }
  if (text.includes('Drink at least 250ml water every 20 minutes')) {
    return lang === 'mr'
      ? 'दर २० मिनिटांनी किमान २५० मिली पाणी प्या; चहा/कॉफी टाळा.'
      : 'हर 20 मिनट में कम से कम 250 मिली पानी पिएं; चाय-कॉफी से बचें।';
  }
  if (text.includes('Position traffic directing post under nearest shade')) {
    return lang === 'mr'
      ? 'वाहतूक नियमन पोस्ट जवळच्या सावलीत किंवा छत्रीखाली ठेवा.'
      : 'ट्रैफिक संचालन पोस्ट को निकटतम छाया या पोर्टेबल छतरी के नीचे रखें।';
  }
  if (text.includes('Ensure cooling water supply is within 30 meters')) {
    return lang === 'mr'
      ? 'ड्युटी पॉईंटपासून ३० मीटरच्या अंतरावर थंड पाण्याचा पुरवठा सुनिश्चित करा.'
      : 'ड्यूटी पॉइंट से 30 मीटर के भीतर ठंडा पानी उपलब्ध होना सुनिश्चित करें।';
  }

  // Moderate Risk precautions
  if (text.includes('Standard 15-minute rest interval every 90 minutes')) {
    return lang === 'mr'
      ? 'ड्युटीच्या दर ९० मिनिटांनंतर नियमित १५ मिनिटांची विश्रांती.'
      : 'ड्यूटी के प्रत्येक 90 मिनट के बाद नियमित 15 मिनट का विश्राम अंतराल।';
  }
  if (text.includes('Maintain regular hydration routine (200ml every 30 minutes)')) {
    return lang === 'mr'
      ? 'नियमित पाणी पिण्याची सवय ठेवा (दर ३० मिनिटांनी २०० मिली पाणी).'
      : 'नियमित जलपान नियम बनाए रखें (हर 30 मिनट में 200 मिली)।';
  }
  if (text.includes('Utilize available road island shade structures')) {
    return lang === 'mr'
      ? 'दुपारच्या कडक उन्हात (१२:०० ते १५:००) वाहतूक बेटावरील सावलीचा वापर करा.'
      : 'दोपहर की तेज धूप (12:00-15:00) के दौरान उपलब्ध रोड आइलैंड शेड का उपयोग करें।';
  }

  // Low Risk precautions
  if (text.includes('Routine outdoor duty protocols')) {
    return lang === 'mr'
      ? 'नियमित मैदानी ड्युटी नियम पाळा; पुरेसे पिण्याचे पाणी जवळ ठेवा.'
      : 'नियमित आउटडोर ड्यूटी प्रोटोकॉल; पीने के पानी की निरंतर उपलब्धता रखें।';
  }
  if (text.includes('Monitor weather changes if afternoon temperature is forecasted')) {
    return lang === 'mr'
      ? 'दुपारी तापमान वाढण्याचा अंदाज असल्यास हवामानातील बदलांवर लक्ष ठेवा.'
      : 'यदि दोपहर में तापमान बढ़ने का पूर्वानुमान हो तो मौसम में बदलाव पर नजर रखें।';
  }

  // Conditional warnings
  if (text.includes('Direct sun exposure identified')) {
    return lang === 'mr'
      ? 'थेट कडक ऊन: अतिनील किरण संरक्षक टोपी आणि मानेचे आवरण वापरण्याची आग्रही शिफारस.'
      : 'सीधी धूप की पहचान: यूवी-सुरक्षात्मक टोपी और गर्दन का कपड़ा पहनने की सख्त सिफारिश।';
  }
  if (text.includes('High traffic exhaust and asphalt re-radiation')) {
    return lang === 'mr'
      ? 'जास्त वाहतुकीचा धूर आणि डांबराची उष्णता यामुळे हवेत +५°से पर्यंत अतिरिक्त उष्णता वाढते.'
      : 'भारी ट्रैफिक का धुआं और डामर की गर्मी माइक्रोक्लाइमेट में +5°C तक अतिरिक्त गर्मी जोड़ती है।';
  }

  return text;
}

export function getExplanationDisplayName(text: string, lang: AppLanguage): string {
  if (lang === 'en' || !text) return text;

  // Pattern: Heat-Risk Score 85/100 (Extreme): Driven by ...
  if (text.includes('Heat-Risk Score')) {
    if (lang === 'mr') {
      return text
        .replace(/Heat-Risk Score/g, 'उष्णता जोखीम गुणसंख्या')
        .replace(/\(Extreme\)/g, '(अति तीव्र)')
        .replace(/\(High\)/g, '(जास्त धोका)')
        .replace(/\(Moderate\)/g, '(मध्यम धोका)')
        .replace(/\(Low\)/g, '(कमी धोका)')
        .replace(/Driven by/g, 'कारणीभूत घटक:')
        .replace(/ambient air/g, 'हवेचे तापमान')
        .replace(/relative humidity/g, 'सापेक्ष आर्द्रता')
        .replace(/evaporative cooling suppression:/g, 'घाम बाष्पीभवन अडथळा:')
        .replace(/direct sun exposure/g, 'थेट उन्हाचा प्रभाव')
        .replace(/partial shade exposure/g, 'अंशतः सावली')
        .replace(/canopy shaded exposure/g, 'कॅनोपी शेड')
        .replace(/high traffic road heat/g, 'जास्त वाहतूक डांबरी उष्णता')
        .replace(/moderate traffic road heat/g, 'मध्यम वाहतूक उष्णता')
        .replace(/low traffic road heat/g, 'कमी वाहतूक उष्णता')
        .replace(/Exposure duration of/g, 'सलग ड्युटी वेळ:')
        .replace(/min contributed/g, 'मिनिटे (योगदान:')
        .replace(/pts, offset by/g, 'गुण), वाऱ्याचा दिलासा:')
        .replace(/pts of convective wind relief/g, 'गुण वाऱ्याचा फायदा');
    }
    if (lang === 'hi') {
      return text
        .replace(/Heat-Risk Score/g, 'हीट-रिस्क स्कोर')
        .replace(/\(Extreme\)/g, '(अत्यधिक)')
        .replace(/\(High\)/g, '(उच्च जोखिम)')
        .replace(/\(Moderate\)/g, '(मध्यम जोखिम)')
        .replace(/\(Low\)/g, '(कम जोखिम)')
        .replace(/Driven by/g, 'प्रमुख कारक:')
        .replace(/ambient air/g, 'वायु तापमान')
        .replace(/relative humidity/g, 'सापेक्ष आर्द्रता')
        .replace(/evaporative cooling suppression:/g, 'पसीना वाष्पीकरण प्रभाव:')
        .replace(/direct sun exposure/g, 'सीधी धूप प्रभाव')
        .replace(/partial shade exposure/g, 'आंशिक छाया')
        .replace(/canopy shaded exposure/g, 'कैनोपी शेड')
        .replace(/high traffic road heat/g, 'भारी ट्रैफिक सड़क ताप')
        .replace(/moderate traffic road heat/g, 'मध्यम ट्रैफिक ताप')
        .replace(/low traffic road heat/g, 'धीमा ट्रैफिक ताप')
        .replace(/Exposure duration of/g, 'ड्यूटी अवधि:')
        .replace(/min contributed/g, 'मिनट (योगदान:')
        .replace(/pts, offset by/g, 'अंक), हवा से राहत:')
        .replace(/pts of convective wind relief/g, 'अंक वायु शीतलन');
    }
  }

  return text;
}

export function formatDateLocale(dateStr: string, lang: AppLanguage): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const localeCode = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
    return new Intl.DateTimeFormat(localeCode, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatNumberLocale(num: number, lang: AppLanguage, decimals = 1): string {
  try {
    const localeCode = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
    return new Intl.NumberFormat(localeCode, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  } catch {
    return num.toFixed(decimals);
  }
}

// Backward compatibility export
export const translations: TranslationDictionary = {};
