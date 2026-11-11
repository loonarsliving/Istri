import { angkaTakBerdasar } from "./angka";
import { CONTENT } from "./content.generated";
import type { TanyaModel } from "./gemini";
import { KATEGORI_MEMORI, type KategoriMemori } from "./register";

/**
 * AI Board via WA (pola skill loonars-board, D-2026-007). Setiap seat = satu
 * panggilan Gemini Pro dengan lens seat itu (paralel), lalu Chairman menyusun
 * ringkasan. Tingkat & seat mengikuti docs/standards/decision-review-policy.md.
 */
export const SEAT = {
  chairman: "Chairman",
  "ceo-advisor": "CEO Advisor",
  "cfo-advisor": "CFO Advisor",
  "investment-advisor": "Investment Advisor",
  "market-intelligence": "Market Intelligence",
  "consumer-panel": "Consumer Panel",
  "marketing-director": "Marketing Director",
  "operations-director": "Operations Director",
  governance: "Tata Kelola & Komisaris Independen",
  "legal-compliance": "Hukum, Pajak & Kepatuhan",
  "people-organization": "SDM & Organisasi",
  "capital-markets": "Pasar Modal & IPO",
  "hospitality-manager": "Manager Hospitality AI",
  "capital-office": "Direksi Capital Office",
} as const;
export type KodeSeat = keyof typeof SEAT;
export const SEMUA_SEAT = Object.keys(SEAT) as KodeSeat[];

/** Tabel "Pemilihan seat untuk tingkat Ringkas" (decision-review-policy.md). */
const BIDANG: { nama: string; pola: RegExp; seat: [KodeSeat, KodeSeat, KodeSeat] }[] = [
  { nama: "IPO & pasar modal", pola: /\bipo\b|go public|bursa|saham publik|pra-?ipo|pasar modal|valuasi/i, seat: ["capital-markets", "capital-office", "governance"] },
  { nama: "Pendanaan & investor", pola: /investor|pendanaan|fundrais|modal ventura|venture|family office|data room|investor relation/i, seat: ["capital-office", "investment-advisor", "cfo-advisor"] },
  { nama: "Investor & kemitraan", pola: /mitra|kemitraan|bagi hasil|saham|equity/i, seat: ["investment-advisor", "capital-markets", "cfo-advisor"] },
  { nama: "Tata kelola", pola: /tata kelola|komisaris|audit|governance|pihak berelasi|rups/i, seat: ["governance", "chairman", "cfo-advisor"] },
  { nama: "Hukum & kepatuhan", pola: /hukum|legal|kontrak|pajak|izin|perizinan|notaris|sertifikat|kepatuhan/i, seat: ["legal-compliance", "governance", "cfo-advisor"] },
  { nama: "SDM & organisasi", pola: /karyawan|staf|rekrut|gaji|pecat|phk|manajer|organisasi|tim\b|sdm/i, seat: ["people-organization", "ceo-advisor", "operations-director"] },
  { nama: "Tamu & pelayanan", pola: /tamu|pelayanan|layanan|review|komplain|check.?in|housekeeping|resepsionis|chat/i, seat: ["hospitality-manager", "consumer-panel", "marketing-director"] },
  { nama: "Brand & marketing", pola: /brand|marketing|promosi|iklan|instagram|tiktok|konten|ota|harga kamar|diskon/i, seat: ["marketing-director", "market-intelligence", "consumer-panel"] },
  { nama: "Sistem & teknologi", pola: /sistem|aplikasi|software|teknologi|ai\b|otomasi|website|server/i, seat: ["operations-director", "ceo-advisor", "cfo-advisor"] },
  { nama: "Operasional & SOP", pola: /operasional|sop|checklist|kamar|cleaning|renovasi|perawatan|maintenance|vendor|bahan|konstruksi|bangun/i, seat: ["operations-director", "hospitality-manager", "cfo-advisor"] },
  { nama: "Keuangan", pola: /uang|kas|biaya|rp\b|rp\s?\d|juta|jt\b|miliar|utang|pinjam|investasi|modal|cicil|bayar|beli/i, seat: ["cfo-advisor", "chairman", "investment-advisor"] },
];
const STRATEGI = { nama: "Strategi", seat: ["chairman", "ceo-advisor", "cfo-advisor"] as KodeSeat[] };

/** Kriteria naik ke Standar/Penuh (decision-review-policy.md). */
const ESKALASI = /karyawan|tamu|investor|mitra|kontrak|hukum|pajak|data pribadi|ekspansi|lini baru|cabang baru|utang baru|pinjaman|jual aset|jual (villa|unit|tanah)|preseden|\bipo\b|go public|komisaris/i;

