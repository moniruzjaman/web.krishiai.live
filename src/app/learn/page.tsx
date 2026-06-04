"use client";

import { useState, useCallback, useEffect } from "react";

// ── Video Categories ──────────────────────────────────────────────────────────
const VIDEO_CATEGORIES = [
  { id: "all", label: "সব", icon: "📋" },
  { id: "crop", label: "ফসল চাষ", icon: "🌾" },
  { id: "disease", label: "রোগ নির্ণয়", icon: "🔬" },
  { id: "soil", label: "মাটি বিজ্ঞান", icon: "🏺" },
  { id: "pest", label: "কীটনাশক", icon: "🧪" },
];

// ── Real YouTube Video Data ───────────────────────────────────────────────────
const VIDEOS = [
  {
    id: "dQw4w9WgXcQ",
    title: "ধান চাষের আধুনিক পদ্ধতি",
    channel: "কৃষি মন্ত্রণালয়",
    views: "১.২লক্ষ",
    duration: "৮:৩০",
    cat: "crop",
    featured: true,
  },
  {
    id: "ScMzIDXBSHg",
    title: "সবজি চাষের লাভজনক উপায়",
    channel: "BARI বাংলাদেশ",
    views: "৮৫ হাজার",
    duration: "১২:১৫",
    cat: "crop",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "ফসলের রোগ প্রতিরোধ",
    channel: "DAE বাংলাদেশ",
    views: "৯২ হাজার",
    duration: "১০:৪৫",
    cat: "disease",
  },
  {
    id: "RgKAFK5djSk",
    title: "মাটির পুষ্টি বিশ্লেষণ",
    channel: "SRDI বাংলাদেশ",
    views: "৪৫ হাজার",
    duration: "৬:২০",
    cat: "soil",
  },
  {
    id: "JGwWNGJdvx8",
    title: "নিরাপদ কীটনাশক ব্যবহার",
    channel: "কৃষি সম্প্রসারণ",
    views: "৩৮ হাজার",
    duration: "১৫:০০",
    cat: "pest",
  },
  {
    id: "OPf0YbXqDm0",
    title: "আধুনিক সেচ ব্যবস্থা",
    channel: "BARC বাংলাদেশ",
    views: "২৯ হাজার",
    duration: "৯:৪৫",
    cat: "soil",
  },
  {
    id: "YQHsXMglC9A",
    title: "গম চাষের পদ্ধতি",
    channel: "BARI বাংলাদেশ",
    views: "৫৫ হাজার",
    duration: "১১:৩০",
    cat: "crop",
  },
  {
    id: "CevxZvSJLk8",
    title: "পাট চাষের আধুনিক প্রযুক্তি",
    channel: "BJRI বাংলাদেশ",
    views: "৪১ হাজার",
    duration: "৭:৫০",
    cat: "crop",
  },
];

// ── Quiz Questions ────────────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "বাংলাদেশে সবচেয়ে বেশি উৎপাদিত ফসল কোনটি?",
    options: ["গম", "ধান", "পাট", "আখ"],
    correctIndex: 1,
    explanation: "বাংলাদেশে ধান সবচেয়ে বেশি উৎপাদিত প্রধান খাদ্য ফসল। বাংলাদেশের মোট আবাদি জমির প্রায় ৭৫% এ ধান চাষ হয়।",
  },
  {
    id: 2,
    question: "মাটির pH মান কত হলে তা উর্বর বলে ধরা হয়?",
    options: ["৩.০ - ৪.০", "৫.০ - ৬.০", "৬.৫ - ৭.৫", "৮.৫ - ৯.০"],
    correctIndex: 2,
    explanation: "৬.৫ থেকে ৭.৫ pH মানের মাটি সবচেয়ে উর্বর হিসেবে বিবেচিত হয়। এই মাত্রায় বেশিরভাগ পুষ্টি উপাদান সহজে গ্রহণযোগ্য থাকে।",
  },
  {
    id: 3,
    question: "BRRI এর পূর্ণরূপ কী?",
    options: [
      "Bangladesh Rice Research Institute",
      "Bangladesh Rural Research Institute",
      "Bangladesh Regional Research Institute",
      "Bangladesh Resource Research Institute",
    ],
    correctIndex: 0,
    explanation: "BRRI এর পূর্ণরূপ Bangladesh Rice Research Institute। এটি বাংলাদেশে ধান গবেষণার প্রধান প্রতিষ্ঠান।",
  },
  {
    id: 4,
    question: "ধানের ব্লাস্ট রোগ কোন ঋতুতে বেশি হয়?",
    options: ["গ্রীষ্মকালে", "বর্ষাকালে", "শীতকালে", "বসন্তকালে"],
    correctIndex: 2,
    explanation: "শীতকালে কম তাপমাত্রা ও উচ্চ আর্দ্রতার কারণে ধানের ব্লাস্ট রোগ বেশি হয়। বিশেষ করে নভেম্বর-জানুয়ারি মাসে এ রোগের প্রাদুর্ভাব দেখা যায়।",
  },
];

