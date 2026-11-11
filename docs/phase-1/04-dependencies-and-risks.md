# Phase 1 — Dependencies & Risiko

## Dependencies

| Dependency | Dipakai untuk | Status / catatan |
| --- | --- | --- |
| Claude Code (dengan Agent tool / sub-agent) | Menjalankan skill, board & panel paralel | Wajib. Panel 100 persona = 100 panggilan sub-agent (biaya & waktu). |
| Python ≥ 3.8, standard library | Tool finansial, panel, pricing | Tanpa `pip install`. |
| `founder-skill` @ `fd9385b` (MIT) | Fondasi skill & tool | Single commit, v1.0; belum ada riwayat maintenance. Kita vendor agar tidak bergantung pada repo upstream tetap tersedia. |
| GitHub (repo private) | Version control, knowledge base | Visibilitas repo perlu dikonfirmasi private. |
| Akses web (Phase 2+) | Market intelligence dari sumber publik | Tergantung network policy environment. |
| Supabase, MKH Sistem, Cloudbeds, OTA | Sumber data (Phase 5) | **Belum** dipakai. Butuh akses read-only & persetujuan. |
| Data dari founder | Isi knowledge base | Penghambat utama — tanpa data, sebagian besar file `NEEDS DATA`. |

## Risiko

| # | Risiko | Dampak | Kemungkinan | Mitigasi |
| --- | --- | --- | --- | --- |
| R1 | AI menjadi yes-man / terlalu optimis | Tinggi | Sedang | Instruksi kritis per seat, vote REJECT eksplisit, worst-case wajib, uji anti-yes-man (P3-3). |
| R2 | Angka dikarang / projection dianggap actual | Tinggi | Sedang | Angka hanya dari tool + input berlabel; test label data; review founder. |
| R3 | Hasil panel sintetis dianggap riset pasar nyata | Tinggi | Sedang | Label `SIMULATED` wajib; buy rate sebagai batas atas; rekomendasi validasi nyata. |
| R4 | Kebocoran data finansial / credential ke GitHub | Tinggi | Rendah-Sedang | Repo private, `private/` di-ignore, secret scan, tanpa credential di kode. |
| R5 | Integrasi tidak sengaja menulis ke produksi MKH | Sangat tinggi | Rendah | Interface tanpa write, role read-only, tanpa koneksi sampai Phase 5 disetujui. |
| R6 | Model upstream (USD, satu harga, konsumen ritel) tidak cocok untuk hospitality & leasehold | Sedang | Tinggi (pasti) | Tool `hospitality.py` & `investment.py` baru; adaptasi format IDR. |
| R7 | Biaya/waktu sub-agent tinggi (8 seat + 100 persona) | Sedang | Tinggi | Mode `--quick`, panel 20 dulu, panel 100 hanya untuk keputusan besar. |
| R8 | Knowledge base basi (angka lama dipakai sebagai kondisi kini) | Sedang | Sedang | Setiap angka punya periode; mentor menyebut umur data; review berkala. |
| R9 | Branch ini ter-merge ke branch produksi Catatanku | Tinggi (app istri berhenti) | Rendah | Jangan merge branch ini ke `claude/reminder-finance-app-yveciz`; rekomendasi pindah ke repo terpisah atau rename. |
| R10 | Upstream berubah / hilang | Rendah | Rendah | Vendor salinan @ commit tetap. |
| R11 | Nasihat dianggap advice profesional (pajak, hukum, investasi) | Tinggi | Sedang | Disclaimer di setiap output; rekomendasi cek ke akuntan/notaris/legal. |
| R12 | Test upstream belum terverifikasi | Rendah | – | Jalankan setelah izin eksekusi (P2-1). |
| R13 | Repo Istri **publik** (dicek 2026-11-11) — data finansial bisa terekspos | Tinggi | Tinggi bila angka di-commit | Angka aktual & data pribadi hanya di `private/`; secret scan di `test_repo.py`; rekomendasi jadikan private. |
| R14 | Advisor & AI CFO menampilkan angka berbeda | Tinggi | Sedang | ADR-6: advisor tidak menghitung ulang angka aktual; selalu kutip `retrieved_at`. |
| R15 | Ketergantungan pada AI CFO / MK Connect yang sedang aktif dikembangkan | Sedang | Sedang | Kontrak data tertulis (`docs/integrations/`); `unreachable` → NEEDS DATA, bukan 0. |
