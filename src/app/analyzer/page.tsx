/**
 * CABI Plantwise Diagnosis Page — Step-based Structured Flow
 *
 * Step 1: Image upload (TOP, most prominent — camera + gallery)
 * Step 2: Crop selection (categorized with search/filter)
 * Step 3: Infected plant part selection
 * Step 4: Symptom chips + Elimination questions (differentiate cause types)
 * Step 5: Disease triangle questions (field context)
 * Step 6: Submit → /api/diagnose
 * Step 7: Display results with feedback
 * Step 8: Disclaimer about DAE/SAAO consultation
 */

"use client";

import React, { useState, useRef, useCallback } from "react";

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
  moa?: string;
  resistance_risk?: string;
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
  disclaimer?: string;
  key_recommendations: string[];
}

// ── Data ─────────────────────────────────────────────────────────────────────
const CROP_CATEGORIES = [
  {
    label: "শস্য",
    icon: "🌾",
    crops: [
      { key: "ধান (বোরো)", icon: "🌾", label: "ধান (বোরো)" },
      { key: "ধান (আমন)", icon: "🌾", label: "ধান (আমন)" },
      { key: "ধান (আউশ)", icon: "🌾", label: "ধান (আউশ)" },
      { key: "গম", icon: "🌾", label: "গম" },
      { key: "ভুট্টা", icon: "🌽", label: "ভুট্টা" },
    ],
  },
  {
    label: "ডাল",
    icon: "🫘",
    crops: [
      { key: "মসুর", icon: "🫘", label: "মসুর ডাল" },
      { key: "মুগ", icon: "🫘", label: "মুগ ডাল" },
      { key: "খেসারি", icon: "🫘", label: "খেসারি" },
      { key: "ছোলা", icon: "🫘", label: "ছোলা" },
    ],
  },
  {
    label: "তেলবীজ",
    icon: "🌻",
    crops: [
      { key: "সরিষা", icon: "🌻", label: "সরিষা" },
      { key: "তিল", icon: "🌻", label: "তিল" },
      { key: "সূর্যমুখী", icon: "🌻", label: "সূর্যমুখী" },
      { key: "চীনাবাদাম", icon: "🥜", label: "চীনাবাদাম" },
    ],
  },
  {
    label: "সবজি",
    icon: "🥬",
    crops: [
      { key: "আলু", icon: "🥔", label: "আলু" },
      { key: "টমেটো", icon: "🍅", label: "টমেটো" },
      { key: "বেগুন", icon: "🍆", label: "বেগুন" },
      { key: "মরিচ", icon: "🌶️", label: "মরিচ" },
      { key: "পেঁয়াজ", icon: "🧅", label: "পেঁয়াজ" },
      { key: "রসুন", icon: "🧄", label: "রসুন" },
      { key: "লাউ", icon: "🫛", label: "লাউ" },
      { key: "মিষ্টি কুমড়া", icon: "🎃", label: "মিষ্টি কুমড়া" },
      { key: "শশা", icon: "🥒", label: "শশা" },
      { key: "বাঁধাকপি", icon: "🥬", label: "বাঁধাকপি" },
      { key: "ফুলকপি", icon: "🥦", label: "ফুলকপি" },
      { key: "আদা", icon: "🫚", label: "আদা" },
      { key: "হলুদ", icon: "🌿", label: "হলুদ" },
      { key: "করলা", icon: "🥒", label: "করলা" },
      { key: "ঝিঙ্গা", icon: "🥒", label: "ঝিঙ্গা" },
      { key: "কাকরল", icon: "🥒", label: "কাকরল" },
      { key: "মুলা", icon: "🥕", label: "মুলা" },
      { key: "গাজর", icon: "🥕", label: "গাজর" },
    ],
  },
  {
    label: "ফল",
    icon: "🥭",
    crops: [
      { key: "আম", icon: "🥭", label: "আম" },
      { key: "কলা", icon: "🍌", label: "কলা" },
      { key: "পেঁপে", icon: "🍈", label: "পেঁপে" },
      { key: "লিচু", icon: "🍇", label: "লিচু" },
      { key: "জাম", icon: "🫐", label: "জাম" },
      { key: "কাঁঠাল", icon: "🍈", label: "কাঁঠাল" },
      { key: "আনারস", icon: "🍍", label: "আনারস" },
      { key: "নারিকেল", icon: "🥥", label: "নারিকেল" },
      { key: "পান", icon: "🍃", label: "পান" },
      { key: "লেবু", icon: "🍋", label: "লেবু" },
      { key: "কমলা", icon: "🍊", label: "কমলা" },
    ],
  },
  {
    label: "অর্থকরী",
    icon: "🪢",
    crops: [
      { key: "পাট", icon: "🪢", label: "পাট" },
      { key: "চা", icon: "🍵", label: "চা" },
      { key: "তুলা", icon: "☁️", label: "তুলা" },
      { key: "আখ", icon: "🎋", label: "আখ" },
      { key: "তামাক", icon: "🚬", label: "তামাক" },
    ],
  },
  {
    label: "মসলা",
    icon: "🌿",
    crops: [
      { key: "ধনিয়া", icon: "🌿", label: "ধনিয়া" },
      { key: "জিরা", icon: "🌿", label: "জিরা" },
      { key: "দারুচিনি", icon: "🪵", label: "দারুচিনি" },
    ],
  },
];

const INFECTED_PARTS = [
  { key: "পাতা", icon: "🍃", label: "পাতা (Leaf)" },
  { key: "কান্ড", icon: "🌿", label: "কান্ড/শাখা (Stem)" },
  { key: "ফল", icon: "🍎", label: "ফল/শীষ (Fruit/Panicle)" },
  { key: "শিকড়", icon: "🌱", label: "শিকড় (Root)" },
  { key: "পুরো গাছ", icon: "🥀", label: "পুরো গাছ (Whole plant)" },
  { key: "ফুল", icon: "🌸", label: "ফুল (Flower)" },
];

