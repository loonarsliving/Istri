import { describe, expect, it } from "vitest";

import { rencanaDariPesan } from "@/lib/aicfo";
import { pilihBoard, pisahSyarat, sistemSeat } from "@/lib/board";
import { bagiPesan, kenali, proses, susunPengingat, type DepsFitur } from "@/lib/fitur";
import { sumberDariRespons, bacaJson, type OpsiModel } from "@/lib/gemini";
import type { Keputusan, Register } from "@/lib/register";

function regPalsu(awal: Keputusan[] = []) {
  const db = { keputusan: [...awal], dokumen: [] as { id: number; jenis: string; judul: string; isi: string; dibuat: string }[], set: {} as Record<string, string>, log: [] as string[] };
  const reg: Register = {
    daftar: async () => db.keputusan,
    simpan: async (k) => {
      const id = k.id ?? `D-2026-${String(db.keputusan.length + 8).padStart(3, "0")}`;
      const lama = db.keputusan.find((x) => x.id === id);
      const baru: Keputusan = { id, judul: k.judul, tanggal: "2026-11-11", status: k.status ?? "PROPOSED", review_on: k.review_on ?? null, confirmed_at: null, isi: k.isi, syarat: (k.syarat ?? []).map((s, i) => ({ id: i + 1, teks: s.teks, tenggat: s.tenggat ?? null, status: "terbuka" })) };
      db.keputusan = lama ? db.keputusan.map((x) => (x.id === id ? baru : x)) : [...db.keputusan, baru];
      db.log.push(`simpan ${id}`);
      return { id, status: baru.status };
    },
    konfirmasi: async (id) => {
      const k = db.keputusan.find((x) => x.id === id);
      if (!k) return { hasil: "tidak_ada", id };
      if (k.status !== "PROPOSED") return { hasil: `status_${k.status.toLowerCase()}`, id };
      k.status = "CONFIRMED";
      return { hasil: "confirmed", id };
    },
    syaratUbah: async (id, status) => ({ id, status }),
    jatuhTempo: async () => [{ id: 3, keputusan_id: "D-2026-008", teks: "Cek okupansi", tenggat: "2026-11-12" }],
    dokumenSimpan: async (jenis, judul, isi) => {
      const id = db.dokumen.length + 1;
      db.dokumen.push({ id, jenis, judul, isi, dibuat: "2026-11-11T00:00:00Z" });
      return id;
    },
    dokumenAmbil: async (id) => db.dokumen.find((d) => d.id === id) ?? null,
    dokumenTerbaru: async () => db.dokumen,
    setel: async (k, v) => {
      db.set[k] = v;
      return null;
    },
    ambil: async (k) => db.set[k] ?? null,
  };
  return { db, reg };
}

function deps(reg: Register, jawabModel: (sistem: string, pengguna: string, opsi?: OpsiModel) => string, panggilan: string[] = []): DepsFitur {
  return {
    reg,
    hariIni: () => "2026-11-11",
    ambilFaktaCfo: async () => ({ tersedia: true, hariIni: "2026-11-11", fakta: [], catatan: "" }),
    evaluasiCfo: async () => ({ tersedia: true, catatan: "", putusan: "aman", ringkas: "aman", alasan: [], alternatif: [], maksAmanSekarang: 0, tundaAmanHari: null }),
    daftarKeputusan: () => reg.daftar(),
    tanyaModel: async (sistem, pengguna, opsi) => {
      panggilan.push(sistem.slice(0, 60));
      return { teks: jawabModel(sistem, pengguna, opsi), model: "m", tokenMasuk: 1, tokenKeluar: 1, cadangan: false, sumber: opsi?.cari ? [{ judul: "Contoh", url: "https://contoh.id/a" }] : undefined };
    },
  };
}

describe("kenali perintah WA", () => {
  it("perintah register & board dikenali, sisanya diskusi bebas", () => {
    expect(kenali("advisor: menu").jenis).toBe("menu");
    expect(kenali("keputusan saya").jenis).toBe("daftar");
    expect(kenali("konfirmasi d-2026-008")).toEqual({ jenis: "konfirmasi", id: "D-2026-008" });
    expect(kenali("bahas D-2026-008")).toEqual({ jenis: "bahas_id", id: "D-2026-008", penuh: false });
    expect(kenali("board penuh: buka cabang di Bali")).toEqual({ jenis: "bahas", topik: "buka cabang di Bali", penuh: true });
    expect(kenali("catat keputusan dari board 12: saya setuju renovasi")).toEqual({ jenis: "catat", teks: "saya setuju renovasi", dokumen: 12 });
    expect(kenali("advisor riset: harga villa di Ubud")).toEqual({ jenis: "riset", topik: "harga villa di Ubud" });
    expect(kenali("advisor detail 7")).toEqual({ jenis: "detail", id: 7 });
    expect(kenali("advisor syarat selesai 5")).toEqual({ jenis: "syarat_ubah", id: 5, status: "selesai" });
    expect(kenali("apa yang harus saya lakukan bulan ini?").jenis).toBe("bebas");
  });
});

