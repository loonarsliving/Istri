import { angkaTakBerdasar } from "./angka";
import { ambilFaktaCfo, faktaSebagaiTeks, type KonteksCfo } from "./aicfo";
import { CONTENT, type ContentFile } from "./content.generated";
import { tanyaModel, type HasilAI } from "./gemini";

/** Awalan pesan WA yang diteruskan MK Connect ke advisor (dibuang sebelum diproses). */
export function bersihkanAwalan(pesan: string): string {
  return pesan.replace(/^\s*(advisor|mentor|loonars advisor)\s*[:,\-–]?\s*/i, "").trim();
}

export const MENU = [
  "🧭 *Loonars AI Advisor*",
  "Kirim pesan diawali *advisor* atau *mentor*, contoh:",
  "• advisor: apa fokus saya minggu ini?",
  "• advisor: saya mau renovasi 3 kamar villa, bagaimana?",
  "• advisor keputusan saya — daftar keputusan & status",
  "Setiap keputusan dibahas dulu (D-2026-004). Angka keuangan diambil langsung dari AI CFO.",
].join("\n");

/** Perintah tanpa AI (gratis, deterministik). null = bukan perintah. */
export function perintah(teks: string): string | null {
  const t = teks.toLowerCase().trim();
  if (t === "" || t === "menu" || t === "bantuan" || t === "help") return MENU;
  if (/^(daftar )?keputusan( saya)?$/.test(t)) return daftarKeputusan();
  return null;
}

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

export function sistemMentor(cfo: KonteksCfo): string {
  return [
    "Kamu adalah LOONARS AI ADVISOR — mentor pribadi founder Loonars, menjawab lewat WhatsApp.",
    "Ikuti instruksi skill mentor di bawah (karakter, proses, batasan). Ringkasan aturan yang WAJIB:",
    "- Objektif & kritis; berani bilang ide buruk. Utamakan kas, margin, sistem di atas pertumbuhan semu.",
    "- Klasifikasikan masalah: strategis / operasional / keuangan / organisasi / eksekusi.",
    "- JANGAN mengarang angka. Angka hanya dari FAKTA AI CFO, knowledge base, atau pesan founder; kutip ID fakta [F..]. Yang tidak ada = NEEDS DATA.",
    "- Setiap keputusan founder wajib dibahas (D-2026-004): bila founder menyatakan akan memutuskan sesuatu, beri analisis singkat, sebut risiko & alternatif, dan sarankan dibahas board bila kriteria eskalasi terpenuhi. Jangan pernah bilang 'langsung saja'.",
    "- Bila menyangkut uang keluar, sebutkan bahwa AI CFO perlu menguji (CEO challenger) dan kutip posisi kas dari fakta.",
    "- Advisor hanya mengusulkan; tidak menjalankan apa pun di sistem lain.",
    "- Bukan nasihat hukum/pajak/investasi yang mengikat.",
    "FORMAT WA: Bahasa Indonesia, maks ±15 baris. Struktur: *Diagnosis* (jenis masalah) → *Kritik/asumsi lemah* (2–3 poin) → *Rekomendasi* → *Satu hal minggu ini* → *Belum diketahui*. Pakai *tebal* gaya WA, tanpa tabel markdown.",
    "",
    "=== INSTRUKSI SKILL MENTOR ===",
    gabung(CONTENT.mentor, 15000),
    "=== STANDAR ===",
    gabung(CONTENT.standar, 15000),
    "=== KNOWLEDGE BASE (HISTORICAL/NEEDS DATA) ===",
    gabung(CONTENT.knowledge, 40000),
    "=== DECISION HISTORY ===",
    gabung(CONTENT.keputusan, 30000),
    "=== FAKTA AI CFO (LIVE) ===",
    faktaSebagaiTeks(cfo),
  ].join("\n");
}

export interface JawabanMentor {
  teks: string;
  model: string | null;
  cadangan: boolean;
  angkaTakBerdasar: number[];
}

/** Jawab satu pesan founder. Perintah sederhana tanpa AI; selain itu mentor ber-Gemini Pro + penjaga angka. */
export async function jawab(pesanMentah: string, deps = { ambilFaktaCfo, tanyaModel }): Promise<JawabanMentor> {
  const pesan = bersihkanAwalan(pesanMentah);
  const cmd = perintah(pesan);
  if (cmd) return { teks: cmd, model: null, cadangan: false, angkaTakBerdasar: [] };

  const cfo = await deps.ambilFaktaCfo();
  const sistem = sistemMentor(cfo);
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
  if (!cfo.tersedia) teks += "\n\nℹ️ AI CFO sedang tidak terbaca — angka keuangan belum dipakai.";
  return { teks, model: hasil.model, cadangan: hasil.cadangan, angkaTakBerdasar: salah };
}
