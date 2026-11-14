import { describe, expect, it } from "vitest";

import type { KonteksCfo } from "@/lib/aicfo";
import { kenali } from "@/lib/fitur";
import type { TanyaModel } from "@/lib/gemini";
import { hargaSebagaiTeks, kesiapanDariFakta, kirimSaranVando, risetLokasi, strategiHarga, type DepsStrategi, type HasilHarga } from "@/lib/strategi";

const cfo = (teks: string): KonteksCfo => ({
  tersedia: true,
  hariIni: "2026-11-14",
  catatan: "",
  fakta: [
    { id: "F1", label: "Kesiapan membuka lokasi Loonars berikutnya", teks, sumber: "x" },
    { id: "F2", label: "RAB acuan villa berikutnya — tipe 1 Kamar: per unit", teks: "Rp 178.823.529", sumber: "x" },
  ],
});

const harga: HasilHarga = {
  tersedia: true,
  data: {
    hariIni: "2026-11-14",
    properti: [
      {
        kode: "PL",
        unit: 13,
        unitMaintenance: 0,
        lalu30Hari: { label: "30 hari terakhir", dari: "2026-10-15", sampai: "2026-11-13", malamTersedia: 390, malamTerjual: 300, okupansiPct: 76.9, adr: 610000, revpar: 469231 },
        kedepan: [],
        tipe: [
          {
            kode: "standard",
            nama: "Standard",
            unit: 10,
            batas: { dasar: 500000, min: 500000, maks: 1000000 },
            harga30Hari: { hari: 30, min: 550000, median: 600000, maks: 750000 },
            kompetitor60Hari: { n: 19, median: 700000, min: 450000, maks: 1200000, terakhir: "2026-11-10", lokasi: ["Sleman"] },
          },
        ],
      },
    ],
    mesin: { ambangOkupansiTinggiPct: 80, ambangOkupansiRendahPct: 30, gerakHarianMaksPct: 15, autopushAktif: true, rekomendasi30Hari: {}, rataDeltaPct30Hari: null },
    musimRamai: [],
    catatan: [],
  },
};

function deps(jawaban: string[], fakta: KonteksCfo): DepsStrategi & { panggil: number } {
  const d = {
    panggil: 0,
    tanyaModel: (async () => ({ teks: jawaban[Math.min(d.panggil++, jawaban.length - 1)], model: "m", tokenMasuk: null, tokenKeluar: null, cadangan: false, sumber: [] })) as TanyaModel,
    ambilFaktaCfo: async () => fakta,
    ambilHarga: async () => harga,
    simpanDokumen: async () => 7,
    hariIni: () => "2026-11-14",
  };
  return d;
}

describe("strategi harga & lokasi", () => {
  it("perintah WA dikenali", () => {
    expect(kenali("advisor strategi harga").jenis).toBe("harga");
    expect(kenali("advisor lokasi").jenis).toBe("lokasi");
  });

  it("data harga bernomor [H..], autopush disebut", () => {
    const t = hargaSebagaiTeks(harga);
    expect(t).toMatch(/\[H1\] Loonars Private Living/);
    expect(t).toMatch(/autopush MENYALA/);
    expect(hargaSebagaiTeks({ tersedia: false, catatan: "x" })).toMatch(/NEEDS DATA/);
  });

  it("harga rupiah karangan ditulis ulang; persen boleh", async () => {
    const d = deps(["Naikkan jadi Rp 655.000", "Naikkan 8% [H5]"], cfo("BELUM SIAP — ✗ x"));
    const h = await strategiHarga(d);
    expect(d.panggil).toBe(2);
    expect(h.teks).toMatch(/Naikkan 8%/);
    expect(h.teks).not.toMatch(/⚠️/);
  });

  it("kesiapan dibaca dari fakta AI CFO, tidak dihitung ulang", () => {
    expect(kesiapanDariFakta(cfo("SIAP — ✓ semua")).status).toBe("siap");
    expect(kesiapanDariFakta(cfo("BELUM SIAP — ✗ talangan")).status).toBe("belum");
    expect(kesiapanDariFakta({ tersedia: false, hariIni: null, fakta: [], catatan: "mati" }).status).toBe("tidak_tersedia");
  });

  it("saran ke Vando hanya saat SIAP, sekali per transisi, tanpa nama owner", async () => {
    const simpan = new Map<string, string>([["vando_wa", "6281200000000"]]);
    const reg = { ambil: async (k: string) => simpan.get(k) || null, setel: async (k: string, v: string) => void simpan.set(k, v) };
    const terkirim: string[] = [];
    const kirim = async (_n: string, p: string) => (terkirim.push(p), true);

    const belum = await risetLokasi(deps(["Area A, B, C"], cfo("BELUM SIAP — ✗ talangan")));
    expect(belum.teksVando).toBeNull();
    expect(await kirimSaranVando(belum, reg, kirim, "2026-11-14")).toBe(false);

    const siap = await risetLokasi(deps(["Area A, B, C"], cfo("SIAP — ✓ semua")));
    expect(await kirimSaranVando(siap, reg, kirim, "2026-12-15")).toBe(true);
    expect(await kirimSaranVando(siap, reg, kirim, "2027-01-15")).toBe(false); // sudah dikirim
    expect(terkirim).toHaveLength(1);
    expect(terkirim[0]).not.toMatch(/Avi|owner/i);

    await kirimSaranVando(belum, reg, kirim, "2027-02-15"); // kembali belum → reset
    expect(await kirimSaranVando(siap, reg, kirim, "2027-03-15")).toBe(true);
  });
});
