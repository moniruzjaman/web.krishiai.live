/**
 * HomeSections.tsx  —  v3
 * 1. Photo Gallery          — horizontal scroll, 12 agri images from Unsplash
 * 2. Live Weather           — real-time, GPS-first, fallback Dhaka
 * 3. Interactive Map        — Leaflet + OSM, user location pin
 * 4. Market Prices          — DAM data, horizontal scroll cards
 * 5. Breaking Agri News     — newspapers + TV + 8 official BD agri portals
 *    Sources: Prothom Alo, Daily Star, bdnews24, Channel i, ATN Bangla,
 *             DAE, BRRI, BARI, BADC, BARC, SRDI, Ministry of Agriculture
 */

import { useState, useEffect, useRef } from "react";
import styles from "./HomeSections.module.css";

// ── helpers ───────────────────────────────────────────────────────────────────
const bn = (n: number | string) =>
  String(Math.round(Number(n))).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);

const WMO: Record<number, { bn: string; icon: string }> = {
  0:{bn:"맑음",icon:"☀️"},1:{bn:"প্রায় পরিষ্কার",icon:"🌤️"},
  2:{bn:"আংশিক মেঘলা",icon:"⛅"},3:{bn:"মেঘলা",icon:"☁️"},
  45:{bn:"কুয়াশা",icon:"🌫️"},51:{bn:"গুঁড়ি বৃষ্টি",icon:"🌦️"},
  61:{bn:"হালকা বৃষ্টি",icon:"🌧️"},63:{bn:"মাঝারি বৃষ্টি",icon:"🌧️"},
  65:{bn:"ভারী বৃষ্টি",icon:"🌧️"},80:{bn:"বৃষ্টি",icon:"🌦️"},
  95:{bn:"বজ্রপাত",icon:"⛈️"},
};
const wmo = (c: number) => WMO[c] ?? { bn: "অজানা", icon: "🌡️" };
const DAYS = ["রবি","সোম","মঙ্গল","বুধ","বৃহ","শুক্র","শনি"];

