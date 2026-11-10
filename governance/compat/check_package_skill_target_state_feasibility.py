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
    if payload.get("applicability") == METADATA_ONLY:
        effective = _metadata_declarative_text(text)
        if len(re.findall(rf"(?m)^{re.escape(CONTRACT_HEADING)}[ \t]*$", effective)) != 1:
            return None, ["metadata-only contract requires exactly one effective contract section"]
        blocks = re.findall(r"```json\s*(\{.*?\})\s*```", _section(effective, CONTRACT_HEADING), flags=re.DOTALL)
        if len(blocks) != 1:
            return None, ["metadata-only contract requires one effective JSON fence"]
        try:
            payload = json.loads(blocks[0], object_pairs_hook=_unique_metadata_object)
        except ValueError as exc:
            return None, [str(exc)]
    return payload, []



METADATA_ONLY = "METADATA_ONLY_NO_LIFECYCLE_MUTATION"
UNCHANGED_TARGET_FIELDS = ("status", "candidateState", "uatState", "certificationState", "internalAgentDisposition", "truthApprovalStatus", "truthAssuranceLevel", "externalCliMcpDisposition")
FORBIDDEN_METADATA_SOURCE_PREFIXES = (
    "docs/reference/agent_system_skills/registry/", "docs/reference/agent_system_skills/packages/",
    "docs/reference/agent_system_skills/truth/", "docs/reference/agent_system_skills/generated/",
    "docs/reference/agent_system_skills/control_plane/generated/",
    "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/data/",
)

def _unique_metadata_object(pairs):
    value = {}
    for key, item in pairs:
        if key in value:
            raise ValueError("duplicate metadata contract key: " + key)
        value[key] = item
    return value


def _metadata_declarative_text(text: str) -> str:
    """Keep only top-level contract/ledger fences; mask examples and comments.

    Reuse the declaration owner's fence grammar and offset-preserving masks.
    The absent-discriminant legacy parser continues to consume its original text.
    """
    try:
        from governance.compat.check_independent_review_probe_admission import _FENCE_OPEN_RE, _HTML_COMMENT_RE, _blank_span
    except ModuleNotFoundError:
        from check_independent_review_probe_admission import _FENCE_OPEN_RE, _HTML_COMMENT_RE, _blank_span
    text = _HTML_COMMENT_RE.sub(_blank_span, text)
    out, pos = [], 0
    for match in _FENCE_OPEN_RE.finditer(text):
        if match.start() < pos:
            continue
        delimiter = match.group(1)
        close = re.search(rf"(?m)^[ \t]{{0,3}}{re.escape(delimiter[0])}{{{len(delimiter)},}}[ \t]*$", text[match.end():])
        end = match.end() + close.end() if close else len(text)
        out.append(text[pos:match.start()])
        span = text[match.start():end]
        canonical = match.group(0) in ("```json", "```acceptance-ledger-json") and close is not None
        out.append(span if canonical else re.sub(r"[^\n]", " ", span))
        pos = end
    out.append(text[pos:])
    return "".join(out)


def _metadata_source_paths(text: str) -> tuple[set[str], str | None, list[str]]:
    """Join the admitted structured ledger and write table, not a path mention."""
    issues = []
    text = _metadata_declarative_text(text)
    blocks = re.findall(r"^```acceptance-ledger-json\s*\n(.*?)^```", text, re.M | re.S)
    if len(blocks) != 1:
        return set(), None, ["metadata-only scope requires one structured acceptance ledger"]
    try:
        ledger = json.loads(blocks[0], object_pairs_hook=_unique_metadata_object)
        paths = [p for row in ledger["requirements"] for p in row["expectedArtifacts"]]
        if any(not isinstance(p, str) for p in paths):
            raise ValueError("non-string expected artifact")
    except (ValueError, TypeError, KeyError):
        return set(), None, ["metadata-only scope has malformed expectedArtifacts"]
    try:
        from governance.compat.check_independent_review_probe_admission import DeclarationScanner, _mask_fenced_blocks, _HTML_COMMENT_RE, _blank_span
    except ModuleNotFoundError:
        from check_independent_review_probe_admission import DeclarationScanner, _mask_fenced_blocks, _HTML_COMMENT_RE, _blank_span
    scanner = DeclarationScanner(text)
    ownership = list(re.finditer(r"(?m)^[ \t]{0,3}##[ \t]+Write Ownership(?:[ \t]+#+)?[ \t]*$", scanner.masked_text))
    declared = set(paths)
    if len(ownership) != 1:
        issues.append("metadata-only scope requires exactly one declarative Write Ownership section")
    else:
        start = ownership[0].end()
        end = re.search(r"(?m)^[ \t]{0,3}##[ \t]+\S", scanner.masked_text[start:])
        # The shared scanner preserves offsets while masking example headings.
        # Read the actual table bytes only inside that uniquely located section.
        table_text = _HTML_COMMENT_RE.sub(_blank_span, _mask_fenced_blocks(text))
        write = table_text[start:start + end.start()] if end else table_text[start:]
        rows = [line.strip().strip("|").split("|")[0].strip().strip("`")
                for line in write.splitlines() if line.strip().startswith("|")]
        write_paths = {p for p in rows if "/" in p and not p.startswith("---")}
        if declared != write_paths:
            issues.append("metadata-only Write Ownership and expectedArtifacts must agree exactly")
    readable = scanner.scalar("Worker return path", cardinality="EXACTLY_ONE")
    camel = scanner.scalar("workerReturnPath", cardinality="EXACTLY_ONE")
    formal = None
    if not readable.ok or not camel.ok:
        issues.append("metadata-only scope requires both unique formal path scalars")
    else:
        left = re.findall(r"(?m)^Worker return path:[ \t]*`(docs/reviews/[^`\n]+\.md)`[ \t]*$", scanner.masked_text)
        right = re.findall(r"(?m)^workerReturnPath:[ \t]*`(docs/reviews/[^`\n]+\.md)`[ \t]*$", scanner.masked_text)
        if len(left) != 1 or len(right) != 1 or left[0] != right[0] or left[0] not in declared:
            issues.append("metadata-only formal scalars must agree on one admitted docs/reviews Markdown path")
        else:
            formal = left[0]
    if not 1 <= len(declared) <= 17:
        issues.append("metadata-only admitted artifact set exceeds bounded source/formal scope")
    return declared, formal, issues


