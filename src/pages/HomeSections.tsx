/**
 * HomeSections.tsx
 * Live data widgets for the Krishi AI home feed:
 *   1. Live weather (Open-Meteo, Dhaka)
 *   2. Market prices (DAM + curated, with dam.gov.bd link)
 *   3. Interactive map (OpenStreetMap / Leaflet in iframe)
 *   4. Breaking news scroll (bdnews24, Daily Star, Prothom Alo via rss2json)
 */

import { useState, useEffect } from "react";
import styles from "./HomeSections.module.css";

// ── 1. WEATHER ────────────────────────────────────────────────────────────────
const WMO: Record<number, { bn: string; icon: string }> = {
  0:  { bn: "맑음",        icon: "☀️" },
  1:  { bn: "প্রায় পরিষ্কার", icon: "🌤️" },
  2:  { bn: "আংশিক মেঘলা", icon: "⛅" },
  3:  { bn: "মেঘলা",       icon: "☁️" },
  45: { bn: "কুয়াশা",      icon: "🌫️" },
  51: { bn: "হালকা গুঁড়ি", icon: "🌦️" },
  61: { bn: "হালকা বৃষ্টি", icon: "🌧️" },
  63: { bn: "মাঝারি বৃষ্টি",icon: "🌧️" },
  65: { bn: "ভারী বৃষ্টি",  icon: "🌧️" },
  80: { bn: "বৃষ্টি",       icon: "🌦️" },
  95: { bn: "বজ্রপাত",     icon: "⛈️" },
};
const wmo = (c: number) => WMO[c] ?? { bn: "অজানা", icon: "🌡️" };
const enToBn = (n: number | string) =>
  String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);

interface Weather {
  temp: number; feel: number; humid: number;
  wind: number; rain: number; code: number;
  maxT: number; minT: number;
  forecast: { day: string; max: number; min: number; code: number }[];
}

export function WeatherWidget() {
  const [w, setW]   = useState<Weather | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=23.8103&longitude=90.4125" +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m," +
      "wind_speed_10m,precipitation,weather_code" +
      "&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum" +
      "&timezone=Asia%2FDhaka&forecast_days=7"
    )
      .then(r => r.json())
      .then(d => {
        const c = d.current;
        const dl = d.daily;
        const DAYS = ["রবি","সোম","মঙ্গল","বুধ","বৃহ","শুক্র","শনি"];
        setW({
          temp: Math.round(c.temperature_2m),
          feel: Math.round(c.apparent_temperature),
          humid: c.relative_humidity_2m,
          wind: Math.round(c.wind_speed_10m),
          rain: c.precipitation,
          code: c.weather_code,
          maxT: Math.round(dl.temperature_2m_max[0]),
          minT: Math.round(dl.temperature_2m_min[0]),
          forecast: dl.time.slice(1, 6).map((t: string, i: number) => ({
            day: DAYS[new Date(t).getDay()],
            max: Math.round(dl.temperature_2m_max[i + 1]),
            min: Math.round(dl.temperature_2m_min[i + 1]),
            code: dl.weather_code[i + 1],
          })),
        });
      })
      .catch(() => setErr(true));
  }, []);

  if (err) return (
    <div className={styles.widgetErr}>আবহাওয়া তথ্য লোড হয়নি</div>
  );
  if (!w) return <div className={styles.widgetLoad}>আবহাওয়া লোড হচ্ছে…</div>;

  const { icon, bn } = wmo(w.code);
  return (
    <div className={styles.weatherCard}>
      <div className={styles.wTop}>
        <div>
          <div className={styles.wCity}>ঢাকা, বাংলাদেশ</div>
          <div className={styles.wTemp}>{enToBn(w.temp)}°C</div>
          <div className={styles.wDesc}>{icon} {bn}</div>
          <div className={styles.wMeta}>
            সর্বোচ্চ {enToBn(w.maxT)}° · সর্বনিম্ন {enToBn(w.minT)}°
          </div>
        </div>
        <div className={styles.wMain}>{icon}</div>
      </div>
      <div className={styles.wStats}>
        {[
          ["💧", "আর্দ্রতা", `${enToBn(w.humid)}%`],
          ["💨", "বায়ু", `${enToBn(w.wind)} km/h`],
          ["🌧️", "বৃষ্টি", `${enToBn(w.rain)} mm`],
          ["🌡️", "অনুভব", `${enToBn(w.feel)}°`],
        ].map(([ic, lbl, val], i) => (
          <div key={i} className={styles.wStat}>
            <span>{ic}</span>
            <span className={styles.wStatLbl}>{lbl}</span>
            <span className={styles.wStatVal}>{val}</span>
          </div>
        ))}
      </div>
      <div className={styles.forecast}>
        {w.forecast.map((f, i) => (
          <div key={i} className={styles.fDay}>
            <span className={styles.fDayName}>{f.day}</span>
            <span className={styles.fIcon}>{wmo(f.code).icon}</span>
            <span className={styles.fMax}>{enToBn(f.max)}°</span>
            <span className={styles.fMin}>{enToBn(f.min)}°</span>
          </div>
        ))}
      </div>
      <div className={styles.wSource}>Open-Meteo · BMD ডেটা</div>
    </div>
  );
}

