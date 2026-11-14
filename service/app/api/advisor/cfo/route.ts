import { CONFIG } from "@/lib/config";
import { tanyaModel } from "@/lib/gemini";
import { narasiOtak, verifikasiTanda } from "@/lib/otak-cfo";
import { register } from "@/lib/register";

/**
 * POST /api/advisor/cfo — otak narasi AI CFO MKH Property (owner 2026-11-14).
 * Header: x-mkh-cfo-ts, x-mkh-cfo-sig (ditandatangani database MKH Property,
 * RPC cfo_tanda_advisor, migrasi 0076). Body: { pengguna: string } — daftar
 * fakta + jawaban dasar + pertanyaan, disusun MKH Property.
 * Jawab: { teks, model, cadangan }. Hanya baca: tidak mencatat apa pun.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const ok = verifikasiTanda(req.headers.get("x-mkh-cfo-ts") ?? "", req.headers.get("x-mkh-cfo-sig") ?? "", body, CONFIG.aiCfoSecret);
  if (!ok) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let pengguna = "";
  try {
    const j = JSON.parse(body) as { pengguna?: unknown };
    pengguna = typeof j.pengguna === "string" ? j.pengguna.slice(0, 120000) : "";
  } catch {
    return Response.json({ error: "Body harus JSON" }, { status: 400 });
  }
  if (!pengguna) return Response.json({ error: "Isi kosong" }, { status: 400 });
  try {
    const reg = register();
    const h = await narasiOtak(pengguna, { tanyaModel, daftarMemori: () => reg.memoriDaftar(), daftarKeputusan: () => reg.daftar() });
    if (h.angkaTakBerdasar.length) {
      console.error("otak cfo: angka tak berdasar", h.angkaTakBerdasar);
      return Response.json({ error: "Jawaban memuat angka tak berdasar" }, { status: 422 });
    }
    return Response.json({ teks: h.teks, model: h.model, cadangan: h.cadangan });
  } catch (e) {
    console.error("otak cfo gagal", e);
    return Response.json({ error: "Gagal menjawab" }, { status: 502 });
  }
}
