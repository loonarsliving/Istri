import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for p in ("tools/finance", "tools/panel", "tools/adapters"):
    sys.path.insert(0, os.path.join(ROOT, p))
FIXTURES = os.path.join(ROOT, "tests", "fixtures")
