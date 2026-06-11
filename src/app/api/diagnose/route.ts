/**
 * /api/diagnose — CABI Plantwise Diagnosis API
 *
 * Accepts both:
 *   - { messages, crop, district }  (OpenAI-style chat format)
 *   - { image, symptoms, crop, description }  (Analyzer page format)
 *
 * AI Provider Waterfall: Gemini 2.5 Flash → OpenRouter Qwen-VL → Groq Llama4 Scout →
 *                        OpenRouter text → Gemini text → Emergency keyword fallback
 *
 * System prompt: Full CABI Plantwise Ready Reckoner + Exclusion Logic
 */

import { NextRequest, NextResponse } from "next/server";

const REQUEST_TIMEOUT_MS = 30_000;

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT — CABI READY RECKONER + EXCLUSION LOGIC (FULL)
// ═══════════════════════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `
You are an expert crop disease and pest diagnostic AI for Bangladesh, trained strictly on the CABI Plantwise methodology. You assist DAE extension officers and farmers in accurate field diagnosis using the CABI Exclusion Decision Tree, Ready Reckoner tables, and the Disease Triangle framework.

You MUST follow the diagnostic protocol below in strict order before producing any diagnosis.

═════════════════════════════════════════════════════════
PART 1 — MANDATORY DIAGNOSTIC PROTOCOL (CABI METHOD)
═══════════════════════════════════════════════════════

STEP 1 — ABIOTIC vs BIOTIC GATE (Gate 1)
─────────────────────────────────────────
First determine whether the problem is abiotic (non-living cause) or biotic (living pathogen/pest).

ABIOTIC indicators (rule out living causes first):
• Problem is uniformly distributed across the entire field
• Pattern follows machinery tracks, irrigation channels, or soil type zones
• Symptoms appear symmetrically on both sides of the leaf midrib
• No progression — all plants affected simultaneously, not spreading
• No fruiting bodies, ooze, webbing, frass, or insect presence
• Linked to a specific management event (fertilizer application, herbicide, flooding)
→ IF ABIOTIC: Consider nutrient deficiency, drought, waterlogging, herbicide injury, salinity, pH toxicity

BIOTIC indicators:
• Problem spreads progressively from a focus point or field edge
• Irregular distribution — some plants healthy, some sick, clear border between healthy/diseased tissue
• Signs of pathogen presence: fruiting bodies, ooze, webbing, frass, cast skins, eggs
• Symptoms appear asymmetrically
→ IF BIOTIC: Proceed to Step 2

STEP 2 — SYMMETRY ANALYSIS (Nutrient vs Pathogen)
───────────────────────────────────────────────────
• Symptoms SYMMETRICAL on both leaf halves → NUTRIENT DEFICIENCY (not biotic)
• Symptoms ASYMMETRICAL or random → PATHOGEN or HERBICIDE INJURY

STEP 3 — BIOTIC EXCLUSION GATES (Gate 2 — Run all gates in sequence)
──────────────────────────────────────────────────────────────────────

GATE A — EXCLUDE INSECTS/MITES:
• NO chewing marks, holes, rolled leaves, mines, frass, cast skins, eggs, webbing, stippling → EXCLUDE INSECTS & MITES
• YES to any above → retain insects/mites as suspects

GATE B — EXCLUDE VIRUS:
• NO mosaic, ring spots, chlorotic patterns following vein boundaries, systemic distortion of young leaves → EXCLUDE VIRUS
• Symptoms confined between veins (interveinal) = NOT virus
• YES to mosaic or ring spots → retain virus as suspect

GATE C — EXCLUDE BACTERIA:
• NO water-soaked margins at lesion edges → EXCLUDE BACTERIA
• NO bacterial ooze or sticky exudate → EXCLUDE BACTERIA
• Bacterial streaming test: cut stem 15cm from base, place in clear water — milky streaming after 5 min = bacterial wilt confirmed
• YES to water-soaked margins or ooze → retain bacteria as suspect

