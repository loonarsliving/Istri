# Phase 1 — Rancangan Arsitektur Teknis

Status: **Disetujui founder 2026-11-11** ("lanjutkan semua"), dengan
perubahan ADR-3 (nama repo tetap Istri) dan tambahan ADR-6/ADR-7.
Dasar: `docs/00-master-instruction.md` dan `01-audit-founder-skill.md`.

## 1. Prinsip

1. **Skill-first, tanpa server.** Inti sistem = Claude Code skills (Markdown)
   + tool Python standard library + knowledge base Markdown di Git. Tanpa
   frontend, tanpa database, tanpa API key di Phase 2–4.
2. **Angka dihitung tool, bukan model.** Model menulis analisis; semua angka
   keuangan berasal dari tool deterministik dengan input yang bisa ditelusuri.
3. **Setiap data berlabel dan bersumber** (lihat §5).
4. **Kritis secara default.** Setiap skill wajib punya bagian risiko, skenario
   terburuk, dan opsi "jangan lakukan". Ketidaksepakatan board dipertahankan.
5. **Founder yang memutuskan.** AI tidak menyimpan keputusan final, tidak
   membuat transaksi, tidak menulis ke sistem produksi.
6. **Read-only integration** (Phase 5) lewat adapter dengan interface tetap.

## 2. Keputusan arsitektur utama (trade-off + rekomendasi)

### ADR-1 — Runtime: skill Claude Code vs aplikasi Agent SDK vs web app

| Opsi | Kelebihan | Kekurangan |
| --- | --- | --- |
| **A. Claude Code skills + Markdown KB** | Sesuai §8 master instruction; nol infrastruktur; sub-agent sudah tersedia; mudah diaudit di Git; upstream dibuat untuk ini. | Hanya dipakai lewat Claude Code; tidak ada UI untuk tim. |
| B. Aplikasi Agent SDK / API (backend Python/TS) | Bisa dijadwalkan, dipanggil dari sistem lain. | Butuh API key, hosting, biaya; melanggar "jangan bangun kompleks dulu". |
| C. Web app + DB | Ramah pengguna non-teknis. | Paling mahal; dilarang sebelum engine bekerja. |

**Rekomendasi: A** untuk Phase 2–4. B dipertimbangkan setelah Phase 4 jika
memang perlu otomasi. Skill dan tool ditulis agar bisa dipakai ulang oleh B.

### ADR-2 — Cara memakai upstream

| Opsi | Kelebihan | Kekurangan |
| --- | --- | --- |
| Install sebagai plugin | Update mudah. | Tidak bisa diadaptasi (IDR, hospitality); nama ter-namespace. |
| Git submodule | Jejak versi jelas. | Tetap tidak bisa diubah; submodule merepotkan. |
| **Vendor salinan pristine + skill adaptasi terpisah** | Upstream utuh & terlacak (commit `fd9385b`); adaptasi bebas; atribusi jelas. | Update upstream manual (diff terhadap vendor). |

**Rekomendasi: vendor.** `vendor/founder-skill/` = salinan **tanpa perubahan**
dari commit `fd9385b` + LICENSE asli. Skill yang dipakai Loonars ada di
`.claude/skills/`, masing-masing mencantumkan "Adapted from founder-skill
(MIT) @ fd9385b" di header.

### ADR-3 — Repository — **DIPUTUSKAN founder 2026-11-11**

Repo tetap bernama **Istri** selama pembangunan; di-rename menjadi
`loonars-ai-advisor` setelah semua fase selesai (GitHub me-redirect URL lama).
Aplikasi Catatanku lama tetap utuh di branch `claude/reminder-finance-app-yveciz`.

### ADR-4 — Lokasi knowledge base vs folder kerja upstream

Upstream memakai `founder/` sebagai **folder kerja per ide**; master
instruction menyarankan `founder/` untuk **profil perusahaan**. Bentrok nama.

**Rekomendasi:**
- Knowledge base permanen → `knowledge-base/` (sub-folder `company/` berisi file
  yang di master instruction ada di `founder/`).
- Setiap analisis/simulasi → `analyses/<YYYY-MM-DD>-<slug>/` (setara `founder/`
  upstream). Skill adaptasi menerima path ini sebagai argumen.

### ADR-5 — Penyimpanan data sensitif

Angka keuangan aktual Loonars adalah data sensitif. Opsi:
(a) commit ke repo private; (b) simpan di `private/` yang di-`.gitignore`,
repo hanya berisi placeholder & struktur; (c) enkripsi (git-crypt/sops).

