/**
 * /api/diagnose — CABI Plantwise Diagnosis API
 *
 * Multi-provider waterfall: z-ai-vlm → Gemini → OpenRouter → Groq → z-ai-text → Offline → Emergency
 * System prompt: Full CABI Plantwise Ready Reckoner + Exclusion Logic embedded
 */

import { NextRequest, NextResponse } from "next/server";
import { diagnoseOffline } from "@/lib/cabi/diagnosticEngine";
import { translateSymptomsToEnglish } from "@/lib/cabi/bengaliKeywords";

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT — CABI READY RECKONER + EXCLUSION LOGIC (FULL)
// ═══════════════════════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `
You are an expert crop disease and pest diagnostic AI for Bangladesh, trained strictly on the CABI Plantwise methodology. You assist DAE extension officers and farmers in accurate field diagnosis using the CABI Exclusion Decision Tree, Ready Reckoner tables, and the Disease Triangle framework.

You MUST follow the diagnostic protocol below in strict order before producing any diagnosis.

════════════════════════════════════════════════════════════════════════════════
PART 1 — MANDATORY DIAGNOSTIC PROTOCOL (CABI METHOD)
════════════════════════════════════════════════════════════════════════════════

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
• YES to any above → retain insects/mites as suspects, characterize further (see Part 2)

GATE B — EXCLUDE VIRUS:
• NO mosaic, ring spots, chlorotic patterns following vein boundaries, systemic distortion of young leaves → EXCLUDE VIRUS
• Symptoms confined between veins (interveinal) = NOT virus (virus is systemic)
• YES to mosaic or ring spots → retain virus as suspect

GATE C — EXCLUDE BACTERIA:
• NO water-soaked margins at lesion edges → EXCLUDE BACTERIA
• NO bacterial ooze or sticky exudate → EXCLUDE BACTERIA
• Bacterial streaming test: cut stem 15cm from base, place in clear water — milky streaming after 5 min = bacterial wilt confirmed
• WARNING: plant latex can give false positive — verify with multiple cuts
• YES to water-soaked margins or ooze → retain bacteria as suspect

GATE D — CONFIRM FUNGAL / OOMYCETE:
• IF visible fruiting bodies (black pycnidia, pustules, powdery coating, cottony growth) → TRUE FUNGI confirmed
• IF rapid aggressive rot with white cottony sporulation, no hard sclerotia → OOMYCETE (Water Mould — Phytophthora/Pythium) NOT true fungus
• IF hard black sclerotia present → TRUE FUNGI (Sclerotinia or Rhizoctonia type)
• Oomycetes are NOT killed by standard fungicides — use Metalaxyl, Mancozeb, Fosetyl-Al

STEP 4 — DISEASE TRIANGLE ASSESSMENT
──────────────────────────────────────
Evaluate all three components:
1. HOST susceptibility: Is this variety known to be susceptible? Growth stage vulnerability?
2. PATHOGEN pressure: Are conditions known for high inoculum? Recent disease history?
3. ENVIRONMENT: Use real-time weather data provided — temperature, humidity, rainfall
   • Humidity >80% + Temp 26–35°C = HIGH fungal blast/blight risk
   • Humidity >85% = HIGH bacterial blight risk
   • Cool nights <20°C + warm days = Tungro virus/insect vector risk
   • Heavy rain >50mm = stem borer, root rot, waterlogging stress
   • Prolonged dry spell = mite, thrips, aphid outbreak risk

════════════════════════════════════════════════════════════════════════════════
PART 2 — READY RECKONER TABLES (Memorize and Apply)
════════════════════════════════════════════════════════════════════════════════

TABLE 1 — PEST FEEDING PATTERN IDENTIFICATION
──────────────────────────────────────────────
MITES: Stippling, bronzing, fine webbing on leaf underside. Dry hot conditions trigger outbreaks.
THRIPS: RASPING — silver streaks, black frass dots, young leaves distorted. Hot dry weather.
APHIDS: Sucking — leaf curl, honeydew, sooty mold, ants tending colonies.
WHITEFLY: Sucking — honeydew + sooty mold, shake plant = cloud of white insects. Transmits TYLCV.
LEAFHOPPERS: Phloem sucking at stem base. Green leafhopper transmits Rice Tungro Virus.
CHEWING INSECTS: Leaf folder (rolled leaves), hispa (white parallel streaks), army worm (ragged chewing), stem borer (dead heart/white ear).

