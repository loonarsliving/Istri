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
