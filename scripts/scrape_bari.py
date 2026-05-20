#!/usr/bin/env python3
"""bari_scraper.py — Fetch BARI crop varieties from the Digital Herbarium."""

import json, sys, time
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("pip install requests beautifulsoup4")
    sys.exit(1)

BARI_HERBARIUM_URL = "https://dhcrop.bsmrau.net/varieties-released/varieties-released-by-bari/"
HEADERS = {"User-Agent": "KrishiAI-DataBot/1.0 (github.com/moniruzjaman/krishiai-web)"}

def fetch_bari_varieties() -> list[dict]:
    resp = requests.get(BARI_HERBARIUM_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    varieties: list[dict] = []
    
    tables = soup.find_all("table")
    for table in tables:
        headers = [th.get_text(strip=True).lower() for th in table.find_all("th")]
        if not headers:
            continue
        for tr in table.find_all("tr"):
            tds = tr.find_all("td")
            if not tds:
                continue
            row = {"col_" + str(i): td.get_text(strip=True) for i, td in enumerate(tds)}
            # Try to map known columns
            for i, h in enumerate(headers):
                if i < len(tds):
                    row[h] = tds[i].get_text(strip=True)
            varieties.append(row)
    
    return varieties

def main():
    print("Fetching BARI varieties from Digital Herbarium ...")
    varieties = fetch_bari_varieties()
    out = Path(__file__).parent.parent / "src" / "data" / "_bari_raw.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"varieties": varieties, "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%S"), "source": BARI_HERBARIUM_URL}, indent=2, ensure_ascii=False))
    print(f"Saved {len(varieties)} raw entries → {out}")

if __name__ == "__main__":
    main()