describe("pemilihan board (decision-review-policy)", () => {
  it("ringkas 3 seat menurut bidang, naik ke 8 seat bila eskalasi", () => {
    expect(pilihBoard("ganti desain logo dan konten instagram")).toMatchObject({ tingkat: "Ringkas", bidang: "Brand & marketing" });
    expect(pilihBoard("ganti desain logo").seat).toHaveLength(3);
    expect(pilihBoard("rekrut karyawan baru").seat).toHaveLength(8);
    expect(pilihBoard("beli kasur", { putusanCfo: "tolak" }).tingkat).toBe("Penuh");
    expect(pilihBoard("apa strategi kita", { penuh: true }).seat).toHaveLength(8);
  });
  it("lens seat dan format memo masuk ke prompt", () => {
    const s = sistemSeat("cfo-advisor", "KONTEKS");
    expect(s).toContain("CFO Advisor");
    expect(s).toContain("Format memo seat");
  });
  it("syarat dipisah dari ringkasan chair", () => {
    const r = pisahSyarat('*Putusan board*: APPROVE IF\nSYARAT_JSON: [{"teks":"Uji 1 kamar dulu","tenggat":"2026-12-01"},{"teks":"x"}]');
    expect(r.ringkasan).toBe("*Putusan board*: APPROVE IF");
    expect(r.syarat).toEqual([{ teks: "Uji 1 kamar dulu", tenggat: "2026-12-01" }]);
  });
});

describe("alur keputusan via WA", () => {
  it("catat → belum dibahas → bahas → konfirmasi", async () => {
    const { db, reg } = regPalsu();
    const d = deps(reg, (sistem, _p, opsi) => {
      if (opsi?.json) return JSON.stringify({ judul: "Renovasi 1 kamar", final_decision: "Renovasi 1 kamar dulu", review_on: "2026-12-11", syarat: [{ teks: "Bandingkan 2 vendor", tenggat: "2026-11-20" }] });
      if (sistem.startsWith("Kamu Chairman")) return '*Putusan board*: APPROVE IF\nSYARAT_JSON: [{"teks":"Batasi 1 kamar","tenggat":null}]';
      return "# memo\nSkor: 7 | Vote: APPROVE IF";
    });
    const [c] = await proses("catat keputusan: saya putuskan renovasi 1 kamar dulu", d);
    expect(c).toContain("D-2026-008 dicatat (PROPOSED)");
    expect(c).toContain("bahas D-2026-008");

    const [tolak] = await proses("konfirmasi D-2026-008", d);
    expect(tolak).toContain("belum dibahas");
    expect(db.keputusan[0].status).toBe("PROPOSED");

    const [sidang] = await proses("bahas D-2026-008", d);
    expect(sidang).toContain("Sidang board");
    expect(sidang).toContain("advisor detail 1");
    expect(db.keputusan[0].isi.dibahas).toBe(true);
    expect(db.keputusan[0].syarat.map((s) => s.teks)).toEqual(["Bandingkan 2 vendor", "Batasi 1 kamar"]);

    const [ok] = await proses("konfirmasi D-2026-008", d);
    expect(ok).toContain("D-2026-008 CONFIRMED");
    const [lagi] = await proses("konfirmasi D-2026-008", d);
    expect(lagi).toContain("CONFIRMED");
    expect(lagi).toContain("tidak bisa dikonfirmasi");
  });

  it("board ringkas memanggil 3 seat + chair dan menyimpan dokumen", async () => {
    const { db, reg } = regPalsu();
    const panggil: string[] = [];
    const d = deps(reg, (sistem) => (sistem.startsWith("Kamu Chairman") ? "*Putusan board*: APPROVE\nSYARAT_JSON: []" : "memo"), panggil);
    await proses("bahas: ganti logo dan konten instagram", d);
    expect(panggil.filter((p) => p.startsWith("Kamu adalah seat"))).toHaveLength(3);
    expect(db.dokumen[0].jenis).toBe("board");
    expect(db.dokumen[0].isi).toContain("## Memo Marketing Director");
  });

  it("riset menyertakan URL dari grounding, bukan karangan model", async () => {
    const { db, reg } = regPalsu();
    const [r] = await proses("advisor riset: harga villa di Ubud", deps(reg, () => "*Temuan utama* ..."));
    expect(r).toContain("https://contoh.id/a");
    expect(db.dokumen[0].jenis).toBe("riset");
  });

  it("pengingat hanya bila ada yang jatuh tempo", async () => {
    const { reg } = regPalsu([{ id: "D-2026-008", judul: "Renovasi", tanggal: "2026-11-01", status: "CONFIRMED", review_on: "2026-11-12", confirmed_at: null, isi: {}, syarat: [] }]);
    const p = await susunPengingat(reg, "2026-11-11");
    expect(p).toContain("Cek okupansi");
    expect(p).toContain("waktunya ditinjau");
  });
});

describe("utilitas", () => {
  it("rencana uang keluar dikenali dari pesan", () => {
    expect(rencanaDariPesan("saya mau beli mobil operasional 250 juta untuk villa")).toMatchObject({ nominal: 250e6, lini: "L1" });
    expect(rencanaDariPesan("bayar vendor L2 Rp 15.000.000 dicicil 3 kali")).toMatchObject({ nominal: 15e6, lini: "L2", cicilan: 3 });
    expect(rencanaDariPesan("apa fokus saya minggu ini?")).toBeNull();
    expect(rencanaDariPesan("tambah 2 kamar tahun 2027")).toBeNull();
  });
  it("pesan panjang dibagi", () => {
    const b = bagiPesan("baris\n".repeat(2000));
    expect(b.length).toBeGreaterThan(1);
    expect(b[0].startsWith("(1/")).toBe(true);
  });
  it("sumber grounding unik & JSON model terbaca", () => {
    const s = sumberDariRespons({ candidates: [{ groundingMetadata: { groundingChunks: [{ web: { uri: "https://a", title: "A" } }, { web: { uri: "https://a" } }] } }] });
    expect(s).toEqual([{ judul: "A", url: "https://a" }]);
    expect(bacaJson<{ a: number }>('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
});
