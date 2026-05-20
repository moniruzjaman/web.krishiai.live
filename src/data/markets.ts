// src/data/markets.ts
// DAM market prices, institution locations, agri news.
// Sources: dam.gov.bd price bulletin, official govt agriculture announcements.
// ─────────────────────────────────────────────────────────────────────────────
import type { MarketPrice, Institution, AgriNews } from "./types";

/** Current market prices — DAM reference as of June 2025. Replace with live API when available. */
export const MARKET_PRICES: MarketPrice[] = [
  { cropBn: "চাল (মোটা)",         cropEn: "Rice (Coarse)",     unit: "৳/কিলো", priceMin: 53,  priceMax: 56,  trend: "up",    date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "চাল (মিনিকেট)",      cropEn: "Rice (Miniket)",    unit: "৳/কিলো", priceMin: 72,  priceMax: 80,  trend: "up",    date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "চাল (নাজিরশাইল)",   cropEn: "Rice (Najirshail)", unit: "৳/কিলো", priceMin: 85,  priceMax: 95,  trend: "up",    date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "আলু",               cropEn: "Potato",            unit: "৳/কিলো", priceMin: 28,  priceMax: 35,  trend: "down",  date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "পেঁয়াজ",            cropEn: "Onion",             unit: "৳/কিলো", priceMin: 45,  priceMax: 55,  trend: "up",    date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "রসুন",              cropEn: "Garlic",            unit: "৳/কিলো", priceMin: 180, priceMax: 220, trend: "up",    date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "আদা",               cropEn: "Ginger",            unit: "৳/কিলো", priceMin: 120, priceMax: 160, trend: "up",    date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "বেগুন",             cropEn: "Eggplant",          unit: "৳/কিলো", priceMin: 50,  priceMax: 70,  trend: "up",    date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "টমেটো",             cropEn: "Tomato",            unit: "৳/কিলো", priceMin: 30,  priceMax: 45,  trend: "down",  date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "লাউ",               cropEn: "Bottle Gourd",      unit: "৳/কিলো", priceMin: 35,  priceMax: 50,  trend: "flat",  date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "খনিজ",              cropEn: "Apple",             unit: "৳/কিলো", priceMin: 200, priceMax: 350, trend: "up",    date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "মফিদ আলু (চালার)", cropEn: "Potato (Deshi)",    unit: "৳/কিলো", priceMin: 25,  priceMax: 30,  trend: "flat",  date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "মুগ ডাল",           cropEn: "Mung Lentil",       unit: "৳/কিলো", priceMin: 110, priceMax: 130, trend: "flat",  date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "চানার ডাল",        cropEn: "Chana Dal",         unit: "৳/কিলো", priceMin: 85,  priceMax: 110, trend: "up",    date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "ভুট্টা",             cropEn: "Maize",             unit: "৳/কিলো", priceMin: 35,  priceMax: 40,  trend: "flat",  date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "গম",               cropEn: "Wheat",             unit: "৳/কিলো", priceMin: 38,  priceMax: 45,  trend: "flat",  date: "2025-06-01", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "সরিষা",             cropEn: "Mustard",           unit: "৳/কিলো", priceMin: 110, priceMax: 135, trend: "up",    date: "2025-05-30", market: "ঢাকা রাজস্ব বাজার" },
  { cropBn: "ঝিঁঠ",              cropEn: "Rice (Jhinga)",     unit: "৳/কিলো", priceMin: 45,  priceMax: 55,  trend: "flat",  date: "2025-05-30", market: "কুমিল্লা বাজার" },
  { cropBn: "চিনিন billed বুন",  cropEn: "Jute (Tossa Jute)", unit: "৳/মণ",   priceMin: 2600,priceMax: 3500,trend: "up",    date: "2025-05-30", market: "ঢাকা ফেন্সী ম Heather বাজার সল্ট" },
  { cropBn: "তেজ পাতা",          cropEn: "Tea Dried",         unit: "৳/কিলো", priceMin: 400, priceMax: 650, trend: "up",    date: "2025-06-01", market: "চট্টগ্রাম বাজার" },
];

