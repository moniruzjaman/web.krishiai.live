import { translateBengaliToEnglish, translateSymptomsToEnglish } from './bengaliKeywords';
import { matchDiseasesBySymptoms, estimateInoculumPressure, getVarietySusceptibility, resolveCropKey, CROP_DISEASES } from '../cropDiseases';

const INFECTED_PART_KEYWORDS: Record<string, string[]> = {
  leaf: ['পাতা', 'leaf', 'leaves', 'blade'],
  leaves: ['পাতা', 'leaf', 'leaves', 'blade'],
  'পাতা': ['পাতা', 'leaf', 'leaves'],
  stem: ['কান্ড', 'কাণ্ড', 'stem', 'stalk', 'culm'],
  'কান্ড': ['কান্ড', 'কাণ্ড', 'stem'],
  'কাণ্ড': ['কান্ড', 'কাণ্ড', 'stem'],
  root: ['শিকড়', 'মূল', 'root', 'roots'],
  'শিকড়': ['শিকড়', 'মূল', 'root'],
  fruit: ['ফল', 'fruit', 'fruits'],
  'ফল': ['ফল', 'fruit'],
  panicle: ['শীষ', 'panicle', 'ear', 'head'],
  'শীষ': ['শীষ', 'panicle', 'ear'],
  flower: ['ফুল', 'flower', 'blossom'],
  'ফুল': ['ফুল', 'flower'],
  seed: ['বীজ', 'দানা', 'seed', 'grain'],
  grain: ['দানা', 'শীষ', 'grain', 'seed'],
};

function partKeywords(part?: string): string[] {
  if (!part) return [];
  const key = part.toLowerCase().trim();
  return INFECTED_PART_KEYWORDS[key] || INFECTED_PART_KEYWORDS[part.trim()] || [];
}

interface SymptomInput {
  [key: string]: string | string[];
}

interface TranslatedSymptoms {
  [key: string]: string | string[] | Record<string, string>;
  _englishText: string;
  _translated: Record<string, string>;
}

interface HostInfo {
  variety?: string;
  varietySusceptibility?: 'high' | 'medium' | 'low';
  growthStage?: string;
}

interface PathogenInfo {
  inoculumPressure?: 'high' | 'medium' | 'low';
  season?: string;
  recentHistory?: string;
}

interface EnvInfo {
  temp?: number;
  humidity?: number;
  rainfall?: number;
}

interface DiseaseTriangleAssessment {
  host: string;
  pathogen: string;
  environment: string;
  riskLevel: 'low' | 'medium' | 'high';
  fieldObservationGuidance: string[];
}

interface IPMRecommendations {
  cultural: string[];
  biological: string[];
  chemical: string[];
  prevention: string[];
}

interface CropDiseaseMatchSlim {
  name: string;
  nameBn: string;
  cause: string;
  pathogen: string;
  severity: string;
  season: string[];
  score: number;
  maxScore: number;
  matchRatio: number;
  matchedSymptoms: string[];
  recommendations: string[];
}

interface SpecificDisease {
  name: string;
  nameBn: string;
  cause: string;
  pathogen: string;
  severity: string;
  confidence: 'high' | 'medium' | 'low';
  matchRatio: number;
  matchedSymptoms: string[];
}

export interface OfflineDiagnosis {
  abioticBiotic: string;
  excluded: string[];
  suspects: string[];
  primarySuspect: string;
  specificDisease: SpecificDisease | null;
  cropDiseaseMatches: CropDiseaseMatchSlim[];
  confidence: string;
  diseaseTriangle: DiseaseTriangleAssessment;
  fieldConfirmation: string[];
  ipmRecommendations: IPMRecommendations;
  economicThreshold: string;
  recommendedFieldObservations: string[];
  timestamp: string;
}

const _translationCache = new Map<string, TranslatedSymptoms>();

function translationCacheKey(symptoms: SymptomInput): string {
  return JSON.stringify(symptoms);
}

