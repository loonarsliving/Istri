---
name: loonars-consumer
description: >-
  Consumer Panel Loonars: hingga 100 persona tamu atau pembeli sintetis
  (default 20 dengan --quick), masing-masing sub-agent dengan pendapatan,
  asal, kebiasaan menginap/membeli, dan keberatan sendiri, melihat penawaran
  yang sama lalu memutuskan beli/tidak dengan alasan dan 4 jawaban harga (Van
  Westendorp). Hasil selalu berlabel SIMULATED. Pakai saat founder bilang "apa
  tamu mau", "uji ke konsumen", "simulasi pembeli", "harga segini kemahalan",
  atau dari business-feasibility.
argument-hint: "<slug analisis> [--n 100 | --quick] [--seed S]"
---

# loonars-consumer

Adapted from founder-skill `founder-consumer` + `founder-pricing` (MIT
@fd9385b). Tool: `tools/panel/panel.py` dan `tools/panel/van_westendorp.py`
(versi adaptasi: IDR, bahasa jawaban mengikuti penawaran, label SIMULATED).

## Instruksi
Anda moderator. Anda tidak pernah menjawab atas nama persona.

## Input
- `analyses/<slug>/customer.json` — bentuk:
  `vendor/founder-skill/skills/founder-consumer/customer.example.json`
  ditambah `"currency": "IDR"`. Isi: `business`, `target` (satu baris
  spesifik, mis. "keluarga domestik Jawa yang liburan ke Yogyakarta 2–3 malam"),
  `segments` (share + income [low, high] per tahun dalam IDR), `behaviours`,
  `objections`, `habits`. Dasarkan pada data nyata bila ada (review tamu di OTA,
  data booking villa, CRM MK Connect) dan sebutkan bagian yang tebakan.
  **Tunjukkan profil ke founder untuk dikoreksi sebelum deal.**
- `analyses/<slug>/pitch.md` — yang benar-benar dilihat persona (3–6 baris,
  tanpa superlatif, hanya yang bisa dipenuhi).

## Proses
```bash
P=analyses/<slug>/panel
python3 tools/panel/panel.py --dir $P init --customer analyses/<slug>/customer.json --pitch analyses/<slug>/pitch.md --n 20
python3 tools/panel/panel.py --dir $P prompts
```
Per gelombang (≤10), SATU pesan berisi satu Agent call per persona:
`subagent_type: general-purpose`, `description: panel <id>`,
`prompt: Read <brief path> and follow it exactly. It is your whole brief.`
Setelah semua gelombang: `check` → `prompts` (ulang yang gagal sekali) →
`tally`. Persona yang mencetak JSON di balasan: `save <id>` dengan stdin.
Lalu `python3 tools/panel/van_westendorp.py $P/answers --price <harga> --out analyses/<slug>/pricing-curve.md`.

## Output
`panel/results.md` (berlabel [SIMULATED]), `pricing-curve.md`. Ke founder:
buy rate (batas atas), segmen yang berbeda paling jauh, 3 alasan menolak +
kutipan, yang akan mengubah "tidak", satu perubahan sebelum keluar uang, dan
validasi nyata termurah.

## Batasan
- Model bahasa cenderung setuju → buy rate = batas atas.
- Kutipan persona bukan testimoni; tidak boleh dipakai di iklan.
- Sebelum 100 persona: beri tahu founder = 100 sub-agent, sarankan --quick.
