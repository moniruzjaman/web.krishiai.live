# KrishiAI — বাংলাদেশ কৃষি AI প্ল্যাটফর্ম

বাংলাদেশের কৃষকদের জন্য AI-চালিত স্মার্ট কৃষি প্ল্যাটফর্ম। ফসলের রোগ নির্ণয়, আবহাওয়া পরামর্শ, বাজার মূল্য, মাটি বিশ্লেষণ ও ফসল তথ্যভাণ্ডার — সবকিছু বিনামূল্যে।

## প্রযুক্তি

- **Next.js 16** (App Router, Turbopack)
- **TypeScript** + **Tailwind CSS 4**
- **shadcn/ui** — নির্বাচিত UI কম্পোনেন্ট
- **Leaflet** — ইন্টারেক্টিভ মানচিত্র (OpenStreetMap + Esri Satellite)
- **z-ai-web-dev-sdk** — AI চ্যাট, VLM নির্ণয়, ও ইমেজ জেনারেশন
- **Open-Meteo** — কী-মুক্ত আবহাওয়া API
- **Nominatim** — GPS রিভার্স জিওকোডিং

## মূল ফিচার

| ফিচার | বিবরণ |
|--------|--------|
| ফসল রোগ নির্ণয় | CABI Plantwise পদ্ধতিতে AI নির্ণয়, বহু-প্রদানকারী জলপ্রপাত |
| লাইভ আবহাওয়া | Open-Meteo ভিত্তিক আবহাওয়া ও কৃষি পরামর্শ |
| কৃষি মানচিত্র | ১৫+ প্রতিষ্ঠান, স্যাটেলাইট ভিউ, ব্যবহারকারী লোকেশন |
| বাজার মূল্য | DAM লাইভ মার্কেট ডেটা |
| মৃত্তিকা বিশ্লেষণ | ৩০ AEZ জোন, USDA টেক্সচার শ্রেণিবিন্যাস, Recharts ভিজুয়ালাইজেশন |
| ফসল তথ্যভাণ্ডার | ৭ ক্যাটাগরি, ২০০+ ফসল, AI-চালিত বিস্তারিত তথ্য |
| ফসল ক্যালেন্ডার | ১০ প্রধান ফসলের মৌসুম ক্যালেন্ডার |
| স্মার্ট সিদ্ধান্ত | আবহাওয়া ও বাজার ভিত্তিক ফসল সুপারিশ |
| AI চ্যাট | z-ai-web-dev-sdk চালিত কৃষি সহকারী |

## প্রজেক্ট স্ট্রাকচার

```
src/
├── app/
│   ├── page.tsx              # হোম পেজ (হিরো, ড্যাশবোর্ড, টুলস)
│   ├── layout.tsx            # রুট লেআউট + LocationProvider
│   ├── analyzer/             # CABI রোগ নির্ণয় পেজ
│   ├── chat/                 # AI চ্যাট পেজ
│   ├── api/
│   │   ├── diagnose/         # মূল নির্ণয় API (বহু-প্রদানকারী জলপ্রপাত)
│   │   ├── chat/             # AI চ্যাট API
│   │   ├── weather/          # Open-Meteo আবহাওয়া API
│   │   ├── market/           # বাজার মূল্য API
│   │   ├── news/             # কৃষি সংবাদ API
│   │   ├── soil-analysis/    # AEZ মাটি বিশ্লেষণ API
│   │   ├── crop-database/    # ফসল তথ্য API
│   │   ├── crop-prices/      # ফসল মূল্য API
│   │   └── smart-decision/   # স্মার্ট সিদ্ধান্ত API
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
│   ├── MapWidget.tsx         # লিফলেট মানচিত্র
│   ├── InteractiveMap.tsx    # মানচিত্র ইঞ্জিন
│   ├── NDVIMap.tsx           # NDVI স্যাটেলাইট মানচিত্র
│   ├── WeatherWidget.tsx     # আবহাওয়া উইজেট
│   ├── MarketWidget.tsx      # বাজার মূল্য উইজেট
│   ├── NewsWidget.tsx        # সংবাদ উইজেট
│   ├── AIChatWidget.tsx      # AI চ্যাট উইজেট
│   ├── PhotoGallery.tsx      # ফটো গ্যালারি
│   ├── BottomNav.tsx         # বটম নেভিগেশন
│   ├── TopNavbar.tsx         # টপ নেভবার
│   └── ui/                   # shadcn/ui কম্পোনেন্ট (9টি ব্যবহৃত)
├── context/
│   └── LocationContext.tsx    # অ্যাপ-ওয়াইড GPS প্রদানকারী
└── lib/
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
bun build && bun start
```

## ডিপ্লয়মেন্ট

ভার্সেল-এ ডিপ্লয় করুন — কোনো অতিরিক্ত কনফিগারেশন লাগবে না।

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/moniruzjaman/web.krishiai.live)

## এনভায়রনমেন্ট ভেরিয়েবল

| ভেরিয়েবল | প্রয়োজন | বিবরণ |
|-----------|---------|--------|
| `GEMINI_API_KEY` | ঐচ্ছিক | Google Gemini AI (হাইব্রিড ফলব্যাক) |
| `GROQ_API_KEY` | ঐচ্ছিক | Groq AI (হাইব্রিড ফলব্যাক) |
| `OPENROUTER_API_KEY` | ঐচ্ছিক | OpenRouter AI (হাইব্রিড ফলব্যাক) |

> সকল AI ফিচার **z-ai-web-dev-sdk** ব্যবহার করে কাজ করে — কোনো API কী ছাড়াই। উপরের কীগুলো ঐচ্ছিক হাইব্রিড ফলব্যাক প্রদানকারী।

## লাইসেন্স

MIT
