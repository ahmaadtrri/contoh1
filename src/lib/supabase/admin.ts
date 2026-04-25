import { createClient } from "@supabase/supabase-js";
import { readRuntimeEnv } from "@/lib/env";

export function getSupabaseAdmin() {
  const { supabaseUrl, supabaseServiceRoleKey } = readRuntimeEnv();
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

