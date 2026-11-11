# Phase 5 — Katalog data per sumber & model ancaman

Status 2026-11-11. Satu-satunya koneksi aktif: **AI CFO** (`/api/cfo/advisor`).
Sumber lain di bawah adalah desain; mengaktifkannya butuh persetujuan founder
per sumber (D-2026-004: dibahas dulu).

## 1. Katalog sumber

| Sumber | Pemilik (repo / sistem) | Dataset untuk advisor | Isi utama | Frekuensi segar | Cara akses advisor | Status |
| --- | --- | --- | --- | --- | --- | --- |
| **AI CFO MKH Property** | `mkh-properti` · Supabase `gluoioi…` | `fakta`, `tanya`, `evaluasi` | kas per lini, forecast 182 hari × 3 skenario, kewajiban & prioritas, L1 bulanan (omzet, komisi OTA, okupansi, ADR, RevPAR, bagi hasil), holding (laba, beban), L2 (unit, kontrak, cash-in, piutang, konstruksi, utang toko), peringatan, rekonsiliasi, tindakan CFO | setiap panggilan (snapshot MK Connect → MKH Property tiap 30 menit; laporan villa harian) | `POST /api/cfo/advisor`, header `x-advisor-secret`, hanya baca | **AKTIF** |
| Laporan keuangan (holding, L1, L2) | `mkh-properti` (`/cfo/holding`, `/cfo/loonars-1`, `/cfo/loonars-2`, PDF) | ringkasan via `fakta` | SAK EMKM holding, L1 bulanan, L2 | bulanan / berjalan | lewat AI CFO (bukan PDF) | aktif via AI CFO |
| FRIDAY Holding | `Mkhsistem` (MK Connect) | `BusinessSnapshot[]` | `metrics[]` ternormalisasi per bisnis (revenue, cash_balance, utilization, new_leads, conversions, marketing_spend, cost_per_lead, headcount_present, open_tasks_overdue) + narasi + health | harian 06:30 WITA | usulan: endpoint baca setara izin `friday.view` | desain |
| MK Connect operasional | `Mkhsistem` · Supabase `svcmyb…` (dipakai bersama villa) | CRM (lead, closing), iklan Meta, siteplan & penjualan unit, konstruksi, HR/absensi | lihat kolom kiri | real-time | lewat FRIDAY (tidak langsung ke tabel) | desain |
| Villa (operasi L1) | `villa` · villa-api (Supabase `svcmyb…`) | booking pace / on-the-books, status kamar, review | ke depan & operasional | real-time | usulan endpoint baca di villa-api; sebagian sudah mengalir ke AI CFO | desain |
| Cloudbeds | lewat `villa` | reservasi, kalender, kamar | real-time | **tidak langsung**: dibaca lewat villa | desain |
| OTA booking data | lewat `villa` (settlement OTA) & AI CFO | komisi, settlement, channel mix | harian | lewat AI CFO (`laporan_villa_bulanan`) | aktif sebagian via AI CFO |
| Supabase (langsung) | — | — | — | — | **tidak dipakai**: advisor tidak membaca tabel produksi langsung; selalu lewat endpoint pemilik data | sengaja tidak |

Aturan katalog: setiap angka yang dipakai advisor menyebut sumber + tanggal ambil
(`Records.citation()`); sumber yang gagal = `NEEDS DATA`, bukan 0.

## 2. Model ancaman

| # | Ancaman | Dampak | Kontrol yang ada | Sisa risiko / tindak lanjut |
| --- | --- | --- | --- | --- |
| T1 | Rahasia advisor bocor | Pihak lain membaca angka keuangan (bukan menulis) | Rahasia khusus advisor, terpisah dari sync MK Connect; hanya baca; audit `cfo_audit_log` aktor `advisor`; bisa dicabut tanpa efek ke sistem lain | Nilai pernah tampil di transkrip sesi 2026-11-11 → **rotasi dianjurkan** (Claude bisa melakukannya) |
| T2 | Advisor menulis ke produksi | Data/uang berubah | Interface adapter tanpa operasi tulis (diuji); RPC tulis menolak header advisor (diuji di produksi) | — |
| T3 | Data sensitif masuk repo publik | Angka keuangan / nama customer terekspos | `private/` di-ignore; secret scan di `test_repo.py`; analisis berangka hanya di `private/`; nama customer disamarkan di brief | Repo `Istri` masih publik (founder akan membuat private setelah selesai) |
| T4 | Hilangnya analisis privat (container sesi bersifat sementara) | Riwayat analisis hilang | Ringkasan tanpa angka di `analyses/` (Git); data mentah bisa ditarik ulang dari AI CFO kapan saja | Salinan analisis lengkap perlu tempat privat permanen |
| T5 | Angka basi dianggap terkini | Keputusan salah | `retrieved_at` & periode di setiap kutipan; L1 bulan berjalan berlabel "sementara" | — |
| T6 | Prompt injection dari data | Advisor mengikuti teks di data | Data dari sumber diperlakukan sebagai data; endpoint AI CFO tanpa narasi AI | — |
| T7 | Dua versi angka (advisor vs dashboard) | Kebingungan, keputusan salah | ADR-6: advisor tidak menghitung ulang angka aktual | — |
| T8 | Supabase `svcmyb…` dipakai bersama | Perubahan advisor mengganggu villa/MK Connect | Advisor tidak menambah apa pun di `svcmyb…` | — |

## 3. Pengelolaan credential

| Credential | Disimpan di | Siapa yang membuat | Rotasi |
| --- | --- | --- | --- |
| `advisor_shared_secret` | Vault MKH Property + `private/advisor.env` lokal sesi | Claude, dibangkitkan di database | Claude: buat nilai baru di Vault, perbarui `private/advisor.env`, uji 200/401 |
| Akses Supabase MCP, GitHub, Vercel | konektor milik founder | founder (sekali) | dikelola di pengaturan konektor |
| Lainnya | — | — | tidak ada credential di repo |
