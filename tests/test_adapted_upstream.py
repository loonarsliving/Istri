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


if __name__ == "__main__":
    unittest.main()
