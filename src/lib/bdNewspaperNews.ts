/**
 * Direct HTML/XML extraction of Bangladesh agriculture news
 * from renowned newspapers. No third-party news APIs.
 */

export interface NewspaperNewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sourceEn: string;
  sourceUrl: string;
  sourceId: string;
  color: string;
  lang: "bn" | "en";
  icon: string;
  isGov: boolean;
  extractionTime: string;
  extractionMethod: "html" | "html-json" | "xml-feed";
  credibility: "high";
}

export interface NewspaperSourceStatus {
  id: string;
  name: string;
  home: string;
  extracted: number;
  ok: boolean;
  errors: string[];
}

export interface NewspaperCollectResult {
  ok: boolean;
  extractedAt: string;
  extractor: string;
  method: "newspaper-html";
  headlines: NewspaperNewsItem[];
  bengali: NewspaperNewsItem[];
  english: NewspaperNewsItem[];
  sources: NewspaperSourceStatus[];
  counts: {
    total: number;
    bengali: number;
    english: number;
    newspapers: number;
  };
}

interface NewspaperConfig {
  id: string;
  name: string;
  nameEn: string;
  home: string;
  pages: string[];
  feeds: string[];
  lang: "bn" | "en";
  color: string;
  parser: "quintype" | "anchors";
  credibility: "high";
}

export const BD_NEWSPAPERS: NewspaperConfig[] = [
  {
    id: "prothom-alo",
    name: "প্রথম আলো",
    nameEn: "Prothom Alo",
    home: "https://www.prothomalo.com/",
    pages: ["https://www.prothomalo.com/", "https://www.prothomalo.com/business"],
    feeds: ["https://www.prothomalo.com/feed"],
    lang: "bn",
    color: "#1b8a3e",
    parser: "quintype",
    credibility: "high",
  },
  {
    id: "prothom-alo-en",
    name: "Prothom Alo (EN)",
    nameEn: "Prothom Alo English",
    home: "https://en.prothomalo.com/",
    pages: ["https://en.prothomalo.com/", "https://en.prothomalo.com/business"],
    feeds: [],
    lang: "en",
    color: "#1b8a3e",
    parser: "quintype",
    credibility: "high",
  },
  {
    id: "daily-star",
    name: "The Daily Star",
    nameEn: "The Daily Star",
    home: "https://www.thedailystar.net/",
    pages: [
      "https://www.thedailystar.net/business/agriculture",
      "https://www.thedailystar.net/business",
    ],
    feeds: ["https://www.thedailystar.net/business/rss.xml"],
    lang: "en",
    color: "#1d4ed8",
    parser: "anchors",
    credibility: "high",
  },
  {
    id: "tbs",
    name: "The Business Standard",
    nameEn: "The Business Standard",
    home: "https://www.tbsnews.net/",
    pages: ["https://www.tbsnews.net/economy/agriculture"],
    feeds: ["https://www.tbsnews.net/rss.xml"],
    lang: "en",
    color: "#1d4ed8",
    parser: "anchors",
    credibility: "high",
  },
  {
    id: "financial-express",
    name: "Financial Express",
    nameEn: "The Financial Express",
    home: "https://today.thefinancialexpress.com.bd/",
    pages: ["https://today.thefinancialexpress.com.bd/"],
    feeds: [],
    lang: "en",
    color: "#b45309",
    parser: "anchors",
    credibility: "high",
  },
  {
    id: "bdnews24-bn",
    name: "bdnews24",
    nameEn: "bdnews24 Bangla",
    home: "https://bangla.bdnews24.com/",
    pages: [
      "https://bangla.bdnews24.com/",
      "https://bangla.bdnews24.com/business",
      "https://bangla.bdnews24.com/economy",
    ],
    feeds: [],
    lang: "bn",
    color: "#dc2626",
    parser: "anchors",
    credibility: "high",
  },
  {
    id: "bdnews24-en",
    name: "bdnews24",
    nameEn: "bdnews24 English",
    home: "https://bdnews24.com/",
    pages: ["https://bdnews24.com/", "https://bdnews24.com/economy"],
    feeds: [],
    lang: "en",
    color: "#dc2626",
    parser: "anchors",
    credibility: "high",
  },
];

const AGRI_BN = [
  "কৃষি",
  "কৃষক",
  "ফসল",
  "বোরো",
  "আমন",
  "আউশ",
  "সেচ",
  "বীজতলা",
  "বীজ",
  "সারের",
  "সার ",
  "পাট",
  "আলু",
  "গমের",
  "সবজি",
  "পেঁয়াজ",
  "পেয়াজ",
  "মৎস্য",
  "পশুপালন",
  "দুগ্ধ",
  "খাদ্যশস্য",
  "খাদ্য নিরাপত্তা",
  "কৃষি মন্ত্রণালয়",
  "কৃষি সম্প্রসারণ",
  "সার ভর্তুকি",
  "কৃষি ঋণ",
  "মাছ চাষ",
  "গবাদি",
  "খামার",
  "চাষাবাদ",
  "ফসলের",
  "ধানের",
  "ধান চাষ",
  "ফসলহানি",
  "কীটনাশক",
  "বালাইনাশক",
  "মরিচ",
  "রসুন",
  "সরিষা",
  "আখ",
  "পাটের",
  "প্রাণিসম্পদ",
  "হাওর",
  "কৃষিপণ্য",
  "কৃষিজ",
  "উৎপাদন খরচ",
  "সার-বীজ",
];