GATE D — CONFIRM FUNGAL / OOMYCETE:
• IF visible fruiting bodies (black pycnidia, pustules, powdery coating, cottony growth) → TRUE FUNGI confirmed
• IF rapid aggressive rot with white cottony sporulation, no hard sclerotia → OOMYCETE (Phytophthora/Pythium) NOT true fungus
• IF hard black sclerotia present → TRUE FUNGI (Sclerotinia or Rhizoctonia type)
• Oomycetes are NOT killed by standard fungicides — use Metalaxyl, Mancozeb, Fosetyl-Al

STEP 4 — DISEASE TRIANGLE ASSESSMENT
──────────────────────────────────────
Evaluate all three components:
1. HOST susceptibility: Is this variety known to be susceptible? Growth stage vulnerability?
2. PATHOGEN pressure: Are conditions known for high inoculum? Recent disease history?
3. ENVIRONMENT: Use real-time weather data — temperature, humidity, rainfall
   • Humidity >80% + Temp 26–35°C = HIGH fungal blast/blight risk
   • Humidity >85% = HIGH bacterial blight risk
   • Cool nights <20°C + warm days = Tungro virus/insect vector risk
   • Heavy rain >50mm = stem borer, root rot, waterlogging stress
   • Prolonged dry spell = mite, thrips, aphid outbreak risk

═══════════════════════════════════════════════════════
PART 2 — READY RECKONER TABLES
═══════════════════════════════════════════════════════

TABLE 1 — PEST FEEDING PATTERN IDENTIFICATION
MITES: 0.2–0.5mm, stippling on leaf underside, bronzing, fine webbing. Weather: hot dry.
THRIPS: 1–2mm, silver streaks on leaf, black frass dots. Weather: hot dry.
APHIDS: 2–5mm, leaf curl, honeydew, sooty mold, ants present.
WHITEFLY: 2–3mm, underside leaf, honeydew, shake plant = white cloud.
LEAFHOPPERS/BPH: Phloem sucking at stem base, hopper burn.
CHEWING INSECTS: Leaf folder (rolled leaves), hispa (white parallel streaks), army worm (ragged chewing), stem borer (dead heart/white ear).

TABLE 2 — FUNGAL DISEASE DIFFERENTIATION (Bangladesh Rice)
LEAF BLAST: Spindle/diamond lesions, GRAY center, brown border, yellow halo. 25-28°C + high humidity.
BROWN SPOT: Oval/circular, larger than blast, BROWN with wider yellow halo. Linked to K deficiency.
SHEATH BLIGHT: On SHEATH, white/gray center, wavy border, hard SCLEROTIA. Progresses upward.
BACTERIAL LEAF BLIGHT: WATER-SOAKED margins, starts from leaf TIP, milky ooze test.

TABLE 3 — NUTRIENT DEFICIENCY
NITROGEN: Uniform yellowing from OLDER leaves upward, symmetrical.
PHOSPHORUS: Purple/reddish older leaves, stunted.
POTASSIUM: Tip and margin SCORCH on older leaves.
ZINC: Very common in Bangladesh rice — WHITE mid-vein on young leaves ("Khaira" disease).
IRON: Yellowing with bronzing, toxicity in waterlogged soil.
SULPHUR: YOUNG leaves turn pale yellow (opposite of N deficiency).

TABLE 4 — OOMYCETE vs TRUE FUNGUS
TRUE FUNGUS: Hard fruiting bodies. Treat with Propiconazole, Tricyclazole, Carbendazim.
OOMYCETE: White cottony sporulation, no hard structures. Standard fungicides INEFFECTIVE. Use Metalaxyl, Mancozeb, Fosetyl-Al.

TABLE 5 — VIRUS DIFFERENTIATION
RICE TUNGRO: Yellow-orange younger leaves, stunting, leafhopper vector. No chemical cure.
TOMATO TYLCV: Leaf curling upward, whitefly vector.
MOSAIC VIRUSES: Mosaic/mottle pattern on young leaves. No cure — remove infected plants.

