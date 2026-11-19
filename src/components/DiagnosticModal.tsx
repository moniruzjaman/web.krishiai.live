"use client";

import type * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BANGLADESH_DISTRICTS, findNearestDistrict } from "@/data/bangladeshDistricts";
import { CROP_DISEASES } from "@/data/cropDiseases";
import diagnosticSummary from "@/data/Diagnostic-Field-Guide_enhanced_summary.json";

interface DiagnosticModalProps { isOpen: boolean; onClose: () => void; }
type Step = 1 | 2 | 3;
const STEPS = [
  { id: 1 as Step, label: "ফসল ও লক্ষণ", hint: "কী দেখা যাচ্ছে?" },
  { id: 2 as Step, label: "ছবি ও তথ্য", hint: "আরও তথ্য দিন" },
  { id: 3 as Step, label: "ফলাফল", hint: "পরামর্শ দেখুন" },
];

export default function DiagnosticModal({ isOpen, onClose }: DiagnosticModalProps) {
  const [crop, setCrop] = useState("ধান");
  const [district, setDistrict] = useState("");
  const [resolvedLoc, setResolvedLoc] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>(1);
  const [matchingRefImage, setMatchingRefImage] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, loading, onClose]);

  useEffect(() => {
    if (!isOpen || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const nearest = findNearestDistrict(pos.coords.latitude, pos.coords.longitude);
      if (nearest) { setDistrict(nearest.id); setResolvedLoc(`${nearest.name} (${nearest.division} বিভাগ)`); }
    }, () => { setDistrict("dhaka"); setResolvedLoc("ঢাকা (ডিফল্ট)"); }, { timeout: 5000, maximumAge: 300000 });
  }, [isOpen]);

  const currentCropData = (CROP_DISEASES as any)[crop];
  const symptomOptions = useMemo<string[]>(() => currentCropData ? Array.from(new Set(currentCropData.diseases.flatMap((d: any) => d.symptoms))) : [], [currentCropData]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("শুধু ছবির ফাইল আপলোড করুন।"); return; }
    if (file.size > 6 * 1024 * 1024) { setError("ছবির আকার ৬ MB-এর কম হওয়া দরকার।"); return; }
    setError(""); setImageName(file.name);
    const reader = new FileReader(); reader.onloadend = () => setImage(reader.result as string); reader.readAsDataURL(file);
  };

  const toggleSymptom = (symptom: string) => setSymptoms((previous) => previous.includes(symptom) ? previous.filter((item) => item !== symptom) : [...previous, symptom]);

  const findReferenceImage = (diseaseNameEn: string) => {
    if (!diseaseNameEn) return null;
    const elements = (diagnosticSummary as any).elements?.images || [];
    const normalizedTarget = diseaseNameEn.toLowerCase().replace(/[^a-z0-9]/g, "");
    const matched = elements.find((img: any) => {
      const specific = (img.specific_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const nearby = (img.nearby_text || "").toLowerCase();
      return (specific && normalizedTarget.includes(specific)) || (nearby && nearby.includes(diseaseNameEn.toLowerCase()));
    });
    return matched?.data_path ? `/images/${matched.data_path.split(/[\\/]/).pop()}` : null;
  };

  const runDiagnosis = useCallback(async () => {
    if (symptoms.length === 0 && !image) { setError("কমপক্ষে একটি লক্ষণ নির্বাচন করুন অথবা একটি ছবি দিন।"); setStep(1); return; }
    setLoading(true); setError(""); setResult(null); setMatchingRefImage(null);
    const promptText = `Crop: ${crop}. Selected symptoms: ${symptoms.join(", ")}. Description: ${customText}`;
    const base64Clean = image ? image.split(",")[1] : null;
    const payload = { messages: [{ role: "user", content: base64Clean ? [{ type: "text", text: promptText }, { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Clean } }] : promptText }], crop, district };
    try {
      const response = await fetch("/api/diagnose", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "নির্ণয় করা যায়নি");
      setResult(data); setMatchingRefImage(findReferenceImage(data.structured?.disease_name)); setStep(3);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।"); }
    finally { setLoading(false); }
  }, [crop, district, customText, image, symptoms]);

  const reset = () => { setSymptoms([]); setCustomText(""); setImage(null); setImageName(""); setResult(null); setError(""); setStep(1); };
  const speakRecommendations = () => {
    if (!result || typeof window === "undefined" || !window.speechSynthesis) return;
    if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); return; }
    const utterance = new SpeechSynthesisUtterance((result.text || "").substring(0, 500)); utterance.lang = "bn-BD"; window.speechSynthesis.speak(utterance);
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="diagnosis-title" className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl dark:bg-slate-900 sm:max-h-[90vh] sm:rounded-[28px]">
        <header className="shrink-0 bg-gradient-to-br from-[#0f3d2a] via-[#155d3e] to-[#2d8a55] px-5 pb-5 pt-4 text-white sm:px-7">
          <div className="mb-4 flex items-start justify-between gap-4"><div><div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-300" /> CABI Plantwise</div><h2 id="diagnosis-title" className="text-xl font-extrabold sm:text-2xl">ফসলের সমস্যা বুঝে নিন</h2><p className="mt-1 text-xs text-emerald-100">ছবি বা লক্ষণ দিয়ে ধাপে ধাপে রোগ নির্ণয় করুন</p></div><button ref={closeButtonRef} onClick={onClose} disabled={loading} aria-label="বন্ধ করুন" className="rounded-full bg-white/10 px-3 py-2 text-lg leading-none text-white transition hover:bg-white/20 disabled:opacity-40">×</button></div>
          <div className="grid grid-cols-3 gap-2" aria-label="নির্ণয়ের ধাপ">{STEPS.map((item) => { const active = step === item.id; const complete = step > item.id; return <button key={item.id} onClick={() => !loading && item.id < step && setStep(item.id)} className={`rounded-2xl border px-2 py-2 text-left transition ${active ? "border-white/50 bg-white/20" : complete ? "border-emerald-200/30 bg-emerald-950/20" : "border-white/10 bg-black/10 opacity-70"}`}><span className="flex items-center gap-2 text-[11px] font-bold"><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${active || complete ? "bg-white text-emerald-800" : "bg-white/20"}`}>{complete ? "✓" : item.id}</span>{item.label}</span><span className="mt-1 block pl-7 text-[10px] text-emerald-100">{item.hint}</span></button>; })}</div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {error && <div role="alert" className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700"><span>!</span><span>{error}</span></div>}
          {step < 3 && <div className="space-y-5">
            {step === 1 && <><div><label htmlFor="crop-select" className="mb-2 block text-xs font-bold text-slate-500">১. কোন ফসলে সমস্যা?</label><select id="crop-select" value={crop} onChange={(event) => { setCrop(event.target.value); setSymptoms([]); }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800"><option value="ধান">ধান</option>{Object.keys(CROP_DISEASES).filter((key) => key !== "ধান").map((key) => <option key={key} value={key}>{key}</option>)}</select></div><div><div className="mb-2 flex items-center justify-between"><label className="block text-xs font-bold text-slate-500">২. কী কী লক্ষণ দেখছেন?</label><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{symptoms.length}টি নির্বাচিত</span></div><div className="flex flex-wrap gap-2">{symptomOptions.map((symptom) => <button type="button" key={symptom} onClick={() => toggleSymptom(symptom)} aria-pressed={symptoms.includes(symptom)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${symptoms.includes(symptom) ? "border-emerald-600 bg-emerald-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{symptom}</button>)}</div></div><div><label htmlFor="district-select" className="mb-2 block text-xs font-bold text-slate-500">জেলা <span className="font-normal text-slate-400">(ঐচ্ছিক)</span></label><select id="district-select" value={district} onChange={(event) => { setDistrict(event.target.value); setResolvedLoc(""); }} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"><option value="">জেলা নির্বাচন করুন</option>{BANGLADESH_DISTRICTS.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{resolvedLoc && <p className="mt-2 text-[11px] text-emerald-700">📍 {resolvedLoc}</p>}</div></>}
            {step === 2 && <><div><label className="mb-2 block text-xs font-bold text-slate-500">৩. আক্রান্ত অংশের পরিষ্কার ছবি দিন</label><label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 px-5 py-7 text-center transition hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"><span className="mb-2 text-3xl">📷</span><span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">ছবি বাছাই করুন</span><span className="mt-1 text-[11px] text-slate-500">JPG, PNG · সর্বোচ্চ ৬ MB</span><input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" /></label>{image && <div className="relative mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700"><img src={image} alt="আক্রান্ত ফসলের প্রিভিউ" className="h-44 w-full object-cover" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-xs text-white"><span className="truncate">{imageName}</span><button type="button" onClick={() => { setImage(null); setImageName(""); }} className="rounded-full bg-white/20 px-2 py-1 font-bold hover:bg-white/30">ছবি বাদ দিন</button></div></div>}</div><div><label htmlFor="problem-description" className="mb-2 block text-xs font-bold text-slate-500">৪. অতিরিক্ত তথ্য <span className="font-normal text-slate-400">(ঐচ্ছিক)</span></label><textarea id="problem-description" value={customText} onChange={(event) => setCustomText(event.target.value)} maxLength={500} placeholder="কত দিন ধরে? সাম্প্রতিক সার/স্প্রে বা বৃষ্টির তথ্য লিখুন..." className="h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800" /><div className="mt-1 text-right text-[10px] text-slate-400">{customText.length}/500</div></div></>}
            <div className="flex gap-3 border-t border-slate-100 pt-4 dark:border-slate-800"><button type="button" onClick={() => step === 1 ? onClose() : setStep(1)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">{step === 1 ? "বাতিল" : "পেছনে"}</button><button type="button" onClick={() => step === 1 ? setStep(2) : runDiagnosis()} disabled={loading} className="flex-[1.5] rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">{loading ? "বিশ্লেষণ হচ্ছে..." : step === 1 ? "পরের ধাপ →" : "🔍 রোগ নির্ণয় শুরু করুন"}</button></div>
          </div>}
          {step === 3 && result && <div className="space-y-4"><div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 dark:border-emerald-900 dark:from-emerald-950/40 dark:to-slate-900"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">সম্ভাব্য সমস্যা</p><h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{result.structured?.disease_name_bn || "বিশ্লেষণ সম্পন্ন"}</h3><p className="mt-1 text-xs text-slate-500">বিশ্লেষক: {result.provider || "CABI AI"}</p></div><div className="rounded-2xl bg-white px-3 py-2 text-center shadow-sm dark:bg-slate-800"><div className="text-2xl font-extrabold text-emerald-700">{result.structured?.confidence_pct || 50}%</div><div className="text-[10px] font-semibold text-slate-500">নিশ্চয়তা</div></div></div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={speakRecommendations} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100">🔊 শুনুন</button><button type="button" onClick={reset} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">নতুন নির্ণয়</button></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700 whitespace-pre-line dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{result.text || "ফলাফল পাওয়া গেছে।"}</div>{image && matchingRefImage && <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><p className="mb-3 text-xs font-bold text-slate-500">🔍 মাঠে যাচাইয়ের জন্য তুলনা</p><div className="grid grid-cols-2 gap-3"><img src={image} alt="আপনার ফসল" className="h-32 w-full rounded-xl object-cover" /><img src={matchingRefImage} alt="CABI রেফারেন্স" className="h-32 w-full rounded-xl object-cover" /></div></div>}<p className="rounded-2xl bg-amber-50 px-4 py-3 text-[11px] leading-5 text-amber-800">⚠️ রাসায়নিক প্রয়োগের আগে স্থানীয় DAE/SAAO কর্মকর্তার পরামর্শ নিন। AI ফলাফল মাঠ পর্যায়ে যাচাই করুন।</p></div>}
        </div>
      </section>
    </div>
  );
}