function translateSymptoms(symptoms: SymptomInput): TranslatedSymptoms {
  const cacheKey = translationCacheKey(symptoms);
  const cached = _translationCache.get(cacheKey);
  if (cached) return cached;

  const allValues = Object.values(symptoms).map(v => String(v || '')).filter(v => v && v !== 'N/A');
  const englishText = translateSymptomsToEnglish(allValues);

  const translated: Record<string, string> = {};
  for (const [key, value] of Object.entries(symptoms)) {
    if (value && String(value) !== 'N/A') {
      translated[key] = translateBengaliToEnglish(String(value));
    } else {
      translated[key] = String(value || '');
    }
  }

  const result: TranslatedSymptoms = {
    ...symptoms,
    _englishText: englishText,
    _translated: translated,
  };

  if (_translationCache.size >= 256) _translationCache.clear();
  _translationCache.set(cacheKey, result);
  return result;
}

function hasPositiveMatch(text: string, indicator: string): boolean {
  if (!indicator) return false;
  const ind = indicator.toLowerCase();
  const idx = text.indexOf(ind);
  if (idx === -1) return false;

  const before = text.slice(Math.max(0, idx - 12), idx);
  if (/\bno\s+$/i.test(before) || /\bwithout\s+$/i.test(before) || /\babsence\s+of\s+$/i.test(before)) {
    return false;
  }
  if (/\sনেই\s?$/.test(before) || /\sনাই\s?$/.test(before) || /\sনা\s?$/.test(before)) {
    return false;
  }
  return true;
}

function pushUnique(arr: string[], value: string): void {
  if (!arr.includes(value)) arr.push(value);
}

export function assessAbioticBiotic(symptoms: SymptomInput): 'abiotic' | 'biotic' | 'uncertain' {
  const abioticIndicators = [
    'uniformly distributed', 'machinery tracks', 'irrigation channels', 'soil type zones',
    'symmetrically on both sides', 'no progression', 'all plants affected simultaneously',
    'not spreading', 'no fruiting bodies', 'no ooze', 'no webbing', 'no frass',
    'no insect presence', 'linked to management event', 'fertilizer application',
    'herbicide', 'flooding', 'salinity', 'pH toxicity',
    'flood water damage', 'drought stress', 'cold injury frost',
  ];

  const bioticIndicators = [
    'spreads progressively', 'focus point', 'field edge', 'irregular distribution',
    'some plants healthy', 'some sick', 'clear border', 'healthy/diseased tissue',
    'signs of pathogen presence', 'fruiting bodies', 'ooze', 'webbing', 'frass',
    'cast skins', 'eggs', 'symptoms appear asymmetrically',
    'insect visible pest', 'chewing marks', 'sticky honeydew', 'whitefly', 'spider mite',
  ];

  let abioticScore = 0;
  let bioticScore = 0;

  const translated = translateSymptoms(symptoms);
  const allText = Object.values(symptoms).join(' ').toLowerCase() + ' ' + translated._englishText.toLowerCase();

  abioticIndicators.forEach(indicator => {
    if (allText.includes(indicator.toLowerCase())) abioticScore++;
  });

  bioticIndicators.forEach(indicator => {
    if (hasPositiveMatch(allText, indicator)) bioticScore++;
  });

  if (abioticScore > bioticScore) return 'abiotic';
  if (bioticScore > abioticScore) return 'biotic';
  return 'uncertain';
}

