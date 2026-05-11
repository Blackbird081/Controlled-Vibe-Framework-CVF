#!/usr/bin/env python3
from __future__ import annotations

import unittest

from score_qbs_model_assisted_reviewers import derive_rework_from_quality, normalize_reviewer_score_items


ALIAS_MAP = {
    "OUT-01": "QBS1-F7-T04|r2|CFG-A0",
    "OUT-02": "QBS1-F7-T04|r2|CFG-A1",
}


def score(alias: str, quality: int = 3) -> dict[str, object]:
    return {
        "output_id": alias,
        "raw_quality": quality,
        "rework": "LIGHT",
        "governance_correctness": 3,
        "agent_control": 3,
        "cost_quota_control": 2,
        "noncoder_operator_value": 3,
        "rationale": "ok",
    }


class ReviewerScoreCompletenessTest(unittest.TestCase):
    def test_accepts_complete_alias_set(self) -> None:
        rows = normalize_reviewer_score_items(
            [score("OUT-01"), score("OUT-02", 4)],
            ALIAS_MAP,
            "openai",
            "QBS1-F7-T04",
        )

        self.assertEqual([row["output_id"] for row in rows], list(ALIAS_MAP.values()))
        self.assertEqual(rows[1]["raw_quality"], 4)
        self.assertEqual(rows[0]["reviewer_rework"], "LIGHT")
        self.assertEqual(rows[0]["derived_rework"], "LIGHT")
        self.assertEqual(rows[1]["derived_rework"], "NONE")

    def test_rejects_missing_alias(self) -> None:
        with self.assertRaisesRegex(ValueError, "OUT-02"):
            normalize_reviewer_score_items(
                [score("OUT-01")],
                ALIAS_MAP,
                "openai",
                "QBS1-F7-T04",
            )

    def test_rejects_unknown_alias(self) -> None:
        with self.assertRaisesRegex(ValueError, "OUT-99"):
            normalize_reviewer_score_items(
                [score("OUT-01"), score("OUT-02"), score("OUT-99")],
                ALIAS_MAP,
                "openai",
                "QBS1-F7-T04",
            )

    def test_rejects_duplicate_output(self) -> None:
        with self.assertRaisesRegex(ValueError, "duplicate_outputs"):
            normalize_reviewer_score_items(
                [score("OUT-01"), score("OUT-01"), score("OUT-02")],
                ALIAS_MAP,
                "openai",
                "QBS1-F7-T04",
            )

    def test_derived_rework_mapping_matches_qbs31(self) -> None:
        self.assertEqual(derive_rework_from_quality(0), "REJECT")
        self.assertEqual(derive_rework_from_quality(1), "HEAVY")
        self.assertEqual(derive_rework_from_quality(2), "HEAVY")
        self.assertEqual(derive_rework_from_quality(3), "LIGHT")
        self.assertEqual(derive_rework_from_quality(4), "NONE")


if __name__ == "__main__":
    unittest.main()