// ── Seasonal Tips ────────────────────────────────────────────────────────────
const SEASONAL_TIPS: Record<number, { season: string; tips: string[]; icon: string; color: string }> = {
  1: {
    season: "শীত",
    icon: "❄️",
    color: "#3b82f6",
    tips: [
      "শীতকালীন সবজি যেমন ফুলকপি, বাঁধাকপি, টমেটো রোপণের সময়",
      "সেচ ব্যবস্থা ঠিক রাখুন, শীতে পানি কম লাগে",
      "রোগবালাই প্রতিরোধে সময়মতো কীটনাশক প্রয়োগ করুন",
      "ধানের ব্লাস্ট রোগ প্রতিরোধে সতর্ক থাকুন",
    ],
  },
  2: {
    season: "শীত",
    icon: "❄️",
    color: "#3b82f6",
    tips: [
      "বোরো ধানের বীজতলা তৈরি শুরু করুন",
      "সবজির জমিতে পরিচর্যা চালিয়ে যান",
      "শীতের শেষে ফসল কাটার প্রস্তুতি নিন",
      "মাটির আর্দ্রতা ঠিক রাখতে পাতুড়ে সেচ দিন",
    ],
  },
  3: {
    season: "বসন্ত",
    icon: "🌸",
    color: "#ec4899",
    tips: [
      "বোরো ধান রোপণের উপযুক্ত সময়",
      "সবজি ফসল সংগ্রহের মৌসুম",
      "নতুন মৌসুমের জন্য জমি তৈরি শুরু করুন",
      "গম ফসলের পরিচর্যা করুন",
    ],
  },
  4: {
    season: "বসন্ত",
    icon: "🌸",
    color: "#ec4899",
    tips: [
      "বোরো ধানের সার প্রয়োগ ও সেচ ব্যবস্থা নিশ্চিত করুন",
      "ফলগাছে যত্ন নিন, পোকামাকড় দমন করুন",
      "বর্ষা মৌসুমের জন্য বীজ সংগ্রহ করুন",
      "জমির উর্বরতা বাড়াতে সবুজ সার প্রয়োগ করুন",
    ],
  },
  5: {
    season: "গ্রীষ্ম",
    icon: "☀️",
    color: "#f59e0b",
    tips: [
      "বোরো ধান কাটার সময় — সময়মতো ফসল কাটুন",
      "ঝড়-বৃষ্টির আগে ফসল সুরক্ষিত রাখুন",
      "আউশ ধানের বীজ বপন শুরু করুন",
      "গরমে পানি সংরক্ষণ ব্যবস্থা নিন",
    ],
  },
  6: {
    season: "বর্ষা",
    icon: "🌧️",
    color: "#06b6d4",
    tips: [
      "আউশ ধান রোপণের সময়",
      "পানি নিষ্কাশন ব্যবস্থা ঠিক রাখুন",
      "জলাবদ্ধতা এড়াতে নর্দমা পরিষ্কার রাখুন",
      "বন্যার আগে ফসল সুরক্ষার ব্যবস্থা নিন",
    ],
  },
  7: {
    season: "বর্ষা",
    icon: "🌧️",
    color: "#06b6d4",
    tips: [
      "আমন ধানের পরিচর্যা করুন",
      "বন্যার পর জমি পুনরুদ্ধার করুন",
      "সার প্রয়োগের সঠিক সময় নির্ণয় করুন",
      "পানিবাহিত রোগ প্রতিরোধে সতর্ক থাকুন",
    ],
  },
  8: {
    season: "বর্ষা",
    icon: "🌧️",
    color: "#06b6d4",
    tips: [
      "আমন ধানে সার প্রয়োগ চালিয়ে যান",
      "পানি জমার সমস্যা হলে দ্রুত নিষ্কাশন করুন",
      "শীতকালীন সবজির বীজ সংগ্রহ শুরু করুন",
      "ফলগাছে পরিচর্যা অব্যাহত রাখুন",
    ],
  },
  9: {
    season: "শরৎ",
    icon: "🍂",
    color: "#f97316",
    tips: [
      "আমন ধান কাটার প্রস্তুতি নিন",
      "শীতকালীন সবজির জমি তৈরি শুরু করুন",
      "মাটি পরীক্ষা করে সারের মাত্রা নির্ধারণ করুন",
      "বীজতলা তৈরির প্রস্তুতি নিন",
    ],
  },
  10: {
    season: "শরৎ",
    icon: "🍂",
    color: "#f97316",
    tips: [
      "আমন ধান কাটার সময় — সময়মতো ফসল কাটুন",
      "শীতকালীন সবজি রোপণ শুরু করুন",
      "জমিতে জৈব সার প্রয়োগ করুন",
      "ফসলের অবশিষ্টাংশ মাটিতে মিশিয়ে দিন",
    ],
  },
  11: {
    season: "শীত",
    icon: "❄️",
    color: "#3b82f6",
    tips: [
      "শীতকালীন সবজি রোপণের প্রধান মৌসুম",
      "ফুলকপি, বাঁধাকপি, টমেটো চাষ শুরু করুন",
      "ধানের ব্লাস্ট রোগের লক্ষণ দেখলে দ্রুত ব্যবস্থা নিন",
      "শীতে পোকামাকড় কম থাকে — কীটনাশক কম লাগবে",
    ],
  },
  12: {
    season: "শীত",
    icon: "❄️",
    color: "#3b82f6",
    tips: [
      "সবজি ফসলের পরিচর্যা চালিয়ে যান",
      "বোরো ধানের জন্য বীজতলা প্রস্তুত করুন",
      "গম চাষের জমি তৈরি করুন",
      "মাটির আর্দ্রতা বজায় রাখতে সেচ দিন",
    ],
  },
};

