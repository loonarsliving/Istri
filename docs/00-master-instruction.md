# MASTER INSTRUCTION — BUILD LOONARS AI ADVISOR

> Dokumen sumber dari founder. Disalin apa adanya dari file instruksi yang
> diunggah (RTF), hanya dirapikan formatnya ke Markdown. Isi tidak diubah.
> Semua dokumen lain di repo ini mengacu ke dokumen ini.

## 1. Project overview

Saya ingin membangun sebuah sistem bernama **LOONARS AI ADVISOR**.

Sistem ini akan menjadi Virtual Board of Directors, Business Mentor, Strategic
Advisor, dan Business Intelligence Assistant untuk founder perusahaan Loonars.

Tujuan utamanya adalah membantu founder:

- Menguji ide bisnis sebelum dieksekusi.
- Mengevaluasi kelayakan investasi.
- Mengambil keputusan strategis.
- Menganalisis kondisi keuangan perusahaan.
- Mengidentifikasi risiko bisnis.
- Menganalisis kompetitor dan pasar.
- Menyusun strategi pertumbuhan.
- Mengembangkan sistem bisnis yang sustainable.
- Mengkritisi keputusan founder secara objektif.

AI ini tidak boleh menjadi chatbot yang hanya menyetujui pendapat founder.
AI harus mampu mengatakan bahwa sebuah ide tidak layak, keputusan terlalu
berisiko, strategi tidak realistis, atau alokasi modal tidak tepat.

## 2. Repository dan source

Gunakan repository berikut sebagai referensi utama:
<https://github.com/Jakeschincariol/founder-skill>

Tugas pertama:

1. Audit seluruh isi repository.
2. Periksa seluruh skill, struktur, dependencies, dokumentasi, dan lisensinya.
3. Identifikasi cara kerja setiap skill.
4. Pelajari bagaimana sistem menjalankan simulasi berbagai perspektif bisnis.
5. Pertahankan atribusi dan ketentuan lisensi upstream.
6. Jangan mengasumsikan jumlah atau kemampuan skill sebelum melakukan audit.

Buat repository proyek baru dengan nama: `loonars-ai-advisor`.
Repository ini harus independen dari repository upstream.
Jangan mengubah repository founder-skill.
Jangan mengkloning atau menduplikasi repository MKH Sistem maupun Villa.
Kedua repository tersebut nantinya hanya menjadi sumber data melalui integrasi
API yang aman.

## 3. Arsitektur AI Advisor

Bangun sistem dengan empat lapisan utama.

### A. AI Board of Directors

Buat beberapa AI specialist dengan perspektif berbeda:

1. **Chairman / Board Director** — menilai arah perusahaan; menguji keputusan
   founder; menentukan prioritas strategis; mempertimbangkan kepentingan jangka
   panjang perusahaan.
2. **CEO Advisor** — strategi pertumbuhan; business development; ekspansi bisnis;
   organisasi dan kepemimpinan.
3. **CFO Advisor** — financial analysis; cashflow; profitability; capital
   allocation; financial forecasting; break-even analysis.
4. **Investment Advisor** — valuation; fundraising; private equity; convertible
   notes; investor relations; IPO readiness.
5. **Market Intelligence** — market research; competitor analysis; market
   positioning; demand analysis.
6. **Consumer Panel** — simulasi berbagai profil konsumen; purchase intention;
   price sensitivity; customer objections; market validation.
7. **Marketing Director** — marketing strategy; customer acquisition; sales
   funnel; brand positioning; distribution strategy.
8. **Operations Director** — operational efficiency; SOP; human resources;
   automation; scalability.

### B. Business Mentor

Buat satu AI khusus yang bertindak sebagai mentor pribadi founder.

Karakter:

- Berpikir seperti experienced entrepreneur.
- Memiliki perspektif investor dan operator.
- Objektif dan kritis.
- Tidak mudah terpengaruh optimisme founder.
- Berani mengoreksi asumsi yang salah.
- Mengutamakan sustainability daripada pertumbuhan semu.
- Memahami trade-off antara pertumbuhan, cashflow, risiko, dan profitabilitas.

Mentor harus memahami konteks diskusi sebelumnya melalui persistent knowledge
base dan decision history.

Mentor harus bisa membedakan: masalah strategis; masalah operasional; masalah
keuangan; masalah organisasi; masalah eksekusi.

### C. Business Simulation Engine

Buat engine untuk menguji ide bisnis. Setiap kali founder memasukkan ide, sistem
harus bisa menjalankan:

1. Business feasibility.
2. Market opportunity.
3. Competitor simulation.
4. Consumer simulation.
5. Financial projection.
6. Investment attractiveness.
7. Operational feasibility.
8. Risk assessment.
9. Worst-case scenario.
10. Alternative business model.

Consumer simulation boleh menjalankan hingga 100 profil konsumen sintetis apabila
model dan resource memungkinkan. Pastikan hasil simulasi diberi label sebagai
data sintetis, bukan hasil survei manusia nyata. Jangan mengklaim hasil simulasi
sebagai prediksi pasti.

### D. Business Intelligence

Siapkan arsitektur agar nantinya dapat terhubung dengan: MKH Sistem; Supabase;
Villa management system; Cloudbeds; OTA booking data; financial reporting;
operational reporting.

Untuk tahap pertama jangan melakukan integrasi database produksi. Buat interface
atau adapter agar integrasi dapat ditambahkan kemudian.

## 4. Loonars company knowledge base

Buat struktur knowledge base khusus Loonars. Folder yang disarankan:

