#!/usr/bin/env python3
"""Tanya AI CFO MKH Property dari advisor (hanya baca).

    python3 tools/adapters/ai_cfo.py fakta
    python3 tools/adapters/ai_cfo.py tanya "berapa kas grup sekarang?"
    python3 tools/adapters/ai_cfo.py evaluasi --nominal 150000000 --lini L1 --ket "renovasi 3 kamar" [--cicilan 3] [--tanggal 2026-12-01]
    python3 tools/adapters/ai_cfo.py ... --simpan private/snapshots/<nama>.json

Konfigurasi dibaca dari environment, atau dari private/advisor.env (di-ignore
Git). Bila file itu tidak ada di sesi baru, Claude membuatnya ulang dengan
mengambil secret `advisor_shared_secret` dari Vault MKH Property lewat
Supabase MCP (docs/standards/consult-ai-cfo.md). Founder tidak perlu
melakukan apa pun.
"""

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from sources import AiCfoSource  # noqa: E402

ENV_FILE = os.path.join(ROOT, "private", "advisor.env")


def load_env(path=ENV_FILE, base=None):
    env = dict(os.environ if base is None else base)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env.setdefault(k.strip(), v.strip())
    return env


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("mode", choices=["fakta", "tanya", "evaluasi"])
    ap.add_argument("pertanyaan", nargs="?", default="")
    ap.add_argument("--nominal", type=float)
    ap.add_argument("--lini", choices=["L1", "L2", "Grup"])
    ap.add_argument("--ket", default="")
    ap.add_argument("--cicilan", type=int)
    ap.add_argument("--tanggal")
    ap.add_argument("--simpan", help="simpan sebagai snapshot ManualSnapshotSource (pakai folder private/)")
    a = ap.parse_args(argv)
    src = AiCfoSource(load_env(), timeout=60)
    if not src.describe().enabled:
        print("AI CFO belum dikonfigurasi di sesi ini (private/advisor.env tidak ada).", file=sys.stderr)
        return 3
    rencana = None
    if a.mode == "evaluasi":
        if not (a.nominal and a.lini and a.ket):
            print("evaluasi butuh --nominal, --lini, --ket", file=sys.stderr)
            return 2
        rencana = {"nominal": a.nominal, "lini": a.lini, "ket": a.ket}
        if a.cicilan:
            rencana["cicilan"] = a.cicilan
        if a.tanggal:
            rencana["tanggal"] = a.tanggal
    r = src.fetch(a.mode, query=a.pertanyaan, rencana=rencana)
    out = {"source": r.source, "dataset": r.dataset, "label": r.label, "health": r.health,
           "retrieved_at": r.retrieved_at, "how": r.note,
           "period": {"start": r.period.start, "end": r.period.end} if r.period else None,
           "rows": r.rows}
    if r.health != "ok":
        out["note"] = r.note
    text = json.dumps(out, ensure_ascii=False, indent=1)
    if a.simpan:
        os.makedirs(os.path.dirname(os.path.abspath(a.simpan)), exist_ok=True)
        with open(a.simpan, "w", encoding="utf-8") as fh:
            fh.write(text)
        print("tersimpan: %s · %s" % (a.simpan, r.citation()))
    else:
        print(text)
    return 0 if r.health == "ok" else 1


if __name__ == "__main__":
    sys.exit(main())
