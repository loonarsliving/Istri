import { CONFIG, missingConfig } from "@/lib/config";
import { cekModel } from "@/lib/gemini";

/**
 * GET /api/advisor/health — status konfigurasi (hanya ya/tidak, tanpa nilai
 * rahasia) dan apakah model yang dikonfigurasi tersedia di akun Gemini advisor.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const missing = missingConfig();
  const model = CONFIG.geminiApiKey ? await cekModel(CONFIG.model) : { ada: false, pesan: "GEMINI_API_KEY belum diatur" };
  const cadangan = CONFIG.geminiApiKey ? await cekModel(CONFIG.fallbackModel) : { ada: false, pesan: "-" };
  return Response.json({
    ok: missing.length === 0 && model.ada,
    belumDiatur: missing,
    model: { nama: CONFIG.model, ...model },
    cadangan: { nama: CONFIG.fallbackModel, ...cadangan },
    thinkingLevel: CONFIG.thinkingLevel,
  });
}
