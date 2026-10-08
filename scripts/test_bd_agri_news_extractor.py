#!/usr/bin/env python3
"""Offline tests for Bangladesh newspaper agriculture HTML extractor."""

from __future__ import annotations

import json
import re
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from bd_agri_news_extractor import (  # noqa: E402
    AGRI_BN,
    AGRI_BN_WEAK,
    AGRI_CONTEXT_BN,
    AGRI_CONTEXT_EN,
    AGRI_EN,
    AGRI_EN_WEAK,
    REJECT_BN,
    REJECT_EN,
    collect_newspaper_news,
    extract_anchors,
    extract_quintype_stories,
    extract_rss_items,
    is_agri,
    items_from_html,
    items_from_xml,
    parse_pub_date,
)


PROTHOM_ALO_HTML = """
<html><head><title>প্রথম আলো</title></head>
<body>
<script>{"qt":{"pageType":"home","data":{"collection":{"items":[
  {"headline":"কৃষকদের সার ও বীজ সহায়তা বাড়াল কৃষি মন্ত্রণালয়","url":"https://www.prothomalo.com/bangladesh/abc123","last-published-at":1727610000000},
  {"headline":"দুর্গাপূজায় ছুটি এক দিন বাড়ল","url":"https://www.prothomalo.com/bangladesh/holiday","last-published-at":1727613600000}
]}}}}</script>
<a href="/business/farmer-loan">ধান চাষিদের কৃষি ঋণ বিতরণ শুরু</a>
</body></html>
"""

DAILY_STAR_HTML = """
<html>
<body>
<div class="card">
  <a href="/business/agriculture/news/easy-term-loans-farmers-4286046">
    State minister promises easy-term loans for farmers to cut production costs
  </a>
  <a href="/sports/cricket">Tigers win warm-up match in style</a>
</div>
</body></html>
"""

DAILY_STAR_RSS = """
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>The Daily Star</title>
    <item>
      <title>Kurigram to ensure fertiliser reaches genuine farmers</title>
      <link>https://www.thedailystar.net/business/agriculture/news/kurigram-fertiliser-4279696</link>
      <pubDate>Tue, 29 Sep 2026 19:41:24 +0600</pubDate>
    </item>
    <item>
      <title>Parliament session starts tomorrow</title>
      <link>https://www.thedailystar.net/news/politics-session</link>
      <pubDate>Tue, 29 Sep 2026 10:00:00 +0600</pubDate>
    </item>
  </channel>
</rss>
"""

TBS_HTML = """
<html>
<body>
  <h3><a href="/economy/agriculture/vegetable-farmers-get-fair-price">Vegetable farmers get a fair price after harvest</a></h3>
  <h3><a href="/sports/cricket-win">Mithun fifties guide Tigers to win</a></h3>
</body></html>
"""

SOURCE = {
    "id": "prothom-alo",
    "name": "প্রথম আলো",
    "name_en": "Prothom Alo",
    "home": "https://www.prothomalo.com/",
    "lang": "bn",
    "color": "#1b8a3e",
    "parser": "quintype",
    "credibility": "high",
}


