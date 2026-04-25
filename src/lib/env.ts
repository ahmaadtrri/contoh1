type RequiredKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY";

export function getEnv(key: RequiredKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function readRuntimeEnv() {
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseAnonKey) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return {
    supabaseUrl: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey,
    supabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
