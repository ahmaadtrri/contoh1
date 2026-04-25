export default function GudangPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <section className="mx-auto max-w-5xl rounded-2xl bg-panel p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Operasional Gudang</h1>
        <p className="mt-2 text-muted">
          Area ini dipakai Admin Gudang untuk inbound, outbound, stock adjustment, dan cetak label
          barcode finished goods.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>`POST /api/inbound`</li>
          <li>`POST /api/outbound`</li>
          <li>`POST /api/stock-adjustments`</li>
          <li>`POST /api/labels/finished-goods/generate`</li>
        </ul>
      </section>
    </main>
  );
}

