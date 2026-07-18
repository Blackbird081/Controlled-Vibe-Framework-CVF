#!/usr/bin/env python3
"""CLI/MCP-facing wrapper for production ASSF package execution."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

try:
    from assf_live_model_selection import AUTO_FREE_QUOTA_MODEL, AUTO_PROVIDER
    from run_assf_active_resolver import INDEX_PATH, REPO_ROOT, TRUTH_INDEX_PATH
    from run_assf_package_use_proof_adapter import DEFAULT_TIMEOUT_SECONDS, FREE_QUOTA_LEDGER_PATH
    from run_assf_production_package_executor import (
        CONSUMER_EXTERNAL,
        DRY_RUN_DISPOSITION,
        LIVE_PASS_DISPOSITION,
        build_production_package_execution_packet,
    )
except ModuleNotFoundError:
    from governance.compat.assf_live_model_selection import AUTO_FREE_QUOTA_MODEL, AUTO_PROVIDER
    from governance.compat.run_assf_active_resolver import INDEX_PATH, REPO_ROOT, TRUTH_INDEX_PATH
    from governance.compat.run_assf_package_use_proof_adapter import (
        DEFAULT_TIMEOUT_SECONDS,
        FREE_QUOTA_LEDGER_PATH,
    )
    from governance.compat.run_assf_production_package_executor import (
        CONSUMER_EXTERNAL,
        DRY_RUN_DISPOSITION,
        LIVE_PASS_DISPOSITION,
        build_production_package_execution_packet,
    )


ADAPTER_IMPLEMENTATION = "IMPLEMENTED_PRODUCTION_CLI_MCP_PACKAGE_ADAPTER"
CLAIM_BOUNDARY = (
    "This packet is a CLI/MCP-facing envelope for production ASSF package "
    "execution. It delegates to the production package executor and exposes "
    "receipt and trace fields for audit. It is not a daemon, MCP server, "
    "public API, provider router, or authority grant outside the active "
    "governed work order."
)


def build_cli_mcp_execution_envelope(
    *,
    index_path: Path = INDEX_PATH,
    truth_index_path: Path = TRUTH_INDEX_PATH,
    repo_root: Path = REPO_ROOT,
    free_quota_ledger_path: Path = FREE_QUOTA_LEDGER_PATH,
    skill_id: str,
    request_id: str,
    provider: str = AUTO_PROVIDER,
    model: str = AUTO_FREE_QUOTA_MODEL,
    live: bool = False,
    task_prompt: str | None = None,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    live_caller: Any = None,
) -> dict[str, Any]:
    execution = build_production_package_execution_packet(
        index_path=index_path,
        truth_index_path=truth_index_path,
        repo_root=repo_root,
        free_quota_ledger_path=free_quota_ledger_path,
        skill_id=skill_id,
        consumer=CONSUMER_EXTERNAL,
        provider=provider,
        model=model,
        live=live,
        task_prompt=task_prompt,
        timeout_seconds=timeout_seconds,
        live_caller=live_caller,
    )
    return {
        "adapterImplementation": ADAPTER_IMPLEMENTATION,
        "claimBoundary": CLAIM_BOUNDARY,
        "consumer": CONSUMER_EXTERNAL,
        "executionDisposition": execution.get("executionDisposition"),
        "executionReceiptId": (
            execution.get("productionExecutionReceipt", {}).get("receiptId")
            if isinstance(execution.get("productionExecutionReceipt"), dict)
            else None
        ),
        "executionResult": execution,
        "requestId": request_id,
        "skillId": skill_id,
        "sourceTruthTrace": execution.get("sourceTruthTrace"),
        "success": execution.get("executionDisposition") == LIVE_PASS_DISPOSITION,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run the ASSF production CLI/MCP package adapter")
    parser.add_argument("--index-path", type=Path, default=INDEX_PATH)
    parser.add_argument("--truth-index-path", type=Path, default=TRUTH_INDEX_PATH)
    parser.add_argument("--repo-root", type=Path, default=REPO_ROOT)
    parser.add_argument("--free-quota-ledger-path", type=Path, default=FREE_QUOTA_LEDGER_PATH)
    parser.add_argument("--skill-id", required=True)
    parser.add_argument("--request-id", default="assf-production-cli-mcp-request")
    parser.add_argument("--provider", default=AUTO_PROVIDER)
    parser.add_argument("--model", default=AUTO_FREE_QUOTA_MODEL)
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--task-prompt", default=None)
    parser.add_argument("--timeout-seconds", type=int, default=DEFAULT_TIMEOUT_SECONDS)
    parser.add_argument("--receipt-out", type=Path, default=None)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    try:
        envelope = build_cli_mcp_execution_envelope(
            index_path=args.index_path,
            truth_index_path=args.truth_index_path,
            repo_root=args.repo_root,
            free_quota_ledger_path=args.free_quota_ledger_path,
            skill_id=args.skill_id,
            request_id=args.request_id,
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
        print(json.dumps(envelope, ensure_ascii=True, indent=2))
    else:
        print("ASSF production CLI/MCP package adapter")
        print(f"Skill: {envelope.get('skillId')}")
        print(f"Disposition: {envelope.get('executionDisposition')}")
        if envelope.get("executionReceiptId"):
            print(f"Execution receipt: {envelope.get('executionReceiptId')}")

    if args.receipt_out is not None:
        args.receipt_out.parent.mkdir(parents=True, exist_ok=True)
        args.receipt_out.write_text(
            json.dumps(envelope, ensure_ascii=True, indent=2) + "\n",
            encoding="utf-8",
        )
    success_dispositions = {DRY_RUN_DISPOSITION, LIVE_PASS_DISPOSITION}
    return 0 if envelope.get("executionDisposition") in success_dispositions else 1


if __name__ == "__main__":
    sys.exit(main())
