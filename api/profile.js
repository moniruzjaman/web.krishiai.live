/**
 * api/profile.js
 * User profile endpoint — confirms receipt (no database).
 */

export const config = { maxDuration: 60 };

function cors(req, res) {
  const o = req.headers.origin || "";
  if (o.endsWith(".krishiai.live") || o === "https://krishiai.live" ||
      o.startsWith("http://localhost")) {
    res.setHeader("Access-Control-Allow-Origin", o);
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
