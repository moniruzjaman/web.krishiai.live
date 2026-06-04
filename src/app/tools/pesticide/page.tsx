"use client";

/**
 * Pesticide Expert Tool — Interactive Pesticide Advisor
 *
 * Features:
 * - Pest/disease identification by crop
 * - Pesticide compatibility checker
 * - IRAC group rotation guide
 * - Application rate calculator
 * - Safety guidelines in Bengali
 */

import { useState, useCallback } from "react";

// ── Pest Database ────────────────────────────────────────────────────────────
const PESTS = [
  { id: "brown_planthopper", name: "বাদামি গাছফড়িং", en: "Brown Planthopper", icon: "🦗", crops: ["বোরো ধান", "আমন ধান"], severity: "high", pesticideGroups: ["4A", "4C", "9B"] },
  { id: "rice_stemborer", name: "ধানের গণ্ডারি", en: "Yellow Stemborer", icon: "🐛", crops: ["বোরো ধান", "আউশ ধান", "আমন ধান"], severity: "high", pesticideGroups: ["4A", "5", "28"] },
  { id: "rice_hispa", name: "ধানের হিসপা", en: "Rice Hispa", icon: "🪲", crops: ["আউশ ধান", "আমন ধান"], severity: "medium", pesticideGroups: ["4A", "3", "5"] },
  { id: "blast", name: "ব্লাস্ট রোগ", en: "Rice Blast", icon: "🍄", crops: ["বোরো ধান", "আমন ধান"], severity: "high", pesticideGroups: ["3", "11", "7"] },
  { id: "sheath_blight", name: "খোল পোড়া রোগ", en: "Sheath Blight", icon: "🍄", crops: ["বোরো ধান", "আমন ধান"], severity: "medium", pesticideGroups: ["3", "11", "M01"] },
  { id: "aphid", name: "মাজরা/আফিড", en: "Aphid", icon: "🪲", crops: ["সবজি", "ফল", "সরিষা"], severity: "medium", pesticideGroups: ["4A", "4C", "9B", "8A"] },
  { id: "fruit_borer", name: "ফল ছিদ্রকারী", en: "Fruit Borer", icon: "🐛", crops: ["টমেটো", "বেগুন", "পেঁপে"], severity: "high", pesticideGroups: ["5", "28", "4A"] },
  { id: "potato_late_blight", name: "আলুর ব্লাইট", en: "Late Blight", icon: "🍄", crops: ["আলু"], severity: "high", pesticideGroups: ["4", "M01", "27", "40"] },
  { id: "jute_semilooper", name: "পাটের সেমিলুপার", en: "Jute Semilooper", icon: "🐛", crops: ["পাট"], severity: "medium", pesticideGroups: ["4A", "5", "3"] },
  { id: "mustard_aphid", name: "সরিষার মাজরা", en: "Mustard Aphid", icon: "🪲", crops: ["সরিষা"], severity: "high", pesticideGroups: ["4A", "9B", "8A"] },
  { id: "onion_thrips", name: "পেঁয়াজের থ্রিপস", en: "Onion Thrips", icon: "🪲", crops: ["পেঁয়াজ", "রসুন"], severity: "medium", pesticideGroups: ["4A", "9C", "1B"] },
  { id: "chili_anthracnose", name: "মরিচের অ্যানথ্রাকনোজ", en: "Chili Anthracnose", icon: "🍄", crops: ["মরিচ"], severity: "high", pesticideGroups: ["3", "11", "M01"] },
];