**Rekomendasi: (a) repo private + (b) untuk dokumen paling sensitif**
(rekening, kontrak investor, data pribadi). Repo ini harus **private**
(perlu dicek founder). Tidak ada credential di mana pun.

### ADR-6 — AI CFO MKH Property sebagai sumber angka keuangan — **arahan founder 2026-11-11**

Founder: "di MKH Sistem sudah ada AI CFO, libatkan dia". AI CFO berada di repo
`mkh-properti` dan dipanggil dari MK Connect. Opsi: (a) advisor menghitung
ulang angka aktual sendiri; (b) advisor berkonsultasi ke AI CFO.
**Dipilih (b).** Menghitung ulang membuat dua sumber angka yang bisa berbeda
— persis masalah yang ingin dicegah FRIDAY. Seat CFO Advisor = **juru bicara
AI CFO di board**: mengutip fakta & putusannya, lalu menambahkan sudut pandang
strategis. `tools/finance/` hanya untuk ide baru di luar buku. Detail:
`docs/integrations/00-ekosistem-loonars.md`.

### ADR-7 — Keterhubungan erat dengan villa & Mkhsistem — **arahan founder 2026-11-11**

"Erat" diwujudkan sebagai **kontrak data bersama**, bukan kode bersama atau
akses tulis: adapter advisor memakai bentuk `BusinessSnapshot` / `metrics[]`
FRIDAY Holding, dan referensi silang ke aturan masing-masing repo. Semua akses
read-only; tahap sekarang = ekspor manual, tahap Phase 5 = endpoint baca
khusus. Advisor tidak pernah menulis ke villa, MK Connect, atau MKH Property.

## 3. Lapisan sistem

```
┌───────────────────────────────────────────────────────────────┐
│ Founder (Claude Code)                                          │
└──────────────┬────────────────────────────────────────────────┘
               │ /loonars-mentor  /loonars-board  /business-feasibility ...
┌──────────────▼────────────────────────────────────────────────┐
│ B. BUSINESS MENTOR  (loonars-mentor)                           │
│   - klasifikasi masalah: strategis/operasional/keuangan/       │
│     organisasi/eksekusi                                        │
│   - baca knowledge-base + decision history dulu                │
│   - memutuskan: jawab langsung / panggil board / simulasi      │
└──────┬───────────────────────┬────────────────────────────────┘
       │                       │
┌──────▼──────────────┐  ┌─────▼──────────────────────────────────┐
│ A. AI BOARD         │  │ C. SIMULATION ENGINE                    │
│ 8 seat = 8 sub-agent│  │ 10 modul; tool Python deterministik     │
│ memo + skor + vote  │  │ (unit economics, hospitality model,     │
│ chair summary       │  │  scenario/worst-case, panel, pricing)   │
└──────┬──────────────┘  └─────┬──────────────────────────────────┘
       │                       │
┌──────▼───────────────────────▼────────────────────────────────┐
│ KNOWLEDGE BASE (Markdown, Git)  +  DECISION HISTORY            │
│ knowledge-base/  analyses/  decisions/                          │
└──────────────────────────────┬────────────────────────────────┘
                               │ (Phase 5, read-only)
┌──────────────────────────────▼────────────────────────────────┐
│ D. BUSINESS INTELLIGENCE ADAPTERS                              │
│ interface DataSource → ManualCsv (Phase 2) | Supabase | MKH |  │
│ Cloudbeds | OTA  (stub, tanpa koneksi produksi)                │
└───────────────────────────────────────────────────────────────┘
```

## 4. Komponen

### 4.1 AI Board of Directors — skill `loonars-board`

8 seat, masing-masing satu file lens di `.claude/skills/loonars-board/seats/`:

| Seat | Sumber | Pertanyaan inti |
| --- | --- | --- |
| Chairman | baru (+ lens Monopoly upstream untuk durability) | Apakah ini sesuai arah 5–10 tahun & prioritas? Apa yang dikorbankan? |
| CEO Advisor | baru | Bagaimana tumbuh, organisasi siapa yang menjalankan? |
| CFO Advisor | **AI CFO MKH Property** (angka aktual, forecast, CEO challenger) + upstream `founder-cfo` (ide baru) | Cashflow, margin, break-even, kebutuhan kas, sensitivitas. Mengutip putusan AI CFO apa adanya. |
| Investment Advisor | baru | Valuasi, struktur modal, dilusi, kesiapan investor. |
| Market Intelligence | upstream `founder-competitors` | Siapa kompetitor, berapa harga mereka, di mana gap? |
| Consumer Panel | upstream `founder-consumer` (hasil panel, bukan sub-agent opini) | Apa kata tamu/pembeli sintetis? (berlabel SIMULATED) |
| Marketing Director | upstream `founder-marketing` / `founder-offer` | Channel, funnel, direct vs OTA, positioning. |
| Operations Director | upstream `founder-ops` | Bisakah dijalankan, SOP, SDM, skalabilitas? |

