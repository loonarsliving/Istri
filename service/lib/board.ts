import { angkaTakBerdasar } from "./angka";
import { CONTENT } from "./content.generated";
import type { TanyaModel } from "./gemini";

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
} as const;
export type KodeSeat = keyof typeof SEAT;
export const SEMUA_SEAT = Object.keys(SEAT) as KodeSeat[];

/** Tabel "Pemilihan seat untuk tingkat Ringkas" (decision-review-policy.md). */
const BIDANG: { nama: string; pola: RegExp; seat: [KodeSeat, KodeSeat, KodeSeat] }[] = [
  { nama: "Investor & kemitraan", pola: /investor|mitra|kemitraan|bagi hasil|saham|equity|fundrais/i, seat: ["investment-advisor", "chairman", "cfo-advisor"] },
  { nama: "Hukum & kepatuhan", pola: /hukum|legal|kontrak|pajak|izin|perizinan|notaris|sertifikat|kepatuhan/i, seat: ["chairman", "cfo-advisor", "operations-director"] },
  { nama: "SDM & organisasi", pola: /karyawan|staf|rekrut|gaji|pecat|phk|manajer|organisasi|tim\b|sdm/i, seat: ["ceo-advisor", "operations-director", "chairman"] },
  { nama: "Tamu & pelayanan", pola: /tamu|pelayanan|layanan|review|komplain|check.?in|housekeeping/i, seat: ["consumer-panel", "operations-director", "marketing-director"] },
  { nama: "Brand & marketing", pola: /brand|marketing|promosi|iklan|instagram|tiktok|konten|ota|harga kamar|diskon/i, seat: ["marketing-director", "market-intelligence", "consumer-panel"] },
  { nama: "Sistem & teknologi", pola: /sistem|aplikasi|software|teknologi|ai\b|otomasi|website|server/i, seat: ["operations-director", "ceo-advisor", "cfo-advisor"] },
  { nama: "Operasional & SOP", pola: /operasional|sop|renovasi|perawatan|maintenance|vendor|bahan|konstruksi|bangun/i, seat: ["operations-director", "cfo-advisor", "consumer-panel"] },
  { nama: "Keuangan", pola: /uang|kas|biaya|rp\b|rp\s?\d|juta|jt\b|miliar|utang|pinjam|investasi|modal|cicil|bayar|beli/i, seat: ["cfo-advisor", "chairman", "investment-advisor"] },
];
const STRATEGI = { nama: "Strategi", seat: ["chairman", "ceo-advisor", "cfo-advisor"] as KodeSeat[] };

/** Kriteria naik ke Standar/Penuh (decision-review-policy.md). */
const ESKALASI = /karyawan|tamu|investor|mitra|kontrak|hukum|pajak|data pribadi|ekspansi|lini baru|cabang baru|utang baru|pinjaman|jual aset|jual (villa|unit|tanah)|preseden/i;

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
  "Di akhir, JSON satu baris diawali 'SYARAT_JSON:' berisi array syarat [{\"teks\":..., \"tenggat\":\"YYYY-MM-DD\"|null}] (array kosong bila tidak ada).",
].join("\n");

export interface HasilBoard {
  pilihan: PilihanBoard;
  ringkasan: string;
  memo: { seat: KodeSeat; teks: string }[];
  syarat: { teks: string; tenggat: string | null }[];
  angkaTakBerdasar: number[];
  dokumen: string;
}

/** Pisahkan baris SYARAT_JSON dari ringkasan chair. */
export function pisahSyarat(teks: string): { ringkasan: string; syarat: { teks: string; tenggat: string | null }[] } {
  const m = /SYARAT_JSON:\s*(\[[\s\S]*?\])\s*$/m.exec(teks);
  if (!m) return { ringkasan: teks.trim(), syarat: [] };
  let syarat: { teks: string; tenggat: string | null }[] = [];
  try {
    const arr = JSON.parse(m[1]) as { teks?: unknown; tenggat?: unknown }[];
    syarat = arr
      .filter((s) => typeof s.teks === "string" && s.teks.length >= 3)
      .slice(0, 10)
      .map((s) => ({
        teks: String(s.teks).slice(0, 500),
        tenggat: typeof s.tenggat === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.tenggat) ? s.tenggat : null,
      }));
  } catch {
    /* abaikan JSON rusak */
  }
  return { ringkasan: teks.replace(m[0], "").trim(), syarat };
}

export async function sidang(topik: string, konteks: string, pilihan: PilihanBoard, tanya: TanyaModel): Promise<HasilBoard> {
  const memo = await Promise.all(
    pilihan.seat.map(async (seat) => {
      try {
        const h = await tanya(sistemSeat(seat, konteks), `Topik yang dibahas board:\n${topik}`, { percobaan: 1, maksToken: 4096 });
        return { seat, teks: h.teks };
      } catch (e) {
        console.error(`seat ${seat} gagal`, e);
        return { seat, teks: `# ${SEAT[seat]}\n(seat gagal menjawab kali ini — tidak dihitung)` };
      }
    }),
  );
  const isiMemo = memo.map((m) => `--- MEMO ${SEAT[m.seat]} ---\n${m.teks}`).join("\n\n");
  const chair = await tanya(
    `${SISTEM_CHAIR}\n\n=== KONTEKS ===\n${konteks}`,
    `Topik: ${topik}\nTingkat: ${pilihan.tingkat} (${pilihan.alasan})\n\n${isiMemo}`,
    { percobaan: 1, maksToken: 4096 },
  );
  const { ringkasan, syarat } = pisahSyarat(chair.teks);
  const salah = angkaTakBerdasar(ringkasan, `${konteks}\n${topik}`);
  const dokumen = [
    `# Sidang board — ${topik.slice(0, 120)}`,
    `Tingkat: ${pilihan.tingkat} · Bidang: ${pilihan.bidang} · Alasan: ${pilihan.alasan}`,
    "",
    "## Ringkasan Chairman",
    ringkasan,
    "",
    ...memo.map((m) => `## Memo ${SEAT[m.seat]}\n${m.teks}\n`),
  ].join("\n");
  return { pilihan, ringkasan, memo, syarat, angkaTakBerdasar: salah, dokumen };
}
