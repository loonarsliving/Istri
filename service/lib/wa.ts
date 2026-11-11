import { CONFIG } from "./config";

/** WA maksimal ±4096 karakter; dipotong rapi agar tidak gagal kirim. */
export function rapikanWa(teks: string, maks = 3500): string {
  const t = teks.replace(/\n{3,}/g, "\n\n").trim();
  return t.length <= maks ? t : `${t.slice(0, maks - 40).trimEnd()}\n\n… (dipotong, tanyakan lanjutannya)`;
}

/** Kirim WA lewat jembatan MK Connect (POST /api/wa/send) — WA milik MK Connect, advisor tidak punya nomor sendiri. */
export async function kirimWa(nomor: string, pesan: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  try {
    const res = await fetchImpl(`${CONFIG.mkConnectUrl}/api/wa/send`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-secret": CONFIG.bridgeSecret },
      body: JSON.stringify({ phone: nomor, message: rapikanWa(pesan) }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) console.error("kirimWa gagal", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (e) {
    console.error("kirimWa error", e);
    return false;
  }
}
