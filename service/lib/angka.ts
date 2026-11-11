/**
 * Penjaga angka (pola MK Connect owner-angka.ts & AI CFO validasiJawaban):
 * setiap nominal ≥ 1.000 di jawaban model harus ada di data yang diberikan
 * (fakta AI CFO / knowledge base / pertanyaan founder), toleransi 1%.
 * Advisor tidak boleh mengarang angka (CLAUDE.md, master instruction).
 */

/** Ambil angka dari teks Indonesia: "Rp 1.250.000", "305 jt", "1,5 M", "Rp 4,16 M", "20.000". */
export function angkaDalamTeks(teks: string): number[] {
  const hasil: number[] = [];
  const re = /(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)\s*(miliar|milyar|m\b|juta|jt\b|ribu|rb\b|k\b)?/gi;
  for (const m of teks.matchAll(re)) {
    const raw = m[1];
    const unit = (m[2] ?? "").toLowerCase();
    let nilai: number;
    if (raw.includes(".") && /^\d{1,3}(\.\d{3})+$/.test(raw)) nilai = Number(raw.replace(/\./g, ""));
    else nilai = Number(raw.replace(",", "."));
    if (!Number.isFinite(nilai)) continue;
    if (unit.startsWith("mil") || unit === "m") nilai *= 1e9;
    else if (unit === "juta" || unit === "jt") nilai *= 1e6;
    else if (unit === "ribu" || unit === "rb" || unit === "k") nilai *= 1e3;
    if (nilai >= 1000) hasil.push(nilai);
  }
  return hasil;
}

/** Nominal di jawaban yang tidak ditemukan di sumber (toleransi relatif 1%). Tahun (1900–2100) diabaikan. */
export function angkaTakBerdasar(jawaban: string, sumber: string): number[] {
  const dasar = angkaDalamTeks(sumber);
  return angkaDalamTeks(jawaban).filter((n) => {
    if (n >= 1900 && n <= 2100 && Number.isInteger(n)) return false;
    return !dasar.some((d) => Math.abs(d - n) <= Math.max(1, Math.abs(d) * 0.01));
  });
}
