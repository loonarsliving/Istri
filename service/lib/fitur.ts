import { ambilFaktaCfo, evaluasiCfo } from "./aicfo";
import { angkaTakBerdasar } from "./angka";
import { SEMUA_SEAT, pilihBoard, sidang, type HasilBoard } from "./board";
import { CONTENT } from "./content.generated";
import { ambilHospitality, contohChatSebagaiTeks, hospitalitySebagaiTeks, type HasilHospitality } from "./hospitality";
import { bacaJson, tanyaModel, type TanyaModel } from "./gemini";
import { MENU, bersihkanAwalan, daftarKeputusan, daftarKeputusanDb, jawab, kumpulkanKonteks, teksKonteks, type DepsMentor } from "./mentor";
import { KATEGORI_MEMORI, register, type KategoriMemori, type Keputusan, type Register } from "./register";

/**
 * Router fitur advisor via WA (D-2026-007). Mengembalikan satu atau lebih
 * pesan WA. Perintah register (daftar/konfirmasi/syarat/detail) tanpa AI;
 * board, catat keputusan, riset, dan diskusi bebas memakai Gemini Pro advisor.
 */
export interface DepsFitur extends DepsMentor {
  reg: Register;
  hariIni: () => string;
  ambilHospitality?: (hari?: number) => Promise<HasilHospitality>;
}

export function depsBawaan(): DepsFitur {
  const reg = register();
  return {
    reg,
    ambilFaktaCfo,
    evaluasiCfo,
    tanyaModel,
    daftarKeputusan: () => reg.daftar(),
    daftarMemori: () => reg.memoriDaftar(),
    ambilHospitality: (hari) => ambilHospitality(hari),
    hariIni: () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }),
  };
}

const ID_KEPUTUSAN = /\bD-\d{4}-\d{3}\b/i;

export type Perintah =
  | { jenis: "menu" }
  | { jenis: "daftar" }
  | { jenis: "konfirmasi"; id: string }
  | { jenis: "bahas_id"; id: string; penuh: boolean }
  | { jenis: "bahas"; topik: string; penuh: boolean }
  | { jenis: "catat"; teks: string; dokumen: number | null }
  | { jenis: "riset"; topik: string }
  | { jenis: "detail"; id: number }
  | { jenis: "dokumen" }
  | { jenis: "syarat" }
  | { jenis: "syarat_ubah"; id: number; status: "selesai" | "batal" | "terbuka" }
  | { jenis: "ingat"; kategori: KategoriMemori; teks: string }
  | { jenis: "memori" }
  | { jenis: "memori_ubah"; id: number | "semua"; status: "aktif" | "arsip" }
  | { jenis: "rapat" }
  | { jenis: "bebas"; teks: string };

const ALIAS_KATEGORI: Record<string, KategoriMemori> = {
  "model bisnis": "model_bisnis",
  bisnis: "model_bisnis",
  beban: "beban",
  hambatan: "hambatan",
  kendala: "hambatan",
  pelajaran: "pelajaran",
  kesalahan: "pelajaran",
  tujuan: "tujuan",
  target: "tujuan",
  aturan: "aturan",
};

