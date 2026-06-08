"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const InstallPrompt = dynamic(() => import("./InstallPrompt"), {
  ssr: false,
});

function ServiceWorkerRegister() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        registrationRef.current = registration;

        // Check for updates on mount
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  // New version available - tell user to refresh
                  const shouldReload = window.confirm(
                    "KrishiAI এর নতুন সংস্করণ উপলব্ধ! আপডেট করতে রিলোড দিন।"
                  );
                  if (shouldReload) {
                    installingWorker.postMessage({ type: "SKIP_WAITING" });
                  }
                }
              }
            });
          }
        });
      } catch (err) {
        console.warn("[SW] Registration failed:", err);
      }
    };

    register();

    // Reload page when new SW takes over
    const handleControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Periodic update check (every 30 minutes)
    const intervalId = setInterval(() => {
      if (registrationRef.current) {
        registrationRef.current.update();
      }
    }, 30 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      clearInterval(intervalId);
    };
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