export function applyExclusionGates(abioticBiotic: string, symptoms: SymptomInput): { excluded: string[]; suspects: string[] } {
  const excluded: string[] = [];
  const suspects: string[] = [];
  const translated = translateSymptoms(symptoms);

  const originalText = Object.values(symptoms).join(' ').toLowerCase();
  const englishText = translated._englishText.toLowerCase();
  const allText = originalText + ' ' + englishText;

  if (abioticBiotic === 'abiotic') {
    pushUnique(excluded, 'insects/mites');
    pushUnique(excluded, 'virus');
    pushUnique(excluded, 'bacteria');
    pushUnique(excluded, 'fungi/oomycetes');
    pushUnique(suspects, 'nutrient deficiency');
    pushUnique(suspects, 'drought');
    pushUnique(suspects, 'waterlogging');
    pushUnique(suspects, 'herbicide injury');
    pushUnique(suspects, 'salinity');
    pushUnique(suspects, 'pH toxicity');
    return { excluded, suspects };
  }

  const insectMiteSigns = [
    'chewing marks', 'holes', 'rolled leaves', 'mines', 'frass', 'cast skins', 'eggs', 'webbing', 'stippling',
    'leaf roller insect', 'chewing marks insect', 'sticky honeydew', 'whitefly insect',
    'spider mite webbing', 'soil insect grub', 'insect visible pest',
    'stem borer holes hollow stem insect borer',
  ];

  let hasInsectSigns = false;
  insectMiteSigns.forEach(sign => {
    if (hasPositiveMatch(allText, sign)) hasInsectSigns = true;
  });

  if (!hasInsectSigns) {
    pushUnique(excluded, 'insects/mites');
  } else {
    pushUnique(suspects, 'insects/mites');
  }

  const virusSigns = [
    'mosaic', 'ring spots', 'chlorotic patterns following vein boundaries',
    'systemic distortion of young leaves', 'confined between veins',
    'leaf curling curl distortion crinkling', 'mosaic virus chlorotic patterns',
  ];

  let hasVirusSigns = false;
  virusSigns.forEach(sign => {
    if (hasPositiveMatch(allText, sign)) hasVirusSigns = true;
  });

  if (allText.includes('interveinal') || allText.includes('confined between veins')) {
    pushUnique(excluded, 'virus');
  } else if (!hasVirusSigns) {
    pushUnique(excluded, 'virus');
  } else {
    pushUnique(suspects, 'virus');
  }

  const bacteriaSigns = [
    'water-soaked margins', 'bacterial ooze', 'sticky exudate',
    'water soaked oily', 'water soaked margins leaf edge yellow brown bacterial',
  ];

  let hasBacteriaSigns = false;
  bacteriaSigns.forEach(sign => {
    if (hasPositiveMatch(allText, sign)) hasBacteriaSigns = true;
  });

  if (!hasBacteriaSigns) {
    pushUnique(excluded, 'bacteria');
  } else {
    pushUnique(suspects, 'bacteria');
  }

  const fungalSigns = [
    'fruiting bodies', 'black pycnidia', 'pustules', 'powdery coating', 'cottony growth',
    'white powder mildew powdery coating', 'blast gray diamond lesions fungal',
  ];

  const oomyceteSigns = ['rapid aggressive rot', 'white cottony sporulation', 'no hard sclerotia'];
  const trueFungusSigns = ['hard black sclerotia'];

  let hasFungalSigns = false;
  let hasOomyceteSigns = false;
  let hasTrueFungusSigns = false;

  fungalSigns.forEach(sign => {
    if (hasPositiveMatch(allText, sign)) hasFungalSigns = true;
  });
  oomyceteSigns.forEach(sign => {
    if (hasPositiveMatch(allText, sign)) hasOomyceteSigns = true;
  });
  trueFungusSigns.forEach(sign => {
    if (hasPositiveMatch(allText, sign)) hasTrueFungusSigns = true;
  });

  if (hasTrueFungusSigns) {
    pushUnique(suspects, 'true fungi');
    pushUnique(excluded, 'oomycetes');
  } else if (hasOomyceteSigns) {
    pushUnique(suspects, 'oomycetes');
    pushUnique(excluded, 'true fungi');
  } else if (hasFungalSigns) {
    pushUnique(suspects, 'fungal/oomycete (unable to differentiate)');
  } else {
    pushUnique(excluded, 'fungi/oomycetes');
  }

  return {
    excluded: Array.from(new Set(excluded)),
    suspects: Array.from(new Set(suspects)),
  };
}

