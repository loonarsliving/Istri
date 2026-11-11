import { angkaTakBerdasar } from "./angka";
import {
  ambilFaktaCfo,
  evaluasiCfo,
  evaluasiSebagaiTeks,
  faktaSebagaiTeks,
  rencanaDariPesan,
  type HasilEvaluasiCfo,
  type KonteksCfo,
  type RencanaUang,
} from "./aicfo";
import { CONTENT, type ContentFile } from "./content.generated";
import { tanyaModel, type HasilAI, type TanyaModel } from "./gemini";
import type { Keputusan, Memori } from "./register";

/** Awalan pesan WA yang diteruskan MK Connect ke advisor (dibuang sebelum diproses). */
export function bersihkanAwalan(pesan: string): string {
  return pesan.replace(/^\s*(advisor|mentor|loonars advisor)\s*[:,\-–]?\s*/i, "").trim();
}

export const MENU = [
  "🧭 *Loonars AI Advisor*",
  "Tanya/diskusi bebas langsung saja, contoh: _apa fokus saya minggu ini?_",
  "",
  "*Keputusan*",
  "• bahas: <ide/keputusan> — sidang board (ringkas 3 kursi; *board penuh: …* untuk 13 kursi)",
  "• catat keputusan: <keputusan> — dicatat PROPOSED (tambahkan _dari board 12_ bila sudah disidangkan)",
  "• bahas D-2026-008 — sidangkan keputusan yang sudah dicatat",
  "• konfirmasi D-2026-008 — sahkan (CONFIRMED) setelah dibahas",
  "• keputusan saya — daftar & status",
  "",
  "*Direksi & memori* (pakai awalan *advisor*)",
  "• advisor rapat direksi — rapat 13 kursi sekarang (otomatis tiap tanggal 1, dibandingkan dengan bulan lalu)",
  "• advisor ingat: <fakta> — simpan ke memori (bisa _ingat beban: …_, _ingat hambatan: …_, _ingat pelajaran: …_)",
  "• advisor memori — memori aktif & usulan direksi",
  "• advisor sahkan memori 5 / semua · advisor lupakan memori 5",
  "",
  "*Lainnya* (pakai awalan *advisor*)",
  "• advisor riset: <topik> — riset pasar dengan sumber",
  "• advisor detail 12 — isi lengkap dokumen/sidang",
  "• advisor dokumen — dokumen terbaru",
  "• advisor syarat — syarat terbuka · advisor syarat selesai 5",
  "",
  "Semua keputusan dibahas dulu (D-2026-004). Angka keuangan hanya dari AI CFO.",
].join("\n");

/** Daftar keputusan dari bundel repo (cadangan bila register tidak terbaca). */
export function daftarKeputusan(): string {
  const index = CONTENT.keputusan.find((f) => f.path.endsWith("index.md"));
  if (!index) return "Belum ada daftar keputusan.";
  const baris = index.text
    .split("\n")
    .filter((l) => /^\| D-\d{4}-\d{3} /.test(l))
    .map((l) => l.split("|").map((c) => c.trim()))
    .map((c) => `• *${c[1]}* (${c[2]}) — ${c[3]}\n  Status: ${c[5]}${c[6] && c[6] !== "—" ? ` · tinjau ${c[6]}` : ""}`);
  return ["📋 *Keputusan tercatat*", ...baris].join("\n");
}

export function daftarKeputusanDb(daftar: Keputusan[]): string {
  if (!daftar.length) return "Belum ada keputusan di register.";
  const baris = daftar.map((k) => {
    const terbuka = k.syarat.filter((s) => s.status === "terbuka").length;
    return `• *${k.id}* — ${k.judul}\n  Status: ${k.status}${k.review_on ? ` · tinjau ${k.review_on}` : ""}${terbuka ? ` · ${terbuka} syarat terbuka` : ""}`;
  });
  return ["📋 *Keputusan tercatat*", ...baris].join("\n");
}

function gabung(files: ContentFile[], maks = 60000): string {
  const out: string[] = [];
  let n = 0;
  for (const f of files) {
    const blok = `\n### ${f.path}\n${f.text.trim()}\n`;
    if (n + blok.length > maks) break;
    out.push(blok);
    n += blok.length;
  }
  return out.join("");
}