Alur (sama seperti upstream): brief mandiri → sub-agent paralel (maks. ±10
per pesan) → memo terstruktur (skor 1–10, top-3 risiko, vote
**APPROVE / APPROVE IF / REJECT**, data yang kurang) → chair summary dengan
format rekomendasi 10 bagian (§6). Mode `--quick` = 3 seat paling relevan.

### 4.2 Business Mentor — skill `loonars-mentor`

- Selalu membaca `knowledge-base/company/*`, `decisions/index.md`, dan keputusan
  terkait sebelum menjawab.
- Langkah pertama: klasifikasikan masalah (5 kategori) + sebutkan data yang
  belum ada.
- Wajib menyebut asumsi founder yang dinilai lemah, dan pola dari keputusan
  lampau (mis. "keputusan serupa D-2026-003 hasilnya di bawah ekspektasi").
- Bisa merekomendasikan `/loonars-board` atau `/business-feasibility`.
- "Persistent" = file di Git; tidak ada memori tersembunyi.

### 4.3 Business Simulation Engine — skill `business-feasibility` (orkestrator)

| # | Modul | Implementasi |
| --- | --- | --- |
| 1 | Business feasibility | ringkasan + verdict dihitung (adaptasi `compile.py`) |
| 2 | Market opportunity | `founder-competitors` adaptasi + data publik berlink |
| 3 | Competitor simulation | Market Intelligence: reaksi kompetitor (berlabel SIMULATED) |
| 4 | Consumer simulation | `panel.py` adaptasi, ≤100 persona, label SIMULATED |
| 5 | Financial projection | `tools/finance/` (unit economics + model hospitality) |
| 6 | Investment attractiveness | `tools/finance/investment.py` (NPV, IRR, payback, multiple) |
| 7 | Operational feasibility | `founder-ops` adaptasi |
| 8 | Risk assessment | `financial-risk-analysis` + risk register |
| 9 | Worst-case scenario | `tools/finance/scenarios.py` (base / downside / worst, stress test) |
| 10 | Alternative business model | board + mentor: min. 2 alternatif, dibandingkan dengan angka |

Tool baru (Python stdlib, ditulis + diuji di Phase 3):
- `hospitality.py`: input per unit/villa: jumlah unit, ADR per bulan (musiman),
  occupancy per bulan, komisi OTA %, mix channel, biaya variabel per
  room-night, biaya tetap. Output: RevPAR, revenue, GOP, break-even occupancy.
- `scenarios.py`: menjalankan model dengan set asumsi base/downside/worst.
- `investment.py`: NPV, IRR, payback, cash-on-cash; leasehold (harga, sisa
  masa sewa, skema cicilan).
- Format mata uang: **IDR** default, bisa diganti (`currency` di input).

### 4.4 Decision History

```
decisions/
  index.md                     tabel semua keputusan + status
  _template.md                 format 11 field dari master instruction
  D-2026-001-<slug>.md
```

Status siklus hidup: `DRAFT` (ditulis AI) → `PROPOSED` → `CONFIRMED`
(**hanya setelah founder menyatakan eksplisit**) → `REVIEWED` (actual outcome +
lessons diisi). Juga `REJECTED` / `SUPERSEDED`. Skill `founder-decision-review`
membaca keputusan lama, membandingkan expected vs actual, mencari pola.
AI tidak pernah mengubah status ke `CONFIRMED` tanpa konfirmasi founder di
percakapan yang sama, dan mencatat tanggal konfirmasi.

### 4.5 Business Intelligence adapters (desain Phase 2, implementasi stub)

```python
class DataSource(Protocol):
    name: str
    def describe(self) -> SourceInfo: ...            # pemilik, sistem, read-only?
    def fetch(self, dataset: str, period: Period) -> Records: ...
```

- Setiap `Records` membawa metadata: `source`, `dataset`, `period`,
  `retrieved_at`, `label` (ACTUAL/HISTORICAL). → traceability.
- Phase 2: `ManualSnapshotSource` membaca ekspor/tempelan (JSON/Markdown) di
  `private/data/` atau `analyses/<slug>/inputs/`.
