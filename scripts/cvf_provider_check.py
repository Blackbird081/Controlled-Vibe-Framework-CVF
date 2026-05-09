#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path

from _local_env import bootstrap_repo_env


REPO_ROOT = Path(__file__).resolve().parent.parent

PROVIDERS = {
    "openai": {
        "model": "gpt-4o-mini",
        "env_names": [
            "OPENAI_API_KEY",
            "CVF_OPENAI_API_KEY",
        ],
        "url": "https://api.openai.com/v1/chat/completions",
        "api_style": "openai-compatible",
    },
    "gemini": {
        "model": "gemini-2.5-flash",
        "env_names": [
            "GOOGLE_AI_API_KEY",
            "GEMINI_API_KEY",
            "CVF_GEMINI_API_KEY",
        ],
        "url": "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        "api_style": "google-generative-language",
    },
    "alibaba": {
        "model": "qwen-turbo",
        "env_names": [
            "DASHSCOPE_API_KEY",
            "ALIBABA_API_KEY",
            "CVF_ALIBABA_API_KEY",
            "CVF_BENCHMARK_ALIBABA_KEY",
        ],
        "url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
        "api_style": "openai-compatible",
    },
    "deepseek": {
        "model": "deepseek-chat",
        "env_names": [
            "DEEPSEEK_API_KEY",
            "CVF_BENCHMARK_DEEPSEEK_KEY",
            "CVF_DEEPSEEK_API_KEY",
        ],
        "url": "https://api.deepseek.com/chat/completions",
        "api_style": "openai-compatible",
    },
}


@dataclass
class ProviderCheckResult:
    provider: str
    model: str
    status: str
    key_present: bool
    key_source: str | None
    live_validation_requested: bool
    live_validation: str
    message: str


def resolve_key(provider: str) -> tuple[str | None, str | None]:
    for name in PROVIDERS[provider]["env_names"]:
        value = os.environ.get(name, "").strip()
        if value:
            return value, name
    return None, None


def redact(text: str) -> str:
    redacted = text
    for name in {
        "GOOGLE_AI_API_KEY",
        "GEMINI_API_KEY",
        "CVF_GEMINI_API_KEY",
        "OPENAI_API_KEY",
        "CVF_OPENAI_API_KEY",
        "DASHSCOPE_API_KEY",
        "ALIBABA_API_KEY",
        "CVF_ALIBABA_API_KEY",
        "CVF_BENCHMARK_ALIBABA_KEY",
        "DEEPSEEK_API_KEY",
        "CVF_BENCHMARK_DEEPSEEK_KEY",
        "CVF_DEEPSEEK_API_KEY",
    }:
        value = os.environ.get(name, "").strip()
        if value:
            redacted = redacted.replace(value, "[REDACTED]")
    return redacted


def live_validate(provider: str, api_key: str, model: str, timeout: int) -> tuple[bool, str]:
    cfg = PROVIDERS[provider]
    if cfg.get("api_style") == "google-generative-language":
        body = json.dumps({
            "contents": [
                {
                    "parts": [
                        {"text": "Reply with OK only. CVF provider readiness check."},
                    ],
                },
            ],
            "generationConfig": {
                "temperature": 0,
                "maxOutputTokens": 8,
            },
        }).encode("utf-8")
        request = urllib.request.Request(
            str(cfg["url"]).format(model=model),
            data=body,
            method="POST",
            headers={
                "x-goog-api-key": api_key,
                "Content-Type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                if 200 <= response.status < 300:
                    return True, f"HTTP {response.status}"
                return False, f"HTTP {response.status}"
        except urllib.error.HTTPError as exc:
            detail = exc.read(400).decode("utf-8", errors="replace")
            return False, redact(f"HTTP {exc.code}: {detail}")
        except Exception as exc:
            return False, redact(str(exc))

    body = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": "Reply with OK only."},
            {"role": "user", "content": "CVF provider readiness check."},
        ],
        "temperature": 0,
        "max_tokens": 8,
        "stream": False,
    }).encode("utf-8")
    request = urllib.request.Request(
        str(cfg["url"]),
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            if 200 <= response.status < 300:
                return True, f"HTTP {response.status}"
            return False, f"HTTP {response.status}"
    except urllib.error.HTTPError as exc:
        detail = exc.read(400).decode("utf-8", errors="replace")
        return False, redact(f"HTTP {exc.code}: {detail}")
    except Exception as exc:
        return False, redact(str(exc))


def main() -> int:
    parser = argparse.ArgumentParser(description="Secret-safe CVF provider readiness check.")
    parser.add_argument("--provider", required=True, choices=sorted(PROVIDERS))
    parser.add_argument("--model", default=None, help="Override provider model.")
    parser.add_argument("--live", action="store_true", help="Run a minimal live provider call.")
    parser.add_argument("--timeout", type=int, default=30, help="Live validation timeout in seconds.")
    parser.add_argument("--no-local-env", action="store_true", help="Do not load repo-local env files.")
    parser.add_argument("--json", action="store_true", help="Output JSON.")
    args = parser.parse_args()

    loaded = [] if args.no_local_env else bootstrap_repo_env()
    key, source = resolve_key(args.provider)
    model = args.model or PROVIDERS[args.provider]["model"]

    if not key:
        result = ProviderCheckResult(
            provider=args.provider,
            model=model,
            status="MISSING_KEY",
            key_present=False,
            key_source=None,
            live_validation_requested=args.live,
            live_validation="SKIPPED",
            message="No supported provider key found in process env or repo-local env files.",
        )
        print_result(result, args.json, loaded)
        return 2

    if not args.live:
        result = ProviderCheckResult(
            provider=args.provider,
            model=model,
            status="READY_UNVALIDATED",
            key_present=True,
            key_source=source,
            live_validation_requested=False,
            live_validation="SKIPPED",
            message="Provider key is present. Re-run with --live to validate with a real provider call.",
        )
        print_result(result, args.json, loaded)
        return 0

    ok, detail = live_validate(args.provider, key, model, args.timeout)
    result = ProviderCheckResult(
        provider=args.provider,
        model=model,
        status="LIVE_VALIDATED" if ok else "LIVE_VALIDATION_FAILED",
        key_present=True,
        key_source=source,
        live_validation_requested=True,
        live_validation=detail,
        message="Live provider validation passed." if ok else "Live provider validation failed.",
    )
    print_result(result, args.json, loaded)
    return 0 if ok else 1


def print_result(result: ProviderCheckResult, as_json: bool, loaded: list[Path]) -> None:
    payload = asdict(result)
    payload["loaded_env_files"] = [str(path.relative_to(REPO_ROOT)) for path in loaded]
    payload["secret_policy"] = "raw provider key values are never printed"
    if as_json:
        print(json.dumps(payload, indent=2))
    else:
        print(f"CVF Provider Check: {result.status}")
        print(f"provider: {result.provider}")
        print(f"model: {result.model}")
        print(f"key_present: {result.key_present}")
        print(f"key_source: {result.key_source or '-'}")
        print(f"live_validation: {result.live_validation}")
        print(result.message)


if __name__ == "__main__":
    raise SystemExit(main())
