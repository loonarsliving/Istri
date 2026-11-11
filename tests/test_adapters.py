import json
import os
import tempfile
import unittest

import _path  # noqa: F401
import base
import sources


class Adapters(unittest.TestCase):
    def test_interface_has_no_write_operations(self):
        forbidden = ("write", "update", "delete", "insert", "execute", "push", "send", "post")
        for cls in sources.ALL_SOURCES + (base.DataSource,):
            for attr in dir(cls):
                if not attr.startswith("_"):
                    self.assertFalse(any(attr.lower().startswith(f) for f in forbidden), (cls, attr))

    def test_live_sources_are_disabled_stubs(self):
        for cls in sources.ALL_SOURCES[1:]:
            s = cls()
            self.assertTrue(s.describe().read_only)
            self.assertFalse(s.describe().enabled)
            with self.assertRaises(NotImplementedError):
                s.fetch("x")

    def test_unreachable_never_returns_rows(self):
        r = sources.ManualSnapshotSource("/nonexistent/file.json").fetch("cash")
        self.assertEqual(r.health, "unreachable")
        self.assertEqual(r.rows, [])
        with self.assertRaises(base.SourceError):
            base.Records("s", "d", None, "now", "ACTUAL", health="unreachable", rows=[{"v": 0}])

    def test_snapshot_must_be_traceable(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "s.json")
            with open(p, "w") as fh:
                json.dump({"source": "MKH Property AI CFO", "dataset": "tanya-cfo", "label": "ACTUAL",
                           "retrieved_at": "2026-11-11T09:00:00+08:00",
                           "period": {"start": "2026-11-01", "end": "2026-11-30"},
                           "metrics": [{"key": "cash_balance", "label": "Kas", "value": None, "unit": "idr"}]}, fh)
            r = sources.ManualSnapshotSource(p).fetch()
            self.assertIn("ACTUAL", r.citation())
            self.assertIsNone(r.rows[0]["value"])
            with open(p, "w") as fh:
                json.dump({"source": "x", "dataset": "y", "rows": []}, fh)
            with self.assertRaises(base.SourceError):
                sources.ManualSnapshotSource(p).fetch()

    def test_bad_label_refused(self):
        with self.assertRaises(base.SourceError):
            base.Records("s", "d", None, "now", "GUESS")


if __name__ == "__main__":
    unittest.main()
