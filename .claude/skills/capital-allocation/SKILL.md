---
name: capital-allocation
description: >-
  Alokasi modal Loonars: memutuskan ke mana uang berikutnya pergi (L1, L2,
  ekspansi, Loonars Coffee, utang, cadangan) dengan menguji setiap rencana
  pengeluaran ke CEO challenger AI CFO (aman / waspada / tolak, maks aman
  sekarang) lalu membandingkan return dan risiko antar opsi. Pakai saat
  founder bilang "uangnya dipakai untuk apa dulu", "boleh keluar Rp ...",
  "prioritas investasi", "bayar utang dulu atau ekspansi", "alokasi modal".
argument-hint: "<rencana pengeluaran / pilihan alokasi>"
---

# capital-allocation

## Instruksi
Urutan default (boleh dilanggar dengan alasan tertulis): 1) kewajiban jatuh
tempo & cadangan kas minimum, 2) yang melindungi pendapatan existing,
3) return tertinggi per rupiah dengan risiko terkendali, 4) taruhan baru.
Dana investor/uang muka (liabilitas sampai serah terima) bukan modal bebas.

## Input
- Daftar opsi pengeluaran: nominal, tanggal, lini (L1/L2/Grup), dicicil?
- Untuk setiap opsi: putusan CEO challenger AI CFO + "maks aman sekarang" +
  saldo minimum skenario pesimis sesudahnya (`docs/standards/consult-ai-cfo.md`).
- Kewajiban berprioritas dari AI CFO.
- Return opsi baru: `tools/finance/investment.py` / `hospitality.py` (PROJECTION).

## Proses
1. Tabel opsi: nominal, putusan AI CFO, dampak saldo minimum pesimis, return
   (NPV/IRR/payback), risiko utama, reversibilitas.
2. Coret opsi `tolak` kecuali founder memberi asumsi yang berbeda dan AI CFO
   dimintai ulang dengan asumsi itu.
3. Susun urutan & waktu (mis. tunda N hari bila AI CFO memberi
   `tundaAmanHari`). Sebut biaya menunggu.
4. Tentukan cadangan kas yang dijaga dan pemicu berhenti.

## Output
`analyses/<slug>/capital-allocation.md` (format 10 bagian) dengan tabel opsi
dan urutan yang direkomendasikan.

## Batasan
Tidak memindahkan uang, tidak menyetujui pengajuan, tidak menyentuh rekening
(AI CFO juga tidak bisa). Founder mengeksekusi.
