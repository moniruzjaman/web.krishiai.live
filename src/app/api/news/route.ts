/**
 * /api/news — KrishiAI News API
 *
 * Daily agriculture headlines are extracted from renowned Bangladesh
 * newspaper HTML/XML pages (no third-party news APIs). Government
 * .gov.bd publisher feeds and seasonal advisories remain as extra tabs.
 */

import { NextRequest } from "next/server";
import { corsHeaders, corsNextResponse } from "@/lib/cors";
import {
  collectNewspaperNews,
  type NewspaperNewsItem,
} from "@/lib/bdNewspaperNews";

// ── Types ────────────────────────────────────────────────────────────────────
interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  color: string;
  icon?: string;
  isGov?: boolean;
  extractionTime?: string;
  extractionMethod?: string;
  sourceUrl?: string;
  sourceEn?: string;
  credibility?: string;
}

interface DailyBulletin {
  title: string;
  body: string;
  warning?: string;
  todos?: string[];
  season: string;
  dateStr: string;
}

interface NewsResponse {
  ok: boolean;
  date: string;
  season: string;
  bulletin: DailyBulletin | null;
  headlines: NewsItem[];
  englishHeadlines: NewsItem[];
  govHeadlines: NewsItem[];
  intlHeadlines: NewsItem[];
  sources: {
    headlines: "newspaper-html" | "fallback";
    bulletin: "ai-generated" | "unavailable";
    gov: "cors-proxy" | "curated" | "unavailable";
    intl: "rss-live" | "unavailable";
  };
  extractedAt?: string;
  newspapers?: Array<{
    id: string;
    name: string;
    home: string;
    extracted: number;
    ok: boolean;
  }>;
}

// ── In-memory cache (30 min, auto-invalidates on day change) ──────────────────
let cachedResponse: NewsResponse | null = null;
let cachedAt = 0;
let cachedDate = "";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ── Date freshness filter ────────────────────────────────────────────────────
const MAX_NEWS_AGE_DAYS = 7;

