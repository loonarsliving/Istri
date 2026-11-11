---
name: investor-strategy
description: >-
  Strategi investor & pendanaan Loonars: membandingkan internal capital,
  investor (equity, convertible note, bagi hasil), utang, dan penjualan
  leasehold/unit; menghitung NPV/IRR/payback/dilusi per opsi; menilai kesiapan
  investor (laporan, tata kelola, data) dan dampak ke investor existing. Pakai
  saat founder bilang "fundraising", "cari investor", "valuasi", "convertible
  note", "jual leasehold", "pakai modal sendiri atau investor", "siap IPO".
argument-hint: "<kebutuhan dana / opsi>"
---

# investor-strategy

## Instruksi
Pendanaan bukan tujuan; biaya modal termurah yang menjaga kendali dan kas
adalah tujuannya. Jangan merekomendasikan fundraising hanya karena terdengar
"lebih besar".

## Input
- Tujuan dana: untuk apa, berapa, kapan (founder). Tanpa ini → berhenti dan tanya.
- Posisi kas & kewajiban grup dari AI CFO (`docs/standards/consult-ai-cfo.md`),
  termasuk temuan `/cfo/kesiapan-investasi` dan `/cfo/kualitas-data` bila ada.
- `knowledge-base/company/investment-history.md`, `company-structure.md`.
- Komitmen ke investor existing (bagi hasil villa, unit LNR2 — dari knowledge
  base, tanpa nama investor di repo publik).

## Proses
1. Daftar opsi (min. 3, selalu termasuk "internal capital / bertahap" dan
   "tunda"). Untuk tiap opsi: arus kas ke/dari Loonars per periode, biaya
   (bunga, bagi hasil, dilusi, jaminan/top-up), syarat, kendali yang hilang.
2. Tulis `analyses/<slug>/inputs/investment.json` (discount rate =
   ASSUMPTION founder, ditanyakan) dan jalankan
   `python3 tools/finance/investment.py analyses/<slug>/inputs/investment.json --out analyses/<slug>/investment.md`
   dengan `stress` (arus kas ×0.8, tunda 1 periode).
3. Valuasi: hanya metode yang bisa diturunkan dari angka sendiri (DCF dari
   tool, NAV aset). Multiple pembanding hanya dengan sumber publik berlink;
   bila tidak ada, NEEDS DATA.
4. Kesiapan investor: checklist (laporan holding SAK EMKM, audit, pemisahan
   dana per lini, legal entity & izin usaha, cap table, data room, KPI
   bulanan konsisten dengan AI CFO). Status per item: ada / sebagian / belum / NEEDS DATA.
5. Dampak ke investor existing & kewajiban serah terima.

## Output
`analyses/<slug>/investor-strategy.md` (format 10 bagian) + `investment.md`.

## Batasan
Bukan nasihat investasi atau hukum. Struktur instrumen, pajak, dan perizinan
penawaran dana ke publik dicek notaris/konsultan hukum & akuntan. Tidak
menghubungi investor.
