"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/Loading";
import { isSupabaseConfigured } from "@/services/supabaseClient";
import {
  getCurrentSession,
  onAuthStateChange,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from "@/services/supabaseAuth";
import { triggerSync } from "@/services/supabaseSync";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: () => void = () => undefined;

    getCurrentSession()
      .then((session) => {
        setCurrentUserEmail(session?.user?.email ?? null);
      })
      .finally(() => setLoading(false));

    unsubscribe = onAuthStateChange((session) => {
      setCurrentUserEmail(session?.user?.email ?? null);
      if (session) {
        triggerSync();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setStatus(null);

    try {
      const session = await signInWithPassword({ email, password });
      setStatus("Signed in. Sync started.");
      triggerSync();
      if (session) {
        router.replace("/");
      }
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setStatus(null);

    try {
      await signUpWithPassword({ email, password });
      setStatus("Account created. Check your email to confirm if required.");
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  async function handleSignOut() {
    setStatus(null);
    try {
      await signOut();
      setStatus("Signed out.");
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AppLayout>
      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Auth</CardTitle>
          </CardHeader>
          <CardContent>
            {!isSupabaseConfigured() && (
              <p className="text-sm text-red-600">
                Supabase env vars are missing. Add them to `.env.local`.
              </p>
            )}

            {currentUserEmail ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  Signed in as <span className="font-semibold">{currentUserEmail}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSignOut} variant="secondary">
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSignIn}>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit">Sign In</Button>
                  <Button type="button" variant="secondary" onClick={handleSignUp}>
                    Sign Up
                  </Button>
                </div>
              </form>
            )}

            {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
