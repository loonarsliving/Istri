import { faktaSebagaiTeks, type KonteksCfo } from "./aicfo";
import { angkaTakBerdasar } from "./angka";
import { CONFIG } from "./config";
import type { HasilAI, TanyaModel } from "./gemini";
import { memoriSebagaiTeks } from "./mentor";
import type { Memori } from "./register";

/**
 * Strategi harga villa & riset lokasi Loonars berikutnya (owner 2026-11-14,
 * D-2026-011). Advisor HANYA merekomendasikan:
 *   - strategi harga → WA owner; tidak pernah menulis ke villa_rates /
 *     villa_pricing_recommendations (mesin harga villa autopush-nya menyala —
 *     tulisan advisor bisa langsung sampai ke OTA). Owner yang menerapkan.
 *   - lokasi → riset web bersumber; saran ke Kepala Cabang Jogja HANYA bila
 *     mesin AI CFO menyatakan keuangan SIAP (dihitung kode MKH Property,
 *     src/lib/cfo/ekspansi.ts — advisor tidak boleh mengubah putusan itu).
 */

// ── Data harga dari MK Connect (POST /api/advisor/harga, hanya baca) ─────────

export interface Periode {
  label: string;
  dari: string;
  sampai: string;
  malamTersedia: number;
  malamTerjual: number;
  okupansiPct: number | null;
  adr: number | null;
  revpar: number | null;
}
export interface RingkasanHarga {
  hariIni: string;
  properti: {
    kode: string;
    unit: number;
    unitMaintenance: number;
    lalu30Hari: Periode;
    kedepan: Periode[];
    tipe: {
      kode: string;
      nama: string;
      unit: number;
      batas: { dasar: number | null; min: number | null; maks: number | null };
      harga30Hari: { hari: number; min: number | null; median: number | null; maks: number | null };
      kompetitor60Hari: { n: number; median: number | null; min: number | null; maks: number | null; terakhir: string | null; lokasi: string[] };
    }[];
  }[];
  mesin: {
    ambangOkupansiTinggiPct: number | null;
    ambangOkupansiRendahPct: number | null;
    gerakHarianMaksPct: number | null;
    autopushAktif: boolean | null;
    rekomendasi30Hari: Record<string, number>;
    rataDeltaPct30Hari: number | null;
  };
  musimRamai: { label: string; dari: string; sampai: string; saranPenyesuaianPct: number | null }[];
  catatan: string[];
}
export type HasilHarga = { tersedia: true; data: RingkasanHarga } | { tersedia: false; catatan: string };

export async function ambilHarga(fetchImpl: typeof fetch = fetch): Promise<HasilHarga> {
  if (CONFIG.bridgeSecret.length < 32) return { tersedia: false, catatan: "ADVISOR_BRIDGE_SECRET belum diatur" };
  try {
    const res = await fetchImpl(`${CONFIG.mkConnectUrl}/api/advisor/harga`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-advisor-bridge-secret": CONFIG.bridgeSecret },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(50000),
    });
    if (!res.ok) return { tersedia: false, catatan: `MK Connect menjawab HTTP ${res.status}` };
    return { tersedia: true, data: (await res.json()) as RingkasanHarga };
  } catch (e) {
    return { tersedia: false, catatan: `MK Connect tidak terbaca: ${e instanceof Error ? e.message : String(e)}` };
  }
}

const NAMA_PROPERTI: Record<string, string> = { PL: "Loonars Private Living (Loonars 1)", EL: "Loonars Excellent Living" };
const rp = (n: number | null) => (n === null ? "NEEDS DATA" : `Rp ${Math.round(n).toLocaleString("id-ID")}`);
const pct = (n: number | null) => (n === null ? "NEEDS DATA" : `${String(n).replace(".", ",")}%`);

function teksPeriode(p: Periode): string {
  return `${p.label} (${p.dari}…${p.sampai}): okupansi ${pct(p.okupansiPct)} (${p.malamTerjual}/${p.malamTersedia} malam), ADR ${rp(p.adr)}, RevPAR ${rp(p.revpar)}`;
}

