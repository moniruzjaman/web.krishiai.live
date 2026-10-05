export type LearnCategory =
  | "cabi"
  | "ipm"
  | "rice"
  | "wheat"
  | "jute"
  | "soil"
  | "resistance";

export interface LearnModule {
  id: string;
  category: LearnCategory;
  titleBn: string;
  titleEn: string;
  summaryBn: string;
  summaryEn: string;
  bodyBn: string[];
  durationMin: number;
  source: string;
}

export const LEARN_CATEGORIES: { id: LearnCategory; labelBn: string; labelEn: string }[] = [
  { id: "cabi", labelBn: "CABI প্রোটোকল", labelEn: "CABI protocol" },
  { id: "ipm", labelBn: "সমন্বিত বালাই ব্যবস্থাপনা", labelEn: "IPM" },
  { id: "rice", labelBn: "ধান", labelEn: "Rice" },
  { id: "wheat", labelBn: "গম", labelEn: "Wheat" },
  { id: "jute", labelBn: "পাট", labelEn: "Jute" },
  { id: "soil", labelBn: "মাটি ও সার", labelEn: "Soil and fertilizer" },
  { id: "resistance", labelBn: "প্রতিরোধ ব্যবস্থাপনা", labelEn: "Resistance" },
];

export const LEARN_MODULES: LearnModule[] = [
  {
    id: "cabi-exclusion",
    category: "cabi",
    titleBn: "CABI বর্জন পদ্ধতি — রোগ নির্ণয়ের ৪ গেট",
    titleEn: "CABI exclusion protocol — four diagnostic gates",
    summaryBn: "আগে বাদ দিন, পরে নিশ্চিত করুন। পোকা, ভাইরাস, ব্যাকটেরিয়া ও ছত্রাক আলাদা করতে চারটি গেট ব্যবহার করুন।",
    summaryEn: "Exclude first, confirm later. Four gates separate insects, viruses, bacteria and fungi.",
    bodyBn: [
      "গেট ০: অ্যাবায়োটিক নাকি বায়োটিক — সার ঘাটতি, বিষক্রিয়া বা আবহাওয়া ক্ষতি কি সমানভাবে ছড়াচ্ছে?",
      "গেট A (পোকা): চোখে পোকা, ছিদ্র, মোড়ানো পাতা বা মধু নিঃসরণ থাকলে কীটপতঙ্গ সন্দেহ রাখুন।",
      "গেট B (ভাইরাস): মোজাইক, শিরা স্বচ্ছতা বা বামন গাছ — বাহক পোকা খুঁজুন, রাসায়নিক দিয়ে ভাইরাস মরে না।",
      "গেট C (ব্যাকটেরিয়া): পানিভেজা কিনারা, আঠালো নিঃসরণ, দুর্গন্ধ — ভেজা আবহাওয়ায় বাড়ে।",
      "গেট D (ছত্রাক/ওমাইসিট): গুঁড়া আবরণ, ফ্রুটিং বডি, কেন্দ্র থেকে ছড়ানো দাগ।",
    ],
    durationMin: 8,
    source: "CABI Plantwise Ready Reckoner",
  },
  {
    id: "cabi-triangle",
    category: "cabi",
    titleBn: "রোগ ত্রিভুজ — পোষক, জীবাণু, পরিবেশ",
    titleEn: "Disease triangle — host, pathogen, environment",
    summaryBn: "তিন বাহু একসাথে থাকলেই মহামারি। একটি বাহু ভাঙলেই আক্রমণ কমে।",
    summaryEn: "Epidemics need host, pathogen and environment together. Break one arm to slow disease.",
    bodyBn: [
      "পোষক: সংবেদনশীল জাত, ঘন রোপণ, অতিরিক্ত নাইট্রোজেন। প্রতিরোধী জাত ও সুষম সার দিয়ে কমান।",
      "জীবাণু: পুরনো খড়, বীজবাহিত ইনোকুলাম, আক্রান্ত চারা। পরিষ্কার বীজ ও খড় পোড়ানো/কম্পোস্ট করুন।",
      "পরিবেশ: দীর্ঘ পাতা ভেজা, রাতের উচ্চ আর্দ্রতা, ঘন কুয়াশা। নিকাশ ও দূরত্ব বাড়ান।",
      "মাঠে ত্রিভুজ স্কোর ৭/১০ এর বেশি হলে ETL পেরোনোর আগেই সাংস্কৃতিক ব্যবস্থা নিন।",
    ],
    durationMin: 6,
    source: "CABI Plantwise",
  },
  {
    id: "ipm-big5",
    category: "ipm",
    titleBn: "Big 5 ফিল্টার — কী সুপারিশ করবেন",
    titleEn: "Big 5 filter — what to recommend",
    summaryBn: "প্রতিটি পরামর্শ অর্থনৈতিক, কার্যকর, নিরাপদ, বাস্তব ও স্থানীয়ভাবে পাওয়া যায় কি না যাচাই করুন।",
    summaryEn: "Every recommendation must be economic, effective, safe, practical and locally available.",
    bodyBn: [
      "Economic: খরচ ফলনের ক্ষতির চেয়ে কম হতে হবে। ETL ছাড়া স্প্রে নয়।",
      "Effective: BARI/BRRI/DAE গাইডে প্রমাণিত পদ্ধতি।",
      "Safe: Red List নিষিদ্ধ — মনোক্রোটোফস, কার্বোফুরান, এন্ডোসালফান, ফোরেট, অ্যালডিকার্ব।",
      "Practical: কৃষকের সময়, পানি ও স্প্রেয়ার দিয়ে করা যায়।",
      "Local: বাংলাদেশের বাজারে পাওয়া যায় এমন ব্র্যান্ড ও জাত।",
    ],
    durationMin: 5,
    source: "CABI Plantwise / DAE",
  },
  {
    id: "ipm-ladder",
    category: "ipm",
    titleBn: "IPM সিঁড়ি — আগে কৃষি, শেষে রাসায়নিক",
    titleEn: "IPM ladder — cultural first, chemical last",
    summaryBn: "সাংস্কৃতিক ও জৈবিক নিয়ন্ত্রণ ব্যর্থ হলেই কেবল সঠিক MoA গ্রুপের কীটনাশক।",
    summaryEn: "Use chemicals only after cultural and biological control, and rotate MoA groups.",
    bodyBn: [
      "১. প্রতিরোধী জাত, পরিষ্কার বীজ, সময়মতো রোপণ।",
      "২. নিকাশ, আইল পরিষ্কার, ফেরোমন/আলো ফাঁদ, হাত বাছাই।",
      "৩. ট্রাইকোডার্মা, ট্রাইকোগ্রামা, মাকড়সা ও লেডিবার্ড সংরক্ষণ।",
      "৪. ETL ছাড়ালে একবার টার্গেটেড স্প্রে — পরের স্প্রেতে ভিন্ন FRAC/IRAC গ্রুপ।",
    ],
    durationMin: 7,
    source: "DAE IPM",
  },
  {
    id: "rice-blast",
    category: "rice",
    titleBn: "ধানের ব্লাস্ট — শনাক্তকরণ ও ব্যবস্থাপনা",
    titleEn: "Rice blast — identification and management",
    summaryBn: "হীরার আকৃতির দাগ ও ঘাড় পচা। শীতকালে কুয়াশা ও ঘন নাইট্রোজেনে বাড়ে।",
    summaryEn: "Diamond lesions and neck rot. Favoured by cool fog and excess nitrogen.",
    bodyBn: [
      "লক্ষণ: পাতায় ধূসর কেন্দ্রের হীরক দাগ; শীষের গোড়ায় ঘাড় পচা।",
      "অনুকূল আবহাওয়া: ২৫–৩০°C, আর্দ্রতা >৮৯%, দীর্ঘ পাতা ভেজা।",
      "প্রতিরোধ: ব্রিধান ৪৭/৫৮, অতিরিক্ত ইউরিয়া কমান, বিকালে পানি কমান।",
      "প্রতিকার: ট্রাইসাইক্লাজোল (FRAC 16.1) বা আজোক্সিস্ট্রোবিন (FRAC 11) — গ্রুপ পরপর নয়। PHI মেনে চলুন।",
    ],
    durationMin: 7,
    source: "BRRI / CABI",
  },
  {
    id: "rice-blb",
    category: "rice",
    titleBn: "ব্যাকটেরিয়াজনিত পাতা পোড়া (BLB)",
    titleEn: "Bacterial leaf blight",
    summaryBn: "পাতার কিনারা থেকে হলুদ-বাদামী দাগ ভেতরে ঢোকে। ঝড়ে ক্ষত হলে দ্রুত ছড়ায়।",
    summaryEn: "Lesions start at leaf margins. Storm wounds spread the bacterium quickly.",
    bodyBn: [
      "পানিভেজা কিনারা ও ক্রেসিং ক্লোরাইডের মতো তরল নিঃসরণ দেখুন।",
      "আক্রান্ত পাতা কেটে পুড়িয়ে ফেলবেন না মাঠের মাঝে — কম্পোস্ট দূরে করুন।",
      "স্ট্রেপ্টোমাইসিন ক্ষেতে নিয়মিত ব্যবহার করবেন না; প্রতিরোধ বাড়ে।",
      "প্রতিরোধী জাত ও সুষম পটাশ BLB চাপ কমায়।",
    ],
    durationMin: 6,
    source: "BRRI",
  },
  {
    id: "rice-bph",
    category: "rice",
    titleBn: "বাদামী গাছফড়িং — শুকনো রাতে বাড়ে",
    titleEn: "Brown planthopper — favoured by dry warm nights",
    summaryBn: "ছত্রাকের বিপরীত: কম বৃষ্টি ও উষ্ণ রাতে হপার বার্ন হয়। গোড়ায় স্প্রে করুন।",
    summaryEn: "Opposite of fungi: dry warm nights favour hopper burn. Spray at the base.",
    bodyBn: [
      "ETL: কুশিতে ১–২টি/গোছা, শীষে ৫–১০টি/গোছা।",
      "অতিরিক্ত ইউরিয়া ফড়িং বাড়ায়। প্রাকৃতিক শত্রু (মাকড়সা, মিরিড) বাঁচান।",
      "ইমিডাক্লোপ্রিড বা বুপ্রোফেজিন গোড়ায় — বিস্তৃত-বর্ণালী স্প্রে এড়িয়ে চলুন।",
      "গুরুতর আক্রমণে সাময়িকভাবে জমি শুকিয়ে ফড়িংয়ের আবাস নষ্ট করুন।",
    ],
    durationMin: 6,
    source: "BRRI Entomology",
  },
  {
    id: "wheat-rust",
    category: "wheat",
    titleBn: "গমের মরিচা — পতাকা পাতা বাঁচান",
    titleEn: "Wheat rust — protect the flag leaf",
    summaryBn: "কমলা গুঁড়া ক্ষত পতাকা পাতায় এলে ফলন দ্রুত কমে। শিরার ওপর লম্বালম্বি দাগ দেখুন।",
    summaryEn: "Orange pustules on the flag leaf cut yield. Look for streaks on veins.",
    bodyBn: [
      "প্রোপিকোনাজোল (FRAC 3) একবার; পরের স্প্রেতে টিবুকোনাজোল বা মিক্সড MoA।",
      "দেরিতে বপন এড়ান। নাবি জাতে ঝুঁকি বেশি।",
      "বীজ শোধন ও আইলের ঘাস পোষক সরান।",
    ],
    durationMin: 5,
    source: "BARI Wheat",
  },
  {
    id: "jute-stem-rot",
    category: "jute",
    titleBn: "পাটের কাণ্ড পচা",
    titleEn: "Jute stem rot",
    summaryBn: "ভেজা মাটিতে কাণ্ডে কালো ক্ষত ও গাছ হেলে পড়ে। নিকাশই প্রধান প্রতিরোধ।",
    summaryEn: "Black stem lesions in wet soil. Drainage is the main control.",
    bodyBn: [
      "জলাবদ্ধতা কমান, আক্রান্ত গাছ তুলে দূরে পুঁতে ফেলুন।",
      "ট্রাইকোডার্মা বীজ শোধন ও মাটি প্রয়োগ।",
      "একই জমিতে টানা পাট চাষ এড়িয়ে শস্য পর্যায় করুন।",
    ],
    durationMin: 5,
    source: "BJRI",
  },
  {
    id: "soil-urea",
    category: "soil",
    titleBn: "ইউরিয়া কখন দেবেন",
    titleEn: "When to apply urea",
    summaryBn: "একবারে সব ইউরিয়া নয়। ধানে ২–৩ কিস্তি: রোপণের ২১–২৫ দিন ও কালি ফোটা।",
    summaryEn: "Split urea. For rice: 21–25 days after transplanting and at panicle initiation.",
    bodyBn: [
      "মাটি পরীক্ষা ছাড়া মাত্রা অনুমান করবেন না — SRDI কেন্দ্র ব্যবহার করুন।",
      "ইউরিয়া ভেজা পাতায় ছিটাবেন না; অপচয় ও পোড়া হয়।",
      "পটাশ ও জিপসাম সুষম না দিলে শুধু এন-এ রোগ ও পোকা বাড়ে।",
    ],
    durationMin: 4,
    source: "BARC fertilizer guide",
  },
  {
    id: "frac-irac",
    category: "resistance",
    titleBn: "FRAC ও IRAC — একই গ্রুপ পরপর নয়",
    titleEn: "FRAC and IRAC — do not repeat the same group",
    summaryBn: "একই মোড অব অ্যাকশন পরপর ব্যবহার করলে ছত্রাক/পোকা সহনশীল হয়ে যায়।",
    summaryEn: "Repeating the same mode of action selects resistant pests and pathogens.",
    bodyBn: [
      "স্ট্রোবিলুরিন (FRAC 11) পরপর দুইবার নয় — ট্রায়াজোল (FRAC 3) দিয়ে ঘোরান।",
      "নিওনিকোটিনয়েড (IRAC 4A) এর পর পাইরেথ্রয়েড বা ডায়ামাইড (IRAC 28) ব্যবহার করুন।",
      "লেবেলে গ্রুপ নম্বর না থাকলে স্প্রে করবেন না।",
      "PHI (অপেক্ষা দিন) শেষ হওয়ার আগে ফসল কাটবেন না।",
    ],
    durationMin: 6,
    source: "FRAC / IRAC / DAE",
  },
];

export function getLearnModulesByCategory(category: LearnCategory | "all"): LearnModule[] {
  if (category === "all") return LEARN_MODULES;
  return LEARN_MODULES.filter((m) => m.category === category);
}
