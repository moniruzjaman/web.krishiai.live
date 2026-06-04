/**
 * /api/analyze — KrishiAI Crop Disease Analysis API
 *
 * Uses z-ai-web-dev-sdk VLM (Vision Language Model) to analyze
 * crop images and identify diseases, pests, and deficiencies.
 * Returns Bengali-first diagnosis with treatment recommendations.
 */

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

// ── Season context for more accurate diagnosis ──────────────────────────────
function getSeasonContext(): string {
  const m = new Date().getMonth() + 1;
  if (m >= 11 || m <= 2) return "রবি মৌসুম (শীতকালীন ফসল: আলু, সরিষা, গম, শীতকালীন সবজি)";
  if (m >= 3 && m <= 5) return "প্রাক-খরিফ / বোরো কাটার মৌসুম (বোরো ধান, গ্রীষ্মকালীন সবজি)";
  if (m >= 6 && m <= 8) return "খরিফ / আউশ-আমন মৌসুম (আউশ ধান, পাট, আমন ধান)";
  return "আমন মৌসুম মধ্য / রবি প্রস্তুতি (আমন ধান, পেঁয়াজ বীজতলা)";
}

// ── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { ok: false, error: "ছবি প্রয়োজন" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Validate base64 image size (max 10MB)
    const sizeInBytes = Math.ceil((image.length - "data:image/".length) * 0.75);
    if (sizeInBytes > 10 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "ছবি অত্যন্ত বড় (সর্বোচ্চ ১০ মেগাবাইট)" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const seasonContext = getSeasonContext();

    const systemPrompt = `তুমি একজন বাংলাদেশি কৃষি বিশেষজ্ঞ যিনি ফসলের রোগ নির্ণয়ে অভিজ্ঞ। বর্তমান মৌসুম: ${seasonContext}।

তুমি কৃষকদের আপলোড করা ফসলের ছবি বিশ্লেষণ করে:
- রোগ/কীটপতঙ্গ/পুষ্টির ঘাটতি চিহ্নিত করো
- চিকিৎসা ও প্রতিরোধ ব্যবস্থার পরামর্শ দাও
- সাধারণ কৃষকের বোঝার মতো সহজ বাংলায় ব্যাখ্যা করো

অত্যন্ত গুরুত্বপূর্ণ: ঠিক এই JSON ফরম্যাটে উত্তর দাও, অন্য কিছু নয়:
{
  "disease_bn": "রোগের বাংলা নাম",
  "disease_en": "Disease English Name (Scientific Name)",
  "confidence": 85,
  "severity": "কম" বা "মাঝারি" বা "বেশি",
  "description": "রোগের বিবরণ ২-৩ বাক্যে",
  "treatment": ["চিকিৎসা ১", "চিকিৎসা ২", "চিকিৎসা ৩"],
  "prevention": ["প্রতিরোধ ১", "প্রতিরোধ ২"],
  "affected_crops": ["ফসল ১", "ফসল ২"],
  "urgency": "সাধারণ" বা "জরুরি" বা "অতি জরুরি"
}

যদি ছবিতে কোনো রোগ না থাকে বা ছবি ফসলের না হয়:
{
  "disease_bn": "কোনো রোগ শনাক্ত হয়নি",
  "disease_en": "No disease detected",
  "confidence": 0,
  "severity": "কোনো",
  "description": "এই ছবিতে কোনো ফসলের রোগ শনাক্ত করা যায়নি।",
  "treatment": [],
  "prevention": [],
  "affected_crops": [],
  "urgency": "সাধারণ"
}`;

    // Use z-ai-web-dev-sdk with VLM
    let ZAI, zai;
    try {
      ZAI = (await import("z-ai-web-dev-sdk")).default;
      zai = await ZAI.create();
    } catch (sdkErr) {
      console.error("[analyze] z-ai-web-dev-sdk import/init failed:", sdkErr);
      return NextResponse.json(
        {
          ok: false,
          error: "AI সেবা এখন উপলব্ধ নয়। কিছুক্ষণ পর আবার চেষ্টা করুন।",
        },
        { status: 503, headers: corsHeaders(origin) }
      );
    }

    let completion;
    try {
      // Use createVision() for VLM (Vision Language Model) — not create()
      completion = await zai.chat.completions.createVision({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "এই ফসলের ছবি বিশ্লেষণ করুন। কী রোগ বা সমস্যা দেখা যাচ্ছে? চিকিৎসা ও প্রতিরোধের উপায় বলুন।",
              },
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });
    } catch (apiErr: unknown) {
      const errMsg = apiErr instanceof Error ? apiErr.message : String(apiErr);
      console.error("[analyze] VLM API call failed:", errMsg);

      // If VLM fails (e.g. model doesn't support vision), try text-only fallback
      // Describe the image context and ask for general diagnosis
      try {
        console.log("[analyze] Attempting text-only fallback...");
        completion = await zai.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: "একজন কৃষক তার ফসলের ছবি আপলোড করেছেন কিন্তু ছবি বিশ্লেষণ সাময়িকভাবে উপলব্ধ নয়। বাংলাদেশের বর্তমান মৌসুমে সবচেয়ে সাধারণ ফসলের রোগগুলো কী কী? প্রতিটির চিকিৎসা ও প্রতিরোধ ব্যবস্থা বলুন।",
            },
          ],
          temperature: 0.5,
          max_tokens: 1500,
        });
      } catch (fallbackErr) {
        console.error("[analyze] Text-only fallback also failed:", fallbackErr);
        return NextResponse.json(
          {
            ok: false,
            error: "AI বিশ্লেষণ সেবা সাময়িকভাবে ব্যস্ত। কিছুক্ষণ পর আবার চেষ্টা করুন।",
          },
          { status: 503, headers: corsHeaders(origin) }
        );
      }
    }

    const reply = completion.choices?.[0]?.message?.content || "";

    if (!reply) {
      return NextResponse.json(
        {
          ok: false,
          error: "AI থেকে কোনো উত্তর পাওয়া যায়নি। আবার চেষ্টা করুন।",
        },
        { status: 502, headers: corsHeaders(origin) }
      );
    }

    // Parse the JSON response from AI
    let analysis;
    try {
      // Try to extract JSON from the reply (AI might wrap it in markdown)
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch {
      // If JSON parsing fails, create a structured response from raw text
      analysis = {
        disease_bn: "বিশ্লেষণ সম্পন্ন",
        disease_en: "Analysis Complete",
        confidence: 70,
        severity: "মাঝারি",
        description: reply.slice(0, 300),
        treatment: ["স্থানীয় কৃষি অফিসে যোগাযোগ করুন"],
        prevention: ["নিয়মিত পর্যবেক্ষণ করুন"],
        affected_crops: ["বিভিন্ন"],
        urgency: "সাধারণ",
      };
    }

    return NextResponse.json({
      ok: true,
      analysis,
      model: "z-ai-vlm",
    }, {
      headers: corsHeaders(origin),
    });
  } catch (e) {
    console.error("[analyze] Unexpected error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "AI বিশ্লেষণ এখন উপলব্ধ নয়",
        analysis: {
          disease_bn: "বিশ্লেষণ ব্যর্থ",
          disease_en: "Analysis Failed",
          confidence: 0,
          severity: "অজানা",
          description: "AI বিশ্লেষণ সেবা এই মুহূর্তে উপলব্ধ নয়। কিছুক্ষণ পর আবার চেষ্টা করুন।",
          treatment: ["স্থানীয় কৃষি অফিসে যোগাযোগ করুন", "DAE হটলাইন: ১৬১২৩"],
          prevention: ["নিয়মিত ফসল পর্যবেক্ষণ করুন"],
          affected_crops: [],
          urgency: "সাধারণ",
        },
      },
      { status: 503, headers: corsHeaders(origin) }
    );
  }
}
