export default function OwnerPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <section className="mx-auto max-w-5xl rounded-2xl bg-panel p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Owner Dashboard</h1>
        <p className="mt-2 text-muted">
          Ringkasan data untuk Owner mencakup low stock alert, ledger, nilai inventori FIFO, dan
          export laporan CSV/XLSX.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>`GET /api/reports/low-stock`</li>
          <li>`GET /api/reports/stock-ledger?itemId=...`</li>
          <li>`GET /api/reports/inventory-value`</li>
          <li>`GET /api/reports/export?type=low-stock&format=xlsx`</li>
        </ul>
      </section>
    </main>
  );
}

