import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function upsertStockLevel(params: {
  warehouseId: string;
  itemId: string;
  variantId: string | null;
  delta: number;
}) {
  const supabase = getSupabaseAdmin();
  const { warehouseId, itemId, variantId, delta } = params;

  const query = supabase
    .from("stock_levels")
    .select("id,quantity")
    .eq("warehouse_id", warehouseId)
    .eq("item_id", itemId);
  const scopedQuery = variantId ? query.eq("variant_id", variantId) : query.is("variant_id", null);
  const { data, error } = await scopedQuery.maybeSingle();
  if (error) throw error;

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from("stock_levels")
      .insert({
        warehouse_id: warehouseId,
        item_id: itemId,
        variant_id: variantId,
        quantity: delta,
      })
      .select("id,quantity")
      .single();
    if (insertError) throw insertError;
    return inserted;
  }

  const nextQuantity = Number(data.quantity) + delta;
  const { data: updated, error: updateError } = await supabase
    .from("stock_levels")
    .update({ quantity: nextQuantity })
    .eq("id", data.id)
    .select("id,quantity")
    .single();
  if (updateError) throw updateError;
  return updated;
}

export async function readStockLevel(params: {
  warehouseId: string;
  itemId: string;
  variantId: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const { warehouseId, itemId, variantId } = params;
  const query = supabase
    .from("stock_levels")
    .select("quantity")
    .eq("warehouse_id", warehouseId)
    .eq("item_id", itemId);
  const scopedQuery = variantId ? query.eq("variant_id", variantId) : query.is("variant_id", null);
  const { data, error } = await scopedQuery.maybeSingle();
  if (error) throw error;
  return Number(data?.quantity ?? 0);
}