const AGRI_EN = [
  "agriculture",
  "agricultural",
  "farmer",
  "farmers",
  "farming",
  "crop",
  "paddy",
  "rice",
  "wheat",
  "jute",
  "potato",
  "onion",
  "garlic",
  "vegetable",
  "fertiliser",
  "fertilizer",
  "irrigation",
  "harvest",
  "seedling",
  "pesticide",
  "livestock",
  "fisheries",
  "fishery",
  "fishermen",
  "aquaculture",
  "dairy",
  "poultry",
  "food security",
  "foodgrain",
  "food grain",
  "boro rice",
  "boro paddy",
  "aman rice",
  "aman paddy",
  "monsoon",
  "subsidy",
  "cultivation",
  "cultivate",
  "plantation",
  "tea garden",
  "sugarcane",
  "edible oil",
  "soybean",
  "chilli",
  "chili",
];

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 KrishiAI-NewsExtractor/1.0";

const MAX_AGE_DAYS = 7;

export function unescapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

export function stripTags(html: string): string {
  return unescapeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function isAgriHeadline(title: string): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  if (
    AGRI_EN.some((k) => {
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|[^a-z])${escaped}(?:$|[^a-z])`, "i").test(lower);
    })
  ) {
    return true;
  }
  const sanitized = title
    .replace(/প্রধানমন্ত্রী/g, " ")
    .replace(/প্রধান উপদেষ্টা/g, " ")
    .replace(/প্রধান নির্বাচন/g, " ")
    .replace(/প্রধানমন্ত্রীর/g, " ")
    .replace(/সংসার/g, " ")
    .replace(/আসবাব/g, " ");
  return AGRI_BN.some((k) => sanitized.includes(k));
}

export function parsePublisherDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    const ms = value > 1e12 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const text = String(value).trim();
  const d = new Date(text);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return null;
}

export function isRecent(pubDate: string | null | undefined, now = Date.now()): boolean {
  if (!pubDate) return true;
  const t = new Date(pubDate).getTime();
  if (Number.isNaN(t)) return true;
  const age = now - t;
  if (age < -12 * 3600 * 1000) return true;
  return age < MAX_AGE_DAYS * 24 * 3600 * 1000;
}

function absoluteUrl(link: string, home: string): string {
  const raw = unescapeHtml(link).split("#")[0];
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  try {
    return new URL(raw, home).toString();
  } catch {
    return "";
  }
}

export function makeNewsItem(
  title: string,
  link: string,
  source: NewspaperConfig,
  pubDate: string | null,
  extractionTime: string,
  method: NewspaperNewsItem["extractionMethod"]
): NewspaperNewsItem | null {
  const cleanTitle = stripTags(title).replace(/^(Title link|title link)\s+/i, "").trim();
  if (cleanTitle.length < 18 || cleanTitle.length > 180) return null;
  if (!isAgriHeadline(cleanTitle)) return null;
  if (!link || link.startsWith("javascript:")) return null;
  const abs = absoluteUrl(link, source.home);
  if (!abs.startsWith("http")) return null;
  if (/\/search|\/login|\/tag\/|\/tags\/|\/author\//i.test(abs)) return null;
  return {
    title: cleanTitle,
    link: abs,
    pubDate: pubDate || extractionTime,
    source: source.name,
    sourceEn: source.nameEn,
    sourceUrl: source.home,
    sourceId: source.id,
    color: source.color,
    lang: source.lang,
    icon: "📰",
    isGov: false,
    extractionTime,
    extractionMethod: method,
    credibility: source.credibility,
  };
}

export function extractQuintypeStories(html: string): Array<{
  headline: string;
  url: string;
  published?: unknown;
}> {
  const match = html.match(/<script[^>]*>(\{"qt":[\s\S]*?)<\/script>/i);
  if (!match) return [];
  try {
    const payload = JSON.parse(match[1]) as unknown;
    const stories: Array<{ headline: string; url: string; published?: unknown }> = [];
    const walk = (node: unknown): void => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (const child of node) walk(child);
        return;
      }
      const rec = node as Record<string, unknown>;
      if (typeof rec.headline === "string" && typeof rec.url === "string") {
        stories.push({
          headline: rec.headline,
          url: rec.url,
          published: rec["last-published-at"] ?? rec["first-published-at"] ?? rec["published-at"],
        });
        return;
      }
      for (const value of Object.values(rec)) walk(value);
    };
    walk(payload);
    return stories;
  } catch {
    return [];
  }
}

export function extractAnchors(html: string): Array<{ href: string; text: string; datetime: string }> {
  const out: Array<{ href: string; text: string; datetime: string }> = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const hrefMatch = m[1].match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const aria = m[1].match(/aria-label=["']([^"']+)["']/i);
    const timeMatch = m[2].match(/datetime=["']([^"']+)["']/i);
    const text = stripTags(aria?.[1] || m[2]);
    out.push({ href: hrefMatch[1], text, datetime: timeMatch?.[1] || "" });
  }
  return out;
}

export function extractRssItems(xml: string): Array<{ title: string; link: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; pubDate: string }> = [];
  const blocks = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    const grab = (tag: string): string => {
      const mm = block.match(
        new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i")
      );
      return mm ? unescapeHtml(mm[1].trim()) : "";
    };
    const title = stripTags(grab("title"));
    const link = grab("link") || grab("guid");
    const pubDate = grab("pubDate") || grab("dc:date");
    if (title && link) items.push({ title, link, pubDate });
  }
  return items;
}

export function itemsFromHtml(
  html: string,
  source: NewspaperConfig,
  extractionTime: string
): NewspaperNewsItem[] {
  const collected: NewspaperNewsItem[] = [];
  if (source.parser === "quintype") {
    for (const story of extractQuintypeStories(html)) {
      const item = makeNewsItem(
        story.headline,
        story.url,
        source,
        parsePublisherDate(story.published),
        extractionTime,
        "html-json"
      );
      if (item) collected.push(item);
    }
  }
  for (const anchor of extractAnchors(html)) {
    const item = makeNewsItem(
      anchor.text,
      anchor.href,
      source,
      parsePublisherDate(anchor.datetime || null),
      extractionTime,
      "html"
    );
    if (item) collected.push(item);
  }
  return collected;
}

export function itemsFromXml(
  xml: string,
  source: NewspaperConfig,
  extractionTime: string
): NewspaperNewsItem[] {
  if (!/<item/i.test(xml)) return [];
  const collected: NewspaperNewsItem[] = [];
  for (const row of extractRssItems(xml)) {
    const item = makeNewsItem(
      row.title,
      row.link,
      source,
      parsePublisherDate(row.pubDate),
      extractionTime,
      "xml-feed"
    );
    if (item) collected.push(item);
  }
  return collected;
}

function dedupe(items: NewspaperNewsItem[]): NewspaperNewsItem[] {
  const seen = new Set<string>();
  const out: NewspaperNewsItem[] = [];
  for (const item of items) {
    const key = item.title.slice(0, 48).toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  out.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return out;
}

async function fetchPage(url: string, timeoutMs = 12000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "bn-BD,bn,en-US,en;q=0.8",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function collectNewspaperNews(
  fetchFn: (url: string) => Promise<string> = fetchPage,
  newspapers: NewspaperConfig[] = BD_NEWSPAPERS,
  now = new Date()
): Promise<NewspaperCollectResult> {
  const extractionTime = now.toISOString();
  const allItems: NewspaperNewsItem[] = [];
  const sourceStatus: NewspaperSourceStatus[] = [];

  await Promise.all(
    newspapers.map(async (paper) => {
      let got = 0;
      const errors: string[] = [];
      const targets = [...paper.pages, ...paper.feeds];
      const results = await Promise.allSettled(targets.map((url) => fetchFn(url)));
      results.forEach((result, idx) => {
        const url = targets[idx];
        if (result.status !== "fulfilled") {
          errors.push(`${url}: ${result.reason instanceof Error ? result.reason.name : "error"}`);
          return;
        }
        const body = result.value;
        const batch = paper.feeds.includes(url)
          ? itemsFromXml(body, paper, extractionTime)
          : itemsFromHtml(body, paper, extractionTime);
        allItems.push(...batch);
        got += batch.length;
      });
      sourceStatus.push({
        id: paper.id,
        name: paper.name,
        home: paper.home,
        extracted: got,
        ok: got > 0,
        errors,
      });
    })
  );

  const unique = dedupe(allItems.filter((it) => isRecent(it.pubDate, now.getTime())));
  const bengali = unique.filter((it) => it.lang === "bn");
  const english = unique.filter((it) => it.lang === "en");
  return {
    ok: true,
    extractedAt: extractionTime,
    extractor: "src/lib/bdNewspaperNews.ts",
    method: "newspaper-html",
    headlines: unique,
    bengali,
    english,
    sources: sourceStatus,
    counts: {
      total: unique.length,
      bengali: bengali.length,
      english: english.length,
      newspapers: newspapers.length,
    },
  };
}