═══════════════════════════════════════════════════════
PART 3 — THE BIG 5 RECOMMENDATION FRAMEWORK
═══════════════════════════════════════════════════════
ALL recommendations MUST pass through these 5 filters:
1. ECONOMIC: Is damage loss > cost of control? If NO → "Do Nothing / Monitor"
2. EFFECTIVE: Scientifically proven for this pathogen in Bangladesh?
3. SAFE — PLANTWISE RED LIST (NEVER recommend): Monocrotophos, Carbofuran, Endosulfan, Phorate, Aldicarb, etc.
4. PRACTICAL: Suitable for smallholder farmers with limited equipment
5. LOCALLY AVAILABLE: Only products available in Bangladesh markets

═══════════════════════════════════════════════════════
PART 4 — RESISTANCE MANAGEMENT (FRAC/IRAC)
═══════════════════════════════════════════════════════
FUNGICIDE: Never repeat same FRAC group consecutively. SDHI (Group 7) + SBI (Group 3) — HIGH risk.
INSECTICIDE: Rotate IRAC groups. Never same group >2 consecutive sprays.

═══════════════════════════════════════════════════════
PART 5 — VISUAL ANALYSIS PROTOCOL (When image provided)
═══════════════════════════════════════════════════════
1. DISTRIBUTION: Whole field pattern visible? Uniform or focal?
2. LEAF SURFACE: Upper vs lower surface affected?
3. LESION MORPHOLOGY: Shape, size, color, border, center
4. SIGNS: Fruiting bodies, webbing, stippling, frass, ooze
5. PLANT PART: Leaf blade, sheath, stem, node, panicle, root
6. PROGRESSION: Tip-down, margin-in, base-up, systemic
7. ASSOCIATED SYMPTOMS: Stunting, wilting, lodging, head sterility

═══════════════════════════════════════════════════════
PART 6 — MANDATORY OUTPUT FORMAT
═══════════════════════════════════════════════════════

---BANGLA_SECTION---
## ১. CABI বর্জন পদ্ধতি অনুযায়ী বিশ্লেষণ
**অ্যাবায়োটিক নাকি বায়োটিক:** [বিশ্লেষণ]
**বর্জন গেট ফলাফল:** [কোন কারণগুলো বাদ দেওয়া হয়েছে এবং কেন]

## ২. সম্ভাব্য রোগ / পোকার নাম
**প্রাথমিক সন্দেহ:** [নাম — বাংলা ও বৈজ্ঞানিক]
**বিকল্প সন্দেহ:** [নাম]
**আস্থার মাত্রা:** [উচ্চ / মাঝারি / কম]

## ৩. রোগ ত্রিভুজ মূল্যায়ন
**পোষক (Host):** [জাতের সংবেদনশীলতা]
**জীবাণু (Pathogen):** [ইনোকুলাম চাপ]
**পরিবেশ (Environment):** [আবহাওয়া বিশ্লেষণ]

## ৪. মাঠে নিশ্চিতকরণের পদ্ধতি
[কীভাবে মাঠে নিশ্চিত করবেন]

## ৫. তীব্রতা ও অর্থনৈতিক গুরুত্ব
**ক্ষয়ক্ষতির মাত্রা:** [%]
**অর্থনৈতিক থ্রেশহোল্ড:** [ব্যবস্থা প্রয়োজন কিনা]

## ৬. সমন্বিত বালাই ব্যবস্থাপনা (IPM)
**কৃষি ব্যবস্থাপনা:** [বিস্তারিত]
**জৈবিক নিয়ন্ত্রণ:** [Trichoderma, COS]
**রাসায়নিক (শেষ উপায় — FRAC/IRAC গ্রুপ সহ):** [শুধু অর্থনৈতিক থ্রেশহোল্ড অতিক্রম করলে]

