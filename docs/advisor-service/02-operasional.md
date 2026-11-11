# Layanan Advisor — operasional

Status 2026-11-11: layanan **live** di `https://loonars-advisor.vercel.app`
(Vercel proyek `loonars-advisor`, `prj_z41qy8siiHpO9So5sjaCVUTZS5DQ`, root `service/`).
Jembatan WA di MK Connect: PR Mkhsistem #166 (di-merge).

## Alur
Founder (WA, nomor super admin) → "advisor: …" → MK Connect asisten owner →
`POST loonars-advisor.vercel.app/api/advisor/pesan` → balasan cepat "sedang diproses"
→ advisor (Gemini Pro, kunci sendiri; fakta AI CFO) → `POST mkh.haluoleo.id/api/wa/send`
→ Whacenter → WA founder.

## Deploy
Proyek `loonars-advisor` **tidak** auto-deploy dari Git (agar push ke branch Catatanku
tidak memicu build gagal). Deploy dipicu Claude lewat Vercel MCP `create_deployment`
(gitSource `loonarsliving/Istri`, ref branch advisor, target production) setelah
`cd service && npm test && npm run typecheck && npm run build` lulus.
Setelah mengubah knowledge-base/decisions/standards/skill mentor: `npm run sync-content`.

## Environment (`loonars-advisor`, production) — nilai tidak pernah di repo
| Variabel | Isi | Pasangan |
| --- | --- | --- |
| `GEMINI_API_KEY` | kunci Gemini Pro khusus advisor (dipasang founder) | — |
| `ADVISOR_BRIDGE_SECRET` | rahasia jembatan | sama dengan `ADVISOR_BRIDGE_SECRET` di proyek Vercel `mkhsistem` |
| `LOONARS_AI_CFO_SECRET` | akses baca AI CFO **dan** register `advisor_*` (header x-advisor-secret) | sama dengan Vault `advisor_shared_secret` (MKH Property) |
| `LOONARS_DB_ANON_KEY` | kunci anon MKH Property untuk RPC register (bukan rahasia) | `get_publishable_keys` (legacy anon) |
| `CRON_SECRET` | pengingat harian (Vercel Cron, 07:17 WIB) | acak ≥32 karakter; kosong = pengingat menolak |
Di `mkhsistem` juga: `ADVISOR_SERVICE_URL=https://loonars-advisor.vercel.app`.

Rotasi 2026-11-11: `advisor_shared_secret` diganti (nilai lama sempat tampil di
transkrip sesi). Rotasi berikutnya: buat nilai baru → perbarui Vault + env Vercel
pasangannya → deploy ulang → cek `GET /api/advisor/health`.

## Fitur WA (D-2026-007)

Register: tabel `advisor_*` di MKH Property (migrasi 0073a–d), hanya lewat RPC
bergerbang rahasia. Keputusan repo D-2026-001…007 diimpor sekali (`sumber = repo`).

| Pesan WA | Hasil |
| --- | --- |
| pertanyaan/diskusi bebas | mentor Gemini Pro; bila menyebut uang keluar (Rp/juta + kata kerja belanja) → AI CFO `evaluasi` dikutip |
| `bahas: …` / `board penuh: …` | sidang board: 3 kursi (tabel bidang) atau 12 kursi (eskalasi/diminta, D-2026-008) + ringkasan Chairman; memo disimpan `advisor_dokumen`; usulan memori disimpan berstatus usulan |
| `advisor rapat direksi` | rapat 12 kursi (notulen: kondisi, 3 penghambat, keputusan ditinjau, kesiapan IPO, 3 langkah); otomatis tanggal 1 pukul 08:17 WIB (`/api/advisor/rapat-bulanan`) |
| `advisor ingat[ beban/hambatan/pelajaran/tujuan/aturan/model bisnis]: …` | memori perusahaan aktif (`advisor_memori`, migrasi 0074) — dibaca setiap sidang & mentor |
| `advisor memori` · `advisor sahkan memori N/semua` · `advisor lupakan memori N` | kelola memori; usulan direksi hanya berlaku setelah disahkan |
| `catat keputusan[ dari board N]: …` | draf 11 field → PROPOSED (nomor otomatis D-YYYY-NNN) |
| `bahas D-…` | sidangkan keputusan tercatat; syarat board ditambahkan; `dibahas = true` |
| `konfirmasi D-…` | CONFIRMED, hanya dari PROPOSED yang sudah dibahas (D-2026-004) |
| `keputusan saya` | daftar dari register (cadangan: bundel repo) |
| `advisor riset: …` | Google Search grounding; URL sumber dari metadata, bukan tulisan model |
| `advisor detail N` · `advisor dokumen` · `advisor syarat` · `advisor syarat selesai N` | baca/ubah register tanpa AI |

Pengingat: `/api/advisor/pengingat` (cron harian) → WA ke nomor owner terakhir
(`advisor_pengaturan.owner_wa`) bila ada syarat ≤3 hari atau keputusan waktunya ditinjau.
Biaya kasar: satu sidang ringkas ≈ 4 panggilan Pro, sidang/rapat 12 kursi ≈ 13 panggilan
(ASSUMPTION; cek tagihan Google pada tinjauan 11 Des 2026).

## Cek kesehatan
`GET /api/advisor/health` → `ok`, variabel yang belum diatur (nama saja), ketersediaan
model utama & cadangan, `thinkingLevel`.

## Mematikan (kill criteria D-2026-005)
Hapus `ADVISOR_SERVICE_URL` di `mkhsistem` (WA menjawab "advisor belum tersambung"),
atau cabut kunci Gemini di akun Google. Fitur MK Connect lain tidak terpengaruh.
