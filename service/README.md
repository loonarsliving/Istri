# Layanan Loonars AI Advisor (service/)

Layanan mandiri sesuai D-2026-005/006: mentor via WhatsApp dengan **kunci Gemini
Pro khusus advisor**. AI MK Connect yang sudah berjalan tidak disentuh.

- `POST /api/advisor/pesan` — dari MK Connect (header `x-advisor-bridge-secret`), body `{nomor, pesan}`; jawab 202, balasan dikirim via MK Connect `/api/wa/send`.
- `GET /api/advisor/health` — status konfigurasi & ketersediaan model (tanpa nilai rahasia).

Environment (Vercel proyek advisor): `GEMINI_API_KEY`, `ADVISOR_BRIDGE_SECRET`,
`LOONARS_AI_CFO_SECRET`; opsional `ADVISOR_GEMINI_MODEL` (default `gemini-3.1-pro-preview`, nama resmi di API per 2026-11-11),
`ADVISOR_FALLBACK_MODEL`, `ADVISOR_THINKING_LEVEL` (default `HIGH`), `MK_CONNECT_URL`,
`LOONARS_AI_CFO_URL`.

Isi pengetahuan dibundel dari repo (`npm run sync-content` setelah mengubah
knowledge-base/decisions/standards/skill mentor). Tes: `npm test`.
