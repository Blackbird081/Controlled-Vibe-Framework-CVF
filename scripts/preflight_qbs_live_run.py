#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


REPO_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_REMOTE = "https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git"
PROVENANCE_DIR_NAME = "Controlled-Vibe-Framework-CVF"
PACKAGE_ENV_RELATIVE = Path("EXTENSIONS") / "CVF_v1.6_AGENT_PLATFORM" / "cvf-web" / ".env.local"


@dataclass(frozen=True)
class QbsPreflightResult:
    env_files: list[Path]
    present_aliases: list[str]
    missing_alias_groups: list[list[str]]


def read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line[7:].strip()
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def is_relative_to(path: Path, parent: Path) -> bool:
    try:
        path.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def git_origin_url() -> str:
    result = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    return result.stdout.strip()


def candidate_default_env_files() -> list[Path]:
    candidates: list[Path] = []
    sibling_provenance = REPO_ROOT.parent / PROVENANCE_DIR_NAME / PACKAGE_ENV_RELATIVE
    if sibling_provenance.exists():
        candidates.append(sibling_provenance)

    local_package_env = REPO_ROOT / PACKAGE_ENV_RELATIVE
    if local_package_env.exists() and not is_relative_to(local_package_env, REPO_ROOT):
        candidates.append(local_package_env)

    return candidates


def resolve_env_files(explicit_env_files: Iterable[str | Path]) -> list[Path]:
    explicit = [Path(item).expanduser().resolve() for item in explicit_env_files]
    for env_path in explicit:
        if is_relative_to(env_path, REPO_ROOT):
            raise RuntimeError(
                f"QBS preflight blocked env file inside public-sync workspace: {env_path}"
            )
    if explicit:
        return explicit
    return [path.resolve() for path in candidate_default_env_files()]


def merged_env(env_files: Iterable[Path]) -> dict[str, str]:
    env = {**os.environ}
    for env_path in env_files:
        for key, value in read_env_file(env_path).items():
            if value and not env.get(key):
                env[key] = value
    return env


def preflight_qbs_live_run(
    *,
    env_files: Iterable[str | Path],
    required_key_aliases: Iterable[Iterable[str]],
    require_public_remote: bool = True,
    label: str = "qbs-live-run",
) -> QbsPreflightResult:
    if require_public_remote:
        origin = git_origin_url()
        if origin != PUBLIC_REMOTE:
            raise RuntimeError(
                f"QBS preflight expected public-sync remote {PUBLIC_REMOTE}, got {origin or '<missing>'}"
            )

    resolved_env_files = resolve_env_files(env_files)
    env = merged_env(resolved_env_files)

    present_aliases: list[str] = []
    missing_alias_groups: list[list[str]] = []
    for aliases_iter in required_key_aliases:
        aliases = [str(alias) for alias in aliases_iter]
        present = next((alias for alias in aliases if env.get(alias)), None)
        if present:
            present_aliases.append(present)
        else:
            missing_alias_groups.append(aliases)

    print(f"QBS preflight: {label}")
    for env_path in resolved_env_files:
        if is_relative_to(env_path, REPO_ROOT):
            raise RuntimeError(f"QBS preflight blocked public-sync env path after resolution: {env_path}")
        print(f"QBS preflight env-file: {env_path}")
    for alias in present_aliases:
        print(f"QBS preflight key {alias}: PRESENT")
    for aliases in missing_alias_groups:
        print(f"QBS preflight key aliases {','.join(aliases)}: MISSING")

    if missing_alias_groups:
        raise RuntimeError("QBS preflight failed: required key alias group missing")

    return QbsPreflightResult(
        env_files=resolved_env_files,
        present_aliases=present_aliases,
        missing_alias_groups=missing_alias_groups,
    )


def parse_alias_groups(values: list[str]) -> list[list[str]]:
    groups: list[list[str]] = []
    for value in values:
        aliases = [item.strip() for item in value.split(",") if item.strip()]
        if aliases:
            groups.append(aliases)
    return groups


def main() -> int:
    parser = argparse.ArgumentParser(description="Preflight QBS live/reviewer/adjudicator runs without printing secret values.")
    parser.add_argument("--env-file", action="append", default=[])
    parser.add_argument("--require-key", action="append", default=[], help="Comma-separated alias group; at least one alias must be present.")
    parser.add_argument("--label", default="qbs-live-run")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    result = preflight_qbs_live_run(
        env_files=args.env_file,
        required_key_aliases=parse_alias_groups(args.require_key),
        label=args.label,
    )
    if args.json:
        print(json.dumps({
            "env_files": [str(path) for path in result.env_files],
            "present_aliases": result.present_aliases,
            "missing_alias_groups": result.missing_alias_groups,
        }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
