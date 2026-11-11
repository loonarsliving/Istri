"""Concrete data sources. Only ManualSnapshotSource reads anything today.

Live sources are stubs (Phase 5 design). They describe the contract they will
implement and refuse to run. Turning one on needs: the owner's written
approval, a read-only credential created for the advisor alone, and a change
reviewed in the owning repo (see docs/integrations/).
"""

import datetime as _dt
import json
import os
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


class AiCfoSource(_LiveStub):
    """MKH Property AI CFO (finance.haluoleo.id). Proposed read-only endpoint POST /api/cfo/advisor
    returning {jawaban, putusan, fakta[], evaluasi?}. Today the AI CFO is reached through MK Connect's
    owner WA tool `ai_cfo` (/api/cfo/tanya-wa) or /cfo/chat; this advisor must not reuse the shared
    sync secret."""
    INFO = SourceInfo(name="ai_cfo", system="MKH Property AI CFO", owner_repo="loonarsliving/mkh-properti",
                      note="docs/integrations/01-ai-cfo.md")


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
