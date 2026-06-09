/**
 * Enhanced Weather Service for Crop Calendar Engine
 *
 * Provides:
 *   - 7-day forecast with agricultural relevance
 *   - Historical comparison (this month vs. long-term averages)
 *   - Crop-specific weather suitability scoring
 *   - Disease pressure index based on forecast
 *   - Irrigation need estimation
 *   - Spray window recommendations
 *
 * Uses Open-Meteo API (free, no key required).
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface CropTempRange {
  min: number;
  max: number;
  optimal: number;
  nameEn: string;
}

export interface ClimateAverage {
  temp: number;
  humidity: number;
  rain: number;
}

export interface ForecastDay {
  date: string;
  dayOfWeek: string;
  tempMax: number;
  tempMin: number;
  rain: number;
  rainProb: number;
  windMax: number;
  uvMax: number;
  humidity: number;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  rain24h: number;
  windSpeed: number;
  uvIndex: number;
}

export interface ParsedForecast {
  current: CurrentWeather | null;
  days: ForecastDay[];
  weekRainTotal: number;
  weekAvgTemp: number;
  weekAvgHumidity: number;
}

export interface ClimateComparison {
  temp: {
    current: number;
    average: number;
    deviation: number;
    status: 'hotter' | 'cooler' | 'normal';
  };
  humidity: {
    current: number;
    average: number;
    deviation: number;
    status: 'wetter' | 'drier' | 'normal';
  };
  rain: {
    current: number;
    averageMonthly: number;
    status: 'heavy' | 'dry_season' | 'normal';
  };
}

export interface SuitabilityScore {
  score: number;
  label: string;
  breakdown: {
    tempScore: number;
    rainScore: number;
    humidScore: number;
  };
  tempStatus: 'in_range' | 'too_cold' | 'too_hot';
  waterStatus: 'sufficient' | 'deficit';
}

export interface DiseasePressure {
  disease: string;
  pressure: 'low' | 'medium' | 'high';
  reason: string;
}

export interface IrrigationNeed {
  need: 'none' | 'low' | 'moderate' | 'critical' | 'unknown';
  mmDeficit: number;
  weeklyRain: number;
  weeklyNeed: number;
  next3DaysRain: number;
  advice: string;
}

export interface SprayWindow {
  date: string;
  dayOfWeek: string;
  tempMax: number;
  rainProb: number;
  windMax: number;
  quality: 'excellent' | 'good' | 'fair';
  window: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BD_CENTER = { lat: 23.685, lon: 90.356 };

/** Crop-specific optimal temperature ranges (°C) */
export const CROP_TEMP_RANGES: Record<string, CropTempRange> = {
  'ধান':     { min: 20, max: 35, optimal: 25, nameEn: 'Rice' },
  'পাট':     { min: 24, max: 38, optimal: 30, nameEn: 'Jute' },
  'আলু':     { min: 10, max: 25, optimal: 18, nameEn: 'Potato' },
  'টমেটো':   { min: 15, max: 30, optimal: 24, nameEn: 'Tomato' },
  'বেগুন':   { min: 20, max: 35, optimal: 28, nameEn: 'Brinjal' },
  'সরিষা':   { min: 10, max: 28, optimal: 20, nameEn: 'Mustard' },
  'কলা':     { min: 20, max: 38, optimal: 28, nameEn: 'Banana' },
  'আম':      { min: 22, max: 38, optimal: 30, nameEn: 'Mango' },
  'গম':      { min: 10, max: 25, optimal: 18, nameEn: 'Wheat' },
  'ভুট্টা':   { min: 18, max: 35, optimal: 26, nameEn: 'Maize' },
};

/** Crop-specific water needs (mm/week) */
export const CROP_WATER_NEEDS: Record<string, number> = {
  'ধান':   50,
  'পাট':   35,
  'আলু':   25,
  'টমেটো': 30,
  'বেগুন': 30,
  'সরিষা': 20,
  'কলা':   40,
  'আম':    25,
  'গম':    20,
  'ভুট্টা': 35,
};

/** Long-term monthly climate averages for Bangladesh (approximate) */
export const BD_CLIMATE_AVERAGES: Record<number, ClimateAverage> = {
  1:  { temp: 19, humidity: 72, rain: 10 },
  2:  { temp: 22, humidity: 65, rain: 20 },
  3:  { temp: 27, humidity: 62, rain: 40 },
  4:  { temp: 30, humidity: 68, rain: 80 },
  5:  { temp: 30, humidity: 76, rain: 160 },
  6:  { temp: 29, humidity: 84, rain: 320 },
  7:  { temp: 29, humidity: 87, rain: 380 },
  8:  { temp: 29, humidity: 86, rain: 320 },
  9:  { temp: 29, humidity: 83, rain: 250 },
  10: { temp: 28, humidity: 78, rain: 160 },
  11: { temp: 24, humidity: 74, rain: 30 },
  12: { temp: 20, humidity: 73, rain: 10 },
};

