import { CONFIG } from "./config";

/**
 * Register advisor di database MKH Property (migrasi 0073a–d). Semua akses
 * lewat RPC advisor_* yang memeriksa header x-advisor-secret; tabelnya
 * sendiri tertutup untuk anon. Advisor hanya menulis ke tabel advisor_*.
 */
export class GalatRegister extends Error {}

export type Rpc = <T>(fn: string, args?: Record<string, unknown>) => Promise<T>;

export const rpc: Rpc = async <T>(fn: string, args: Record<string, unknown> = {}): Promise<T> => {
  if (!CONFIG.dbAnonKey || CONFIG.aiCfoSecret.length < 32) throw new GalatRegister("register belum dikonfigurasi");
  const res = await fetch(`${CONFIG.dbUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: CONFIG.dbAnonKey,
      authorization: `Bearer ${CONFIG.dbAnonKey}`,
      "x-advisor-secret": CONFIG.aiCfoSecret,
    },
    body: JSON.stringify(args),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const teks = await res.text();
  if (!res.ok) {
    let pesan = `HTTP ${res.status}`;
    try {
      const j = JSON.parse(teks) as { message?: string };
      if (j.message) pesan = j.message;
    } catch {
      /* bukan JSON */
    }
    throw new GalatRegister(`${fn}: ${pesan}`.slice(0, 300));
  }
  return (teks ? JSON.parse(teks) : null) as T;
};

export interface Syarat {
  id: number;
  teks: string;
  tenggat: string | null;
  status: "terbuka" | "selesai" | "batal";
}

export interface Keputusan {
  id: string;
  judul: string;
  tanggal: string;
  status: string;
  review_on: string | null;
  confirmed_at: string | null;
  isi: Record<string, unknown>;
  syarat: Syarat[];
}

export interface IsianKeputusan {
  id?: string;
  judul: string;
  status?: "DRAFT" | "PROPOSED";
  review_on?: string | null;
  isi: Record<string, unknown>;
  syarat?: { teks: string; tenggat?: string | null }[];
}

export const register = (r: Rpc = rpc) => ({
  daftar: () => r<Keputusan[]>("advisor_keputusan_daftar"),
  simpan: (k: IsianKeputusan) => r<{ id: string; status: string }>("advisor_keputusan_simpan", { p: k }),
  konfirmasi: (id: string, oleh: string) => r<{ hasil: string; id: string }>("advisor_keputusan_konfirmasi", { p_id: id, p_oleh: oleh }),
  syaratUbah: (id: number, status: Syarat["status"]) => r<{ id: number; status: string }>("advisor_syarat_ubah", { p_id: id, p_status: status }),
  jatuhTempo: (hari = 3) => r<{ id: number; keputusan_id: string; teks: string; tenggat: string }[]>("advisor_syarat_jatuh_tempo", { p_hari: hari }),
  dokumenSimpan: (jenis: "board" | "mentor" | "riset" | "evaluasi" | "lain", judul: string, isi: string, keputusanId?: string) =>
    r<number>("advisor_dokumen_simpan", { p_jenis: jenis, p_judul: judul.slice(0, 300), p_isi: isi, p_keputusan_id: keputusanId ?? null }),
  dokumenAmbil: (id: number) => r<{ id: number; jenis: string; judul: string; isi: string; dibuat: string } | null>("advisor_dokumen_ambil", { p_id: id }),
  dokumenTerbaru: (n = 10) => r<{ id: number; jenis: string; judul: string; dibuat: string }[]>("advisor_dokumen_terbaru", { p_jumlah: n }),
  setel: (kunci: string, nilai: string) => r<null>("advisor_pengaturan_set", { p_kunci: kunci, p_nilai: nilai }),
  ambil: (kunci: string) => r<string | null>("advisor_pengaturan_get", { p_kunci: kunci }),
});

export type Register = ReturnType<typeof register>;
