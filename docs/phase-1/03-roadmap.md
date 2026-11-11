# Phase 1 — Development Roadmap & Acceptance Criteria

Aturan gerbang: **fase berikutnya hanya dimulai setelah founder menyetujui
acceptance criteria fase sebelumnya.** Status dicatat di tabel bawah.

| Fase | Status |
| --- | --- |
| Phase 1 — Audit | **Selesai, disetujui founder 2026-11-11** |
| Phase 2 — Foundation | **Selesai** kecuali review knowledge base oleh founder (P2-4) |
| Phase 3 — Advisory Engine | **Selesai** (P3-5 sebagian: skill feasibility belum dijalankan ujung-ke-ujung) |
| Phase 4 — Testing | **Dijalankan 2026-11-11**; menunggu penilaian founder (P4-3) |
| Phase 5 — Future Integration | **Selesai untuk tahap ini**: AI CFO aktif & teruji; FRIDAY Holding & villa desain lengkap (aktivasi = keputusan terpisah) |

## Phase 1 — Audit

Deliverable: `01-audit-founder-skill.md`, `02-architecture.md`, dokumen ini,
`04-dependencies-and-risks.md`, `05-open-questions.md`.

Acceptance criteria:
- [x] P1-1 Seluruh file upstream diinventaris (11 skill, 4 tool, 5 test, manifest, lisensi).
- [x] P1-2 Cara kerja tiap skill & mekanisme sub-agent didokumentasikan.
- [x] P1-3 Lisensi (MIT) dan kewajiban atribusi diidentifikasi.
- [x] P1-4 Dependencies diaudit (stdlib saja, tanpa network) secara statis.
- [x] P1-5 Gap analysis terhadap master instruction.
- [x] P1-6 Arsitektur dengan trade-off untuk keputusan besar (ADR-1..5).
- [x] P1-7 Roadmap dengan acceptance criteria per fase.
- [x] P1-8 Upstream tidak diubah; repo MKH/Villa tidak disentuh.
- [x] P1-9 Founder menyetujui ("lanjutkan semua", 2026-11-11); ADR-3 diubah, ADR-6/7 ditambah. Open questions data tetap terbuka.

## Phase 2 — Foundation

Pekerjaan:
1. Vendor `founder-skill@fd9385b` ke `vendor/` tanpa perubahan + `THIRD_PARTY_NOTICES.md`.
2. Jalankan test upstream (setelah izin eksekusi diberikan).
3. Adaptasi skill upstream yang dipilih (IDR, bahasa, path `analyses/<slug>/`, label data).
4. Tulis 8 custom skill (SKILL.md: instruksi, input, proses, output, batasan).
5. Bangun knowledge base: semua file dari master instruction, isi dari data
   yang diberikan founder; sisanya `NEEDS DATA`.
6. `decisions/_template.md` + `index.md`.
7. Interface `DataSource` + `ManualCsvSource` + stub lain.
8. `.gitignore`, secret scanning, CLAUDE.md berisi aturan kerja.

Acceptance criteria:
- [x] P2-1 Test upstream dijalankan setelah izin founder (2026-11-11): 29/29 lulus di `vendor/founder-skill`; `test_adapted_upstream` lulus; smoke test `tools/panel/panel.py` (brief IDR) berhasil.
- [x] P2-2 `vendor/founder-skill` identik dengan upstream `fd9385b` (`diff -r` kosong saat vendoring) dan LICENSE ada.
- [x] P2-3 8 custom skill + 3 skill adaptasi (mentor, board, consumer, market…) dengan 5 bagian wajib; diuji `test_repo.py`.
- [ ] P2-4 Knowledge base: semua file ada dengan status & label (diuji); **review founder belum**.
- [x] P2-5 Adapter tanpa operasi tulis; stub melempar `NotImplementedError` (diuji `test_adapters.py`).
- [x] P2-6 Secret scan (`test_repo.py`) bersih; `private/` & `.env*` di-ignore.
- [x] P2-7 Test struktur repo ada.