const ELIMINATION_QUESTIONS = [
  {
    id: "leaf_margin_discolor",
    question: "পাতার কিনারা কি বিবর্ণ বা পোড়াভাব দেখা যাচ্ছে?",
    subtitle: "মার্জিন ডিসকালারেশন পুষ্টি ঘাটতি বা ছত্রাকের লক্ষণ",
    options: [
      { value: "yes", label: "হ্যাঁ ✅", desc: "কিনারা বিবর্ণ" },
      { value: "no", label: "না ❌", desc: "কিনারা স্বাভাবিক" },
    ],
  },
  {
    id: "water_soak",
    question: "দাগের কিনারা কি পানিভেজা বা তেলতেলে দেখাচ্ছে?",
    subtitle: "Water-soaked margins = ব্যাকটেরিয়ার প্রধান লক্ষণ",
    options: [
      { value: "yes", label: "হ্যাঁ ✅", desc: "পানিভেজা দাগ" },
      { value: "no", label: "না ❌", desc: "শুকনো দাগ" },
    ],
  },
  {
    id: "interveinal_pattern",
    question: "পাতায় কি শিরার মাঝখানে হলুদ/সবুজ প্যাটার্ন দেখা যাচ্ছে?",
    subtitle: "Interveinal chlorosis = পুষ্টি ঘাটতি (Zn, Fe, Mn, Mg)",
    options: [
      { value: "yes", label: "হ্যাঁ ✅", desc: "শিরার মাঝে হলুদ" },
      { value: "no", label: "না ❌", desc: "শিরা অনুসারে নয়" },
    ],
  },
  {
    id: "affected_portion",
    question: "গাছের কোন অংশ বেশি আক্রান্ত?",
    subtitle: "নিচের পাতা = মোবাইল পুষ্টি (N,P,K), উপরের পাতা = ইমোবাইল (Zn,Fe,S)",
    options: [
      { value: "lower", label: "নিচের পাতা", desc: "পুরনো পাতা আগে" },
      { value: "upper", label: "উপরের পাতা", desc: "নতুন পাতা আগে" },
      { value: "both", label: "উভয়ই", desc: "সব পাতা আক্রান্ত" },
    ],
  },
  {
    id: "insect_visible",
    question: "পোকা, ডিম, জাল, মধুরস বা ছিদ্র দেখা যাচ্ছে কি?",
    subtitle: "পাতার নিচে ভালো করে দেখুন — কীটপতঙ্গ নিশ্চিত করে",
    options: [
      { value: "yes", label: "হ্যাঁ ✅", desc: "পোকা/লক্ষণ দেখা যাচ্ছে" },
      { value: "no", label: "না ❌", desc: "কোনো পোকা নেই" },
    ],
  },
  {
    id: "mosaic_pattern",
    question: "পাতায় কি মোজাইক (সবুজ-হলুদ মিশ্রিত) বা রিং স্পট দেখা যাচ্ছে?",
    subtitle: "মোজাইক = ভাইরাস; শিরার মাঝের হলুদ ≠ ভাইরাস",
    options: [
      { value: "yes", label: "হ্যাঁ ✅", desc: "মোজাইক/রিং স্পট" },
      { value: "no", label: "না ❌", desc: "মোজাইক নেই" },
    ],
  },
  {
    id: "powdery_growth",
    question: "পাতায় কি সাদা গুঁড়া, তুলোটুকু বা ছাই রঙের আবরণ দেখা যাচ্ছে?",
    subtitle: "ছত্রাকের নিশ্চিত লক্ষণ — পাউডারি মিলডিউ/রাস্ট/ব্লাস্ট",
    options: [
      { value: "yes", label: "হ্যাঁ ✅", desc: "গুঁড়া/আবরণ আছে" },
      { value: "no", label: "না ❌", desc: "গুঁড়া আবরণ নেই" },
    ],
  },
  {
    id: "symmetry",
    question: "উপসর্গ কি পাতার দুই পাশে সমানভাবে দেখা যাচ্ছে?",
    subtitle: "সমান = পুষ্টি ঘাটতি; অসমান = রোগজীবাণু",
    options: [
      { value: "symmetric", label: "সমান", desc: "দুই পাশে একই" },
      { value: "asymmetric", label: "অসমান", desc: "একপাশে বেশি" },
      { value: "unsure", label: "নিশ্চিত নই", desc: "বুঝতে পারছি না" },
    ],
  },
];

const TRIANGLE_QUESTIONS = [
  {
    id: "weed_around",
    question: "জমির চারপাশে কি আগাছা বা বিকল্প পোষক গাছ আছে?",
    subtitle: "আগাছা = পোকা ও রোগের আশ্রয়স্থল",
  },
  {
    id: "urea_recent",
    question: "গত ৭-১০ দিনে কি ইউরিয়া বা নাইট্রোজেন সার দিয়েছেন?",
    subtitle: "বেশি নাইট্রোজেন = ব্লাস্ট/BPH ঝুঁকি বাড়ে",
  },
  {
    id: "waterlogged",
    question: "জমি কি কয়েক দিন পানিতে ডুবে ছিল?",
    subtitle: "পানিবন্দি = ছত্রাক ও ব্যাকটেরিয়ার ঝুঁকি",
  },
  {
    id: "disease_history",
    question: "আগে কি এই জমিতে একই রোগ হয়েছিল?",
    subtitle: "ইনোকুলাম চাপ = রোগ ত্রিভুজের জীবাণু উপাদান",
  },
  {
    id: "high_humidity",
    question: "আবহাওয়া কি বেশি আর্দ্র বা বৃষ্টির?",
    subtitle: "আর্দ্রতা >৮০% = ছত্রাক ও ব্যাকটেরিয়ার উপযুক্ত",
  },
  {
    id: "recent_spray",
    question: "গত ৭ দিনে কি কীটনাশক/ফাঙ্গিসাইড স্প্রে করেছেন?",
    subtitle: "সাম্প্রতিক স্প্রে = রাসায়নিক নিয়ন্ত্রণ ইতিমধ্যে চেষ্টা করা হয়েছে",
  },
];

