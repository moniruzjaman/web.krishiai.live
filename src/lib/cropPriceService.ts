/**
 * Crop Price Service for Bangladesh
 *
 * Provides simulated crop price data based on:
 *   - Department of Agricultural Marketing (DAM) price data
 *   - HCI (Hat Bazar) price data
 *   - BBS (Bangladesh Bureau of Statistics) retail prices
 *
 * Prices are in BDT (৳) per kg unless otherwise noted.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface CropPriceInfo {
  nameEn: string;
  damCode: string;
  marketName: string;
  unit: string;
  unitBn: string;
  category: string;
}

export interface SeasonMultiplier {
  [seasonName: string]: number;
}

export interface BaselinePrice {
  peak: number;
  off: number;
  average: number;
  seasonMultipliers: SeasonMultiplier;
  priceVolatility: 'low' | 'medium' | 'high' | 'very_high';
  minSupportPrice: number | null;
}

export interface SimulatedPrice {
  crop: string;
  cropEn: string;
  price: number;
  unit: string;
  unitBn: string;
  previousWeekPrice: number;
  priceChange: number;
  priceChangePercent: number;
  trend: 'up' | 'down' | 'stable';
  trendBn: string;
  isPeakSeason: boolean;
  volatility: string;
  minSupportPrice: number | null;
  priceRange: {
    low: number;
    high: number;
    average: number;
  };
  source: string;
  lastUpdated: string;
}

export interface ProfitabilityResult {
  crop: string;
  cropEn: string;
  isInSeason: boolean;
  price: number;
  unit: string;
  costPerBigha: number;
  yieldKgPerBigha: number;
  grossRevenue: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  trend: 'up' | 'down' | 'stable';
  trendBn: string;
  volatility: string;
}

export interface TrendDisplay {
  icon: string;
  color: string;
  label: string;
}

// ── Crop Price Mapping ────────────────────────────────────────────────────────

export const CROP_PRICE_MAP: Record<string, CropPriceInfo> = {
  'ধান': {
    nameEn: 'Rice (Paddy)',
    damCode: 'rice_paddy',
    marketName: 'ধান (চালা)',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'cereal',
  },
  'পাট': {
    nameEn: 'Jute',
    damCode: 'jute',
    marketName: 'পাট',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'fiber',
  },
  'আলু': {
    nameEn: 'Potato',
    damCode: 'potato',
    marketName: 'আলু',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'vegetable',
  },
  'টমেটো': {
    nameEn: 'Tomato',
    damCode: 'tomato',
    marketName: 'টমেটো',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'vegetable',
  },
  'বেগুন': {
    nameEn: 'Brinjal',
    damCode: 'brinjal',
    marketName: 'বেগুন',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'vegetable',
  },
  'সরিষা': {
    nameEn: 'Mustard',
    damCode: 'mustard',
    marketName: 'সরিষা',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'oilseed',
  },
  'কলা': {
    nameEn: 'Banana',
    damCode: 'banana',
    marketName: 'কলা',
    unit: 'dozen',
    unitBn: 'ডজন',
    category: 'fruit',
  },
  'আম': {
    nameEn: 'Mango',
    damCode: 'mango',
    marketName: 'আম',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'fruit',
  },
  'গম': {
    nameEn: 'Wheat',
    damCode: 'wheat',
    marketName: 'গম',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'cereal',
  },
  'ভুট্টা': {
    nameEn: 'Maize',
    damCode: 'maize',
    marketName: 'ভুট্টা',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'cereal',
  },
  'পেঁয়াজ': {
    nameEn: 'Onion',
    damCode: 'onion',
    marketName: 'পেঁয়াজ',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'spice',
  },
  'রসুন': {
    nameEn: 'Garlic',
    damCode: 'garlic',
    marketName: 'রসুন',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'spice',
  },
  'মরিচ': {
    nameEn: 'Chili',
    damCode: 'chili',
    marketName: 'মরিচ',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'spice',
  },
  'মসুর ডাল': {
    nameEn: 'Lentil',
    damCode: 'lentil',
    marketName: 'মসুর ডাল',
    unit: 'kg',
    unitBn: 'কেজি',
    category: 'pulse',
  },
  'আখ': {
    nameEn: 'Sugarcane',
    damCode: 'sugarcane',
    marketName: 'আখ',
    unit: 'maund',
    unitBn: 'মণ',
    category: 'cash_crop',
  },
};

// ── Baseline Reference Prices ────────────────────────────────────────────────

export const BASELINE_PRICES: Record<string, BaselinePrice> = {
  'ধান': {
    peak: 32,
    off: 42,
    average: 36,
    seasonMultipliers: { 'বোরো': 0.85, 'আমন': 0.90, 'আউশ': 0.88 },
    priceVolatility: 'low',
    minSupportPrice: 30,
  },
  'পাট': {
    peak: 45,
    off: 65,
    average: 52,
    seasonMultipliers: { 'খরিপ-১': 0.80, 'খরিপ-২': 0.85 },
    priceVolatility: 'medium',
    minSupportPrice: null,
  },
  'আলু': {
    peak: 15,
    off: 35,
    average: 22,
    seasonMultipliers: { 'রবি': 0.65 },
    priceVolatility: 'high',
    minSupportPrice: null,
  },
  'টমেটো': {
    peak: 20,
    off: 60,
    average: 35,
    seasonMultipliers: { 'রবি': 0.55, 'খরিপ-১': 1.4 },
    priceVolatility: 'very_high',
    minSupportPrice: null,
  },
  'বেগুন': {
    peak: 25,
    off: 50,
    average: 35,
    seasonMultipliers: { 'রবি': 0.75, 'খরিপ-১': 1.15 },
    priceVolatility: 'medium',
    minSupportPrice: null,
  },
  'সরিষা': {
    peak: 80,
    off: 120,
    average: 95,
    seasonMultipliers: { 'রবি': 0.80 },
    priceVolatility: 'medium',
    minSupportPrice: null,
  },
  'কলা': {
    peak: 40,
    off: 70,
    average: 50,
    seasonMultipliers: { 'সারা বছর': 1.0 },
    priceVolatility: 'low',
    minSupportPrice: null,
  },
  'আম': {
    peak: 50,
    off: 150,
    average: 70,
    seasonMultipliers: { 'খরিপ-১': 0.60 },
    priceVolatility: 'very_high',
    minSupportPrice: null,
  },
  'গম': {
    peak: 38,
    off: 48,
    average: 42,
    seasonMultipliers: { 'রবি': 0.88 },
    priceVolatility: 'low',
    minSupportPrice: 37,
  },
  'ভুট্টা': {
    peak: 22,
    off: 35,
    average: 28,
    seasonMultipliers: { 'রবি': 0.80, 'খরিপ-১': 1.1 },
    priceVolatility: 'medium',
    minSupportPrice: null,
  },
  'পেঁয়াজ': {
    peak: 25,
    off: 80,
    average: 45,
    seasonMultipliers: { 'রবি': 0.50, 'খরিপ-১': 1.6 },
    priceVolatility: 'very_high',
    minSupportPrice: null,
  },
  'রসুন': {
    peak: 80,
    off: 180,
    average: 120,
    seasonMultipliers: { 'রবি': 0.65, 'খরিপ-১': 1.3 },
    priceVolatility: 'high',
    minSupportPrice: null,
  },
  'মরিচ': {
    peak: 60,
    off: 200,
    average: 120,
    seasonMultipliers: { 'রবি': 0.50, 'খরিপ-১': 1.5 },
    priceVolatility: 'very_high',
    minSupportPrice: null,
  },
  'মসুর ডাল': {
    peak: 85,
    off: 130,
    average: 105,
    seasonMultipliers: { 'রবি': 0.82 },
    priceVolatility: 'medium',
    minSupportPrice: null,
  },
  'আখ': {
    peak: 150,
    off: 250,
    average: 190,
    seasonMultipliers: { 'খরিপ-১': 0.75, 'খরিপ-২': 0.85 },
    priceVolatility: 'medium',
    minSupportPrice: null,
  },
};

// ── Internal Helpers ──────────────────────────────────────────────────────────

const SEASON_MONTH_MAP: Record<string, number[]> = {
  'বোরো': [12, 1, 2, 3, 4],
  'আমন': [6, 7, 8, 9, 10, 11],
  'আউশ': [3, 4, 5, 6, 7, 8],
  'রবি': [10, 11, 12, 1, 2, 3],
  'খরিপ-১': [3, 4, 5, 6, 7],
  'খরিপ-২': [7, 8, 9, 10],
  'সারা বছর': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

function getSeasonMonths(seasonName: string): number[] {
  return SEASON_MONTH_MAP[seasonName] ?? [];
}

function isCropHarvestSeason(cropBn: string, _month: number): boolean {
  const baseline = BASELINE_PRICES[cropBn];
  if (!baseline) return false;
  return baseline.average > baseline.peak;
}

function getSeasonProgress(cropBn: string, month: number): number {
  const baseline = BASELINE_PRICES[cropBn];
  if (!baseline) return 0.5;

  const seasons = Object.entries(baseline.seasonMultipliers);
  if (seasons.length === 0) return 0.5;

  const harvestMonths = seasons
    .filter(([, mult]) => mult < 1.0)
    .flatMap(([season]) => getSeasonMonths(season));

  if (harvestMonths.length === 0) return 0.5;

  let minDist = 6;
  for (const hm of harvestMonths) {
    const dist = Math.min(Math.abs(month - hm), 12 - Math.abs(month - hm));
    minDist = Math.min(minDist, dist);
  }

  return Math.min(1, minDist / 6);
}

// ── Price Simulation Engine ──────────────────────────────────────────────────

/**
 * Simulate realistic current market price based on baseline data + season.
 */