/** Data harga sebagai teks bernomor [H..] — satu-satunya sumber angka strategi harga selain fakta AI CFO. */
export function hargaSebagaiTeks(h: HasilHarga): string {
  if (!h.tersedia) return `DATA HARGA VILLA TIDAK TERSEDIA (${h.catatan}). Semua angka harga/okupansi = NEEDS DATA.`;
  const d = h.data;
  const out: string[] = [`Data harga & okupansi villa per ${d.hariIni} (ACTUAL dari sistem villa, dihitung MK Connect):`];
  let i = 0;
  const add = (t: string) => out.push(`[H${++i}] ${t}`);
  for (const p of d.properti) {
    const nama = NAMA_PROPERTI[p.kode] ?? p.kode;
    add(`${nama}: ${p.unit} unit (${p.unitMaintenance} maintenance)`);
    add(`${nama} — ${teksPeriode(p.lalu30Hari)}`);
    for (const k of p.kedepan) add(`${nama} — ${teksPeriode(k)} (on the books)`);
    for (const t of p.tipe) {
      add(`${nama} — tipe ${t.nama} (${t.kode}, ${t.unit} unit): batas mesin dasar ${rp(t.batas.dasar)}, min ${rp(t.batas.min)}, maks ${rp(t.batas.maks)}`);
      add(`${nama} — tipe ${t.nama}: harga jual 30 hari ke depan (${t.harga30Hari.hari} hari terisi) min ${rp(t.harga30Hari.min)}, median ${rp(t.harga30Hari.median)}, maks ${rp(t.harga30Hari.maks)}`);
      const k = t.kompetitor60Hari;
      add(
        k.n
          ? `${nama} — tipe ${t.nama}: harga kompetitor 60 hari (${k.n} data, terakhir ${k.terakhir}; ${k.lokasi.join(", ")}) median ${rp(k.median)}, min ${rp(k.min)}, maks ${rp(k.maks)}`
          : `${nama} — tipe ${t.nama}: belum ada data kompetitor 60 hari terakhir`,
      );
    }
  }
  const m = d.mesin;
  add(`Mesin harga villa: ambang okupansi rendah ${pct(m.ambangOkupansiRendahPct)}, tinggi ${pct(m.ambangOkupansiTinggiPct)}, gerak harian maks ${pct(m.gerakHarianMaksPct)}, autopush ${m.autopushAktif ? "MENYALA (harga berubah otomatis dalam batas)" : m.autopushAktif === false ? "mati" : "NEEDS DATA"}`);
  add(`Mesin harga villa 30 hari: rekomendasi per status ${Object.entries(m.rekomendasi30Hari).map(([k, v]) => `${k} ${v}`).join(", ") || "tidak ada"}; rata-rata perubahan ${pct(m.rataDeltaPct30Hari)}`);
  for (const s of d.musimRamai) add(`Musim ramai ${s.label}: ${s.dari}…${s.sampai}, saran penyesuaian ${pct(s.saranPenyesuaianPct)}`);
  for (const c of d.catatan) out.push(`Catatan: ${c}`);
  return out.join("\n");
}

