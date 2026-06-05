/**
 * Agronomic Rule Engine
 *
 * Scores disease likelihood based on season, crop, growth stage, and weather
 * conditions. Imports from existing crop data modules and exports functions
 * consumed by the diagnosis pipeline.
 */

import { CROP_CALENDAR, getCurrentRiskAlerts } from './cropCalendar';
import { CROP_DISEASES } from '../cropDiseases';

// ─── Internal helpers ────────────────────────────────────────────────────────

function normaliseSeasonName(nameEn: string): string {
  if (nameEn === 'Kharif-1' || nameEn === 'Kharif-2') return 'Kharif';
  return nameEn;
}

function buildCropSeasonMonthMap(cropKey: string): Record<string, Set<number>> {
  const cropEntry = CROP_CALENDAR.find((c) => c.crop === cropKey);
  if (!cropEntry) return {};

  const map: Record<string, Set<number>> = {};
  for (const season of cropEntry.seasons) {
    const key = normaliseSeasonName(season.nameEn);
    if (!map[key]) {
      map[key] = new Set();
    }
    for (const m of season.months) {
      map[key].add(m);
    }
  }
  return map;
}

function getMonthsForDiseaseSeasons(cropKey: string, diseaseSeasons: string[]): Set<number> {
  const cropSeasonMap = buildCropSeasonMonthMap(cropKey);
  const months = new Set<number>();

  for (const s of diseaseSeasons) {
    const monthSet = cropSeasonMap[s];
    if (monthSet) {
      for (const m of monthSet) {
        months.add(m);
      }
    }
  }
  return months;
}

