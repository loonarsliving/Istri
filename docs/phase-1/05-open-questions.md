# Phase 1 — Pertanyaan untuk Founder

Jawaban di bawah dibutuhkan sebelum / selama Phase 2. Jangan diisi oleh AI.

## Prioritas tinggi (penentu arsitektur)

1. **ADR-1..5** di `02-architecture.md`: setuju dengan rekomendasi (skill-first,
   vendor upstream, pakai repo ini + rename, `knowledge-base/` + `analyses/`,
   repo private)?
2. **Visibilitas repo**: apakah repo ini private? (Wajib private sebelum data
   keuangan masuk.)
3. **Nama repo**: rename `Istri` → `loonars-ai-advisor`? (Catatanku tetap aman
   di branch `claude/reminder-finance-app-yveciz`; sebaiknya pindahkan ke repo
   sendiri agar tidak tercampur.)
4. **Lisensi kode Loonars**: proprietary (rekomendasi) atau lainnya?
5. **Mata uang & bahasa**: IDR sebagai default? Output dalam Bahasa Indonesia,
   Inggris, atau campuran?

## Data untuk knowledge base (semua akan `NEEDS DATA` sampai diisi)

6. Profil perusahaan: badan hukum, lokasi, tahun berdiri, struktur kepemilikan.
7. Loonars 1, 2, 3: lokasi, jumlah unit, status (operasional / pembangunan /
   rencana), model (sewa harian, leasehold, campuran).
8. Angka operasional per proyek, dengan periode: ADR, occupancy, revenue,
   biaya, komisi OTA, mix channel.
9. Posisi keuangan: kas, utang, komitmen capex — dengan tanggal.
10. Riwayat investasi & pendanaan (modal sendiri, investor, pinjaman).
11. Tujuan strategis 1, 3, 5 tahun.
12. Model penjualan leasehold: masa sewa, harga, skema pembayaran, jumlah terjual.
13. Kompetitor yang founder anggap paling relevan.
14. Keputusan besar masa lalu yang ingin didokumentasikan sebagai decision
    history awal.

## Integrasi (Phase 5)

15. MKH Sistem & Villa management system: data apa yang tersedia, siapa
    pemiliknya, apakah ada API / ekspor CSV?
16. Supabase: project mana, dan apakah bisa dibuat role read-only khusus?
17. Cloudbeds & OTA: akun mana yang dipakai, ekspor apa yang rutin tersedia?
