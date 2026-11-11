---
id: D-2026-005
title: Advisor berdiri di ekosistem sendiri (opsi A) dengan kunci Gemini Pro khusus advisor, batas belanja Rp 200 ribu/bulan
date: 2026-11-11
status: CONFIRMED
confirmed_at: 2026-11-11
confirmed_by: founder (percakapan 2026-11-11)
review_on: 2027-02-11
lines: [Advisor, Holding]
analysis: board Standar 8 seat 2026-11-11 (Google Drive privat "Loonars AI Advisor – Privat")
supersedes: rencana "Register di Google Sheet" (tidak dijalankan)
---

# Advisor mandiri + Gemini Pro khusus advisor

## Business context
Founder keberatan advisor bergantung pada Claude Code & Google; sistem Loonars berdiri sendiri dengan WA, chat, dan AI di MK Connect.
## Founder proposal
"Kita pilih opsi A. … naikkan Gemininya agar bank data dan kekuatan berpikirnya jadi lebih bagus." → "saya akan langganan 1 AI baru dan membuat env variable baru dan itu dipakai hanya untuk analisa berat" → "Setuju Gemini Pro dengan batas belanja 200 ribu/bulan, saya akan lakukan, tapi API Gemini Pro ini saya ingin hanya digunakan di repo Istri, jadi ini memang khusus untuk kerjaan repo Istri mau berat atau ringan, sementara untuk pekerjaan yang berjalan saat ini biarkan saja dengan AI yang sudah ada."
## AI board analysis
Board Standar 8 seat: 8/8 APPROVE IF (rata-rata ≈ 6,1). Semua menolak menaikkan model global; syarat utama: model per fitur, thinkingLevel per fitur, bertahap (register → mentor → board), uji akses super admin, batas biaya diuji AI CFO, uji A/B buta, fallback, kill criteria.
## Identified risks
WA karyawan terganggu bila model global berubah (dihindari: kunci & model terpisah); biaya baru saat kas defisit; kebocoran data berangka; latensi/503 model kuat; dua sumber isi seat menyimpang.
## Alternatives considered
Model global dinaikkan (ditolak); tetap di Claude Code (ditolak founder); Google Sheet register (digantikan); DeepSeek (ditolak: data keuangan di luar ekosistem).
## Final decision
1. Advisor berdiri di ekosistem Loonars sendiri (opsi A), bertahap.
2. **Kunci Gemini Pro (Gemini 3.1 Pro) terpisah, khusus pekerjaan advisor/repo Istri — berat maupun ringan.**
3. **Fitur MK Connect yang sudah berjalan tetap memakai AI yang ada** (kunci & model sekarang, tidak diubah).
4. Batas belanja **Rp 200.000/bulan** di akun API; diuji AI CFO sebelum kunci diaktifkan.
5. Founder membuat akun API berbayar & kunci; Claude mengerjakan sisanya.
6. Syarat board (chair summary) berlaku.
7. **Lokasi (dipilih founder, 2026-11-11): Istri menjadi layanan advisor sendiri** — API + halaman /advisor + data sendiri; kunci Gemini Pro hanya ada di Istri. MK Connect hanya meneruskan pesan WA "advisor" ke Istri dan mengirim balasannya (pola villa memakai WA MK Connect). AI MK Connect tidak tersentuh.
8. **Data (dipilih founder, 2026-11-11): tumpang di database MKH Property** (`gluoioi…`), tabel/fungsi `advisor_*` tersendiri, diakses lewat rahasia advisor (tanpa service-role key), Rp 0 tambahan. Bukan project Supabase baru (±Rp 160 rb/bulan, ASSUMPTION).
## Expected outcome
≤ 11 Des 2026: tahap 1 live, ≥ 1 keputusan nyata tercatat via WA; biaya API ≤ Rp 200.000/bulan; nol regresi WA karyawan. Dicek 11 Feb 2027.
## Actual outcome
## Lessons learned
