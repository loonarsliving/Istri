# Integrasi AI CFO (MKH Property) — desain

Status: tahap A aktif (manual) · tahap B **diimplementasikan sebagai patch** (`integrations/mkh-properti-advisor/`), belum dipasang di mkh-properti. Desain final memakai flag transaksi + rahasia terpisah (lihat README patch); bagian di bawah adalah desain awal.
Repo pemilik: `loonarsliving/mkh-properti` (`finance.haluoleo.id`).

## Tahap A — manual (sekarang)
Prosedur: `docs/standards/consult-ai-cfo.md`. Founder bertanya ke AI CFO lewat
WA asisten owner (tool `ai_cfo` di MK Connect) atau `/cfo/chat`, lalu menyimpan
jawaban sebagai snapshot `ManualSnapshotSource`.

Contoh snapshot (`private/snapshots/2026-11-11-ai-cfo-rencana-x.json`):

```json
{
  "source": "MKH Property AI CFO",
  "dataset": "ceo-challenger",
  "label": "PROJECTION",
  "period": {"start": "2026-11-11", "end": "2027-02-10"},
  "retrieved_at": "2026-11-11T10:05:00+08:00",
  "how": "WA asisten owner, menu AI CFO",
  "rows": [{"pertanyaan": "...", "putusan": "WASPADA", "jawaban": "...", "fakta": ["..."]}]
}
```

## Tahap B — endpoint baca khusus advisor (usulan, Phase 5)

Usulan perubahan di **repo mkh-properti** (bukan di sini; butuh persetujuan
owner dan review di repo tersebut):

`POST /api/cfo/advisor` — hanya baca.

| Request | |
| --- | --- |
| Header | `x-advisor-secret` — rahasia **baru, khusus advisor**, disimpan di Vault MKH Property dan secret environment advisor. Tidak memakai ulang `mk_sync_shared_secret`. |
| Body | `{ "mode": "tanya" \| "evaluasi" \| "ringkasan", "pertanyaan"?: string, "rencana"?: RencanaKeputusan }` |

`RencanaKeputusan` = tipe yang sudah ada di `src/lib/cfo/penantang.ts`
(`nominal`, `tanggal`, `lini: L1|L2|Grup`, `ket`, `cicilan`).

| Response | |
| --- | --- |
| `tanya` | `JawabanCfo` dari `tanyaCfo()` tanpa `dasar` (sama seperti `/api/cfo/tanya-wa`) |
| `evaluasi` | `HasilEvaluasi` dari `evaluasiKeputusan()` (putusan, alasan, dampak 3 skenario, alternatif, `maksAmanSekarang`, `tundaAmanHari`) |
| `ringkasan` | metrik ternormalisasi per lini (kontrak `NormalizedMetric` FRIDAY) + `retrieved_at` |

Persyaratan:
- Tidak ada RPC tulis yang bisa dicapai dari endpoint ini (AI CFO memang tidak punya).
- Tanpa NIK, telepon, alamat, nomor rekening, nama pembeli (konsisten dengan `cfo_ambil_data`).
- Rate limit + audit log ke `cfo_audit_log` (append-only, sudah ada).
- Gagal/timeout → advisor menulis `unreachable` → `NEEDS DATA`, tidak pernah 0.

Sisi advisor: `AiCfoSource.fetch()` membaca URL & rahasia dari environment
(`LOONARS_AI_CFO_URL`, `LOONARS_AI_CFO_SECRET`), aktif hanya jika
`LOONARS_ENABLE_LIVE_SOURCES=1`. Tidak ada nilai rahasia di repo.

## Ancaman & mitigasi
| Ancaman | Mitigasi |
| --- | --- |
| Rahasia bocor dari repo publik | Hanya nama env var di repo; secret scanning; rahasia khusus advisor bisa dicabut tanpa mengganggu sync MK Connect. |
| Advisor menampilkan angka berbeda dari dashboard CFO | Advisor tidak menghitung ulang; selalu kutip `retrieved_at`. |
| Prompt injection lewat teks pertanyaan | Endpoint memakai system prompt konstanta (pola `SISTEM_AI_CFO`), angka divalidasi `validasiJawaban`. |
| Data sensitif masuk ke analisis yang di-commit | Snapshot disimpan di `private/`; repo dibuat private sebelum angka aktual masuk. |