function isRecent(pubDate: string): boolean {
  try {
    const d = new Date(pubDate);
    if (isNaN(d.getTime())) return false; // discard if date is unparseable
    const ageMs = Date.now() - d.getTime();
    return ageMs < MAX_NEWS_AGE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// ── Bangladesh Agricultural Calendar ─────────────────────────────────────────
function bdAgriContext() {
  const now = new Date();
  const m = now.getMonth() + 1;
  const dateStr = now.toLocaleDateString("bn-BD", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let season: string, activeCrops: string, urgentTasks: string, riskAlerts: string;

  if (m === 11 || m === 12) {
    season = "রবি মৌসুম (শুরু)";
    activeCrops = "আলু, সরিষা, গম, শীতকালীন সবজি, মসুর ডাল";
    urgentTasks = "রবি ফসলের বীজতলা প্রস্তুত · আলু রোপণ · সেচ ব্যবস্থাপনা শুরু";
    riskAlerts = "শিশির-ঘন কুয়াশা → আলুর লেট ব্লাইট · গমের মরিচা ঝুঁকি শুরু";
  } else if (m <= 2) {
    season = "রবি মৌসুম (মধ্য)";
    activeCrops = "বোরো বীজতলা, আলু, সরিষা, গম, ডাল ফসল";
    urgentTasks = "বোরো বীজতলা রক্ষা · আলু উত্তোলন পরিকল্পনা · সারের ২য় কিস্তি";
    riskAlerts = "শীতল তাপমাত্রা → বোরো চারার ক্ষতি · সরিষার সাদা মরিচা";
  } else if (m <= 4) {
    season = "প্রাক-খরিফ / বোরো কাটার মৌসুম";
    activeCrops = "বোরো ধান (পরিপক্ক), গ্রীষ্মকালীন সবজি, পেঁয়াজ";
    urgentTasks = "বোরো ধান কাটা ও মাড়াই · শুকানো ও সংরক্ষণ · আউশ বীজতলা শুরু";
    riskAlerts = "পাকার সময় ঝড়-বৃষ্টি → ধান পড়ে যাওয়া · ব্লাস্ট রোগের ঝুঁকি";
  } else if (m <= 6) {
    season = "খরিফ-১ / আউশ মৌসুম";
    activeCrops = "আউশ ধান, পাট, গ্রীষ্মকালীন সবজি";
    urgentTasks = "পাট রোপণ ও পরিচর্যা · আউশ ধানে সার · বর্ষা পূর্ব মাটি পরীক্ষা";
    riskAlerts = "প্রথম বর্ষায় আউশে পোকা · পাটে ডাঁটা পচা ঝুঁকি";
  } else if (m <= 8) {
    season = "খরিফ-২ / আমন মৌসুম (শুরু)";
    activeCrops = "রোপা আমন ধান, পাট (কাটা), বর্ষাকালীন সবজি";
    urgentTasks = "আমন রোপণ সম্পন্ন করুন · পাট পানিতে জাগ দিন · বন্যার ক্ষতি মূল্যায়ন";
    riskAlerts = "ব্যাকটেরিয়াল লিফ ব্লাইট (BLB) · বাদামী গাছফড়িং (BPH) সতর্কতা";
  } else {
    season = "আমন মৌসুম (মধ্য) / রবি প্রস্তুতি";
    activeCrops = "রোপা আমন ধান, আগাম রবি সবজি, পেঁয়াজ বীজতলা";
    urgentTasks = "আমন ধানে শীষ বের হওয়ার সময় রক্ষা · রবি বীজতলা শুরু";
    riskAlerts = "BPH ও শীষের ব্লাস্ট · শিলাবৃষ্টির ঝুঁকি · শৈত্য প্রবাহের পূর্ব প্রস্তুতি";
  }

  return { dateStr, season, activeCrops, urgentTasks, riskAlerts, m };
}

// ── Simple XML / RSS parser ──────────────────────────────────────────────────
function parseRSS(xml: string): { title: string; link: string; pubDate: string; source?: string }[] {
  const items: { title: string; link: string; pubDate: string; source?: string }[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag: string) => {
      const m = block.match(
        new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i")
      );
      return m
        ? m[1]
            .trim()
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, " ")
        : "";
    };
    const title = get("title");
    const link = get("link") || get("guid");
    const pubDate = get("pubDate") || get("dc:date") || new Date().toISOString();
    const source = get("source");
    if (title && link) items.push({ title, link, pubDate, source });
  }
  return items;
}

// ── Agriculture keyword filter ───────────────────────────────────────────────
const AGRI_KW_BN = [
  "কৃষি", "ফসল", "ধান", "গম", "পাট", "সার", "বীজ", "সেচ", "কৃষক", "চাষ",
  "আলু", "সবজি", "বোরো", "আমন", "আউশ", "মৌসুম", "ফলন", "রোগ", "পোকা",
  "বালাই", "সংগ্রহ", "উৎপাদন", "ভূমি", "জমি", "কৃষি সংবাদ", "ফসলের",
  "বীজতলা", "সার ব্যবস্থাপনা", "কীটনাশক", "সেচ ব্যবস্থা", "বন্যা",
  "খরা", "ঝড়", "প্রাকৃতিক", "দুর্যোগ", "কৃষি মন্ত্রণালয়", "বাধা",
  "পানি", "মাটি", "মৃত্তিকা", "মৎস্য", "পশুপালন", "দুগ্ধ",
  "কৃষি সম্প্রসারণ", "বীজ বিতরণ", "সার ভর্তুকি", "ফসল ক্ষতিপূরণ",
  "কৃষি ঋণ", "পানি সেচ", "খাদ্য নিরাপত্তা", "ভাসমান কৃষি",
  "জলবায়ু", "প্রাণিসম্পদ", "হাঁস-মুরগি", "গবাদি", "মাছ চাষ", "ঘাস",
  "তেল ফসল", "ডাল", "মসলা", "ফল", "পেঁয়াজ", "রসুন", "মরিচ",
  "সরিষা", "চিনি", "আখ", "চা", "তামাক", "কফি", "FAO",
];

const AGRI_KW_EN = [
  "agri", "crop", "rice", "wheat", "farmer", "harvest", "fertilizer", "seed",
  "grain", "agriculture", "paddy", "irrigation", "pest", "drought",
  "flood", "cultivation", "livestock", "fisheries", "crop-yield",
  "monsoon", "boro rice", "aman paddy", "jute", "potato", "onion", "vegetable",
  "seedling", "transplant", "pesticide", "blight",
  "fao", "food and agriculture", "ifpri", "world bank", "dairy",
  "poultry", "aquaculture", "food security",
];

const isAgri = (t: string): boolean => {
  const lower = t.toLowerCase();
  return [...AGRI_KW_BN, ...AGRI_KW_EN].some((k) => lower.includes(k.toLowerCase()));
};

// ── Fetch with timeout ───────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, ms = 10000): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "KrishiAI/3.0 (https://krishiai.live)",
        Accept: "application/rss+xml, application/xml, text/xml, text/html",
      },
    });
    clearTimeout(id);
    return r;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// ── CORS Proxy fetcher (bypasses 403 from .gov.bd datacenter blocks) ─────────
const CORS_PROXIES = [
  {
    name: "allorigins",
    build: (targetUrl: string) =>
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
  },
  {
    name: "corsproxy",
    build: (targetUrl: string) =>
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
  },
];

