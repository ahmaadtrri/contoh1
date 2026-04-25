import { NextResponse } from "next/server";
import { assertRole, requireActor } from "@/lib/auth";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await requireActor(request);
    assertRole(actor, ["admin", "owner"]);
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();

    const { data: updated, error } = await supabase
      .from("production_requests")
      .update({
        status: "approved",
        approved_by: actor.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")
      .select("id,status")
      .single();

    if (error || !updated) {
      return badRequest("Request tidak ditemukan atau tidak berstatus pending.", error?.message);
    }

    await supabase.from("audit_logs").insert({
      actor_id: actor.id,
      table_name: "production_requests",
      record_id: id,
      action: "approve",
      old_data: null,
      new_data: { status: "approved" },
    });

    return NextResponse.json({ success: true, requestId: id, status: updated.status });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return unauthorized("Token auth tidak valid atau role belum diset.");
    }
    return serverError(
      error instanceof Error ? error.message : "Terjadi kesalahan saat approve request.",
    );
  }
}

