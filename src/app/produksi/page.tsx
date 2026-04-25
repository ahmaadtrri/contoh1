export default function ProduksiPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <section className="mx-auto max-w-5xl rounded-2xl bg-panel p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Produksi</h1>
        <p className="mt-2 text-muted">
          Area tim produksi untuk membuat permintaan bahan baku dan menunggu approval dari Admin/Owner.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>`POST /api/production-requests`</li>
          <li>`POST /api/production-requests/:id/approve`</li>
          <li>`POST /api/production-requests/:id/issue`</li>
        </ul>
      </section>
    </main>
  );
}

