#!/usr/bin/env python3
"""
CVF Agent Automation Assist (AAF-T1).

A deterministic, read-only helper that reduces CVF workflow latency for noncoder
operators and external agents connected through CLI/MCP. It classifies the
current changed batch, recommends the correct commit-steward lane, lists missing
Worker Return Packet Shape Contract blocks for changed WORKER_MUST_NOT_COMMIT
work orders, and prints the exact next command.

This helper is read-only by default. Its report, diagnostics, and readouts
never write, stage, commit, push, delete, move, run provider/live checks, or
shell into arbitrary user commands. It only inspects the git changed set and
changed-file text, and prints recommended commands for the operator or reviewer
to run themselves.

The single exception is the explicit AAF-T7B L1 reviewer-completion scaffold
write mode (--write-reviewer-completion-scaffold): per L2A safety level L1 it
creates exactly one new skeleton markdown file under docs/reviews/, refusing to
overwrite and refusing any path outside docs/reviews/. That bounded write never
edits an existing file, stages, commits, applies a diff, or makes a closure
decision. No L2 patch preview or L3 apply behavior exists in this helper.

It reuses the canonical commit-steward path classification
(`run_agent_commit_steward_preflight.build_path_plan`) instead of duplicating it,
and mirrors the machine-enforced worker-return packet-shape vocabulary from
`check_work_order_dispatch_quality` so its diagnostics match the real gate.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field, replace
from pathlib import Path

try:
    from run_agent_commit_steward_preflight import (
        PathPlan,
        build_path_plan,
    )
    import check_worker_experience_retrospective as worker_experience
except ModuleNotFoundError:  # imported as governance.compat.run_agent_automation_assist
    import sys as _sys

    _sys.path.insert(0, str(Path(__file__).resolve().parent))
    from run_agent_commit_steward_preflight import (
        PathPlan,
        build_path_plan,
    )
    import check_worker_experience_retrospective as worker_experience

REPO_ROOT = Path(__file__).resolve().parents[2]

# Mirror of the machine-enforced contract vocabulary in
# check_work_order_dispatch_quality.py. Kept as a local mirror so this advisory
# helper has no hard import-time dependency on that gate's heavy module, but the
# terms must stay aligned with the gate.
WORKER_RETURN_PACKET_SHAPE_CONTRACT_MARKER = "Worker Return Packet Shape Contract"
WORKER_RETURN_PACKET_SHAPE_REQUIRED_TERMS = (
    "Purpose",
    "Scope / Methodology",
    "Findings / Position",
    "Risk / Corrective Action",
    "Claim Boundary",
    "Agent Operation Trace Block",
    "Delta Execution Claim Boundary Control Block",
    "Public Export Disposition",
    "executionBaseHead",
    "git status --short",
)
WORKER_RETURN_PACKET_SHAPE_CONDITIONAL_TERMS = (
    "External Knowledge Intake Routing",
    "Rescan Intelligence Hardening",
    "Corpus Completeness And Report Integrity",
    "Finding-To-Governance Learning Disposition",
    "Epistemic Process Block",
    "Machine Closure Package",
)

# ---------------------------------------------------------------------------
# AAF-T2: Early corpus-completeness diagnostics.
# Mirror the applicable-path boundary and key constants from
# check_corpus_completeness_report_integrity so the helper can detect
# changed active Markdown with a defective Corpus Completeness And Report
# Integrity block before a full gate run. These mirrors are validated by
# the focused drift test in test_run_agent_automation_assist.py.
# ---------------------------------------------------------------------------

CORPUS_REQUIRED_SECTION = "## Corpus Completeness And Report Integrity"
CORPUS_APPLICABLE_PREFIXES = (
    "docs/audits/",
    "docs/reviews/",
    "docs/assessments/",
    "docs/logs/",
    "docs/reports/",
    "docs/baselines/",
    "docs/roadmaps/",
    "docs/work_orders/",
)
CORPUS_ARCHIVE_MARKER = "/archive/"
CORPUS_EXCLUDED_PATHS = frozenset({
    "docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md",
    "governance/toolkit/05_OPERATION/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_GUARD.md",
    "docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md",
})
CORPUS_ALLOWED_VERDICTS = ("COMPLETE_VERIFIED", "COMPLETE_WITH_DECLARED_EXCLUSIONS", "PARTIAL", "BLOCKED", "STALE_SNAPSHOT", "NOT_APPLICABLE_WITH_REASON")
CORPUS_ALLOWED_TERMINAL_STATUSES = (
    "READ",
    "SKIPPED_WITH_REASON",
    "DEFERRED",
    "BLOCKED_UNREADABLE",
)
CORPUS_REQUIRED_SECTION_FIELDS = (
    "Corpus task class:",
    "Corpus root:",
    "Snapshot time:",
    "Enumeration command:",
    "Manifest artifact or inline manifest:",
    "Manifest hash:",
    "Processing ledger artifact or inline ledger:",
    "Allowed terminal statuses:",
    "Reconciliation:",
    "Unresolved files:",
    "Declared exclusions:",
    "Unreadable or unsupported files:",
    "Aggregation check:",
    "Drift check:",
    "Output traceability:",
    "Adversarial verification:",
    "Corpus verdict:",
)
_CORPUS_COMPLETE_CLAIM_PATTERNS = (
    re.compile(r"\ball files (?:were )?(?:read|processed|reviewed|scanned)\b", re.I),
    re.compile(r"\bno files? (?:were )?skipped\b", re.I),
    re.compile(r"\bnone skipped\b", re.I),
    re.compile(r"\bfull(?:y)? file(?:-level)? (?:read|scan|inventory|coverage)\b", re.I),
    re.compile(r"\bcomplete(?:d)? (?:corpus|inventory|scan|coverage)\b", re.I),
    re.compile(r"\bblind-spot verdict:\s*clear\b", re.I),
    re.compile(r"\bblindspot risk verdict:\s*clear\b", re.I),
)
_CORPUS_RECONCILIATION_MARKERS = ("manifest=", "ledger_terminal=", "exclusions=", "unresolved=")

ALLOWED_MODES = (
    "auto",
    "dispatch",
    "implementation",
    "reviewer-return",
    "closure",
    "session-sync",
    "handoff-sync",
)

_WORK_ORDER_RE = re.compile(r"docs/work_orders/.*\.md$", re.IGNORECASE)
_BASELINE_RE = re.compile(r"docs/baselines/.*\.md$", re.IGNORECASE)
_REVIEW_RE = re.compile(r"docs/reviews/.*\.md$", re.IGNORECASE)
_WORKER_MUST_NOT_COMMIT_RE = re.compile(
    r"(?im)^\s*(?:[-*]\s*)?Commit mode:\s*`?WORKER_MUST_NOT_COMMIT`?\s*$"
)
_DISPATCH_STATUS_RE = re.compile(
    r"(?im)^\s*Status:\s*(?:DISPATCH_READY|DISPATCHED|DISPATCHED_TO_WORKER)\s*$"
)
_WORKER_RETURN_RE = re.compile(
    r"\b(?:COMPLETE_PENDING_REVIEW|BLOCKED_WITH_REASON|WORKER_MUST_NOT_COMMIT|worker-return|Worker Return)\b",
    re.IGNORECASE,
)


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _extract_section(text: str, heading_fragment: str) -> str:
    pattern = re.compile(
        rf"^##\s+.*{re.escape(heading_fragment)}.*$([\s\S]*?)(?=^##\s+|\Z)",
        re.MULTILINE | re.IGNORECASE,
    )
    match = pattern.search(text)
    return match.group(1) if match else ""


def _is_no_commit_work_order(path: str, text: str) -> bool:
    return bool(_WORK_ORDER_RE.search(path)) and bool(
        _WORKER_MUST_NOT_COMMIT_RE.search(text)
    )


def _read_changed_text(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


@dataclass(frozen=True)
class WorkOrderDiagnostic:
    path: str
    has_contract: bool
    missing_required: tuple[str, ...]
    missing_conditional: tuple[str, ...]
    missing_na_instruction: bool

    @property
    def is_clean(self) -> bool:
        return (
            self.has_contract
            and not self.missing_required
            and not self.missing_conditional
            and not self.missing_na_instruction
        )


@dataclass(frozen=True)
class CorpusDiagnostic:
    path: str
    applicable: bool
    has_section: bool
    missing_fields: tuple[str, ...]
    missing_terminal_statuses: tuple[str, ...]
    verdict: str | None
    verdict_valid: bool
    missing_reconciliation_markers: tuple[str, ...]
    extra_violations: tuple[str, ...] = ()

    @property
    def is_clean(self) -> bool:
        if not self.applicable:
            return True
        return (
            self.has_section
            and not self.missing_fields
            and not self.missing_terminal_statuses
            and self.verdict_valid
            and not self.missing_reconciliation_markers
            and not self.extra_violations
        )


def diagnose_no_commit_work_order(path: str, text: str) -> WorkOrderDiagnostic:
    """Mirror the dispatch-quality gate's packet-shape contract check."""
    section = _extract_section(text, WORKER_RETURN_PACKET_SHAPE_CONTRACT_MARKER)
    if not section:
        return WorkOrderDiagnostic(
            path=path,
            has_contract=False,
            missing_required=WORKER_RETURN_PACKET_SHAPE_REQUIRED_TERMS,
            missing_conditional=WORKER_RETURN_PACKET_SHAPE_CONDITIONAL_TERMS,
            missing_na_instruction=True,
        )
    missing_required = tuple(
        term for term in WORKER_RETURN_PACKET_SHAPE_REQUIRED_TERMS if term not in section
    )
    missing_conditional = tuple(
        term
        for term in WORKER_RETURN_PACKET_SHAPE_CONDITIONAL_TERMS
        if term not in section
    )
    missing_na = (
        "N/A with reason" not in section
        and "NOT_APPLICABLE_WITH_REASON" not in section
    )
    return WorkOrderDiagnostic(
        path=path,
        has_contract=True,
        missing_required=missing_required,
        missing_conditional=missing_conditional,
        missing_na_instruction=missing_na,
    )


