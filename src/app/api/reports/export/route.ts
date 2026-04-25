import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { assertRole, requireActor } from "@/lib/auth";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function toCsv(data: Record<string, unknown>[]) {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const lines = [headers.join(",")];
  for (const row of data) {
    lines.push(
      headers
        .map((header) => {
          const value = row[header] ?? "";
          const text = String(value).replaceAll('"', '""');
          return `"${text}"`;
        })
        .join(","),
    );
  }
  return lines.join("\n");
}

export async function GET(request: Request) {
  try {
    const actor = await requireActor(request);
    assertRole(actor, ["admin", "owner"]);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "low-stock";
    const format = (searchParams.get("format") ?? "csv").toLowerCase();

    let data: Record<string, unknown>[] = [];
    if (type === "low-stock") {
      const { data: rows, error } = await supabase
        .from("stock_levels")
        .select("item_id,variant_id,quantity,updated_at,items(name,reorder_point)");
      if (error) return badRequest("Gagal membaca low stock untuk export.", error.message);
      data = (rows ?? []).map((row) => ({
        itemId: row.item_id,
        variantId: row.variant_id,
        itemName: (Array.isArray(row.items) ? row.items[0] : row.items)?.name,
        reorderPoint: (Array.isArray(row.items) ? row.items[0] : row.items)?.reorder_point,
        quantity: row.quantity,
        updatedAt: row.updated_at,
      }));
    } else if (type === "inventory-value") {
      const { data: rows, error } = await supabase
        .from("fifo_layers")
        .select("item_id,variant_id,remaining_qty,unit_cost")
        .gt("remaining_qty", 0);
      if (error) return badRequest("Gagal membaca inventory value untuk export.", error.message);
      data = (rows ?? []).map((row) => ({
        itemId: row.item_id,
        variantId: row.variant_id,
        remainingQty: row.remaining_qty,
        unitCost: row.unit_cost,
        value: Number(row.remaining_qty) * Number(row.unit_cost),
      }));
    } else {
      return badRequest("Tipe laporan tidak didukung untuk export.");
    }

    if (format === "csv") {
      const csv = toCsv(data);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="${type}.csv"`,
        },
      });
    }

    if (format === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "content-type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "content-disposition": `attachment; filename="${type}.xlsx"`,
        },
      });
    }

    return badRequest("Format export tidak didukung. Gunakan csv atau xlsx.");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return unauthorized("Token auth tidak valid atau role belum diset.");
    }
    return serverError(error instanceof Error ? error.message : "Terjadi kesalahan saat export.");
  }
}