/** Kenali perintah (deterministik). Apa pun yang lain = diskusi bebas ke mentor. */
export function kenali(pesanMentah: string): Perintah {
  const p = bersihkanAwalan(pesanMentah);
  const t = p.toLowerCase().trim();
  if (/^(menu|bantuan|help)?$/.test(t)) return { jenis: "menu" };
  if (/^(daftar )?keputusan( saya)?$/.test(t)) return { jenis: "daftar" };
  let m = /^(konfirmasi|sahkan|setujui)\s+(d-\d{4}-\d{3})\b/i.exec(p);
  if (m) return { jenis: "konfirmasi", id: m[2].toUpperCase() };
  m = /^(bahas|board(?: penuh| lengkap)?|sidang(?:kan)?)\s*[:\-]?\s*(d-\d{4}-\d{3})\b/i.exec(p);
  if (m) return { jenis: "bahas_id", id: m[2].toUpperCase(), penuh: /penuh|lengkap/i.test(m[1]) };
  m = /^(bahas|board(?: penuh| lengkap)?|sidang(?:kan)?|bawa ke board)\s*[:\-]\s*([\s\S]{5,})$/i.exec(p);
  if (m) return { jenis: "bahas", topik: m[2].trim(), penuh: /penuh|lengkap/i.test(m[1]) };
  m = /^catat keputusan\s*(?:dari (?:board|sidang|dokumen)\s*#?(\d+))?\s*[:\-]?\s*([\s\S]*)$/i.exec(p);
  if (m && (m[2].trim().length >= 5 || m[1])) return { jenis: "catat", teks: m[2].trim(), dokumen: m[1] ? Number(m[1]) : null };
  m = /^riset\s*[:\-]?\s*([\s\S]{5,})$/i.exec(p);
  if (m) return { jenis: "riset", topik: m[1].trim() };
  m = /^detail\s*#?(\d+)$/i.exec(t);
  if (m) return { jenis: "detail", id: Number(m[1]) };
  if (/^dokumen( terbaru)?$/.test(t)) return { jenis: "dokumen" };
  if (/^syarat( terbuka)?$/.test(t)) return { jenis: "syarat" };
  m = /^syarat\s+(selesai|batal|buka)\s+#?(\d+)$/i.exec(t);
  if (m) return { jenis: "syarat_ubah", id: Number(m[2]), status: m[1] === "buka" ? "terbuka" : (m[1] as "selesai" | "batal") };
  m = /^ingat(?:\s+(model bisnis|bisnis|beban|hambatan|kendala|pelajaran|kesalahan|tujuan|target|aturan))?\s*[:\-]\s*([\s\S]{3,})$/i.exec(p);
  if (m) return { jenis: "ingat", kategori: m[1] ? ALIAS_KATEGORI[m[1].toLowerCase()] : "lain", teks: m[2].trim() };
  if (/^memori( perusahaan)?$/.test(t)) return { jenis: "memori" };
  m = /^(sahkan|lupakan|arsipkan)\s+memori\s+(#?\d+|semua)$/i.exec(t);
  if (m) return { jenis: "memori_ubah", id: m[2] === "semua" ? "semua" : Number(m[2].replace("#", "")), status: m[1] === "sahkan" ? "aktif" : "arsip" };
  if (/^rapat( direksi| board)?( bulanan)?$/.test(t)) return { jenis: "rapat" };
  return { jenis: "bebas", teks: p };
}

/** Potong teks panjang menjadi beberapa pesan WA (maks 4 bagian). */
export function bagiPesan(teks: string, maks = 3300, bagian = 4): string[] {
  const out: string[] = [];
  let sisa = teks.trim();
  while (sisa && out.length < bagian) {
    if (sisa.length <= maks) {
      out.push(sisa);
      sisa = "";
      break;
    }
    let potong = sisa.lastIndexOf("\n", maks);
    if (potong < maks * 0.5) potong = maks;
    out.push(sisa.slice(0, potong).trimEnd());
    sisa = sisa.slice(potong).trimStart();
  }
  if (sisa) out[out.length - 1] += "\n\n… (masih ada lanjutan; isi lengkap tersimpan di register)";
  return out.map((o, i, a) => (a.length > 1 ? `(${i + 1}/${a.length})\n${o}` : o));
}

function teksMemori(daftar: { id: number; kategori: string; teks: string; status: string }[]): string {
  if (!daftar.length) return "🧠 Memori perusahaan masih kosong. Mulai dengan *advisor ingat: …* — misalnya model bisnis, beban terbesar, atau kesalahan yang tidak ingin diulang.";
  const aktif = daftar.filter((m) => m.status === "aktif");
  const usulan = daftar.filter((m) => m.status === "usulan");
  return [
    "🧠 *Memori perusahaan*",
    ...aktif.map((m) => `• #${m.id} [${m.kategori.replace("_", " ")}] ${m.teks}`),
    ...(usulan.length ? ["", "*Usulan direksi (belum disahkan)*", ...usulan.map((m) => `• #${m.id} [${m.kategori.replace("_", " ")}] ${m.teks}`), "", "Sahkan: *advisor sahkan memori <nomor>* atau *semua*. Tolak: *advisor lupakan memori <nomor>*."] : []),
  ].join("\n");
}

/** Simpan usulan memori dari board (status usulan — founder yang mengesahkan). */
async function simpanUsulanMemori(h: HasilBoard, idDok: number, deps: DepsFitur): Promise<string> {
  const id: number[] = [];
  for (const m of h.memori) {
    try {
      id.push(await deps.reg.memoriTambah(m.kategori, m.teks, "usulan", `board #${idDok}`));
    } catch (e) {
      console.error("usulan memori gagal", e);
    }
  }
  if (!id.length) return "";
  return ["", "🧠 *Usulan memori dari direksi*", ...h.memori.slice(0, id.length).map((m, i) => `• #${id[i]} ${m.teks}`), `Sahkan: *advisor sahkan memori ${id.join(" / ")}* atau *semua*.`].join("\n");
}

function cari(daftar: Keputusan[], id: string): Keputusan | undefined {
  return daftar.find((k) => k.id === id);
}

export async function proses(pesanMentah: string, deps: DepsFitur = depsBawaan()): Promise<string[]> {
  const cmd = kenali(pesanMentah);
  switch (cmd.jenis) {
    case "menu":
      return [MENU];
    case "daftar":
      try {
        return [daftarKeputusanDb(await deps.reg.daftar())];
      } catch (e) {
        console.error("register tidak terbaca", e);
        return [`${daftarKeputusan()}\n\nℹ️ Register sedang tidak terbaca; ini daftar dari repo.`];
      }
    case "konfirmasi":
      return [await konfirmasi(cmd.id, deps)];
    case "bahas":
      return bahas(cmd.topik, cmd.penuh, null, deps);
    case "bahas_id": {
      const k = cari(await deps.reg.daftar(), cmd.id);
      if (!k) return [`Keputusan ${cmd.id} tidak ada di register.`];
      if (k.status !== "PROPOSED" && k.status !== "DRAFT") return [`${cmd.id} berstatus ${k.status}; sidang hanya untuk keputusan yang belum disahkan.`];
      const topik = `${k.judul}\nKeputusan yang diusulkan: ${String(k.isi.final_decision ?? "")}\nKonteks: ${String(k.isi.business_context ?? "")}`;
      return bahas(topik, cmd.penuh, k, deps);
    }
    case "catat":
      return [await catat(cmd.teks, cmd.dokumen, deps)];
    case "riset":
      return riset(cmd.topik, deps);
    case "detail": {
      const d = await deps.reg.dokumenAmbil(cmd.id);
      if (!d) return [`Dokumen ${cmd.id} tidak ada.`];
      return bagiPesan(`📄 *${d.judul}* (#${d.id}, ${d.jenis})\n\n${d.isi}`);
    }
    case "dokumen": {
      const ds = await deps.reg.dokumenTerbaru(10);
      if (!ds.length) return ["Belum ada dokumen."];
      return [["🗂️ *Dokumen terbaru*", ...ds.map((d) => `• #${d.id} [${d.jenis}] ${d.judul} — ${d.dibuat.slice(0, 10)}`), "", "Ketik *advisor detail <nomor>*."].join("\n")];
    }
    case "syarat": {
      const daftar = await deps.reg.daftar();
      const baris = daftar.flatMap((k) =>
        k.syarat.filter((s) => s.status === "terbuka").map((s) => `• #${s.id} (${k.id}) ${s.teks}${s.tenggat ? ` — tenggat ${s.tenggat}` : ""}`),
      );
      return [baris.length ? ["📌 *Syarat terbuka*", ...baris, "", "Selesai? ketik *advisor syarat selesai <nomor>*."].join("\n") : "Tidak ada syarat terbuka."];
    }
    case "syarat_ubah": {
      await deps.reg.syaratUbah(cmd.id, cmd.status);
      return [`✅ Syarat #${cmd.id} ditandai *${cmd.status}*.`];
    }
    case "ingat": {
      const id = await deps.reg.memoriTambah(cmd.kategori, cmd.teks, "aktif", "founder");
      return [`🧠 Diingat sebagai memori #${id} (${cmd.kategori.replace("_", " ")}). Direksi akan memakainya di setiap sidang.`];
    }
    case "memori":
      return bagiPesan(teksMemori(await deps.reg.memoriDaftar()));
    case "memori_ubah": {
      if (cmd.id === "semua") {
        if (cmd.status !== "aktif") return ["Untuk melupakan, sebut nomornya satu per satu: *advisor lupakan memori 5*."];
        const usulan = await deps.reg.memoriDaftar("usulan");
        for (const m of usulan) await deps.reg.memoriUbah(m.id, "aktif");
        return [usulan.length ? `✅ ${usulan.length} usulan memori disahkan.` : "Tidak ada usulan memori."];
      }
      const h = await deps.reg.memoriUbah(cmd.id, cmd.status);
      if (!h.ada) return [`Memori #${cmd.id} tidak ada.`];
      return [cmd.status === "aktif" ? `✅ Memori #${cmd.id} disahkan.` : `🗑️ Memori #${cmd.id} diarsipkan (tidak dipakai lagi).`];
    }
    case "rapat":
      return rapat(deps);
    case "bebas":
      return [(await jawab(cmd.teks, deps)).teks];
  }
}

async function konfirmasi(id: string, deps: DepsFitur): Promise<string> {
  const k = cari(await deps.reg.daftar(), id);
  if (!k) return `Keputusan ${id} tidak ada di register.`;
  if (k.status === "PROPOSED" && k.isi.dibahas !== true) {
    return `${id} belum dibahas (D-2026-004: semua keputusan dibahas dulu). Ketik *bahas ${id}* untuk sidang ringkas, lalu konfirmasi lagi.`;
  }
  const h = await deps.reg.konfirmasi(id, `founder via WA ${deps.hariIni()}`);
  if (h.hasil === "confirmed") {
    const syarat = k.syarat.filter((s) => s.status === "terbuka");
    return [
      `✅ *${id} CONFIRMED* — ${k.judul}`,
      k.review_on ? `Ditinjau: ${k.review_on}` : "",
      syarat.length ? `Syarat yang akan saya ingatkan:\n${syarat.map((s) => `• #${s.id} ${s.teks}${s.tenggat ? ` (${s.tenggat})` : ""}`).join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (h.hasil === "tidak_ada") return `Keputusan ${id} tidak ada di register.`;
  return `${id} tidak bisa dikonfirmasi: statusnya ${h.hasil.replace("status_", "").toUpperCase()} (hanya PROPOSED yang bisa disahkan).`;
}

async function bahas(topik: string, penuh: boolean, keputusan: Keputusan | null, deps: DepsFitur): Promise<string[]> {
  const k = await kumpulkanKonteks(topik, deps);
  const pilihan = pilihBoard(topik, { penuh, putusanCfo: k.evaluasi?.tersedia ? k.evaluasi.putusan : undefined });
  let konteks = teksKonteks(k, 20000);
  const ekstra: Partial<Record<(typeof pilihan.seat)[number], string>> = {};
  if (pilihan.seat.includes("hospitality-manager") && deps.ambilHospitality) {
    const hosp = await deps.ambilHospitality(30);
    konteks += `\n=== RINGKASAN HOSPITALITY (30 hari) ===\n${hospitalitySebagaiTeks(hosp)}`;
    ekstra["hospitality-manager"] = contohChatSebagaiTeks(hosp);
  }
  const h = await sidang(topik, konteks, pilihan, deps.tanyaModel, "keputusan", ekstra);
  const idDok = await deps.reg.dokumenSimpan("board", `Sidang ${pilihan.tingkat}: ${topik.split("\n")[0].slice(0, 200)}`, h.dokumen, keputusan?.id);

  let penutup: string;
  if (keputusan) {
    await deps.reg.simpan({
      id: keputusan.id,
      judul: keputusan.judul,
      status: "PROPOSED",
      review_on: keputusan.review_on,
      isi: { ...keputusan.isi, dibahas: true, board_dokumen: idDok, ai_board_analysis: h.ringkasan.slice(0, 4000) },
      syarat: [...keputusan.syarat.filter((s) => s.status === "terbuka").map((s) => ({ teks: s.teks, tenggat: s.tenggat })), ...h.syarat],
    });
    penutup = `Sudah dibahas. Ketik *konfirmasi ${keputusan.id}* untuk mengesahkan, atau ubah dulu dengan *catat keputusan: …*.`;
  } else {
    penutup = `Mau dicatat? Ketik *catat keputusan dari board ${idDok}: <keputusan Anda>*.`;
  }
  const catatan = [
    h.angkaTakBerdasar.length ? "⚠️ Ada angka yang tidak ditemukan di data AI CFO/knowledge base — cek sebelum dipakai." : "",
    !k.cfo.tersedia ? "ℹ️ AI CFO sedang tidak terbaca — angka keuangan belum dipakai." : "",
  ].filter(Boolean);
  const usulan = await simpanUsulanMemori(h, idDok, deps);
  return bagiPesan(
    [
      `🏛️ *Sidang board — ${pilihan.tingkat}* (${pilihan.seat.length} kursi, ${pilihan.alasan})`,
      "",
      h.ringkasan,
      ...catatan,
      usulan,
      "",
      `Memo lengkap: *advisor detail ${idDok}*`,
      penutup,
    ].join("\n"),
  );
}

/** Ringkasan Chairman dari rapat direksi terakhir (pembanding bulan ini). */
export async function notulenSebelumnya(deps: DepsFitur): Promise<{ id: number; judul: string; dibuat: string; ringkasan: string } | null> {
  try {
    const daftar = await deps.reg.dokumenTerbaru(30);
    const terakhir = daftar.find((d) => d.jenis === "board" && d.judul.startsWith("Rapat direksi"));
    if (!terakhir) return null;
    const d = await deps.reg.dokumenAmbil(terakhir.id);
    if (!d) return null;
    const ringkasan = (d.isi.split("## Ringkasan Chairman")[1] ?? d.isi).split("## Memo")[0].trim().slice(0, 6000);
    return { id: d.id, judul: d.judul, dibuat: d.dibuat, ringkasan };
  } catch (e) {
    console.error("notulen sebelumnya tidak terbaca", e);
    return null;
  }
}

/** Rapat direksi bulanan (semua kursi) — dipanggil cron tanggal 1 atau "advisor rapat direksi". */
export async function rapat(deps: DepsFitur): Promise<string[]> {
  const bulan = new Date().toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", month: "long", year: "numeric" });
  const topik = `Rapat direksi bulanan ${bulan}: tinjau kondisi kas & arah (AI CFO), keputusan dan syarat yang waktunya ditinjau, tiga penghambat terbesar perkembangan Loonars Mahakarya, dan langkah bulan depan menuju kesiapan IPO.`;
  const [k, hosp, lalu] = await Promise.all([
    kumpulkanKonteks(topik, deps),
    deps.ambilHospitality ? deps.ambilHospitality(30) : Promise.resolve<HasilHospitality>({ tersedia: false, catatan: "tidak dikonfigurasi" }),
    notulenSebelumnya(deps),
  ]);
  const pilihan = { bidang: "Rapat direksi", tingkat: "Standar" as const, seat: SEMUA_SEAT, alasan: "rapat bulanan" };
  const konteks = [
    teksKonteks(k, 20000),
    "=== NOTULEN RAPAT BULAN LALU (bandingkan & nilai tindak lanjutnya) ===",
    lalu ? `${lalu.judul} (#${lalu.id}, ${lalu.dibuat.slice(0, 10)})\n${lalu.ringkasan}` : "(belum ada — ini rapat pertama)",
    "=== RINGKASAN HOSPITALITY (30 hari) ===",
    hospitalitySebagaiTeks(hosp),
  ].join("\n");
  const h = await sidang(topik, konteks, pilihan, deps.tanyaModel, "rapat", { "hospitality-manager": contohChatSebagaiTeks(hosp) });
  const idDok = await deps.reg.dokumenSimpan("board", `Rapat direksi ${bulan}`, h.dokumen);
  const usulan = await simpanUsulanMemori(h, idDok, deps);
  const catatan = [
    h.angkaTakBerdasar.length ? "⚠️ Ada angka yang tidak ditemukan di data AI CFO/knowledge base — cek sebelum dipakai." : "",
    !k.cfo.tersedia ? "ℹ️ AI CFO sedang tidak terbaca — kondisi kas belum dipakai." : "",
    !hosp.tersedia ? "ℹ️ Data operasional villa sedang tidak terbaca — Manager Hospitality AI belum memakai data." : "",
  ].filter(Boolean);
  return bagiPesan([`🏛️ *Rapat direksi — ${bulan}* (${SEMUA_SEAT.length} kursi)`, "", h.ringkasan, ...catatan, usulan, "", `Notulen & memo lengkap: *advisor detail ${idDok}*`].join("\n"));
}

const SISTEM_CATAT = [
  "Kamu sekretaris keputusan Loonars. Susun catatan keputusan format 11 field dari pesan founder (dan ringkasan board bila ada).",
  "Balas HANYA JSON: {\"judul\":str, \"lines\":[\"L1\"|\"L2\"|\"Coffee\"|\"Holding\"], \"business_context\":str, \"founder_proposal\":str,",
  "\"identified_risks\":str, \"alternatives\":str, \"final_decision\":str (kata-kata founder), \"expected_outcome\":str (KPI + tanggal cek),",
  "\"review_on\":\"YYYY-MM-DD\", \"syarat\":[{\"teks\":str,\"tenggat\":\"YYYY-MM-DD\"|null}]}.",
  "Jangan mengarang angka: angka hanya dari pesan founder/ringkasan board; yang tidak ada tulis NEEDS DATA. Bahasa Indonesia, ringkas.",
  "review_on default 30 hari dari hari ini bila founder tidak menyebut.",
].join("\n");

interface DraftKeputusan {
  judul?: string;
  lines?: string[];
  business_context?: string;
  founder_proposal?: string;
  identified_risks?: string;
  alternatives?: string;
  final_decision?: string;
  expected_outcome?: string;
  review_on?: string;
  syarat?: { teks?: string; tenggat?: string | null }[];
}

async function catat(teks: string, idDokumen: number | null, deps: DepsFitur): Promise<string> {
  const board = idDokumen ? await deps.reg.dokumenAmbil(idDokumen) : null;
  if (idDokumen && (!board || board.jenis !== "board")) return `Dokumen ${idDokumen} bukan sidang board.`;
  const ringkasBoard = board ? board.isi.split("## Memo")[0].slice(0, 6000) : "";
  const templat = CONTENT.templat[0]?.text ?? "";
  const h = await deps.tanyaModel(
    `${SISTEM_CATAT}\n\nHari ini: ${deps.hariIni()}\n\n=== TEMPLAT ===\n${templat}`,
    `Pesan founder: ${teks || "(lihat ringkasan board)"}\n\n${ringkasBoard ? `=== RINGKASAN BOARD #${idDokumen} ===\n${ringkasBoard}` : "(belum disidangkan board)"}`,
    { json: true, maksToken: 4096 },
  );
  const d = bacaJson<DraftKeputusan>(h.teks);
  if (!d?.judul || !d.final_decision) return "⚠️ Gagal menyusun catatan keputusan. Coba tulis lebih jelas: *catat keputusan: saya putuskan …*";
  const salah = angkaTakBerdasar(JSON.stringify(d), `${teks}\n${ringkasBoard}`);
  const review = d.review_on && /^\d{4}-\d{2}-\d{2}$/.test(d.review_on) ? d.review_on : null;
  const syarat = (d.syarat ?? [])
    .filter((s) => typeof s.teks === "string" && s.teks.length >= 3)
    .slice(0, 10)
    .map((s) => ({ teks: String(s.teks).slice(0, 500), tenggat: s.tenggat && /^\d{4}-\d{2}-\d{2}$/.test(s.tenggat) ? s.tenggat : null }));
  const isi = {
    lines: d.lines ?? [],
    business_context: d.business_context ?? "",
    founder_proposal: d.founder_proposal ?? teks,
    ai_board_analysis: board ? ringkasBoard.slice(0, 4000) : "Belum dibahas board.",
    identified_risks: d.identified_risks ?? "",
    alternatives: d.alternatives ?? "",
    final_decision: d.final_decision,
    expected_outcome: d.expected_outcome ?? "",
    dibahas: Boolean(board),
    board_dokumen: idDokumen,
    pesan_founder: teks.slice(0, 2000),
  };
  const r = await deps.reg.simpan({ judul: d.judul.slice(0, 300), status: "PROPOSED", review_on: review, isi, syarat });
  return [
    `📝 *${r.id} dicatat (PROPOSED)* — ${d.judul}`,
    `*Keputusan*: ${d.final_decision}`,
    d.identified_risks ? `*Risiko*: ${d.identified_risks}` : "",
    d.expected_outcome ? `*Target*: ${d.expected_outcome}` : "",
    review ? `*Tinjau*: ${review}` : "",
    syarat.length ? `*Syarat*:\n${syarat.map((s) => `• ${s.teks}${s.tenggat ? ` (${s.tenggat})` : ""}`).join("\n")}` : "",
    salah.length ? "⚠️ Ada angka yang tidak ada di pesan/board — periksa sebelum konfirmasi." : "",
    "",
    board ? `Ketik *konfirmasi ${r.id}* untuk mengesahkan.` : `Belum dibahas board. Ketik *bahas ${r.id}* dulu, lalu *konfirmasi ${r.id}*.`,
  ]
    .filter(Boolean)
    .join("\n");
}

const SISTEM_RISET = [
  "Kamu Market Intelligence Loonars (villa/hospitality & properti, Indonesia). Riset topik founder memakai Google Search.",
  "Setiap fakta publik WAJIB dari hasil pencarian; sebut nama sumbernya di kalimat. Jangan mengarang harga/angka; yang tidak ditemukan = NEEDS DATA.",
  "Bedakan: fakta publik (berlabel HISTORICAL/ACTUAL publik + sumber) vs interpretasi kamu (ASSUMPTION).",
  "Format WA, maks ±20 baris: *Temuan utama* → *Kompetitor/pembanding* → *Peluang & ancaman bagi Loonars* → *Yang perlu dicek langsung*. Tanpa tabel markdown.",
  "Jangan menulis daftar URL — sistem menambahkan sumber otomatis.",
].join("\n");

async function riset(topik: string, deps: DepsFitur): Promise<string[]> {
  const h = await deps.tanyaModel(SISTEM_RISET, `Topik riset: ${topik}\nHari ini: ${deps.hariIni()}`, { cari: true, maksToken: 6000 });
  const sumber = h.sumber ?? [];
  const daftarSumber = sumber.length ? sumber.map((s, i) => `${i + 1}. ${s.judul} — ${s.url}`).join("\n") : "(tidak ada sumber web yang terbaca — perlakukan temuan sebagai belum terverifikasi)";
  const isi = `${h.teks}\n\n*Sumber*\n${daftarSumber}`;
  const idDok = await deps.reg.dokumenSimpan("riset", `Riset: ${topik.slice(0, 200)}`, isi);
  return bagiPesan(`🔎 *Riset — ${topik.slice(0, 80)}*\n\n${isi}\n\n_Tersimpan sebagai dokumen #${idDok}._`);
}

/** Pesan pengingat harian (cron): syarat jatuh tempo ≤3 hari & keputusan yang waktunya ditinjau. */
export async function susunPengingat(reg: Register, hariIni: string): Promise<string | null> {
  const [tempo, daftar] = await Promise.all([reg.jatuhTempo(3), reg.daftar()]);
  const batas = new Date(`${hariIni}T00:00:00Z`);
  batas.setUTCDate(batas.getUTCDate() + 3);
  const batasStr = batas.toISOString().slice(0, 10);
  const tinjau = daftar.filter((k) => k.status === "CONFIRMED" && k.review_on && k.review_on <= batasStr);
  if (!tempo.length && !tinjau.length) return null;
  return [
    "⏰ *Pengingat advisor*",
    ...(tempo.length ? ["", "*Syarat jatuh tempo*", ...tempo.map((s) => `• #${s.id} (${s.keputusan_id}) ${s.teks} — ${s.tenggat}${s.tenggat < hariIni ? " ⚠️ lewat" : ""}`)] : []),
    ...(tinjau.length ? ["", "*Keputusan waktunya ditinjau*", ...tinjau.map((k) => `• ${k.id} ${k.judul} — tinjau ${k.review_on}`)] : []),
    "",
    "Selesai? ketik *advisor syarat selesai <nomor>*. Untuk meninjau keputusan, ceritakan hasil nyatanya ke advisor.",
  ].join("\n");
}
