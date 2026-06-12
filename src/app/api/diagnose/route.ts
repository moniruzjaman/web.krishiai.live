/**
 * /api/diagnose — CABI Plantwise Diagnosis API (v2 — Offline-First)
 *
 * Architecture: OFFLINE-FIRST + AI FALLBACK
 *   Step 1: Run offline CABI diagnostic engine (instant, no network)
 *   Step 2: If confidence >= 70% → return offline result immediately
 *   Step 3: If confidence < 70% → try ONE AI provider with 8s timeout
 *   Step 4: Return combined result with confidence level
 *
 * Total time: 0-8 seconds (well within Vercel's 10s hobby limit)
 *
 * Request formats:
 *   - { messages, crop, district }  (OpenAI-style)
 *   - { image, symptoms, crop, description, district, eliminationAnswers, triangleAnswers, infectedPart }  (Analyzer-page)
 *
 * Response: { ok, offlineResult, aiResult, provider, elapsed_ms, structured }
 */

import { NextRequest, NextResponse } from "next/server";
import { diagnoseOffline } from "@/lib/cabi/diagnosticEngine";
import { saveDiagnosis, saveDiagnosisFeedback, hasTurso } from "@/lib/turso";
import {
  FRAC_GROUPS, IRAC_GROUPS, PLANTWISE_RED_LIST,
  getFRACOptionsForDisease, getIRACOptionsForPest, isRedListed
} from "@/lib/cabi/resistanceDB";

// ─── Vercel Function Config ──────────────────────────────────────────────────
export const maxDuration = 10; // 10 seconds (hobby plan limit)

// ─── Constants ──────────────────────────────────────────────────────────────
const AI_TIMEOUT_MS = 6_000;        // 6s max for AI call (leaves 4s buffer for Vercel 10s)
const CONFIDENCE_THRESHOLD = 70;     // Offline confidence above this → skip AI
const MAX_IMAGE_CHARS = 800_000;     // ~600KB base64

// ─── CABI System Prompt (condensed for speed — full prompt was 600+ lines) ──
const SYSTEM_PROMPT = `You are a CABI Plantwise diagnostic AI for Bangladesh. Diagnose the crop disease based on the provided symptoms, image, and field observations.

Follow the CABI exclusion protocol:
1. Abiotic vs Biotic gate → 2. Exclusion Gates (A: insects, B: virus, C: bacteria, D: fungi) → 3. Disease Triangle → 4. IPM

BIG 5 FILTER: All recommendations must be 1)Economic 2)Effective 3)Safe(NEVER recommend Red List pesticides: Monocrotophos, Carbofuran, Endosulfan, Phorate, Aldicarb) 4)Practical 5)Locally Available in Bangladesh.

RESISTANCE MANAGEMENT: Always include FRAC/IRAC MoA group numbers. Never repeat same group consecutively.

MANDATORY OUTPUT FORMAT (dual language):
---BANGLA_SECTION---
## ১. CABI বর্জন পদ্ধতি অনুযায়ী বিশ্লেষণ
**অ্যাবায়োটিক নাকি বায়োটিক:** [বিশ্লেষণ]
**বর্জন গেট ফলাফল:** [কোন কারণগুলো বাদ দেওয়া হয়েছে]
## ২. সম্ভাব্য রোগ
**প্রাথমিক সন্দেহ:** [নাম — বাংলা ও বৈজ্ঞানিক]
**আস্থার মাত্রা:** [উচ্চ/মাঝারি/কম]
## ৩. রোগ ত্রিভুজ মূল্যায়ন
**পোষক:** [বিশ্লেষণ] **জীবাণু:** [বিশ্লেষণ] **পরিবেশ:** [বিশ্লেষণ]
## ৪. সমন্বিত বালাই ব্যবস্থাপনা (IPM)
**কৃষি ব্যবস্থাপনা:** [বিস্তারিত] **জৈবিক নিয়ন্ত্রণ:** [Trichoderma, COS]
**রাসায়নিক (শেষ উপায় — MoA গ্রুপ সহ):** [শুধু অর্থনৈতিক থ্রেশহোল্ড অতিক্রম করলে]
## ৫. প্রতিরোধ — পরবর্তী মৌসুম
[বিস্তারিত]
## ৬. ⚠️ দাবিত্যাগ: রাসায়নিক প্রয়োগের আগে অবশ্যই স্থানীয় DAE/SAAO কর্মকর্তার পরামর্শ নিন
---END_BANGLA---
---ENGLISH_SECTION---
[Same sections in English]
---END_ENGLISH---
---JSON_SUMMARY---
{
  "disease_name": "Rice Leaf Blast", "disease_name_bn": "ধানের পাতা ব্লাস্ট",
  "confidence": "high", "confidence_pct": 85, "severity": "moderate",
  "urgency": "within_3_days", "biotic_abiotic": "biotic", "cause_type": "fungal",
  "etl_exceeded": true, "action_required": true,
  "gate_results": {"a_insects":"excluded","a_reason":"...","b_virus":"excluded","b_reason":"...","c_bacteria":"excluded","c_reason":"...","d_fungi":"confirmed","d_reason":"..."},
  "top_candidates": [{"rank":1,"name_bn":"ব্লাস্ট","name_en":"Leaf Blast","scientific_name":"Pyricularia oryzae","confidence_pct":85,"key_feature":"..."}],
  "disease_triangle": {"host_score":7,"pathogen_score":8,"environment_score":9,"host_note":"...","pathogen_note":"...","environment_note":"..."},
  "field_confirmation": {"test_bn":"...","steps_bn":["..."]},
  "ipm_recommendations": [{"priority":1,"type":"cultural","action_bn":"...","timing":"এখনই"}],
  "chemical_options": [{"name_bn":"ট্রাইসাইক্লাজোল","trade_name":"ব্রিকোল","frac_irac_group":"FRAC 29","dose":"০.৭ গ্রাম/লিটার","phi_days":14,"moa":"Melanin biosynthesis inhibitor"}],
  "prevention_bn": "...", "dae_consult_bn": "...", "disclaimer": "রাসায়নিক প্রয়োগের আগে অবশ্যই স্থানীয় DAE/SAAO কর্মকর্তার পরামর্শ নিন",
  "key_recommendations": ["..."]
}
---END_JSON---`.trim();

