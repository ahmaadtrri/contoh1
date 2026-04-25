import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { assertRole, requireActor } from "@/lib/auth";
import { readStockLevel, upsertStockLevel } from "@/lib/db";
import { badRequest, serverError, unauthorized, zodError } from "@/lib/http";
import { stockAdjustmentPayloadSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const actor = await requireActor(request);
    assertRole(actor, ["admin", "owner"]);

    const payload = stockAdjustmentPayloadSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const { data: adjustment, error: adjustmentError } = await supabase
      .from("stock_adjustments")
      .insert({
        warehouse_id: payload.warehouseId,
        reason: payload.reason,
        notes: payload.notes ?? null,
        created_by: actor.id,
      })
      .select("id")
      .single();

    if (adjustmentError || !adjustment) {
      return badRequest("Gagal membuat stock adjustment.", adjustmentError?.message);
    }

    for (const line of payload.lines) {
      const currentQty = await readStockLevel({
        warehouseId: payload.warehouseId,
        itemId: line.itemId,
        variantId: line.variantId ?? null,
      });
      const systemQty = Number.isFinite(line.systemQty) ? line.systemQty : currentQty;
      const physicalQty = Number(line.physicalQty);
      const delta = physicalQty - systemQty;

      const { error: lineError } = await supabase.from("stock_adjustment_lines").insert({
        stock_adjustment_id: adjustment.id,
        item_id: line.itemId,
        variant_id: line.variantId ?? null,
        system_qty: systemQty,
        physical_qty: physicalQty,
        delta_qty: delta,
        note: line.note ?? null,
      });
      if (lineError) return badRequest("Gagal menyimpan detail adjustment.", lineError.message);

      await upsertStockLevel({
        warehouseId: payload.warehouseId,
        itemId: line.itemId,
        variantId: line.variantId ?? null,
        delta: delta,
      });
    }

    await supabase.from("audit_logs").insert({
      actor_id: actor.id,
      table_name: "stock_adjustments",
      record_id: adjustment.id,
      action: "create",
      old_data: null,
      new_data: payload,
    });

    return NextResponse.json({ success: true, adjustmentId: adjustment.id });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return unauthorized("Token auth tidak valid atau role belum diset.");
    }
    if (error instanceof ZodError) {
      return zodError(error);
    }
    return serverError(
      error instanceof Error ? error.message : "Terjadi kesalahan saat stock adjustment.",
    );
  }
}