export interface PilihanBoard {
  bidang: string;
  tingkat: "Ringkas" | "Standar" | "Penuh";
  seat: KodeSeat[];
  alasan: string;
}

export function pilihBoard(topik: string, opsi: { penuh?: boolean; putusanCfo?: string } = {}): PilihanBoard {
  const b = BIDANG.find((x) => x.pola.test(topik)) ?? STRATEGI;
  if (opsi.putusanCfo === "tolak") return { bidang: b.nama, tingkat: "Penuh", seat: SEMUA_SEAT, alasan: "AI CFO memberi putusan TOLAK" };
  if (opsi.penuh) return { bidang: b.nama, tingkat: "Standar", seat: SEMUA_SEAT, alasan: "diminta founder" };
  if (opsi.putusanCfo === "waspada") return { bidang: b.nama, tingkat: "Standar", seat: SEMUA_SEAT, alasan: "AI CFO memberi putusan WASPADA" };
  const m = ESKALASI.exec(topik);
  if (m) return { bidang: b.nama, tingkat: "Standar", seat: SEMUA_SEAT, alasan: `menyangkut "${m[0]}" (kriteria eskalasi)` };
  return { bidang: b.nama, tingkat: "Ringkas", seat: [...b.seat], alasan: `bidang ${b.nama}` };
}

function berkas(nama: string): string {
  return CONTENT.board.find((f) => f.path.endsWith(`/${nama}.md`))?.text.trim() ?? "";
}

export function sistemSeat(seat: KodeSeat, konteks: string): string {
  return [
    `Kamu adalah seat ${SEAT[seat]} di AI Board of Directors Loonars. Terapkan HANYA lens seat ini; jangan menyetujui demi sopan.`,
    "Tulis memo dengan format di bawah, maksimal ±250 kata, Bahasa Indonesia, IDR.",
    "JANGAN mengarang angka: angka hanya dari FAKTA/EVALUASI AI CFO, knowledge base, atau pesan founder (kutip ID [F..]/[E..]); yang tidak ada = NEEDS DATA.",
    seat === "consumer-panel" ? "Panel konsumen sintetis BELUM dijalankan untuk topik ini: nyatakan itu, beri hipotesis berlabel ASSUMPTION, dan apakah perlu diuji ke tamu." : "",
    "",
    "=== LENS SEAT ===",
    berkas(seat),
    "=== FORMAT MEMO ===",
    berkas("_memo"),
    "=== KONTEKS ===",
    konteks,
  ]
    .filter(Boolean)
    .join("\n");
}

const ATURAN_JSON = [
  "Di akhir, DUA baris JSON (masing-masing satu baris), WAJIB diawali label persis 'SYARAT_JSON:' dan 'MEMORI_JSON:' — tanpa tanda bintang/kode:",
  "SYARAT_JSON: array syarat [{\"teks\":..., \"tenggat\":\"YYYY-MM-DD\"|null}] (kosong bila tidak ada).",
  "MEMORI_JSON: maks 3 FAKTA baru tentang Loonars Mahakarya yang terungkap di sidang ini dan layak diingat direksi (model bisnis, beban, hambatan, pelajaran, tujuan, aturan) — bukan opini/rekomendasi, bukan angka karangan, jangan mengulang MEMORI PERUSAHAAN yang sudah ada: [{\"kategori\":\"model_bisnis|beban|hambatan|pelajaran|tujuan|aturan|lain\", \"teks\":...}].",
].join("\n");

export const SISTEM_CHAIR = [
  "Kamu Chairman AI Board Loonars. Susun RINGKASAN SIDANG untuk founder via WhatsApp dari memo-memo seat.",
  "Format WA (tanpa tabel markdown, *tebal* gaya WA, maks ±25 baris):",
  "*Putusan board*: APPROVE / APPROVE IF / REJECT + skor rata-rata",
  "*Vote*: satu baris per seat (seat — vote — skor)",
  "*Risiko utama* (yang diangkat ≥2 seat dulu, maks 3)",
  "*Syarat* (bila APPROVE IF: terukur & bertanggal)",
  "*Alternatif terbaik*",
  "*Belum diketahui* (NEEDS DATA)",
  "*Confidence*: Low/Medium/High",
  "Jangan mengarang angka; pakai hanya angka yang ada di memo/konteks. Jangan menulis ulang memo panjang.",
  ATURAN_JSON,
].join("\n");