// ─── Helpers ─────────────────────────────────────────────────────────────────
function extractStructuredJson(text: string) {
  try {
    const marker = "---JSON_SUMMARY---";
    const endMarker = "---END_JSON---";
    const startIdx = text.indexOf(marker);
    const endIdx = text.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
    return JSON.parse(text.slice(startIdx + marker.length, endIdx).trim());
  } catch { return null; }
}

function stripStructuredJson(text: string) {
  const marker = "---JSON_SUMMARY---";
  const endMarker = "---END_JSON---";
  const s = text.indexOf(marker);
  const e = text.indexOf(endMarker);
  if (s === -1 || e === -1) return text;
  return text.slice(0, s).trim() + text.slice(e + endMarker.length).trim();
}

function extractSections(text: string) {
  let bangla = "", english = "";
  const bs = text.indexOf("---BANGLA_SECTION---"), be = text.indexOf("---END_BANGLA---");
  const es = text.indexOf("---ENGLISH_SECTION---"), ee = text.indexOf("---END_ENGLISH---");
  if (bs !== -1 && be !== -1) bangla = text.slice(bs + "---BANGLA_SECTION---".length, be).trim();
  if (es !== -1 && ee !== -1) english = text.slice(es + "---ENGLISH_SECTION---".length, ee).trim();
  if (!bangla && !english) bangla = text;
  return { bangla, english };
}

function compressImage(dataUrl: string, maxChars: number = MAX_IMAGE_CHARS): string {
  if (dataUrl.length <= maxChars) return dataUrl;
  // Truncate oversized images
  return dataUrl.slice(0, maxChars);
}

function extractPlainUserText(messages: any[]): string {
  return messages.flatMap((m: any) => {
    if (!Array.isArray(m.content)) return typeof m.content === "string" ? [m.content] : [];
    return m.content.filter((b: any) => b.type === "text" && b.text).map((b: any) => b.text);
  }).join("\n");
}

