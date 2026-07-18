"""Read-only ADIF preflight defect-packet readout (ADIF-T3).

Formats a bounded, human-readable readout of the ADIF-T2 resolver's
output for a caller-supplied task class, role, lifecycle phase, and surface
selector. This module does not duplicate the resolver's matching or
ordering logic; it only reads `resolve_defect_packet` output and formats it.

This module is a standalone callable helper. It is not wired into any
autorun phase command list and does not create a competing autorun
process. Returning a readout is not evidence that any caller read or
understood it.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from dataclasses import dataclass
from pathlib import Path

_RESOLVER_PATH = Path(__file__).resolve().with_name("run_adif_defect_resolver.py")
_RESOLVER_SPEC = importlib.util.spec_from_file_location("run_adif_defect_resolver", _RESOLVER_PATH)
assert _RESOLVER_SPEC and _RESOLVER_SPEC.loader
resolver = importlib.util.module_from_spec(_RESOLVER_SPEC)
sys.modules[_RESOLVER_SPEC.name] = resolver
_RESOLVER_SPEC.loader.exec_module(resolver)


@dataclass(frozen=True)
class PreflightReadoutLine:
    """One formatted line in the bounded preflight readout."""

    defect_id: str
    title: str
    severity: str
    enforcement_level: str
    checker_bindings: str
    source_path: str


@dataclass(frozen=True)
class PreflightReadout:
    """Bounded, read-only preflight readout. Not an action receipt."""

    lines: tuple[PreflightReadoutLine, ...]
    truncated: bool
    total_candidates: int
    claim_boundary: str

    def to_human_text(self) -> str:
        if not self.lines:
            return "ADIF preflight readout: no matching defect entries for the given context."
        rows = [
            f"  - {line.defect_id} [{line.severity}/{line.enforcement_level}] {line.title}"
            f" (checker: {line.checker_bindings}; source: {line.source_path})"
            for line in self.lines
        ]
        header = f"ADIF preflight readout ({len(self.lines)} of {self.total_candidates} candidate(s)):"
        footer = self.claim_boundary
        if self.truncated:
            footer = f"{footer} Result truncated; more candidates exist than shown."
        return "\n".join([header, *rows, footer])

    def to_dict(self) -> dict:
        return {
            "lines": [
                {
                    "defectId": line.defect_id,
                    "title": line.title,
                    "severity": line.severity,
                    "enforcementLevel": line.enforcement_level,
                    "checkerBindings": line.checker_bindings,
                    "sourcePath": line.source_path,
                }
                for line in self.lines
            ],
            "truncated": self.truncated,
            "totalCandidates": self.total_candidates,
            "claimBoundary": self.claim_boundary,
        }


def build_preflight_readout(
    *,
    task_class: str | None = None,
    role: str | None = None,
    lifecycle_phase: str | None = None,
    surface_selector: str | None = None,
    risk_ceiling: str | None = None,
    max_results: int = 5,
) -> PreflightReadout:
    """Read-only preflight readout built directly from the ADIF-T2 resolver.

    All matching, ordering, and lifecycle-exclusion logic lives in
    `resolve_defect_packet`; this function only formats its output.
    """
    packet = resolver.resolve_defect_packet(
        task_class=task_class,
        role=role,
        lifecycle_phase=lifecycle_phase,
        surface_selector=surface_selector,
        risk_ceiling=risk_ceiling,
        max_results=max_results,
    )
    lines = tuple(
        PreflightReadoutLine(
            defect_id=item.defect_id,
            title=item.title,
            severity=item.severity,
            enforcement_level=item.enforcement_level,
            checker_bindings=item.checker_bindings,
            source_path=item.source_path,
        )
        for item in packet.items
    )
    return PreflightReadout(
        lines=lines,
        truncated=packet.truncated,
        total_candidates=packet.total_candidates,
        claim_boundary=(
            "This readout is not evidence that any caller read, understood, "
            "or acted on the listed entries."
        ),
    )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Build a bounded human-readable ADIF preflight readout."
    )
    parser.add_argument("--task-class", default=None, help="Optional task class filter")
    parser.add_argument("--role", default=None, help="Optional role filter")
    parser.add_argument("--lifecycle-phase", default=None, help="Optional lifecycle phase filter")
    parser.add_argument("--surface-selector", default=None, help="Optional surface selector substring")
    parser.add_argument("--risk-ceiling", default=None, help="Optional LOW, MEDIUM, or HIGH ceiling")
    parser.add_argument("--max-results", type=int, default=5)
    parser.add_argument("--json", action="store_true", help="Print JSON output")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    try:
        readout = build_preflight_readout(
            task_class=args.task_class,
            role=args.role,
            lifecycle_phase=args.lifecycle_phase,
            surface_selector=args.surface_selector,
            risk_ceiling=args.risk_ceiling,
            max_results=args.max_results,
        )
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(readout.to_dict(), indent=2, ensure_ascii=False))
    else:
        print(readout.to_human_text())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
