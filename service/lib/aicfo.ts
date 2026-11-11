import { angkaDalamTeks } from "./angka";
import { CONFIG } from "./config";

export interface FaktaCfo {
  id: string;
  label: string;
  teks: string;
  sumber: string;
}

export interface KonteksCfo {
  tersedia: boolean;
  hariIni: string | null;
  fakta: FaktaCfo[];
  catatan: string;
}

/** Nama customer refund disamarkan sebelum dikirim ke model (data pribadi). */
export function samarkan(teks: string): string {
  return teks.replace(/Refund\s+[A-Z][A-Za-z.'\s]{1,40}?(?=\s+Rp|:|$)/g, "Refund customer");
}

/**
 * Fakta AI CFO MKH Property (POST /api/cfo/advisor, hanya baca). Gagal =
 * "tidak tersedia", tidak pernah angka nol (prinsip FRIDAY/advisor).
 */
export async function ambilFaktaCfo(fetchImpl: typeof fetch = fetch): Promise<KonteksCfo> {
  if (CONFIG.aiCfoSecret.length < 32) return { tersedia: false, hariIni: null, fakta: [], catatan: "LOONARS_AI_CFO_SECRET belum diatur" };
  try {
    const res = await fetchImpl(CONFIG.aiCfoUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-advisor-secret": CONFIG.aiCfoSecret },
      body: JSON.stringify({ mode: "fakta" }),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return { tersedia: false, hariIni: null, fakta: [], catatan: `AI CFO menjawab HTTP ${res.status}` };
    const d = (await res.json()) as { hariIni?: string; fakta?: FaktaCfo[] };
    const fakta = (d.fakta ?? []).map((f) => ({ ...f, label: samarkan(f.label), teks: samarkan(f.teks) }));
    return { tersedia: true, hariIni: d.hariIni ?? null, fakta, catatan: "" };
  } catch (e) {
    return { tersedia: false, hariIni: null, fakta: [], catatan: `AI CFO tidak terbaca: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export function faktaSebagaiTeks(k: KonteksCfo): string {
  if (!k.tersedia) return `AI CFO TIDAK TERSEDIA (${k.catatan}). Semua angka keuangan = NEEDS DATA.`;
  return [`Fakta AI CFO MKH Property per ${k.hariIni} (ACTUAL; forecast = PROJECTION AI CFO):`, ...k.fakta.map((f) => `[${f.id}] ${f.label}: ${f.teks}`)].join("\n");
}

export interface RencanaUang {
  nominal: number;
  lini: "L1" | "L2" | "Grup";
  ket: string;
  cicilan?: number;
}

export interface HasilEvaluasiCfo {
  tersedia: boolean;
  catatan: string;
  putusan?: "aman" | "waspada" | "tolak";
  ringkas?: string;
  alasan?: string[];
  alternatif?: string[];
  maksAmanSekarang?: number;
  tundaAmanHari?: number | null;
}

/**
 * CEO challenger AI CFO (mode evaluasi, hanya baca: tidak mencatat transaksi).
 * Putusan dikutip apa adanya; advisor tidak menghitung ulang.
 */
export async function evaluasiCfo(rencana: RencanaUang, fetchImpl: typeof fetch = fetch): Promise<HasilEvaluasiCfo> {
  if (CONFIG.aiCfoSecret.length < 32) return { tersedia: false, catatan: "LOONARS_AI_CFO_SECRET belum diatur" };
  try {
    const res = await fetchImpl(CONFIG.aiCfoUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-advisor-secret": CONFIG.aiCfoSecret },
      body: JSON.stringify({ mode: "evaluasi", rencana: { ...rencana, ket: samarkan(rencana.ket).slice(0, 300) } }),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return { tersedia: false, catatan: `AI CFO menjawab HTTP ${res.status}` };
    const d = (await res.json()) as { evaluasi?: Omit<HasilEvaluasiCfo, "tersedia" | "catatan"> };
    if (!d.evaluasi?.putusan) return { tersedia: false, catatan: "AI CFO tidak mengembalikan evaluasi" };
    const e = d.evaluasi;
    return {
      tersedia: true,
      catatan: "",
      putusan: e.putusan,
      ringkas: e.ringkas,
      alasan: e.alasan,
      alternatif: e.alternatif,
      maksAmanSekarang: e.maksAmanSekarang,
      tundaAmanHari: e.tundaAmanHari,
    };
  } catch (e) {
    return { tersedia: false, catatan: `AI CFO tidak terbaca: ${e instanceof Error ? e.message : String(e)}` };
  }
}

const KATA_KELUAR = /\b(beli|membeli|bayar|membayar|keluar(kan)?|belanja|investasi(kan)?|renovasi|bangun|membangun|sewa|rekrut|gaji|pinjam(kan)?|tambah|modal|biaya|habiskan|anggaran|dp)\b/i;

/** Rencana uang keluar dari pesan founder (deterministik). null = bukan pertanyaan pengeluaran. */
export function rencanaDariPesan(pesan: string): RencanaUang | null {
  if (!KATA_KELUAR.test(pesan)) return null;
  const kandidat = [...pesan.matchAll(/(rp\.?\s*)?(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)\s*(miliar|milyar|m\b|juta|jt\b|ribu|rb\b)?/gi)]
    .filter((m) => m[1] || m[3])
    .map((m) => angkaDalamTeks(m[0])[0])
    .filter((n): n is number => typeof n === "number" && n >= 100000);
  if (!kandidat.length) return null;
  const t = pesan.toLowerCase();
  const lini: RencanaUang["lini"] = /\b(l2|loonars ?2)\b/.test(t) ? "L2" : /\b(l1|loonars ?1|villa)\b/.test(t) ? "L1" : "Grup";
  const cicil = /(\d{1,2})\s*(x|kali)\s*(cicil|bulan)|cicil\w*\s*(\d{1,2})/i.exec(pesan);
  const cicilan = cicil ? Number(cicil[1] ?? cicil[4]) : undefined;
  return { nominal: Math.max(...kandidat), lini, ket: pesan.slice(0, 300), cicilan: cicilan && cicilan > 1 ? cicilan : undefined };
}

export function evaluasiSebagaiTeks(r: RencanaUang, e: HasilEvaluasiCfo): string {
  if (!e.tersedia) return `EVALUASI AI CFO untuk rencana ini TIDAK TERSEDIA (${e.catatan}). Tulis bahwa rencana belum diuji AI CFO.`;
  const rp = (n?: number) => (typeof n === "number" ? `Rp ${Math.round(n).toLocaleString("id-ID")}` : "NEEDS DATA");
  return [
    `EVALUASI AI CFO (CEO challenger, ACTUAL/PROJECTION AI CFO) untuk rencana ${rp(r.nominal)} lini ${r.lini}${r.cicilan ? `, dicicil ${r.cicilan}x` : ""}:`,
    `[E1] Putusan: ${e.putusan?.toUpperCase()} — ${e.ringkas ?? ""}`,
    ...(e.alasan ?? []).map((a, i) => `[E2.${i + 1}] Alasan: ${a}`),
    `[E3] Maksimal aman sekarang: ${rp(e.maksAmanSekarang)}`,
    e.tundaAmanHari != null ? `[E4] Aman bila ditunda ${e.tundaAmanHari} hari` : "",
    ...(e.alternatif ?? []).map((a, i) => `[E5.${i + 1}] Alternatif: ${a}`),
    "Kutip putusan ini apa adanya; jangan menghitung ulang.",
  ]
    .filter(Boolean)
    .join("\n");
}