export function assessDiseaseTriangle(
  hostInfo: HostInfo,
  pathogenInfo: PathogenInfo,
  envInfo: EnvInfo,
  cropInput?: string
): DiseaseTriangleAssessment {
  const assessment: DiseaseTriangleAssessment = {
    host: '',
    pathogen: '',
    environment: '',
    riskLevel: 'low',
    fieldObservationGuidance: [],
  };

  const effectiveVarietySusceptibility = cropInput
    ? getVarietySusceptibility(cropInput, hostInfo.variety)
    : (hostInfo.varietySusceptibility || 'medium');

  const effectiveInoculumPressure = cropInput && pathogenInfo.season
    ? estimateInoculumPressure(cropInput, pathogenInfo.season)
    : (pathogenInfo.inoculumPressure || 'low');

  if (effectiveVarietySusceptibility === 'high' ||
      hostInfo.growthStage === 'seedling' ||
      hostInfo.growthStage === 'vegetative') {
    assessment.host = 'High susceptibility due to variety and growth stage';
    assessment.riskLevel = 'medium';
    assessment.fieldObservationGuidance.push('Record variety name and exact growth stage (days after planting)');
  } else {
    assessment.host = 'Moderate to low susceptibility';
    assessment.fieldObservationGuidance.push('Document variety and growth stage for baseline comparison');
  }

  if (effectiveInoculumPressure === 'high' || pathogenInfo.recentHistory === 'present') {
    assessment.pathogen = 'High pathogen pressure';
    if (assessment.riskLevel === 'medium') assessment.riskLevel = 'high';
    else assessment.riskLevel = 'medium';
    assessment.fieldObservationGuidance.push('Note recent disease history in this field and surrounding areas');
  } else {
    assessment.pathogen = 'Low to moderate pathogen pressure';
    assessment.fieldObservationGuidance.push('Survey field edges and nearby areas for disease presence');
  }

  if (envInfo) {
    const { temp, humidity, rainfall } = envInfo;
    if (humidity && humidity > 80 && temp && temp >= 26 && temp <= 35) {
      assessment.environment = 'High humidity + optimal temperature = High fungal blast/blight risk';
      if (assessment.riskLevel !== 'high') assessment.riskLevel = 'high';
      assessment.fieldObservationGuidance.push('Monitor leaf wetness duration and canopy humidity throughout day');
    } else if (humidity && humidity > 85) {
      assessment.environment = 'Very high humidity = High bacterial blight risk';
      if (assessment.riskLevel !== 'high') assessment.riskLevel = 'high';
      assessment.fieldObservationGuidance.push('Check for bacterial ooze early morning; monitor hourly humidity');
    } else if (temp && temp < 20) {
      assessment.environment = 'Cool nights = Tungro virus/insect vector risk';
      if (assessment.riskLevel === 'low') assessment.riskLevel = 'medium';
      assessment.fieldObservationGuidance.push('Record daily min/max temperatures and vector insect activity');
    } else if (rainfall && rainfall > 50) {
      assessment.environment = 'Heavy rain = Stem borer, root rot, waterlogging stress';
      if (assessment.riskLevel === 'low') assessment.riskLevel = 'medium';
      assessment.fieldObservationGuidance.push('Check soil drainage and look for waterlogging signs');
    } else {
      assessment.environment = 'Environmental conditions moderate';
      assessment.fieldObservationGuidance.push('Continue standard environmental monitoring');
    }
  } else {
    assessment.environment = 'No environmental data available';
    assessment.fieldObservationGuidance.push('CRITICAL: Measure temperature (°C), humidity (%), and rainfall (mm)');
    assessment.fieldObservationGuidance.push('Record time of day for all measurements');
    assessment.fieldObservationGuidance.push('Note recent weather patterns (last 3-5 days)');
  }

  assessment.fieldObservationGuidance.push('For improved diagnosis, also record: symptom progression rate, affected plant percentage, and exact symptom location on plant');

  return assessment;
}

