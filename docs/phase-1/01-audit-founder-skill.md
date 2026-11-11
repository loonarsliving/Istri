# Phase 1 — Laporan Audit `founder-skill`

| | |
| --- | --- |
| Repository | <https://github.com/Jakeschincariol/founder-skill> |
| Commit yang diaudit | `fd9385b` (2026-10-06, Jake Schincariol) — "The Founder skill: 11 Claude skills, v1.0" |
| Riwayat | Hanya **1 commit**. Versi plugin `1.0.0`. |
| Tanggal audit | 2026-11-11 |
| Metode | Clone read-only ke scratchpad sementara, baca seluruh file. **Kode Python upstream tidak dijalankan** (eksekusi kode dari luar diblokir oleh kebijakan sesi ini); unit test upstream dibaca, belum dieksekusi. Lihat §8. |
| Perubahan ke upstream | Tidak ada. Repo upstream tidak di-fork, tidak diubah. |

## 1. Ringkasan eksekutif

- Upstream berisi **11 skill** Claude (bukan lebih, bukan kurang), **4 tool
  Python** berbasis standard library saja, **5 file test**, 2 manifest plugin,
  README, dan lisensi **MIT**.
- Tidak ada dependency eksternal (tanpa `pip install`, tanpa network, tanpa API
  key). Butuh Python ≥ 3.8 dan Claude Code (untuk sub-agent).
- Desainnya dibuat untuk **satu ide bisnis baru (pre-launch), konsumen ritel,
  mata uang USD**, contoh kafe matcha di Toronto. Belum ada konsep: perusahaan
  yang sudah berjalan, portofolio beberapa properti, hospitality (ADR,
  occupancy, RevPAR, musim), leasehold, valuasi, fundraising, atau decision
  history.
- Nilai terbesar yang bisa diambil untuk Loonars: (1) pola **board berbasis
  sub-agent paralel** dengan memo terstruktur dan voting, (2) **consumer panel
  sintetis** yang deterministik (seed) dan jujur soal keterbatasannya, (3)
  **unit economics** yang menolak menebak angka, (4) **verdict yang dihitung**,
  bukan ditulis tangan.
- Kesimpulan: upstream **layak dipakai sebagai fondasi**, tetapi sebagian besar
  kebutuhan master instruction (8 board role, mentor, investment, hospitality,
  decision history, BI adapter) **belum ada** dan harus dibangun sendiri.

## 2. Struktur repository

```
.claude-plugin/
  marketplace.json        manifest marketplace Claude Code
  plugin.json             manifest plugin (name, version 1.0.0, license MIT)
skills/
  founder-board/          SKILL.md, lenses.md
  founder-competitors/    SKILL.md
  founder-consumer/       SKILL.md, panel.py, customer.example.json, pitch.example.md
  founder-pricing/        SKILL.md, van_westendorp.py
  founder-offer/          SKILL.md
  founder-cfo/            SKILL.md, unit_economics.py, example.json
  founder-marketing/      SKILL.md
  founder-brand/          SKILL.md
  founder-ops/            SKILL.md
  founder-launch/         SKILL.md
  founder-plan/           SKILL.md, compile.py
tests/
  _load.py, test_compile.py, test_panel.py, test_pricing.py,
  test_repo.py, test_unit_economics.py
LICENSE  README.md  .gitignore
```

Total ±122 KB. File terbesar: `panel.py` (19 KB), `unit_economics.py` (12 KB).

## 3. Cara kerja umum

1. Setiap skill adalah `SKILL.md` dengan frontmatter `name`, `description`
   (trigger phrase), dan `argument-hint`. Dipanggil sebagai `/founder-<nama>`.
2. Semua skill berbagi **satu folder kerja `founder/`** di project user. Tiap
   skill membaca output skill sebelumnya dan menulis file miliknya sendiri.
3. Urutan yang disarankan:
   `board → competitors → consumer → pricing → offer → cfo → marketing → brand → ops → launch → plan`.
   Setiap skill juga bisa berdiri sendiri.
