"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Login berhasil. Mengalihkan...");
    router.push("/gudang");
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <section className="mx-auto max-w-md rounded-2xl bg-panel p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Login Sistem Inventori</h1>
        <p className="mt-2 text-sm text-muted">
          Gunakan akun Supabase Auth yang sudah diberi role di tabel profiles.
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
      </section>
    </main>
  );
}
