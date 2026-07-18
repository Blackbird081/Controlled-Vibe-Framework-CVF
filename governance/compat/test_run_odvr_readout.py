#!/usr/bin/env python3
"""Focused tests for the ODVR-T1 deterministic local readout composer.

Covers: positive CURRENT/STALE/CONTRADICTED/MISSING_SOURCE composer states,
equal-stateOrder conflict, unresolved commit, absent artifact, status
mismatch, generator drift, malformed stateOrder, missing materialCommit, no
eligible entry, schema validation of composed output, and no-write/no-mutate
behavior of both the pure composer and the CLI.
"""

from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "governance" / "compat"))

import run_odvr_readout as odvr  # noqa: E402

SCHEMA_PATH = (
    REPO_ROOT
    / "docs"
    / "reference"
    / "operator_decision_value_readout"
    / "CVF_ODVR_T0_READOUT_SCHEMA.json"
)


def _load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def _validate(instance: dict) -> None:
    import jsonschema

    jsonschema.validate(instance=instance, schema=_load_schema())


def _bootstrap_state(**overrides) -> dict:
    base = {
        "currentMode": "odvr_t1_dispatched",
        "activeHandoff": "AGENT_HANDOFF_V41_2026-07-11.md",
        "nextAllowedMove": "Author a fresh ODVR-T1 GC-018 baseline and source-verified no-commit work order.",
    }
    base.update(overrides)
    return base


def _entry(state_order: int, state_key: str, value: dict) -> dict:
    return {"stateOrder": state_order, "stateKey": state_key, "value": value}


class StubReader:
    def __init__(self, results: dict[str, "odvr.ArtifactReadResult"]) -> None:
        self._results = results
        self.calls: list[str] = []

    def __call__(self, path: str) -> "odvr.ArtifactReadResult":
        self.calls.append(path)
        if path in self._results:
            return self._results[path]
        return odvr.ArtifactReadResult(path=path, exists=False, status=None, claim_boundary=None, reopen_condition=None)


class StubResolver:
    def __init__(self, resolvable: set[str]) -> None:
        self._resolvable = resolvable
        self.calls: list[str] = []

    def __call__(self, commit: str) -> "odvr.CommitResolution":
        self.calls.append(commit)
        return odvr.CommitResolution(commit=commit, resolvable=commit in self._resolvable)


class FindEligibleEntriesTests(unittest.TestCase):
    def test_entry_with_material_commit_and_artifact_path_is_eligible(self) -> None:
        entries = [
            _entry(
                10,
                "odvrT0Closure",
                {
                    "materialCommit": "2af788683",
                    "roadmap": "docs/roadmaps/CVF_EXAMPLE_2026-07-12.md",
                },
            )
        ]
        eligible = odvr.find_eligible_entries(entries)
        self.assertEqual(len(eligible), 1)
        self.assertEqual(eligible[0].state_order, 10)

    def test_entry_with_dispatch_commit_only_is_not_eligible(self) -> None:
        entries = [
            _entry(
                11,
                "odvrT1Dispatch",
                {
                    "dispatchCommit": "a60b37760",
                    "workOrder": "docs/work_orders/CVF_EXAMPLE_2026-07-12.md",
                },
            )
        ]
        eligible = odvr.find_eligible_entries(entries)
        self.assertEqual(eligible, [])

    def test_entry_with_material_commit_but_no_artifact_path_is_not_eligible(self) -> None:
        entries = [_entry(12, "noArtifactPath", {"materialCommit": "abc12345"})]
        self.assertEqual(odvr.find_eligible_entries(entries), [])

    def test_malformed_state_order_is_skipped(self) -> None:
        entries = [
            {
                "stateOrder": "not-an-int",
                "stateKey": "bad",
                "value": {
                    "materialCommit": "abc12345",
                    "roadmap": "docs/roadmaps/CVF_EXAMPLE_2026-07-12.md",
                },
            }
        ]
        self.assertEqual(odvr.find_eligible_entries(entries), [])

    def test_non_object_value_is_skipped(self) -> None:
        entries = [_entry(13, "badValue", "not-a-dict")]
        self.assertEqual(odvr.find_eligible_entries(entries), [])


