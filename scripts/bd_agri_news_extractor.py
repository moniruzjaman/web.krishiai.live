#!/usr/bin/env python3
"""Extract daily Bangladesh agriculture news from newspaper HTML/XML.

No third-party news APIs. Direct HTTP GET of publisher pages and publisher XML.
"""

from __future__ import annotations

import json
import re
import ssl
import sys
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from typing import Any, Callable, Dict, List, Optional
from urllib.parse import urljoin

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 KrishiAI-NewsExtractor/1.0"
)

MAX_AGE_DAYS = 7

NEWSPAPERS: List[Dict[str, Any]] = [
    {
        "id": "prothom-alo",
        "name": "প্রথম আলো",
        "name_en": "Prothom Alo",
        "home": "https://www.prothomalo.com/",
        "pages": [
            "https://www.prothomalo.com/business",
            "https://www.prothomalo.com/bangladesh",
        ],
        "feeds": ["https://www.prothomalo.com/feed"],
        "lang": "bn",
        "color": "#1b8a3e",
        "parser": "quintype",
        "credibility": "high",
    },
    {
        "id": "prothom-alo-en",
        "name": "Prothom Alo (EN)",
        "name_en": "Prothom Alo English",
        "home": "https://en.prothomalo.com/",
        "pages": ["https://en.prothomalo.com/business"],
        "feeds": [],
        "lang": "en",
        "color": "#1b8a3e",
        "parser": "quintype",
        "credibility": "high",
    },
    {
        "id": "daily-star",
        "name": "The Daily Star",
        "name_en": "The Daily Star",
        "home": "https://www.thedailystar.net/",
        "pages": ["https://www.thedailystar.net/business/agriculture"],
        "feeds": ["https://www.thedailystar.net/business/rss.xml"],
        "lang": "en",
        "color": "#1d4ed8",
        "parser": "anchors",
        "credibility": "high",
    },
    {
        "id": "tbs",
        "name": "The Business Standard",
        "name_en": "The Business Standard",
        "home": "https://www.tbsnews.net/",
        "pages": ["https://www.tbsnews.net/economy/agriculture"],
        "feeds": [],
        "lang": "en",
        "color": "#1d4ed8",
        "parser": "anchors",
        "credibility": "high",
    },
    {
        "id": "financial-express",
        "name": "Financial Express",
        "name_en": "The Financial Express",
        "home": "https://today.thefinancialexpress.com.bd/",
        "pages": [
            "https://today.thefinancialexpress.com.bd/trade-commodities",
            "https://today.thefinancialexpress.com.bd/country",
        ],
        "feeds": [],
        "lang": "en",
        "color": "#b45309",
        "parser": "anchors",
        "credibility": "high",
    },
    {
        "id": "bdnews24-bn",
        "name": "bdnews24",
        "name_en": "bdnews24 Bangla",
        "home": "https://bangla.bdnews24.com/",
        "pages": [
            "https://bangla.bdnews24.com/business",
            "https://bangla.bdnews24.com/economy",
        ],
        "feeds": [],
        "lang": "bn",
        "color": "#dc2626",
        "parser": "anchors",
        "credibility": "high",
    },
    {
        "id": "bdnews24-en",
        "name": "bdnews24",
        "name_en": "bdnews24 English",
        "home": "https://bdnews24.com/",
        "pages": ["https://bdnews24.com/economy"],
        "feeds": [],
        "lang": "en",
        "color": "#dc2626",
        "parser": "anchors",
        "credibility": "high",
    },
]

