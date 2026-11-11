# Prosedur konsultasi AI CFO (MKH Property)

AI CFO adalah sumber angka keuangan aktual dan forecast Loonars (ADR-6).
Advisor tidak menghitung ulang angka aktual.

## Kapan wajib konsultasi
- Pertanyaan menyangkut kas, laba-rugi L1/L2/holding, kewajiban, forecast,
  atau keputusan yang mengeluarkan uang.
- Seat CFO Advisor di board, `capital-allocation`, `financial-risk-analysis`,
  `investor-strategy` (posisi keuangan), `business-feasibility` modul 5–6
  bila menyangkut bisnis yang sudah berjalan.

## Cara utama — otomatis (founder tidak melakukan apa pun)
Advisor bertanya langsung ke AI CFO lewat endpoint hanya-baca
`POST https://finance.haluoleo.id/api/cfo/advisor` (mkh-properti #61/#63):

```bash
python3 tools/adapters/ai_cfo.py fakta --simpan private/snapshots/<tgl>-fakta.json
python3 tools/adapters/ai_cfo.py tanya "forecast kas 13 minggu skenario pesimis?"
python3 tools/adapters/ai_cfo.py evaluasi --nominal 150000000 --lini L1 --ket "renovasi 3 kamar" --cicilan 3
```

- `evaluasi` = CEO challenger: putusan `aman / waspada / tolak`, alasan, dampak
  3 skenario, alternatif, `maksAmanSekarang`, `tundaAmanHari`.
- Konfigurasi ada di `private/advisor.env` (di-ignore Git). **Sesi baru tanpa
  file itu:** Claude membuatnya ulang sendiri — ambil secret lewat Supabase MCP
  (`execute_sql` project `gluoioiimapyhchdasfl`:
  `select decrypted_secret from vault.decrypted_secrets where name='advisor_shared_secret'`)
  lalu tulis tiga baris `LOONARS_ENABLE_LIVE_SOURCES=1`,
  `LOONARS_AI_CFO_URL=https://finance.haluoleo.id/api/cfo/advisor`,
  `LOONARS_AI_CFO_SECRET=<nilai>`. Jangan pernah menulis nilai itu ke file
  yang di-commit atau ke output untuk founder.
- Host `finance.haluoleo.id` sudah diizinkan di environment "Mkh".
- Jangan minta founder menjalankan langkah teknis (keputusan founder
  2026-11-11): bila jalur ini gagal, Claude memperbaikinya sendiri dulu; hanya
  bila benar-benar terhalang izin, jelaskan satu hal yang perlu disetujui.

## Cara cadangan (manual)
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
