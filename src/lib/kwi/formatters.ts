import type { RiskLevel } from '@/lib/kwi/types';

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'low': return 'text-emerald-600 dark:text-emerald-400';
    case 'moderate': return 'text-amber-600 dark:text-amber-400';
    case 'high': return 'text-orange-600 dark:text-orange-400';
    case 'very_high': return 'text-red-600 dark:text-red-400';
  }
}

export function getRiskBg(level: RiskLevel): string {
  switch (level) {
    case 'low': return 'bg-emerald-100 dark:bg-emerald-950/50';
    case 'moderate': return 'bg-amber-100 dark:bg-amber-950/50';
    case 'high': return 'bg-orange-100 dark:bg-orange-950/50';
    case 'very_high': return 'bg-red-100 dark:bg-red-950/50';
  }
}

export function getRiskBorder(level: RiskLevel): string {
  switch (level) {
    case 'low': return 'border-emerald-300 dark:border-emerald-800';
    case 'moderate': return 'border-amber-300 dark:border-amber-800';
    case 'high': return 'border-orange-300 dark:border-orange-800';
    case 'very_high': return 'border-red-300 dark:border-red-800';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200';
    case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200';
    case 'low': return 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200';
    default: return 'bg-slate-100 text-slate-800';
  }
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (confidence >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export function getScoreGaugeColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function getScoreLabel(score: number, lang: 'en' | 'bn'): string {
  if (score >= 80) return lang === 'bn' ? 'চমৎকার' : 'Excellent';
  if (score >= 60) return lang === 'bn' ? 'ভালো' : 'Good';
  if (score >= 40) return lang === 'bn' ? 'মাঝারি' : 'Moderate';
  return lang === 'bn' ? 'খারাপ' : 'Poor';
}

export function formatTemperature(temp: number, lang: 'en' | 'bn' = 'en'): string {
  const v = `${Math.round(temp)}°C`;
  return lang === 'bn' ? toBnDigits(v) : v;
}

export function formatPercent(val: number): string {
  return `${Math.round(val)}%`;
}

export function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

export function formatPressure(hpa: number): string {
  return `${Math.round(hpa)} hPa`;
}

export function formatVisibility(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

export function formatRain(mm: number): string {
  return `${mm.toFixed(1)} mm`;
}

export function formatPrice(bdt: number): string {
  return `৳${bdt.toLocaleString()}`;
}

export function getWeatherIcon(code: number, isDay: boolean = true): string {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌧️';
  return '⛈️';
}

export function getWindDirection(degrees: number, lang: 'en' | 'bn' = 'en'): string {
  if (lang === 'bn') {
    // 8-point Bangla compass (matches krishiai WeatherWidget convention)
    const dirsBn = ['উত্তর', 'উত্তর-পূর্ব', 'পূর্ব', 'দক্ষিণ-পূর্ব', 'দক্ষিণ', 'দক্ষিণ-পশ্চিম', 'পশ্চিম', 'উত্তর-পশ্চিম'];
    return dirsBn[Math.round(degrees / 45) % 8];
  }
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

/** Convert western digits in a string to Bangla digits. */
export function toBnDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);
}

/**
 * Live local datetime formatters — pinned to Asia/Dhaka so the advisory
 * always matches the authentic user location & current time (Bangla first).
 */
const DHAKA_TZ = 'Asia/Dhaka';

/** "সোমবার, ২ সেপ্টেম্বর" (bn) / "Monday, 2 September" (en) */
export function formatBanglaDate(d: Date, lang: 'en' | 'bn' = 'bn'): string {
  if (lang === 'bn') {
    const weekdaysBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const monthsBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    // Extract Dhaka-local Y/M/D via Intl, then compose in Bangla
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: DHAKA_TZ, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short',
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    const day = Number(get('day'));
    const month = Number(get('month'));
    const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const wd = weekdayMap[get('weekday')] ?? new Date(d).getDay();
    return `${weekdaysBn[wd]}, ${toBnDigits(day)} ${monthsBn[month - 1]}`;
  }
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: DHAKA_TZ, weekday: 'long', day: 'numeric', month: 'long',
  }).format(d);
}

/** "সকাল ৯:২১" (bn) / "9:21 AM" (en) */
export function formatBanglaTime(d: Date, lang: 'en' | 'bn' = 'bn'): string {
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: DHAKA_TZ, hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(d);
  if (lang === 'bn') {
    // Dhaka-local hour → Bangla day period (সকাল/দুপুর/বিকাল/সন্ধ্যা/রাত)
    const hour = Number(new Intl.DateTimeFormat('en-US', {
      timeZone: DHAKA_TZ, hour: 'numeric', hour12: false,
    }).format(d)) % 24;
    const period =
      hour >= 4 && hour < 6 ? 'ভোর' :
      hour >= 6 && hour < 12 ? 'সকাল' :
      hour >= 12 && hour < 16 ? 'দুপুর' :
      hour >= 16 && hour < 18 ? 'বিকাল' :
      hour >= 18 && hour < 20 ? 'সন্ধ্যা' : 'রাত';
    // Bangla day period replaces AM/PM
    const digits = toBnDigits(time.replace(/\s?(AM|PM)$/i, ''));
    return `${period} ${digits}`;
  }
  return time;
}

export function getTimeLabel(isoTime: string, lang: 'en' | 'bn' = 'en'): string {
  const d = new Date(isoTime);
  const label = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  return lang === 'bn' ? toBnDigits(label) : label;
}

export function getDayLabel(isoDate: string, lang: 'en' | 'bn' = 'en'): string {
  const d = new Date(isoDate + (isoDate.length === 10 ? 'T00:00:00' : ''));
  const today = new Date().toISOString().split('T')[0];
  if (isoDate.slice(0, 10) === today) return lang === 'bn' ? 'আজ' : 'Today';
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  if (isoDate.slice(0, 10) === tomorrow) return lang === 'bn' ? 'আগামীকাল' : 'Tomorrow';
  if (lang === 'bn') {
    const weekdaysBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
    const monthsBn = ['জানু', 'ফেব', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুল', 'আগ', 'সেপ', 'অক্টো', 'নভে', 'ডিসে'];
    return `${weekdaysBn[d.getDay()]}, ${monthsBn[d.getMonth()]} ${toBnDigits(d.getDate())}`;
  }
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}