AGRI_BN = [
    "কৃষি",
    "কৃষক",
    "ফসল",
    "বোরো",
    "আমন",
    "আউশ",
    "সেচ",
    "বীজতলা",
    "সারের",
    "সার ",
    "পাট",
    "গমের",
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
    "সরিষা",
    "আখ",
    "পাটের",
    "প্রাণিসম্পদ",
    "কৃষিপণ্য",
    "কৃষিজ",
    "উৎপাদন খরচ",
    "সার-বীজ",
    "চাষি",
    "কৃষিকাজ",
    "ধান চাষি",
    "ফসল উৎপাদন",
    "কৃষি উপকরণ",
    "কৃষি বাজার",
    "কৃষিপণ্যের",
    "খামারি",
    "পোলট্রি",
    "মুরগি খামার",
    "মাছের ঘের",
    "ইরি ধান",
    "রোপা আমন",
    "রোপা আউশ",
]

AGRI_EN = [
    "agriculture",
    "agricultural",
    "farmer",
    "farmers",
    "farming",
    "paddy",
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
    "poultry",
    "food security",
    "foodgrain",
    "food grain",
    "boro rice",
    "boro paddy",
    "aman rice",
    "aman paddy",
    "cultivation",
    "cultivate",
    "tea garden",
    "sugarcane",
    "crop yield",
    "crop production",
    "farm loan",
    "farm loans",
    "agri loan",
    "agri loans",
    "farm subsidy",
    "agricultural subsidy",
    "horticulture",
    "agronomy",
    "planted acreage",
    "transplanting",
]

AGRI_EN_WEAK = [
    "crop",
    "rice",
    "wheat",
    "jute",
    "potato",
    "onion",
    "garlic",
    "vegetable",
    "dairy",
    "soybean",
    "chilli",
    "chili",
    "edible oil",
    "plantation",
    "monsoon",
]

AGRI_BN_WEAK = [
    "বীজ",
    "আলু",
    "মরিচ",
    "রসুন",
    "হাওর",
    "সবজি",
    "পেঁয়াজ",
    "পেয়াজ",
    "ধান",
]

AGRI_CONTEXT_EN = [
    "farm",
    "farmer",
    "farmers",
    "farming",
    "agriculture",
    "agricultural",
    "agri",
    "paddy",
    "harvest",
    "cultivat",
    "irrigation",
    "fertilis",
    "fertiliz",
    "livestock",
    "poultry",
    "fisher",
    "aquaculture",
    "seedling",
    "pesticide",
    "grower",
    "acreage",
    "sowing",
    "sown",
    "yield",
    "harvesting",
]

AGRI_CONTEXT_BN = [
    "কৃষি",
    "কৃষক",
    "চাষ",
    "ফসল",
    "খামার",
    "সেচ",
    "সার",
    "উৎপাদন",
    "মৎস্য",
    "পশুপালন",
    "প্রাণিসম্পদ",
    "জমি",
]

REJECT_EN = [
    "cricket",
    "football",
    "world cup",
    "premier league",
    "tennis",
    "election",
    "parliament",
    "political party",
    "prime minister",
    "film star",
    "movie",
    "celebrity",
    "stock market",
    "share price",
    "dhaka stock",
    "dse ",
    "bank interest",
    "remittance",
    "rmg ",
    "garment",
    "ready-made",
    "export processing",
    "epz",
    "telecom",
    "mobile operator",
    "starlink",
    "banglalink",
    "grameenphone",
    "urbanisation",
    "urbanization",
    "labour act",
    "labor act",
    "kingfisher beer",
    "beer sales",
    "borough council",
    "warm-up match",
    "tigers win",
    "university",
    "vice chancellor",
    "vice-chancellor",
    "recruitment",
    "job vacancy",
]

REJECT_BN = [
    "দুর্গাপূজা",
    "ক্রিকেট",
    "ফুটবল",
    "সংসদ অধিবেশন",
    "নির্বাচন কমিশন",
    "রাজনৈতিক দল",
    "চলচ্চিত্র",
    "বলিউড",
    "শেয়ারবাজার",
    "ডিএসই",
    "পোশাক শিল্প",
    "রপ্তানি প্রক্রিয়াকরণ",
    "মোবাইল অপারেটর",
    "বিশ্ববিদ্যালয়ের শিক্ষার্থী",
    "কৃষি ভিসা",
    "কৃষি পর্যটন",
    "বিশ্ববিদ্যালয়",
    "বিশ্ববিদ্যালয়",
    "উপাচার্য",
    "নিয়োগ",
    "নিয়োগ",
]