export const SISTEM_HARGA = [
  "Kamu adalah Revenue Manager di Loonars AI Advisor — otak strategi harga untuk mesin harga villa Loonars.",
  "Tugas: menilai apakah okupansi sehat, apakah ADR terlalu murah/mahal dibanding kompetitor, lalu memberi STRATEGI HARGA yang membantu mesin harga villa.",
  "ATURAN MUTLAK:",
  "1. Angka rupiah HANYA dari DATA HARGA [H..], FAKTA AI CFO [F..], atau MEMORI. Jangan menghitung harga rupiah baru. Usulan perubahan ditulis dalam PERSEN dari harga sekarang, atau pilih harga yang ADA di data (batas min/maks mesin, median kompetitor).",
  "2. Okupansi 'sehat' = di antara ambang rendah dan tinggi mesin harga villa (data [H..]). Di bawah ambang rendah = permintaan lemah; di atas ambang tinggi = harga kemungkinan terlalu murah.",
  "3. Kamu TIDAK mengubah harga. Mesin harga villa yang menghitung harga harian; usulan setelan mesin (ambang, persen musim ramai, batas min/maks) diterapkan owner sendiri di admin villa.",
  "4. Bila autopush mesin menyala, ingatkan bahwa perubahan setelan langsung berpengaruh ke harga OTA.",
  "5. Pisahkan per properti. Excellent Living baru dibuka: beri strategi harga pembukaan (masih di dalam batas min–maks mesin) dan sebut data yang belum ada.",
  "6. Bahasa Indonesia, format WhatsApp (*tebal*, tanpa tabel), maks ±30 baris.",
  "STRUKTUR: *Diagnosis okupansi & ADR* → *Posisi vs kompetitor* → *Strategi per properti & tipe kamar* (arah: naik/tahan/turun + persen + alasan [H..]) → *Usulan setelan mesin harga* (opsional) → *Musim ramai ke depan* → *Belum diketahui*.",
].join("\n");

// ── Kesiapan ekspansi (dibaca dari fakta AI CFO, tidak dihitung ulang) ───────

export type StatusKesiapan = "siap" | "belum" | "tidak_tersedia";

export function kesiapanDariFakta(cfo: KonteksCfo): { status: StatusKesiapan; teks: string } {
  if (!cfo.tersedia) return { status: "tidak_tersedia", teks: `AI CFO tidak terbaca (${cfo.catatan})` };
  const f = cfo.fakta.find((x) => x.label === "Kesiapan membuka lokasi Loonars berikutnya");
  if (!f) return { status: "tidak_tersedia", teks: "AI CFO belum mengirim fakta kesiapan ekspansi" };
  return { status: /^SIAP\b/.test(f.teks) ? "siap" : "belum", teks: f.teks };
}

export const SISTEM_LOKASI = [
  "Kamu adalah Market Intelligence & Expansion Director di Loonars AI Advisor.",
  "Tugas: mempelajari DI MANA di Daerah Istimewa Yogyakarta lokasi terbaik untuk villa Loonars berikutnya, memakai riset web (Google Search) + data internal.",
  "Konsep Loonars: villa private pool/hospitality di Yogyakarta; Loonars 2 dijual ke investor per unit lalu dikelola sebagai hospitality (bagi hasil investor 70% dari profit).",
  "Nilai setiap area kandidat (kecamatan/kawasan) dengan: (1) permintaan wisatawan & akses (bandara YIA, tol, pusat kota, objek wisata), (2) kepadatan villa/hotel pesaing & ADR mereka, (3) harga/sewa tanah (hanya bila ada sumber), (4) aturan tata ruang & risiko (kawasan lindung, sempadan, rawan bencana), (5) kecocokan dengan tamu Loonars saat ini dan jarak operasional dari Loonars yang sudah ada.",
  "Teks ini juga dibaca Kepala Cabang Jogja: jangan menyebut nama owner/founder, 'persetujuan owner', atau angka kas/utang internal selain fakta RAB.",
  "ATURAN: jangan mengarang angka; angka dari web WAJIB disebut sumbernya (nama situs). Angka keuangan Loonars hanya dari FAKTA AI CFO [F..]. Yang tidak ditemukan = NEEDS DATA. Ini rekomendasi riset (PROJECTION), bukan keputusan.",
  "FORMAT WhatsApp, maks ±35 baris: *Peringkat 3 area* (tiap area: alasan, risiko, perkiraan permintaan, pesaing) → *Area yang dihindari* → *RAB acuan* (kutip fakta RAB AI CFO apa adanya, ingatkan perlu dihitung ulang di lokasi itu) → *Data yang harus dicek di lapangan* (daftar survei konkret) → *Belum diketahui*.",
].join("\n");

