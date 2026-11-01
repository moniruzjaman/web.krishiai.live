/**
 * require-auth.ts — Server-side authentication guard for privileged API routes
 *
 * The /api/dashboard/* surface exposes internal orchestration telemetry,
 * provider configuration and deployment history. It must only be reachable by
 * signed-in users (the dashboard UI itself is a client component that calls
 * these endpoints with the Supabase session cookie attached).
 */

import { NextRequest } from "next/server";
import { createClient } from "./supabase/server";

export interface AuthContext {
  userId: string;
  email?: string;
}

/**
 * Resolve the caller's Supabase session from request cookies.
 * Returns null when unauthenticated or when Supabase isn't configured.
 */
export async function getAuthedUser(
  request: NextRequest
): Promise<AuthContext | null> {
  void request; // session lives in cookies; request object kept for API symmetry
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return null;
    return { userId: user.id, email: user.email };
  } catch {
    return null;
  }
}
