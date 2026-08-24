#!/usr/bin/env python3
"""Fail-closed preflight for a pending CVF public-sync projection."""

from __future__ import annotations

import argparse
import json
import posixpath
import re
import subprocess
import sys
from pathlib import Path


RELATIVE_SPECIFIER = re.compile(
    r"(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s+)['\"](?P<path>\.{1,2}/[^'\"]+)['\"]"
)
FORBIDDEN_PENDING = (
    re.compile(r"(^|/)\.cvf/(runtime|config)(/|$)", re.IGNORECASE),
    re.compile(r"(^|/)(coverage|test-results|playwright-report)(/|$)", re.IGNORECASE),
    re.compile(r"(^|/)\.next(?:-|/|$)", re.IGNORECASE),
    re.compile(r"\.(?:log|tmp|pyc|tsbuildinfo)$", re.IGNORECASE),
    re.compile(r"\.jsonl$", re.IGNORECASE),
)
SOURCE_EXTENSIONS = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs")


def normalize_remote(url: str) -> str:
    return url.strip().rstrip("/").removesuffix(".git").lower()


def git(root: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", "-C", str(root), *args],
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def pending_paths(root: Path) -> list[str]:
    paths: set[str] = set()
    for args in (("diff", "--name-only"), ("diff", "--cached", "--name-only"), ("ls-files", "--others", "--exclude-standard")):
        result = git(root, *args)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
        paths.update(line.replace("\\", "/").strip() for line in result.stdout.splitlines() if line.strip())
    return sorted(paths)


def module_exists(source: Path, specifier: str) -> bool:
    target = source.parent / specifier
    candidates = [target]
    # Dots are common inside CVF module basenames (for example
    # ``identity.manager``), so Path.suffix cannot decide whether a source
    # extension was supplied. Always try source-extension and index forms.
    candidates.extend(Path(f"{target}{ext}") for ext in SOURCE_EXTENSIONS)
    candidates.extend(target / f"index{ext}" for ext in SOURCE_EXTENSIONS)
    if target.suffix in {".js", ".jsx", ".mjs", ".cjs"}:
        # TypeScript ESM commonly writes the emitted .js specifier in source.
        candidates.extend(target.with_suffix(ext) for ext in (".ts", ".tsx"))
    return any(candidate.is_file() for candidate in candidates)


def module_candidate_paths(source_rel: str, specifier: str) -> list[str]:
    base = posixpath.normpath(posixpath.join(posixpath.dirname(source_rel), specifier))
    candidates = [base, *(f"{base}{ext}" for ext in SOURCE_EXTENSIONS)]
    candidates.extend(f"{base}/index{ext}" for ext in SOURCE_EXTENSIONS)
    suffix = Path(base).suffix
    if suffix in {".js", ".jsx", ".mjs", ".cjs"}:
        stem = base[: -len(suffix)]
        candidates.extend(f"{stem}{ext}" for ext in (".ts", ".tsx"))
    return candidates


def baseline_already_missing(root: Path, baseline_ref: str, source_rel: str, specifier: str) -> bool:
    old_source = git(root, "show", f"{baseline_ref}:{source_rel}")
    if old_source.returncode != 0:
        return False
    old_specifiers = {match.group("path") for match in RELATIVE_SPECIFIER.finditer(old_source.stdout)}
    if specifier not in old_specifiers:
        return False
    return not any(
        git(root, "cat-file", "-e", f"{baseline_ref}:{candidate}").returncode == 0
        for candidate in module_candidate_paths(source_rel, specifier)
    )


def check(args: argparse.Namespace) -> dict[str, object]:
    root = Path(args.public_root).resolve()
    violations: list[dict[str, str]] = []
    baseline_debt: list[dict[str, str]] = []
    if not (root / ".git").exists():
        violations.append({"code": "NOT_GIT_WORKTREE", "detail": str(root)})
        return {"status": "REJECT", "violations": violations, "pendingPaths": []}

    branch = git(root, "branch", "--show-current").stdout.strip()
    if args.expected_branch and branch != args.expected_branch:
        violations.append({"code": "WRONG_BRANCH", "detail": f"expected {args.expected_branch}; found {branch or 'detached'}"})

    remote = git(root, "remote", "get-url", "origin")
    if remote.returncode != 0 or normalize_remote(remote.stdout) != normalize_remote(args.expected_remote):
        violations.append({"code": "WRONG_REMOTE", "detail": remote.stdout.strip() or remote.stderr.strip()})

    pending = pending_paths(root)
    authorized_items = []
    if args.authorized_paths_json:
        authorized_items = json.loads(
            Path(args.authorized_paths_json).read_text(encoding="utf-8-sig")
        )
    authorized = {item.replace("\\", "/") for item in authorized_items}
    for path in pending:
        if path not in authorized:
            violations.append({"code": "UNOWNED_PENDING_PATH", "detail": path})
        if any(pattern.search(path) for pattern in FORBIDDEN_PENDING):
            violations.append({"code": "GENERATED_OR_RUNTIME_RESIDUE", "detail": path})

    whitespace = git(root, "diff", "--check")
    if whitespace.returncode != 0:
        violations.append({"code": "DIFF_HYGIENE", "detail": whitespace.stdout.strip() or whitespace.stderr.strip()})

    tracked = git(root, "ls-files")
    if tracked.returncode != 0:
        raise RuntimeError(tracked.stderr.strip() or "git ls-files failed")
    source_paths = sorted(
        {
            rel.replace("\\", "/").strip()
            for rel in [*tracked.stdout.splitlines(), *pending]
            if rel.strip() and Path(rel.strip()).suffix.lower() in SOURCE_EXTENSIONS
        }
    )
    for rel in source_paths:
        source = root / rel
        if not source.is_file() or source.suffix.lower() not in SOURCE_EXTENSIONS:
            continue
        text = source.read_text(encoding="utf-8", errors="replace")
        for match in RELATIVE_SPECIFIER.finditer(text):
            specifier = match.group("path")
            if not module_exists(source, specifier):
                finding = {"code": "MISSING_RELATIVE_DEPENDENCY", "detail": f"{rel} -> {specifier}"}
                if baseline_already_missing(root, args.baseline_ref, rel, specifier):
                    baseline_debt.append(finding)
                else:
                    violations.append(finding)

    return {
        "status": "PASS" if not violations else "REJECT",
        "pendingPaths": pending,
        "pendingPathCount": len(pending),
        "sourceFilesChecked": len(source_paths),
        "baselineRef": args.baseline_ref,
        "baselineDebt": baseline_debt,
        "baselineDebtCount": len(baseline_debt),
        "violations": violations,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--public-root", required=True)
    parser.add_argument("--authorized-paths-json")
    parser.add_argument("--expected-remote", required=True)
    parser.add_argument("--expected-branch")
    parser.add_argument("--baseline-ref", default="HEAD")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    try:
        result = check(args)
    except (OSError, RuntimeError, json.JSONDecodeError) as exc:
        result = {"status": "ERROR", "violations": [{"code": "PREFLIGHT_ERROR", "detail": str(exc)}]}
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"CVF public-sync candidate preflight: {result['status']}")
        violations = result.get("violations", [])
        for violation in violations[:100]:
            print(f"- {violation['code']}: {violation['detail']}")
        if len(violations) > 100:
            print(f"- ... {len(violations) - 100} additional violations omitted from console output")
        if result.get("baselineDebtCount"):
            print(f"Baseline dependency debt (non-blocking): {result['baselineDebtCount']}")
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
