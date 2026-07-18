#!/usr/bin/env python3
"""Check package-skill productionization pipeline discipline.

This read-only guard binds ASSF package lifecycle changes and package-skill
governed artifacts back to the PKGSOP-T1 SOP. It does not activate packages,
load package bodies, call providers, or mutate generated indexes.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

_COMPAT_DIR = Path(__file__).resolve().parent
if str(_COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(_COMPAT_DIR))

from generate_assf_skill_index import (  # noqa: E402
    ENTRIES_DIR,
    INDEX_PATH,
    REPO_ROOT,
    load_source_entries,
    validate_index_matches_sources,
)


PACKAGES_DIR = REPO_ROOT / "docs" / "reference" / "agent_system_skills" / "packages"
TRUTH_PACKETS_DIR = (
    REPO_ROOT / "docs" / "reference" / "agent_system_skills" / "truth" / "packets"
)
TRUTH_INDEX_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "agent_system_skills"
    / "truth"
    / "generated"
    / "skill-truth-index.json"
)
SOP_PATH = "docs/reference/agent_system_skills/CVF_PACKAGE_SKILL_PRODUCTIONIZATION_SOP.md"
CONTROL_BLOCK = "## Package Skill Productionization Control Block"
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

PACKAGE_SURFACE_PREFIXES = (
    "docs/reference/agent_system_skills/registry/entries/",
    "docs/reference/agent_system_skills/packages/",
    "docs/reference/agent_system_skills/truth/packets/",
    "docs/reference/agent_system_skills/truth/generated/",
    "docs/reference/agent_system_skills/generated/",
)
CONTROL_ARTIFACT_PREFIXES = (
    "docs/baselines/",
    "docs/work_orders/",
    "docs/reviews/",
    "docs/roadmaps/",
)
PACKAGE_INTENT_MARKERS = (
    "package skill",
    "package-skill",
    "runtime package",
    "ASSF package",
    "Package Skill Productionization",
    "PKGSOP",
    "SKSOT",
)
CONTROL_REQUIRED_FIELDS = (
    "SOP source:",
    "Current phase:",
    "Target lifecycle state:",
    "Prior phase evidence:",
    "Next forbidden skip:",
    "Runtime/provider proof:",
    "Claim boundary:",
)

STATUS_RANK = {
    "CANDIDATE": 1,
    "PROPOSED": 2,
    "APPROVED": 3,
    "ACTIVE": 4,
    "DEPRECATED": 5,
    "RETIRED": 6,
}


@dataclass(frozen=True)
class Violation:
    path: str
    message: str


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _upper(value: Any) -> str:
    return _as_text(value).upper()


def _is_na_with_reason(value: Any) -> bool:
    return _as_text(value).lower().startswith("n/a with reason")


def _run_git(args: list[str], *, repo_root: Path = REPO_ROOT) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=repo_root,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _ref_exists(ref: str, *, repo_root: Path = REPO_ROOT) -> bool:
    code, _, _ = _run_git(["rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"], repo_root=repo_root)
    return code == 0


def _discover_base(head: str, *, repo_root: Path = REPO_ROOT) -> tuple[str, str]:
    for ref in DEFAULT_BASE_CANDIDATES:
        if not _ref_exists(ref, repo_root=repo_root):
            continue
        code, out, _ = _run_git(["merge-base", ref, head], repo_root=repo_root)
        if code == 0 and out:
            return out, f"merge-base({ref},{head})"
    return "HEAD~1", "fallback:HEAD~1"


def _resolve_range(base: str | None, head: str | None, *, repo_root: Path = REPO_ROOT) -> tuple[str, str, str]:
    resolved_head = head or "HEAD"
    if base:
        return base, resolved_head, "explicit:--base"
    resolved_base, source = _discover_base(resolved_head, repo_root=repo_root)
    return resolved_base, resolved_head, source


def _parse_name_status(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        status = parts[0].strip()
        if status.startswith(("R", "C")):
            if len(parts) >= 3:
                path = parts[2]
            else:
                continue
        elif len(parts) >= 2:
            path = parts[1]
        else:
            continue
        changed.setdefault(path.replace("\\", "/").strip(), set()).add(status)
    return changed


def _merge_changed(*maps: dict[str, set[str]]) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    for item in maps:
        for path, statuses in item.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _get_changed_paths(base: str, head: str, *, repo_root: Path = REPO_ROOT) -> dict[str, list[str]]:
    range_changed: dict[str, set[str]] = {}
    code, out, _ = _run_git(["diff", "--name-status", f"{base}..{head}"], repo_root=repo_root)
    if code == 0 and out:
        range_changed = _parse_name_status(out)

    worktree_changed: dict[str, set[str]] = {}
    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args, repo_root=repo_root)
        if code == 0 and out:
            worktree_changed = _merge_changed(worktree_changed, _parse_name_status(out))
            worktree_changed = {k: set(v) for k, v in worktree_changed.items()}

    untracked: dict[str, set[str]] = {}
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"], repo_root=repo_root)
    if code == 0 and out:
        for raw_line in out.splitlines():
            path = raw_line.replace("\\", "/").strip()
            if path:
                untracked.setdefault(path, set()).add("A")

    return _merge_changed(range_changed, worktree_changed, untracked)


def _read_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path}: expected JSON object")
    return value


def _repo_relative_path(path: str, repo_root: Path) -> bool:
    normalized = path.replace("\\", "/")
    if not normalized or normalized.startswith("/") or normalized.startswith("../"):
        return False
    if ":" in normalized or "/../" in normalized or normalized.endswith("/.."):
        return False
    return (repo_root / normalized).exists()


def _truth_index_entries(index_path: Path) -> dict[str, dict[str, Any]]:
    if not index_path.exists():
        return {}
    value = _read_json(index_path)
    entries = value.get("entries", [])
    result: dict[str, dict[str, Any]] = {}
    if isinstance(entries, list):
        for item in entries:
            if isinstance(item, dict) and _as_text(item.get("skillId")):
                result[_as_text(item.get("skillId"))] = item
    return result


def _truth_packet_status(skill_id: str, truth_packets_dir: Path, truth_index: dict[str, dict[str, Any]]) -> tuple[bool, str]:
    packet_path = truth_packets_dir / f"{skill_id}.json"
    if not packet_path.is_file():
        return False, f"{skill_id}: ACTIVE package requires SKSOT truth packet"
    try:
        packet = _read_json(packet_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return False, f"{skill_id}: truth packet cannot be read: {exc}"
    if _as_text(packet.get("truthStatus")).lower() != "approved":
        return False, f"{skill_id}: ACTIVE package requires approved truth packet"
    if _upper(packet.get("verificationMode")) != "STRICT":
        return False, f"{skill_id}: ACTIVE package requires STRICT truth packet"
    if _upper(packet.get("runtimeEligibility")) != "RUNTIME_PACKAGE_ELIGIBLE":
        return False, f"{skill_id}: ACTIVE package requires runtime eligible truth packet"
    indexed = truth_index.get(skill_id)
    if not indexed:
        return False, f"{skill_id}: ACTIVE package requires generated truth index entry"
    if _as_text(indexed.get("canonicalPacketPath")) != _as_text(packet.get("canonicalPacketPath")):
        return False, f"{skill_id}: generated truth index packet path does not match packet"
    return True, ""


def _package_source_path(entry: dict[str, Any], repo_root: Path) -> Path:
    skill_id = _as_text(entry.get("skillId"))
    root = _as_text(entry.get("canonicalRoot"))
    if root.endswith("/SKILL.md"):
        return repo_root / root.replace("/SKILL.md", "/skill.source.json")
    return repo_root / "docs" / "reference" / "agent_system_skills" / "packages" / skill_id / "skill.source.json"


def _check_candidate(entry: dict[str, Any], repo_root: Path) -> list[Violation]:
    skill_id = _as_text(entry.get("skillId")) or "<missing skillId>"
    path = f"docs/reference/agent_system_skills/registry/entries/{skill_id}.json"
    violations: list[Violation] = []
    source_artifacts = entry.get("sourceArtifacts")
    if not isinstance(source_artifacts, list) or not source_artifacts:
        violations.append(Violation(path, f"{skill_id}: CANDIDATE requires sourceArtifacts"))
    elif not any(
        _as_text(item).startswith(".private_reference/source_mirrors/")
        or _as_text(item).startswith("docs/reviews/")
        or _as_text(item).startswith("docs/baselines/")
        for item in source_artifacts
    ):
        violations.append(
            Violation(path, f"{skill_id}: CANDIDATE sourceArtifacts must cite source mirror or governed learning/review artifact")
        )
    if _upper(entry.get("candidateState")) != "CANDIDATE":
        violations.append(Violation(path, f"{skill_id}: CANDIDATE requires candidateState CANDIDATE"))
    return violations


def _check_package_root(entry: dict[str, Any], repo_root: Path) -> tuple[dict[str, Any] | None, list[Violation]]:
    skill_id = _as_text(entry.get("skillId")) or "<missing skillId>"
    path = f"docs/reference/agent_system_skills/registry/entries/{skill_id}.json"
    violations: list[Violation] = []
    canonical_root = _as_text(entry.get("canonicalRoot"))
    if not canonical_root.endswith("/SKILL.md"):
        violations.append(Violation(path, f"{skill_id}: package lifecycle requires canonicalRoot ending in /SKILL.md"))
        return None, violations
    skill_path = repo_root / canonical_root
    source_path = _package_source_path(entry, repo_root)
    if not skill_path.is_file():
        violations.append(Violation(path, f"{skill_id}: package lifecycle requires SKILL.md package root"))
    if not source_path.is_file():
        violations.append(Violation(path, f"{skill_id}: package lifecycle requires skill.source.json"))
        return None, violations
    try:
        package_source = _read_json(source_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        violations.append(Violation(path, f"{skill_id}: package source cannot be read: {exc}"))
        return None, violations
    if _as_text(package_source.get("skillId")) != skill_id:
        violations.append(Violation(path, f"{skill_id}: package source skillId mismatch"))
    return package_source, violations


def _check_proposed(entry: dict[str, Any], repo_root: Path) -> list[Violation]:
    skill_id = _as_text(entry.get("skillId")) or "<missing skillId>"
    path = f"docs/reference/agent_system_skills/registry/entries/{skill_id}.json"
    package_source, violations = _check_package_root(entry, repo_root)
    if package_source:
        if _upper(package_source.get("lifecycleState")) not in {"PROPOSED", "APPROVED", "ACTIVE"}:
            violations.append(Violation(path, f"{skill_id}: package source lifecycleState must be PROPOSED or later"))
    if _upper(entry.get("candidateState")) not in {"PROPOSED", "APPROVED", "ACTIVE"}:
        violations.append(Violation(path, f"{skill_id}: PROPOSED status requires candidateState PROPOSED or later"))
    return violations


def _check_approved(entry: dict[str, Any], repo_root: Path) -> list[Violation]:
    skill_id = _as_text(entry.get("skillId")) or "<missing skillId>"
    path = f"docs/reference/agent_system_skills/registry/entries/{skill_id}.json"
    violations = _check_proposed(entry, repo_root)
    required = {
        "approvalState": "APPROVED",
        "uatState": "PASSED",
        "certificationState": "CERTIFIED",
        "internalAgentDisposition": "IMPLEMENTED",
    }
    for field, expected in required.items():
        if _upper(entry.get(field)) != expected:
            violations.append(Violation(path, f"{skill_id}: APPROVED or later requires {field} {expected}"))
    review_artifacts = entry.get("reviewArtifacts")
    if not isinstance(review_artifacts, list) or not review_artifacts:
        violations.append(Violation(path, f"{skill_id}: APPROVED or later requires reviewArtifacts"))
    else:
        for item in review_artifacts:
            rel = _as_text(item)
            if not _repo_relative_path(rel, repo_root):
                violations.append(Violation(path, f"{skill_id}: reviewArtifact does not exist: {rel}"))
    package_source, package_violations = _check_package_root(entry, repo_root)
    violations.extend(package_violations)
    if package_source:
        for field, expected in (
            ("uatState", "PASSED"),
            ("certificationState", "CERTIFIED"),
            ("internalAgentDisposition", "IMPLEMENTED"),
        ):
            if _upper(package_source.get(field)) != expected:
                violations.append(Violation(path, f"{skill_id}: package source requires {field} {expected}"))
    return violations


def _check_active(
    entry: dict[str, Any],
    repo_root: Path,
    truth_packets_dir: Path,
    truth_index: dict[str, dict[str, Any]],
) -> list[Violation]:
    skill_id = _as_text(entry.get("skillId")) or "<missing skillId>"
    path = f"docs/reference/agent_system_skills/registry/entries/{skill_id}.json"
    violations = _check_approved(entry, repo_root)
    if _upper(entry.get("candidateState")) != "ACTIVE":
        violations.append(Violation(path, f"{skill_id}: ACTIVE requires candidateState ACTIVE"))
    if _upper(entry.get("externalCliMcpDisposition")) != "IMPLEMENTED":
        violations.append(Violation(path, f"{skill_id}: ACTIVE requires externalCliMcpDisposition IMPLEMENTED"))
    for field in ("adapterContract", "adapterEvidence"):
        if not _as_text(entry.get(field)) or _is_na_with_reason(entry.get(field)):
            violations.append(Violation(path, f"{skill_id}: ACTIVE requires concrete {field}"))
        elif not _repo_relative_path(_as_text(entry.get(field)), repo_root):
            violations.append(Violation(path, f"{skill_id}: ACTIVE {field} path does not exist"))
    package_source, package_violations = _check_package_root(entry, repo_root)
    violations.extend(package_violations)
    if package_source:
        if _upper(package_source.get("lifecycleState")) != "ACTIVE":
            violations.append(Violation(path, f"{skill_id}: ACTIVE requires package source lifecycleState ACTIVE"))
        if _upper(package_source.get("externalCliMcpDisposition")) != "IMPLEMENTED":
            violations.append(Violation(path, f"{skill_id}: ACTIVE package source requires externalCliMcpDisposition IMPLEMENTED"))
    truth_ok, truth_message = _truth_packet_status(skill_id, truth_packets_dir, truth_index)
    if not truth_ok:
        violations.append(Violation(path, truth_message))
    return violations


def _check_lifecycle_snapshot(
    entries_dir: Path,
    index_path: Path,
    repo_root: Path,
    truth_packets_dir: Path,
    truth_index_path: Path,
) -> list[Violation]:
    violations = [Violation(str(index_path.relative_to(repo_root)), item) for item in validate_index_matches_sources(index_path, entries_dir)]
    try:
        entries = load_source_entries(entries_dir)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return violations + [Violation(str(entries_dir.relative_to(repo_root)), f"ASSF registry source load failed: {exc}")]
    try:
        truth_index = _truth_index_entries(truth_index_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return violations + [Violation(str(truth_index_path.relative_to(repo_root)), f"truth index load failed: {exc}")]

    for entry in entries:
        status = _upper(entry.get("status"))
        if status == "CANDIDATE":
            violations.extend(_check_candidate(entry, repo_root))
        elif status == "PROPOSED":
            violations.extend(_check_proposed(entry, repo_root))
        elif status == "APPROVED":
            violations.extend(_check_approved(entry, repo_root))
        elif status == "ACTIVE":
            violations.extend(_check_active(entry, repo_root, truth_packets_dir, truth_index))
    return violations


def _changed_text(path: str, repo_root: Path) -> str:
    full = repo_root / path
    if not full.is_file():
        return ""
    try:
        return full.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _is_package_surface(path: str) -> bool:
    return path.startswith(PACKAGE_SURFACE_PREFIXES)


def _is_control_artifact(path: str) -> bool:
    return path.endswith(".md") and path.startswith(CONTROL_ARTIFACT_PREFIXES)


def _mentions_package_intent(text: str) -> bool:
    lowered = text.lower()
    return any(marker.lower() in lowered for marker in PACKAGE_INTENT_MARKERS)


def _control_block_violations(path: str, text: str) -> list[Violation]:
    violations: list[Violation] = []
    if CONTROL_BLOCK not in text:
        return [Violation(path, f"package-skill artifact requires `{CONTROL_BLOCK}`")]
    section = text.split(CONTROL_BLOCK, 1)[1]
    next_heading = section.find("\n## ")
    if next_heading >= 0:
        section = section[:next_heading]
    for field in CONTROL_REQUIRED_FIELDS:
        if field not in section:
            violations.append(Violation(path, f"Package Skill Productionization Control Block missing field `{field}`"))
    if SOP_PATH not in section:
        violations.append(Violation(path, f"Package Skill Productionization Control Block must cite `{SOP_PATH}`"))
    return violations


def _check_changed_artifacts(changed_paths: dict[str, list[str]], repo_root: Path) -> list[Violation]:
    violations: list[Violation] = []
    package_surface_changed = any(_is_package_surface(path) for path in changed_paths)
    changed_control_paths = [
        path for path in changed_paths if _is_control_artifact(path)
    ]

    control_paths_with_block: list[str] = []
    for path in changed_control_paths:
        text = _changed_text(path, repo_root)
        if not text:
            continue
        relevant = _mentions_package_intent(text) or package_surface_changed
        if not relevant:
            continue
        block_violations = _control_block_violations(path, text)
        if block_violations:
            violations.extend(block_violations)
        else:
            control_paths_with_block.append(path)

    if package_surface_changed and not control_paths_with_block:
        changed = ", ".join(path for path in changed_paths if _is_package_surface(path))
        violations.append(
            Violation(
                changed or "<changed package surface>",
                "package-skill source changes require a changed governed artifact with Package Skill Productionization Control Block",
            )
        )
    return violations


def _load_entry_at_ref(path: str, ref: str, repo_root: Path) -> dict[str, Any] | None:
    code, out, _ = _run_git(["show", f"{ref}:{path}"], repo_root=repo_root)
    if code != 0 or not out:
        return None
    try:
        value = json.loads(out)
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def _check_lifecycle_promotion_control(
    changed_paths: dict[str, list[str]],
    base: str,
    repo_root: Path,
) -> list[Violation]:
    violations: list[Violation] = []
    control_paths = [
        path for path in changed_paths
        if _is_control_artifact(path) and CONTROL_BLOCK in _changed_text(path, repo_root)
    ]
    for path in changed_paths:
        if not path.startswith("docs/reference/agent_system_skills/registry/entries/") or not path.endswith(".json"):
            continue
        current_path = repo_root / path
        if not current_path.is_file():
            continue
        try:
            current = _read_json(current_path)
        except (OSError, json.JSONDecodeError, ValueError):
            continue
        previous = _load_entry_at_ref(path, base, repo_root)
        if not previous:
            continue
        old_status = _upper(previous.get("status"))
        new_status = _upper(current.get("status"))
        if STATUS_RANK.get(new_status, 0) > STATUS_RANK.get(old_status, 0) and not control_paths:
            violations.append(
                Violation(path, f"{_as_text(current.get('skillId'))}: lifecycle promotion {old_status}->{new_status} requires Package Skill Productionization Control Block")
            )
    return violations


def check(
    *,
    base: str | None = None,
    head: str | None = None,
    repo_root: Path = REPO_ROOT,
    entries_dir: Path | None = None,
    index_path: Path | None = None,
    truth_packets_dir: Path | None = None,
    truth_index_path: Path | None = None,
) -> tuple[list[Violation], dict[str, Any]]:
    entries_dir = entries_dir or repo_root / "docs" / "reference" / "agent_system_skills" / "registry" / "entries"
    index_path = index_path or repo_root / "docs" / "reference" / "agent_system_skills" / "generated" / "skill-index.json"
    truth_packets_dir = truth_packets_dir or repo_root / "docs" / "reference" / "agent_system_skills" / "truth" / "packets"
    truth_index_path = truth_index_path or repo_root / "docs" / "reference" / "agent_system_skills" / "truth" / "generated" / "skill-truth-index.json"
    resolved_base, resolved_head, base_source = _resolve_range(base, head, repo_root=repo_root)
    changed_paths = _get_changed_paths(resolved_base, resolved_head, repo_root=repo_root)

    violations = _check_lifecycle_snapshot(
        entries_dir,
        index_path,
        repo_root,
        truth_packets_dir,
        truth_index_path,
    )
    violations.extend(_check_changed_artifacts(changed_paths, repo_root))
    violations.extend(_check_lifecycle_promotion_control(changed_paths, resolved_base, repo_root))

    readout = {
        "base": resolved_base,
        "head": resolved_head,
        "baseSource": base_source,
        "changedPaths": sorted(changed_paths),
    }
    return violations, readout


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check ASSF package-skill productionization pipeline discipline"
    )
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    violations, readout = check(base=args.base, head=args.head)
    print("=== CVF Package Skill Productionization Pipeline Check ===")
    print(f"Range: {readout['base']}..{readout['head']} ({readout['baseSource']})")
    print(f"Changed paths: {len(readout['changedPaths'])}")
    print(f"Violations: {len(violations)}")
    if violations:
        print("\nViolations:")
        for item in violations:
            print(f"  - {item.path}: {item.message}")
        print("\nVIOLATION - package-skill productionization pipeline evidence is incomplete.")
        return 1 if args.enforce else 0

    print("\nCOMPLIANT - package-skill productionization pipeline evidence is aligned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
