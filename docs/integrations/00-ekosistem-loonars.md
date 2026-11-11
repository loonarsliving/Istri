# Ekosistem Loonars & Posisi Advisor (Istri)

Disusun 2026-11-11 dari pembacaan **read-only** repo `loonarsliving/villa`
(`d9c5fd8`), `loonarsliving/Mkhsistem` (`9191c5b`) dan `loonarsliving/mkh-properti`
(`b09fd2a`). Tidak ada kode, data, atau credential repo tersebut yang disalin
ke sini. Klaim di bawah merujuk dokumen `docs/project-memory/` masing-masing
repo; verifikasi ulang sebelum dipakai untuk keputusan.

## 1. Peta sistem

| Repo | Aplikasi | Peran bisnis | Supabase | Sumber kebenaran untuk |
| --- | --- | --- | --- | --- |
| `villa` | Loonars Villa / "Loonars Private Living" | **Bagaimana bisnis berjalan** (Loonars 1, hospitality): booking, front desk, housekeeping, Cloudbeds/OTA, settlement OTA, pengajuan biaya, laporan investor, AI dynamic pricing (`docs/revenue-engine/`). | `svcmyb…` (dipakai bersama) | Operasi villa: booking, okupansi, ADR, channel, biaya operasional villa. |
| `Mkhsistem` | MK Connect (`mkh.haluoleo.id`) | Sistem internal grup: HR/absensi, CRM, penjualan unit (siteplan LNR2), konstruksi, refund, WA (Whacenter), layanan AI (Gemini), **FRIDAY** (executive intelligence) + **FRIDAY Holding** (connector per bisnis), asisten WA owner (tool `ai_cfo`). | `svcmyb…` | SDM, CRM, penjualan unit, konstruksi, eksekusi WA/AI. |
| `mkh-properti` | MKH Property (`finance.haluoleo.id`) | Keuangan: buku besar, modul Loonars 2 (4 rekening), laporan villa bulanan, laporan investor, **AI CFO** (`/cfo/*`). | `gluoioi…` | **Angka keuangan aktual & forecast** (L1, L2, holding). |
| `Istri` (repo ini) | Loonars AI Advisor | Board, mentor, simulasi, decision history. | — (belum ada) | **Tidak menjadi sumber kebenaran apa pun.** Hanya analisis + keputusan yang dikonfirmasi founder. |

Catatan dari repo tersebut (per 2026-11-01..10, label HISTORICAL):
- Lini aktif: **Loonars 1** (hospitality, Yogyakarta, sumber `villa`) dan
  **Loonars 2** (Loonars Living, developer & konstruksi). Holding:
  **PT Loonars Mahakarya** (nama baru PT MKH), laporan SAK EMKM, tahun buku
  resmi pertama 2027. (Sumber: Mkhsistem `CURRENT_STATE.md`, migrasi 0310/0311.)
- Loonars Coffee memakai keuangan Loonars 2 (Mkhsistem migrasi 0309).

## 2. AI CFO yang sudah ada — dan cara advisor memakainya

AI CFO tinggal di **mkh-properti** (`src/lib/cfo/`), dipanggil dari MK Connect
(tool WA `ai_cfo` → `POST finance.haluoleo.id/api/cfo/tanya-wa`) dan dari web
`/cfo/chat`. Narasi AI-nya memakai layanan AI MK Connect
(`/api/mkh-property/ai-cfo/narasi`, HMAC). Kemampuan yang terlihat di kode:

| Kemampuan AI CFO | Lokasi (mkh-properti) |
| --- | --- |
| Laporan L1, L2, holding (laba-rugi, PPh badan, penyusutan) | `loonars1.ts`, `loonars2.ts`, `holding.ts` |
| Forecast arus kas harian / 13 minggu / bulanan × 3 skenario (optimis/normal/pesimis) | `arus-kas.ts` |
| Kewajiban & prioritas pembayaran | `kewajiban.ts`, `kerja.ts` |
| **CEO challenger**: uji rencana pengeluaran owner → putusan `aman / waspada / tolak` + alternatif + "maks aman sekarang" | `penantang.ts` |
| Kesiapan investasi, unit economics, kualitas data, rekonsiliasi | `/cfo/kesiapan-investasi`, `/cfo/unit-economics`, `kontrol.ts` |
| Penjaga angka: setiap nominal di jawaban AI harus ada di daftar fakta | `chat.ts` (`validasiJawaban`) |

**Keputusan desain (ADR-6):** advisor **tidak menghitung ulang** angka aktual
Loonars. Untuk angka kas, laba, kewajiban, forecast, dan uji pengeluaran,
seat **CFO Advisor** dan skill `capital-allocation` / `financial-risk-analysis`
**berkonsultasi ke AI CFO** dan mengutip putusannya apa adanya
(`AMAN / WASPADA / TIDAK MENYARANKAN`). Tool keuangan di repo ini
(`tools/finance/`) hanya untuk **proyeksi ide baru** yang belum ada di buku
(mis. lokasi ekspansi), dan hasilnya selalu berlabel `PROJECTION`.

