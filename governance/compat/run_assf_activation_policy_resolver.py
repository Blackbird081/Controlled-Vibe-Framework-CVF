#!/usr/bin/env python3
"""ASSF activation policy semantics resolver.

This helper classifies the controlled progression from metadata selection to
receipt-backed package use. It does not open package instruction bodies. Body
reads remain owned by ``run_assf_runtime_package_loader.py`` and package use
requires a matching ``CVF_ASSF_SKILL_USAGE_RECEIPT``.
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
    from run_assf_active_resolver import (
        CLAIM_BOUNDARY as ACTIVE_RESOLVER_CLAIM_BOUNDARY,
        CONSUMER_INTERNAL,
        INDEX_PATH,
        READY_DECISION,
        REPO_ROOT,
        TRUTH_INDEX_PATH,
        build_active_resolver_packet,
    )
except ModuleNotFoundError:
    from governance.compat.run_assf_active_resolver import (
        CLAIM_BOUNDARY as ACTIVE_RESOLVER_CLAIM_BOUNDARY,
        CONSUMER_INTERNAL,
        INDEX_PATH,
        READY_DECISION,
        REPO_ROOT,
        TRUTH_INDEX_PATH,
        build_active_resolver_packet,
    )


CLAIM_BOUNDARY = (
    "This packet classifies ASSF activation policy semantics only. It does "
    "not load package instruction bodies, create skill usage receipts, grant "
    "authority, activate lifecycle state, call providers, implement CLI/MCP "
    "adapter behavior, mutate ASSF registry/index/truth sources, commit, "
    "push, public-sync, or bypass work-order scope."
)

STATE_SELECTED = "SELECTED"
STATE_ACTIVATION_READY = "ACTIVATION_READY"
STATE_BODY_READ_REQUESTED = "BODY_READ_REQUESTED"
STATE_USED_WITH_RECEIPT = "USED_WITH_RECEIPT"
STATE_BODY_READ_DENIED = "BODY_READ_DENIED"
STATE_USED_WITHOUT_RECEIPT_DENIED = "USED_WITHOUT_RECEIPT_DENIED"

USAGE_RECEIPT_TYPE = "CVF_ASSF_SKILL_USAGE_RECEIPT"
POLICY_RECEIPT_TYPE = "CVF_ASSF_ACTIVATION_POLICY_DECISION_RECEIPT"

_DEFAULT_MAX_RESULTS = 20


@dataclass(frozen=True)
class ActivationPolicyItem:
    """One activation policy state row."""

    selected_item: dict[str, Any]
    policy_state: str
    policy_reasons: tuple[str, ...]
    activation_ready: bool
    body_read_requested: bool
    body_read_allowed: bool
    output_consumed: bool
    used_with_receipt: bool
    matched_usage_receipt_ids: tuple[str, ...]
    policy_receipt: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        payload = dict(self.selected_item)
        payload["activationPolicyState"] = self.policy_state
        payload["activationReady"] = self.activation_ready
        payload["bodyReadAllowed"] = self.body_read_allowed
        payload["bodyReadRequested"] = self.body_read_requested
        payload["matchedUsageReceiptIds"] = list(self.matched_usage_receipt_ids)
        payload["outputConsumed"] = self.output_consumed
        payload["policyReasons"] = list(self.policy_reasons)
        payload["policyDecisionReceipt"] = self.policy_receipt
        payload["usedWithReceipt"] = self.used_with_receipt
        return payload


@dataclass(frozen=True)
class ActivationPolicyPacket:
    """Bounded activation policy output. It is not a package body receipt."""

    consumer: str
    items: tuple[ActivationPolicyItem, ...]
    total_candidates: int
    truncated: bool
    body_read_requested: bool
    output_consumed: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "claimBoundary": CLAIM_BOUNDARY,
            "activeResolverClaimBoundary": ACTIVE_RESOLVER_CLAIM_BOUNDARY,
            "bodyReadRequested": self.body_read_requested,
            "consumer": self.consumer,
            "items": [item.to_dict() for item in self.items],
            "outputConsumed": self.output_consumed,
            "policyDecisionReceipts": [
                item.policy_receipt for item in self.items
            ],
            "sourcePaths": {
                "activeResolver": "governance/compat/run_assf_active_resolver.py",
                "runtimePackageLoader": (
                    "governance/compat/run_assf_runtime_package_loader.py"
                ),
                "skillIndex": INDEX_PATH.relative_to(REPO_ROOT).as_posix(),
                "truthIndex": TRUTH_INDEX_PATH.relative_to(REPO_ROOT).as_posix(),
            },
            "totalCandidates": self.total_candidates,
            "truncated": self.truncated,
        }

    def to_human_text(self) -> str:
        lines = [
            "ASSF activation policy resolver",
            f"Consumer: {self.consumer}",
            f"Body read requested: {str(self.body_read_requested).lower()}",
            f"Output consumed: {str(self.output_consumed).lower()}",
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
                f"{item.selected_item.get('skillId', '<missing skillId>')} | "
                f"policy={item.policy_state} | "
                f"reasons={','.join(item.policy_reasons) or 'none'}"
            )
        return "\n".join(lines)


def _sha256_json(value: dict[str, Any]) -> str:
    canonical = json.dumps(value, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _as_receipt_list(value: Any) -> list[dict[str, Any]]:
    receipts: list[dict[str, Any]] = []
    if isinstance(value, list):
        for item in value:
            receipts.extend(_as_receipt_list(item))
    elif isinstance(value, dict):
        if value.get("receiptType") == USAGE_RECEIPT_TYPE:
            receipts.append(value)
        for key in ("skillUsageReceipts", "items"):
            if key in value:
                receipts.extend(_as_receipt_list(value[key]))
        if "skillUsageReceipt" in value:
            receipts.extend(_as_receipt_list(value["skillUsageReceipt"]))
    return receipts


def _load_usage_receipts(path: Path | None) -> tuple[dict[str, Any], ...]:
    if path is None:
        return ()
    raw = json.loads(path.read_text(encoding="utf-8"))
    return tuple(_as_receipt_list(raw))


def _matching_receipt_ids(
    *,
    skill_id: str,
    usage_receipts: tuple[dict[str, Any], ...],
) -> tuple[str, ...]:
    matched: list[str] = []
    for receipt in usage_receipts:
        if receipt.get("receiptType") != USAGE_RECEIPT_TYPE:
            continue
        if str(receipt.get("skillId", "")).strip() != skill_id:
            continue
        if str(receipt.get("packageBodyDisposition", "")).upper() != "LOADED":
            continue
        receipt_id = str(receipt.get("receiptId", "")).strip()
        if receipt_id.startswith("sha256:"):
            matched.append(receipt_id)
    return tuple(matched)


def _state_for(
    *,
    activation_ready: bool,
    body_read_requested: bool,
    output_consumed: bool,
    matched_usage_receipt_ids: tuple[str, ...],
) -> tuple[str, tuple[str, ...]]:
    if output_consumed:
        if matched_usage_receipt_ids:
            return (STATE_USED_WITH_RECEIPT, ())
        return (
            STATE_USED_WITHOUT_RECEIPT_DENIED,
            ("OUTPUT_CONSUMED_WITHOUT_MATCHING_SKILL_USAGE_RECEIPT",),
        )
    if body_read_requested:
        if activation_ready:
            return (STATE_BODY_READ_REQUESTED, ())
        return (
            STATE_BODY_READ_DENIED,
            ("BODY_READ_REQUIRES_ACTIVATION_READY_DECISION",),
        )
    if activation_ready:
        return (STATE_ACTIVATION_READY, ())
    return (STATE_SELECTED, ("SELECTED_METADATA_NOT_ACTIVATION_READY",))


def _policy_receipt_for(
    *,
    skill_id: str,
    activation_policy_state: str,
    policy_reasons: tuple[str, ...],
    activation_decision: str,
    body_read_requested: bool,
    output_consumed: bool,
    matched_usage_receipt_ids: tuple[str, ...],
) -> dict[str, Any]:
    material = {
        "activationDecision": activation_decision,
        "activationPolicyState": activation_policy_state,
        "authorityBoundary": (
            "policy receipt proves classification of selected/ready/body-read/"
            "used-with-receipt semantics only; it does not grant authority, "
            "activate a package, load a package body, call providers, or "
            "bypass governed work-order scope"
        ),
        "bodyReadRequested": body_read_requested,
        "generatedBy": "governance/compat/run_assf_activation_policy_resolver.py",
        "matchedUsageReceiptIds": list(matched_usage_receipt_ids),
        "outputConsumed": output_consumed,
        "policyReasons": list(policy_reasons),
        "receiptType": POLICY_RECEIPT_TYPE,
        "schemaVersion": "0.1.0",
        "skillId": skill_id,
    }
    return {"receiptId": _sha256_json(material), **material}


def build_activation_policy_packet(
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
    body_read_requested: bool = False,
    output_consumed: bool = False,
    usage_receipts: tuple[dict[str, Any], ...] = (),
) -> ActivationPolicyPacket:
    """Classify ASSF activation semantics without opening package bodies."""
    active_packet = build_active_resolver_packet(
        index_path=index_path,
        truth_index_path=truth_index_path,
        repo_root=repo_root,
        consumer=consumer,
        skill_id=skill_id,
        task_class=task_class,
        role=role,
        phase=phase,
        surface=surface,
        risk_ceiling=risk_ceiling,
        max_results=max_results,
    )

    items: list[ActivationPolicyItem] = []
    for active_item in active_packet.items:
        selected = active_item.to_dict()
        item_skill_id = str(selected.get("skillId", "")).strip()
        activation_ready = selected.get("activationDecision") == READY_DECISION
        matched_ids = _matching_receipt_ids(
            skill_id=item_skill_id,
            usage_receipts=usage_receipts,
        )
        state, reasons = _state_for(
            activation_ready=activation_ready,
            body_read_requested=body_read_requested,
            output_consumed=output_consumed,
            matched_usage_receipt_ids=matched_ids,
        )
        receipt = _policy_receipt_for(
            skill_id=item_skill_id,
            activation_policy_state=state,
            policy_reasons=reasons,
            activation_decision=str(selected.get("activationDecision", "")),
            body_read_requested=body_read_requested,
            output_consumed=output_consumed,
            matched_usage_receipt_ids=matched_ids,
        )
        items.append(
            ActivationPolicyItem(
                selected_item=selected,
                policy_state=state,
                policy_reasons=reasons,
                activation_ready=activation_ready,
                body_read_requested=body_read_requested,
                body_read_allowed=activation_ready,
                output_consumed=output_consumed,
                used_with_receipt=state == STATE_USED_WITH_RECEIPT,
                matched_usage_receipt_ids=matched_ids,
                policy_receipt=receipt,
            )
        )

    return ActivationPolicyPacket(
        consumer=active_packet.consumer,
        items=tuple(items),
        total_candidates=active_packet.total_candidates,
        truncated=active_packet.truncated,
        body_read_requested=body_read_requested,
        output_consumed=output_consumed,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Classify ASSF activation policy semantics. This does not open "
            "package bodies; use the runtime package loader for body reads."
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
    parser.add_argument("--body-read-requested", action="store_true")
    parser.add_argument("--output-consumed", action="store_true")
    parser.add_argument(
        "--usage-receipt-json",
        type=Path,
        default=None,
        help="JSON file containing skillUsageReceipts evidence from the loader",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON output")
    args = parser.parse_args(argv)

    try:
        usage_receipts = _load_usage_receipts(args.usage_receipt_json)
        packet = build_activation_policy_packet(
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
            body_read_requested=args.body_read_requested,
            output_consumed=args.output_consumed,
            usage_receipts=usage_receipts,
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