- **Aktif** (2026-11-11): `AiCfoSource` → `POST finance.haluoleo.id/api/cfo/advisor`
  (hanya baca; CLI `tools/adapters/ai_cfo.py`).
- Phase 5 (stub, melempar `NotImplementedError`): `FridayHoldingSource` (MK Connect, kontrak `BusinessSnapshot`), `VillaSource`,
  `SupabaseSource`, `CloudbedsSource`, `OtaSource`. **Tidak ada koneksi
  produksi** sampai founder menyetujui.
- Tidak ada method `write/update/delete` di interface — read-only by design.

## 5. Knowledge base dan label data

```
knowledge-base/
  company/   company-profile, business-model, company-structure,
             financial-position, strategic-goals, investment-history
  projects/  loonars-1, loonars-2, loonars-3, expansion-plan
  hospitality/ pricing-strategy, occupancy-strategy, operations
  market/    competitor-analysis, market-opportunity
  _data-labels.md
```

(`decision-history.md` di master instruction → folder `decisions/`, agar satu
file per keputusan.)

Setiap angka ditulis dengan label, periode, dan sumber:

| Label | Arti | Contoh penulisan |
| --- | --- | --- |
| `ACTUAL` | Data tercatat dari sistem/dokumen | `Occupancy 72% [ACTUAL · Jan–Mar 2026 · sumber: Cloudbeds export 2026-04-02]` |
| `HISTORICAL` | Data lampau, mungkin sudah tidak berlaku | `[HISTORICAL · FY2024 · laporan keuangan audited]` |
| `ASSUMPTION` | Asumsi founder, belum terverifikasi | `[ASSUMPTION · founder · 2026-11-11]` |
| `PROJECTION` | Hasil hitung AI/tool dari input berlabel | `[PROJECTION · tool hospitality.py · input: ...]` |
| `SIMULATED` | Output persona sintetis | `[SIMULATED · panel seed 7 · n=100 · bukan survei nyata]` |
| `NEEDS DATA` | Belum ada informasi | `NEEDS DATA — dibutuhkan: ..., pemilik data: ...` |

Aturan: angka tanpa label dianggap tidak valid. Projection tidak boleh
dibulatkan menjadi actual.

## 6. Format output strategis (wajib di chair summary & mentor)

1. Executive Summary · 2. Situation Analysis · 3. Opportunities · 4. Risks ·
5. Financial Implications · 6. Board Perspectives · 7. Alternative Scenarios ·
8. Recommended Decision · 9. Execution Plan · 10. KPIs to Monitor ·
\+ **Confidence level** (Low/Medium/High + alasan) · **Unknowns / data yang
dibutuhkan** · disclaimer bukan nasihat finansial/hukum/pajak.

## 7. Struktur repository target (Phase 2)

```
README.md  CLAUDE.md  THIRD_PARTY_NOTICES.md  .gitignore
docs/                         master instruction, phase docs, ADR
vendor/founder-skill/         upstream pristine @ fd9385b (+ LICENSE)
.claude/skills/
  loonars-board/              SKILL.md, seats/*.md
  loonars-mentor/
  business-feasibility/
  investor-strategy/  hospitality-strategy/  capital-allocation/
  founder-decision-review/  strategic-planning/  financial-risk-analysis/
  loonars-consumer/ loonars-cfo/ loonars-competitors/ ...  (adaptasi upstream)
tools/
  finance/   unit_economics.py (adapt), hospitality.py, scenarios.py, investment.py
  panel/     panel.py (adapt), van_westendorp.py
  adapters/  base.py, manual_csv.py, supabase_stub.py, mkh_stub.py, ...
tests/
knowledge-base/  decisions/  analyses/
private/      (.gitignore — tidak pernah di-commit)
```

## 8. Keamanan & data governance (pemetaan ke §9 master instruction)

| Aturan | Mekanisme |
| --- | --- |
| Tidak mengubah data produksi MKH | Interface adapter tanpa operasi tulis; Phase 2–4 tanpa koneksi sama sekali. |
| Integrasi read-only default | Role DB read-only; adapter menolak SQL non-SELECT; review sebelum aktif. |
| Tanpa credential di source | Env var / secret manager; `.gitignore` untuk `.env*`, `private/`; cek pre-commit (mis. gitleaks) di Phase 2. |
| Tidak mengekspos data sensitif | Repo private; `private/` lokal; panel/board sub-agent hanya menerima brief yang perlu. |
| Traceability | Label + periode + sumber per angka; metadata `Records`. |
| Tanpa transaksi/keputusan otomatis | Tidak ada tool yang bisa transaksi; keputusan butuh status `CONFIRMED` dari founder. |