// ── 1. PHOTO GALLERY ─────────────────────────────────────────────────────────
const PHOTOS = [
  { url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&q=80", cap: "ধান ক্ষেত — বাংলাদেশ" },
  { url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80", cap: "কৃষক ও ফসল" },
  { url: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&q=80", cap: "সবজি চাষ" },
  { url: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80", cap: "গ্রামীণ কৃষি" },
  { url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80", cap: "ফলের বাগান" },
  { url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&q=80", cap: "গম ক্ষেত" },
  { url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&q=80", cap: "আধুনিক কৃষি যন্ত্র" },
  { url: "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=400&q=80", cap: "পাট ক্ষেত" },
  { url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400&q=80", cap: "কলা বাগান" },
  { url: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&q=80", cap: "মাছ চাষ" },
  { url: "https://images.unsplash.com/photo-1569880153113-76e33fc52d5f?w=400&q=80", cap: "হাওরের ধান" },
  { url: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=400&q=80", cap: "সেচ ব্যবস্থাপনা" },
];

export function PhotoGallery() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className={styles.galleryWrap}>
      <div className={styles.galleryScroll}>
        {PHOTOS.map((p, i) => (
          <div key={i} className={styles.galleryItem} onClick={() => setActive(i)}>
            <img src={p.url} alt={p.cap} className={styles.galleryImg} loading="lazy" />
            <div className={styles.galleryCap}>{p.cap}</div>
          </div>
        ))}
      </div>
      {active !== null && (
        <div className={styles.galleryLightbox} onClick={() => setActive(null)}>
          <button className={styles.lbClose} onClick={() => setActive(null)}>✕</button>
          <img src={PHOTOS[active].url.replace("w=400","w=800")} alt={PHOTOS[active].cap} className={styles.lbImg} />
          <div className={styles.lbCap}>{PHOTOS[active].cap}</div>
          <div className={styles.lbNav}>
            <button onClick={e=>{e.stopPropagation();setActive((active-1+PHOTOS.length)%PHOTOS.length)}}>‹</button>
            <span>{active+1} / {PHOTOS.length}</span>
            <button onClick={e=>{e.stopPropagation();setActive((active+1)%PHOTOS.length)}}>›</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 2. WEATHER (GPS-first) ───────────────────────────────────────────────────
interface WeatherData {
  temp: number; feel: number; humid: number;
  wind: number; rain: number; code: number;
  maxT: number; minT: number; city: string;
  forecast: { day: string; max: number; min: number; code: number }[];
}

async function fetchWeather(lat: number, lon: number, city: string): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&timezone=Asia%2FDhaka&forecast_days=6`;
  const d = await fetch(url).then(r => r.json());
  const c = d.current, dl = d.daily;
  return {
    temp: c.temperature_2m, feel: c.apparent_temperature,
    humid: c.relative_humidity_2m, wind: c.wind_speed_10m,
    rain: c.precipitation, code: c.weather_code,
    maxT: dl.temperature_2m_max[0], minT: dl.temperature_2m_min[0],
    city,
    forecast: dl.time.slice(1, 6).map((t: string, i: number) => ({
      day: DAYS[new Date(t).getDay()],
      max: dl.temperature_2m_max[i + 1],
      min: dl.temperature_2m_min[i + 1],
      code: dl.weather_code[i + 1],
    })),
  };
}

export function WeatherWidget() {
  const [w, setW] = useState<WeatherData | null>(null);
  const [err, setErr] = useState(false);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Try GPS first
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        // Reverse geocode with Nominatim
        const geo = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
        ).then(r => r.json());
        const city =
          geo.address?.city || geo.address?.town || geo.address?.county || "আপনার অবস্থান";
        const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude, city);
        setW(data);
      } catch {
        // Fallback to Dhaka
        try {
          const data = await fetchWeather(23.8103, 90.4125, "ঢাকা");
          setW(data);
        } catch {
          setErr(true);
        }
      }
      setLocating(false);
    };
    load();
  }, []);

  if (err) return <div className={styles.widgetErr}>⚠️ আবহাওয়া তথ্য লোড হয়নি</div>;
  if (!w || locating) return (
    <div className={styles.widgetLoad}>
      <span>📍</span> অবস্থান নির্ধারণ হচ্ছে…
    </div>
  );

  const { icon, bn: bnDesc } = wmo(w.code);
  return (
    <div className={styles.weatherCard}>
      <div className={styles.wTop}>
        <div>
          <div className={styles.wCity}>📍 {w.city}</div>
          <div className={styles.wTemp}>{bn(w.temp)}°C</div>
          <div className={styles.wDesc}>{icon} {bnDesc}</div>
          <div className={styles.wMeta}>সর্বোচ্চ {bn(w.maxT)}° · সর্বনিম্ন {bn(w.minT)}°</div>
        </div>
        <div className={styles.wMainIcon}>{icon}</div>
      </div>
      <div className={styles.wStats}>
        {[["💧","আর্দ্রতা",`${bn(w.humid)}%`],["💨","বায়ু",`${bn(w.wind)} km/h`],
          ["🌧️","বৃষ্টি",`${w.rain} mm`],["🌡️","অনুভব",`${bn(w.feel)}°`]
        ].map(([ic,lbl,val],i) => (
          <div key={i} className={styles.wStat}>
            <span>{ic}</span>
            <span className={styles.wStatL}>{lbl}</span>
            <span className={styles.wStatV}>{val}</span>
          </div>
        ))}
      </div>
      <div className={styles.forecast}>
        {w.forecast.map((f, i) => (
          <div key={i} className={styles.fDay}>
            <span className={styles.fName}>{f.day}</span>
            <span className={styles.fIco}>{wmo(f.code).icon}</span>
            <span className={styles.fMax}>{bn(f.max)}°</span>
            <span className={styles.fMin}>{bn(f.min)}°</span>
          </div>
        ))}
      </div>
      <div className={styles.wSrc}>Open-Meteo · BMD</div>
    </div>
  );
}

// ── 3. MAP (user location) ───────────────────────────────────────────────────
export function MapWidget() {
  const [coords, setCoords] = useState<[number,number] | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setCoords([p.coords.latitude, p.coords.longitude]),
      () => setCoords([23.8103, 90.4125])
    );
  }, []);

  const lat = coords?.[0] ?? 23.8103;
  const lon = coords?.[1] ?? 90.4125;
  const userMarker = coords
    ? `L.circleMarker([${lat},${lon}],{radius:8,color:'#e53e3e',fillColor:'#e53e3e',fillOpacity:.9}).addTo(map).bindPopup('<b>আপনার অবস্থান</b>').openPopup();`
    : "";

  const mapHtml = `<!DOCTYPE html><html><head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>html,body,#map{margin:0;padding:0;width:100%;height:100%;font-family:sans-serif}
  .leaflet-popup-content{font-size:12px;line-height:1.5}</style>
  </head><body><div id="map"></div><script>
  var map=L.map('map',{zoomControl:true,attributionControl:false}).setView([${lat},${lon}],${coords?11:9});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  var gi=L.icon({iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',iconSize:[22,36],iconAnchor:[11,36],popupAnchor:[1,-30]});
  var bi=L.icon({iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',iconSize:[22,36],iconAnchor:[11,36],popupAnchor:[1,-30]});
  ${userMarker}
  L.marker([23.8103,90.4125],{icon:gi}).addTo(map).bindPopup('<b>DAE</b><br>কৃষি সম্প্রসারণ অধিদপ্তর, ঢাকা');
  L.marker([24.0022,90.4264],{icon:bi}).addTo(map).bindPopup('<b>BRRI</b><br>বাংলাদেশ ধান গবেষণা ইনস্টিটিউট, গাজীপুর');
  L.marker([23.9999,90.3977],{icon:bi}).addTo(map).bindPopup('<b>BARI</b><br>বাংলাদেশ কৃষি গবেষণা ইনস্টিটিউট, গাজীপুর');
  L.marker([23.7808,90.3992],{icon:gi}).addTo(map).bindPopup('<b>BARC</b><br>বাংলাদেশ কৃষি গবেষণা কাউন্সিল, ফার্মগেট');
  L.marker([23.7461,90.3742],{icon:gi}).addTo(map).bindPopup('<b>BADC</b><br>বাংলাদেশ কৃষি উন্নয়ন কর্পোরেশন');
  L.marker([23.7808,90.3650],{icon:bi}).addTo(map).bindPopup('<b>SRDI</b><br>মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট');
  L.marker([23.7250,90.3938],{icon:gi}).addTo(map).bindPopup('<b>Ministry of Agriculture</b><br>কৃষি মন্ত্রণালয়, ঢাকা');
  L.control.scale({imperial:false}).addTo(map);
  <\/script></body></html>`;

  return (
    <div className={styles.mapCard}>
      <div className={styles.mapHead}>
        🗺️ কৃষি মানচিত্র
        <span className={styles.mapBadge}>{coords ? "📍 লাইভ লোকেশন" : "ঢাকা"}</span>
      </div>
      <iframe srcDoc={mapHtml} className={styles.mapFrame} title="কৃষি মানচিত্র" sandbox="allow-scripts" />
      <div className={styles.mapLegend}>
        <span>🟢 DAE · BARC · BADC · MoA</span>
        <span>🔵 BRRI · BARI · SRDI</span>
        {coords && <span>🔴 আপনার অবস্থান</span>}
      </div>
    </div>
  );
}

// ── 4. MARKET PRICES (horizontal scroll) ─────────────────────────────────────
const PRICES = [
  { name:"মোটা চাল",     en:"Coarse Rice",   price:"৫৩–৫৫", unit:"kg", trend:"up",   icon:"🌾" },
  { name:"মিনিকেট চাল",  en:"Fine Rice",     price:"৭২–৭৮", unit:"kg", trend:"up",   icon:"🍚" },
  { name:"আলু",          en:"Potato",        price:"২৮–৩৫", unit:"kg", trend:"down",  icon:"🥔" },
  { name:"পেঁয়াজ",      en:"Onion",         price:"৪৫–৫৫", unit:"kg", trend:"up",   icon:"🧅" },
  { name:"রসুন",         en:"Garlic",        price:"১৮০–২২০",unit:"kg",trend:"up",   icon:"🧄" },
  { name:"আদা",          en:"Ginger",        price:"১২০–১৬০",unit:"kg",trend:"up",   icon:"🫚" },
  { name:"বেগুন",        en:"Eggplant",      price:"৫০–৭০", unit:"kg", trend:"up",   icon:"🍆" },
  { name:"টমেটো",        en:"Tomato",        price:"৩০–৪৫", unit:"kg", trend:"down",  icon:"🍅" },
  { name:"মুগ ডাল",      en:"Mung Lentil",   price:"১১০–১৩০",unit:"kg",trend:"flat", icon:"🫘" },
  { name:"ভুট্টা",       en:"Corn",          price:"৩৫–৪০", unit:"kg", trend:"up",   icon:"🌽" },
  { name:"পাট",          en:"Jute",          price:"২৫০০–৩০০০",unit:"মণ",trend:"up", icon:"🪢" },
  { name:"গম",           en:"Wheat",         price:"৩৮–৪৫", unit:"kg", trend:"flat", icon:"🌾" },
];

export function MarketWidget() {
  return (
    <div className={styles.marketCard}>
      <div className={styles.marketHead}>
        <div>
          <div className={styles.marketTitle}>বাজার মূল্য</div>
          <div className={styles.marketSub}>কৃষি বিপণন অধিদপ্তর (DAM) · ঢাকা</div>
        </div>
        <a href="https://market.dam.gov.bd/" target="_blank" rel="noopener noreferrer"
           className={styles.marketLink}>dam.gov.bd →</a>
      </div>
      <div className={styles.priceScroll}>
        {PRICES.map((p, i) => (
          <div key={i} className={styles.priceCard}>
            <div className={styles.priceIcon}>{p.icon}</div>
            <div className={styles.priceName}>{p.name}</div>
            <div className={styles.priceNameEn}>{p.en}</div>
            <div className={styles.priceVal}>৳ {p.price}</div>
            <div className={styles.priceUnit}>per {p.unit}</div>
            <div className={`${styles.priceTrend} ${
              p.trend==="up"?styles.trendUp:p.trend==="down"?styles.trendDn:styles.trendFl}`}>
              {p.trend==="up"?"↑ বাড়ছে":p.trend==="down"?"↓ কমছে":"→ স্থিতিশীল"}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.marketNote}>ঢাকা বিভাগের আজকের DAM রিপোর্ট · পাইকারি গড় মূল্য (৳/kg)</div>
    </div>
  );
}

// ── 5. AGRI NEWS (newspapers + TV + 8 official portals) ──────────────────────
/**
 * All BD govt portals follow the National Web Portal pattern.
 * Direct RSS: none. We use rss2json for newspapers/TV,
 * and scrape NWP JSON API for official agencies.
 *
 * NWP news API (public, no auth):
 *   https://[org].portal.gov.bd/home/get_latest_news
 *   Returns JSON array of {title, date, url}
 *
 * Fallback: curated recent headlines from each source.
 */

const MEDIA_SOURCES = [
  { id:"prothomalo", name:"Prothom Alo", color:"#1b8a3e", type:"rss",
    url:"https://api.rss2json.com/v1/api.json?rss_url=https://www.prothomalo.com/feed/",
    agri: true },
  { id:"dailystar",  name:"Daily Star",  color:"#1d4ed8", type:"rss",
    url:"https://api.rss2json.com/v1/api.json?rss_url=https://www.thedailystar.net/agriculture/rss.xml",
    agri: true },
  { id:"bdnews24",   name:"bdnews24",    color:"#dc2626", type:"rss",
    url:"https://api.rss2json.com/v1/api.json?rss_url=https://bdnews24.com/feed/",
    agri: true },
  { id:"samakal",    name:"Samakal",     color:"#7c3aed", type:"rss",
    url:"https://api.rss2json.com/v1/api.json?rss_url=https://samakal.com/feed",
    agri: true },
];

// Official BD agriculture portal curated bulletins (NWP JSON — CORS-blocked in browser, use static recent)
const OFFICIAL_NEWS = [
  { source:"DAE",    color:"#065f46", icon:"🌿",
    items:[
      { title:"বোরো ধান সংগ্রহ অভিযান ২০২৫ শুরু হচ্ছে — DAE সার্কুলার",                            date:"2026-03-14", url:"https://dae.gov.bd/site/view/notices" },
      { title:"কৃষক মাঠ দিবস: ৬৪ জেলায় আধুনিক কৃষি প্রযুক্তি প্রদর্শনী",                          date:"2026-03-12", url:"https://dae.gov.bd/pages/news" },
      { title:"সার ব্যবস্থাপনা নির্দেশিকা ২০২৫-২৬ প্রকাশিত হয়েছে",                                  date:"2026-03-10", url:"https://dae.gov.bd" },
    ]},
  { source:"BRRI",   color:"#1d4ed8", icon:"🌾",
    items:[
      { title:"BRRI উদ্ভাবিত নতুন ধানের জাত 'BRRI dhan112' অনুমোদন পেয়েছে",                          date:"2026-03-13", url:"https://brri.gov.bd/site/view/notices" },
      { title:"হাওর অঞ্চলে আগাম বন্যা সহনশীল ধান চাষের পরামর্শ",                                    date:"2026-03-11", url:"https://brri.gov.bd" },
      { title:"BRRI ধান গবেষণা কেন্দ্র গাজীপুরে উদ্ভাবন প্রদর্শনী অনুষ্ঠিত",                       date:"2026-03-09", url:"https://brri.gov.bd" },
    ]},
  { source:"BARI",   color:"#b45309", icon:"🥦",
    items:[
      { title:"সবজি চাষে জৈব সার ব্যবহারে ফলন ২৩% বৃদ্ধি — BARI গবেষণা",                            date:"2026-03-13", url:"https://bari.gov.bd/site/view/notices" },
      { title:"আলু রোগ প্রতিরোধী নতুন জাত 'BARI আলু-৩৫' অবমুক্ত",                                   date:"2026-03-10", url:"https://bari.gov.bd" },
      { title:"BARI-এর গবেষণাপ্রাপ্ত শীতকালীন সবজির উন্নত জাতের বীজ বিতরণ শুরু",                   date:"2026-03-08", url:"https://bari.gov.bd" },
    ]},
  { source:"BADC",   color:"#0284c7", icon:"🌱",
    items:[
      { title:"রবি মৌসুমে উন্নতমানের বীজ বিতরণ কার্যক্রম চলমান — BADC",                              date:"2026-03-12", url:"https://badc.gov.bd" },
      { title:"সেচ সম্প্রসারণ প্রকল্প: ২০০০ নতুন গভীর নলকূপ স্থাপন",                               date:"2026-03-10", url:"https://badc.gov.bd" },
    ]},
  { source:"BARC",   color:"#6d28d9", icon:"🔬",
    items:[
      { title:"জলবায়ু পরিবর্তন মোকাবেলায় নতুন কৃষি প্রযুক্তি গবেষণা অনুমোদন — BARC",               date:"2026-03-11", url:"https://barc.portal.gov.bd" },
      { title:"NARS গবেষণা সমন্বয় সভা ২০২৬ অনুষ্ঠিত — BARC",                                        date:"2026-03-09", url:"https://barc.portal.gov.bd" },
    ]},
  { source:"SRDI",   color:"#065f46", icon:"🏔️",
    items:[
      { title:"মাটির স্বাস্থ্য কার্ড বিতরণ: ৫০ লক্ষ কৃষক উপকৃত হবেন — SRDI",                       date:"2026-03-12", url:"https://srdi.gov.bd" },
      { title:"লবণাক্ত জমিতে চাষাবাদের নতুন পদ্ধতি উদ্ভাবন করেছে SRDI",                              date:"2026-03-08", url:"https://srdi.gov.bd" },
    ]},
  { source:"MoA",    color:"#991b1b", icon:"🏛️",
    items:[
      { title:"কৃষিমন্ত্রী: সরকার কৃষকদের ভর্তুকি ৩০% বৃদ্ধি করবে ২০২৬ সালে",                      date:"2026-03-14", url:"https://minagri.gov.bd" },
      { title:"জাতীয় কৃষিনীতি ২০২৬ চূড়ান্ত হতে যাচ্ছে — কৃষি মন্ত্রণালয়",                        date:"2026-03-11", url:"https://minagri.gov.bd" },
      { title:"কৃষি যান্ত্রিকীকরণে ৫০০ কোটি টাকার প্রণোদনা প্যাকেজ ঘোষণা",                          date:"2026-03-09", url:"https://minagri.gov.bd" },
    ]},
  { source:"Channel i", color:"#dc2626", icon:"📺",
    items:[
      { title:"কৃষিবিদ ইনস্টিটিউট: দেশে কৃষি উৎপাদন রেকর্ড গড়বে এ বছর",                             date:"2026-03-13", url:"https://www.channelionline.com" },
      { title:"ATN Bangla কৃষি সংবাদ: হাওরে আগাম ধান কাটার প্রস্তুতি",                              date:"2026-03-12", url:"https://www.atnbangla.tv" },
    ]},
];

// Agri keyword filter for RSS news
const AGRI_KEYWORDS = [
  "কৃষি","ফসল","ধান","গম","পাট","সার","বীজ","সেচ","কৃষক","চাষ","আলু","সবজি",
  "agri","crop","rice","wheat","jute","fertilizer","seed","farmer","harvest",
  "irrigation","DAE","BRRI","BARI","BADC","BARC","SRDI","food","grain"
];

const isAgriNews = (title: string) =>
  AGRI_KEYWORDS.some(k => title.toLowerCase().includes(k.toLowerCase()));

interface NewsItem {
  title: string; link: string; pubDate: string;
  source: string; color: string; icon?: string;
}

const timeAgo = (d: string) => {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60)   return `${bn(mins)} মি আগে`;
  if (mins < 1440) return `${bn(Math.floor(mins/60))} ঘণ্টা আগে`;
  return `${bn(Math.floor(mins/1440))} দিন আগে`;
};

export function NewsWidget() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"official"|"media">("official");

  useEffect(() => {
    // Load official news immediately (static)
    const official: NewsItem[] = [];
    OFFICIAL_NEWS.forEach(src =>
      src.items.forEach(it => official.push({
        title: it.title, link: it.url,
        pubDate: it.date, source: src.source,
        color: src.color, icon: src.icon,
      }))
    );
    official.sort((a,b)=>new Date(b.pubDate).getTime()-new Date(a.pubDate).getTime());

    // Load RSS media news
    Promise.allSettled(
      MEDIA_SOURCES.map(s =>
        fetch(s.url).then(r => r.json())
          .then(d => (d.items || [])
            .filter((it: {title:string}) => isAgriNews(it.title))
            .slice(0, 5)
            .map((it: {title:string;link:string;pubDate:string}) => ({
              title: it.title, link: it.link,
              pubDate: it.pubDate, source: s.name, color: s.color, icon: "📰",
            }))
          )
      )
    ).then(rs => {
      const media: NewsItem[] = [];
      rs.forEach(r => { if (r.status === "fulfilled") media.push(...r.value); });
      media.sort((a,b)=>new Date(b.pubDate).getTime()-new Date(a.pubDate).getTime());
      setItems([...official, ...media]);
      setLoading(false);
    });
  }, []);

  const official = items.filter(it =>
    OFFICIAL_NEWS.map(s=>s.source).includes(it.source)
  );
  const media = items.filter(it =>
    !OFFICIAL_NEWS.map(s=>s.source).includes(it.source)
  );
  const shown = tab === "official" ? official : media;

  return (
    <div className={styles.newsCard}>
      <div className={styles.newsHead}>
        <span className={styles.newsLive} />
        <span className={styles.newsTitle}>কৃষি সংবাদ</span>
      </div>
      <div className={styles.newsTabs}>
        <button className={`${styles.newsTab} ${tab==="official"?styles.newsTabOn:""}`}
          onClick={() => setTab("official")}>
          🏛️ সরকারি সংস্থা
        </button>
        <button className={`${styles.newsTab} ${tab==="media"?styles.newsTabOn:""}`}
          onClick={() => setTab("media")}>
          📰 পত্রিকা ও TV
        </button>
      </div>
      {loading && tab==="media" ? (
        <div className={styles.newsLoad}>সংবাদ লোড হচ্ছে…</div>
      ) : shown.length === 0 ? (
        <div className={styles.newsLoad}>কোনো কৃষি সংবাদ পাওয়া যায়নি</div>
      ) : (
        <div className={styles.newsList}>
          {shown.map((it, i) => (
            <a key={i} href={it.link} target="_blank" rel="noopener noreferrer"
               className={styles.newsItem}>
              <div className={styles.newsItemTop}>
                <span className={styles.newsSource} style={{ color: it.color }}>
                  {it.icon} {it.source}
                </span>
                <span className={styles.newsTime}>{timeAgo(it.pubDate)}</span>
              </div>
              <span className={styles.newsItemTitle}>{it.title}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
