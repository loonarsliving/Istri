import { after } from "next/server";

import { normalisasiNomor, secretsMatch } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { jawab } from "@/lib/mentor";
import { kirimWa } from "@/lib/wa";

/**
 * POST /api/advisor/pesan — dipanggil MK Connect (asisten owner WA, super
 * admin saja) dengan header x-advisor-bridge-secret.
 * Body: { nomor: "62…", pesan: string }
 *
 * Langsung menjawab 202 (MK Connect membalas "sedang diproses"); jawaban
 * advisor dikirim belakangan ke nomor itu lewat MK Connect /api/wa/send.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
  if (!secretsMatch(req.headers.get("x-advisor-bridge-secret") ?? "", CONFIG.bridgeSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Body harus JSON" }, { status: 400 });
  }
  const nomor = normalisasiNomor(body.nomor);
  const pesan = typeof body.pesan === "string" ? body.pesan.slice(0, 4000) : "";
  if (!nomor) return Response.json({ error: "Nomor tidak valid" }, { status: 400 });

  after(async () => {
    const mulai = Date.now();
    try {
      const j = await jawab(pesan);
      await kirimWa(nomor, j.teks);
      console.log("advisor ok", { model: j.model, cadangan: j.cadangan, angkaTakBerdasar: j.angkaTakBerdasar.length, ms: Date.now() - mulai });
    } catch (e) {
      console.error("advisor gagal", e);
      await kirimWa(nomor, "⚠️ Advisor gagal menyusun jawaban kali ini. Coba kirim ulang sebentar lagi.");
    }
  });
  return Response.json({ diterima: true }, { status: 202 });
}
