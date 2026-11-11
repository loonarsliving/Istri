import json
import os
import unittest

from _path import FIXTURES
import hospitality
import investment
from money import InputError, fmt


def example():
    with open(os.path.join(FIXTURES, "hospitality.example.json"), encoding="utf-8") as fh:
        return json.load(fh)


class Hospitality(unittest.TestCase):
    def test_base_numbers_trace_to_inputs(self):
        r = hospitality.project(example(), "base")
        m1 = r["months"][0]
        self.assertAlmostEqual(m1["available"], 310)
        self.assertAlmostEqual(m1["occupied"], 170.5)
        self.assertAlmostEqual(m1["revenue"], 170.5 * 1500000)
        self.assertAlmostEqual(r["commission_rate"], 0.126)
        self.assertAlmostEqual(r["revpar"], r["revenue"] / r["available_nights"])

    def test_scenarios_get_worse_in_order(self):
        res = hospitality.all_scenarios(example())
        self.assertGreater(res["base"]["gop"], res["downside"]["gop"])
        self.assertGreater(res["downside"]["gop"], res["worst"]["gop"])
        self.assertTrue(res["worst"]["flags"])

    def test_breakeven_occupancy_is_where_gop_is_zero(self):
        spec = example()
        for m in spec["months"]:
            m["adr"] = 1500000
        spec.pop("capex")
        be = hospitality.project(spec, "base")["breakeven_occupancy"]
        for m in spec["months"]:
            m["occupancy"] = be
        self.assertAlmostEqual(hospitality.project(spec, "base")["gop"], 0, delta=1)

    def test_missing_input_is_refused_not_guessed(self):
        for drop in ("units", "channel_mix", "fixed_monthly", "variable_per_night"):
            spec = example()
            spec.pop(drop)
            with self.assertRaises(InputError):
                hospitality.project(spec)
        spec = example()
        spec["months"] = spec["months"][:11]
        with self.assertRaises(InputError):
            hospitality.project(spec)
        spec = example()
        spec["channel_mix"][0]["share"] = 0.5
        with self.assertRaises(InputError):
            hospitality.project(spec)

    def test_report_is_labelled_projection_and_idr(self):
        text = hospitality.report(hospitality.all_scenarios(example()))
        self.assertIn("[PROJECTION]", text)
        self.assertIn("Rp ", text)
        self.assertNotIn("$", text)


class Investment(unittest.TestCase):
    def test_npv_irr_payback(self):
        r = investment.evaluate({"name": "x", "initial": 1000, "cashflows": [500, 500, 500]}, 0.0)
        self.assertAlmostEqual(r["npv"], 500)
        self.assertAlmostEqual(investment.npv(r["irr"], 1000, [500, 500, 500]), 0, delta=1e-4)
        self.assertAlmostEqual(r["payback"], 2.0)
        self.assertAlmostEqual(r["multiple"], 1.5)

    def test_never_pays_back(self):
        r = investment.evaluate({"name": "x", "initial": 1000, "cashflows": [100, 100]}, 0.1)
        self.assertIsNone(r["payback"])
        self.assertLess(r["npv"], 0)

    def test_stress_lowers_npv_and_discount_rate_is_required(self):
        spec = {"discount_rate": 0.12, "options": [{"name": "a", "initial": 1000, "cashflows": [400] * 5}],
                "stress": {"cashflow_multiplier": 0.8, "delay_periods": 1}}
        res = investment.analyse(spec)["results"]
        self.assertLess(res[1]["npv"], res[0]["npv"])
        spec.pop("discount_rate")
        with self.assertRaises(InputError):
            investment.analyse(spec)


class Money(unittest.TestCase):
    def test_idr_format(self):
        self.assertEqual(fmt(1250000), "Rp 1.250.000")
        self.assertEqual(fmt(-5000), "-Rp 5.000")


if __name__ == "__main__":
    unittest.main()