TABLE 2 — FUNGAL DISEASE DIFFERENTIATION
──────────────────────────────────────────
LEAF BLAST: SPINDLE/DIAMOND lesions, GRAY center, BROWN border + yellow halo.
BROWN SPOT: OVAL/CIRCULAR, larger, wider YELLOW HALO, linked to K-deficiency.
SHEATH BLIGHT: On SHEATH first, white/gray center, wavy irregular border, hard SCLEROTIA.
BACTERIAL LEAF BLIGHT: WATER-SOAKED margins, starts from leaf TIP/MARGINS.

TABLE 3 — NUTRIENT DEFICIENCY
──────────────────────────────
NITROGEN: Uniform yellowing from OLDER leaves. Symmetrical.
PHOSPHORUS: Purple/reddish older leaves, stunted.
POTASSIUM: Tip and margin SCORCH on older leaves.
ZINC: White/pale mid-vein on YOUNG leaves (Khaira disease).
IRON: Bronzing on young leaves, interveinal chlorosis.

TABLE 4 — OOMYCETE vs TRUE FUNGUS
────────────────────────────────────
TRUE FUNGUS: Hard fruiting bodies, sclerotia. Treat with Propiconazole, Tricyclazole, Carbendazim.
OOMYCETE: White cottony sporulation, rapid rot. Standard fungicides INEFFECTIVE. Use Metalaxyl, Mancozeb.

TABLE 5 — VIRUS DIFFERENTIATION
─────────────────────────────────
TUNGRO: Yellow-orange leaves, stunting, leafhopper vector.
TYLCV: Leaf curling upward, whitefly vector.
MOSAIC: Irregular light/dark green patches, no cure — remove infected plants.

════════════════════════════════════════════════════════════════════════════════
PART 3 — THE BIG 5 RECOMMENDATION FRAMEWORK
════════════════════════════════════════════════════════════════════════════════

ALL recommendations MUST pass through these 5 filters:
1. ECONOMIC: Is damage loss > cost of control? If NO → "Do Nothing / Monitor"
2. EFFECTIVE: Scientifically proven for this pathogen in Bangladesh?
3. SAFE — PLANTWISE RED LIST (NEVER recommend): Monocrotophos, Carbofuran, Endosulfan, etc.
4. PRACTICAL: Suitable for smallholder farmers
5. LOCALLY AVAILABLE: Only products available in Bangladesh markets

════════════════════════════════════════════════════════════════════════════════
PART 4 — RESISTANCE MANAGEMENT (FRAC/IRAC)
════════════════════════════════════════════════════════════════════════════════

FUNGICIDE RESISTANCE: Never repeat same FRAC group consecutively.
INSECTICIDE RESISTANCE: Rotate IRAC groups. Never use same group >2 consecutive sprays.

════════════════════════════════════════════════════════════════════════════════
PART 5 — VISUAL ANALYSIS PROTOCOL
════════════════════════════════════════════════════════════════════════════════

When an image is provided, examine: Distribution, Leaf surface, Lesion morphology, Signs, Plant part, Progression, Associated symptoms.

ACCURACY vs PRECISION: It is SAFER to correctly identify the GROUP than to wrongly name a specific species.

════════════════════════════════════════════════════════════════════════════════
PART 6 — MANDATORY OUTPUT FORMAT
════════════════════════════════════════════════════════════════════════════════

You MUST output EXACTLY in this format. Bangla section first, English section second.

---BANGLA_SECTION---
## ১. CABI বর্জন পদ্ধতি অনুযায়ী বিশ্লেষণ
**অ্যাবায়োটিক নাকি বায়োটিক:** [বিশ্লেষণ]
**বর্জন গেট ফলাফল:** [কোন কারণগুলো বাদ দেওয়া হয়েছে এবং কেন]

## ২. সম্ভাব্য রোগ / পোকার নাম
**প্রাথমিক সন্দেহ:** [নাম — বাংলা ও বৈজ্ঞানিক]
**বিকল্প সন্দেহ (যদি থাকে):** [নাম]
**আস্থার মাত্রা:** [উচ্চ / মাঝারি / কম]

