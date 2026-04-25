import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dcfce7_0,_#f6f7f9_55%)] px-6 py-10">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-2xl bg-panel p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Sistem Informasi Inventori Garmen
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Siap deploy ke Vercel melalui repository GitHub
          </h1>
          <p className="mt-4 max-w-3xl text-muted">
            Fondasi aplikasi sudah mencakup API contract utama inventori, struktur database Supabase
            dengan RLS, dan pipeline CI untuk validasi sebelum auto-deploy di Vercel.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link
            className="rounded-2xl bg-panel p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            href="/gudang"
          >
            <h2 className="text-xl font-semibold">Operasional Gudang</h2>
            <p className="mt-2 text-sm text-muted">Inbound, outbound, stok opname, dan label barcode.</p>
          </Link>
          <Link
            className="rounded-2xl bg-panel p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            href="/produksi"
          >
            <h2 className="text-xl font-semibold">Produksi</h2>
            <p className="mt-2 text-sm text-muted">Permintaan bahan baku dengan alur approval 2 langkah.</p>
          </Link>
          <Link
            className="rounded-2xl bg-panel p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            href="/owner"
          >
            <h2 className="text-xl font-semibold">Owner Dashboard</h2>
            <p className="mt-2 text-sm text-muted">Monitoring nilai persediaan, low-stock, dan audit.</p>
          </Link>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-primary-soft p-6">
          <h3 className="text-lg font-semibold">Langkah Berikutnya</h3>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-emerald-900">
            <li>Set variabel environment Supabase di Vercel Project Settings.</li>
            <li>Jalankan migration SQL pada Supabase.</li>
            <li>Hubungkan repository GitHub ke Vercel dan aktifkan auto-deploy.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
