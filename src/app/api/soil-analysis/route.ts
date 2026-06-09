/**
 * /api/soil-analysis — AEZ Soil Analysis API
 *
 * Uses Supabase + AI Provider Fallback for AI-powered soil analysis.
 * Supports two modes:
 *   1. GET ?aezId=28 → AEZ zone soil analysis
 *   2. POST { sand, silt, clay, organicMatter?, aezId? } → Sample analysis with USDA classification
 *
 * References SRDI, BARC, BRRI, BARI standards.
 * Returns results in Bengali.
 */

import { NextRequest } from "next/server";
import { corsHeaders, corsNextResponse } from "@/lib/cors";

// ── AEZ Data ──────────────────────────────────────────────────────────────────
const AEZ_ZONES = [
  { id: 1, name: "Old Himalayan Piedmont Plain", bn: "পুরাতন হিমালয় পাদদেশীয় সমভূমি" },
  { id: 2, name: "Active Tista Floodplain", bn: "সক্রিয় তিস্তা বন্যার সমভূমি" },
  { id: 3, name: "Tista Meander Floodplain", bn: "তিস্তা আঁকাবাঁকা বন্যার সমভূমি" },
  { id: 4, name: "Karatoya-Bangali Floodplain", bn: "করতোয়া-বঙ্গলী বন্যার সমভূমি" },
  { id: 5, name: "Lower Atrai Basin", bn: "নিম্ন আত্রাই অববাহিকা" },
  { id: 6, name: "Lower Purnabhaba Floodplain", bn: "নিম্ন পুর্ণভবা বন্যার সমভূমি" },
  { id: 7, name: "Active Brahmaputra-Jamuna Floodplain", bn: "সক্রিয় ব্রহ্মপুত্র-যমুনা বন্যার সমভূমি" },
  { id: 8, name: "Young Brahmaputra and Jamuna Floodplain", bn: "নবীন ব্রহ্মপুত্র ও যমুনা বন্যার সমভূমি" },
  { id: 9, name: "Old Brahmaputra Floodplain", bn: "পুরাতন ব্রহ্মপুত্র বন্যার সমভূমি" },
  { id: 10, name: "Active Ganges Floodplain", bn: "সক্রিয় গঙ্গা বন্যার সমভূমি" },
  { id: 11, name: "High Ganges River Floodplain", bn: "উচ্চ গঙ্গা নদী বন্যার সমভূমি" },
  { id: 12, name: "Low Ganges River Floodplain", bn: "নিম্ন গঙ্গা নদী বন্যার সমভূমি" },
  { id: 13, name: "Ganges Tidal Floodplain", bn: "গঙ্গা জোয়ার-ভাটার সমভূমি" },
  { id: 14, name: "Gopalganj-Khulna Bils", bn: "গোপালগঞ্জ-খুলনা বিল" },
  { id: 15, name: "Arial Bil", bn: "আড়িয়াল বিল" },
  { id: 16, name: "Middle Meghna River Floodplain", bn: "মধ্য মেঘনা নদী বন্যার সমভূমি" },
  { id: 17, name: "Lower Meghna River Floodplain", bn: "নিম্ন মেঘনা নদী বন্যার সমভূমি" },
  { id: 18, name: "Young Meghna Estuarine Floodplain", bn: "নবীন মেঘনা মোহনা বন্যার সমভূমি" },
  { id: 19, name: "Old Meghna Estuarine Floodplain", bn: "পুরাতন মেঘনা মোহনা বন্যার সমভূমি" },
  { id: 20, name: "Eastern Surma-Kusiyara Floodplain", bn: "পূর্ব সুরমা-কুশিয়ারা বন্যার সমভূমি" },
  { id: 21, name: "Sylhet Basin", bn: "সিলেট অববাহিকা" },
  { id: 22, name: "Northern and Eastern Piedmont Plains", bn: "উত্তর ও পূর্ব পাদদেশীয় সমভূমি" },
  { id: 23, name: "Chittagong Coastal Plain", bn: "চট্টগ্রাম উপকূলীয় সমভূমি" },
  { id: 24, name: "St. Martin's Coral Island", bn: "সেন্টমার্টিন প্রবাল দ্বীপ" },
  { id: 25, name: "Level Barind Tract", bn: "সমতল বরেন্দ্র ভূমি" },
  { id: 26, name: "High Barind Tract", bn: "উচ্চ বরেন্দ্র ভূমি" },
  { id: 27, name: "North-eastern Barind Tract", bn: "উত্তর-পূর্ব বরেন্দ্র ভূমি" },
  { id: 28, name: "Madhupur Tract", bn: "মধুপুর ভূমি" },
  { id: 29, name: "Northern and Eastern Hills", bn: "উত্তর ও পূর্ব পাহাড়ি এলাকা" },
  { id: 30, name: "Akhaura Terrace", bn: "আখাউড়া টেরেস" },
];