## ৭. প্রতিরোধ — পরবর্তী মৌসুম
[বিস্তারিত]

## ৮. কখন DAE কর্মকর্তার পরামর্শ নেবেন
[নির্দিষ্ট পরিস্থিতি]
---END_BANGLA---

---ENGLISH_SECTION---
[Same 8 sections in English]
---END_ENGLISH---

STRUCTURED OUTPUT REQUIREMENT:
At the very end, include ONE JSON block:

---JSON_SUMMARY---
{
  "disease_name": "Rice Leaf Blast",
  "disease_name_bn": "ধানের পাতা ব্লাস্ট",
  "confidence": "high",
  "confidence_pct": 85,
  "severity": "moderate",
  "urgency": "within_3_days",
  "biotic_abiotic": "biotic",
  "cause_type": "fungal",
  "etl_exceeded": true,
  "action_required": true,
  "gate_results": {
    "a_insects": "excluded",
    "a_reason": "No chewing marks or insect signs",
    "b_virus": "excluded",
    "b_reason": "No mosaic or ring spots",
    "c_bacteria": "excluded",
    "c_reason": "No water-soaked margins or ooze",
    "d_fungi": "confirmed",
    "d_reason": "Spindle-shaped gray-centered lesions"
  },
  "top_candidates": [
    { "rank": 1, "name_bn": "ব্লাস্ট", "name_en": "Leaf Blast", "scientific_name": "Pyricularia oryzae", "confidence_pct": 85, "key_feature": "Spindle gray-centered lesions" },
    { "rank": 2, "name_bn": "বাদামি দাগ", "name_en": "Brown Spot", "scientific_name": "Bipolaris oryzae", "confidence_pct": 12, "key_feature": "Oval lesions, wider halo" }
  ],
  "disease_triangle": { "host_score": 7, "pathogen_score": 8, "environment_score": 9, "host_note": "...", "pathogen_note": "...", "environment_note": "..." },
  "field_confirmation": { "test_bn": "পাতায় মাকু আকৃতির ছাই রঙের দাগ খুঁজুন", "steps_bn": ["...", "..."] },
  "ipm_recommendations": [
    { "priority": 1, "type": "cultural", "action_bn": "...", "timing": "এখনই" },
    { "priority": 2, "type": "chemical", "action_bn": "ট্রাইসাইক্লাজোল ০.৭ গ্রাম/লিটার", "timing": "৩ দিনের মধ্যে" }
  ],
  "chemical_options": [
    { "name_bn": "ট্রাইসাইক্লাজোল", "trade_name": "ব্রিকোল / ট্রুপার", "frac_irac_group": "FRAC 29", "dose": "০.৭ গ্রাম/লিটার", "phi_days": 14 }
  ],
  "prevention_bn": "...",
  "dae_consult_bn": "...",
  "key_recommendations": ["...", "...", "..."]
}
---END_JSON---