export const SISTEM_CHAIR_RAPAT = [
  "Kamu Chairman AI Board Loonars Mahakarya. Susun NOTULEN RAPAT DIREKSI BULANAN untuk founder via WhatsApp dari memo-memo seat. Tujuan jangka panjang: perusahaan siap IPO.",
  "Format WA (tanpa tabel markdown, *tebal* gaya WA, maks ±30 baris):",
  "*Tindak lanjut bulan lalu*: untuk setiap langkah di NOTULEN RAPAT BULAN LALU, nilai ✅ jalan / 🟡 sebagian / ❌ belum — berdasarkan data bulan ini; bila tidak bisa dibuktikan tulis 'belum bisa dibuktikan'. Bila belum ada notulen sebelumnya, tulis 'rapat pertama'.",
  "*Kondisi bulan ini* (kas & arah dari AI CFO, kutip ID fakta; bandingkan dengan bulan lalu: membaik/memburuk; tanpa angka karangan)",
  "*Operasional & layanan tamu* (dari RINGKASAN HOSPITALITY [H..]: disiplin checklist staf, kesiapan kamar, waktu balas & tema chat tamu)",
  "*3 penghambat terbesar* perkembangan perusahaan (yang diangkat ≥2 seat dulu)",
  "*Keputusan yang perlu ditinjau / syarat terlambat*",
  "*Kesiapan menuju IPO*: satu kemajuan & satu celah terbesar (syarat resmi BEI/OJK = NEEDS DATA bila belum diriset)",
  "*Capital Office*: kesiapan pendanaan (siap/sebagian/belum per butir terpenting), KAPAN waktunya mulai mencari investor (belum/hampir/siap + syarat), dan KE MANA sebaiknya email dikirim (jenis/lembaga dari sumber publik di memo Capital Office). Sistem tidak mengirim email; ini rekomendasi untuk founder.",
  "*3 langkah bulan depan* (terukur, bertanggal, siapa)",
  "*Pertanyaan direksi untuk founder* (maks 3)",
  "*Confidence*: Low/Medium/High",
  ATURAN_JSON,
].join("\n");

export interface UsulanMemori {
  kategori: KategoriMemori;
  teks: string;
}

export interface HasilBoard {
  pilihan: PilihanBoard;
  ringkasan: string;
  memo: { seat: KodeSeat; teks: string }[];
  syarat: { teks: string; tenggat: string | null }[];
  memori: UsulanMemori[];
  angkaTakBerdasar: number[];
  dokumen: string;
}

function barisJson(teks: string, label: string): { sisa: string; data: unknown[] } {
  // Toleran terhadap *tebal*/`kode` di sekitar label dan titik dua opsional.
  const re = new RegExp(`^\\s*[*_\`]*${label}[*_\`]*\\s*:?\\s*[*_\`]*\\s*(\\[.*\\])\\s*$`, "im");
  const m = re.exec(teks);
  if (!m) return { sisa: teks, data: [] };
  let data: unknown[] = [];
  try {
    const v = JSON.parse(m[1]) as unknown;
    if (Array.isArray(v)) data = v;
  } catch {
    /* abaikan JSON rusak */
  }
  return { sisa: teks.replace(m[0], ""), data };
}

/**
 * Chair kadang menulis array JSON tanpa label (rapat pertama 2026-11-11).
 * Baris yang seluruhnya array objek dikenali dari isinya: punya "kategori"
 * → memori; punya "tenggat" → syarat. Baris itu dibuang dari ringkasan WA.
 */
function arrayTanpaLabel(teks: string): { sisa: string; syarat: unknown[]; memori: unknown[] } {
  const syarat: unknown[] = [];
  const memori: unknown[] = [];
  const sisa = teks
    .split("\n")
    .filter((baris) => {
      const t = baris.trim().replace(/^```(?:json)?|```$/g, "").trim();
      if (!t.startsWith("[") || !t.endsWith("]")) return true;
      try {
        const v = JSON.parse(t) as unknown;
        if (!Array.isArray(v) || !v.length || !v.every((x) => x && typeof x === "object")) return true;
        const objek = v as Record<string, unknown>[];
        if (objek.some((x) => "kategori" in x)) memori.push(...objek);
        else if (objek.some((x) => "tenggat" in x)) syarat.push(...objek);
        else return true;
        return false;
      } catch {
        return true;
      }
    })
    .join("\n");
  return { sisa, syarat, memori };
}

