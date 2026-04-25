import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { assertRole, requireActor } from "@/lib/auth";
import { badRequest, serverError, unauthorized, zodError } from "@/lib/http";
import { labelGenerationPayloadSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function makeLabelCode(variantId: string, index: number) {
  const shortId = variantId.replaceAll("-", "").slice(0, 8).toUpperCase();
  const seq = String(index + 1).padStart(4, "0");
  return `FG-${shortId}-${Date.now()}-${seq}`;
}

export async function POST(request: Request) {
  try {
    const actor = await requireActor(request);
    assertRole(actor, ["admin", "owner"]);
    const payload = labelGenerationPayloadSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const rows = Array.from({ length: payload.quantity }, (_, index) => ({
      variant_id: payload.variantId,
      barcode_value: makeLabelCode(payload.variantId, index),
      template_name: payload.templateName,
      created_by: actor.id,
    }));

    const { data, error } = await supabase
      .from("product_labels")
      .insert(rows)
      .select("id,barcode_value,variant_id,template_name,created_at");

    if (error) return badRequest("Gagal membuat label barcode.", error.message);

    return NextResponse.json({ success: true, labels: data ?? [] });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return unauthorized("Token auth tidak valid atau role belum diset.");
    }
    if (error instanceof ZodError) {
      return zodError(error);
    }
    return serverError(
      error instanceof Error ? error.message : "Terjadi kesalahan saat generate label.",
    );
  }
}

