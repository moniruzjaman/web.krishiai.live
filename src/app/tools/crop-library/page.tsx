"use client";

/**
 * Crop Library Tool Page
 */

const CROPS = [
  { icon: "🌾", name: "ধান", season: "আউশ/আমন/বোরো", region: "সর্বজনীন" },
  { icon: "🌾", name: "গম", season: "রবি", region: "দিনাজপুর, রাজশাহী" },
  { icon: "🥔", name: "আলু", season: "রবি", region: "রংপুর, বগুড়া" },
  { icon: "🧅", name: "পেঁয়াজ", season: "রবি", region: "ফরিদপুর, পাবনা" },
  { icon: "🌶️", name: "মরিচ", season: "খরিফ/রবি", region: "বগুড়া, রংপুর" },
  { icon: "🍅", name: "টমেটো", season: "রবি", region: "সর্বজনীন" },
  { icon: "🫚", name: "আদা", season: "খরিফ", region: "রংমাটি, খাগড়াছড়ি" },
  { icon: "🧄", name: "রসুন", season: "রবি", region: "রংপুর, দিনাজপুর" },
  { icon: "🌽", name: "ভুট্টা", season: "খরিফ/রবি", region: "লাক্ষ্মীপুর, নোয়াখালী" },
  { icon: "🪢", name: "পাট", season: "খরিফ", region: "ফরিদপুর, টাঙ্গাইল" },
  { icon: "🌱", name: "ডাল", season: "রবি", region: "রাজশাহী, চাঁপাইনবাবগঞ্জ" },
  { icon: "🥬", name: "সবজি", season: "সারাবছর", region: "সর্বজনীন" },
];

export default function CropLibraryPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#166534,#14532d)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">CROP LIBRARY</div>
        <h1 className="text-[22px] font-bold text-white mb-1">🌾 শস্য সুরক্ষা লাইব্রেরি</h1>
        <p className="text-xs text-white/70">৩৩+ ফসলের বিস্তারিত চাষ পদ্ধতি — BARI/BRRI ভিত্তিক</p>
      </div>

      <div className="px-4 pt-5 pb-24">
        <div className="grid grid-cols-2 gap-2.5">
          {CROPS.map((crop, i) => (
            <div
              key={i}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 hover:border-green-300 hover:bg-green-50/30 transition-all cursor-pointer"
            >
              <div className="text-2xl mb-1.5">{crop.icon}</div>
              <div className="text-sm font-bold text-gray-900">{crop.name}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{crop.season}</div>
              <div className="text-[9px] text-green-700 font-medium mt-0.5">📍 {crop.region}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-[12px] text-amber-800">
            📖 প্রতিটি ফসলের বিস্তারিত চাষ পদ্ধতি, রোগ প্রতিকার ও যত্ন নির্দেশিকা শীঘ্রই যুক্ত হবে।
          </p>
        </div>
      </div>
    </div>
  );
}