CRITICAL JSON RULES:
- JSON block is MANDATORY — never omit
- All confidence_pct must be integers 0–100; candidates sum ≤100
- urgency: "immediate" | "within_3_days" | "within_week" | "monitor"
- gate_results values: "excluded" | "retained" | "uncertain"
- type in ipm: "cultural" | "biological" | "chemical" | "monitoring"
- Provide at least 2 top_candidates
`.trim();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractPlainUserText(messages: any[]): string {
  return messages
    .flatMap((m) => {
      if (!Array.isArray(m.content)) return typeof m.content === "string" ? [m.content] : [];
      return m.content.filter((b: any) => b.type === "text" && b.text).map((b: any) => b.text);
    })
    .join("\n");
}

function extractStructuredJson(text: string) {
  try {
    const marker = "---JSON_SUMMARY---";
    const endMarker = "---END_JSON---";
    const startIdx = text.indexOf(marker);
    const endIdx = text.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
    const jsonStr = text.slice(startIdx + marker.length, endIdx).trim();
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function stripStructuredJson(text: string) {
  const marker = "---JSON_SUMMARY---";
  const endMarker = "---END_JSON---";
  const startIdx = text.indexOf(marker);
  const endIdx = text.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) return text;
  return text.slice(0, startIdx).trim() + text.slice(endIdx + endMarker.length).trim();
}

function compressMessages(messages: any[], maxBase64Chars = 1_000_000) {
  return messages.map((m) => {
    if (!Array.isArray(m.content)) return m;
    return {
      ...m,
      content: m.content.map((b: any) => {
        if (b.type === "image" && b.source?.data?.length > maxBase64Chars) {
          return { ...b, source: { ...b.source, data: b.source.data.slice(0, maxBase64Chars) } };
        }
        return b;
      }),
    };
  });
}

function stripImages(messages: any[]) {
  return messages.map((m) => ({
    ...m,
    content: Array.isArray(m.content)
      ? m.content.filter((b: any) => b.type !== "image")
      : m.content,
  }));
}

function toOpenAIMessages(messages: any[]) {
  return messages.map((m) => {
    if (typeof m.content === "string") return { role: m.role, content: m.content };
    if (Array.isArray(m.content)) {
      return {
        role: m.role,
        content: m.content.map((b: any) => {
          if (b.type === "text") return { type: "text", text: b.text };
          if (b.type === "image" && b.source?.type === "base64") {
            return {
              type: "image_url",
              image_url: { url: `data:${b.source.media_type || "image/jpeg"};base64,${b.source.data}` },
            };
          }
          return null;
        }).filter(Boolean),
      };
    }
    return m;
  });
}

function buildEmergencyDiagnosis(text: string, imageAttached: boolean) {
  const lower = text.toLowerCase();
  const suspects: string[] = [];
  if (/yellow|হলুদ|chlorosis/.test(lower)) suspects.push("পুষ্টি ঘাটতি / nutrient deficiency");
  if (/spot|দাগ|blast|blight|lesion/.test(lower)) suspects.push("ছত্রাক বা ব্যাকটেরিয়া / fungal or bacterial disease");
  if (/curl|কুঁক|মোড়া|mosaic|virus/.test(lower)) suspects.push("ভাইরাস বা থ্রিপস / virus or sucking pest");
  if (/hole|ছিদ্র|chew|roll|frass|web|mite|aphid|thrips|insect|পোকা/.test(lower)) suspects.push("পোকার আক্রমণ / insect or mite attack");
  if (/wilt|মরে|শুক|rot|পচা/.test(lower)) suspects.push("উইল্ট বা রুট রট / wilt or root rot");

  const primary = suspects[0] || "ছবি ও বর্ণনার ভিত্তিতে প্রাথমিক সন্দেহ";
  const differentials = suspects.slice(1, 3);
  const imageNote = imageAttached
    ? "ছবি যুক্ত আছে, প্রাথমিক মাঠ-স্তরের জরুরি বিশ্লেষণ।"
    : "এই বিশ্লেষণটি মূলত আপনার বর্ণনার ভিত্তিতে করা হয়েছে।";

  return {
    text: `---BANGLA_SECTION---
## ১. প্রাথমিক CABI বিশ্লেষণ
**অবস্থা:** জরুরি বিকল্প বিশ্লেষণ
**মন্তব্য:** ${imageNote}

## ২. সম্ভাব্য কারণ
**প্রাথমিক সন্দেহ:** ${primary}
**বিকল্প সন্দেহ:** ${differentials.length ? differentials.join(" ; ") : "মাঠে দেখে নিশ্চিত করা দরকার"}
**আস্থার মাত্রা:** কম থেকে মাঝারি

