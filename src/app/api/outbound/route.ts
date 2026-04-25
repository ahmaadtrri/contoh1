import { NextResponse } from "next/server";
import { assertRole, requireActor } from "@/lib/auth";
import { readStockLevel, upsertStockLevel } from "@/lib/db";
import { badRequest, serverError, unauthorized, zodError } from "@/lib/http";
import { consumeFifoLayers, buildSoftStockWarning } from "@/lib/inventory";
import { outboundPayloadSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const actor = await requireActor(request);
    assertRole(actor, ["admin", "owner"]);

    const payload = outboundPayloadSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const warnings = [];

    const { data: header, error: headerError } = await supabase
      .from("inventory_transactions")
      .insert({
        transaction_type: "outbound",
        source_type: payload.sourceType,
        warehouse_id: payload.warehouseId,
        reference_no: payload.referenceNo ?? null,
        notes: payload.notes ?? null,
        created_by: actor.id,
      })
      .select("id")
      .single();
    if (headerError || !header) {
      return badRequest("Gagal membuat transaksi outbound.", headerError?.message);
    }

    for (const line of payload.lines) {
      const qty = Number(line.quantity);
      const currentQty = await readStockLevel({
        warehouseId: payload.warehouseId,
        itemId: line.itemId,
        variantId: line.variantId ?? null,
      });
      const warning = buildSoftStockWarning(
        line.itemId,
        line.variantId ?? null,
        currentQty,
        qty,
      );
      if (warning) warnings.push(warning);

      const { data: fifoLayers, error: fifoReadError } = await supabase
        .from("fifo_layers")
        .select("id,remaining_qty,unit_cost")
        .eq("warehouse_id", payload.warehouseId)
        .eq("item_id", line.itemId)
        .is("variant_id", line.variantId ?? null)
        .gt("remaining_qty", 0)
        .order("created_at", { ascending: true });
      if (fifoReadError) {
        return badRequest("Gagal membaca FIFO layers.", fifoReadError.message);
      }

      const fifo = consumeFifoLayers(fifoLayers ?? [], qty);
      const effectiveCost = fifo.totalCost / Math.max(fifo.consumedQty, 1);

      const { data: createdLine, error: lineError } = await supabase
        .from("inventory_transaction_lines")
        .insert({
          transaction_id: header.id,
          item_id: line.itemId,
          variant_id: line.variantId ?? null,
          quantity: qty,
          unit_cost: effectiveCost,
          line_cost: fifo.totalCost,
        })
        .select("id")
        .single();
      if (lineError || !createdLine) {
        return badRequest("Gagal menyimpan detail outbound.", lineError?.message);
      }

      await upsertStockLevel({
        warehouseId: payload.warehouseId,
        itemId: line.itemId,
        variantId: line.variantId ?? null,
        delta: -qty,
      });

      for (const usage of fifo.consumptions) {
        const { error: updateLayerError } = await supabase
          .from("fifo_layers")
          .update({
            remaining_qty: fifoLayers?.find((row) => row.id === usage.layerId)!.remaining_qty - usage.quantity,
          })
          .eq("id", usage.layerId);
        if (updateLayerError) {
          return badRequest("Gagal update FIFO layer.", updateLayerError.message);
        }

        const { error: consumptionError } = await supabase.from("fifo_consumptions").insert({
          outbound_transaction_line_id: createdLine.id,
          fifo_layer_id: usage.layerId,
          quantity: usage.quantity,
          unit_cost: usage.unitCost,
          line_cost: usage.lineCost,
        });
        if (consumptionError) {
          return badRequest("Gagal menyimpan FIFO consumption.", consumptionError.message);
        }
      }
    }

    await supabase.from("audit_logs").insert({
      actor_id: actor.id,
      table_name: "inventory_transactions",
      record_id: header.id,
      action: "create",
      old_data: null,
      new_data: payload,
    });

    return NextResponse.json({ success: true, transactionId: header.id, warnings });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return unauthorized("Token auth tidak valid atau role belum diset.");
    }
    if (error instanceof ZodError) {
      return zodError(error);
    }
    return serverError(error instanceof Error ? error.message : "Terjadi kesalahan saat outbound.");
  }
}

