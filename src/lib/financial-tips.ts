export interface TipSection {
  title: string;
  icon: string;
  tips: string[];
}

// Curated from OJK (sikapiuangmu.ojk.go.id), Kementerian Keuangan (mediakeuangan.kemenkeu.go.id),
// and household finance planning guidance current as of 2026.
export const FINANCIAL_TIP_SECTIONS: TipSection[] = [
  {
    title: "Aturan alokasi gaji bulanan",
    icon: "📊",
    tips: [
      "Formula 50/30/20: 50% kebutuhan pokok (makan, listrik, cicilan wajib), 30% keinginan/gaya hidup, 20% tabungan & investasi.",
      "Variasi 40/30/20/10 (populer di Indonesia karena memasukkan unsur agama): 40% kebutuhan pokok, 30% keinginan, 20% tabungan/investasi, 10% zakat/infak/sedekah.",
      "Begitu gaji masuk, bayar dulu semua tagihan wajib (listrik, cicilan, zakat) sebelum uang terpakai untuk hal lain — jangan menunggu 'sisa uang' di akhir bulan.",
      "Evaluasi bareng pasangan tiap akhir bulan: cek ulang semua pemasukan & pengeluaran, cari tahu ada 'kebocoran' dana di pos mana.",
    ],
  },
  {
    title: "Dana darurat",
    icon: "🛟",
    tips: [
      "Lajang/belum menikah: target dana darurat 3–6x pengeluaran bulanan.",
      "Pasangan menikah belum punya anak: idealnya 9–12x pengeluaran bulanan.",
      "Keluarga dengan anak: 9–12x pengeluaran bulanan, karena kebutuhan & risiko lebih besar.",
      "Kalau penghasilan tidak stabil (freelance/usaha sendiri), pertimbangkan target di atas 12x pengeluaran bulanan.",
      "Simpan dana darurat di rekening terpisah dari rekening harian supaya tidak tergoda terpakai.",
    ],
  },
  {
    title: "Batas aman utang & cicilan",
    icon: "⚖️",
    tips: [
      "Total cicilan semua utang sebaiknya di bawah 30–35% dari total pendapatan bulanan — ini rasio yang dipakai OJK dan perbankan sebagai batas aman.",
      "Rasio 36–49% dari pendapatan sudah masuk kategori 'kurang ideal', dan 50% ke atas berisiko tinggi mengganggu kebutuhan pokok.",
      "Sebelum mengambil utang baru, hitung dulu: (total cicilan bulanan + cicilan baru) ÷ pendapatan bulanan. Kalau sudah lewat 35%, sebaiknya ditunda dulu.",
    ],
  },
  {
    title: "Strategi melunasi utang lebih cepat",
    icon: "🎯",
    tips: [
      "Metode Snowball: lunasi dulu utang dengan nominal TERKECIL, apapun bunganya. Efeknya psikologis — tiap utang lunas jadi motivasi buat lanjut ke utang berikutnya.",
      "Metode Avalanche: lunasi dulu utang dengan BUNGA TERTINGGI. Secara matematis ini lebih hemat karena total bunga yang dibayar lebih kecil.",
      "Kalau butuh motivasi cepat, pakai Snowball. Kalau fokus hemat bunga jangka panjang, pakai Avalanche. Banyak perencana keuangan menyarankan gabungan: lunasi 1 utang kecil dulu buat momentum, baru lanjut Avalanche untuk sisanya.",
      "Cicil sesuai kemampuan, jangan sampai menambah utang baru hanya untuk menutup utang lama (gali lubang tutup lubang) kecuali lewat konsolidasi resmi yang terencana.",
    ],
  },
  {
    title: "Kebiasaan kecil yang berdampak besar",
    icon: "✅",
    tips: [
      "Catat SEMUA transaksi sekecil apapun — pengeluaran kecil yang tidak tercatat biasanya jadi 'kebocoran' terbesar tiap bulan.",
      "Pisahkan rekening: 1 untuk kebutuhan harian, 1 untuk tabungan/dana darurat, supaya tidak tercampur.",
      "Sisihkan tabungan di awal bulan (pay yourself first), bukan menabung dari 'sisa' uang di akhir bulan.",
      "Review ulang cicilan & langganan tiap 3 bulan — sering ada langganan yang sudah tidak terpakai tapi tetap kebayar.",
    ],
  },
];
