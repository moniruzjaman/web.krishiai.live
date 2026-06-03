"use client";

import { useState, useEffect, useCallback } from "react";
import { BANGLADESH_DISTRICTS, findNearestDistrict } from "@/data/bangladeshDistricts";
import { CROP_DISEASES } from "@/data/cropDiseases";
import diagnosticSummary from "@/data/Diagnostic-Field-Guide_enhanced_summary.json";

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiagnosticModal({ isOpen, onClose }: DiagnosticModalProps) {
  const [crop, setCrop] = useState("ধান");
  const [district, setDistrict] = useState("");
  const [resolvedLoc, setResolvedLoc] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [matchingRefImage, setMatchingRefImage] = useState<string | null>(null);

  // Auto Geolocate
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nearest = findNearestDistrict(pos.coords.latitude, pos.coords.longitude);
          if (nearest) {
            setDistrict(nearest.id);
            setResolvedLoc(`${nearest.name} (${nearest.division} বিভাগ)`);
          }
        },
        () => {
          setDistrict("dhaka");
          setResolvedLoc("ঢাকা (ডিফল্ট)");
        }
      );
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSymptom = (sym: string) => {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  // Find matching image from extracted guide elements
  const findReferenceImage = (diseaseNameEn: string) => {
    if (!diseaseNameEn) return null;
    const elements = (diagnosticSummary as any).elements?.images || [];
    const normalizedTarget = diseaseNameEn.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Search for matching specific_name or nearby_text
    const matched = elements.find((img: any) => {
      const spec = (img.specific_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const nearby = (img.nearby_text || "").toLowerCase();
      return (
        (spec && normalizedTarget.includes(spec)) ||
        (nearby && nearby.includes(diseaseNameEn.toLowerCase()))
      );
    });

    if (matched && matched.data_path) {
      // Convert full windows path back to static public path
      const basename = matched.data_path.split(/[\\/]/).pop();
      return `/images/${basename}`;
    }
    return null;
  };

  const runDiagnosis = async () => {
    setLoading(true);
    setResult(null);
    setMatchingRefImage(null);

    const promptText = `Crop: ${crop}. Selected symptoms: ${symptoms.join(", ")}. Description: ${customText}`;
    const base64Clean = image ? image.split(",")[1] : null;

    const payload = {
      messages: [
        {
          role: "user",
          content: base64Clean
            ? [
                { type: "text", text: promptText },
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: base64Clean,
                  },
                },
              ]
            : promptText,
        },
      ],
      crop,
      district,
    };

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(data);
        if (data.structured?.disease_name) {
          const refImg = findReferenceImage(data.structured.disease_name);
          setMatchingRefImage(refImg);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Text-To-Speech
  const speakRecommendations = () => {
    if (!result) return;
    const txt = result.text || "";
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
      return;
    }
    const utter = new SpeechSynthesisUtterance(txt.substring(0, 400));
    utter.lang = "bn-BD";
    synth.speak(utter);
  };

  if (!isOpen) return null;

  const currentCropData = (CROP_DISEASES as any)[crop];
  // Gather unique symptom list from the selected crop database
  const symptomOptions: string[] = currentCropData
    ? Array.from(new Set(currentCropData.diseases.flatMap((d: any) => d.symptoms)))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">🩺 ফসল রোগ নির্ণয় বিশেষজ্ঞ (CABI)</h3>
            {resolvedLoc && <p className="text-[11px] text-white/70">📍 বর্তমান অবস্থান: {resolvedLoc}</p>}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl cursor-pointer">
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Crop Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">১. ফসল নির্বাচন করুন</label>
            <select
              value={crop}
              onChange={(e) => {
                setCrop(e.target.value);
                setSymptoms([]);
              }}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-green-500"
            >
              {Object.keys(CROP_DISEASES).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Symptom Checkboxes */}
          {symptomOptions.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">২. উপসর্গ চিহ্নিত করুন (একাধিক সম্ভব)</label>
              <div className="flex flex-wrap gap-2">
                {symptomOptions.map((sym) => {
                  const active = symptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      onClick={() => toggleSymptom(sym)}
                      className={`text-xs px-3 py-2 rounded-full border transition-all cursor-pointer ${
                        active
                          ? "bg-green-600 text-white border-green-600 font-bold"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-green-300"
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">৩. আক্রান্ত অংশের ছবি যুক্ত করুন (AI বিশ্লেষণের জন্য)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
            />
            {image && (
              <div className="mt-3 relative w-32 h-32 border border-gray-200 rounded-xl overflow-hidden">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-1 right-1 bg-black/60 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Step 4: Describe Problem */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">৪. বিস্তারিত বর্ণনা (ঐচ্ছিক)</label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="আক্রান্ত হওয়ার দিন, সারের ব্যবহার বা অন্যান্য লক্ষণ লিখুন..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-green-500 h-20 resize-none"
            />
          </div>

          {/* Action Trigger */}
          <button
            onClick={runDiagnosis}
            disabled={loading || (symptoms.length === 0 && !image)}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? "⏳ রোগ সনাক্তকরণ হচ্ছে..." : "🔍 রোগ নির্ণয় শুরু করুন"}
          </button>

          {/* Results Panel */}
          {result && (
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div>
                  <h4 className="text-base font-bold text-gray-900">📋 নির্ণয় ও চিকিৎসা পত্র</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">বিশ্লেষক: {result.provider}</p>
                </div>
                <button
                  onClick={speakRecommendations}
                  className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-bold hover:bg-green-100 flex items-center gap-1 cursor-pointer"
                >
                  🔊 শুনুন
                </button>
              </div>

              {/* Structured JSON display */}
              {result.structured && (
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="bg-white border border-gray-150 p-3 rounded-lg text-center">
                    <span className="text-[10px] text-gray-400 block font-bold">প্রাথমিক সন্দেহ</span>
                    <span className="text-sm font-bold text-green-700">{result.structured.disease_name_bn || result.structured.disease_name}</span>
                  </div>
                  <div className="bg-white border border-gray-150 p-3 rounded-lg text-center">
                    <span className="text-[10px] text-gray-400 block font-bold">নিশ্চয়তা</span>
                    <span className="text-sm font-bold text-gray-700">{result.structured.confidence_pct || 50}% ({result.structured.confidence})</span>
                  </div>
                </div>
              )}

              {/* Response markdown text */}
              <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line border-t border-gray-200 pt-3">
                {result.text}
              </div>

              {/* Side by Side Image Verification */}
              {image && matchingRefImage && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">🔍 রোগ নিশ্চিতকরণ তুলনা (মাঠে যাচাই)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <span className="text-[9px] text-gray-400 block mb-1">আপনার ছবি</span>
                      <div className="w-full h-32 border border-gray-200 rounded-lg overflow-hidden">
                        <img src={image} alt="User Leaf" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-gray-400 block mb-1">CABI নির্দেশিকা ছবি</span>
                      <div className="w-full h-32 border border-gray-200 rounded-lg overflow-hidden">
                        <img src={matchingRefImage} alt="Ref Leaf" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
