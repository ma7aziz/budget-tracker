"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui/Loading";
import { getDefaultDataProviderKind } from "@/services/dataProvider";
import { getCurrentSession, onAuthStateChange } from "@/services/supabaseAuth";
import { isSupabaseConfigured } from "@/services/supabaseClient";

const AUTH_ROUTE = "/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const requiresAuth = getDefaultDataProviderKind() === "supabase";

    if (!requiresAuth) {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      if (pathname !== AUTH_ROUTE) {
        router.replace(AUTH_ROUTE);
      }
      setAuthorized(false);
      setChecking(false);
      return;
    }

    if (pathname === AUTH_ROUTE) {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    let unsubscribe: () => void = () => undefined;

    getCurrentSession()
      .then((session) => {
        const authed = Boolean(session);
        setAuthorized(authed);
        if (!authed && pathname !== AUTH_ROUTE) {
          router.replace(AUTH_ROUTE);
        }
      })
      .finally(() => setChecking(false));

    unsubscribe = onAuthStateChange((session) => {
      const authed = Boolean(session);
      setAuthorized(authed);
      if (!authed && pathname !== AUTH_ROUTE) {
        router.replace(AUTH_ROUTE);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [pathname, router]);

  if (pathname === AUTH_ROUTE) {
    return <>{children}</>;
  }

  if (checking || !authorized) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
