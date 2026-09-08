// ============================================================
// KWI - Krishi Weather Intelligence
// Pest Engine — forecasts INSECT pest risk (as opposed to fungal/
// bacterial disease risk, which disease-engine.ts already covers).
//
// Kept deliberately separate from disease-engine.ts: that engine's scoring
// model (temperature optimal-range + humidity + leaf wetness + precipitation,
// all scoring UP with moisture) is built for fungal/bacterial pathogens.
// Insect pests like brown planthopper favor the OPPOSITE conditions — warm
// nights during dry spells — so forcing them through the same formula would
// produce backwards risk scores. This mirrors the same weighted-assessment
// pattern (id/name/preventive/curative/economicThreshold) for UI consistency.
// ============================================================

import type {
  PestForecast,
  PestRiskAssessment,
  PestInfo,
  WeatherData,
  ActiveCrop,
  RiskLevel,
} from '@/lib/kwi/types';

// ────────────────────────────────────────────────────────────
// Bangladesh Insect Pest Database
// ────────────────────────────────────────────────────────────

const PESTS: PestInfo[] = [
  {
    id: 'brown_planthopper',
    name: 'Brown Planthopper',
    nameBn: 'বাদামী গাছ ফড়িং',
    cropIds: ['rice'],
    affectedStages: ['tillering', 'stem_elongation', 'booting', 'heading', 'flowering'],
    minNightTempC: 24,
    maxFavorableRainMm: 5,
    symptoms: [
      'Yellowing and browning of lower leaves ("hopper burn")',
      'Circular patches of dead, dried-out plants',
      'Sticky honeydew on leaves leading to sooty mold',
      'Stunted growth, reduced tillering',
    ],
    symptomsBn: [
      'নিচের পাতা হলুদ থেকে বাদামী হয়ে যাওয়া ("হপার বার্ন")',
      'গোলাকার আকারে গাছ শুকিয়ে মরে যাওয়া',
      'পাতায় আঠালো মধু নিঃসরণ ও কালো ছত্রাক জন্মানো',
      'গাছের বৃদ্ধি ব্যাহত হওয়া, কুশি কম হওয়া',
    ],
    preventiveActions: [
      'Use resistant varieties (BRRI dhan62, dhan75)',
      'Avoid excess nitrogen — it increases hopper susceptibility',
      'Maintain wider plant spacing for airflow',
      'Conserve natural predators (spiders, mirid bugs) — avoid broad-spectrum insecticide',
    ],
    preventiveActionsBn: [
      'প্রতিরোধী জাত ব্যবহার করুন (ব্রিধান ৬২, ৭৫)',
      'অতিরিক্ত নাইট্রোজেন পরিহার করুন — এতে ফড়িং আক্রমণ বাড়ে',
      'বাতাস চলাচলের জন্য পর্যাপ্ত দূরত্বে চারা রোপণ করুন',
      'প্রাকৃতিক শত্রু (মাকড়সা, মিরিড বাগ) সংরক্ষণ করুন — বিস্তৃত-বর্ণালী কীটনাশক এড়িয়ে চলুন',
    ],
    curativeActions: [
      'Apply Imidacloprid or Buprofezin at base of plant, targeting hopper zone',
      'Drain field temporarily if infestation is severe (hoppers dislike dry base)',
      'Spot-treat affected patches rather than blanket spraying',
    ],
    curativeActionsBn: [
      'গাছের গোড়ায় ইমিডাক্লোপ্রিড বা বুপ্রোফেজিন প্রয়োগ করুন',
      'আক্রমণ গুরুতর হলে সাময়িকভাবে জমি শুকিয়ে ফেলুন (ফড়িং শুকনো গোড়া অপছন্দ করে)',
      'পুরো জমিতে না ছিটিয়ে শুধু আক্রান্ত অংশে স্প্রে করুন',
    ],
    economicThreshold: '1-2 hoppers per hill at tillering, or 5-10 per hill at booting/heading',
  },
];

// ────────────────────────────────────────────────────────────
// Scoring
// ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'very_high';
  if (score >= 45) return 'high';
  if (score >= 20) return 'moderate';
  return 'low';
}

/** Score 0-50: how far above the pest's minimum night-temperature threshold. */
function scoreNightTemp(tempMin: number, pest: PestInfo): number {
  if (tempMin < pest.minNightTempC) return 0;
  const excess = tempMin - pest.minNightTempC;
  return Math.round(clamp(30 + excess * 4, 30, 50));
}

/** Score 0-40: how dry conditions are relative to the pest's favorable ceiling. */
function scoreDrySpell(rainMm: number, pest: PestInfo): number {
  if (rainMm > pest.maxFavorableRainMm) return 0;
  const dryness = 1 - rainMm / pest.maxFavorableRainMm;
  return Math.round(clamp(40 * dryness, 0, 40));
}

/** Score 0-10: crop stage susceptibility (later vegetative/reproductive stages more exposed). */
function scoreCropStage(currentStage: string, pest: PestInfo): number {
  if (!pest.affectedStages.includes(currentStage as PestInfo['affectedStages'][number])) return 0;
  const stageOrder = ['tillering', 'stem_elongation', 'booting', 'heading', 'flowering'];
  const idx = stageOrder.indexOf(currentStage);
  if (idx < 0) return 2;
  return Math.round(clamp(4 + idx * 1.5, 0, 10));
}

// ────────────────────────────────────────────────────────────
// Main Forecast Function
// ────────────────────────────────────────────────────────────

export function generatePestForecast(
  weather: WeatherData,
  activeCrops: ActiveCrop[],
): PestForecast {
  const activeCropIds = new Set(activeCrops.map((c) => c.cropId));
  const relevantPests = PESTS.filter((p) => p.cropIds.some((cid) => activeCropIds.has(cid)));

  const todayMin = weather.daily[0]?.tempMin ?? weather.current.temperature;
  const todayRain = weather.daily[0]?.precipitationSum ?? weather.current.precipitation;

  const assessments: PestRiskAssessment[] = relevantPests.map((pest) => {
    const matchingCrops = activeCrops.filter((c) => pest.cropIds.includes(c.cropId));

    let maxRisk = 0;
    const contributing: string[] = [];

    for (const crop of matchingCrops) {
      const tempScore = scoreNightTemp(todayMin, pest);
      const drySpellScore = scoreDrySpell(todayRain, pest);
      const stageScore = scoreCropStage(crop.currentStage, pest);
      const risk = tempScore + drySpellScore + stageScore;

      if (risk > maxRisk) {
        maxRisk = risk;
        if (tempScore > 20) contributing.push(`Warm night temp (${todayMin}°C) favors ${pest.name}`);
        if (drySpellScore > 15) contributing.push(`Dry conditions (${todayRain}mm rain) favor outbreak`);
        if (stageScore > 5) contributing.push(`Current crop stage (${crop.currentStage}) is vulnerable`);
      }
    }

    return {
      pest,
      risk: maxRisk,
      level: getRiskLevel(maxRisk),
      confidence: 70,
      contributingFactors: contributing,
      preventiveActions: pest.preventiveActions,
      curativeActions: pest.curativeActions,
    };
  });

  assessments.sort((a, b) => b.risk - a.risk);

  const overallFavorability =
    assessments.length > 0
      ? Math.round(assessments.reduce((sum, a) => sum + a.risk, 0) / assessments.length)
      : 0;

  return {
    pests: assessments,
    overallFavorability,
    spreadRisk: getRiskLevel(overallFavorability),
    confidence: 70,
  };
}
