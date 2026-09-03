/**
 * /api/push/send — Deliver active crop_alerts as Web Push notifications
 *
 * Intended to be called by a scheduled job (e.g. a GitHub Actions cron hitting
 * this route, or Vercel Cron) — not by end users. Protected by CRON_SECRET.
 *
 * POST /api/push/send
 * Headers: Authorization: Bearer <CRON_SECRET>
 * Body (optional): { alertId?: string }  — send one alert instead of scanning all active ones
 */

import { NextRequest } from "next/server";
import { corsNextResponse } from "@/lib/cors";
import { sendPushToRegion } from "@/lib/push";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || auth !== `Bearer ${expected}`) {
    return corsNextResponse({ ok: false, error: "Unauthorized" }, { status: 401, origin });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return corsNextResponse(
      { ok: false, error: "Missing Supabase service credentials" },
      { status: 500, origin }
    );
  }
  const supabase = createServiceClient(supabaseUrl, serviceKey);

  let alertId: string | undefined;
  try {
    const body = await req.json();
    alertId = body?.alertId;
  } catch {
    // no body — fine, scan all active alerts
  }

  let query = supabase
    .from("crop_alerts")
    .select("id, region, title_bn, body_bn, alert_type")
    .eq("active", true);
  if (alertId) query = query.eq("id", alertId);

  const { data: alerts, error } = await query;
  if (error) {
    return corsNextResponse({ ok: false, error: error.message }, { status: 500, origin });
  }
  if (!alerts || alerts.length === 0) {
    return corsNextResponse({ ok: true, sent: 0, alerts: 0 }, { origin });
  }

  let totalSent = 0;
  for (const alert of alerts) {
    const result = await sendPushToRegion(
      {
        title: `কৃষি AI — ${alert.alert_type === "weather" ? "আবহাওয়া সতর্কতা" : "সতর্কতা"}`,
        body: alert.body_bn,
        url: "/",
        tag: alert.id,
      },
      alert.region
    );
    totalSent += result.sent;
  }

  return corsNextResponse({ ok: true, sent: totalSent, alerts: alerts.length }, { origin });
}
