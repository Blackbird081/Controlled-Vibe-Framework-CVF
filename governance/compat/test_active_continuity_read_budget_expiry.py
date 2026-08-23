#!/usr/bin/env python3
"""Focused regression tests for migration-registry expiry semantics."""

from __future__ import annotations

import datetime as dt
import unittest
from pathlib import Path

from governance.compat.active_continuity_read_budget import (
    validate_read_budget_migration_registry,
)


REPO_ROOT = Path(__file__).resolve().parents[2]


def migration(entries: list[dict]) -> dict:
    return {
        "schemaVersion": "1.0",
        "status": "ACTIVE_MIGRATION_DEBT",
        "expiresOn": "2000-01-01",
        "removalAction": "REMOVE_ROW_IN_T2_AFTER_SURFACE_COMPACTION",
        "entries": entries,
    }


class ReadBudgetMigrationExpiryTests(unittest.TestCase):
    def test_expired_empty_registry_passes(self) -> None:
        violations = validate_read_budget_migration_registry(
            REPO_ROOT, migration([]), None, dt.date(2026, 8, 18)
        )

        self.assertEqual(violations, [])

    def test_expired_nonempty_registry_fails(self) -> None:
        violations = validate_read_budget_migration_registry(
            REPO_ROOT, migration([{}]), None, dt.date(2026, 8, 18)
        )

        self.assertTrue(any("is expired as of" in issue for issue in violations))


if __name__ == "__main__":
    unittest.main()
