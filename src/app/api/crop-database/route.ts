import { NextRequest, NextResponse } from "next/server";

// ── CORS ────────────────────────────────────────────────────────────────────
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
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

// In-memory cache
const categoryCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const CATEGORY_EXAMPLES: Record<string, string> = {
  Grains: "e.g., Rice, Wheat, Maize",
  Oils: "e.g., Mustard, Soybean, Sesame",
  Spices: "e.g., Chili, Turmeric, Ginger",
  Pulses: "e.g., Lentil, Chickpea, Black gram",
  Fruits: "e.g., Mango, Jackfruit, Litchi",
  Vegetables: "e.g., Potato, Brinjal, Cabbage",
  "High Value Crops": "e.g., Cotton, Tea, Tobacco",
};

const VALID_CATEGORIES = Object.keys(CATEGORY_EXAMPLES);

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);
  const rawCategory = searchParams.get("category") || "Grains";
  // Convert to title case for case-insensitive matching
  const category = rawCategory
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { ok: false, error: "Invalid category" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  // Check cache
  const cached = categoryCache.get(category);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(
      { ok: true, category, crops: cached.data },
      { headers: { "Cache-Control": "public, s-maxage=600", ...corsHeaders(origin) } }
    );
  }

  try {
    // Build the prompt for AI
    const prompt = `List 8 important ${category} crops grown in Bangladesh as a JSON array.
Each object must have: name (English), nameBn (Bengali), season (Bengali: রবি/খরিফ-১/খরিফ-২), waterNeed (Low/Medium/High), soilType (Bengali), growingDays (number), descriptionBn (1-2 sentence Bengali description).
Example: [{"name":"Rice","nameBn":"ধান","season":"খরিফ-২/আমন","waterNeed":"High","soilType":"দোআঁশ মাটি","growingDays":140,"descriptionBn":"বাংলাদেশের প্রধান খাদ্য ফসল"}]
Return ONLY the JSON array, no other text.`;

    let crops;

    // 1. Primary: Cloudflare Workers AI
    try {
      const { callCloudflareAI } = await import("@/lib/cloudflareAI");
      const cfResult = await callCloudflareAI(
        [
          {
            role: "system",
            content: "You are a Bangladesh agriculture expert. Return ONLY valid JSON arrays. No markdown fences. No explanations."
          },
          { role: "user", content: prompt }
        ],
        { temperature: 0.7, maxTokens: 3000 }
      );
      if (cfResult.ok && cfResult.reply) {
        const jsonMatch = cfResult.reply.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          crops = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.warn("[crop-database] Cloudflare AI failed:", e instanceof Error ? e.message : String(e));
    }

    // 2. Offline fallback: Static crop database
    if (!crops || crops.length === 0) {
      const STATIC_CROPS: Record<string, Array<Record<string, string | number>>> = {
        Grains: [
          { name: "Rice", nameBn: "ধান", season: "খরিফ-২/আমন", waterNeed: "High", soilType: "দোআঁশ মাটি", growingDays: 140, descriptionBn: "বাংলাদেশের প্রধান খাদ্য ফসল" },
          { name: "Wheat", nameBn: "গম", season: "রবি", waterNeed: "Medium", soilType: "দোআঁশ মাটি", growingDays: 110, descriptionBn: "শীতকালীন শস্য, পুষ্টিকর" },
          { name: "Maize", nameBn: "ভুট্টা", season: "খরিফ-১/রবি", waterNeed: "Medium", soilType: "বেলে দোআঁশ", growingDays: 100, descriptionBn: "পশুখাদ্য ও শিল্পে ব্যবহৃত" },
        ],
        Vegetables: [
          { name: "Potato", nameBn: "আলু", season: "রবি", waterNeed: "Medium", soilType: "বেলে দোআঁশ", growingDays: 90, descriptionBn: "প্রধান শীতকালীন সবজি" },
          { name: "Eggplant", nameBn: "বেগুন", season: "খরিফ-১/রবি", waterNeed: "Medium", soilType: "দোআঁশ মাটি", growingDays: 80, descriptionBn: "সারাবছর চাষযোগ্য সবজি" },
          { name: "Tomato", nameBn: "টমেটো", season: "রবি", waterNeed: "Medium", soilType: "দোআঁশ মাটি", growingDays: 75, descriptionBn: "শীতকালীন জনপ্রিয় সবজি" },
        ],
        Oils: [
          { name: "Mustard", nameBn: "সরিষা", season: "রবি", waterNeed: "Low", soilType: "দোআঁশ মাটি", growingDays: 85, descriptionBn: "প্রধান তৈলবীজ ফসল" },
          { name: "Sesame", nameBn: "তিল", season: "খরিফ-১", waterNeed: "Low", soilType: "বেলে দোআঁশ", growingDays: 75, descriptionBn: "গ্রীষ্মকালীন তৈলবীজ" },
        ],
        Spices: [
          { name: "Chili", nameBn: "মরিচ", season: "খরিফ-১/রবি", waterNeed: "Medium", soilType: "দোআঁশ মাটি", growingDays: 90, descriptionBn: "মসলা হিসেবে অপরিহার্য" },
          { name: "Turmeric", nameBn: "হলুদ", season: "খরিফ-২", waterNeed: "Medium", soilType: "পলি দোআঁশ", growingDays: 240, descriptionBn: "মসলা ও ঔষধি ফসল" },
          { name: "Ginger", nameBn: "আদা", season: "খরিফ-২", waterNeed: "Medium", soilType: "পলি দোআঁশ", growingDays: 210, descriptionBn: "মসলা ও ঔষধি ফসল" },
        ],
        Pulses: [
          { name: "Lentil", nameBn: "মসুর ডাল", season: "রবি", waterNeed: "Low", soilType: "দোআঁশ মাটি", growingDays: 100, descriptionBn: "প্রধান ডাল ফসল" },
          { name: "Chickpea", nameBn: "ছোলা", season: "রবি", waterNeed: "Low", soilType: "বেলে দোআঁশ", growingDays: 110, descriptionBn: "শীতকালীন ডাল ফসল" },
        ],
        Fruits: [
          { name: "Mango", nameBn: "আম", season: "খরিফ-১", waterNeed: "Low", soilType: "বেলে দোআঁশ", growingDays: 120, descriptionBn: "জাতীয় ফল" },
          { name: "Jackfruit", nameBn: "কাঁঠাল", season: "খরিফ-১", waterNeed: "Low", soilType: "দোআঁশ মাটি", growingDays: 180, descriptionBn: "জাতীয় ফল" },
        ],
        "High Value Crops": [
          { name: "Cotton", nameBn: "তুলা", season: "খরিফ-১", waterNeed: "Medium", soilType: "বেলে দোআঁশ", growingDays: 150, descriptionBn: "বাণিজ্যিক ফসল" },
          { name: "Tea", nameBn: "চা", season: "সারাবছর", waterNeed: "High", soilType: "পলিত দোআঁশ", growingDays: 365, descriptionBn: "পার্বত্য চা বাগান" },
        ],
      };
      crops = STATIC_CROPS[category] || [];
    }

    if (!crops) {
      crops = [];
    }

    // Add IDs
    const cropsWithIds = crops.map((crop: any, index: number) => ({
      ...crop,
      id: `${category.toLowerCase().replace(/\s+/g, '-')}-${index}`,
      category,
    }));

    // Cache the result
    categoryCache.set(category, { data: cropsWithIds, timestamp: Date.now() });

    return NextResponse.json(
      { ok: true, category, crops: cropsWithIds },
      { headers: { "Cache-Control": "public, s-maxage=600", ...corsHeaders(origin) } }
    );
  } catch (error: any) {
    console.error("[crop-database] Error:", error.message);
    return NextResponse.json(
      { ok: false, error: "ফসল তথ্য লোড হয়নি। আবার চেষ্টা করুন।", crops: [] },
      { status: 503, headers: corsHeaders(origin) }
    );
  }
}
