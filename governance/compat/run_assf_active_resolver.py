#!/usr/bin/env python3
"""Read-only ASSF ACTIVE resolver decision layer.

This helper sits between the metadata resolver and the runtime package loader.
It reads generated ASSF metadata plus the generated skill truth index, applies
the existing runtime eligibility gate through the loader, and returns a
deterministic activation-readiness decision.

It never opens package instruction bodies, never calls providers, never mutates
registry/index/truth sources, and never implements CLI/MCP adapter behavior.
An ``ACTIVATION_READY`` decision only means the caller may explicitly invoke
the runtime package loader for a body read, which then emits the skill usage
receipt required by SKUSE-T1.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    from run_assf_runtime_package_loader import (
        INDEX_PATH,
        REPO_ROOT,
        build_runtime_package_packet,
    )
except ModuleNotFoundError:
    from governance.compat.run_assf_runtime_package_loader import (
        INDEX_PATH,
        REPO_ROOT,
        build_runtime_package_packet,
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

CLAIM_BOUNDARY = (
    "This packet is a read-only ASSF activation-readiness decision. It does "
    "not load package instruction bodies, emit a skill usage receipt, grant "
    "authority, call providers, implement CLI/MCP adapter behavior, mutate "
    "ASSF registry/index/truth sources, commit, push, public-sync, or bypass "
    "work-order scope."
)

READY_DECISION = "ACTIVATION_READY"
DENIED_NOT_RUNTIME_ELIGIBLE = "DENIED_NOT_RUNTIME_ELIGIBLE"
DENIED_MISSING_TRUTH_PACKET = "DENIED_MISSING_TRUTH_PACKET"
DENIED_TRUTH_NOT_APPROVED = "DENIED_TRUTH_NOT_APPROVED"
DENIED_EXTERNAL_ADAPTER_NOT_IMPLEMENTED = "DENIED_EXTERNAL_ADAPTER_NOT_IMPLEMENTED"

CONSUMER_INTERNAL = "INTERNAL_AGENT"
CONSUMER_EXTERNAL = "EXTERNAL_AGENT_CLI_MCP"
_CONSUMERS = {CONSUMER_INTERNAL, CONSUMER_EXTERNAL}

_DEFAULT_MAX_RESULTS = 20


@dataclass(frozen=True)
class ActiveResolverItem:
    """One activation-readiness decision row."""

    metadata: dict[str, Any]
    activation_decision: str
    decision_reasons: tuple[str, ...]
    runtime_eligible: bool
    runtime_ineligibility_reasons: tuple[str, ...]
    truth: dict[str, Any] | None
    loader_command: str | None
    resolver_receipt: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        payload = dict(self.metadata)
        payload["activationDecision"] = self.activation_decision
        payload["decisionReasons"] = list(self.decision_reasons)
        payload["loaderCommand"] = self.loader_command
        payload["packageBodyReceiptRequired"] = self.activation_decision == READY_DECISION
        payload["resolverDecisionReceipt"] = self.resolver_receipt
        payload["runtimeEligible"] = self.runtime_eligible
        payload["runtimeIneligibilityReasons"] = list(self.runtime_ineligibility_reasons)
        if self.truth is not None:
            payload["truth"] = self.truth
        return payload


@dataclass(frozen=True)
class ActiveResolverPacket:
    """Bounded ACTIVE resolver output. It is not a package use receipt."""

    consumer: str
    items: tuple[ActiveResolverItem, ...]
    total_candidates: int
    truncated: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "claimBoundary": CLAIM_BOUNDARY,
            "consumer": self.consumer,
            "items": [item.to_dict() for item in self.items],
            "resolverDecisionReceipts": [
                item.resolver_receipt for item in self.items
            ],
            "sourcePaths": {
                "skillIndex": INDEX_PATH.relative_to(REPO_ROOT).as_posix(),
                "truthIndex": TRUTH_INDEX_PATH.relative_to(REPO_ROOT).as_posix(),
            },
            "totalCandidates": self.total_candidates,
            "truncated": self.truncated,
        }

    def to_human_text(self) -> str:
        lines = [
            "ASSF ACTIVE resolver",
            f"Consumer: {self.consumer}",
            f"Total candidates: {self.total_candidates}",
            f"Returned items: {len(self.items)}",
            f"Truncated: {str(self.truncated).lower()}",
            f"Claim boundary: {CLAIM_BOUNDARY}",
        ]
        if not self.items:
            lines.append("No matching package records.")
            return "\n".join(lines)
        lines.append("Items:")
        for item in self.items:
            lines.append(
                "- "
                f"{item.metadata.get('skillId', '<missing skillId>')} | "
                f"decision={item.activation_decision} | "
                f"reasons={','.join(item.decision_reasons) or 'none'}"
            )
        return "\n".join(lines)


def _sha256_json(value: dict[str, Any]) -> str:
    canonical = json.dumps(value, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _load_truth_index(truth_index_path: Path = TRUTH_INDEX_PATH) -> dict[str, dict[str, Any]]:
    raw = json.loads(truth_index_path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("ASSF skill truth index must be a JSON object")
    entries = raw.get("entries", [])
    if not isinstance(entries, list):
        raise ValueError("ASSF skill truth index `entries` must be a list")
    truth_by_skill: dict[str, dict[str, Any]] = {}
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        skill_id = str(entry.get("skillId", "")).strip()
        if skill_id:
            truth_by_skill[skill_id] = entry
    return truth_by_skill


def _truth_reasons(truth: dict[str, Any] | None) -> tuple[str, ...]:
    if truth is None:
        return (DENIED_MISSING_TRUTH_PACKET,)
    reasons: list[str] = []
    if str(truth.get("truthStatus", "")).lower() != "approved":
        reasons.append("TRUTH_STATUS_NOT_APPROVED")
    if str(truth.get("verificationMode", "")).upper() != "STRICT":
        reasons.append("TRUTH_VERIFICATION_NOT_STRICT")
    if str(truth.get("runtimeEligibility", "")).upper() != "RUNTIME_PACKAGE_ELIGIBLE":
        reasons.append("TRUTH_NOT_RUNTIME_PACKAGE_ELIGIBLE")
    return tuple(reasons)


def _loader_command(skill_id: str) -> str:
    return (
        "python governance/compat/run_assf_runtime_package_loader.py "
        f"--skill-id {skill_id} --include-instruction-bodies --json"
    )


def _decision_for(
    *,
    consumer: str,
    runtime_eligible: bool,
    runtime_reasons: tuple[str, ...],
    truth: dict[str, Any] | None,
) -> tuple[str, tuple[str, ...]]:
    if consumer == CONSUMER_EXTERNAL:
        return (
            DENIED_EXTERNAL_ADAPTER_NOT_IMPLEMENTED,
            ("EXTERNAL_ADAPTER_NOT_IMPLEMENTED",),
        )
    truth_reasons = _truth_reasons(truth)
    if truth_reasons:
        decision = (
            DENIED_MISSING_TRUTH_PACKET
            if truth_reasons == (DENIED_MISSING_TRUTH_PACKET,)
            else DENIED_TRUTH_NOT_APPROVED
        )
        return (decision, truth_reasons)
    if not runtime_eligible:
        return (DENIED_NOT_RUNTIME_ELIGIBLE, runtime_reasons)
    return (READY_DECISION, ())


def _receipt_for(
    *,
    skill_id: str,
    consumer: str,
    activation_decision: str,
    decision_reasons: tuple[str, ...],
    truth: dict[str, Any] | None,
) -> dict[str, Any]:
    material = {
        "activationDecision": activation_decision,
        "authorityBoundary": (
            "resolver receipt proves a metadata/truth readiness decision only; "
            "it does not grant authority, activate the package, load a package "
            "body, call providers, or bypass governed work-order scope"
        ),
        "consumer": consumer,
        "decisionReasons": list(decision_reasons),
        "generatedBy": "governance/compat/run_assf_active_resolver.py",
        "receiptType": "CVF_ASSF_ACTIVE_RESOLVER_DECISION_RECEIPT",
        "schemaVersion": "0.1.0",
        "skillId": skill_id,
        "truthReceiptHash": None if truth is None else truth.get("receiptHash"),
    }
    return {"receiptId": _sha256_json(material), **material}


def build_active_resolver_packet(
    *,
    index_path: Path = INDEX_PATH,
    truth_index_path: Path = TRUTH_INDEX_PATH,
    repo_root: Path = REPO_ROOT,
    consumer: str = CONSUMER_INTERNAL,
    skill_id: str | None = None,
    task_class: str | None = None,
    role: str | None = None,
    phase: str | None = None,
    surface: str | None = None,
    risk_ceiling: str | None = None,
    max_results: int = _DEFAULT_MAX_RESULTS,
) -> ActiveResolverPacket:
    """Build a bounded activation-readiness packet without body reads."""
    consumer = consumer.upper()
    if consumer not in _CONSUMERS:
        raise ValueError("consumer must be INTERNAL_AGENT or EXTERNAL_AGENT_CLI_MCP")
    if max_results <= 0:
        raise ValueError("max_results must be a positive integer")

    runtime_packet = build_runtime_package_packet(
        index_path=index_path,
        repo_root=repo_root,
        skill_id=skill_id,
        task_class=task_class,
        role=role,
        phase=phase,
        surface=surface,
        risk_ceiling=risk_ceiling,
        max_results=max_results,
        include_instruction_bodies=False,
    )
    truth_by_skill = _load_truth_index(truth_index_path)

    items: list[ActiveResolverItem] = []
    for runtime_item in runtime_packet.items:
        metadata = runtime_item.metadata
        item_skill_id = str(metadata.get("skillId", "")).strip()
        truth = truth_by_skill.get(item_skill_id)
        decision, reasons = _decision_for(
            consumer=consumer,
            runtime_eligible=runtime_item.runtime_eligible,
            runtime_reasons=runtime_item.ineligibility_reasons,
            truth=truth,
        )
        receipt = _receipt_for(
            skill_id=item_skill_id,
            consumer=consumer,
            activation_decision=decision,
            decision_reasons=reasons,
            truth=truth,
        )
        items.append(
            ActiveResolverItem(
                metadata=metadata,
                activation_decision=decision,
                decision_reasons=reasons,
                runtime_eligible=runtime_item.runtime_eligible,
                runtime_ineligibility_reasons=runtime_item.ineligibility_reasons,
                truth=truth,
                loader_command=_loader_command(item_skill_id)
                if decision == READY_DECISION
                else None,
                resolver_receipt=receipt,
            )
        )

    return ActiveResolverPacket(
        consumer=consumer,
        items=tuple(items),
        total_candidates=runtime_packet.total_candidates,
        truncated=runtime_packet.truncated,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Build a read-only ASSF activation-readiness decision packet. "
            "This is not package body loading and not a CLI/MCP adapter."
        )
    )
    parser.add_argument("--index-path", type=Path, default=INDEX_PATH)
    parser.add_argument("--truth-index-path", type=Path, default=TRUTH_INDEX_PATH)
    parser.add_argument("--repo-root", type=Path, default=REPO_ROOT)
    parser.add_argument("--consumer", default=CONSUMER_INTERNAL)
    parser.add_argument("--skill-id", default=None)
    parser.add_argument("--task-class", default=None)
    parser.add_argument("--role", default=None)
    parser.add_argument("--phase", default=None)
    parser.add_argument("--surface", default=None)
    parser.add_argument("--risk-ceiling", default=None)
    parser.add_argument("--max-results", type=int, default=_DEFAULT_MAX_RESULTS)
    parser.add_argument("--json", action="store_true", help="Emit JSON output")
    args = parser.parse_args(argv)

    try:
        packet = build_active_resolver_packet(
            index_path=args.index_path,
            truth_index_path=args.truth_index_path,
            repo_root=args.repo_root,
            consumer=args.consumer,
            skill_id=args.skill_id,
            task_class=args.task_class,
            role=args.role,
            phase=args.phase,
            surface=args.surface,
            risk_ceiling=args.risk_ceiling,
            max_results=args.max_results,
        )
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(packet.to_dict(), ensure_ascii=False, indent=2))
    else:
        print(packet.to_human_text())
    return 0


if __name__ == "__main__":
    sys.exit(main())
