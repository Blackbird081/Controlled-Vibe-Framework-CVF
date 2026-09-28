#!/usr/bin/env python3
"""Validate the dispatcher-owned acceptance ledger and worker evidence join."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
LEDGER_SCHEMA = "cvf.workOrderAcceptanceLedger@1.0.0"
EVIDENCE_SCHEMA = "cvf.workOrderAcceptanceEvidence@1.0.0"
LEDGER_RE = re.compile(r"```acceptance-ledger-json\s*(\{.*?\})\s*```", re.S)
EVIDENCE_RE = re.compile(r"```acceptance-evidence-json\s*(\{.*?\})\s*```", re.S)
STATUS_RE = re.compile(r"(?m)^Status:\s*(COMPLETE_PENDING_REVIEW|BLOCKED_WITH_REASON)\s*$")


def _path(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.replace("\\", "/").strip()
    pure = PurePosixPath(normalized)
    if not normalized or pure.is_absolute() or ".." in pure.parts:
        return None
    return normalized


def _json_block(text: str, pattern: re.Pattern[str], label: str) -> tuple[dict[str, Any] | None, list[str]]:
    matches = pattern.findall(text)
    if len(matches) != 1:
        return None, [f"{label} must occur exactly once; found {len(matches)}"]
    try:
        value = json.loads(matches[0])
    except json.JSONDecodeError as exc:
        return None, [f"{label} is invalid JSON: {exc.msg}"]
    return (value, []) if isinstance(value, dict) else (None, [f"{label} must be a JSON object"])


def _classifier_event_issues(text: str) -> list[str]:
    if "## Tool / Classifier Block Event" not in text:
        return []
    issues: list[str] = []
    values: dict[str, int] = {}
    for field in (
        "toolClassifierBlockEventCount",
        "platformForcedOperatorPromptCount",
        "workerAuthoredOperatorQuestionCount",
        "recoveryAttemptCount",
    ):
        found = re.findall(rf"(?m)^{field}:\s*(\S+)\s*$", text)
        if len(found) != 1 or not found[0].isdigit():
            issues.append(f"{field} must occur once as a nonnegative integer")
            continue
        values[field] = int(found[0])
    events = values.get("toolClassifierBlockEventCount")
    if events is not None:
        for field in ("platformForcedOperatorPromptCount", "workerAuthoredOperatorQuestionCount"):
            if values.get(field, 0) > events:
                issues.append(f"{field} cannot exceed toolClassifierBlockEventCount")
    disposition = re.findall(r"(?m)^recoveryDisposition:\s*(\S+)\s*$", text)
    evidence = re.findall(r"(?m)^eventEvidence:\s*(.+?)\s*$", text)
    if len(disposition) != 1 or len(evidence) != 1:
        return issues + ["classifier event requires one recoveryDisposition and eventEvidence"]
    if events == 0:
        if disposition[0] != "NO_EVENT" or any(values.get(field, 0) != 0 for field in values):
            issues.append("NO_EVENT requires every classifier/recovery count to be zero")
        if not evidence[0].startswith("NOT_APPLICABLE_WITH_REASON - "):
            issues.append("NO_EVENT requires reasoned non-event evidence")
    elif events is not None:
        if disposition[0] == "NO_EVENT":
            issues.append("nonzero classifier event count cannot use NO_EVENT")
        if evidence[0].startswith("NOT_APPLICABLE_WITH_REASON"):
            issues.append("nonzero classifier event requires bounded event evidence")
    return issues



def validate_work_order(text: str) -> tuple[dict[str, Any] | None, list[str]]:
    ledger, issues = _json_block(text, LEDGER_RE, "acceptance-ledger-json")
    if ledger is None:
        return None, issues
    if ledger.get("schemaVersion") != LEDGER_SCHEMA:
        issues.append(f"ledger schemaVersion must be {LEDGER_SCHEMA}")
    requirements = ledger.get("requirements")
    proofs = ledger.get("proofCatalog")
    if not isinstance(requirements, list) or not requirements:
        issues.append("ledger requirements must be a nonempty array")
        requirements = []
    if not isinstance(proofs, list) or not proofs:
        issues.append("ledger proofCatalog must be a nonempty array")
        proofs = []
    proof_ids: set[str] = set()
    for row in proofs:
        if not isinstance(row, dict) or set(row) != {"proofId", "kind", "locator"}:
            issues.append("each proofCatalog row must contain exactly proofId, kind, locator")
            continue
        pid = row.get("proofId")
        if not isinstance(pid, str) or not pid or pid in proof_ids:
            issues.append(f"proofId must be unique and nonempty: {pid!r}")
        else:
            proof_ids.add(pid)
        if not isinstance(row.get("kind"), str) or not isinstance(row.get("locator"), str) or not row["locator"]:
            issues.append(f"proof {pid!r} requires nonempty kind and locator")
    requirement_ids: set[str] = set()
    for row in requirements:
        if not isinstance(row, dict) or set(row) != {"requirementId", "mandatory", "expectedArtifacts", "requiredProofIds"}:
            issues.append("each requirement row must contain exactly requirementId, mandatory, expectedArtifacts, requiredProofIds")
            continue
        rid = row.get("requirementId")
        if not isinstance(rid, str) or not rid or rid in requirement_ids:
            issues.append(f"requirementId must be unique and nonempty: {rid!r}")
        else:
            requirement_ids.add(rid)
        if type(row.get("mandatory")) is not bool:
            issues.append(f"requirement {rid!r} mandatory must be boolean")
        artifacts = row.get("expectedArtifacts")
        if not isinstance(artifacts, list) or not artifacts:
            issues.append(f"requirement {rid!r} expectedArtifacts must be nonempty")
        else:
            normalized = [_path(item) for item in artifacts]
            if any(item is None for item in normalized) or len(set(normalized)) != len(normalized):
                issues.append(f"requirement {rid!r} has invalid or duplicate expectedArtifacts")
        required = row.get("requiredProofIds")
        if not isinstance(required, list) or not required or any(pid not in proof_ids for pid in required):
            issues.append(f"requirement {rid!r} has missing or unknown requiredProofIds")
    return ledger, issues


def validate_return(work_order_text: str, return_text: str, observed_paths: set[str] | None = None) -> list[str]:
    ledger, issues = validate_work_order(work_order_text)
    evidence, evidence_issues = _json_block(return_text, EVIDENCE_RE, "acceptance-evidence-json")
    issues.extend(evidence_issues)
    if ledger is None or evidence is None:
        return issues
    if evidence.get("schemaVersion") != EVIDENCE_SCHEMA:
        issues.append(f"evidence schemaVersion must be {EVIDENCE_SCHEMA}")
    base = evidence.get("executionBaseHead")
    if not isinstance(base, str) or not re.fullmatch(r"[0-9a-f]{7,40}", base):
        issues.append("executionBaseHead must be a 7-40 character lowercase Git SHA")
    results = evidence.get("results")
    if not isinstance(results, list):
        return issues + ["evidence results must be an array"]
    expected = {row["requirementId"]: row for row in ledger["requirements"] if isinstance(row, dict) and isinstance(row.get("requirementId"), str)}
    returned: dict[str, dict[str, Any]] = {}
    for row in results:
        if not isinstance(row, dict) or set(row) != {"requirementId", "actualArtifacts", "proofRefs", "status"}:
            issues.append("each evidence row must contain exactly requirementId, actualArtifacts, proofRefs, status")
            continue
        rid = row.get("requirementId")
        if rid not in expected or rid in returned:
            issues.append(f"unknown or duplicate evidence requirementId: {rid!r}")
            continue
        returned[rid] = row
        actual = row.get("actualArtifacts")
        proof_refs = row.get("proofRefs")
        status = row.get("status")
        if status not in {"PASS", "BLOCKED"}:
            issues.append(f"requirement {rid} has invalid status {status!r}")
        actual_set = {_path(item) for item in actual} if isinstance(actual, list) else {None}
        if None in actual_set:
            issues.append(f"requirement {rid} has invalid actualArtifacts")
            actual_set.discard(None)
        expected_set = set(expected[rid]["expectedArtifacts"])
        if status == "PASS" and actual_set != expected_set:
            issues.append(f"requirement {rid} PASS artifacts do not equal dispatcher-owned expectedArtifacts")
        required_proofs = set(expected[rid]["requiredProofIds"])
        if not isinstance(proof_refs, list) or not required_proofs.issubset(set(proof_refs)):
            issues.append(f"requirement {rid} does not bind every required proof ID")
        if observed_paths is not None:
            missing = actual_set - observed_paths
            if missing:
                issues.append(f"requirement {rid} claims artifact(s) not observed by Git: {', '.join(sorted(missing))}")
    missing_rows = set(expected) - set(returned)
    if missing_rows:
        issues.append("missing evidence row(s): " + ", ".join(sorted(missing_rows)))
    if observed_paths is not None:
        claimed_paths = {
            normalized
            for row in returned.values()
            for item in row.get("actualArtifacts", [])
            if (normalized := _path(item)) is not None
        }
        unclaimed = observed_paths - claimed_paths
        if unclaimed:
            issues.append("Git observed unclaimed artifact(s): " + ", ".join(sorted(unclaimed)))
    all_mandatory_pass = all(
        rid in returned and returned[rid].get("status") == "PASS"
        for rid, requirement in expected.items() if requirement.get("mandatory") is True
    )
    match = STATUS_RE.search(return_text)
    status = match.group(1) if match else "MISSING"
    reduced = "COMPLETE_PENDING_REVIEW" if all_mandatory_pass else "BLOCKED_WITH_REASON"
    if status != reduced:
        issues.append(f"terminal status {status} contradicts deterministic reducer {reduced}")
    return issues


def git_observed_paths(base: str) -> set[str]:
    commands = [
        ["git", "diff", "--name-only", base],
        ["git", "ls-files", "--others", "--exclude-standard"],
    ]
    paths: set[str] = set()
    for command in commands:
        proc = subprocess.run(command, cwd=ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or "Git observation failed")
        paths.update(line.strip().replace("\\", "/") for line in proc.stdout.splitlines() if line.strip())
    return paths


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--work-order", required=True)
    parser.add_argument("--return", dest="return_path")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()
    work_order_text = (ROOT / args.work_order).read_text(encoding="utf-8")
    ledger, issues = validate_work_order(work_order_text)
    if args.return_path:
        return_text = (ROOT / args.return_path).read_text(encoding="utf-8")
        evidence, parse_issues = _json_block(return_text, EVIDENCE_RE, "acceptance-evidence-json")
        base = evidence.get("executionBaseHead") if evidence else None
        observed = git_observed_paths(base) if isinstance(base, str) and re.fullmatch(r"[0-9a-f]{7,40}", base) else set()
        issues = validate_return(work_order_text, return_text, observed)
    print("=== CVF Work Order Acceptance Ledger Gate ===")
    for issue in issues:
        print(f"- {issue}")
    if issues:
        print("VIOLATION")
        return 1
    print("COMPLIANT")
    return 0


if __name__ == "__main__":
    sys.exit(main())