export function simulateCurrentPrice(cropBn: string, month: number, _districtId?: string): SimulatedPrice | null {
  const baseline = BASELINE_PRICES[cropBn];
  if (!baseline) return null;

  const cropInfo = CROP_PRICE_MAP[cropBn];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

  // Simple deterministic hash for daily variation
  const hash = ((dayOfYear * 2654435761) >>> 0) % 1000;
  const variation = (hash / 1000 - 0.5) * 0.20;

  // Determine if we're in peak or off season
  const isPeakSeason = isCropHarvestSeason(cropBn, month);

  // Apply seasonal interpolation
  const seasonProgress = getSeasonProgress(cropBn, month);
  const interpolatedPrice = baseline.peak + (baseline.off - baseline.peak) * (1 - seasonProgress);

  // Apply daily variation
  const currentPrice = Math.round(interpolatedPrice * (1 + variation) * 100) / 100;

  // Calculate trend (compare with "last week")
  const lastWeekHash = (((dayOfYear - 7) * 2654435761) >>> 0) % 1000;
  const lastWeekVariation = (lastWeekHash / 1000 - 0.5) * 0.20;
  const lastWeekPrice = Math.round(interpolatedPrice * (1 + lastWeekVariation) * 100) / 100;

  const priceChange = currentPrice - lastWeekPrice;
  const priceChangePercent = Math.round((priceChange / lastWeekPrice) * 100 * 10) / 10;

  const trend: 'up' | 'down' | 'stable' = priceChangePercent > 3 ? 'up' : priceChangePercent < -3 ? 'down' : 'stable';

  return {
    crop: cropBn,
    cropEn: cropInfo?.nameEn ?? cropBn,
    price: currentPrice,
    unit: cropInfo?.unit ?? 'kg',
    unitBn: cropInfo?.unitBn ?? 'কেজি',
    previousWeekPrice: lastWeekPrice,
    priceChange: Math.round(priceChange * 100) / 100,
    priceChangePercent,
    trend,
    trendBn: trend === 'up' ? 'বাড়ছে' : trend === 'down' ? 'কমছে' : 'স্থিতিশীল',
    isPeakSeason,
    volatility: baseline.priceVolatility,
    minSupportPrice: baseline.minSupportPrice,
    priceRange: {
      low: baseline.peak,
      high: baseline.off,
      average: baseline.average,
    },
    source: 'DAM/DAE Reference (Simulated)',
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

/**
 * Get all crop prices for comparison.
 */
export function getAllCropPrices(month: number, districtId?: string): SimulatedPrice[] {
  const crops = Object.keys(BASELINE_PRICES);
  return crops
    .map(crop => simulateCurrentPrice(crop, month, districtId))
    .filter((p): p is SimulatedPrice => p !== null)
    .sort((a, b) => b.priceChangePercent - a.priceChangePercent);
}

/**
 * Compare profitability of crops for the current season.
 */
export function compareCropProfitability(month: number): ProfitabilityResult[] {
  const PRODUCTION_DATA: Record<string, { costPerBigha: number; yieldKgPerBigha: number; season: number[] }> = {
    'ধান':   { costPerBigha: 8000, yieldKgPerBigha: 800, season: [12,1,2,3,4,6,7,8,9,10,11,3,4,5,6,7,8] },
    'পাট':   { costPerBigha: 6000, yieldKgPerBigha: 500, season: [3,4,5,6,7] },
    'আলু':   { costPerBigha: 15000, yieldKgPerBigha: 4000, season: [10,11,12,1,2,3] },
    'টমেটো': { costPerBigha: 12000, yieldKgPerBigha: 3000, season: [10,11,12,1,2,3] },
    'বেগুন': { costPerBigha: 10000, yieldKgPerBigha: 2500, season: [10,11,12,1,2,3,3,4,5,6,7] },
    'সরিষা': { costPerBigha: 5000, yieldKgPerBigha: 400, season: [10,11,12,1,2] },
    'কলা':   { costPerBigha: 12000, yieldKgPerBigha: 600, season: [1,2,3,4,5,6,7,8,9,10,11,12] },
    'আম':    { costPerBigha: 5000, yieldKgPerBigha: 2000, season: [2,3,4,5,6,7] },
    'গম':    { costPerBigha: 6000, yieldKgPerBigha: 600, season: [11,12,1,2,3] },
    'ভুট্টা': { costPerBigha: 10000, yieldKgPerBigha: 1500, season: [10,11,12,1,2,3,4,3,4,5,6,7,8] },
    'পেঁয়াজ': { costPerBigha: 18000, yieldKgPerBigha: 2500, season: [10,11,12,1,2,3] },
    'রসুন':   { costPerBigha: 20000, yieldKgPerBigha: 1200, season: [10,11,12,1,2,3] },
    'মরিচ':   { costPerBigha: 15000, yieldKgPerBigha: 800, season: [10,11,12,1,2,3,6,7,8,9] },
    'মসুর ডাল': { costPerBigha: 7000, yieldKgPerBigha: 300, season: [10,11,12,1,2] },
    'আখ':     { costPerBigha: 25000, yieldKgPerBigha: 8000, season: [3,4,5,6,7,8,9,10,11] },
  };

  const results: ProfitabilityResult[] = [];
  for (const [crop, data] of Object.entries(PRODUCTION_DATA)) {
    const priceData = simulateCurrentPrice(crop, month);
    if (!priceData) continue;

    const isInSeason = data.season.includes(month);
    const grossRevenue = priceData.price * data.yieldKgPerBigha;
    const netProfit = grossRevenue - data.costPerBigha;
    const profitMargin = Math.round((netProfit / data.costPerBigha) * 100);
    const roi = Math.round((netProfit / data.costPerBigha) * 100);

    results.push({
      crop,
      cropEn: CROP_PRICE_MAP[crop]?.nameEn ?? crop,
      isInSeason,
      price: priceData.price,
      unit: priceData.unit,
      costPerBigha: data.costPerBigha,
      yieldKgPerBigha: data.yieldKgPerBigha,
      grossRevenue: Math.round(grossRevenue),
      netProfit: Math.round(netProfit),
      profitMargin,
      roi,
      trend: priceData.trend,
      trendBn: priceData.trendBn,
      volatility: priceData.volatility,
    });
  }

  results.sort((a, b) => b.roi - a.roi);
  return results;
}

// ── Formatting Helpers ────────────────────────────────────────────────────────

/**
 * Format price in BDT with Bengali notation.
 */
export function formatPriceBDT(price: number): string {
  return `৳${Math.round(price)}`;
}

/**
 * Get price trend icon and color.
 */
export function getTrendDisplay(trend: string): TrendDisplay {
  switch (trend) {
    case 'up': return { icon: '📈', color: '#16a34a', label: 'বাড়ছে' };
    case 'down': return { icon: '📉', color: '#dc2626', label: 'কমছে' };
    case 'stable': return { icon: '➡️', color: '#d97706', label: 'স্থিতিশীল' };
    default: return { icon: '❓', color: '#6b7280', label: 'অজানা' };
  }
}
