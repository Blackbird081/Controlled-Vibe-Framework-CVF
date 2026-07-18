#!/usr/bin/env python3
"""
CVF Epistemic Process Packet Gate (FPC-T3-C01)

Checks that evidence-heavy worker-return and completion packets include
structural evidence blocks for expected result, actual evidence comparison,
contradiction/gap disposition, and claim update.

Structural-only check: does NOT evaluate semantic truth or reasoning quality.
EPISTEMIC_PROCESS_NA_WITH_REASON with an explicit reason is the allowed escape
for mechanical or evidence-light packets.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = (
    "docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md"
)

# Vocabulary that signals an evidence-heavy packet requiring epistemic checks.
EVIDENCE_HEAVY_TRIGGERS = (
    "WORKER_RETURN_SUBMITTED_UNCOMMITTED",
    "WORKER_RETURN",
    "COMPLETE_PENDING_REVIEW",
    "CLOSED_PASS_BOUNDED",
    "Completion review",
    "completion_review",
    "Finding-To-Governance",
    "finding-to-governance",
    "Findings / Position",
    "Claim boundary",
    "Claim Update",
    "Evidence Comparison",
    "Contradiction",
    "Source Verification",
)

# These tokens in the document signal that the epistemic block is NOT required.
NA_SIGNAL = "EPISTEMIC_PROCESS_NA_WITH_REASON"

# Heading/section markers that satisfy the structural evidence requirements.
EXPECTED_RESULT_MARKERS = (
    "Expected Result",
    "Expected result",
    "Expected Result / Prediction",
    "## Expected Result",
    "## Prediction",
    "| Expected Result",
    "| Expected result",
    "Epistemic Process Block",
)

EVIDENCE_COMPARISON_MARKERS = (
    "Evidence Comparison",
    "evidence comparison",
    "## Evidence Comparison",
    "| Evidence Comparison",
    "Actual Evidence",
    "actual evidence",
    "Actual Finding",
    "actual finding",
)

CONTRADICTION_MARKERS = (
    "Contradiction",
    "contradiction",
    "Gap Disposition",
    "gap disposition",
    "## Contradiction",
    "| Contradiction",
    "Divergence",
)

CLAIM_UPDATE_MARKERS = (
    "Claim Update",
    "claim update",
    "## Claim Update",
    "| Claim Update",
    "Claim confirmed",
    "Claim revised",
    "Claim narrowed",
    "Claim invalidated",
    "Claim Boundary",
)

# Paths that never require epistemic checks (dispatch/baseline docs)
EXCLUDED_PREFIXES = (
    "docs/baselines/",
    "docs/roadmaps/",
    "docs/work_orders/",
)

# Target file prefixes that may be triggered
ELIGIBLE_PREFIXES = (
    "docs/reviews/",
    "docs/reference/",
)


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
        if status.startswith(("R", "C")) and len(parts) > 2:
            old_path = _normalize(parts[1])
            new_path = _normalize(parts[2])
            changed.setdefault(old_path, set()).add(status)
            changed.setdefault(new_path, set()).add(status)
        else:
            path = _normalize(parts[1])
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


def is_evidence_heavy_packet(path: str, text: str) -> bool:
    """Return True when the file is an evidence-heavy governed packet."""
    normalized = _normalize(path)
    if not normalized.endswith(".md"):
        return False
    if "/archive/" in normalized:
        return False
    if any(normalized.startswith(ex) for ex in EXCLUDED_PREFIXES):
        return False
    if not any(normalized.startswith(el) for el in ELIGIBLE_PREFIXES):
        return False
    return any(trigger in text for trigger in EVIDENCE_HEAVY_TRIGGERS)


def _has_na_with_reason(text: str) -> bool:
    """Return True when the NA escape appears in the intended epistemic field."""
    import re
    patterns = (
        r"(?im)^Epistemic Process Applicability\s*:\s*"
        r"EPISTEMIC_PROCESS_NA_WITH_REASON\s*:\s*(\S.*)$",
        r"(?im)^EPISTEMIC_PROCESS_NA_WITH_REASON\s*:\s*(\S.*)$",
    )
    return any(re.search(pattern, text) for pattern in patterns)


def _has_na_without_reason(text: str) -> bool:
    """Return True when an attempted NA escape is in the right field but empty."""
    import re
    patterns = (
        r"(?im)^Epistemic Process Applicability\s*:\s*"
        r"EPISTEMIC_PROCESS_NA_WITH_REASON\s*:?\s*$",
        r"(?im)^EPISTEMIC_PROCESS_NA_WITH_REASON\s*:?\s*$",
    )
    return any(re.search(pattern, text) for pattern in patterns)


def _section_present(text: str, markers: tuple[str, ...]) -> bool:
    return any(marker in text for marker in markers)


def find_epistemic_violations(
    changed: dict[str, set[str]],
    file_texts: dict[str, str],
) -> list[str]:
    violations: list[str] = []

    for path, statuses in sorted(changed.items()):
        if not any(status.startswith(("A", "M", "R")) for status in statuses):
            continue
        text = file_texts.get(path, "")
        if not is_evidence_heavy_packet(path, text):
            continue

        # NA escape: allowed with explicit reason, violation without reason
        if _has_na_with_reason(text) or _has_na_without_reason(text):
            if _has_na_without_reason(text):
                violations.append(
                    f"{path}: EPISTEMIC_PROCESS_NA_WITH_REASON present but "
                    "no reason was given in the Epistemic Process Applicability field "
                    "(must follow the token with ': <reason>')"
                )
            # With valid NA escape, skip remaining checks
            continue

        # Check structural sections
        missing: list[str] = []
        if not _section_present(text, EXPECTED_RESULT_MARKERS):
            missing.append("Expected Result / Prediction")
        if not _section_present(text, EVIDENCE_COMPARISON_MARKERS):
            missing.append("Evidence Comparison")
        if not _section_present(text, CONTRADICTION_MARKERS):
            missing.append("Contradiction Or Gap Disposition")
        if not _section_present(text, CLAIM_UPDATE_MARKERS):
            missing.append("Claim Update")

        if missing:
            violations.append(
                f"{path}: evidence-heavy packet missing epistemic process "
                "sections: " + ", ".join(missing)
            )

    return violations


def _read_changed_texts(changed: dict[str, set[str]]) -> dict[str, str]:
    texts: dict[str, str] = {}
    for path in changed:
        full_path = REPO_ROOT / path
        if not full_path.is_file():
            texts[path] = ""
            continue
        try:
            texts[path] = full_path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            texts[path] = ""
    return texts


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check evidence-heavy packets include epistemic process structure"
    )
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    print("=== CVF Epistemic Process Packet Gate (FPC-T3-C01) ===")
    print(f"Standard: {STANDARD_PATH}")
    if args.base:
        print(f"Range: {args.base}..{args.head}")

    try:
        changed = get_changed_paths(args.base, args.head)
        texts = _read_changed_texts(changed)
        violations = find_epistemic_violations(changed, texts)
    except Exception as exc:  # noqa: BLE001
        print(f"FAIL: {exc}")
        return 2 if args.enforce else 0

    triggered = [
        path
        for path, text in texts.items()
        if is_evidence_heavy_packet(path, text)
        and any(status.startswith(("A", "M", "R")) for status in changed.get(path, set()))
    ]

    print(f"Changed paths observed: {len(changed)}")
    print(f"Evidence-heavy packets checked: {len(triggered)}")
    print(f"Violations: {len(violations)}")

    if violations:
        print("\nViolations:")
        for violation in violations:
            print(f"  - {violation}")
        print(
            "\nAction: add Epistemic Process Block with Expected Result, "
            "Evidence Comparison, Contradiction Or Gap Disposition, and Claim "
            "Update sections; or use EPISTEMIC_PROCESS_NA_WITH_REASON: <reason>."
        )
        return 1 if args.enforce else 0

    print("\nCOMPLIANT - epistemic process packet evidence structure is aligned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
