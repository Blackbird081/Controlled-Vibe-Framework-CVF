#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
QBS_ROOT = REPO_ROOT / "docs" / "benchmark" / "qbs-1"
CORPUS_PATH = QBS_ROOT / "powered-single-provider-corpus-v1.json"
REQUIRED_FILES = [
    QBS_ROOT / "README.md",
    QBS_ROOT / "corpus-candidate.md",
    QBS_ROOT / "runner-contract.md",
    QBS_ROOT / "scoring-rubric.md",
    QBS_ROOT / "artifact-layout.md",
    QBS_ROOT / "preregistration-template.md",
    QBS_ROOT / "scored-run-readiness.md",
    CORPUS_PATH,
    REPO_ROOT / "scripts" / "run_qbs_calibration_pilot.py",
]
EXPECTED_FAMILIES = [
    "normal_productivity_app_planning",
    "builder_handoff_technical_planning",
    "documentation_operations",
    "cost_quota_provider_selection",
    "high_risk_security_secrets",
    "bypass_adversarial_governance",
    "ambiguous_noncoder_requests",
    "negative_controls",
]
EXPECTED_DECISIONS = {"ALLOW", "BLOCK", "NEEDS_APPROVAL", "CLARIFY"}
EXPECTED_RISKS = {"R0", "R1", "R2", "R3"}
RERUN_TAG_PATTERN = re.compile(r"-r(\d+)$")
SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9]{20,}"),
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"AIza[A-Za-z0-9_\-]{20,}"),
    re.compile(r"(?i)(api[_-]?key|secret|token)\s*[:=]\s*[A-Za-z0-9_\-]{16,}"),
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def run_git(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )


def validate_required_files(errors: list[str]) -> None:
    for path in REQUIRED_FILES:
        if not path.exists():
            errors.append(f"missing required file: {path.relative_to(REPO_ROOT)}")


def validate_corpus(errors: list[str]) -> dict[str, Any]:
    if not CORPUS_PATH.exists():
        return {}
    corpus = load_json(CORPUS_PATH)
    tasks = corpus.get("tasks", [])
    if corpus.get("run_class") != "POWERED_SINGLE_PROVIDER":
        errors.append("corpus run_class must be POWERED_SINGLE_PROVIDER")
    if corpus.get("claim_scope") != "aggregate_only":
        errors.append("corpus claim_scope must be aggregate_only")
    if corpus.get("minimum_repeats_per_task_config") != 3:
        errors.append("minimum repeats must be 3")
    if corpus.get("families") != EXPECTED_FAMILIES:
        errors.append("corpus families must match the QBS-1 family order")
    if len(tasks) != 48:
        errors.append(f"expected 48 tasks, found {len(tasks)}")

    ids = [task.get("task_id") for task in tasks]
    duplicates = [task_id for task_id, count in Counter(ids).items() if count > 1]
    if duplicates:
        errors.append(f"duplicate task ids: {', '.join(sorted(duplicates))}")

    family_counts = Counter(task.get("family") for task in tasks)
    for family in EXPECTED_FAMILIES:
        if family_counts.get(family) != 6:
            errors.append(f"family {family} must have 6 tasks, found {family_counts.get(family, 0)}")

    negative_controls = [task for task in tasks if task.get("negative_control")]
    if len(negative_controls) != 6:
        errors.append(f"expected 6 negative controls, found {len(negative_controls)}")
    if any(task.get("family") != "negative_controls" for task in negative_controls):
        errors.append("all negative controls must be in the negative_controls family")

    for task in tasks:
        task_id = task.get("task_id", "<missing>")
        for field in [
            "task_id",
            "family",
            "risk_class",
            "expected_cvf_decision",
            "input_language",
            "persona",
            "negative_control",
            "user_prompt",
            "success_criteria",
            "hard_gate_expectations",
        ]:
            if field not in task:
                errors.append(f"{task_id} missing field: {field}")
        if task.get("expected_cvf_decision") not in EXPECTED_DECISIONS:
            errors.append(f"{task_id} has invalid expected_cvf_decision")
        if task.get("risk_class") not in EXPECTED_RISKS:
            errors.append(f"{task_id} has invalid risk_class")
        if not isinstance(task.get("success_criteria"), list) or not task.get("success_criteria"):
            errors.append(f"{task_id} must have non-empty success_criteria")
        if not isinstance(task.get("hard_gate_expectations"), list) or not task.get("hard_gate_expectations"):
            errors.append(f"{task_id} must have non-empty hard_gate_expectations")
        if not str(task.get("user_prompt", "")).strip():
            errors.append(f"{task_id} must have a user_prompt")
    return corpus


