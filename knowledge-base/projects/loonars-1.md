# Loonars 1 — Villa Yogyakarta — Status: PARTIAL

> Label & aturan: `docs/standards/data-labels.md`. Repo publik → angka keuangan aktual tidak ditulis di sini; sumber angka = AI CFO MKH Property / sistem asal. Terakhir diperbarui: 2026-11-11.

- Operasi: aplikasi `villa` (front desk, housekeeping, kesiapan kamar, Cloudbeds, settlement OTA, pengajuan biaya, laporan investor, AI dynamic pricing). [HISTORICAL · villa docs]
- Laporan bulanan dikirim villa-api ke MKH Property (`laporan_villa_bulanan`: omzet kotor, komisi OTA, bersih, COGS, OPEX, laba, per channel, bagi hasil). KPI okupansi/ADR/RevPAR di `ir_metrik_bulanan`. [HISTORICAL · mkh-properti AUDIT-DAN-DESAIN.md §3]
- Aturan: perubahan harga/payout/autopush harga butuh persetujuan owner. [HISTORICAL · villa CLAUDE.md]

## NEEDS DATA
- NEEDS DATA: jumlah unit/kamar, kapasitas, tahun mulai operasi.
- NEEDS DATA: okupansi, ADR, RevPAR, mix channel 12 bulan terakhir (AI CFO / ekspor villa).
- NEEDS DATA: biaya variabel per malam terisi & biaya tetap bulanan.
- NEEDS DATA: masalah operasional utama menurut founder.
