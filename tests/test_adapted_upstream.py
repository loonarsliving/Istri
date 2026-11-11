"""Tests for the tools adapted from founder-skill (IDR / labels). Runs the adapted
upstream code, so it needs execution permission for vendored code."""
import unittest

import _path  # noqa: F401
import unit_economics


class AdaptedUpstream(unittest.TestCase):
    def test_unit_economics_defaults_to_idr(self):
        spec = {"price": 100000, "variable": [{"cost": 40000}], "fixed_monthly": [{"cost": 3000000}],
                "startup": [{"cost": 10000000}], "plan_per_day": 10}
        text = unit_economics.report(spec, unit_economics.analyse(spec))
        self.assertIn("Rp ", text)
        self.assertNotIn("$", text)

    def test_panel_results_are_labelled_simulated_and_idr(self):
        import json
        import os
        import tempfile
        import panel
        customer = {"business": "uji", "target": "tamu domestik", "currency": "IDR",
                    "segments": [{"name": "a", "share": 1, "income": [60000000, 120000000]}],
                    "behaviours": [{"name": "b", "share": 1, "how": "x"}], "objections": ["mahal"]}
        with tempfile.TemporaryDirectory() as d:
            cp, pp = os.path.join(d, "c.json"), os.path.join(d, "p.md")
            json.dump(customer, open(cp, "w"))
            open(pp, "w").write("Villa Rp 600.000/malam")
            pd = os.path.join(d, "panel")
            panel.init(pd, cp, pp, n=3, seed=1)
            panel.write_briefs(pd)
            brief = open(os.path.join(pd, "briefs", "P001.md")).read()
            self.assertIn("IDR", brief)
            self.assertNotIn("$", brief.split("=== WHAT IS BEING OFFERED")[0])
            for pid in ("P001", "P002", "P003"):
                ans = {"id": pid, "buys": pid == "P001", "purchases_first_month": 1 if pid == "P001" else 0,
                       "reason_code": "price", "reason": "r", "objection": "o", "would_change_my_mind": "",
                       "price_too_cheap": 200000, "price_cheap": 400000, "price_expensive": 700000,
                       "price_too_expensive": 900000}
                json.dump(ans, open(os.path.join(pd, "answers", pid + ".json"), "w"))
            text = panel.results_md(panel.tally(pd))
            self.assertIn("[SIMULATED]", text)
            self.assertIn("IDR", text)


if __name__ == "__main__":
    unittest.main()
