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
- **Semua keputusan founder dibahas** (D-2026-004), di bidang apa pun; kedalaman
  menurut `docs/standards/decision-review-policy.md`. Jangan pernah bilang "langsung saja".
- **Jangan menyuruh founder melakukan langkah teknis di luar Claude Code**
  (SQL editor, dashboard, menyalin rahasia, setting server) — keputusan founder
  2026-11-11. Kerjakan sendiri dengan alat yang ada (Supabase MCP, GitHub,
  Vercel, environment tools); bila benar-benar terhalang izin, cukup minta satu
  persetujuan di Claude Code. Founder fokus pada ide dan keputusan bisnis.
- AI CFO: `python3 tools/adapters/ai_cfo.py fakta|tanya|evaluasi` (lihat
  `docs/standards/consult-ai-cfo.md`; buat ulang `private/advisor.env` sendiri bila hilang).
- Jangan mengubah repo upstream `founder-skill`; pertahankan atribusi MIT.
- Analisis strategis memakai format 10 bagian + confidence level + unknowns
  (`docs/standards/output-format.md`).
- Angka keuangan aktual Loonars = AI CFO MKH Property
  (`docs/standards/consult-ai-cfo.md`). Jangan menghitung ulang angka aktual.
- Repo villa dan Mkhsistem hanya dibaca. mkh-properti hanya diubah untuk endpoint
  advisor `/api/cfo/advisor` (disetujui founder, PR #61/#63) lewat PR + CI. Hormati aturan di
  `CLAUDE.md` masing-masing (mis. harga villa butuh persetujuan owner).
- Repo ini **publik**: jangan commit angka keuangan aktual, nama pembeli/
  investor, rekening, NIK, telepon. Pakai `private/` selama sesi, lalu **simpan
  salinan permanen ke Google Drive founder, folder "Loonars AI Advisor – Privat"**
  (id `1EPp0-wd7pzcWSQeQF5geN96MkvmvwKpv`, privat) lewat konektor Google Drive.
  Jangan simpan analisis berangka di Filemanager/Mac mini (bisa diminta karyawan via WA).
- Tes: `cd tests && python3 -m unittest test_finance test_adapters test_repo test_adapted_upstream`.
- Patch untuk repo lain disimpan di `integrations/<repo>-*/`; jangan dianggap terpasang
  sampai dipasang di repo itu.
