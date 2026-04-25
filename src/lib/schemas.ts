import { z } from "zod";

export const transactionLineSchema = z.object({
  itemId: z.uuid(),
  variantId: z.uuid().nullable().optional(),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative().optional(),
  lotNumber: z.string().trim().min(1).optional(),
  batchNumber: z.string().trim().min(1).optional(),
});

export const inboundPayloadSchema = z.object({
  sourceType: z.enum(["raw_material_purchase", "raw_material_return", "finished_goods_completion"]),
  warehouseId: z.uuid(),
  supplierId: z.uuid().optional(),
  referenceNo: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  lines: z.array(transactionLineSchema).min(1),
});

export const outboundPayloadSchema = z.object({
  sourceType: z.enum(["production_issue", "sales_issue", "manual_issue"]),
  warehouseId: z.uuid(),
  referenceNo: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  lines: z.array(transactionLineSchema.omit({ unitCost: true })).min(1),
});

export const stockAdjustmentLineSchema = z.object({
  itemId: z.uuid(),
  variantId: z.uuid().nullable().optional(),
  systemQty: z.number(),
  physicalQty: z.number(),
  note: z.string().trim().optional(),
});

export const stockAdjustmentPayloadSchema = z.object({
  warehouseId: z.uuid(),
  reason: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  lines: z.array(stockAdjustmentLineSchema).min(1),
});

export const productionRequestPayloadSchema = z.object({
  warehouseId: z.uuid(),
  notes: z.string().trim().optional(),
  lines: z.array(
    z.object({
      itemId: z.uuid(),
      variantId: z.uuid().nullable().optional(),
      quantity: z.number().positive(),
      note: z.string().trim().optional(),
    }),
  ),
});

export const labelGenerationPayloadSchema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().positive().max(500),
  templateName: z.string().trim().default("default-finished-goods"),
});

