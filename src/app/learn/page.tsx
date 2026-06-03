"use client";

const VIDEO_CATEGORIES = [
  { id: "all", label: "সব" },
  { id: "crop", label: "ফসল চাষ" },
  { id: "disease", label: "রোগ নির্ণয়" },
  { id: "soil", label: "মাটি বিজ্ঞান" },
  { id: "pest", label: "কীটনাশক" },
];

const VIDEOS = [
  {
    id: 1,
    title: "ধানের ব্লাস্ট রোগ প্রতিরোধ",
    channel: "কৃষি মন্ত্রণালয়",
    views: "১.২লক্ষ",
    duration: "৮:৩০",
    cat: "disease",
    thumbnail: "🌾",
  },
  {
    id: 2,
    title: "সঠিক সারের মাত্রা নির্ধারণ",
    channel: "SRDI বাংলাদেশ",
    views: "৮৫ হাজার",
    duration: "১২:১৫",
    cat: "soil",
    thumbnail: "🏺",
  },
  {
    id: 3,
    title: "শীতকালীন সবজি চাষের পদ্ধতি",
    channel: "BARI",
    views: "৬২ হাজার",
    duration: "১০:৪৫",
    cat: "crop",
    thumbnail: "🥬",
  },
  {
    id: 4,
    title: "নিরাপদ কীটনাশক ব্যবহার",
    channel: "DAE বাংলাদেশ",
    views: "৪৫ হাজার",
    duration: "৬:২০",
    cat: "pest",
    thumbnail: "🧪",
  },
  {
    id: 5,
    title: "গম চাষের আধুনিক পদ্ধতি",
    channel: "কৃষি গবেষণা",
    views: "৩৮ হাজার",
    duration: "১৫:০০",
    cat: "crop",
    thumbnail: "🌾",
  },
  {
    id: 6,
    title: "আখের রোগ ও প্রতিকার",
    channel: "BSRI",
    views: "২৯ হাজার",
    duration: "৯:৪৫",
    cat: "disease",
    thumbnail: "🌿",
  },
];

export default function LearnPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div
        className="relative px-4 pt-5 pb-7"
        style={{
          background: "linear-gradient(135deg,#1b4332,#2d6a4f)",
        }}
      >
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">
          KRISHI AI
        </div>
        <h1 className="text-[22px] font-bold text-white mb-1">
          📚 শিক্ষা কেন্দ্র
        </h1>
        <p className="text-xs text-white/70">
          ভিডিও টিউটোরিয়াল, প্রশিক্ষণ ও কৃষি জ্ঞান ভাণ্ডার
        </p>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none">
          {VIDEO_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                cat.id === "all"
                  ? "bg-[#1b8a3e] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Featured video */}
        <div className="rounded-2xl overflow-hidden mb-5 border border-gray-200 card-shadow">
          <div
            className="h-44 flex items-center justify-center relative"
            style={{
              background: "linear-gradient(135deg,#1b4332,#2d6a4f)",
            }}
          >
            <div className="text-6xl">🎬</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              ২৫:৩০
            </div>
          </div>
          <div className="p-4">
            <div className="text-[10px] font-bold text-[#1b8a3e] tracking-wider mb-1">
              ⭐ ফিচার্ড
            </div>
            <div className="text-sm font-bold text-gray-900 mb-1">
              আধুনিক কৃষি পদ্ধতি — সম্পূর্ণ গাইড
            </div>
            <div className="text-[11px] text-gray-500">
              কৃষি মন্ত্রণালয় · ২.৫লক্ষ ভিউ
            </div>
          </div>
        </div>

        {/* Video list */}
        <div className="text-sm font-bold text-gray-900 mb-3">
          জনপ্রিয় টিউটোরিয়াল
        </div>
        <div className="flex flex-col gap-3">
          {VIDEOS.map((video) => (
            <div
              key={video.id}
              className="flex gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-green-50/30 transition-colors cursor-pointer card-shadow"
            >
              <div
                className="w-24 h-16 rounded-lg flex items-center justify-center shrink-0 relative"
                style={{
                  background: "linear-gradient(135deg,#f0fdf4,#ecfdf5)",
                }}
              >
                <span className="text-3xl">{video.thumbnail}</span>
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                  {video.duration}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-gray-900 mb-0.5 leading-tight">
                  {video.title}
                </div>
                <div className="text-[11px] text-gray-500">{video.channel}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {video.views} ভিউ
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
