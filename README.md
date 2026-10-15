# Puasa 16:8 — Anak Kos

Website checklist intermittent fasting 16:8 yang mengikuti jadwal kuliah semester 2026/2027 Ganjil.
Dibuat dengan **Next.js 16 (App Router)**, **Supabase** (auth + database), dan siap deploy ke **Vercel**.

## Fitur

- Tab Senin–Minggu, otomatis membuka hari ini, dengan ringkasan `x/6` dan progress bar per hari
- Checklist 6 item per hari (pagi, makan pertama, camilan, makan terakhir, jendela tutup, air) dengan menu sesuai hari
- Status real-time "Sedang puasa" / "Jendela makan terbuka" + hitung mundur
- Tahap adaptasi otomatis: minggu 1 (12:12) → minggu 2 (14:10) → minggu 3 dst. (16:8), dihitung dari tanggal mulai program
- Mode Kamis fleksibel (10.00–18.00), menu dan jam ikut menyesuaikan
- Penghitung air +1 gelas sampai 8 (otomatis mencentang item "air")
- "Mulai minggu baru" dengan konfirmasi di halaman; persentase minggu tersimpan ke riwayat
- Notifikasi pengingat 15 menit sebelum makan pertama dan sebelum jendela tutup
- Dark mode, tampilan mobile-first
- Data tersimpan di Supabase per akun (RLS), jadi sinkron antar perangkat

## Setup lokal

1. **Buat project Supabase** di https://supabase.com.
2. Buka **SQL Editor**, tempel isi [`supabase/schema.sql`](supabase/schema.sql), lalu jalankan.
3. Salin env:
   ```bash
   cp .env.example .env.local
   ```
   Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari **Project Settings → API**.
4. Jalankan:
   ```bash
   npm install
   npm run dev
   ```
   Buka http://localhost:3000, lalu daftar akun.

> Kalau mau langsung masuk tanpa konfirmasi email, matikan **Authentication → Providers → Email → Confirm email** di Supabase.

## Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Di https://vercel.com/new, impor repo tersebut (framework otomatis terdeteksi sebagai Next.js).
3. Tambahkan Environment Variables `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (atau pakai integrasi **Supabase** di Vercel Marketplace, yang mengisi env ini otomatis).
4. Deploy.
5. Di Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `https://<domain-vercel-kamu>`
   - **Redirect URLs**: tambahkan `https://<domain-vercel-kamu>/auth/callback`

## Struktur

```
app/
  page.tsx              # halaman utama (server: ambil data dari Supabase)
  login/page.tsx        # masuk / daftar
  auth/callback/        # tujuan link konfirmasi email
  auth/signout/         # keluar
components/
  Tracker.tsx           # UI utama: tab hari, checklist, ringkasan, pengaturan
  StatusCard.tsx        # status puasa real-time + hitung mundur
  WaterCounter.tsx      # penghitung air
  HistoryCard.tsx       # riwayat mingguan
lib/
  data.ts               # jadwal kuliah, menu, aturan (sumber data)
  fasting.ts            # logika jendela makan, tahap adaptasi, status
  supabase/             # client browser, server, dan proxy sesi
proxy.ts                # refresh sesi + proteksi halaman (pengganti middleware di Next 16)
supabase/schema.sql     # tabel, RLS, dan fungsi RPC
```

## Model data

| Tabel | Isi |
|---|---|
| `settings` | tanggal mulai program, mode Kamis fleksibel, notifikasi |
| `weeks` | satu baris per minggu checklist; minggu aktif `ended_at is null`, minggu selesai menyimpan `percentage` |
| `checklist` | centangan, kunci `<kodeHari>-<idItem>` (mis. `sel-m1`) |
| `water` | jumlah gelas per hari |

RPC `active_week()` mengambil atau membuat minggu aktif. RPC `start_new_week()` menutup minggu aktif (menghitung persentase) dan membuka minggu baru dalam satu transaksi.

## Catatan

- Notifikasi hanya muncul selama tab/website terbuka di browser (tanpa server push).
- Semua jam memakai zona waktu perangkat.

⚠️ Hentikan puasa dan makan dulu jika perut perih, badan gemetar, atau pusing. Konsultasikan ke dokter jika memiliki kondisi seperti maag/asam lambung atau diabetes.