// ── API Fetch Functions ───────────────────────────────────────────────────────

/**
 * Fetch 7-day weather forecast from Open-Meteo.
 */
export async function fetch7DayForecast(lat: number = BD_CENTER.lat, lon: number = BD_CENTER.lon): Promise<Record<string, unknown>> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,relative_humidity_2m_mean` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,uv_index` +
    `&timezone=Asia%2FDhaka&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo forecast API error: ${res.status}`);
  return res.json();
}

// ── Data Processing ───────────────────────────────────────────────────────────

/**
 * Parse raw Open-Meteo forecast into a structured 7-day object.
 */
export function parseForecast(raw: Record<string, unknown> | null): ParsedForecast | null {
  if (!raw?.daily) return null;

  const daily = raw.daily as { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[]; precipitation_probability_max: number[]; wind_speed_10m_max: number[]; uv_index_max: number[]; relative_humidity_2m_mean: number[] };
  const current = raw.current as { temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; precipitation: number; wind_speed_10m: number; uv_index: number };

  const days: ForecastDay[] = daily.time.map((date: string, i: number) => ({
    date,
    dayOfWeek: new Date(date).toLocaleDateString('bn-BD', { weekday: 'short' }),
    tempMax: Math.round(daily.temperature_2m_max?.[i] ?? 0),
    tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 0),
    rain: Math.round((daily.precipitation_sum?.[i] ?? 0) * 10) / 10,
    rainProb: daily.precipitation_probability_max?.[i] ?? 0,
    windMax: Math.round(daily.wind_speed_10m_max?.[i] ?? 0),
    uvMax: Math.round(daily.uv_index_max?.[i] ?? 0),
    humidity: Math.round(daily.relative_humidity_2m_mean?.[i] ?? 50),
  }));

  return {
    current: current ? {
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      rain24h: Math.round((current.precipitation ?? 0) * 10) / 10,
      windSpeed: Math.round(current.wind_speed_10m),
      uvIndex: Math.round(current.uv_index),
    } : null,
    days,
    weekRainTotal: days.reduce((s, d) => s + d.rain, 0),
    weekAvgTemp: Math.round(days.reduce((s, d) => s + (d.tempMax + d.tempMin) / 2, 0) / days.length),
    weekAvgHumidity: Math.round(days.reduce((s, d) => s + d.humidity, 0) / days.length),
  };
}

/**
 * Compare current weather with long-term Bangladesh averages.
 */
export function compareWithClimate(currentWeather: CurrentWeather | null, month: number): ClimateComparison | null {
  if (!currentWeather) return null;
  const avg = BD_CLIMATE_AVERAGES[month];
  if (!avg) return null;

  return {
    temp: {
      current: currentWeather.temp,
      average: avg.temp,
      deviation: currentWeather.temp - avg.temp,
      status: currentWeather.temp > avg.temp + 3 ? 'hotter' :
              currentWeather.temp < avg.temp - 3 ? 'cooler' : 'normal',
    },
    humidity: {
      current: currentWeather.humidity,
      average: avg.humidity,
      deviation: currentWeather.humidity - avg.humidity,
      status: currentWeather.humidity > avg.humidity + 10 ? 'wetter' :
              currentWeather.humidity < avg.humidity - 10 ? 'drier' : 'normal',
    },
    rain: {
      current: currentWeather.rain24h,
      averageMonthly: avg.rain,
      status: currentWeather.rain24h > avg.rain / 30 * 2 ? 'heavy' :
              currentWeather.rain24h < 1 && avg.rain < 30 ? 'dry_season' : 'normal',
    },
  };
}

// ── Crop-Specific Scoring ────────────────────────────────────────────────────

/**
 * Score weather suitability for a specific crop based on forecast.
 * Returns 0-100 score with breakdown.
 */