/** Keputusan dari register WA (bukan yang diimpor dari repo — teks lengkapnya sudah di bundel). */
export function keputusanWaSebagaiTeks(daftar: Keputusan[] | null): string {
  if (daftar === null) return "(register keputusan WA tidak terbaca saat ini)";
  const wa = daftar.filter((k) => k.isi?.sumber_repo !== true);
  if (!wa.length) return "(belum ada keputusan baru dari WA)";
  return wa
    .map((k) => {
      const syarat = k.syarat.filter((s) => s.status === "terbuka").map((s) => `   - syarat: ${s.teks}${s.tenggat ? ` (tenggat ${s.tenggat})` : ""}`);
      return [`- ${k.id} [${k.status}] ${k.judul} — keputusan: ${String(k.isi?.final_decision ?? "-").slice(0, 400)}`, ...syarat].join("\n");
    })
    .join("\n");
}

const LABEL_MEMORI: Record<Memori["kategori"], string> = {
  model_bisnis: "Model bisnis",
  beban: "Beban",
  hambatan: "Hambatan",
  pelajaran: "Pelajaran",
  tujuan: "Tujuan",
  aturan: "Aturan founder",
  lain: "Lain",
};

/** Memori perusahaan yang disahkan founder (D-2026-008) — dibaca setiap sidang & jawaban mentor. */
export function memoriSebagaiTeks(m: Memori[] | null): string {
  if (m === null) return "(memori perusahaan tidak terbaca saat ini)";
  const aktif = m.filter((x) => x.status === "aktif");
  if (!aktif.length) return "(belum ada memori perusahaan yang disahkan founder — tanyakan hal penting tentang model bisnis, beban, dan hambatan bila relevan)";
  return aktif.map((x) => `- [M${x.id}] ${LABEL_MEMORI[x.kategori] ?? x.kategori}: ${x.teks}`).join("\n");
}

export interface Konteks {
  memori?: Memori[] | null;
  cfo: KonteksCfo;
  keputusan: Keputusan[] | null;
  rencana: RencanaUang | null;
  evaluasi: HasilEvaluasiCfo | null;
}