export function getFieldConfirmationMethods(suspects: string[]): string[] {
  const methods: string[] = [];

  suspects.forEach(suspect => {
    switch (suspect) {
      case 'bacteria':
        methods.push('HIGH PRIORITY: Bacterial streaming test - Cut stem 15cm from base, place in clear water - milky streaming after 5-30 min confirms bacterial infection');
        methods.push('HIGH PRIORITY: Check for water-soaked margins at lesion edges (appear dark green/black, water-soaked)');
        methods.push('MEDIUM PRIORITY: Look for bacterial ooze or sticky exudate (especially in morning)');
        methods.push('INTERPRETATION: Positive streaming = bacterial wilt/rot; Water-soaked margins = active bacterial infection');
        break;

      case 'fungi/oomycetes':
      case 'true fungi':
      case 'oomycetes':
        methods.push('HIGH PRIORITY: Check for visible fruiting bodies (black pycnidia, pustules, powdery coating, cottony growth)');
        methods.push('HIGH PRIORITY: Look for rapid aggressive rot with white cottony sporulation on soil surface (indicates oomycete)');
        methods.push('MEDIUM PRIORITY: Check for hard black sclerotia (sclerotia = survival structures of fungi like Sclerotium)');
        methods.push('INTERPRETATION: Fruiting bodies confirm fungal infection; Location/texture helps identify specific fungus');
        break;

      case 'insects/mites':
        methods.push('HIGH PRIORITY: Examine leaf underside for insects, mites, eggs, webbing, honeydew (use 10x hand lens if available)');
        methods.push('HIGH PRIORITY: Look for chewing marks, holes, mines, stippling');
        methods.push('MEDIUM PRIORITY: Look for frass (insect excrement), cast skins (molts)');
        methods.push('LOW PRIORITY: Shake leaf over white paper to check for thrips and other small insects');
        methods.push('INTERPRETATION: Type of damage + insect found = specific pest identification');
        break;

      case 'virus':
        methods.push('HIGH PRIORITY: Look for mosaic (irregular light/dark green), ring spots, chlorotic patterns following vein boundaries');
        methods.push('HIGH PRIORITY: Check for systemic distortion of young leaves (twisting, narrowing, fanning)');
        methods.push('CRITICAL: Symptoms confined between veins = NOT virus (indicates nutrient deficiency or herbicide)');
        methods.push('INTERPRETATION: Vein-bound patterns suggest virus; Interveinal patterns suggest nutrient/chemical cause');
        break;

      case 'nutrient deficiency':
        methods.push('HIGH PRIORITY: Check symmetry: Symmetrical damage on both leaf halves strongly suggests nutrient deficiency');
        methods.push('HIGH PRIORITY: Older leaves affected = Mobile nutrients deficient (N, P, K, Mg)');
        methods.push('HIGH PRIORITY: Younger leaves affected = Immobile nutrients deficient (Zn, Fe, S, Cu, Mn, B, Ca)');
        methods.push('INTERPRETATION: Pattern + mobility determines specific nutrient; Soil test confirms deficiency');
        break;

      default:
        methods.push('GENERAL: Check distribution (uniform=abiotic, patchy=biotic), progression rate, and associated symptoms');
        methods.push('OBSERVATION GUIDE: Record % plants affected, symptom progression, and exact symptom location');
        break;
    }
  });

  return methods;
}

