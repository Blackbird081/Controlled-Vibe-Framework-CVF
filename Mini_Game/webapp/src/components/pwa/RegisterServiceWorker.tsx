"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const shouldRegister = process.env.NODE_ENV === "production" || isLocal;
    if (!shouldRegister) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Do not block gameplay if service worker registration fails.
      }
    };

    void register();
  }, []);

  return null;
}