4. **Simulasi multi-perspektif** dilakukan dengan **sub-agent** (Agent tool,
   `subagent_type: general-purpose`): board = 3 sub-agent paralel; consumer
   panel = 1 sub-agent per pembeli, gelombang 10 sekaligus. Sub-agent tidak
   melihat percakapan, jadi skill selalu menulis **brief mandiri** ke file dulu.
5. Angka dihitung oleh tool Python, bukan oleh model. Model hanya menulis
   narasi di atas output tool.

## 4. Audit per skill

| Skill | Fungsi | Input → Output | Tool | Relevansi Loonars |
| --- | --- | --- | --- | --- |
| `founder-board` | 3 board member (sub-agent), masing-masing satu "lens": **Offers** (ringkasan *$100M Offers*), **Monopoly** (*Zero to One*), **Product** (biografi Steve Jobs). Skor 1–10, risiko top-3, vote FUND / FUND IF / PASS, ringkasan chair. | `founder/idea.md` → `founder/board/*.md`, `founder/board.md` | – | **Tinggi** sebagai pola. Lens-nya consumer/startup; perlu ditambah lens Chairman, CEO, CFO, Investment, Ops untuk hospitality. |
| `founder-competitors` | Peta kompetitor direct / indirect / substitute dari **sumber publik dengan link**, keluhan review, positioning map, "the gap". | `idea.md` → `competitors.csv`, `competitors.md` | – (butuh web) | **Tinggi** → Market Intelligence (villa lain, OTA listing). |
| `founder-consumer` | Panel pembeli sintetis (default 100, `--quick` 20). Kartu persona dideal deterministik dari `customer.json`; 1 sub-agent per pembeli; jawaban JSON tervalidasi; tally per segmen. | `customer.json`, `pitch.md` → `panel/` (cards, briefs, answers, results) | `panel.py` | **Tinggi** → Consumer Panel (tamu villa, pembeli leasehold). Template brief memakai "$ per tahun". |
| `founder-pricing` | Van Westendorp (PMC, OPP, IPP, PME) dari 4 jawaban harga per pembeli atau CSV survei nyata; bandingkan dengan kompetitor & margin CFO. | `panel/answers` → `pricing-curve.md`, `pricing.md` | `van_westendorp.py` | **Sedang**. Harga villa sangat musiman dan dinamis (OTA); VW cocok untuk paket/harga dasar, bukan revenue management harian. |
| `founder-offer` | Offer stack (bonus, garansi, urgensi asli, nama) berbasis Offers lens, value equation, lalu re-test di panel. | `panel/results.md`, `numbers.json` → `offer.md`, `pitch.md` | – | **Sedang** → paket menginap / paket leasehold. |
| `founder-cfo` | Unit economics: kontribusi per unit, break-even per hari, margin di volume rencana, tahun-1 bulanan, cash needed, payback, 3 what-if (harga −10%, volume −20%, biaya variabel +15%). Menolak field kosong. | `numbers.json` → `cfo.md`, `cfo-sources.md` | `unit_economics.py` | **Tinggi** sebagai inti, tetapi model satu-unit/satu-harga/USD. Lihat gap §6. |
| `founder-marketing` | Positioning, channel, kalender kampanye 30 hari, 10 hook, budget, max CAC. | panel, competitors, pricing → `marketing.md` | – | **Sedang** → Marketing Director (direct booking vs OTA). |
| `founder-brand` | Nama, cek trademark/domain/handle, voice, look brief. | → `brand.md` | – | **Rendah**: brand Loonars sudah ada. |
| `founder-ops` | Supplier, staffing, SOP, tools, perizinan, risk register 10 item. | → `ops.md` | – | **Sedang-Tinggi** → Operations Director (housekeeping, maintenance, SOP villa). |
| `founder-launch` | Real-world test murah dulu, countdown bertanggal, run sheet, review 30 hari. | → `launch.md` | – | **Sedang** → peluncuran proyek baru (mis. Loonars 3). |
| `founder-plan` | Menggabungkan semua output menjadi business plan; **verdict dihitung**: Profitable / Not yet / Incomplete dari 4 cek (kontribusi > 0, tahun-1 laba, break-even ≤ kapasitas, buy rate panel ≥ 25%). | semua `founder/*` → `business-plan.md`, `summary.md`, `one-pager.md` | `compile.py` | **Tinggi** sebagai pola "verdict dihitung", tetapi cek-nya perlu diganti untuk hospitality/investasi. |

