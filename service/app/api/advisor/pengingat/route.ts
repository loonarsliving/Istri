import { secretsMatch } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { susunPengingat } from "@/lib/fitur";
import { register } from "@/lib/register";
import { kirimWa } from "@/lib/wa";

/**
 * GET /api/advisor/pengingat — Vercel Cron harian (vercel.json). Mengirim WA
 * ke owner bila ada syarat jatuh tempo ≤3 hari atau keputusan yang waktunya
 * ditinjau. Fail closed: tanpa CRON_SECRET yang cocok → 401.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization") ?? "";
  if (!secretsMatch(auth.replace(/^Bearer\s+/i, ""), CONFIG.cronSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const reg = register();
  const hariIni = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  const nomor = await reg.ambil("owner_wa");
  if (!nomor) return Response.json({ dikirim: false, alasan: "nomor owner belum tercatat (kirim satu pesan ke advisor dulu)" });
  const pesan = await susunPengingat(reg, hariIni);
  if (!pesan) return Response.json({ dikirim: false, alasan: "tidak ada yang jatuh tempo" });
  const ok = await kirimWa(nomor, pesan);
  return Response.json({ dikirim: ok });
}
