# Financial position — Status: NEEDS DATA (sengaja)

> Label & aturan: `docs/standards/data-labels.md`. Repo publik → angka keuangan aktual tidak ditulis di sini; sumber angka = AI CFO MKH Property / sistem asal. Terakhir diperbarui: 2026-11-11.

Angka posisi keuangan **tidak disimpan di repo ini** (repo publik).

| Item | Sumber kebenaran | Cara ambil |
| --- | --- | --- |
| Kas per lini & grup | AI CFO MKH Property (`/cfo/arus-kas`) | `docs/standards/consult-ai-cfo.md` |
| Laba-rugi L1 / L2 / holding | AI CFO (`/cfo/loonars-1`, `/cfo/loonars-2`, `/cfo/holding`) | idem |
| Kewajiban & jatuh tempo | AI CFO (`/cfo/kewajiban`) | idem |
| Forecast 3 skenario | AI CFO (`arus-kas.ts`) | idem |
| Peringatan & kualitas data | AI CFO (`/cfo/peringatan`, `/cfo/kualitas-data`) | idem |

Snapshot yang diambil founder disimpan di `private/snapshots/` (di-ignore)
dengan format `ManualSnapshotSource`, setiap snapshot bertanggal.

- NEEDS DATA: snapshot pertama — pemilik: founder (via AI CFO).
