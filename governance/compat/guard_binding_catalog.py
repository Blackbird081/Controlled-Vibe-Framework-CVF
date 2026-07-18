#!/usr/bin/env python3
"""Resolve effective guard-binding text across runners and command catalogs."""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"

CATALOG_PATHS_BY_RUNNER = {
    AUTORUN_PATH: (
        "governance/compat/agent_autorun_command_catalog.py",
    ),
    HOOK_CHAIN_PATH: (
        "governance/compat/local_governance_hook_catalog.py",
        "governance/compat/local_governance_hook_catalog_reviewer_fast.py",
        "governance/compat/local_governance_hook_catalog_pre_commit.py",
        "governance/compat/local_governance_hook_catalog_pre_push.py",
    ),
}


def normalize_path(path: str | Path) -> str:
    return str(path).replace("\\", "/")


def read_rel(path: str | Path) -> str:
    full = REPO_ROOT / normalize_path(path)
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8", errors="replace")


def effective_binding_text(path: str | Path, text: str | None = None) -> str:
    """Return the text a binding checker should inspect for a runner path.

    Runner files now delegate command definitions to catalog modules. A guard
    can be wired through those catalogs even when the runner no longer embeds
    the command literal directly.
    """
    normalized = normalize_path(path)
    parts = [text if text is not None else read_rel(normalized)]
    for catalog_path in CATALOG_PATHS_BY_RUNNER.get(normalized, ()):
        parts.append(read_rel(catalog_path))
    return "\n".join(parts)


def has_binding_marker(path: str | Path, marker: str, text: str | None = None) -> bool:
    return marker in effective_binding_text(path, text)
