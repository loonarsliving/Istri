---
name: financial-risk-analysis
description: >-
  Analisis risiko keuangan Loonars: likuiditas, konsentrasi pendapatan
  (channel/OTA, musim, satu properti), kewajiban & jatuh tempo, pencampuran
  dana antar lini, ketergantungan talangan owner, risiko proyek konstruksi,
  risiko bagi hasil/jaminan investor, dan kualitas data. Menghasilkan risk
  register berperingkat dengan skenario terburuk dan mitigasi. Pakai saat
  founder bilang "risikonya apa", "aman tidak", "worst case", "stress test",
  "kalau sepi 3 bulan", atau dari business-feasibility.
argument-hint: "<lingkup: grup | L1 | L2 | rencana tertentu>"
---

# financial-risk-analysis

## Instruksi
Risiko diukur dari mekanisme dan angka, bukan kata sifat. Satu sistem yang
tidak terbaca adalah risiko data, bukan bukti bisnis sepi.

## Input
- Dari AI CFO: forecast 3 skenario & tanggal defisit, kewajiban berprioritas,
  peringatan (`/cfo/peringatan`), rekonsiliasi & kualitas data.
- Untuk rencana baru: output `tools/finance/*` skenario worst & stress.
- `knowledge-base/company/financial-position.md` (rujukan, bukan angka di repo publik).

## Proses
1. Kategori: likuiditas; konsentrasi (channel, musim, properti, pembeli);
   kewajiban & refinancing; leverage & talangan owner; konstruksi (budget vs
   realisasi, utang toko); kewajiban ke investor (bagi hasil, top-up jaminan,
   serah terima); pajak & kepatuhan; kualitas data & rekonsiliasi.
2. Per risiko: kemungkinan (1–5), dampak dalam IDR bila bisa dihitung (dari
   AI CFO/tool) atau 1–5, tanda awal (KPI + ambang), mitigasi, pemilik.
3. Worst case terpadu: gabungkan 2–3 risiko yang berkorelasi (mis. musim sepi
   + komisi OTA naik + jatuh tempo utang) dan hitung dampaknya ke kas.
4. Rekomendasi: 3 mitigasi dengan biaya dan efek terbesar.

## Output
`analyses/<slug>/risks.md`: risk register berperingkat, worst case terpadu,
mitigasi, KPI pemantauan.

## Batasan
Tidak mengganti angka AI CFO. Bukan nasihat audit/pajak.
