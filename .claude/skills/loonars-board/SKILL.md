---
name: loonars-board
description: >-
  AI Board of Directors Loonars: empat belas seat (Chairman, CEO Advisor, CFO
  Advisor, Investment Advisor, Market Intelligence, Consumer Panel, Marketing
  Director, Operations Director, Tata Kelola & Komisaris Independen, Hukum/Pajak
  & Kepatuhan, SDM & Organisasi, Pasar Modal & IPO — D-2026-008; Manager
  Hospitality AI — D-2026-009; Direksi Capital Office — D-2026-010), masing-masing sub-agent dengan lens sendiri,
  memberi skor, risiko yang bisa membunuh rencana, dan vote APPROVE / APPROVE
  IF / REJECT, lalu chair summary 10 bagian. CFO Advisor memakai AI CFO MKH
  Property. Pakai saat founder bilang "bawa ke board", "uji keputusan ini",
  "apa kata board", "pressure-test", atau untuk keputusan besar.
argument-hint: "<keputusan/ide> [--ringkas | --standar | --penuh] [--seats chairman,cfo,...]"
---

# loonars-board

Adapted from founder-skill `founder-board` (MIT, @fd9385b): pola brief
mandiri → sub-agent paralel → memo → chair summary dipertahankan. Lens
upstream (Offers, Monopoly, Product) dipakai sebagai rujukan di seat Marketing,
Chairman, dan Operations — **ringkasan framework publik, tidak pernah
berbicara sebagai tokohnya**.

Argumen: `$ARGUMENTS`

## Instruksi
Board ada untuk menemukan alasan rencana ini GAGAL sebelum uang keluar. Board
yang semua setuju tidak bekerja. Pertahankan ketidaksepakatan.

## Input
- Topik/keputusan dari founder.
- `knowledge-base/` relevan, `decisions/` terkait, analisis sebelumnya.
- Konsultasi AI CFO (`docs/standards/consult-ai-cfo.md`) **sebelum** board
  bersidang bila menyangkut uang. Tanpa itu, CFO seat menulis NEEDS DATA.
- Hasil panel/kompetitor bila sudah ada (`/loonars-consumer`, `/loonars-market`).

## Proses
1. Buat folder `analyses/<YYYY-MM-DD>-<slug>/board/`.
2. Tulis `brief.md` yang **berdiri sendiri** (sub-agent tidak melihat
   percakapan): konteks Loonars yang relevan, proposal founder apa adanya,
   angka berlabel + sumber, apa yang belum diketahui, pertanyaan yang harus
   dijawab board. Jangan masukkan opini Anda. Jangan masukkan data pribadi.
3. Pilih tingkat dan seat sesuai `docs/standards/decision-review-policy.md`.
   **Semua keputusan founder dibahas board**, termasuk yang kecil dan yang
   bukan soal uang (SDM, operasional, tamu, brand, hukum, sistem).
   `--ringkas` = 3 seat dari tabel bidang di kebijakan; default/`--standar` =
   14 seat; `--penuh` = 14 seat + `/business-feasibility` + AI CFO;
   `--seats` = daftar eksplisit. Bila kriteria eskalasi terpenuhi, naikkan
   tingkat dan katakan alasannya; jangan pernah menurunkan tingkat yang dipicu.
   (`--quick` = alias `--ringkas`.) Seat **Consumer Panel** tidak
   beropini sendiri: ia membaca `panel/results.md` jika ada, kalau tidak
   menyatakan "panel belum dijalankan" dan menyarankan `/loonars-consumer --quick`.
4. Dalam SATU pesan, jalankan satu sub-agent per seat (Agent tool,
   `subagent_type: general-purpose`), masing-masing diberi:
   `Baca <path brief.md> dan <path seats/<seat>.md>. Terapkan HANYA lens seat
   itu. Tulis memo ke <folder>/board/<seat>.md dengan format di seats/_memo.md.`
   Path seat: `.claude/skills/loonars-board/seats/`.
5. Baca semua memo, tulis `<folder>/board.md` (chair summary) memakai
   `docs/standards/output-format.md`, dengan tambahan di bagian 6:
   - tabel vote per seat + skor rata-rata;
   - risiko yang diangkat ≥2 seat (paling atas);
   - semua syarat APPROVE IF digabung menjadi checklist;
   - **posisi AI CFO dikutip apa adanya**; bila board berbeda, tulis kenapa;
   - versi terkuat dari rencana ini menurut board (boleh beda dari proposal).
6. Laporkan ke founder: vote dalam satu baris, 3 risiko utama, rekomendasi,
   dan tawarkan `/founder-decision-review record` setelah founder memutuskan.

## Output
`analyses/<slug>/board/brief.md`, `board/<seat>.md` per seat, `board.md`.

## Batasan
- REJECT adalah hasil yang sah; jangan diperhalus.
- Angka hanya dari AI CFO, tool, atau input berlabel. Seat tidak boleh
  mengarang market size, harga kompetitor, atau biaya.
- Board tidak memutuskan. Founder memutuskan.
- Biaya: Ringkas ± 3 sub-agent, Standar 14; sebutkan tingkat & alasannya
  sebelum sidang. Tingkat Ringkas tetap memakai format chair summary, cukup
  lebih pendek per bagian.