async function fetchViaCORSProxy(targetUrl: string, ms = 12000): Promise<string | null> {
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy.build(targetUrl);
      const r = await fetchWithTimeout(proxyUrl, ms);
      if (r.ok) {
        const text = await r.text();
        // Validate it looks like XML/RSS
        if (text.includes("<") && text.length > 200) {
          return text;
        }
      }
    } catch {
      // Try next proxy
    }
  }
  return null;
}

// ── .gov.bd RSS Feed URLs (BD government agriculture portals) ────────────────
const GOV_RSS_FEEDS = [
  {
    url: "https://dae.gov.bd/site/rss/4db0466c-e4ef-4f57-9f7d-88b4a6c6d89b",
    source: "DAE (কৃষি সম্প্রসারণ অধিদপ্তর)",
    color: "#065f46",
    icon: "🏛️",
  },
  {
    url: "https://dae.gov.bd/site/rss/4db0466c-e4ef-4f57-9f7d-88b4a6c6d89b?lang=bn",
    source: "DAE",
    color: "#065f46",
    icon: "🏛️",
  },
  {
    url: "https://brri.gov.bd/site/rss/8a6f7c6a-9ec9-4b3b-bd87-5b6e91e1b949",
    source: "BRRI (ধান গবেষণা ইনস্টিটিউট)",
    color: "#1d4ed8",
    icon: "🏛️",
  },
  {
    url: "https://bari.gov.bd/site/rss/0e5e3e3c-2b6f-4ce0-8d7f-3c6c7f3c0e3c",
    source: "BARI (কৃষি গবেষণা ইনস্টিটিউট)",
    color: "#b45309",
    icon: "🏛️",
  },
  {
    url: "https://badc.gov.bd/site/rss",
    source: "BADC (কৃষি উন্নয়ন কর্পোরেশন)",
    color: "#0284c7",
    icon: "🏛️",
  },
  {
    url: "https://moa.gov.bd/site/rss",
    source: "কৃষি মন্ত্রণালয়",
    color: "#7c3aed",
    icon: "🏛️",
  },
  {
    url: "https://bmd.gov.bd/site/rss",
    source: "BMD (আবহাওয়া অধিদপ্তর)",
    color: "#dc2626",
    icon: "🏛️",
  },
  {
    url: "https://frwg.gov.bd/site/rss",
    source: "FRWG (খাদ্য শস্য গবেষণা)",
    color: "#9d174d",
    icon: "🏛️",
  },
  {
    url: "https://ais.gov.bd/site/rss",
    source: "AIS (কৃষি তথ্য সার্ভিস)",
    color: "#15803d",
    icon: "🏛️",
  },
  {
    url: "https://dls.gov.bd/site/rss",
    source: "DLS (প্রাণিসম্পদ অধিদপ্তর)",
    color: "#a16207",
    icon: "🏛️",
  },
  {
    url: "https://fisheries.gov.bd/site/rss",
    source: "DoF (মৎস্য অধিদপ্তর)",
    color: "#0e7490",
    icon: "🏛️",
  },
  {
    url: "https://srdi.gov.bd/site/rss",
    source: "SRDI (মৃত্তিকা উন্নয়ন ইনস্টিটিউট)",
    color: "#92400e",
    icon: "🏛️",
  },
];