```
founder/
  company-profile.md
  business-model.md
  company-structure.md
  financial-position.md
  strategic-goals.md
  investment-history.md
  decision-history.md
projects/
  loonars-1.md
  loonars-2.md
  loonars-3.md
  expansion-plan.md
hospitality/
  pricing-strategy.md
  occupancy-strategy.md
  operations.md
market/
  competitor-analysis.md
  market-opportunity.md
```

Isi awal berdasarkan informasi yang tersedia. Jangan mengarang angka. Jika
informasi belum tersedia, buat placeholder dengan status **NEEDS DATA**.

Bedakan: actual data; historical data; founder assumptions; AI projections;
simulated data. Setiap data keuangan harus memiliki tanggal atau periode
referensi.

## 5. Custom Loonars skills

Selain skill dari upstream, buat custom skills:

1. `loonars-mentor`
2. `investor-strategy`
3. `hospitality-strategy`
4. `capital-allocation`
5. `founder-decision-review`
6. `business-feasibility`
7. `strategic-planning`
8. `financial-risk-analysis`

Masing-masing harus mempunyai instruksi, input, proses analisis, output, dan
batasan yang jelas.

## 6. Decision history

Ini merupakan fitur penting. Setiap keputusan besar yang dibahas harus dapat
didokumentasikan. Format: decision title; date; business context; founder
proposal; AI board analysis; identified risks; alternatives considered; final
decision; expected outcome; actual outcome; lessons learned.

Tujuannya adalah agar AI dapat mengevaluasi kualitas keputusan sebelumnya dan
membantu founder menghindari kesalahan berulang.

Jangan otomatis menyimpan setiap percakapan sebagai keputusan final. Keputusan
harus dikonfirmasi founder.

## 7. Cara AI memberikan rekomendasi

Setiap analisis strategis harus memiliki struktur:

1. Executive Summary.
2. Situation Analysis.
3. Opportunities.
4. Risks.
5. Financial Implications.
6. Board Perspectives.
7. Alternative Scenarios.
8. Recommended Decision.
9. Execution Plan.
10. KPIs to Monitor.

Tambahkan confidence level dan informasi apa yang masih belum diketahui. Jika
data tidak cukup, AI harus menyampaikan keterbatasannya.

## 8. Teknologi dan development

Utamakan teknologi yang sederhana, modular, dan mudah dikembangkan. Gunakan:

- Claude Code sebagai development environment.
- Claude skills untuk specialist instructions.
- GitHub untuk version control.
- Markdown untuk company knowledge base.
- Supabase sebagai future data source.
- API adapters untuk integrasi eksternal.

Jangan membangun frontend kompleks sebelum core advisory engine bekerja.
Pastikan tidak ada API key, credential, atau data rahasia yang masuk ke GitHub.

## 9. Security dan data governance

- Tidak boleh mengubah data produksi MKH Sistem.
- Semua integrasi database nantinya harus read-only secara default.
- Jangan menyimpan credential dalam source code.
- Jangan mengekspos data finansial sensitif.
- Setiap data yang digunakan harus dapat ditelusuri sumbernya.
- AI tidak boleh membuat transaksi atau keputusan finansial secara otomatis.

## 10. Development phases

Kerjakan secara bertahap.

**PHASE 1 — AUDIT**: audit repository founder-skill; identifikasi skill yang
relevan; audit lisensi dan dependencies; buat architecture document.

**PHASE 2 — FOUNDATION**: buat repository loonars-ai-advisor; adaptasikan
upstream skills; buat custom Loonars skills; bangun knowledge base.

**PHASE 3 — ADVISORY ENGINE**: implementasikan AI Mentor; implementasikan Board
of Directors; implementasikan Business Simulation Engine; implementasikan
Decision History.

**PHASE 4 — TESTING**: uji menggunakan beberapa kasus nyata:

- Apakah Loonars 2 layak dikembangkan lebih lanjut?
- Apakah Loonars perlu ekspansi ke lokasi baru?
- Bagaimana mengoptimalkan penjualan leasehold?
- Apakah fundraising lebih baik daripada menggunakan internal capital?
- Bagaimana meningkatkan occupancy dan profitability?

Gunakan angka aktual yang tersedia dan tandai asumsi yang belum terverifikasi.

**PHASE 5 — FUTURE INTEGRATION**: siapkan desain integrasi MKH Sistem dan
Supabase, tetapi jangan implementasikan koneksi produksi pada tahap awal.

## 11. Cara kerja yang saya inginkan

Jangan langsung menulis seluruh kode tanpa melakukan audit. Mulailah dengan:

1. Audit repository upstream.
2. Buat laporan hasil audit.
3. Susun arsitektur teknis.
4. Buat development roadmap.
5. Identifikasi dependencies dan risiko.
6. Baru mulai implementasi secara bertahap.

Setiap fase harus mempunyai acceptance criteria. Jangan melakukan perubahan
destruktif terhadap repository atau data yang sudah ada. Jangan mengarang fitur
yang sebenarnya belum tersedia. Jika ada keputusan arsitektur yang berdampak
besar, jelaskan trade-off dan rekomendasikan pilihan terbaik.

## Target akhir

Saya ingin memiliki sebuah AI Business Advisor yang berfungsi seperti gabungan:
Board of Directors; Experienced Business Mentor; CFO; Investment Strategist;
Market Intelligence Team; Business Analyst.

Sistem ini harus membantu founder membangun Loonars menjadi perusahaan
hospitality yang profitable, scalable, system-driven, investor-ready, dan
memiliki tata kelola profesional.

**Mulai dari PHASE 1. Jangan melompat ke tahap berikutnya sebelum hasil audit
dan rancangan arsitektur selesai.**
