# Prosedur konsultasi AI CFO (MKH Property)

AI CFO adalah sumber angka keuangan aktual dan forecast Loonars (ADR-6).
Advisor tidak menghitung ulang angka aktual.

## Kapan wajib konsultasi
- Pertanyaan menyangkut kas, laba-rugi L1/L2/holding, kewajiban, forecast,
  atau keputusan yang mengeluarkan uang.
- Seat CFO Advisor di board, `capital-allocation`, `financial-risk-analysis`,
  `investor-strategy` (posisi keuangan), `business-feasibility` modul 5–6
  bila menyangkut bisnis yang sudah berjalan.

## Cara (tahap A — sekarang)
1. Susun pertanyaan untuk AI CFO, spesifik dan bernominal, contoh:
   - "Kalau saya keluarkan Rp X untuk <rencana> di lini L1/L2/Grup pada
     <tanggal>, dicicil N kali, apa putusanmu dan berapa maksimal yang aman
     sekarang?" (memicu CEO challenger: putusan aman / waspada / tolak)
   - "Forecast kas 13 minggu skenario pesimis, dan tanggal defisit pertama?"
   - "Kewajiban jatuh tempo 90 hari ke depan berurutan prioritas?"
2. Minta founder menanyakannya lewat WA asisten owner (menu **AI CFO**) atau
   web `finance.haluoleo.id/cfo/chat`, lalu menempel jawabannya.
3. Simpan sebagai `analyses/<slug>/inputs/ai-cfo-<n>.json` dengan format
   `ManualSnapshotSource` (`tools/adapters/sources.py`):
   `source`, `dataset`, `label: ACTUAL` (fakta) atau `PROJECTION` (forecast),
   `period`, `retrieved_at`, `how`, lalu `rows` berisi jawaban, putusan, fakta.
   Jika repo masih publik, simpan di `private/` dan rujuk path-nya saja.
4. Kutip putusan **apa adanya**. Board boleh berbeda pendapat, tetapi harus
   menulis "AI CFO: <putusan>. Board: <pendapat>, karena asumsi <...> berbeda".

## Jika AI CFO tidak tersedia
Tulis `NEEDS DATA: konsultasi AI CFO` dan turunkan confidence ke Low. Jangan
mengganti dengan angka perkiraan sendiri.

## Tahap B (Phase 5, belum aktif)
`AiCfoSource` membaca endpoint read-only khusus advisor. Lihat
`docs/integrations/01-ai-cfo.md`.