def _is_applicable_corpus_output(path: str, text: str) -> bool:
    """Mirror check_corpus_completeness_report_integrity._is_applicable_output."""
    normalized = path.replace("\\", "/")
    if not normalized.endswith(".md"):
        return False
    if CORPUS_ARCHIVE_MARKER in normalized:
        return False
    if normalized in CORPUS_EXCLUDED_PATHS:
        return False
    if not any(normalized.startswith(prefix) for prefix in CORPUS_APPLICABLE_PREFIXES):
        return False
    if CORPUS_REQUIRED_SECTION in text:
        return True
    lowered = text.lower()
    return any(pattern.search(lowered) for pattern in _CORPUS_COMPLETE_CLAIM_PATTERNS)


def _extract_unresolved_count(section: str) -> int | None:
    match = re.search(r"\bunresolved\s*=\s*(\d+)\b", section, re.I)
    if match:
        return int(match.group(1))
    match = re.search(r"^\s*-\s*Unresolved files:\s*(\d+)\s*$", section, re.I | re.M)
    return int(match.group(1)) if match else None


def _field_value(section: str, label: str) -> str:
    match = re.search(rf"^\s*-\s*{re.escape(label)}\s*(.+?)\s*$", section, re.I | re.M)
    return match.group(1).strip() if match else ""


def _is_none_like(value: str) -> bool:
    return value.strip().lower() in {"none", "n/a", "0", "none.", "n/a."}


def _is_safe_enumeration(value: str) -> bool:
    lowered = value.lower()
    if "rg --files" in lowered:
        return "--hidden" in lowered and "--no-ignore" in lowered
    if any(marker in lowered for marker in ("get-childitem", "filesystem", "structured complete api")):
        return True
    return bool(re.search(r"(?:^|[;&|]\s*)find\s+(?:[/.\-~]|[A-Za-z]:\\)", value, re.I))


