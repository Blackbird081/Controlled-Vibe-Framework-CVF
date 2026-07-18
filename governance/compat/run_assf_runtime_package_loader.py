#!/usr/bin/env python3
"""Bounded ASSF runtime package loader.

This helper is the first internal runtime-package surface for CVF ASSF
packages. It reads the generated index, applies selector filters, and returns a
bounded package packet. It opens a package instruction body only when the
caller explicitly requests it and the entry satisfies the runtime eligibility
gate.

Loading a package body never grants authority. The caller's existing work
order, role, lifecycle phase, and tool permissions still control any action.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
INDEX_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "agent_system_skills"
    / "generated"
    / "skill-index.json"
)

CLAIM_BOUNDARY = (
    "This packet is a bounded internal ASSF runtime-package readout. It does "
    "not activate a package, grant authority, run tools, call providers, "
    "implement CLI/MCP adapter behavior, mutate ASSF registry or generated "
    "index sources, commit, push, public-sync, or bypass work-order scope."
)

ELIGIBLE_BODY_DISPOSITION = "LOADED"
NOT_REQUESTED_BODY_DISPOSITION = "NOT_REQUESTED"
DENIED_BODY_DISPOSITION = "NOT_RUNTIME_ELIGIBLE"

_RISK_RANK: dict[str, int] = {"R0": 0, "R1": 1, "R2": 2, "R3": 3}
_TERMINAL_EXCLUDED_STATUSES = {"REJECTED", "RETIRED"}
_DEFAULT_MAX_RESULTS = 20


@dataclass(frozen=True)
class RuntimePackageItem:
    """One bounded package-loader result row."""

    metadata: dict[str, Any]
    runtime_eligible: bool
    ineligibility_reasons: tuple[str, ...]
    package_body_disposition: str
    instruction_body: str | None = None
    skill_usage_receipt: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        payload = dict(self.metadata)
        payload["ineligibilityReasons"] = list(self.ineligibility_reasons)
        payload["packageBodyDisposition"] = self.package_body_disposition
        payload["runtimeEligible"] = self.runtime_eligible
        if self.instruction_body is not None:
            payload["instructionBody"] = self.instruction_body
        if self.skill_usage_receipt is not None:
            payload["skillUsageReceipt"] = self.skill_usage_receipt
        return payload


@dataclass(frozen=True)
class RuntimePackagePacket:
    """Bounded package-loader output. It is not an activation receipt."""

    items: tuple[RuntimePackageItem, ...]
    total_candidates: int
    truncated: bool
    instruction_bodies_requested: bool

    def to_dict(self) -> dict[str, Any]:
        receipts = [
            item.skill_usage_receipt
            for item in self.items
            if item.skill_usage_receipt is not None
        ]
        return {
            "claimBoundary": CLAIM_BOUNDARY,
            "instructionBodiesRequested": self.instruction_bodies_requested,
            "items": [item.to_dict() for item in self.items],
            "skillUsageReceipts": receipts,
            "sourcePath": INDEX_PATH.relative_to(REPO_ROOT).as_posix(),
            "totalCandidates": self.total_candidates,
            "truncated": self.truncated,
        }

    def to_human_text(self) -> str:
        lines = [
            "ASSF runtime package loader",
            f"Instruction bodies requested: {str(self.instruction_bodies_requested).lower()}",
            f"Total candidates: {self.total_candidates}",
            f"Returned items: {len(self.items)}",
            f"Truncated: {str(self.truncated).lower()}",
            f"Claim boundary: {CLAIM_BOUNDARY}",
        ]
        receipts = [
            item.skill_usage_receipt
            for item in self.items
            if item.skill_usage_receipt is not None
        ]
        lines.append(f"Skill usage receipts: {len(receipts)}")
        if not self.items:
            lines.append("No matching package records.")
            return "\n".join(lines)
        lines.append("Items:")
        for item in self.items:
            metadata = item.metadata
            reasons = ",".join(item.ineligibility_reasons) or "none"
            lines.append(
                "- "
                f"{metadata.get('skillId', '<missing skillId>')} | "
                f"eligible={str(item.runtime_eligible).lower()} | "
                f"body={item.package_body_disposition} | "
                f"reasons={reasons}"
            )
            if item.skill_usage_receipt is not None:
                lines.append(
                    "  receipt="
                    f"{item.skill_usage_receipt.get('receiptId', '<missing receiptId>')}"
                )
        return "\n".join(lines)


def _load_index(index_path: Path = INDEX_PATH) -> dict[str, Any]:
    raw = json.loads(index_path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("ASSF generated index must be a JSON object")
    skills = raw.get("skills", [])
    if not isinstance(skills, list):
        raise ValueError("ASSF generated index `skills` must be a list")
    return raw


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _upper(value: Any) -> str:
    return _as_text(value).upper()


def _as_tuple(value: Any) -> tuple[str, ...]:
    if isinstance(value, list):
        return tuple(str(item).strip() for item in value if str(item).strip())
    if isinstance(value, str):
        return tuple(part.strip() for part in value.split(";") if part.strip())
    return ()


def _path_is_repo_relative(value: str) -> bool:
    normalized = value.replace("\\", "/")
    if not normalized or normalized.startswith("/") or normalized.startswith("../"):
        return False
    if "/../" in normalized or normalized.endswith("/.."):
        return False
    if ":" in normalized:
        return False
    return True


def _resolve_package_root(entry: dict[str, Any], repo_root: Path) -> Path | None:
    canonical_root = _as_text(entry.get("canonicalRoot"))
    if not _path_is_repo_relative(canonical_root):
        return None
    normalized = canonical_root.replace("\\", "/")
    if not normalized.startswith("docs/reference/agent_system_skills/packages/"):
        return None
    if not normalized.endswith("/SKILL.md"):
        return None
    return repo_root / normalized


def _runtime_ineligibility_reasons(
    entry: dict[str, Any],
    *,
    repo_root: Path,
) -> tuple[str, ...]:
    reasons: list[str] = []
    if _upper(entry.get("status")) in _TERMINAL_EXCLUDED_STATUSES:
        reasons.append("TERMINAL_STATUS")
    if _upper(entry.get("certificationState")) != "CERTIFIED":
        reasons.append("CERTIFICATION_NOT_CERTIFIED")
    if _upper(entry.get("uatState")) != "PASSED":
        reasons.append("UAT_NOT_PASSED")
    if _upper(entry.get("internalAgentDisposition")) != "IMPLEMENTED":
        reasons.append("INTERNAL_DISPOSITION_NOT_IMPLEMENTED")

    instruction_path = _resolve_package_root(entry, repo_root)
    if instruction_path is None:
        reasons.append("PACKAGE_ROOT_OUT_OF_SCOPE")
    elif not instruction_path.is_file():
        reasons.append("PACKAGE_ROOT_MISSING")
    return tuple(reasons)


def _matches_selector(
    entry: dict[str, Any],
    *,
    skill_id: str | None,
    task_class: str | None,
    role: str | None,
    phase: str | None,
    surface: str | None,
    risk_ceiling: str | None,
) -> bool:
    if skill_id is not None and _as_text(entry.get("skillId")) != skill_id:
        return False
    if task_class is not None and task_class not in _as_tuple(entry.get("taskClasses")):
        return False
    if role is not None and role not in _as_tuple(entry.get("roles")):
        return False
    if phase is not None and phase not in _as_tuple(entry.get("phases")):
        return False
    if surface is not None:
        if not any(surface.lower() in value.lower() for value in _as_tuple(entry.get("surfaces"))):
            return False
    if risk_ceiling is not None:
        ceiling_rank = _RISK_RANK.get(risk_ceiling.upper())
        entry_rank = _RISK_RANK.get(_upper(entry.get("riskProfile")))
        if ceiling_rank is not None and entry_rank is not None and entry_rank > ceiling_rank:
            return False
    return True


def _sort_key(entry: dict[str, Any]) -> tuple[int, str]:
    order = entry.get("compositionOrder", 10**9)
    try:
        numeric_order = int(order)
    except (TypeError, ValueError):
        numeric_order = 10**9
    return (numeric_order, _as_text(entry.get("skillId")))


def _metadata_item(entry: dict[str, Any]) -> dict[str, Any]:
    fields = (
        "skillId",
        "name",
        "version",
        "status",
        "canonicalRoot",
        "riskProfile",
        "riskCeiling",
        "authorityCeiling",
        "candidateState",
        "approvalState",
        "uatState",
        "certificationState",
        "internalAgentDisposition",
        "externalCliMcpDisposition",
        "capabilityBoundary",
        "useWhen",
        "doNotUseWhen",
    )
    return {field: entry[field] for field in fields if field in entry}


def _sha256_text(value: str) -> str:
    return "sha256:" + hashlib.sha256(value.encode("utf-8")).hexdigest()


def _build_skill_usage_receipt(
    *,
    entry: dict[str, Any],
    instruction_body: str,
    instruction_path: Path,
    repo_root: Path,
    index_path: Path,
) -> dict[str, Any]:
    package_root = instruction_path.relative_to(repo_root).as_posix()
    body_hash = _sha256_text(instruction_body)
    material = {
        "authorityBoundary": (
            "receipt proves an explicit eligible package body read only; it "
            "does not grant authority, activate the package, call providers, "
            "or bypass governed work-order scope"
        ),
        "bodyHash": body_hash,
        "generatedBy": "governance/compat/run_assf_runtime_package_loader.py",
        "packageBodyDisposition": ELIGIBLE_BODY_DISPOSITION,
        "packageRootPath": package_root,
        "receiptType": "CVF_ASSF_SKILL_USAGE_RECEIPT",
        "schemaVersion": "0.1.0",
        "skillId": _as_text(entry.get("skillId")),
        "sourceIndexPath": index_path.relative_to(repo_root).as_posix(),
    }
    canonical = json.dumps(material, sort_keys=True, separators=(",", ":"))
    return {"receiptId": _sha256_text(canonical), **material}


def build_runtime_package_packet(
    *,
    index_path: Path = INDEX_PATH,
    repo_root: Path = REPO_ROOT,
    skill_id: str | None = None,
    task_class: str | None = None,
    role: str | None = None,
    phase: str | None = None,
    surface: str | None = None,
    risk_ceiling: str | None = None,
    max_results: int = _DEFAULT_MAX_RESULTS,
    include_instruction_bodies: bool = False,
) -> RuntimePackagePacket:
    """Build a bounded ASSF runtime package packet from generated metadata."""
    if max_results <= 0:
        raise ValueError("max_results must be a positive integer")
    if risk_ceiling is not None and risk_ceiling.upper() not in _RISK_RANK:
        raise ValueError("risk_ceiling must be one of R0, R1, R2, or R3")

    raw = _load_index(index_path)
    skills = [item for item in raw.get("skills", []) if isinstance(item, dict)]
    skills = [
        item
        for item in skills
        if _matches_selector(
            item,
            skill_id=skill_id,
            task_class=task_class,
            role=role,
            phase=phase,
            surface=surface,
            risk_ceiling=risk_ceiling,
        )
    ]
    skills.sort(key=_sort_key)

    total_candidates = len(skills)
    bounded = skills[:max_results]
    items: list[RuntimePackageItem] = []
    for entry in bounded:
        reasons = _runtime_ineligibility_reasons(entry, repo_root=repo_root)
        eligible = not reasons
        body: str | None = None
        receipt: dict[str, Any] | None = None
        disposition = NOT_REQUESTED_BODY_DISPOSITION
        if include_instruction_bodies:
            if eligible:
                instruction_path = _resolve_package_root(entry, repo_root)
                if instruction_path is None:
                    disposition = DENIED_BODY_DISPOSITION
                else:
                    body = instruction_path.read_text(encoding="utf-8")
                    disposition = ELIGIBLE_BODY_DISPOSITION
                    receipt = _build_skill_usage_receipt(
                        entry=entry,
                        instruction_body=body,
                        instruction_path=instruction_path,
                        repo_root=repo_root,
                        index_path=index_path,
                    )
            else:
                disposition = DENIED_BODY_DISPOSITION
        items.append(
            RuntimePackageItem(
                metadata=_metadata_item(entry),
                runtime_eligible=eligible,
                ineligibility_reasons=reasons,
                package_body_disposition=disposition,
                instruction_body=body,
                skill_usage_receipt=receipt,
            )
        )

    return RuntimePackagePacket(
        items=tuple(items),
        total_candidates=total_candidates,
        truncated=total_candidates > max_results,
        instruction_bodies_requested=include_instruction_bodies,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Build a bounded ASSF runtime package packet from generated "
            "metadata. Instruction bodies are denied unless explicitly "
            "requested and the package passes the runtime eligibility gate."
        )
    )
    parser.add_argument("--index-path", type=Path, default=INDEX_PATH)
    parser.add_argument("--repo-root", type=Path, default=REPO_ROOT)
    parser.add_argument("--skill-id", default=None)
    parser.add_argument("--task-class", default=None)
    parser.add_argument("--role", default=None)
    parser.add_argument("--phase", default=None)
    parser.add_argument("--surface", default=None)
    parser.add_argument("--risk-ceiling", default=None)
    parser.add_argument("--max-results", type=int, default=_DEFAULT_MAX_RESULTS)
    parser.add_argument(
        "--include-instruction-bodies",
        action="store_true",
        help="Open eligible package SKILL.md bodies after lifecycle gates pass",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON output")
    parser.add_argument(
        "--receipt-out",
        type=Path,
        default=None,
        help="Write skill usage receipts to a JSON file when bodies are loaded",
    )
    args = parser.parse_args(argv)

    try:
        packet = build_runtime_package_packet(
            index_path=args.index_path,
            repo_root=args.repo_root,
            skill_id=args.skill_id,
            task_class=args.task_class,
            role=args.role,
            phase=args.phase,
            surface=args.surface,
            risk_ceiling=args.risk_ceiling,
            max_results=args.max_results,
            include_instruction_bodies=args.include_instruction_bodies,
        )
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(packet.to_dict(), ensure_ascii=False, indent=2))
    else:
        print(packet.to_human_text())
    if args.receipt_out is not None:
        args.receipt_out.write_text(
            json.dumps(
                {
                    "claimBoundary": CLAIM_BOUNDARY,
                    "skillUsageReceipts": packet.to_dict()["skillUsageReceipts"],
                },
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
