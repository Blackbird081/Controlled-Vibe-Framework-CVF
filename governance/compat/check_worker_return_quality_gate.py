#!/usr/bin/env python3
"""CVF worker-return quality gate.

Checks changed no-commit worker-return artifacts for the minimum machine shape
needed before reviewer acceptance. The gate is intentionally structural: it
does not judge whether the implementation is correct, only whether the return
packet is filled enough to avoid late reviewer repair loops.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = (
    "docs/reference/work_order_authoring/"
    "CVF_WORKER_RETURN_QUALITY_GATE_STANDARD.md"
)

ELIGIBLE_PREFIX = "docs/reviews/"
EXCLUDED_PATH_MARKERS = (
    "_COMPLETION_",
    "_CODEX_REBUTTAL_",
    "_CLAUDE_REBUTTAL_RESPONSE_",
    "_CODEX_CLASSIFICATION_",
    "_FOR_CODEX_",
)
STATUS_MARKERS = ("Status: COMPLETE_PENDING_REVIEW", "Status: BLOCKED_WITH_REASON")
SELF_DECLARE_MARKER = "Self-declared worker-return artifact: yes"
RESPONDS_MARKER = "Responds to work order:"
DISPATCH_WORK_ORDER_MARKER = "dispatchWorkOrder:"
PLACEHOLDER_MARKERS = ("FILL_ME", "WORKER_MUST_CAPTURE_AT_START")

FAST_DOC_PROFILE = "WORKER_RETURN_FAST_DOC_V1"
FAST_DOC_SCOPE = "DOCUMENTATION_AND_EVIDENCE_ONLY_NO_COMMIT"
FAST_DOC_HEADING = "## Conditional Controls Disposition"
FAST_DOC_DISPOSITION = "conditionalControlsDisposition: EKI_NA; RIH_NA; CCRI_NA"
FAST_DOC_DISPATCH_TERMS = (
    f"contractProfile: {FAST_DOC_PROFILE}",
    f"scopeClassification: {FAST_DOC_SCOPE}",
    "Commit mode: WORKER_MUST_NOT_COMMIT",
    "publicSyncDisposition: FORBIDDEN",
    "liveRuntimeDisposition: FORBIDDEN",
    "checkerMutationDisposition: FORBIDDEN",
    "workerSelfSelection: FORBIDDEN",
)

REQUIRED_HEADINGS = (
    "## Purpose",
    "## Scope / Methodology",
    "## Findings / Position",
    "## Risk / Corrective Action",
    "## Checker Source Read-Ahead Block",
    "## Agent Operation Trace Block",
    "## Delta Execution Claim Boundary Control Block",
    "## Public Export Disposition",
    "## External Knowledge Intake Routing",
    "## Rescan Intelligence Hardening",
    "## Corpus Completeness And Report Integrity",
    "## Finding-To-Governance Learning Disposition",
    "## Epistemic Process Block",
    "## Claim Boundary",
    "## git status --short",
    "## Changed Files",
    "## Command Evidence",
    "## No-Commit Statement",
)
FAST_DOC_REQUIRED_HEADINGS = tuple(
    heading
    for heading in REQUIRED_HEADINGS
    if heading
    not in {
        "## External Knowledge Intake Routing",
        "## Rescan Intelligence Hardening",
        "## Corpus Completeness And Report Integrity",
    }
) + (FAST_DOC_HEADING,)

READ_AHEAD_FIELDS = (
    "applicableCheckersRead",
    "literalTokensReviewed",
    "gateRunPurpose",
    "claimBoundary",
)
AOT_FIELDS = (
    "Actor",
    "Provider or surface",
    "Session or invocation",
    "Working directory",
    "Command or tool surface",
    "Target paths",
    "Allowed scope source",
    "Before status evidence",
    "After status evidence",
    "Diff evidence",
    "Approval boundary",
    "Claim boundary",
    "Agent type",
    "Invocation ID",
    "Expected manifest",
    "Actual changed set",
    "Manifest delta",
    "Deletion or rename disposition",
)
DELTA_FIELDS = (
    "claimScope",
    "claimDisposition",
    "receiptEvidence",
    "actionEvidence",
    "invocationBoundary",
    "interceptionBoundary",
    "claimLanguage",
    "forbiddenExpansion",
)
PUBLIC_EXPORT_TOKENS = (
    "DEFERRED_PRIVATE_ONLY",
    "EXPORTED",
    "BLOCKED_MISSING_PUBLIC_ARTIFACTS",
)
EXTERNAL_INPUT_CANONICAL = (
    "operator-provided external comparison, critique, or recommendation"
)
DELTA_RECEIPT_TOKENS = ("CLAIM_REJECTED_NO_RECEIPT", "CVF_RECEIPT_PRESENT")
DELTA_ACTION_TOKENS = ("CLAIM_REJECTED_NO_ACTION", "ACTION_EVIDENCE_PRESENT")

NEXT_HEADING_RE = re.compile(r"^##\s+.+$", re.MULTILINE)


@dataclass(frozen=True)
class Diagnostic:
    path: str
    eligible: bool
    issues: tuple[str, ...] = field(default_factory=tuple)

    @property
    def is_clean(self) -> bool:
        return self.eligible and not self.issues


def _configure_stdout() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _normalize(path: str) -> str:
    return path.replace("\\", "/").strip()


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _parse_name_status(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw in output.splitlines():
        parts = raw.split("\t")
        if len(parts) < 2:
            continue
        status = parts[0].strip()
        path = parts[2] if status.startswith(("R", "C")) and len(parts) > 2 else parts[1]
        path = _normalize(path)
        if path:
            changed.setdefault(path, set()).add(status)
    return changed


def _merge_changed(target: dict[str, set[str]], source: dict[str, set[str]]) -> None:
    for path, statuses in source.items():
        target.setdefault(path, set()).update(statuses)


def get_changed_paths(base: str | None, head: str | None) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    if base and head and base != head:
        code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
        if code != 0:
            raise RuntimeError(err or out or f"git diff failed for {base}..{head}")
        _merge_changed(changed, _parse_name_status(out))

    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            _merge_changed(changed, _parse_name_status(out))

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw in out.splitlines():
            path = _normalize(raw)
            if path:
                changed.setdefault(path, set()).add("A")

    return changed


def _read(path: str) -> str:
    full = REPO_ROOT / path
    if not full.is_file():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def is_eligible_worker_return(path: str, text: str) -> bool:
    normalized = _normalize(path)
    if not normalized.startswith(ELIGIBLE_PREFIX) or not normalized.endswith(".md"):
        return False
    if "/archive/" in normalized:
        return False
    if any(marker in normalized for marker in EXCLUDED_PATH_MARKERS):
        return False
    if SELF_DECLARE_MARKER in text:
        return True
    has_status = any(marker in text for marker in STATUS_MARKERS)
    has_work_order = RESPONDS_MARKER in text or DISPATCH_WORK_ORDER_MARKER in text
    return has_status and has_work_order


def _section(text: str, heading: str) -> str:
    start = text.find(heading)
    if start == -1:
        return ""
    match = NEXT_HEADING_RE.search(text, start + len(heading))
    end = match.start() if match else len(text)
    return text[start:end]


def _has_all(section: str, labels: tuple[str, ...]) -> list[str]:
    return [label for label in labels if label not in section]


def _fast_doc_dispatch_issues(text: str) -> list[str]:
    match = re.search(r"(?m)^dispatchWorkOrder:\s*`([^`]+)`\s*$", text)
    if not match:
        return ["fast-doc return lacks a readable `dispatchWorkOrder` path"]
    work_order_path = _normalize(match.group(1))
    if not work_order_path.startswith("docs/work_orders/"):
        return ["fast-doc dispatch path must be under `docs/work_orders/`"]
    work_order = _read(work_order_path)
    if not work_order:
        return [f"fast-doc dispatch work order is missing: `{work_order_path}`"]
    return [
        f"fast-doc dispatch work order lacks `{term}`"
        for term in FAST_DOC_DISPATCH_TERMS
        if term not in work_order
    ]


def diagnose(path: str, text: str) -> Diagnostic:
    if not is_eligible_worker_return(path, text):
        return Diagnostic(path=path, eligible=False)

    issues: list[str] = []

    for marker in PLACEHOLDER_MARKERS:
        if marker in text:
            issues.append(f"unresolved placeholder `{marker}` remains")

    fast_doc = f"contractProfile: {FAST_DOC_PROFILE}" in text
    required_headings = FAST_DOC_REQUIRED_HEADINGS if fast_doc else REQUIRED_HEADINGS
    for heading in required_headings:
        if heading not in text:
            issues.append(f"missing required heading `{heading}`")

    if fast_doc:
        issues.extend(_fast_doc_dispatch_issues(text))
        compact = _section(text, FAST_DOC_HEADING)
        if FAST_DOC_DISPOSITION not in compact:
            issues.append(
                "fast-doc conditional controls block lacks the canonical compact disposition"
            )

    if SELF_DECLARE_MARKER not in text:
        issues.append(f"missing `{SELF_DECLARE_MARKER}`")
    if RESPONDS_MARKER not in text:
        issues.append(f"missing `{RESPONDS_MARKER}`")
    if DISPATCH_WORK_ORDER_MARKER not in text:
        issues.append(f"missing `{DISPATCH_WORK_ORDER_MARKER}`")

    read_ahead = _section(text, "## Checker Source Read-Ahead Block")
    for label in _has_all(read_ahead, READ_AHEAD_FIELDS):
        issues.append(f"checker read-ahead block missing `{label}`")
    if read_ahead and "governance/compat/check_" not in read_ahead:
        issues.append("checker read-ahead does not name any `governance/compat/check_*.py` source")
    if read_ahead and "first discovery" in read_ahead.casefold():
        issues.append("checker read-ahead gateRunPurpose still says first discovery")

    aot = _section(text, "## Agent Operation Trace Block")
    for label in _has_all(aot, AOT_FIELDS):
        issues.append(f"agent operation trace block missing `{label}`")
    if aot and "git diff --name-status" not in aot:
        issues.append("agent operation trace lacks `git diff --name-status` diff evidence")

    delta = _section(text, "## Delta Execution Claim Boundary Control Block")
    for label in _has_all(delta, DELTA_FIELDS):
        issues.append(f"Delta block missing `{label}`")
    if delta and not any(token in delta for token in DELTA_RECEIPT_TOKENS):
        issues.append("Delta block lacks receipt evidence token")
    if delta and not any(token in delta for token in DELTA_ACTION_TOKENS):
        issues.append("Delta block lacks action evidence token")

    if not fast_doc:
        external = _section(text, "## External Knowledge Intake Routing")
        if external and EXTERNAL_INPUT_CANONICAL not in external:
            issues.append("external knowledge input type is not canonical")

    public_export = _section(text, "## Public Export Disposition")
    if public_export and not any(token in public_export for token in PUBLIC_EXPORT_TOKENS):
        issues.append("public export disposition lacks an allowed token")

    command_evidence = _section(text, "## Command Evidence")
    if command_evidence and not re.search(r"\b(PASS|FAIL|BLOCKED|N/A with reason)\b", command_evidence):
        issues.append("command evidence lacks PASS/FAIL/BLOCKED/N/A disposition")

    if "WORKER_MUST_NOT_COMMIT honored" not in text and "BLOCKED_WITH_REASON" not in text:
        issues.append("no-commit statement must say `WORKER_MUST_NOT_COMMIT honored`")

    return Diagnostic(path=path, eligible=True, issues=tuple(issues))


def run(base: str | None, head: str | None) -> list[Diagnostic]:
    diagnostics: list[Diagnostic] = []
    changed = get_changed_paths(base, head)
    for path, statuses in sorted(changed.items()):
        if not any(status.startswith(("A", "M", "R")) for status in statuses):
            continue
        text = _read(path)
        d = diagnose(path, text)
        if d.eligible:
            diagnostics.append(d)
    return diagnostics


def main(argv: list[str] | None = None) -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(description="CVF worker-return quality gate.")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)

    print("=== CVF Worker Return Quality Gate ===")
    print(f"Standard: {STANDARD_PATH}")
    if args.base:
        print(f"Range: {args.base}..{args.head}")

    try:
        diagnostics = run(args.base, args.head)
    except Exception as exc:  # noqa: BLE001
        print(f"FAIL: {exc}")
        return 2 if args.enforce else 0

    violations = [d for d in diagnostics if not d.is_clean]
    print(f"Eligible worker-return artifacts checked: {len(diagnostics)}")
    print(f"Violations: {len(violations)}")

    if violations:
        for d in violations:
            for issue in d.issues:
                print(f"  - {d.path}: {issue}")
        print("VIOLATION - worker-return packet is not review-ready.")
        return 1 if args.enforce else 0

    print("COMPLIANT - worker-return packets are review-ready.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
