import { NextResponse } from "next/server";
import { assertRole, requireActor } from "@/lib/auth";
import { upsertStockLevel } from "@/lib/db";
import { badRequest, serverError, unauthorized, zodError } from "@/lib/http";
import { inboundPayloadSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const actor = await requireActor(request);
    assertRole(actor, ["admin", "produksi", "owner"]);

    const payload = inboundPayloadSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const { data: header, error: headerError } = await supabase
      .from("inventory_transactions")
      .insert({
        transaction_type: "inbound",
        source_type: payload.sourceType,
        warehouse_id: payload.warehouseId,
        supplier_id: payload.supplierId ?? null,
        reference_no: payload.referenceNo ?? null,
        notes: payload.notes ?? null,
        created_by: actor.id,
      })
      .select("id")
      .single();

    if (headerError || !header) {
      return badRequest("Gagal membuat transaksi inbound.", headerError?.message);
    }

    for (const line of payload.lines) {
      const qty = Number(line.quantity);
      const unitCost = Number(line.unitCost ?? 0);
      const lineCost = qty * unitCost;

      const { error: lineError } = await supabase.from("inventory_transaction_lines").insert({
        transaction_id: header.id,
        item_id: line.itemId,
        variant_id: line.variantId ?? null,
        quantity: qty,
        unit_cost: unitCost,
        line_cost: lineCost,
        lot_number: line.lotNumber ?? null,
        batch_number: line.batchNumber ?? null,
      });
      if (lineError) return badRequest("Gagal menyimpan detail inbound.", lineError.message);

      await upsertStockLevel({
        warehouseId: payload.warehouseId,
        itemId: line.itemId,
        variantId: line.variantId ?? null,
        delta: qty,
      });

      const { error: fifoError } = await supabase.from("fifo_layers").insert({
        warehouse_id: payload.warehouseId,
        item_id: line.itemId,
        variant_id: line.variantId ?? null,
        source_transaction_line_id: null,
        source_transaction_id: header.id,
        quantity: qty,
        remaining_qty: qty,
        unit_cost: unitCost,
        lot_number: line.lotNumber ?? null,
        batch_number: line.batchNumber ?? null,
      });
      if (fifoError) return badRequest("Gagal membuat FIFO layer.", fifoError.message);
    }

    await supabase.from("audit_logs").insert({
      actor_id: actor.id,
      table_name: "inventory_transactions",
      record_id: header.id,
      action: "create",
      old_data: null,
      new_data: payload,
    });

    return NextResponse.json({ success: true, transactionId: header.id });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return unauthorized("Token auth tidak valid atau role belum diset.");
    }
    if ((error as { name?: string })?.name === "ZodError") {
      return zodError(error as never);
    }
    return serverError(error instanceof Error ? error.message : "Terjadi kesalahan saat inbound.");
  }
}