export interface DepsStrategi {
  tanyaModel: TanyaModel;
  ambilFaktaCfo: () => Promise<KonteksCfo>;
  ambilHarga: () => Promise<HasilHarga>;
  daftarMemori?: () => Promise<Memori[]>;
  simpanDokumen: (jenis: "riset" | "lain", judul: string, isi: string) => Promise<number>;
  hariIni: () => string;
}

async function tanyaTerjaga(deps: DepsStrategi, sistem: string, pengguna: string, sumberAngka: string, opsi: Parameters<TanyaModel>[2]): Promise<{ h: HasilAI; salah: number[] }> {
  let h = await deps.tanyaModel(sistem, pengguna, opsi);
  let salah = opsi?.cari ? [] : angkaTakBerdasar(h.teks, sumberAngka);
  if (salah.length) {
    h = await deps.tanyaModel(sistem, `${pengguna}\n\nJAWABAN SEBELUMNYA MEMUAT ANGKA YANG TIDAK ADA DI DATA (${salah.join(", ")}). Tulis ulang: pakai persen atau angka yang ada di data.`, opsi);
    salah = angkaTakBerdasar(h.teks, sumberAngka);
  }
  return { h, salah };
}

/** Strategi harga villa → teks WA untuk owner + dokumen register. */
export async function strategiHarga(deps: DepsStrategi): Promise<{ teks: string; idDok: number | null }> {
  const [harga, cfo, memori] = await Promise.all([deps.ambilHarga(), deps.ambilFaktaCfo(), deps.daftarMemori ? deps.daftarMemori().catch(() => null) : Promise.resolve(null)]);
  const data = [
    "=== DATA HARGA VILLA ===",
    hargaSebagaiTeks(harga),
    "=== FAKTA AI CFO (keuangan) ===",
    faktaSebagaiTeks(cfo),
    "=== MEMORI PERUSAHAAN ===",
    memoriSebagaiTeks(memori),
  ].join("\n");
  const { h, salah } = await tanyaTerjaga(deps, SISTEM_HARGA, `${data}\n\nHari ini: ${deps.hariIni()}. Susun strategi harga.`, data, { maksToken: 6000 });
  const teks = [
    `💹 *Strategi harga villa — ${deps.hariIni()}*`,
    "",
    h.teks,
    salah.length ? "\n⚠️ Ada angka yang tidak ditemukan di data villa/AI CFO — cek sebelum dipakai." : "",
    !harga.tersedia ? "\nℹ️ Data harga villa sedang tidak terbaca." : "",
    "",
    "_Advisor tidak mengubah harga. Setelan mesin harga diterapkan owner di admin villa._",
  ]
    .filter((x) => x !== "")
    .join("\n");
  const idDok = await deps.simpanDokumen("lain", `Strategi harga villa ${deps.hariIni()}`, teks).catch(() => null);
  return { teks, idDok };
}

export interface HasilLokasi {
  kesiapan: { status: StatusKesiapan; teks: string };
  teksOwner: string;
  /** Saran untuk Kepala Cabang Jogja — hanya bila kesiapan SIAP. Tidak menyebut nama owner (aturan MKH Property 2026-11-10). */
  teksVando: string | null;
  idDok: number | null;
}

