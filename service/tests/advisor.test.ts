import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { angkaDalamTeks, angkaTakBerdasar } from "@/lib/angka";
import { samarkan } from "@/lib/aicfo";
import { normalisasiNomor, secretsMatch } from "@/lib/auth";
import { bersihkanAwalan, daftarKeputusan, jawab, perintah } from "@/lib/mentor";
import { rapikanWa } from "@/lib/wa";

describe("penjaga angka", () => {
  it("membaca format rupiah Indonesia", () => {
    expect(angkaDalamTeks("kas Rp 1.005.394.453 dan butuh 305 jt, nilai 7,2 M")).toEqual([1005394453, 305e6, 7.2e9]);
  });
  it("menandai angka yang tidak ada di sumber, mengabaikan tahun", () => {
    const sumber = "[F11] kebutuhan dana: Rp 304.969.407";
    expect(angkaTakBerdasar("butuh Rp 304.969.407 sebelum Feb 2027", sumber)).toEqual([]);
    expect(angkaTakBerdasar("butuh sekitar 305 jt", sumber)).toEqual([]);
    expect(angkaTakBerdasar("laba Rp 999.000.000", sumber)).toEqual([999000000]);
  });
});

describe("keamanan", () => {
  it("rahasia pendek atau salah ditolak", () => {
    expect(secretsMatch("x".repeat(40), "")).toBe(false);
    expect(secretsMatch("a".repeat(40), "b".repeat(40))).toBe(false);
    expect(secretsMatch("c".repeat(40), "c".repeat(40))).toBe(true);
  });
  it("nomor WA dinormalisasi", () => {
    expect(normalisasiNomor("0812-3456-7890")).toBe("6281234567890");
    expect(normalisasiNomor("abc")).toBeNull();
  });
  it("nama customer refund disamarkan sebelum ke model", () => {
    expect(samarkan("Prioritas bayar #1: Refund Budi Santoso Rp 200.000.000")).toBe("Prioritas bayar #1: Refund customer Rp 200.000.000");
  });
});

describe("perintah tanpa AI", () => {
  it("awalan dibuang, menu & daftar keputusan tanpa model", () => {
    expect(bersihkanAwalan("Advisor: apa fokus saya?")).toBe("apa fokus saya?");
    expect(perintah("menu")).toContain("Loonars AI Advisor");
    expect(perintah("keputusan saya")).toContain("D-2026-004");
    expect(daftarKeputusan()).toContain("CONFIRMED");
    expect(perintah("apa fokus saya minggu ini?")).toBeNull();
  });
  it("pesan WA panjang dipotong rapi", () => {
    expect(rapikanWa("a".repeat(5000)).length).toBeLessThanOrEqual(3500);
  });
});

describe("jawab (dengan model & AI CFO palsu)", () => {
  const cfo = async () => ({ tersedia: true, hariIni: "2026-11-11", fakta: [{ id: "F11", label: "Kebutuhan dana", teks: "Rp 304.969.407", sumber: "x" }], catatan: "" });
  it("jawaban berangka sah lolos tanpa peringatan", async () => {
    const j = await jawab("advisor: aman tidak?", {
      ambilFaktaCfo: cfo,
      tanyaModel: async () => ({ teks: "*Diagnosis* keuangan. Butuh Rp 304.969.407 [F11].", model: "m", tokenMasuk: 1, tokenKeluar: 1, cadangan: false }),
    });
    expect(j.angkaTakBerdasar).toEqual([]);
    expect(j.teks).not.toContain("⚠️");
  });
  it("angka karangan diulang sekali lalu diberi peringatan", async () => {
    let n = 0;
    const j = await jawab("advisor: berapa laba?", {
      ambilFaktaCfo: cfo,
      tanyaModel: async () => ({ teks: `Laba Rp 777.000.000 (${++n})`, model: "m", tokenMasuk: 1, tokenKeluar: 1, cadangan: false }),
    });
    expect(n).toBe(2);
    expect(j.teks).toContain("⚠️");
  });
});

describe("isi pengetahuan sinkron dengan repo", () => {
  it("content.generated.ts sama dengan hasil sync-content", async () => {
    const repo = path.resolve(__dirname, "..", "..");
    if (!fs.existsSync(path.join(repo, "knowledge-base"))) return;
    const mod = await import("../scripts/sync-content.mjs");
    const expected = mod.render(mod.collect());
    expect(fs.readFileSync(path.resolve(__dirname, "..", "lib", "content.generated.ts"), "utf8")).toBe(expected);
  });
  it("tidak ada angka keuangan / rahasia di isi yang dibundel", () => {
    const t = fs.readFileSync(path.resolve(__dirname, "..", "lib", "content.generated.ts"), "utf8");
    expect(t).not.toMatch(/Rp\s?\d{1,3}(\.\d{3}){2,}/);
    expect(t).not.toMatch(/eyJhbGciOi/);
  });
});
