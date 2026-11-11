import { CONFIG } from "./config";

/**
 * Ringkasan operasional hospitality dari MK Connect (POST /api/advisor/hospitality,
 * hanya-baca, D-2026-009). Angka dihitung MK Connect; advisor hanya menyajikan.
 * Gagal = "tidak tersedia", tidak pernah nol.
 */
export interface RingkasanHospitality {
  periode: { dari: string; sampai: string };
  sumber: Record<string, { ok: boolean; error?: string; baris?: number }>;
  laporanHarian: {
    hariDenganLaporan: number;
    laporanTerlewat: { label: string; diharapkan: number; dikirim: number }[];
    checklistBelumLengkap: number;
    selesaiTanpaVerifikasiFo: number;
    keluhanTamu: number;
    itemTerlambatMaks: number;
  };
  checklistPerStaf: { nama: string; total: number; perJenis: Record<string, number>; gagalAtauMasalah: number }[];
  tugasKamar: {
    total: number;
    selesai: number;
    lewatAppVillaTanpaFo: number;
    totalBersihUlang: number;
    perCleaning: { nama: string; dikirim: number; bersihUlang: number; medianMenitBersih: number | null }[];
    perFo: { nama: string; inspeksi: number; medianMenitTungguInspeksi: number | null }[];
  };
  masalah: { total: number; terbuka: number; terlambat: number; tanpaPenanggungJawab: number; perKategori: Record<string, number> };
  pengecekanKamarVilla: { total: number; perHasil: Record<string, number>; perPengecek: Record<string, number> };
  chatTamu: {
    percakapanAktif: number;
    pesanMasuk: number;
    balasanStaf: number;
    balasanOtomatis: number;
    medianMenitBalas: number | null;
    p90MenitBalas: number | null;
    tidakDibalas2Jam: number;
    perStatusTamu: Record<string, number>;
    perKategoriAi: Record<string, number>;
    contohPesanTamu: string[];
  };
  catatan: string[];
}

export type HasilHospitality = { tersedia: true; data: RingkasanHospitality } | { tersedia: false; catatan: string };

export async function ambilHospitality(hari = 30, fetchImpl: typeof fetch = fetch): Promise<HasilHospitality> {
  if (CONFIG.bridgeSecret.length < 32) return { tersedia: false, catatan: "ADVISOR_BRIDGE_SECRET belum diatur" };
  const sampai = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  const dari = new Date(Date.now() - (hari - 1) * 86400000).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  try {
    const res = await fetchImpl(`${CONFIG.mkConnectUrl}/api/advisor/hospitality`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-advisor-bridge-secret": CONFIG.bridgeSecret },
      body: JSON.stringify({ dari, sampai }),
      cache: "no-store",
      signal: AbortSignal.timeout(50000),
    });
    if (!res.ok) return { tersedia: false, catatan: `MK Connect menjawab HTTP ${res.status}` };
    return { tersedia: true, data: (await res.json()) as RingkasanHospitality };
  } catch (e) {
    return { tersedia: false, catatan: `MK Connect tidak terbaca: ${e instanceof Error ? e.message : String(e)}` };
  }
}

const daftar = (o: Record<string, number>) =>
  Object.entries(o)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(", ") || "-";
const mnt = (n: number | null) => (n === null ? "NEEDS DATA" : `${n} menit`);

/** Angka hospitality (tanpa contoh chat) — untuk semua kursi & penjaga angka. */
export function hospitalitySebagaiTeks(h: HasilHospitality): string {
  if (!h.tersedia) return `RINGKASAN HOSPITALITY TIDAK TERSEDIA (${h.catatan}). Semua angka operasional villa = NEEDS DATA.`;
  const d = h.data;
  const L = d.laporanHarian;
  const T = d.tugasKamar;
  const C = d.chatTamu;
  return [
    `RINGKASAN HOSPITALITY ${d.periode.dari} s/d ${d.periode.sampai} (ACTUAL · dihitung MK Connect dari Loonars Connect, sistem villa, chat WA tamu):`,
    `[H1] Laporan akhir hari tersedia: ${L.hariDenganLaporan} hari`,
    `[H2] Laporan staf terlewat: ${L.laporanTerlewat.length ? L.laporanTerlewat.map((x) => `${x.label} ${x.dikirim} dari ${x.diharapkan}`).join("; ") : "tidak ada"}`,
    `[H3] Checklist belum lengkap (akumulasi harian): ${L.checklistBelumLengkap} · selesai tanpa verifikasi FO: ${L.selesaiTanpaVerifikasiFo} · keluhan tamu tercatat: ${L.keluhanTamu}`,
    `[H4] Checklist per staf: ${d.checklistPerStaf.length ? d.checklistPerStaf.map((s) => `${s.nama} ${s.total} (${daftar(s.perJenis)}; gagal/masalah ${s.gagalAtauMasalah})`).join("; ") : "tidak ada checklist tercatat"}`,
    `[H5] Tugas kamar: ${T.total} (selesai ${T.selesai}, ditutup di app villa tanpa FO ${T.lewatAppVillaTanpaFo}, bersih ulang ${T.totalBersihUlang})`,
    `[H6] Per cleaning: ${T.perCleaning.map((c) => `${c.nama} kirim ${c.dikirim}, bersih ulang ${c.bersihUlang}, median ${mnt(c.medianMenitBersih)}`).join("; ") || "-"}`,
    `[H7] Per FO: ${T.perFo.map((f) => `${f.nama} inspeksi ${f.inspeksi}, median tunggu ${mnt(f.medianMenitTungguInspeksi)}`).join("; ") || "-"}`,
    `[H8] Masalah/insiden: ${d.masalah.total} (terbuka ${d.masalah.terbuka}, terlambat ${d.masalah.terlambat}, tanpa penanggung jawab ${d.masalah.tanpaPenanggungJawab}; ${daftar(d.masalah.perKategori)})`,
    `[H9] Pengecekan kamar di sistem villa: ${d.pengecekanKamarVilla.total} (${daftar(d.pengecekanKamarVilla.perHasil)}; pengecek: ${daftar(d.pengecekanKamarVilla.perPengecek)})`,
    `[H10] Chat tamu: ${C.percakapanAktif} percakapan, ${C.pesanMasuk} pesan masuk, ${C.balasanStaf} balasan staf, ${C.balasanOtomatis} balasan otomatis; waktu balas median ${mnt(C.medianMenitBalas)}, p90 ${mnt(C.p90MenitBalas)}; tidak dibalas >2 jam: ${C.tidakDibalas2Jam}`,
    `[H11] Status tamu: ${daftar(C.perStatusTamu)} · kategori AI resepsionis: ${daftar(C.perKategoriAi)}`,
    ...d.catatan.map((c) => `Catatan: ${c}`),
  ].join("\n");
}

/** Contoh pesan tamu (sudah disamarkan MK Connect) — hanya untuk kursi Manager Hospitality AI. */
export function contohChatSebagaiTeks(h: HasilHospitality): string {
  if (!h.tersedia || !h.data.chatTamu.contohPesanTamu.length) return "";
  return ["=== CONTOH PESAN TAMU (disamarkan; cari tema berulang, jangan kutip identitas) ===", ...h.data.chatTamu.contohPesanTamu.map((t) => `- ${t}`)].join("\n");
}
