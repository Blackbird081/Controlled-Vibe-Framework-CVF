#!/usr/bin/env python3
"""Fail-closed preflight for a pending CVF public-sync projection."""

from __future__ import annotations

import argparse
import hashlib
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
        errors="strict",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def pending_paths(root: Path) -> list[str]:
    paths: set[str] = set()
    for args in (("diff", "--name-only", "-z"), ("diff", "--cached", "--name-only", "-z"), ("ls-files", "--others", "--exclude-standard", "-z")):
        result = git(root, *args)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
        paths.update(path for path in result.stdout.split("\0") if path)
    return sorted(paths)


def module_exists(source: Path, specifier: str, root: Path, candidate_paths: set[str]) -> bool:
    # Ambient ignored files are not part of the projected candidate.
    source_rel = source.relative_to(root).as_posix()
    return any(
        candidate in candidate_paths and (root / candidate).is_file()
        for candidate in module_candidate_paths(source_rel, specifier)
    )


def resolve_commit(root: Path, ref: str, label: str) -> str:
    result = git(root, "rev-parse", "--verify", "--end-of-options", f"{ref}^{{commit}}")
    if result.returncode != 0:
        raise RuntimeError(f"unable to resolve {label} commit")
    return result.stdout.strip()


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

    head_sha = resolve_commit(root, "HEAD", "HEAD")
    baseline_sha = resolve_commit(root, args.baseline_ref, "baseline")

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
    if not isinstance(authorized_items, list) or not all(isinstance(item, str) and item.strip() for item in authorized_items):
        raise RuntimeError("authorized paths must be a JSON string array")
    authorized = {item.replace("\\", "/") for item in authorized_items}
    for path in pending:
        if path not in authorized:
            violations.append({"code": "UNOWNED_PENDING_PATH", "detail": path})
        if any(pattern.search(path) for pattern in FORBIDDEN_PENDING):
            violations.append({"code": "GENERATED_OR_RUNTIME_RESIDUE", "detail": path})

    whitespace = git(root, "diff", "--check")
    if whitespace.returncode != 0:
        violations.append({"code": "DIFF_HYGIENE", "detail": whitespace.stdout.strip() or whitespace.stderr.strip()})

    tracked = git(root, "ls-files", "-z")
    if tracked.returncode != 0:
        raise RuntimeError(tracked.stderr.strip() or "git ls-files failed")
    candidate_paths = {rel for rel in [*tracked.stdout.split("\0"), *pending] if rel}
    source_paths = sorted(rel for rel in candidate_paths if Path(rel).suffix.lower() in SOURCE_EXTENSIONS)
    source_hashes: dict[str, str] = {}
    for rel in source_paths:
        source = root / rel
        if not source.is_file() or source.suffix.lower() not in SOURCE_EXTENSIONS:
            continue
        raw = source.read_bytes()
        try:
            text = raw.decode("utf-8", errors="strict")
        except UnicodeDecodeError:
            violations.append({"code": "INVALID_SOURCE_ENCODING", "detail": rel})
            continue
        source_hashes[rel] = hashlib.sha256(raw).hexdigest()
        for match in RELATIVE_SPECIFIER.finditer(text):
            specifier = match.group("path")
            if not module_exists(source, specifier, root, candidate_paths):
                finding = {"code": "MISSING_RELATIVE_DEPENDENCY", "detail": f"{rel} -> {specifier}"}
                if baseline_already_missing(root, baseline_sha, rel, specifier):
                    baseline_debt.append(finding)
                else:
                    violations.append(finding)

    if resolve_commit(root, "HEAD", "HEAD") != head_sha:
        raise RuntimeError("HEAD changed during candidate inspection")
    return {
        "status": "PASS" if not violations else "REJECT",
        "pendingPaths": pending,
        "pendingPathCount": len(pending),
        "sourceFilesChecked": len(source_hashes),
        "sourceFilesConsidered": len(source_paths),
        "sourceFileSha256": source_hashes,
        "baselineRef": args.baseline_ref,
        "baselineSha": baseline_sha,
        "headSha": head_sha,
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
    except (OSError, RuntimeError, UnicodeError, json.JSONDecodeError) as exc:
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
