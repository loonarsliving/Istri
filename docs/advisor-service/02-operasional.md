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
| `LOONARS_AI_CFO_SECRET` | akses baca AI CFO | sama dengan Vault `advisor_shared_secret` (MKH Property) |
Di `mkhsistem` juga: `ADVISOR_SERVICE_URL=https://loonars-advisor.vercel.app`.

Rotasi 2026-11-11: `advisor_shared_secret` diganti (nilai lama sempat tampil di
transkrip sesi). Rotasi berikutnya: buat nilai baru → perbarui Vault + env Vercel
pasangannya → deploy ulang → cek `GET /api/advisor/health`.

## Cek kesehatan
`GET /api/advisor/health` → `ok`, variabel yang belum diatur (nama saja), ketersediaan
model utama & cadangan, `thinkingLevel`.

## Mematikan (kill criteria D-2026-005)
Hapus `ADVISOR_SERVICE_URL` di `mkhsistem` (WA menjawab "advisor belum tersambung"),
atau cabut kunci Gemini di akun Google. Fitur MK Connect lain tidak terpengaruh.