## ৩. এখনই যা করবেন
- আক্রান্ত গাছ/পাতা আলাদা করে দেখুন
- পাতার উল্টোপাশে পোকা, ডিম, জাল, মধুরস বা কালো ফোঁটা আছে কি না দেখুন
- দাগ পানিভেজা কিনারা থেকে শুরু হলে ব্যাকটেরিয়া সন্দেহ করুন
- দাগ হীরার মতো বা বাদামি গোল হলে ছত্রাক সন্দেহ করুন
- উপসর্গ দুই পাশ সমান হলে পুষ্টি ঘাটতি আগে বিবেচনা করুন

## ৪. কৃষক-নিরাপদ তাৎক্ষণিক পরামর্শ
- এখনই অপ্রয়োজনীয় কীটনাশক/ফাঙ্গিসাইড স্প্রে করবেন না
- আক্রান্ত অংশের পরিষ্কার ছবি আবার নিন
- ক্ষতি দ্রুত বাড়লে নিকটস্থ DAE কর্মকর্তাকে দেখান
---END_BANGLA---

---ENGLISH_SECTION---
## 1. Provisional CABI Analysis
**Status:** Emergency fallback
**Primary suspect:** ${primary}
**Differentials:** ${differentials.length ? differentials.join(" ; ") : "Needs field confirmation"}
**Confidence:** Low to Medium
---END_ENGLISH---

---JSON_SUMMARY---
{
  "disease_name": "${primary.split(' / ')[1] || primary}",
  "disease_name_bn": "${primary.split(' / ')[0] || primary}",
  "confidence": "low",
  "confidence_pct": 40,
  "severity": "moderate",
  "urgency": "within_3_days",
  "biotic_abiotic": "uncertain",
  "cause_type": "uncertain",
  "etl_exceeded": false,
  "action_required": true,
  "gate_results": {
    "a_insects": "uncertain",
    "a_reason": "Needs field inspection",
    "b_virus": "uncertain",
    "b_reason": "Needs field inspection",
    "c_bacteria": "uncertain",
    "c_reason": "Needs field inspection",
    "d_fungi": "uncertain",
    "d_reason": "Needs field inspection"
  },
  "top_candidates": [
    { "rank": 1, "name_bn": "${primary.split(' / ')[0]}", "name_en": "${primary.split(' / ')[1] || primary}", "scientific_name": "Field confirmation required", "confidence_pct": 40, "key_feature": "Emergency keyword-based match" }
  ],
  "disease_triangle": { "host_score": 5, "pathogen_score": 5, "environment_score": 5, "host_note": "Unable to assess — needs field data", "pathogen_note": "Unable to assess — needs field data", "environment_note": "Unable to assess — needs weather data" },
  "field_confirmation": { "test_bn": "পাতার উল্টোপাশে পোকা/মাইট/ছত্রাক দেখুন", "steps_bn": ["পাতার নিচে পোকা বা জাল আছে কিনা দেখুন", "দাগের ধরন পরীক্ষা করুন", "DAE কর্মকর্তাকে দেখান"] },
  "ipm_recommendations": [
    { "priority": 1, "type": "monitoring", "action_bn": "আক্রান্ত গাছ পর্যবেক্ষণ করুন", "timing": "এখনই" },
    { "priority": 2, "type": "cultural", "action_bn": "অপ্রয়োজনীয় কীটনাশক স্প্রে করবেন না", "timing": "এখনই" }
  ],
  "chemical_options": [],
  "prevention_bn": "পরবর্তী মৌসুমে প্রতিরোধী জাত ব্যবহার করুন এবং সুষম সার দিন।",
  "dae_consult_bn": "ক্ষতি দ্রুত বাড়লে বা ৩ দিনে উন্নতি না হলে DAE কর্মকর্তাকে জানান।",
  "key_recommendations": ["আক্রান্ত গাছ পর্যবেক্ষণ করুন", "অপ্রয়োজনীয় রাসায়নিক ব্যবহার করবেন না", "DAE কর্মকর্তার পরামর্শ নিন"]
}
---END_JSON---`,
    provider: "Emergency Keyword Fallback ⚠️",
  };
}

// ─── Provider: Google Gemini 2.5 Flash ─────────────────────────────────────
async function tryGemini(messages: any[], withVision: boolean) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const src = withVision ? compressMessages(messages) : stripImages(messages);
  const lastMsg = src[src.length - 1];
  const content = Array.isArray(lastMsg.content)
    ? lastMsg.content
    : [{ type: "text", text: lastMsg.content }];

  const parts: any[] = [];
  for (const block of content) {
    if (block.type === "image" && block.source?.type === "base64" && withVision) {
      parts.push({
        inlineData: {
          mimeType: block.source.media_type || "image/jpeg",
          data: block.source.data,
        },
      });
    } else if (block.type === "text") {
      parts.push({ text: block.text });
    }
  }

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts }],
    generationConfig: { maxOutputTokens: 3000, temperature: 0.3 },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Gemini HTTP ${res.status}`);

  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("\n") || "No response.";
  return { text, provider: withVision ? "Google Gemini 2.5 Flash 👁️" : "Google Gemini 2.5 Flash (text)" };
}

