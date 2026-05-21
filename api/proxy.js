/** Whitelisted external hosts the proxy is allowed to reach */
const ALLOWED_HOSTS = [
  "api.open-meteo.com",
  "geocoding-api.open-meteo.com",
  "gems.umn.edu",
  "rest.isric.org",
  "api.rss2json.com",
];

function cors(req, res) {
  const allowedOrigins = [
    "https://krishiai.live",
    "https://www.krishiai.live",
    "http://localhost:5173",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { target, ...params } = req.query;
  if (!target) return res.status(400).json({ error: "Missing target param" });

  try {
    const url = new URL(target);

    // block open proxy — only allow whitelisted hosts
    if (!ALLOWED_HOSTS.includes(url.hostname)) {
      return res.status(403).json({ error: "Target host not allowed" });
    }

    // enforce HTTPS
    if (url.protocol !== "https:") {
      return res.status(400).json({ error: "Only HTTPS targets allowed" });
    }

    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "KrishiAI/1.0" },
    });
    const data = await response.json();
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Proxy fetch failed" });
  }
}
