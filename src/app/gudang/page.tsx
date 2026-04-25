"use client";

import { useState, type FormEvent } from "react";
import { ProtectedPage } from "@/components/protected-page";
import { callApi } from "@/lib/client-api";

type ApiResult = { success: boolean; [key: string]: unknown };

export default function GudangPage() {
  const [result, setResult] = useState<string>("");

  return (
    <ProtectedPage
      title="Operasional Gudang"
      subtitle="Inbound, outbound, stock adjustment, dan label finished goods."
    >
      {({ accessToken }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl bg-panel p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Inbound</h2>
            <SimpleForm
              submitLabel="Kirim Inbound"
              initialPayload={`{
  "sourceType": "raw_material_purchase",
  "warehouseId": "WAREHOUSE_UUID",
  "notes": "Pembelian bahan baku",
  "lines": [
    {
      "itemId": "ITEM_UUID",
      "quantity": 10,
      "unitCost": 50000,
      "lotNumber": "LOT-001",
      "batchNumber": "BATCH-001"
    }
  ]
}`}
              onSubmit={async (payload) => {
                const data = await callApi<ApiResult>("/api/inbound", accessToken, {
                  method: "POST",
                  body: payload,
                });
                setResult(JSON.stringify(data, null, 2));
              }}
            />
          </section>

          <section className="rounded-2xl bg-panel p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Outbound</h2>
            <SimpleForm
              submitLabel="Kirim Outbound"
              initialPayload={`{
  "sourceType": "manual_issue",
  "warehouseId": "WAREHOUSE_UUID",
  "notes": "Pengeluaran gudang",
  "lines": [
    {
      "itemId": "ITEM_UUID",
      "quantity": 2
    }
  ]
}`}
              onSubmit={async (payload) => {
                const data = await callApi<ApiResult>("/api/outbound", accessToken, {
                  method: "POST",
                  body: payload,
                });
                setResult(JSON.stringify(data, null, 2));
              }}
            />
          </section>

          <section className="rounded-2xl bg-panel p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Stock Adjustment</h2>
            <SimpleForm
              submitLabel="Kirim Adjustment"
              initialPayload={`{
  "warehouseId": "WAREHOUSE_UUID",
  "reason": "Stok opname bulanan",
  "lines": [
    {
      "itemId": "ITEM_UUID",
      "systemQty": 10,
      "physicalQty": 8,
      "note": "Selisih ditemukan saat opname"
    }
  ]
}`}
              onSubmit={async (payload) => {
                const data = await callApi<ApiResult>("/api/stock-adjustments", accessToken, {
                  method: "POST",
                  body: payload,
                });
                setResult(JSON.stringify(data, null, 2));
              }}
            />
          </section>

          <section className="rounded-2xl bg-panel p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Generate Label Finished Goods</h2>
            <SimpleForm
              submitLabel="Generate Label"
              initialPayload={`{
  "variantId": "VARIANT_UUID",
  "quantity": 3,
  "templateName": "default-finished-goods"
}`}
              onSubmit={async (payload) => {
                const data = await callApi<ApiResult>(
                  "/api/labels/finished-goods/generate",
                  accessToken,
                  {
                    method: "POST",
                    body: payload,
                  },
                );
                setResult(JSON.stringify(data, null, 2));
              }}
            />
          </section>

          <section className="rounded-2xl bg-panel p-6 shadow-sm md:col-span-2">
            <h2 className="text-lg font-semibold">Hasil Response</h2>
            <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-zinc-900 p-4 text-xs text-zinc-100">
              {result || "Belum ada request."}
            </pre>
          </section>
        </div>
      )}
    </ProtectedPage>
  );
}

function SimpleForm({
  initialPayload,
  onSubmit,
  submitLabel,
}: {
  initialPayload: string;
  submitLabel: string;
  onSubmit: (payload: unknown) => Promise<void>;
}) {
  const [payload, setPayload] = useState(initialPayload);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const parsed = JSON.parse(payload);
      await onSubmit(parsed);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-3">
      <textarea
        value={payload}
        onChange={(event) => setPayload(event.target.value)}
        className="h-48 w-full rounded-lg border border-zinc-300 p-3 font-mono text-xs"
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Memproses..." : submitLabel}
      </button>
    </form>
  );
}
