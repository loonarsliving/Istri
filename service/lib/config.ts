/**
 * Konfigurasi layanan advisor. Semua rahasia hanya dari environment Vercel
 * proyek advisor — tidak pernah di repo (repo Istri publik).
 *
 * D-2026-005/006: kunci Gemini di sini KHUSUS advisor. AI MK Connect (kunci &
 * model lamanya) tidak disentuh.
 */
export const CONFIG = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  /** Model kuat untuk semua pekerjaan advisor. Diverifikasi lewat /api/advisor/health. */
  model: process.env.ADVISOR_GEMINI_MODEL ?? "gemini-3.1-pro-preview",
  /** Cadangan bila model kuat gagal/sibuk — tetap memakai kunci advisor. */
  fallbackModel: process.env.ADVISOR_FALLBACK_MODEL ?? "gemini-3.1-flash-lite",
  thinkingLevel: (process.env.ADVISOR_THINKING_LEVEL ?? "HIGH") as "MINIMAL" | "LOW" | "MEDIUM" | "HIGH",
  maxOutputTokens: Number(process.env.ADVISOR_MAX_OUTPUT_TOKENS ?? "8192"),
  timeoutMs: Number(process.env.ADVISOR_TIMEOUT_MS ?? "120000"),
  /** Rahasia bersama MK Connect ↔ advisor (masuk: header x-advisor-bridge-secret; keluar: x-internal-secret ke /api/wa/send). */
  bridgeSecret: process.env.ADVISOR_BRIDGE_SECRET ?? "",
  mkConnectUrl: (process.env.MK_CONNECT_URL ?? "https://mkh.haluoleo.id").replace(/\/+$/, ""),
  aiCfoUrl: process.env.LOONARS_AI_CFO_URL ?? "https://finance.haluoleo.id/api/cfo/advisor",
  aiCfoSecret: process.env.LOONARS_AI_CFO_SECRET ?? "",
  /**
   * Register advisor (tabel advisor_* di database MKH Property, D-2026-005/007).
   * Kunci anon bukan rahasia; aksesnya digerbang header x-advisor-secret =
   * LOONARS_AI_CFO_SECRET (rahasia Vault advisor_shared_secret yang sama).
   */
  dbUrl: (process.env.LOONARS_DB_URL ?? "https://gluoioiimapyhchdasfl.supabase.co").replace(/\/+$/, ""),
  dbAnonKey: process.env.LOONARS_DB_ANON_KEY ?? "",
  /** Vercel Cron mengirim Authorization: Bearer <CRON_SECRET>. Kosong = pengingat menolak (fail closed). */
  cronSecret: process.env.CRON_SECRET ?? "",
} as const;

export function missingConfig(): string[] {
  const missing: string[] = [];
  if (!CONFIG.geminiApiKey) missing.push("GEMINI_API_KEY");
  if (CONFIG.bridgeSecret.length < 32) missing.push("ADVISOR_BRIDGE_SECRET");
  if (CONFIG.aiCfoSecret.length < 32) missing.push("LOONARS_AI_CFO_SECRET");
  if (!CONFIG.dbAnonKey) missing.push("LOONARS_DB_ANON_KEY");
  if (CONFIG.cronSecret.length < 32) missing.push("CRON_SECRET");
  return missing;
}