class ComposerCurrentStateTests(unittest.TestCase):
    def test_current_when_top_entry_resolves_and_matches(self) -> None:
        entries = odvr.find_eligible_entries(
            [
                _entry(
                    1688,
                    "odvrT0Closure20260712",
                    {
                        "status": "REVIEWER_ACCEPTED_AFTER_REPAIR",
                        "materialCommit": "2af788683",
                        "roadmap": "docs/roadmaps/CVF_OPERATOR_DECISION_AND_VALUE_READOUT_ROADMAP_2026-07-12.md",
                        "completionReview": "docs/reviews/CVF_ODVR_T0_SOURCE_OVERLAP_AND_READOUT_CONTRACT_COMPLETION_2026-07-12.md",
                        "claimBoundary": "ODVR-T0 docs/schema closure only.",
                        "nextAllowedMove": "fresh ODVR-T1 GC-018 authoring only",
                    },
                ),
            ]
        )
        reader = StubReader(
            {
                "docs/reviews/CVF_ODVR_T0_SOURCE_OVERLAP_AND_READOUT_CONTRACT_COMPLETION_2026-07-12.md": odvr.ArtifactReadResult(
                    path="docs/reviews/CVF_ODVR_T0_SOURCE_OVERLAP_AND_READOUT_CONTRACT_COMPLETION_2026-07-12.md",
                    exists=True,
                    status="REVIEWER_ACCEPTED_AFTER_REPAIR",
                    claim_boundary="ODVR-T0 docs/schema closure only.",
                    reopen_condition=None,
                )
            }
        )
        resolver = StubResolver({"2af788683"})
        inputs = odvr.ComposerInputs(
            bootstrap_state=_bootstrap_state(),
            entries=tuple(entries),
            read_artifact=reader,
            resolve_commit=resolver,
            generator_drift_clean=True,
        )
        result = odvr.build_odvr_readout(inputs)
        self.assertEqual(result["aggregateFreshness"], "CURRENT")
        self.assertEqual(
            result["latestMaterialDecision"]["artifactPath"],
            "docs/reviews/CVF_ODVR_T0_SOURCE_OVERLAP_AND_READOUT_CONTRACT_COMPLETION_2026-07-12.md",
        )
        self.assertEqual(result["latestMaterialDecision"]["stateOrder"], 1688)
        self.assertIsNone(result["terminalValueVerdict"])
        self.assertNotIn("staleSourceAnchors", result)
        self.assertNotIn("missingSourceAnchor", result)
        self.assertNotIn("contradictions", result)
        _validate(result)

    def test_completion_review_precedence_over_roadmap_when_both_present(self) -> None:
        entries = odvr.find_eligible_entries(
            [
                _entry(
                    5,
                    "multiArtifact",
                    {
                        "status": "SOME_STATUS",
                        "materialCommit": "aaaaaaaa",
                        "roadmap": "docs/roadmaps/CVF_A_2026-07-12.md",
                        "workOrder": "docs/work_orders/CVF_B_2026-07-12.md",
                        "completionReview": "docs/reviews/CVF_C_2026-07-12.md",
                        "claimBoundary": "entry-level claim boundary",
                    },
                )
            ]
        )
        reader = StubReader(
            {
                "docs/reviews/CVF_C_2026-07-12.md": odvr.ArtifactReadResult(
                    path="docs/reviews/CVF_C_2026-07-12.md",
                    exists=True,
                    status="SOME_STATUS",
                    claim_boundary="terminal claim boundary",
                    reopen_condition=None,
                )
            }
        )
        inputs = odvr.ComposerInputs(
            bootstrap_state=_bootstrap_state(),
            entries=tuple(entries),
            read_artifact=reader,
            resolve_commit=StubResolver({"aaaaaaaa"}),
            generator_drift_clean=True,
        )
        result = odvr.build_odvr_readout(inputs)
        self.assertEqual(result["latestMaterialDecision"]["artifactPath"], "docs/reviews/CVF_C_2026-07-12.md")
        _validate(result)


