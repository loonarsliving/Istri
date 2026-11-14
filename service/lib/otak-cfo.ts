import { createHash, createHmac } from "node:crypto";

import { angkaTakBerdasar } from "./angka";
import { secretsMatch } from "./auth";
import { CONTENT } from "./content.generated";
import type { TanyaModel } from "./gemini";
import { gabung, keputusanWaSebagaiTeks, memoriSebagaiTeks } from "./mentor";
import type { Keputusan, Memori } from "./register";

/**
 * OTAK AI CFO MKH Property (owner 2026-11-14: "ai yg ada di repo istri jga
 * sebagai otak utama dari mkh property").
 *
 * MKH Property mengirim DAFTAR FAKTA + JAWABAN DASAR (dihitung mesin
 * deterministiknya) + pertanyaan; advisor berpikir dengan Gemini Pro, memori
 * perusahaan, dan keputusan founder, lalu mengembalikan narasi analisis.
 * Advisor TIDAK menghitung angka baru: MKH Property memvalidasi setiap nominal
 * (validasiJawaban) dan memakai cadangan bila gagal.
 *
 * Tanda tangan: HMAC-SHA256('ai-cfo-otak|<ts>|<sha256 body>') dengan rahasia
 * advisor_shared_secret — dibuat database MKH Property (RPC cfo_tanda_advisor,
 * migrasi 0076); di sini = LOONARS_AI_CFO_SECRET (nilai yang sama). 5 menit.
 */
export const BATAS_DETIK = 300;

export function tandaOtak(ts: number, body: string, secret: string): string {
  const hash = createHash("sha256").update(body).digest("hex");
  return createHmac("sha256", secret).update(`ai-cfo-otak|${ts}|${hash}`).digest("hex");
}

export function verifikasiTanda(tsHeader: string, sig: string, body: string, secret: string, sekarang = Date.now()): boolean {
  if (secret.length < 32 || !/^\d{9,12}$/.test(tsHeader) || !/^[0-9a-f]{64}$/.test(sig)) return false;
  const ts = Number(tsHeader);
  if (Math.abs(sekarang / 1000 - ts) > BATAS_DETIK) return false;
  return secretsMatch(sig, tandaOtak(ts, body, secret));
}

/** Knowledge base yang relevan untuk analisis CFO (hospitality, harga, ekspansi, posisi). */
function kbCfo(): string {
  const pilih = CONTENT.knowledge.filter((f) => /hospitality|projects|company\/(business-model|strategic-goals|financial-position)|market/.test(f.path));
  return gabung(pilih, 25000);
}

export function sistemOtak(memori: Memori[] | null, keputusan: Keputusan[] | null): string {
  return [
    "Kamu adalah OTAK AI CFO MKH Property (Loonars AI Advisor) — CFO strategis PT Loonars Mahakarya (dulu PT Maha Karya Haluoleo).",
    "Lingkup: hanya Loonars 1 (hospitality villa Loonars Private Living, Yogyakarta) dan Loonars 2 (pengembang Loonars Living + Loonars Coffee). Proyek lama PT Maha Karya dan cabang Makassar sudah ditutup — jangan dibahas kecuali ditanya.",
    "Excellent Living (properti hospitality kedua, Yogyakarta) baru dibuka; datanya belum ada di AI CFO — sebut NEEDS DATA bila ditanya.",
    "ATURAN MUTLAK:",
    "1. Gunakan HANYA angka dari DAFTAR FAKTA / JAWABAN DASAR / MEMORI. Jangan menghitung angka rupiah baru, jangan menjumlahkan, jangan memperkirakan. Bila tidak ada: tulis 'data tidak tersedia'.",
    "2. Setiap angka wajib diikuti rujukan fakta, mis. 'Rp 123.992.000 [F42]'.",
    "3. Jangan mencampur cash-in investor (DP penjualan unit) dengan pendapatan operasional.",
    "4. Bila JAWABAN DASAR berisi putusan (AMAN/WASPADA/TIDAK MENYARANKAN), pertahankan putusan itu apa adanya.",
    "5. Kamu tidak bisa memindahkan uang, membayar, mengubah transaksi, atau mengubah harga. Owner yang memutuskan.",
    "CARA BERPIKIR (seperti CFO sungguhan, bukan sekadar membaca angka):",
    "- Diagnosis dulu: apa yang sebenarnya terjadi dan kenapa (okupansi, ADR, RevPAR, biaya, kas, talangan, kewajiban).",
    "- Tantang asumsi owner bila berisiko; beri alternatif yang lebih aman.",
    "- Untuk okupansi/ADR: bandingkan dengan target & bulan lalu bila faktanya ada; jelaskan apakah okupansi 'sehat' atau harga terlalu murah/mahal.",
    "- Untuk strategi harga: arah (naik/tahan/turun) + alasan dari fakta; harga final tetap diputuskan owner lewat mesin harga villa.",
    "- Akhiri dengan 1–3 langkah konkret.",
    "FORMAT: Bahasa Indonesia, ringkas (maks ±250 kata), tanpa tabel markdown.",
    "",
    "=== MEMORI PERUSAHAAN (disahkan founder) ===",
    memoriSebagaiTeks(memori),
    "=== KEPUTUSAN FOUNDER (register) ===",
    keputusanWaSebagaiTeks(keputusan),
    "=== KNOWLEDGE BASE (HISTORICAL/NEEDS DATA; bukan sumber angka aktual) ===",
    kbCfo(),
  ].join("\n");
}

export interface DepsOtak {
  tanyaModel: TanyaModel;
  daftarMemori?: () => Promise<Memori[]>;
  daftarKeputusan?: () => Promise<Keputusan[]>;
}

export interface HasilOtak {
  teks: string;
  model: string;
  cadangan: boolean;
  angkaTakBerdasar: number[];
}

/** Narasi CFO dari advisor. Angka tak berdasar → satu kali tulis ulang; tetap salah → dilaporkan (MKH Property akan menolak). */
export async function narasiOtak(pengguna: string, deps: DepsOtak): Promise<HasilOtak> {
  const [memori, keputusan] = await Promise.all([
    deps.daftarMemori ? deps.daftarMemori().catch(() => null) : Promise.resolve(null),
    deps.daftarKeputusan ? deps.daftarKeputusan().catch(() => null) : Promise.resolve(null),
  ]);
  const sistem = sistemOtak(memori, keputusan);
  const opsi = { percobaan: 1, maksToken: 3072, timeoutMs: 45000, thinkingLevel: "MEDIUM" as const };
  let h = await deps.tanyaModel(sistem, pengguna, opsi);
  let salah = angkaTakBerdasar(h.teks, pengguna);
  if (salah.length) {
    h = await deps.tanyaModel(
      sistem,
      `${pengguna}\n\nJAWABAN SEBELUMNYA MEMUAT ANGKA YANG TIDAK ADA DI DAFTAR FAKTA (${salah.join(", ")}). Tulis ulang tanpa angka itu.`,
      opsi,
    );
    salah = angkaTakBerdasar(h.teks, pengguna);
  }
  return { teks: h.teks, model: h.model, cadangan: h.cadangan, angkaTakBerdasar: salah };
}
