#!/usr/bin/env python3
"""
CVF multi-provider live smoke runner.

Checks the currently configured OpenAI-compatible provider lanes without
printing secrets. The first supported lanes are Alibaba DashScope and
DeepSeek because they are the operator-provided keys available in this repo.
"""

from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
WEB_ENV = REPO_ROOT / "EXTENSIONS" / "CVF_v1.6_AGENT_PLATFORM" / "cvf-web" / ".env.local"
ROOT_ENV = REPO_ROOT / ".env.local"
PROMPT = "Reply with exactly this token and nothing else: CVF_MULTI_PROVIDER_OK"


def read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def load_env() -> dict[str, str]:
    merged = {**os.environ}
    merged.update(read_env_file(ROOT_ENV))
    merged.update(read_env_file(WEB_ENV))
    return merged


def provider_specs(env: dict[str, str]) -> list[dict[str, str | None]]:
    return [
        {
            "provider": "alibaba",
            "model": "qwen-turbo",
            "url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
            "key": env.get("ALIBABA_API_KEY")
            or env.get("CVF_BENCHMARK_ALIBABA_KEY")
            or env.get("CVF_ALIBABA_API_KEY"),
        },
        {
            "provider": "deepseek",
            "model": "deepseek-chat",
            "url": "https://api.deepseek.com/chat/completions",
            "key": env.get("DEEPSEEK_API_KEY"),
        },
    ]


def call_provider(spec: dict[str, str | None]) -> dict[str, Any]:
    provider = str(spec["provider"])
    model = str(spec["model"])
    key = spec.get("key")
    started = time.monotonic()
    if not key:
        return {
            "provider": provider,
            "model": model,
            "ok": False,
            "status": "missing_key",
        }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a concise connectivity canary."},
            {"role": "user", "content": PROMPT},
        ],
        "max_tokens": 64,
        "temperature": 0,
    }
    request = urllib.request.Request(
        str(spec["url"]),
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read().decode("utf-8", errors="replace")
            data = json.loads(raw)
            output = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            matched = "CVF_MULTI_PROVIDER_OK" in output
            return {
                "provider": provider,
                "model": model,
                "ok": matched,
                "httpStatus": response.status,
                "latencyMs": round((time.monotonic() - started) * 1000),
                "outputMatched": matched,
                "tokenTotal": data.get("usage", {}).get("total_tokens"),
            }
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = {}
        return {
            "provider": provider,
            "model": model,
            "ok": False,
            "httpStatus": error.code,
            "latencyMs": round((time.monotonic() - started) * 1000),
            "error": data.get("error", {}).get("message") or f"HTTP {error.code}",
        }
    except Exception as error:  # pragma: no cover - defensive live runner path
        return {
            "provider": provider,
            "model": model,
            "ok": False,
            "latencyMs": round((time.monotonic() - started) * 1000),
            "error": str(error),
        }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run CVF multi-provider live smoke.")
    parser.add_argument(
        "--providers",
        default="alibaba,deepseek",
        help="Comma-separated providers to run. Supported: alibaba, deepseek.",
    )
    args = parser.parse_args()

    requested = {item.strip() for item in args.providers.split(",") if item.strip()}
    env = load_env()
    specs = [spec for spec in provider_specs(env) if spec["provider"] in requested]
    results = [call_provider(spec) for spec in specs]
    report = {
        "ok": all(result["ok"] for result in results),
        "providersRequested": sorted(requested),
        "results": results,
    }
    print(json.dumps(report, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
