#!/usr/bin/env python3
"""dae_scraper.py — Pull DAE extension manual data and PDF index."""

import json, sys, time
from pathlib import Path

try:
    import requests
except ImportError:
    print("pip install requests")
    sys.exit(1)

DAE_PORTAL = "https://dae.gov.bd"
DAE_PUBLICATIONS = "https://dae.portal.gov.bd/publications"
HEADERS = {"User-Agent": "KrishiAI-DataBot/1.0"}

def main():
    print("Fetching DAE publications index ...")
    resp = requests.get(DAE_PORTAL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    
    out = Path(__file__).parent.parent / "src" / "data" / "_dae_raw.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    # For now just save the HTML snapshot - future work: parse PDF list
    out.write_text(json.dumps({
        "source": DAE_PORTAL,
        "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "note": "Future: parse DAE publication PDFs for disease/fertilizer schedules",
        "status": resp.status_code,
        "content_length": len(resp.text),
    }, indent=2))
    print(f"✓ Saved DAE snapshot → {out}")

if __name__ == "__main__":
    main()