// ── USDA Soil Texture Classification ──────────────────────────────────────────
function classifyUSDA(sand: number, silt: number, clay: number): string {
  if (clay >= 40 && sand >= 45) return "Sandy Clay (বেলে-পলি মাটি)";
  if (clay >= 40 && silt >= 40) return "Silty Clay (পলিত-পলি মাটি)";
  if (clay >= 40) return "Clay (পলি মাটি)";
  if (clay >= 27 && sand >= 20 && sand <= 45) return "Clay Loam (পলি দোআঁশ মাটি)";
  if (clay >= 27 && sand > 45) return "Sandy Clay Loam (বেলে পলি দোআঁশ মাটি)";
  if (clay >= 27 && silt > 50) return "Silty Clay Loam (পলিত পলি দোআঁশ মাটি)";
  if (sand >= 50 && clay < 20) return "Loamy Sand (দোআঁশ বেলে মাটি)";
  if (sand >= 85) return "Sand (বেলে মাটি)";
  if (silt >= 50 && silt < 80 && clay < 27) return "Silt (পলিত মাটি)";
  if (silt >= 80) return "Silt (পলিত মাটি)";
  if (sand >= 30 && clay < 27) return "Sandy Loam (বেলে দোআঁশ মাটি)";
  if (silt >= 28 && clay < 27) return "Silt Loam (পলিত দোআঁশ মাটি)";
  return "Loam (দোআঁশ মাটি)";
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin"), ["GET", "POST"]),
  });
}

