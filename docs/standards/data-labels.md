# Standar label data

Setiap angka tentang Loonars ditulis dengan label, periode, dan sumber:

`<angka> [LABEL · periode · sumber · tanggal ambil]`

| Label | Kapan dipakai | Contoh |
| --- | --- | --- |
| `ACTUAL` | Tercatat di sistem sumber (AI CFO MKH Property, villa, MK Connect) atau dokumen resmi | `Okupansi 68% [ACTUAL · Okt 2026 · AI CFO /cfo/loonars-1 · diambil 2026-11-11]` |
| `HISTORICAL` | Data lampau / laporan tutup buku; mungkin tidak menggambarkan kondisi kini | `[HISTORICAL · FY2025 · laporan tahunan]` |
| `ASSUMPTION` | Dinyatakan founder, belum diverifikasi | `[ASSUMPTION · founder · 2026-11-11]` |
| `PROJECTION` | Dihitung tool dari input berlabel | `[PROJECTION · tools/finance/hospitality.py base · input analyses/x/hospitality.json]` |
| `SIMULATED` | Output persona/kompetitor sintetis | `[SIMULATED · panel seed 7 · n=100 · bukan survei nyata]` |
| `NEEDS DATA` | Belum ada | `NEEDS DATA: ADR Loonars 2, pemilik: tim villa` |

Aturan:
1. Projection tidak pernah ditulis ulang sebagai actual, dan simulated tidak
   pernah ditulis sebagai hasil riset/testimoni.
2. Data berumur > 90 hari diberi catatan "mungkin basi".
3. Sumber yang tidak terbaca = `NEEDS DATA`, **bukan 0**.
4. **Repo ini publik** (per 2026-11-11). Sampai repo dibuat private, angka
   keuangan aktual dan data pribadi (nama pembeli, rekening, NIK, telepon)
   tidak ditulis ke file yang di-commit. Simpan di `private/` (di-ignore) dan
   rujuk dari knowledge base sebagai `lihat private/<file>`.
