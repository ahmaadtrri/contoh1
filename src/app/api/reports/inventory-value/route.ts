import { NextResponse } from "next/server";
import { assertRole, requireActor } from "@/lib/auth";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const actor = await requireActor(request);
    assertRole(actor, ["admin", "owner"]);
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    let query = supabase
      .from("fifo_layers")
      .select("item_id,variant_id,remaining_qty,unit_cost")
      .gt("remaining_qty", 0);
    if (itemId) query = query.eq("item_id", itemId);

    const { data, error } = await query;
    if (error) return badRequest("Gagal membaca nilai inventori.", error.message);

    const rows = (data ?? []).map((row) => ({
      itemId: row.item_id,
      variantId: row.variant_id,
      remainingQty: Number(row.remaining_qty),
      unitCost: Number(row.unit_cost),
      inventoryValue: Number(row.remaining_qty) * Number(row.unit_cost),
    }));
    const totalValue = rows.reduce((sum, row) => sum + row.inventoryValue, 0);

    return NextResponse.json({ success: true, totalValue, rows });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return unauthorized("Token auth tidak valid atau role belum diset.");
    }
    return serverError(
      error instanceof Error ? error.message : "Terjadi kesalahan saat membaca inventory value.",
    );
  }
}

