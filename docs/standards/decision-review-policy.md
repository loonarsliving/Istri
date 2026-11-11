# Kebijakan pembahasan keputusan

Keputusan founder 2026-11-11 (D-2026-004): **semua keputusan dibahas** —
tidak hanya yang menyangkut rupiah, dan tidak ada keputusan yang dianggap
terlalu kecil. Tujuannya agar keputusan kecil tidak diremehkan.

## Apa yang dihitung sebagai keputusan

Setiap kali founder menyatakan akan melakukan, mengubah, menghentikan,
menyetujui, atau menolak sesuatu, di bidang mana pun:

| Bidang | Contoh keputusan "kecil" yang tetap dibahas |
| --- | --- |
| Keuangan | pengeluaran, diskon, harga, cicilan, talangan |
| SDM & organisasi | rekrut, pecat, naik gaji, ganti peran, jam kerja |
| Operasional & SOP | ganti vendor laundry, ubah jam check-in, aturan housekeeping |
| Tamu & pelayanan | kompensasi komplain, kebijakan pembatalan, fasilitas gratis |
| Brand & marketing | konten, kerja sama influencer, nama paket, promosi |
| Investor & kemitraan | janji ke investor, bagi hasil, kontrak mitra |
| Hukum & kepatuhan | izin, pajak, kontrak, data pribadi |
| Sistem & teknologi | fitur baru, ganti aplikasi, otomasi |
| Strategi | lokasi, lini baru, fokus, menghentikan sesuatu |

## Kedalaman pembahasan

Semua keputusan dibahas. Yang berbeda hanya kedalamannya:

| Tingkat | Siapa yang membahas | Waktu/biaya |
| --- | --- | --- |
| **Ringkas** | Mentor + 3 seat board paling relevan untuk bidang itu (`/loonars-board --ringkas`) | ± 3 sub-agent |
| **Standar** | Board lengkap 12 seat (D-2026-008) | 12 sub-agent |
| **Penuh** | Board lengkap + `/business-feasibility` + konsultasi AI CFO | 12+ sub-agent + simulasi |

Minimal **Ringkas** untuk setiap keputusan. Naik ke **Standar** bila ada
**salah satu** dari ini:
- AI CFO memberi putusan WASPADA, atau keputusan menyangkut uang dan AI CFO belum ditanya;
- berdampak ke orang (karyawan, tamu, investor, mitra);
- sulit dibatalkan, atau menjadi preseden (keputusan yang akan diulang);
- menyangkut hukum, pajak, kontrak, atau data pribadi;
- keputusan serupa pernah hasilnya buruk (`decisions/`).

Naik ke **Penuh** bila: AI CFO memberi putusan TIDAK MENYARANKAN / tolak;
ekspansi, lini baru, investor baru, utang baru, jual aset, langkah IPO; atau founder
memintanya. Founder selalu boleh meminta tingkat yang lebih dalam; advisor
tidak boleh menurunkan tingkat yang sudah dipicu kriteria di atas.

## Pemilihan seat untuk tingkat Ringkas

| Bidang | 3 seat |
| --- | --- |
| IPO & pasar modal | Pasar Modal & IPO, Tata Kelola, CFO Advisor |
| Keuangan | CFO Advisor, Chairman, Investment Advisor |
| Tata kelola | Tata Kelola, Chairman, CFO Advisor |
| SDM & organisasi | SDM & Organisasi, CEO Advisor, Operations Director |
| Operasional & SOP | Operations Director, CFO Advisor, Consumer Panel* |
| Tamu & pelayanan | Consumer Panel*, Operations Director, Marketing Director |
| Brand & marketing | Marketing Director, Market Intelligence, Consumer Panel* |
| Investor & kemitraan | Investment Advisor, Pasar Modal & IPO, CFO Advisor |
| Hukum & kepatuhan | Hukum/Pajak & Kepatuhan, Tata Kelola, CFO Advisor |
| Sistem & teknologi | Operations Director, CEO Advisor, CFO Advisor |
| Strategi | Chairman, CEO Advisor, CFO Advisor |

\* Consumer Panel tanpa panel yang sudah dijalankan cukup menyatakan
"panel belum dijalankan" dan apakah keputusan ini perlu diuji ke tamu.

## Pencatatan

Setiap keputusan yang sudah dibahas ditawarkan untuk dicatat di
`decisions/` (format 11 field; untuk tingkat Ringkas boleh singkat per
field). Tetap berlaku: status CONFIRMED hanya setelah founder mengonfirmasi.
Keputusan kecil yang serupa boleh digabung per bulan
(`D-YYYY-NNN-keputusan-operasional-<bulan>`), agar polanya tetap terlihat
saat `/founder-decision-review patterns`.