/** Konteks bersama mentor & board: KB, keputusan, fakta AI CFO, dan (bila ada) evaluasi rencana uang. */
export function teksKonteks(k: Konteks, maksKb = 40000): string {
  return [
    "=== MEMORI PERUSAHAAN (disahkan founder; kutip [M..] bila dipakai) ===",
    memoriSebagaiTeks(k.memori ?? null),
    "=== STANDAR ===",
    gabung(CONTENT.standar, 15000),
    "=== KNOWLEDGE BASE (HISTORICAL/NEEDS DATA) ===",
    gabung(CONTENT.knowledge, maksKb),
    "=== DECISION HISTORY (repo) ===",
    gabung(CONTENT.keputusan, 30000),
    "=== KEPUTUSAN DARI WA (register) ===",
    keputusanWaSebagaiTeks(k.keputusan),
    "=== FAKTA AI CFO (LIVE) ===",
    faktaSebagaiTeks(k.cfo),
    k.rencana && k.evaluasi ? `=== EVALUASI AI CFO ===\n${evaluasiSebagaiTeks(k.rencana, k.evaluasi)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function sistemMentor(k: Konteks | KonteksCfo): string {
  const konteks: Konteks = "fakta" in k ? { cfo: k, keputusan: null, rencana: null, evaluasi: null } : k;
  return [
    "Kamu adalah LOONARS AI ADVISOR — mentor pribadi founder Loonars Mahakarya, menjawab lewat WhatsApp. Tujuan jangka panjang founder: perusahaan sampai IPO; founder 15 tahun berbisnis tanpa mentor — bantu ia menghindari kesalahan yang berulang.",
    "- Pakai MEMORI PERUSAHAAN (fakta yang sudah disahkan founder). Bila founder menyebut fakta penting baru tentang bisnis, beban, hambatan, atau kesalahan masa lalu, sarankan ia menyimpannya: *advisor ingat: …*.",
    "Ikuti instruksi skill mentor di bawah (karakter, proses, batasan). Ringkasan aturan yang WAJIB:",
    "- Objektif & kritis; berani bilang ide buruk. Utamakan kas, margin, sistem di atas pertumbuhan semu.",
    "- Klasifikasikan masalah: strategis / operasional / keuangan / organisasi / eksekusi.",
    "- JANGAN mengarang angka. Angka hanya dari FAKTA/EVALUASI AI CFO, knowledge base, atau pesan founder; kutip ID [F..]/[E..]. Yang tidak ada = NEEDS DATA.",
    "- Setiap keputusan founder wajib dibahas (D-2026-004): beri analisis singkat, risiko & alternatif, lalu sarankan founder mengetik *bahas: <keputusan>* untuk sidang board. Jangan pernah bilang 'langsung saja'.",
    "- Bila menyangkut uang keluar: kutip EVALUASI AI CFO apa adanya bila ada; bila tidak ada, katakan rencana belum diuji AI CFO.",
    "- Advisor hanya mengusulkan; tidak menjalankan apa pun di sistem lain.",
    "- Bukan nasihat hukum/pajak/investasi yang mengikat.",
    "FORMAT WA: Bahasa Indonesia, maks ±15 baris. Struktur: *Diagnosis* (jenis masalah) → *Kritik/asumsi lemah* (2–3 poin) → *Rekomendasi* → *Satu hal minggu ini* → *Belum diketahui*. Pakai *tebal* gaya WA, tanpa tabel markdown.",
    "",
    "=== INSTRUKSI SKILL MENTOR ===",
    gabung(CONTENT.mentor, 15000),
    teksKonteks(konteks),
  ].join("\n");
}

export interface JawabanMentor {
  teks: string;
  model: string | null;
  cadangan: boolean;
  angkaTakBerdasar: number[];
}

export interface DepsMentor {
  ambilFaktaCfo: typeof ambilFaktaCfo;
  tanyaModel: TanyaModel;
  evaluasiCfo?: typeof evaluasiCfo;
  daftarKeputusan?: () => Promise<Keputusan[]>;
  daftarMemori?: () => Promise<Memori[]>;
}

/** Kumpulkan konteks: fakta AI CFO, register keputusan, dan evaluasi AI CFO bila pesan menyebut uang keluar. */
export async function kumpulkanKonteks(pesan: string, deps: DepsMentor): Promise<Konteks> {
  const rencana = rencanaDariPesan(pesan);
  const [cfo, keputusan, evaluasi, memori] = await Promise.all([
    deps.ambilFaktaCfo(),
    deps.daftarKeputusan ? deps.daftarKeputusan().catch(() => null) : Promise.resolve(null),
    rencana && deps.evaluasiCfo ? deps.evaluasiCfo(rencana) : Promise.resolve(null),
    deps.daftarMemori ? deps.daftarMemori().catch(() => null) : Promise.resolve(null),
  ]);
  return { cfo, keputusan, rencana, evaluasi, memori };
}

/** Mentor ber-Gemini Pro + penjaga angka (satu kali tulis ulang, lalu peringatan). */
export async function jawab(pesanMentah: string, deps: DepsMentor = { ambilFaktaCfo, tanyaModel }): Promise<JawabanMentor> {
  const pesan = bersihkanAwalan(pesanMentah);
  if (/^(menu|bantuan|help)?$/i.test(pesan.trim())) return { teks: MENU, model: null, cadangan: false, angkaTakBerdasar: [] };

  const k = await kumpulkanKonteks(pesan, deps);
  const sistem = sistemMentor(k);
  const sumberAngka = `${sistem}\n${pesan}`;

  let hasil: HasilAI = await deps.tanyaModel(sistem, `Pesan founder: ${pesan}`);
  let salah = angkaTakBerdasar(hasil.teks, sumberAngka);
  if (salah.length) {
    hasil = await deps.tanyaModel(
      sistem,
      `Pesan founder: ${pesan}\n\nJawaban sebelumnya memuat angka yang TIDAK ada di data (${salah.map((n) => n.toLocaleString("id-ID")).join(", ")}). Tulis ulang tanpa angka karangan; pakai hanya angka dari fakta AI CFO/knowledge base, atau tulis NEEDS DATA.`,
    );
    salah = angkaTakBerdasar(hasil.teks, sumberAngka);
  }
  let teks = hasil.teks;
  if (salah.length) teks += "\n\n⚠️ Ada angka yang tidak ditemukan di data AI CFO/knowledge base — jangan dipakai sebelum dicek.";
  if (hasil.cadangan) teks += "\n\nℹ️ Dijawab model cadangan (model utama sedang sibuk).";
  if (!k.cfo.tersedia) teks += "\n\nℹ️ AI CFO sedang tidak terbaca — angka keuangan belum dipakai.";
  if (k.rencana && k.evaluasi && !k.evaluasi.tersedia) teks += "\n\nℹ️ Rencana uang ini belum bisa diuji AI CFO saat ini.";
  return { teks, model: hasil.model, cadangan: hasil.cadangan, angkaTakBerdasar: salah };
}