// ── Fetch .gov.bd RSS feeds via CORS proxy ───────────────────────────────────
async function fetchGovRSSFeeds(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  // Try each .gov.bd feed via CORS proxy (with concurrent requests)
  const results = await Promise.allSettled(
    GOV_RSS_FEEDS.map(async (feed) => {
      try {
        const xml = await fetchViaCORSProxy(feed.url, 10000);
        if (!xml) return [];

        const parsed = parseRSS(xml);
        const extracted = new Date().toISOString();
        return parsed
          .filter((it) => isAgri(it.title) && isRecent(it.pubDate))
          .map((it) => ({
            title: it.title,
            link: it.link,
            pubDate: it.pubDate,
            source: feed.source,
            color: feed.color,
            icon: feed.icon,
            isGov: true,
            extractionTime: extracted,
            extractionMethod: "xml-feed",
            sourceUrl: feed.url,
            credibility: "high",
          }));
      } catch {
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  return allItems;
}

// ── International authentic RSS feeds ──────────────────────────────────────────
const INTL_RSS_FEEDS = [
  {
    url: "https://www.fao.org/news/rss/crop-production.xml",
    source: "FAO (খাদ্য ও কৃষি সংস্থা)",
    color: "#1e40af",
    icon: "🌍",
  },
  {
    url: "https://www.fao.org/news/rss/agriculture.xml",
    source: "FAO",
    color: "#1e40af",
    icon: "🌍",
  },
  {
    url: "https://www.fao.org/news/rss/climate-change.xml",
    source: "FAO জলবায়ু",
    color: "#dc2626",
    icon: "🌍",
  },
  {
    url: "https://www.ifpri.org/rss.xml",
    source: "IFPRI (আন্তর্জাতিক খাদ্য নীতি গবেষণা)",
    color: "#6d28d9",
    icon: "🌍",
  },
  {
    url: "https://www.irri.org/rss.xml",
    source: "IRRI (আন্তর্জাতিক ধান গবেষণা ইনস্টিটিউট)",
    color: "#1b8a3e",
    icon: "🌾",
  },
  {
    url: "https://www.worldbank.org/en/topic/agriculture/rss",
    source: "World Bank কৃষি",
    color: "#0e7490",
    icon: "🌍",
  },
  {
    url: "https://www.cgiar.org/rss.xml",
    source: "CGIAR",
    color: "#1b8a3e",
    icon: "🌍",
  },
];

async function fetchIntlRSSFeeds(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];
  const results = await Promise.allSettled(
    INTL_RSS_FEEDS.map(async (feed) => {
      try {
        const xml = await fetchViaCORSProxy(feed.url, 10000);
        if (!xml) return [];
        const parsed = parseRSS(xml);
        const extracted = new Date().toISOString();
        return parsed
          .filter((it) => isAgri(it.title) && isRecent(it.pubDate))
          .slice(0, 5)
          .map((it) => ({
            title: it.title,
            link: it.link,
            pubDate: it.pubDate,
            source: feed.source,
            color: feed.color,
            icon: feed.icon,
            isGov: false,
            extractionTime: extracted,
            extractionMethod: "xml-feed",
            sourceUrl: feed.url,
            credibility: "high",
          }));
      } catch {
        return [];
      }
    })
  );
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }
  return allItems;
}

// ── Curated .gov.bd seasonal advisories (always available) ───────────────────
function stampFallback(item: NewsItem): NewsItem {
  const extracted = new Date().toISOString();
  return {
    ...item,
    extractionTime: extracted,
    extractionMethod: "curated",
    credibility: "seasonal-advisory",
    sourceUrl: item.link,
  };
}

function buildGovCurated(ctx: ReturnType<typeof bdAgriContext>): NewsItem[] {
  const { season, activeCrops, urgentTasks, riskAlerts, m } = ctx;
  const today = new Date().toISOString().slice(0, 10);

  const items: NewsItem[] = [
    {
      title: `${season}: ${activeCrops} চাষে আজকের পরামর্শ`,
      source: "DAE",
      color: "#065f46",
      icon: "🏛️",
      link: "https://dae.gov.bd",
      pubDate: today,
      isGov: true,
    },
    {
      title: `জরুরি কাজ: ${urgentTasks}`,
      source: "BRRI",
      color: "#1d4ed8",
      icon: "🏛️",
      link: "https://brri.gov.bd",
      pubDate: today,
      isGov: true,
    },
    {
      title: `সতর্কতা: ${riskAlerts}`,
      source: "BARI",
      color: "#b45309",
      icon: "🏛️",
      link: "https://bari.gov.bd",
      pubDate: today,
      isGov: true,
    },
    {
      title: `বীজ ও সারের ভর্তুকি তথ্য — স্থানীয় কৃষি অফিসে যোগাযোগ করুন`,
      source: "BADC",
      color: "#0284c7",
      icon: "🏛️",
      link: "https://badc.gov.bd",
      pubDate: today,
      isGov: true,
    },
    {
      title: `কৃষি ঋণ প্রাপ্তির সুবিধা — কৃষি মন্ত্রণালয়ের বিশেষ ঘোষণা`,
      source: "কৃষি মন্ত্রণালয়",
      color: "#7c3aed",
      icon: "🏛️",
      link: "https://moa.gov.bd",
      pubDate: today,
      isGov: true,
    },
    {
      title: `আবহাওয়া পূর্বাভাস ও কৃষি সতর্কতা — আবহাওয়া অধিদপ্তর`,
      source: "BMD",
      color: "#dc2626",
      icon: "🏛️",
      link: "https://bmd.gov.bd",
      pubDate: today,
      isGov: true,
    },
  ];

  // Month-specific advisories
  const monthlyGov: Record<number, NewsItem[]> = {
    1: [
      {
        title: "বোরো বীজতলায় কোল্ড ইনজুরি প্রতিরোধে পলিথিন ঢাকনা ব্যবহার করুন — BRRI",
        source: "BRRI",
        color: "#1d4ed8",
        icon: "🏛️",
        link: "https://brri.gov.bd",
        pubDate: today,
        isGov: true,
      },
      {
        title: "শীতকালীন সবজিতে সঠিক সেচ ব্যবস্থাপনা — DAE নির্দেশিকা",
        source: "DAE",
        color: "#065f46",
        icon: "🏛️",
        link: "https://dae.gov.bd",
        pubDate: today,
        isGov: true,
      },
    ],
    2: [
      {
        title: "সরিষা পাকলে দ্রুত কাটুন — বৃষ্টির আগেই মাড়াই সম্পন্ন করুন — BARI",
        source: "BARI",
        color: "#b45309",
        icon: "🏛️",
        link: "https://bari.gov.bd",
        pubDate: today,
        isGov: true,
      },
    ],
    3: [
      {
        title: "বোরো ধান পাকার আগে ব্লাস্ট প্রতিরোধী ছত্রাকনাশক প্রয়োগ করুন — DAE",
        source: "DAE",
        color: "#065f46",
        icon: "🏛️",
        link: "https://dae.gov.bd",
        pubDate: today,
        isGov: true,
      },
    ],
    4: [
      {
        title: "বোরো ধান কাটা ও মাড়াই: দ্রুততার সাথে সংগ্রহ করুন, কালবৈশাখীর আগে — DAE",
        source: "DAE",
        color: "#065f46",
        icon: "🏛️",
        link: "https://dae.gov.bd",
        pubDate: today,
        isGov: true,
      },
    ],
    5: [
      {
        title: "পাট চাষে সময়মতো বীজ বপন করুন — BARI-এর নতুন জাত ব্যবহার করুন",
        source: "BARI",
        color: "#b45309",
        icon: "🏛️",
        link: "https://bari.gov.bd",
        pubDate: today,
        isGov: true,
      },
    ],
    6: [
      {
        title: "আউশ ধানের বীজতলায় সঠিক সার ব্যবস্থাপনা: BRRI নির্দেশিকা",
        source: "BRRI",
        color: "#1d4ed8",
        icon: "🏛️",
        link: "https://brri.gov.bd",
        pubDate: today,
        isGov: true,
      },
    ],
    7: [
      {
        title: "বন্যাপ্রবণ এলাকায় ভাসমান বেডে সবজি চাষের পরামর্শ — BARI",
        source: "BARI",
        color: "#b45309",
        icon: "🏛️",
        link: "https://bari.gov.bd",
        pubDate: today,
        isGov: true,
      },
    ],
    8: [
      {
        title: "আমন ধানে BPH (বাদামী গাছফড়িং) দমনে Imidacloprid প্রয়োগ করুন — DAE",
        source: "DAE",
        color: "#065f46",
        icon: "🏛️",
        link: "https://dae.gov.bd",
        pubDate: today,
        isGov: true,
      },
    ],
    9: [
      {
        title: "আমন ধানের শীষ বের হওয়ার সময় নেক ব্লাস্ট প্রতিরোধে সতর্ক থাকুন — BRRI",
        source: "BRRI",
        color: "#1d4ed8",
        icon: "🏛️",
        link: "https://brri.gov.bd",
        pubDate: today,
        isGov: true,
      },
    ],
    10: [
      {
        title: "আমন কাটার পরপরই জমি প্রস্তুত করুন — রবি ফসলের সময় এসেছে — DAE",
        source: "DAE",
        color: "#065f46",
        icon: "🏛️",
        link: "https://dae.gov.bd",
        pubDate: today,
        isGov: true,
      },
    ],
    11: [
      {
        title: "আলু রোপণে সঠিক বীজ আলু বাছাই ও শোধন করুন — BADC",
        source: "BADC",
        color: "#0284c7",
        icon: "🏛️",
        link: "https://badc.gov.bd",
        pubDate: today,
        isGov: true,
      },
    ],
    12: [
      {
        title: "গম রোপণের সেরা সময়: নভেম্বর শেষ থেকে ডিসেম্বর মাঝ পর্যন্ত — BARI",
        source: "BARI",
        color: "#b45309",
        icon: "🏛️",
        link: "https://bari.gov.bd",
        pubDate: today,
        isGov: true,
      },
    ],
  };

  return [...items, ...(monthlyGov[m] || [])].map(stampFallback);
}


// ── Seasonal Fallback ────────────────────────────────────────────────────────
function buildSeasonalFallback(ctx: ReturnType<typeof bdAgriContext>): NewsItem[] {
  const { season, activeCrops, urgentTasks, riskAlerts, m } = ctx;
  const today = new Date().toISOString().slice(0, 10);

  const base: NewsItem[] = [
    {
      title: `${season}: ${activeCrops} চাষে আজকের পরামর্শ`,
      source: "DAE",
      color: "#065f46",
      icon: "🌿",
      link: "https://dae.gov.bd",
      pubDate: today,
    },
    {
      title: `জরুরি কাজ: ${urgentTasks}`,
      source: "BRRI",
      color: "#1d4ed8",
      icon: "🌾",
      link: "https://brri.gov.bd",
      pubDate: today,
    },
    {
      title: `সতর্কতা: ${riskAlerts}`,
      source: "BARI",
      color: "#b45309",
      icon: "🥦",
      link: "https://bari.gov.bd",
      pubDate: today,
    },
  ];

  const monthlyExtras: Record<number, NewsItem[]> = {
    1: [
      {
        title: "বোরো বীজতলায় কোল্ড ইনজুরি প্রতিরোধে পলিথিন ঢাকনা ব্যবহার করুন — BRRI",
        source: "BRRI",
        color: "#1d4ed8",
        icon: "🌾",
        link: "https://brri.gov.bd",
        pubDate: today,
      },
    ],
    2: [
      {
        title: "সরিষা পাকলে দ্রুত কাটুন — বৃষ্টির আগেই মাড়াই সম্পন্ন করুন — BARI",
        source: "BARI",
        color: "#b45309",
        icon: "🥦",
        link: "https://bari.gov.bd",
        pubDate: today,
      },
    ],
    3: [
      {
        title: "বোরো ধান পাকার আগে ব্লাস্ট প্রতিরোধী ছত্রাকনাশক প্রয়োগ করুন — DAE",
        source: "DAE",
        color: "#065f46",
        icon: "🌿",
        link: "https://dae.gov.bd",
        pubDate: today,
      },
    ],
    4: [
      {
        title: "বোরো ধান কাটা ও মাড়াই: দ্রুততার সাথে সংগ্রহ করুন, কালবৈশাখীর আগে — DAE",
        source: "DAE",
        color: "#065f46",
        icon: "🌿",
        link: "https://dae.gov.bd",
        pubDate: today,
      },
    ],
    5: [
      {
        title: "পাট চাষে সময়মতো বীজ বপন করুন — BARI-এর নতুন জাত ব্যবহার করুন",
        source: "BARI",
        color: "#b45309",
        icon: "🥦",
        link: "https://bari.gov.bd",
        pubDate: today,
      },
    ],
    6: [
      {
        title: "আউশ ধানের বীজতলায় সঠিক সার ব্যবস্থাপনা: BRRI নির্দেশিকা",
        source: "BRRI",
        color: "#1d4ed8",
        icon: "🌾",
        link: "https://brri.gov.bd",
        pubDate: today,
      },
    ],
    7: [
      {
        title: "বন্যাপ্রবণ এলাকায় ভাসমান বেডে সবজি চাষের পরামর্শ — BARI",
        source: "BARI",
        color: "#b45309",
        icon: "🥦",
        link: "https://bari.gov.bd",
        pubDate: today,
      },
    ],
    8: [
      {
        title: "আমন ধানে BPH (বাদামী গাছফড়িং) দমনে Imidacloprid প্রয়োগ করুন — DAE",
        source: "DAE",
        color: "#065f46",
        icon: "🌿",
        link: "https://dae.gov.bd",
        pubDate: today,
      },
    ],
    9: [
      {
        title: "আমন ধানের শীষ বের হওয়ার সময় নেক ব্লাস্ট প্রতিরোধে সতর্ক থাকুন — BRRI",
        source: "BRRI",
        color: "#1d4ed8",
        icon: "🌾",
        link: "https://brri.gov.bd",
        pubDate: today,
      },
    ],
    10: [
      {
        title: "আমন কাটার পরপরই জমি প্রস্তুত করুন — রবি ফসলের সময় এসেছে — DAE",
        source: "DAE",
        color: "#065f46",
        icon: "🌿",
        link: "https://dae.gov.bd",
        pubDate: today,
      },
    ],
    11: [
      {
        title: "আলু রোপণে সঠিক বীজ আলু বাছাই ও শোধন করুন — BADC",
        source: "BADC",
        color: "#0284c7",
        icon: "🌱",
        link: "https://badc.gov.bd",
        pubDate: today,
      },
    ],
    12: [
      {
        title: "গম রোপণের সেরা সময়: নভেম্বর শেষ থেকে ডিসেম্বর মাঝ পর্যন্ত — BARI",
        source: "BARI",
        color: "#b45309",
        icon: "🥦",
        link: "https://bari.gov.bd",
        pubDate: today,
      },
    ],
  };

  return [...base, ...(monthlyExtras[m] || [])].map(stampFallback);
}

// ── AI Daily Bulletin using Quota-Aware AI Client ──────────────
async function generateDailyBulletin(
  ctx: ReturnType<typeof bdAgriContext>,
  newsHeadlines: NewsItem[]
): Promise<DailyBulletin | null> {
  try {
    const headlineList = newsHeadlines
      .slice(0, 8)
      .map((h, i) => `${i + 1}. ${h.title} (${h.source})`)
      .join("\n");

    const prompt = `আজকের তারিখ: ${ctx.dateStr}
মৌসুম: ${ctx.season}
সক্রিয় ফসল: ${ctx.activeCrops}
জরুরি কাজ: ${ctx.urgentTasks}
ঝুঁকি: ${ctx.riskAlerts}

${headlineList ? `আজকের সংবাদ:\n${headlineList}\n\n` : ""}উপরের তথ্যের ভিত্তিতে বাংলাদেশের কৃষকদের জন্য আজকের (${ctx.dateStr}) একটি সংক্ষিপ্ত দৈনিক কৃষি বুলেটিন তৈরি করুন।

অত্যন্ত গুরুত্বপূর্ণ: ঠিক এই ফরম্যাটে উত্তর দিন, কোনো markdown বা ** ব্যবহার করবেন না:

শিরোনাম: আকর্ষণীয় শিরোনাম এখানে
মূল তথ্য: ৩-৪ বাক্যে আজকের সবচেয়ে গুরুত্বপূর্ণ কৃষি পরামর্শ
সতর্কতা: চলমান রোগ-পোকার ঝুঁকি এক বাক্যে
করণীয়:
১. প্রথম অগ্রাধিকার কাজ
২. দ্বিতীয় অগ্রাধিকার কাজ
৩. তৃতীয় অগ্রাধিকার কাজ`;

    let text: string | null = null;

    // 1. Primary: Quota-aware AI client
    try {
      const { aiChat } = await import("@/lib/ai-client");
      const result = await aiChat(
        "তুমি বাংলাদেশের কৃষি বিশেষজ্ঞ। বাংলায় সংক্ষিপ্ত বুলেটিন তৈরি করো। কোনো markdown ব্যবহার করো না।",
        prompt,
        { feature: "news_bulletin", temperature: 0.7, maxTokens: 800 }
      );
      if (result.provider !== "offline" && result.text) {
        text = result.text;
      }
    } catch (e) {
      console.warn("[news:bulletin] AI client failed:", e instanceof Error ? e.message : String(e));
    }

    // 2. Fallback: static seasonal bulletin
    if (!text) {
      text = `শিরোনাম: ${ctx.season} মৌসুমের কৃষি বুলেটিন
মূল তথ্য: বর্তমানে ${ctx.activeCrops} চাষের সময়। ${ctx.urgentTasks}
সতর্কতা: ${ctx.riskAlerts}
করণীয়:
১. ${ctx.urgentTasks.split("·")[0]?.trim() || "সময়মতো ফসলের পরিচর্যা করুন"}
২. আবহাওয়ার পূর্বাভাস নিয়মিত দেখুন
৩. সরকারি ভর্তুকি ও সেবার তথ্য স্থানীয় কৃষি অফিস থেকে নিন`;
    }

    if (!text) return null;

    // Clean markdown formatting from AI response
    const cleaned = text
      .replace(/\*\*/g, "")      // Remove bold markers
      .replace(/\*/g, "")        // Remove italic markers
      .replace(/__+/g, "")       // Remove underscores
      .replace(/^#+\s*/gm, "")   // Remove heading markers
      .replace(/^[""]|[""]$/gm, "") // Remove curly quotes at line boundaries
      .replace(/^[""]|[""]$/gm, ""); // Remove smart quotes

    // Parse structured bulletin — handles both "Label:" and "Label: Value" formats
    const lines = cleaned
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Extract value after a label, supporting multi-line content until next label
    const getSection = (label: string): string => {
      const startIdx = lines.findIndex((l) => l.startsWith(label));
      if (startIdx === -1) return "";
      const firstLine = lines[startIdx].replace(label, "").trim();
      // Collect continuation lines until we hit another known label or bullet/todo
      const knownLabels = ["শিরোনাম:", "মূল তথ্য:", "সতর্কতা:", "করণীয়:"];
      let content = firstLine;
      for (let i = startIdx + 1; i < lines.length; i++) {
        if (knownLabels.some((lbl) => lines[i].startsWith(lbl))) break;
        // Stop at bullet/todo items — they go into todos array
        if (/^[•·\-১২৩৪৫৬৭৮৯০][\.\)]\s/.test(lines[i])) break;
        content += " " + lines[i];
      }
      // Strip surrounding quotes from the content
      return content.replace(/^["""]+|["""]+$/g, "").trim();
    };

    // Extract todo items — lines starting with bullet markers or Bengali numbers
    const todoLines = lines
      .filter(
        (l) =>
          l.startsWith("•") ||
          l.startsWith("·") ||
          l.startsWith("-") ||
          l.match(/^[১২৩৪৫৬৭৮৯০][\.\)]/)
      )
      .slice(0, 3)
      .map((l) => l.replace(/^[•·\-১২৩৪৫৬৭৮৯০][\.\)]\s*/, "").trim())
      .filter((l) => l.length > 0);

    const title = getSection("শিরোনাম:") || `${ctx.season} — আজকের কৃষি বুলেটিন`;
    const body = getSection("মূল তথ্য:") || cleaned.slice(0, 300);
    const warning = getSection("সতর্কতা:");

    return {
      title,
      body,
      warning,
      todos: todoLines,
      season: ctx.season,
      dateStr: ctx.dateStr,
    };
  } catch (e) {
    // AI bulletin generation failed, return null for graceful fallback
    return null;
  }
}


