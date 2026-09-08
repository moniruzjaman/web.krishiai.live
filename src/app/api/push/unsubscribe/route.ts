/**
 * /api/push/unsubscribe — Remove a Web Push subscription
 * Body: { endpoint }
 */

import { NextRequest } from "next/server";
import { corsNextResponse, handleOptions } from "@/lib/cors";
import { createClient } from "@/lib/supabase/server";

export async function OPTIONS(req: NextRequest) {
  return handleOptions(req.headers.get("origin"), ["POST", "OPTIONS"]);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return corsNextResponse({ ok: false, error: "Invalid JSON body" }, { status: 400, origin });
  }

  if (!body.endpoint) {
    return corsNextResponse({ ok: false, error: "endpoint is required" }, { status: 400, origin });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", body.endpoint);

  if (error) {
    return corsNextResponse({ ok: false, error: error.message }, { status: 500, origin });
  }

  return corsNextResponse({ ok: true }, { origin });
}