def diagnose_corpus_completeness(path: str, text: str) -> CorpusDiagnostic:
    """Early local diagnostic for the Corpus Completeness And Report Integrity block shape."""
    if not _is_applicable_corpus_output(path, text):
        return CorpusDiagnostic(
            path=path,
            applicable=False,
            has_section=False,
            missing_fields=(),
            missing_terminal_statuses=(),
            verdict=None,
            verdict_valid=True,
            missing_reconciliation_markers=(),
            extra_violations=(),
        )
    has_section = CORPUS_REQUIRED_SECTION in text
    if not has_section:
        return CorpusDiagnostic(
            path=path,
            applicable=True,
            has_section=False,
            missing_fields=CORPUS_REQUIRED_SECTION_FIELDS,
            missing_terminal_statuses=CORPUS_ALLOWED_TERMINAL_STATUSES,
            verdict=None,
            verdict_valid=False,
            missing_reconciliation_markers=_CORPUS_RECONCILIATION_MARKERS,
            extra_violations=("corpus_integrity_section_missing",),
        )
    section = _extract_section(text, "Corpus Completeness And Report Integrity")
    verdict_match = re.search(r"^\s*-\s*Corpus verdict:\s*([A-Z_]+)(?:\s+-\s*.+)?\s*$", section, re.M)
    verdict = verdict_match.group(1) if verdict_match else None
    verdict_valid = verdict in CORPUS_ALLOWED_VERDICTS
    if verdict == "NOT_APPLICABLE_WITH_REASON":
        extra_violations: list[str] = []
        if not re.search(r"^\s*-\s*Corpus verdict:\s*NOT_APPLICABLE_WITH_REASON\s+-\s*\S", section, re.M): extra_violations.append("corpus_na_reason_missing")
        if any(pattern.search(text.replace(section, "").lower()) for pattern in _CORPUS_COMPLETE_CLAIM_PATTERNS): extra_violations.append("corpus_na_with_complete_claim")
        return CorpusDiagnostic(path, True, True, (), (), verdict, verdict_valid, (), tuple(extra_violations))
    missing_fields = tuple(f for f in CORPUS_REQUIRED_SECTION_FIELDS if f not in section)
    missing_statuses = tuple(s for s in CORPUS_ALLOWED_TERMINAL_STATUSES if s not in section)
    recon_match = re.search(r"^\s*-\s*Reconciliation:\s*(.+?)\s*$", section, re.I | re.M)
    reconciliation = recon_match.group(1) if recon_match else ""
    missing_recon = tuple(m for m in _CORPUS_RECONCILIATION_MARKERS if m not in reconciliation)
    extra_violations: list[str] = []
    unresolved = _extract_unresolved_count(section)
    if unresolved is None:
        extra_violations.append("unresolved_count_missing")
    elif verdict in {"COMPLETE_VERIFIED", "COMPLETE_WITH_DECLARED_EXCLUSIONS"} and unresolved != 0:
        extra_violations.append("complete_verdict_has_unresolved_files")
    exclusions = _field_value(section, "Declared exclusions:")
    unreadable = _field_value(section, "Unreadable or unsupported files:")
    enumeration = _field_value(section, "Enumeration command:")
    if not _is_safe_enumeration(enumeration):
        extra_violations.append("unsafe_enumeration")
    if verdict == "COMPLETE_VERIFIED":
        if exclusions and not _is_none_like(exclusions):
            extra_violations.append("complete_verified_has_exclusions")
        if unreadable and not _is_none_like(unreadable):
            extra_violations.append("complete_verified_has_unreadable_files")
    if verdict == "COMPLETE_WITH_DECLARED_EXCLUSIONS" and (
        not exclusions or _is_none_like(exclusions)
    ):
        extra_violations.append("declared_exclusions_missing")
    lowered = section.lower()
    if any(token in lowered for token in ("<path", "<timestamp", "<exact", "<hash", "<n>", "todo", "tbd")):
        extra_violations.append("placeholder_residue")
    return CorpusDiagnostic(
        path=path,
        applicable=True,
        has_section=True,
        missing_fields=missing_fields,
        missing_terminal_statuses=missing_statuses,
        verdict=verdict,
        verdict_valid=verdict_valid,
        missing_reconciliation_markers=missing_recon,
        extra_violations=tuple(extra_violations),
    )


def recommend_mode(plan: PathPlan) -> str:
    """Map the changed-path plan to one of the supported steward modes."""
    if plan.handoff_sync_only:
        return "handoff-sync"
    if plan.protected_session_paths and not plan.material_paths:
        return "session-sync"
    if plan.mixed_material_and_session:
        return "split"
    if _has_dispatch_packet(plan.changed_paths):
        return "dispatch"
    if _has_worker_return_packet(plan.changed_paths):
        return "reviewer-return"
    if plan.material_paths:
        return "implementation"
    return "none"


def _has_dispatch_packet(paths: tuple[str, ...]) -> bool:
    for path in paths:
        if not (_WORK_ORDER_RE.search(path) or _BASELINE_RE.search(path)):
            continue
        text = _read_changed_text(path)
        if _DISPATCH_STATUS_RE.search(text):
            return True
    return False


def _has_worker_return_packet(paths: tuple[str, ...]) -> bool:
    for path in paths:
        if not _REVIEW_RE.search(path):
            continue
        text = _read_changed_text(path)
        if _WORKER_RETURN_RE.search(text):
            return True
    return False


def _next_command(mode: str, base: str, head: str) -> str:
    if mode in {"dispatch", "implementation", "closure"}:
        phase = {
            "dispatch": "pre-dispatch",
            "implementation": "pre-implementation",
            "closure": "pre-closure",
        }[mode]
        return (
            "python governance/compat/run_agent_autorun_workflow_gate.py "
            f"--phase {phase} --base {base} --head {head} --reuse-valid-receipt"
        )
    if mode == "reviewer-return":
        return "python governance/compat/run_worker_return_fast_gate.py"
    if mode == "session-sync":
        return (
            "python governance/compat/run_agent_commit_steward_preflight.py "
            f"--mode session-sync --base {base} --head {head}"
        )
    if mode == "handoff-sync":
        return (
            "python governance/compat/run_agent_commit_steward_preflight.py "
            f"--mode handoff-sync --base {base} --head {head}"
        )
    if mode == "split":
        return (
            "Commit material paths first, then run "
            "`python governance/compat/run_agent_commit_steward_preflight.py "
            f"--mode session-sync --base {base} --head {head}` for the session/handoff sync commit."
        )
    return "No changed paths detected; no steward command required."


@dataclass(frozen=True)
class SignalReadoutItem:
    """LSC-T3 advisory signal readout item derived from helper-detectable diagnostics.

    Advisory only. Does not gate closure or authorize autonomous mutation.
    repeatRisk must not be OBSERVED_REPEATED without ledger/de-dup proof (LSC-T4 policy).
    blocking is true only when LSC-T4 blocker conditions are explicitly source-backed.
    """

    source_path: str
    source_surface: str
    severity: str
    repeat_risk: str
    recommended_outcome: str
    next_suggested_action: str
    blocking: bool
    reason: str
    latency_guard_disposition: str = ""


@dataclass(frozen=True)
class ReviewerReadoutItem:
    """AAF-T7A.1 L0 read-only reviewer/closer acceleration advisory item.

    Advisory text only. Per L2A safety level L0 this changes nothing on disk,
    makes no closure decision, and authorizes no mutation. Every item is derived
    from diagnostics build_report already computed for the changed range; no new
    source read or runtime call is performed.
    """

    source_path: str
    conversion_step: str
    suggested_action: str
    accelerator_disposition: str
    reason: str


@dataclass(frozen=True)
class JurisdictionReadoutItem:
    """RSE-T3 L0 read-only jurisdiction-block advisory item.

    Advisory text only. Per L2A safety level L0 this changes nothing on disk,
    makes no closure decision, and adds no defect or exit-nonzero behavior. It
    flags a changed worker-return that carries finding or gate-trap language but
    lacks a `## Worker Return Jurisdiction Block` (RSE-T2 addendum). Derived only
    from changed-file text the helper already read; no new source read or runtime
    call is performed.
    """

    source_path: str
    missing_block: str
    suggested_action: str
    routing_disposition: str
    reason: str