/** Riset lokasi Loonars berikutnya di DIY + status kesiapan keuangan dari AI CFO. */
export async function risetLokasi(deps: DepsStrategi): Promise<HasilLokasi> {
  const [cfo, harga, memori] = await Promise.all([deps.ambilFaktaCfo(), deps.ambilHarga(), deps.daftarMemori ? deps.daftarMemori().catch(() => null) : Promise.resolve(null)]);
  const kesiapan = kesiapanDariFakta(cfo);
  const rab = cfo.fakta.filter((f) => f.label.startsWith("RAB"));
  const konteks = [
    "=== KESIAPAN KEUANGAN (mesin AI CFO; kutip apa adanya) ===",
    kesiapan.teks,
    "=== RAB ACUAN (AI CFO) ===",
    rab.length ? rab.map((f) => `[${f.id}] ${f.label}: ${f.teks}`).join("\n") : "NEEDS DATA",
    "=== DATA VILLA LOONARS SAAT INI (okupansi, harga, kompetitor) ===",
    hargaSebagaiTeks(harga),
    "=== MEMORI PERUSAHAAN ===",
    memoriSebagaiTeks(memori),
  ].join("\n");
  const { h } = await tanyaTerjaga(deps, SISTEM_LOKASI, `${konteks}\n\nHari ini: ${deps.hariIni()}. Riset dan peringkatkan area di DIY untuk Loonars berikutnya.`, konteks, { cari: true, maksToken: 7000 });
  const sumber = h.sumber ?? [];
  const daftarSumber = sumber.length ? sumber.map((s, i) => `${i + 1}. ${s.judul} — ${s.url}`).join("\n") : "(tidak ada sumber web yang terbaca — temuan belum terverifikasi)";
  const label = kesiapan.status === "siap" ? "✅ SIAP" : kesiapan.status === "belum" ? "⏳ BELUM SIAP" : "❔ TIDAK TERBACA";
  const teksOwner = [
    `🗺️ *Riset lokasi Loonars berikutnya — ${deps.hariIni()}*`,
    `*Kesiapan keuangan (AI CFO):* ${label}`,
    kesiapan.teks,
    "",
    h.teks,
    "",
    "*Sumber*",
    daftarSumber,
    "",
    kesiapan.status === "siap"
      ? "_Keuangan sudah memenuhi syarat — saran survei lokasi juga dikirim ke Kepala Cabang Jogja._"
      : "_Saran ke Kepala Cabang Jogja baru dikirim setelah AI CFO menyatakan keuangan SIAP._",
  ].join("\n");
  const idDok = await deps.simpanDokumen("riset", `Riset lokasi Loonars berikutnya ${deps.hariIni()}`, teksOwner).catch(() => null);
  const teksVando =
    kesiapan.status === "siap"
      ? [
          "🗺️ *Loonars — saatnya menyiapkan lokasi berikutnya*",
          "",
          "Halo Vando, ini dari sistem AI CFO Loonars. Keuangan Loonars sudah memenuhi syarat untuk mulai menyiapkan lokasi villa berikutnya.",
          "",
          h.teks,
          "",
          "*Yang perlu dilakukan:* survei lapangan area peringkat 1–3 di atas, kumpulkan harga/sewa tanah nyata, status tata ruang, dan penawaran kontraktor, lalu laporkan ke sistem agar RAB dihitung ulang.",
          idDok ? `_Ref riset #${idDok}._` : "",
        ]
          .filter(Boolean)
          .join("\n")
      : null;
  return { kesiapan, teksOwner, teksVando, idDok };
}

export interface PengaturanRingan {
  ambil: (kunci: string) => Promise<string | null>;
  setel: (kunci: string, nilai: string) => Promise<unknown>;
}

/**
 * Saran ke Kepala Cabang Jogja dikirim SEKALI setiap kali kesiapan berubah
 * menjadi SIAP (kunci `ekspansi_siap_dikirim`); kembali BELUM → kunci dikosongkan
 * sehingga transisi SIAP berikutnya mengirim lagi. Nomor di `vando_wa` (register
 * privat, tidak di repo). Mengembalikan true bila pesan ke Vando terkirim.
 */
export async function kirimSaranVando(h: HasilLokasi, reg: PengaturanRingan, kirim: (nomor: string, pesan: string) => Promise<boolean>, hariIni: string): Promise<boolean> {
  if (h.kesiapan.status === "belum") {
    await reg.setel("ekspansi_siap_dikirim", "");
    return false;
  }
  if (h.kesiapan.status !== "siap" || !h.teksVando) return false;
  if (await reg.ambil("ekspansi_siap_dikirim")) return false;
  const nomor = await reg.ambil("vando_wa");
  if (!nomor) return false;
  const ok = await kirim(nomor, h.teksVando);
  if (ok) await reg.setel("ekspansi_siap_dikirim", hariIni);
  return ok;
}