class ComposerStaleStateTests(unittest.TestCase):
    def test_generator_drift_produces_stale(self) -> None:
        entries = odvr.find_eligible_entries(
            [
                _entry(
                    1,
                    "e",
                    {
                        "status": "OK",
                        "materialCommit": "bbbbbbbb",
                        "roadmap": "docs/roadmaps/CVF_A_2026-07-12.md",
                        "claimBoundary": "cb",
                    },
                )
            ]
        )
        reader = StubReader(
            {
                "docs/roadmaps/CVF_A_2026-07-12.md": odvr.ArtifactReadResult(
                    path="docs/roadmaps/CVF_A_2026-07-12.md",
                    exists=True,
                    status="OK",
                    claim_boundary="cb",
                    reopen_condition=None,
                )
            }
        )
        inputs = odvr.ComposerInputs(
            bootstrap_state=_bootstrap_state(),
            entries=tuple(entries),
            read_artifact=reader,
            resolve_commit=StubResolver({"bbbbbbbb"}),
            generator_drift_clean=False,
        )
        result = odvr.build_odvr_readout(inputs)
        self.assertEqual(result["aggregateFreshness"], "STALE")
        self.assertIn("CVF_SESSION/ACTIVE_SESSION_STATE.json", result["staleSourceAnchors"])
        _validate(result)

    def test_status_mismatch_produces_stale(self) -> None:
        entries = odvr.find_eligible_entries(
            [
                _entry(
                    1,
                    "e",
                    {
                        "status": "OLD_STATUS",
                        "materialCommit": "cccccccc",
                        "roadmap": "docs/roadmaps/CVF_A_2026-07-12.md",
                        "claimBoundary": "cb",
                    },
                )
            ]
        )
        reader = StubReader(
            {
                "docs/roadmaps/CVF_A_2026-07-12.md": odvr.ArtifactReadResult(
                    path="docs/roadmaps/CVF_A_2026-07-12.md",
                    exists=True,
                    status="NEW_STATUS",
                    claim_boundary="cb",
                    reopen_condition=None,
                )
            }
        )
        inputs = odvr.ComposerInputs(
            bootstrap_state=_bootstrap_state(),
            entries=tuple(entries),
            read_artifact=reader,
            resolve_commit=StubResolver({"cccccccc"}),
            generator_drift_clean=True,
        )
        result = odvr.build_odvr_readout(inputs)
        self.assertEqual(result["aggregateFreshness"], "STALE")
        self.assertIn("docs/roadmaps/CVF_A_2026-07-12.md", result["staleSourceAnchors"])
        _validate(result)


class ComposerMissingSourceStateTests(unittest.TestCase):
    def test_unresolved_commit_produces_missing_source(self) -> None:
        entries = odvr.find_eligible_entries(
            [
                _entry(
                    1,
                    "e",
                    {
                        "status": "OK",
                        "materialCommit": "deadbeef",
                        "roadmap": "docs/roadmaps/CVF_A_2026-07-12.md",
                        "claimBoundary": "cb",
                    },
                )
            ]
        )
        inputs = odvr.ComposerInputs(
            bootstrap_state=_bootstrap_state(),
            entries=tuple(entries),
            read_artifact=StubReader({}),
            resolve_commit=StubResolver(set()),
            generator_drift_clean=True,
        )
        result = odvr.build_odvr_readout(inputs)
        self.assertEqual(result["aggregateFreshness"], "MISSING_SOURCE")
        self.assertIn("deadbeef", result["missingSourceAnchor"])
        _validate(result)

    def test_absent_artifact_produces_missing_source(self) -> None:
        entries = odvr.find_eligible_entries(
            [
                _entry(
                    1,
                    "e",
                    {
                        "status": "OK",
                        "materialCommit": "dddddddd",
                        "roadmap": "docs/roadmaps/CVF_MISSING_2026-07-12.md",
                        "claimBoundary": "cb",
                    },
                )
            ]
        )
        inputs = odvr.ComposerInputs(
            bootstrap_state=_bootstrap_state(),
            entries=tuple(entries),
            read_artifact=StubReader({}),  # nothing registered -> exists False
            resolve_commit=StubResolver({"dddddddd"}),
            generator_drift_clean=True,
        )
        result = odvr.build_odvr_readout(inputs)
        self.assertEqual(result["aggregateFreshness"], "MISSING_SOURCE")
        self.assertEqual(result["missingSourceAnchor"], "docs/roadmaps/CVF_MISSING_2026-07-12.md")
        _validate(result)

    def test_no_eligible_entry_produces_missing_source(self) -> None:
        inputs = odvr.ComposerInputs(
            bootstrap_state=_bootstrap_state(),
            entries=(),
            read_artifact=StubReader({}),
            resolve_commit=StubResolver(set()),
            generator_drift_clean=True,
        )
        result = odvr.build_odvr_readout(inputs)
        self.assertEqual(result["aggregateFreshness"], "MISSING_SOURCE")
        _validate(result)

    def test_missing_bootstrap_field_produces_missing_source(self) -> None:
        inputs = odvr.ComposerInputs(
            bootstrap_state={"currentMode": "x"},  # missing activeHandoff/nextAllowedMove
            entries=(),
            read_artifact=StubReader({}),
            resolve_commit=StubResolver(set()),
            generator_drift_clean=True,
        )
        result = odvr.build_odvr_readout(inputs)
        self.assertEqual(result["aggregateFreshness"], "MISSING_SOURCE")
        _validate(result)

    def test_missing_claim_boundary_produces_missing_source(self) -> None:
        entries = odvr.find_eligible_entries(
            [
                _entry(
                    1,
                    "e",
                    {
                        "status": "OK",
                        "materialCommit": "eeeeeeee",
                        "roadmap": "docs/roadmaps/CVF_A_2026-07-12.md",
                    },
                )
            ]
        )
        reader = StubReader(
            {
                "docs/roadmaps/CVF_A_2026-07-12.md": odvr.ArtifactReadResult(
                    path="docs/roadmaps/CVF_A_2026-07-12.md",
                    exists=True,
                    status="OK",
                    claim_boundary=None,
                    reopen_condition=None,
                )
            }
        )
        inputs = odvr.ComposerInputs(
            bootstrap_state=_bootstrap_state(),
            entries=tuple(entries),
            read_artifact=reader,
            resolve_commit=StubResolver({"eeeeeeee"}),
            generator_drift_clean=True,
        )
        result = odvr.build_odvr_readout(inputs)
        self.assertEqual(result["aggregateFreshness"], "MISSING_SOURCE")
        _validate(result)


