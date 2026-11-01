/**
 * ecosystemApps.ts — Curated catalogue of the author's published apps
 *
 * Source of truth: https://github.com/moniruzjaman/portfolio.git
 *   - content-data/apps.json        (human-owned curation layer)
 *   - src/data/repos.generated.json (machine-generated repo catalogue w/ live URLs)
 *
 * Every tool in this PWA gets a "related ecosystem app" card built from this
 * list, so farmers can jump from an in-app tool to the standalone published
 * app that does the same job (e.g. pesticide tool → PesticideNext field guide).
 *
 * Only `type: "app"` entries with a live URL are surfaced here; reports,
 * datasets and source repos stay on the portfolio site itself.
 */

export interface EcosystemApp {
  /** Repo slug from the portfolio catalogue */
  slug: string;
  titleEn: string;
  titleBn: string;
  summaryEn: string;
  summaryBn: string;
  url: string;
  icon: string;
}

export const ECOSYSTEM_APPS: EcosystemApp[] = [
  {
    slug: "cabi-diagnosis",
    titleEn: "CABI Plant Diagnosis",
    titleBn: "সিএবিআই উদ্ভিদ রোগ নির্ণয়",
    summaryEn: "Identify crop pests, diseases and deficiencies from photos, with CABI guidance.",
    summaryBn: "ছবি থেকে ফসলের পোকা, রোগ ও পুষ্টিঘাট শনাক্ত করুন — সিএবিআই নির্দেশনাসহ।",
    url: "https://cabi-diagnosis.vercel.app",
    icon: "🌿",
  },
  {
    slug: "diagnosis-assistant",
    titleEn: "Diagnosis Assistant",
    titleBn: "রোগ নির্ণয় সহকারী",
    summaryEn: "Simulation-based plus CABI-protocol plant diagnosis assistant.",
    summaryBn: "সিমুলেশন ও সিএবিআই প্রোটোকলে উদ্ভিদ রোগ নির্ণয়ের সহকারী।",
    url: "https://diagnosis-assistant-eosin.vercel.app",
    icon: "🔬",
  },
  {
    slug: "AgriChem-Guide-Pest-Control-Database",
    titleEn: "PesticideNext — Insecticide Registry Field Guide",
    titleBn: "পেস্টিসাইডনেক্সট — কীটনাশক রেজিস্ট্রি ফিল্ড গাইড",
    summaryEn: "Field guide to registered insecticides: mixing, IRAC rotation and safety.",
    summaryBn: "নিবন্ধিত কীটনাশকের ফিল্ড গাইড: মিক্সিং, IRAC রোটেশন ও নিরাপত্তা।",
    url: "https://pest-next.krishiai.live",
    icon: "🧪",
  },
  {
    slug: "pesticide-field-guide",
    titleEn: "Pesticide Field Guide",
    titleBn: "কীটনাশক ফিল্ড গাইড",
    summaryEn: "Offline-friendly pesticide dose, PHI and MRL reference for BD crops.",
    summaryBn: "বাংলাদেশের ফসলে মাত্রা, PHI ও MRL রেফারেন্স — অফলাইন-বান্ধব।",
    url: "https://pesticide-field-guide.vercel.app",
    icon: "📖",
  },
  {
    slug: "soil-media-portal",
    titleEn: "Soil Health Media Portal",
    titleBn: "মাটির স্বাস্থ্য মিডিয়া পোর্টাল",
    summaryEn: "Soil fertility, pH and fertilizer management explained for farmers.",
    summaryBn: "কৃষকের জন্য মাটির উর্বরতা, pH ও সার ব্যবস্থাপনার ব্যাখ্যা।",
    url: "https://moniruzjaman.github.io/soil-media-portal/",
    icon: "🏺",
  },
  {
    slug: "plantation-tracker",
    titleEn: "Plantation Tracker",
    titleBn: "প্ল্যান্টেশন ট্র্যাকার",
    summaryEn: "Map and track plot, plantation and orchard geo-fences over time.",
    summaryBn: "জমির প্লট, plantation ও বাগানের ভূ-গোলক (geo-fence) সময় ধরে ট্র্যাক করুন।",
    url: "https://plantation-tracker.vercel.app",
    icon: "🗺️",
  },
  {
    slug: "plantation-tracker-app",
    titleEn: "Plantation Tracker App",
    titleBn: "প্ল্যান্টেশন ট্র্যাকার অ্যাপ",
    summaryEn: "Mobile companion for recording plantation plots and progress.",
    summaryBn: "প্ল্যান্টেশনের প্লট ও অগ্রগতি রেকর্ডের মোবাইল সঙ্গী।",
    url: "https://github.com/moniruzjaman/plantation-tracker-app",
    icon: "📱",
  },
  {
    slug: "plantation-submission-system",
    titleEn: "Plantation Submission System",
    titleBn: "প্ল্যান্টেশন সাবমিশন সিস্টেম",
    summaryEn: "Officer workflow for reviewing farmer plantation submissions.",
    summaryBn: "কৃষকের প্ল্যান্টেশন আবেদন পর্যালোচনার কর্মকর্তা ওয়ার্কফ্লো।",
    url: "https://plantation-submission-system.vercel.app",
    icon: "📋",
  },
  {
    slug: "kurigram_nursery_registry",
    titleEn: "Kurigram Nursery Registry",
    titleBn: "কুড়িগ্রাম নার্সারি রেজিস্ট্রি",
    summaryEn: "Registered nursery directory with GPS locations for quality saplings.",
    summaryBn: "মানসম্পন্ন চারা সংগ্রহে GPS-সহ নিবন্ধিত নার্সারির ডিরেক্টরি।",
    url: "https://kurigram-nursery-registry.vercel.app",
    icon: "🌱",
  },
  {
    slug: "producer-register",
    titleEn: "Bangladesh GAP Producer Register",
    titleBn: "বাংলাদেশ GAP প্রডিউসার রেজিস্টার",
    summaryEn: "Good Agricultural Practice producer registration and traceability.",
    summaryBn: "GAP মান মেনে উৎপাদনকারীর নিবন্ধন ও ট্রেসেবিলিটি।",
    url: "https://producer-register.vercel.app",
    icon: "✅",
  },
  {
    slug: "gap-brinjal",
    titleEn: "GAP Brinjal Advisory",
    titleBn: "GAP বেগুন পরামর্শ",
    summaryEn: "Brinjal GAP calendar: varieties, IPM schedules and residue limits.",
    summaryBn: "বেগুনের GAP ক্যালেন্ডার: জাত, IPM সময়সূচি ও রসায়ন অবশিষ্টাংশ সীমা।",
    url: "https://gap-brinjal-krishi-ai-team.vercel.app",
    icon: "🍆",
  },
  {
    slug: "krishak-card",
    titleEn: "Krishak Card",
    titleBn: "কৃষক কার্ড",
    summaryEn: "Farmer identity, land record and subsidy entitlement demo.",
    summaryBn: "কৃষক পরিচয়, জমির বিবরণ ও ভর্তুকি যোগ্যতার ডেমো।",
    url: "https://krishak-card.vercel.app",
    icon: "🪪",
  },
  {
    slug: "self-learning",
    titleEn: "Swashikkha Krishi (Self-Learning Agriculture)",
    titleBn: "স্বশিক্ষা কৃষি",
    summaryEn: "Bite-size bilingual lessons on modern crop management.",
    summaryBn: "আধুনিক ফসল ব্যবস্থাপনার ছোট ছোট দ্বিভাষিক পাঠ।",
    url: "https://moniruzjaman.github.io/self-learning/",
    icon: "🎓",
  },
  {
    slug: "knowledge-hub",
    titleEn: "Knowledge Hub",
    titleBn: "নলেজ হাব",
    summaryEn: "Searchable extension knowledge base for officers and farmers.",
    summaryBn: "কর্মকর্তা ও কৃষকের জন্য অনুসন্ধানযোগ্য সম্প্রসারণ জ্ঞানভাণ্ডার।",
    url: "https://knowledge-hub-alpha-khaki.vercel.app",
    icon: "📚",
  },
  {
    slug: "web.krishiai.live",
    titleEn: "KrishiAI Web Portal",
    titleBn: "কৃষিAI ওয়েব পোর্টাল",
    summaryEn: "The full KrishiAI web portal with chat, maps and advisories.",
    summaryBn: "চ্যাট, মানচিত্র ও পরামর্শসহ পূর্ণাঙ্গ কৃষিAI ওয়েব পোর্টাল।",
    url: "https://web-krishiai-live.vercel.app",
    icon: "🖥️",
  },
  {
    slug: "app.krishiai",
    titleEn: "KrishiAI Mobile App",
    titleBn: "কৃষিAI মোবাইল অ্যাপ",
    summaryEn: "Installable PWA version of KrishiAI for offline-first farming.",
    summaryBn: "অফলাইন-প্রধান চাষাবাদের ইনস্টলযোগ্য PWA সংস্করণ।",
    url: "https://app-krishiai.vercel.app",
    icon: "📲",
  },
  {
    slug: "diagnosis_game",
    titleEn: "Foshol Fotowa (Crop Call)",
    titleBn: "ফসল ফতোয়া",
    summaryEn: "Gamified pest-and-disease quiz to sharpen scouting skills.",
    summaryBn: "স্কাউটিং দক্ষতা বাড়াতে খেলার ছন্দে পোকা-রোগ কুইজ।",
    url: "https://diagnosis-game.vercel.app",
    icon: "🎮",
  },
  {
    slug: "pesticide_act_2018",
    titleEn: "Pesticide Act 2018",
    titleBn: "কীটনাশক আইন ২০১৮",
    summaryEn: "Readable digest of the Bangladesh Pesticide Ordinance/Act provisions.",
    summaryBn: "বাংলাদেশ কীটনাশক আইনের বিধানের পাঠযোগ্য সারাংশ।",
    url: "https://pesticideact2018.vercel.app",
    icon: "⚖️",
  },
];

