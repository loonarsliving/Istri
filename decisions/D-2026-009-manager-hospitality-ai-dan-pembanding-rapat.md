---
id: D-2026-009
title: Kursi ke-13 Manager Hospitality AI (checklist staf, kesiapan kamar, chat tamu) dan rapat bulanan dibandingkan dengan bulan lalu
date: 2026-11-11
status: CONFIRMED
confirmed_at: 2026-11-11
confirmed_by: founder (percakapan 2026-11-11)
review_on: 2027-02-11
lines: [L1, L2, Advisor]
analysis: docs/advisor-service/02-operasional.md
supersedes: jumlah kursi D-2026-008 (12 → 13)
---

# Manager Hospitality AI dan pembanding rapat

## Business context
Rapat direksi bulanan (D-2026-008) membaca keuangan lewat AI CFO, tetapi belum membaca operasional villa dan belum membandingkan dengan rapat sebelumnya. Data operasional sudah ada di ekosistem: Loonars Connect (laporan harian, checklist cleaning/FO/security, tugas kamar, masalah), sistem villa (pengecekan kamar), dan chat WA tamu di inbox resepsionis. Temuan awal: checklist staf yang tercatat di Loonars Connect sangat sedikit dibanding laporan harian dan pengecekan kamar villa pada periode yang sama (ACTUAL · 30 hari sampai 2026-11-11 · Supabase MK Connect).
## Founder proposal
"Perbandingan tiap bulan itu penting; data operasional villa juga untuk manager hospitality AI; karyawan sungguhan suka lupa checklist, ini bisa jadi bahan evaluasi di rapat; bahkan chat tamu yang masuk endpoint resepsionis juga dipelajari."
## AI board analysis
Dibahas advisor bersama founder (percakapan 2026-11-11), tidak disidangkan. Catatan advisor: (1) angka operasional dihitung MK Connect (satu versi angka), advisor hanya menyajikan; (2) evaluasi karyawan harus memakai angka dan menilai sistem dulu (jadwal, beban, alat) sebelum menyalahkan orang; (3) chat tamu adalah data pribadi — nama/nomor tamu tidak keluar dari MK Connect, contoh pesan disamarkan; (4) checklist yang rendah bisa berarti staf lupa ATAU staf masih memakai cara lama (grup WA/app villa) — perlu dicek, bukan langsung disimpulkan.
## Identified risks
Salah menilai karyawan dari data yang belum lengkap; data pribadi tamu terkirim ke model AI (dimitigasi: penyamaran, tanpa identitas, hanya ke kursi hospitality); biaya rapat naik (13 kursi ≈ 14 panggilan + konteks chat).
## Alternatives considered
Membaca tabel villa langsung dari advisor (tidak dipilih: repo villa hanya dibaca, dan angka harus satu versi); hanya angka tanpa contoh chat (tidak dipilih: founder ingin chat tamu dipelajari).
## Final decision
1. Rapat bulanan membaca notulen rapat sebelumnya dan menilai setiap langkah: jalan / sebagian / belum / belum bisa dibuktikan.
2. Kursi ke-13 **Manager Hospitality AI** memakai ringkasan hanya-baca dari MK Connect (`POST /api/advisor/hospitality`, PR Mkhsistem): laporan terlewat, checklist per staf (nama depan), bersih ulang & waktu inspeksi, tugas ditutup tanpa verifikasi FO, masalah terbuka, waktu balas & tema chat tamu (contoh ≤120 pesan disamarkan, hanya untuk kursi ini).
3. Kursi ini ikut sidang bidang Tamu & pelayanan dan Operasional & SOP, serta setiap rapat bulanan.
## Expected outcome
Tinjau 11 Feb 2027: notulen bulanan memuat penilaian tindak lanjut bulan lalu; disiplin checklist staf terukur dan membaik dari bulan ke bulan; waktu balas chat tamu dipantau; nol data identitas tamu di output advisor.
## Actual outcome
## Lessons learned