class ComposerContradictedStateTests(unittest.TestCase):
    def test_equal_state_order_identical_evidence_is_not_contradicted(self) -> None:
        value = {
            "status": "CLOSED_PASS_BOUNDED",
            "materialCommit": "11111111",
            "completionReview": "docs/reviews/CVF_A_2026-07-01.md",
            "claimBoundary": "bounded closure",
        }
        entries = odvr.find_eligible_entries([_entry(9, "a", value), _entry(9, "b", dict(value))])
        reader = StubReader({
            "docs/reviews/CVF_A_2026-07-01.md": odvr.ArtifactReadResult(
                "docs/reviews/CVF_A_2026-07-01.md", True, "CLOSED_PASS_BOUNDED", "bounded closure", None
            )
        })
        result = odvr.build_odvr_readout(odvr.ComposerInputs(
            _bootstrap_state(), tuple(entries), reader, StubResolver({"11111111"}), True
        ))
        self.assertEqual(result["aggregateFreshness"], "CURRENT")
        self.assertIsNone(result["terminalValueVerdict"])
        _validate(result)

    def test_equal_state_order_conflict_produces_contradicted(self) -> None:
        entries = odvr.find_eligible_entries(
            [
                _entry(
                    9,
                    "a",
                    {
                        "status": "CLOSED_PASS_BOUNDED",
                        "materialCommit": "11111111",
                        "roadmap": "docs/roadmaps/CVF_A_2026-07-01.md",
                    },
                ),
                _entry(
                    9,
                    "b",
                    {
                        "status": "PROPOSED",
                        "materialCommit": "22222222",
                        "roadmap": "docs/roadmaps/CVF_B_2026-07-01.md",
                    },
                ),
            ]
        )
        inputs = odvr.ComposerInputs(
            bootstrap_state=_bootstrap_state(),
            entries=tuple(entries),
            read_artifact=StubReader({}),
            resolve_commit=StubResolver({"11111111", "22222222"}),
            generator_drift_clean=True,
        )
        result = odvr.build_odvr_readout(inputs)
        self.assertEqual(result["aggregateFreshness"], "CONTRADICTED")
        self.assertEqual(len(result["contradictions"][0]["anchors"]), 2)
        anchor_paths = {a["sourcePath"] for a in result["contradictions"][0]["anchors"]}
        self.assertEqual(
            anchor_paths,
            {"docs/roadmaps/CVF_A_2026-07-01.md", "docs/roadmaps/CVF_B_2026-07-01.md"},
        )
        _validate(result)

    def test_multiple_unknown_artifact_roles_fail_closed(self) -> None:
        entries = odvr.find_eligible_entries([
            _entry(10, "unknownRoles", {
                "status": "CLOSED_PASS_BOUNDED",
                "materialCommit": "33333333",
                "alphaArtifact": "docs/reviews/CVF_A_2026-07-01.md",
                "betaArtifact": "docs/roadmaps/CVF_B_2026-07-01.md",
            })
        ])
        result = odvr.build_odvr_readout(odvr.ComposerInputs(
            _bootstrap_state(), tuple(entries), StubReader({}), StubResolver({"33333333"}), True
        ))
        self.assertEqual(result["aggregateFreshness"], "MISSING_SOURCE")
        _validate(result)

    def test_explicit_value_verdict_is_preserved(self) -> None:
        self.assertEqual(
            odvr._classify_value_verdict("REVIEWER_ACCEPTED_VALUE_NOT_PROVEN"),
            "REVIEWER_ACCEPTED_VALUE_NOT_PROVEN",
        )
        self.assertEqual(odvr._classify_value_verdict("BLOCKED_LIVE_PROVIDER"), "BLOCKED_LIVE_PROVIDER")
        self.assertIsNone(odvr._classify_value_verdict("CLOSED_PASS_BOUNDED"))


