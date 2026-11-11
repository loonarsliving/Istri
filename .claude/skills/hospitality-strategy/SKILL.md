---
name: hospitality-strategy
description: >-
  Strategi hospitality Loonars (Loonars 1 villa dan unit hospitality
  berikutnya): okupansi, ADR, RevPAR, musim, mix channel OTA vs direct, komisi,
  paket, operasional villa, dan profitabilitas per unit. Membaca data operasi
  dari villa (lewat AI CFO / ekspor) dan memproyeksikan perubahan dengan
  tools/finance/hospitality.py. Pakai saat founder bilang "naikkan okupansi",
  "harga villa", "OTA terlalu mahal", "direct booking", "musim sepi",
  "profitabilitas villa".
argument-hint: "<pertanyaan hospitality>"
---

# hospitality-strategy

## Instruksi
Okupansi tinggi dengan ADR rendah bisa lebih buruk daripada okupansi sedang
dengan ADR sehat. Selalu nilai lewat RevPAR dan GOP setelah komisi & biaya
variabel, bukan okupansi saja.

## Input
- Data operasi L1 per bulan (okupansi, ADR, RevPAR, mix channel, komisi OTA,
  opex): dari AI CFO (`/cfo/loonars-1`, `laporan_villa_bulanan`,
  `ir_metrik_bulanan`) via `docs/standards/consult-ai-cfo.md`, atau ekspor villa.
- `knowledge-base/hospitality/*`, `projects/loonars-1.md`.
- Aturan villa: apa pun yang menyentuh harga tamu, `villa_rates`, push ke
  Cloudbeds/OTA, payout investor, atau autopush AI pricing **butuh persetujuan
  owner** (villa `CLAUDE.md`). Skill ini hanya merekomendasikan.

## Proses
1. Diagnosis 12 bulan terakhir: okupansi vs ADR per bulan, RevPAR, kontribusi
   per malam terisi, porsi OTA & komisi efektif, pembatalan, review (keluhan
   berulang). Bila data tidak ada → NEEDS DATA per metrik.
2. Benchmark kompetitor dari `/loonars-market` (bukan ingatan model).
3. Tuas: harga per musim/hari, minimum stay, paket, direct booking (biaya
   akuisisi vs komisi yang dihemat), segmen baru (korporat, long stay),
   pendapatan tambahan, efisiensi biaya per malam.
4. Proyeksikan tiap tuas: salin bulan aktual ke
   `analyses/<slug>/inputs/hospitality.json`, ubah satu tuas per skenario
   (`scenarios` kustom), jalankan `tools/finance/hospitality.py`. Bandingkan
   GOP, bukan revenue.
5. Rencana uji: satu tuas, satu periode, metrik keberhasilan, ambang berhenti.

## Output
`analyses/<slug>/hospitality-strategy.md` (format 10 bagian) + `hospitality.md`.

## Batasan
Tidak mengubah harga, setting AI pricing, atau Cloudbeds. Rekomendasi harga
yang ingin diterapkan diserahkan ke founder untuk dijalankan lewat villa
dengan proses persetujuannya.
