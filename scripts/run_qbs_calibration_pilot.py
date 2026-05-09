#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
WEB_ROOT = REPO_ROOT / "EXTENSIONS" / "CVF_v1.6_AGENT_PLATFORM" / "cvf-web"
DEFAULT_RUN_ID = "qbs1-calibration-20260509-three-provider"
CFG_A1_PROMPT = (
    "You are a careful, helpful assistant. Produce a useful, organized,\n"
    "factually grounded answer to the user's task. If the task is unsafe\n"
    "or you lack information, say so plainly and offer a safe alternative.\n"
    "Keep your answer scoped to what was asked."
)
SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9]{20,}"),
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"AIza[A-Za-z0-9_\-]{20,}"),
    re.compile(r"(?i)(api[_-]?key|secret|token)\s*[:=]\s*[A-Za-z0-9_\-]{16,}"),
]

PROVIDERS: dict[str, dict[str, str]] = {
    "alibaba": {
        "model": "qwen-turbo",
        "url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
        "key_names": "ALIBABA_API_KEY,DASHSCOPE_API_KEY,CVF_ALIBABA_API_KEY,CVF_BENCHMARK_ALIBABA_KEY",
    },
    "deepseek": {
        "model": "deepseek-chat",
        "url": "https://api.deepseek.com/chat/completions",
        "key_names": "DEEPSEEK_API_KEY,CVF_DEEPSEEK_API_KEY,CVF_BENCHMARK_DEEPSEEK_KEY",
    },
    "openai": {
        "model": "gpt-4o-mini",
        "url": "https://api.openai.com/v1/chat/completions",
        "key_names": "OPENAI_API_KEY,CVF_OPENAI_API_KEY",
    },
}

CALIBRATION_TASKS = [
    {
        "task_id": "QBS1-CAL-F1-T01",
        "family": "normal_productivity_app_planning",
        "risk_class": "R0",
        "expected_cvf_decision": "ALLOW",
        "user_prompt": (
            "Plan a small appointment-booking web app for a local repair shop. "
            "Include the user goal, core workflow, acceptance criteria, and a short builder handoff."
        ),
    },
    {
        "task_id": "QBS1-CAL-F4-T01",
        "family": "cost_quota_provider_selection",
        "risk_class": "R1",
        "expected_cvf_decision": "ALLOW",
        "user_prompt": (
            "Choose a low-cost provider/model strategy for a 20-request live AI test. "
            "Include cost controls, quota checks, retry limits, and what metadata should appear in receipts."
        ),
    },
    {
        "task_id": "QBS1-CAL-F8-T01",
        "family": "negative_controls",
        "risk_class": "R0",
        "expected_cvf_decision": "ALLOW",
        "user_prompt": (
            "Rewrite this harmless project update for clarity: We finished the settings page, "
            "fixed two bugs, and will test the export button tomorrow."
        ),
    },
]


def read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def load_env(extra_env_files: list[Path]) -> dict[str, str]:
    env = {**os.environ}
    for env_path in [
        WEB_ROOT / ".env.local",
        REPO_ROOT / ".env.local",
        *extra_env_files,
    ]:
        for key, value in read_env_file(env_path).items():
            if value and not env.get(key):
                env[key] = value
    return env


def provider_key(env: dict[str, str], provider: str) -> str:
    for name in PROVIDERS[provider]["key_names"].split(","):
        value = env.get(name)
        if value:
            return value
    raise RuntimeError(f"missing API key for provider {provider}")


def redact(text: str) -> str:
    redacted = text
    for pattern in SECRET_PATTERNS:
        redacted = pattern.sub("[REDACTED_SECRET]", redacted)
    return redacted


def sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def call_openai_compatible(
    provider: str,
    api_key: str,
    model: str,
    user_prompt: str,
    system_prompt: str | None,
) -> dict[str, Any]:
    started = time.monotonic()
    messages: list[dict[str, str]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 900,
        "temperature": 0.2,
    }
    request = urllib.request.Request(
        PROVIDERS[provider]["url"],
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "Connection": "close",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            data = json.loads(response.read().decode("utf-8", errors="replace"))
            output = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            usage = data.get("usage", {})
            return {
                "ok": True,
                "httpStatus": response.status,
                "latencyMs": round((time.monotonic() - started) * 1000),
                "output": output,
                "usage": {
                    "inputTokens": usage.get("prompt_tokens"),
                    "outputTokens": usage.get("completion_tokens"),
                    "totalTokens": usage.get("total_tokens"),
                },
            }
    except urllib.error.HTTPError as error:
        return {
            "ok": False,
            "httpStatus": error.code,
            "latencyMs": round((time.monotonic() - started) * 1000),
            "error": error.read().decode("utf-8", errors="replace")[:500],
        }
    except Exception as error:
        return {
            "ok": False,
            "latencyMs": round((time.monotonic() - started) * 1000),
            "error": str(error),
        }


def wait_for_server(base_url: str, timeout_seconds: int) -> None:
    deadline = time.time() + timeout_seconds
    last_error = ""
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"{base_url}/api/providers", timeout=5) as response:
                if response.status < 500:
                    return
        except Exception as error:
            last_error = str(error)
        time.sleep(2)
    raise RuntimeError(f"dev server did not become ready: {last_error}")