// ── GET: AEZ Zone Analysis ────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const aezId = request.nextUrl.searchParams.get("aezId");
  if (!aezId) {
    return corsNextResponse(
      { ok: false, error: "aezId প্যারামিটার প্রয়োজন" },
      { status: 400, origin }
    );
  }

  const zone = AEZ_ZONES.find((z) => z.id === Number(aezId));
  if (!zone) {
    return corsNextResponse(
      { ok: false, error: "অবৈধ AEZ জোন ID" },
      { status: 400, origin }
    );
  }

  try {
    const systemPrompt = `তুমি বাংলাদেশের মৃত্তিকা বিজ্ঞান বিশেষজ্ঞ। তোমার পরামর্শ SRDI (মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট), BARC (বাংলাদেশ কৃষি গবেষণা পরিষদ), BRRI (বাংলাদেশ ধান গবেষণা ইনস্টিটিউট) এবং BARI (বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট)-এর গবেষণার উপর ভিত্তি করে হবে। বাংলায় উত্তর দাও।`;

    const userPrompt = `বাংলাদেশের AEZ (Agro-Ecological Zone) নম্বর ${zone.id} — "${zone.name}" (${zone.bn}) সম্পর্কে বিস্তারিত মৃত্তিকা বিশ্লেষণ দাও।

নিচের বিষয়গুলো অবশ্যই অন্তর্ভুক্ত করবে:

১. **মাটির বৈশিষ্ট্য**: প্রধান মাটির ধরন, গঠন, রং, গভীরতা
২. **জৈব পদার্থ**: জৈব কার্বনের পরিমাণ ও অবস্থা
৩. **ভূমির ধরন**: উচ্চ, মধ্যম, নিম্ন — বন্যার ঝুঁকি
৪. **pH পরিসীমা**: মাটির অম্লতা/ক্ষারত্ব
৫. **উপযুক্ত ফসল**: এই জোনের জন্য সবচেয়ে উপযুক্ত ফসলের তালিকা (BRRI ও BARI জাত উল্লেখসহ)
৬. **সারের সুপারিশ**: BARC সার সুপারিশ গাইডলাইন অনুযায়ী
৭. **জল ব্যবস্থাপনা**: সেচ ও নিষ্কাশন পরামর্শ
৮. **বিশেষ সমস্যা**: লবণাক্ততা, খরা, বন্যা বা অন্যান্য সমস্যা

তথ্যসূত্র হিসেবে SRDI, BARC, BRRI, BARI উল্লেখ করবে।`;

    let analysis = "";

    try {
      const { aiChat } = await import("@/lib/ai-client");
      const result = await aiChat(systemPrompt, userPrompt, {
        feature: "soil_analysis",
        temperature: 0.6,
        maxTokens: 2000,
      });
      if (result.provider !== "offline" && result.text) analysis = result.text;
    } catch (e) {
      console.warn("[soil-analysis:GET] AI client failed:", e instanceof Error ? e.message : String(e));
    }

    if (!analysis) {
      analysis = `AEZ জোন ${zone.id} "${zone.bn}" — মৃত্তিকা বিশ্লেষণ\n\nএই জোনের মাটি সাধারণত পলি থেকে পলি দোআঁশ প্রকারের। জৈব পদার্থের পরিমাণ মাঝারি। বন্যার ঝুঁকি অঞ্চলভেদে ভিন্ন।\n\nউপযুক্ত ফসল: ধান, গম, সরিষা, আলু (মৌসুম অনুযায়ী)।\nসার সুপারিশ: BARC গাইডলাইন অনুযায়ী মাটি পরীক্ষার পর সার প্রয়োগ করুন।\n\nবিস্তারিত তথ্যের জন্য নিকটস্থ SRDI অফিসে যোগাযোগ করুন।`;
    }

    if (!analysis) {
      analysis = "বিশ্লেষণ এখন উপলব্ধ নয়। পরে আবার চেষ্টা করুন।";
    }

    return corsNextResponse(
      {
        ok: true,
        zone,
        analysis,
        sources: [
          "SRDI — মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট",
          "BARC — বাংলাদেশ কৃষি গবেষণা পরিষদ সার সুপারিশ গাইডলাইন",
          "BRRI — বাংলাদেশ ধান গবেষণা ইনস্টিটিউট",
          "BARI — বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট",
        ],
      },
      { origin }
    );
  } catch (e) {
    console.error("AEZ analysis error:", e);
    return corsNextResponse(
      { ok: false, error: "AI বিশ্লেষণ এখন উপলব্ধ নয়", analysis: null },
      { status: 503, origin }
    );
  }
}