## 5. Audit tool Python

| Tool | Isi | Catatan |
| --- | --- | --- |
| `unit_economics.py` | Fungsi murni `analyse(spec, price, volume)`; error `NumbersError` untuk input hilang/salah; flag: harga < biaya variabel, break-even > kapasitas, rencana > kapasitas, tahun-1 rugi, payback > 12 bulan; output Markdown / JSON. | Format uang **hard-coded `$`** (`_money`, `_whole`). Satu harga untuk 12 bulan (tidak ada harga musiman). Tidak ada pajak, depresiasi, financing, atau multi-unit. |
| `panel.py` | Subcommand `init`, `prompts`, `check`, `save`, `tally`. `deal()` deterministik (`random.Random(seed)`, default seed 7), kuota segmen/perilaku eksak. Validasi jawaban (reason code dari daftar tetap: price, habit, need, trust, quality, convenience, timing, values, other). Tidak pernah menjawab atas nama pembeli. | Template `BRIEF` berbahasa Inggris dan memakai `${income:,} a year`. Perlu varian IDR/bahasa dan persona tamu internasional. |
| `van_westendorp.py` | Membaca folder jawaban panel atau CSV survei nyata; buang baris tidak urut/tidak lengkap; hitung PMC/OPP/IPP/PME. | Mendukung data survei **nyata** — bagus untuk validasi kelak. |
| `compile.py` | Memuat `unit_economics.py` via `importlib`; menyusun section; verdict + `--check` (exit code 0/1). | Daftar section dan cek hard-coded untuk 11 skill upstream. |

**Keamanan statis**: import yang dipakai hanya `argparse, csv, glob, importlib,
json, math, os, random, re, sys` (+ `unittest, tempfile, shutil` di test).
Tidak ditemukan `subprocess`, `socket`, `urllib`, `requests`, `eval`, `exec`
pada input user, atau akses network. File I/O hanya ke path yang diberikan.
Risiko supply-chain: **rendah**.

## 6. Gap analysis terhadap master instruction

| Kebutuhan master instruction | Ada di upstream? | Catatan |
| --- | --- | --- |
| Chairman / Board Director | Sebagian | Pola board ada; lens arah perusahaan jangka panjang / governance belum. |
| CEO Advisor | Tidak | Perlu dibuat (growth, ekspansi, organisasi). |
| CFO Advisor | Sebagian | Unit economics ada; cashflow perusahaan berjalan, forecasting multi-tahun, capital allocation belum. |
| Investment Advisor | **Tidak** | Valuasi, fundraising, PE, convertible note, IPO readiness: tidak ada sama sekali. |
| Market Intelligence | Ya | `founder-competitors` (perlu konteks hospitality/OTA). |
| Consumer Panel | Ya | `founder-consumer` + `founder-pricing`. |
| Marketing Director | Ya | `founder-marketing`, `founder-offer`, `founder-brand`. |
| Operations Director | Ya | `founder-ops` (konteks pre-launch, bukan operasi berjalan). |
| Business Mentor + memori | **Tidak** | Upstream stateless per ide; tidak ada knowledge base perusahaan. |
| Simulation engine 10 analisis | Sebagian | Ada: feasibility, market, competitor, consumer, financial projection, ops, risk (ops). Belum: investment attractiveness, **worst-case scenario** terstruktur, alternative business model. |
| Decision history | **Tidak** | Harus dibuat dari nol. |
| Format rekomendasi 10 bagian + confidence | Tidak | Upstream punya format sendiri per skill. |
| Label data (actual/historical/assumption/projection/simulated) | Sebagian | Upstream membedakan "estimate" vs sumber, dan label "simulated buyers". Belum 5 kategori + tanggal/periode. |
| BI adapters (MKH, Supabase, Cloudbeds, OTA) | **Tidak** | Upstream sengaja tanpa network. |
| Hospitality metrics (ADR, occupancy, RevPAR, musim, komisi OTA, leasehold) | **Tidak** | Model unit_economics bisa dipaksa (unit = room-night, kapasitas = jumlah unit), tetapi harga musiman, komisi % dan leasehold tidak didukung. |
| Mata uang IDR | Tidak | `$` hard-coded di dua tool. |