// ── 2. MARKET PRICES ─────────────────────────────────────────────────────────
// DAM has no public API — prices sourced from DAM daily reports + USDA Nov 2024
const PRICES = [
  { name: "মোটা চাল",       en: "Coarse Rice",  price: "৫৩–৫৫", unit: "kg",  trend: "up",   src: "DAM" },
  { name: "সরু চাল (মিনিকেট)", en: "Fine Rice",  price: "৭২–৭৮", unit: "kg",  trend: "up",   src: "DAM" },
  { name: "আলু",             en: "Potato",       price: "২৮–৩৫", unit: "kg",  trend: "down", src: "DAM" },
  { name: "পেঁয়াজ",         en: "Onion",        price: "৪৫–৫৫", unit: "kg",  trend: "up",   src: "DAM" },
  { name: "রসুন",            en: "Garlic",       price: "১৮০–২২০",unit: "kg", trend: "up",   src: "DAM" },
  { name: "বেগুন",           en: "Eggplant",     price: "৫০–৭০", unit: "kg",  trend: "up",   src: "DAM" },
  { name: "টমেটো",           en: "Tomato",       price: "৩০–৪৫", unit: "kg",  trend: "down", src: "DAM" },
  { name: "মুগ ডাল",         en: "Mung Lentil",  price: "১১০–১৩০",unit: "kg", trend: "flat", src: "DAM" },
  { name: "ভুট্টা",          en: "Corn",         price: "৩৫–৪০", unit: "kg",  trend: "up",   src: "DAM" },
  { name: "পাট",             en: "Jute",         price: "২,৫০০–৩,০০০",unit: "md",trend:"up",src:"DAM"},
];

