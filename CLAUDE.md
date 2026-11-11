# Loonars AI Advisor — aturan kerja untuk Claude

Sumber kebenaran: `docs/00-master-instruction.md`. Baca sebelum bekerja.

- Kerjakan per fase (`docs/phase-1/03-roadmap.md`). Jangan mulai fase berikut
  sebelum acceptance criteria fase sebelumnya disetujui founder.
- Jangan mengarang angka. Data yang belum ada ditulis `NEEDS DATA`.
- Setiap angka berlabel `ACTUAL` / `HISTORICAL` / `ASSUMPTION` / `PROJECTION` /
  `SIMULATED`, dengan periode dan sumber.
- Hasil simulasi selalu diberi label data sintetis, bukan survei nyata.
- Jangan pernah commit credential, API key, `.env*`, atau isi `private/`.
- Integrasi data hanya read-only; jangan menyentuh sistem produksi MKH, Villa,
  Supabase, Cloudbeds, atau OTA tanpa persetujuan tertulis founder.
- Keputusan baru berstatus `CONFIRMED` hanya setelah founder mengonfirmasi.
- Jangan mengubah repo upstream `founder-skill`; pertahankan atribusi MIT.
- Analisis strategis memakai format 10 bagian + confidence level + unknowns
  (`docs/standards/output-format.md`).
- Angka keuangan aktual Loonars = AI CFO MKH Property
  (`docs/standards/consult-ai-cfo.md`). Jangan menghitung ulang angka aktual.
- Repo villa, Mkhsistem, mkh-properti hanya dibaca. Hormati aturan di
  `CLAUDE.md` masing-masing (mis. harga villa butuh persetujuan owner).
- Repo ini **publik**: jangan commit angka keuangan aktual, nama pembeli/
  investor, rekening, NIK, telepon. Pakai `private/`.
- Tes: `cd tests && python3 -m unittest test_finance test_adapters test_repo`.
