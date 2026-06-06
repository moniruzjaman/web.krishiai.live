/**
 * /api/news — KrishiAI News API (Enhanced with .gov.bd support)
 *
 * Multi-source strategy for .gov.bd news:
 * 1. CORS proxy (allorigins.win, corsproxy.io) → direct access to .gov.bd RSS feeds
 * 2. Google News RSS with `site:gov.bd` queries → government-sourced articles
 * 3. Curated seasonal advisories from DAE/BRRI/BARI/BADC as fallback
 *
 * Also generates AI daily bulletin using Cloudflare Workers AI.
 * Falls back to seasonal calendar entries if all sources fail.
 */

import { NextRequest, NextResponse } from "next/server";

// ── Types ────────────────────────────────────────────────────────────────────
interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  color: string;
  icon?: string;
  isGov?: boolean;
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
    headlines: "google-news-rss" | "fallback";
    bulletin: "ai-generated" | "unavailable";
    gov: "cors-proxy" | "google-site-gov" | "curated" | "unavailable";
    intl: "rss-live" | "unavailable";
  };
}

// ── In-memory cache (30 min, auto-invalidates on day change) ──────────────────
let cachedResponse: NewsResponse | null = null;
let cachedAt = 0;
let cachedDate = "";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ── Date freshness filter ────────────────────────────────────────────────────
const MAX_NEWS_AGE_DAYS = 3;

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
  "food", "grain", "agriculture", "paddy", "irrigation", "pest", "drought",
  "flood", "cultivation", "livestock", "fisheries", "crop-yield", "Bangladesh",
  "monsoon", "boro", "aman", "aus", "jute", "potato", "onion", "vegetable",
  "subsidy", "extension", "seedling", "transplant", "pesticide", "blight",
  "fao", "food and agriculture", "ifpri", "world bank", "climate", "dairy",
  "poultry", "aquaculture", "nutrition", "food security", "organic",
  "sustainable", "biodiversity", "soil", "water", "market price",
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

// ── Fetch Google News RSS with site:gov.bd queries ───────────────────────────
async function fetchGoogleGovNews(): Promise<NewsItem[]> {
  // Multiple queries to maximize coverage of .gov.bd content
  const queries = [
    "site:gov.bd কৃষি",
    "site:gov.bd ধান ফসল কৃষক",
    "site:gov.bd agriculture crop",
    "site:gov.bd কৃষি সম্প্রসারণ",
    "site:gov.bd সার বীজ সেচ",
  ];

  const allItems: NewsItem[] = [];
  const seenTitles = new Set<string>();

  const results = await Promise.allSettled(
    queries.map(async (q) => {
      try {
        return await fetchGoogleNewsRSS(q, q.includes("agriculture") ? "en" : "bn");
      } catch {
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const item of result.value) {
        const key = item.title.slice(0, 40).toLowerCase();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          // Mark as gov source if link contains .gov.bd
          const isGovLink = item.link.includes(".gov.bd") ||
            item.source.toLowerCase().includes("gov") ||
            item.source.includes("DAE") ||
            item.source.includes("BRRI") ||
            item.source.includes("BARI") ||
            item.source.includes("BADC") ||
            item.source.includes("BSS");

          if (isGovLink || item.source.includes("BSS")) {
            allItems.push({
              ...item,
              isGov: true,
              icon: "🏛️",
            });
          }
        }
      }
    }
  }

  return allItems;
}

// ── Curated .gov.bd seasonal advisories (always available) ───────────────────
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

  return [...items, ...(monthlyGov[m] || [])];
}

