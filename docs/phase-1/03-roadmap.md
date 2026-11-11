# Phase 1 — Development Roadmap & Acceptance Criteria

Aturan gerbang: **fase berikutnya hanya dimulai setelah founder menyetujui
acceptance criteria fase sebelumnya.** Status dicatat di tabel bawah.

| Fase | Status |
| --- | --- |
| Phase 1 — Audit | **Selesai, menunggu review founder** |
| Phase 2 — Foundation | Belum dimulai |
| Phase 3 — Advisory Engine | Belum dimulai |
| Phase 4 — Testing | Belum dimulai |
| Phase 5 — Future Integration (desain) | Belum dimulai |

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
- [ ] P1-9 Founder menyetujui ADR-1..5 dan menjawab open questions prioritas tinggi.

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
- [ ] P2-1 Test upstream dijalankan dan hasilnya dicatat (lulus/gagal apa adanya).
- [ ] P2-2 `vendor/founder-skill` identik dengan upstream `fd9385b` (diff kosong) dan LICENSE ada.
- [ ] P2-3 8 custom skill ada, masing-masing punya 5 bagian wajib; frontmatter valid.
- [ ] P2-4 Setiap file knowledge base ada; tidak ada angka tanpa label + periode + sumber; tidak ada angka karangan (direview founder).
- [ ] P2-5 Interface adapter tidak memiliki operasi tulis; stub produksi melempar `NotImplementedError`.
- [ ] P2-6 Secret scan bersih; `private/` & `.env*` di-ignore.
- [ ] P2-7 Test otomatis untuk struktur repo (frontmatter, file wajib, label data).

## Phase 3 — Advisory Engine

Pekerjaan: `loonars-mentor`, `loonars-board` (8 seat), `business-feasibility`
(10 modul), tool `hospitality.py`, `scenarios.py`, `investment.py`, decision
history workflow + `founder-decision-review`.

Acceptance criteria:
- [ ] P3-1 Mentor selalu mengutip file knowledge base/decision yang dibaca, dan mengklasifikasikan masalah ke 5 kategori.
- [ ] P3-2 Board menjalankan 8 seat sebagai sub-agent; chair summary memakai format 10 bagian + confidence + unknowns; ketidaksepakatan dipertahankan.
- [ ] P3-3 Setidaknya satu uji di mana board/mentor **menolak** ide yang buruk secara angka (anti-yes-man test).
- [ ] P3-4 Tool finansial: unit test lulus; input kosong ditolak, bukan ditebak; output IDR.
- [ ] P3-5 Worst-case & alternative model selalu muncul di output feasibility.
- [ ] P3-6 Output consumer/competitor simulation berlabel `SIMULATED`.
- [ ] P3-7 Keputusan hanya menjadi `CONFIRMED` setelah konfirmasi eksplisit founder (diuji).

## Phase 4 — Testing dengan kasus nyata

Kasus (dari master instruction):
1. Apakah Loonars 2 layak dikembangkan lebih lanjut?
2. Apakah Loonars perlu ekspansi ke lokasi baru?
3. Bagaimana mengoptimalkan penjualan leasehold?
4. Fundraising vs internal capital?
5. Bagaimana meningkatkan occupancy dan profitability?

Acceptance criteria:
- [ ] P4-1 Kelima kasus dijalankan; hasil di `analyses/`.
- [ ] P4-2 Setiap angka aktual punya sumber; asumsi tak terverifikasi ditandai.
- [ ] P4-3 Founder menilai tiap output (berguna / tidak, kritis cukup / tidak) — dicatat.
- [ ] P4-4 Daftar perbaikan dari hasil uji dibuat dan diprioritaskan.

## Phase 5 — Future Integration (desain saja)

Acceptance criteria:
- [ ] P5-1 Dokumen desain per sumber (MKH, Supabase, Cloudbeds, OTA, laporan keuangan & operasional): dataset, field, frekuensi, pemilik, cara akses read-only.
- [ ] P5-2 Model ancaman & rencana pengelolaan credential.
- [ ] P5-3 Tidak ada koneksi produksi di kode; aktivasi butuh persetujuan tertulis founder.