## 7. Lisensi dan atribusi

- **MIT License**, Copyright (c) 2026 Jake Schincariol. Bebas dipakai, diubah,
  didistribusikan, termasuk komersial.
- Kewajiban: **sertakan notice copyright dan teks lisensi MIT** di setiap salinan
  atau bagian substansial. Akan dipenuhi dengan file `THIRD_PARTY_NOTICES.md`
  + `LICENSE` asli di folder vendor (Phase 2).
- Catatan non-lisensi dari upstream yang ikut kita pertahankan: board **tidak
  boleh berbicara sebagai** Hormozi/Thiel/Jobs, hanya menerapkan ringkasan
  framework publik; hasil panel bukan testimoni; bukan nasihat finansial/hukum/
  pajak. Upstream tidak berafiliasi dengan tokoh tersebut, begitu pula proyek ini.
- Kode Loonars sendiri: lisensi **belum ditentukan** (lihat open questions).
  Rekomendasi: private / proprietary, karena repo akan berisi knowledge base
  bisnis.

## 8. Yang belum terverifikasi dalam audit ini

- Unit test upstream (`python3 -m unittest discover -s tests`) **belum
  dijalankan**; eksekusi kode eksternal diblokir oleh kebijakan auto-mode sesi.
  Klaim "test lulus" belum bisa dibuat. Akan dijalankan di awal Phase 2 setelah
  diizinkan (acceptance criterion P2-1).
- Angka contoh README (break-even 186 cup/hari, margin 38%, dst.) tidak
  diverifikasi ulang karena alasan yang sama.
- Perilaku sub-agent (Agent tool) hanya dibaca dari instruksi, belum diuji.

## 9. Rekomendasi reuse

| Upstream | Keputusan | Alasan |
| --- | --- | --- |
| `founder-board` + `lenses.md` | **Adapt** → `loonars-board` dengan 8 seat | Pola memo + vote + "pertahankan ketidaksepakatan" sangat cocok. |
| `founder-consumer` + `panel.py` | **Adapt** (IDR, bahasa, persona tamu/pembeli leasehold) | Mesin deterministik & jujur; ini jantung consumer simulation. |
| `founder-cfo` + `unit_economics.py` | **Adapt + extend** (IDR, harga musiman, komisi %, multi-unit) | Prinsip "angka dari input, bukan tebakan". |
| `founder-pricing` + `van_westendorp.py` | **Reuse hampir apa adanya** (format IDR) | Bisa pakai data survei nyata. |
| `founder-competitors` | **Adapt** (OTA, villa sekitar) | Aturan "sumber publik + link" dipertahankan. |
| `founder-ops`, `founder-marketing`, `founder-offer`, `founder-launch` | **Adapt ringan** | Dipakai oleh seat Ops & Marketing. |
| `founder-plan` + `compile.py` | **Adapt** (cek verdict hospitality & investasi) | Pola verdict dihitung. |
| `founder-brand` | **Vendor saja, tidak diaktifkan** | Brand sudah ada. |