@dataclass
class AssistReport:
    base: str
    head: str
    requested_mode: str
    resolved_mode: str
    changed_paths: tuple[str, ...]
    material_paths: tuple[str, ...]
    protected_session_paths: tuple[str, ...]
    no_commit_work_orders: tuple[WorkOrderDiagnostic, ...]
    next_command: str
    session_sync_hint: str
    corpus_diagnostics: tuple[CorpusDiagnostic, ...] = field(default_factory=tuple)
    defects: list[str] = field(default_factory=list)
    signal_readout: tuple[SignalReadoutItem, ...] = field(default_factory=tuple)
    reviewer_readout: tuple[ReviewerReadoutItem, ...] = field(default_factory=tuple)
    jurisdiction_readout: tuple[JurisdictionReadoutItem, ...] = field(default_factory=tuple)

    def to_dict(self) -> dict:
        return {
            "base": self.base,
            "head": self.head,
            "requestedMode": self.requested_mode,
            "resolvedMode": self.resolved_mode,
            "changedPaths": list(self.changed_paths),
            "materialPaths": list(self.material_paths),
            "protectedSessionPaths": list(self.protected_session_paths),
            "noCommitWorkOrders": [
                {
                    "path": d.path,
                    "hasContract": d.has_contract,
                    "missingRequired": list(d.missing_required),
                    "missingConditional": list(d.missing_conditional),
                    "missingNaInstruction": d.missing_na_instruction,
                    "isClean": d.is_clean,
                }
                for d in self.no_commit_work_orders
            ],
            "nextCommand": self.next_command,
            "sessionSyncHint": self.session_sync_hint,
            "corpusDiagnostics": [
                {
                    "path": cd.path,
                    "applicable": cd.applicable,
                    "hasSection": cd.has_section,
                    "missingFields": list(cd.missing_fields),
                    "missingTerminalStatuses": list(cd.missing_terminal_statuses),
                    "verdict": cd.verdict,
                    "verdictValid": cd.verdict_valid,
                    "missingReconciliationMarkers": list(cd.missing_reconciliation_markers),
                    "extraViolations": list(cd.extra_violations),
                    "isClean": cd.is_clean,
                }
                for cd in self.corpus_diagnostics
            ],
            "defects": list(self.defects),
            "signalReadout": [
                {
                    "sourcePath": item.source_path,
                    "sourceSurface": item.source_surface,
                    "severity": item.severity,
                    "repeatRisk": item.repeat_risk,
                    "recommendedOutcome": item.recommended_outcome,
                    "nextSuggestedAction": item.next_suggested_action,
                    "blocking": item.blocking,
                    "reason": item.reason,
                    "latencyGuardDisposition": item.latency_guard_disposition,
                }
                for item in self.signal_readout
            ],
            "reviewerReadout": [
                {
                    "sourcePath": item.source_path,
                    "conversionStep": item.conversion_step,
                    "suggestedAction": item.suggested_action,
                    "acceleratorDisposition": item.accelerator_disposition,
                    "reason": item.reason,
                }
                for item in self.reviewer_readout
            ],
            "jurisdictionReadout": [
                {
                    "sourcePath": item.source_path,
                    "missingBlock": item.missing_block,
                    "suggestedAction": item.suggested_action,
                    "routingDisposition": item.routing_disposition,
                    "reason": item.reason,
                }
                for item in self.jurisdiction_readout
            ],
        }


# LSC-T3: outcome vocabulary constants used in advisory signal readout items.
_LSC_T4_READOUT_ONLY = "READOUT_ONLY"
_LSC_T4_CHECKER_CANDIDATE = "CHECKER_CANDIDATE"

# LSC-T5/T7: latency guard disposition constants derived from LSC-T4 outcome vocabulary.
_LSC_T5_T7_FAST_PATH = "FAST_PATH"
_LSC_T5_T7_GOVERNED_PROMOTION = "GOVERNED_PROMOTION"
_LSC_T5_T7_BLOCKER_PENDING_EVIDENCE = "BLOCKER_PENDING_EVIDENCE"
_LSC_T5_T7_FAST_OUTCOMES = frozenset({_LSC_T4_READOUT_ONLY, "WATCH_FOR_REPEAT"})
_LSC_T5_T7_BLOCKER_OUTCOMES = frozenset({"CLOSURE_BLOCKER"})


def _derive_latency_guard_disposition(recommended_outcome: str) -> str:
    """LSC-T5/T7: derive latencyGuardDisposition from LSC-T4 recommendedOutcome.

    Advisory only. Does not enforce latency, block closure, or run gates.
    FAST_PATH: routine readout-only signals; no additional gate cost.
    GOVERNED_PROMOTION: proposal candidates route through RT2/RT3/MLW3 pipeline.
    BLOCKER_PENDING_EVIDENCE: source-backed LSC-T4 CLOSURE_BLOCKER only.
    """
    if recommended_outcome in _LSC_T5_T7_FAST_OUTCOMES:
        return _LSC_T5_T7_FAST_PATH
    if recommended_outcome in _LSC_T5_T7_BLOCKER_OUTCOMES:
        return _LSC_T5_T7_BLOCKER_PENDING_EVIDENCE
    return _LSC_T5_T7_GOVERNED_PROMOTION


