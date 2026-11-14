import { describe, expect, it } from "vitest";

import { narasiOtak, sistemOtak, tandaOtak, verifikasiTanda } from "@/lib/otak-cfo";
import type { TanyaModel } from "@/lib/gemini";

const RAHASIA = "r".repeat(48);

describe("otak AI CFO — tanda tangan dari database MKH Property", () => {
  const body = JSON.stringify({ pengguna: "DAFTAR FAKTA: [F1] Kas: Rp 1.000.000" });
  const ts = Math.floor(Date.now() / 1000);
  it("tanda yang benar diterima", () => {
    expect(verifikasiTanda(String(ts), tandaOtak(ts, body, RAHASIA), body, RAHASIA)).toBe(true);
  });
  it("isi diubah, rahasia salah, kedaluwarsa, atau rahasia kosong → ditolak", () => {
    const sig = tandaOtak(ts, body, RAHASIA);
    expect(verifikasiTanda(String(ts), sig, body + " ", RAHASIA)).toBe(false);
    expect(verifikasiTanda(String(ts), sig, body, "s".repeat(48))).toBe(false);
    expect(verifikasiTanda(String(ts - 600), tandaOtak(ts - 600, body, RAHASIA), body, RAHASIA)).toBe(false);
    expect(verifikasiTanda(String(ts), sig, body, "")).toBe(false);
  });
});

describe("otak AI CFO — narasi", () => {
  it("lingkup hanya Loonars 1 & 2, aturan angka mutlak", () => {
    const s = sistemOtak(null, null);
    expect(s).toMatch(/hanya Loonars 1/);
    expect(s).toMatch(/Gunakan HANYA angka dari DAFTAR FAKTA/);
  });
  it("angka tak berdasar → ditulis ulang sekali; tetap salah → dilaporkan", async () => {
    const jawaban = ["Kas Rp 9.999.999 [F1]", "Kas Rp 1.000.000 [F1]"];
    let n = 0;
    const tanya: TanyaModel = async () => ({ teks: jawaban[n++], model: "m", tokenMasuk: null, tokenKeluar: null, cadangan: false });
    const h = await narasiOtak("[F1] Kas: Rp 1.000.000", { tanyaModel: tanya });
    expect(n).toBe(2);
    expect(h.angkaTakBerdasar).toEqual([]);
    const selaluSalah: TanyaModel = async () => ({ teks: "Rp 5.555.555", model: "m", tokenMasuk: null, tokenKeluar: null, cadangan: false });
    expect((await narasiOtak("[F1] Kas: Rp 1.000.000", { tanyaModel: selaluSalah })).angkaTakBerdasar).toEqual([5555555]);
  });
});
