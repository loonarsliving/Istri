#!/usr/bin/env python3
"""Hospitality projection for Loonars AI Advisor. Standard library only, no network.

Projects a villa / room business month by month from its own inputs: available
and occupied nights, room revenue, RevPAR, OTA commission, variable cost per
occupied night, fixed cost, gross operating profit (GOP), break-even occupancy,
and payback of any capex. Runs the base case plus downside and worst-case
scenarios. Every number traces to an input; a missing field is an error.

    python3 hospitality.py input.json                 # all scenarios, markdown
    python3 hospitality.py input.json --scenario base --json
    python3 hospitality.py input.json --out analyses/x/hospitality.md

Input (see tests/fixtures/hospitality.example.json):

    business              name, for the report
    currency              default "IDR"
    units                 rentable units (villas or rooms)
    months                12 items: {"month": "2027-01", "days": 31, "adr": ..., "occupancy": 0.0-1.0}
    channel_mix           [{"channel", "share", "commission_pct"}], shares sum to 1
    variable_per_night    [{label, cost}] per occupied night (housekeeping, amenities, utilities, card fees)
    fixed_monthly         [{label, cost}] every month (salaries, rent, software, maintenance)
    tax_pct               optional: tax on room revenue (e.g. local hotel tax) as 0.0-1.0; default 0
    capex                 optional [{label, cost}] one-off spend before or at month 1
    scenarios             optional: override {"name": {"adr": x, "occupancy": x, "cost": x}} multipliers

This tool is for NEW ideas and what-ifs. Loonars actuals come from the AI CFO
in MKH Property; never present this output as actual data.
"""

import argparse
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from money import InputError, LABEL_PROJECTION, fmt, num, pct, total  # noqa: E402

DEFAULT_SCENARIOS = {
    "base": {"adr": 1.0, "occupancy": 1.0, "cost": 1.0},
    "downside": {"adr": 0.9, "occupancy": 0.85, "cost": 1.1},
    "worst": {"adr": 0.8, "occupancy": 0.65, "cost": 1.2},
}


def validate(spec):
    units = num(spec, "units", minimum=1)
    months = spec.get("months")
    if not isinstance(months, list) or len(months) != 12:
        raise InputError("'months' needs 12 items (got %s)" % (len(months) if isinstance(months, list) else "none"))
    for i, m in enumerate(months):
        w = "months[%d]" % i
        num(m, "days", w, minimum=1, maximum=31)
        num(m, "adr", w, minimum=0)
        num(m, "occupancy", w, minimum=0, maximum=1)
    mix = spec.get("channel_mix")
    if not isinstance(mix, list) or not mix:
        raise InputError("'channel_mix' is missing: list each booking channel with its share and commission")
    share = 0.0
    for i, c in enumerate(mix):
        share += num(c, "share", "channel_mix[%d]" % i, minimum=0, maximum=1)
        num(c, "commission_pct", "channel_mix[%d]" % i, minimum=0, maximum=1)
    if abs(share - 1.0) > 0.001:
        raise InputError("channel_mix shares must sum to 1 (got %.3f)" % share)
    if "variable_per_night" not in spec:
        raise InputError("'variable_per_night' is missing (use [] only if there truly is no per-night cost)")
    if "fixed_monthly" not in spec:
        raise InputError("'fixed_monthly' is missing (use [] only if there truly is no fixed cost)")
    return units


