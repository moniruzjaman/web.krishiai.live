/**
 * /api/news — KrishiAI News API
 *
 * Uses Google News RSS as primary source (replaces failing BD government portals).
 * Google News aggregates from all authentic BD sources (Daily Star, Prothom Alo,
 * Kaler Kantho, bdnews24, etc.) and is designed for server-side consumption.
 *
 * Also generates AI daily bulletin using z-ai-web-dev-sdk.
 * Falls back to seasonal calendar entries if Google News RSS fails.
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
  sources: {
    headlines: "google-news-rss" | "fallback";
    bulletin: "ai-generated" | "unavailable";
  };
}

// ── In-memory cache (30 min, auto-invalidates on day change) ──────────────────
let cachedResponse: NewsResponse | null = null;
let cachedAt = 0;
let cachedDate = "";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

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
];

const AGRI_KW_EN = [
  "agri", "crop", "rice", "wheat", "farmer", "harvest", "fertilizer", "seed",
  "food", "grain", "agriculture", "paddy", "irrigation", "pest", "drought",
  "flood", "cultivation", "livestock", "fisheries", "crop-yield", "Bangladesh",
  "monsoon", "boro", "aman", "aus", "jute", "potato", "onion", "vegetable",
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
          "International Rice Research Institute (IRRI)": "IRRI",
          "International Labour Organization": "ILO",
          "Pulitzer Center": "Pulitzer Center",
          "Nature": "Nature",
          "CGIAR": "CGIAR",
          "Mongabay": "Mongabay",
          "The World Economic Forum": "WEF",
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
        };

        const color = sourceColors[normalizedSource] || (lang === "bn" ? "#1b8a3e" : "#1d4ed8");

        return {
          title,
          link: it.link,
          pubDate: it.pubDate,
          source: normalizedSource,
          color,
          icon: "📰",
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

// ── AI Daily Bulletin using z-ai-web-dev-sdk ─────────────────────────────────
async function generateDailyBulletin(
  ctx: ReturnType<typeof bdAgriContext>,
  newsHeadlines: NewsItem[]
): Promise<DailyBulletin | null> {
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

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

    const result = await zai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
    });

    const text = result.choices?.[0]?.message?.content;
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
    console.error("[news] AI bulletin generation failed:", e);
    return null;
  }
}

// ── CORS headers ─────────────────────────────────────────────────────────────
function corsHeaders(request: NextRequest): Record<string, string> {
  const allowed = [
    "https://krishiai.live",
    "https://www.krishiai.live",
    "https://web.krishiai.live",
  ];
  const origin = request.headers.get("origin") || "";
  const accessControl =
    allowed.includes(origin) || origin.includes("localhost")
      ? origin
      : allowed[0];

  return {
    "Access-Control-Allow-Origin": accessControl,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=600",
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const today = new Date().toISOString().slice(0, 10);
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";
  const dayChanged = cachedDate !== today;

  // Check cache (auto-invalidate on day change or after 30 min)
  if (!forceRefresh && !dayChanged && cachedResponse && Date.now() - cachedAt < CACHE_TTL) {
    return NextResponse.json(cachedResponse, {
      headers: corsHeaders(request),
    });
  }

  const ctx = bdAgriContext();

  // ── Fetch Google News RSS feeds in parallel ───────────────────────────
  const [bnAgri, bnFertilizer, bnRice, enAgri] = await Promise.all([
    fetchGoogleNewsRSS("কৃষি ফসল ধান বাংলাদেশ", "bn"),
    fetchGoogleNewsRSS("কৃষি সার বীজ সেচ", "bn"),
    fetchGoogleNewsRSS("বোরো আমন আউশ ধান", "bn"),
    fetchGoogleNewsRSS("agriculture Bangladesh crop rice", "en"),
  ]);

  // Combine and deduplicate Bengali headlines
  const seenTitles = new Set<string>();
  const bengaliHeadlines: NewsItem[] = [];
  for (const item of [...bnAgri, ...bnFertilizer, ...bnRice]) {
    const key = item.title.slice(0, 40).toLowerCase();
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      bengaliHeadlines.push(item);
    }
  }
  bengaliHeadlines.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  // English headlines (deduplicated)
  const seenEnTitles = new Set<string>();
  const englishHeadlines: NewsItem[] = [];
  for (const item of enAgri) {
    const key = item.title.slice(0, 40).toLowerCase();
    if (!seenEnTitles.has(key)) {
      seenEnTitles.add(key);
      englishHeadlines.push(item);
    }
  }
  englishHeadlines.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  // Determine source status
  const headlinesSource: "google-news-rss" | "fallback" =
    bengaliHeadlines.length > 0 ? "google-news-rss" : "fallback";

  // Fallback if no Bengali headlines
  const finalHeadlines =
    bengaliHeadlines.length > 0
      ? bengaliHeadlines.slice(0, 20)
      : buildSeasonalFallback(ctx);

  // ── AI Daily Bulletin ─────────────────────────────────────────────────
  const allHeadlines = [...finalHeadlines, ...englishHeadlines.slice(0, 5)];
  const bulletin = await generateDailyBulletin(ctx, allHeadlines);

  const response: NewsResponse = {
    ok: true,
    date: today,
    season: ctx.season,
    bulletin,
    headlines: finalHeadlines,
    englishHeadlines: englishHeadlines.slice(0, 15),
    sources: {
      headlines: headlinesSource,
      bulletin: bulletin ? "ai-generated" : "unavailable",
    },
  };

  // Cache the response
  cachedResponse = response;
  cachedAt = Date.now();
  cachedDate = today;

  return NextResponse.json(response, { headers: corsHeaders(request) });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