// ─── Convert offline diagnosis to API response format ───────────────────────
function offlineToStructured(offline: any, crop: string, symptoms: string[], infectedPart?: string, eliminationAnswers?: Record<string, string>, triangleAnswers?: Record<string, string>) {
  // Map offline confidence to percentage
  const confidenceMap: Record<string, number> = { high: 85, medium: 55, low: 30 };
  const confidencePct = offline.specificDisease
    ? (offline.specificDisease.confidence === 'high' ? 85 : offline.specificDisease.confidence === 'medium' ? 55 : 30)
    : (offline.confidence === 'high' ? 75 : offline.confidence === 'medium' ? 50 : 25);

  // Build gate results
  const gateResults: Record<string, string> = {};
  const excluded = offline.excluded || [];
  const suspects = offline.suspects || [];

  gateResults.a_insects = excluded.includes('insects/mites') ? 'excluded' : suspects.some((s: string) => s.includes('insect')) ? 'retained' : 'uncertain';
  gateResults.a_reason = gateResults.a_insects === 'excluded' ? 'কোনো পোকার লক্ষণ পাওয়া যায়নি' : gateResults.a_insects === 'retained' ? 'পোকার লক্ষণ শনাক্ত' : 'নিশ্চিত হতে আরো তথ্য দরকার';
  gateResults.b_virus = excluded.includes('virus') ? 'excluded' : suspects.some((s: string) => s.includes('virus')) ? 'retained' : 'uncertain';
  gateResults.b_reason = gateResults.b_virus === 'excluded' ? 'মোজাইক বা রিং স্পট নেই' : gateResults.b_virus === 'retained' ? 'ভাইরাসের লক্ষণ শনাক্ত' : 'নিশ্চিত হতে আরো তথ্য দরকার';
  gateResults.c_bacteria = excluded.includes('bacteria') ? 'excluded' : suspects.some((s: string) => s.includes('bacteria')) ? 'retained' : 'uncertain';
  gateResults.c_reason = gateResults.c_bacteria === 'excluded' ? 'পানিভেজা কিনারা বা আঠালো নিঃসরণ নেই' : gateResults.c_bacteria === 'retained' ? 'ব্যাকটেরিয়ার লক্ষণ শনাক্ত' : 'নিশ্চিত হতে আরো তথ্য দরকার';
  gateResults.d_fungi = excluded.includes('fungi/oomycetes') && excluded.includes('true fungi') && excluded.includes('oomycetes') ? 'excluded' : suspects.some((s: string) => s.includes('fung') || s.includes('oomy')) ? 'confirmed' : 'uncertain';
  gateResults.d_reason = gateResults.d_fungi === 'excluded' ? 'ছত্রাকের লক্ষণ পাওয়া যায়নি' : gateResults.d_fungi === 'confirmed' ? 'ছত্রাকের লক্ষণ নিশ্চিত' : 'নিশ্চিত হতে আরো তথ্য দরকার';

  // Apply elimination answers to refine gate results
  if (eliminationAnswers) {
    if (eliminationAnswers.water_soak === 'yes') {
      gateResults.c_bacteria = 'retained';
      gateResults.c_reason = 'পানিভেজা দাগ নিশ্চিত — ব্যাকটেরিয়া সন্দেহ';
    }
    if (eliminationAnswers.leaf_margin_discolor === 'yes') {
      // Could be fungal or bacterial depending on pattern
    }
    if (eliminationAnswers.insect_visible === 'yes') {
      gateResults.a_insects = 'retained';
      gateResults.a_reason = 'পোকা দৃশ্যমান — কীটপতঙ্গ সন্দেহ';
    }
    if (eliminationAnswers.mosaic_pattern === 'yes') {
      gateResults.b_virus = 'retained';
      gateResults.b_reason = 'মোজাইক প্যাটার্ন — ভাইরাস সন্দেহ';
    }
    if (eliminationAnswers.powdery_growth === 'yes' || eliminationAnswers.fruiting_bodies === 'yes') {
      gateResults.d_fungi = 'confirmed';
      gateResults.d_reason = eliminationAnswers.powdery_growth === 'yes' ? 'গুঁড়া আবরণ — ছত্রাক নিশ্চিত' : 'ফ্রুটিং বডি — ছত্রাক নিশ্চিত';
    }
  }

  // Build top candidates
  const topCandidates = (offline.cropDiseaseMatches || []).slice(0, 3).map((match: any, i: number) => ({
    rank: i + 1,
    name_bn: match.nameBn || match.name,
    name_en: match.name,
    scientific_name: match.pathogen || '',
    confidence_pct: Math.round(match.matchRatio * 100),
    key_feature: (match.matchedSymptoms || []).slice(0, 2).join(', ') || 'Symptom match',
  }));

  // If no crop disease matches, use primary suspect
  if (topCandidates.length === 0 && offline.primarySuspect) {
    topCandidates.push({
      rank: 1,
      name_bn: offline.primarySuspect,
      name_en: offline.primarySuspect,
      scientific_name: 'Field confirmation required',
      confidence_pct: confidencePct,
      key_feature: 'Based on exclusion gate analysis',
    });
  }

  // Determine cause type
  let causeType = 'uncertain';
  if (offline.abioticBiotic === 'abiotic') causeType = 'deficiency';
  else if (suspects.some((s: string) => s.includes('fung'))) causeType = 'fungal';
  else if (suspects.includes('bacteria')) causeType = 'bacterial';
  else if (suspects.includes('virus')) causeType = 'viral';
  else if (suspects.some((s: string) => s.includes('insect'))) causeType = 'insect';

  // Build IPM recommendations with MoA numbers
  const ipmRecs: any[] = [];
  const ipm = offline.ipmRecommendations || {};

  (ipm.cultural || []).forEach((rec: string, i: number) => {
    ipmRecs.push({ priority: ipmRecs.length + 1, type: 'cultural', action_bn: rec, timing: 'এখনই' });
  });
  (ipm.biological || []).forEach((rec: string) => {
    ipmRecs.push({ priority: ipmRecs.length + 1, type: 'biological', action_bn: rec, timing: 'প্রতিরোধ হিসেবে' });
  });

  // Chemical options with MoA numbers from FRAC/IRAC databases
  const chemicalOptions: any[] = [];
  if (offline.specificDisease && (ipm.chemical || []).length > 0) {
    const diseaseName = offline.specificDisease.name;
    // Get FRAC options for fungal diseases
    if (causeType === 'fungal') {
      const fracOptions = getFRACOptionsForDisease(diseaseName);
      fracOptions.forEach(group => {
        chemicalOptions.push({
          name_bn: group.commonProducts[0] || group.name,
          trade_name: group.commonProducts.slice(0, 2).join(' / '),
          frac_irac_group: `FRAC ${group.code}`,
          dose: 'লেবেল মাত্রায়',
          phi_days: group.phiDays,
          moa: group.modeOfAction,
          resistance_risk: group.resistanceRisk,
        });
      });
    }
    // Get IRAC options for insect pests
    if (causeType === 'insect') {
      const iracOptions = getIRACOptionsForPest(diseaseName);
      iracOptions.forEach(group => {
        chemicalOptions.push({
          name_bn: group.commonProducts[0] || group.name,
          trade_name: group.commonProducts.slice(0, 2).join(' / '),
          frac_irac_group: `IRAC ${group.code}`,
          dose: 'লেবেল মাত্রায়',
          phi_days: group.phiDays,
          moa: group.modeOfAction,
          resistance_risk: group.resistanceRisk,
        });
      });
    }
    // If no specific FRAC/IRAC found, use generic chemical recs
    if (chemicalOptions.length === 0) {
      (ipm.chemical || []).forEach((rec: string) => {
        chemicalOptions.push({
          name_bn: rec,
          trade_name: '',
          frac_irac_group: 'পরামর্শ করুন',
          dose: '',
          phi_days: 14,
          moa: 'DAE কর্মকর্তার পরামর্শ নিন',
          resistance_risk: 'unknown',
        });
      });
    }
  }

  // Add chemical recs as IPM items
  if (chemicalOptions.length > 0) {
    chemicalOptions.slice(0, 2).forEach(chem => {
      ipmRecs.push({
        priority: ipmRecs.length + 1,
        type: 'chemical',
        action_bn: `${chem.name_bn} (${chem.frac_irac_group}) — ${chem.moa}`,
        timing: '৩ দিনের মধ্যে',
      });
    });
  }

  // Add monitoring
  ipmRecs.push({ priority: ipmRecs.length + 1, type: 'monitoring', action_bn: '৭ দিন পর পুনরায় মূল্যায়ন করুন', timing: '৭ দিন পর' });

  // Build disease triangle scores
  const triangle = offline.diseaseTriangle || {};
  const envScore = triangle.riskLevel === 'high' ? 8 : triangle.riskLevel === 'medium' ? 5 : 3;

  // Apply triangle answers to enhance scores
  let hostScore = 5, pathogenScore = 5;
  if (triangleAnswers) {
    if (triangleAnswers.weed_around === 'yes') { pathogenScore += 1; } // alternate host
    if (triangleAnswers.urea_recent === 'yes') { hostScore += 1; pathogenScore += 1; } // succulent growth + blast risk
    if (triangleAnswers.waterlogged === 'yes') { hostScore += 1; } // stress
    if (triangleAnswers.recent_spray === 'yes') { pathogenScore = Math.max(pathogenScore - 1, 3); } // some control already
  }
  hostScore = Math.min(hostScore + (triangle.riskLevel === 'high' ? 2 : 0), 10);
  pathogenScore = Math.min(pathogenScore + (triangle.riskLevel === 'high' ? 2 : 0), 10);

  // Determine ETL (Economic Threshold Level)
  const etlExceeded = offline.specificDisease?.severity === 'severe' ||
    (confidencePct >= 50 && ['fungal', 'bacterial', 'viral', 'insect'].includes(causeType));

  // Determine urgency
  let urgency = 'monitor';
  if (offline.specificDisease?.severity === 'severe') urgency = 'immediate';
  else if (etlExceeded && confidencePct >= 60) urgency = 'within_3_days';
  else if (confidencePct >= 40) urgency = 'within_week';

  return {
    disease_name: offline.specificDisease?.name || offline.primarySuspect || 'Uncertain',
    disease_name_bn: offline.specificDisease?.nameBn || offline.primarySuspect || 'অনিশ্চিত',
    confidence: offline.confidence || 'low',
    confidence_pct: confidencePct,
    severity: offline.specificDisease?.severity || 'moderate',
    urgency,
    biotic_abiotic: offline.abioticBiotic || 'uncertain',
    cause_type: causeType,
    etl_exceeded: etlExceeded,
    action_required: etlExceeded,
    gate_results: gateResults,
    top_candidates: topCandidates,
    disease_triangle: {
      host_score: hostScore,
      pathogen_score: pathogenScore,
      environment_score: envScore,
      host_note: triangle.host || 'Host assessment pending',
      pathogen_note: triangle.pathogen || 'Pathogen assessment pending',
      environment_note: triangle.environment || 'Environment assessment pending',
    },
    field_confirmation: {
      test_bn: offline.fieldConfirmation?.[0] || 'পাতার উল্টোপাশে পোকা/ছত্রাক দেখুন',
      steps_bn: offline.fieldConfirmation?.slice(0, 4) || ['পাতার নিচে পোকা বা জাল আছে কিনা দেখুন', 'দাগের ধরন পরীক্ষা করুন'],
    },
    ipm_recommendations: ipmRecs,
    chemical_options: chemicalOptions,
    prevention_bn: (ipm.prevention || []).join('। ') || 'প্রতিরোধী জাত ব্যবহার করুন এবং সুষম সার দিন।',
    dae_consult_bn: '৭ দিনে আক্রমণ না কমলে বা নতুন জমিতে ছড়িয়ে পড়লে DAE কর্মকর্তাকে জানান।',
    disclaimer: '⚠️ রাসায়নিক প্রয়োগের আগে অবশ্যই স্থানীয় DAE/SAAO কর্মকর্তার পরামর্শ নিন।',
    key_recommendations: ipmRecs.slice(0, 3).map((r: any) => r.action_bn),
  };
}

