import { GoogleGenAI } from "@google/genai";

import { CONFIG } from "./config";

export interface HasilAI {
  teks: string;
  model: string;
  tokenMasuk: number | null;
  tokenKeluar: number | null;
  cadangan: boolean;
}

let client: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  if (!CONFIG.geminiApiKey) throw new Error("GEMINI_API_KEY belum diatur di proyek advisor");
  client ??= new GoogleGenAI({ apiKey: CONFIG.geminiApiKey });
  return client;
}

async function sekali(model: string, sistem: string, pengguna: string, thinking: boolean): Promise<HasilAI> {
  const res = await Promise.race([
    ai().models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: pengguna }] }],
      config: {
        systemInstruction: sistem,
        temperature: 0.4,
        maxOutputTokens: CONFIG.maxOutputTokens,
        // Model 3.x memakai thinkingLevel (UPPERCASE). Advisor: HIGH (MK Connect: MINIMAL).
        thinkingConfig: thinking ? { thinkingLevel: CONFIG.thinkingLevel } : { thinkingLevel: "MINIMAL" },
      } as Record<string, unknown>,
    }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`timeout ${CONFIG.timeoutMs} ms`)), CONFIG.timeoutMs)),
  ]);
  const teks = (res.text ?? "").trim();
  if (!teks) throw new Error("jawaban kosong dari model");
  const u = res.usageMetadata;
  return { teks, model, tokenMasuk: u?.promptTokenCount ?? null, tokenKeluar: u?.candidatesTokenCount ?? null, cadangan: false };
}

/** Model kuat (2 percobaan) → cadangan model ringan. Semua dengan kunci advisor. */
export async function tanyaModel(sistem: string, pengguna: string): Promise<HasilAI> {
  let galat: unknown;
  for (let i = 0; i < 2; i++) {
    try {
      return await sekali(CONFIG.model, sistem, pengguna, true);
    } catch (e) {
      galat = e;
      console.error(`advisor model ${CONFIG.model} gagal (percobaan ${i + 1})`, e);
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
  try {
    const h = await sekali(CONFIG.fallbackModel, sistem, pengguna, false);
    return { ...h, cadangan: true };
  } catch (e) {
    throw new Error(`model utama & cadangan gagal: ${String(galat)} / ${String(e)}`);
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
