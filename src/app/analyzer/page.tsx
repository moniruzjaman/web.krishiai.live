/**
 * CABI Plantwise Diagnosis Page
 *
 * Features:
 * - CABI Plantwise methodology UI
 * - Crop selector for 10 Bangladesh crops
 * - Symptom chips organized by category
 * - Image upload (camera + gallery)
 * - Multi-provider AI waterfall via /api/diagnose
 * - Offline CABI engine fallback
 * - Full structured diagnosis display:
 *   - Exclusion gates visualization
 *   - Disease candidates with confidence
 *   - Disease triangle assessment
 *   - Field confirmation methods
 *   - IPM recommendations
 *   - Prevention & DAE consultation
 * - Bengali-first output
 */

"use client";

import { useState, useRef, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface GateResult {
  a_insects: string;
  a_reason: string;
  b_virus: string;
  b_reason: string;
  c_bacteria: string;
  c_reason: string;
  d_fungi: string;
  d_reason: string;
}

interface TopCandidate {
  rank: number;
  name_bn: string;
  name_en: string;
  scientific_name: string;
  confidence_pct: number;
  key_feature: string;
}

interface DiseaseTriangleJson {
  host_score: number;
  pathogen_score: number;
  environment_score: number;
  host_note: string;
  pathogen_note: string;
  environment_note: string;
}

interface IPMRec {
  priority: number;
  type: string;
  action_bn: string;
  timing: string;
}

interface ChemicalOption {
  name_bn: string;
  trade_name: string;
  frac_irac_group: string;
  dose: string;
  phi_days: number;
}

interface DiagnosisJson {
  disease_name: string;
  disease_name_bn: string;
  confidence: string;
  confidence_pct: number;
  severity: string;
  urgency: string;
  biotic_abiotic: string;
  cause_type: string;
  etl_exceeded: boolean;
  action_required: boolean;
  gate_results: GateResult;
  top_candidates: TopCandidate[];
  disease_triangle: DiseaseTriangleJson;
  field_confirmation: { test_bn: string; steps_bn: string[] };
  ipm_recommendations: IPMRec[];
  chemical_options: ChemicalOption[];
  prevention_bn: string;
  dae_consult_bn: string;
  key_recommendations: string[];
}

// ── Data ─────────────────────────────────────────────────────────────────────
const CROPS = [
  { key: "ধান", icon: "🌾", label: "ধান" },
  { key: "পাট", icon: "🌿", label: "পাট" },
  { key: "আলু", icon: "🥔", label: "আলু" },
  { key: "টমেটো", icon: "🍅", label: "টমেটো" },
  { key: "বেগুন", icon: "🍆", label: "বেগুন" },
  { key: "সরিষা", icon: "🌼", label: "সরিষা" },
  { key: "কলা", icon: "🍌", label: "কলা" },
  { key: "আম", icon: "🥭", label: "আম" },
  { key: "গম", icon: "🌾", label: "গম" },
  { key: "ভুট্টা", icon: "🌽", label: "ভুট্টা" },
];

const SYMPTOM_CATEGORIES = [
  {
    label: "পাতার লক্ষণ",
    icon: "🍃",
    chips: [
      "পাতা হলুদ", "বাদামি দাগ", "ধূসর দাগ (ব্লাস্ট)", "পাতা কুঁকড়ানো",
      "পাতা মোড়ানো", "পাতায় জাল", "সাদা গুঁড়া", "পাতায় তেলতেলে",
    ],
  },
  {
    label: "কান্ডের লক্ষণ",
    icon: "🌿",
    chips: ["কান্ড পচা", "কান্ড ফাঁপা", "শিকড় পচা", "কাণ্ড ভেঙে"],
  },
  {
    label: "ফল/শীষের লক্ষণ",
    icon: "🍎",
    chips: ["ফুল ঝরা", "ফল পচা", "শীষ চিটা", "শীষ সাদা", "ফলে দাগ"],
  },
  {
    label: "গাছের লক্ষণ",
    icon: "🥀",
    chips: ["গাছ নেতিয়ে", "গাছ মরছে", "গাছ বামন"],
  },
  {
    label: "পোকার লক্ষণ",
    icon: "🐛",
    chips: ["পোকা দেখা", "পিঁপড়া/মধুরস", "ছিদ্র/চিবানো"],
  },
  {
    label: "পরিবেশ",
    icon: "🌧️",
    chips: ["বন্যার ক্ষতি", "খরা", "ঠান্ডা"],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const bn = (n: number | string) =>
  String(Math.round(Number(n))).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const gateStatusColor = (status: string) => {
  if (status === "excluded") return "bg-green-100 text-green-700 border-green-300";
  if (status === "retained" || status === "confirmed") return "bg-red-100 text-red-700 border-red-300";
  return "bg-amber-100 text-amber-700 border-amber-300";
};

const gateStatusIcon = (status: string) => {
  if (status === "excluded") return "✅";
  if (status === "retained" || status === "confirmed") return "🔴";
  return "⚠️";
};

const gateLabelBn: Record<string, string> = {
  a_insects: "কীটপতঙ্গ/মাইট",
  b_virus: "ভাইরাস",
  c_bacteria: "ব্যাকটেরিয়া",
  d_fungi: "ছত্রাক/ওমাইসিট",
};

const causeTypeBn: Record<string, string> = {
  fungal: "ছত্রাকজনিত",
  bacterial: "ব্যাকটেরিয়াজনিত",
  viral: "ভাইরাসজনিত",
  insect: "পোকামাকড়",
  nematode: "নিমাটোড",
  deficiency: "পুষ্টি ঘাটতি",
  abiotic: "অজীবাণু (পরিবেশগত)",
};

const urgencyBn: Record<string, { label: string; color: string }> = {
  immediate: { label: "তাৎক্ষণিক", color: "bg-red-100 text-red-800 border-red-300" },
  within_3_days: { label: "৩ দিনের মধ্যে", color: "bg-amber-100 text-amber-800 border-amber-300" },
  within_week: { label: "সপ্তাহের মধ্যে", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  monitor: { label: "পর্যবেক্ষণ করুন", color: "bg-green-100 text-green-800 border-green-300" },
};

const ipmTypeIcon: Record<string, string> = {
  cultural: "🌱",
  biological: "🦠",
  chemical: "💊",
  monitoring: "👁️",
};

const ipmTypeBn: Record<string, string> = {
  cultural: "কৃষি ব্যবস্থাপনা",
  biological: "জৈবিক নিয়ন্ত্রণ",
  chemical: "রাসায়নিক (শেষ উপায়)",
  monitoring: "পর্যবেক্ষণ",
};

// ── Component ────────────────────────────────────────────────────────────────
export default function CABIDiagnosisPage() {
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    provider: string;
    bangla: string;
    english: string;
    json: DiagnosisJson | null;
    elapsed_ms: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("ছবি অত্যন্ত বড়। সর্বোচ্চ ১০ মেগাবাইটের ছবি আপলোড করুন।");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("শুধুমাত্র ছবি ফাইল আপলোড করুন।");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const runDiagnosis = useCallback(async () => {
    if (!selectedCrop && !selectedImage && selectedSymptoms.length === 0) {
      setError("অনুগ্রহ করে ফসল নির্বাচন করুন বা লক্ষণ নির্বাচন করুন।");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          symptoms: selectedSymptoms,
          crop: selectedCrop,
          description,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setResult({
          provider: data.provider || "unknown",
          bangla: data.bangla || "",
          english: data.english || "",
          json: data.json || null,
          elapsed_ms: data.elapsed_ms || 0,
        });
      } else {
        setError(data.error || "রোগ নির্ণয় ব্যর্থ হয়েছে");
      }
    } catch {
      setError("নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।");
    }

    setAnalyzing(false);
  }, [selectedCrop, selectedSymptoms, selectedImage, description]);

  const handleRetry = () => {
    setError(null);
    runDiagnosis();
  };

  const handleClear = () => {
    setSelectedCrop("");
    setSelectedSymptoms([]);
    setSelectedImage(null);
    setDescription("");
    setResult(null);
    setError(null);
  };

  const diagnosisJson = result?.json;

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div
        className="relative px-4 pt-5 pb-7"
        style={{
          background: "linear-gradient(135deg,#1b4332,#2d6a4f)",
        }}
      >
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white dark:bg-gray-900 rounded-t-[20px]" />
        <div className="flex items-center gap-2 mb-2">
          <div className="text-[11px] text-white/50 tracking-widest font-bold">
            CABI PLANTWISE
          </div>
          <span className="text-[8px] font-bold bg-white/15 text-white/80 px-2 py-0.5 rounded-full">
            পেশাদার পদ্ধতি
          </span>
        </div>
        <h1 className="text-[22px] font-bold text-white mb-1">
          CABI উদ্ভিদ রোগ নির্ণয়
        </h1>
        <p className="text-xs text-white/70">
          CABI Plantwise পদ্ধতিতে পেশাদার রোগ নির্ণয় — বর্জন বিশ্লেষণ, রোগ ত্রিভুজ, IPM পরামর্শ
        </p>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* ── Crop Selector ──────────────────────────────────────────────── */}
        <div className="mb-5">
          <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-2">
            🌱 ফসল নির্বাচন করুন
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {CROPS.map(c => (
              <button
                key={c.key}
                onClick={() => setSelectedCrop(c.key === selectedCrop ? "" : c.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border-2 transition-all cursor-pointer whitespace-nowrap ${
                  selectedCrop === c.key
                    ? "bg-green-600 text-white border-green-600 shadow-md"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-400"
                }`}
              >
                <span className="text-base">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Symptom Chips ──────────────────────────────────────────────── */}
        <div className="mb-5">
          <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-2">
            🔍 লক্ষণ নির্বাচন করুন
          </div>
          <div className="space-y-3">
            {SYMPTOM_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                  {cat.icon} {cat.label}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {cat.chips.map(chip => (
                    <button
                      key={chip}
                      onClick={() => toggleSymptom(chip)}
                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        selectedSymptoms.includes(chip)
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-400"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Image Upload ───────────────────────────────────────────────── */}
        <div className="mb-5">
          <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-2">
            📷 ছবি আপলোড (ঐচ্ছিক)
          </div>
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: selectedImage ? "transparent" : "linear-gradient(135deg,#f0fdf4,#ecfdf5)",
              border: selectedImage ? "2px solid #1b8a3e" : "2px dashed #1b8a3e",
            }}
          >
            {selectedImage ? (
              <div className="relative">
                <img src={selectedImage} alt="Selected crop" className="w-full h-48 object-cover" />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-6">
                <div className="w-14 h-14 rounded-full bg-[#1b8a3e]/10 flex items-center justify-center mb-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1b8a3e" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 text-center">
                  আক্রান্ত অংশের ছবি আপলোড করুন
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-2.5">
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={analyzing}
              className="flex-1 bg-[#1b8a3e] text-white font-bold text-[12px] rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-[#167035] transition-colors active:scale-95 disabled:opacity-50"
            >
              📷 ছবি নিন
            </button>
            <button
              onClick={() => galleryInputRef.current?.click()}
              disabled={analyzing}
              className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-[12px] rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95 disabled:opacity-50"
            >
              📁 গ্যালারি
            </button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>
        </div>

        {/* ── Description ────────────────────────────────────────────────── */}
        <div className="mb-5">
          <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-2">
            ✏️ অতিরিক্ত বর্ণনা (ঐচ্ছিক)
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="রোগের বিস্তারিত বর্ণনা দিন... যেমন: গত ৩ দিন ধরে পাতায় দাগ দেখা যাচ্ছে..."
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/30 resize-none h-20"
          />
        </div>

        {/* ── Diagnosis Button ────────────────────────────────────────────── */}
        <button
          onClick={runDiagnosis}
          disabled={analyzing || (!selectedCrop && !selectedImage && selectedSymptoms.length === 0)}
          className="w-full bg-gradient-to-r from-[#1b8a3e] to-[#2d6a4f] text-white font-bold text-[14px] rounded-xl py-3.5 flex items-center justify-center gap-2 hover:from-[#167035] hover:to-[#245a40] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20 mb-6"
        >
          {analyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              CABI বিশ্লেষণ চলছে...
            </>
          ) : (
            <>
              🔬 CABI পদ্ধতিতে নির্ণয় করুন
            </>
          )}
        </button>

        {/* ── Loading State ───────────────────────────────────────────────── */}
        {analyzing && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-5 text-center">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
            <div className="text-[13px] font-bold text-green-800 dark:text-green-300 mb-1">
              CABI Plantwise পদ্ধতিতে বিশ্লেষণ চলছে
            </div>
            <div className="text-[11px] text-green-600 dark:text-green-400">
              বর্জন গেট → রোগ ত্রিভুজ → IPM পরামর্শ
            </div>
          </div>
        )}

        {/* ── Error State ─────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">❌</span>
              <span className="text-sm font-bold text-red-700">নির্ণয় ব্যর্থ</span>
            </div>
            <p className="text-[12px] text-red-600 mb-3">{error}</p>
            <div className="flex gap-2">
              <button onClick={handleRetry} className="bg-red-500 text-white text-[11px] font-bold rounded-full px-4 py-1.5 cursor-pointer hover:bg-red-600">
                আবার চেষ্টা করুন
              </button>
              <button onClick={handleClear} className="bg-white border border-red-200 text-red-600 text-[11px] font-bold rounded-full px-4 py-1.5 cursor-pointer hover:bg-red-50">
                নতুন শুরু
              </button>
            </div>
          </div>
        )}

        {/* ── Diagnosis Results ────────────────────────────────────────────── */}
        {result && !analyzing && !error && (
          <div className="space-y-4 mb-5 animate-in">
            {/* Provider Badge */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">নির্ণয় প্রদানকারী:</span>
                <span className="text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                  {result.provider}
                </span>
              </div>
              <span className="text-[10px] text-gray-400">{bn(result.elapsed_ms)} মিসে</span>
            </div>

            {/* ── 1. Exclusion Gates ──────────────────────────────────────── */}
            {diagnosisJson?.gate_results && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-1">
                  ১. CABI বর্জন পদ্ধতি অনুযায়ী বিশ্লেষণ
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                  অ্যাবায়োটিক/বায়োটিক: <span className="font-bold">{diagnosisJson.biotic_abiotic === "biotic" ? "বায়োটিক (জীবাণু)" : diagnosisJson.biotic_abiotic === "abiotic" ? "অ্যাবায়োটিক (পরিবেশগত)" : "অনিশ্চিত"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["a_insects", "b_virus", "c_bacteria", "d_fungi"] as const).map(gate => {
                    const status = diagnosisJson.gate_results[gate];
                    return (
                      <div key={gate} className={`rounded-lg border p-2.5 ${gateStatusColor(status)}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{gateStatusIcon(status)}</span>
                          <span className="text-[11px] font-bold">{gateLabelBn[gate]}</span>
                        </div>
                        <div className="text-[10px] font-semibold">
                          {status === "excluded" ? "বাদ দেওয়া হয়েছে" : status === "confirmed" ? "নিশ্চিত" : status === "retained" ? "সন্দেহভাজন" : "অনিশ্চিত"}
                        </div>
                        <div className="text-[9px] mt-0.5 opacity-80 line-clamp-2">
                          {diagnosisJson.gate_results[`${gate}_reason` as keyof GateResult] || ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 2. Disease Candidates ───────────────────────────────────── */}
            {diagnosisJson?.top_candidates && diagnosisJson.top_candidates.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                  ২. সম্ভাব্য রোগ
                </div>
                {diagnosisJson.top_candidates.map((candidate, i) => (
                  <div key={i} className={`mb-3 ${i > 0 ? "pt-3 border-t border-gray-100 dark:border-gray-700" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${i === 0 ? "bg-amber-600" : "bg-gray-400"}`}>
                        {candidate.rank}
                      </span>
                      <div className="flex-1">
                        <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{candidate.name_bn}</div>
                        <div className="text-[10px] text-gray-500">{candidate.name_en} ({candidate.scientific_name})</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[16px] font-extrabold text-[#1b4332] dark:text-green-400">{bn(candidate.confidence_pct)}%</div>
                        <div className="text-[9px] text-gray-400">আত্মবিশ্বাস</div>
                      </div>
                    </div>
                    {/* Confidence bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full transition-all ${i === 0 ? "bg-amber-500" : "bg-gray-400"}`}
                        style={{ width: `${Math.min(candidate.confidence_pct, 100)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">🔑 {candidate.key_feature}</div>
                  </div>
                ))}

                {/* Cause type & urgency */}
                <div className="flex gap-2 mt-3">
                  {diagnosisJson.cause_type && (
                    <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full">
                      {causeTypeBn[diagnosisJson.cause_type] || diagnosisJson.cause_type}
                    </span>
                  )}
                  {diagnosisJson.urgency && urgencyBn[diagnosisJson.urgency] && (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${urgencyBn[diagnosisJson.urgency].color}`}>
                      ⏰ {urgencyBn[diagnosisJson.urgency].label}
                    </span>
                  )}
                  {diagnosisJson.action_required && (
                    <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-full">
                      ⚡ ব্যবস্থা প্রয়োজন
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ── 3. Disease Triangle ─────────────────────────────────────── */}
            {diagnosisJson?.disease_triangle && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                  ৩. রোগ ত্রিভুজ মূল্যায়ন
                </div>
                {[
                  { label: "পোষক (Host)", score: diagnosisJson.disease_triangle.host_score, note: diagnosisJson.disease_triangle.host_note, color: "bg-blue-500" },
                  { label: "জীবাণু (Pathogen)", score: diagnosisJson.disease_triangle.pathogen_score, note: diagnosisJson.disease_triangle.pathogen_note, color: "bg-red-500" },
                  { label: "পরিবেশ (Environment)", score: diagnosisJson.disease_triangle.environment_score, note: diagnosisJson.disease_triangle.environment_note, color: "bg-amber-500" },
                ].map(item => (
                  <div key={item.label} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                      <span className="text-[12px] font-extrabold text-gray-900 dark:text-gray-100">{bn(item.score)}/১০</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${item.color}`}
                        style={{ width: `${item.score * 10}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{item.note}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── 4. Field Confirmation ───────────────────────────────────── */}
            {diagnosisJson?.field_confirmation && (
              <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-4">
                <div className="text-[13px] font-bold text-sky-900 dark:text-sky-300 mb-1">
                  ৪. মাঠে নিশ্চিতকরণ
                </div>
                <div className="text-[11px] font-bold text-sky-800 dark:text-sky-400 mb-2">
                  {diagnosisJson.field_confirmation.test_bn}
                </div>
                {diagnosisJson.field_confirmation.steps_bn?.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5">
                    <span className="w-5 h-5 bg-sky-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── 5. Severity & Economic Threshold ────────────────────────── */}
            {diagnosisJson && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <div className="text-[13px] font-bold text-amber-900 dark:text-amber-300 mb-2">
                  ৫. তীব্রতা ও অর্থনৈতিক গুরুত্ব
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2.5">
                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400">তীব্রতা</div>
                    <div className="text-[14px] font-bold text-amber-800 dark:text-amber-300">
                      {diagnosisJson.severity === "severe" ? "গুরুতর" : diagnosisJson.severity === "moderate" ? "মাঝারি" : "হালকা"}
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2.5">
                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400">অর্থনৈতিক থ্রেশহোল্ড</div>
                    <div className="text-[14px] font-bold text-amber-800 dark:text-amber-300">
                      {diagnosisJson.etl_exceeded ? "অতিক্রম করেছে ⚡" : "অতিক্রম করেনি ✓"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── 6. IPM Recommendations ──────────────────────────────────── */}
            {diagnosisJson?.ipm_recommendations && diagnosisJson.ipm_recommendations.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
                <div className="text-[13px] font-bold text-green-900 dark:text-green-300 mb-3">
                  ৬. সমন্বিত বালাই ব্যবস্থাপনা (IPM)
                </div>
                {diagnosisJson.ipm_recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2.5 last:mb-0">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {rec.priority}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{ipmTypeIcon[rec.type] || "📌"}</span>
                        <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-800/50 px-1.5 py-0.5 rounded">
                          {ipmTypeBn[rec.type] || rec.type}
                        </span>
                        <span className="text-[9px] text-gray-500">⏰ {rec.timing}</span>
                      </div>
                      <div className="text-[11px] text-green-800 dark:text-green-300 leading-relaxed">{rec.action_bn}</div>
                    </div>
                  </div>
                ))}

                {/* Chemical options detail */}
                {diagnosisJson.chemical_options && diagnosisJson.chemical_options.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                    <div className="text-[11px] font-bold text-green-900 dark:text-green-300 mb-2">
                      💊 রাসায়নিক বিকল্প:
                    </div>
                    <div className="space-y-2">
                      {diagnosisJson.chemical_options.map((chem, i) => (
                        <div key={i} className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{chem.name_bn}</span>
                            <span className="text-[9px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                              {chem.frac_irac_group}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-600 dark:text-gray-400">
                            ব্র্যান্ড: {chem.trade_name} • মাত্রা: {chem.dose} • ফলন পূর্ববর্তী সময়: {bn(chem.phi_days)} দিন
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 7. Prevention ───────────────────────────────────────────── */}
            {diagnosisJson?.prevention_bn && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                <div className="text-[13px] font-bold text-blue-900 dark:text-blue-300 mb-2">
                  ৭. প্রতিরোধ — পরবর্তী মৌসুম
                </div>
                <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                  {diagnosisJson.prevention_bn}
                </p>
              </div>
            )}

            {/* ── 8. When to Consult DAE ──────────────────────────────────── */}
            {diagnosisJson?.dae_consult_bn && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4">
                <div className="text-[13px] font-bold text-amber-900 dark:text-amber-300 mb-2">
                  ৮. কখন DAE কর্মকর্তার পরামর্শ নেবেন
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  {diagnosisJson.dae_consult_bn}
                </p>
              </div>
            )}

            {/* ── Key Recommendations Summary ──────────────────────────────── */}
            {diagnosisJson?.key_recommendations && diagnosisJson.key_recommendations.length > 0 && (
              <div className="bg-[#1b4332] rounded-2xl p-4">
                <div className="text-[13px] font-bold text-white mb-2">
                  🎯 মূল সুপারিশসমূহ
                </div>
                {diagnosisJson.key_recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-[11px] text-green-100 leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Fallback: Show Bangla text if no structured JSON ─────────── */}
            {!diagnosisJson && result.bangla && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                  CABI বিশ্লেষণ ফলাফল
                </div>
                <div className="text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {result.bangla}
                </div>
              </div>
            )}

            {/* DAE Hotline */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-center">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">আরও সাহায্যের জন্য</div>
              <div className="text-sm font-bold text-[#1b4332] dark:text-green-400">DAE হটলাইন: ১৬১২৩</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">কৃষি সম্প্রসারণ অধিদপ্তর</div>
            </div>

            {/* Clear Button */}
            <button
              onClick={handleClear}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95"
            >
              নতুন নির্ণয় শুরু করুন
            </button>
          </div>
        )}

        {/* ── Tips ────────────────────────────────────────────────────────── */}
        {!result && !analyzing && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
              CABI পদ্ধতি কীভাবে কাজ করে
            </div>
            <div className="space-y-2.5">
              {[
                { step: "১", icon: "🔍", title: "বর্জন বিশ্লেষণ", desc: "কোন কারণগুলো বাদ দেওয়া যায় (পোকা? ভাইরাস? ব্যাকটেরিয়া?)" },
                { step: "২", icon: "🔺", title: "রোগ ত্রিভুজ", desc: "পোষক + জীবাণু + পরিবেশ = রোগের ঝুঁকি" },
                { step: "৩", icon: "🔬", title: "নির্ণয়", desc: "বর্জন ও ত্রিভুজ মূল্যায়ন থেকে সম্ভাব্য রোগ" },
                { step: "৪", icon: "💊", title: "IPM পরামর্শ", desc: "কৃষি → জৈবিক → রাসায়নিক (শেষ উপায়)" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#1b8a3e] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                      {item.icon} {item.title}
                    </div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-400">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
