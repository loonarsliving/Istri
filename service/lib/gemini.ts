import { GoogleGenAI } from "@google/genai";

import { CONFIG } from "./config";

export interface Sumber {
  judul: string;
  url: string;
}

export interface HasilAI {
  teks: string;
  model: string;
  tokenMasuk: number | null;
  tokenKeluar: number | null;
  cadangan: boolean;
  /** Hanya untuk mode riset (Google Search grounding). */
  sumber?: Sumber[];
}

export interface OpsiModel {
  /** Minta keluaran JSON (responseMimeType application/json). */
  json?: boolean;
  /** Pakai Google Search grounding; URL sumber dikembalikan di `sumber`. */
  cari?: boolean;
  /** Percobaan model utama sebelum cadangan (default 2). */
  percobaan?: number;
  /** Batas token keluaran (default CONFIG.maxOutputTokens). */
  maksToken?: number;
}

let client: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  if (!CONFIG.geminiApiKey) throw new Error("GEMINI_API_KEY belum diatur di proyek advisor");
  client ??= new GoogleGenAI({ apiKey: CONFIG.geminiApiKey });
  return client;
}

interface ChunkWeb {
  web?: { uri?: string; title?: string };
}

/** URL sumber dari groundingMetadata (unik, maks 10). */
export function sumberDariRespons(res: unknown): Sumber[] {
  const kandidat = (res as { candidates?: { groundingMetadata?: { groundingChunks?: ChunkWeb[] } }[] })?.candidates ?? [];
  const out: Sumber[] = [];
  const lihat = new Set<string>();
  for (const k of kandidat) {
    for (const c of k.groundingMetadata?.groundingChunks ?? []) {
      const url = c.web?.uri;
      if (!url || lihat.has(url)) continue;
      lihat.add(url);
      out.push({ judul: (c.web?.title ?? url).slice(0, 120), url });
      if (out.length >= 10) return out;
    }
  }
  return out;
}

async function sekali(model: string, sistem: string, pengguna: string, thinking: boolean, opsi: OpsiModel): Promise<HasilAI> {
  const config: Record<string, unknown> = {
    systemInstruction: sistem,
    temperature: 0.4,
    maxOutputTokens: opsi.maksToken ?? CONFIG.maxOutputTokens,
    // Model 3.x memakai thinkingLevel (UPPERCASE). Advisor: HIGH (MK Connect: MINIMAL).
    thinkingConfig: thinking ? { thinkingLevel: CONFIG.thinkingLevel } : { thinkingLevel: "MINIMAL" },
  };
  if (opsi.json) config.responseMimeType = "application/json";
  if (opsi.cari) config.tools = [{ googleSearch: {} }];
  const res = await Promise.race([
    ai().models.generateContent({ model, contents: [{ role: "user", parts: [{ text: pengguna }] }], config }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`timeout ${CONFIG.timeoutMs} ms`)), CONFIG.timeoutMs)),
  ]);
  const teks = (res.text ?? "").trim();
  if (!teks) throw new Error("jawaban kosong dari model");
  const u = res.usageMetadata;
  return {
    teks,
    model,
    tokenMasuk: u?.promptTokenCount ?? null,
    tokenKeluar: u?.candidatesTokenCount ?? null,
    cadangan: false,
    sumber: opsi.cari ? sumberDariRespons(res) : undefined,
  };
}

/** Model kuat (default 2 percobaan) → cadangan model ringan. Semua dengan kunci advisor. */
export async function tanyaModel(sistem: string, pengguna: string, opsi: OpsiModel = {}): Promise<HasilAI> {
  let galat: unknown;
  const n = Math.max(1, opsi.percobaan ?? 2);
  for (let i = 0; i < n; i++) {
    try {
      return await sekali(CONFIG.model, sistem, pengguna, true, opsi);
    } catch (e) {
      galat = e;
      console.error(`advisor model ${CONFIG.model} gagal (percobaan ${i + 1})`, e);
      if (i < n - 1) await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
  try {
    const h = await sekali(CONFIG.fallbackModel, sistem, pengguna, false, opsi);
    return { ...h, cadangan: true };
  } catch (e) {
    throw new Error(`model utama & cadangan gagal: ${String(galat)} / ${String(e)}`);
  }
}

export type TanyaModel = typeof tanyaModel;

/** Ambil objek JSON pertama dari teks model (toleran terhadap ```json). */
export function bacaJson<T>(teks: string): T | null {
  const bersih = teks.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(bersih) as T;
  } catch {
    const a = bersih.indexOf("{");
    const b = bersih.lastIndexOf("}");
    if (a < 0 || b <= a) return null;
    try {
      return JSON.parse(bersih.slice(a, b + 1)) as T;
    } catch {
      return null;
    }
  }
}

/** Cek ketersediaan model yang dikonfigurasi (untuk /api/advisor/health). */
export async function cekModel(model: string): Promise<{ ada: boolean; pesan: string }> {
  try {
    const m = await ai().models.get({ model });
    return { ada: true, pesan: m.displayName ?? model };
  } catch (e) {
    return { ada: false, pesan: e instanceof Error ? e.message.slice(0, 200) : String(e) };
  }
}

/** Nama model ber-"pro" yang tersedia untuk kunci advisor (nama model bukan rahasia). */
export async function daftarModelPro(): Promise<string[]> {
  try {
    const nama: string[] = [];
    const pager = await ai().models.list();
    for await (const m of pager) {
      const n = (m.name ?? "").replace(/^models\//, "");
      if (/pro/i.test(n)) nama.push(n);
      if (nama.length > 40) break;
    }
    return nama.sort();
  } catch (e) {
    return [`gagal: ${e instanceof Error ? e.message.slice(0, 120) : String(e)}`];
  }
}
