import type { Actor, Role } from "@/lib/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { roles } from "@/lib/types";

function isRole(value: string): value is Role {
  return (roles as readonly string[]).includes(value);
}

export async function requireActor(request: Request): Promise<Actor> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: missing bearer token");
  }

  const token = authorization.replace("Bearer ", "").trim();
  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    throw new Error("Unauthorized: invalid bearer token");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile || !isRole(profile.role)) {
    throw new Error("Unauthorized: role not found");
  }

  return {
    id: authData.user.id,
    email: authData.user.email ?? null,
    role: profile.role,
  };
}

export function assertRole(actor: Actor, allowed: Role[]) {
  if (!allowed.includes(actor.role)) {
    throw new Error("Forbidden");
  }
}