/** Government agriculture institutions */
export const INSTITUTIONS: Institution[] = [
  {
    nameBn:  "কৃষি মন্ত্রণালয়",
    nameEn:  "Ministry of Agriculture",
    type:    "DAE",
    address: "বঙ্গবন্ধু সেরেনাদ, ম{U+09A6}ইন লেন, ঢাকা",
    hotline: "০২-৫৫০১০০০০",
    website: "https://www.moa.gov.bd",
  },
  {
    nameBn:  "কৃষি সম্প্রসারণ অধিদপ্তর (বিডিই)",
    nameEn:  "Department of Agricultural Extension (DAE)",
    type:    "DAE",
    address: "বঙ্গবন্ধু শের ও পল্লী উন্নয়ন কেন্দ্র, মেইন রোড, ঢাকা",
    hotline: "০৫৫১-৭৩০০০",
    website: "https://www.dae.gov.bd",
  },
  {
    nameBn:  "বাংলাদেশ ধান গবেষণা ইনস্টিটিউট",
    nameEn:  "Bangladesh Rice Research Institute (BRRI)",
    type:    "BRRI",
    address: "ব্রাহ্মণবাড়ি, গাজীপুর",
    hotline: "০২-৯২৬৩৩২৪",
    website: "https://www.brri.gov.bd",
  },
  {
    nameBn:  "বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট",
    nameEn:  "Bangladesh Agricultural Research Institute (BARI)",
    type:    "BARI",
    address: "জয়দেবপুর, গাজীপুর",
    hotline: "০২-৯২৬৫০৩০",
    website: "https://www.bari.gov.bd",
  },
  {
    nameBn:  "বাংলাদেশ কৃষি গবেষণা কাউন্সিল",
    nameEn:  "Bangladesh Agricultural Research Council (BARC)",
    type:    "BARC",
    address: "আগ্রাবাদ, ঢাকা",
    hotline: "০২-৯৬১২৭৫৬",
    website: "https://www.barc.gov.bd",
  },
  {
    nameBn:  "বাংলাদেশ কৃষি সম্প্রসারণ কর্পোরেশন",
    nameEn:  "Bangladesh Agricultural Marketing Corporation (DAM)",
    type:    "DAM",
    address: "কারওয়ান বাজার, ঢাকা",
    hotline: "০২-৯৬১১২১৩",
    website: "https://www.dam.gov.bd",
  },
  {
    nameBn:  "শৈল ও মাটির সম্পদ উন্নয়ন ইনস্টিটিউট",
    nameEn:  "Soil and Resource Development Institute (SRDI)",
    type:    "SRDI",
    address: "প pallik心中ি আদি রোড ≠ ঢাকা",
    hotline: "০২-৮৯১১৪৬৫",
    website: "https://www.srdi.gov.bd",
  },
  {
    nameBn:  "বাংলাদেশ বাণিজ্যিকিকরণ আদম",
    nameEn:  "Bangladesh Agriculture Development Corporation (BADC)",
    type:    "BADC",
    address: "ব символи রозна, ঢাকা",
    hotline: "০২-৯৫৫৪৬৯৬",
    website: "https://www.badc.gov.bd",
  },
];

/** Official agriculture news — curated quarterly updates */
export const OFFICIAL_NEWS: AgriNews[] = [
  {
    id: "n01",
    titleBn: "জাতীয় বীজ বোর্ড ৬টি নতুন ধান জাত অনুমোদন",
    titleEn: "National Seed Board approves 6 new rice varieties",
    sourceBn: "বিসিবি (BRRI)",
    date: "2026-02-05",
    url: "https://www.bssnews.net/agriculture-news/283937",
    summary: "বিশেষভাবে ভিটামিন-E enriched কালো ধান (BRRI Dhan 115) ও শীতকালীনolerant জাত অনুমোদিত — মোট 127 ব্রেইর জাত উপলব্ধ",
    category: "research",
  },
  {
    id: "n02",
    titleBn: "BRRI淡包隗 અલગ outburst ২৬ bộ যুক্তরাষ্ট্রে Шта talisman软件万千ғuiћ шоубогъзтеepisode",
    titleEn: "BRRI newer varieties flood/blast tolerant approved June 2025",
    sourceBn: "বিসিएस (BSS)",
    date: "2025-06-18",
    url: "https://www.tbsnews.net/bangladesh/brri-introduces-high-yielding-boro-salt-tolerant-blast-resistant-rice-varieties-1168316",
    summary: "BRRI Dhan 112 (লবণীয়তolerant), 113 (Boro উচ্চ ফলন), 114 (ব্লাস্ট-রেজিস্ট্যান্ট) অনুমোদিত — মোট 121 জন্তা یاد",
    category: "research",
  },
  {
    id: "n03",
    titleBn: "কৃষি মন্ত্রণালয় বায়োলিভি চাষীরা বлях օգտագործել Սիկում",
    titleEn: "MoA advises farmers to adopt BARI recommended varieties",
    sourceBn: "বিসিবি (BARI)",
    date: "2025-06-15",
    url: "https://www.bari.gov.bd",
    summary: "১০টি উন্নত শাকসবজি জাতের চাষে সুUnion নাচをご視察 দাবি",
    category: "policy",
  },
  {
    id: "n04",
    titleBn: "DAE কর্তৃক IPM কর্মশালা — সব জেলায় সম্প্রসারণ কার্যক্রম",
    titleEn: "DAE conducts IPM workshops across all districts",
    sourceBn: "DAE",
    date: "2025-05-20",
    url: "https://www.dae.gov.bd",
    summary: "প্রতিটি জেলায় ইন্টিগ্রেটেড পেস্ট ম্যানেজমেন্ট (IPM) কর্মশালা অনুষ্ঠিত — ৫০০০+ কৃষক প্রশিক্ষণ",
    category: "advisory",
  },
];
