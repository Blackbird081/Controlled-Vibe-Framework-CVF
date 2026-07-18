#!/usr/bin/env python3
"""Bounded ASSF package execution/use-proof adapter.

This helper is the first receipt-backed ASSF package use surface. It loads one
runtime-eligible package body through the existing loader, verifies consumed
output semantics through the activation policy resolver, and can perform one
live provider call to prove the package instructions were used in a bounded
execution context.

The adapter does not mutate ASSF lifecycle sources and does not promote any
package to ACTIVE.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

try:
    from run_assf_activation_policy_resolver import (
        INDEX_PATH,
        REPO_ROOT,
        STATE_USED_WITH_RECEIPT,
        TRUTH_INDEX_PATH,
        build_activation_policy_packet,
    )
    from run_assf_runtime_package_loader import build_runtime_package_packet
    from live_provider_bootstrap import bootstrap_live_provider_env
    from assf_live_model_selection import (
        AUTO_FREE_QUOTA_MODEL,
        AUTO_PROVIDER,
        resolve_provider_model,
    )
except ModuleNotFoundError:
    from governance.compat.run_assf_activation_policy_resolver import (
        INDEX_PATH,
        REPO_ROOT,
        STATE_USED_WITH_RECEIPT,
        TRUTH_INDEX_PATH,
        build_activation_policy_packet,
    )
    from governance.compat.run_assf_runtime_package_loader import (
        build_runtime_package_packet,
    )
    from governance.compat.live_provider_bootstrap import bootstrap_live_provider_env
    from governance.compat.assf_live_model_selection import (
        AUTO_FREE_QUOTA_MODEL,
        AUTO_PROVIDER,
        resolve_provider_model,
    )


CLAIM_BOUNDARY = (
    "This packet is a bounded ASSF package use-proof adapter result. It may "
    "prove one explicit package body read, receipt-backed output use, and one "
    "live provider completion. It does not activate package lifecycle state, "
    "mutate ASSF registry/index/truth/package sources, implement MCP server "
    "behavior, grant authority, commit, push, public-sync, or bypass governed "
    "work-order scope."
)

ADAPTER_IMPLEMENTATION = "IMPLEMENTED_BOUNDED_USE_PROOF_ADAPTER"
LIVE_PROVIDER_MODE = "LIVE_PROVIDER_USE_PROOF"
DRY_RUN_MODE = "DRY_RUN_NO_PROVIDER_CALL"
PROOF_RECEIPT_TYPE = "CVF_ASSF_PACKAGE_USE_PROOF_RECEIPT"
DEFAULT_SKILL_ID = "cvf-engineering-spec-driven-development"
DEFAULT_PROVIDER = AUTO_PROVIDER
DEFAULT_MODEL = AUTO_FREE_QUOTA_MODEL
DEFAULT_ENDPOINT = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions"
FREE_QUOTA_LEDGER_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "model_gateway"
    / "CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER.json"
)
DEFAULT_TIMEOUT_SECONDS = 45
DEFAULT_MAX_INSTRUCTION_CHARS = 6000
DEFAULT_MAX_OUTPUT_CHARS = 1200
API_KEY_ENV_CANDIDATES = (
    "DASHSCOPE_API_KEY",
    "ALIBABA_API_KEY",
    "CVF_ALIBABA_API_KEY",
    "CVF_BENCHMARK_ALIBABA_KEY",
)


@dataclass(frozen=True)
class ProviderResult:
    http_status: int | None
    headers: dict[str, str]
    body: dict[str, Any]
    latency_ms: int


LiveCaller = Callable[[dict[str, Any], str, int], ProviderResult]


def _sha256_text(value: str) -> str:
    return "sha256:" + hashlib.sha256(value.encode("utf-8")).hexdigest()


def _sha256_json(value: dict[str, Any]) -> str:
    canonical = json.dumps(value, sort_keys=True, separators=(",", ":"))
    return _sha256_text(canonical)


def _relative_path(path: Path) -> str:
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def _safe_loaded_env_files() -> list[str]:
    return [_relative_path(path) for path in bootstrap_live_provider_env()]


def _resolve_api_key() -> tuple[str | None, str | None]:
    for env_name in API_KEY_ENV_CANDIDATES:
        value = os.environ.get(env_name, "").strip()
        if value:
            return value, env_name
    return None, None


def _diagnostic(
    *,
    stage: str,
    failure_class: str,
    retryable: bool,
    user_action: str,
    provider: str | None = None,
    model: str | None = None,
    http_status: int | None = None,
    latency_ms: int | None = None,
    receipt_id: str | None = None,
    trace_id: str | None = None,
    safe_message: str,
) -> dict[str, Any]:
    return {
        "stage": stage,
        "class": failure_class,
        "retryable": retryable,
        "userAction": user_action,
        "provider": provider,
        "model": model,
        "httpStatus": http_status,
        "latencyMs": latency_ms,
        "receiptId": receipt_id,
        "traceId": trace_id,
        "safeMessage": safe_message,
    }


def _extract_output_text(body: dict[str, Any]) -> str:
    choices = body.get("choices")
    if not isinstance(choices, list) or not choices:
        return ""
    first = choices[0]
    if not isinstance(first, dict):
        return ""
    message = first.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        if isinstance(content, str):
            return content.strip()
    text = first.get("text")
    return text.strip() if isinstance(text, str) else ""


def _provider_trace_id(body: dict[str, Any], headers: dict[str, str]) -> str | None:
    for key in ("x-request-id", "x-dashscope-request-id", "request-id"):
        value = headers.get(key) or headers.get(key.title())
        if value:
            return value
    response_id = body.get("id")
    return str(response_id) if response_id else None


def _post_dashscope(
    payload: dict[str, Any],
    api_key: str,
    timeout_seconds: int,
    *,
    endpoint: str = DEFAULT_ENDPOINT,
) -> ProviderResult:
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            raw_body = response.read().decode("utf-8", errors="replace")
            latency_ms = round((time.perf_counter() - started) * 1000)
            parsed = json.loads(raw_body) if raw_body else {}
            return ProviderResult(
                http_status=response.status,
                headers=dict(response.headers.items()),
                body=parsed if isinstance(parsed, dict) else {"raw": parsed},
                latency_ms=latency_ms,
            )
    except urllib.error.HTTPError as exc:
        raw_body = exc.read().decode("utf-8", errors="replace")
        latency_ms = round((time.perf_counter() - started) * 1000)
        try:
            parsed = json.loads(raw_body) if raw_body else {}
        except json.JSONDecodeError:
            parsed = {"error": {"message": raw_body[:400]}}
        return ProviderResult(
            http_status=exc.code,
            headers=dict(exc.headers.items()) if exc.headers else {},
            body=parsed if isinstance(parsed, dict) else {"raw": parsed},
            latency_ms=latency_ms,
        )


def _build_prompt(
    *,
    skill_id: str,
    instruction_body: str,
    task_prompt: str,
    max_instruction_chars: int,
) -> list[dict[str, str]]:
    excerpt = instruction_body[:max_instruction_chars]
    return [
        {
            "role": "system",
            "content": (
                "You are running a bounded CVF ASSF package use-proof. Apply "
                "the provided package instructions to the task. Do not claim "
                "lifecycle activation, authority expansion, public export, or "
                "production readiness."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Skill id: {skill_id}\n\n"
                f"Package instructions excerpt:\n{excerpt}\n\n"
                f"Task:\n{task_prompt}\n\n"
                "Return a concise result with: applied package controls, "
                "execution output, and claim boundary."
            ),
        },
    ]


def _build_use_proof_receipt(
    *,
    skill_id: str,
    skill_usage_receipt_id: str,
    policy_receipt_id: str,
    provider: str,
    model: str,
    http_status: int | None,
    latency_ms: int,
    provider_trace_id: str | None,
    response_hash: str,
    output_hash: str,
) -> dict[str, Any]:
    material = {
        "authorityBoundary": (
            "use-proof receipt proves one receipt-backed bounded package "
            "execution only; it does not grant authority, activate package "
            "lifecycle state, or bypass governed work-order scope"
        ),
        "generatedBy": "governance/compat/run_assf_package_use_proof_adapter.py",
        "httpStatus": http_status,
        "latencyMs": latency_ms,
        "model": model,
        "outputConsumed": True,
        "outputHash": output_hash,
        "policyReceiptId": policy_receipt_id,
        "provider": provider,
        "providerTraceId": provider_trace_id,
        "receiptType": PROOF_RECEIPT_TYPE,
        "responseHash": response_hash,
        "schemaVersion": "0.1.0",
        "skillId": skill_id,
        "skillUsageReceiptId": skill_usage_receipt_id,
    }
    return {"receiptId": _sha256_json(material), **material}


def build_package_use_proof_packet(
    *,
    index_path: Path = INDEX_PATH,
    truth_index_path: Path = TRUTH_INDEX_PATH,
    repo_root: Path = REPO_ROOT,
    free_quota_ledger_path: Path = FREE_QUOTA_LEDGER_PATH,
    skill_id: str = DEFAULT_SKILL_ID,
    provider: str = DEFAULT_PROVIDER,
    model: str = DEFAULT_MODEL,
    live: bool = False,
    task_prompt: str | None = None,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    max_instruction_chars: int = DEFAULT_MAX_INSTRUCTION_CHARS,
    max_output_chars: int = DEFAULT_MAX_OUTPUT_CHARS,
    live_caller: LiveCaller | None = None,
) -> dict[str, Any]:
    """Build a bounded package use-proof packet."""
    if timeout_seconds <= 0:
        raise ValueError("timeout_seconds must be a positive integer")
    if max_instruction_chars <= 0:
        raise ValueError("max_instruction_chars must be a positive integer")
    if max_output_chars <= 0:
        raise ValueError("max_output_chars must be a positive integer")

    requested_model = model
    model_selection = resolve_provider_model(
        requested_provider=provider,
        requested_model=requested_model,
        ledger_path=free_quota_ledger_path,
    )
    resolved_provider = model_selection.resolved_provider or provider
    resolved_model = model_selection.resolved_model or requested_model
    loaded_env_files = _safe_loaded_env_files() if live else []
    base: dict[str, Any] = {
        "adapterImplementation": ADAPTER_IMPLEMENTATION,
        "claimBoundary": CLAIM_BOUNDARY,
        "executionMode": LIVE_PROVIDER_MODE if live else DRY_RUN_MODE,
        "lifecycleMutation": False,
        "activePromotionAuthorized": False,
        "sourceMutations": [],
        "provider": resolved_provider,
        "model": resolved_model,
        "skillId": skill_id,
        "sourcePaths": {
            "runtimePackageLoader": "governance/compat/run_assf_runtime_package_loader.py",
            "activationPolicyResolver": (
                "governance/compat/run_assf_activation_policy_resolver.py"
            ),
            "skillIndex": _relative_path(index_path),
            "truthIndex": _relative_path(truth_index_path),
            "freeQuotaLedger": _relative_path(free_quota_ledger_path),
        },
        "modelSelection": model_selection.to_dict(relative_to=REPO_ROOT),
        "providerSelection": {
            "requestedProvider": model_selection.requested_provider,
            "resolvedProvider": model_selection.resolved_provider,
            "providerStatus": model_selection.provider_status,
            "selectionBoundary": (
                "ASCP-T5 Model Gateway use case only; not a production model router"
            ),
        },
        "safeLoadedEnvFiles": loaded_env_files,
    }

    if model_selection.provider_status != "PROVIDER_USABLE":
        base["executionDisposition"] = "LIVE_PROVIDER_DENIED_PROVIDER_SELECTION"
        base["diagnostic"] = _diagnostic(
            stage="provider_selection",
            failure_class=model_selection.provider_status,
            retryable=True,
            user_action="select a source-backed ASCP-T5 live provider candidate",
            provider=resolved_provider,
            model=requested_model,
            safe_message=model_selection.reason
            or "Requested provider is not usable for ASCP-T5 live proof.",
        )
        return base

    if model_selection.status != "MODEL_FREE_QUOTA_USABLE":
        base["executionDisposition"] = "LIVE_PROVIDER_DENIED_MODEL_FREE_QUOTA"
        base["diagnostic"] = _diagnostic(
            stage="model_selection",
            failure_class=model_selection.status,
            retryable=True,
            user_action="select an unexpired model from the Alibaba free-quota ledger",
            provider=resolved_provider,
            model=requested_model,
            safe_message=model_selection.reason
            or "Requested model is not usable for free-quota live proof.",
        )
        return base

    runtime_packet = build_runtime_package_packet(
        index_path=index_path,
        repo_root=repo_root,
        skill_id=skill_id,
        max_results=1,
        include_instruction_bodies=True,
    )
    runtime_dict = runtime_packet.to_dict()
    items = runtime_dict.get("items", [])

    if len(items) != 1:
        base["executionDisposition"] = "DENIED_PACKAGE_NOT_SELECTED"
        base["diagnostic"] = _diagnostic(
            stage="package_selection",
            failure_class="package_not_selected",
            retryable=False,
            user_action="verify skill id and generated ASSF index",
            provider=provider,
            model=resolved_model,
            safe_message="No single matching runtime package was selected.",
        )
        return base

    item = items[0]
    usage_receipt = item.get("skillUsageReceipt")
    instruction_body = item.get("instructionBody")
    package_summary = {
        "packageBodyDisposition": item.get("packageBodyDisposition"),
        "packageRoot": item.get("canonicalRoot"),
        "runtimeEligible": bool(item.get("runtimeEligible")),
        "ineligibilityReasons": item.get("ineligibilityReasons", []),
    }
    if isinstance(instruction_body, str):
        package_summary["instructionBodyHash"] = _sha256_text(instruction_body)
        package_summary["instructionBodyChars"] = len(instruction_body)
    if isinstance(usage_receipt, dict):
        package_summary["skillUsageReceiptId"] = usage_receipt.get("receiptId")
        package_summary["skillUsageReceiptType"] = usage_receipt.get("receiptType")
    base["packageRead"] = package_summary

    if not isinstance(usage_receipt, dict) or not isinstance(instruction_body, str):
        base["executionDisposition"] = "DENIED_MISSING_SKILL_USAGE_RECEIPT"
        base["diagnostic"] = _diagnostic(
            stage="package_body_read",
            failure_class="missing_skill_usage_receipt",
            retryable=False,
            user_action="use a runtime-eligible package and request body read through the loader",
            provider=resolved_provider,
            model=resolved_model,
            safe_message="Package body was not loaded with a matching skill usage receipt.",
        )
        return base

    policy_packet = build_activation_policy_packet(
        index_path=index_path,
        truth_index_path=truth_index_path,
        repo_root=repo_root,
        skill_id=skill_id,
        max_results=1,
        output_consumed=True,
        usage_receipts=(usage_receipt,),
    )
    policy_items = policy_packet.to_dict().get("items", [])
    policy_item = policy_items[0] if policy_items else {}
    policy_receipt = policy_item.get("policyDecisionReceipt", {})
    base["activationPolicy"] = {
        "activationPolicyState": policy_item.get("activationPolicyState"),
        "matchedUsageReceiptIds": policy_item.get("matchedUsageReceiptIds", []),
        "policyReasons": policy_item.get("policyReasons", []),
        "policyDecisionReceiptId": policy_receipt.get("receiptId"),
        "usedWithReceipt": bool(policy_item.get("usedWithReceipt")),
    }

    if policy_item.get("activationPolicyState") != STATE_USED_WITH_RECEIPT:
        base["executionDisposition"] = "DENIED_POLICY_NOT_USED_WITH_RECEIPT"
        base["diagnostic"] = _diagnostic(
            stage="activation_policy",
            failure_class="policy_use_without_receipt",
            retryable=False,
            user_action="provide a matching CVF_ASSF_SKILL_USAGE_RECEIPT",
            provider=resolved_provider,
            model=resolved_model,
            receipt_id=str(usage_receipt.get("receiptId", "")),
            safe_message="Activation policy did not classify the package as USED_WITH_RECEIPT.",
        )
        return base

    prompt = task_prompt or (
        "Create a compact source-verification checklist for adding a bounded "
        "CVF helper. Keep the output under six short bullets."
    )
    messages = _build_prompt(
        skill_id=skill_id,
        instruction_body=instruction_body,
        task_prompt=prompt,
        max_instruction_chars=max_instruction_chars,
    )
    base["executionTask"] = {
        "taskPromptHash": _sha256_text(prompt),
        "maxInstructionChars": max_instruction_chars,
    }

    if not live:
        base["executionDisposition"] = "DRY_RUN_READY_FOR_LIVE_PROVIDER_USE_PROOF"
        base["diagnostic"] = None
        return base

    api_key, credential_source = _resolve_api_key()
    if not api_key:
        base["executionDisposition"] = "LIVE_PROVIDER_DENIED_MISSING_KEY"
        base["credentialSource"] = None
        base["diagnostic"] = _diagnostic(
            stage="credential_resolution",
            failure_class="missing_live_provider_key",
            retryable=True,
            user_action="set DASHSCOPE_API_KEY or an accepted Alibaba alias",
            provider=resolved_provider,
            model=resolved_model,
            receipt_id=str(usage_receipt.get("receiptId", "")),
            safe_message="No DashScope-compatible live key was available.",
        )
        return base

    base["credentialSource"] = credential_source
    payload = {
        "model": resolved_model,
        "messages": messages,
        "temperature": 0,
        "max_tokens": 400,
    }
    caller = live_caller or _post_dashscope
    try:
        result = caller(payload, api_key, timeout_seconds)
    except (OSError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
        base["executionDisposition"] = "LIVE_PROVIDER_FAILED"
        base["diagnostic"] = _diagnostic(
            stage="provider_call",
            failure_class=exc.__class__.__name__,
            retryable=True,
            user_action="inspect provider availability and retry once if transient",
            provider=resolved_provider,
            model=resolved_model,
            receipt_id=str(usage_receipt.get("receiptId", "")),
            safe_message=str(exc)[:400],
        )
        return base

    trace_id = _provider_trace_id(result.body, result.headers)
    output_text = _extract_output_text(result.body)
    response_hash = _sha256_json(result.body)
    output_hash = _sha256_text(output_text)
    base["liveCall"] = {
        "httpStatus": result.http_status,
        "latencyMs": result.latency_ms,
        "providerTraceId": trace_id,
        "responseHash": response_hash,
        "outputHash": output_hash,
        "outputPreview": output_text[:max_output_chars],
        "outputChars": len(output_text),
    }

    if result.http_status is None or result.http_status >= 400 or not output_text:
        base["executionDisposition"] = "LIVE_PROVIDER_FAILED"
        base["diagnostic"] = _diagnostic(
            stage="provider_response",
            failure_class="provider_error_or_empty_output",
            retryable=result.http_status is None or result.http_status >= 500,
            user_action="inspect safe provider response metadata before rerun",
            provider=resolved_provider,
            model=resolved_model,
            http_status=result.http_status,
            latency_ms=result.latency_ms,
            receipt_id=str(usage_receipt.get("receiptId", "")),
            trace_id=trace_id,
            safe_message="Provider response did not produce usable output.",
        )
        return base

    proof_receipt = _build_use_proof_receipt(
        skill_id=skill_id,
        skill_usage_receipt_id=str(usage_receipt.get("receiptId", "")),
        policy_receipt_id=str(policy_receipt.get("receiptId", "")),
        provider=resolved_provider,
        model=resolved_model,
        http_status=result.http_status,
        latency_ms=result.latency_ms,
        provider_trace_id=trace_id,
        response_hash=response_hash,
        output_hash=output_hash,
    )
    base["executionDisposition"] = "LIVE_PROVIDER_USE_PROOF_PASS"
    base["packageUseProofReceipt"] = proof_receipt
    base["diagnostic"] = None
    return base


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Run a bounded ASSF package use-proof adapter. Live provider calls "
            "require --live and a DashScope-compatible API key."
        )
    )
    parser.add_argument("--index-path", type=Path, default=INDEX_PATH)
    parser.add_argument("--truth-index-path", type=Path, default=TRUTH_INDEX_PATH)
    parser.add_argument("--repo-root", type=Path, default=REPO_ROOT)
    parser.add_argument("--free-quota-ledger-path", type=Path, default=FREE_QUOTA_LEDGER_PATH)
    parser.add_argument("--skill-id", default=DEFAULT_SKILL_ID)
    parser.add_argument("--provider", default=DEFAULT_PROVIDER)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--task-prompt", default=None)
    parser.add_argument("--timeout-seconds", type=int, default=DEFAULT_TIMEOUT_SECONDS)
    parser.add_argument(
        "--max-instruction-chars",
        type=int,
        default=DEFAULT_MAX_INSTRUCTION_CHARS,
    )
    parser.add_argument("--max-output-chars", type=int, default=DEFAULT_MAX_OUTPUT_CHARS)
    parser.add_argument("--json", action="store_true", help="Emit JSON output")
    parser.add_argument(
        "--receipt-out",
        type=Path,
        default=None,
        help="Write the full use-proof packet to a JSON file",
    )
    args = parser.parse_args(argv)

    try:
        packet = build_package_use_proof_packet(
            index_path=args.index_path,
            truth_index_path=args.truth_index_path,
            repo_root=args.repo_root,
            free_quota_ledger_path=args.free_quota_ledger_path,
            skill_id=args.skill_id,
            provider=args.provider,
            model=args.model,
            live=args.live,
            task_prompt=args.task_prompt,
            timeout_seconds=args.timeout_seconds,
            max_instruction_chars=args.max_instruction_chars,
            max_output_chars=args.max_output_chars,
        )
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(packet, ensure_ascii=True, indent=2))
    else:
        print("ASSF package use-proof adapter")
        print(f"Skill: {packet.get('skillId')}")
        print(f"Mode: {packet.get('executionMode')}")
        print(f"Disposition: {packet.get('executionDisposition')}")
        receipt = packet.get("packageUseProofReceipt") or {}
        if isinstance(receipt, dict) and receipt.get("receiptId"):
            print(f"Use proof receipt: {receipt.get('receiptId')}")
        diagnostic = packet.get("diagnostic")
        if diagnostic:
            print(f"Diagnostic: {diagnostic.get('class')} at {diagnostic.get('stage')}")
        print(f"Claim boundary: {CLAIM_BOUNDARY}")

    if args.receipt_out is not None:
        args.receipt_out.parent.mkdir(parents=True, exist_ok=True)
        args.receipt_out.write_text(
            json.dumps(packet, ensure_ascii=True, indent=2) + "\n",
            encoding="utf-8",
        )
    return 0 if packet.get("executionDisposition") in {
        "DRY_RUN_READY_FOR_LIVE_PROVIDER_USE_PROOF",
        "LIVE_PROVIDER_USE_PROOF_PASS",
    } else 1


if __name__ == "__main__":
    sys.exit(main())
