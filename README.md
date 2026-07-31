# Catatanku

Aplikasi web (PWA installable) untuk mencatat keuangan, utang/piutang, dan
pengingat aktivitas sehari-hari. Dibangun untuk pemakaian pribadi (satu akun),
supaya mudah dipakai dan mengingatkan hal-hal yang sering terlupa.

## Fitur

- **Rekening & saldo** — catat beberapa rekening (tunai, bank, e-wallet) dan
  lihat saldo tiap rekening otomatis terhitung dari transaksi.
- **Transaksi** — pemasukan, pengeluaran, dan transfer antar rekening, dengan
  kategori bebas.
- **Utang & piutang** — catat siapa yang berutang ke siapa, cicilan/pelunasan,
  dan jatuh temponya otomatis dibuatkan pengingat.
- **Pengingat** — pengingat umum (aktivitas harian, tagihan, dll) dengan opsi
  berulang (harian/mingguan/bulanan/tahunan), snooze, dan notifikasi browser
  saat jatuh tempo ketika app dibuka (PWA push berbasis `Notification` API).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth) — tabel diberi prefix `istri_` dan diisolasi
  lewat Row Level Security (`owner_id = auth.uid()`) karena project Supabase
  ini dipakai bersama sistem lain.
- PWA: `public/manifest.json` + `public/sw.js` (installable ke home screen,
  offline shell sederhana).

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buat file `.env.local` (lihat `.env.example`) berisi:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Skema database ada di `supabase/migrations/0001_istri_app.sql`.

## Integrasi WhatsApp (Whacenter) — belum aktif

Kolom `notify_whatsapp` sudah disiapkan di tabel `istri_reminders` untuk
integrasi selanjutnya dengan [Whacenter](https://whacenter.com/). Setelah ada
device/API key Whacenter:

1. Simpan `WHACENTER_DEVICE_ID` & endpoint API sebagai env var server-side.
2. Buat cron job (mis. Supabase Edge Function + `pg_cron`, atau route API +
   scheduler eksternal) yang query `istri_reminders` dengan `due_at <= now()`
   dan `notify_whatsapp = true`, lalu POST ke API Whacenter untuk kirim pesan
   ke nomor WhatsApp istri.
3. Tandai reminder terkirim supaya tidak dobel kirim.

Untuk saat ini, pengingat tetap muncul sebagai notifikasi browser (in-app)
selama PWA di-install dan izin notifikasi diberikan.
