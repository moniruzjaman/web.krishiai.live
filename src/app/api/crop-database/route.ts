import { NextRequest, NextResponse } from "next/server";

// ── CORS ────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://krishiai.live",
  "https://www.krishiai.live",
  "https://web.krishiai.live",
];

function corsHeaders(origin: string | null) {
  const allowed = !origin || origin.includes("localhost") || origin.includes("127.0.0.1") || ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? (origin || "*") : "*",
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

    // 2. Fallback: z-ai-web-dev-sdk
    if (!crops || crops.length === 0) {
      try {
        const ZAI = (await import("z-ai-web-dev-sdk")).default;
        const zai = await ZAI.create();

        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a Bangladesh agriculture expert. Return ONLY valid JSON arrays. No markdown fences. No explanations."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 3000,
        });

        const reply = completion.choices?.[0]?.message?.content || "";
        const jsonMatch = reply.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          crops = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn("[crop-database] z-ai failed:", e instanceof Error ? e.message : String(e));
      }
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