// ── IRAC Groups ──────────────────────────────────────────────────────────────
const IRAC_GROUPS: Record<string, { name: string; examples: string[]; rotation: string[] }> = {
  "1B": { name: "কার্বামেট", examples: ["কার্বারিল", "মেথোমিল"], rotation: ["4A", "5", "28"] },
  "3": { name: "সিন্থেটিক পাইরেথ্রয়েড", examples: ["সাইপারমেথ্রিন", "ডেল্টামেথ্রিন", "ল্যাম্বডা-সাইহ্যালোথ্রিন"], rotation: ["4A", "5", "28"] },
  "4A": { name: "নিওনিকোটিনয়েড", examples: ["ইমিডাক্লোপ্রিড", "থায়ামেথোক্সাম", "অ্যাসিটামিপ্রিড"], rotation: ["5", "28", "3"] },
  "4C": { name: "বুটেনোলাইড", examples: ["ফ্লুপাইরাডিফুরন"], rotation: ["4A", "5", "28"] },
  "5": { name: "স্পাইনোসিন", examples: ["স্পাইনোসাড", "স্পাইনেটোরাম"], rotation: ["4A", "28", "3"] },
  "7": { name: "কার্বক্সামাইড", examples: ["কার্বক্সিন", "ফেনহেক্সামিড"], rotation: ["3", "11", "M01"] },
  "8A": { name: "ফুমিগ্যান্ট", examples: ["ডায়াজিনন"], rotation: ["4A", "5", "28"] },
  "9B": { name: "পাইমেট্রোজিন", examples: ["পাইমেট্রোজিন"], rotation: ["4A", "5", "3"] },
  "9C": { name: "ফ্লোনিকামিড", examples: ["ফ্লোনিকামিড"], rotation: ["4A", "1B", "3"] },
  "11": { name: "QoI ফাঙ্গিসাইড", examples: ["অ্যাজক্সিস্ট্রোবিন", "ট্রাইফ্লোক্সিস্ট্রোবিন"], rotation: ["3", "M01", "7"] },
  "27": { name: "সায়ানো-অ্যাসিটামিড অক্সাইম", examples: ["সায়াজোফামিড"], rotation: ["4", "M01", "40"] },
  "28": { name: "ডায়ামাইড", examples: ["ক্লোরানট্রানিলিপ্রোল", "ফ্লুবেন্ডিয়ামাইড"], rotation: ["4A", "5", "3"] },
  "40": { name: "কার্বক্সামিক অ্যাসিড", examples: ["ফ্লুয়াপিক্স", "ফ্লুইন্ডাইড"], rotation: ["4", "M01", "27"] },
  "M01": { name: "মাল্টি-সাইট ফাঙ্গিসাইড", examples: ["ম্যানকোজেব", "ক্লোরোথালোনিল"], rotation: ["3", "11", "7"] },
  "4": { name: "ফেনিলঅ্যামাইড", examples: ["মেটাল্যাক্সিল", "মেফেনক্সাম"], rotation: ["M01", "27", "40"] },
};

// ── Pesticide Products (Bangladesh market) ──────────────────────────────────
const PRODUCTS = [
  { name: "টিডোর ২৫০ ডব্লিউপি", active: "থায়ামেথোক্সাম", group: "4A", type: "কীটনাশক", dose: "৪ গ্রাম/লি", safety: "মাঝারি" },
  { name: "কনফিডর ২০০ এসএল", active: "ইমিডাক্লোপ্রিড", group: "4A", type: "কীটনাশক", dose: "২ মি.লি/লি", safety: "মাঝারি" },
  { name: "রিজেন্ট ৫০ এসসি", active: "ফিপ্রোনিল", group: "2B", type: "কীটনাশক", dose: "৫ মি.লি/১০ লি", safety: "উচ্চ" },
  { name: "ডায়মল ৩০ এসসি", active: "ক্লোরানট্রানিলিপ্রোল", group: "28", type: "কীটনাশক", dose: "২ মি.লি/১০ লি", safety: "নিম্ন" },
  { name: "ট্রেসার ৪৫ এসসি", active: "স্পাইনেটোরাম", group: "5", type: "কীটনাশক", dose: "২ মি.লি/১০ লি", safety: "নিম্ন" },
  { name: "স্কোর ২৫০ ইসি", active: "ডাইফেনোকনাজল", group: "3", type: "ছত্রাকনাশক", dose: "০.৫ মি.লি/লি", safety: "নিম্ন" },
  { name: "টিল্ট ২৫০ ইসি", active: "প্রোপিকোনাজল", group: "3", type: "ছত্রাকনাশক", dose: "১ মি.লি/লি", safety: "নিম্ন" },
  { name: "এমকোজেব ৮০ ডব্লিউপি", active: "ম্যানকোজেব", group: "M01", type: "ছত্রাকনাশক", dose: "২.৫ গ্রাম/লি", safety: "নিম্ন" },
  { name: "নেটিভ ৭৫ ডব্লিউজি", active: "ট্রাইফ্লোক্সিস্ট্রোবিন", group: "11", type: "ছত্রাকনাশক", dose: "০.৩ গ্রাম/লি", safety: "নিম্ন" },
  { name: "রিডোমিল গোল্ড এমজেড ৬৮ ডব্লিউপি", active: "মেটাল্যাক্সিল+ম্যানকোজেব", group: "4+M01", type: "ছত্রাকনাশক", dose: "২.৫ গ্রাম/লি", safety: "নিম্ন" },
];

