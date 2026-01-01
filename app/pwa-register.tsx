"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "../services/pwa";

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    registerServiceWorker();
  }, []);

  return null;
}
