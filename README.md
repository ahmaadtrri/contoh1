# Sistem Informasi Inventori Garmen

Web app inventori bahan baku dan produk jadi berbasis `Next.js + Supabase`, siap deploy via GitHub ke Vercel.

## Fitur yang Sudah Tersedia

- API contract inti:
- `POST /api/inbound`
- `POST /api/outbound`
- `POST /api/stock-adjustments`
- `POST /api/production-requests`
- `POST /api/production-requests/:id/approve`
- `POST /api/production-requests/:id/issue`
- `GET /api/reports/stock-ledger`
- `GET /api/reports/inventory-value`
- `GET /api/reports/low-stock`
- `GET /api/reports/export?format=csv|xlsx`
- `POST /api/labels/finished-goods/generate`
- Helper FIFO, soft warning stok kurang, generator SKU.
- Migration SQL Supabase + RLS role (`admin`, `produksi`, `owner`).
- CI GitHub Actions: lint, typecheck, test, build.

## Prasyarat

- Node.js `>=20.9.0`
- NPM `>=10`
- Project Supabase
- Akun GitHub
- Akun Vercel

## Setup Lokal

1. Install dependency:
```bash
npm install
```

2. Buat file env:
```bash
cp .env.example .env.local
```

3. Isi `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=http://localhost:3000
```

4. Jalankan migration SQL `supabase/migrations/0001_inventory_core.sql` di SQL Editor Supabase.

5. Jalankan app:
```bash
npm run dev
```

## Publish ke GitHub

```bash
git init
git add .
git commit -m "feat: inventory garmen baseline ready for vercel"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

## Deploy ke Vercel (via GitHub Repository)

1. Masuk ke Vercel -> `Add New...` -> `Project`.
2. Import repository GitHub ini.
3. Set Environment Variables (Production + Preview):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL` (isi URL domain Vercel kamu setelah domain aktif).
4. Klik Deploy.
5. Aktifkan auto-deploy pada branch `main` (default Vercel).

## Catatan Keamanan

- Jangan commit `.env.local`.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai server-side route handlers.
- Untuk upload foto barang di Supabase Storage, pastikan bucket policy mengikuti role matrix.

## Quality Gate

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

