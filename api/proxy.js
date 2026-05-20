export default async function handler(req, res) {
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
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const { target, ...params } = req.query;
  if (!target) return res.status(400).json({ error: "Missing target param" });

  try {
    const url = new URL(target);
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
