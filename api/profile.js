/**
 * api/profile.js
 * User profile endpoint — confirms receipt (no database).
 */

export const config = { maxDuration: 60 };

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

  if (req.method === "GET") {
    const { name = "", district = "" } = req.query || {};
    return res.status(200).json({
      ok: true,
      message: `Profile received for ${name || "anonymous"} in ${district || "unknown district"}`,
    });
  }

  if (req.method === "POST") {
    const { name, district, deviceId } = req.body || {};
    return res.status(200).json({
      ok: true,
      saved: true,
      message: `Profile for ${name || "anonymous"} acknowledged`,
      received: { name: name || null, district: district || null, deviceId: deviceId || null },
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
