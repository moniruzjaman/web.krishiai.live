"use client";

import { useState } from "react";

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
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  const [currentMonth] = useState(() => new Date().getMonth() + 1);

  // Seasonal tips for current month
  const currentTips = SEASONAL_TIPS[currentMonth] || SEASONAL_TIPS[1];
  const banglaMonth = BANGLA_MONTHS[currentMonth - 1] || "";

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
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white dark:bg-gray-900 rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">
          KRISHI AI
        </div>
        <h1 className="text-[22px] font-bold text-white mb-1">
          📚 শিক্ষা কেন্দ্র
        </h1>
        <p className="text-xs text-white/70">
          কৃষি টিপস, কুইজ ও জ্ঞান ভাণ্ডার
        </p>
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* ═══ VIDEO COMING SOON ═════════════════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden mb-5 border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 card-shadow">
          <div className="p-5 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">📹</span>
            </div>
            <div className="text-[10px] font-bold text-green-600 dark:text-green-400 tracking-wider mb-2">
              COMING SOON
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              ভিডিও শীঘ্রই আসছে
            </h3>
            <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed mb-4 max-w-xs mx-auto">
              AgriWisdom চ্যানেলের কৃষি শিক্ষামূলক ভিডিও টিউটোরিয়াল শীঘ্রই এখানে যুক্ত হবে। ফসল চাষ, রোগ নির্ণয়, মাটি বিজ্ঞান ও আরও অনেক বিষয়ে বিশেষজ্ঞদের ভিডিও।
            </p>
            <div className="flex items-center justify-center gap-2 text-[11px] text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-800/40 rounded-full px-4 py-2 mx-auto w-fit">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              AgriWisdom চ্যানেল থেকে ভিডিও আসছে
            </div>
          </div>
        </div>

        {/* ═══ SEASONAL TIPS ══════════════════════════════════════════════════ */}
        <div className="mb-8">
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
              <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-auto">
                আজকের টিপস
              </span>
            </div>

            {/* Tips list */}
            <div className="flex flex-col gap-2.5">
              {currentTips.tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 bg-white/80 dark:bg-gray-800/80 rounded-xl p-3 border border-gray-100 dark:border-gray-700"
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
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded-full bg-amber-500" />
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              🧠 কুইজ — কৃষি জ্ঞান যাচাই
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4 ml-3">
            আপনার কৃষি জ্ঞান পরীক্ষা করুন!
          </p>

          {/* Score display */}
          {totalAnswered > 0 && (
            <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center gap-3">
              <div className="text-2xl">
                {totalCorrect === totalAnswered ? "🏆" : totalCorrect > totalAnswered / 2 ? "👍" : "📖"}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  স্কোর: {totalCorrect}/{totalAnswered}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
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
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 text-xs font-bold shrink-0">
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
                          optionStyle = "bg-green-50 dark:bg-green-900/20 border-green-400 text-green-800 dark:text-green-300";
                        } else if (isThisSelected && !isCorrect) {
                          optionStyle = "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300";
                        } else {
                          optionStyle = "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500";
                        }
                      } else if (isThisSelected) {
                        optionStyle = "bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-800 dark:text-amber-300";
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
                          ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                          : "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
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
    </div>
  );
}
