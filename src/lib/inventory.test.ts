import { describe, expect, it } from "vitest";
import { buildSoftStockWarning, consumeFifoLayers, generateSku } from "@/lib/inventory";

describe("inventory helpers", () => {
  it("generates deterministic SKU format", () => {
    const sku = generateSku("Kemeja Slim", "Navy", "L", 7);
    expect(sku).toBe("KEME-NAV-L-007");
  });

  it("consumes FIFO layers in order", () => {
    const result = consumeFifoLayers(
      [
        { id: "L1", remaining_qty: 5, unit_cost: 10_000 },
        { id: "L2", remaining_qty: 3, unit_cost: 12_000 },
      ],
      7,
    );
    expect(result.consumedQty).toBe(7);
    expect(result.remainingNeeded).toBe(0);
    expect(result.consumptions).toHaveLength(2);
    expect(result.totalCost).toBe(5 * 10_000 + 2 * 12_000);
  });

  it("returns warning on insufficient stock", () => {
    const warning = buildSoftStockWarning("item-1", null, 2, 5);
    expect(warning).not.toBeNull();
    expect(warning?.requestedQty).toBe(5);
  });
});

