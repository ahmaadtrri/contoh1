"use client";

import { useState } from "react";
import { ProtectedPage } from "@/components/protected-page";
import { callApi } from "@/lib/client-api";

type ApiResult = { [key: string]: unknown };

export default function OwnerPage() {
  const [itemId, setItemId] = useState("");
  const [result, setResult] = useState<string>("");

  return (
    <ProtectedPage
      title="Owner Dashboard"
      subtitle="Laporan low stock, inventory value FIFO, stock ledger, dan export CSV/XLSX."
    >
      {({ accessToken }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl bg-panel p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Fetch Laporan</h2>
            <div className="mt-3 grid gap-2">
              <button
                onClick={async () => {
                  const data = await callApi<ApiResult>("/api/reports/low-stock", accessToken);
                  setResult(JSON.stringify(data, null, 2));
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-left text-sm"
              >
                GET Low Stock
              </button>
              <button
                onClick={async () => {
                  const data = await callApi<ApiResult>("/api/reports/inventory-value", accessToken);
                  setResult(JSON.stringify(data, null, 2));
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-left text-sm"
              >
                GET Inventory Value
              </button>
              <input
                value={itemId}
                onChange={(event) => setItemId(event.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder="itemId untuk stock ledger"
              />
              <button
                onClick={async () => {
                  const path = `/api/reports/stock-ledger?itemId=${encodeURIComponent(itemId)}`;
                  const data = await callApi<ApiResult>(path, accessToken);
                  setResult(JSON.stringify(data, null, 2));
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-left text-sm"
              >
                GET Stock Ledger
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-panel p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Export Laporan</h2>
            <div className="mt-3 grid gap-2">
              <ExportButton accessToken={accessToken} type="low-stock" format="csv" />
              <ExportButton accessToken={accessToken} type="low-stock" format="xlsx" />
              <ExportButton accessToken={accessToken} type="inventory-value" format="csv" />
              <ExportButton accessToken={accessToken} type="inventory-value" format="xlsx" />
            </div>
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

function ExportButton({
  accessToken,
  type,
  format,
}: {
  accessToken: string;
  type: "low-stock" | "inventory-value";
  format: "csv" | "xlsx";
}) {
  return (
    <button
      onClick={async () => {
        const response = await fetch(`/api/reports/export?type=${type}&format=${format}`, {
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        });
        if (!response.ok) {
          const json = await response.json();
          throw new Error(json?.error ?? "Export gagal");
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${type}.${format}`;
        anchor.click();
        URL.revokeObjectURL(url);
      }}
      className="rounded-lg border border-zinc-300 px-4 py-2 text-left text-sm"
    >
      Export {type} ({format})
    </button>
  );
}

