"use client";

import { useEffect } from "react";
import { getDefaultDataProviderKind } from "@/services/dataProvider";
import { getCurrentSession, onAuthStateChange } from "@/services/supabaseAuth";
import { isSupabaseConfigured } from "@/services/supabaseClient";
import { registerOnlineSync, triggerSync } from "@/services/supabaseSync";
import { applySessionScope } from "@/services/userScope";

export function SupabaseSyncListener() {
  useEffect(() => {
    if (!isSupabaseConfigured() || getDefaultDataProviderKind() !== "supabase") {
      return;
    }

    const unregisterOnline = registerOnlineSync();
    const unregisterAuth = onAuthStateChange((session) => {
      void (async () => {
        await applySessionScope(session);
        if (session) {
          triggerSync();
        }
      })();
    });

    getCurrentSession().then((session) => {
      void (async () => {
        await applySessionScope(session);
        if (session) {
          triggerSync();
        }
      })();
    });

    return () => {
      unregisterOnline();
      unregisterAuth();
    };
  }, []);

  return null;
}
