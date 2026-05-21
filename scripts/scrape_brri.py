#!/usr/bin/env python3
"""scrape_brri.py — Fetch BRRI rice varieties from the BRRI Rice Profile System API/HTML."""

import json, re, sys, time
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    print("pip install requests")
    sys.exit(1)

BRRI_PROFILE_URL = "https://riceprofile.brri.gov.bd/list.php"
HEADERS = {"User-Agent": "KrishiAI-DataBot/1.0 (github.com/moniruzjaman/web.krishiai.live)"}

def fetch_varieties() -> list[dict[str, Any]]:
    """Fetch the BRRI Rice variety list page and extract structured data."""
    resp = requests.get(BRRI_PROFILE_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    html = resp.text

    results: list[dict[str, Any]] = []

    # The BRRI Rice Profile page is a simple HTML table.
    # Each variety row has: variety_name, parentage, season, year,
    # duration, height, yield, rice_type, disease, insect, features
    # Extract data from the table rows
    row_pattern = re.compile(
        r"<tr>(.+?)</tr>",
        re.DOTALL
    )
    cell_pattern = re.compile(
        r"<td[^>]*>(.*?)</td>",
        re.DOTALL
    )
    clean = re.compile(r"<[^>]+>")

    rows = row_pattern.findall(html)
    for row in rows:
        cells_raw = cell_pattern.findall(row)
        if len(cells_raw) < 20:
            continue
        
        cells = [clean.sub("", c).strip() for c in cells_raw]
        
        # Detect if this is a real data row (starts with a number)
        if not re.match(r"^\d+$", cells[0]):
            continue
        
        entry = {
            "sl": cells[0],
            "name": cells[1],
            "parentage": cells[2],
            "season": cells[3],
            "year_notified": cells[4],
            "duration_days": cells[5],
            "seeding_date": cells[6],
            "transplanting_date": cells[7],
            "harvesting_date": cells[8],
            "rice_type": cells[9],
            "height_cm": cells[10],
            "yield_t_ha": cells[11],
            "milling_outturn": cells[12],
            "grain_length": cells[13],
            "lb_ratio": cells[14],
            "grain_shape": cells[15],
            "appearance": cells[16],
            "protein_pct": cells[17],
            "amylose_pct": cells[18],
            "cooking_time_min": cells[19],
            "elongation_ratio": cells[20] if len(cells) > 20 else "",
            "volume_expansion": cells[21] if len(cells) > 21 else "",
            "cropping_pattern": cells[22] if len(cells) > 22 else "",
            "disease": cells[23] if len(cells) > 23 else "",
            "insect": cells[24] if len(cells) > 24 else "",
            "lodging_pct": cells[25] if len(cells) > 25 else "",
            "irrigation": cells[26] if len(cells) > 26 else "",
            "features": cells[27] if len(cells) > 27 else "",
            "recommended": cells[28] if len(cells) > 28 else "",
        }
        results.append(entry)
        print(f"  ✓ sl={cells[0]} name={cells[1]}")

    return results


def main():
    print(f"Fetching BRRI Rice Profile System ...")
    try:
        varieties = fetch_varieties()
    except requests.HTTPError as e:
        print(f"HTTP error: {e}", file=sys.stderr)
        sys.exit(1)

    out = Path(__file__).parent.parent / "src" / "data" / "_brri_raw.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"varieties": varieties, "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%S"), "source": BRRI_PROFILE_URL}, indent=2, ensure_ascii=False))
    print(f"\n✓ Saved {len(varieties)} varieties → {out}")


if __name__ == "__main__":
    main()