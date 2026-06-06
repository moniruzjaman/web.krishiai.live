import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// CORS headers
const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": !origin || origin.includes("localhost") ? (origin || "*") : "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

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
  const category = searchParams.get("category") || "Grains";

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
    const zai = await ZAI.create();

    const prompt = `Act as an expert on Bangladeshi agriculture. Provide a list of 5-7 distinct crops for the "${category}" category cultivated in Bangladesh.

For each crop, include:
- name: Common Bengali name
- scientificName: Botanical name
- description: 2-3 sentence description about significance in Bangladesh (in Bengali)
- cultivationAreas: 2-3 prominent districts in Bangladesh
- soilRequirements: Brief ideal soil types (in Bengali)
- climateRequirements: Temperature, rainfall, seasons (in Bengali)
- averageYield: Approximate yield in Bangladesh
- economicImportance: Economic impact (in Bengali)
- commonUses: 2-3 common uses

IMPORTANT: Return ONLY a valid JSON array. No markdown, no explanation.
${CATEGORY_EXAMPLES[category] ? `Example crops: ${CATEGORY_EXAMPLES[category]}.` : ""}`;

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

    // Parse JSON from reply
    let crops;
    try {
      const jsonMatch = reply.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        crops = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found");
      }
    } catch {
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
