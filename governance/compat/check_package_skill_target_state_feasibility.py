#!/usr/bin/env python3
"""Fail closed when a package-skill dispatch declares an impossible target state."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
CONTROL_HEADING = "## Package Skill Productionization Control Block"
CONTRACT_HEADING = "## Package Skill Target-State Feasibility Contract"
SCHEMA = "cvf.packageSkillTargetStateFeasibility.v1"

PHASE_STATUS = {
    "P3": "CANDIDATE",
    "P4": "PROPOSED",
    "P5": "APPROVED",
    "P6": "APPROVED",
    "P7": "APPROVED",
    "P8": "ACTIVE",
    "P9": "ACTIVE",
    "P10": "ACTIVE",
}
PHASE_DECISION = {
    "P3": "DENIED_NOT_RUNTIME_ELIGIBLE",
    "P4": "DENIED_NOT_RUNTIME_ELIGIBLE",
    "P5": "DENIED_MISSING_TRUTH_PACKET",
    "P6": "DENIED_SOURCE_NOT_ACTIVE",
    "P7": "DENIED_SOURCE_NOT_ACTIVE",
    "P8": "ACTIVATION_READY",
    "P9": "ACTIVATION_READY",
    "P10": "ACTIVATION_READY",
}
ALLOWED_EXTERNAL = {"PROHIBITED", "DEFERRED_WITH_REASON", "IMPLEMENTED"}
EXTERNAL_BODY_DENIED = "DENIED_EXTERNAL_BODY_READ_NOT_IMPLEMENTED"
EXTERNAL_OUTPUT_DENIED = "DENIED_EXTERNAL_OUTPUT_USE_NOT_IMPLEMENTED"
REQUIRED_CHECKERS = {
    "governance/compat/check_assf_certified_metadata_admission.py",
    "governance/compat/check_package_skill_productionization_pipeline.py",
    "governance/compat/generate_skill_control_plane_inventory.py",
    "governance/compat/run_assf_active_resolver.py",
    "governance/compat/run_assf_cli_mcp_adapter_projection.py",
}
PROJECTION_PATHS = {
    "REGISTRY_ENTRY": {
        "docs/reference/agent_system_skills/generated/skill-index.json",
        "docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json",
        "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/data/skills-index.json",
        "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/data/assf-skill-control-plane.json",
    },
    "PACKAGE_SOURCE": {
        "docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json",
    },
    "TRUTH_PACKET": {
        "docs/reference/agent_system_skills/truth/generated/skill-truth-index.json",
        "docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json",
        "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/data/skills-index.json",
        "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/data/assf-skill-control-plane.json",
    },
    "USE_PROOF_RECEIPT": set(),
}


def _section(text: str, heading: str) -> str:
    match = re.search(rf"(?m)^{re.escape(heading)}\s*$", text)
    if not match:
        return ""
    tail = text[match.end():]
    end = re.search(r"(?m)^##\s+", tail)
    return tail[: end.start()] if end else tail


def _contract(text: str) -> tuple[dict[str, Any] | None, list[str]]:
    section = _section(text, CONTRACT_HEADING)
    if not section:
        return None, [f"missing `{CONTRACT_HEADING}`"]
    blocks = re.findall(r"```json\s*(\{.*?\})\s*```", section, flags=re.DOTALL)
    if len(blocks) != 1:
        return None, ["target-state feasibility section must contain exactly one JSON object fence"]
    try:
        payload = json.loads(blocks[0])
    except json.JSONDecodeError as exc:
        return None, [f"target-state feasibility JSON is invalid: {exc}"]
    if not isinstance(payload, dict):
        return None, ["target-state feasibility payload must be a JSON object"]
    return payload, []


def validate_contract(payload: dict[str, Any], text: str) -> list[str]:
    issues: list[str] = []
    if payload.get("schemaVersion") != SCHEMA:
        issues.append(f"schemaVersion must equal {SCHEMA}")
    if not str(payload.get("skillId", "")).strip():
        issues.append("skillId must be nonempty")
    phase = str(payload.get("sopPhase", "")).upper()
    if phase not in PHASE_STATUS:
        issues.append("sopPhase must be one of P3 through P10")
        return issues

    target = payload.get("targetState")
    if not isinstance(target, dict):
        return issues + ["targetState must be an object"]
    expected_status = PHASE_STATUS[phase]
    status = str(target.get("status", "")).upper()
    if status != expected_status:
        issues.append(f"{phase} requires targetState.status {expected_status}, found {status or '<missing>'}")
    if str(target.get("candidateState", "")).upper() != expected_status:
        issues.append(f"{phase} requires targetState.candidateState {expected_status}")

    phase_number = int(phase[1:])
    if phase_number >= 5:
        required = {
            "uatState": "PASSED",
            "certificationState": "CERTIFIED",
            "internalAgentDisposition": "IMPLEMENTED",
        }
        for field, expected in required.items():
            if str(target.get(field, "")).upper() != expected:
                issues.append(f"{phase} requires targetState.{field} {expected}")
    if phase_number >= 6:
        if str(target.get("truthApprovalStatus", "")).upper() != "APPROVED":
            issues.append(f"{phase} requires targetState.truthApprovalStatus APPROVED")
        if str(target.get("truthAssuranceLevel", "")).upper() != "STRICT":
            issues.append(f"{phase} requires targetState.truthAssuranceLevel STRICT")

    external = str(target.get("externalCliMcpDisposition", "")).upper()
    if external not in ALLOWED_EXTERNAL:
        issues.append("targetState.externalCliMcpDisposition is invalid")
    external_claimed = payload.get("externalUseClaimed")
    if not isinstance(external_claimed, bool):
        issues.append("externalUseClaimed must be boolean")
    elif external_claimed and external != "IMPLEMENTED":
        issues.append("externalUseClaimed=true requires externalCliMcpDisposition IMPLEMENTED")
    elif not external_claimed and external == "IMPLEMENTED":
        issues.append("externalCliMcpDisposition IMPLEMENTED requires externalUseClaimed=true")
    if external == "IMPLEMENTED":
        for field in ("adapterContract", "adapterEvidence"):
            value = str(target.get(field, "")).strip()
            if not value or value.upper().startswith("N/A"):
                issues.append(f"IMPLEMENTED external adapter requires concrete targetState.{field}")

    decisions = payload.get("expectedDecisions")
    if not isinstance(decisions, dict):
        issues.append("expectedDecisions must be an object")
    else:
        expected_activation = PHASE_DECISION[phase]
        if decisions.get("internalActivation") != expected_activation:
            issues.append(f"{phase} internalActivation must be {expected_activation}")
        if decisions.get("externalBodyRead") != EXTERNAL_BODY_DENIED:
            issues.append(f"externalBodyRead must remain {EXTERNAL_BODY_DENIED} at dispatch feasibility")
        if decisions.get("externalOutputUse") != EXTERNAL_OUTPUT_DENIED:
            issues.append(f"externalOutputUse must remain {EXTERNAL_OUTPUT_DENIED} at dispatch feasibility")

    routing = payload.get("blockerRouting")
    if not isinstance(routing, dict):
        issues.append("blockerRouting must be an object")
    else:
        if routing.get("technicalDecisionOwner") != "LOCAL":
            issues.append("blockerRouting.technicalDecisionOwner must be LOCAL")
        if routing.get("workerTerminalReturn") != "BLOCKED_WITH_REASON":
            issues.append("blockerRouting.workerTerminalReturn must be BLOCKED_WITH_REASON")
        if routing.get("operatorQuestionAllowed") is not False:
            issues.append("blockerRouting.operatorQuestionAllowed must be false")

    checker_sources = payload.get("checkerSources")
    if not isinstance(checker_sources, list):
        issues.append("checkerSources must be an array")
    else:
        missing = sorted(REQUIRED_CHECKERS - {str(item) for item in checker_sources})
        if missing:
            issues.append("checkerSources missing canonical predicates: " + ", ".join(missing))

    mutations = payload.get("mutations")
    if not isinstance(mutations, list) or not mutations:
        issues.append("mutations must be a nonempty array")
    else:
        normalized = {str(item).upper() for item in mutations}
        unknown = sorted(normalized - set(PROJECTION_PATHS))
        if unknown:
            issues.append("mutations contains unsupported values: " + ", ".join(unknown))
        required_paths: set[str] = set()
        for mutation in normalized & set(PROJECTION_PATHS):
            required_paths.update(PROJECTION_PATHS[mutation])
        omitted = sorted(path for path in required_paths if path not in text)
        if omitted:
            issues.append("worker manifest omits inferred dependent projections: " + ", ".join(omitted))
    return issues


def check_path(path: Path) -> list[str]:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        return [f"{path}: unreadable: {exc}"]
    if CONTROL_HEADING not in text:
        return []
    payload, issues = _contract(text)
    if payload is not None:
        issues.extend(validate_contract(payload, text))
    return [f"{path.as_posix()}: {issue}" for issue in issues]


def _changed_work_orders(base: str, head: str, repo_root: Path) -> list[Path]:
    proc = subprocess.run(
        ["git", "diff", "--name-only", f"{base}..{head}"],
        cwd=repo_root,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    paths: set[str] = set(proc.stdout.splitlines()) if proc.returncode == 0 else set()
    for args in (["diff", "--name-only"], ["diff", "--name-only", "--cached"]):
        extra = subprocess.run(["git", *args], cwd=repo_root, text=True, stdout=subprocess.PIPE)
        if extra.returncode == 0:
            paths.update(extra.stdout.splitlines())
    paths.update(
        item.replace("\\", "/")
        for item in subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard", "docs/work_orders/*.md"],
            cwd=repo_root,
            text=True,
            stdout=subprocess.PIPE,
        ).stdout.splitlines()
    )
    return [repo_root / item for item in sorted(paths) if item.startswith("docs/work_orders/") and item.endswith(".md")]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="HEAD")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--active-work-order")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)
    if args.active_work_order:
        raw = Path(args.active_work_order)
        path = raw if raw.is_absolute() else REPO_ROOT / raw
        paths = [path]
    else:
        paths = _changed_work_orders(args.base, args.head, REPO_ROOT)
    violations = [issue for path in paths for issue in check_path(path)]
    print("=== CVF Package Skill Target-State Feasibility Gate ===")
    print(f"Applicable work orders checked: {sum(CONTROL_HEADING in p.read_text(encoding='utf-8', errors='replace') for p in paths if p.is_file())}")
    print(f"Violations: {len(violations)}")
    for issue in violations:
        print(f"  - {issue}")
    if violations and args.enforce:
        print("VIOLATION - package-skill target state is not dispatch-feasible.")
        return 1
    print("COMPLIANT - package-skill target-state feasibility is explicit and consistent.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