/** Fast lookup by slug for tool-page related-app cards. */
const APP_BY_SLUG = new Map(ECOSYSTEM_APPS.map((a) => [a.slug, a]));

export function getApp(slug: string): EcosystemApp | undefined {
  return APP_BY_SLUG.get(slug);
}

/**
 * Which ecosystem apps are relevant for each tool route.
 * The first entry is shown as the primary "companion app" card.
 */
export const TOOL_APP_MAP: Record<string, string[]> = {
  "/weather-intelligence": ["web.krishiai.live", "knowledge-hub"],
  "/tools/plant-health": ["cabi-diagnosis", "diagnosis-assistant", "diagnosis_game"],
  "/tools/pesticide": [
    "AgriChem-Guide-Pest-Control-Database",
    "pesticide-field-guide",
    "pesticide_act_2018",
  ],
  "/tools/soil": ["soil-media-portal", "krishak-card"],
  "/tools/crop-library": ["self-learning", "knowledge-hub", "gap-brinjal"],
  "/tools/yield": ["producer-register", "plantation-tracker"],
  "/tools/irrigation": ["web.krishiai.live", "krishak-card"],
  "/tools/satellite": ["plantation-tracker", "plantation-tracker-app"],
  "/tools/crop-calendar": ["gap-brinjal", "self-learning"],
  "/tools/smart-decision": ["knowledge-hub", "app.krishiai"],
  "/map": ["plantation-tracker", "kurigram_nursery_registry", "plantation-submission-system"],
};

/** Slugs of apps that draw or manage geo-fenced plots (used by the map page). */
export const GEO_FENCE_APP_SLUGS = [
  "plantation-tracker",
  "plantation-tracker-app",
  "plantation-submission-system",
  "kurigram_nursery_registry",
  "producer-register",
];
