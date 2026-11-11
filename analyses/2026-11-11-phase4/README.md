# Phase 4 — Uji 5 kasus nyata (2026-11-11)

> Versi publik **tanpa angka**. Analisis lengkap (memo per seat, chair summary
> 10 bagian, angka AI CFO berlabel) ada di `private/analyses/2026-11-11-phase4/`
> (di-ignore Git) dan bisa disusun ulang kapan saja dari AI CFO.
> Ini kasus uji sistem, **bukan keputusan founder**. Setiap keputusan nyata
> dibahas lagi dan dicatat lewat `/founder-decision-review` (D-2026-004).

Data: AI CFO MKH Property via `/api/cfo/advisor` (128 fakta, 2026-11-11) +
CEO challenger untuk rencana uji. Board: kasus 1 = 8 seat (Standar), kasus 2–5
= 3 seat (Ringkas) sesuai tabel bidang di `docs/standards/decision-review-policy.md`.

## Temuan lintas kasus

**Kas grup sudah diproyeksikan defisit dalam ±3 bulan bahkan tanpa belanja
baru** (forecast AI CFO, ketiga skenario). Karena itu setiap rencana belanja
yang diuji ditolak AI CFO dengan "maksimal aman sekarang" = nol, dan kelima
kasus bermuara pada urutan yang sama:

1. **Tagih piutang penjualan unit L2** (belum punya tanggal jatuh tempo) —
   cukup untuk menutup kebutuhan dana skenario normal bila tertagih tepat waktu.
2. **Jual unit L2 yang sudah berdiri sebelum membangun unit baru**; bangun hanya
   setelah DP masuk.
3. **Bereskan rekonsiliasi & tindakan CFO yang lewat tenggat** sebelum mencari
   investor.
4. **Tingkatkan L1 dengan tuas tanpa modal** (direct booking, paket, referral).
5. **Tulis tujuan strategis** — masih kosong dan diangkat oleh beberapa seat.

## Hasil per kasus

| # | Pertanyaan | Vote board | Rekomendasi (ringkas) |
| --- | --- | --- | --- |
| 1 | Apakah Loonars 2 layak dikembangkan lebih lanjut? | 6 APPROVE IF · 2 REJECT (8 seat) | Lanjut hanya sebagai **"jual dulu, bangun setelah DP"**; nol konstruksi untuk unit tanpa pembeli; kill criteria bertanggal bila tidak ada DP baru |
| 2 | Apakah Loonars perlu ekspansi ke lokasi baru? | 3 REJECT | **Tidak sekarang**; siapkan model asset-light (kelola properti pihak lain) sebagai uji setelah kas aman |
| 3 | Bagaimana mengoptimalkan penjualan leasehold/unit? | 3 APPROVE IF | Jual ready stock dengan offer & termin tertulis; **notaris meninjau sewa tanah vs masa jual** dulu; tanpa janji imbal hasil |
| 4 | Fundraising atau internal capital? | 2 REJECT · 1 APPROVE IF | **Internal capital dulu**; utang hanya cadangan untuk gap pesimis; equity setelah investor-ready (2027) |
| 5 | Meningkatkan okupansi & profitabilitas L1? | 3 APPROVE IF | **Tuas tanpa modal**: tekan komisi OTA lewat direct booking, paket weekday/long-stay, referral investor; perubahan harga lewat persetujuan owner |

Uji "anti yes-man": board menolak (REJECT) di 3 dari 5 kasus dan tidak ada
satu seat pun yang menyetujui belanja tanpa syarat.

## Data yang masih kosong (NEEDS DATA)
Skema produk L2 (leasehold, masa sewa vs sewa tanah), harga daftar per tipe,
funnel penjualan, okupansi 12 bulan & jumlah kamar pasti, riset kompetitor,
panel konsumen, discount rate founder, tujuan strategis.

## Perbaikan sistem dari uji ini (P4-4)

| Prioritas | Perbaikan | Status |
| --- | --- | --- |
| 1 | Salinan privat permanen untuk analisis berangka (container sesi sementara) | dicatat; repo akan private setelah selesai |
| 2 | Jalankan `/loonars-market` & `/loonars-consumer --quick` untuk L2 sebelum keputusan penjualan | belum (butuh persetujuan biaya sub-agent per run) |
| 3 | `hospitality.py` butuh data 12 bulan — tambah mode "satu bulan + tuas" agar bisa dipakai dengan data parsial | backlog |
| 4 | Mode `evaluasi` AI CFO hanya untuk uang keluar; skenario pemasukan (penagihan, penjualan) perlu mode `simulasi_pemasukan` di endpoint | backlog (perubahan mkh-properti, perlu dibahas) |
| 5 | Brief board perlu daftar harga per tipe unit dari AI CFO (selisih harga rata-rata terjual vs daftar muncul berulang) | backlog |
| 6 | Seat memo cenderung > batas kata; tidak kritis | catatan |
