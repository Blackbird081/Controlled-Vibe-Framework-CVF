"""Bounded, non-auto-promoting ADIF reviewer finding-intake bridge (ADIF-T4).

Maps a structured finding description to exactly one of five required
outcomes, preserving F2G disposition and FPRC defectRole vocabularies
without redefining them:

- LINK_TO_EXISTING_ENTRY
- PROPOSE_UPDATE_TO_EXISTING_ENTRY
- PROPOSE_NEW_GUIDANCE_ONLY_CANDIDATE
- PROPOSE_MACHINE_CHECK_CANDIDATE
- REJECT_AS_NON_REUSABLE

This module never auto-promotes a finding to a canonical entry: it
returns a classification only. No entry file under
``docs/reference/agent_defect_intelligence/entries/`` is ever created,
modified, or have its enforcementLevel/lifecycleState changed by this
module.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

_VALID_DEFECT_CLASSES = frozenset(
    {
        "WORKER_EXECUTION_ERROR",
        "ORCHESTRATOR_PACKET_GAP",
        "RULE_GAP",
        "MACHINE_GATE_GAP",
        "PHASE_GATE_PLACEMENT_GAP",
        "OPERATOR_SCOPE_CLARITY_GAP",
        "RUNTIME_SIGNAL_GAP",
    }
)
_VALID_DEFECT_ROLES = frozenset(
    {
        "ROOT_CAUSE",
        "PROPAGATED_SYMPTOM",
        "EVIDENCE_REPLICATION",
        "STALE_SYNC",
        "REVIEWER_REPAIR_SIDE_EFFECT",
    }
)

_RESOLVER_PATH = Path(__file__).resolve().with_name("run_adif_defect_resolver.py")
_RESOLVER_SPEC = importlib.util.spec_from_file_location("run_adif_defect_resolver", _RESOLVER_PATH)
assert _RESOLVER_SPEC and _RESOLVER_SPEC.loader
resolver = importlib.util.module_from_spec(_RESOLVER_SPEC)
sys.modules[_RESOLVER_SPEC.name] = resolver
_RESOLVER_SPEC.loader.exec_module(resolver)

LINK_TO_EXISTING_ENTRY = "LINK_TO_EXISTING_ENTRY"
PROPOSE_UPDATE_TO_EXISTING_ENTRY = "PROPOSE_UPDATE_TO_EXISTING_ENTRY"
PROPOSE_NEW_GUIDANCE_ONLY_CANDIDATE = "PROPOSE_NEW_GUIDANCE_ONLY_CANDIDATE"
PROPOSE_MACHINE_CHECK_CANDIDATE = "PROPOSE_MACHINE_CHECK_CANDIDATE"
REJECT_AS_NON_REUSABLE = "REJECT_AS_NON_REUSABLE"

_VALID_OUTCOMES = frozenset(
    {
        LINK_TO_EXISTING_ENTRY,
        PROPOSE_UPDATE_TO_EXISTING_ENTRY,
        PROPOSE_NEW_GUIDANCE_ONLY_CANDIDATE,
        PROPOSE_MACHINE_CHECK_CANDIDATE,
        REJECT_AS_NON_REUSABLE,
    }
)


@dataclass(frozen=True)
class FindingIntakeRequest:
    """Caller-supplied description of one reviewer finding or worker friction item."""

    summary: str
    defect_class: str | None = None
    defect_role: str | None = None
    is_session_local: bool = False
    checker_binding: str | None = None
    matching_defect_id: str | None = None


@dataclass(frozen=True)
class FindingIntakeOutcome:
    """Bounded classification result. Not an entry mutation."""

    outcome: str
    reason: str
    matched_defect_id: str | None
    defect_class: str | None
    defect_role: str | None

    def to_dict(self) -> dict:
        return {
            "outcome": self.outcome,
            "reason": self.reason,
            "matchedDefectId": self.matched_defect_id,
            "defectClass": self.defect_class,
            "defectRole": self.defect_role,
            "claimBoundary": (
                "This classification does not create, modify, or promote any "
                "ADIF entry file."
            ),
        }

    def to_human_text(self) -> str:
        matched = self.matched_defect_id or "NONE"
        return "\n".join(
            [
                "ADIF finding-intake bridge",
                f"Outcome: {self.outcome}",
                f"Matched defect: {matched}",
                f"Defect class: {self.defect_class or 'NONE'}",
                f"Defect role: {self.defect_role or 'NONE'}",
                f"Reason: {self.reason}",
                "Claim boundary: This classification does not create, modify, or promote any ADIF entry file.",
            ]
        )


def _entry_exists(defect_id: str, entries: tuple) -> bool:
    return any(entry.defect_id == defect_id for entry in entries)


def _validate_request(request: FindingIntakeRequest) -> None:
    if request.defect_class is not None and request.defect_class not in _VALID_DEFECT_CLASSES:
        raise ValueError("defect_class must use the canonical F2G defect-class vocabulary")
    if request.defect_role is not None and request.defect_role not in _VALID_DEFECT_ROLES:
        raise ValueError("defect_role must use the canonical FPRC defect-role vocabulary")
    if request.checker_binding is not None:
        path = request.checker_binding.strip()
        if not path.startswith("governance/compat/") or not path.endswith(".py"):
            raise ValueError("checker_binding must be a governance/compat/*.py path")
        if not (REPO_ROOT / path).is_file():
            raise ValueError("checker_binding must name an existing checker source file")


def classify_finding(
    request: FindingIntakeRequest,
    *,
    entries: tuple | None = None,
) -> FindingIntakeOutcome:
    """Deterministic, read-only classification of one finding into one outcome.

    Never auto-promotes: the caller is responsible for acting on the
    returned classification through the normal governed authoring path.
    """
    if not request.summary or not request.summary.strip():
        raise ValueError("FindingIntakeRequest.summary must be a non-empty string")
    _validate_request(request)

    candidates = entries if entries is not None else resolver.load_entries()

    if request.is_session_local:
        return FindingIntakeOutcome(
            outcome=REJECT_AS_NON_REUSABLE,
            reason="finding is marked session-local and not reusable across sessions",
            matched_defect_id=None,
            defect_class=request.defect_class,
            defect_role=request.defect_role,
        )

    if request.matching_defect_id and _entry_exists(request.matching_defect_id, candidates):
        if request.checker_binding is not None:
            return FindingIntakeOutcome(
                outcome=PROPOSE_UPDATE_TO_EXISTING_ENTRY,
                reason=(
                    f"finding adds new checker-binding evidence to existing entry "
                    f"{request.matching_defect_id}; propose an update, do not auto-apply"
                ),
                matched_defect_id=request.matching_defect_id,
                defect_class=request.defect_class,
                defect_role=request.defect_role,
            )
        return FindingIntakeOutcome(
            outcome=LINK_TO_EXISTING_ENTRY,
            reason=f"finding matches existing entry {request.matching_defect_id}; link instead of duplicating",
            matched_defect_id=request.matching_defect_id,
            defect_class=request.defect_class,
            defect_role=request.defect_role,
        )

    if request.matching_defect_id and not _entry_exists(request.matching_defect_id, candidates):
        return FindingIntakeOutcome(
            outcome=REJECT_AS_NON_REUSABLE,
            reason=(
                f"finding cites defectId {request.matching_defect_id}, which does not "
                "exist in the committed entry set; reject pending source verification"
            ),
            matched_defect_id=None,
            defect_class=request.defect_class,
            defect_role=request.defect_role,
        )

    if request.checker_binding is not None:
        return FindingIntakeOutcome(
            outcome=PROPOSE_MACHINE_CHECK_CANDIDATE,
            reason="finding cites an existing checker binding; propose a machine-check candidate through F2G",
            matched_defect_id=None,
            defect_class=request.defect_class,
            defect_role=request.defect_role,
        )

    return FindingIntakeOutcome(
        outcome=PROPOSE_NEW_GUIDANCE_ONLY_CANDIDATE,
        reason="finding has no existing entry match and no checker binding; propose a guidance-only candidate",
        matched_defect_id=None,
        defect_class=request.defect_class,
        defect_role=request.defect_role,
    )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Classify one ADIF reviewer finding into a bounded intake outcome."
    )
    parser.add_argument("--summary", required=True, help="Finding summary")
    parser.add_argument("--defect-class", default=None, help="Canonical F2G defect class")
    parser.add_argument("--defect-role", default=None, help="Canonical FPRC defect role")
    parser.add_argument("--session-local", action="store_true", help="Reject as non-reusable")
    parser.add_argument("--checker-binding", default=None, help="Existing governance/compat/*.py checker path")
    parser.add_argument("--matching-defect-id", default=None, help="Existing ADIF defect id")
    parser.add_argument("--json", action="store_true", help="Print JSON output")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)
    request = FindingIntakeRequest(
        summary=args.summary,
        defect_class=args.defect_class,
        defect_role=args.defect_role,
        is_session_local=args.session_local,
        checker_binding=args.checker_binding,
        matching_defect_id=args.matching_defect_id,
    )
    try:
        outcome = classify_finding(request)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(outcome.to_dict(), indent=2, ensure_ascii=False))
    else:
        print(outcome.to_human_text())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