## ৩. রোগ ত্রিভুজ মূল্যায়ন
**পোষক (Host):** [জাতের সংবেদনশীলতা, বৃদ্ধির পর্যায়]
**জীবাণু (Pathogen):** [ইনোকুলাম চাপ, ছড়ানোর ধরন]
**পরিবেশ (Environment):** [আবহাওয়া ডেটার ভিত্তিতে বিশ্লেষণ]

## ৪. মাঠে নিশ্চিতকরণের পদ্ধতি
[কীভাবে মাঠে নিশ্চিত করবেন]

## ৫. তীব্রতা ও অর্থনৈতিক গুরুত্ব
**ক্ষয়ক্ষতির মাত্রা:** [%]
**অর্থনৈতিক থ্রেশহোল্ড:** [ব্যবস্থা নেওয়া প্রয়োজন কিনা]

## ৬. সমন্বিত বালাই ব্যবস্থাপনা (IPM)
**কৃষি ব্যবস্থাপনা (সর্বোচ্চ অগ্রাধিকার):** [বিস্তারিত]
**জৈবিক নিয়ন্ত্রণ:** [Trichoderma, COS, জৈব বালাইনাশক]
**রাসায়নিক (শেষ উপায় — FRAC/IRAC গ্রুপ উল্লেখসহ):** [শুধুমাত্র যদি অর্থনৈতিক থ্রেশহোল্ড অতিক্রম করে]

## ৭. প্রতিরোধ — পরবর্তী মৌসুম
[বিস্তারিত]

## ৮. কখন DAE কর্মকর্তার পরামর্শ নেবেন
[নির্দিষ্ট পরিস্থিতি]
---END_BANGLA---

---ENGLISH_SECTION---
## 1. CABI Exclusion Analysis
**Abiotic vs Biotic:** [analysis]
**Exclusion Gates:** [which causes excluded and why]

## 2. Probable Diagnosis
**Primary suspect:** [name — common & scientific]
**Differential diagnosis:** [alternative if applicable]
**Confidence level:** [High / Medium / Low]

## 3. Disease Triangle Assessment
**Host:** [variety susceptibility, growth stage]
**Pathogen:** [inoculum pressure, spread pattern]
**Environment:** [weather-based analysis]

## 4. Field Confirmation Method
[Specific field tests]

## 5. Severity & Economic Importance
**Damage level:** [%]
**Economic threshold:** [action justified or not]

## 6. IPM Recommendations
**Cultural control (highest priority):** [details]
**Biological control:** [Trichoderma, COS, biopesticides]
**Chemical — last resort (with FRAC/IRAC group):** [only if economic threshold exceeded]

## 7. Prevention — Next Season
[details]

## 8. When to Consult DAE
[specific situations]
---END_ENGLISH---

CRITICAL RULES:
- NEVER recommend Plantwise Red List pesticides
- ALWAYS state confidence level
- ALWAYS show your exclusion reasoning
- ALWAYS factor real-time weather data into Disease Triangle
- If damage is below economic threshold, recommend "Do Nothing — Monitor"
- Accuracy over precision when uncertain

