import type { StockWarning } from "@/lib/types";

type FifoLayer = {
  id: string;
  remaining_qty: number;
  unit_cost: number;
};

type Consumption = {
  layerId: string;
  quantity: number;
  unitCost: number;
  lineCost: number;
};

export function generateSku(model: string, color: string, size: string, sequence = 1): string {
  const safe = (input: string, length: number) =>
    input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, length) || "XX";
  const m = safe(model, 4);
  const c = safe(color, 3);
  const s = safe(size, 2);
  const seq = String(sequence).padStart(3, "0");
  return `${m}-${c}-${s}-${seq}`;
}

export function consumeFifoLayers(layers: FifoLayer[], quantity: number): {
  consumptions: Consumption[];
  consumedQty: number;
  totalCost: number;
  remainingNeeded: number;
} {
  let remainingNeeded = quantity;
  const consumptions: Consumption[] = [];

  for (const layer of layers) {
    if (remainingNeeded <= 0) break;
    if (layer.remaining_qty <= 0) continue;

    const consumeQty = Math.min(layer.remaining_qty, remainingNeeded);
    const lineCost = consumeQty * layer.unit_cost;
    consumptions.push({
      layerId: layer.id,
      quantity: consumeQty,
      unitCost: layer.unit_cost,
      lineCost,
    });
    remainingNeeded -= consumeQty;
  }

  const consumedQty = quantity - remainingNeeded;
  const totalCost = consumptions.reduce((sum, row) => sum + row.lineCost, 0);
  return { consumptions, consumedQty, totalCost, remainingNeeded };
}

export function buildSoftStockWarning(
  itemId: string,
  variantId: string | null,
  currentQty: number,
  requestedQty: number,
): StockWarning | null {
  if (currentQty >= requestedQty) return null;
  return {
    itemId,
    variantId,
    currentQty,
    requestedQty,
    message: "Stok tidak cukup, transaksi tetap diproses sesuai kebijakan soft warning.",
  };
}

