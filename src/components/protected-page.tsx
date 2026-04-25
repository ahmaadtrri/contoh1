"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { Role } from "@/lib/types";
import type { ReactNode } from "react";

type ProtectedContext = {
  accessToken: string;
  email: string;
  role: Role | null;
  refreshProfile: () => Promise<void>;
};

type ProtectedPageProps = {
  title: string;
  subtitle: string;
  children: (ctx: ProtectedContext) => ReactNode;
};

export function ProtectedPage({ title, subtitle, children }: ProtectedPageProps) {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.getSession();
    if (authError || !data.session) {
      setAccessToken(null);
      setEmail("");
      setRole(null);
      setLoading(false);
      return;
    }

    setAccessToken(data.session.access_token);
    setEmail(data.session.user.email ?? "-");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.session.user.id)
      .single();
    if (profileError) {
      setError("Login berhasil, tetapi role profile belum tersedia di tabel profiles.");
      setRole(null);
    } else {
      const roleValue = (profile as { role?: Role } | null)?.role ?? null;
      setRole(roleValue);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAuth();
    const { data } = supabase.auth.onAuthStateChange(() => {
      void loadAuth();
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [loadAuth, supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 py-10">
        <section className="mx-auto max-w-5xl rounded-2xl bg-panel p-8 shadow-sm">
          <p>Memuat sesi...</p>
        </section>
      </main>
    );
  }

  if (!accessToken) {
    return (
      <main className="min-h-screen bg-background px-6 py-10">
        <section className="mx-auto max-w-5xl rounded-2xl bg-panel p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-muted">Kamu belum login.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Login ke Supabase
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <section className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-2xl bg-panel p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-muted">{subtitle}</p>
          <div className="mt-4 grid gap-2 rounded-xl bg-primary-soft p-4 text-sm">
            <p>
              <span className="font-medium">User:</span> {email}
            </p>
            <p>
              <span className="font-medium">Role:</span> {role ?? "-"}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link className="rounded-md border border-emerald-300 px-3 py-1.5" href="/">
                Beranda
              </Link>
              <button
                onClick={() => void loadAuth()}
                className="rounded-md border border-emerald-300 px-3 py-1.5"
              >
                Refresh Sesi
              </button>
              <button
                onClick={() => void logout()}
                className="rounded-md bg-emerald-900 px-3 py-1.5 text-white"
              >
                Logout
              </button>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>
        {children({
          accessToken,
          email,
          role,
          refreshProfile: loadAuth,
        })}
      </section>
    </main>
  );
}
