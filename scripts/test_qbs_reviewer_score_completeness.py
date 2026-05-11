#!/usr/bin/env python3
from __future__ import annotations

import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

import score_qbs_model_assisted_reviewers as scorer
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

    def test_recovers_missing_alias_with_narrow_retry(self) -> None:
        initial_scores = [score("OUT-01")]
        try:
            normalize_reviewer_score_items(
                initial_scores,
                ALIAS_MAP,
                "openai",
                "QBS1-F7-T04",
            )
        except ValueError as error:
            initial_error = error
        else:
            raise AssertionError("missing alias should raise before recovery")

        original_call = scorer.call_reviewer

        def fake_call_reviewer(*_args: object, **_kwargs: object) -> dict[str, object]:
            return {
                "ok": True,
                "latencyMs": 1,
                "usage": {},
                "parsed": {"scores": [score("OUT-02", 4)]},
            }

        with TemporaryDirectory() as temp_dir:
            scorer.call_reviewer = fake_call_reviewer
            try:
                recovered = scorer.recover_missing_alias_scores(
                    spec={"model": "test"},
                    reviewer_key="test-key",
                    reviewer_id="openai",
                    task_id="QBS1-F7-T04",
                    corpus_task={"family": "ambiguous_noncoder_requests"},
                    prompt_version="test-prompt",
                    payload={
                        "outputs": [
                            {"output_id": "OUT-01", "repeat": 2, "output": "a"},
                            {"output_id": "OUT-02", "repeat": 2, "output": "b"},
                        ],
                    },
                    alias_map=ALIAS_MAP,
                    initial_parsed_scores=initial_scores,
                    initial_error=initial_error,
                    missing_alias_retry_attempts=2,
                    diagnostics_path=Path(temp_dir) / "diag.jsonl",
                )
            finally:
                scorer.call_reviewer = original_call

        self.assertIsNotNone(recovered)
        self.assertEqual(
            [row["output_id"] for row in recovered or []],
            list(ALIAS_MAP.values()),
        )


if __name__ == "__main__":
    unittest.main()