export function generateIPMRecommendations(diagnosis: {
  suspects: string[];
  confidence: string;
  cropDiseaseMatches: Array<{
    disease: {
      name: string;
      nameBn: string;
      cause: string;
      severity: string;
      recommendations: string[];
    };
    matchRatio: number;
  }>;
}): IPMRecommendations {
  const recommendations: IPMRecommendations = {
    cultural: [],
    biological: [],
    chemical: [],
    prevention: [],
  };

  if (diagnosis.cropDiseaseMatches && diagnosis.cropDiseaseMatches.length > 0) {
    const topMatch = diagnosis.cropDiseaseMatches[0];
    const disease = topMatch.disease;

    if (disease.recommendations && disease.recommendations.length > 0) {
      disease.recommendations.forEach(rec => {
        const recLower = rec.toLowerCase();
        if (recLower.includes('স্প্রে') || recLower.includes('প্রয়োগ') || recLower.includes('spray') ||
            recLower.includes('কীটনাশক') || recLower.includes('ছত্রাকনাশক') ||
            recLower.includes('মেটালাক্সিল') || recLower.includes('ম্যানকোজেব') || recLower.includes('কার্বেন্ডাজিম') ||
            recLower.includes('কপার') || recLower.includes('ট্রাইসাইক্লাজোল') || recLower.includes('প্রোপিকোনাজোল') ||
            recLower.includes('হেক্সাকোনাজোল') || recLower.includes('টেবুকোনাজোল') || recLower.includes('সালফার') ||
            recLower.includes('ইমিডাক্লোপ্রিড') || recLower.includes('সাইপারমেথ্রিন') || recLower.includes('কার্বারিল') ||
            recLower.includes('রিডোমিল') || recLower.includes('বোর্দো')) {
          recommendations.chemical.push(rec);
        } else if (recLower.includes('জাত') || recLower.includes('আবর্তন') || recLower.includes('দূরত্ব') ||
                   recLower.includes('সার') || recLower.includes('সেচ') || recLower.includes('বীজ') ||
                   recLower.includes('চাষ') || recLower.includes('বপন') || recLower.includes('ছাঁটাই') ||
                   recLower.includes('পরিষ্কার') || recLower.includes('নিষ্কাশন') || recLower.includes('নার্সারি') ||
                   recLower.includes('চারা') || recLower.includes('গভীর চাষ')) {
          recommendations.cultural.push(rec);
        } else if (recLower.includes('ট্রাইকো') || recLower.includes('নিম') || recLower.includes('ফেরোমন') ||
                   recLower.includes('জৈব') || recLower.includes('বিউভেরিয়া') || recLower.includes('হলুদ ফাঁদ') ||
                   recLower.includes('নেট') || recLower.includes('টিস্যু কালচার')) {
          recommendations.biological.push(rec);
        } else {
          recommendations.cultural.push(rec);
        }
      });
    }

    if (diagnosis.cropDiseaseMatches.length > 1) {
      const secondMatch = diagnosis.cropDiseaseMatches[1];
      recommendations.cultural.push(`বিকল্প রোগ "${secondMatch.disease.nameBn}" এর জন্যও পর্যবেক্ষণ করুন`);
    }

    if (disease.severity === 'severe') {
      recommendations.prevention.push(`"${disease.nameBn}" মারাত্মক — পরবর্তী মৌসুমে প্রতিরোধী জাত অবশ্যই লাগাবেন`);
    }
  }

  if (recommendations.cultural.length === 0) {
    recommendations.cultural.push('প্রতিরোধী জাত ব্যবহার করুন');
    recommendations.cultural.push('ফসল আবর্তন করুন');
    recommendations.cultural.push('সঠিক দূরত্বে চাষ করুন');
    recommendations.cultural.push('সুষম সার প্রয়োগ করুন');
    recommendations.cultural.push('সুস্থ বীজ ও চারা ব্যবহার করুন');
    recommendations.cultural.push('আক্রান্ত গাছের অবশিষ্ট সরিয়ে পুড়ে ফেলুন');
    recommendations.cultural.push('আগাছা পরিষ্কার রাখুন');
  }

  if (recommendations.biological.length === 0) {
    recommendations.biological.push('ট্রাইকোডার্মা প্রয়োগ করুন (ছত্রাকজনিত রোগে)');
    recommendations.biological.push('নিম তেল বা উদ্ভিদজ নিষ্কর্ষ ব্যবহার করুন');
    recommendations.biological.push('প্রাকৃতিক শত্রু সংরক্ষণ করুন');
  }

  if (recommendations.chemical.length === 0) {
    if (diagnosis.confidence === 'high' || diagnosis.confidence === 'medium') {
      diagnosis.suspects.forEach(suspect => {
        switch (suspect) {
          case 'true fungi':
            recommendations.chemical.push('প্রোপিকোনাজোল, ট্রাইসাইক্লাজোল, কার্বেন্ডাজিম বা টেবুকোনাজোল ব্যবহার করুন');
            recommendations.chemical.push('FRAC গ্রুপ রোটেশন বাধ্যতামূলক (প্রতিরোধ ক্ষমতা রোধে)');
            break;
          case 'oomycetes':
            recommendations.chemical.push('মেটালাক্সিল+মানকোজেব, ফোসেটাইল-এএল বা সাইমোক্সানিল+মানকোজেব ব্যবহার');
            recommendations.chemical.push('সাধারণ ছত্রাকনাশক কাজ করবে না — নির্দিষ্ট ওমাইসিটসাইড দরকার');
            break;
          case 'bacteria':
            recommendations.chemical.push('কপার অক্সিক্লোরাইড বা কপার হাইড্রোক্সাইড ব্যবহার করুন');
            recommendations.chemical.push('নোট: উদ্ভিদে অ্যান্টিবায়োটিক ব্যবহার সুপারিশ করা হয় না');
            break;
          case 'insects/mites':
            recommendations.chemical.push('IRAC গ্রুপ রোটেশন: নিওনিকোটিনয়েড → অর্গানোফসফেট → পাইরেথ্রয়েড');
            recommendations.chemical.push('একই গ্রুপ ২ বারের বেশি স্প্রে করবেন না');
            break;
          case 'virus':
            recommendations.chemical.push('ভাইরাসের রাসায়নিক চিকিৎসা নেই — বাহক নিয়ন্ত্রণে মনোযোগ দিন');
            recommendations.chemical.push('সাদা মাছি, পাতাফড়িং ও জাব পোকা নিয়ন্ত্রণ করুন');
            break;
        }
      });
    } else {
      recommendations.chemical.push('নিশ্চিত রোগ নির্ণয় ছাড়া রাসায়নিক নিয়ন্ত্রণ সুপারিশ করা হচ্ছে না');
    }
  }

  if (recommendations.prevention.length === 0) {
    recommendations.prevention.push('নিয়মিত মাঠ পরিদর্শন করুন');
    recommendations.prevention.push('রোগ পূর্বাভাস মডেল ব্যবহার করুন (যেখানে পাওয়া যায়)');
    recommendations.prevention.push('নতুন চারা আনার সময় কোয়ারেন্টাইন মেনে চলুন');
    recommendations.prevention.push('মাঠের পরিচ্ছন্নতা বজায় রাখুন');
    recommendations.prevention.push('প্রতিফলক মাল্চ ব্যবহার করে উড়ন্ত পোকা দূর রাখুন');
  }
  recommendations.prevention.push('সুষম সার প্রয়োগ করে গাছের রোগ প্রতিরোধ ক্ষমতা বাড়ান');

  return recommendations;
}

