#!/usr/bin/env python3
"""Investment metrics for Loonars AI Advisor. Standard library only, no network.

Given an initial outlay and a series of net cash flows, reports NPV, IRR,
payback period, cash multiple and the deepest cumulative cash hole, plus the
same at a stressed set of cash flows. Works for a new villa, an expansion
site, a leasehold sale schedule (cash in by installment) or a fundraising
comparison (one series per option).

    python3 investment.py input.json
    python3 investment.py input.json --json

Input:

    currency          default "IDR"
    period            "year" or "month" (label only; rates must match the period)
    discount_rate     required, per period, e.g. 0.12 for 12% a year
    options           [{"name", "initial", "cashflows": [...], "source"}]
                      initial = outlay at t0 (positive number); cashflows = net cash per period from t1
    stress            optional {"cashflow_multiplier": 0.8, "delay_periods": 1}

Results are PROJECTION. The discount rate is an assumption the founder must
own; the tool will not pick one.
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from money import InputError, LABEL_PROJECTION, fmt, num, pct  # noqa: E402


def npv(rate, initial, flows):
    return -initial + sum(cf / (1 + rate) ** t for t, cf in enumerate(flows, start=1))


def irr(initial, flows, lo=-0.99, hi=10.0, tol=1e-7):
    """IRR by bisection. None when the cash flows never change sign or no root is bracketed."""
    f = lambda r: npv(r, initial, flows)
    flo, fhi = f(lo), f(hi)
    if flo * fhi > 0:
        return None
    for _ in range(300):
        mid = (lo + hi) / 2
        fm = f(mid)
        if abs(fm) < tol:
            return mid
        if flo * fm < 0:
            hi, fhi = mid, fm
        else:
            lo, flo = mid, fm
    return (lo + hi) / 2


def payback(initial, flows):
    """Periods (fractional) until cumulative cash turns non-negative, else None."""
    cum = -initial
    for t, cf in enumerate(flows, start=1):
        if cum + cf >= 0:
            return t - 1 + ((-cum) / cf if cf else 0)
        cum += cf
    return None


def evaluate(option, rate):
    name = option.get("name", "option")
    initial = num(option, "initial", name, minimum=0)
    flows = option.get("cashflows")
    if not isinstance(flows, list) or not flows:
        raise InputError("%s: 'cashflows' needs at least one number" % name)
    flows = [num({"v": v}, "v", "%s.cashflows[%d]" % (name, i)) for i, v in enumerate(flows)]
    cum, lowest = -initial, -initial
    for cf in flows:
        cum += cf
        lowest = min(lowest, cum)
    return {"name": name, "source": option.get("source", "NEEDS DATA: sumber angka"),
            "initial": initial, "cashflows": flows, "npv": npv(rate, initial, flows),
            "irr": irr(initial, flows), "payback": payback(initial, flows),
            "multiple": (sum(flows) / initial) if initial else None, "cash_needed": -lowest}


def stressed(option, stress):
    m = float(stress.get("cashflow_multiplier", 1.0))
    d = int(stress.get("delay_periods", 0))
    flows = [0.0] * d + [float(v) * m for v in option["cashflows"]]
    return dict(option, name=option.get("name", "option") + " (stress)", cashflows=flows[:len(option["cashflows"]) + d])


def analyse(spec):
    rate = num(spec, "discount_rate", minimum=-0.99)
    options = spec.get("options")
    if not isinstance(options, list) or not options:
        raise InputError("'options' needs at least one option")
    out = {"currency": str(spec.get("currency", "IDR")), "period": spec.get("period", "year"),
           "discount_rate": rate, "results": []}
    for o in options:
        out["results"].append(evaluate(o, rate))
        if spec.get("stress"):
            out["results"].append(evaluate(stressed(o, spec["stress"]), rate))
    return out


def report(a):
    c, p = a["currency"], a["period"]
    L = ["# Analisis investasi", "", LABEL_PROJECTION, "",
         "Discount rate: %s per %s **[ASSUMPTION — founder]**." % (pct(a["discount_rate"]), p), "",
         "| opsi | investasi awal | NPV | IRR | payback | multiple | kas dibutuhkan | sumber |",
         "| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |"]
    for r in a["results"]:
        L.append("| %s | %s | %s | %s | %s | %s | %s | %s |" % (
            r["name"], fmt(r["initial"], c), fmt(r["npv"], c), pct(r["irr"]),
            ("%.1f %s" % (r["payback"], p)) if r["payback"] is not None else "tidak kembali",
            ("%.2fx" % r["multiple"]) if r["multiple"] is not None else "n/a", fmt(r["cash_needed"], c), r["source"]))
    L += ["", "IRR kosong (n/a) berarti arus kas tidak pernah berbalik tanda. NPV negatif berarti opsi ini "
          "tidak menutup biaya modal yang diasumsikan."]
    return "\n".join(L) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("input")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--out")
    a = ap.parse_args(argv)
    try:
        with open(a.input, encoding="utf-8") as fh:
            res = analyse(json.load(fh))
    except (InputError, OSError, json.JSONDecodeError) as e:
        print("error: %s" % e, file=sys.stderr)
        return 2
    text = json.dumps(res, indent=1) if a.json else report(res)
    if a.out:
        with open(a.out, "w", encoding="utf-8") as fh:
            fh.write(text)
        print("wrote %s" % a.out)
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
