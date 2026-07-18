#!/usr/bin/env python3
"""
CVF Agent Operation Trace and Workspace Integrity Gate.

This guard keeps CVF focused on control-plane evidence: it requires changed
agent execution artifacts to leave a repo-local operation trace, and it flags
protected-path deletions or renames unless the changed packet records explicit
deletion/rename disposition evidence.

It does not claim OS-level user attribution, endpoint monitoring, or physical
machine identity.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = "docs/reference/CVF_AGENT_OPERATION_TRACE_AND_WORKSPACE_INTEGRITY_STANDARD_2026-06-13.md"
TRACE_MARKER = "## Agent Operation Trace Block"
DELETE_RENAME_LABEL = "Deletion or rename disposition"

TRACE_REQUIRED_LABELS = (
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
)

TRACE_ARTIFACT_PREFIXES = (
    "docs/work_orders/",
    "docs/reviews/",
)

# Worker-trigger vocabulary used to determine if a docs/reference/ file
# must carry a trace block (narrow eligibility; not every reference file).
REFERENCE_WORKER_TRIGGERS = (
    "WORKER_RETURN",
    "WORKER_MUST_NOT_COMMIT",
    "WORKER_MAY_COMMIT",
    "WORKER_RETURN_SUBMITTED_UNCOMMITTED",
    "COMPLETE_PENDING_REVIEW",
    "Worker:",
    "completion_review",
    "Owner / reviewer",
    "Machine Closure Package",
    "Closure Diff Gate",
)

TRACE_REVIEW_TRIGGERS = (
    "WORKER_RETURN",
    "WORKER_MUST_NOT_COMMIT",
    "WORKER_MAY_COMMIT",
    "completion_review",
    "Owner / reviewer",
    "Worker:",
    "Machine Closure Package",
    "Closure Diff Gate",
)

FUTURE_EXECUTION_SECTION_HINTS = (
    "Write Ownership",
    "Expected Deliverables",
    "Required Artifact Manifest",
    "Required Proof Manifest",
    "Work-Order Fulfillment Manifest",
)

PROTECTED_REPO_PREFIXES = (
    ".github/",
    "AGENTS.md",
    "CVF_SESSION/",
    "CVF_SESSION_MEMORY.md",
    "docs/baselines/",
    "docs/reference/",
    "docs/reviews/",
    "docs/roadmaps/",
    "docs/work_orders/",
    "governance/compat/",
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


def is_trace_artifact(path: str, text: str) -> bool:
    normalized = _normalize(path)
    if "/archive/" in normalized or not normalized.endswith(".md"):
        return False
    if normalized.startswith("docs/work_orders/"):
        return True
    if normalized.startswith("docs/reviews/"):
        return any(trigger in text for trigger in TRACE_REVIEW_TRIGGERS)
    # Narrow eligibility for worker-authored docs/reference/ deliverables:
    # only require trace when worker/execution trigger vocabulary is present.
    if normalized.startswith("docs/reference/"):
        # Canonical template files (name contains _TEMPLATE_) list worker-instruction
        # vocabulary as part of their template body; they are not worker-authored
        # deliverables and must not self-trigger.
        filename = normalized.rsplit("/", 1)[-1]
        if "_TEMPLATE_" in filename.upper():
            return False
        # Only count triggers that appear as standalone values (not inside backtick
        # inline code or bullet enumeration lines that merely list the trigger names).
        import re
        for trigger in REFERENCE_WORKER_TRIGGERS:
            for line in text.splitlines():
                stripped = line.strip()
                # Skip lines that are purely listing/enumerating trigger names
                # (e.g. "- `WORKER_RETURN`, `WORKER_MUST_NOT_COMMIT`" or similar)
                if stripped.startswith(("-", "*")) and stripped.count("`") >= 2:
                    continue
                # Skip lines whose only non-whitespace content is a backtick-wrapped token
                if re.fullmatch(r"`[^`]+`[,;.\s]*", stripped):
                    continue
                if trigger in line:
                    return True
        return False
    return False


def missing_trace_labels(text: str) -> list[str]:
    trace_block = _extract_trace_block(text)
    if not trace_block:
        return list(TRACE_REQUIRED_LABELS)
    lower_text = trace_block.lower()
    return [label for label in TRACE_REQUIRED_LABELS if label.lower() not in lower_text]


def _extract_trace_block(text: str) -> str:
    """Return the Agent Operation Trace Block body, excluding later sections."""
    if TRACE_MARKER not in text:
        return ""
    after_marker = text.split(TRACE_MARKER, 1)[1]
    lines: list[str] = []
    for line in after_marker.splitlines():
        if line.startswith("## ") and lines:
            break
        lines.append(line)
    return "\n".join(lines)


def _extract_section_by_hint(text: str, heading_hint: str) -> str:
    """Return the markdown section whose heading contains heading_hint."""
    lines = text.splitlines()
    start: int | None = None
    target = heading_hint.lower()
    for idx, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("## ") and target in stripped.lower():
            start = idx + 1
            break
    if start is None:
        return ""
    body: list[str] = []
    for line in lines[start:]:
        if line.startswith("## "):
            break
        body.append(line)
    return "\n".join(body)


def _extract_trace_field(text: str, label: str) -> str:
    """Return the cell value for a given trace table label, or empty string."""
    trace_block = _extract_trace_block(text)
    if not trace_block:
        return ""
    lower_label = label.lower()
    for line in trace_block.splitlines():
        if "|" not in line:
            continue
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if len(parts) >= 2 and parts[0].lower() == lower_label:
            return parts[1].strip()
    return ""


def _is_dispatch_work_order(path: str, text: str) -> bool:
    normalized = _normalize(path)
    if not normalized.startswith("docs/work_orders/"):
        return False
    status_tokens = (
        "Status: DISPATCH_READY",
        "Status: DISPATCHED",
        "Status: READY_FOR_REVIEW",
        "Status: APPROVED_FOR_EXECUTION",
    )
    if not any(token in text for token in status_tokens):
        return False
    closure_tokens = (
        "Status: CLOSED",
        "Status: CLOSED_PASS",
        "Status: CLOSED_PASS_BOUNDED",
    )
    return not any(token in text for token in closure_tokens)


def _parse_path_list(value: str) -> set[str]:
    """Parse a semicolon/comma/newline separated list of repo paths from a trace field value.

    Only tokens that look like repo-local file paths (containing '/' and an
    extension, ending with a known repo prefix, or naming a root-level file with
    an extension) are included. Free-text descriptions are ignored.
    """
    if not value:
        return set()
    import re
    raw = value.replace("`", "")
    tokens = re.split(r"[;,\n|]+", raw)
    result: set[str] = set()
    for tok in tokens:
        tok = tok.strip()
        tok = re.sub(r"^[-*]\s+", "", tok).strip()
        # A valid repo path must look like a file path or known directory path.
        # Root-level governed files such as AGENT_HANDOFF_*.md are valid paths.
        if tok and re.search(r"(?:^|/)[A-Za-z0-9_.-]+\.\w{1,8}$|^\.[A-Za-z0-9_.-]+$|/$", tok):
            result.add(_normalize(tok))
    return result


def _future_execution_paths(text: str) -> set[str]:
    future_paths: set[str] = set()
    for heading in FUTURE_EXECUTION_SECTION_HINTS:
        section = _extract_section_by_hint(text, heading)
        future_paths.update(_parse_path_list(section))
    return future_paths


_NA_PATTERN = None


def _is_na_with_reason(value: str) -> bool:
    import re
    return bool(re.match(r"n/a\s+with\s+reason", value.lower().strip()))


def _check_manifest_delta(
    path: str,
    text: str,
    changed: dict[str, set[str]],
) -> list[str]:
    """Validate the Expected manifest vs Actual changed set and Manifest delta field."""
    violations: list[str] = []

    expected_raw = _extract_trace_field(text, "Expected manifest")
    actual_raw = _extract_trace_field(text, "Actual changed set")
    delta_raw = _extract_trace_field(text, "Manifest delta")

    # If all manifest fields are N/A with reason, skip comparison
    if _is_na_with_reason(expected_raw) and _is_na_with_reason(actual_raw) and _is_na_with_reason(delta_raw):
        return []

    expected_paths = _parse_path_list(expected_raw)
    actual_paths = _parse_path_list(actual_raw)

    # If we cannot parse any paths from the expected manifest, skip delta check
    if not expected_paths:
        return []

    if _is_dispatch_work_order(path, text):
        future_manifest_paths = expected_paths & _future_execution_paths(text)
        if future_manifest_paths:
            violations.append(
                f"{path}: DISPATCH_SCOPE_VIOLATION - dispatch Expected manifest "
                "lists future execution path(s): "
                + ", ".join(sorted(future_manifest_paths))
            )

    # Compare expected vs observed changed set (only A/M/R additions count).
    # A trace artifact may or may not be part of the expected deliverables:
    # include it only when the manifest explicitly names it.
    trace_path_normalized = _normalize(path)
    observed_paths = {
        p for p, statuses in changed.items()
        if any(s.startswith(("A", "M", "R")) for s in statuses)
    }
    if trace_path_normalized not in expected_paths:
        observed_paths.discard(trace_path_normalized)

    if not actual_paths:
        violations.append(f"{path}: Actual changed set has no parsed repo-local paths")
    elif actual_paths != observed_paths:
        missing_actual = observed_paths - actual_paths
        extra_actual = actual_paths - observed_paths
        if missing_actual:
            violations.append(
                f"{path}: Actual changed set omits observed changed path(s): "
                + ", ".join(sorted(missing_actual))
            )
        if extra_actual:
            violations.append(
                f"{path}: Actual changed set lists unobserved path(s): "
                + ", ".join(sorted(extra_actual))
            )

    missing = expected_paths - observed_paths
    unexpected = observed_paths - expected_paths

    if not missing and not unexpected:
        # Delta should be MATCH
        if delta_raw and "MATCH" not in delta_raw.upper() and not _is_na_with_reason(delta_raw):
            violations.append(
                f"{path}: Manifest delta says '{delta_raw}' but expected/actual paths match"
            )
    else:
        if missing:
            for mp in sorted(missing):
                violations.append(
                    f"{path}: MISSING_DELIVERABLE - expected '{mp}' in manifest but not found in changed set"
                )
        if unexpected:
            for up in sorted(unexpected):
                violations.append(
                    f"{path}: UNAUTHORIZED_ADDITION - '{up}' in actual changed set but not in expected manifest"
                )

    return violations


def _is_protected_path(path: str) -> bool:
    normalized = _normalize(path)
    return any(
        normalized == prefix.rstrip("/") or normalized.startswith(prefix)
        for prefix in PROTECTED_REPO_PREFIXES
    )


def protected_delete_or_rename_paths(changed: dict[str, set[str]]) -> list[str]:
    flagged: list[str] = []
    for path, statuses in sorted(changed.items()):
        if not _is_protected_path(path):
            continue
        if any(status.startswith(("D", "R")) for status in statuses):
            flagged.append(path)
    return flagged


def find_trace_violations(
    changed: dict[str, set[str]],
    file_texts: dict[str, str],
) -> list[str]:
    violations: list[str] = []
    changed_trace_blocks: list[str] = []
    complete_trace_artifacts: list[str] = []

    for path, statuses in sorted(changed.items()):
        if not any(status.startswith(("A", "M", "R")) for status in statuses):
            continue
        text = file_texts.get(path, "")
        if TRACE_MARKER in text:
            changed_trace_blocks.append(path)
        if not is_trace_artifact(path, text):
            continue
        missing = missing_trace_labels(text)
        if missing:
            violations.append(
                f"{path}: missing or incomplete {TRACE_MARKER}; missing labels: "
                + ", ".join(missing)
            )
        else:
            complete_trace_artifacts.append(path)

    # Run manifest delta on the best available complete trace artifact.
    # Prefer docs/reviews/ (worker-return packets own the deliverable manifest);
    # fall back to docs/work_orders/ only if no review artifact is present.
    manifest_candidate: str | None = None
    for path in complete_trace_artifacts:
        normalized = _normalize(path)
        if normalized.startswith("docs/reviews/"):
            manifest_candidate = path
            break
    if manifest_candidate is None and complete_trace_artifacts:
        manifest_candidate = complete_trace_artifacts[0]
    if manifest_candidate is not None:
        text = file_texts.get(manifest_candidate, "")
        violations.extend(_check_manifest_delta(manifest_candidate, text, changed))

    protected_changes = protected_delete_or_rename_paths(changed)
    if protected_changes:
        has_delete_disposition = any(
            DELETE_RENAME_LABEL.lower() in file_texts.get(path, "").lower()
            for path in changed_trace_blocks
        )
        if not has_delete_disposition:
            violations.append(
                "protected delete/rename detected without Agent Operation Trace "
                f"`{DELETE_RENAME_LABEL}` evidence: " + ", ".join(protected_changes)
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
        description="Check changed agent execution artifacts leave an operation trace"
    )
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    print("=== CVF Agent Operation Trace And Workspace Integrity Gate ===")
    print(f"Standard: {STANDARD_PATH}")
    if args.base:
        print(f"Range: {args.base}..{args.head}")

    try:
        changed = get_changed_paths(args.base, args.head)
        texts = _read_changed_texts(changed)
        violations = find_trace_violations(changed, texts)
    except Exception as exc:  # noqa: BLE001 - CLI guard should print safe failure
        print(f"FAIL: {exc}")
        return 2 if args.enforce else 0

    trace_artifacts = [
        path
        for path, text in texts.items()
        if is_trace_artifact(path, text)
        and any(status.startswith(("A", "M", "R")) for status in changed.get(path, set()))
    ]
    protected_changes = protected_delete_or_rename_paths(changed)

    print(f"Changed paths observed: {len(changed)}")
    print(f"Trace artifacts checked: {len(trace_artifacts)}")
    print(f"Protected delete/rename paths observed: {len(protected_changes)}")
    print(f"Violations: {len(violations)}")

    if violations:
        print("\nViolations:")
        for violation in violations:
            print(f"  - {violation}")
        print(
            "\nAction: add a complete Agent Operation Trace Block or restore/justify "
            "the protected delete/rename in the trace disposition."
        )
        return 1 if args.enforce else 0

    print("\nCOMPLIANT - agent operation trace and repo-local workspace integrity evidence are aligned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
