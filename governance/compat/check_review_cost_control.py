#!/usr/bin/env python3
"""
CVF Review Cost And Diminishing Return Control Checker (SOT3-RCS-T1).

Enforces the forward-only evidence-shape contract defined by
docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md
on every changed docs/reviews/*.md artifact declaring
`docType: completion_review`; that artifact must also carry the exact
standalone declaration `Review-Cost Telemetry: REQUIRED`.

This checker is intentionally narrow. It validates field presence, value
shape, controlled tokens, the round-three escalation rule, and the multi-commit
exception reason.
It never scores semantic review quality, root-cause independence, or value
delta; those remain reviewer judgment. Applicability is artifact-shape based,
not bare-substring based. Standards, work orders, tests, worker returns,
archived reviews, and unchanged historical reviews do not trigger the gate.
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
THIS_CHECKER_PATH = "governance/compat/check_review_cost_control.py"

ELIGIBLE_PREFIX = "docs/reviews/"
DECLARATION_LINE_RE = re.compile(r"(?m)^Review-Cost Telemetry:\s*REQUIRED\s*$")
COMPLETION_REVIEW_RE = re.compile(r"(?mi)^docType:\s*completion_review\s*$")

REQUIRED_INTEGER_FIELDS = (
    "reviewRoundCount",
    "workerRepairTurnCount",
    "newRootCauseCountThisRound",
    "dependentFindingCountThisRound",
    "providerCallCount",
    "materialCommitCount",
    "continuityCommitCount",
)
UNAVAILABLE_ALLOWED_FIELDS = (
    "elapsedReviewMinutes",
    "tokenOrQuotaUsage",
)
NARRATIVE_FIELD = "valueDelta"
STOP_FIELD = "stopDisposition"
AUDIT_FIELD = "preRepairAuditDisposition"
COMMIT_PLAN_FIELD = "commitPlanDisposition"
LATENCY_FIELD = "latencyDisposition"
DELAY_FIELD = "avoidableDelayClass"

ALL_FIELDS = REQUIRED_INTEGER_FIELDS + UNAVAILABLE_ALLOWED_FIELDS + (
    NARRATIVE_FIELD,
    STOP_FIELD,
    AUDIT_FIELD,
    COMMIT_PLAN_FIELD,
    LATENCY_FIELD,
    DELAY_FIELD,
)

ALLOWED_STOP_TOKENS = (
    "CONTINUE_NEW_CRITICAL_EVIDENCE",
    "CONSOLIDATE_SINGLE_REPAIR",
    "PARK_LOW_INCREMENTAL_VALUE",
    "COMPLETE_REVIEW",
    "REVIEW_COST_ESCALATION_REQUIRED",
)
ROUND_THREE_ALLOWED_TOKENS = (
    "REVIEW_COST_ESCALATION_REQUIRED",
    "CONTINUE_NEW_CRITICAL_EVIDENCE",
)
UNAVAILABLE_PREFIX = "NOT_AVAILABLE_WITH_REASON"

ALLOWED_AUDIT_TOKENS = (
    "COMPLETE_BEFORE_FIRST_REPAIR",
    "NO_REPAIR_REQUIRED",
    "BLOCKED_REVIEW_MATRIX_INCOMPLETE",
)
ALLOWED_COMMIT_PLAN_TOKENS = (
    "DEFAULT_ONE_MATERIAL_ONE_CONTINUITY",
    "MATERIAL_ONLY",
    "NO_COMMIT_REVIEW",
    "CONTINUITY_ONLY",
)
COMMIT_EXCEPTION_PREFIX = "EXCEPTION_WITH_REASON"
ALLOWED_LATENCY_TOKENS = (
    "WITHIN_FAST_PATH_TARGET",
    "EXPECTED_LONG_RUNNING_PROOF",
    "EXTERNAL_WAIT",
)
LATENCY_REASON_PREFIXES = (
    "NOT_MEASURED_WITH_REASON",
    "LATENCY_BUDGET_EXCEEDED_WITH_REASON",
)
ALLOWED_DELAY_TOKENS = (
    "NONE",
    "SEQUENTIAL_FINDING_CASCADE",
    "PREMATURE_COMMIT",
    "RANGE_RECOMPUTATION",
    "GATE_DISCOVERY_LOOP",
    "WORKTREE_CHURN",
    "MULTIPLE_AVOIDABLE_DELAYS",
)

FIELD_VALUE_RE_TEMPLATE = r"(?m)^[ \t]*(?:[-*][ \t]+)?`?{field}`?:[ \t]*(.+)$"


@dataclass(frozen=True)
class Diagnostic:
    path: str
    applicable: bool
    issues: tuple[str, ...] = field(default_factory=tuple)

    @property
    def is_clean(self) -> bool:
        return not self.applicable or not self.issues


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


def _changed_md_paths(base: str, head: str) -> tuple[str, ...]:
    paths: set[str] = set()
    if base and head:
        code, out, _ = _run_git(["diff", "--name-only", f"{base}..{head}"])
        if code == 0 and out:
            paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    code, out, _ = _run_git(["diff", "--name-only"])
    if code == 0 and out:
        paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    code, out, _ = _run_git(["diff", "--name-only", "--cached"])
    if code == 0 and out:
        paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        paths.update(_normalize(p) for p in out.splitlines() if p.strip())
    return tuple(sorted(p for p in paths if p.endswith(".md")))


def _read(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def _strip_code_fences(text: str) -> str:
    return re.sub(r"```.*?```", "", text, flags=re.S)


def _has_real_declaration(text: str) -> bool:
    """A real declaration is an exact standalone line outside a code fence
    and not wrapped in backticks. A backtick-wrapped mention (as used in
    standards/work orders to cite the token) never counts."""
    stripped = _strip_code_fences(text)
    for line in stripped.splitlines():
        if DECLARATION_LINE_RE.match(line.strip()) and "`" not in line:
            return True
    return False


def is_applicable(path: str, text: str) -> bool:
    normalized = _normalize(path)
    if not normalized.startswith(ELIGIBLE_PREFIX) or not normalized.endswith(".md"):
        return False
    if "/archive/" in normalized:
        return False
    if normalized == THIS_CHECKER_PATH:
        return False
    return bool(COMPLETION_REVIEW_RE.search(_strip_code_fences(text)))


def _field_value(text: str, field_name: str) -> str | None:
    pattern = re.compile(FIELD_VALUE_RE_TEMPLATE.format(field=re.escape(field_name)))
    match = pattern.search(text)
    if not match:
        return None
    return match.group(1).strip().rstrip("|").strip(" `")


def _is_non_negative_integer(value: str) -> bool:
    return bool(re.fullmatch(r"\d+", value))


def _has_reason(value: str, prefix: str) -> bool:
    return bool(re.fullmatch(rf"{re.escape(prefix)}:\s*\S.*", value))


def diagnose(path: str, text: str) -> Diagnostic:
    if not is_applicable(path, text):
        return Diagnostic(path=path, applicable=False)

    issues: list[str] = []
    if not _has_real_declaration(text):
        issues.append("missing exact standalone declaration `Review-Cost Telemetry: REQUIRED`")
    values: dict[str, str] = {}
    for field_name in ALL_FIELDS:
        value = _field_value(text, field_name)
        if value is None or value == "":
            issues.append(f"missing required field `{field_name}`")
            continue
        values[field_name] = value

    for field_name in REQUIRED_INTEGER_FIELDS:
        value = values.get(field_name)
        if value is not None and not _is_non_negative_integer(value):
            issues.append(
                f"field `{field_name}` must be a non-negative integer, got `{value}`"
            )

    for field_name in UNAVAILABLE_ALLOWED_FIELDS:
        value = values.get(field_name)
        if value is not None and not _is_non_negative_integer(value):
            if not re.fullmatch(rf"{UNAVAILABLE_PREFIX}:\s*\S.*", value):
                issues.append(
                    f"field `{field_name}` must be a non-negative integer or "
                    f"`{UNAVAILABLE_PREFIX}` followed by a reason, got `{value}`"
                )

    narrative_value = values.get(NARRATIVE_FIELD)
    if narrative_value is not None:
        if _is_non_negative_integer(narrative_value):
            issues.append(
                f"field `{NARRATIVE_FIELD}` must be a non-empty reviewer statement, "
                "not a bare number"
            )

    stop_value = values.get(STOP_FIELD)
    review_round_value = values.get("reviewRoundCount")
    if stop_value is not None:
        if stop_value not in ALLOWED_STOP_TOKENS:
            issues.append(
                f"field `{STOP_FIELD}` must be one of {ALLOWED_STOP_TOKENS}, got `{stop_value}`"
            )
        elif (
            review_round_value is not None
            and _is_non_negative_integer(review_round_value)
            and int(review_round_value) >= 3
            and stop_value not in ROUND_THREE_ALLOWED_TOKENS
        ):
            issues.append(
                f"reviewRoundCount >= 3 requires `{STOP_FIELD}` to be one of "
                f"{ROUND_THREE_ALLOWED_TOKENS}, got `{stop_value}`"
            )

    audit_value = values.get(AUDIT_FIELD)
    if audit_value is not None and audit_value not in ALLOWED_AUDIT_TOKENS:
        issues.append(
            f"field `{AUDIT_FIELD}` must be one of {ALLOWED_AUDIT_TOKENS}, got `{audit_value}`"
        )

    commit_plan_value = values.get(COMMIT_PLAN_FIELD)
    commit_plan_valid = commit_plan_value in ALLOWED_COMMIT_PLAN_TOKENS
    if commit_plan_value is not None and not commit_plan_valid:
        commit_plan_valid = _has_reason(commit_plan_value, COMMIT_EXCEPTION_PREFIX)
        if not commit_plan_valid:
            issues.append(
                f"field `{COMMIT_PLAN_FIELD}` must be one of {ALLOWED_COMMIT_PLAN_TOKENS} "
                f"or `{COMMIT_EXCEPTION_PREFIX}` followed by a reason, got `{commit_plan_value}`"
            )

    latency_value = values.get(LATENCY_FIELD)
    if latency_value is not None and latency_value not in ALLOWED_LATENCY_TOKENS:
        if not any(_has_reason(latency_value, prefix) for prefix in LATENCY_REASON_PREFIXES):
            issues.append(
                f"field `{LATENCY_FIELD}` must be one of {ALLOWED_LATENCY_TOKENS} or a "
                f"reason-bearing token from {LATENCY_REASON_PREFIXES}, got `{latency_value}`"
            )

    delay_value = values.get(DELAY_FIELD)
    if delay_value is not None and delay_value not in ALLOWED_DELAY_TOKENS:
        issues.append(
            f"field `{DELAY_FIELD}` must be one of {ALLOWED_DELAY_TOKENS}, got `{delay_value}`"
        )

    material_count = values.get("materialCommitCount")
    continuity_count = values.get("continuityCommitCount")
    excessive_commits = any(
        value is not None and _is_non_negative_integer(value) and int(value) > 1
        for value in (material_count, continuity_count)
    )
    if excessive_commits and (
        commit_plan_value is None
        or not _has_reason(commit_plan_value, COMMIT_EXCEPTION_PREFIX)
    ):
        issues.append(
            "materialCommitCount or continuityCommitCount > 1 requires "
            f"`{COMMIT_PLAN_FIELD}` to use `{COMMIT_EXCEPTION_PREFIX}: <reason>`"
        )

    return Diagnostic(path=path, applicable=True, issues=tuple(issues))


def run(base: str, head: str) -> list[Diagnostic]:
    results: list[Diagnostic] = []
    for path in _changed_md_paths(base, head):
        diagnostic = diagnose(path, _read(path))
        if diagnostic.applicable:
            results.append(diagnostic)
    return results


def main(argv: list[str] | None = None) -> int:
    _configure_stdout()
    parser = argparse.ArgumentParser(
        description="CVF review-cost and diminishing-return evidence-shape checker."
    )
    parser.add_argument("--base", default="HEAD")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)

    print("=== CVF Review Cost And Diminishing Return Control Gate ===")
    diagnostics = run(args.base, args.head)
    violations = [d for d in diagnostics if not d.is_clean]

    print(f"Applicable completion reviews checked: {len(diagnostics)}")
    if not violations:
        print("PASS: all applicable completion reviews carry valid review-cost telemetry.")
        return 0

    print(f"Violations: {len(violations)}")
    for diagnostic in violations:
        for issue in diagnostic.issues:
            print(f"  - {diagnostic.path}: {issue}")
    print(
        "VIOLATION - repair the review-cost telemetry section per "
        "docs/reference/review_cost_control/CVF_REVIEW_COST_AND_DIMINISHING_RETURN_CONTROL_STANDARD.md."
    )
    return 1 if args.enforce else 0


if __name__ == "__main__":
    raise SystemExit(main())
