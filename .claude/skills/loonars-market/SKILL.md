---
name: loonars-market
description: >-
  Market Intelligence Loonars: memetakan kompetitor langsung, tidak langsung,
  dan substitusi dari sumber publik (OTA listing, website, Google Maps, review,
  berita), dengan harga, positioning, keluhan tamu, peta posisi, gap, dan
  ancaman peniru — setiap fakta berlink. Pakai saat founder bilang "siapa
  kompetitor", "pasar villa di ...", "harga pesaing", "competitor analysis",
  atau dari business-feasibility / board.
argument-hint: "<slug analisis> <area / segmen>"
---

# loonars-market

Adapted from founder-skill `founder-competitors` (MIT @fd9385b).

## Instruksi
Sumber publik saja, setiap fakta berlink dan bertanggal. Baca seperti manusia,
tidak scraping, hormati ketentuan situs. Jangan mengarang kompetitor, harga,
rating, atau review. Bila sumber tidak bisa diakses, katakan.

## Input
`analyses/<slug>/idea.md`, area (mis. kecamatan di Yogyakarta), kelas harga,
`knowledge-base/market/competitor-analysis.md` (kompetitor yang sudah dikenal).

## Proses
1. Kategori: langsung (villa/akomodasi privat sejenis, area & kelas sama),
   tidak langsung (hotel, guesthouse, apartemen harian), substitusi.
   Target 5–10 + substitusi utama.
2. `analyses/<slug>/competitors.csv`:
   `name,type,url,area,price_comparable_idr,price_date,what_it_sells,positioning_line,rating,review_count,source_date`
   Harga untuk tanggal & tipe kamar yang sebanding; catat termasuk apa.
3. Review 3–5 teratas (bintang 1–3 dulu): tema keluhan + jumlah + 1–2 kutipan
   berlink; tema < 3 review = "tipis".
4. `analyses/<slug>/market.md`: tabel, rentang harga (min/median/max),
   peta posisi 2 sumbu, keluhan berperingkat, **gap** (atau "tidak ada gap"),
   ancaman peniru, permintaan musiman dari sumber publik, dan bagian
   "Reaksi kompetitor (SIMULATED)".
5. Usulkan pembaruan `knowledge-base/market/*` ke founder (jangan menimpa
   tanpa persetujuan).

## Output
`competitors.csv`, `market.md`.

## Batasan
Bila akses web diblokir lingkungan, hentikan dan tulis NEEDS DATA; jangan
mengisi dari ingatan model.
