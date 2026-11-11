---
id: D-2026-007
title: Semua fitur advisor lewat layanan advisor (WA), bukan sesi Claude; pertanyaan bebas owner otomatis ke advisor
date: 2026-11-11
status: CONFIRMED
confirmed_at: 2026-11-11
confirmed_by: founder (percakapan 2026-11-11)
review_on: 2026-12-11
lines: [Advisor]
analysis: docs/advisor-service/01-desain-tahap-1.md (diperbarui)
supersedes: urutan tahap "14 hari per tahap" dari syarat board D-2026-005 (dipercepat atas keputusan founder)
---

# Semua fitur lewat layanan advisor

## Business context
Uji WA pertama: pesan tanpa awalan "advisor" dijawab asisten owner lama (Flash-Lite), dan jawabannya keliru membaca tanggal defisit. Fitur board, pencatatan keputusan, riset pasar, dan panel konsumen masih hanya jalan di sesi Claude.
## Founder proposal
"Tolong semua fitur seragamkan lewat jalan yang kita buat, jangan lewat Claude lagi." Rute WA dipilih: pertanyaan bebas ke advisor; perintah operasional lama tetap di asisten lama.
## AI board analysis
Tidak disidangkan ulang (melanjutkan D-2026-005). Catatan advisor: mempercepat semua tahap melewati syarat board "tahap 1 berjalan 14 hari" — risiko: biaya API naik lebih cepat, lebih banyak bagian baru sekaligus. Mitigasi: setiap bagian dideploy terpisah dengan tes, batas belanja Gemini tetap berlaku, kill switch tetap ada.
## Identified risks
Salah rute (pertanyaan data cepat masuk advisor atau sebaliknya); biaya board via WA (beberapa panggilan model per sidang); jawaban panjang di WA.
## Alternatives considered
Tetap awalan "advisor" (tidak dipilih); semua pesan ke advisor termasuk perintah operasional (tidak dipilih: berisiko merusak fitur berjalan).
## Final decision
1. Pertanyaan/diskusi bebas owner → advisor (Gemini Pro). Perintah operasional lama tetap di asisten lama.
2. Fitur advisor dipindah ke layanan advisor bertahap: pencatatan & konfirmasi keputusan via WA, board via WA, riset pasar bersumber, pengingat syarat/kill criteria, pembaruan pengetahuan tanpa deploy ulang.
3. Sesi Claude hanya untuk membangun/merawat sistem, bukan untuk memakai advisor.
## Expected outcome
Founder memakai advisor sepenuhnya lewat WA; biaya ≤ batas D-2026-005; nol regresi perintah operasional lama. Tinjau 11 Des 2026.
## Actual outcome
## Lessons learned
