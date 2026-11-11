"""Read-only data-source contract for Loonars AI Advisor. Standard library only.

Every number the advisor uses about Loonars' real business must come through a
DataSource, so it carries where it came from, which period it covers, when it
was retrieved, and what kind of data it is.

Design rules (docs/phase-1/02-architecture.md §4.5, docs/integrations/):
- READ ONLY. The interface has no write, update, delete or execute method, on
  purpose. Do not add one.
- A source that cannot be read reports health "unreachable" and returns no
  records. It never returns zeros. (Same rule as FRIDAY Holding in MK Connect.)
- No credentials in code. Live sources read secrets from environment variables
  only, and are disabled unless explicitly enabled.
"""

import dataclasses
import datetime as _dt
from typing import Any, Dict, List, Optional

# Data labels, docs/phase-1/02-architecture.md §5
LABELS = ("ACTUAL", "HISTORICAL", "ASSUMPTION", "PROJECTION", "SIMULATED")
HEALTH = ("ok", "degraded", "unreachable")

# The normalized metric vocabulary shared with FRIDAY Holding
# (Mkhsistem lib/ai/friday/connectors/types.ts HOLDING_METRIC_KEYS), so the
# advisor and FRIDAY compare businesses on the same keys.
HOLDING_METRIC_KEYS = (
    "revenue", "cash_balance", "operating_cost", "utilization", "new_leads", "conversions",
    "pipeline_neglect", "marketing_spend", "cost_per_lead", "headcount_present", "open_tasks_overdue",
)
METRIC_UNITS = ("idr", "count", "percent", "days", "ratio")


class SourceError(Exception):
    pass


@dataclasses.dataclass(frozen=True)
class Period:
    start: str  # ISO date
    end: str    # ISO date, inclusive

    def __post_init__(self):
        for v in (self.start, self.end):
            _dt.date.fromisoformat(v)
        if self.start > self.end:
            raise SourceError("period start %s is after end %s" % (self.start, self.end))


@dataclasses.dataclass(frozen=True)
class SourceInfo:
    name: str
    system: str          # e.g. "MKH Property AI CFO", "villa", "MK Connect FRIDAY Holding"
    owner_repo: str      # e.g. "loonarsliving/mkh-properti"
    read_only: bool = True
    enabled: bool = False
    note: str = ""


@dataclasses.dataclass
class Records:
    source: str
    dataset: str
    period: Optional[Period]
    retrieved_at: str
    label: str
    health: str = "ok"
    rows: List[Dict[str, Any]] = dataclasses.field(default_factory=list)
    note: str = ""

    def __post_init__(self):
        if self.label not in LABELS:
            raise SourceError("label %r is not one of %s" % (self.label, ", ".join(LABELS)))
        if self.health not in HEALTH:
            raise SourceError("health %r is not one of %s" % (self.health, ", ".join(HEALTH)))
        if self.health == "unreachable" and self.rows:
            raise SourceError("an unreachable source must not return rows")

    def citation(self) -> str:
        p = "%s..%s" % (self.period.start, self.period.end) if self.period else "periode tidak disebut"
        return "[%s · %s · %s/%s · diambil %s]" % (self.label, p, self.source, self.dataset, self.retrieved_at)


class DataSource:
    """Base class. Subclasses implement describe() and fetch(); nothing else."""

    def describe(self) -> SourceInfo:
        raise NotImplementedError

    def fetch(self, dataset: str, period: Optional[Period] = None) -> Records:
        raise NotImplementedError


def unreachable(source: str, dataset: str, note: str, period: Optional[Period] = None) -> Records:
    return Records(source=source, dataset=dataset, period=period,
                   retrieved_at=_dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds"),
                   label="ACTUAL", health="unreachable", rows=[], note=note)


def validate_metric(m: Dict[str, Any]) -> None:
    """Check one FRIDAY-style NormalizedMetric. value None = cannot answer, never 0."""
    for k in ("key", "label", "unit"):
        if k not in m:
            raise SourceError("metric needs '%s'" % k)
    if m["unit"] not in METRIC_UNITS:
        raise SourceError("metric unit %r is not one of %s" % (m["unit"], ", ".join(METRIC_UNITS)))
    v = m.get("value")
    if v is not None and not isinstance(v, (int, float)):
        raise SourceError("metric %s value must be a number or null" % m["key"])
