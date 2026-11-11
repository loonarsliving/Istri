---
id: D-2026-003
title: AI CFO MKH Property menjadi sumber angka advisor; advisor terhubung erat (read-only) dengan villa & Mkhsistem; repo tetap bernama Istri
date: 2026-11-11
status: CONFIRMED
confirmed_at: 2026-11-11
confirmed_by: founder (percakapan 2026-11-11)
review_on: setelah Phase 4
lines: [Advisor]
analysis: docs/phase-1/02-architecture.md (ADR-3, ADR-6, ADR-7)
supersedes:
---

# AI CFO sebagai sumber angka advisor

## Business context
AI CFO sudah ada di ekosistem (mkh-properti, dipanggil dari MK Connect). Advisor membutuhkan angka keuangan aktual.
## Founder proposal
"Lanjutkan semua repo ini biar tetap nama Istri … di MKH Sistem sudah ada AI CFO, jadi libatkan dia … repo ini nantinya terkoneksi erat dengan repo villa dan repo mkhsistem."
## AI board analysis
Tidak disidangkan (keputusan arsitektur). Analisis trade-off di ADR-6/ADR-7.
## Identified risks
Ketergantungan pada ketersediaan AI CFO; akses tahap A manual; repo publik membatasi penyimpanan angka.
## Alternatives considered
Advisor menghitung ulang angka sendiri (ditolak: dua sumber angka).
## Final decision
Seperti proposal founder; integrasi read-only, bertahap.
## Expected outcome
Setiap angka aktual di output advisor dikutip dari AI CFO dengan tanggal; nol angka aktual hasil hitung advisor. Dicek saat Phase 4.
## Actual outcome
## Lessons learned
