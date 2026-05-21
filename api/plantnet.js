export const config = { maxDuration: 30 };

const ALLOWED_ORIGINS = [
  "https://krishiai.live",
  "https://www.krishiai.live",
  "http://localhost:5173",
  "http://localhost:3001",
];

function cors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.PLANTNET_API_KEY;
  if (!key) {
    return res.status(503).json({ error: "PLANTNET_API_KEY not configured", ok: false });
  }

  const { imageBase64, mimeType = "image/jpeg" } = req.body || {};
  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 required", ok: false });
  }
  if (imageBase64.length > 7_000_000) {
    return res.status(400).json({ error: "image too large (max 5MB)", ok: false });
  }

  try {
    const buffer = Buffer.from(imageBase64, "base64");
    const ext = mimeType.split("/")[1] || "jpg";
    const blob = new Blob([buffer], { type: mimeType });

    const formData = new FormData();
    formData.append("images", blob, `image.${ext}`);
    formData.append("organs", "auto");

    const resp = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${key}`,
      { method: "POST", body: formData }
    );

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      return res.status(resp.status).json({
        error: "PlantNet API error",
        detail: txt.slice(0, 300),
        ok: false,
      });
    }

    const data = await resp.json();
    const results = (data.results || []).slice(0, 3).map((r) => ({
      name: r.species?.commonNames?.[0] || r.species?.scientificNameWithoutAuthor || "",
      scientificName: r.species?.scientificNameWithoutAuthor || "",
      score: Math.round((r.score || 0) * 100),
      eppoCode: r.species?.eppoCode || null,
      family: r.species?.family?.scientificNameWithoutAuthor || "",
    }));

    const gbifId = data.results?.[0]?.species?.gbifId || null;

    return res.status(200).json({
      ok: true,
      results,
      gbifId,
      totalCandidates: (data.results || []).length,
    });
  } catch (e) {
    return res.status(502).json({ error: e?.message || "PlantNet request failed", ok: false });
  }
}