// ─── AI Provider: Gemini 2.5 Flash ──────────────────────────────────────────
async function tryGemini(messages: any[], withVision: boolean): Promise<{ text: string; provider: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const src = withVision ? messages : messages.map(m => ({
    ...m,
    content: Array.isArray(m.content) ? m.content.filter((b: any) => b.type !== "image") : m.content,
  }));

  const lastMsg = src[src.length - 1];
  const content = Array.isArray(lastMsg.content) ? lastMsg.content : [{ type: "text", text: lastMsg.content || "" }];

  const parts: any[] = [];
  for (const block of content) {
    if (block.type === "image" && block.source?.type === "base64" && withVision) {
      parts.push({ inlineData: { mimeType: block.source.media_type || "image/jpeg", data: block.source.data } });
    } else if (block.type === "text") {
      parts.push({ text: block.text });
    }
  }

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts }],
    generationConfig: { maxOutputTokens: 2500, temperature: 0.3 },
  };

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Gemini HTTP ${res.status}`);
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("\n") || "No response.";
  return { text, provider: withVision ? "Gemini 2.5 Flash 👁️" : "Gemini 2.5 Flash (text)" };
}

// ─── AI Provider: OpenRouter ────────────────────────────────────────────────
async function tryOpenRouter(messages: any[], modelId: string): Promise<{ text: string; provider: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const openAIMsgs = messages.map(m => {
    if (typeof m.content === "string") return { role: m.role, content: m.content };
    if (Array.isArray(m.content)) {
      return {
        role: m.role,
        content: m.content.map((b: any) => {
          if (b.type === "text") return { type: "text", text: b.text };
          if (b.type === "image" && b.source?.type === "base64") {
            return { type: "image_url", image_url: { url: `data:${b.source.media_type || "image/jpeg"};base64,${b.source.data}` } };
          }
          return null;
        }).filter(Boolean),
      };
    }
    return m;
  });

  const body = { model: modelId, max_tokens: 2500, messages: [{ role: "system", content: SYSTEM_PROMPT }, ...openAIMsgs] };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "HTTP-Referer": "https://krishiai.live", "X-Title": "KrishiAI CABI Diagnosis" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data?.error?.message || `OpenRouter HTTP ${res.status}`);
  const resolved = (data?.model || modelId).split("/").pop()?.replace(":free", "") || modelId;
  return { text: data?.choices?.[0]?.message?.content || "No response.", provider: `OpenRouter / ${resolved}` };
}

// ─── Normalize request format ───────────────────────────────────────────────
function normalizeToMessages(body: any): {
  messages: any[]; crop: string; district: string; infectedPart: string;
  eliminationAnswers: Record<string, string>; triangleAnswers: Record<string, string>;
} {
  if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
    return {
      messages: body.messages, crop: body.crop || "", district: body.district || "",
      infectedPart: body.infectedPart || "", eliminationAnswers: body.eliminationAnswers || {},
      triangleAnswers: body.triangleAnswers || {},
    };
  }

  const { image, symptoms, crop, description, district, infectedPart, eliminationAnswers, triangleAnswers } = body;
  const content: any[] = [];
  const textParts: string[] = [];
  if (crop) textParts.push(`ফসল: ${crop}`);
  if (symptoms && Array.isArray(symptoms) && symptoms.length > 0) textParts.push(`লক্ষণসমূহ: ${symptoms.join(", ")}`);
  if (description) textParts.push(`বর্ণনা: ${description}`);
  if (district) textParts.push(`জেলা: ${district}`);
  if (infectedPart) textParts.push(`আক্রান্ত অংশ: ${infectedPart}`);

  // Include elimination answers in text for AI context
  if (eliminationAnswers && Object.keys(eliminationAnswers).length > 0) {
    textParts.push('বর্জন প্রশ্নের উত্তর:');
    for (const [key, val] of Object.entries(eliminationAnswers)) {
      textParts.push(`  ${key}: ${val}`);
    }
  }

  // Include triangle answers
  if (triangleAnswers && Object.keys(triangleAnswers).length > 0) {
    textParts.push('রোগ ত্রিভুজ প্রশ্নের উত্তর:');
    for (const [key, val] of Object.entries(triangleAnswers)) {
      textParts.push(`  ${key}: ${val}`);
    }
  }

  if (textParts.length > 0) content.push({ type: "text", text: textParts.join("\n") });

  if (image) {
    const compressed = compressImage(image);
    const match = compressed.match(/^data:([^;]+);base64,(.+)$/);
    if (match) content.push({ type: "image", source: { type: "base64", media_type: match[1], data: match[2] } });
  }

  if (content.length === 0) content.push({ type: "text", text: "কৃষি রোগ নির্ণয় অনুরোধ" });

  return {
    messages: [{ role: "user", content }],
    crop: crop || "", district: district || "",
    infectedPart: infectedPart || "",
    eliminationAnswers: eliminationAnswers || {},
    triangleAnswers: triangleAnswers || {},
  };
}

// ─── Main Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const rawBody = await req.json();
    const { messages, crop, district, infectedPart, eliminationAnswers, triangleAnswers } = normalizeToMessages(rawBody);

    if (!messages.length) {
      return NextResponse.json({ ok: false, error: "Messages are required" }, { status: 400 });
    }

    const plainText = extractPlainUserText(messages);
    const imageAttached = messages.some(m =>
      Array.isArray(m.content) && m.content.some((b: any) => b.type === "image")
    );

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: OFFLINE DIAGNOSIS (instant, no network needed)
    // ═══════════════════════════════════════════════════════════════════════
    const allSymptoms = [
      ...plainText.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean),
    ];

    const offlineResult = diagnoseOffline({
      symptoms: {
        mainSymptoms: plainText,
        ...(eliminationAnswers || {}),
        ...(triangleAnswers || {}),
      },
      hostInfo: {
        varietySusceptibility: triangleAnswers?.variety_known === 'susceptible' ? 'high' : 'medium',
        growthStage: triangleAnswers?.growth_stage || undefined,
      },
      pathogenInfo: {
        inoculumPressure: triangleAnswers?.disease_history === 'yes' ? 'high' : 'low',
        recentHistory: triangleAnswers?.disease_history === 'yes' ? 'present' : undefined,
      },
      envInfo: {
        humidity: triangleAnswers?.high_humidity === 'yes' ? 90 : undefined,
        temp: triangleAnswers?.hot_weather === 'yes' ? 32 : undefined,
        rainfall: triangleAnswers?.heavy_rain === 'yes' ? 60 : undefined,
      },
      crop: crop || undefined,
    });

    const structured = offlineToStructured(
      offlineResult, crop, allSymptoms, infectedPart, eliminationAnswers, triangleAnswers
    );

    const offlineConfidence = structured.confidence_pct;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: If confidence >= threshold, return offline result immediately
    // ═══════════════════════════════════════════════════════════════════════
    if (offlineConfidence >= CONFIDENCE_THRESHOLD) {
      const elapsed = Date.now() - startTime;

      // Save to Turso (non-blocking)
      if (hasTurso()) {
        saveDiagnosis({
          session_id: `diag_${Date.now()}`,
          crop, disease_name: structured.disease_name,
          disease_name_bn: structured.disease_name_bn,
          confidence: structured.confidence, confidence_pct: offlineConfidence,
          severity: structured.severity, biotic_abiotic: structured.biotic_abiotic,
          cause_type: structured.cause_type, etl_exceeded: structured.etl_exceeded,
          provider: 'Offline CABI Engine', symptoms: plainText.slice(0, 500),
          infected_part: infectedPart, district, image_attached: imageAttached,
          elapsed_ms: elapsed,
        }).catch(() => {});
      }

      return NextResponse.json({
        ok: true,
        offline: true,
        confidence_pct: offlineConfidence,
        provider: "CABI Offline Engine ⚡",
        structured,
        elapsed_ms: elapsed,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Low confidence — try ONE AI provider (6s timeout)
    // ═══════════════════════════════════════════════════════════════════════
    let aiResult: { text: string; provider: string } | null = null;
    let aiProvider = "";
    let aiError = "";

    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([promise, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('AI timeout')), ms))]);

    // Try Gemini first (best for vision + reasoning)
    if (process.env.GEMINI_API_KEY) {
      try {
        aiResult = await withTimeout(tryGemini(messages, imageAttached), AI_TIMEOUT_MS);
        aiProvider = aiResult.provider;
      } catch (e: any) {
        aiError = `Gemini: ${e?.message || 'failed'}`;
      }
    } else {
      aiError = 'GEMINI_API_KEY not set';
    }

    // If Gemini failed, try OpenRouter
    if (!aiResult && process.env.OPENROUTER_API_KEY) {
      try {
        const modelId = imageAttached ? "qwen/qwen2.5-vl-72b-instruct:free" : "qwen/qwen2.5-72b-instruct:free";
        aiResult = await withTimeout(tryOpenRouter(messages, modelId), AI_TIMEOUT_MS);
        aiProvider = aiResult.provider;
      } catch (e: any) {
        aiError += ` | OpenRouter: ${e?.message || 'failed'}`;
      }
    }

    if (!aiResult && !process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
      aiError = 'No AI API keys configured';
    }

    const elapsed = Date.now() - startTime;

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 4: Merge AI result with offline result
    // ═══════════════════════════════════════════════════════════════════════
    if (aiResult) {
      const aiStructured = extractStructuredJson(aiResult.text);
      // AI result takes priority for structured data, but we add MoA numbers if missing
      const finalStructured = aiStructured || structured;

      // Ensure MoA numbers on chemical options
      if (finalStructured.chemical_options) {
        finalStructured.chemical_options.forEach((chem: any) => {
          if (!chem.moa && chem.frac_irac_group) {
            const fracGroup = FRAC_GROUPS.find(g => `FRAC ${g.code}` === chem.frac_irac_group);
            if (fracGroup) chem.moa = fracGroup.modeOfAction;
          }
        });
      }

      // Ensure disclaimer
      if (!finalStructured.disclaimer) {
        finalStructured.disclaimer = '⚠️ রাসায়নিক প্রয়োগের আগে অবশ্যই স্থানীয় DAE/SAAO কর্মকর্তার পরামর্শ নিন।';
      }

      // Save to Turso
      if (hasTurso()) {
        saveDiagnosis({
          session_id: `diag_${Date.now()}`,
          crop, disease_name: finalStructured.disease_name,
          disease_name_bn: finalStructured.disease_name_bn,
          confidence: finalStructured.confidence, confidence_pct: finalStructured.confidence_pct,
          severity: finalStructured.severity, biotic_abiotic: finalStructured.biotic_abiotic,
          cause_type: finalStructured.cause_type, etl_exceeded: finalStructured.etl_exceeded,
          provider: aiProvider, symptoms: plainText.slice(0, 500),
          infected_part: infectedPart, district, image_attached: imageAttached,
          elapsed_ms: elapsed,
        }).catch(() => {});
      }

      return NextResponse.json({
        ok: true,
        offline: false,
        confidence_pct: finalStructured.confidence_pct || offlineConfidence,
        provider: aiProvider,
        structured: finalStructured,
        text: stripStructuredJson(aiResult.text),
        offline_backup: structured,
        elapsed_ms: elapsed,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5: AI also failed — return offline result with "low confidence" tag
    //         ALWAYS return ok:true so frontend never shows "network error"
    // ═══════════════════════════════════════════════════════════════════════
    if (hasTurso()) {
      saveDiagnosis({
        session_id: `diag_${Date.now()}`,
        crop, disease_name: structured.disease_name,
        disease_name_bn: structured.disease_name_bn,
        confidence: 'low', confidence_pct: offlineConfidence,
        severity: structured.severity, biotic_abiotic: structured.biotic_abiotic,
        cause_type: structured.cause_type, etl_exceeded: structured.etl_exceeded,
        provider: 'Offline Fallback', symptoms: plainText.slice(0, 500),
        infected_part: infectedPart, district, image_attached: imageAttached,
        elapsed_ms: elapsed,
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      offline: true,
      confidence_pct: offlineConfidence,
      provider: "CABI Offline Engine (AI unavailable)",
      structured,
      needs_ai_review: true,
      ai_error: aiError || undefined,
      elapsed_ms: elapsed,
    });

  } catch (error: any) {
    // Even on unexpected errors, return a structured response so the
    // frontend never shows a generic "network error" message.
    return NextResponse.json({
      ok: false,
      error: error.message || "Diagnosis failed",
      hint: "Check that GEMINI_API_KEY or OPENROUTER_API_KEY is set in Vercel environment variables.",
    }, { status: 500 });
  }
}
