"use client";

import { useEffect } from "react";

export default function ServiceWorkerManager() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

    const clearMhBhartiCaches = async () => {
      if (!("caches" in window)) {
        return;
      }

      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("mh-bharti"))
          .map((key) => caches.delete(key))
      );
    };

    const manageServiceWorker = async () => {
      try {
        if (process.env.NODE_ENV !== "production" || isLocalhost || !window.isSecureContext) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
          await clearMhBhartiCaches();
          return;
        }

        await navigator.serviceWorker.register("/sw.js");
      } catch {
        // Ignore service worker errors in the UI layer.
      }
    };

    void manageServiceWorker();
  }, []);

  return null;
}