def _validate_metadata_contract(payload: dict[str, Any], text: str) -> list[str]:
    """Explicit no-lifecycle declaration; no identity/state/permission fiction."""
    issues = []
    expected = {"schemaVersion", "applicability", "scopeId", "sourcePaths", "targetState", "externalUseClaimed", "expectedDecisions", "blockerRouting", "checkerSources", "mutations"}
    if set(payload) != expected:
        issues.append("metadata-only contract has missing or unknown fields")
    if payload.get("schemaVersion") != SCHEMA or payload.get("applicability") != METADATA_ONLY:
        issues.append("invalid metadata-only schema or applicability")
    if not isinstance(payload.get("scopeId"), str) or not payload["scopeId"].strip():
        issues.append("metadata-only scopeId must be nonempty")
    if payload.get("mutations") != []:
        issues.append("metadata-only scope must declare mutations=[]")
    if payload.get("targetState") != {key: "UNCHANGED" for key in UNCHANGED_TARGET_FIELDS}:
        issues.append("metadata-only target lifecycle/UAT/truth/internal/external fields must all be UNCHANGED")
    if payload.get("externalUseClaimed") is not False:
        issues.append("metadata-only scope must not claim external use")
    if payload.get("expectedDecisions") != {"internalActivation": "NOT_EVALUATED_UNCHANGED", "externalBodyRead": EXTERNAL_BODY_DENIED, "externalOutputUse": EXTERNAL_OUTPUT_DENIED}:
        issues.append("metadata-only activation stays unevaluated and external read/output remain denied")
    routing = payload.get("blockerRouting")
    if routing != {"technicalDecisionOwner": "LOCAL", "workerTerminalReturn": "BLOCKED_WITH_REASON", "operatorQuestionAllowed": False} or not isinstance(routing, dict) or routing.get("operatorQuestionAllowed") is not False:
        issues.append("metadata-only blocker routing must remain Local and fail closed")
    checkers = payload.get("checkerSources")
    if not isinstance(checkers, list) or not all(isinstance(x, str) for x in checkers) or len(checkers) != len(set(checkers)) or not REQUIRED_CHECKERS.issubset(set(checkers)):
        issues.append("metadata-only checkerSources must include canonical predicates without duplicates")
    paths = payload.get("sourcePaths")
    if not isinstance(paths, list) or not 1 <= len(paths) <= 16 or not all(isinstance(x, str) for x in paths) or len(set(paths)) != len(paths):
        return issues + ["metadata-only sourcePaths must be a bounded unique nonempty string array"]
    declared, formal, errors = _metadata_source_paths(text)
    issues.extend(errors)
    if set(paths) != declared - ({formal} if formal else set()):
        issues.append("metadata-only sourcePaths must equal structured admitted source artifacts")
    from pathlib import PurePosixPath
    root = REPO_ROOT.resolve()
    # Validate EVERY admitted path before excluding only the exact formal.
    for raw in set(paths) | declared:
        path = PurePosixPath(raw)
        if not raw or path.is_absolute() or ":" in raw or "\\" in raw or raw != path.as_posix() or any(x in (".", "..") for x in raw.split("/")):
            issues.append("unsafe metadata-only source path: " + raw)
            continue
        lower = raw.lower()
        if any(lower.startswith(prefix.lower()) for prefix in FORBIDDEN_METADATA_SOURCE_PREFIXES) or any(term in lower for term in ("use-proof", "use_proof", "useproof", "/receipts/")):
            issues.append("metadata-only source path touches lifecycle/generated/use-proof surface: " + raw)
        full = root / raw
        try:
            resolved = full.resolve()
            resolved.relative_to(root)
            if resolved != full.absolute() or any(part.is_symlink() for part in [full, *full.parents] if part != root and root in part.parents):
                issues.append("metadata-only source path traverses a symlink or redirect: " + raw)
        except (OSError, ValueError, RuntimeError):
            issues.append("metadata-only source path escapes or cannot be resolved: " + raw)
    return issues


def validate_contract(payload: dict[str, Any], text: str) -> list[str]:
    if "applicability" in payload:
        if payload.get("applicability") != METADATA_ONLY:
            return ["unsupported explicit applicability"]
        return _validate_metadata_contract(payload, text)
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
