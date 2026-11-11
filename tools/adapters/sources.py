"""Concrete data sources. Only ManualSnapshotSource reads anything today.

Live sources are stubs (Phase 5 design). They describe the contract they will
implement and refuse to run. Turning one on needs: the owner's written
approval, a read-only credential created for the advisor alone, and a change
reviewed in the owning repo (see docs/integrations/).
"""

import datetime as _dt
import json
import os
import urllib.error
import urllib.request
from typing import Optional

from base import DataSource, Period, Records, SourceError, SourceInfo, unreachable, validate_metric


class ManualSnapshotSource(DataSource):
    """Reads a JSON snapshot the founder exported or pasted, e.g. an AI CFO answer.

    File shape:
        {"source": "MKH Property AI CFO", "dataset": "tanya-cfo", "label": "ACTUAL",
         "period": {"start": "2026-11-01", "end": "2026-11-30"},
         "retrieved_at": "2026-11-11T09:00:00+08:00", "how": "WA ai_cfo / /cfo/chat / export",
         "rows": [...], "metrics": [... FRIDAY NormalizedMetric ...]}
    """

    def __init__(self, path: str):
        self.path = path

    def describe(self) -> SourceInfo:
        return SourceInfo(name="manual_snapshot", system="ekspor/tempelan manual founder", owner_repo="-",
                          read_only=True, enabled=True, note=self.path)

    def fetch(self, dataset: str = "", period: Optional[Period] = None) -> Records:
        if not os.path.exists(self.path):
            return unreachable("manual_snapshot", dataset or "?", "file tidak ada: %s" % self.path, period)
        with open(self.path, encoding="utf-8") as fh:
            d = json.load(fh)
        for k in ("source", "dataset", "label", "retrieved_at"):
            if k not in d:
                raise SourceError("%s: snapshot needs '%s' so the numbers stay traceable" % (self.path, k))
        p = d.get("period")
        per = Period(p["start"], p["end"]) if p else None
        for m in d.get("metrics", []):
            validate_metric(m)
        rows = list(d.get("rows", [])) + [dict(m, _kind="metric") for m in d.get("metrics", [])]
        return Records(source=d["source"], dataset=d["dataset"], period=per, retrieved_at=d["retrieved_at"],
                       label=d["label"], health=d.get("health", "ok"), rows=rows, note=d.get("how", ""))


class _LiveStub(DataSource):
    INFO: SourceInfo

    def describe(self) -> SourceInfo:
        return self.INFO

    def fetch(self, dataset: str, period: Optional[Period] = None) -> Records:
        raise NotImplementedError(
            "%s belum aktif (Phase 5, desain saja). Pakai ManualSnapshotSource. Lihat %s." % (
                self.INFO.system, self.INFO.note))


class SourceDisabled(NotImplementedError):
    """A live source that has not been switched on."""


class AiCfoSource(DataSource):
    """MKH Property AI CFO, read-only endpoint POST /api/cfo/advisor (patch:
    integrations/mkh-properti-advisor/). Off unless all three env vars are set:

        LOONARS_ENABLE_LIVE_SOURCES=1
        LOONARS_AI_CFO_URL=https://finance.haluoleo.id/api/cfo/advisor
        LOONARS_AI_CFO_SECRET=<advisor secret, never committed>

    datasets: "fakta" | "tanya" (query=pertanyaan) | "evaluasi" (rencana={nominal, lini, ket, ...}).
    It never uses MK Connect's shared sync secret.
    """

    def __init__(self, env=None, timeout=30):
        self.env = os.environ if env is None else env
        self.timeout = timeout

    def _enabled(self):
        return (self.env.get("LOONARS_ENABLE_LIVE_SOURCES") == "1" and bool(self.env.get("LOONARS_AI_CFO_URL"))
                and len(self.env.get("LOONARS_AI_CFO_SECRET", "")) >= 32)

    def describe(self) -> SourceInfo:
        return SourceInfo(name="ai_cfo", system="MKH Property AI CFO", owner_repo="loonarsliving/mkh-properti",
                          read_only=True, enabled=self._enabled(), note="docs/integrations/01-ai-cfo.md")

    def fetch(self, dataset: str, period: Optional[Period] = None, query: str = "", rencana=None) -> Records:
        if not self._enabled():
            raise SourceDisabled("AI CFO belum aktif: set LOONARS_ENABLE_LIVE_SOURCES, LOONARS_AI_CFO_URL, "
                                 "LOONARS_AI_CFO_SECRET (lihat integrations/mkh-properti-advisor/README.md). "
                                 "Sementara pakai ManualSnapshotSource.")
        if dataset == "fakta":
            body = {"mode": "fakta"}
        elif dataset == "tanya":
            body = {"mode": "tanya", "pertanyaan": query}
        elif dataset == "evaluasi":
            body = {"mode": "evaluasi", "rencana": rencana or {}}
        else:
            raise SourceError("dataset AI CFO tidak dikenal: %r" % dataset)
        req = urllib.request.Request(self.env["LOONARS_AI_CFO_URL"], data=json.dumps(body).encode("utf-8"),
                                     method="POST", headers={"content-type": "application/json",
                                                             "x-advisor-secret": self.env["LOONARS_AI_CFO_SECRET"]})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as res:
                d = json.loads(res.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            # Reached the server but was refused or failed: say so, never return data.
            why = "akses ditolak (rahasia advisor tidak cocok)" if e.code in (401, 403) else "galat server"
            return unreachable("ai_cfo", dataset, "AI CFO menjawab HTTP %d: %s" % (e.code, why), period)
        except (urllib.error.URLError, OSError, ValueError) as e:
            # Not reachable is not zero: report it as unreachable, never as data.
            return unreachable("ai_cfo", dataset, "AI CFO tidak terbaca: %s" % e, period)
        hari = d.get("hariIni")
        return Records(source="MKH Property AI CFO", dataset=dataset,
                       period=Period(hari, hari) if hari else None, retrieved_at=now_iso(),
                       label=d.get("label", "ACTUAL") if d.get("label") in ("ACTUAL", "PROJECTION") else "ACTUAL",
                       rows=[d], note="POST /api/cfo/advisor")


class FridayHoldingSource(_LiveStub):
    """MK Connect FRIDAY Holding: one BusinessSnapshot per business (metrics[] + narrative + health)."""
    INFO = SourceInfo(name="friday_holding", system="MK Connect FRIDAY Holding", owner_repo="loonarsliving/Mkhsistem",
                      note="docs/integrations/02-mkhsistem.md")


class VillaSource(_LiveStub):
    """Loonars 1 operations (villa / villa-api). Read through MKH Property or FRIDAY, never villa tables directly."""
    INFO = SourceInfo(name="villa", system="Loonars Villa (villa-api)", owner_repo="loonarsliving/villa",
                      note="docs/integrations/03-villa.md")


class CloudbedsSource(_LiveStub):
    INFO = SourceInfo(name="cloudbeds", system="Cloudbeds (via villa)", owner_repo="loonarsliving/villa",
                      note="docs/integrations/03-villa.md")


class OtaSource(_LiveStub):
    INFO = SourceInfo(name="ota", system="OTA booking data (via villa settlements)", owner_repo="loonarsliving/villa",
                      note="docs/integrations/03-villa.md")


ALL_SOURCES = (ManualSnapshotSource, AiCfoSource, FridayHoldingSource, VillaSource, CloudbedsSource, OtaSource)


def now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds")
