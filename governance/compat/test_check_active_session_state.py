#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_active_session_state.py")
SPEC = importlib.util.spec_from_file_location("check_active_session_state", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class ActiveSessionStateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        self.first_read = "reviews/current.md"
        self.startup_guard = "guards/current.md"

        for rel in (
            "CVF_SESSION_MEMORY.md",
            "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json",
            "CVF_SESSION/ACTIVE_SESSION_STATE.json",
            "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json",
            "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md",
            "CVF_SESSION/READ_FIRST.md",
            "CVF_SESSION/REQUIRED_STARTUP_GUARDS.md",
            "AGENTS.md",
            "CLAUDE.md",
            "governance/compat/run_local_governance_hook_chain.py",
            "AGENT_HANDOFF_V8_2026-05-17.md",
            self.first_read,
            self.startup_guard,
        ):
            path = self.repo_root / rel
            path.parent.mkdir(parents=True, exist_ok=True)

        state = {
            "activeSessionFrontDoor": "CVF_SESSION_MEMORY.md",
            "activeStateRegistry": "CVF_SESSION/ACTIVE_SESSION_STATE.json",
            "activeReviewQueue": "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json",
            "painPointClosureDirection": "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md",
            "activeHandoff": "AGENT_HANDOFF_V8_2026-05-17.md",
            "historicalHandoffArchive": "CVF_SESSION/handoffs/archive",
            "supersededHandoffs": ["CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md"],
            "relatedHandoffs": [],
            "currentMode": "system_reconvergence_stop",
            "freezePosture": "governance_kernel_freeze_recommended",
            "requiredFirstReads": [self.first_read],
            "requiredStartupGuards": [self.startup_guard],
            "blockedWorkClasses": [
                "broad_external_knowledge_absorption",
                "public_claims_of_coherent_governed_capability_runtime",
            ],
        }
        (self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json").write_text(
            json.dumps(state),
            encoding="utf-8",
        )
        (self.repo_root / "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json").write_text(
            json.dumps(
                {
                    "bootstrapReadModelVersion": "0.1.0",
                    "activeStateRegistry": "CVF_SESSION/ACTIVE_SESSION_STATE.json",
                    "activeHandoff": "AGENT_HANDOFF_V8_2026-05-17.md",
                }
            ),
            encoding="utf-8",
        )
        review_queue = {
            "schemaVersion": "0.1.0",
            "status": "ACTIVE_REVIEW_QUEUE",
            "items": [
                {
                    "id": "current-roadmap",
                    "artifactType": "roadmap",
                    "path": "reviews/current.md",
                    "status": "READY_FOR_REBUTTAL",
                    "expectedResponsePath": "reviews/current-rebuttal.md",
                    "priority": 1,
                },
                {
                    "id": "closed-roadmap",
                    "artifactType": "roadmap",
                    "path": "reviews/closed.md",
                    "status": "REBUTTAL_FILED_BLOCKING",
                    "responsePath": "reviews/closed-rebuttal.md",
                    "priority": 2,
                },
            ],
        }
        (self.repo_root / "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json").write_text(
            json.dumps(review_queue),
            encoding="utf-8",
        )
        (self.repo_root / "CVF_SESSION_MEMORY.md").write_text(
            "ACTIVE SESSION FRONT DOOR\nCVF_SESSION/ACTIVE_SESSION_STATE.json\n"
            "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json\n"
            "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md\n"
            "system_reconvergence_stop\ngovernance_kernel_freeze_recommended\n"
            "AGENT_HANDOFF_V8_2026-05-17.md\n",
            encoding="utf-8",
        )
        for rel in ("CVF_SESSION/READ_FIRST.md", "CVF_SESSION/REQUIRED_STARTUP_GUARDS.md", "AGENTS.md", "CLAUDE.md"):
            (self.repo_root / rel).write_text(
                "CVF_SESSION_MEMORY.md\nCVF_SESSION/ACTIVE_SESSION_STATE.json\n",
                encoding="utf-8",
            )
        (self.repo_root / "governance/compat/run_local_governance_hook_chain.py").write_text(
            "governance/compat/check_active_session_state.py\n",
            encoding="utf-8",
        )
        (self.repo_root / "CVF_SESSION/handoffs/archive").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md").write_text(
            "Status: ARCHIVED\n",
            encoding="utf-8",
        )
        (self.repo_root / self.first_read).write_text("Memory class: POINTER_RECORD\n", encoding="utf-8")
        (self.repo_root / self.startup_guard).write_text("Memory class: POINTER_RECORD\n", encoding="utf-8")
        (self.repo_root / "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md").write_text(
            "Status: ACTIVE_DIRECTION_RECORD\n",
            encoding="utf-8",
        )
        (self.repo_root / "reviews/closed.md").write_text("Status: REBUTTAL_FILED\n", encoding="utf-8")
        (self.repo_root / "reviews/closed-rebuttal.md").write_text("Status: REBUTTAL_FILED\n", encoding="utf-8")
        (self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md").write_text(
            "Status: ACTIVE - current\n",
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_compliant_session_state_passes(self) -> None:
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertTrue(report["compliant"])
        self.assertEqual(report["activeHandoff"], "AGENT_HANDOFF_V8_2026-05-17.md")
        self.assertEqual(report["readyReviewItems"], ["current-roadmap"])
        self.assertEqual(report["detectedActiveHandoffs"], ["AGENT_HANDOFF_V8_2026-05-17.md"])

    def test_missing_ignored_required_first_read_is_allowed(self) -> None:
        private_read = ".private_reference/legacy/local-only.md"
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["requiredFirstReads"] = [self.first_read, private_read]
        state_path.write_text(json.dumps(state), encoding="utf-8")

        with patch.object(MODULE, "REPO_ROOT", self.repo_root), patch.object(
            MODULE, "_git_ignored", side_effect=lambda path: path == private_read
        ):
            report = MODULE._classify()

        self.assertTrue(report["compliant"])

    def test_ready_review_item_with_existing_response_fails(self) -> None:
        (self.repo_root / "reviews/current-rebuttal.md").write_text(
            "Status: REBUTTAL_FILED\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertTrue(
            any("READY_FOR_REBUTTAL item already has response path" in issue
                for issue in report["reviewQueueViolations"])
        )

    def test_filed_review_item_missing_response_fails(self) -> None:
        (self.repo_root / "reviews/closed-rebuttal.md").unlink()

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertTrue(
            any("responsePath does not exist" in issue for issue in report["reviewQueueViolations"])
        )

    def test_multiple_active_handoffs_fail(self) -> None:
        (self.repo_root / "AGENT_HANDOFF_V7_2026-05-16.md").write_text(
            "Status: ACTIVE - stale\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertGreaterEqual(report["handoffViolationCount"], 1)

    def test_stale_root_handoff_reference_in_front_door_fails(self) -> None:
        (self.repo_root / "CVF_SESSION_MEMORY.md").write_text(
            "ACTIVE SESSION FRONT DOOR\nCVF_SESSION/ACTIVE_SESSION_STATE.json\n"
            "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json\n"
            "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md\n"
            "system_reconvergence_stop\ngovernance_kernel_freeze_recommended\n"
            "AGENT_HANDOFF_V8_2026-05-17.md\n"
            "Resolve active handoff from registry: AGENT_HANDOFF_V7_2026-05-16.md\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertTrue(
            any("stale root handoff reference" in marker
                for marker in report["markerViolations"]["CVF_SESSION_MEMORY.md"])
        )

    def test_archive_qualified_handoff_reference_is_allowed(self) -> None:
        (self.repo_root / "CVF_SESSION_MEMORY.md").write_text(
            "ACTIVE SESSION FRONT DOOR\nCVF_SESSION/ACTIVE_SESSION_STATE.json\n"
            "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json\n"
            "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md\n"
            "system_reconvergence_stop\ngovernance_kernel_freeze_recommended\n"
            "AGENT_HANDOFF_V8_2026-05-17.md\n"
            "Archive: CVF_SESSION/handoffs/archive/AGENT_HANDOFF_V7_2026-05-16.md\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertTrue(report["compliant"])

    def test_superseded_handoff_must_live_under_archive(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["supersededHandoffs"].append("AGENT_HANDOFF_V7_2026-05-16.md")
        state_path.write_text(json.dumps(state), encoding="utf-8")
        (self.repo_root / "AGENT_HANDOFF_V7_2026-05-16.md").write_text(
            "Status: ARCHIVED - stale\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertTrue(
            any("supersededHandoffs handoff path must live under historicalHandoffArchive" in issue
                for issue in report["stateViolations"])
        )
        self.assertTrue(
            any("non-active root handoff must be archived or removed" in issue
                for issue in report["handoffViolations"])
        )

    def test_unregistered_archived_root_handoff_fails(self) -> None:
        (self.repo_root / "AGENT_HANDOFF_V7_2026-05-16.md").write_text(
            "Status: ARCHIVED - stale\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertTrue(
            any("non-active root handoff must be archived or removed" in issue
                for issue in report["handoffViolations"])
        )

    def test_superseded_root_handoff_fails(self) -> None:
        (self.repo_root / "AGENT_HANDOFF_V7_2026-05-16.md").write_text(
            "Status: SUPERSEDED -- archived to CVF_SESSION/handoffs/archive/AGENT_HANDOFF_V7_2026-05-16.md\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertTrue(
            any("non-active root handoff must be archived or removed" in issue
                for issue in report["handoffViolations"])
        )

    def test_unexpected_status_root_handoff_fails(self) -> None:
        (self.repo_root / "AGENT_HANDOFF_V7_2026-05-16.md").write_text(
            "Status: DRAFT\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertTrue(
            any("non-active root handoff must be archived or removed" in issue
                for issue in report["handoffViolations"])
        )

    def test_handoff_sync_commit_can_reference_parent_head(self) -> None:
        (self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md").write_text(
            "Status: ACTIVE - current\nCurrent HEAD: `parent123`\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root), patch.object(
            MODULE, "_git_head_sha", return_value="head4567890abcdef"
        ), patch.object(
            MODULE, "_git_parent_sha", return_value="parent12390abcdef"
        ), patch.object(
            MODULE, "_head_changed_path", return_value=True
        ), patch.object(
            MODULE, "_head_changed_paths",
            return_value={
                "AGENT_HANDOFF_V8_2026-05-17.md",
                "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json",
                "CVF_SESSION/ACTIVE_SESSION_STATE.json",
            },
        ):
            report = MODULE._classify()

        self.assertTrue(report["compliant"])
        self.assertFalse(report["headShaInHandoff"])
        self.assertTrue(report["parentShaInHandoff"])

    def test_generated_active_state_sources_are_session_sync_paths(self) -> None:
        self.assertTrue(
            MODULE._is_session_sync_path(
                "CVF_SESSION/state/entries/exampleStateMarker.json"
            )
        )
        self.assertTrue(
            MODULE._is_session_sync_path(
                "CVF_SESSION/state/ACTIVE_SESSION_STATE_CORE.json"
            )
        )
        self.assertTrue(
            MODULE._is_session_sync_path(
                "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
            )
        )

    def test_non_handoff_commit_must_reference_current_head(self) -> None:
        (self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md").write_text(
            "Status: ACTIVE - current\nCurrent HEAD: `parent123`\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root), patch.object(
            MODULE, "_git_head_sha", return_value="head4567890abcdef"
        ), patch.object(
            MODULE, "_git_parent_sha", return_value="parent12390abcdef"
        ), patch.object(
            MODULE, "_head_changed_path", return_value=False
        ), patch.object(
            MODULE, "_head_changed_paths", return_value={"governance/compat/check_active_session_state.py"}
        ):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertEqual(report["handoffViolationCount"], 1)

    def test_latest_lhw_closure_requires_synced_next_allowed_move(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["nextAllowedMove"] = "LHW8 is present in HEAD as CLOSED_PASS_BOUNDED."
        state["lhw9WorkflowConnectorWave9"] = "CLOSED_PASS_BOUNDED."
        state_path.write_text(json.dumps(state), encoding="utf-8")
        (self.repo_root / "CVF_SESSION_MEMORY.md").write_text(
            "ACTIVE SESSION FRONT DOOR\nCVF_SESSION/ACTIVE_SESSION_STATE.json\n"
            "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json\n"
            "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md\n"
            "system_reconvergence_stop\ngovernance_kernel_freeze_recommended\n"
            "AGENT_HANDOFF_V8_2026-05-17.md\n"
            "## Next Allowed Move\nLHW8 is present in HEAD as CLOSED_PASS_BOUNDED.\n",
            encoding="utf-8",
        )
        (self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md").write_text(
            "Status: ACTIVE - current\nLHW9 CLOSED_PASS_BOUNDED.\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertEqual(report["latestClosedLhwWave"], 9)
        self.assertEqual(report["continuityViolationCount"], 2)

    def test_latest_lhw_closure_passes_when_continuity_is_synced(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["nextAllowedMove"] = "LHW9 is present in HEAD as CLOSED_PASS_BOUNDED."
        state["lhw9WorkflowConnectorWave9"] = "CLOSED_PASS_BOUNDED."
        state_path.write_text(json.dumps(state), encoding="utf-8")
        (self.repo_root / "CVF_SESSION_MEMORY.md").write_text(
            "ACTIVE SESSION FRONT DOOR\nCVF_SESSION/ACTIVE_SESSION_STATE.json\n"
            "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json\n"
            "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md\n"
            "system_reconvergence_stop\ngovernance_kernel_freeze_recommended\n"
            "AGENT_HANDOFF_V8_2026-05-17.md\n"
            "## Next Allowed Move\nLHW9 is present in HEAD as CLOSED_PASS_BOUNDED.\n",
            encoding="utf-8",
        )
        (self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md").write_text(
            "Status: ACTIVE - current\nLHW9 CLOSED_PASS_BOUNDED.\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertTrue(report["compliant"])
        self.assertEqual(report["latestClosedLhwWave"], 9)

    def test_front_door_next_allowed_primary_token_must_match_state(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["nextAllowedMove"] = "Next allowed move: DIR-T2 only through fresh GC-018."
        state_path.write_text(json.dumps(state), encoding="utf-8")
        (self.repo_root / "CVF_SESSION_MEMORY.md").write_text(
            "ACTIVE SESSION FRONT DOOR\nCVF_SESSION/ACTIVE_SESSION_STATE.json\n"
            "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json\n"
            "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md\n"
            "system_reconvergence_stop\ngovernance_kernel_freeze_recommended\n"
            "AGENT_HANDOFF_V8_2026-05-17.md\n"
            "## Next Allowed Move\nNext allowed move: DIR-T1 only through stale text.\n",
            encoding="utf-8",
        )
        (self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md").write_text(
            "Status: ACTIVE - current\n## Next Allowed Move\nDIR-T2 may be opened.\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertTrue(
            any(
                "CVF_SESSION_MEMORY.md Next Allowed Move primary token `dir-t1`"
                in issue
                for issue in report["continuityViolations"]
            )
        )

    def test_handoff_next_allowed_primary_token_must_match_state(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["nextAllowedMove"] = "Next allowed move: DIR-T2 only through fresh GC-018."
        state_path.write_text(json.dumps(state), encoding="utf-8")
        (self.repo_root / "CVF_SESSION_MEMORY.md").write_text(
            "ACTIVE SESSION FRONT DOOR\nCVF_SESSION/ACTIVE_SESSION_STATE.json\n"
            "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json\n"
            "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md\n"
            "system_reconvergence_stop\ngovernance_kernel_freeze_recommended\n"
            "AGENT_HANDOFF_V8_2026-05-17.md\n"
            "## Next Allowed Move\nNext allowed move: DIR-T2 only through fresh GC-018.\n",
            encoding="utf-8",
        )
        (self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md").write_text(
            "Status: ACTIVE - current\n## Next Allowed Move\nDIR-T1 may be opened.\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertFalse(report["compliant"])
        self.assertTrue(
            any(
                "active handoff Next Allowed Move primary token `dir-t1`"
                in issue
                for issue in report["continuityViolations"]
            )
        )

    def test_next_allowed_primary_token_alignment_passes_when_synced(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["nextAllowedMove"] = "Next allowed move: DIR-T2 only through fresh GC-018."
        state_path.write_text(json.dumps(state), encoding="utf-8")
        (self.repo_root / "CVF_SESSION_MEMORY.md").write_text(
            "ACTIVE SESSION FRONT DOOR\nCVF_SESSION/ACTIVE_SESSION_STATE.json\n"
            "CVF_SESSION/ACTIVE_REVIEW_QUEUE.json\n"
            "docs/reviews/archive/CVF_REVIEW_CVF_PAIN_POINT_CLOSURE_DIRECTION_CODEX_2026-05-20.md\n"
            "system_reconvergence_stop\ngovernance_kernel_freeze_recommended\n"
            "AGENT_HANDOFF_V8_2026-05-17.md\n"
            "## Next Allowed Move\nNext allowed move: DIR-T2 only through fresh GC-018.\n",
            encoding="utf-8",
        )
        (self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md").write_text(
            "Status: ACTIVE - current\n## Next Allowed Move\nDIR-T2 may be opened.\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            report = MODULE._classify()

        self.assertTrue(report["compliant"])


if __name__ == "__main__":
    unittest.main()
