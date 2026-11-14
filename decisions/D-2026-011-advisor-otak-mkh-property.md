---
id: D-2026-011
title: Advisor menjadi otak AI CFO MKH Property; strategi harga villa, RAB & kesiapan ekspansi, riset lokasi Loonars berikutnya
date: 2026-11-14
status: CONFIRMED
confirmed_at: 2026-11-14
confirmed_by: founder (percakapan Claude Code 2026-11-14, "Jalan smua")
review_on: 2027-02-14
lines: [Holding, L1, L2]
analysis: docs/advisor-service/02-operasional.md
supersedes: —
---

# Advisor sebagai otak MKH Property

## Business context
MKH Property (AI CFO) sudah menarik data keuangan villa dan MK Connect, tetapi narasinya memakai model ringan MK Connect. Founder ingin MKH Property "sebagai pengelola CFO sebenarnya bisa berfikir". Lingkup data: hanya Loonars 1 & Loonars 2; proyek lama PT Maha Karya disembunyikan; cabang Makassar ditutup (gaji dikonfirmasi lunas).

## Founder proposal
"AI yang ada di repo Istri juga sebagai otak utama dari MKH Property … menganalisa, menghadirkan data akurat, menghitung RAB, apakah okupansi sempurna, ADR, bahkan sampai strategi harga untuk membantu mesin harga di repo villa menentukan harga, membantu Vando menemukan lokasi baru untuk villa berikutnya." Lanjutan: "AI yang pelajari area Jogja yang tepat untuk pembukaan Loonars berikutnya, dan kasih saran ke Vando jika sudah waktunya keadaan keuangan sudah siap."

## AI board analysis
Dibahas bersama founder di sesi Claude Code (tidak disidangkan). Catatan advisor: (1) angka tetap dihitung kode MKH Property — advisor hanya bernalar dan dijaga validasi angka; (2) mesin harga villa berjalan dengan autopush MENYALA, sehingga tulisan advisor ke tabel harga bisa langsung sampai OTA — maka advisor tidak menulis ke villa; (3) "keuangan siap" harus diputuskan aturan tertulis, bukan model; (4) pesan ke staf tidak menyebut owner (aturan MKH Property 2026-11-10).

## Identified risks
Narasi model salah angka (dimitigasi `validasiJawaban` + penjaga angka advisor); strategi harga diterapkan tanpa ditinjau (advisor tidak punya akses tulis harga); saran ekspansi terlalu dini (gerbang deterministik 5 syarat); riset lokasi keliru (hanya dari sumber web, URL dari metadata; wajib survei lapangan); biaya Gemini Pro naik (tinjau tagihan bersama D-2026-005).

## Alternatives considered
Advisor menulis usulan langsung ke `villa_pricing_recommendations` (ditolak — autopush menyala); model menilai sendiri kesiapan keuangan (ditolak — angka di kode); saran ke Vando setiap bulan tanpa gerbang (ditolak).

## Final decision
1. **Otak AI CFO:** AI CFO Chat MKH Property meminta narasi ke advisor (`POST /api/advisor/cfo`, ditandatangani database MKH Property — migrasi 0076 `cfo_tanda_advisor`); MK Connect jadi cadangan; angka tetap dari mesin deterministik.
2. **RAB & kesiapan ekspansi** dihitung MKH Property (`src/lib/cfo/ekspansi.ts`) dan dibaca advisor sebagai fakta. Aturan awal kesiapan (semua harus lolos): tanpa dana talangan Loonars 2; tanpa unit dibangun tanpa pembeli; forecast pesimis tanpa defisit 182 hari; EBITDA Loonars 1 bulan final terakhir > 0; CEO challenger menilai modal awal 1 unit acuan AMAN. Founder boleh mengubah aturan ini.
3. **Strategi harga** (`advisor strategi harga`, otomatis tiap Senin pagi): okupansi vs ambang mesin harga, ADR vs kompetitor, arah per tipe kamar dalam persen; ke WA owner saja. Data dari MK Connect `POST /api/advisor/harga` (hanya baca). Advisor tidak mengubah harga/setelan villa.
4. **Riset lokasi** (`advisor lokasi`, otomatis tiap tanggal 15): peringkat area DIY bersumber web + RAB acuan + kesiapan → WA owner; saran survei ke Kepala Cabang Jogja **hanya** saat kesiapan berubah menjadi SIAP (sekali per transisi), tanpa menyebut owner.

## Expected outcome
Tinjau 14 Feb 2027: jawaban AI CFO Chat mayoritas disusun advisor dan lolos validasi angka; strategi harga mingguan terkirim; riset lokasi bulanan tersimpan; tidak ada pesan ke Kepala Cabang Jogja sebelum kesiapan SIAP; nol perubahan harga oleh advisor.

## Actual outcome

## Lessons learned
