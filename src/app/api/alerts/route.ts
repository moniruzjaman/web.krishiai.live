/**
 * /api/alerts — KrishiAI Agricultural Alerts API
 *
 * Returns location-based IPM alerts, weather warnings, and seasonal
 * disease/pest risk notifications for Bangladesh farmers.
 *
 * Query params:
 *   - lat: Latitude (optional)
 *   - lng: Longitude (optional)
 *   - district: Bengali district name (optional)
 *   - type: "all" | "disease" | "pest" | "weather" (default: "all")
 */

import { NextRequest, NextResponse } from "next/server";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Alert {
  id: string;
  type: 'disease' | 'pest' | 'weather' | 'seasonal';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  titleBn: string;
  message: string;
  messageBn: string;
  action: string;
  actionBn: string;
  region: string[];
  months: number[];
  source: string;
}

// ── Alert Database ─────────────────────────────────────────────────────────────

const ALERTS: Alert[] = [
  // Disease Alerts
  {
    id: 'blast-boro',
    type: 'disease',
    severity: 'critical',
    title: 'Rice Blast Risk — Boro Season',
    titleBn: 'বোরো মৌসুমে ধানের ব্লাস্ট ঝুঁকি',
    message: 'High humidity and temperature 25-30°C create ideal conditions for rice blast. Monitor fields daily.',
    messageBn: 'উচ্চ আর্দ্রতা ও ২৫-৩০°C তাপমাত্রা ব্লাস্ট রোগের আদর্শ পরিবেশ। প্রতিদিন জমি পরিদর্শন করুন।',
    action: 'Apply Tricyclazole 0.6g/L if symptoms appear. Reduce nitrogen application.',
    actionBn: 'লক্ষণ দেখলে ট্রাইসাইক্লাজোল ০.৬ গ্রাম/লিটার স্প্রে করুন। নাইট্রোজেন সার কমান।',
    region: ['ঢাকা', 'ময়মনসিংহ', 'রংপুর', 'রাজশাহী', 'সিলেট'],
    months: [1, 2, 3, 4],
    source: 'DAE / BARI',
  },
  {
    id: 'late-blight-potato',
    type: 'disease',
    severity: 'critical',
    title: 'Late Blight Warning — Potato',
    titleBn: 'আলুর লেট ব্লাইট সতর্কতা',
    message: 'Cool wet conditions favor Phytophthora infestans. Fog and dew increase risk significantly.',
    messageBn: 'ঠান্ডা ও ভেজা আবহাওয়ায় ফাইটোফথোরা ইনফেস্টান্স দ্রুত ছড়ায়। কুয়াশা ও শিশির ঝুঁকি বাড়ায়।',
    action: 'Spray Metalaxyl+Mancozeb (Ridomil Gold) immediately. Repeat every 7 days.',
    actionBn: 'মেটালাক্সিল+মানকোজেব (রিডোমিল গোল্ড) এখনই স্প্রে করুন। ৭ দিন পর পর পুনরায় স্প্রে।',
    region: ['রংপুর', 'দিনাজপুর', 'রাজশাহী', 'বগুড়া', 'ঠাকুরগাঁও'],
    months: [11, 12, 1, 2],
    source: 'DAE / Tuber Crops Research Center',
  },
  {
    id: 'sheath-blight-kharif',
    type: 'disease',
    severity: 'high',
    title: 'Sheath Blight Risk — Monsoon Rice',
    titleBn: 'বর্ষাকালীন ধানে শিথ ব্লাইট ঝুঁকি',
    message: 'Dense planting + high humidity + 28-32°C = Sheath Blight outbreak conditions.',
    messageBn: 'ঘন চাষ + উচ্চ আর্দ্রতা + ২৮-৩২°C = শিথ ব্লাইট প্রাদুর্ভাবের শর্ত।',
    action: 'Reduce plant density. Apply Validamycin or Hexaconazole if lesions appear.',
    actionBn: 'ঘনত্ব কমান। দাগ দেখলে ভ্যালিডামাইসিন বা হেক্সাকোনাজোল স্প্রে করুন।',
    region: ['ঢাকা', 'ফরিদপুর', 'বরিশাল', 'কুমিল্লা', 'সিলেট'],
    months: [6, 7, 8, 9],
    source: 'BRRI / DAE',
  },
  // Pest Alerts
  {
    id: 'brown-planthopper',
    type: 'pest',
    severity: 'critical',
    title: 'Brown Planthopper (BPH) Outbreak',
    titleBn: 'বাদামি গাছফড়িং (BPH) প্রাদুর্ভাব',
    message: 'BPH outbreaks reported in multiple districts. Causes hopperburn and ragged stunt virus.',
    messageBn: 'একাধিক জেলায় বিপিএইচ প্রাদুর্ভাব রিপোর্ট। হপারবার্ন ও র‍্যাগড স্টান্ট ভাইরাস ছড়ায়।',
    action: 'Drain fields. Apply Pymetrozine or Dinotefuran. Avoid pyrethroids (increase BPH).',
    actionBn: 'জমির পানি সরান। পাইমেট্রোজিন বা ডাইনোটেফুরান প্রয়োগ। পাইরেথ্রয়েড ব্যবহার করবেন না।',
    region: ['ঢাকা', 'ময়মনসিংহ', 'রংপুর', 'রাজশাহী', 'সিলেট'],
    months: [7, 8, 9, 10],
    source: 'BRRI',
  },
  {
    id: 'fruit-borer-brinjal',
    type: 'pest',
    severity: 'high',
    title: 'Brinjal Shoot & Fruit Borer',
    titleBn: 'বেগুনের ডগা ও ফল ছিদ্রকারী পোকা',
    message: 'Active season for Leucinodes orbonalis. Monitor for wilting shoots and entry holes on fruits.',
    messageBn: 'লিউসিনোডিস অরবোনালিস সক্রিয়। ডগা শুকিয়ে যাওয়া ও ফলে ছিদ্র দেখুন।',
    action: 'Remove affected shoots. Install pheromone traps. Spray Spinosad or Emamectin Benzoate.',
    actionBn: 'আক্রান্ত ডগা ছেঁটে ফেলুন। ফেরোমন ফাঁদ লাগান। স্পাইনোসাড বা এমামেক্টিন স্প্রে।',
    region: ['সব জেলা'],
    months: [3, 4, 5, 6, 7, 8, 9, 10],
    source: 'BARI / DAE',
  },
  {
    id: 'whitefly-tomato',
    type: 'pest',
    severity: 'high',
    title: 'Whitefly & TYLCV Risk — Tomato',
    titleBn: 'সাদা মাছি ও টিওয়াইএলসিভি ঝুঁকি — টমেটো',
    message: 'Whitefly vectors active in dry warm weather. TYLCV can cause 100% crop loss.',
    messageBn: 'শুষ্ক উষ্ণ আবহাওয়ায় সাদা মাছি সক্রিয়। টিওয়াইএলসিভি ১০০% ফসল নষ্ট করতে পারে।',
    action: 'Use yellow sticky traps. Apply Imidacloprid or Pymetrozine. Use net nursery.',
    actionBn: 'হলুদ আঠালো ফাঁদ ব্যবহার। ইমিডাক্লোপ্রিড বা পাইমেট্রোজিন স্প্রে। নেট নার্সারি করুন।',
    region: ['রাজশাহী', 'বগুড়া', 'পাবনা', 'যশোর', 'কুমিল্লা'],
    months: [10, 11, 12, 1, 2, 3],
    source: 'BARI',
  },
  // Weather Alerts
  {
    id: 'flood-risk',
    type: 'weather',
    severity: 'critical',
    title: 'Flash Flood Risk — Low-Lying Areas',
    titleBn: 'উপচে পড়ার ঝুঁকি — নিচু এলাকা',
    message: 'Heavy rainfall predicted. Low-lying crop fields at risk of flash flooding.',
    messageBn: 'ভারী বৃষ্টির পূর্বাভাস। নিচু জমির ফসল উপচে পড়ার ঝুঁকিতে।',
    action: 'Ensure drainage channels are clear. Harvest mature crops immediately if possible.',
    actionBn: 'নিষ্কাশন চ্যানেল পরিষ্কার রাখুন। পাকা ফসল সম্ভব হলে এখনই কাটুন।',
    region: ['সিলেট', 'কুমিল্লা', 'ফেনী', 'বরিশাল', 'পটুয়াখালী'],
    months: [6, 7, 8, 9],
    source: 'BMD / FFWC',
  },
  {
    id: 'cold-wave',
    type: 'weather',
    severity: 'high',
    title: 'Cold Wave Alert — Northern Districts',
    titleBn: 'শীতের ঢেউ সতর্কতা — উত্তরাঞ্চল',
    message: 'Temperature dropping below 10°C. Cold injury risk for Boro rice seedlings and vegetables.',
    messageBn: 'তাপমাত্রা ১০°C এর নিচে নামছে। বোরো ধানের চারা ও সবজিতে শীতের ক্ষতির ঝুঁকি।',
    action: 'Cover seedbeds with polythene. Irrigate fields to maintain temperature. Avoid early morning spraying.',
    actionBn: 'বীজতলা পলিথিন দিয়ে ঢাকুন। তাপমাত্রা ধরে রাখতে সেচ দিন। সকালে স্প্রে করবেন না।',
    region: ['রংপুর', 'দিনাজপুর', 'ঠাকুরগাঁও', 'পঞ্চগড়', 'কুড়িগ্রাম'],
    months: [12, 1],
    source: 'BMD / DAE',
  },
  // Seasonal Alerts
  {
    id: 'boro-transplant',
    type: 'seasonal',
    severity: 'medium',
    title: 'Boro Rice Transplanting Window',
    titleBn: 'বোরো ধান রোপণের সময়',
    message: 'Optimal transplanting period for Boro rice. Delay reduces yield potential significantly.',
    messageBn: 'বোরো ধান রোপণের উপযুক্ত সময়। বিলম্ব ফলন উল্লেখযোগ্যভাবে কমায়।',
    action: 'Transplant seedlings at 25-30 days old. Maintain 15-20cm spacing. Apply basal fertilizer.',
    actionBn: '২৫-৩০ দিনের চারা রোপণ করুন। ১৫-২০ সেমি দূরত্ব রাখুন। বেসাল সার দিন।',
    region: ['সব জেলা'],
    months: [1, 2],
    source: 'BRRI / DAE',
  },
  {
    id: 'mustard-sowing',
    type: 'seasonal',
    severity: 'medium',
    title: 'Mustard Sowing Window',
    titleBn: 'সরিষা বপনের সময়',
    message: 'Optimal sowing period for mustard. Early sowing gives better yield.',
    messageBn: 'সরিষা বপনের উপযুক্ত সময়। তাড়াতাড়ি বপনে ফলন বেশি হয়।',
    action: 'Sow BARI Sarisha-14 or 15. Apply 2-3 seeds per hole at 30cm spacing.',
    actionBn: 'বারি সরিষা-১৪ বা ১৫ বপন করুন। ৩০ সেমি দূরত্বে ২-৩ বীজ দিন।',
    region: ['রাজশাহী', 'যশোর', 'ফরিদপুর', 'ঢাকা', 'রংপুর'],
    months: [10, 11],
    source: 'BARI',
  },
];

// ── CORS ──────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  "https://krishiai.live",
  "https://www.krishiai.live",
  "https://web.krishiai.live",
];

function corsHeaders(origin: string | null) {
  const allowed = !!origin && (origin.includes("localhost") || origin.includes("127.0.0.1") || ALLOWED_ORIGINS.includes(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://krishiai.live",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

// ── GET Handler ────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);

  const typeFilter = searchParams.get("type") || "all";
  const district = searchParams.get("district");

  const currentMonth = new Date().getMonth() + 1;

  // Filter alerts by current month and type
  let filtered = ALERTS.filter(alert => {
    const typeMatch = typeFilter === "all" || alert.type === typeFilter;
    const monthMatch = alert.months.includes(currentMonth);
    return typeMatch && monthMatch;
  });

  // Filter by district if provided
  if (district) {
    filtered = filtered.filter(alert =>
      alert.region.includes(district) || alert.region.includes('সব জেলা')
    );
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  filtered.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return NextResponse.json({
    ok: true,
    month: currentMonth,
    totalAlerts: filtered.length,
    criticalCount: filtered.filter(a => a.severity === 'critical').length,
    alerts: filtered,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      ...corsHeaders(origin),
    },
  });
}
