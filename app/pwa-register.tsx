"use client";

import { useEffect } from "react";
import { registerServiceWorker, unregisterServiceWorkers } from "../services/pwa";

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      unregisterServiceWorkers().catch(() => undefined);
      return;
    }
    registerServiceWorker();
  }, []);

  return null;
}