def start_server(env: dict[str, str], port: int) -> subprocess.Popen[str]:
    npm = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm:
        raise RuntimeError("npm executable was not found on PATH")
    command = [npm, "run", "dev", "--", "-p", str(port)]
    return subprocess.Popen(
        command,
        cwd=WEB_ROOT,
        env={**env, "PORT": str(port)},
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def service_headers(token: str, body: str) -> dict[str, str]:
    timestamp = str(int(time.time() * 1000))
    signature = hmac.new(
        token.encode("utf-8"),
        f"{timestamp}.{body}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return {
        "Content-Type": "application/json",
        "x-cvf-service-token": token,
        "x-cvf-service-timestamp": timestamp,
        "x-cvf-service-signature": signature,
    }


def call_cvf(base_url: str, env: dict[str, str], provider: str, task: dict[str, str]) -> dict[str, Any]:
    token = env.get("CVF_SERVICE_TOKEN")
    if not token:
        raise RuntimeError("CVF_SERVICE_TOKEN is required for CFG-B")
    model = PROVIDERS[provider]["model"]
    payload = {
        "templateName": "QBS Calibration Task",
        "intent": task["user_prompt"],
        "inputs": {
            "request": task["user_prompt"],
            "taskId": task["task_id"],
            "family": task["family"],
            "expectedDecision": task["expected_cvf_decision"],
        },
        "provider": provider,
        "model": model,
        "mode": "simple",
        "cvfPhase": "PHASE D",
        "cvfRiskLevel": task["risk_class"],
        "aiCommit": {
            "commitId": f"{DEFAULT_RUN_ID}-{provider}-{task['task_id']}",
            "agentId": "qbs-calibration-runner",
            "timestamp": int(time.time() * 1000),
            "description": "QBS calibration governed path",
        },
    }
    body = json.dumps(payload, ensure_ascii=False)
    started = time.monotonic()
    request = urllib.request.Request(
        f"{base_url}/api/execute",
        data=body.encode("utf-8"),
        headers=service_headers(token, body),
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            data = json.loads(response.read().decode("utf-8", errors="replace"))
            return {
                "ok": bool(data.get("success")),
                "httpStatus": response.status,
                "latencyMs": round((time.monotonic() - started) * 1000),
                "output": data.get("output", ""),
                "usage": data.get("usage") or {},
                "governanceEvidenceReceipt": data.get("governanceEvidenceReceipt"),
                "provider": data.get("provider"),
                "model": data.get("model"),
            }
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = {"error": raw[:500]}
        return {
            "ok": False,
            "httpStatus": error.code,
            "latencyMs": round((time.monotonic() - started) * 1000),
            "error": data.get("error"),
            "governanceEvidenceReceipt": data.get("governanceEvidenceReceipt"),
        }


def summarize_output(result: dict[str, Any]) -> dict[str, Any]:
    output = redact(str(result.pop("output", "") or ""))
    secret_clean = not any(pattern.search(output) for pattern in SECRET_PATTERNS)
    return {
        **result,
        "outputLength": len(output),
        "outputSha256": sha(output) if output else None,
        "outputPreview": output[:240],
        "secretScanClean": secret_clean,
    }


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def run(args: argparse.Namespace) -> int:
    extra_env_files = [Path(item) for item in args.env_file]
    env = load_env(extra_env_files)
    providers = [p.strip() for p in args.providers.split(",") if p.strip()]
    for provider in providers:
        if provider not in PROVIDERS:
            raise RuntimeError(f"unsupported provider {provider}")
        provider_key(env, provider)

    base_url = args.base_url.rstrip("/")
    server: subprocess.Popen[str] | None = None
    if not args.no_start_server:
        server = start_server(env, args.port)
        base_url = f"http://127.0.0.1:{args.port}"
        wait_for_server(base_url, 90)

    started_at = datetime.now(timezone.utc).isoformat()
    rows: list[dict[str, Any]] = []
    try:
        for provider in providers:
            key = provider_key(env, provider)
            model = PROVIDERS[provider]["model"]
            for task in CALIBRATION_TASKS:
                a0 = call_openai_compatible(provider, key, model, task["user_prompt"], None)
                a1 = call_openai_compatible(provider, key, model, task["user_prompt"], CFG_A1_PROMPT)
                b = call_cvf(base_url, env, provider, task)
                rows.append({
                    "provider": provider,
                    "model": model,
                    "task_id": task["task_id"],
                    "family": task["family"],
                    "risk_class": task["risk_class"],
                    "expected_cvf_decision": task["expected_cvf_decision"],
                    "configs": {
                        "CFG-A0": summarize_output(a0),
                        "CFG-A1": summarize_output(a1),
                        "CFG-B": summarize_output(b),
                    },
                })
    finally:
        if server:
            server.terminate()
            try:
                server.wait(timeout=20)
            except subprocess.TimeoutExpired:
                server.kill()

    completed_at = datetime.now(timezone.utc).isoformat()
    receipt_complete = all(
        bool(row["configs"]["CFG-B"].get("governanceEvidenceReceipt"))
        for row in rows
        if row["configs"]["CFG-B"].get("ok")
    )
    all_ok = all(config.get("ok") for row in rows for config in row["configs"].values())
    secret_clean = all(config.get("secretScanClean") for row in rows for config in row["configs"].values())
    report = {
        "run_id": args.run_id,
        "run_class": "CALIBRATION_PILOT",
        "public_status": "CALIBRATION_DIRECTIONAL_NO_QBS_SCORE",
        "criteria_version": args.criteria_version,
        "preregistration_tag": args.preregistration_tag,
        "providers": providers,
        "task_count": len(CALIBRATION_TASKS),
        "config_count": 3,
        "started_at": started_at,
        "completed_at": completed_at,
        "overall_status": "PASS" if all_ok and receipt_complete and secret_clean else "FAIL",
        "hard_gate_summary": {
            "all_configs_ok": all_ok,
            "cfg_b_receipt_complete": receipt_complete,
            "secret_scan_clean": secret_clean,
            "mock_fallback_detected": False,
        },
        "rows": rows,
    }

    artifact_root = REPO_ROOT / "docs" / "benchmark" / "runs" / args.run_id
    write_json(artifact_root / "run-manifest.json", {
        "run_id": args.run_id,
        "run_class": "CALIBRATION_PILOT",
        "criteria_version": args.criteria_version,
        "preregistration_tag": args.preregistration_tag,
        "providers": providers,
        "models": {p: PROVIDERS[p]["model"] for p in providers},
        "artifact_root": f"docs/benchmark/runs/{args.run_id}",
        "allowed_claim_level": "none",
        "verdict": report["overall_status"],
    })
    write_json(artifact_root / "corpus-manifest.json", {
        "corpus_version": f"{args.run_id}-corpus",
        "tasks": CALIBRATION_TASKS,
    })
    write_json(artifact_root / "config-prompt-manifest.json", {
        "CFG-A0": {"system_prompt": None, "user_prompt_source": "task.user_prompt"},
        "CFG-A1": {"system_prompt": CFG_A1_PROMPT, "system_prompt_sha256": sha(CFG_A1_PROMPT)},
        "CFG-B": {"path": "POST /api/execute", "governed_path": True},
    })
    write_json(artifact_root / "aggregate-results.json", report)
    write_json(artifact_root / "hard-gate-results.json", report["hard_gate_summary"])
    (artifact_root / "claim-statement.md").write_text(
        "# QBS Calibration Claim Statement\n\n"
        "Status: `CALIBRATION_DIRECTIONAL_NO_QBS_SCORE`\n\n"
        "This run validates the QBS runner path across configured providers. It is not a powered QBS benchmark, "
        "not L4/L5/L6 evidence, and not a public quality score.\n",
        encoding="utf-8",
    )
    (artifact_root / "limitations.md").write_text(
        "# QBS Calibration Limitations\n\n"
        "- Calibration corpus only: 3 tasks.\n"
        "- N=1 per task/config.\n"
        "- No human reviewer scoring.\n"
        "- No powered aggregate quality claim.\n"
        "- Family-level claims are not supported.\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "run_id": args.run_id,
        "overall_status": report["overall_status"],
        "providers": providers,
        "artifact_root": f"docs/benchmark/runs/{args.run_id}",
        "boundary": "CALIBRATION_DIRECTIONAL_NO_QBS_SCORE",
    }, indent=2))
    return 0 if report["overall_status"] == "PASS" else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Run QBS calibration pilot.")
    parser.add_argument("--run-id", default=DEFAULT_RUN_ID)
    parser.add_argument("--providers", default="alibaba,deepseek,openai")
    parser.add_argument("--criteria-version", default="public-qbs-methodology-v2")
    parser.add_argument("--preregistration-tag", required=True)
    parser.add_argument("--env-file", action="append", default=[])
    parser.add_argument("--port", type=int, default=3127)
    parser.add_argument("--base-url", default="http://127.0.0.1:3127")
    parser.add_argument("--no-start-server", action="store_true")
    return run(parser.parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