// ── Fetch Google News RSS ────────────────────────────────────────────────────
async function fetchGoogleNewsRSS(
  query: string,
  lang: "bn" | "en"
): Promise<NewsItem[]> {
  const gl = "BD";
  const ceid = lang === "bn" ? "BD:bn" : "BD:en";
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${lang}&gl=${gl}&ceid=${ceid}`;

  try {
    const r = await fetchWithTimeout(url, 12000);
    if (!r.ok) return [];
    const xml = await r.text();
    const parsed = parseRSS(xml);

    // Google News titles: "Source: Title" format — split on last " - "
    return parsed
      .filter((it) => isAgri(it.title))
      .slice(0, 15)
      .map((it) => {
        // Try to extract source from " - " separator (Google News format)
        const lastDash = it.title.lastIndexOf(" - ");
        let title = it.title;
        let source = it.source || (lang === "bn" ? "Google News" : "Google News");

        if (lastDash > 0) {
          const possibleSource = it.title.substring(lastDash + 3).trim();
          const possibleTitle = it.title.substring(0, lastDash).trim();
          // Only split if it looks like a source name (short, no long sentences)
          if (possibleSource.length < 50 && possibleTitle.length > 10) {
            title = possibleTitle;
            source = possibleSource;
          }
        }

        // Normalize source names — map domain names to proper publication names
        const sourceNameMap: Record<string, string> = {
          "bangla.daily-sun.com": "Daily Sun",
          "daily-sun.com": "Daily Sun",
          "Daily Sun": "Daily Sun",
          "prothomalo.com": "প্রথম আলো",
          "প্রথম আলো": "প্রথম আলো",
          "Prothom Alo": "প্রথম আলো",
          "thedailystar.net": "The Daily Star",
          "The Daily Star": "The Daily Star",
          "Daily Star": "The Daily Star",
          "bdnews24.com": "bdnews24",
          "kalerkantho.com": "Kaler Kantho",
          "Kaler Kantho": "Kaler Kantho",
          "ittefaq.com.bd": "The Ittefaq",
          "Ittefaq": "The Ittefaq",
          "samakal.com": "সমকাল",
          "SAMAKAL": "সমকাল",
          "সমকাল": "সমকাল",
          "Samakal": "সমকাল",
          "jugantor.com": "যুগান্তর",
          "Jugantor": "যুগান্তর",
          "bangladesh-pratidin.com": "বাংলাদেশ প্রতিদিন",
          "Bangladesh Pratidin": "বাংলাদেশ প্রতিদিন",
          "tbsnews.net": "The Business Standard",
          "The Business Standard": "The Business Standard",
          "dhakatribune.com": "Dhaka Tribune",
          "Dhaka Tribune": "Dhaka Tribune",
          "newagebd.net": "New Age",
          "New Age": "New Age",
          "Jagonews24.com": "Jagoranews24",
          "banglatribune.com": "Bangla Tribune",
          "Bangla Tribune": "Bangla Tribune",
          "bonikbarta.net": "বণিক বার্তা",
          "Daily Bonik Barta": "বণিক বার্তা",
          "Amar Desh": "আমার দেশ",
          "Amar Sangbad": "আমার সংবাদ",
          "Daily Naya Diganta": "নয়া দিগন্ত",
          "Shomoyer Alo": "সময়ের আলো",
          "সময় নিউজ": "সময় নিউজ",
          "BBC": "BBC বাংলা",
          "Bangladesh Sangbad Sangstha (BSS)": "BSS",
          "BSS": "BSS",
          "International Rice Research Institute (IRRI)": "IRRI",
          "International Labour Organization": "ILO",
          "Pulitzer Center": "Pulitzer Center",
          "Nature": "Nature",
          "CGIAR": "CGIAR",
          "Mongabay": "Mongabay",
          "The World Economic Forum": "WEF",
          "DAE": "DAE",
          "BRRI": "BRRI",
          "BARI": "BARI",
          "BADC": "BADC",
          "FAO": "FAO",
          "Food and Agriculture Organization": "FAO",
          "IFPRI": "IFPRI",
          "IRRI": "IRRI",
          "World Bank": "World Bank",
          "World Bank Group": "World Bank",
          "Inter Press Service": "IPS",
          "Reuters": "Reuters",
          "Associated Press": "AP",
          "Bloomberg": "Bloomberg",
          "The Guardian": "The Guardian",
          "SciDev.Net": "SciDev.Net",
          "financialexpress.com.bd": "Financial Express",
          "The Financial Express": "Financial Express",
          "dailymessenger.net": "Daily Messenger",
          "Daily Observer": "Daily Observer",
          "observerbd.com": "Daily Observer",
          "theindependentbd.com": "The Independent",
          "en.prothomalo.com": "প্রথম আলো (EN)",
          "en.samakal.com": "সমকাল (EN)",
        };

        const normalizedSource = sourceNameMap[source] || source;

        const sourceColors: Record<string, string> = {
          "Daily Sun": "#b45309",
          "প্রথম আলো": "#1b8a3e",
          "The Daily Star": "#1d4ed8",
          "bdnews24": "#dc2626",
          "Kaler Kantho": "#b45309",
          "The Ittefaq": "#6d28d9",
          "সমকাল": "#0284c7",
          "যুগান্তর": "#065f46",
          "বাংলাদেশ প্রতিদিন": "#9d174d",
          "The Business Standard": "#1d4ed8",
          "Dhaka Tribune": "#6d28d9",
          "New Age": "#dc2626",
          "BBC বাংলা": "#7c3aed",
          "BSS": "#065f46",
          "আমার দেশ": "#b45309",
          "বণিক বার্তা": "#0284c7",
          "Jagoranews24": "#dc2626",
          "Bangla Tribune": "#6d28d9",
          "IRRI": "#1b8a3e",
          "Nature": "#1d4ed8",
          "CGIAR": "#1b8a3e",
          "DAE": "#065f46",
          "BRRI": "#1d4ed8",
          "BARI": "#b45309",
          "BADC": "#0284c7",
          "FAO": "#1e40af",
          "IFPRI": "#6d28d9",
          "World Bank": "#0e7490",
          "Reuters": "#dc2626",
          "AP": "#1d4ed8",
          "Bloomberg": "#6d28d9",
          "The Guardian": "#7c3aed",
          "SciDev.Net": "#15803d",
          "Financial Express": "#b45309",
          "Daily Messenger": "#0284c7",
          "Daily Observer": "#9d174d",
          "The Independent": "#6d28d9",
          "প্রথম আলো (EN)": "#1b8a3e",
          "সমকাল (EN)": "#0284c7",
          "IPS": "#1d4ed8",
        };

        const color = sourceColors[normalizedSource] || (lang === "bn" ? "#1b8a3e" : "#1d4ed8");

        // Check if this is a .gov.bd sourced article
        const isGov = it.link.includes(".gov.bd") ||
          normalizedSource === "DAE" ||
          normalizedSource === "BRRI" ||
          normalizedSource === "BARI" ||
          normalizedSource === "BADC" ||
          normalizedSource === "BSS";

        return {
          title,
          link: it.link,
          pubDate: it.pubDate,
          source: normalizedSource,
          color,
          icon: isGov ? "🏛️" : "📰",
          isGov,
        };
      });
  } catch {
    return [];
  }
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

  return [...base, ...(monthlyExtras[m] || [])];
}

// ── AI Daily Bulletin using Cloudflare Workers AI ──────────────
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

    // 1. Primary: Cloudflare Workers AI
    try {
      const { cfAIChat } = await import("@/lib/cloudflareAI");
      text = await cfAIChat(
        "তুমি বাংলাদেশের কৃষি বিশেষজ্ঞ। বাংলায় সংক্ষিপ্ত বুলেটিন তৈরি করো। কোনো markdown ব্যবহার করো না।",
        prompt,
        { temperature: 0.7, maxTokens: 800 }
      );
    } catch (e) {
      console.warn("[news:bulletin] Cloudflare AI failed:", e instanceof Error ? e.message : String(e));
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

// ── CORS headers ─────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://krishiai.live",
  "https://www.krishiai.live",
  "https://web.krishiai.live",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = !origin || origin.includes("localhost") || origin.includes("127.0.0.1") || ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? (origin || "*") : "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const today = new Date().toISOString().slice(0, 10);
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";
  const dayChanged = cachedDate !== today;

  // Check cache (auto-invalidate on day change or after 30 min)
  if (!forceRefresh && !dayChanged && cachedResponse && Date.now() - cachedAt < CACHE_TTL) {
    const origin = request.headers.get("origin");
    return NextResponse.json(cachedResponse, {
      headers: corsHeaders(origin),
    });
  }

  const ctx = bdAgriContext();

  // ── Fetch ALL sources in parallel ─────────────────────────────────────
  const [bnAgri, bnFertilizer, bnRice, bnWeather, bnAll, enAgri, enClimate, govRSS, govGoogle, intlRSS] = await Promise.all([
    fetchGoogleNewsRSS("কৃষি ফসল ধান বাংলাদেশ", "bn"),
    fetchGoogleNewsRSS("কৃষি সার বীজ সেচ", "bn"),
    fetchGoogleNewsRSS("বোরো আমন আউশ ধান", "bn"),
    fetchGoogleNewsRSS("আবহাওয়া কৃষি বাংলাদেশ", "bn"),
    fetchGoogleNewsRSS("বাংলাদেশ কৃষি সংবাদ সম্প্রসারণ", "bn"),
    fetchGoogleNewsRSS("agriculture Bangladesh crop rice", "en"),
    fetchGoogleNewsRSS("agriculture climate food security farming", "en"),
    fetchGovRSSFeeds(),          // CORS proxy → .gov.bd RSS
    fetchGoogleGovNews(),        // Google News site:gov.bd queries
    fetchIntlRSSFeeds(),         // International orgs (FAO, IFPRI, IRRI, etc.)
  ]);

  // ── Combine and deduplicate Bengali headlines ─────────────────────────
  const seenTitles = new Set<string>();
  const bengaliHeadlines: NewsItem[] = [];
  for (const item of [...bnAgri, ...bnFertilizer, ...bnRice, ...bnWeather, ...bnAll]) {
    const key = item.title.slice(0, 40).toLowerCase();
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      // Filter for recency
      if (isRecent(item.pubDate)) {
        bengaliHeadlines.push(item);
      }
    }
  }
  bengaliHeadlines.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  // ── English headlines (deduplicated) ──────────────────────────────────
  const seenEnTitles = new Set<string>();
  const englishHeadlines: NewsItem[] = [];
  for (const item of [...enAgri, ...enClimate]) {
    const key = item.title.slice(0, 40).toLowerCase();
    if (!seenEnTitles.has(key)) {
      seenEnTitles.add(key);
      if (isRecent(item.pubDate)) {
        englishHeadlines.push(item);
      }
    }
  }
  englishHeadlines.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  // ── Government headlines (merge from CORS proxy + Google site:gov.bd + curated) ──
  const govSeenTitles = new Set<string>();
  const govHeadlines: NewsItem[] = [];

  // 1. Live .gov.bd RSS via CORS proxy (highest priority — real data from portals)
  for (const item of govRSS) {
    const key = item.title.slice(0, 40).toLowerCase();
    if (!govSeenTitles.has(key)) {
      govSeenTitles.add(key);
      if (isRecent(item.pubDate)) {
        govHeadlines.push(item);
      }
    }
  }

  // 2. Google News site:gov.bd results
  for (const item of govGoogle) {
    const key = item.title.slice(0, 40).toLowerCase();
    if (!govSeenTitles.has(key)) {
      govSeenTitles.add(key);
      if (isRecent(item.pubDate)) {
        govHeadlines.push(item);
      }
    }
  }

  // 3. Curated seasonal advisories (always present as fallback, ensures .gov.bd visible)
  const curatedGov = buildGovCurated(ctx);
  for (const item of curatedGov) {
    const key = item.title.slice(0, 40).toLowerCase();
    if (!govSeenTitles.has(key)) {
      govSeenTitles.add(key);
      govHeadlines.push(item);
    }
  }

  // Sort: real/live items first (by date), then curated
  govHeadlines.sort((a, b) => {
    const aDate = new Date(a.pubDate).getTime();
    const bDate = new Date(b.pubDate).getTime();
    // If both are real or both are curated, sort by date
    return bDate - aDate;
  });

  // Determine government source status
  const govSource: "cors-proxy" | "google-site-gov" | "curated" | "unavailable" =
    govRSS.length > 0 ? "cors-proxy" :
    govGoogle.length > 0 ? "google-site-gov" :
    curatedGov.length > 0 ? "curated" : "unavailable";

  // Determine source status for regular headlines
  const headlinesSource: "google-news-rss" | "fallback" =
    bengaliHeadlines.length > 0 ? "google-news-rss" : "fallback";

  // Fallback if no Bengali headlines
  const finalHeadlines =
    bengaliHeadlines.length > 0
      ? bengaliHeadlines.slice(0, 20)
      : buildSeasonalFallback(ctx);

  // ── Deduplicate intl RSS with english headlines ───────────────────────
  const seenIntlTitles = new Set<string>();
  for (const item of intlRSS) {
    const key = item.title.slice(0, 40).toLowerCase();
    if (!seenIntlTitles.has(key)) {
      seenIntlTitles.add(key);
      if (isRecent(item.pubDate)) {
        // Add intl news to english headlines if not already present
        const exists = englishHeadlines.some((h) => h.title.slice(0, 40).toLowerCase() === key);
        if (!exists) {
          englishHeadlines.push(item);
        }
      }
    }
  }
  englishHeadlines.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  // ── AI Daily Bulletin ─────────────────────────────────────────────────
  const allHeadlines = [...finalHeadlines, ...englishHeadlines.slice(0, 5), ...govHeadlines.slice(0, 3)];
  const bulletin = await generateDailyBulletin(ctx, allHeadlines);

  // Separate intl from english for dedicated display
  const intlHeadlines = englishHeadlines.filter((h) =>
    ["FAO", "IFPRI", "IRRI", "World Bank", "CGIAR", "IPS", "SciDev.Net"].includes(h.source)
  );
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
  };

  // Cache the response
  cachedResponse = response;
  cachedAt = Date.now();
  cachedDate = today;

  const origin = request.headers.get("origin");
  return NextResponse.json(response, { headers: corsHeaders(origin) });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