def project(spec, scenario="base"):
    """Return every number for one scenario. Pure function."""
    units = validate(spec)
    scen = dict(DEFAULT_SCENARIOS, **(spec.get("scenarios") or {}))
    if scenario not in scen:
        raise InputError("unknown scenario %r (have: %s)" % (scenario, ", ".join(scen)))
    k = scen[scenario]
    currency = str(spec.get("currency", "IDR"))
    tax = num(spec, "tax_pct", minimum=0, maximum=1) if "tax_pct" in spec else 0.0
    commission = sum(float(c["share"]) * float(c["commission_pct"]) for c in spec["channel_mix"])
    var_night = total(spec["variable_per_night"], "variable_per_night") * k["cost"]
    fixed = total(spec["fixed_monthly"], "fixed_monthly") * k["cost"]
    capex = total(spec.get("capex"), "capex")

    rows, cumulative, payback = [], -capex, None
    for i, m in enumerate(spec["months"], start=1):
        days = float(m["days"])
        adr = float(m["adr"]) * k["adr"]
        occ = min(1.0, float(m["occupancy"]) * k["occupancy"])
        available = units * days
        occupied = available * occ
        revenue = occupied * adr
        commission_cost = revenue * commission
        tax_cost = revenue * tax
        variable = occupied * var_night
        gop = revenue - commission_cost - tax_cost - variable - fixed
        cumulative += gop
        if payback is None and capex > 0 and cumulative >= 0:
            payback = i
        rows.append({"month": m.get("month", str(i)), "days": days, "adr": adr, "occupancy": occ,
                     "available": available, "occupied": occupied, "revenue": revenue,
                     "revpar": revenue / available, "commission": commission_cost, "tax": tax_cost,
                     "variable": variable, "fixed": fixed, "gop": gop, "cumulative": cumulative})

    avail = sum(r["available"] for r in rows)
    occd = sum(r["occupied"] for r in rows)
    rev = sum(r["revenue"] for r in rows)
    gop = sum(r["gop"] for r in rows)
    adr_eff = rev / occd if occd else 0.0
    net_per_night = adr_eff * (1 - commission - tax) - var_night
    days_year = sum(r["days"] for r in rows)
    if net_per_night <= 0:
        be_occ = math.inf
    else:
        be_occ = (fixed * 12) / (net_per_night * units * days_year)
    lowest = min([-capex] + [r["cumulative"] for r in rows])

    flags = []
    if net_per_night <= 0:
        flags.append("Setiap malam terisi rugi sebelum biaya tetap: ADR setelah komisi/pajak di bawah biaya variabel.")
    if be_occ > 1:
        flags.append("Break-even butuh okupansi di atas 100%: tidak mungkin dengan biaya tetap ini.")
    elif occd and be_occ > occd / avail:
        flags.append("Okupansi rata-rata (%s) di bawah okupansi break-even (%s)." % (pct(occd / avail), pct(be_occ)))
    if gop < 0:
        flags.append("GOP setahun negatif (%s)." % fmt(gop, currency))
    if capex > 0 and payback is None:
        flags.append("Capex %s tidak kembali dalam 12 bulan." % fmt(capex, currency))

    return {"business": spec.get("business", "Unnamed"), "scenario": scenario, "multipliers": k,
            "currency": currency, "units": units, "months": rows,
            "available_nights": avail, "occupied_nights": occd, "occupancy": occd / avail if avail else 0.0,
            "revenue": rev, "adr": adr_eff, "revpar": rev / avail if avail else 0.0,
            "commission_rate": commission, "tax_rate": tax, "variable_per_night": var_night,
            "fixed_monthly": fixed, "gop": gop, "gop_margin": gop / rev if rev else None,
            "breakeven_occupancy": be_occ, "capex": capex, "payback_month": payback,
            "cash_needed": -lowest, "flags": flags}


def all_scenarios(spec):
    names = list(dict(DEFAULT_SCENARIOS, **(spec.get("scenarios") or {})))
    return {n: project(spec, n) for n in names}


def report(results):
    first = next(iter(results.values()))
    c = first["currency"]
    L = ["# Proyeksi hospitality: %s" % first["business"], "", LABEL_PROJECTION, "",
         "## Ringkasan skenario", "",
         "| skenario | okupansi | ADR | RevPAR | revenue | GOP | margin GOP | okupansi BE | payback |",
         "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"]
    for n, r in results.items():
        be = "tidak mungkin" if not math.isfinite(r["breakeven_occupancy"]) or r["breakeven_occupancy"] > 1 else pct(r["breakeven_occupancy"])
        L.append("| %s | %s | %s | %s | %s | %s | %s | %s | %s |" % (
            n, pct(r["occupancy"]), fmt(r["adr"], c), fmt(r["revpar"], c), fmt(r["revenue"], c),
            fmt(r["gop"], c), pct(r["gop_margin"]), be,
            ("bulan %d" % r["payback_month"]) if r["payback_month"] else ("—" if not r["capex"] else "> 12 bulan")))
    L += ["", "Pengali skenario (ADR × okupansi × biaya): " + "; ".join(
        "%s %.2f/%.2f/%.2f" % (n, r["multipliers"]["adr"], r["multipliers"]["occupancy"], r["multipliers"]["cost"])
        for n, r in results.items()), ""]
    base = results.get("base", first)
    L += ["## Base case per bulan", "",
          "| bulan | okupansi | ADR | revenue | komisi | variabel | tetap | GOP | kumulatif |",
          "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"]
    for m in base["months"]:
        L.append("| %s | %s | %s | %s | %s | %s | %s | %s | %s |" % (
            m["month"], pct(m["occupancy"]), fmt(m["adr"], c), fmt(m["revenue"], c), fmt(m["commission"], c),
            fmt(m["variable"], c), fmt(m["fixed"], c), fmt(m["gop"], c), fmt(m["cumulative"], c)))
    L += ["", "Komisi tertimbang channel: %s. Pajak atas revenue: %s. Biaya variabel per malam terisi: %s." % (
        pct(base["commission_rate"]), pct(base["tax_rate"]), fmt(base["variable_per_night"], c)),
        "Kas yang dibutuhkan sebelum balik modal (base): %s." % fmt(base["cash_needed"], c)]
    for n, r in results.items():
        if r["flags"]:
            L += ["", "**Peringatan (%s):**" % n] + ["- %s" % f for f in r["flags"]]
    return "\n".join(L) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("input")
    ap.add_argument("--scenario", default="all")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--out")
    a = ap.parse_args(argv)
    try:
        with open(a.input, encoding="utf-8") as fh:
            spec = json.load(fh)
        res = all_scenarios(spec) if a.scenario == "all" else {a.scenario: project(spec, a.scenario)}
    except (InputError, OSError, json.JSONDecodeError) as e:
        print("error: %s" % e, file=sys.stderr)
        return 2
    text = json.dumps(res, indent=1, default=str) if a.json else report(res)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as fh:
            fh.write(text)
        print("wrote %s" % a.out)
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