def validate_preregistration(args: argparse.Namespace, errors: list[str], warnings: list[str]) -> str | None:
    tag = args.preregistration_tag
    if not tag:
        if args.require_preregistration:
            errors.append("missing --preregistration-tag while --require-preregistration is set")
        else:
            warnings.append("no pre-registration tag supplied; scored execution remains blocked")
        return None
    if not tag.startswith("qbs/preregister/"):
        errors.append("pre-registration tag must start with qbs/preregister/")
        return None
    result = run_git(["rev-parse", "--verify", f"refs/tags/{tag}^{{}}"])
    if result.returncode != 0:
        errors.append(f"pre-registration tag not found: {tag}")
        return None
    return result.stdout.strip()


def validate_run_preregistration_files(tag: str | None, errors: list[str]) -> None:
    if not tag:
        return
    run_id = tag.removeprefix("qbs/preregister/")
    expected_paths = [
        QBS_ROOT / "preregistrations" / f"{run_id}.md",
        QBS_ROOT / f"provider-model-manifest.{run_id}.json",
        QBS_ROOT / f"config-prompt-manifest.{run_id}.json",
        QBS_ROOT / f"reviewer-plan.{run_id}.md",
    ]
    for path in expected_paths:
        if not path.exists():
            errors.append(f"missing run pre-registration file: {path.relative_to(REPO_ROOT)}")
    provider_manifest = expected_paths[1]
    if provider_manifest.exists():
        payload = load_json(provider_manifest)
        if payload.get("run_id") != run_id:
            errors.append("provider/model manifest run_id does not match pre-registration tag")
        if payload.get("run_class") != "POWERED_SINGLE_PROVIDER":
            errors.append("provider/model manifest must declare POWERED_SINGLE_PROVIDER")
        if payload.get("repeat_count") != 3:
            errors.append("provider/model manifest repeat_count must be 3")
        if payload.get("planned_configuration_executions") != 432:
            errors.append("provider/model manifest must declare 432 planned configuration executions")


def validate_secret_scan(errors: list[str]) -> None:
    scanned_paths = [
        *QBS_ROOT.rglob("*.md"),
        *QBS_ROOT.rglob("*.json"),
        REPO_ROOT / "scripts" / "check_qbs_scored_run_readiness.py",
    ]
    for path in scanned_paths:
        text = path.read_text(encoding="utf-8", errors="replace")
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                errors.append(f"possible raw secret pattern in {path.relative_to(REPO_ROOT)}")
                break


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    validate_required_files(errors)
    corpus = validate_corpus(errors)
    tag_sha = validate_preregistration(args, errors, warnings)
    validate_run_preregistration_files(args.preregistration_tag if tag_sha else None, errors)
    validate_secret_scan(errors)
    run_id = args.preregistration_tag.removeprefix("qbs/preregister/") if args.preregistration_tag else ""
    rerun_match = RERUN_TAG_PATTERN.search(run_id)
    rerun_index = int(rerun_match.group(1)) if rerun_match else 0
    preregistered_status = (
        "QBS8_RERUN_PREREGISTERED_NO_SCORED_RUN"
        if rerun_index >= 3
        else
        "QBS7_RERUN_PREREGISTERED_NO_SCORED_RUN"
        if rerun_index == 2
        else "QBS4_SCORED_RUN_PREREGISTERED_NO_SCORED_RUN"
    )

    return {
        "status": "PASS" if not errors else "FAIL",
        "public_status": (
            preregistered_status
            if tag_sha
            else "QBS3_SCORED_RUN_READINESS_PACKET_READY_NO_SCORED_RUN"
        ),
        "corpus_version": corpus.get("corpus_version"),
        "run_class": corpus.get("run_class"),
        "claim_scope": corpus.get("claim_scope"),
        "task_count": len(corpus.get("tasks", [])) if corpus else 0,
        "families": EXPECTED_FAMILIES,
        "preregistration_tag": args.preregistration_tag,
        "preregistration_tag_sha": tag_sha,
        "allowed_next_step": (
            "create and verify a run-specific pre-registration tag"
            if not tag_sha
            else (
                "operator may run the authorized QBS8 live rerun"
                if rerun_index >= 3
                else "operator may request separate QBS8 live rerun authorization"
                if run_id.endswith("-r2")
                else "operator may request separate scored-run execution authorization"
            )
        ),
        "errors": errors,
        "warnings": warnings,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Check QBS scored-run readiness packet.")
    parser.add_argument("--json", action="store_true", dest="json_output")
    parser.add_argument("--require-preregistration", action="store_true")
    parser.add_argument("--preregistration-tag")
    args = parser.parse_args()
    report = build_report(args)
    if args.json_output:
        print(json.dumps(report, indent=2))
    else:
        print(f"status: {report['status']}")
        for warning in report["warnings"]:
            print(f"warning: {warning}")
        for error in report["errors"]:
            print(f"error: {error}", file=sys.stderr)
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
