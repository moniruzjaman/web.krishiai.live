# Agricultural Domain — Bangladesh Crop & Season System

## Bangladesh Rice Seasons

| Season | Bengali | Months | Planting | Harvest |
|--------|---------|--------|----------|---------|
| Boro | বোরো | Dec-Apr | Dec-Jan | Apr-May |
| Aus | আউশ | Mar-Aug | Mar-Apr | Jul-Aug |
| Aman | আমন | Jun-Nov | Jun-Jul | Nov-Dec |

## Crop Calendar (10 Major Crops)

| Crop | Bengali | Seasons | Key Diseases | Key Pests |
|------|---------|---------|--------------|-----------|
| Rice | ধান | Boro, Aman, Aus | Blast, BLB, Sheath Blight, Tungro | BPH, Stem Borer, Leaf Folder |
| Jute | পাট | Kharif-1, Kharif-2 | Wilt, Stem Rot, Anthracnose | Jute Hairy Caterpillar, Aphid |
| Potato | আলু | Rabi | Late Blight, Early Blight, Black Scurf | Potato Tuber Moth, Whitefly |
| Tomato | টমেটো | Rabi, Kharif-1 | Early Blight, TYLCV, Bacterial Wilt | Whitefly, Fruit Borer |
| Brinjal | বেগুন | Rabi, Kharif-1 | Fusarium Wilt, Leaf Spot | Fruit & Shoot Borer |
| Mustard | সরিষা | Rabi | Alternaria Blight, White Rust | Aphid, Diamondback Moth |
| Banana | কলা | Year-round | Panama Wilt, Sigatoka | Weevil, Nematode |
| Mango | আম | Kharif-1 | Anthracnose, Powdery Mildew | Mango Hopper, Fruit Fly |
| Wheat | গম | Rabi | Leaf Rust, Stripe Rust | Aphid, Thrips |
| Maize | ভুট্টা | Rabi, Kharif-1 | Maydie Blight, Downy Mildew | Stem Borer, Fall Armyworm |

## Season Color System

| Season | BG | Text | Border |
|--------|-----|------|--------|
| বোরো | #dbeafe | #1e40af | #93c5fd |
| আমন | #dcfce7 | #166534 | #86efac |
| আউশ | #fef9c3 | #854d0e | #fde047 |
| রবি | #f3e8ff | #6b21a8 | #c4b5fd |
| খরিপ-১ | #ffedd5 | #9a3412 | #fdba74 |
| খরিপ-২ | #ffe4e6 | #9f1239 | #fda4af |

## NDVI Simulation (src/components/NDVIMap.tsx)

- **No Sentinel Hub API** — uses deterministic formula: `ndvi = base + seasonal_offset(month) + lat_lng_adjustment`
- 20+ district circles color-coded by NDVI value
- Seasonal patterns: Boro (Dec-May high), Aus (Mar-Aug moderate), Aman (Jun-Nov high)
- Color map: <0.2 brown → 0.4 yellow → 0.6 light green → 0.8+ dark green

## Market Price System (src/lib/cropPriceService.ts)

- **14 commodities** with baseline prices (peak/off/average in BDT/kg)
- **Seasonal multipliers**: e.g., tomato রবি ×0.55, খরিপ-১ ×1.4
- **Daily jitter**: Deterministic hash of day-of-year for realistic variation
- **Trend calculation**: Compare current day hash vs 7-day-ago hash
- **Min Support Price**: Rice ৳30/kg, Wheat ৳37/kg (government MSP)
- **Profitability**: Cost/bigha, yield/bigha, gross revenue, net profit, ROI

## Weather Agricultural Indices (estimated, not measured)

| Index | How Estimated |
|-------|--------------|
| Soil Moisture | f(rain, humidity, temperature) |
| ET0 (Evapotranspiration) | Hargreaves formula approximation |
| Leaf Wetness | f(humidity, rain, temperature) |
| GDD (Growing Degree Days) | Σ(Tmax + Tmin)/2 - Tbase |
| Disease Pressure | f(avg_humidity, avg_temp, rain_days) |

## BD Institution Markers (InteractiveMap)

15+ markers: DAE, BRRI, BARI, BADC, BARC, BMD, BAU, SRDI, BINA, BJRI, BSRI, CDB, DLS, DoF, MoA
