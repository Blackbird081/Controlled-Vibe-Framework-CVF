#!/usr/bin/env python3
"""Command catalog aggregator for CVF local governance hook chains."""

from __future__ import annotations

try:
    from local_governance_hook_catalog_pre_commit import PRE_COMMIT_CHECKS
    from local_governance_hook_catalog_pre_push import PRE_PUSH_CHECKS
    from local_governance_hook_catalog_reviewer_fast import REVIEWER_FAST_CHECKS
except ModuleNotFoundError:  # imported as governance.compat.local_governance_hook_catalog
    from governance.compat.local_governance_hook_catalog_pre_commit import PRE_COMMIT_CHECKS
    from governance.compat.local_governance_hook_catalog_pre_push import PRE_PUSH_CHECKS
    from governance.compat.local_governance_hook_catalog_reviewer_fast import REVIEWER_FAST_CHECKS


PARALLEL_BY_DEFAULT_HOOKS = {"pre-commit", "pre-push", "reviewer-fast"}


HOOK_CHAINS: dict[str, list[tuple[str, list[str]]]] = {
    "reviewer-fast": REVIEWER_FAST_CHECKS,
    "pre-commit": PRE_COMMIT_CHECKS,
    "pre-push": PRE_PUSH_CHECKS,
}
