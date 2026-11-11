import os
import re
import unittest

from _path import ROOT

SKILLS = os.path.join(ROOT, ".claude", "skills")
REQUIRED_SKILLS = {
    "loonars-mentor", "loonars-board", "business-feasibility", "loonars-consumer", "loonars-market",
    "investor-strategy", "hospitality-strategy", "capital-allocation", "founder-decision-review",
    "strategic-planning", "financial-risk-analysis",
}
SECTIONS = ("## Instruksi", "## Input", "## Proses", "## Output", "## Batasan")
SEATS = {"chairman", "ceo-advisor", "cfo-advisor", "investment-advisor", "market-intelligence",
         "consumer-panel", "marketing-director", "operations-director"}
KB = {
    "company": ["company-profile", "business-model", "company-structure", "financial-position",
                "strategic-goals", "investment-history"],
    "projects": ["loonars-1", "loonars-2", "loonars-3", "expansion-plan"],
    "hospitality": ["pricing-strategy", "occupancy-strategy", "operations"],
    "market": ["competitor-analysis", "market-opportunity"],
}
SECRET_PATTERNS = [
    re.compile(r"eyJhbGciOi[A-Za-z0-9_\-]{20,}"),          # JWT (e.g. Supabase keys)
    re.compile(r"sk-[A-Za-z0-9]{20,}"),                      # API keys
    re.compile(r"AIza[0-9A-Za-z_\-]{30,}"),                  # Google API key
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
]


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


class Repo(unittest.TestCase):
    def test_skills_have_frontmatter_and_five_sections(self):
        present = {d for d in os.listdir(SKILLS) if os.path.isfile(os.path.join(SKILLS, d, "SKILL.md"))}
        self.assertTrue(REQUIRED_SKILLS <= present, REQUIRED_SKILLS - present)
        for name in present:
            text = read(os.path.join(SKILLS, name, "SKILL.md"))
            m = re.match(r"---\nname: (\S+)\ndescription: >-\n(.+?)\n---\n", text, re.S)
            self.assertIsNotNone(m, name)
            self.assertEqual(m.group(1), name)
            for s in SECTIONS:
                self.assertIn(s, text, "%s lacks %s" % (name, s))

    def test_board_has_eight_seats(self):
        seats = {f[:-3] for f in os.listdir(os.path.join(SKILLS, "loonars-board", "seats")) if not f.startswith("_")}
        self.assertEqual(seats, SEATS)

    def test_knowledge_base_complete_with_status(self):
        for folder, files in KB.items():
            for f in files:
                p = os.path.join(ROOT, "knowledge-base", folder, f + ".md")
                self.assertTrue(os.path.exists(p), p)
                self.assertRegex(read(p), r"Status: (NEEDS DATA|PARTIAL|CURRENT)", p)

    def test_decisions_confirmed_only_with_confirmation(self):
        d = os.path.join(ROOT, "decisions")
        for f in os.listdir(d):
            if f.startswith("D-"):
                text = read(os.path.join(d, f))
                if re.search(r"^status: (CONFIRMED|REVIEWED)", text, re.M):
                    self.assertRegex(text, re.compile(r"^confirmed_at: \d{4}-\d{2}-\d{2}", re.M), f)
                    self.assertRegex(text, re.compile(r"^confirmed_by: founder", re.M), f)

    def test_no_secrets_committed(self):
        skip = {".git", "vendor", "private", "__pycache__", "node_modules", ".next"}
        for base, dirs, files in os.walk(ROOT):
            dirs[:] = [x for x in dirs if x not in skip]
            for f in files:
                p = os.path.join(base, f)
                try:
                    text = read(p)
                except UnicodeDecodeError:
                    continue
                for pat in SECRET_PATTERNS:
                    self.assertIsNone(pat.search(text), "possible secret in %s" % p)

    def test_every_decision_is_reviewed_policy(self):
        policy = read(os.path.join(ROOT, "docs", "standards", "decision-review-policy.md"))
        for level in ("Ringkas", "Standar", "Penuh"):
            self.assertIn(level, policy)
        for name in ("loonars-mentor", "loonars-board"):
            self.assertIn("decision-review-policy.md", read(os.path.join(SKILLS, name, "SKILL.md")), name)
        seats = re.findall(r"^\| [^|]+ \| ([^|]+) \|$", policy.split("## Pemilihan seat")[1].split("##")[0], re.M)
        labels = {"CFO Advisor": "cfo-advisor", "Chairman": "chairman", "Investment Advisor": "investment-advisor",
                  "CEO Advisor": "ceo-advisor", "Operations Director": "operations-director", "Consumer Panel*": "consumer-panel",
                  "Marketing Director": "marketing-director", "Market Intelligence": "market-intelligence"}
        rows = [r for r in seats if not r.strip().startswith("-") and r.strip() != "3 seat"]
        self.assertEqual(len(rows), 9)
        for row in rows:
            names = [s.strip() for s in row.split(",")]
            self.assertEqual(len(names), 3, row)
            for n in names:
                self.assertIn(labels[n], SEATS, n)

    def test_private_and_env_are_ignored(self):
        gi = read(os.path.join(ROOT, ".gitignore"))
        for line in ("private/", ".env", ".env.*"):
            self.assertIn(line, gi.splitlines())


if __name__ == "__main__":
    unittest.main()