// ── POST: Soil Sample Analysis ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  try {
    const body = await request.json();
    const { sand, silt, clay, organicMatter, aezId } = body;

    if (sand == null || silt == null || clay == null) {
      return corsNextResponse(
        { ok: false, error: "বালি, পলি ও কাদার শতাংশ প্রয়োজন" },
        { status: 400, origin }
      );
    }

    const sandNum = Number(sand);
    const siltNum = Number(silt);
    const clayNum = Number(clay);
    const omNum = organicMatter != null ? Number(organicMatter) : null;
    const total = sandNum + siltNum + clayNum;

    if (Math.abs(total - 100) > 5) {
      return corsNextResponse(
        { ok: false, error: `বালি + পলি + কাদা = ${total}% হতে হবে ১০০% (±৫% সহনশীলতা)` },
        { status: 400, origin }
      );
    }

    const usdaClass = classifyUSDA(sandNum, siltNum, clayNum);
    const zone = aezId ? AEZ_ZONES.find((z) => z.id === Number(aezId)) : null;
    const aezContext = zone
      ? `এই মাটি নমুনা AEZ জোন ${zone.id} "${zone.name}" (${zone.bn}) এলাকা থেকে সংগৃহীত।`
      : "";

    const omContext = omNum != null ? `জৈব পদার্থ: ${omNum}%` : "জৈব পদার্থের তথ্য দেওয়া হয়নি।";

    const systemPrompt = `তুমি বাংলাদেশের মৃত্তিকা বিজ্ঞান বিশেষজ্ঞ। USDA মাটি শ্রেণিবিন্যাস পদ্ধতির উপর দক্ষ। তোমার পরামর্শ SRDI, BARC, BRRI, BARI-এর মান অনুযায়ী হবে। বাংলায় উত্তর দাও। সংক্ষিপ্ত কিন্তু তথ্যপূর্ণ উত্তর দাও।`;

    const userPrompt = `মাটি নমুনা বিশ্লেষণ করো:
- বালি (Sand): ${sandNum}%
- পলি (Silt): ${siltNum}%
- কাদা (Clay): ${clayNum}%
- ${omContext}
- USDA শ্রেণিবিন্যাস: ${usdaClass}
${aezContext}

নিচের বিষয়গুলো বিশ্লেষণ করো:

১. **মাটির ধরন বিশ্লেষণ**: এই মাটির গঠনগত বৈশিষ্ট্য, জল ধারণ ক্ষমতা, বায়ু চলাচল
২. **উর্বরতা মূল্যায়ন**: এই মাটিতে পুষ্টির অবস্থা (N, P, K, S, Zn)
৩. **উপযুক্ত ফসল**: এই মাটিতে সবচেয়ে ভালো হবে এমন ফসল (BRRI/BARI জাত উল্লেখসহ)
৪. **সারের সুপারিশ**: BARC গাইডলাইন অনুযায়ী সারের মাত্রা (প্রতি বিঘায়)
৫. **জল ব্যবস্থাপনা**: সেচ ও নিষ্কাশন পরামর্শ
৬. **মাটি উন্নয়ন**: এই মাটির উর্বরতা বাড়ানোর উপায়

তথ্যসূত্র হিসেবে SRDI, BARC, BRRI, BARI উল্লেখ করবে।`;

    let analysis = "";

    try {
      const { aiChat } = await import("@/lib/ai-client");
      const result = await aiChat(systemPrompt, userPrompt, {
        feature: "soil_analysis",
        temperature: 0.6,
        maxTokens: 2000,
      });
      if (result.provider !== "offline" && result.text) analysis = result.text;
    } catch (e) {
      console.warn("[soil-analysis:POST] AI client failed:", e instanceof Error ? e.message : String(e));
    }

    if (!analysis) {
      const zoneNote = zone ? ` AEZ জোন ${zone.id} "${zone.bn}" অঞ্চলের।` : "";
      analysis = `মাটি নমুনা বিশ্লেষণ\n\nUSDA শ্রেণিবিন্যাস: ${usdaClass}\nগঠন: বালি ${sandNum}%, পলি ${siltNum}%, কাদা ${clayNum}%${omNum != null ? `, জৈব পদার্থ ${omNum}%` : ""}${zoneNote}\n\nএই মাটির জল ধারণ ক্ষমতা ও বায়ু চলাচল USDA শ্রেণিবিন্যাস অনুযায়ী নির্ধারিত।\nউপযুক্ত ফসল ও সারের মাত্রার জন্য BARC গাইডলাইন ও নিকটস্থ SRDI অফিসে যোগাযোগ করুন।`;
    }

    return corsNextResponse(
      {
        ok: true,
        composition: { sand: sandNum, silt: siltNum, clay: clayNum, organicMatter: omNum },
        usdaClassification: usdaClass,
        zone: zone || null,
        analysis,
        sources: [
          "SRDI — মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট",
          "BARC — বাংলাদেশ কৃষি গবেষণা পরিষদ সার সুপারিশ গাইডলাইন",
          "USDA — মার্কিন যুক্তরাষ্ট্রের কৃষি বিভাগ মাটি শ্রেণিবিন্যাস",
          "BRRI — বাংলাদেশ ধান গবেষণা ইনস্টিটিউট",
          "BARI — বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট",
        ],
      },
      { origin }
    );
  } catch (e) {
    console.error("Soil sample analysis error:", e);
    return corsNextResponse(
      { ok: false, error: "AI বিশ্লেষণ এখন উপলব্ধ নয়" },
      { status: 503, origin }
    );
  }
}