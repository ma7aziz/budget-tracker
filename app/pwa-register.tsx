"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "../services/pwa";

export function PwaRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