class ExtractorTests(unittest.TestCase):
    def test_is_agri_filters_non_farm_stories(self) -> None:
        self.assertTrue(is_agri("কৃষকদের সার ও বীজ সহায়তা বাড়াল কৃষি মন্ত্রণালয়"))
        self.assertTrue(is_agri("State minister promises easy-term loans for farmers"))
        self.assertTrue(is_agri("New agricultural subsidy for cultivation of paddy"))
        self.assertTrue(is_agri("Vegetable harvest prices ease for farmers"))
        self.assertFalse(is_agri("দুর্গাপূজায় ছুটি এক দিন বাড়ল"))
        self.assertFalse(is_agri("Tigers win warm-up cricket match"))
        self.assertFalse(is_agri("প্রধানমন্ত্রী তারেক রহমানের সঙ্গে সাক্ষাৎ"))
        self.assertFalse(is_agri("ফ্রিজ, আসবাবপত্র কিনে সংসার গুছিয়ে নেওয়ার প্রস্তুতি"))
        self.assertFalse(is_agri("Kingfisher beer sales rise in Dhaka"))
        self.assertFalse(is_agri("Aman Rahman meets the borough council"))
        self.assertFalse(is_agri("Commodities continue to be dearer"))
        self.assertFalse(is_agri("Eggs, vegetables rise as sugar, oil supplies tighten"))
        self.assertFalse(is_agri("রাজধানীর বাজারে সবজি ও পেঁয়াজের দাম বেড়েছে"))
        self.assertFalse(is_agri("Banglalink launches satellite-to-mobile service"))
        self.assertFalse(is_agri("Bring EPZ workers under Labour Act"))
        self.assertFalse(is_agri("আন্দোলনের মধ্যেই নতুন উপাচার্য পেল সিলেট কৃষি বিশ্ববিদ্যালয়"))
        self.assertFalse(is_agri("সাবধান! অস্ট্রেলিয়ার কৃষি ভিসা নিয়ে প্রতারণার নতুন ফাঁদ"))
        self.assertFalse(is_agri("বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউটে বড় নিয়োগ, পদ ৩০১টি"))
        self.assertFalse(is_agri("Parliament session starts tomorrow"))

    def test_parse_pub_date_millis_and_rfc822(self) -> None:
        iso = parse_pub_date(1727610000000)
        self.assertIsNotNone(iso)
        self.assertTrue(str(iso).startswith("2024-09-29"))
        rfc = parse_pub_date("Tue, 29 Sep 2026 19:41:24 +0600")
        self.assertIsNotNone(rfc)
        self.assertIn("2026-09-29", str(rfc))

    def test_quintype_json_extraction(self) -> None:
        stories = extract_quintype_stories(PROTHOM_ALO_HTML)
        self.assertEqual(len(stories), 2)
        self.assertIn("কৃষক", stories[0]["headline"])

    def test_html_json_filters_agriculture(self) -> None:
        items = items_from_html(PROTHOM_ALO_HTML, SOURCE, "2026-09-29T12:00:00+00:00")
        titles = [it["title"] for it in items]
        self.assertTrue(any("কৃষক" in t or "কৃষি" in t for t in titles))
        self.assertFalse(any("দুর্গাপূজা" in t for t in titles))
        self.assertTrue(all(it["source"] == "প্রথম আলো" for it in items))
        self.assertTrue(all(it["extractionTime"] for it in items))
        self.assertTrue(all(it["credibility"] == "high" for it in items))

    def test_anchor_extraction_daily_star(self) -> None:
        anchors = extract_anchors(DAILY_STAR_HTML)
        self.assertGreaterEqual(len(anchors), 2)
        star = {
            **SOURCE,
            "id": "daily-star",
            "name": "The Daily Star",
            "name_en": "The Daily Star",
            "home": "https://www.thedailystar.net/",
            "lang": "en",
            "parser": "anchors",
        }
        items = items_from_html(DAILY_STAR_HTML, star, "2026-09-29T12:00:00+00:00")
        self.assertEqual(len(items), 1)
        self.assertIn("farmers", items[0]["title"].lower())
        self.assertTrue(items[0]["link"].startswith("https://www.thedailystar.net/"))
        self.assertEqual(items[0]["extractionMethod"], "html")

    def test_rss_xml_without_news_api(self) -> None:
        rows = extract_rss_items(DAILY_STAR_RSS)
        self.assertEqual(len(rows), 2)
        star = {
            **SOURCE,
            "id": "daily-star",
            "name": "The Daily Star",
            "name_en": "The Daily Star",
            "home": "https://www.thedailystar.net/",
            "lang": "en",
            "parser": "anchors",
        }
        items = items_from_xml(DAILY_STAR_RSS, star, "2026-09-29T12:00:00+00:00")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["extractionMethod"], "xml-feed")
        self.assertIn("fertiliser", items[0]["title"].lower())

    def test_collect_uses_injected_fetch_only(self) -> None:
        pages = {
            "https://www.prothomalo.com/": PROTHOM_ALO_HTML,
            "https://www.thedailystar.net/business/agriculture": DAILY_STAR_HTML,
            "https://www.thedailystar.net/business/rss.xml": DAILY_STAR_RSS,
            "https://www.tbsnews.net/economy/agriculture": TBS_HTML,
        }

        def fake_fetch(url: str) -> str:
            if url in pages:
                return pages[url]
            return "<html></html>"

        newspapers = [
            {
                "id": "prothom-alo",
                "name": "প্রথম আলো",
                "name_en": "Prothom Alo",
                "home": "https://www.prothomalo.com/",
                "pages": ["https://www.prothomalo.com/"],
                "feeds": [],
                "lang": "bn",
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
        ]
        result = collect_newspaper_news(
            fetch_fn=fake_fetch,
            newspapers=newspapers,
            now=datetime(2026, 9, 29, 12, 0, tzinfo=timezone.utc),
        )
        self.assertTrue(result["ok"])
        self.assertEqual(result["method"], "newspaper-html")
        self.assertGreaterEqual(result["counts"]["total"], 3)
        self.assertGreaterEqual(result["counts"]["bengali"], 1)
        self.assertGreaterEqual(result["counts"]["english"], 2)
        self.assertTrue(all(is_agri(it["title"]) for it in result["headlines"]))
        self.assertFalse(any("cricket" in it["title"].lower() for it in result["headlines"]))
        self.assertTrue(all("source" in it and "extractionTime" in it for it in result["headlines"]))
        self.assertTrue(all(it["source"] != "Google News" for it in result["headlines"]))
        payload = json.dumps(result, ensure_ascii=False)
        self.assertNotIn("news.google.com", payload)
        self.assertNotIn("googleapis.com", payload)

    def test_python_and_typescript_keyword_lists_match(self) -> None:
        ts = Path(__file__).resolve().parents[1].joinpath("src/lib/bdNewspaperNews.ts").read_text()

        def grab(name: str) -> list[str]:
            block = ts.split(f"const {name} = [", 1)[1].split("];", 1)[0]
            return re.findall(r'"([^"]+)"', block)

        self.assertEqual(AGRI_BN, grab("AGRI_BN"))
        self.assertEqual(AGRI_EN, grab("AGRI_EN"))
        self.assertEqual(AGRI_EN_WEAK, grab("AGRI_EN_WEAK"))
        self.assertEqual(AGRI_BN_WEAK, grab("AGRI_BN_WEAK"))
        self.assertEqual(AGRI_CONTEXT_EN, grab("AGRI_CONTEXT_EN"))
        self.assertEqual(AGRI_CONTEXT_BN, grab("AGRI_CONTEXT_BN"))
        self.assertEqual(REJECT_EN, grab("REJECT_EN"))
        self.assertEqual(REJECT_BN, grab("REJECT_BN"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