// ── Compatibility Matrix ─────────────────────────────────────────────────────
const INCOMPATIBLE: Record<string, string[]> = {
  "4A": ["9C"],  // Neonics don't mix with flonicamid
  "3": ["M01"],  // Pyrethroids + mancozeb = reduced efficacy
  "5": ["11"],   // Spinosyns + QoI = antagonism
  "1B": ["4A"],  // Carbamates + neonics = additive toxicity
};

// ── Component ────────────────────────────────────────────────────────────────
export default function PesticidePage() {
  const [selectedPest, setSelectedPest] = useState<string | null>(null);
  const [selectedProduct1, setSelectedProduct1] = useState<string | null>(null);
  const [selectedProduct2, setSelectedProduct2] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"identify" | "compatibility" | "rotation" | "safety">("identify");

  const pest = PESTS.find((p) => p.id === selectedPest);
  const prod1 = PRODUCTS.find((p) => p.name === selectedProduct1);
  const prod2 = PRODUCTS.find((p) => p.name === selectedProduct2);

  // Check compatibility
  const checkCompatibility = useCallback(() => {
    if (!prod1 || !prod2) return null;
    if (prod1.name === prod2.name) return { compatible: false, reason: "একই কীটনাশক দুইবার ব্যবহার করবেন না" };
    if (prod1.type !== prod2.type) return { compatible: true, reason: "বিভিন্ন ধরনের কীটনাশক মিশ্রণ সম্ভব" };
    const incompat = INCOMPATIBLE[prod1.group] || [];
    if (incompat.includes(prod2.group)) return { compatible: false, reason: `${IRAC_GROUPS[prod1.group]?.name || prod1.group} ও ${IRAC_GROUPS[prod2.group]?.name || prod2.group} মিশ্রণ নিরাপদ নয়` };
    return { compatible: true, reason: "মিশ্রণ সম্ভব — তবে মিশ্রণের আগে লেবেল পড়ুন" };
  }, [prod1, prod2]);

  const compatResult = checkCompatibility();

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#b91c1c,#991b1b)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">PESTICIDE EXPERT</div>
        <h1 className="text-[22px] font-bold text-white mb-1">🧪 বালাইনাশক বিশেষজ্ঞ</h1>
        <p className="text-xs text-white/70">কীটনাশক নির্বাচন, মিক্সিং চেক ও IRAC রোটেশন গাইড</p>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-none bg-gray-100 rounded-xl p-1">
          {[
            { key: "identify", label: "🔍 কীট/রোগ" },
            { key: "compatibility", label: "⚗️ মিক্সিং" },
            { key: "rotation", label: "🔄 রোটেশন" },
            { key: "safety", label: "⚠️ সতর্কতা" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "identify" | "compatibility" | "rotation" | "safety")}
              className={`flex-1 text-[11px] font-bold py-2 px-2 rounded-lg transition-all cursor-pointer border-none whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-white text-red-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── IDENTIFY TAB ─────────────────────────────────────────────── */}
        {activeTab === "identify" && (
          <div className="space-y-4">
            <div className="text-[12px] font-bold text-gray-700 mb-2">কীট/রোগ নির্বাচন করুন</div>
            <div className="grid grid-cols-2 gap-2">
              {PESTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPest(p.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    selectedPest === p.id
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 bg-white hover:border-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-gray-900 truncate">{p.name}</div>
                      <div className="text-[9px] text-gray-500">{p.en}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {p.crops.slice(0, 2).map((c, i) => (
                      <span key={i} className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">{c}</span>
                    ))}
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${p.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {p.severity === "high" ? "মারাত্মক" : "মাঝারি"}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Pest detail */}
            {pest && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{pest.icon}</span>
                  <div>
                    <div className="text-[14px] font-bold text-gray-900">{pest.name}</div>
                    <div className="text-[11px] text-gray-500">{pest.en}</div>
                  </div>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${pest.severity === "high" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"}`}>
                    {pest.severity === "high" ? "মারাত্মক" : "মাঝারি"}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="text-[11px] font-bold text-gray-700 mb-1">আক্রান্ত ফসল</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {pest.crops.map((c, i) => (
                      <span key={i} className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{c}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-gray-700 mb-1">প্রস্তাবিত কীটনাশক (IRAC গ্রুপ)</div>
                  <div className="space-y-1.5">
                    {pest.pesticideGroups.map((g, i) => {
                      const group = IRAC_GROUPS[g];
                      return (
                        <div key={i} className="bg-white rounded-lg p-2.5 border border-red-100">
                          <div className="text-[11px] font-bold text-gray-900">গ্রুপ {g}: {group?.name || g}</div>
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            উদাহরণ: {group?.examples.join(", ")}
                          </div>
                          <div className="text-[9px] text-blue-600 mt-0.5">
                            রোটেশন: গ্রুপ {group?.rotation.join(", ")} এর সাথে পর্যায়ক্রমে ব্যবহার করুন
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Matching products */}
                <div className="mt-3">
                  <div className="text-[11px] font-bold text-gray-700 mb-1.5">বাজারে পাওয়া পণ্য</div>
                  <div className="space-y-1">
                    {PRODUCTS.filter(p => pest.pesticideGroups.includes(p.group)).map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-red-100">
                        <div className="flex-1">
                          <div className="text-[10px] font-bold text-gray-900">{p.name}</div>
                          <div className="text-[9px] text-gray-500">{p.active} · গ্রুপ {p.group}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-gray-900">{p.dose}</div>
                          <div className="text-[9px] text-gray-500">{p.type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COMPATIBILITY TAB ─────────────────────────────────────────── */}
        {activeTab === "compatibility" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="text-[12px] font-bold text-amber-900 mb-2">⚗️ কীটনাশক মিক্সিং চেকার</div>
              <div className="text-[11px] text-amber-800 leading-relaxed">
                দুটি কীটনাশক মিশ্রণ নিরাপদ কিনা পরীক্ষা করুন। সবসময় লেবেল নির্দেশনা অনুসরণ করুন।
              </div>
            </div>

            {/* Product 1 */}
            <div>
              <div className="text-[12px] font-bold text-gray-700 mb-2">প্রথম কীটনাশক</div>
              <select
                value={selectedProduct1 || ""}
                onChange={(e) => setSelectedProduct1(e.target.value || null)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-red-400"
              >
                <option value="">নির্বাচন করুন</option>
                {PRODUCTS.map((p, i) => (
                  <option key={i} value={p.name}>{p.name} ({p.active})</option>
                ))}
              </select>
            </div>

            {/* Product 2 */}
            <div>
              <div className="text-[12px] font-bold text-gray-700 mb-2">দ্বিতীয় কীটনাশক</div>
              <select
                value={selectedProduct2 || ""}
                onChange={(e) => setSelectedProduct2(e.target.value || null)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-red-400"
              >
                <option value="">নির্বাচন করুন</option>
                {PRODUCTS.map((p, i) => (
                  <option key={i} value={p.name}>{p.name} ({p.active})</option>
                ))}
              </select>
            </div>

            {/* Result */}
            {compatResult && (
              <div className={`rounded-2xl p-4 border-2 ${compatResult.compatible ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{compatResult.compatible ? "✅" : "❌"}</span>
                  <div className="text-[14px] font-bold text-gray-900">
                    {compatResult.compatible ? "মিশ্রণ সম্ভব" : "মিশ্রণ নিরাপদ নয়!"}
                  </div>
                </div>
                <div className="text-[12px] text-gray-700">{compatResult.reason}</div>

                {prod1 && prod2 && (
                  <div className="mt-3 flex gap-2">
                    <div className="flex-1 bg-white rounded-lg p-2 border border-gray-100">
                      <div className="text-[10px] font-bold text-gray-900">{prod1.name}</div>
                      <div className="text-[9px] text-gray-500">গ্রুপ {prod1.group} · {prod1.type}</div>
                    </div>
                    <div className="flex items-center text-[12px] text-gray-400">+</div>
                    <div className="flex-1 bg-white rounded-lg p-2 border border-gray-100">
                      <div className="text-[10px] font-bold text-gray-900">{prod2.name}</div>
                      <div className="text-[9px] text-gray-500">গ্রুপ {prod2.group} · {prod2.type}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!compatResult && selectedProduct1 && selectedProduct2 && (
              <div className="text-center text-[12px] text-gray-400">পরীক্ষা হচ্ছে...</div>
            )}
          </div>
        )}

        {/* ── ROTATION TAB ──────────────────────────────────────────────── */}
        {activeTab === "rotation" && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="text-[12px] font-bold text-blue-900 mb-2">🔄 IRAC রোটেশন কেন গুরুত্বপূর্ণ?</div>
              <div className="text-[11px] text-blue-800 leading-relaxed">
                একই গ্রুপের কীটনাশক বারবার ব্যবহার করলে কীট/রোগ প্রতিরোধী হয়ে যায়। IRAC রোটেশন অনুসরণ করে বিভিন্ন গ্রুপের কীটনাশক পর্যায়ক্রমে ব্যবহার করুন।
              </div>
            </div>

            {/* IRAC Group cards */}
            {Object.entries(IRAC_GROUPS).map(([key, group]) => (
              <div key={key} className="bg-white border border-gray-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[13px] font-bold text-gray-900">গ্রুপ {key}</span>
                    <span className="text-[11px] text-gray-500 ml-2">{group.name}</span>
                  </div>
                  <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {key.startsWith("M") ? "মাল্টি-সাইট" : "সিঙ্গেল-সাইট"}
                  </span>
                </div>
                <div className="text-[10px] text-gray-600 mb-1.5">
                  উদাহরণ: {group.examples.join(", ")}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-blue-600 font-bold">রোটেশন:</span>
                  {group.rotation.map((r, i) => (
                    <span key={i} className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SAFETY TAB ────────────────────────────────────────────────── */}
        {activeTab === "safety" && (
          <div className="space-y-3">
            {[
              { icon: "🧤", title: "পোশাক ও সুরক্ষা", items: ["পুরো হাতা শার্ট ও প্যান্ট পরুন", "গ্লাভস, মাস্ক ও চশমা ব্যবহার করুন", "জুতা পরে থাকুন, খালি পায় নয়"] },
              { icon: "⏰", title: "প্রয়োগের সময়", items: ["সকালে বা বিকেলে স্প্রে করুন (৮-১০ AM বা ৩-৫ PM)", "বৃষ্টির আগে স্প্রে করবেন না", "বাতাসের দিকে দাঁড়িয়ে স্প্রে করবেন না"] },
              { icon: "🚫", title: "নিষেধাজ্ঞা", items: ["ফসল কাটার ৭-১৫ দিন আগে স্প্রে করবেন না", "মৌ ও উপকারী পোকায় স্প্রে এড়িয়ে চলুন", "পানির উৎসের কাছে স্প্রে করবেন না"] },
              { icon: "🏥", title: "প্রাথমিক চিকিৎসা", items: ["চোখে লাগলে পরিষ্কার পানিতে ১৫ মিনিট ধুয়ে নিন", "গায়ে লাগলে সাবান পানিতে ধুয়ে ফেলুন", "গিলে ফেললে বমি করাবেন না, দ্রুত ডাক্তার দেখান"] },
              { icon: "📦", title: "সংরক্ষণ", items: ["শিশুদের নাগালের বাইরে রাখুন", "খাদ্যপণ্য থেকে দূরে সংরক্ষণ করুন", "ব্যবহৃত পাত্র পুনরায় ব্যবহার করবেন না"] },
            ].map((section, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{section.icon}</span>
                  <span className="text-[13px] font-bold text-gray-900">{section.title}</span>
                </div>
                <div className="space-y-1.5">
                  {section.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="text-[10px] text-green-600 mt-0.5">✓</span>
                      <span className="text-[11px] text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Emergency contact */}
            <div className="bg-red-50 border border-red-300 rounded-xl p-4">
              <div className="text-[12px] font-bold text-red-900 mb-1">🚨 জরুরি সংযোগ</div>
              <div className="text-[11px] text-red-800 space-y-1">
                <p>• বিষক্রিয়া নিয়ন্ত্রণ কেন্দ্র: ০২-৯১৩০০৬৬</p>
                <p>• কৃষি সম্প্রসারণ অধিদপ্তর: ১৬১২৩</p>
                <p>• স্বাস্থ্য সেবা হটলাইন: ১৬২৬৩</p>
              </div>
            </div>
          </div>
        )}

        {/* AI consultation link */}
        <a
          href="/chat"
          className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-xl p-3.5 no-underline hover:from-red-100 hover:to-amber-100 transition-all mt-4"
        >
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white text-lg">🤖</div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-gray-900">AI থেকে কীটনাশক সম্পর্কে জানুন</div>
            <div className="text-[11px] text-gray-500">আপনার ফসলের কীটপতঙ্গ সম্পর্কে প্রশ্ন করুন</div>
          </div>
          <span className="text-[11px] font-semibold text-red-600">→</span>
        </a>
      </div>
    </div>
  );
}
