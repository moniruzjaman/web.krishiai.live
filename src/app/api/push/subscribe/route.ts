/**
 * /api/push/subscribe — Register a Web Push subscription
 *
 * Body: { endpoint, keys: { p256dh, auth }, region? }
 * Called from the client after Notification.requestPermission() + PushManager.subscribe().
 * Works for both logged-in users (attached to their profile) and anonymous
 * farmers (user_id null, still eligible for region-targeted crop_alerts).
 */

import { NextRequest } from "next/server";
import { corsNextResponse, handleOptions } from "@/lib/cors";
import { createClient } from "@/lib/supabase/server";

export async function OPTIONS(req: NextRequest) {
  return handleOptions(req.headers.get("origin"), ["POST", "OPTIONS"]);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  let body: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    region?: string;
  };
  try {
    body = await req.json();
  } catch {
    return corsNextResponse({ ok: false, error: "Invalid JSON body" }, { status: 400, origin });
  }

  const { endpoint, keys, region } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return corsNextResponse(
      { ok: false, error: "endpoint, keys.p256dh, and keys.auth are required" },
      { status: 400, origin }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user?.id ?? null,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      region: region ?? null,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return corsNextResponse({ ok: false, error: error.message }, { status: 500, origin });
  }

  return corsNextResponse({ ok: true }, { origin });
}
