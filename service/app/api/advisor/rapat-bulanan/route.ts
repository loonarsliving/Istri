import { secretsMatch } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { depsBawaan, rapat } from "@/lib/fitur";
import { kirimWa } from "@/lib/wa";

/**
 * GET /api/advisor/rapat-bulanan — Vercel Cron tanggal 1 tiap bulan (D-2026-008).
 * Rapat direksi semua kursi (14), notulen dikirim ke WA owner. Fail closed tanpa CRON_SECRET.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization") ?? "";
  if (!secretsMatch(auth.replace(/^Bearer\s+/i, ""), CONFIG.cronSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const deps = depsBawaan();
  const nomor = await deps.reg.ambil("owner_wa");
  if (!nomor) return Response.json({ dikirim: false, alasan: "nomor owner belum tercatat" });
  try {
    const pesan = await rapat(deps);
    for (const p of pesan) await kirimWa(nomor, p);
    return Response.json({ dikirim: true, bagian: pesan.length });
  } catch (e) {
    console.error("rapat bulanan gagal", e);
    await kirimWa(nomor, "⚠️ Rapat direksi bulanan gagal disusun kali ini. Ketik *advisor rapat direksi* untuk mengulang.");
    return Response.json({ dikirim: false, alasan: "gagal" }, { status: 500 });
  }
}
