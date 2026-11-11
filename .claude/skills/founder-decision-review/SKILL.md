---
name: founder-decision-review
description: >-
  Decision history Loonars. Tiga mode: `record` mendokumentasikan keputusan
  besar dengan 11 field (hanya menjadi CONFIRMED setelah founder menyatakan
  eksplisit), `review` membandingkan expected vs actual outcome keputusan lama
  dan menulis lessons learned, `patterns` mencari kesalahan berulang. Juga
  mengkritisi keputusan founder sebelum diambil. Pakai saat founder bilang
  "catat keputusan ini", "saya putuskan ...", "review keputusan", "keputusan
  lama saya bagaimana hasilnya", "saya sering salah di mana".
argument-hint: "record | review [<id>] | patterns | critique <keputusan>"
---

# founder-decision-review

Mode: `$ARGUMENTS`

## Instruksi
Tidak setiap percakapan adalah keputusan. Keputusan dicatat hanya bila founder
memintanya atau menyatakan keputusan secara eksplisit, dan status `CONFIRMED`
hanya diberikan setelah founder mengonfirmasi teks final di percakapan itu.

## Input
`decisions/index.md`, `decisions/_template.md`, file keputusan terkait,
`analyses/<slug>/` yang menjadi dasar, data outcome (AI CFO/villa/MK Connect).

## Proses
**record**
1. Salin `_template.md` → `decisions/D-<YYYY>-<NNN>-<slug>.md` (NNN = nomor
   berikutnya di index).
2. Isi 11 field dari analisis & percakapan. "AI board analysis" = ringkasan +
   link ke `analyses/<slug>/board.md`. Expected outcome harus terukur (KPI,
   nilai, tanggal cek).
3. Status `PROPOSED`. Tampilkan ke founder, minta konfirmasi kata per kata.
4. Setelah founder bilang setuju: status `CONFIRMED`, isi `confirmed_at` dan
   `confirmed_by: founder (percakapan <tanggal>)`, perbarui index.
**review**
1. Untuk keputusan CONFIRMED yang tanggal cek-nya lewat: ambil actual outcome
   (berlabel, dari sumber), bandingkan dengan expected.
2. Nilai kualitas keputusan secara terpisah dari hasil: informasi yang ada
   saat itu, alternatif yang dipertimbangkan, risiko yang terlewat.
   Keputusan bagus bisa berhasil buruk karena nasib, dan sebaliknya.
3. Isi actual outcome & lessons learned → status `REVIEWED` (setelah founder setuju).
**patterns**
Baca semua keputusan REVIEWED: pola berulang (mis. ramp terlalu optimis,
biaya konstruksi melebihi budget, keputusan tanpa konsultasi CFO). Laporkan
dengan bukti per keputusan.
**critique**
Sebelum founder memutuskan: cari keputusan serupa, sebut risiko yang dulu
terlewat, dan 3 pertanyaan yang harus dijawab dulu.

## Output
File di `decisions/` + `decisions/index.md` diperbarui.

## Batasan
- Tidak pernah mengubah status ke CONFIRMED/REVIEWED tanpa konfirmasi founder.
- Repo publik: jangan tulis nama pribadi pihak ketiga, rekening, atau angka
  keuangan sensitif; rujuk `private/`.
- Keputusan lama tidak dihapus; yang diganti → `SUPERSEDED` dengan link.
