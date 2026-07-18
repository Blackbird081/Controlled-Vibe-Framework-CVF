#!/usr/bin/env python3
"""Check CVF skill source-of-truth packets.

This checker validates the governed skill truth packet layout for ASSF
runtime-package records. The generated truth index is a read model; packet JSON
files and ASSF registry entries remain the source records.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
PACKETS_DIR = (
    REPO_ROOT / "docs" / "reference" / "agent_system_skills" / "truth" / "packets"
)
INDEX_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "agent_system_skills"
    / "truth"
    / "generated"
    / "skill-truth-index.json"
)
REGISTRY_DIR = REPO_ROOT / "docs" / "reference" / "agent_system_skills" / "registry" / "entries"

DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

ALLOWED_PROVENANCE_LABELS = {
    "MEASURED",
    "COMPUTED",
    "LLM_INFERRED",
    "HUMAN_APPROVED",
}
ALLOWED_VERIFICATION_MODES = {"STRICT", "RELAXED", "BLOCKED"}
ALLOWED_TRUTH_STATUS = {"approved", "draft", "pending_review", "rejected", "expired"}
ALLOWED_RUNTIME_ELIGIBILITY = {
    "RUNTIME_PACKAGE_ELIGIBLE",
    "RUNTIME_PACKAGE_INELIGIBLE",
    "NOT_RUNTIME_PACKAGE",
}
ALLOWED_EVIDENCE_STATUS = {"approved", "draft", "pending_review", "rejected", "expired"}
ALLOWED_OBLIGATION_STRENGTH = {"HARD", "SOFT"}
ALLOWED_OBLIGATION_STATE = {"satisfied", "open", "blocked", "not_applicable"}
ALLOWED_VERIFICATION_STATUS = {"pass", "fail", "blocked", "not_applicable"}

STRICT_REQUIRED_FIELDS = (
    "schemaVersion",
    "truthPacketId",
    "skillId",
    "canonicalPacketPath",
    "registryEntryPath",
    "packageRootPath",
    "truthStatus",
    "verificationMode",
    "runtimeEligibility",
    "lifecycleSnapshot",
    "authorityBoundary",
    "evidence",
    "provenanceLabels",
    "obligations",
    "verificationResults",
    "receipt",
)

HEX_HASH_RE = re.compile(r"^sha256:[a-f0-9]{64}$")


@dataclass(frozen=True)
class Violation:
    path: str
    message: str


def _run_git(args: list[str]) -> tuple[int, str, str]:
    try:
        completed = subprocess.run(
            ["git", *args],
            cwd=REPO_ROOT,
            check=False,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except FileNotFoundError:
        return 127, "", "git not found"
    return completed.returncode, completed.stdout or "", completed.stderr or ""


def _default_base() -> str:
    for candidate in DEFAULT_BASE_CANDIDATES:
        code, _, _ = _run_git(["rev-parse", "--verify", candidate])
        if code == 0:
            return candidate
    return "HEAD"


def changed_files(base: str, head: str) -> list[str]:
    code, stdout, stderr = _run_git(["diff", "--name-only", "--diff-filter=ACMR", base, head])
    if code != 0:
        raise RuntimeError(stderr.strip() or f"git diff failed for {base}..{head}")
    return [line.strip().replace("\\", "/") for line in stdout.splitlines() if line.strip()]


def _repo_rel(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def _text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("expected JSON object")
    return value


def _load_registry_entries(registry_dir: Path = REGISTRY_DIR) -> dict[str, dict[str, Any]]:
    entries: dict[str, dict[str, Any]] = {}
    if not registry_dir.exists():
        return entries
    for path in sorted(registry_dir.glob("*.json")):
        entry = _load_json(path)
        skill_id = _text(entry.get("skillId"))
        if skill_id:
            entries[skill_id] = entry
    return entries


def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _ids(items: list[Any], key: str) -> set[str]:
    found: set[str] = set()
    for item in items:
        if isinstance(item, dict):
            item_id = _text(item.get(key))
            if item_id:
                found.add(item_id)
    return found


def _path_is_repo_relative(value: str) -> bool:
    normalized = value.replace("\\", "/")
    if not normalized or normalized.startswith("/") or normalized.startswith("../"):
        return False
    if "/../" in normalized or normalized.endswith("/..") or ":" in normalized:
        return False
    return True


def _validate_packet(
    path: Path,
    packet: dict[str, Any],
    registry_by_id: dict[str, dict[str, Any]],
) -> list[Violation]:
    rel = _repo_rel(path)
    violations: list[Violation] = []

    for field in STRICT_REQUIRED_FIELDS:
        if field not in packet:
            violations.append(Violation(rel, f"missing required field `{field}`"))

    skill_id = _text(packet.get("skillId"))
    if not skill_id:
        violations.append(Violation(rel, "`skillId` is required"))
    if _text(packet.get("canonicalPacketPath")) != rel:
        violations.append(Violation(rel, "`canonicalPacketPath` must match file path"))

    registry_path = _text(packet.get("registryEntryPath"))
    if not _path_is_repo_relative(registry_path):
        violations.append(Violation(rel, "`registryEntryPath` must be repo-relative"))
    elif not (REPO_ROOT / registry_path).is_file():
        violations.append(Violation(rel, f"`registryEntryPath` does not exist: {registry_path}"))

    package_root = _text(packet.get("packageRootPath"))
    if packet.get("runtimeEligibility") == "RUNTIME_PACKAGE_ELIGIBLE":
        if not package_root.startswith("docs/reference/agent_system_skills/packages/"):
            violations.append(Violation(rel, "`packageRootPath` must be an ASSF package path"))
        if not package_root.endswith("/SKILL.md"):
            violations.append(Violation(rel, "`packageRootPath` must point to SKILL.md"))
        if not (REPO_ROOT / package_root).is_file():
            violations.append(Violation(rel, f"`packageRootPath` does not exist: {package_root}"))

    truth_status = _text(packet.get("truthStatus"))
    if truth_status not in ALLOWED_TRUTH_STATUS:
        violations.append(Violation(rel, "`truthStatus` is not allowed"))

    verification_mode = _text(packet.get("verificationMode"))
    if verification_mode not in ALLOWED_VERIFICATION_MODES:
        violations.append(Violation(rel, "`verificationMode` is not allowed"))

    runtime_eligibility = _text(packet.get("runtimeEligibility"))
    if runtime_eligibility not in ALLOWED_RUNTIME_ELIGIBILITY:
        violations.append(Violation(rel, "`runtimeEligibility` is not allowed"))

    registry_entry = registry_by_id.get(skill_id)
    if registry_entry is None:
        violations.append(Violation(rel, f"registry entry missing for `{skill_id}`"))
    else:
        snapshot = packet.get("lifecycleSnapshot")
        if not isinstance(snapshot, dict):
            violations.append(Violation(rel, "`lifecycleSnapshot` must be an object"))
        else:
            for field in (
                "status",
                "uatState",
                "certificationState",
                "internalAgentDisposition",
                "externalCliMcpDisposition",
            ):
                if _text(snapshot.get(field)) != _text(registry_entry.get(field)):
                    violations.append(
                        Violation(rel, f"`lifecycleSnapshot.{field}` does not match registry")
                    )
            if _text(snapshot.get("canonicalRoot")) != _text(registry_entry.get("canonicalRoot")):
                violations.append(
                    Violation(rel, "`lifecycleSnapshot.canonicalRoot` does not match registry")
                )

        if runtime_eligibility == "RUNTIME_PACKAGE_ELIGIBLE":
            if _text(registry_entry.get("status")) not in {"APPROVED", "ACTIVE"}:
                violations.append(
                    Violation(
                        rel,
                        "runtime eligible packet requires registry `status` APPROVED or ACTIVE",
                    )
                )
            requirements = {
                "uatState": "PASSED",
                "certificationState": "CERTIFIED",
                "internalAgentDisposition": "IMPLEMENTED",
            }
            for field, expected in requirements.items():
                if _text(registry_entry.get(field)) != expected:
                    violations.append(
                        Violation(rel, f"runtime eligible packet requires registry `{field}` {expected}")
                    )

    evidence = _as_list(packet.get("evidence"))
    evidence_ids = _ids(evidence, "evidenceId")
    if not evidence:
        violations.append(Violation(rel, "`evidence` must contain at least one record"))
    for item in evidence:
        if not isinstance(item, dict):
            violations.append(Violation(rel, "`evidence` items must be objects"))
            continue
        evidence_id = _text(item.get("evidenceId"))
        if not evidence_id:
            violations.append(Violation(rel, "evidence record missing `evidenceId`"))
        status = _text(item.get("status"))
        if status not in ALLOWED_EVIDENCE_STATUS:
            violations.append(Violation(rel, f"{evidence_id}: evidence status is not allowed"))
        source_path = _text(item.get("sourcePath"))
        if not _path_is_repo_relative(source_path):
            violations.append(Violation(rel, f"{evidence_id}: sourcePath must be repo-relative"))
        elif not (REPO_ROOT / source_path).exists():
            violations.append(Violation(rel, f"{evidence_id}: sourcePath does not exist: {source_path}"))

    labels = _as_list(packet.get("provenanceLabels"))
    if not labels:
        violations.append(Violation(rel, "`provenanceLabels` must contain at least one record"))
    for item in labels:
        if not isinstance(item, dict):
            violations.append(Violation(rel, "`provenanceLabels` items must be objects"))
            continue
        claim_id = _text(item.get("claimId"))
        label = _text(item.get("label"))
        if label not in ALLOWED_PROVENANCE_LABELS:
            violations.append(Violation(rel, f"{claim_id}: provenance label is not allowed"))
        refs = [_text(ref) for ref in _as_list(item.get("sourceEvidenceIds")) if _text(ref)]
        if not refs:
            violations.append(Violation(rel, f"{claim_id}: must reference sourceEvidenceIds"))
        for ref in refs:
            if ref not in evidence_ids:
                violations.append(Violation(rel, f"{claim_id}: unknown evidence reference `{ref}`"))

    obligations = _as_list(packet.get("obligations"))
    obligation_ids = _ids(obligations, "obligationId")
    if not obligations:
        violations.append(Violation(rel, "`obligations` must contain at least one record"))
    for item in obligations:
        if not isinstance(item, dict):
            violations.append(Violation(rel, "`obligations` items must be objects"))
            continue
        obligation_id = _text(item.get("obligationId"))
        strength = _text(item.get("strength"))
        state = _text(item.get("state"))
        if strength not in ALLOWED_OBLIGATION_STRENGTH:
            violations.append(Violation(rel, f"{obligation_id}: obligation strength is not allowed"))
        if state not in ALLOWED_OBLIGATION_STATE:
            violations.append(Violation(rel, f"{obligation_id}: obligation state is not allowed"))

    results = _as_list(packet.get("verificationResults"))
    if not results:
        violations.append(Violation(rel, "`verificationResults` must contain at least one record"))
    for item in results:
        if not isinstance(item, dict):
            violations.append(Violation(rel, "`verificationResults` items must be objects"))
            continue
        result_id = _text(item.get("resultId"))
        status = _text(item.get("status"))
        if status not in ALLOWED_VERIFICATION_STATUS:
            violations.append(Violation(rel, f"{result_id}: verification status is not allowed"))
        for ref in [_text(ref) for ref in _as_list(item.get("obligationIds")) if _text(ref)]:
            if ref not in obligation_ids:
                violations.append(Violation(rel, f"{result_id}: unknown obligation reference `{ref}`"))
        for ref in [_text(ref) for ref in _as_list(item.get("evidenceIds")) if _text(ref)]:
            if ref not in evidence_ids:
                violations.append(Violation(rel, f"{result_id}: unknown evidence reference `{ref}`"))

    receipt = packet.get("receipt")
    if not isinstance(receipt, dict):
        violations.append(Violation(rel, "`receipt` must be an object"))
    else:
        receipt_hash = _text(receipt.get("hash"))
        if not HEX_HASH_RE.match(receipt_hash):
            violations.append(Violation(rel, "`receipt.hash` must be sha256:<64 lowercase hex>"))

    if verification_mode == "STRICT":
        for item in evidence:
            if isinstance(item, dict) and _text(item.get("status")) != "approved":
                violations.append(Violation(rel, "STRICT packet requires approved evidence"))
        for item in obligations:
            if (
                isinstance(item, dict)
                and _text(item.get("strength")) == "HARD"
                and _text(item.get("state")) != "satisfied"
            ):
                violations.append(Violation(rel, "STRICT packet requires satisfied HARD obligations"))
        for item in results:
            if isinstance(item, dict) and _text(item.get("status")) != "pass":
                violations.append(Violation(rel, "STRICT packet requires passing verificationResults"))
        if truth_status != "approved":
            violations.append(Violation(rel, "STRICT packet requires truthStatus approved"))

    return violations


def _expected_index(packets: list[dict[str, Any]]) -> dict[str, Any]:
    entries: list[dict[str, Any]] = []
    for packet in sorted(packets, key=lambda item: _text(item.get("skillId"))):
        receipt = packet.get("receipt") if isinstance(packet.get("receipt"), dict) else {}
        entries.append(
            {
                "canonicalPacketPath": _text(packet.get("canonicalPacketPath")),
                "receiptHash": _text(receipt.get("hash")),
                "runtimeEligibility": _text(packet.get("runtimeEligibility")),
                "skillId": _text(packet.get("skillId")),
                "truthPacketId": _text(packet.get("truthPacketId")),
                "truthStatus": _text(packet.get("truthStatus")),
                "verificationMode": _text(packet.get("verificationMode")),
            }
        )
    return {
        "schemaVersion": "0.1.0",
        "generatedFrom": "docs/reference/agent_system_skills/truth/packets",
        "entries": entries,
    }


def check(
    packets_dir: Path = PACKETS_DIR,
    index_path: Path = INDEX_PATH,
    registry_dir: Path = REGISTRY_DIR,
) -> list[Violation]:
    violations: list[Violation] = []
    registry_by_id = _load_registry_entries(registry_dir)
    packet_paths = sorted(packets_dir.glob("*.json")) if packets_dir.exists() else []
    packets: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    seen_skills: set[str] = set()

    for path in packet_paths:
        rel = _repo_rel(path)
        try:
            packet = _load_json(path)
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            violations.append(Violation(rel, f"packet load failed: {exc}"))
            continue
        packet_id = _text(packet.get("truthPacketId"))
        skill_id = _text(packet.get("skillId"))
        if packet_id in seen_ids:
            violations.append(Violation(rel, f"duplicate truthPacketId `{packet_id}`"))
        if skill_id in seen_skills:
            violations.append(Violation(rel, f"duplicate skillId `{skill_id}`"))
        if packet_id:
            seen_ids.add(packet_id)
        if skill_id:
            seen_skills.add(skill_id)
        packets.append(packet)
        violations.extend(_validate_packet(path, packet, registry_by_id))

    if packet_paths:
        try:
            actual_index = _load_json(index_path)
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            violations.append(Violation(_repo_rel(index_path), f"truth index load failed: {exc}"))
        else:
            expected_index = _expected_index(packets)
            if actual_index != expected_index:
                violations.append(
                    Violation(
                        _repo_rel(index_path),
                        "generated truth index does not match packet sources",
                    )
                )

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check CVF skill truth packets")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    base = args.base or _default_base()
    try:
        changed = changed_files(base, args.head)
    except RuntimeError as exc:
        print(f"SKILL_TRUTH_CHECK_ERROR: {exc}", file=sys.stderr)
        return 2

    violations = check()
    payload = {
        "base": base,
        "head": args.head,
        "changedFiles": changed,
        "packetCount": len(list(PACKETS_DIR.glob("*.json"))) if PACKETS_DIR.exists() else 0,
        "violations": [violation.__dict__ for violation in violations],
    }
    if args.json:
        print(json.dumps(payload, indent=2, sort_keys=True))
    else:
        print("=== CVF Skill Truth Packet Check ===")
        print(f"Base: {base}")
        print(f"Head: {args.head}")
        print(f"Packet count: {payload['packetCount']}")
        if violations:
            print("FAIL")
            for violation in violations:
                print(f"- {violation.path}: {violation.message}")
        else:
            print("PASS")

    if violations and args.enforce:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
