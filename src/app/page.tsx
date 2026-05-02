import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f2f6f4_0%,_#f7f8fa_45%,_#f7f8fa_100%)] px-5 py-8 md:px-8 md:py-10">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-panel shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Sistem Informasi Inventori Garmen
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Dashboard Operasional Inventori
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted md:text-base">
                Pantau alur bahan baku dan produk jadi dalam satu pusat kendali. Integrasi Supabase Auth,
                role-based access, dan API transaksi sudah siap untuk operasional harian.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white"
                >
                  Login Sistem
                </Link>
                <Link
                  href="/owner"
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700"
                >
                  Lihat Ringkasan Owner
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
              <p className="text-sm font-medium text-zinc-500">Status Implementasi</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                <li className="flex items-center justify-between">
                  <span>Supabase Auth + RLS</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Aktif
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>API Inbound/Outbound</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Aktif
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Laporan & Export</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Aktif
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Deployment Vercel</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    Monitoring
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Modul Aktif", value: "11", note: "Endpoint API inti" },
            { label: "Role Pengguna", value: "3", note: "Admin, Produksi, Owner" },
            { label: "Metode Valuasi", value: "FIFO", note: "Inventory valuation" },
            { label: "Kebijakan Stok", value: "Soft Warning", note: "Tetap proses saat kurang" },
          ].map((card) => (
            <article key={card.label} className="rounded-2xl border border-zinc-100 bg-panel p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-zinc-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{card.value}</p>
              <p className="mt-1 text-xs text-muted">{card.note}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border border-zinc-100 bg-panel p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Area Operasional</h2>
            <div className="mt-4 grid gap-3">
              <ActionCard
                href="/gudang"
                title="Operasional Gudang"
                description="Kelola inbound, outbound, stok opname, dan generate label barang jadi."
              />
              <ActionCard
                href="/produksi"
                title="Produksi"
                description="Ajukan kebutuhan bahan, approval 2 langkah, lalu issue transaksi produksi."
              />
              <ActionCard
                href="/owner"
                title="Owner Dashboard"
                description="Pantau low-stock, nilai inventori FIFO, dan audit pergerakan stok."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-primary-soft p-6">
            <h2 className="text-lg font-semibold text-emerald-950">Checklist Operasional</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-emerald-900">
              <li>
                Login via{" "}
                <Link href="/login" className="font-medium underline">
                  halaman login
                </Link>{" "}
                menggunakan akun Supabase Auth.
              </li>
              <li>Pastikan setiap user sudah memiliki role pada tabel `profiles`.</li>
              <li>Verifikasi env di Vercel konsisten dengan env lokal.</li>
              <li>Jalankan transaksi uji inbound/outbound sebelum operasional penuh.</li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition hover:border-emerald-300 hover:bg-white"
    >
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <p className="mt-3 text-xs font-medium text-primary group-hover:underline">Buka modul</p>
    </Link>
  );
}
