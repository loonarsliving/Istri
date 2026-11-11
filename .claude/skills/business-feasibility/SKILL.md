---
name: business-feasibility
description: >-
  Business Simulation Engine Loonars. Menguji ide bisnis baru dengan 10 modul:
  feasibility, market opportunity, competitor simulation, consumer simulation
  (hingga 100 persona sintetis), financial projection, investment
  attractiveness, operational feasibility, risk assessment, worst-case
  scenario, dan alternative business model. Verdict dihitung dari angka, bukan
  ditulis tangan. Pakai saat founder bilang "uji ide ini", "layak tidak",
  "feasibility", "simulasikan", "kalau saya buka ...", atau "ekspansi ke ...".
argument-hint: "<ide> [--quick]"
---

# business-feasibility

Adapted from founder-skill pipeline (board → competitors → consumer →
pricing → cfo → ops → plan; MIT @fd9385b), diperluas untuk hospitality,
investasi, worst-case, dan alternatif.

Ide: `$ARGUMENTS`

## Instruksi
Tujuan engine ini adalah menemukan alasan ide gagal semurah mungkin. Hasil
simulasi adalah bahan untuk menguji, bukan prediksi pasti.

## Input
- `analyses/<YYYY-MM-DD>-<slug>/idea.md` — tulis dari percakapan bila belum ada:
  apa, untuk siapa, apa yang dijual dengan harga berapa, di mana & bagaimana,
  budget & batasan, kaitan dengan lini existing (L1/L2/holding). Jika nama,
  pelanggan, produk, atau harga hilang: tanyakan (maks 3 pertanyaan sekaligus).
  Jangan mengarang budget, ukuran pasar, atau kompetitor.
- Knowledge base & decision history terkait.
- AI CFO untuk posisi kas grup saat ini (`docs/standards/consult-ai-cfo.md`).

## Proses (10 modul)
| # | Modul | Cara | File |
| --- | --- | --- | --- |
| 2 | Market opportunity | `/loonars-market` | `market.md` |
| 3 | Competitor simulation | Market Intelligence: reaksi 3 kompetitor utama, **[SIMULATED]** | `market.md` §reaksi |
| 4 | Consumer simulation | `/loonars-consumer` (`--quick` 20 dulu; 100 hanya bila founder setuju) | `panel/` |
| 5 | Financial projection | hospitality: `python3 tools/finance/hospitality.py inputs/hospitality.json --out hospitality.md`; non-hospitality: `tools/finance/unit_economics.py` | `hospitality.md` / `cfo.md` |
| 6 | Investment attractiveness | `python3 tools/finance/investment.py inputs/investment.json --out investment.md` (discount rate = ASSUMPTION founder) + dampak ke kas grup dari AI CFO | `investment.md` |
| 7 | Operational feasibility | metode `vendor/founder-skill/skills/founder-ops/SKILL.md` disesuaikan | `ops.md` |
| 8 | Risk assessment | `/financial-risk-analysis` + risk register ops | `risks.md` |
| 9 | Worst-case scenario | skenario `worst` hospitality.py + stress investment.py + "apa yang terjadi pada kas grup bila ini gagal total di bulan 6" (AI CFO) | `worst-case.md` |
| 10 | Alternative business model | ≥2 alternatif (mis. sewa jangka panjang vs harian, kemitraan/manajemen, jual leasehold, tunda) dihitung dengan tool yang sama | `alternatives.md` |
| 1 | Business feasibility | ringkasan + **verdict dihitung** (di bawah) | `feasibility.md` |

Input tool selalu ditulis ke `inputs/` dengan label per angka (dalam field
`source` atau `_labels`), dan setiap ASSUMPTION ditanyakan/dikonfirmasi ke
founder sebelum dipakai.

**Verdict (dihitung, tidak ditulis tangan)** dari output tool:
- `LAYAK` hanya bila semua: GOP/kontribusi base > 0; okupansi rata-rata base
  ≥ okupansi break-even + 10 poin; skenario downside GOP ≥ 0; NPV base ≥ 0
  pada discount rate founder; kas grup tidak defisit di skenario pesimis AI
  CFO setelah rencana; buy rate panel ≥ 25% (batas atas sintetis).
- `BELUM LAYAK` bila ada yang gagal — sebutkan cek yang gagal dan angkanya.
- `TIDAK LENGKAP` bila data kunci NEEDS DATA — sebutkan yang kurang dan
  skill yang mengisinya.
Jangan membulatkan angka gagal menjadi lulus.

## Output
`analyses/<slug>/` berisi file di atas, dan `feasibility.md` memakai
`docs/standards/output-format.md` dengan verdict & tabel cek di atas
Executive Summary. Lalu sarankan `/loonars-board` untuk keputusan.

## Batasan
- 100 persona = 100 sub-agent; minta izin founder. Selalu label SIMULATED.
- Tidak ada riset tanpa link. Tidak ada angka tanpa label.
- Ini bukan studi kelayakan resmi untuk bank/investor; sebutkan bila dokumen
  itu dibutuhkan.
