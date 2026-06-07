"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

const InstallPrompt = dynamic(() => import("./InstallPrompt"), {
  ssr: false,
});

function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });
          console.log("[SW] Registered:", registration.scope);
        } catch (err) {
          console.warn("[SW] Registration failed:", err);
        }
      });
    }
  }, []);

  return null;
}

export default function ClientShell() {
  return (
    <>
      <ServiceWorkerRegister />
      <InstallPrompt />
    </>
  );
}