def unescape_html(text: str) -> str:
    text = (
        text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
        .replace("&nbsp;", " ")
        .replace("&apos;", "'")
    )
    text = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), text)
    text = re.sub(r"&#x([0-9a-fA-F]+);", lambda m: chr(int(m.group(1), 16)), text)
    return text


def strip_tags(html: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape_html(text)
    return re.sub(r"\s+", " ", text).strip()


def _word_boundary_match(text: str, keyword: str) -> bool:
    return bool(
        re.search(
            r"(?:^|[^a-z])" + re.escape(keyword.lower()) + r"(?:$|[^a-z])",
            text,
        )
    )


def is_agri(title: str) -> bool:
    if not title:
        return False
    lowered_raw = title.lower()
    if any(_word_boundary_match(lowered_raw, k) for k in REJECT_EN):
        return False
    if any(k in title for k in REJECT_BN):
        return False
    sanitized = (
        title.replace("প্রধানমন্ত্রী", " ")
        .replace("প্রধান উপদেষ্টা", " ")
        .replace("প্রধান নির্বাচন", " ")
        .replace("প্রধানমন্ত্রীর", " ")
        .replace("রাজধানী", " ")
        .replace("সংসার", " ")
        .replace("আসবাব", " ")
    )
    if any(_word_boundary_match(lowered_raw, k) for k in AGRI_EN):
        return True
    if any(k in sanitized for k in AGRI_BN):
        return True
    weak_en = any(_word_boundary_match(lowered_raw, k) for k in AGRI_EN_WEAK)
    weak_bn = any(k in sanitized for k in AGRI_BN_WEAK)
    if not weak_en and not weak_bn:
        return False
    return any(_word_boundary_match(lowered_raw, k) for k in AGRI_CONTEXT_EN) or any(
        k in sanitized for k in AGRI_CONTEXT_BN
    )


def parse_pub_date(value: Any) -> Optional[str]:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        ms = float(value)
        if ms > 1e12:
            ms = ms / 1000.0
        try:
            return datetime.fromtimestamp(ms, tz=timezone.utc).isoformat()
        except (OverflowError, OSError, ValueError):
            return None
    text = str(value).strip()
    if not text:
        return None
    for fmt in (
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %y %H:%M:%S %z",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S.%f%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            cleaned = text.replace("Z", "+00:00") if fmt.endswith("%z") and text.endswith("Z") else text
            dt = datetime.strptime(cleaned, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc).isoformat()
        except ValueError:
            continue
    try:
        dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    except ValueError:
        return None


def is_recent(iso_date: Optional[str], now: Optional[datetime] = None) -> bool:
    if not iso_date:
        return True
    now = now or datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        age = now - dt
        if age.total_seconds() < -12 * 3600:
            return True
        return age.total_seconds() < MAX_AGE_DAYS * 24 * 3600
    except ValueError:
        return True


def make_item(
    *,
    title: str,
    link: str,
    source: Dict[str, Any],
    pub_date: Optional[str],
    extraction_time: str,
    method: str,
) -> Optional[Dict[str, Any]]:
    title = strip_tags(title)
    title = re.sub(r"^(Title link|title link)\s+", "", title).strip()
    if len(title) < 18 or len(title) > 180:
        return None
    if not is_agri(title):
        return None
    if not link or link.startswith("javascript:"):
        return None
    link = unescape_html(link)
    if link.startswith("/"):
        link = urljoin(source["home"], link)
    if not link.startswith("http"):
        return None
    skip_bits = ("/search", "/login", "/tag/", "/tags/", "/author/", "#")
    if any(b in link for b in skip_bits):
        return None
    if re.search(
        r"/(sports?|cricket|football|entertainment|lifestyle|glitz|politics|election|opinion|movie|cinema|world-cup)\b",
        link,
        flags=re.I,
    ):
        return None
    return {
        "title": title,
        "link": link.split("#")[0],
        "pubDate": pub_date or extraction_time,
        "source": source["name"],
        "sourceEn": source["name_en"],
        "sourceUrl": source["home"],
        "sourceId": source["id"],
        "color": source["color"],
        "lang": source["lang"],
        "icon": "📰",
        "isGov": False,
        "extractionTime": extraction_time,
        "extractionMethod": method,
        "credibility": source["credibility"],
    }


def extract_quintype_stories(html: str) -> List[Dict[str, Any]]:
    match = re.search(r'<script[^>]*>(\{"qt":[\s\S]*?)</script>', html)
    if not match:
        return []
    try:
        payload = json.loads(match.group(1))
    except json.JSONDecodeError:
        return []
    stories: List[Dict[str, Any]] = []

    def walk(node: Any) -> None:
        if isinstance(node, dict):
            headline = node.get("headline")
            url = node.get("url")
            if headline and url:
                stories.append(
                    {
                        "headline": headline,
                        "url": url,
                        "published": node.get("last-published-at")
                        or node.get("first-published-at")
                        or node.get("published-at"),
                    }
                )
                return
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(payload)
    return stories


class AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.anchors: List[Dict[str, str]] = []
        self._href: Optional[str] = None
        self._parts: List[str] = []
        self._depth = 0

    def handle_starttag(self, tag: str, attrs: List[tuple]) -> None:
        if tag == "a":
            href = dict(attrs).get("href")
            aria = dict(attrs).get("aria-label")
            if self._depth == 0:
                self._href = href
                self._parts = [aria] if aria else []
            self._depth += 1
        if self._depth and tag == "time":
            dt = dict(attrs).get("datetime")
            if dt:
                self._parts.append(f"__TIME__{dt}")

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._depth:
            self._depth -= 1
            if self._depth == 0 and self._href:
                text = " ".join(p for p in self._parts if p and not p.startswith("__TIME__"))
                times = [p[8:] for p in self._parts if p.startswith("__TIME__")]
                self.anchors.append(
                    {
                        "href": self._href,
                        "text": re.sub(r"\s+", " ", text).strip(),
                        "datetime": times[0] if times else "",
                    }
                )
                self._href = None
                self._parts = []

    def handle_data(self, data: str) -> None:
        if self._depth and data.strip():
            self._parts.append(data.strip())


def extract_anchors(html: str) -> List[Dict[str, str]]:
    parser = AnchorParser()
    try:
        parser.feed(html)
    except Exception:
        hrefs = re.findall(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>([\s\S]*?)</a>', html, flags=re.I)
        return [{"href": h, "text": strip_tags(t), "datetime": ""} for h, t in hrefs]
    return parser.anchors


def extract_rss_items(xml: str) -> List[Dict[str, str]]:
    items: List[Dict[str, str]] = []
    for block in re.findall(r"<item[^>]*>([\s\S]*?)</item>", xml, flags=re.I):

        def grab(tag: str) -> str:
            m = re.search(
                rf"<{tag}[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?</{tag}>",
                block,
                flags=re.I,
            )
            return unescape_html(m.group(1).strip()) if m else ""

        title = strip_tags(grab("title"))
        link = grab("link") or grab("guid")
        pub = grab("pubDate") or grab("dc:date")
        if title and link:
            items.append({"title": title, "link": link, "pubDate": pub})
    return items


def items_from_html(
    html: str, source: Dict[str, Any], extraction_time: str
) -> List[Dict[str, Any]]:
    collected: List[Dict[str, Any]] = []
    if source.get("parser") == "quintype":
        for story in extract_quintype_stories(html):
            item = make_item(
                title=str(story.get("headline") or ""),
                link=str(story.get("url") or ""),
                source=source,
                pub_date=parse_pub_date(story.get("published")),
                extraction_time=extraction_time,
                method="html-json",
            )
            if item:
                collected.append(item)
    for anchor in extract_anchors(html):
        item = make_item(
            title=anchor.get("text") or "",
            link=anchor.get("href") or "",
            source=source,
            pub_date=parse_pub_date(anchor.get("datetime") or None),
            extraction_time=extraction_time,
            method="html",
        )
        if item:
            collected.append(item)
    return collected


def items_from_xml(
    xml: str, source: Dict[str, Any], extraction_time: str
) -> List[Dict[str, Any]]:
    collected: List[Dict[str, Any]] = []
    if "<item" not in xml.lower():
        return collected
    for row in extract_rss_items(xml):
        item = make_item(
            title=row["title"],
            link=row["link"],
            source=source,
            pub_date=parse_pub_date(row.get("pubDate")),
            extraction_time=extraction_time,
            method="xml-feed",
        )
        if item:
            collected.append(item)
    return collected


def default_fetch(url: str, timeout: int = 12) -> str:
    ctx = ssl.create_default_context()
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "bn-BD,bn,en-US,en;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        raw = resp.read()
        charset = resp.headers.get_content_charset() or "utf-8"
        return raw.decode(charset, "replace")


def dedupe(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    out: List[Dict[str, Any]] = []
    for item in items:
        key = re.sub(r"\s+", " ", item["title"][:48]).lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    out.sort(key=lambda it: it.get("pubDate") or "", reverse=True)
    return out


def collect_newspaper_news(
    fetch_fn: Optional[Callable[[str], str]] = None,
    newspapers: Optional[List[Dict[str, Any]]] = None,
    now: Optional[datetime] = None,
) -> Dict[str, Any]:
    fetch_fn = fetch_fn or default_fetch
    newspapers = newspapers or NEWSPAPERS
    now = now or datetime.now(timezone.utc)
    extraction_time = now.isoformat()
    all_items: List[Dict[str, Any]] = []
    source_status: List[Dict[str, Any]] = []

    for paper in newspapers:
        got = 0
        errors: List[str] = []
        for page in paper.get("pages") or []:
            try:
                html = fetch_fn(page)
                batch = items_from_html(html, paper, extraction_time)
                all_items.extend(batch)
                got += len(batch)
            except Exception as exc:
                errors.append(f"{page}: {type(exc).__name__}")
        for feed in paper.get("feeds") or []:
            try:
                xml = fetch_fn(feed)
                batch = items_from_xml(xml, paper, extraction_time)
                all_items.extend(batch)
                got += len(batch)
            except Exception as extra:
                errors.append(f"{feed}: {type(extra).__name__}")
        source_status.append(
            {
                "id": paper["id"],
                "name": paper["name"],
                "home": paper["home"],
                "extracted": got,
                "ok": got > 0,
                "errors": errors,
            }
        )

    filtered = [it for it in all_items if is_recent(it.get("pubDate"), now)]
    unique = dedupe(filtered)
    bengali = [it for it in unique if it.get("lang") == "bn"]
    english = [it for it in unique if it.get("lang") == "en"]
    return {
        "ok": True,
        "extractedAt": extraction_time,
        "extractor": "scripts/bd_agri_news_extractor.py",
        "method": "newspaper-html",
        "headlines": unique,
        "bengali": bengali,
        "english": english,
        "sources": source_status,
        "counts": {
            "total": len(unique),
            "bengali": len(bengali),
            "english": len(english),
            "newspapers": len(newspapers),
        },
    }


def main() -> int:
    live = "--live" in sys.argv
    if not live:
        print(json.dumps({"ok": False, "error": "pass --live to fetch newspapers"}, ensure_ascii=False))
        return 2
    result = collect_newspaper_news()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["counts"]["total"] >= 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
