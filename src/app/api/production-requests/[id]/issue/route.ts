import { NextResponse } from "next/server";
import { assertRole, requireActor } from "@/lib/auth";
import { readStockLevel, upsertStockLevel } from "@/lib/db";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { buildSoftStockWarning, consumeFifoLayers } from "@/lib/inventory";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await requireActor(request);
    assertRole(actor, ["admin", "owner"]);
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    const warnings = [];

    const { data: requestHeader, error: reqError } = await supabase
      .from("production_requests")
      .select("id,status,warehouse_id")
      .eq("id", id)
      .single();
    if (reqError || !requestHeader) {
      return badRequest("Production request tidak ditemukan.", reqError?.message);
    }
    if (requestHeader.status !== "approved") {
      return badRequest("Production request harus berstatus approved.");
    }

    const { data: lines, error: lineError } = await supabase
      .from("production_request_lines")
      .select("id,item_id,variant_id,quantity")
      .eq("production_request_id", id);
    if (lineError || !lines?.length) {
      return badRequest("Detail request tidak ditemukan.", lineError?.message);
    }

    const { data: outboundHeader, error: outboundError } = await supabase
      .from("inventory_transactions")
      .insert({
        transaction_type: "outbound",
        source_type: "production_issue",
        warehouse_id: requestHeader.warehouse_id,
        reference_no: `PR-${id}`,
        notes: "Pengeluaran bahan untuk produksi dari request yang disetujui.",
        created_by: actor.id,
      })
      .select("id")
      .single();
    if (outboundError || !outboundHeader) {
      return badRequest("Gagal membuat outbound issue.", outboundError?.message);
    }

    for (const line of lines) {
      const qty = Number(line.quantity);
      const currentQty = await readStockLevel({
        warehouseId: requestHeader.warehouse_id,
        itemId: line.item_id,
        variantId: line.variant_id,
      });
      const warning = buildSoftStockWarning(line.item_id, line.variant_id, currentQty, qty);
      if (warning) warnings.push(warning);

      const { data: fifoLayers, error: fifoReadError } = await supabase
        .from("fifo_layers")
        .select("id,remaining_qty,unit_cost")
        .eq("warehouse_id", requestHeader.warehouse_id)
        .eq("item_id", line.item_id)
        .is("variant_id", line.variant_id)
        .gt("remaining_qty", 0)
        .order("created_at", { ascending: true });
      if (fifoReadError) {
        return badRequest("Gagal membaca FIFO layers.", fifoReadError.message);
      }

      const fifo = consumeFifoLayers(fifoLayers ?? [], qty);
      const effectiveCost = fifo.totalCost / Math.max(fifo.consumedQty, 1);

      const { data: createdLine, error: createLineError } = await supabase
        .from("inventory_transaction_lines")
        .insert({
          transaction_id: outboundHeader.id,
          item_id: line.item_id,
          variant_id: line.variant_id,
          quantity: qty,
          unit_cost: effectiveCost,
          line_cost: fifo.totalCost,
        })
        .select("id")
        .single();
      if (createLineError || !createdLine) {
        return badRequest("Gagal menyimpan detail outbound.", createLineError?.message);
      }

      await upsertStockLevel({
        warehouseId: requestHeader.warehouse_id,
        itemId: line.item_id,
        variantId: line.variant_id,
        delta: -qty,
      });

      for (const usage of fifo.consumptions) {
        const currentLayer = fifoLayers?.find((layer) => layer.id === usage.layerId);
        if (!currentLayer) continue;

        const { error: updateLayerError } = await supabase
          .from("fifo_layers")
          .update({
            remaining_qty: currentLayer.remaining_qty - usage.quantity,
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

    const { error: updateReqError } = await supabase
      .from("production_requests")
      .update({
        status: "issued",
        issued_at: new Date().toISOString(),
        issued_by: actor.id,
        issued_transaction_id: outboundHeader.id,
      })
      .eq("id", id);
    if (updateReqError) {
      return badRequest("Gagal menandai request sebagai issued.", updateReqError.message);
    }

    await supabase.from("audit_logs").insert({
      actor_id: actor.id,
      table_name: "production_requests",
      record_id: id,
      action: "issue",
      old_data: { status: "approved" },
      new_data: { status: "issued", issued_transaction_id: outboundHeader.id },
    });

    return NextResponse.json({
      success: true,
      requestId: id,
      issuedTransactionId: outboundHeader.id,
      warnings,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return unauthorized("Token auth tidak valid atau role belum diset.");
    }
    return serverError(
      error instanceof Error ? error.message : "Terjadi kesalahan saat issue bahan produksi.",
    );
  }
}

