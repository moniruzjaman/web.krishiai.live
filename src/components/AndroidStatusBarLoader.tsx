/**
 * AndroidStatusBarLoader.tsx — Client wrapper that lazy-loads AndroidStatusBar.
 *
 * Layout.tsx is a Server Component, but AndroidStatusBar needs browser APIs
 * (matchMedia, navigator). This wrapper uses next/dynamic with ssr:false.
 */

"use client";

import dynamic from "next/dynamic";

const AndroidStatusBar = dynamic(() => import("./AndroidStatusBar"), {
  ssr: false,
});

export default function AndroidStatusBarLoader() {
  return <AndroidStatusBar />;
}