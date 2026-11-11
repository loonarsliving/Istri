---
name: strategic-planning
description: >-
  Perencanaan strategis Loonars: tujuan 1/3/5 tahun, pilihan portofolio (L1,
  L2, Loonars Coffee, lini baru), prioritas, OKR/KPI per kuartal, dan roadmap
  sistem (system-driven, investor-ready, tata kelola profesional). Menguji
  rencana dengan kas AI CFO dan riwayat keputusan. Pakai saat founder bilang
  "rencana tahun depan", "strategi 5 tahun", "prioritas", "OKR", "roadmap
  bisnis", "fokus ke mana".
argument-hint: "<horizon: 1y | 3y | 5y> [fokus]"
---

# strategic-planning

## Instruksi
Strategi = memilih apa yang TIDAK dikerjakan. Rencana yang memuat semua hal
bukan rencana.

## Input
- `knowledge-base/company/strategic-goals.md` (bila NEEDS DATA, mulai dengan
  wawancara singkat: maksimal 5 pertanyaan ke founder).
- Kinerja tiap lini: AI CFO (laporan L1/L2/holding) dan FRIDAY Holding
  (snapshot per bisnis) bila tersedia.
- `decisions/` (apa yang sudah diputuskan, apa yang gagal).

## Proses
1. Posisi sekarang per lini: peran (mesin kas / pertumbuhan / taruhan),
   kinerja berlabel, masalah utama.
2. Tujuan: 1 tujuan utama + maks 3 pendukung per horizon, terukur.
3. Pilihan strategis: 2–3 opsi portofolio (mis. perdalam L1 sebelum lokasi
   baru; percepat penjualan L2; asset-light management). Untuk tiap opsi:
   kebutuhan modal (cek AI CFO), risiko, kapabilitas yang dibutuhkan.
4. Rekomendasi + yang dihentikan/ditunda.
5. OKR per kuartal & KPI (sumber datanya: sistem mana).
6. Roadmap sistem & tata kelola: laporan, SOP, peran, rapat review bulanan
   memakai `/founder-decision-review review`.

## Output
`analyses/<slug>/strategic-plan.md` (format 10 bagian) dan usulan pembaruan
`knowledge-base/company/strategic-goals.md` (hanya setelah founder setuju).

## Batasan
Tujuan & prioritas ditetapkan founder. Skill hanya mengusulkan.