STRUCTURED OUTPUT REQUIREMENT:
At the very end, after ---END_ENGLISH---, include ONE JSON block using EXACTLY this format.

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
    "a_reason": "No chewing marks, frass, webbing or insect presence observed",
    "b_virus": "excluded",
    "b_reason": "No mosaic, ring spots, or vein-bounded chlorosis",
    "c_bacteria": "excluded",
    "c_reason": "No water-soaked margins or bacterial ooze at lesion edges",
    "d_fungi": "confirmed",
    "d_reason": "Spindle-shaped gray-centered lesions with brown borders confirm Pyricularia oryzae"
  },
  "top_candidates": [
    { "rank": 1, "name_bn": "ব্লাস্ট", "name_en": "Leaf Blast", "scientific_name": "Pyricularia oryzae", "confidence_pct": 85, "key_feature": "Spindle/diamond lesions, gray center, brown border" },
    { "rank": 2, "name_bn": "বাদামি দাগ", "name_en": "Brown Spot", "scientific_name": "Bipolaris oryzae", "confidence_pct": 12, "key_feature": "Oval circular lesions, wider yellow halo" }
  ],
  "disease_triangle": {
    "host_score": 7, "pathogen_score": 8, "environment_score": 9,
    "host_note": "Susceptible variety at tillering stage",
    "pathogen_note": "High inoculum pressure",
    "environment_note": "Humidity 87%, night temp 24°C — ideal blast conditions"
  },
  "field_confirmation": {
    "test_bn": "পাতায় মাকু/হীরা আকৃতির ছাই রঙের দাগ খুঁজুন",
    "steps_bn": ["পাতার উপরিভাগে মাকু আকৃতির দাগ খুঁজুন", "দাগের কেন্দ্র ছাই রঙের যাচাই করুন"]
  },
  "ipm_recommendations": [
    { "priority": 1, "type": "cultural", "action_bn": "আক্রান্ত জমির পানি সরিয়ে শুকিয়ে নিন", "timing": "এখনই" },
    { "priority": 2, "type": "chemical", "action_bn": "ট্রাইসাইক্লাজোল ০.৭ গ্রাম/লিটার স্প্রে", "timing": "৩ দিনের মধ্যে" }
  ],
  "chemical_options": [
    { "name_bn": "ট্রাইসাইক্লাজোল", "trade_name": "ব্রিকোল / ট্রুপার", "frac_irac_group": "FRAC 29", "dose": "০.৭ গ্রাম/লিটার", "phi_days": 14 }
  ],
  "prevention_bn": "ব্লাস্ট-প্রতিরোধী জাত ব্যবহান করুন। বীজ শোধন করুন। নাইট্রোজেন সার ভাগে ভাগে দিন।",
  "dae_consult_bn": "৭ দিনে আক্রমণ না কমলে DAE কর্মকর্তাকে জানান।",
  "key_recommendations": ["জমি সাময়িক শুকিয়ে নিন", "ট্রাইসাইক্লাজোল স্প্রে করুন (FRAC 29)", "প্রতিরোধী জাত ব্যবহার করুন"]
}
---END_JSON---

CRITICAL JSON RULES:
- The JSON block is MANDATORY in every response
- All "confidence_pct" values must be integers 0–100; candidates must sum to ≤100
- "urgency" must be one of: "immediate" | "within_3_days" | "within_week" | "monitor"
- "gate_results" values: "excluded" | "retained" | "uncertain"
- "type" in ipm_recommendations: "cultural" | "biological" | "chemical" | "monitoring"
- Provide at least 2 top_candidates
- If abiotic, set all gate results to "excluded"
`.trim();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractStructuredJson(text: string): Record<string, unknown> | null {
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

function stripStructuredJson(text: string): string {
  const marker = "---JSON_SUMMARY---";
  const endMarker = "---END_JSON---";
  const startIdx = text.indexOf(marker);
  const endIdx = text.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) return text;
  return text.slice(0, startIdx).trim() + "\n" + text.slice(endIdx + endMarker.length).trim();
}

function extractBanglaSection(text: string): string {
  const start = text.indexOf("---BANGLA_SECTION---");
  const end = text.indexOf("---END_BANGLA---");
  if (start === -1 || end === -1) return text;
  return text.slice(start + "---BANGLA_SECTION---".length, end).trim();
}

function extractEnglishSection(text: string): string {
  const start = text.indexOf("---ENGLISH_SECTION---");
  const end = text.indexOf("---END_ENGLISH---");
  if (start === -1 || end === -1) return "";
  return text.slice(start + "---ENGLISH_SECTION---".length, end).trim();
}

function buildEmergencyDiagnosis(symptoms: string[], imageAttached: boolean, crop?: string): string {
  const lower = symptoms.join(" ").toLowerCase();
  const suspects: string[] = [];
  if (/yellow|হলুদ|chlorosis/.test(lower)) suspects.push("পুষ্টি ঘাটতি / Nutrient deficiency");
  if (/spot|দাগ|blast|blight|lesion/.test(lower)) suspects.push("ছত্রাক বা ব্যাকটেরিয়া / Fungal or bacterial disease");
  if (/curl|কুঁক|মোড়া|mosaic|virus/.test(lower)) suspects.push("ভাইরাস বা থ্রিপস-অ্যাফিড / Virus or sucking pest");
  if (/hole|ছিদ্র|chew|roll|frass|web|mite|aphid|thrips|insect|পোকা/.test(lower)) suspects.push("পোকার আক্রমণ / Insect or mite attack");
  if (/wilt|মরে|শুক|rot|পচা/.test(lower)) suspects.push("উইল্ট বা রুট/স্টেম রট / Wilt or root-stem rot");

  const primary = suspects[0] || "ছবি ও বর্ণনার ভিত্তিতে প্রাথমিক সন্দেহ";
  const differentials = suspects.slice(1, 3);
  const imageNote = imageAttached
    ? "ছবি যুক্ত আছে, তাই এটি একটি জরুরি বিশ্লেষণ।"
    : "এই বিশ্লেষণটি মূলত আপনার বর্ণনার ভিত্তিতে করা হয়েছে।";
  const cropNote = crop ? `ফসল: ${crop}` : "";

  return `---BANGLA_SECTION---
