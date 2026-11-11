# Patch mkh-properti: endpoint AI CFO hanya-baca untuk Advisor

> **Status 2026-11-11: TERPASANG.** mkh-properti PR #61 (merge `fea6568`), migrasi 0072 diterapkan ke `gluoioi…` dan diverifikasi. Endpoint menunggu secret Vault. File di bawah adalah arsip patch.

Disiapkan 2026-11-11 atas persetujuan owner ("silahkan, selama endpoint
advisor itu tidak merusak sistem yang sudah bekerja"). Sesi pembuatnya tidak
punya akses push ke `loonarsliving/mkh-properti`, jadi patch disimpan di sini
untuk dipasang di sesi yang punya akses (atau oleh owner).

Basis: mkh-properti `main` @ `b09fd2a` (migrasi terakhir 0071).

## Isi

| File (di repo mkh-properti) | Jenis |
| --- | --- |
| `supabase/migrations/0072_ai_cfo_akses_advisor.sql` | baru |
| `src/lib/cfo/advisor.ts` | baru — fungsi murni |
| `src/lib/cfo/advisor.test.ts` | baru — 5 tes vitest |
| `src/app/api/cfo/advisor/route.ts` | baru — `POST /api/cfo/advisor` |

`0001-ai-cfo-advisor-endpoint.patch` = commit yang sama (`git am`). Salinan
per file ada di `files/`.

## Mengapa tidak merusak yang sudah bekerja

1. **Tidak ada file existing yang diubah**; 342 baris tambahan, 0 dihapus.
2. Satu-satunya objek database yang dinyatakan ulang adalah `_cfo_akses()`.
   Isinya **identik** dengan versi 0062 ditambah satu blok yang hanya aktif
   bila flag transaksi `cfo.advisor_baca = 'ya'` — flag yang hanya dipasang
   oleh dua fungsi pembungkus baru. Tanpa flag, alur web CFO, WA (`ai_cfo`),
   cron briefing, dan tautan PDF berjalan persis seperti sekarang.
   (Diverifikasi dengan `diff` terhadap 0062: hanya baris tambahan.)
3. **Mati sampai diaktifkan**: tanpa secret `advisor_shared_secret` di Vault,
   endpoint selalu 401.
4. **Hanya baca**: pembungkus hanya memanggil `cfo_ambil_data` dan
   `cfo_ambil_kerja` (keduanya `STABLE`). Header advisor ke RPC tulis mana pun
   ditolak karena flag tidak terpasang. Satu-satunya tulisan = baris audit di
   `cfo_audit_log` (aktor `advisor`).
5. **Tanpa data mentah & tanpa AI**: respons hanya fakta bernomor, jawaban
   deterministik, dan putusan CEO challenger — mesin yang sama dengan
   dashboard. Tidak memanggil layanan AI MK Connect.
6. Rahasia advisor **terpisah** dari `mk_sync_shared_secret`; mencabutnya
   tidak mengganggu sinkronisasi MK Connect.

## Hasil uji (di salinan kerja, 2026-11-11)

| Cek | Hasil |
| --- | --- |
| `npx vitest run` | 125/125 lulus (120 lama + 5 baru) |
| `npm run typecheck` | lulus |
| `npm run lint` | tanpa warning/error |
| `npm run build` | sukses, route `ƒ /api/cfo/advisor` |
| Migrasi di database nyata | **belum diuji** (tidak ada akses Supabase di sesi ini) |

## Cara memasang (ikuti DEPLOYMENT.md mkh-properti)

```bash
git checkout -b claude/ai-cfo-advisor-endpoint main
git am /path/ke/0001-ai-cfo-advisor-endpoint.patch   # atau salin isi files/
# bila main sudah punya migrasi 0072: ganti nomor file ke nomor berikutnya
npm ci && npm test && npm run typecheck && npm run lint && npm run build
```
Lalu PR → review owner → merge → terapkan migrasi ke project `gluoioi…`.

Uji di produksi **sebelum** membuat secret (harus 401):
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://finance.haluoleo.id/api/cfo/advisor \
  -H 'content-type: application/json' -H "x-advisor-secret: $(printf 'x%.0s' {1..40})" -d '{"mode":"fakta"}'
```
Cek regresi: `/cfo/chat`, menu AI CFO di WA owner, briefing harian, PDF WA.

Aktifkan (owner, SQL editor):
```sql
select vault.create_secret('<rahasia acak ≥32 karakter>', 'advisor_shared_secret');
```
Simpan rahasia yang sama di environment advisor sebagai `LOONARS_AI_CFO_SECRET`
— **jangan** di repo Istri (publik).

Rollback: hapus secret di Vault (endpoint kembali 401). Bila perlu, migrasi
berikutnya menyatakan ulang `_cfo_akses()` dari 0062 dan `drop function`
ketiga fungsi baru.

## Kontrak respons

```json
{ "sumber": "MKH Property AI CFO", "hariIni": "2026-11-11", "mode": "evaluasi",
  "label": "PROJECTION", "putusan": "waspada",
  "evaluasi": { "putusan": "...", "ringkas": "...", "alasan": [], "dampak": [], "alternatif": [],
                "maksAmanSekarang": 0, "tundaAmanHari": null },
  "fakta": [{ "id": "F1", "label": "...", "nilai": 0, "teks": "...", "sumber": "..." }] }
```
