import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

function normalizeEnvValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const unquoted = trimmed.slice(1, -1).trim();
    return unquoted.length > 0 ? unquoted : null;
  }

  return trimmed;
}

function getSupabaseConfig(): { url: string | null; anonKey: string | null } {
  const url = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return { url, anonKey };
}

function warnIfSuspiciousAnonKey(anonKey: string): void {
  const looksLikeJwt = anonKey.split(".").length === 3;
  const looksLikePublishable = anonKey.startsWith("sb_publishable_") || anonKey.startsWith("sb_publish");
  const looksPlaceholder =
    anonKey.toLowerCase().includes("your_") ||
    anonKey.toLowerCase().includes("replace") ||
    anonKey.toLowerCase().includes("example");

  if (looksPlaceholder) {
    console.warn(
      "Supabase key looks like a placeholder. Set NEXT_PUBLIC_SUPABASE_ANON_KEY to your project's anon/public API key."
    );
    return;
  }

  if (!looksLikeJwt && !looksLikePublishable) {
    console.warn(
      "Supabase anon key looks unusual. Make sure NEXT_PUBLIC_SUPABASE_ANON_KEY is the anon/public API key from Supabase → Project Settings → API."
    );
    return;
  }

  if (looksLikePublishable && anonKey.length < 80) {
    console.warn(
      "Supabase key starts with sb_publishable_ but is very short. Double-check you copied the full key from Supabase → Project Settings → API."
    );
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

export function getSupabaseClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  if (!cachedClient) {
    warnIfSuspiciousAnonKey(anonKey);
    cachedClient = createClient(
      url,
      anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            apikey: anonKey,
          },
        },
      }
    );
  }

  return cachedClient;
}
