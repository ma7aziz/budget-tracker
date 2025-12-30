"use client";

import { useEffect } from "react";
import { ensureDemoData } from "@/services/demoSeed";

export function DemoSeed() {
  useEffect(() => {
    ensureDemoData().catch(() => {
      // Ignore seed errors to keep UI usable.
    });
  }, []);

  return null;
}