def _build_signal_readout(
    work_order_diagnostics: list[WorkOrderDiagnostic],
    corpus_diagnostics: list[CorpusDiagnostic],
    retro_diagnostics: list,
) -> tuple[SignalReadoutItem, ...]:
    """Build LSC-T3 advisory signal readout from existing helper diagnostics.

    Advisory only. Does not add defects, block closure, or run gates internally.
    repeatRisk defaults to POSSIBLE; OBSERVED_REPEATED requires ledger/de-dup proof (LSC-T4).
    blocking=True only when LSC-T4 blocker conditions are met; none apply to these surfaces.
    """
    items: list[SignalReadoutItem] = []
    for d in work_order_diagnostics:
        if d.is_clean:
            continue
        if not d.has_contract:
            items.append(SignalReadoutItem(
                source_path=d.path,
                source_surface="work-order",
                severity="medium",
                repeat_risk="POSSIBLE",
                recommended_outcome=_LSC_T4_CHECKER_CANDIDATE,
                next_suggested_action="add Worker Return Packet Shape Contract section before dispatch",
                blocking=False,
                reason="WORKER_MUST_NOT_COMMIT work order is missing packet-shape contract section",
            ))
        else:
            if d.missing_required:
                items.append(SignalReadoutItem(
                    source_path=d.path,
                    source_surface="work-order",
                    severity="medium",
                    repeat_risk="POSSIBLE",
                    recommended_outcome=_LSC_T4_CHECKER_CANDIDATE,
                    next_suggested_action="add missing required packet-shape terms to contract",
                    blocking=False,
                    reason=f"packet-shape contract missing required terms: {', '.join(d.missing_required[:3])}",
                ))
            if d.missing_conditional:
                items.append(SignalReadoutItem(
                    source_path=d.path,
                    source_surface="work-order",
                    severity="low",
                    repeat_risk="POSSIBLE",
                    recommended_outcome=_LSC_T4_READOUT_ONLY,
                    next_suggested_action="add missing conditional terms or N/A-with-reason dispositions",
                    blocking=False,
                    reason=f"packet-shape contract missing conditional terms: {', '.join(d.missing_conditional[:3])}",
                ))
    for cd in corpus_diagnostics:
        if cd.is_clean:
            continue
        if not cd.has_section:
            items.append(SignalReadoutItem(
                source_path=cd.path,
                source_surface="corpus-completeness",
                severity="medium",
                repeat_risk="POSSIBLE",
                recommended_outcome=_LSC_T4_CHECKER_CANDIDATE,
                next_suggested_action="add Corpus Completeness And Report Integrity section before submission",
                blocking=False,
                reason="applicable output file is missing corpus completeness section",
            ))
        else:
            items.append(SignalReadoutItem(
                source_path=cd.path,
                source_surface="corpus-completeness",
                severity="low",
                repeat_risk="POSSIBLE",
                recommended_outcome=_LSC_T4_READOUT_ONLY,
                next_suggested_action="repair corpus completeness section fields or verdict",
                blocking=False,
                reason="corpus completeness section has missing fields, invalid verdict, or local violations",
            ))
    for rd in retro_diagnostics:
        if not (rd.eligible and rd.issues):
            continue
        items.append(SignalReadoutItem(
            source_path=rd.path,
            source_surface="worker-experience",
            severity="low",
            repeat_risk="POSSIBLE",
            recommended_outcome=_LSC_T4_READOUT_ONLY,
            next_suggested_action="add WORKER_EXPERIENCE_RETRO token or WORKER_EXPERIENCE_RETRO_NA_WITH_REASON",
            blocking=False,
            reason="worker-experience retrospective token missing or malformed in worker-return artifact",
        ))
    return tuple(
        replace(item, latency_guard_disposition=_derive_latency_guard_disposition(item.recommended_outcome))
        for item in items
    )


# AAF-T7A.1: L2A acceleration disposition constants for the reviewer readout.
_L2A_ACCELERATOR_CANDIDATE = "ACCELERATOR_CANDIDATE"
_L2A_READOUT_ONLY = "READOUT_ONLY"


def _build_reviewer_readout(
    resolved_mode: str,
    work_order_diagnostics: list[WorkOrderDiagnostic],
    corpus_diagnostics: list[CorpusDiagnostic],
    retro_diagnostics: list,
) -> tuple[ReviewerReadoutItem, ...]:
    """Build the AAF-T7A.1 L0 read-only reviewer/closer acceleration readout.

    Advisory only (L2A safety level L0): assembles the mechanical closure-
    conversion steps a reviewer/closer repeats, derived solely from diagnostics
    build_report already computed. It makes no closure decision, performs no
    filesystem mutation, and is populated only when the changed range resolves
    to the reviewer-return shape.
    """
    if resolved_mode != "reviewer-return":
        return ()

    items: list[ReviewerReadoutItem] = []
    for d in work_order_diagnostics:
        if d.is_clean:
            continue
        items.append(ReviewerReadoutItem(
            source_path=d.path,
            conversion_step="confirm worker-return packet-shape contract before closure conversion",
            suggested_action="repair packet-shape contract terms or N/A-with-reason rows before converting status to closed",
            accelerator_disposition=_L2A_ACCELERATOR_CANDIDATE,
            reason="changed work order has packet-shape contract gaps a reviewer would otherwise hand-check",
        ))
    for cd in corpus_diagnostics:
        if cd.is_clean:
            continue
        items.append(ReviewerReadoutItem(
            source_path=cd.path,
            conversion_step="confirm corpus completeness section before accepting closure evidence",
            suggested_action="repair corpus completeness fields, reconciliation markers, or verdict before closure",
            accelerator_disposition=_L2A_ACCELERATOR_CANDIDATE,
            reason="changed closure artifact has corpus-shape gaps a reviewer would otherwise hand-check",
        ))
    for rd in retro_diagnostics:
        if not (rd.eligible and rd.issues):
            continue
        items.append(ReviewerReadoutItem(
            source_path=rd.path,
            conversion_step="confirm worker-experience retrospective token before closure conversion",
            suggested_action="ensure WORKER_EXPERIENCE_RETRO or WORKER_EXPERIENCE_RETRO_NA_WITH_REASON is present",
            accelerator_disposition=_L2A_READOUT_ONLY,
            reason="worker-return artifact is missing or has a malformed worker-experience retrospective token",
        ))
    return tuple(items)


# RSE-T3: jurisdiction-block diagnostic constants.
# The block heading defined by the RSE-T2 addendum.
_RSE_JURISDICTION_BLOCK_RE = re.compile(
    r"(?im)^##\s+Worker Return Jurisdiction Block\s*$"
)
_RSE_WORKER_RETURN_PATH_RE = re.compile(
    r"(?i)^docs/reviews/.*WORKER_RETURN.*\.md$"
)
# Finding / gate-trap language that, per RSE-T2, should be paired with the block.
_RSE_FINDING_LANGUAGE_RE = re.compile(
    r"(?i)\b(?:gate[- ]?trap|out[- ]?of[- ]?scope promotion|promotion candidate|"
    r"finding[- ]?to[- ]?governance|reusable (?:lesson|finding)|"
    r"jurisdiction (?:block|owner))\b"
)
_RSE_T3_ROUTING_DISPOSITION = "ROUTE_TO_REVIEWER"


def _build_jurisdiction_readout(
    resolved_mode: str,
    worker_return_texts: list[tuple[str, str]],
) -> tuple[JurisdictionReadoutItem, ...]:
    """Build the RSE-T3 L0 read-only jurisdiction-block diagnostic readout.

    Advisory only (L2A safety level L0): flags a changed worker-return that
    carries finding or gate-trap language but lacks a
    `## Worker Return Jurisdiction Block` (RSE-T2 addendum). It makes no closure
    decision, adds no defect, changes no exit code, performs no filesystem
    mutation, and is populated only when the changed range resolves to the
    worker-return (reviewer-return) shape. Each item is derived solely from
    changed-file text the helper already read.
    """
    if resolved_mode != "reviewer-return":
        return ()

    items: list[JurisdictionReadoutItem] = []
    for path, text in worker_return_texts:
        if not _RSE_FINDING_LANGUAGE_RE.search(text):
            continue
        if _RSE_JURISDICTION_BLOCK_RE.search(text):
            continue
        items.append(JurisdictionReadoutItem(
            source_path=path,
            missing_block="## Worker Return Jurisdiction Block",
            suggested_action=(
                "add a Worker Return Jurisdiction Block (RSE-T2) recording capture, "
                "promotion candidate, reviewer action requested, and operator-action flag"
            ),
            routing_disposition=_RSE_T3_ROUTING_DISPOSITION,
            reason=(
                "worker-return carries finding or gate-trap language but no "
                "`## Worker Return Jurisdiction Block`, leaving routing implicit"
            ),
        ))
    return tuple(items)


