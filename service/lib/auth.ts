import { timingSafeEqual } from "node:crypto";

/** Perbandingan waktu-konstan (pola sama dengan MK Connect lib/security/cron-auth.ts). */
export function secretsMatch(provided: string, expected: string): boolean {
  if (expected.length < 32) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

/** Nomor WA Indonesia → format 62…; null bila tidak valid. */
export function normalisasiNomor(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const n = v.replace(/\D/g, "").replace(/^0/, "62");
  return /^62\d{8,14}$/.test(n) ? n : null;
}
