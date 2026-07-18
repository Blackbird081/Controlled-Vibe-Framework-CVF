#!/usr/bin/env python3
"""Production-scoped ASSF package execution adapter."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

try:
    from assf_live_model_selection import AUTO_FREE_QUOTA_MODEL, AUTO_PROVIDER
    from run_assf_active_resolver import INDEX_PATH, REPO_ROOT, TRUTH_INDEX_PATH
    from run_assf_package_use_proof_adapter import (
        DEFAULT_TIMEOUT_SECONDS,
        FREE_QUOTA_LEDGER_PATH,
        LiveCaller,
        build_package_use_proof_packet,
    )
except ModuleNotFoundError:
    from governance.compat.assf_live_model_selection import (
        AUTO_FREE_QUOTA_MODEL,
        AUTO_PROVIDER,
    )
    from governance.compat.run_assf_active_resolver import (
        INDEX_PATH,
        REPO_ROOT,
        TRUTH_INDEX_PATH,
    )
    from governance.compat.run_assf_package_use_proof_adapter import (
        DEFAULT_TIMEOUT_SECONDS,
        FREE_QUOTA_LEDGER_PATH,
        LiveCaller,
        build_package_use_proof_packet,
    )


CONSUMER_INTERNAL = "INTERNAL_AGENT"
CONSUMER_EXTERNAL = "EXTERNAL_AGENT_CLI_MCP"
PRODUCTION_IMPLEMENTATION = "IMPLEMENTED_PRODUCTION_PACKAGE_EXECUTOR"
PRODUCTION_RECEIPT_TYPE = "CVF_ASSF_PRODUCTION_PACKAGE_EXECUTION_RECEIPT"
DRY_RUN_DISPOSITION = "DRY_RUN_PRODUCTION_PACKAGE_EXECUTION_READY"
LIVE_PASS_DISPOSITION = "PRODUCTION_PACKAGE_EXECUTION_PASS"
DENIED_NOT_ACTIVE = "DENIED_PACKAGE_NOT_ACTIVE_SOURCE"
DENIED_EXTERNAL_ADAPTER = "DENIED_EXTERNAL_ADAPTER_NOT_IMPLEMENTED"
DENIED_USE_PROOF = "DENIED_PACKAGE_USE_PROOF_NOT_READY"

CLAIM_BOUNDARY = (
    "This packet is a production-scoped ASSF package execution adapter result. "
    "It requires ACTIVE package source state and receipt-backed package use. "
    "It does not grant filesystem, git, browser, provider, public-sync, or "
    "production action authority beyond the active governed work order."
)


def _load_index(index_path: Path) -> dict[str, Any]:
    raw = json.loads(index_path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("ASSF generated index must be a JSON object")
    return raw


def _skill_entry(index_path: Path, skill_id: str) -> dict[str, Any] | None:
    for entry in _load_index(index_path).get("skills", []):
        if isinstance(entry, dict) and str(entry.get("skillId", "")).strip() == skill_id:
            return entry
    return None


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _upper(value: Any) -> str:
    return _as_text(value).upper()


def _repo_rel(path: Path) -> str:
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def _sha256_json(value: Any) -> str:
    canonical = json.dumps(value, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _source_truth_trace(
    *,
    entry: dict[str, Any],
    use_proof_packet: dict[str, Any] | None = None,
    execution_receipt_id: str | None = None,
) -> dict[str, Any]:
    package_read = use_proof_packet.get("packageRead", {}) if isinstance(use_proof_packet, dict) else {}
    activation = use_proof_packet.get("activationPolicy", {}) if isinstance(use_proof_packet, dict) else {}
    use_receipt = use_proof_packet.get("packageUseProofReceipt", {}) if isinstance(use_proof_packet, dict) else {}
    return {
        "executionReceiptId": execution_receipt_id,
        "packageRootPath": entry.get("canonicalRoot"),
        "policyReceiptId": activation.get("policyDecisionReceiptId"),
        "registryEntryPath": (
            "docs/reference/agent_system_skills/registry/entries/"
            f"{entry.get('skillId')}.json"
        ),
        "skillId": entry.get("skillId"),
        "skillUsageReceiptId": package_read.get("skillUsageReceiptId"),
        "truthPacketPath": (
            "docs/reference/agent_system_skills/truth/packets/"
            f"{entry.get('skillId')}.json"
        ),
        "useProofReceiptId": use_receipt.get("receiptId"),
    }


def _active_source_reasons(entry: dict[str, Any], consumer: str) -> tuple[str, ...]:
    reasons: list[str] = []
    requirements = {
        "status": "ACTIVE",
        "candidateState": "ACTIVE",
        "uatState": "PASSED",
        "certificationState": "CERTIFIED",
        "internalAgentDisposition": "IMPLEMENTED",
    }
    for field, expected in requirements.items():
        if _upper(entry.get(field)) != expected:
            reasons.append(f"{field}_NOT_{expected}")
    if consumer == CONSUMER_EXTERNAL and _upper(entry.get("externalCliMcpDisposition")) != "IMPLEMENTED":
        reasons.append("EXTERNAL_ADAPTER_NOT_IMPLEMENTED")
    return tuple(reasons)


def _execution_receipt(
    *,
    consumer: str,
    entry: dict[str, Any],
    use_proof_packet: dict[str, Any],
) -> dict[str, Any]:
    live_call = use_proof_packet.get("liveCall", {})
    proof_receipt = use_proof_packet.get("packageUseProofReceipt", {})
    material = {
        "authorityBoundary": (
            "receipt proves one ACTIVE source package execution through the "
            "production-scoped adapter; it does not grant action authority "
            "outside the active governed work order"
        ),
        "consumer": consumer,
        "generatedBy": "governance/compat/run_assf_production_package_executor.py",
        "httpStatus": live_call.get("httpStatus"),
        "model": use_proof_packet.get("model"),
        "packageRootPath": entry.get("canonicalRoot"),
        "packageUseProofReceiptId": proof_receipt.get("receiptId"),
        "provider": use_proof_packet.get("provider"),
        "receiptType": PRODUCTION_RECEIPT_TYPE,
        "schemaVersion": "0.1.0",
        "skillId": entry.get("skillId"),
    }
    return {"receiptId": _sha256_json(material), **material}


def build_production_package_execution_packet(
    *,
    index_path: Path = INDEX_PATH,
    truth_index_path: Path = TRUTH_INDEX_PATH,
    repo_root: Path = REPO_ROOT,
    free_quota_ledger_path: Path = FREE_QUOTA_LEDGER_PATH,
    skill_id: str,
    consumer: str = CONSUMER_INTERNAL,
    provider: str = AUTO_PROVIDER,
    model: str = AUTO_FREE_QUOTA_MODEL,
    live: bool = False,
    task_prompt: str | None = None,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    live_caller: LiveCaller | None = None,
) -> dict[str, Any]:
    if consumer not in {CONSUMER_INTERNAL, CONSUMER_EXTERNAL}:
        raise ValueError("consumer must be INTERNAL_AGENT or EXTERNAL_AGENT_CLI_MCP")
    entry = _skill_entry(index_path, skill_id)
    base: dict[str, Any] = {
        "claimBoundary": CLAIM_BOUNDARY,
        "consumer": consumer,
        "executionMode": "LIVE_PROVIDER_EXECUTION" if live else "DRY_RUN_NO_PROVIDER_CALL",
        "productionAdapterImplementation": PRODUCTION_IMPLEMENTATION,
        "skillId": skill_id,
        "sourceMutations": [],
        "sourcePaths": {
            "freeQuotaLedger": _repo_rel(free_quota_ledger_path),
            "packageUseProofAdapter": "governance/compat/run_assf_package_use_proof_adapter.py",
            "productionExecutor": "governance/compat/run_assf_production_package_executor.py",
            "skillIndex": _repo_rel(index_path),
            "truthIndex": _repo_rel(truth_index_path),
        },
    }
    if entry is None:
        base["executionDisposition"] = DENIED_NOT_ACTIVE
        base["diagnostic"] = {
            "class": "PACKAGE_SOURCE_NOT_FOUND",
            "retryable": False,
            "safeMessage": "Skill id is not present in the ASSF generated index.",
            "stage": "active_source_check",
            "userAction": "select one ACTIVE ASSF package skill id",
        }
        return base

    active_reasons = _active_source_reasons(entry, consumer)
    base["activeSourceCheck"] = {
        "candidateState": entry.get("candidateState"),
        "externalCliMcpDisposition": entry.get("externalCliMcpDisposition"),
        "reasons": list(active_reasons),
        "status": entry.get("status"),
    }
    if active_reasons:
        disposition = (
            DENIED_EXTERNAL_ADAPTER
            if "EXTERNAL_ADAPTER_NOT_IMPLEMENTED" in active_reasons
            else DENIED_NOT_ACTIVE
        )
        base["executionDisposition"] = disposition
        base["sourceTruthTrace"] = _source_truth_trace(entry=entry)
        base["diagnostic"] = {
            "class": disposition,
            "retryable": False,
            "safeMessage": "Package source is not active for requested consumer.",
            "stage": "active_source_check",
            "userAction": "promote package source through governed ACTIVE productionization",
        }
        return base

    use_proof_packet = build_package_use_proof_packet(
        index_path=index_path,
        truth_index_path=truth_index_path,
        repo_root=repo_root,
        free_quota_ledger_path=free_quota_ledger_path,
        skill_id=skill_id,
        provider=provider,
        model=model,
        live=live,
        task_prompt=task_prompt,
        timeout_seconds=timeout_seconds,
        live_caller=live_caller,
    )
    base["packageUseProof"] = use_proof_packet
    proof_disposition = str(use_proof_packet.get("executionDisposition", ""))
    if not live and proof_disposition == "DRY_RUN_READY_FOR_LIVE_PROVIDER_USE_PROOF":
        base["executionDisposition"] = DRY_RUN_DISPOSITION
        base["sourceTruthTrace"] = _source_truth_trace(
            entry=entry,
            use_proof_packet=use_proof_packet,
        )
        return base
    if proof_disposition != "LIVE_PROVIDER_USE_PROOF_PASS":
        base["executionDisposition"] = DENIED_USE_PROOF
        base["sourceTruthTrace"] = _source_truth_trace(
            entry=entry,
            use_proof_packet=use_proof_packet,
        )
        base["diagnostic"] = use_proof_packet.get("diagnostic")
        return base

    receipt = _execution_receipt(
        consumer=consumer,
        entry=entry,
        use_proof_packet=use_proof_packet,
    )
    base["executionDisposition"] = LIVE_PASS_DISPOSITION
    base["productionExecutionReceipt"] = receipt
    base["sourceTruthTrace"] = _source_truth_trace(
        entry=entry,
        use_proof_packet=use_proof_packet,
        execution_receipt_id=receipt["receiptId"],
    )
    return base


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run production-scoped ASSF package execution")
    parser.add_argument("--index-path", type=Path, default=INDEX_PATH)
    parser.add_argument("--truth-index-path", type=Path, default=TRUTH_INDEX_PATH)
    parser.add_argument("--repo-root", type=Path, default=REPO_ROOT)
    parser.add_argument("--free-quota-ledger-path", type=Path, default=FREE_QUOTA_LEDGER_PATH)
    parser.add_argument("--skill-id", required=True)
    parser.add_argument("--consumer", default=CONSUMER_INTERNAL)
    parser.add_argument("--provider", default=AUTO_PROVIDER)
    parser.add_argument("--model", default=AUTO_FREE_QUOTA_MODEL)
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--task-prompt", default=None)
    parser.add_argument("--timeout-seconds", type=int, default=DEFAULT_TIMEOUT_SECONDS)
    parser.add_argument("--receipt-out", type=Path, default=None)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    try:
        packet = build_production_package_execution_packet(
            index_path=args.index_path,
            truth_index_path=args.truth_index_path,
            repo_root=args.repo_root,
            free_quota_ledger_path=args.free_quota_ledger_path,
            skill_id=args.skill_id,
            consumer=args.consumer,
            provider=args.provider,
            model=args.model,
            live=args.live,
            task_prompt=args.task_prompt,
            timeout_seconds=args.timeout_seconds,
        )
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(packet, ensure_ascii=True, indent=2))
    else:
        print("ASSF production package executor")
        print(f"Skill: {packet.get('skillId')}")
        print(f"Disposition: {packet.get('executionDisposition')}")
        receipt = packet.get("productionExecutionReceipt")
        if isinstance(receipt, dict):
            print(f"Execution receipt: {receipt.get('receiptId')}")

    if args.receipt_out is not None:
        args.receipt_out.parent.mkdir(parents=True, exist_ok=True)
        args.receipt_out.write_text(
            json.dumps(packet, ensure_ascii=True, indent=2) + "\n",
            encoding="utf-8",
        )
    return 0 if packet.get("executionDisposition") in {DRY_RUN_DISPOSITION, LIVE_PASS_DISPOSITION} else 1


if __name__ == "__main__":
    sys.exit(main())