/** Pisahkan syarat & usulan memori (berlabel atau tidak) dari ringkasan chair. */
export function pisahSyarat(teks: string): { ringkasan: string; syarat: { teks: string; tenggat: string | null }[]; memori: UsulanMemori[] } {
  const a0 = barisJson(teks, "SYARAT_JSON");
  const b0 = barisJson(a0.sisa, "MEMORI_JSON");
  const c = arrayTanpaLabel(b0.sisa);
  const a = { data: [...a0.data, ...c.syarat] };
  const b = { sisa: c.sisa, data: [...b0.data, ...c.memori] };
  const syarat = (a.data as { teks?: unknown; tenggat?: unknown }[])
    .filter((x) => typeof x?.teks === "string" && x.teks.length >= 3)
    .slice(0, 10)
    .map((x) => ({
      teks: String(x.teks).slice(0, 500),
      tenggat: typeof x.tenggat === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.tenggat) ? x.tenggat : null,
    }));
  const memori = (b.data as { kategori?: unknown; teks?: unknown }[])
    .filter((x) => typeof x?.teks === "string" && x.teks.length >= 3)
    .slice(0, 3)
    .map((x) => ({
      kategori: (KATEGORI_MEMORI as string[]).includes(String(x.kategori)) ? (x.kategori as KategoriMemori) : "lain",
      teks: String(x.teks).slice(0, 1000),
    }));
  return { ringkasan: b.sisa.replace(/\n{3,}/g, "\n\n").trim(), syarat, memori };
}

export async function sidang(
  topik: string,
  konteks: string,
  pilihan: PilihanBoard,
  tanya: TanyaModel,
  mode: "keputusan" | "rapat" = "keputusan",
  /** Konteks tambahan per kursi (mis. contoh chat tamu hanya untuk Manager Hospitality AI). */
  ekstra: Partial<Record<KodeSeat, string>> = {},
): Promise<HasilBoard> {
  const tugas =
    mode === "rapat"
      ? "\n\nIni RAPAT DIREKSI BULANAN, bukan voting keputusan. Ganti format memo menjadi: *Temuan bulan ini* · *Penghambat terbesar menurut lens saya* · *Celah menuju IPO* · *Satu langkah bulan depan (terukur)* · *Yang belum diketahui*."
      : "";
  const memo = await Promise.all(
    pilihan.seat.map(async (seat) => {
      try {
        const cari = seat === "capital-office";
        const h = await tanya(sistemSeat(seat, ekstra[seat] ? `${konteks}\n${ekstra[seat]}` : konteks) + tugas, `Topik yang dibahas board:\n${topik}`, { percobaan: 1, maksToken: 4096, cari });
        const sumber = cari && h.sumber?.length ? `\n\nSumber web (Google Search):\n${h.sumber.map((x, i) => `${i + 1}. ${x.judul} — ${x.url}`).join("\n")}` : cari ? "\n\n(Tidak ada sumber web terbaca — nama lembaga di memo ini belum terverifikasi.)" : "";
        return { seat, teks: h.teks + sumber };
      } catch (e) {
        console.error(`seat ${seat} gagal`, e);
        return { seat, teks: `# ${SEAT[seat]}\n(seat gagal menjawab kali ini — tidak dihitung)` };
      }
    }),
  );
  const isiMemo = memo.map((m) => `--- MEMO ${SEAT[m.seat]} ---\n${m.teks}`).join("\n\n");
  const chair = await tanya(
    `${mode === "rapat" ? SISTEM_CHAIR_RAPAT : SISTEM_CHAIR}\n\n=== KONTEKS ===\n${konteks}`,
    `Topik: ${topik}\nTingkat: ${pilihan.tingkat} (${pilihan.alasan})\n\n${isiMemo}`,
    { percobaan: 1, maksToken: 4096 },
  );
  const { ringkasan, syarat, memori } = pisahSyarat(chair.teks);
  const salah = angkaTakBerdasar(ringkasan, `${konteks}\n${topik}`);
  const dokumen = [
    `# ${mode === "rapat" ? "Rapat direksi" : "Sidang board"} — ${topik.slice(0, 120)}`,
    `Tingkat: ${pilihan.tingkat} · Bidang: ${pilihan.bidang} · Alasan: ${pilihan.alasan}`,
    "",
    "## Ringkasan Chairman",
    ringkasan,
    "",
    ...memo.map((m) => `## Memo ${SEAT[m.seat]}\n${m.teks}\n`),
  ].join("\n");
  return { pilihan, ringkasan, memo, syarat, memori, angkaTakBerdasar: salah, dokumen };
}
