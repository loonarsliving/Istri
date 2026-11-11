# Integrasi villa (Loonars 1) — desain

Status: **belum** ada koneksi. Repo pemilik: `loonarsliving/villa` (production `main`).
Villa = "bagaimana bisnis berjalan": booking, okupansi, channel, operasional,
biaya, laporan investor.

## Prinsip
- Advisor **tidak membaca tabel villa langsung**. Angka villa sudah mengalir ke
  MKH Property (`laporan_villa_bulanan`, `ir_metrik_bulanan`, settlement OTA,
  kas masuk/keluar villa). Advisor membacanya lewat AI CFO atau FRIDAY agar
  hanya ada satu versi angka.
- Advisor tidak pernah menulis ke villa, Cloudbeds, atau OTA, dan tidak
  menyentuh harga (`villa_rates`, AI pricing, autopush) — semua itu butuh
  persetujuan owner menurut `villa/CLAUDE.md`.

## Data yang dibutuhkan advisor
| Data | Sumber terbaik | Tahap A (manual) |
| --- | --- | --- |
| Okupansi, ADR, RevPAR bulanan | AI CFO (`ir_metrik_bulanan`) | Tanya AI CFO / ekspor laporan |
| Omzet kotor, komisi OTA, opex, laba, per channel | AI CFO (`laporan_villa_bulanan`) | idem |
| Booking pace / on-the-books ke depan | villa (Cloudbeds) | Ekspor dari villa admin |
| Review & keluhan tamu | OTA publik | `/loonars-market` |
| Status kamar, maintenance | villa manager | Ringkasan dari founder |
| Rekomendasi AI pricing | villa revenue engine | Screenshot/ekspor, label PROJECTION |

## Usulan tahap B
Ringkasan villa disajikan lewat `ringkasan` di endpoint AI CFO advisor
(`01-ai-cfo.md`) atau lewat FRIDAY Holding bila villa terdaftar sebagai
bisnis `http` di `holding_businesses`. Data booking pace yang belum ada di
MKH Property: usulan endpoint baca di villa-api, dibahas setelah Phase 4.