# ---------------------------------------------------------------------------
# AAF-T7B: L1 reviewer-completion scaffold generation.
#
# L2A safety level L1 (classification standard line 105): the helper writes a
# new skeleton file or section with required structure and empty fields; the
# human fills content and reviews before use. This is the only level above L0
# read-only that AAF-T7B authorizes. It is NOT L2 patch preview and NOT L3
# apply: it never edits an existing file, never stages, never commits, never
# applies a diff, and never makes a closure decision. The single write only
# creates one new markdown file under docs/reviews/ and refuses to overwrite.
# ---------------------------------------------------------------------------

# Directory under which a scaffold file may be created. Any other location is
# refused so the helper cannot write outside the reviews surface.
REVIEWER_COMPLETION_SCAFFOLD_ALLOWED_DIR = "docs/reviews/"

# Required completion-review headings the scaffold emits as empty skeleton
# sections. A reviewer/closer fills every TODO line before the artifact is a
# real completion review; the scaffold itself asserts it is not a closure.
REVIEWER_COMPLETION_SCAFFOLD_SECTIONS = (
    "Status",
    "Target / Source",
    "Purpose",
    "Scope / Methodology",
    "Findings / Position",
    "Risk / Corrective Action",
    "Claim Boundary",
    "Required Artifact Manifest",
    "Public Export Disposition",
    "Agent Operation Trace Block",
    "Acceptance Receipt Assertion Matrix",
    "Machine Closure Package",
)

_SCAFFOLD_TODO = "TODO: reviewer/closer fills this section before completion."
_SCAFFOLD_TABLE_TODO = "TODO: fill before completion"


def _reviewer_completion_scaffold_section_body(section: str) -> list[str]:
    """Return an empty but gate-shaped skeleton body for a scaffold section."""
    if section == "Status":
        return [
            "Status: TODO_CLOSURE_STATUS",
            "",
            _SCAFFOLD_TODO,
        ]
    if section == "Required Artifact Manifest":
        return [
            "| Artifact path | Required? | Final disposition |",
            "|---|---|---|",
            f"| {_SCAFFOLD_TABLE_TODO} | yes/no | {_SCAFFOLD_TABLE_TODO} |",
            "",
            (
                "Path discipline: cite only real changed artifacts as backtick "
                "paths. Describe demonstration paths or glob examples in plain "
                "words unless they are actual artifacts in the closure range."
            ),
        ]
    if section == "Agent Operation Trace Block":
        return [
            "| Field | Evidence |",
            "|---|---|",
            f"| Actor | {_SCAFFOLD_TABLE_TODO} |",
            f"| Provider or surface | {_SCAFFOLD_TABLE_TODO} |",
            f"| Working directory | {_SCAFFOLD_TABLE_TODO} |",
            f"| Command or tool surface | {_SCAFFOLD_TABLE_TODO} |",
            f"| Target paths | {_SCAFFOLD_TABLE_TODO} |",
            f"| Before status evidence | {_SCAFFOLD_TABLE_TODO} |",
            f"| After status evidence | {_SCAFFOLD_TABLE_TODO} |",
            f"| Diff evidence | {_SCAFFOLD_TABLE_TODO} |",
            f"| Claim boundary | {_SCAFFOLD_TABLE_TODO} |",
        ]
    if section == "Acceptance Receipt Assertion Matrix":
        return [
            "| Required value | Observed value | Status |",
            "|---|---|---|",
            f"| {_SCAFFOLD_TABLE_TODO} | {_SCAFFOLD_TABLE_TODO} | TODO_PASS_FAIL_NA |",
            "",
            (
                "Use N/A with reason when the tranche has no receipt/query "
                "acceptance requirement."
            ),
        ]
    if section == "Machine Closure Package":
        return [
            "| Closure item | Required artifact/path | Machine-readable evidence | Final status |",
            "|---|---|---|---|",
            f"| Work order status | {_SCAFFOLD_TABLE_TODO} | Status line | TODO_PASS_FAIL_NA |",
            f"| Completion or reviewer artifact | {_SCAFFOLD_TABLE_TODO} | Status line | TODO_PASS_FAIL_NA |",
            f"| Roadmap state | {_SCAFFOLD_TABLE_TODO} | Status line or N/A with reason | TODO_PASS_FAIL_NA |",
            f"| Registry JSON | {_SCAFFOLD_TABLE_TODO} | generator/drift check or N/A with reason | TODO_PASS_FAIL_NA |",
            f"| Registry Markdown | {_SCAFFOLD_TABLE_TODO} | path/status check or N/A with reason | TODO_PASS_FAIL_NA |",
            f"| External evidence digest | {_SCAFFOLD_TABLE_TODO} | source digest or N/A with reason | TODO_PASS_FAIL_NA |",
            f"| System loop interlock | {_SCAFFOLD_TABLE_TODO} | command output or N/A with reason | TODO_PASS_FAIL_NA |",
            f"| Session continuity | {_SCAFFOLD_TABLE_TODO} | state/front-door/handoff evidence or N/A with reason | TODO_PASS_FAIL_NA |",
        ]
    return [_SCAFFOLD_TODO]


def build_reviewer_completion_scaffold(title: str = "") -> str:
    """Build the AAF-T7B L1 reviewer-completion scaffold text (pure, no I/O).

    Returns a skeleton completion-review markdown body with the required
    governance headings present and empty TODO fields, per L2A safety level L1.
    The scaffold is explicitly not a completed review and makes no closure
    decision; a reviewer/closer fills every TODO line and reviews before use.
    """
    heading = title.strip() or "Reviewer Completion Scaffold"
    lines: list[str] = [
        f"# {heading}",
        "",
        "Memory class: FULL_RECORD",
        "",
        "docType: review",
        "",
        (
            "NOTE: AAF-T7B L1 scaffold. This is an empty skeleton, not a "
            "completed review and not a closure decision. A reviewer/closer "
            "must fill every TODO line and review before use."
        ),
        "",
    ]
    for section in REVIEWER_COMPLETION_SCAFFOLD_SECTIONS:
        lines.append(f"## {section}")
        lines.append("")
        lines.extend(_reviewer_completion_scaffold_section_body(section))
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def _scaffold_path_is_allowed(path: Path) -> bool:
    """True only when path resolves inside the repo's docs/reviews/ directory."""
    allowed_root = (REPO_ROOT / REVIEWER_COMPLETION_SCAFFOLD_ALLOWED_DIR).resolve()
    try:
        resolved = path.resolve()
    except (OSError, RuntimeError):
        return False
    if resolved == allowed_root:
        return False
    return allowed_root in resolved.parents


