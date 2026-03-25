#!/usr/bin/env python3
"""
CVF Extension Package Check Guard

Ensures that touched extension packages under EXTENSIONS/ with package.json-based
check scripts actually run and pass `npm run check` before push.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_EXTENSION_PACKAGE_CHECK_GUARD.md"
MASTER_POLICY_PATH = "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md"
CONTROL_MATRIX_PATH = "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md"
BOOTSTRAP_PATH = "docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md"
DOCS_INDEX_PATH = "docs/INDEX.md"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
WORKFLOW_PATH = ".github/workflows/documentation-testing.yml"
THIS_SCRIPT_PATH = "governance/compat/check_extension_package_check.py"

REQUIRED_FILES = (
    GUARD_PATH,
    MASTER_POLICY_PATH,
    CONTROL_MATRIX_PATH,
    BOOTSTRAP_PATH,
    DOCS_INDEX_PATH,
    HOOK_CHAIN_PATH,
    WORKFLOW_PATH,
)

REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    GUARD_PATH: (
        "Control ID: `GC-029`",
        "Whenever governed work changes substantive files inside an extension package under `EXTENSIONS/`, the package MUST pass its package-level `check` script before push.",
        THIS_SCRIPT_PATH,
    ),
    MASTER_POLICY_PATH: (
        "Touched extension packages under `EXTENSIONS/` must pass their own package-level `check` script before push when governed changes affect source, test, or package config files",
        GUARD_PATH,
        THIS_SCRIPT_PATH,
    ),
    CONTROL_MATRIX_PATH: (
        "`GC-029`",
        GUARD_PATH,
        THIS_SCRIPT_PATH,
    ),
    BOOTSTRAP_PATH: (
        "GC-029",
        "extension-local source, test, or package-config changes",
    ),
    DOCS_INDEX_PATH: (
        "../governance/toolkit/05_OPERATION/CVF_EXTENSION_PACKAGE_CHECK_GUARD.md",
    ),
    HOOK_CHAIN_PATH: (
        THIS_SCRIPT_PATH,
    ),
    WORKFLOW_PATH: (
        THIS_SCRIPT_PATH,
        "Extension Package Check",
        "extension-package-check",
    ),
}

SUBSTANTIVE_NAMES = {
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "vitest.config.ts",
    "vitest.config.js",
    "vitest.config.mjs",
    "vitest.config.cjs",
    "vite.config.ts",
    "vite.config.js",
    "vite.config.mjs",
    "vite.config.cjs",
}
SUBSTANTIVE_PREFIXES = ("src/", "tests/", "test/", "scripts/")
SUBSTANTIVE_SUFFIXES = (
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".mts",
    ".cts",
    ".json",
)


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _ref_exists(ref: str) -> bool:
    code, _, _ = _run_git(["rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"])
    return code == 0


def _discover_default_base(head: str) -> tuple[str, str]:
    env_base = os.getenv("CVF_COMPAT_BASE")
    if env_base:
        return env_base, "env:CVF_COMPAT_BASE"

    for ref in DEFAULT_BASE_CANDIDATES:
        if not _ref_exists(ref):
            continue
        code, out, _ = _run_git(["merge-base", ref, head])
        if code == 0 and out:
            return out, f"merge-base({ref},{head})"

    return "HEAD~1", "fallback:HEAD~1"


def _resolve_range(base: str | None, head: str | None) -> tuple[str, str, str]:
    resolved_head = head or "HEAD"
    if base:
        return base, resolved_head, "explicit:--base"
    resolved_base, source = _discover_default_base(resolved_head)
    return resolved_base, resolved_head, source


def _parse_name_status_output(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        status = parts[0].strip()
        if status.startswith("R") or status.startswith("C"):
            if len(parts) < 3:
                continue
            path = parts[2]
        else:
            if len(parts) < 2:
                continue
            path = parts[1]
        normalized = path.replace("\\", "/").strip()
        changed.setdefault(normalized, set()).add(status)
    return changed


def _get_changed_name_status(base: str, head: str) -> dict[str, set[str]]:
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    return _parse_name_status_output(out)


def _get_worktree_name_status() -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for path, statuses in _parse_name_status_output(out).items():
                changed.setdefault(path, set()).update(statuses)
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw_line in out.splitlines():
            normalized = raw_line.replace("\\", "/").strip()
            if normalized:
                changed.setdefault(normalized, set()).add("A")
    return changed


def _merge_changed_maps(*maps: dict[str, set[str]]) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    for changed_map in maps:
        for path, statuses in changed_map.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _read_text(path: str) -> str:
    abs_path = REPO_ROOT / path
    if not abs_path.exists() or abs_path.is_dir():
        return ""
    return abs_path.read_text(encoding="utf-8")


def _is_substantive_extension_path(path: str) -> bool:
    if not path.startswith("EXTENSIONS/"):
        return False
    parts = path.split("/")
    if len(parts) < 3:
        return False
    relative = "/".join(parts[2:])
    filename = parts[-1]
    if filename in SUBSTANTIVE_NAMES:
        return True
    if filename.startswith("tsconfig") and filename.endswith(".json"):
        return True
    if any(relative.startswith(prefix) for prefix in SUBSTANTIVE_PREFIXES):
        return True
    return relative.endswith(SUBSTANTIVE_SUFFIXES)


def _extension_root(path: str) -> str | None:
    if not path.startswith("EXTENSIONS/"):
        return None
    parts = path.split("/")
    if len(parts) < 2:
        return None
    return "/".join(parts[:2])


def _load_package_json(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _run_package_check(extension_root: str) -> dict[str, Any]:
    package_dir = REPO_ROOT / extension_root
    npm_executable = shutil.which("npm") or shutil.which("npm.cmd") or ("npm.cmd" if os.name == "nt" else "npm")
    proc = subprocess.run(
        [npm_executable, "run", "check"],
        cwd=package_dir,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return {
        "extension": extension_root,
        "returncode": proc.returncode,
        "stdout": proc.stdout.strip(),
        "stderr": proc.stderr.strip(),
    }


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    missing_files = [path for path in REQUIRED_FILES if not (REPO_ROOT / path).exists()]

    marker_violations: dict[str, list[str]] = {}
    for path, markers in REQUIRED_MARKERS.items():
        text = _read_text(path)
        missing_markers = [marker for marker in markers if marker not in text]
        if missing_markers:
            marker_violations[path] = missing_markers

    touched_extensions = sorted(
        {
            root
            for path in changed_paths
            if _is_substantive_extension_path(path)
            for root in [_extension_root(path)]
            if root is not None
        }
    )

    packages_checked: list[dict[str, Any]] = []
    missing_check_script: list[str] = []
    unreadable_package_json: list[str] = []

    for extension_root in touched_extensions:
        package_json_path = REPO_ROOT / extension_root / "package.json"
        if not package_json_path.exists():
            continue
        package_data = _load_package_json(package_json_path)
        if package_data is None:
            unreadable_package_json.append(extension_root)
            continue
        scripts = package_data.get("scripts") or {}
        if "check" not in scripts:
            missing_check_script.append(extension_root)
            continue
        packages_checked.append(_run_package_check(extension_root))

    failed_checks = [
        {
            "extension": item["extension"],
            "returncode": item["returncode"],
            "stderr": item["stderr"] or item["stdout"],
        }
        for item in packages_checked
        if item["returncode"] != 0
    ]

    compliant = (
        not missing_files
        and not marker_violations
        and not missing_check_script
        and not unreadable_package_json
        and not failed_checks
    )

    return {
        "requiredFileCount": len(REQUIRED_FILES),
        "missingFiles": missing_files,
        "missingFileCount": len(missing_files),
        "markerViolations": marker_violations,
        "markerViolationCount": len(marker_violations),
        "touchedExtensions": touched_extensions,
        "touchedExtensionCount": len(touched_extensions),
        "missingCheckScript": missing_check_script,
        "missingCheckScriptCount": len(missing_check_script),
        "unreadablePackageJson": unreadable_package_json,
        "unreadablePackageJsonCount": len(unreadable_package_json),
        "packagesChecked": [
            {
                "extension": item["extension"],
                "returncode": item["returncode"],
            }
            for item in packages_checked
        ],
        "packageCheckCount": len(packages_checked),
        "failedChecks": failed_checks,
        "failedCheckCount": len(failed_checks),
        "compliant": compliant,
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Extension Package Check Guard ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Required files checked: {report['requiredFileCount']}")
    print(f"Touched extension packages: {report['touchedExtensionCount']}")
    print(f"Packages checked: {report['packageCheckCount']}")
    print(f"Missing files: {report['missingFileCount']}")
    print(f"Marker violations: {report['markerViolationCount']}")
    print(f"Missing check script: {report['missingCheckScriptCount']}")
    print(f"Unreadable package.json: {report['unreadablePackageJsonCount']}")
    print(f"Failed checks: {report['failedCheckCount']}")

    if report["touchedExtensions"]:
        print("\nTouched extension packages:")
        for path in report["touchedExtensions"]:
            print(f"  - {path}")

    if report["packagesChecked"]:
        print("\nPackage checks run:")
        for item in report["packagesChecked"]:
            status = "PASS" if item["returncode"] == 0 else f"FAIL({item['returncode']})"
            print(f"  - {item['extension']}: {status}")

    if report["missingFiles"]:
        print("\nMissing required files:")
        for path in report["missingFiles"]:
            print(f"  - {path}")

    if report["markerViolations"]:
        print("\nMarker violations:")
        for path, markers in report["markerViolations"].items():
            print(f"  - {path}")
            for marker in markers:
                print(f"    missing: {marker}")

    if report["missingCheckScript"]:
        print("\nTouched packages missing scripts.check:")
        for extension in report["missingCheckScript"]:
            print(f"  - {extension}")

    if report["unreadablePackageJson"]:
        print("\nUnreadable package.json:")
        for extension in report["unreadablePackageJson"]:
            print(f"  - {extension}")

    if report["failedChecks"]:
        print("\nFailed package checks:")
        for item in report["failedChecks"]:
            print(f"  - {item['extension']} (exit {item['returncode']})")
            output = (item["stderr"] or "").splitlines()
            for line in output[:12]:
                print(f"    {line}")

    if report["compliant"]:
        if report["touchedExtensionCount"] == 0:
            print("\n✅ COMPLIANT — No touched extension package requires package-level `npm run check` in this range.")
        else:
            print("\n✅ COMPLIANT — All touched extension packages passed their required package-level `npm run check` gate.")
        return

    print("\n❌ VIOLATION — Extension package-level check enforcement failed.")
    print("   Action required:")
    print("   1. Ensure the GC-029 guard, policy, control matrix, bootstrap, docs index, hook-chain, and workflow stay aligned.")
    print("   2. Ensure touched extension packages under `EXTENSIONS/` define `scripts.check` in `package.json`.")
    print("   3. Re-run `npm run check` in each failing touched package until all pass.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF extension package check guard")
    parser.add_argument("--base", default=None, help="Git base ref (default: auto-detect merge-base, then fallback HEAD~1)")
    parser.add_argument("--head", default=None, help="Git head ref (default: HEAD)")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero (exit 2) when the GC-029 chain is incomplete or a touched package check fails")
    parser.add_argument("--json", action="store_true", help="Print JSON report to stdout instead of text")
    parser.add_argument("--write-report", default=None, help="Optional output path for JSON report file")
    args = parser.parse_args()

    base, head, base_source = _resolve_range(args.base, args.head)

    try:
        changed_map = _get_changed_name_status(base, head)
    except RuntimeError as exc:
        if args.base:
            fallback_base = "HEAD~1"
            try:
                changed_map = _get_changed_name_status(fallback_base, head)
                print(
                    f"Warning: primary range failed ({exc}); fallback to {fallback_base}..{head}",
                    file=sys.stderr,
                )
                base = fallback_base
                base_source = "fallback-after-error:HEAD~1"
            except RuntimeError as fallback_exc:
                print(str(fallback_exc), file=sys.stderr)
                return 1
        else:
            print(str(exc), file=sys.stderr)
            return 1

    worktree_map = _get_worktree_name_status()
    merged = _merge_changed_maps(changed_map, worktree_map)

    classified = _classify(merged)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        "policy": GUARD_PATH,
        **classified,
    }

    if args.write_report:
        out_path = Path(args.write_report)
        if not out_path.is_absolute():
            out_path = (REPO_ROOT / out_path).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report, base, head, base_source)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
