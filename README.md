# KrishiAI — বাংলাদেশ কৃষি AI প্ল্যাটফর্ম

চাষাবাদের জন্য স্মার্ট ও নির্ভরযোগ্য। বাংলাদেশের কৃষকদের জন্য AI-চালিত স্মার্ট কৃষি প্ল্যাটফর্ম — ফসলের রোগ নির্ণয়, আবহাওয়া পরামর্শ, বাজার মূল্য, মাটি বিশ্লেষণ ও ফসল তথ্যভাণ্ডার সবকিছু বিনামূল্যে।

**লাইভ:** [web.krishiai.live](https://web.krishiai.live)

## প্রযুক্তি

- **Next.js 16** (App Router, Turbopack)
- **TypeScript** + **Tailwind CSS 4**
- **Bun** — প্যাকেজ ম্যানেজার ও রানটাইম
- **shadcn/ui** — নির্বাচিত UI কম্পোনেন্ট
- **Leaflet** — ইন্টারেক্টিভ মানচিত্র (OpenStreetMap + Esri Satellite)
- **Supabase** — Auth, quota management, usage tracking
- **Open-Meteo** — কী-মুক্ত আবহাওয়া API
- **Nominatim** — GPS রিভার্স জিওকোডিং

## AI প্রদানকারী আর্কিটেকচার

তিনটি বিনামূল্যে AI প্রদানকারী জলপ্রপাত (waterfall) ফলব্যাক সিস্টেম:

| অর্ডার | প্রদানকারী | মডেল | ভূমিকা |
| ------ | ----------- | ------ | ----- |
| ১ (প্রাথমিক) | **Gemini** | `gemini-3.5-flash` | রিজনিং, মাল্টিমোডাল (ছবি/PDF/ডক), ভিশন |
| ২ (ফলব্যাক) | **OpenRouter** | `qwen2.5-vl-72b-instruct:free` | ভিশন, বিস্তৃত মডেল অ্যাক্সেস, কনসেনসাস |
| ৩ (ফলব্যাক) | **Groq** | `llama-3.2-11b-vision-preview` | দ্রুত টেক্সট, লো-লেটেন্সি, টাইব্রেকার |

- কোটা শেষ হলে পরবর্তী প্রদানকারীতে স্বয়ংক্রিয় সুইচ
- সকল প্রদানকারী ব্যর্থ হলে **অফলাইন গ্রেসফুল ডিগ্রেডেশন** সক্রিয়
- কোটা ট্র্যাকিং **Supabase** দ্বারা পরিচালিত
- নির্ণয়ে **হাইব্রিড-অ্যানালিসিস** এজেন্ট: Gemini + OpenRouter প্যারালাল → ৮০% কনসেনসাস → Groq টাইব্রেকার
- প্রতিটি AI রেসপন্সে **প্রদানকারী ব্যাজ** (Gemini / OpenRouter / Groq) প্রদর্শিত হয়

## মূল ফিচার

| ফিচার | বিবরণ |
| -------- | --------- |
| ফসল রোগ নির্ণয় | CABI Plantwise পদ্ধতিতে AI নির্ণয়, হাইব্রিড-মাল্টিমোডাল কনসেনসাস, বহু-প্রদানকারী জলপ্রপাত |
| মাল্টিমোডাল চ্যাট | ছবি, PDF, ডকুমেন্ট আপলোড করে Gemini 3.5 Flash এ বিশ্লেষণ |
| লাইভ সংবাদ টিকার | হরাইজন্টাল স্ক্রলিং কৃষি সংবাদ — তারিখ, সূত্র ও লাইভ ইন্ডিকেটর সহ |
| লাইভ আবহাওয়া | Open-Meteo ভিত্তিক আবহাওয়া, কৃষি পরামর্শ ও সতর্কতা |
| কৃষি মানচিত্র | ১৫+ প্রতিষ্ঠান, স্যাটেলাইট ভিউ, ব্যবহারকারী লোকেশন |
| বাজার মূল্য | DAM লাইভ মার্কেট ডেটা |
| মৃত্তিকা বিশ্লেষণ | ৩০ AEZ জোন, USDA টেক্সচার শ্রেণিবিন্যাস, Recharts ভিজুয়ালাইজেশন |
| ফসল তথ্যভাণ্ডার | ৭ ক্যাটাগরি, ২০০+ ফসল, AI-চালিত বিস্তারিত তথ্য |
| ফসল ক্যালেন্ডার | ১০ প্রধান ফসলের মৌসুম ক্যালেন্ডার |
| স্মার্ট সিদ্ধান্ত | আবহাওয়া ও বাজার ভিত্তিক ফসল সুপারিশ |
| AI চ্যাট | মাল্টিমোডাল (ছবি/PDF/ডক), প্রদানকারী ব্যাজ, কোটা-সচেতন জলপ্রপাত |
| AI প্রদানকারী ব্যাজ | প্রতিটি AI রেসপন্সে কোন মডেল ব্যবহৃত হয়েছে তা দেখায় |
| দ্বিভাষিক সমর্থন | বাংলা (প্রাথমিক) ও ইংরেজি |
| PWA সমর্থন | ইনস্টলযোগ্য ওয়েব অ্যাপ, অফলাইন ক্যাশে, পুশ নোটিফিকেশন |

## প্রজেক্ট স্ট্রাকচার

```text
src/
├── app/
│   ├── page.tsx              # হোম পেজ (হিরো, নিউজ টিকার, ড্যাশবোর্ড, টুলস)
│   ├── layout.tsx            # রুট লেআউট, OG/Twitter মেটাডেটা, PWA ম্যানিফেস্ট
│   ├── analyzer/             # CABI রোগ নির্ণয় পেজ
│   ├── chat/                 # মাল্টিমোডাল AI চ্যাট পেজ (ছবি/PDF/ডক আপলোড)
│   ├── dashboard/            # AI ব্যবহার ড্যাশবোর্ড
│   ├── learn/                # কৃষি শিখন কেন্দ্র
│   ├── api/
│   │   ├── diagnose/         # মূল নির্ণয় API (হাইব্রিড মাল্টিমোডাল কনসেনসাস)
│   │   ├── chat/             # মাল্টিমোডাল চ্যাট API (Gemini inline data)
│   │   ├── copilot/          # AI কোপাইলট API
│   │   ├── weather/          # Open-Meteo আবহাওয়া API
│   │   ├── market/           # বাজার মূল্য API
│   │   ├── news/             # কৃষি সংবাদ API (হেডলাইন, বুলেটিন, gov, intl)
│   │   ├── soil-analysis/    # AEZ মাটি বিশ্লেষণ API
│   │   ├── crop-database/    # ফসল তথ্য API
│   │   ├── crop-prices/      # ফসল মূল্য API
│   │   ├── smart-decision/   # স্মার্ট সিদ্ধান্ত API
│   │   └── dashboard/        # ড্যাশবোর্ড স্ট্যাটাস ও ব্যবহার API
│   └── tools/
│       ├── soil/             # AEZ মাটি বিশ্লেষক
│       ├── crop-library/     # ফসল তথ্যভাণ্ডার
│       ├── crop-calendar/    # ফসল ক্যালেন্ডার
│       ├── satellite/        # স্যাটেলাইট NDVI
│       ├── smart-decision/   # স্মার্ট সিদ্ধান্ত
│       ├── pesticide/        # বালাইনাশক বিশেষজ্ঞ
│       ├── irrigation/       # সেচ ব্যবস্থাপনা
│       ├── plant-health/     # উদ্ভিদ স্বাস্থ্য
│       └── yield/            # ফলন পূর্বাভাস
├── components/
│   ├── NewsTicker.tsx        # হরাইজন্টাল স্ক্রলিং লাইভ সংবাদ টিকার
│   ├── MapWidget.tsx         # লিফলেট মানচিত্র
│   ├── InteractiveMap.tsx    # মানচিত্র ইঞ্জিন
│   ├── NDVIMap.tsx           # NDVI স্যাটেলাইট মানচিত্র
│   ├── WeatherWidget.tsx     # আবহাওয়া উইজেট
│   ├── MarketWidget.tsx      # বাজার মূল্য উইজেট
│   ├── NewsWidget.tsx        # সংবাদ উইজেট
│   ├── AIChatWidget.tsx      # AI চ্যাট উইজেট
│   ├── PhotoGallery.tsx      # ফটো গ্যালারি
│   ├── DiagnosticModal.tsx   # নির্ণয় মোডাল
│   ├── TopNavbar.tsx         # টপ নেভবার (ডার্ক মোড)
│   ├── BottomNav.tsx         # বটম নেভিগেশন
│   ├── ClientShell.tsx       # ইনস্টল প্রম্পট ও PWA শেল
│   ├── InstallPrompt.tsx     # PWA ইনস্টল প্রম্পট
│   ├── Providers.tsx         # ক্লায়েন্ট প্রোভাইডার র‍্যাপার
│   └── ui/                   # shadcn/ui কম্পোনেন্ট
├── context/
│   ├── LocationContext.tsx    # অ্যাপ-ওয়াইড GPS প্রদানকারী
│   └── LanguageContext.tsx    # বাংলা/ইংরেজি ভাষা প্রদানকারী
└── lib/
    ├── ai-client.ts             # কোটা-সচেতন AI ক্লায়েন্ট (Gemini 3.5 → OpenRouter → Groq → Offline)
    ├── openrouter.ts            # ওর্কেস্ট্রেটর — টাস্ক রাউটিং, প্রদানকারী ফলব্যাক
    ├── supabase/
    │   ├── server.ts            # Supabase সার্ভার ক্লায়েন্ট
    │   ├── client.ts            # Supabase ব্রাউজার ক্লায়েন্ট
    │   ├── middleware.ts         # Supabase সেশন রিফ্রেশ
    │   ├── schema.sql           # ডাটাবেস স্কিমা + RLS
    │   └── quota.ts             # কোটা ট্র্যাকিং মডিউল
    ├── cabi/
    │   ├── diagnosticEngine.ts  # CABI নির্ণয় ইঞ্জিন
    │   └── bengaliKeywords.ts   # বাংলা কীওয়ার্ড ম্যাপিং
    ├── cropCalendar.ts       # ফসল মৌসুম ক্যালেন্ডার
    ├── cropDiseases.ts       # রোগ ডেটাবেস
    ├── cropPriceService.ts   # ফসল মূল্য সেবা
    └── weatherService.ts     # আবহাওয়া সেবা
```

## শুরু করুন

```bash
# ইনস্টল
bun install

# ডেভেলপমেন্ট
bun dev

# প্রোডাকশন বিল্ড
bun run build
```

## ডিপ্লয়মেন্ট

### ভার্সেল (প্রাথমিক)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/moniruzjaman/web.krishiai.live)

## CI/CD

দুটি GitHub Actions ওয়ার্কফ্লো সকল পুশে চলে:

| ওয়ার্কফ্লো | ফাইল | যাচাই |
| ----------- | ---- | ----- |
| KrishiAI — Validate | `.github/workflows/validate.yml` | `bun install --frozen-lockfile` → lint → build |
| KrishiAI — Branding Check | `.github/workflows/branding-check.yml` | ব্র্যান্ডিং ফাইল, মেটা ট্যাগ, ম্যানিফেস্ট, build |

ট্রিগার ব্রাঞ্চ: `main`, `production`, `production-v2`, `v3.0.0`, `v4.0`

## এনভায়রনমেন্ট ভেরিয়েবল

| ভেরিয়েবল | প্রয়োজন | বিবরণ |
| ----------- | --------- | --------- |
| `NEXT_PUBLIC_SUPABASE_URL` | হ্যাঁ | Supabase প্রজেক্ট URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | হ্যাঁ | Supabase অ্যানন কী |
| `GEMINI_API_KEY` | ঐচ্ছিক | Google Gemini 3.5 Flash (প্রাথমিক প্রদানকারী) |
| `OPENROUTER_API_KEY` | ঐচ্ছিক | OpenRouter — Qwen-VL-72B ফ্রি মডেল (ভিশন ফলব্যাক) |
| `GROQ_API_KEY` | ঐচ্ছিক | Groq — Llama 3.2 Vision (টেক্সট ফলব্যাক, টাইব্রেকার) |

> প্রাথমিক AI প্রদানকারী **Gemini 3.5 Flash**। কোটা শেষ হলে → **OpenRouter** (ফ্রি Qwen-VL মডেল) → **Groq** (Llama Vision) → **অফলাইন ফলব্যাক**। সকল তিনটি প্রদানকারী বিনামূল্যের টায়ার ব্যবহার করে।

## লাইসেন্স

MIT