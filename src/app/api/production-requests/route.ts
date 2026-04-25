import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { assertRole, requireActor } from "@/lib/auth";
import { badRequest, serverError, unauthorized, zodError } from "@/lib/http";
import { productionRequestPayloadSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const actor = await requireActor(request);
    assertRole(actor, ["produksi", "admin", "owner"]);
    const payload = productionRequestPayloadSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const { data: requestRow, error: requestError } = await supabase
      .from("production_requests")
      .insert({
        warehouse_id: payload.warehouseId,
        requested_by: actor.id,
        notes: payload.notes ?? null,
        status: "pending",
      })
      .select("id")
      .single();
    if (requestError || !requestRow) {
      return badRequest("Gagal membuat production request.", requestError?.message);
    }

    for (const line of payload.lines) {
      const { error: lineError } = await supabase.from("production_request_lines").insert({
        production_request_id: requestRow.id,
        item_id: line.itemId,
        variant_id: line.variantId ?? null,
        quantity: line.quantity,
        note: line.note ?? null,
      });
      if (lineError) return badRequest("Gagal menyimpan detail request.", lineError.message);
    }

    await supabase.from("audit_logs").insert({
      actor_id: actor.id,
      table_name: "production_requests",
      record_id: requestRow.id,
      action: "create",
      old_data: null,
      new_data: payload,
    });

    return NextResponse.json({ success: true, requestId: requestRow.id });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return unauthorized("Token auth tidak valid atau role belum diset.");
    }
    if (error instanceof ZodError) {
      return zodError(error);
    }
    return serverError(
      error instanceof Error ? error.message : "Terjadi kesalahan saat membuat request produksi.",
    );
  }
}

