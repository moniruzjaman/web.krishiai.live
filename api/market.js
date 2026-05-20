/**
 * api/market.js
 * Curated market prices for Bangladeshi agricultural commodities.
 * Source: DAM (Department of Agricultural Marketing) — approximate rates.
 */

export const config = { maxDuration: 60 };

const PRICES = [
  { name: "মোটা চাল",     en: "Coarse Rice",   price: "৫৩–৫৫", unit: "kg", trend: "up",   icon: "🌾" },
  { name: "মিনিকেট চাল",  en: "Fine Rice",     price: "৭২–৭৮", unit: "kg", trend: "up",   icon: "🍚" },
  { name: "আলু",          en: "Potato",        price: "২৮–৩৫", unit: "kg", trend: "down",  icon: "🥔" },
  { name: "পেঁয়াজ",      en: "Onion",         price: "৪৫–৫৫", unit: "kg", trend: "up",   icon: "🧅" },
  { name: "রসুন",         en: "Garlic",        price: "১৮০–২২০", unit: "kg", trend: "up",   icon: "🧄" },
  { name: "আদা",          en: "Ginger",        price: "১২০–১৬০", unit: "kg", trend: "up",   icon: "🫚" },
  { name: "বেগুন",        en: "Eggplant",      price: "৫০–৭০",  unit: "kg", trend: "up",   icon: "🍆" },
  { name: "টমেটো",        en: "Tomato",        price: "৩০–৪৫",  unit: "kg", trend: "down",  icon: "🍅" },
  { name: "মুগ ডাল",      en: "Mung Lentil",   price: "১১০–১৩০", unit: "kg", trend: "flat", icon: "🫘" },
  { name: "ভুট্টা",       en: "Corn",          price: "৩৫–৪০",  unit: "kg", trend: "up",   icon: "🌽" },
  { name: "পাট",          en: "Jute",          price: "২৫০০–৩০০০", unit: "মণ", trend: "up", icon: "🪢" },
  { name: "গম",           en: "Wheat",         price: "৩৮–৪৫",  unit: "kg", trend: "flat", icon: "🌾" },
];

function cors(req, res) {
  const allowedOrigins = [
    "https://krishiai.live",
    "https://www.krishiai.live",
    "http://localhost:5173",
    "http://localhost:3001",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  return res.status(200).json({
    ok: true,
    source: "DAM (Department of Agricultural Marketing) — approximate rates",
    region: "ঢাকা",
    updatedAt: new Date().toISOString(),
    prices: PRICES,
  });
}