// ── Main handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const today = new Date().toISOString().slice(0, 10);
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";
  const dayChanged = cachedDate !== today;

  // Check cache (auto-invalidate on day change or after 30 min)
  if (!forceRefresh && !dayChanged && cachedResponse && Date.now() - cachedAt < CACHE_TTL) {
    const origin = request.headers.get("origin");
    return corsNextResponse(cachedResponse, {
      origin,
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" },
    });
  }

  const ctx = bdAgriContext();

  const toNewsItem = (item: NewspaperNewsItem): NewsItem => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate,
    source: item.source,
    color: item.color,
    icon: item.icon,
    isGov: item.isGov,
    extractionTime: item.extractionTime,
    extractionMethod: item.extractionMethod,
    sourceUrl: item.sourceUrl,
    sourceEn: item.sourceEn,
    credibility: item.credibility,
  });

  const [newspaperBundle, govRSS, intlRSS] = await Promise.all([
    collectNewspaperNews(),
    fetchGovRSSFeeds(),
    fetchIntlRSSFeeds(),
  ]);

  const bengaliHeadlines: NewsItem[] = newspaperBundle.bengali
    .filter((item) => isRecent(item.pubDate))
    .map(toNewsItem);
  const englishHeadlines: NewsItem[] = newspaperBundle.english
    .filter((item) => isRecent(item.pubDate))
    .map(toNewsItem);

  const govSeenTitles = new Set<string>();
  const govHeadlines: NewsItem[] = [];

  for (const item of govRSS) {
    const key = item.title.slice(0, 40).toLowerCase();
    if (!govSeenTitles.has(key)) {
      govSeenTitles.add(key);
      if (isRecent(item.pubDate)) {
        govHeadlines.push(item);
      }
    }
  }

  const curatedGov = buildGovCurated(ctx);
  for (const item of curatedGov) {
    const key = item.title.slice(0, 40).toLowerCase();
    if (!govSeenTitles.has(key)) {
      govSeenTitles.add(key);
      govHeadlines.push(item);
    }
  }

  govHeadlines.sort((a, b) => {
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  const govSource: "cors-proxy" | "curated" | "unavailable" =
    govRSS.length > 0 ? "cors-proxy" :
    curatedGov.length > 0 ? "curated" : "unavailable";

  const headlinesSource: "newspaper-html" | "fallback" =
    bengaliHeadlines.length > 0 || englishHeadlines.length > 0
      ? "newspaper-html"
      : "fallback";

  const finalHeadlines =
    bengaliHeadlines.length > 0
      ? bengaliHeadlines.slice(0, 20)
      : englishHeadlines.length > 0
        ? englishHeadlines.slice(0, 20)
        : buildSeasonalFallback(ctx);

  englishHeadlines.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  const intlSeen = new Set<string>();
  const intlHeadlines: NewsItem[] = [];
  for (const item of intlRSS) {
    const key = item.title.slice(0, 40).toLowerCase();
    if (intlSeen.has(key) || !isRecent(item.pubDate)) continue;
    intlSeen.add(key);
    intlHeadlines.push(item);
  }
  intlHeadlines.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  const allHeadlines = [...finalHeadlines, ...englishHeadlines.slice(0, 5), ...govHeadlines.slice(0, 3)];
  const bulletin = await generateDailyBulletin(ctx, allHeadlines);
  const intlSource: "rss-live" | "unavailable" = intlRSS.length > 0 ? "rss-live" : "unavailable";

  const response: NewsResponse = {
    ok: true,
    date: today,
    season: ctx.season,
    bulletin,
    headlines: finalHeadlines,
    englishHeadlines: englishHeadlines.slice(0, 15),
    govHeadlines: govHeadlines.slice(0, 15),
    intlHeadlines: intlHeadlines.slice(0, 10),
    sources: {
      headlines: headlinesSource,
      bulletin: bulletin ? "ai-generated" : "unavailable",
      gov: govSource,
      intl: intlSource,
    },
    extractedAt: newspaperBundle.extractedAt,
    newspapers: newspaperBundle.sources.map((s) => ({
      id: s.id,
      name: s.name,
      home: s.home,
      extracted: s.extracted,
      ok: s.ok,
    })),
  };

  // Cache the response
  cachedResponse = response;
  cachedAt = Date.now();
  cachedDate = today;

  const origin = request.headers.get("origin");
  return corsNextResponse(response, {
    origin,
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" },
  });
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
