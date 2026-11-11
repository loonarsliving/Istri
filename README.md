# Loonars AI Advisor (repo: Istri)

Virtual Board of Directors, Business Mentor, Strategic Advisor, dan Business
Intelligence Assistant untuk founder Loonars. Nama repo tetap **Istri** sampai
semua fase selesai, lalu di-rename.

> **Status (2026-11-11):** Phase 1 selesai & disetujui. Phase 2 (foundation)
> dan Phase 3 (advisory engine: skill + tool) sudah dibangun. Phase 4 (uji
> dengan kasus nyata) menunggu data dari founder/AI CFO. Phase 5 = desain.

## Cara pakai (di Claude Code, dari root repo ini)

| Perintah | Untuk |
| --- | --- |
| `/loonars-mentor <pertanyaan>` | Mentor pribadi: diagnosis, kritik asumsi, arah |
| `/loonars-board <keputusan>` | Sidang 8 seat + chair summary 10 bagian |
| `/business-feasibility <ide>` | Simulation engine 10 modul + verdict dihitung |
| `/loonars-consumer <slug>` | Panel ≤100 tamu/pembeli sintetis (berlabel SIMULATED) |
| `/loonars-market <slug> <area>` | Kompetitor & pasar dari sumber publik berlink |
| `/hospitality-strategy` | Okupansi, ADR, RevPAR, OTA vs direct |
| `/capital-allocation` | Ke mana uang berikutnya; diuji ke CEO challenger AI CFO |
| `/investor-strategy` | Fundraising vs internal capital vs leasehold |
| `/financial-risk-analysis` | Risk register + worst case |
| `/strategic-planning 1y` | Tujuan, prioritas, OKR |
| `/founder-decision-review record\|review\|patterns` | Decision history |

## Terhubung dengan ekosistem Loonars

```
villa (operasi L1) ─► mkh-properti (AI CFO) ◄─ Mkhsistem (MK Connect, FRIDAY)
                              │  read-only
                              ▼
                     Istri — Loonars AI Advisor
```

- **AI CFO MKH Property** = sumber angka keuangan aktual & forecast. Seat CFO
  board mengutip putusannya (`AMAN / WASPADA / TIDAK MENYARANKAN`).
- **villa** = bagaimana bisnis berjalan (booking, okupansi, operasional).
- **Mkhsistem** = FRIDAY Holding (kontrak `BusinessSnapshot` dipakai ulang),
  CRM, unit, konstruksi, HR, WA.
- Semua akses read-only. Sekarang lewat ekspor/tempelan manual; endpoint baca
  khusus advisor dirancang untuk Phase 5.
  Detail: [`docs/integrations/`](docs/integrations/00-ekosistem-loonars.md).

## Struktur

```
docs/            master instruction, phase-1 (audit, arsitektur, roadmap), standards, integrations
.claude/skills/  11 skill advisor (board punya 8 seat di seats/)
tools/finance/   hospitality.py, investment.py, unit_economics.py (adaptasi), money.py
tools/panel/     panel.py, van_westendorp.py (adaptasi founder-skill)
tools/adapters/  kontrak data read-only + ManualSnapshotSource + stub Phase 5
knowledge-base/  memori perusahaan (berlabel; angka sensitif tidak di repo)
decisions/       decision history (CONFIRMED hanya oleh founder)
analyses/        hasil analisis per topik
vendor/          founder-skill @ fd9385b, tidak diubah
tests/           unit test tool & struktur repo
```

## Tes

```bash
cd tests && python3 -m unittest test_finance test_adapters test_repo
python3 -m unittest test_adapted_upstream   # kode turunan upstream
cd ../vendor/founder-skill && python3 -m unittest discover -s tests   # upstream asli
```

## Penting

- **Repo ini publik.** Angka keuangan aktual dan data pribadi tidak di-commit;
  simpan di `private/` (di-ignore) sampai repo dibuat private.
- Bukan nasihat finansial, hukum, investasi, atau pajak. Simulasi = data
  sintetis, bukan prediksi pasti.
- Aplikasi Catatanku lama tetap di branch `claude/reminder-finance-app-yveciz`;
  jangan merge branch advisor ke sana.

Upstream: [founder-skill](https://github.com/Jakeschincariol/founder-skill)
(MIT, Jake Schincariol) — lihat `THIRD_PARTY_NOTICES.md`.
