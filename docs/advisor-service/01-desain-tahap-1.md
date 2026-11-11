# Layanan Advisor (Istri) — Desain Tahap 1

Dasar: D-2026-005 (advisor mandiri, kunci Gemini Pro khusus advisor, batas
Rp 200 rb/bulan, data di MKH Property) + syarat board Standar 2026-11-11.

## Arsitektur

```
Founder ── WA ──► MK Connect (asisten owner, super admin saja)
                      │  tool baru "advisor": teruskan teks apa adanya
                      ▼  POST /api/advisor/pesan  (x-advisor-bridge-secret)
              ┌───────────────────────────────┐
              │ Istri — layanan advisor        │  Vercel project baru
              │ Next.js (TypeScript)           │  (bukan project "istri" milik Catatanku)
              │  • /api/advisor/pesan  (WA)    │
              │  • /advisor  (halaman, login)  │
              │  • Gemini 3.1 Pro — KUNCI SENDIRI (ADVISOR_GEMINI_API_KEY)
              └──────┬───────────────┬─────────┘
                     │ RPC advisor_* │ POST /api/cfo/advisor
                     ▼ (x-advisor-secret)
              MKH Property (gluoioi…): tabel advisor_* + AI CFO
                     │
   balasan ◄─────────┘  Istri → POST mkh.haluoleo.id/api/wa/send (rahasia bridge advisor)
```

Prinsip: AI MK Connect (Gemini Flash-Lite, kunci lama) **tidak diubah**. Kunci
Gemini Pro hanya ada di environment layanan Istri. Angka keuangan tetap dari AI
CFO (tidak dihitung ulang). Advisor hanya mengusulkan; tidak ada aksi ke sistem lain.

## Tahap 1 — Register keputusan + WA (target live ≤ 11 Des 2026)

| Bagian | Isi | Repo | AI? |
| --- | --- | --- | --- |
| Data | Tabel `advisor_keputusan` (11 field D-format, status DRAFT/PROPOSED/CONFIRMED/REVIEWED/…), `advisor_syarat` (checklist APPROVE IF, tenggat, status), `advisor_kpi`, `advisor_log` (append-only, termasuk konfirmasi founder). RLS: tanpa akses anon/authenticated; hanya lewat RPC security definer yang memeriksa rahasia advisor. | mkh-properti (migrasi baru) | – |
| API | `/api/advisor/pesan`: terima teks WA → balas cepat "diterima" (≤ 10 dtk) → proses → kirim balasan via `/api/wa/send`. Perintah tahap 1: "keputusan saya", "syarat jatuh tempo", "catat keputusan …" (selalu PROPOSED → minta konfirmasi), "konfirmasi D-…", "tinjau D-…". | Istri | ringan (pakai kunci Gemini Pro, mode cepat) |
| Pengingat | Cron harian: syarat/kill criteria jatuh tempo ≤ 3 hari → satu digest WA (judul + tanggal + tautan, **tanpa angka**). | Istri | – |
| Halaman | `/advisor`: daftar keputusan, syarat, KPI, dokumen board (login super admin; via auth MKH Property). | Istri | – |
| Penerus WA | Tool `advisor` di asisten owner (hanya super admin) + dukungan rahasia bridge advisor terpisah di `/api/wa/send`. | Mkhsistem | – |
| Migrasi data | Impor D-2026-001…005 + syarat board Phase 4 & keputusan ini. | Istri | – |

Uji wajib sebelum live: akses per peran (hanya super admin), CONFIRMED hanya
via konfirmasi eksplisit, fallback bila Gemini gagal, nol regresi WA karyawan
7 hari, biaya API ≤ batas.

## Tahap 2 — Mentor via WA (setelah tahap 1 berjalan 14 hari, ≥ 3 keputusan)
Prompt mentor (port dari `.claude/skills/loonars-mentor`), knowledge base di
`advisor_*`, fakta AI CFO; `thinkingLevel` tinggi; jalan di antrean; ringkasan
≤ 5 baris di WA + tautan. Uji A/B buta 10 pertanyaan sebelum dikunci.

## Tahap 3 — Board via WA
12 seat (D-2026-008; lensa dari `.claude/skills/loonars-board/seats/`), chair summary 10
bagian, dokumen di `/advisor`. Riset pasar tetap via Claude Code sampai URL
grounding tersimpan per fakta (syarat Market Intelligence).

## Biaya
Kunci Gemini Pro: batas belanja **Rp 200.000/bulan** di akun Google (diuji AI
CFO sebelum aktif). Database & Vercel: tanpa biaya tambahan (paket yang ada).
Kill criteria: biaya > batas atau error WA karyawan naik → matikan advisor AI.

## Yang dibutuhkan dari founder
1. Membuat akun Gemini API berbayar + kunci + batas belanja Rp 200 rb (dipandu
   saat tahap 1 siap diuji; kunci diserahkan lewat cara aman, bukan chat).
2. Meninjau & menyetujui 3 PR (Istri, mkh-properti, Mkhsistem).
