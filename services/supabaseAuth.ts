import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient";

export interface AuthCredentials {
  email: string;
  password: string;
}

const ensureConfigured = () => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
};

export async function signUpWithPassword({
  email,
  password,
}: AuthCredentials): Promise<Session | null> {
  ensureConfigured();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw error;
  }
  return data.session ?? null;
}

export async function signInWithPassword({
  email,
  password,
}: AuthCredentials): Promise<Session | null> {
  ensureConfigured();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
  return data.session ?? null;
}

export async function signOut(): Promise<void> {
  ensureConfigured();
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.user?.id ?? null;
}

export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  if (!isSupabaseConfigured()) {
    return () => undefined;
  }

  const supabase = getSupabaseClient();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => {
    data.subscription.unsubscribe();
  };
}