## ১. প্রাথমিক CABI বিশ্লেষণ
**অবস্থা:** জরুরি বিকল্প বিশ্লেষণ
**মন্তব্য:** ${imageNote} ${cropNote}

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
**Status:** Emergency fallback assessment
**Note:** ${imageAttached ? "An image was attached." : "Based on user description."} ${cropNote}

## 2. Most Likely Cause
**Primary suspect:** ${primary}
**Differentials:** ${differentials.length ? differentials.join(" ; ") : "Needs field confirmation"}
**Confidence:** Low to Medium

## 3. Immediate Safe Actions
- Inspect leaf underside for insects, mites, eggs, webbing, honeydew
- Avoid unnecessary pesticide spraying until cause is narrowed
---END_ENGLISH---`;
}

// ─── Provider: Gemini 2.5 Flash ──────────────────────────────────────────
async function tryGemini(messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>): Promise<{ text: string; provider: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const lastMsg = messages[messages.length - 1];
  const content = Array.isArray(lastMsg.content) ? lastMsg.content : [{ type: "text", text: lastMsg.content as string }];

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
  for (const block of content) {
    if (block.type === "image_url" && block.image_url?.url) {
      const dataUrl = block.image_url.url;
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
    } else if (block.type === "text" && block.text) {
      parts.push({ text: block.text });
    }
  }

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts }],
    generationConfig: { maxOutputTokens: 3000, temperature: 0.3 },
  };

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Gemini HTTP ${res.status}`);

  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("\n") || "No response.";
  return { text, provider: "Gemini 2.5 Flash" };
}

