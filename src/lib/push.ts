/**
 * push.ts — Server-side Web Push helper
 *
 * Uses the `web-push` library (free, no third-party push service or API key
 * required — it talks directly to browser push endpoints via VAPID auth).
 * Pairs with public/sw.js's `push` + `notificationclick` handlers and the
 * subscribe/unsubscribe routes in src/app/api/push/.
 */

import webpush from "web-push";
import { createClient as createServiceClient } from "@supabase/supabase-js";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@krishiai.live";

  if (!publicKey || !privateKey) {
    throw new Error(
      "Missing VAPID keys — set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY. " +
        "Generate a pair with: npx web-push generate-vapid-keys"
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  // Service-role client bypasses RLS — only ever used server-side (cron / admin routes).
  return createServiceClient(url, serviceKey);
}

/**
 * Send a push notification to every subscription for a region (or all
 * subscriptions if region is omitted). Prunes subscriptions that the push
 * service reports as gone (410/404).
 */
export async function sendPushToRegion(payload: PushPayload, region?: string) {
  ensureConfigured();
  const supabase = serviceClient();

  let query = supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  if (region) query = query.eq("region", region);

  const { data: subs, error } = await query.returns<SubscriptionRow[]>();
  if (error) throw error;
  if (!subs || subs.length === 0) return { sent: 0, pruned: 0 };

  let sent = 0;
  const pruneIds: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
        sent += 1;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          pruneIds.push(sub.id);
        }
        // Other errors (network blips, quota) are left for the next scheduled send.
      }
    })
  );

  if (pruneIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", pruneIds);
  }

  return { sent, pruned: pruneIds.length };
}
