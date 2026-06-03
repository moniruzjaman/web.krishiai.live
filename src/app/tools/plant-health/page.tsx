"use client";

/**
 * Plant Health Tool Page — AI-powered crop disease diagnosis
 * Redirects to the analyzer tool for image-based diagnosis
 */

import Link from "next/link";

export default function PlantHealthPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#ca8a04,#a16207)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">PLANT HEALTH</div>
        <h1 className="text-[22px] font-bold text-white mb-1">🌿 উদ্ভিদ স্বাস্থ্য বিশেষজ্ঞ</h1>
        <p className="text-xs text-white/70">ছবি তুলে ফসলের রোগ সনাক্ত করুন — AI-চালিত রোগ নির্ণয়</p>
      </div>

      <div className="px-4 pt-5 pb-24">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <div className="text-5xl mb-4">🔬</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">এনালাইজার ব্যবহার করুন</h2>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
            ফসলের রোগ নির্ণয় করতে এনালাইজার টুলে যান। ছবি তুলে বা আপলোড করে AI-চালিত রোগ শনাক্তকরণ ব্যবহার করুন।
          </p>
          <Link
            href="/analyzer"
            className="inline-flex items-center gap-2 bg-[#1b8a3e] text-white font-bold text-sm rounded-full px-6 py-3 hover:bg-[#167035] transition-colors no-underline"
          >
            📷 এনালাইজার খুলুন
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-1">কীভাবে কাজ করে?</h3>
            <div className="text-[12px] text-gray-600 space-y-1.5">
              <p>১. 📷 ফসলের আক্রান্ত অংশের ছবি তুলুন</p>
              <p>২. 🤖 AI ছবি বিশ্লেষণ করে রোগ শনাক্ত করবে</p>
              <p>৩. 💊 চিকিৎসা পরামর্শ ও প্রতিরোধ ব্যবস্থা জানুন</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-green-900 mb-1">সাধারণ রোগসমূহ</h3>
            <div className="text-[12px] text-green-800 space-y-1">
              <p>• ধানের ব্লাস্ট রোগ</p>
              <p>• আলুর লেট ব্লাইট</p>
              <p>• পেঁয়াজের পাতার দাগ রোগ</p>
              <p>• টমেটোর পাতামোড়া রোগ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