export function scoreCropWeatherSuitability(cropBn: string, forecast: ParsedForecast | null): SuitabilityScore {
  const range = CROP_TEMP_RANGES[cropBn];
  const waterNeed = CROP_WATER_NEEDS[cropBn] ?? 30;

  if (!range || !forecast?.days?.length) {
    return { score: 50, label: 'মিশ্র', breakdown: { tempScore: 0, rainScore: 0, humidScore: 0 }, tempStatus: 'in_range', waterStatus: 'deficit' };
  }

  // Temperature score (0-40 points)
  let tempScore = 0;
  const avgTemp = forecast.weekAvgTemp;
  if (avgTemp >= range.min && avgTemp <= range.max) {
    const distFromOptimal = Math.abs(avgTemp - range.optimal);
    tempScore = Math.max(20, 40 - distFromOptimal * 3);
  } else if (avgTemp < range.min) {
    tempScore = Math.max(0, 20 - (range.min - avgTemp) * 4);
  } else {
    tempScore = Math.max(0, 20 - (avgTemp - range.max) * 4);
  }

  // Rain/irrigation score (0-30 points)
  let rainScore = 0;
  const weeklyRain = forecast.weekRainTotal;
  if (weeklyRain >= waterNeed * 0.8 && weeklyRain <= waterNeed * 2) {
    rainScore = 30;
  } else if (weeklyRain >= waterNeed * 0.5) {
    rainScore = 20;
  } else if (weeklyRain > waterNeed * 2) {
    rainScore = 15;
  } else {
    rainScore = Math.max(5, 15 - (waterNeed * 0.5 - weeklyRain) * 0.5);
  }

  // Humidity/disease risk score (0-30 points)
  let humidScore = 0;
  const avgHumid = forecast.weekAvgHumidity;
  if (cropBn === 'ধান' || cropBn === 'পাট') {
    humidScore = avgHumid > 70 ? 25 : avgHumid > 50 ? 30 : 15;
  } else if (cropBn === 'আলু' || cropBn === 'গম' || cropBn === 'সরিষা') {
    humidScore = avgHumid < 60 ? 30 : avgHumid < 75 ? 20 : 8;
  } else {
    humidScore = avgHumid >= 50 && avgHumid <= 75 ? 30 : avgHumid < 50 ? 15 : 12;
  }

  const total = Math.round(tempScore + rainScore + humidScore);
  const label = total >= 75 ? 'চমৎকার' : total >= 55 ? 'ভালো' : total >= 40 ? 'মিশ্র' : 'খারাপ';

  return {
    score: total,
    label,
    breakdown: {
      tempScore: Math.round(tempScore),
      rainScore: Math.round(rainScore),
      humidScore: Math.round(humidScore),
    },
    tempStatus: avgTemp >= range.min && avgTemp <= range.max ? 'in_range' :
                avgTemp < range.min ? 'too_cold' : 'too_hot',
    waterStatus: weeklyRain >= waterNeed * 0.8 ? 'sufficient' : 'deficit',
  };
}

/**
 * Generate disease pressure forecast based on 7-day outlook.
 */
export function forecastDiseasePressure(forecast: ParsedForecast | null): DiseasePressure[] {
  if (!forecast?.days?.length) return [];

  const pressures: DiseasePressure[] = [];
  const avgHumid = forecast.weekAvgHumidity;
  const avgTemp = forecast.weekAvgTemp;
  const totalRain = forecast.weekRainTotal;
  const hasRainyDays = forecast.days.filter(d => d.rain > 10).length;

  // Fungal disease pressure
  if (avgHumid > 80 && avgTemp >= 25 && avgTemp <= 32) {
    pressures.push({
      disease: 'ছত্রাকজনিত রোগ (Blast, Blight, Rust)',
      pressure: 'high',
      reason: `${avgHumid}% আর্দ্রতা + ${avgTemp}°C তাপমাত্রা — ছত্রাকের উপযুক্ত`,
    });
  } else if (avgHumid > 70 && avgTemp >= 22) {
    pressures.push({
      disease: 'ছত্রাকজনিত রোগ',
      pressure: 'medium',
      reason: `${avgHumid}% আর্দ্রতা — মাঝারি ঝুঁকি`,
    });
  }

  // Bacterial disease pressure
  if (hasRainyDays >= 3 && avgHumid > 80) {
    pressures.push({
      disease: 'ব্যাকটেরিয়াল রোগ (BLB, Wilt)',
      pressure: 'high',
      reason: `${hasRainyDays} দিন বৃষ্টি + উচ্চ আর্দ্রতা — ব্যাকটেরিয়া ছড়ানোর সম্ভাবনা`,
    });
  }

  // Viral disease (vector-based)
  if (avgTemp < 22) {
    pressures.push({
      disease: 'ভাইরাস রোগ (Tungro, Leaf Curl)',
      pressure: 'medium',
      reason: `${avgTemp}°C — জাব পোকা/ফড়িং সক্রিয়`,
    });
  } else if (avgTemp > 32) {
    pressures.push({
      disease: 'ভাইরাস রোগ (Leaf Curl via Whitefly)',
      pressure: 'medium',
      reason: `${avgTemp}°C — সাদা মাছি সক্রিয়`,
    });
  }

  // Insect pressure
  if (avgTemp > 28 && avgHumid >= 40 && avgHumid <= 80) {
    pressures.push({
      disease: 'পোকামাকড় (BPH, Stem Borer, Fruit Borer)',
      pressure: avgTemp > 32 ? 'high' : 'medium',
      reason: `${avgTemp}°C + ${avgHumid}% আর্দ্রতা — পোকার উপযুক্ত`,
    });
  }

  // Nutrient leaching
  if (totalRain > 100) {
    pressures.push({
      disease: 'পুষ্টি ঘাটতি (Leaching)',
      pressure: totalRain > 200 ? 'high' : 'medium',
      reason: `${Math.round(totalRain)}mm বৃষ্টি — সার ধুয়ে যাওয়ার ঝুঁকি`,
    });
  }

  if (pressures.length === 0) {
    pressures.push({
      disease: 'সাধারণ',
      pressure: 'low',
      reason: 'আবহাওয়া অনুকূল — রোগের চাপ কম',
    });
  }

  return pressures;
}