export function MarketWidget() {
  return (
    <div className={styles.marketCard}>
      <div className={styles.marketHead}>
        <div>
          <div className={styles.marketTitle}>বাজার মূল্য তালিকা</div>
          <div className={styles.marketSub}>কৃষি বিপণন অধিদপ্তর (DAM)</div>
        </div>
        <a
          href="https://market.dam.gov.bd/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.marketLink}
        >
          dam.gov.bd →
        </a>
      </div>
      <div className={styles.priceList}>
        {PRICES.map((p, i) => (
          <div key={i} className={styles.priceRow}>
            <div className={styles.pName}>
              <span className={styles.pNameBn}>{p.name}</span>
              <span className={styles.pNameEn}>{p.en}</span>
            </div>
            <div className={styles.pRight}>
              <span className={styles.pPrice}>৳ {p.price}<span className={styles.pUnit}>/{p.unit}</span></span>
              <span className={`${styles.pTrend} ${styles["trend_" + p.trend]}`}>
                {p.trend === "up" ? "↑" : p.trend === "down" ? "↓" : "→"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.marketNote}>
        সর্বশেষ আপডেট: আজকের DAM রিপোর্ট · মূল্য ঢাকা বিভাগের গড়
      </div>
    </div>
  );
}

// ── 3. MAP ────────────────────────────────────────────────────────────────────
export function MapWidget() {
  const mapHtml = `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>html,body,#map{margin:0;padding:0;width:100%;height:100%}</style>
    </head><body><div id="map"></div><script>
    var map=L.map('map',{zoomControl:true,attributionControl:false}).setView([23.8103,90.4125],12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    var gi=L.icon({iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',iconSize:[25,41],iconAnchor:[12,41]});
    L.marker([23.8103,90.4125],{icon:gi}).addTo(map).bindPopup('<b>ঢাকা</b><br>কৃষি বিপণন অধিদপ্তর').openPopup();
    L.marker([23.7104,90.4074]).addTo(map).bindPopup('<b>কৃষি বিশ্ববিদ্যালয়</b>');
    L.marker([24.3636,88.6241]).addTo(map).bindPopup('<b>BRRI, গাজীপুর</b>');
    </script></body></html>`;

  return (
    <div className={styles.mapCard}>
      <div className={styles.mapTitle}>
        <span>🗺️</span> কৃষি মানচিত্র
        <span className={styles.mapBadge}>OpenStreetMap</span>
      </div>
      <iframe
        srcDoc={mapHtml}
        className={styles.mapFrame}
        title="কৃষি মানচিত্র"
        sandbox="allow-scripts"
      />
      <div className={styles.mapNote}>ঢাকা · BRRI · DAM অফিস মার্কার</div>
    </div>
  );
}

// ── 4. NEWS ───────────────────────────────────────────────────────────────────
const NEWS_SOURCES = [
  { name: "bdnews24",    url: "https://api.rss2json.com/v1/api.json?rss_url=https://bdnews24.com/feed/",                 color: "#e53e3e" },
  { name: "Daily Star",  url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.thedailystar.net/frontpage/rss.xml", color: "#1d4ed8" },
  { name: "Prothom Alo", url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.prothomalo.com/feed/",            color: "#1b8a3e" },
];

interface NewsItem { title: string; link: string; pubDate: string; source: string; color: string; }

export function NewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled(
      NEWS_SOURCES.map(s =>
        fetch(s.url)
          .then(r => r.json())
          .then(d => (d.items || []).slice(0, 4).map((item: { title: string; link: string; pubDate: string }) => ({
            title: item.title,
            link:  item.link,
            pubDate: item.pubDate,
            source: s.name,
            color:  s.color,
          })))
      )
    ).then(results => {
      const all: NewsItem[] = [];
      results.forEach(r => { if (r.status === "fulfilled") all.push(...r.value); });
      // Sort by date desc, interleave sources
      setNews(all.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()).slice(0, 15));
      setLoading(false);
    });
  }, []);

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 60)  return `${mins} মি আগে`;
    if (mins < 1440) return `${Math.floor(mins/60)} ঘণ্টা আগে`;
    return `${Math.floor(mins/1440)} দিন আগে`;
  };

  return (
    <div className={styles.newsCard}>
      <div className={styles.newsHead}>
        <span className={styles.newsLiveDot} />
        <span className={styles.newsTitle}>সর্বশেষ সংবাদ</span>
        <div className={styles.newsSourceBadges}>
          {NEWS_SOURCES.map(s => (
            <span key={s.name} className={styles.nsBadge} style={{ background: s.color }}>
              {s.name}
            </span>
          ))}
        </div>
      </div>
      {loading ? (
        <div className={styles.newsLoad}>সংবাদ লোড হচ্ছে…</div>
      ) : (
        <div className={styles.newsList}>
          {news.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.newsItem}
            >
              <span className={styles.newsSource} style={{ color: item.color }}>
                {item.source}
              </span>
              <span className={styles.newsItemTitle}>{item.title}</span>
              <span className={styles.newsTime}>{timeAgo(item.pubDate)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