Jika putusan AI CFO dan analisis board berbeda, keduanya ditampilkan; board
tidak boleh "mengalahkan" angka AI CFO, hanya boleh menyebut asumsi yang
berbeda.

### Jalur akses (bertahap)

| Tahap | Cara | Status |
| --- | --- | --- |
| A — sekarang | Founder bertanya ke AI CFO (WA `ai_cfo` atau `/cfo/chat`), lalu menempel jawaban + tanggal ke `analyses/<slug>/inputs/ai-cfo.md`. Adapter `ManualSnapshotSource` membacanya. | Siap dipakai |
| B — Phase 5 | Endpoint baca khusus di mkh-properti (usulan `POST /api/cfo/advisor`, keluaran = `JawabanCfo` + `fakta[]` + `HasilEvaluasi`), auth rahasia terpisah khusus advisor, **hanya baca**. Adapter `AiCfoSource`. | Desain saja — butuh perubahan di repo mkh-properti + persetujuan owner |

## 3. Villa — "bagaimana bisnis berjalan"

Data operasional yang relevan untuk advisor (dibaca, tidak pernah ditulis):
okupansi / ADR / RevPAR bulanan, mix channel (OTA vs direct), komisi OTA,
opex villa, bagi hasil investor, status kamar, review/keluhan tamu, hasil
AI pricing engine. Sebagian sudah dikirim villa-api ke mkh-properti
(`laporan_villa_bulanan`, `ir_metrik_bulanan`).

**Aturan dari repo villa yang wajib dihormati:** apa pun yang menyentuh uang
(harga tamu, `villa_rates`, Cloudbeds/OTA push, payout investor, rumus di
`docs/revenue-engine/PHASE0-BASELINE.md` §2, saklar autopush AI pricing)
butuh persetujuan owner. Advisor **tidak pernah** mengirim harga atau
mengubah setting villa — hanya merekomendasikan.

Jalur: tahap A = ekspor/snapshot manual; tahap B = baca lewat FRIDAY Holding
connector atau ringkasan dari mkh-properti (bukan langsung ke tabel villa,
agar tidak ada sumber angka kedua).

## 4. MK Connect (Mkhsistem) — fitur yang dipakai ulang

| Fitur MK Connect | Dipakai advisor untuk |
| --- | --- |
| **FRIDAY Holding** (`lib/ai/friday/connectors/types.ts`): `BusinessSnapshot` dengan `metrics[]` ternormalisasi (`revenue`, `cash_balance`, `utilization`, …), `health: ok/degraded/unreachable`, `freshnessDays` | Format data lintas bisnis. Adapter `FridayHoldingSource` memakai **kontrak yang sama** sehingga advisor dan FRIDAY membaca angka yang identik. `unreachable` → `NEEDS DATA`, tidak pernah 0. |
| FRIDAY briefing (situasi → akar masalah → risiko → ≥3 alternatif → rekomendasi) | Input konteks untuk mentor; format 10 bagian advisor sejalan. |
| Action catalog FRIDAY (aksi hanya dari katalog, status `proposed`, butuh `friday.action_decide`) | Prinsip yang sama: advisor hanya **mengusulkan**; keputusan dicatat setelah founder konfirmasi. |
| WA (Whacenter) + asisten owner | Phase 5+: kemungkinan menambah tool `advisor` di asisten owner (perlu persetujuan; tidak dikerjakan sekarang). |
| `owner-knowledge.ts` (pengetahuan sistem & aturan owner) | Rujukan aturan owner; knowledge base advisor mencatat rujukannya, tidak menyalin isinya. |
| CRM, siteplan & penjualan unit LNR2, konstruksi, HR | Data untuk seat Marketing, Operations, Investment (penjualan leasehold/unit). |

Prinsip FRIDAY Holding yang diadopsi apa adanya: *setiap bisnis memegang
sumber kebenarannya sendiri; connector tanpa logika bisnis; data basi harus
membawa umurnya.*

## 5. Arah aliran data

```
villa (operasi L1) ──► mkh-properti (AI CFO: angka & putusan) ◄── Mkhsistem (CRM, unit, konstruksi, HR)
        │                         │                                    │
        └──── FRIDAY Holding (snapshot ternormalisasi) ◄───────────────┘
                                  │
                       read-only (Phase 5) / ekspor manual (sekarang)
                                  ▼
                      Istri — Loonars AI Advisor
          board · mentor · simulasi · decision history (keputusan founder)
```

Tidak ada panah keluar dari Istri ke sistem lain. Satu-satunya "output"
advisor adalah dokumen analisis dan keputusan yang dikonfirmasi founder.

## 6. Risiko integrasi khusus

- **Repo publik.** `Istri`, `villa`, `Mkhsistem`, `mkh-properti` semuanya
  **public**. Advisor tidak menyimpan angka keuangan aktual di repo ini
  sampai repo dibuat private (lihat `docs/phase-1/05-open-questions.md`).
- **Supabase `svcmyb…` dipakai bersama** oleh villa, MK Connect, dan aplikasi
  Catatanku lama. Advisor tidak menambah tabel di sana.
- Advisor tidak boleh menjadi sumber angka kedua: angka aktual selalu dikutip
  dari AI CFO / FRIDAY beserta tanggal ambilnya.
