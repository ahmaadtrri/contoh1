import { NextResponse } from "next/server";
import { assertRole, requireActor } from "@/lib/auth";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const actor = await requireActor(request);
    assertRole(actor, ["admin", "owner", "produksi"]);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!itemId) {
      return badRequest("Parameter itemId wajib diisi.");
    }

    let query = supabase
      .from("inventory_transaction_lines")
      .select(
        "id,transaction_id,item_id,variant_id,quantity,unit_cost,line_cost,created_at,inventory_transactions(transaction_type,source_type,warehouse_id,created_by)",
      )
      .eq("item_id", itemId)
      .order("created_at", { ascending: true });

    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data, error } = await query;
    if (error) return badRequest("Gagal membaca buku besar stok.", error.message);

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return unauthorized("Token auth tidak valid atau role belum diset.");
    }
    return serverError(
      error instanceof Error ? error.message : "Terjadi kesalahan saat membaca stock ledger.",
    );
  }
}