def write_reviewer_completion_scaffold(target: str, title: str = "") -> Path:
    """Write one new L1 scaffold markdown file under docs/reviews/.

    This is the only filesystem write in this module and is reached only via
    the explicit --write-reviewer-completion-scaffold CLI flag. It refuses any
    path outside docs/reviews/, refuses a non-.md target, and refuses to
    overwrite an existing file. It never edits an existing file, never stages,
    never commits, and never applies a diff.
    """
    candidate = Path(target)
    if not candidate.is_absolute():
        candidate = REPO_ROOT / candidate
    if candidate.suffix.lower() != ".md":
        raise ValueError(
            f"scaffold target must be a .md file under {REVIEWER_COMPLETION_SCAFFOLD_ALLOWED_DIR}: {target}"
        )
    if not _scaffold_path_is_allowed(candidate):
        raise ValueError(
            f"scaffold target must be inside {REVIEWER_COMPLETION_SCAFFOLD_ALLOWED_DIR}: {target}"
        )
    if candidate.exists():
        raise ValueError(f"refusing to overwrite existing file: {target}")
    derived_title = title.strip() or candidate.stem.replace("_", " ")
    # Exclusive create ('x') so a concurrent create also fails instead of
    # clobbering; this never opens an existing file for write/append.
    with open(candidate, "x", encoding="utf-8") as handle:
        handle.write(build_reviewer_completion_scaffold(derived_title))
    return candidate


def build_report(base: str, head: str, requested_mode: str) -> AssistReport:
    if requested_mode not in ALLOWED_MODES:
        raise ValueError(f"unsupported mode: {requested_mode}")

    plan = build_path_plan(base, head)
    resolved = recommend_mode(plan) if requested_mode == "auto" else requested_mode

    diagnostics: list[WorkOrderDiagnostic] = []
    corpus_diagnostics_list: list[CorpusDiagnostic] = []
    retro_diagnostics_list = []
    worker_return_texts: list[tuple[str, str]] = []
    for path in plan.changed_paths:
        text = _read_changed_text(path)
        if _is_no_commit_work_order(path, text):
            diagnostics.append(diagnose_no_commit_work_order(path, text))
        cd = diagnose_corpus_completeness(path, text)
        if cd.applicable:
            corpus_diagnostics_list.append(cd)
        # AAF-T5: reuse the canonical worker-experience checker for an early,
        # read-only diagnostic on self-declared worker-return artifacts.
        rd = worker_experience.diagnose(path, text)
        if rd.eligible:
            retro_diagnostics_list.append(rd)
        # RSE-T3: collect changed worker-return artifacts only. Completion
        # reviews can discuss worker returns and findings, but are not the
        # target artifact class for the jurisdiction-block advisory.
        if _RSE_WORKER_RETURN_PATH_RE.search(path) and _WORKER_RETURN_RE.search(text):
            worker_return_texts.append((path, text))

    command_mode = resolved
    if requested_mode == "auto" and resolved in {"none", "split"}:
        command_mode = resolved
    next_command = _next_command(command_mode, base, head)

    if plan.protected_session_paths and not plan.material_paths:
        session_hint = (
            "Only session/handoff paths changed. Use the session-sync or "
            "handoff-sync steward lane; do not mix with a material commit."
        )
    elif plan.mixed_material_and_session:
        session_hint = (
            "Material and session/handoff paths are mixed. Commit material "
            "first, then session-sync second to keep exact-manifest traces clean."
        )
    else:
        session_hint = "N/A with reason: no session-sync-only condition detected."

    defects: list[str] = []
    for d in diagnostics:
        if not d.has_contract:
            defects.append(
                f"{d.path}: changed WORKER_MUST_NOT_COMMIT work order is missing "
                f"`## {WORKER_RETURN_PACKET_SHAPE_CONTRACT_MARKER}`"
            )
            continue
        for term in d.missing_required:
            defects.append(
                f"{d.path}: packet-shape contract missing required term `{term}`"
            )
        for term in d.missing_conditional:
            defects.append(
                f"{d.path}: packet-shape contract missing conditional term `{term}`"
            )
        if d.missing_na_instruction:
            defects.append(
                f"{d.path}: packet-shape contract missing `N/A with reason` instruction"
            )

    for cd in corpus_diagnostics_list:
        if not cd.is_clean:
            if not cd.has_section:
                defects.append(
                    f"{cd.path}: missing `{CORPUS_REQUIRED_SECTION}`"
                )
            else:
                for f in cd.missing_fields:
                    defects.append(
                        f"{cd.path}: corpus section missing field `{f}`"
                    )
                for s in cd.missing_terminal_statuses:
                    defects.append(
                        f"{cd.path}: corpus section missing terminal status `{s}`"
                    )
                if not cd.verdict_valid:
                    defects.append(
                        f"{cd.path}: corpus section has invalid or missing verdict `{cd.verdict}`"
                    )
                for m in cd.missing_reconciliation_markers:
                    defects.append(
                        f"{cd.path}: corpus section reconciliation missing `{m}`"
                    )
                for violation in cd.extra_violations:
                    defects.append(
                        f"{cd.path}: corpus section local gate violation `{violation}`"
                    )

    for rd in retro_diagnostics_list:
        for issue in rd.issues:
            defects.append(f"{rd.path}: worker-experience retro {issue}")

    signal_readout_items = _build_signal_readout(diagnostics, corpus_diagnostics_list, retro_diagnostics_list)
    reviewer_readout_items = _build_reviewer_readout(
        resolved, diagnostics, corpus_diagnostics_list, retro_diagnostics_list
    )
    jurisdiction_readout_items = _build_jurisdiction_readout(
        resolved, worker_return_texts
    )
    return AssistReport(
        base=base,
        head=head,
        requested_mode=requested_mode,
        resolved_mode=resolved,
        changed_paths=plan.changed_paths,
        material_paths=plan.material_paths,
        protected_session_paths=plan.protected_session_paths,
        no_commit_work_orders=tuple(diagnostics),
        next_command=next_command,
        session_sync_hint=session_hint,
        corpus_diagnostics=tuple(corpus_diagnostics_list),
        defects=defects,
        signal_readout=signal_readout_items,
        reviewer_readout=reviewer_readout_items,
        jurisdiction_readout=jurisdiction_readout_items,
    )


