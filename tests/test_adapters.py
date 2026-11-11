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

    def test_ai_cfo_reads_endpoint_with_advisor_secret_only(self):
        import http.server
        import threading
        seen = {}

        class H(http.server.BaseHTTPRequestHandler):
            def do_POST(self):
                seen["secret"] = self.headers.get("x-advisor-secret")
                seen["sync"] = self.headers.get("x-sync-secret")
                seen["body"] = json.loads(self.rfile.read(int(self.headers["content-length"])))
                out = json.dumps({"sumber": "MKH Property AI CFO", "hariIni": "2026-11-11", "mode": "evaluasi",
                                  "label": "PROJECTION", "putusan": "waspada", "fakta": []}).encode()
                self.send_response(200)
                self.send_header("content-type", "application/json")
                self.end_headers()
                self.wfile.write(out)

            def log_message(self, *a):
                pass

        srv = http.server.HTTPServer(("127.0.0.1", 0), H)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        try:
            env = {"LOONARS_ENABLE_LIVE_SOURCES": "1", "LOONARS_AI_CFO_SECRET": "s" * 40,
                   "LOONARS_AI_CFO_URL": "http://127.0.0.1:%d/api/cfo/advisor" % srv.server_port}
            r = sources.AiCfoSource(env).fetch("evaluasi", rencana={"nominal": 1e8, "lini": "L1", "ket": "x"})
            self.assertEqual(r.label, "PROJECTION")
            self.assertEqual(r.rows[0]["putusan"], "waspada")
            self.assertEqual(seen["secret"], "s" * 40)
            self.assertIsNone(seen["sync"])
            self.assertEqual(seen["body"]["mode"], "evaluasi")
        finally:
            srv.shutdown()

    def test_ai_cfo_wrong_secret_is_reported_as_refused(self):
        import http.server
        import threading

        class H(http.server.BaseHTTPRequestHandler):
            def do_POST(self):
                self.send_response(401)
                self.end_headers()

            def log_message(self, *a):
                pass

        srv = http.server.HTTPServer(("127.0.0.1", 0), H)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        try:
            env = {"LOONARS_ENABLE_LIVE_SOURCES": "1", "LOONARS_AI_CFO_SECRET": "s" * 40,
                   "LOONARS_AI_CFO_URL": "http://127.0.0.1:%d/x" % srv.server_port}
            r = sources.AiCfoSource(env).fetch("fakta")
            self.assertEqual(r.health, "unreachable")
            self.assertEqual(r.rows, [])
            self.assertIn("401", r.note)
            self.assertIn("ditolak", r.note)
        finally:
            srv.shutdown()

    def test_ai_cfo_unreachable_is_not_zero(self):
        env = {"LOONARS_ENABLE_LIVE_SOURCES": "1", "LOONARS_AI_CFO_SECRET": "s" * 40,
               "LOONARS_AI_CFO_URL": "http://127.0.0.1:9/none"}
        r = sources.AiCfoSource(env, timeout=2).fetch("fakta")
        self.assertEqual(r.health, "unreachable")
        self.assertEqual(r.rows, [])

    def test_bad_label_refused(self):
        with self.assertRaises(base.SourceError):
            base.Records("s", "d", None, "now", "GUESS")


if __name__ == "__main__":
    unittest.main()
