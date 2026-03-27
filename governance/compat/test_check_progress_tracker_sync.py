#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_progress_tracker_sync.py")
SPEC = importlib.util.spec_from_file_location("check_progress_tracker_sync", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class CheckProgressTrackerSyncTests(unittest.TestCase):
    def setUp(self) -> None:
        self.base_registry = {
            "worklines": [
                {
                    "id": "whitepaper_completion",
                    "tracker": "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
                    "triggerRegexes": ["^docs/reviews/CVF_W\\d+-T\\d+.*\\.md$"],
                    "commitRegexes": ["\\bW\\d+-T\\d+\\b"],
                }
            ]
        }

    def test_allows_matching_registry(self) -> None:
        violations = MODULE._validate_registry_contract(self.base_registry, self.base_registry)
        self.assertEqual([], violations)

    def test_blocks_mutated_existing_workline(self) -> None:
        mutated = {
            "worklines": [
                {
                    "id": "whitepaper_completion",
                    "tracker": "docs/reference/ALT_TRACKER.md",
                    "triggerRegexes": ["^docs/reviews/CVF_W\\d+-T\\d+.*\\.md$"],
                    "commitRegexes": ["\\bW\\d+-T\\d+\\b"],
                }
            ]
        }

        violations = MODULE._validate_registry_contract(mutated, self.base_registry)

        self.assertIn("workline_mutated_from_baseline", {v["type"] for v in violations})

    def test_allows_additive_new_workline(self) -> None:
        additive = {
            "worklines": self.base_registry["worklines"] + [
                {
                    "id": "new_surface",
                    "tracker": "docs/reference/NEW_TRACKER.md",
                    "triggerRegexes": ["^docs/baselines/CVF_NEW_.*\\.md$"],
                    "commitRegexes": ["\\bNEW-TRACK\\b"],
                }
            ]
        }

        violations = MODULE._validate_registry_contract(additive, self.base_registry)

        self.assertEqual([], violations)

    def test_blocks_invalid_regex(self) -> None:
        invalid = {
            "worklines": [
                {
                    "id": "whitepaper_completion",
                    "tracker": "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
                    "triggerRegexes": ["("],
                    "commitRegexes": ["\\bW\\d+-T\\d+\\b"],
                }
            ]
        }

        violations = MODULE._validate_registry_contract(invalid, None)

        self.assertIn("invalid_regex", {v["type"] for v in violations})


if __name__ == "__main__":
    unittest.main()
