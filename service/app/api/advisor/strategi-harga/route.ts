import { secretsMatch } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { bagiPesan, depsBawaan, depsStrategi } from "@/lib/fitur";
import { strategiHarga } from "@/lib/strategi";
import { kirimWa } from "@/lib/wa";

/**
 * GET /api/advisor/strategi-harga — Vercel Cron tiap Senin (D-2026-011).
 * Strategi harga villa ke WA owner. Tidak mengubah harga apa pun. Fail closed tanpa CRON_SECRET.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization") ?? "";
  if (!secretsMatch(auth.replace(/^Bearer\s+/i, ""), CONFIG.cronSecret)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const deps = depsBawaan();
  const nomor = await deps.reg.ambil("owner_wa");
  if (!nomor) return Response.json({ dikirim: false, alasan: "nomor owner belum tercatat" });
  try {
    const h = await strategiHarga(depsStrategi(deps));
    for (const p of bagiPesan(h.teks)) await kirimWa(nomor, p);
    return Response.json({ dikirim: true, dokumen: h.idDok });
  } catch (e) {
    console.error("strategi harga gagal", e);
    return Response.json({ dikirim: false, alasan: "gagal" }, { status: 500 });
  }
}