function isMonthNear(month: number, monthSet: Set<number>, delta: number): boolean {
  for (const m of monthSet) {
    const d = Math.abs(month - m);
    const wrapped = 12 - d;
    if (Math.min(d, wrapped) <= delta) {
      return true;
    }
  }
  return false;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ─── Exported functions ──────────────────────────────────────────────────────

interface SeasonScore {
  diseaseName: string;
  seasonScore: number;
}

/**
 * Score each disease for a crop by how well the current month aligns with
 * the disease's known season(s).
 */
export function scoreDiseasesBySeason(cropKey: string, month: number): SeasonScore[] {
  const cropData = CROP_DISEASES[cropKey];
  if (!cropData) return [];

  return cropData.diseases.map((disease) => {
    const seasonMonths = getMonthsForDiseaseSeasons(cropKey, disease.season);

    if (disease.season.includes('Year-round')) {
      return { diseaseName: disease.name, seasonScore: 1.0 };
    }

    let seasonScore = 0.2;

    if (seasonMonths.size === 0) {
      seasonScore = 0.2;
    } else if (seasonMonths.has(month)) {
      seasonScore = 1.0;
    } else if (isMonthNear(month, seasonMonths, 1)) {
      seasonScore = 0.5;
    }

    return { diseaseName: disease.name, seasonScore };
  });
}

interface WeatherInput {
  temp?: number;
  humidity?: number;
  rain24h?: number;
  windSpeed?: number;
  uvIndex?: number;
}

interface WeatherScore {
  diseaseName: string;
  weatherScore: number;
}

/**
 * Score each disease for a crop by how well current weather conditions
 * favour the pathogen type.
 */
export function scoreDiseasesByWeather(cropKey: string, weather?: WeatherInput): WeatherScore[] {
  const cropData = CROP_DISEASES[cropKey];
  if (!cropData) return [];

  const { temp = 25, humidity = 50, rain24h = 0 } = weather || {};

  return cropData.diseases.map((disease) => {
    let score = 0;

    switch (disease.cause) {
      case 'fungal': {
        const humScore = humidity > 80
          ? clamp((humidity - 80) / 20, 0, 1)
          : 0;
        const tempScore = (temp >= 25 && temp <= 35)
          ? 1 - Math.abs(temp - 30) / 5
          : 0;
        score = Math.max(humScore * 0.6 + tempScore * 0.4, humScore > 0 ? 0.3 : 0);
        break;
      }

      case 'bacterial': {
        const humScore = humidity > 85
          ? clamp((humidity - 85) / 15, 0, 1)
          : 0;
        const rainScore = rain24h > 20
          ? clamp((rain24h - 20) / 30, 0, 1)
          : 0;
        score = Math.max(humScore * 0.4 + rainScore * 0.6, humScore > 0 && rainScore > 0 ? 0.5 : 0);
        break;
      }

      case 'viral': {
        if (temp < 25) {
          score = clamp((25 - temp) / 10, 0.2, 1);
        } else if (temp > 30) {
          score = clamp((temp - 30) / 5, 0.2, 1);
        } else {
          score = 0.2;
        }
        break;
      }

      case 'insect': {
        const tempScore = temp > 28
          ? clamp((temp - 28) / 7, 0, 1)
          : 0;
        const humOk = (humidity >= 40 && humidity <= 80) ? 1 : 0.3;
        score = tempScore * 0.7 + humOk * 0.3;
        break;
      }

      case 'nutrient': {
        if (rain24h > 50) {
          score = clamp((rain24h - 50) / 50, 0.5, 1);
        } else if (rain24h === 0) {
          score = 0.6;
        } else {
          score = 0.15;
        }
        break;
      }

      default:
        score = 0.1;
    }

    score = clamp(score, 0, 1);

    return { diseaseName: disease.name, weatherScore: parseFloat(score.toFixed(3)) };
  });
}

/**
 * Get current risk alerts filtered for a specific crop.
 */
export function getRiskAlertsForCrop(cropKey: string) {
  const allAlerts = getCurrentRiskAlerts();
  return allAlerts.filter((alert) => alert.crop === cropKey);
}

interface SymptomMatchInput {
  disease: string;
  matchRatio: number;
}

interface EnsembleResult {
  disease: string;
  combinedScore: number;
  symptomScore: number;
  seasonScore: number;
  weatherScore: number;
}

/**
 * Compute an ensemble score combining symptom matching, season, and weather
 * signals for each candidate disease.
 */
export function computeEnsembleScore(
  cropKey: string,
  symptomMatches: SymptomMatchInput[],
  weather: WeatherInput,
  month: number
): EnsembleResult[] {
  if (!CROP_DISEASES[cropKey]) return [];

  const seasonScores = scoreDiseasesBySeason(cropKey, month);
  const weatherScores = scoreDiseasesByWeather(cropKey, weather);

  const seasonMap = Object.fromEntries(
    seasonScores.map((s) => [s.diseaseName, s.seasonScore])
  );
  const weatherMap = Object.fromEntries(
    weatherScores.map((w) => [w.diseaseName, w.weatherScore])
  );
  const symptomMap = Object.fromEntries(
    symptomMatches.map((m) => [m.disease, m.matchRatio])
  );

  const results = CROP_DISEASES[cropKey].diseases.map((disease) => {
    const symptomScore = symptomMap[disease.name] ?? 0;
    const seasonScore = seasonMap[disease.name] ?? 0.2;
    const weatherScore = weatherMap[disease.name] ?? 0;

    const combinedScore =
      0.50 * symptomScore +
      0.25 * seasonScore +
      0.25 * weatherScore;

    return {
      disease: disease.name,
      combinedScore: parseFloat(combinedScore.toFixed(3)),
      symptomScore: parseFloat(symptomScore.toFixed(3)),
      seasonScore: parseFloat(seasonScore.toFixed(3)),
      weatherScore: parseFloat(weatherScore.toFixed(3)),
    };
  });

  results.sort((a, b) => b.combinedScore - a.combinedScore);

  return results;
}

interface RiskItem {
  level: 'low' | 'medium' | 'high';
  text: string;
}

interface SprayCondition {
  ok: boolean;
  reason: string;
  until: string | null;
}

interface WeatherRiskSummary {
  level: 'low' | 'medium' | 'high';
  risks: RiskItem[];
  sprayCondition: SprayCondition;
}

/**
 * Produce a weather risk summary with an overall risk level, a list of
 * specific risk items, and spray-condition guidance.
 */
export function getWeatherRiskSummary(weather?: WeatherInput): WeatherRiskSummary {
  const risks: RiskItem[] = [];

  if (!weather) {
    return {
      level: 'low',
      risks: [{ level: 'low', text: 'No weather data available' }],
      sprayCondition: { ok: true, reason: 'No weather data — proceed with caution', until: null },
    };
  }

  const { temp = 25, humidity = 50, rain24h = 0, windSpeed = 0, uvIndex = 0 } = weather;

  if (humidity >= 80 && temp >= 26 && temp <= 36) {
    risks.push({ level: 'high', text: 'Blast & Sheath Blight risk is high (warm & humid)' });
  }

  if (rain24h >= 50) {
    risks.push({ level: 'high', text: 'Stem borer & root rot risk is high (heavy rain)' });
  }

  if (rain24h === 0 && humidity < 55) {
    risks.push({ level: 'medium', text: 'Mite & thrips risk (dry conditions)' });
  }

  if (temp < 20) {
    risks.push({ level: 'medium', text: 'Tungro virus risk (cool weather — vector active)' });
  }

  if (humidity >= 85) {
    risks.push({ level: 'high', text: 'Bacterial blight risk is high (very humid)' });
  }

  if (risks.length === 0) {
    risks.push({ level: 'low', text: 'Weather is normal — low disease pressure' });
  }

  const hasHigh = risks.some((r) => r.level === 'high');
  const hasMedium = risks.some((r) => r.level === 'medium');
  const level = hasHigh ? 'high' : hasMedium ? 'medium' : 'low';

  let sprayCondition: SprayCondition;

  if (windSpeed > 20) {
    sprayCondition = { ok: false, reason: `Wind speed is too high (${windSpeed} km/h)`, until: 'Wait until wind subsides' };
  } else if (rain24h > 5) {
    sprayCondition = { ok: false, reason: 'Rain is likely', until: 'Wait until rain stops' };
  } else if (temp > 38) {
    sprayCondition = { ok: false, reason: 'Temperature is too high', until: 'Spray in the evening' };
  } else if (uvIndex > 8) {
    sprayCondition = { ok: false, reason: 'UV index is too high', until: 'Spray in the evening' };
  } else {
    sprayCondition = { ok: true, reason: 'Conditions are suitable for spraying', until: null };
  }

  return { level, risks, sprayCondition };
}