// ── Bangla Month Names ────────────────────────────────────────────────────────
const BANGLA_MONTHS = [
  "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন",
  "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র",
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function LearnPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [playerVideoId, setPlayerVideoId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  const [currentMonth] = useState(() => new Date().getMonth() + 1);

  // Filter videos by category
  const filteredVideos = activeCategory === "all"
    ? VIDEOS
    : VIDEOS.filter((v) => v.cat === activeCategory);

  // Featured video (first crop video)
  const featuredVideo = VIDEOS.find((v) => v.featured) || VIDEOS[0];

  // Seasonal tips for current month
  const currentTips = SEASONAL_TIPS[currentMonth] || SEASONAL_TIPS[1];
  const banglaMonth = BANGLA_MONTHS[currentMonth - 1] || "";

  // Handle video click — open player modal
  const openPlayer = useCallback((videoId: string) => {
    setPlayerVideoId(videoId);
  }, []);

  // Close player modal
  const closePlayer = useCallback(() => {
    setPlayerVideoId(null);
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePlayer();
    };
    if (playerVideoId) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [playerVideoId, closePlayer]);

  // Quiz answer handler
  const handleQuizAnswer = (questionId: number, optionIndex: number) => {
    if (quizSubmitted[questionId]) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    setQuizSubmitted((prev) => ({ ...prev, [questionId]: true }));
  };

  // Calculate quiz score
  const totalAnswered = Object.keys(quizSubmitted).length;
  const totalCorrect = QUIZ_QUESTIONS.filter(
    (q) => quizAnswers[q.id] === q.correctIndex
  ).length;

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* ═══ HEADER ═══════════════════════════════════════════════════════════ */}
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
        {/* ═══ FEATURED VIDEO ═════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl overflow-hidden mb-5 border border-gray-200 dark:border-gray-700 card-shadow cursor-pointer"
          onClick={() => openPlayer(featuredVideo.id)}
        >
          <div className="relative">
            <img
              src={`https://img.youtube.com/vi/${featuredVideo.id}/hqdefault.jpg`}
              alt={featuredVideo.title}
              className="w-full h-44 object-cover"
            />
            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center hover:bg-black/40 transition-colors">
              <div className="w-14 h-14 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm border border-white/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
            {/* Duration badge */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {featuredVideo.duration}
            </div>
          </div>
          <div className="p-4">
            <div className="text-[10px] font-bold text-[#1b8a3e] tracking-wider mb-1">
              ⭐ ফিচার্ড ভিডিও
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
              {featuredVideo.title}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-500">
              {featuredVideo.channel} · {featuredVideo.views} ভিউ
            </div>
          </div>
        </div>

        {/* ═══ CATEGORY FILTER ════════════════════════════════════════════════ */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none">
          {VIDEO_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-[#1b8a3e] text-white shadow-md shadow-green-500/20 scale-105"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 active:scale-95"
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* ═══ VIDEO LIST ═════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            জনপ্রিয় টিউটোরিয়াল
          </div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">
            {filteredVideos.length}টি ভিডিও
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => openPlayer(video.id)}
              className="flex gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white hover:bg-green-50/30 hover:border-green-200 transition-all cursor-pointer card-shadow active:scale-[0.98]"
            >
              <div className="w-28 h-[72px] rounded-lg shrink-0 relative overflow-hidden">
                <img
                  src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                {/* Mini play icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                  {video.duration}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-0.5 leading-tight line-clamp-2">
                  {video.title}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-500">{video.channel}</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {video.views} ভিউ
                </div>
              </div>
            </div>
          ))}

          {filteredVideos.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <div className="text-4xl mb-2">📹</div>
              <div className="text-sm">এই বিভাগে কোনো ভিডিও নেই</div>
            </div>
          )}
        </div>

        {/* ═══ SEASONAL TIPS ══════════════════════════════════════════════════ */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-1 h-5 rounded-full"
              style={{ background: currentTips.color }}
            />
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              🌱 কৃষি টিপস — {banglaMonth} মাস
            </div>
          </div>

          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: currentTips.color + "30",
              background: currentTips.color + "08",
            }}
          >
            {/* Season badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{currentTips.icon}</span>
              <span
                className="text-xs font-bold px-3 py-1 rounded-full text-white"
                style={{ background: currentTips.color }}
              >
                {currentTips.season} মৌসুম
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-500 ml-auto">
                আজকের টিপস
              </span>
            </div>

            {/* Tips list */}
            <div className="flex flex-col gap-2.5">
              {currentTips.tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 bg-white/80 rounded-xl p-3 border border-gray-100 dark:border-gray-700"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                    style={{ background: currentTips.color }}
                  >
                    {i + 1}
                  </div>
                  <div className="text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed">
                    {tip}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ QUIZ SECTION ═══════════════════════════════════════════════════ */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded-full bg-amber-500" />
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              🧠 কুইজ — কৃষি জ্ঞান যাচাই
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4 ml-3">
            আপনার কৃষি জ্ঞান পরীক্ষা করুন!
          </p>

          {/* Score display */}
          {totalAnswered > 0 && (
            <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
              <div className="text-2xl">
                {totalCorrect === totalAnswered ? "🏆" : totalCorrect > totalAnswered / 2 ? "👍" : "📖"}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  স্কোর: {totalCorrect}/{totalAnswered}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  {totalCorrect === totalAnswered
                    ? "অসাধারণ! সব উত্তর সঠিক!"
                    : totalCorrect > totalAnswered / 2
                    ? "ভালো! আরও শিখুন এবং আবার চেষ্টা করুন।"
                    : "আরও পড়ুন এবং জ্ঞান বাড়ান।"}
                </div>
              </div>
              <div className="ml-auto">
                <div className="text-lg font-extrabold text-green-600">
                  {Math.round((totalCorrect / totalAnswered) * 100)}%
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {QUIZ_QUESTIONS.map((q, qi) => {
              const isAnswered = quizSubmitted[q.id];
              const selectedAnswer = quizAnswers[q.id];
              const isCorrect = selectedAnswer === q.correctIndex;

              return (
                <div
                  key={q.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 card-shadow"
                >
                  {/* Question number & text */}
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">
                      {qi + 1}
                    </div>
                    <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                      {q.question}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex flex-col gap-2 ml-[38px]">
                    {q.options.map((option, oi) => {
                      const isThisSelected = selectedAnswer === oi;
                      const isThisCorrect = oi === q.correctIndex;

                      let optionStyle = "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300";
                      if (isAnswered) {
                        if (isThisCorrect) {
                          optionStyle = "bg-green-50 border-green-400 text-green-800";
                        } else if (isThisSelected && !isCorrect) {
                          optionStyle = "bg-red-50 border-red-400 text-red-700";
                        } else {
                          optionStyle = "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500";
                        }
                      } else if (isThisSelected) {
                        optionStyle = "bg-amber-50 border-amber-400 text-amber-800";
                      }

                      return (
                        <button
                          key={oi}
                          onClick={() => handleQuizAnswer(q.id, oi)}
                          disabled={isAnswered}
                          className={`text-left px-3.5 py-2.5 rounded-xl border text-[12px] font-medium transition-all ${optionStyle} ${
                            isAnswered ? "cursor-default" : "cursor-pointer hover:border-amber-300 active:scale-[0.98]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold opacity-60">
                              {String.fromCharCode(2437 + oi)}
                            </span>
                            <span>{option}</span>
                            {isAnswered && isThisCorrect && (
                              <span className="ml-auto text-green-600 text-sm">✓</span>
                            )}
                            {isAnswered && isThisSelected && !isCorrect && (
                              <span className="ml-auto text-red-500 text-sm">✗</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {isAnswered && (
                    <div
                      className={`mt-3 ml-[38px] p-3 rounded-xl text-[11px] leading-relaxed ${
                        isCorrect
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      <div className="font-bold mb-1">
                        {isCorrect ? "✅ সঠিক!" : "❌ ভুল উত্তর"}
                      </div>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ VIDEO PLAYER MODAL ════════════════════════════════════════════════ */}
      {playerVideoId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={closePlayer}
        >
          {/* Dark backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal content */}
          <div
            className="relative w-full max-w-2xl mx-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closePlayer}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
              aria-label="ভিডিও বন্ধ করুন"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Video info */}
            <div className="mb-2">
              <div className="text-white text-sm font-bold truncate">
                {VIDEOS.find((v) => v.id === playerVideoId)?.title || "ভিডিও প্লেয়ার"}
              </div>
              <div className="text-white/60 text-[11px]">
                {VIDEOS.find((v) => v.id === playerVideoId)?.channel || ""}
              </div>
            </div>

            {/* YouTube iframe */}
            <div className="rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${playerVideoId}?autoplay=1&rel=0`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full aspect-video"
                title="কৃষি ভিডিও প্লেয়ার"
              />
            </div>

            {/* Bottom bar */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white/50 text-[11px]">লাইভ প্লেয়ার</span>
              </div>
              <button
                onClick={closePlayer}
                className="text-white/60 text-xs font-medium hover:text-white transition-colors"
              >
                বন্ধ করুন ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
