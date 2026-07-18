"""Shared helpers for secret-safe live-provider local environment loading."""

from __future__ import annotations

import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def ensure_repo_root_on_sys_path(repo_root: Path = REPO_ROOT) -> bool:
    """Make repo-local modules importable from nested helper directories."""
    repo_root_text = str(repo_root)
    if repo_root_text in sys.path:
        return False
    sys.path.insert(0, repo_root_text)
    return True


def bootstrap_live_provider_env() -> list[Path]:
    """Load repo-local env files through the canonical local env bootstrap."""
    ensure_repo_root_on_sys_path()
    from scripts._local_env import bootstrap_repo_env

    return bootstrap_repo_env()