const SYMPTOM_CATEGORIES = [
  {
    label: "পাতার লক্ষণ",
    icon: "🍃",
    chips: [
      "পাতা হলুদ",
      "বাদামি দাগ",
      "ধূসর দাগ (ব্লাস্ট)",
      "পাতা কুঁকড়ানো",
      "পাতা মোড়ানো",
      "পাতায় জাল",
      "সাদা গুঁড়া",
      "পাতায় তেলতেলে",
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
  abiotic: "অজীবাণু",
};

const urgencyBn: Record<string, { label: string; color: string }> = {
  immediate: {
    label: "তাৎক্ষণিক",
    color: "bg-red-100 text-red-800 border-red-300",
  },
  within_3_days: {
    label: "৩ দিনের মধ্যে",
    color: "bg-amber-100 text-amber-800 border-amber-300",
  },
  within_week: {
    label: "সপ্তাহের মধ্যে",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  monitor: {
    label: "পর্যবেক্ষণ করুন",
    color: "bg-green-100 text-green-800 border-green-300",
  },
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

const gateStatusColor = (status: string) => {
  if (status === "excluded")
    return "bg-green-100 text-green-700 border-green-300";
  if (status === "retained" || status === "confirmed")
    return "bg-red-100 text-red-700 border-red-300";
  return "bg-amber-100 text-amber-700 border-amber-300";
};

const gateStatusIcon = (status: string) => {
  if (status === "excluded") return "✅";
  if (status === "retained" || status === "confirmed") return "🔴";
  return "⚠️";
};

const resistanceRiskColor = (risk?: string) => {
  if (!risk) return "";
  const low = risk.toLowerCase().includes("low");
  const high = risk.toLowerCase().includes("high");
  if (high) return "text-red-600 dark:text-red-400";
  if (low) return "text-green-600 dark:text-green-400";
  return "text-amber-600 dark:text-amber-400";
};

// Step labels in Bengali
const STEP_LABELS = [
  "📷 ছবি",
  "🌱 ফসল",
  "🩹 আক্রান্ত অংশ",
  "🔍 লক্ষণ ও বর্জন",
  "🔺 রোগ ত্রিভুজ",
];

// ── Component ────────────────────────────────────────────────────────────────
export default function CABIDiagnosisPage() {
  // ── Step state ──
  const [currentStep, setCurrentStep] = useState(1);

  // ── Form data ──
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [eliminationAnswers, setEliminationAnswers] = useState<
    Record<string, string>
  >({});
  const [triangleAnswers, setTriangleAnswers] = useState<
    Record<string, string>
  >({});
  const [description, setDescription] = useState("");

  // ── Crop search ──
  const [cropSearch, setCropSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("সব");

  // ── Diagnosis state ──
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    provider: string;
    bangla: string;
    english: string;
    json: DiagnosisJson | null;
    elapsed_ms: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => `diag_${Date.now()}`);

  // ── Feedback state ──
  const [feedbackGiven, setFeedbackGiven] = useState<
    "yes" | "no" | null
  >(null);
  const [correctDiagnosis, setCorrectDiagnosis] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // ── Handlers ──
  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
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

  const setEliminationAnswer = (id: string, value: string) => {
    setEliminationAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const setTriangleAnswer = (id: string, value: string) => {
    setTriangleAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // ── Can proceed checks ──
  const _canProceedStep1 = true; // Image is optional
  const canProceedStep2 = selectedCrop !== "";
  const canProceedStep3 = selectedPart !== "";
  const _canProceedStep4 =
    selectedSymptoms.length > 0 ||
    Object.keys(eliminationAnswers).length > 0;
  const _canProceedStep5 = true; // Triangle questions are optional

  const canSubmit =
    selectedCrop !== "" &&
    (selectedSymptoms.length > 0 || selectedImage !== null);

  // ── Step navigation ──
  const goNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };
  const goPrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // ── Filter crops ──
  const filteredCategories =
    activeCategory === "সব"
      ? CROP_CATEGORIES
      : CROP_CATEGORIES.filter((c) => c.label === activeCategory);

  const filteredCropsInCategory = (crops: typeof CROP_CATEGORIES[0]["crops"]) => {
    if (!cropSearch) return crops;
    return crops.filter(
      (c) =>
        c.label.includes(cropSearch) || c.key.includes(cropSearch)
    );
  };

  // ── Diagnosis ──
  const runDiagnosis = useCallback(async () => {
    if (!canSubmit) {
      setError("অনুগ্রহ করে ফসল নির্বাচন করুন এবং লক্ষণ/ছবি দিন।");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);
    setFeedbackGiven(null);
    setCorrectDiagnosis("");

    try {
      // Set up timeout for the fetch call (10s max)
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 12_000);

      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          symptoms: selectedSymptoms,
          crop: selectedCrop,
          description,
          infectedPart: selectedPart,
          eliminationAnswers,
          triangleAnswers,
        }),
        signal: controller.signal,
      });

      clearTimeout(fetchTimeout);

      const data = await res.json();

      if (data.ok) {
        let bangla = "";
        let english = "";
        const fullText = data.text || "";

        const banglaStart = fullText.indexOf("---BANGLA_SECTION---");
        const banglaEnd = fullText.indexOf("---END_BANGLA---");
        const englishStart = fullText.indexOf("---ENGLISH_SECTION---");
        const englishEnd = fullText.indexOf("---END_ENGLISH---");

        if (banglaStart !== -1 && banglaEnd !== -1) {
          bangla = fullText
            .slice(
              banglaStart + "---BANGLA_SECTION---".length,
              banglaEnd
            )
            .trim();
        }
        if (englishStart !== -1 && englishEnd !== -1) {
          english = fullText
            .slice(
              englishStart + "---ENGLISH_SECTION---".length,
              englishEnd
            )
            .trim();
        }

        if (!bangla && !english) {
          bangla = fullText;
        }

        setResult({
          provider: data.provider || "unknown",
          bangla,
          english,
          json: data.structured || null,
          elapsed_ms: data.elapsed_ms || 0,
        });
      } else {
        // Show the actual error from the API with a helpful message
        const apiError = data.error || "রোগ নির্ণয় ব্যর্থ হয়েছে";
        const hint = data.hint ? `\n💡 ${data.hint}` : "";
        setError(`${apiError}${hint}`);
      }
    } catch (fetchErr: any) {
      // Distinguish between abort/timeout and actual network errors
      if (fetchErr?.name === "AbortError") {
        setError("অনুরোধ সময়মতো সম্পন্ন হয়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।");
      } else {
        setError("নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।");
      }
    }

    setAnalyzing(false);
  }, [
    selectedCrop,
    selectedSymptoms,
    selectedImage,
    selectedPart,
    description,
    eliminationAnswers,
    triangleAnswers,
    canSubmit,
  ]);

  // ── Feedback ──
  const submitFeedback = async (approved: boolean) => {
    setFeedbackSubmitting(true);
    const payload = {
      session_id: sessionId,
      crop: selectedCrop,
      disease_name: result?.json?.disease_name || "",
      approved,
      user_comment: approved ? "" : "ভুল নির্ণয়",
      correct_diagnosis: approved ? "" : correctDiagnosis,
    };

    try {
      const res = await fetch("/api/diagnose/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.warn("Feedback submission (fallback):", payload);
      }
    } catch {
      console.warn("Feedback submission (fallback):", payload);
    }
    setFeedbackGiven(approved ? "yes" : "no");
    setFeedbackSubmitting(false);
  };

  const handleClear = () => {
    setCurrentStep(1);
    setSelectedCrop("");
    setSelectedPart("");
    setSelectedSymptoms([]);
    setEliminationAnswers({});
    setTriangleAnswers({});
    setSelectedImage(null);
    setDescription("");
    setResult(null);
    setError(null);
    setFeedbackGiven(null);
    setCorrectDiagnosis("");
  };

  const diagnosisJson = result?.json;

  // ── All category labels for tabs ──
  const allCategoryLabels = ["সব", ...CROP_CATEGORIES.map((c) => c.label)];

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* ── Header ────────────────────────────────────────────────────── */}
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
            ধাপভিত্তিক পদ্ধতি
          </span>
        </div>
        <h1 className="text-[22px] font-bold text-white mb-1">
          CABI উদ্ভিদ রোগ নির্ণয়
        </h1>
        <p className="text-xs text-white/70">
          ধাপে ধাপে তথ্য দিন → সঠিক নির্ণয় পান — বর্জন বিশ্লেষণ, রোগ ত্রিভুজ, IPM পরামর্শ
        </p>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* ── Progress Indicator ──────────────────────────────────────── */}
        {!result && !analyzing && (
          <div className="mb-5">
            <div className="flex items-center gap-1 mb-2">
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full h-1.5 rounded-full transition-all ${
                      i + 1 <= currentStep
                        ? "bg-[#1b8a3e]"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                  <span
                    className={`text-[8px] mt-1 font-bold whitespace-nowrap ${
                      i + 1 === currentStep
                        ? "text-[#1b8a3e] dark:text-green-400"
                        : i + 1 < currentStep
                        ? "text-green-600 dark:text-green-500"
                        : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className="text-[11px] font-bold text-[#1b8a3e] dark:text-green-400">
                ধাপ {bn(currentStep)} / ৫
              </span>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 1: IMAGE UPLOAD (Most Prominent)
        ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && !result && !analyzing && (
          <div className="space-y-4">
            <div className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-1">
              📷 ধাপ ১: আক্রান্ত গাছের ছবি দিন
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
              স্পষ্ট ছবি দিলে নির্ণয় আরও সঠিক হবে। আক্রান্ত অংশের কাছ থেকে ছবি নিন।
            </p>

            {/* Image area */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: selectedImage
                  ? "transparent"
                  : "linear-gradient(135deg,#f0fdf4,#ecfdf5)",
                border: selectedImage
                  ? "3px solid #1b8a3e"
                  : "3px dashed #1b8a3e",
              }}
            >
              {selectedImage ? (
                <div className="relative">
                  <img
                    src={selectedImage}
                    alt="Selected crop"
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <span className="text-[11px] text-white font-bold">
                      ✅ ছবি যুক্ত হয়েছে
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-black/80 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-20 h-20 rounded-full bg-[#1b8a3e]/10 flex items-center justify-center mb-4">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1b8a3e"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <p className="text-[13px] font-bold text-gray-600 dark:text-gray-400 text-center mb-1">
                    আক্রান্ত অংশের ছবি আপলোড করুন
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                    ক্যামেরা বা গ্যালারি থেকে নির্বাচন করুন
                  </p>
                </div>
              )}
            </div>

            {/* Camera / Gallery buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 bg-[#1b8a3e] text-white font-bold text-[13px] rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-[#167035] transition-colors active:scale-95 shadow-md shadow-green-600/20"
              >
                📷 ছবি নিন
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-[13px] rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95"
              >
                📁 গ্যালারি
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <p className="text-[10px] text-gray-400 text-center">
              ছবি ঐচ্ছিক, কিন্তু নির্ণয়ের মান বাড়ায়
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 2: CROP SELECTION (Categorized with search)
        ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && !result && !analyzing && (
          <div className="space-y-4">
            <div className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-1">
              🌱 ধাপ ২: ফসল নির্বাচন করুন
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
              আপনার আক্রান্ত ফসল নির্বাচন করুন
            </p>

            {/* Search box */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={cropSearch}
                onChange={(e) => setCropSearch(e.target.value)}
                placeholder="ফসল খুঁজুন..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/30"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {allCategoryLabels.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === cat
                      ? "bg-[#1b8a3e] text-white border-[#1b8a3e]"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-400"
                  }`}
                >
                  {cat === "সব" ? "📋" : CROP_CATEGORIES.find((c) => c.label === cat)?.icon}{" "}
                  {cat}
                </button>
              ))}
            </div>

            {/* Crop grid by category */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCategories.map((category) => {
                const crops = filteredCropsInCategory(category.crops);
                if (crops.length === 0) return null;
                return (
                  <div key={category.label}>
                    <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                      {category.icon} {category.label}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {crops.map((c) => (
                        <button
                          key={c.key}
                          onClick={() =>
                            setSelectedCrop(
                              c.key === selectedCrop ? "" : c.key
                            )
                          }
                          className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[11px] font-bold border-2 transition-all cursor-pointer ${
                            selectedCrop === c.key
                              ? "bg-green-600 text-white border-green-600 shadow-md"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-400"
                          }`}
                        >
                          <span className="text-lg">{c.icon}</span>
                          <span className="leading-tight text-center">
                            {c.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedCrop && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span className="text-[12px] font-bold text-green-800 dark:text-green-300">
                  নির্বাচিত: {selectedCrop}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 3: INFECTED PART SELECTION
        ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && !result && !analyzing && (
          <div className="space-y-4">
            <div className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-1">
              🩹 ধাপ ৩: আক্রান্ত অংশ নির্বাচন করুন
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
              গাছের কোন অংশ সবচেয়ে বেশি ক্ষতিগ্রস্ত?
            </p>

            <div className="grid grid-cols-2 gap-3">
              {INFECTED_PARTS.map((part) => (
                <button
                  key={part.key}
                  onClick={() =>
                    setSelectedPart(
                      part.key === selectedPart ? "" : part.key
                    )
                  }
                  className={`flex flex-col items-center gap-2 px-4 py-4 rounded-2xl text-[12px] font-bold border-2 transition-all cursor-pointer ${
                    selectedPart === part.key
                      ? "bg-[#1b8a3e] text-white border-[#1b8a3e] shadow-lg shadow-green-600/20"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-400"
                  }`}
                >
                  <span className="text-3xl">{part.icon}</span>
                  <span className="leading-tight text-center">{part.label}</span>
                </button>
              ))}
            </div>

            {selectedPart && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span className="text-[12px] font-bold text-green-800 dark:text-green-300">
                  আক্রান্ত অংশ: {selectedPart}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 4: SYMPTOM CHIPS + ELIMINATION QUESTIONS
        ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 4 && !result && !analyzing && (
          <div className="space-y-5">
            <div className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-1">
              🔍 ধাপ ৪: লক্ষণ ও বর্জন প্রশ্ন
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
              লক্ষণ নির্বাচন করুন এবং বর্জন প্রশ্নের উত্তর দিন
            </p>

            {/* ── Symptom Chips ── */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                🏷️ লক্ষণ নির্বাচন করুন
              </div>
              <div className="space-y-3">
                {SYMPTOM_CATEGORIES.map((cat) => (
                  <div key={cat.label}>
                    <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                      {cat.icon} {cat.label}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {cat.chips.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => toggleSymptom(chip)}
                          className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            selectedSymptoms.includes(chip)
                              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-400"
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

            {/* ── Elimination Questions ── */}
            <div className="space-y-3">
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                🔬 বর্জন প্রশ্ন (কারণ নির্ণয়)
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                এই প্রশ্নগুলো পোকা/ছত্রাক/ব্যাকটেরিয়া/ভাইরাস/পুষ্টি ঘাটতি আলাদা করতে সাহায্য করে
              </p>

              {ELIMINATION_QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3"
                >
                  <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {q.question}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2.5">
                    {q.subtitle}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {q.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          setEliminationAnswer(q.id, opt.value)
                        }
                        className={`px-3 py-2 rounded-lg text-[11px] font-bold border-2 transition-all cursor-pointer ${
                          eliminationAnswers[q.id] === opt.value
                            ? "bg-[#1b8a3e] text-white border-[#1b8a3e] shadow-sm"
                            : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-400"
                        }`}
                      >
                        {opt.label}
                        <span className="block text-[9px] font-normal opacity-80">
                          {opt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Description ── */}
            <div>
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-2">
                ✏️ অতিরিক্ত বর্ণনা (ঐচ্ছিক)
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="রোগের বিস্তারিত বর্ণনা দিন... যেমন: গত ৩ দিন ধরে পাতায় দাগ দেখা যাচ্ছে..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/30 resize-none h-20"
              />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            STEP 5: DISEASE TRIANGLE QUESTIONS
        ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 5 && !result && !analyzing && (
          <div className="space-y-4">
            <div className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-1">
              🔺 ধাপ ৫: রোগ ত্রিভুজ প্রশ্ন
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
              মাঠের পরিস্থিতি সম্পর্কে তথ্য দিন — পোষক + জীবাণু + পরিবেশ = রোগের ঝুঁকি
            </p>

            {/* Triangle illustration */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
              <div className="text-center mb-2">
                <span className="text-[28px]">🔺</span>
              </div>
              <div className="flex justify-around text-[10px] font-bold text-green-800 dark:text-green-300">
                <div className="text-center">
                  <div className="text-lg">🌿</div>
                  <div>পোষক</div>
                  <div>(Host)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg">🦠</div>
                  <div>জীবাণু</div>
                  <div>(Pathogen)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg">🌧️</div>
                  <div>পরিবেশ</div>
                  <div>(Environment)</div>
                </div>
              </div>
            </div>

            {/* Triangle questions */}
            <div className="space-y-3">
              {TRIANGLE_QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3"
                >
                  <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {q.question}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2.5">
                    {q.subtitle}
                  </div>
                  <div className="flex gap-2">
                    {["yes", "no"].map((val) => (
                      <button
                        key={val}
                        onClick={() => setTriangleAnswer(q.id, val)}
                        className={`flex-1 px-3 py-2.5 rounded-lg text-[12px] font-bold border-2 transition-all cursor-pointer ${
                          triangleAnswers[q.id] === val
                            ? val === "yes"
                              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                              : "bg-[#1b8a3e] text-white border-[#1b8a3e] shadow-sm"
                            : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-400"
                        }`}
                      >
                        {val === "yes" ? "হ্যাঁ ✅" : "না ❌"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            NAVIGATION BUTTONS (Step flow)
        ═══════════════════════════════════════════════════════════════ */}
        {!result && !analyzing && (
          <div className="flex gap-3 mt-5">
            {currentStep > 1 && (
              <button
                onClick={goPrev}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-[13px] rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95"
              >
                ← আগের ধাপ
              </button>
            )}
            {currentStep < 5 ? (
              <button
                onClick={goNext}
                disabled={
                  (currentStep === 2 && !canProceedStep2) ||
                  (currentStep === 3 && !canProceedStep3)
                }
                className="flex-1 bg-gradient-to-r from-[#1b8a3e] to-[#2d6a4f] text-white font-bold text-[13px] rounded-xl py-3 flex items-center justify-center gap-2 hover:from-[#167035] hover:to-[#245a40] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20"
              >
                পরবর্তী ধাপ →
              </button>
            ) : (
              <button
                onClick={runDiagnosis}
                disabled={!canSubmit || analyzing}
                className="flex-1 bg-gradient-to-r from-[#1b8a3e] to-[#2d6a4f] text-white font-bold text-[14px] rounded-xl py-3.5 flex items-center justify-center gap-2 hover:from-[#167035] hover:to-[#245a40] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20"
              >
                🔬 CABI পদ্ধতিতে নির্ণয় করুন
              </button>
            )}
          </div>
        )}

        {/* ── Quick submit on Step 4 if enough data ── */}
        {currentStep === 4 && canSubmit && !result && !analyzing && (
          <div className="mt-3">
            <button
              onClick={() => setCurrentStep(5)}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-[12px] rounded-xl py-2.5 flex items-center justify-center gap-2 hover:from-amber-600 hover:to-amber-700 transition-all active:scale-[0.98] shadow-md"
            >
              ⏭️ রোগ ত্রিভুজ ধাপ এড়িয়ে সরাসরি নির্ণয় করুন
            </button>
          </div>
        )}

        {/* ── Loading State ───────────────────────────────────────────── */}
        {analyzing && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 mb-5 text-center">
            <div className="w-14 h-14 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
            <div className="text-[14px] font-bold text-green-800 dark:text-green-300 mb-1">
              CABI Plantwise পদ্ধতিতে বিশ্লেষণ চলছে
            </div>
            <div className="text-[11px] text-green-600 dark:text-green-400">
              বর্জন গেট → রোগ ত্রিভুজ → IPM পরামর্শ
            </div>
          </div>
        )}

        {/* ── Error State ─────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">❌</span>
              <span className="text-sm font-bold text-red-700">নির্ণয় ব্যর্থ</span>
            </div>
            <p className="text-[12px] text-red-600 mb-3">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setError(null);
                  runDiagnosis();
                }}
                className="bg-red-500 text-white text-[11px] font-bold rounded-full px-4 py-1.5 cursor-pointer hover:bg-red-600"
              >
                আবার চেষ্টা করুন
              </button>
              <button
                onClick={handleClear}
                className="bg-white border border-red-200 text-red-600 text-[11px] font-bold rounded-full px-4 py-1.5 cursor-pointer hover:bg-red-50"
              >
                নতুন শুরু
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            DIAGNOSIS RESULTS
        ═══════════════════════════════════════════════════════════════ */}
        {result && !analyzing && !error && (
          <div className="space-y-4 mt-4">
            {/* Summary card */}
            <div className="bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-white/60">
                  {result.provider}
                </span>
                <span className="text-[10px] text-white/50">
                  {bn(result.elapsed_ms)} মিসে
                </span>
              </div>
              {diagnosisJson && (
                <>
                  <div className="text-[20px] font-extrabold mb-1">
                    {diagnosisJson.disease_name_bn}
                  </div>
                  <div className="text-[11px] text-white/70 mb-2">
                    {diagnosisJson.disease_name} •{" "}
                    {causeTypeBn[diagnosisJson.cause_type] ||
                      diagnosisJson.cause_type}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full">
                      আত্মবিশ্বাস: {bn(diagnosisJson.confidence_pct)}%
                    </span>
                    {diagnosisJson.urgency &&
                      urgencyBn[diagnosisJson.urgency] && (
                        <span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full">
                          ⏰ {urgencyBn[diagnosisJson.urgency].label}
                        </span>
                      )}
                    {diagnosisJson.action_required && (
                      <span className="text-[10px] font-bold bg-red-500/30 px-2.5 py-1 rounded-full">
                        ⚡ ব্যবস্থা প্রয়োজন
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ── 1. Exclusion Gates ──────────────────────────────────── */}
            {diagnosisJson?.gate_results && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-1">
                  ১. CABI বর্জন পদ্ধতি অনুযায়ী বিশ্লেষণ
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                  অ্যাবায়োটিক/বায়োটিক:{" "}
                  <span className="font-bold">
                    {diagnosisJson.biotic_abiotic === "biotic"
                      ? "বায়োটিক (জীবাণু)"
                      : diagnosisJson.biotic_abiotic === "abiotic"
                      ? "অ্যাবায়োটিক (পরিবেশগত)"
                      : "অনিশ্চিত"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      "a_insects",
                      "b_virus",
                      "c_bacteria",
                      "d_fungi",
                    ] as const
                  ).map((gate) => {
                    const status = diagnosisJson.gate_results[gate];
                    return (
                      <div
                        key={gate}
                        className={`rounded-lg border p-2.5 ${gateStatusColor(
                          status
                        )}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">
                            {gateStatusIcon(status)}
                          </span>
                          <span className="text-[11px] font-bold">
                            {gateLabelBn[gate]}
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold">
                          {status === "excluded"
                            ? "বাদ দেওয়া হয়েছে"
                            : status === "confirmed"
                            ? "নিশ্চিত"
                            : status === "retained"
                            ? "সন্দেহভাজন"
                            : "অনিশ্চিত"}
                        </div>
                        <div className="text-[9px] mt-0.5 opacity-80 line-clamp-2">
                          {diagnosisJson.gate_results[
                            `${gate}_reason` as keyof GateResult
                          ] || ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 2. Disease Candidates ──────────────────────────────── */}
            {diagnosisJson?.top_candidates &&
              diagnosisJson.top_candidates.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                    ২. সম্ভাব্য রোগ
                  </div>
                  {diagnosisJson.top_candidates.map((candidate, i) => (
                    <div
                      key={i}
                      className={`mb-3 ${
                        i > 0
                          ? "pt-3 border-t border-gray-100 dark:border-gray-700"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                            i === 0 ? "bg-amber-600" : "bg-gray-400"
                          }`}
                        >
                          {candidate.rank}
                        </span>
                        <div className="flex-1">
                          <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                            {candidate.name_bn}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {candidate.name_en} ({candidate.scientific_name})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[16px] font-extrabold text-[#1b4332] dark:text-green-400">
                            {bn(candidate.confidence_pct)}%
                          </div>
                          <div className="text-[9px] text-gray-400">
                            আত্মবিশ্বাস
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            i === 0 ? "bg-amber-500" : "bg-gray-400"
                          }`}
                          style={{
                            width: `${Math.min(
                              candidate.confidence_pct,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                        🔑 {candidate.key_feature}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 mt-3 flex-wrap">
                    {diagnosisJson.cause_type && (
                      <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full">
                        {causeTypeBn[diagnosisJson.cause_type] ||
                          diagnosisJson.cause_type}
                      </span>
                    )}
                    {diagnosisJson.urgency &&
                      urgencyBn[diagnosisJson.urgency] && (
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            urgencyBn[diagnosisJson.urgency].color
                          }`}
                        >
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

            {/* ── 3. Disease Triangle ────────────────────────────────── */}
            {diagnosisJson?.disease_triangle && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                  ৩. রোগ ত্রিভুজ মূল্যায়ন
                </div>
                {[
                  {
                    label: "পোষক (Host)",
                    score: diagnosisJson.disease_triangle.host_score,
                    note: diagnosisJson.disease_triangle.host_note,
                    color: "bg-blue-500",
                  },
                  {
                    label: "জীবাণু (Pathogen)",
                    score: diagnosisJson.disease_triangle.pathogen_score,
                    note: diagnosisJson.disease_triangle.pathogen_note,
                    color: "bg-red-500",
                  },
                  {
                    label: "পরিবেশ (Environment)",
                    score: diagnosisJson.disease_triangle.environment_score,
                    note: diagnosisJson.disease_triangle.environment_note,
                    color: "bg-amber-500",
                  },
                ].map((item) => (
                  <div key={item.label} className="mb-3 last:mb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        {item.label}
                      </span>
                      <span className="text-[12px] font-extrabold text-gray-900 dark:text-gray-100">
                        {bn(item.score)}/১০
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${item.color}`}
                        style={{ width: `${item.score * 10}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                      {item.note}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── 4. Field Confirmation ──────────────────────────────── */}
            {diagnosisJson?.field_confirmation && (
              <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-4">
                <div className="text-[13px] font-bold text-sky-900 dark:text-sky-300 mb-1">
                  ৪. মাঠে নিশ্চিতকরণ
                </div>
                <div className="text-[11px] font-bold text-sky-800 dark:text-sky-400 mb-2">
                  {diagnosisJson.field_confirmation.test_bn}
                </div>
                {diagnosisJson.field_confirmation.steps_bn?.map(
                  (step, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <span className="w-5 h-5 bg-sky-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed">
                        {step}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}

            {/* ── 5. Severity & Economic Threshold ──────────────────── */}
            {diagnosisJson && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <div className="text-[13px] font-bold text-amber-900 dark:text-amber-300 mb-2">
                  ৫. তীব্রতা ও অর্থনৈতিক গুরুত্ব
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2.5">
                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      তীব্রতা
                    </div>
                    <div className="text-[14px] font-bold text-amber-800 dark:text-amber-300">
                      {diagnosisJson.severity === "severe"
                        ? "গুরুতর"
                        : diagnosisJson.severity === "moderate"
                        ? "মাঝারি"
                        : "হালকা"}
                    </div>
                  </div>
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2.5">
                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      অর্থনৈতিক থ্রেশহোল্ড
                    </div>
                    <div className="text-[14px] font-bold text-amber-800 dark:text-amber-300">
                      {diagnosisJson.etl_exceeded
                        ? "অতিক্রম করেছে ⚡"
                        : "অতিক্রম করেনি ✓"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── 6. IPM Recommendations ────────────────────────────── */}
            {diagnosisJson?.ipm_recommendations &&
              diagnosisJson.ipm_recommendations.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
                  <div className="text-[13px] font-bold text-green-900 dark:text-green-300 mb-3">
                    ৬. সমন্বিত বালাই ব্যবস্থাপনা (IPM)
                  </div>
                  {diagnosisJson.ipm_recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 mb-2.5 last:mb-0"
                    >
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {rec.priority}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm">
                            {ipmTypeIcon[rec.type] || "📌"}
                          </span>
                          <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-800/50 px-1.5 py-0.5 rounded">
                            {ipmTypeBn[rec.type] || rec.type}
                          </span>
                          <span className="text-[9px] text-gray-500">
                            ⏰ {rec.timing}
                          </span>
                        </div>
                        <div className="text-[11px] text-green-800 dark:text-green-300 leading-relaxed">
                          {rec.action_bn}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Chemical options detail */}
                  {diagnosisJson.chemical_options &&
                    diagnosisJson.chemical_options.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                        <div className="text-[11px] font-bold text-green-900 dark:text-green-300 mb-2">
                          💊 রাসায়নিক বিকল্প (MoA গ্রুপ সহ):
                        </div>
                        <div className="space-y-2">
                          {diagnosisJson.chemical_options.map((chem, i) => (
                            <div
                              key={i}
                              className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-3 border border-green-100 dark:border-green-800/50"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                                  {chem.name_bn}
                                </span>
                                <span className="text-[10px] font-extrabold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md">
                                  {chem.frac_irac_group}
                                </span>
                              </div>
                              {chem.moa && (
                                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mb-1">
                                  ⚙️ MoA: {chem.moa}
                                </div>
                              )}
                              <div className="text-[10px] text-gray-600 dark:text-gray-400 space-y-0.5">
                                <div>
                                  ব্র্যান্ড: {chem.trade_name} • মাত্রা:{" "}
                                  {chem.dose}
                                </div>
                                <div>
                                  ফলন পূর্ববর্তী সময় (PHI):{" "}
                                  {bn(chem.phi_days)} দিন
                                </div>
                              </div>
                              {chem.resistance_risk && (
                                <div
                                  className={`text-[9px] font-bold mt-1 ${resistanceRiskColor(
                                    chem.resistance_risk
                                  )}`}
                                >
                                  ⚠️ রেজিস্ট্যান্স ঝুঁকি:{" "}
                                  {chem.resistance_risk}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

            {/* ── 7. Prevention ─────────────────────────────────────── */}
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

            {/* ── 8. When to Consult DAE ────────────────────────────── */}
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

            {/* ── Key Recommendations Summary ────────────────────────── */}
            {diagnosisJson?.key_recommendations &&
              diagnosisJson.key_recommendations.length > 0 && (
                <div className="bg-[#1b4332] rounded-2xl p-4">
                  <div className="text-[13px] font-bold text-white mb-3">
                    🔑 মূল সুপারিশসমূহ
                  </div>
                  {diagnosisJson.key_recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 mb-2 last:mb-0"
                    >
                      <span className="w-5 h-5 bg-white/20 text-white rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[11px] text-white/90 leading-relaxed">
                        {rec}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            {/* ── 9. Feedback Section ────────────────────────────────── */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                📝 এই নির্ণয় কি সঠিক?
              </div>

              {feedbackGiven === null ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => submitFeedback(true)}
                      disabled={feedbackSubmitting}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-[13px] rounded-xl py-3 flex items-center justify-center gap-2 transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      ✅ হ্যাঁ, সঠিক
                    </button>
                    <button
                      onClick={() => submitFeedback(false)}
                      disabled={feedbackSubmitting}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold text-[13px] rounded-xl py-3 flex items-center justify-center gap-2 transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      ❌ না, ভুল
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center">
                    আপনার মতামত নির্ণয়ের মান উন্নত করতে সাহায্য করে
                  </p>
                </div>
              ) : feedbackGiven === "no" ? (
                <div className="space-y-3">
                  <div className="text-[11px] text-red-600 dark:text-red-400 font-bold">
                    আমরা দুঃখিত। সঠিক রোগের নাম দিলে সিস্টেম উন্নত হবে:
                  </div>
                  <input
                    type="text"
                    value={correctDiagnosis}
                    onChange={(e) => setCorrectDiagnosis(e.target.value)}
                    placeholder="সঠিক রোগের নাম লিখুন..."
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/30"
                  />
                  <button
                    onClick={async () => {
                      setFeedbackSubmitting(true);
                      try {
                        await fetch("/api/diagnose/feedback", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            session_id: sessionId,
                            crop: selectedCrop,
                            disease_name:
                              result?.json?.disease_name || "",
                            approved: false,
                            user_comment: "ভুল নির্ণয়",
                            correct_diagnosis: correctDiagnosis,
                          }),
                        });
                      } catch {
                        console.warn("Feedback fallback submitted");
                      }
                      setFeedbackSubmitting(false);
                    }}
                    disabled={feedbackSubmitting || !correctDiagnosis}
                    className="w-full bg-red-500 text-white font-bold text-[12px] rounded-xl py-2.5 hover:bg-red-600 transition-colors active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {feedbackSubmitting
                      ? "পাঠানো হচ্ছে..."
                      : "সঠিক নির্ণয় জমা দিন"}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-[12px] text-green-600 dark:text-green-400 font-bold">
                    ✅ ধন্যবাদ! আপনার মতামতের জন্য কৃতজ্ঞ।
                  </span>
                </div>
              )}
            </div>

            {/* ── 10. DISCLAIMER BANNER ──────────────────────────────── */}
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="text-[13px] font-bold text-red-800 dark:text-red-300 mb-1">
                    দাবিত্যাগ / Disclaimer
                  </div>
                  <p className="text-[11px] text-red-700 dark:text-red-400 leading-relaxed font-semibold">
                    রাসায়নিক প্রয়োগের আগে অবশ্যই স্থানীয় DAE/SAAO
                    কর্মকর্তার পরামর্শ নিন। এই নির্ণয় কেবল তথ্যসূত্রে
                    প্রদান করা হচ্ছে এবং পেশাদার কৃষি পরামর্শের বিকল্প নয়।
                  </p>
                </div>
              </div>
            </div>

            {/* ── Disclaimer from API ── */}
            {diagnosisJson?.disclaimer && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  {diagnosisJson.disclaimer}
                </p>
              </div>
            )}

            {/* ── New Diagnosis Button ── */}
            <button
              onClick={handleClear}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95 cursor-pointer"
            >
              🔄 নতুন নির্ণয় শুরু করুন
            </button>
          </div>
        )}

        {/* ── Tips (show when no results & step 1) ──────────────────── */}
        {currentStep === 1 && !result && !analyzing && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mt-5">
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
              CABI পদ্ধতি কীভাবে কাজ করে
            </div>
            <div className="space-y-2.5">
              {[
                {
                  step: "১",
                  icon: "📷",
                  title: "ছবি দিন",
                  desc: "আক্রান্ত অংশের স্পষ্ট ছবি আপলোড করুন",
                },
                {
                  step: "২",
                  icon: "🌱",
                  title: "ফসল নির্বাচন",
                  desc: "কোন ফসল আক্রান্ত তা বলুন",
                },
                {
                  step: "৩",
                  icon: "🔍",
                  title: "বর্জন বিশ্লেষণ",
                  desc: "কোন কারণগুলো বাদ দেওয়া যায় (পোকা? ভাইরাস? ব্যাকটেরিয়া?)",
                },
                {
                  step: "৪",
                  icon: "🔺",
                  title: "রোগ ত্রিভুজ",
                  desc: "পোষক + জীবাণু + পরিবেশ = রোগের ঝুঁকি",
                },
                {
                  step: "৫",
                  icon: "💊",
                  title: "IPM পরামর্শ",
                  desc: "কৃষি → জৈবিক → রাসায়নিক (শেষ উপায়)",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#1b8a3e] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                      {item.icon} {item.title}
                    </div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-400">
                      {item.desc}
                    </div>
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
