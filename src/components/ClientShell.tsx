/**
 * ClientShell.tsx — Client-side wrapper for components that need browser APIs
 *
 * This wrapper is needed because layout.tsx is a Server Component,
 * but InstallPrompt requires `beforeinstallprompt` (browser API).
 */

"use client";

import dynamic from "next/dynamic";

const InstallPrompt = dynamic(() => import("./InstallPrompt"), {
  ssr: false,
});

export default function ClientShell() {
  return <InstallPrompt />;
}