export function diagnoseOffline(inputData: {
  symptoms: SymptomInput;
  hostInfo?: HostInfo;
  pathogenInfo?: PathogenInfo;
  envInfo?: EnvInfo;
  crop?: string;
  infectedPart?: string;
}): OfflineDiagnosis {
  const { symptoms, hostInfo = {}, pathogenInfo = {}, envInfo = {}, crop, infectedPart } = inputData;

  const abioticBiotic = assessAbioticBiotic(symptoms);

  const { excluded, suspects } = applyExclusionGates(abioticBiotic, symptoms);

  let cropDiseaseMatches: Array<{
    disease: {
      name: string;
      nameBn: string;
      cause: string;
      pathogen: string;
      severity: string;
      season: string[];
      recommendations: string[];
    };
    score: number;
    maxScore: number;
    matchRatio: number;
    matchedSymptoms: string[];
  }> = [];
  let cropKey: string | null = null;

  if (crop) {
    cropKey = resolveCropKey(crop);

    if (cropKey && CROP_DISEASES[cropKey]) {
      const allSymptomTexts: string[] = [];
      for (const val of Object.values(symptoms)) {
        if (val && String(val) !== 'N/A') {
          String(val).split(/[,;\n]+/).forEach(s => {
            const trimmed = s.trim();
            if (trimmed) allSymptomTexts.push(trimmed);
          });
        }
      }

      cropDiseaseMatches = matchDiseasesBySymptoms(crop, allSymptomTexts);

      const partKWs = partKeywords(infectedPart);
      if (partKWs.length > 0) {
        cropDiseaseMatches = cropDiseaseMatches.map(match => {
          const symptomText = match.disease.nameBn + ' ' + match.disease.name + ' ' +
            (match.disease.pathogen || '') + ' ' + match.matchedSymptoms.join(' ');
          const partHits = partKWs.some(kw => symptomText.toLowerCase().includes(kw.toLowerCase()));
          if (partHits && match.matchRatio > 0) {
            const boosted = Math.min(0.95, match.matchRatio * 1.4);
            return { ...match, matchRatio: boosted };
          }
          return match;
        }).sort((a, b) => b.matchRatio - a.matchRatio);
      }

      const totalObserved = allSymptomTexts.length || 1;
      const combinedInputText = allSymptomTexts.join(' ').toLowerCase();

      const nameMentionedMap = new Map<string, boolean>();
      const nameMentionedResults = cropDiseaseMatches.map(match => {
        const nameBnLower = (match.disease.nameBn || '').toLowerCase();
        const nameEnLower = (match.disease.name || '').toLowerCase();
        const coreBn = nameBnLower.replace(/\s+রোগ$/, '').trim();
        const coreEn = nameEnLower.replace(/\s+disease$/, '').trim();
        const tokens = [
          ...coreBn.split(/\s+/),
          ...coreEn.split(/\s+/),
        ].filter(t => t.length >= 4 && !['disease', 'রোগ', 'ধানের', 'the', 'and'].includes(t));
        const mentioned = tokens.some(t => combinedInputText.includes(t));
        nameMentionedMap.set(match.disease.name, mentioned);
        return { ...match, _nameMentioned: mentioned };
      });

      const enhanced = nameMentionedResults.map(match => {
        const coverage = Math.min(1, match.matchedSymptoms.length / totalObserved);
        const blended = Math.min(0.95, match.matchRatio * 0.6 + coverage * 0.4);
        let final = Math.max(match.matchRatio, blended);
        if (match._nameMentioned) {
          final = Math.min(0.95, final + 0.25);
        }
        return { ...match, matchRatio: final };
      });

      cropDiseaseMatches = enhanced.sort((a, b) => {
        if (b.matchRatio !== a.matchRatio) return b.matchRatio - a.matchRatio;
        const aMentioned = nameMentionedMap.get(a.disease.name) ?? false;
        const bMentioned = nameMentionedMap.get(b.disease.name) ?? false;
        if (aMentioned && !bMentioned) return -1;
        if (!aMentioned && bMentioned) return 1;
        return b.matchedSymptoms.length - a.matchedSymptoms.length;
      });

      const nonZeroMatches = cropDiseaseMatches.filter(m => m.score > 0 || m.matchRatio > 0);
      if (nonZeroMatches.length > 0) {
        cropDiseaseMatches = nonZeroMatches;
      }

      cropDiseaseMatches.forEach(match => {
        if (match.matchRatio >= 0.3 && match.disease.cause) {
          const cause = match.disease.cause;
          if (cause === 'fungal' && !suspects.some(s => s.includes('fung'))) {
            if (!excluded.includes('fungi/oomycetes')) {
              pushUnique(suspects, 'fungal/oomycete (crop-specific match)');
            }
          }
          if (cause === 'bacterial' && !suspects.some(s => s.includes('bacteria'))) {
            pushUnique(suspects, 'bacteria (crop-specific match)');
          }
          if (cause === 'viral' && !suspects.some(s => s.includes('virus'))) {
            pushUnique(suspects, 'virus (crop-specific match)');
          }
          if (cause === 'insect' && !suspects.some(s => s.includes('insect'))) {
            pushUnique(suspects, 'insects/mites (crop-specific match)');
          }
        }
      });
    }
  } else {
    if (suspects.length === 0) {
      pushUnique(suspects, 'No crop selected — only gate-level analysis performed');
    }
  }

  const triangle = assessDiseaseTriangle(hostInfo, pathogenInfo, envInfo, crop);

  const fieldMethods = getFieldConfirmationMethods(suspects);

  const ipmRecommendations = generateIPMRecommendations({
    suspects,
    confidence: suspects.length > 0 && excluded.length > 0 ? 'medium' : 'low',
    cropDiseaseMatches,
  });

  let primarySuspect: string;
  let specificDisease: SpecificDisease | null = null;

  if (cropDiseaseMatches.length > 0 && cropDiseaseMatches[0].matchRatio >= 0.2) {
    const topMatch = cropDiseaseMatches[0];
    specificDisease = {
      name: topMatch.disease.name,
      nameBn: topMatch.disease.nameBn,
      cause: topMatch.disease.cause,
      pathogen: topMatch.disease.pathogen,
      severity: topMatch.disease.severity,
      confidence: topMatch.matchRatio >= 0.5 ? 'high' : topMatch.matchRatio >= 0.3 ? 'medium' : 'low',
      matchRatio: topMatch.matchRatio,
      matchedSymptoms: topMatch.matchedSymptoms,
    };
    primarySuspect = `${topMatch.disease.nameBn} (${topMatch.disease.name})`;
  } else {
    primarySuspect = suspects.length > 0 ? suspects[0] : 'No clear suspect - requires field observation';
  }

  const diagnosis: OfflineDiagnosis = {
    abioticBiotic,
    excluded,
    suspects,
    primarySuspect,
    specificDisease,
    cropDiseaseMatches: cropDiseaseMatches.map(m => ({
      name: m.disease.name,
      nameBn: m.disease.nameBn,
      cause: m.disease.cause,
      pathogen: m.disease.pathogen,
      severity: m.disease.severity,
      season: m.disease.season,
      score: m.score,
      maxScore: m.maxScore,
      matchRatio: m.matchRatio,
      matchedSymptoms: m.matchedSymptoms,
      recommendations: m.disease.recommendations,
    })),
    confidence: specificDisease
      ? specificDisease.confidence
      : (suspects.length > 0
        ? (suspects.length === 1 && excluded.length >= 3 ? 'high' :
           suspects.length <= 2 ? 'medium' : 'low')
        : 'low'),
    diseaseTriangle: triangle,
    fieldConfirmation: fieldMethods,
    ipmRecommendations,
    economicThreshold: suspects.length > 0
      ? 'Assess: <5% leaf area damaged for most insects = no action needed'
      : 'Monitor without treatment until cause is confirmed',
    recommendedFieldObservations: triangle.fieldObservationGuidance || [],
    timestamp: new Date().toISOString(),
  };

  return diagnosis;
}