/**
 * Estimate irrigation need for a crop based on forecast.
 */
export function estimateIrrigationNeed(cropBn: string, forecast: ParsedForecast | null): IrrigationNeed {
  const waterNeed = CROP_WATER_NEEDS[cropBn] ?? 30;
  if (!forecast?.days?.length) {
    return { need: 'unknown', mmDeficit: 0, weeklyRain: 0, weeklyNeed: waterNeed, next3DaysRain: 0, advice: 'আবহাওয়ার তথ্য নেই' };
  }

  const weeklyRain = forecast.weekRainTotal;
  const deficit = Math.max(0, waterNeed - weeklyRain);
  const next3DaysRain = forecast.days.slice(0, 3).reduce((s, d) => s + d.rain, 0);

  let need: IrrigationNeed['need'];
  let advice: string;

  if (deficit <= 0) {
    need = 'none';
    advice = 'বৃষ্টির পানি যথেষ্ট — সেচের প্রয়োজন নেই';
  } else if (deficit <= waterNeed * 0.3) {
    need = 'low';
    advice = next3DaysRain > 10
      ? `আসন্ন বৃষ্টি (${Math.round(next3DaysRain)}mm) — সেচ স্থগিত রাখুন`
      : 'হালকা সেচ দিন — মাটির রস কম';
  } else if (deficit <= waterNeed * 0.6) {
    need = 'moderate';
    advice = next3DaysRain > 20
      ? 'কিছু বৃষ্টি আসছে — তবে পরিমিত সেচ দিন'
      : 'নিয়মিত সেচ দিন — পানির ঘাটতি আছে';
  } else {
    need = 'critical';
    advice = next3DaysRain > 15
      ? 'বৃষ্টি আসতে পারে — তবে জরুরি সেচ দিন'
      : 'জরুরি সেচ প্রয়োজন — মারাত্মক পানি ঘাটতি';
  }

  return {
    need,
    mmDeficit: Math.round(deficit * 10) / 10,
    weeklyRain: Math.round(weeklyRain * 10) / 10,
    weeklyNeed: waterNeed,
    next3DaysRain: Math.round(next3DaysRain * 10) / 10,
    advice,
  };
}

/**
 * Get spray weather windows from forecast.
 */
export function findSprayWindows(forecast: ParsedForecast | null): SprayWindow[] {
  if (!forecast?.days?.length) return [];

  const windows: SprayWindow[] = [];
  for (const day of forecast.days) {
    if (day.rainProb > 40) continue;
    if (day.windMax > 15) continue;
    if (day.tempMax > 38) continue;

    let quality: SprayWindow['quality'];
    if (day.rainProb < 20 && day.windMax < 10 && day.uvMax < 8) {
      quality = 'excellent';
    } else if (day.rainProb < 30 && day.windMax < 12) {
      quality = 'good';
    } else {
      quality = 'fair';
    }

    windows.push({
      date: day.date,
      dayOfWeek: day.dayOfWeek,
      tempMax: day.tempMax,
      rainProb: day.rainProb,
      windMax: day.windMax,
      quality,
      window: quality === 'excellent' ? 'সকাল ৬-৯টা বা বিকাল ৪-৬টা' :
              quality === 'good' ? 'সকালে স্প্রে করুন' : 'সতর্কতার সাথে স্প্রে করুন',
    });
  }

  return windows.slice(0, 5);
}

/**
 * Get Bangladesh climate averages for a given month.
 */
export function getClimateAverage(month: number): ClimateAverage | null {
  return BD_CLIMATE_AVERAGES[month] ?? null;
}

/**
 * Get crop temperature range data.
 */
export function getCropTempRange(cropBn: string): CropTempRange | null {
  return CROP_TEMP_RANGES[cropBn] ?? null;
}

/**
 * Get crop water needs data.
 */
export function getCropWaterNeed(cropBn: string): number | null {
  return CROP_WATER_NEEDS[cropBn] ?? null;
}
