/**
 * /api/dashboard/deployments — Deployment History for OpenProvider Dashboard
 *
 * Returns recent deployment info, CI status, and build metadata.
 * Vercel serverless runtimes don't ship a git binary or repository, so we
 * expose safe, non-sensitive build metadata from environment variables
 * instead of shelling out to `git` (execSync in an unauthenticated route is
 * both an information leak and an injection/RCE risk).
 */

import { NextRequest } from "next/server";
import { handleOptions, corsNextResponse } from "@/lib/cors";
import { getAuthedUser } from "@/lib/require-auth";

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request.headers.get("origin"), ["GET"]);
}

interface DeploymentInfo {
  version: string;
  branch: string;
  commit: string;
  commitMessage: string;
  commitDate: string;
  author: string;
  buildStatus: string;
}

// Only allow simple alphanumeric/slash/dash/hyphen values from env vars
// before echoing them anywhere (defense-in-depth against header/log poison).
function safeEnv(value: string | undefined, fallback: string): string {
  if (!value || !/^[A-Za-z0-9 ._:/@+-]{1,120}$/.test(value)) return fallback;
  return value;
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Auth guard: deployment history is operator-only information.
  const user = await getAuthedUser(request);
  if (!user) {
    return corsNextResponse(
      { ok: false, error: "Unauthorized" },
      { status: 401, origin, methods: ["GET"] }
    );
  }

  const deployments: DeploymentInfo[] = [
    {
      version: safeEnv(process.env.NEXT_PUBLIC_APP_VERSION, "v4.0.2"),
      branch: safeEnv(process.env.VERCEL_GIT_COMMIT_REF, "main"),
      commit: safeEnv(process.env.VERCEL_GIT_COMMIT_SHA, "unknown").substring(0, 7),
      commitMessage: "Build metadata provided by the deployment platform",
      commitDate: safeEnv(process.env.NEXT_PUBLIC_DEPLOY_TIMESTAMP, new Date().toISOString()),
      author: "unknown",
      buildStatus: "current",
    },
  ];

  return corsNextResponse(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      platform: "vercel",
      region: safeEnv(process.env.VERCEL_REGION, "hkg1"),
      framework: "nextjs-16",
      runtime: "bun",
      deployments,
    },
    { origin, methods: ["GET"], headers: { "Cache-Control": "private, no-store" } }
  );
}
