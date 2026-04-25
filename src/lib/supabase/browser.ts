"use client";

import { createClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  browserClient = createClient(url, key);
  return browserClient;
}

