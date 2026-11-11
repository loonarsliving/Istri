# Integrasi MK Connect (Mkhsistem) — desain

Status: kontrak data diadopsi · koneksi **belum** diimplementasikan.
Repo pemilik: `loonarsliving/Mkhsistem` (production branch
`claude/mk-connect-app-o9zw2p`, bukan `main` — lihat GIT_WORKFLOW.md di repo itu).

## Yang dipakai advisor

| Fitur | Pemakaian | Tahap |
| --- | --- | --- |
| FRIDAY Holding `BusinessSnapshot` | Format snapshot per bisnis (`metrics[]`, `narrative`, `health`, `freshnessDays`). Diadopsi di `tools/adapters/base.py` (`HOLDING_METRIC_KEYS`, `validate_metric`). | A (manual): founder mengekspor briefing/snapshot FRIDAY. B: endpoint baca. |
| FRIDAY briefing harian | Konteks untuk mentor (situasi, akar masalah, alternatif). | A |
| Asisten WA owner + tool `ai_cfo` | Jalur founder bertanya ke AI CFO saat ini. | A |
| CRM, iklan Meta, siteplan & penjualan unit, konstruksi, HR | Data seat Marketing, Investment, Operations. | B |

## Usulan tahap B (Phase 5, perlu persetujuan)
1. **Baca snapshot holding**: endpoint baca di MK Connect yang mengembalikan
   `BusinessSnapshot[]` terakhir (sudah dihitung FRIDAY), auth rahasia khusus
   advisor, RBAC setara `friday.view` (bukan `friday.run` / `friday.action_decide`).
2. **(Opsional) advisor sebagai tool asisten owner**: tool WA baru `advisor`
   yang meneruskan pertanyaan strategis ke advisor. Ini menambah fitur di MK
   Connect dan butuh desain terpisah; tidak dikerjakan sekarang.

## Aturan MK Connect yang wajib dihormati
- Angka dihitung di kode, bukan model (`lib/ai/friday/signals.ts`).
- Aksi hanya dari katalog (`action-catalog.ts`), status `proposed`, diputuskan manusia.
- Bisnis yang tidak terbaca = `data_tidak_tersedia`, bukan nol.
- Supabase `svcmyb…` dipakai bersama villa: advisor **tidak** menambah tabel di sana.
- Pesan otomatis tidak mengatasnamakan owner (aturan 2026-11-10).
