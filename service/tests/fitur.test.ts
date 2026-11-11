import { describe, expect, it } from "vitest";

import { rencanaDariPesan } from "@/lib/aicfo";
import { SISTEM_CHAIR_RAPAT, pilihBoard, pisahSyarat, sistemSeat } from "@/lib/board";
import { bagiPesan, kenali, proses, susunPengingat, type DepsFitur } from "@/lib/fitur";
import { sumberDariRespons, bacaJson, type OpsiModel } from "@/lib/gemini";
import type { KategoriMemori, Keputusan, Register } from "@/lib/register";

function regPalsu(awal: Keputusan[] = []) {
  const db = { memori: [] as { id: number; kategori: KategoriMemori; teks: string; status: "usulan" | "aktif" | "arsip"; sumber: string; dibuat: string }[], keputusan: [...awal], dokumen: [] as { id: number; jenis: string; judul: string; isi: string; dibuat: string }[], set: {} as Record<string, string>, log: [] as string[] };
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
    memoriTambah: async (kategori, teks, status, sumber) => {
      const id = db.memori.length + 1;
      db.memori.push({ id, kategori, teks, status, sumber, dibuat: "2026-11-11" });
      return id;
    },
    memoriUbah: async (id, status) => {
      const m = db.memori.find((x) => x.id === id);
      if (m) m.status = status;
      return { id, status, ada: Boolean(m) };
    },
    memoriDaftar: async (status) => db.memori.filter((m) => (status ? m.status === status : m.status !== "arsip")),
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
    daftarMemori: () => reg.memoriDaftar(),
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
    expect(pilihBoard("rekrut karyawan baru").seat).toHaveLength(14);
    expect(pilihBoard("persiapan IPO 2030")).toMatchObject({ bidang: "IPO & pasar modal", tingkat: "Standar" });
    expect(pilihBoard("beli kasur", { putusanCfo: "tolak" }).tingkat).toBe("Penuh");
    expect(pilihBoard("apa strategi kita", { penuh: true }).seat).toHaveLength(14);
    expect(pilihBoard("perlu cek kontrak notaris").seat).toEqual(expect.arrayContaining(["legal-compliance", "governance"]));
  });
  it("12 kursi punya lens masing-masing", () => {
    for (const k of ["governance", "legal-compliance", "people-organization", "capital-markets", "hospitality-manager", "capital-office"] as const) expect(sistemSeat(k, "").length).toBeGreaterThan(800);
    expect(pilihBoard("chat tamu lambat dibalas resepsionis").seat).toContain("hospitality-manager");
    expect(pilihBoard("cleaning sering lupa checklist kamar").seat).toContain("hospitality-manager");
    expect(pilihBoard("kapan kita mulai cari pendanaan dari family office").seat[0]).toBe("capital-office");
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
    const r2 = pisahSyarat('*Putusan*: APPROVE\nSYARAT_JSON: []\nMEMORI_JSON: [{"kategori":"beban","teks":"Gaji holding beban tetap terbesar"},{"kategori":"aneh","teks":"Founder memutuskan sendiri"}]');
    expect(r2.ringkasan).toBe("*Putusan*: APPROVE");
    const r3 = pisahSyarat('*Confidence*: High\n\n[{"teks":"Hentikan belanja unit tanpa pembeli","tenggat":"2026-12-01"}]\n[{"kategori":"hambatan","teks":"Data keuangan belum siap audit"}]\n\n');
    expect(r3.ringkasan).toBe("*Confidence*: High");
    expect(r3.syarat).toEqual([{ teks: "Hentikan belanja unit tanpa pembeli", tenggat: "2026-12-01" }]);
    expect(r3.memori).toEqual([{ kategori: "hambatan", teks: "Data keuangan belum siap audit" }]);
    const r4 = pisahSyarat("*Putusan*: OK\n**MEMORI_JSON**: [{\"kategori\":\"beban\",\"teks\":\"Utang gaji cabang lama\"}]");
    expect(r4).toMatchObject({ ringkasan: "*Putusan*: OK", memori: [{ kategori: "beban", teks: "Utang gaji cabang lama" }] });
    expect(r2.memori).toEqual([{ kategori: "beban", teks: "Gaji holding beban tetap terbesar" }, { kategori: "lain", teks: "Founder memutuskan sendiri" }]);
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

describe("memori perusahaan & rapat direksi", () => {
  it("ingat → aktif; board mengusulkan → sahkan; memori masuk ke prompt", async () => {
    const { db, reg } = regPalsu();
    const sistemTerakhir: string[] = [];
    const d = deps(reg, (sistem) => {
      sistemTerakhir.push(sistem);
      if (sistem.startsWith("Kamu Chairman")) return '*Putusan board*: APPROVE\nSYARAT_JSON: []\nMEMORI_JSON: [{"kategori":"hambatan","teks":"Semua keputusan menunggu founder"}]';
      return "memo";
    });
    expect(kenali("advisor ingat beban: gaji holding paling berat")).toEqual({ jenis: "ingat", kategori: "beban", teks: "gaji holding paling berat" });
    expect((await proses("advisor ingat beban: gaji holding paling berat", d))[0]).toContain("memori #1");
    const [sid] = await proses("bahas: ganti logo dan konten instagram", d);
    expect(sid).toContain("Usulan memori dari direksi");
    expect(db.memori[1]).toMatchObject({ status: "usulan", sumber: "board #1" });
    expect(sistemTerakhir.some((x) => x.includes("[M1] Beban: gaji holding paling berat"))).toBe(true);
    expect((await proses("advisor sahkan memori semua", d))[0]).toContain("1 usulan memori disahkan");
    expect(db.memori[1].status).toBe("aktif");
    expect((await proses("advisor lupakan memori 1", d))[0]).toContain("diarsipkan");
    expect((await proses("advisor memori", d))[0]).not.toContain("gaji holding");
  });
  it("rapat kedua membaca notulen bulan lalu; data hospitality & contoh chat hanya ke kursi hospitality", async () => {
    const { reg } = regPalsu();
    const sistem: string[] = [];
    const d = deps(reg, (s) => {
      sistem.push(s);
      return s.startsWith("Kamu Chairman") ? "*Tindak lanjut bulan lalu* ...\n*3 langkah bulan depan*: rapikan jadwal patroli\nSYARAT_JSON: []\nMEMORI_JSON: []" : "memo";
    });
    d.ambilHospitality = async () => ({
      tersedia: true,
      data: {
        periode: { dari: "2026-11-01", sampai: "2026-11-30" },
        sumber: {},
        laporanHarian: { hariDenganLaporan: 28, laporanTerlewat: [{ label: "Patroli", diharapkan: 84, dikirim: 30 }], checklistBelumLengkap: 4, selesaiTanpaVerifikasiFo: 9, keluhanTamu: 1, itemTerlambatMaks: 2 },
        checklistPerStaf: [{ nama: "Sari", total: 7, perJenis: { cleaning: 7 }, gagalAtauMasalah: 1 }],
        tugasKamar: { total: 40, selesai: 38, lewatAppVillaTanpaFo: 9, totalBersihUlang: 3, perCleaning: [], perFo: [] },
        masalah: { total: 0, terbuka: 0, terlambat: 0, tanpaPenanggungJawab: 0, perKategori: {} },
        pengecekanKamarVilla: { total: 37, perHasil: { siap: 35, maintenance: 2 }, perPengecek: {} },
        chatTamu: { percakapanAktif: 300, pesanMasuk: 2500, balasanStaf: 1800, balasanOtomatis: 900, medianMenitBalas: 6, p90MenitBalas: 95, tidakDibalas2Jam: 40, perStatusTamu: { prospek: 200 }, perKategoriAi: { harga: 120 }, contohPesanTamu: ["apakah ada kolam renang pribadi?"] },
        catatan: [],
      },
    });
    await proses("advisor rapat direksi", d);
    sistem.length = 0;
    await proses("advisor rapat direksi", d);
    const seatHosp = sistem.find((s) => s.includes("seat Manager Hospitality AI"))!;
    const seatCfo = sistem.find((s) => s.includes("seat CFO Advisor"))!;
    expect(seatHosp).toContain("apakah ada kolam renang pribadi?");
    expect(seatCfo).not.toContain("apakah ada kolam renang pribadi?");
    expect(seatCfo).toContain("Patroli 30 dari 84");
    expect(seatCfo).toContain("rapikan jadwal patroli");
    expect(seatCfo).not.toContain("ini rapat pertama");
  });

  it("Capital Office memakai riset web; URL dari grounding ditempel ke memo, tidak ada pengiriman email", async () => {
    const { db, reg } = regPalsu();
    const opsiCari: boolean[] = [];
    const d = deps(reg, (s, _p, opsi) => {
      if (s.includes("seat Direksi Capital Office")) opsiCari.push(Boolean(opsi?.cari));
      return s.startsWith("Kamu Chairman") ? "*Capital Office*: belum waktunya\nSYARAT_JSON: []\nMEMORI_JSON: []" : "memo";
    });
    await proses("advisor rapat direksi", d);
    expect(opsiCari).toEqual([true]);
    expect(db.dokumen[0].isi).toContain("https://contoh.id/a");
    expect(SISTEM_CHAIR_RAPAT).toContain("Sistem tidak mengirim email");
  });

  it("rapat direksi memanggil 14 kursi + chair notulen", async () => {
    const { db, reg } = regPalsu();
    const panggil: string[] = [];
    const d = deps(reg, (sistem) => (sistem.startsWith("Kamu Chairman") ? "*Kondisi bulan ini* ...\nSYARAT_JSON: []\nMEMORI_JSON: []" : "memo"), panggil);
    expect(kenali("advisor rapat direksi").jenis).toBe("rapat");
    const [n] = await proses("advisor rapat direksi", d);
    expect(n).toContain("Rapat direksi");
    expect(panggil.filter((p) => p.startsWith("Kamu adalah seat"))).toHaveLength(14);
    expect(panggil.some((p) => p.startsWith("Kamu Chairman AI Board Loonars Mahakarya. Susun NOTULEN"))).toBe(true);
    expect(db.dokumen[0].judul).toContain("Rapat direksi");
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