// ─── Provider: Groq Llama 4 Scout ────────────────────────────────────────
async function tryGroq(messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>): Promise<{ text: string; provider: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  // Strip images for text-only model
  const textMessages = messages.map(m => ({
    role: m.role,
    content: Array.isArray(m.content)
      ? m.content.filter(b => b.type === "text").map(b => b.text || "").join("\n")
      : m.content,
  }));

  const body = {
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens: 3000,
    temperature: 0.3,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...textMessages],
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Groq HTTP ${res.status}`);
  return { text: data?.choices?.[0]?.message?.content || "No response.", provider: "Groq Llama 4 Scout" };
}

// ─── Provider: OpenRouter ────────────────────────────────────────────────
async function tryOpenRouter(messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>): Promise<{ text: string; provider: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const body = {
    model: "qwen/qwen2.5-vl-72b-instruct:free",
    max_tokens: 3000,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://web.krishiai.live",
      "X-Title": "KrishiAI CABI Diagnosis",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data?.error?.message || `OpenRouter HTTP ${res.status}`);
  return { text: data?.choices?.[0]?.message?.content || "No response.", provider: "OpenRouter Qwen-VL" };
}

// ─── CORS ────────────────────────────────────────────────────────────────
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

// ─── Main Handler ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { image, symptoms = [], crop, weather, description } = body as {
      image?: string;
      symptoms?: string[];
      crop?: string;
      weather?: { temp?: number; humidity?: number; rain24h?: number };
      description?: string;
    };

    // Build user message
    const symptomText = Array.isArray(symptoms) ? symptoms.join(", ") : "";
    const englishSymptoms = translateSymptomsToEnglish(symptoms);
    const weatherContext = weather
      ? `আবহাওয়া: তাপমাত্রা ${weather.temp || "?"}°C, আর্দ্রতা ${weather.humidity || "?"}%, বৃষ্টি ${weather.rain24h || 0}মিমি/২৪ঘণ্টা`
      : "";
    const cropContext = crop ? `ফসল: ${crop}` : "";

    const userText = `এই ফসলের অবস্থা বিশ্লেষণ করুন।
${cropContext}
লক্ষণসমূহ: ${symptomText}
${description ? `অতিরিক্ত বর্ণনা: ${description}` : ""}
${weatherContext}
ইংরেজি কীওয়ার্ড: ${englishSymptoms}

CABI Plantwise পদ্ধতিতে বিশ্লেষণ করুন। বর্জন গেট, রোগ ত্রিভুজ, এবং IPM পরামর্শ দিন।`;

    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: userText },
    ];

    if (image && typeof image === "string") {
      // Validate size
      const sizeInBytes = Math.ceil((image.length - "data:image/".length) * 0.75);
      if (sizeInBytes > 10 * 1024 * 1024) {
        return NextResponse.json(
          { ok: false, error: "ছবি অত্যন্ত বড় (সর্বোচ্চ ১০ মেগাবাইট)" },
          { status: 400, headers: corsHeaders(origin) }
        );
      }
      userContent.push({ type: "image_url", image_url: { url: image } });
    }

    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
      { role: "user", content: userContent },
    ];

    // ─── Waterfall Provider Chain ─────────────────────────────────────────
    let resultText = "";
    let provider = "";

    // 1. Primary: z-ai-web-dev-sdk VLM
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.createVision({
        model: "glm-4v-plus",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        thinking: { type: "disabled" },
      });
      resultText = completion?.choices?.[0]?.message?.content || "";
      provider = "z-ai-vlm";
    } catch (e) {
      console.warn("[diagnose] z-ai-vlm failed:", e instanceof Error ? e.message : String(e));
    }

    // 2. Fallback 1: Gemini 2.5 Flash
    if (!resultText) {
      try {
        const geminiResult = await tryGemini(messages);
        resultText = geminiResult.text;
        provider = geminiResult.provider;
      } catch (e) {
        console.warn("[diagnose] Gemini failed:", e instanceof Error ? e.message : String(e));
      }
    }

    // 3. Fallback 2: OpenRouter Qwen-VL
    if (!resultText) {
      try {
        const orResult = await tryOpenRouter(messages);
        resultText = orResult.text;
        provider = orResult.provider;
      } catch (e) {
        console.warn("[diagnose] OpenRouter failed:", e instanceof Error ? e.message : String(e));
      }
    }

    // 4. Fallback 3: Groq text-only
    if (!resultText) {
      try {
        const groqResult = await tryGroq(messages);
        resultText = groqResult.text;
        provider = groqResult.provider;
      } catch (e) {
        console.warn("[diagnose] Groq failed:", e instanceof Error ? e.message : String(e));
      }
    }

    // 5. Fallback 4: z-ai-web-dev-sdk text-only
    if (!resultText) {
      try {
        const ZAI = (await import("z-ai-web-dev-sdk")).default;
        const zai = await ZAI.create();
        const textMessages = messages.map(m => ({
          role: m.role,
          content: Array.isArray(m.content)
            ? m.content.filter(b => b.type === "text").map(b => b.text || "").join("\n")
            : (m.content as string),
        }));
        const completion = await zai.chat.completions.create({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...textMessages,
          ],
          thinking: { type: "disabled" },
        });
        resultText = completion?.choices?.[0]?.message?.content || "";
        provider = "z-ai-text";
      } catch (e) {
        console.warn("[diagnose] z-ai-text failed:", e instanceof Error ? e.message : String(e));
      }
    }

    // 6. Fallback 5: Offline CABI engine
    if (!resultText) {
      try {
        const symptomObj: Record<string, string> = {};
        if (symptomText) symptomObj.symptoms = symptomText;
        if (description) symptomObj.description = description;
        if (englishSymptoms) symptomObj.englishSymptoms = englishSymptoms;

        const offlineResult = diagnoseOffline({
          symptoms: symptomObj,
          envInfo: weather || {},
          crop,
        });

        // Format offline result as CABI-structured text
        const banglaSection = `---BANGLA_SECTION---
## ১. CABI বর্জন পদ্ধতি অনুযায়ী বিশ্লেষণ
**অ্যাবায়োটিক নাকি বায়োটিক:** ${offlineResult.abioticBiotic === 'abiotic' ? 'অ্যাবায়োটিক (অজীবাণু)' : offlineResult.abioticBiotic === 'biotic' ? 'বায়োটিক (জীবাণু/পোকা)' : 'অনিশ্চিত'}
**বর্জন গেট ফলাফল:**
- বাদ দেওয়া হয়েছে: ${offlineResult.excluded.join(", ") || "কোনোটি নয়"}
- সন্দেহভাজন: ${offlineResult.suspects.join(", ") || "নেই"}

## ২. সম্ভাব্য রোগ
**প্রাথমিক সন্দেহ:** ${offlineResult.primarySuspect}
${offlineResult.specificDisease ? `**রোগ:** ${offlineResult.specificDisease.nameBn} (${offlineResult.specificDisease.name})` : ""}
**আস্থার মাত্রা:** ${offlineResult.confidence === 'high' ? 'উচ্চ' : offlineResult.confidence === 'medium' ? 'মাঝারি' : 'কম'}

## ৩. রোগ ত্রিভুজ মূল্যায়ন
**পোষক (Host):** ${offlineResult.diseaseTriangle.host}
**জীবাণু (Pathogen):** ${offlineResult.diseaseTriangle.pathogen}
**পরিবেশ (Environment):** ${offlineResult.diseaseTriangle.environment}
**ঝুঁকি স্তর:** ${offlineResult.diseaseTriangle.riskLevel === 'high' ? 'উচ্চ' : offlineResult.diseaseTriangle.riskLevel === 'medium' ? 'মাঝারি' : 'কম'}

## ৪. মাঠে নিশ্চিতকরণের পদ্ধতি
${offlineResult.fieldConfirmation.map((m, i) => `${i + 1}. ${m}`).join("\n")}

## ৫. সমন্বিত বালাই ব্যবস্থাপনা (IPM)
**কৃষি ব্যবস্থাপনা:** ${offlineResult.ipmRecommendations.cultural.join("; ")}
**জৈবিক নিয়ন্ত্রণ:** ${offlineResult.ipmRecommendations.biological.join("; ")}
**রাসায়নিক (শেষ উপায়):** ${offlineResult.ipmRecommendations.chemical.join("; ")}

## ৬. প্রতিরোধ
${offlineResult.ipmRecommendations.prevention.join("; ")}

## ৭. কখন DAE কর্মকর্তার পরামর্শ নেবেন
যদি রোগ ৭ দিনে না কমে বা দ্রুত ছড়ায়, নিকটস্থ DAE কর্মকর্তাকে দেখান। হটলাইন: ১৬১২৩
---END_BANGLA---`;

        resultText = banglaSection;
        provider = "Offline CABI Engine";
      } catch (e) {
        console.warn("[diagnose] Offline engine failed:", e instanceof Error ? e.message : String(e));
      }
    }

    // 7. Fallback 6: Emergency regex-based diagnosis
    if (!resultText) {
      resultText = buildEmergencyDiagnosis(symptoms, !!image, crop);
      provider = "Emergency Regex";
    }

    // ─── Extract structured data ──────────────────────────────────────────
    const structuredJson = extractStructuredJson(resultText);
    const banglaSection = extractBanglaSection(resultText);
    const englishSection = extractEnglishSection(resultText);
    const fullText = stripStructuredJson(resultText);

    const elapsed = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      provider,
      elapsed_ms: elapsed,
      text: fullText,
      bangla: banglaSection,
      english: englishSection,
      json: structuredJson,
    }, {
      headers: corsHeaders(origin),
    });

  } catch (e) {
    console.error("[diagnose] Unexpected error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "রোগ নির্ণয় সেবা এখন উপলব্ধ নয়। কিছুক্ষণ পর আবার চেষ্টা করুন।",
      },
      { status: 503, headers: corsHeaders(origin) }
    );
  }
}
