"use client";

import { useState, type FormEvent } from "react";
import { ProtectedPage } from "@/components/protected-page";
import { callApi } from "@/lib/client-api";

type ApiResult = { success: boolean; [key: string]: unknown };

export default function ProduksiPage() {
  const [requestId, setRequestId] = useState("");
  const [result, setResult] = useState<string>("");

  return (
    <ProtectedPage
      title="Produksi"
      subtitle="Buat permintaan bahan baku, approve, lalu issue ke outbound produksi."
    >
      {({ accessToken }) => (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl bg-panel p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Buat Production Request</h2>
            <SimpleForm
              submitLabel="Buat Request"
              initialPayload={`{
  "warehouseId": "WAREHOUSE_UUID",
  "notes": "Permintaan bahan untuk produksi batch April",
  "lines": [
    {
      "itemId": "ITEM_UUID",
      "quantity": 12
    }
  ]
}`}
              onSubmit={async (payload) => {
                const data = await callApi<ApiResult>("/api/production-requests", accessToken, {
                  method: "POST",
                  body: payload,
                });
                setRequestId(String(data.requestId ?? ""));
                setResult(JSON.stringify(data, null, 2));
              }}
            />
          </section>

          <section className="rounded-2xl bg-panel p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Approve / Issue</h2>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Request ID</span>
              <input
                value={requestId}
                onChange={(event) => setRequestId(event.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="uuid production request"
              />
            </label>
            <div className="mt-3 flex gap-2">
              <button
                onClick={async () => {
                  const data = await callApi<ApiResult>(
                    `/api/production-requests/${requestId}/approve`,
                    accessToken,
                    { method: "POST" },
                  );
                  setResult(JSON.stringify(data, null, 2));
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm"
              >
                Approve
              </button>
              <button
                onClick={async () => {
                  const data = await callApi<ApiResult>(
                    `/api/production-requests/${requestId}/issue`,
                    accessToken,
                    { method: "POST" },
                  );
                  setResult(JSON.stringify(data, null, 2));
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
              >
                Issue
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">
              Catatan: endpoint approve/issue hanya bisa role admin/owner.
            </p>
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
        className="h-52 w-full rounded-lg border border-zinc-300 p-3 font-mono text-xs"
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
