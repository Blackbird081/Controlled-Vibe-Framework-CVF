#!/usr/bin/env python3
from __future__ import annotations

import fnmatch
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "governance" / "public-surface-manifest.json"

BLOCKED_GLOBS = [
    "AGENT_HANDOFF*.md",
    "CLAUDE*.md",
    "*REBUTTAL*",
    "*TRANSFER_NOTE*",
    "*RAW*",
    "*HANDOFF*",
    "docs/reviews/**",
    "docs/roadmaps/**",
    "docs/audits/**",
    "docs/baselines/**",
    "docs/logs/**",
    "docs/assessments/**",
    ".cvf/runtime/**",
    ".cvf/config/**",
    ".env",
    ".env.*",
    "**/.env",
    "**/.env.*",
    "**/node_modules/**",
    "**/.next/**",
    "**/coverage/**",
    "**/test-results/**",
    "**/playwright-report/**",
    "*.log",
    "*.jsonl",
]

SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9]{20,}"),
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"-----BEGIN (?:RSA|EC|OPENSSH) PRIVATE KEY-----"),
    re.compile(r"(?i)\\b(?:DASHSCOPE_API_KEY|ALIBABA_API_KEY|DEEPSEEK_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_AI_API_KEY)\\s*=\\s*['\\\"]?[^'\\\"\\s<]{12,}"),
]

ALLOW_PLACEHOLDERS = ("<operator-supplied", "<your", "your-", "placeholder", "test-key", "fake", "dummy")
SKIP_DIRS = {".git", "node_modules", ".next", "coverage", "test-results", "playwright-report", "__pycache__"}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def load_allowlist() -> set[str]:
    if not MANIFEST.exists():
        return set()
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {item["path"] for item in data.get("allowlist", []) if "path" in item}


def is_match(path: str, pattern: str) -> bool:
    return fnmatch.fnmatch(path, pattern) or fnmatch.fnmatch(path, pattern.rstrip("/**"))


def is_binary(path: Path) -> bool:
    try:
        chunk = path.read_bytes()[:1024]
    except OSError:
        return True
    return b"\0" in chunk


def scan() -> list[str]:
    allowlist = load_allowlist()
    violations: list[str] = []

    for path in ROOT.rglob("*"):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if not path.is_file():
            continue
        r = rel(path)
        if path.name == ".env.example":
            pass
        else:
            for pattern in BLOCKED_GLOBS:
                if is_match(r, pattern) and r not in allowlist:
                    violations.append(f"blocked public-surface path: {r} (pattern: {pattern})")
                    break

        if is_binary(path):
            continue

        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue

        for line_no, line in enumerate(text.splitlines(), 1):
            lowered = line.lower()
            if any(marker in lowered for marker in ALLOW_PLACEHOLDERS):
                continue
            for pattern in SECRET_PATTERNS:
                if pattern.search(line):
                    violations.append(f"possible secret: {r}:{line_no}")
                    break

        if path.suffix.lower() == ".md":
            line_count = text.count("\n") + 1
            if line_count > 1200 and r not in allowlist:
                violations.append(f"large markdown file needs review: {r} ({line_count} lines)")

    return violations


def main() -> int:
    violations = scan()
    if violations:
        print("CVF public-surface scan: FAIL")
        for item in violations[:100]:
            print(f"- {item}")
        if len(violations) > 100:
            print(f"- ... {len(violations) - 100} more")
        return 1
    print("CVF public-surface scan: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
