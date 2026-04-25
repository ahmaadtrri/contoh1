import { NextResponse } from "next/server";
import { assertRole, requireActor } from "@/lib/auth";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const actor = await requireActor(request);
    assertRole(actor, ["admin", "owner", "produksi"]);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("stock_levels")
      .select("item_id,variant_id,quantity,items(name,reorder_point)")
      .order("updated_at", { ascending: false });

    if (error) {
      return badRequest("Gagal membaca data low stock.", error.message);
    }

    const filtered = (data ?? []).filter((row) => {
      const linkedItem = Array.isArray(row.items) ? row.items[0] : row.items;
      const reorderPoint = Number(linkedItem?.reorder_point ?? 0);
      return Number(row.quantity) <= reorderPoint;
    });

    return NextResponse.json({
      success: true,
      totalLowStockItems: filtered.length,
      rows: filtered,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return unauthorized("Token auth tidak valid atau role belum diset.");
    }
    return serverError(
      error instanceof Error ? error.message : "Terjadi kesalahan saat membaca low stock.",
    );
  }
}