// ─── Provider: OpenRouter (vision + text) ──────────────────────────────────
async function tryOpenRouter(messages: any[], modelId: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const body = {
    model: modelId,
    max_tokens: 3000,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...toOpenAIMessages(compressMessages(messages))],
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://krishiai.live",
      "X-Title": "KrishiAI CABI Diagnosis",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data?.error?.message || `OpenRouter HTTP ${res.status}`);

  const resolvedModel = (data?.model || modelId).split("/").pop()?.replace(":free", "") || modelId;
  return { text: data?.choices?.[0]?.message?.content || "No response.", provider: `OpenRouter / ${resolvedModel}` };
}

// ─── Provider: Groq Llama 4 Scout ──────────────────────────────────────────
async function tryGroq(messages: any[]) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const body = {
    model: "llama-3.2-11b-vision-preview",
    max_tokens: 3000,
    temperature: 0.3,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...toOpenAIMessages(compressMessages(messages))],
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Groq HTTP ${res.status}`);
  return { text: data?.choices?.[0]?.message?.content || "No response.", provider: "Groq Llama 3.2 Vision ⚡" };
}

// ─── Convert analyzer-page format to messages format ────────────────────────
function normalizeToMessages(body: any): { messages: any[]; crop: string; district: string } {
  // If already in messages format
  if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
    return { messages: body.messages, crop: body.crop || "", district: body.district || "" };
  }

  // Convert analyzer-page format: { image, symptoms, crop, description }
  const { image, symptoms, crop, description, district } = body;
  const content: any[] = [];

  // Build text part
  const textParts: string[] = [];
  if (crop) textParts.push(`ফসল: ${crop}`);
  if (symptoms && Array.isArray(symptoms) && symptoms.length > 0) {
    textParts.push(`লক্ষণসমূহ: ${symptoms.join(", ")}`);
  }
  if (description) textParts.push(`বর্ণনা: ${description}`);
  if (district) textParts.push(`জেলা: ${district}`);

  const textContent = textParts.join("\n");
  if (textContent) {
    content.push({ type: "text", text: textContent });
  }

  // Add image if present (data URL format from FileReader)
  if (image) {
    // image can be a data URL like "data:image/jpeg;base64,..."
    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: match[1],
          data: match[2],
        },
      });
    }
  }

  if (content.length === 0) {
    content.push({ type: "text", text: "কৃষি রোগ নির্ণয় অনুরোধ" });
  }

  return {
    messages: [{ role: "user", content }],
    crop: crop || "",
    district: district || "",
  };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // Normalize both request formats
    const { messages, crop, district } = normalizeToMessages(rawBody);

    if (!messages.length) {
      return NextResponse.json({ ok: false, error: "Messages are required" }, { status: 400 });
    }

    const lastMsg = messages[messages.length - 1];
    let imageAttached = false;
    if (Array.isArray(lastMsg.content)) {
      imageAttached = lastMsg.content.some((b: any) => b.type === "image");
    }

    const attempts: string[] = [];
    const startTime = Date.now();

    // Helper timeout wrapper
    const withTimeout = async (promise: Promise<any>, label: string) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), REQUEST_TIMEOUT_MS)),
      ]);
    };

    // ─── 1. Gemini 2.5 Flash (vision) ───
    if (process.env.GEMINI_API_KEY) {
      try {
        const r = await withTimeout(tryGemini(messages, imageAttached), "Gemini");
        const structured = extractStructuredJson(r.text);
        const cleanText = structured ? stripStructuredJson(r.text) : r.text;
        return NextResponse.json({
          ok: true,
          text: cleanText,
          structured,
          provider: r.provider,
          attempts,
          elapsed_ms: Date.now() - startTime,
        });
      } catch (e: any) {
        attempts.push(`Gemini: ${e.message}`);
      }
    }

    // ─── 2. OpenRouter Qwen-VL Free (vision) ───
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const r = await withTimeout(
          tryOpenRouter(messages, "qwen/qwen2.5-vl-72b-instruct:free"),
          "OpenRouter Qwen-VL"
        );
        const structured = extractStructuredJson(r.text);
        const cleanText = structured ? stripStructuredJson(r.text) : r.text;
        return NextResponse.json({
          ok: true,
          text: cleanText,
          structured,
          provider: r.provider,
          attempts,
          elapsed_ms: Date.now() - startTime,
        });
      } catch (e: any) {
        attempts.push(`OpenRouter Qwen-VL: ${e.message}`);
      }
    }

    // ─── 3. Groq Llama 3.2 Vision ───
    if (process.env.GROQ_API_KEY) {
      try {
        const r = await withTimeout(tryGroq(messages), "Groq");
        const structured = extractStructuredJson(r.text);
        const cleanText = structured ? stripStructuredJson(r.text) : r.text;
        return NextResponse.json({
          ok: true,
          text: cleanText,
          structured,
          provider: r.provider,
          attempts,
          elapsed_ms: Date.now() - startTime,
        });
      } catch (e: any) {
        attempts.push(`Groq: ${e.message}`);
      }
    }

    // ─── 4. OpenRouter text-only ───
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const r = await withTimeout(
          tryOpenRouter(messages, "qwen/qwen2.5-72b-instruct:free"),
          "OpenRouter Text"
        );
        const structured = extractStructuredJson(r.text);
        const cleanText = structured ? stripStructuredJson(r.text) : r.text;
        return NextResponse.json({
          ok: true,
          text: cleanText,
          structured,
          provider: r.provider,
          attempts,
          elapsed_ms: Date.now() - startTime,
        });
      } catch (e: any) {
        attempts.push(`OpenRouter text: ${e.message}`);
      }
    }

    // ─── 5. Gemini text-only ───
    if (process.env.GEMINI_API_KEY) {
      try {
        const r = await withTimeout(tryGemini(messages, false), "Gemini text");
        const structured = extractStructuredJson(r.text);
        const cleanText = structured ? stripStructuredJson(r.text) : r.text;
        return NextResponse.json({
          ok: true,
          text: cleanText,
          structured,
          provider: r.provider,
          attempts,
          elapsed_ms: Date.now() - startTime,
        });
      } catch (e: any) {
        attempts.push(`Gemini text: ${e.message}`);
      }
    }

    // ─── 6. Emergency keyword fallback ───
    const plainText = extractPlainUserText(messages);
    const emergencyResult = buildEmergencyDiagnosis(plainText, imageAttached);
    const structured = extractStructuredJson(emergencyResult.text);
    const cleanText = structured ? stripStructuredJson(emergencyResult.text) : emergencyResult.text;

    return NextResponse.json({
      ok: true,
      text: cleanText,
      structured,
      provider: emergencyResult.provider,
      attempts,
      elapsed_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
