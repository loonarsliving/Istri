# Standar output analisis strategis

Dipakai oleh `loonars-mentor`, chair summary `loonars-board`,
`business-feasibility`, dan semua skill strategis. Bahasa: Indonesia
(istilah teknis boleh Inggris). Mata uang: IDR (`Rp 1.250.000`).

```markdown
# <Judul analisis>
Tanggal: <YYYY-MM-DD> · Diminta oleh: founder · Skill: <nama>
Confidence: **Low / Medium / High** — <satu kalimat alasan>

## 1. Executive Summary
3–5 kalimat. Rekomendasi di kalimat pertama. Jika rekomendasinya "jangan",
tulis "jangan".

## 2. Situation Analysis
Fakta saat ini, setiap angka dengan label (docs/standards/data-labels.md).
Jenis masalah: strategis / operasional / keuangan / organisasi / eksekusi.

## 3. Opportunities
## 4. Risks
Top risiko berurutan dari yang paling berbahaya; untuk masing-masing:
kemungkinan, dampak, tanda awal, mitigasi.

## 5. Financial Implications
Angka aktual dari AI CFO (kutip putusannya: AMAN / WASPADA / TIDAK
MENYARANKAN). Proyeksi ide baru dari `tools/finance/` (berlabel PROJECTION).
Selalu tampilkan base / downside / worst.

## 6. Board Perspectives
Ringkas per seat yang dilibatkan + vote. Ketidaksepakatan dipertahankan.

## 7. Alternative Scenarios
Minimal 2 alternatif nyata (termasuk "tidak melakukan apa-apa" / "tunda"),
dibandingkan dengan angka yang sama.

## 8. Recommended Decision
Satu pilihan + alasan mengapa mengalahkan alternatif + syarat (jika "APPROVE IF").

## 9. Execution Plan
Langkah bertanggal, pemilik, biaya, titik keputusan ulang (kill criteria).

## 10. KPIs to Monitor
KPI, nilai sekarang (berlabel), target, ambang yang memicu evaluasi ulang,
sumber datanya.

## Unknowns
Data yang belum ada → `NEEDS DATA: <apa>, pemilik: <siapa>, dampak bila salah: <...>`.

## Keterbatasan
Simulasi = data sintetis. Proyeksi ≠ prediksi pasti. Bukan nasihat finansial,
hukum, investasi, atau pajak; struktur pajak/hukum dicek akuntan/notaris.
```

Aturan:
- Tidak ada angka tanpa label & sumber.
- Confidence **High** hanya bila angka kunci berlabel ACTUAL dan berumur
  < 60 hari. Jika angka kunci NEEDS DATA, maksimal **Low**.
- Jangan menyimpan hasil sebagai keputusan. Tawarkan `founder-decision-review
  record` setelah founder memutuskan.