def _print_human(report: AssistReport) -> None:
    print("=== CVF Agent Automation Assist ===")
    print(f"Range: {report.base}..{report.head}")
    print(f"Requested mode: {report.requested_mode}")
    print(f"Resolved steward lane: {report.resolved_mode}")
    print(f"\nChanged paths: {len(report.changed_paths)}")
    for path in report.changed_paths:
        print(f"  - {path}")
    print(f"Material paths: {len(report.material_paths)}")
    print(f"Protected session/handoff paths: {len(report.protected_session_paths)}")
    print(f"\nSession-sync hint: {report.session_sync_hint}")

    if report.no_commit_work_orders:
        print(f"\nNo-commit work orders inspected: {len(report.no_commit_work_orders)}")
        for d in report.no_commit_work_orders:
            status = "CLEAN" if d.is_clean else "NEEDS PACKET-SHAPE REPAIR"
            print(f"  - {d.path}: {status}")
    else:
        print("\nNo changed WORKER_MUST_NOT_COMMIT work orders detected.")

    print(f"\nExact next command:\n  {report.next_command}")

    if report.corpus_diagnostics:
        print(f"\nEarly corpus diagnostics: {len(report.corpus_diagnostics)} applicable changed file(s)")
        for cd in report.corpus_diagnostics:
            status = "CLEAN" if cd.is_clean else "CORPUS-SHAPE DEFECT"
            print(f"  - {cd.path}: {status}")
            if not cd.is_clean:
                if not cd.has_section:
                    print(f"    ! missing `{CORPUS_REQUIRED_SECTION}`")
                else:
                    for f in cd.missing_fields:
                        print(f"    ! missing field: {f}")
                    if not cd.verdict_valid:
                        print(f"    ! invalid verdict: {cd.verdict!r}")
                    for violation in cd.extra_violations:
                        print(f"    ! local gate violation: {violation}")
    else:
        print("\nNo applicable changed Markdown for early corpus diagnostics.")

    if report.defects:
        print(f"\nLocal helper-detectable defects: {len(report.defects)}")
        for defect in report.defects:
            print(f"  ! {defect}")
    else:
        print("\nNo local helper-detectable defects.")

    if report.signal_readout:
        print(f"\nLearning Signal Readout (LSC-T3): {len(report.signal_readout)} advisory signal(s)")
        for item in report.signal_readout:
            blocker_tag = " [BLOCKER]" if item.blocking else ""
            print(f"  [{item.severity.upper()}]{blocker_tag} {item.source_path} ({item.source_surface})")
            print(f"    outcome: {item.recommended_outcome} [{item.latency_guard_disposition}]")
            print(f"    next: {item.next_suggested_action}")
    else:
        print("\nLearning Signal Readout (LSC-T3): no helper-detectable signals for current changed set.")

    if report.resolved_mode == "reviewer-return":
        if report.reviewer_readout:
            print(
                f"\nReviewer/Closer Acceleration Readout (AAF-T7A.1, L0 read-only): "
                f"{len(report.reviewer_readout)} advisory item(s)"
            )
            for item in report.reviewer_readout:
                print(f"  [{item.accelerator_disposition}] {item.source_path}")
                print(f"    step: {item.conversion_step}")
                print(f"    next: {item.suggested_action}")
        else:
            print(
                "\nReviewer/Closer Acceleration Readout (AAF-T7A.1, L0 read-only): "
                "no helper-detectable conversion gaps; reviewer authors closure normally."
            )

    if report.resolved_mode == "reviewer-return":
        if report.jurisdiction_readout:
            print(
                f"\nJurisdiction Block Readout (RSE-T3, L0 read-only): "
                f"{len(report.jurisdiction_readout)} advisory item(s)"
            )
            for item in report.jurisdiction_readout:
                print(f"  [{item.routing_disposition}] {item.source_path}")
                print(f"    missing: {item.missing_block}")
                print(f"    next: {item.suggested_action}")
        else:
            print(
                "\nJurisdiction Block Readout (RSE-T3, L0 read-only): "
                "no worker-return with finding or gate-trap language is missing the block."
            )


def main(argv: list[str] | None = None) -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(
        description="CVF read-only agent automation assist helper."
    )
    parser.add_argument("--base", default="HEAD", help="Base ref for the changed range.")
    parser.add_argument("--head", default="HEAD", help="Head ref for the changed range.")
    parser.add_argument(
        "--mode",
        default="auto",
        choices=ALLOWED_MODES,
        help="Steward lane to recommend. 'auto' infers from changed paths.",
    )
    parser.add_argument("--json", action="store_true", help="Emit a JSON report.")
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit non-zero on local helper-detectable defects.",
    )
    parser.add_argument(
        "--emit-reviewer-completion-scaffold",
        action="store_true",
        help=(
            "Print an L1 reviewer-completion scaffold skeleton to stdout without "
            "writing any file (AAF-T7B, L2A safety level L1)."
        ),
    )
    parser.add_argument(
        "--write-reviewer-completion-scaffold",
        metavar="PATH",
        default=None,
        help=(
            "Write one new L1 reviewer-completion scaffold .md file under "
            "docs/reviews/. Refuses overwrite and refuses paths outside "
            "docs/reviews/ (AAF-T7B, L2A safety level L1)."
        ),
    )
    parser.add_argument(
        "--scaffold-title",
        default="",
        help="Optional heading for the generated reviewer-completion scaffold.",
    )
    args = parser.parse_args(argv)

    # AAF-T7B L1 scaffold modes short-circuit the read-only report. They are the
    # only paths that may emit or write a scaffold and only run when their
    # explicit flag is passed.
    if args.emit_reviewer_completion_scaffold:
        print(build_reviewer_completion_scaffold(args.scaffold_title), end="")
        return 0
    if args.write_reviewer_completion_scaffold is not None:
        try:
            written = write_reviewer_completion_scaffold(
                args.write_reviewer_completion_scaffold, args.scaffold_title
            )
        except ValueError as exc:
            print(f"VIOLATION: {exc}", file=sys.stderr)
            return 2
        print(f"Wrote reviewer-completion scaffold: {written}")
        return 0
    try:
        report = build_report(args.base, args.head, args.mode)
    except ValueError as exc:
        print(f"VIOLATION: {exc}", file=sys.stderr)
        return 2
    except RuntimeError as exc:
        print(f"VIOLATION: unable to inspect changed set: {exc}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(report.to_dict(), indent=2))
    else:
        _print_human(report)

    if args.enforce and report.defects:
        if not args.json:
            print(
                f"\nVIOLATION: {len(report.defects)} local helper-detectable defect(s)."
            )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