class DeterminismAndNoMutationTests(unittest.TestCase):
    def test_composer_is_deterministic_for_identical_inputs(self) -> None:
        entries = odvr.find_eligible_entries(
            [
                _entry(
                    1,
                    "e",
                    {
                        "status": "OK",
                        "materialCommit": "ffffffff",
                        "roadmap": "docs/roadmaps/CVF_A_2026-07-12.md",
                        "claimBoundary": "cb",
                    },
                )
            ]
        )
        reader = StubReader(
            {
                "docs/roadmaps/CVF_A_2026-07-12.md": odvr.ArtifactReadResult(
                    path="docs/roadmaps/CVF_A_2026-07-12.md",
                    exists=True,
                    status="OK",
                    claim_boundary="cb",
                    reopen_condition=None,
                )
            }
        )
        inputs = odvr.ComposerInputs(
            bootstrap_state=_bootstrap_state(),
            entries=tuple(entries),
            read_artifact=reader,
            resolve_commit=StubResolver({"ffffffff"}),
            generator_drift_clean=True,
        )
        first = odvr.build_odvr_readout(inputs)
        second = odvr.build_odvr_readout(inputs)
        self.assertEqual(first, second)

    def test_pure_composer_never_imports_write_capable_calls(self) -> None:
        source = Path(odvr.__file__).read_text(encoding="utf-8")
        # the pure composer function body must not call open()/write_text()/Path.mkdir
        import inspect

        body = inspect.getsource(odvr.build_odvr_readout)
        for forbidden in ("open(", "write_text(", ".mkdir(", "subprocess."):
            self.assertNotIn(forbidden, body, f"build_odvr_readout must not contain `{forbidden}`")
        self.assertIn("def build_odvr_readout", source)

    def test_cli_smoke_produces_schema_valid_current_state_with_no_writes(self) -> None:
        before = subprocess.run(
            ["git", "status", "--short"], cwd=REPO_ROOT, capture_output=True, text=True
        ).stdout
        proc = subprocess.run(
            [sys.executable, "governance/compat/run_odvr_readout.py", "--json"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        after = subprocess.run(
            ["git", "status", "--short"], cwd=REPO_ROOT, capture_output=True, text=True
        ).stdout
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(before, after, "CLI invocation must not change git working tree status")
        readout = json.loads(proc.stdout)
        _validate(readout)
        self.assertIn(readout["aggregateFreshness"], {"CURRENT", "STALE", "CONTRADICTED", "MISSING_SOURCE"})

    def test_cli_smoke_output_contains_no_denylisted_secret_field_names(self) -> None:
        proc = subprocess.run(
            [sys.executable, "governance/compat/run_odvr_readout.py", "--json"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        readout_text = proc.stdout.lower()
        for forbidden in ("api_key", "apikey", "secret", "password", "bearer", "access_token"):
            self.assertNotIn(forbidden, readout_text)


if __name__ == "__main__":
    unittest.main()