## Phase 3 — Advisory Engine

Pekerjaan: `loonars-mentor`, `loonars-board` (8 seat), `business-feasibility`
(10 modul), tool `hospitality.py`, `scenarios.py`, `investment.py`, decision
history workflow + `founder-decision-review`.

Acceptance criteria:
- [x] P3-1 Mentor mengutip file yang dibaca ("Dasar:") dan mengklasifikasikan masalah — uji 2026-11-11 (`private/analyses/2026-11-11-phase4/mentor-uji.md`).
- [x] P3-2 Board 8 seat sebagai sub-agent (kasus 1, 6 APPROVE IF · 2 REJECT, perbedaan dipertahankan); chair summary 10 bagian + confidence + unknowns.
- [x] P3-3 Anti-yes-man: REJECT di 3 dari 5 kasus; tidak ada belanja yang disetujui tanpa syarat.
- [x] P3-4 `hospitality.py` & `investment.py`: 9 unit test lulus; input kosong ditolak; output IDR berlabel PROJECTION. (`unit_economics.py` adaptasi belum dijalankan — lihat P2-1.)
- [x] P3-8 CFO seat & skill keuangan berkonsultasi ke AI CFO MKH Property (ADR-6), tidak menghitung ulang angka aktual.
- [~] P3-5 Worst-case & alternatif muncul di semua chair summary Phase 4; skill `business-feasibility` belum dijalankan ujung-ke-ujung (butuh riset pasar & panel).
- [x] P3-6 Hasil panel berlabel `[SIMULATED]` dan IDR (diuji `test_adapted_upstream.py`); reaksi kompetitor di skill market wajib berlabel SIMULATED.
- [x] P3-7 CONFIRMED wajib punya `confirmed_at` + `confirmed_by: founder` (diuji `test_repo.py`).

## Phase 4 — Testing dengan kasus nyata

Kasus (dari master instruction):
1. Apakah Loonars 2 layak dikembangkan lebih lanjut?
2. Apakah Loonars perlu ekspansi ke lokasi baru?
3. Bagaimana mengoptimalkan penjualan leasehold?
4. Fundraising vs internal capital?
5. Bagaimana meningkatkan occupancy dan profitability?

Acceptance criteria:
- [x] P4-1 Kelima kasus dijalankan 2026-11-11: versi publik tanpa angka `analyses/2026-11-11-phase4/README.md`; versi lengkap di `private/`.
- [x] P4-2 Angka dikutip dengan ID fakta AI CFO [F..]; turunan berlabel PROJECTION + rumus; data kosong NEEDS DATA.
- [ ] P4-3 Founder menilai tiap output (berguna / tidak, kritis cukup / tidak) — dicatat.
- [x] P4-4 Daftar perbaikan berprioritas di `analyses/2026-11-11-phase4/README.md`.

## Phase 5 — Future Integration (AI CFO aktif; lainnya desain)

Acceptance criteria:
- [x] P5-1 Katalog per sumber: `docs/integrations/04-katalog-data-dan-keamanan.md` (+ 01/02/03).
- [x] P5-2 Model ancaman T1–T8 & pengelolaan credential: dokumen yang sama.
- [x] P5-3 Satu-satunya koneksi produksi (AI CFO, hanya baca) diaktifkan atas persetujuan founder 2026-11-11; sumber lain tetap stub.
- [x] P5-4 Endpoint AI CFO advisor (disetujui founder 2026-11-11): **terpasang** — mkh-properti PR #61 + perbaikan #63 di-merge, migrasi 0072 diterapkan & diverifikasi, secret Vault dibuat oleh Claude (dibangkitkan di database), host `finance.haluoleo.id` diizinkan di environment. CLI: `tools/adapters/ai_cfo.py`. Uji produksi 2026-11-11: fakta (128 fakta), tanya, evaluasi (CEO challenger) OK; audit tercatat; endpoint lama tetap 401 tanpa kredensial.
