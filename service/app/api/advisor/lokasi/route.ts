import { secretsMatch } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { bagiPesan, depsBawaan, depsStrategi } from "@/lib/fitur";
import { kirimSaranVando, risetLokasi } from "@/lib/strategi";
import { kirimWa } from "@/lib/wa";

/**
 * GET /api/advisor/lokasi — Vercel Cron tanggal 15 (D-2026-011).
 * Riset lokasi Loonars berikutnya di DIY → WA owner; saran survei ke Kepala
 * Cabang Jogja hanya bila AI CFO menyatakan keuangan SIAP (sekali per transisi).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization") ?? "";
  if (!secretsMatch(auth.replace(/^Bearer\s+/i, ""), CONFIG.cronSecret)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const deps = depsBawaan();
  const nomor = await deps.reg.ambil("owner_wa");
  try {
    const h = await risetLokasi(depsStrategi(deps));
    const keVando = await kirimSaranVando(h, deps.reg, kirimWa, deps.hariIni());
    if (nomor) for (const p of bagiPesan(h.teksOwner + (keVando ? "\n\n📨 Saran survei sudah dikirim ke Kepala Cabang Jogja." : ""))) await kirimWa(nomor, p);
    return Response.json({ kesiapan: h.kesiapan.status, keOwner: !!nomor, keVando, dokumen: h.idDok });
  } catch (e) {
    console.error("riset lokasi gagal", e);
    return Response.json({ error: "gagal" }, { status: 500 });
  }
}
