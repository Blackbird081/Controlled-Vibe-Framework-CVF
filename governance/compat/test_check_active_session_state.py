#!/usr/bin/env python3
from __future__ import annotations

import hashlib
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
            "docs/reference/CVF_ACTIVE_CONTINUITY_READ_BUDGET_STANDARD_2026-08-10.md",
            "governance/compat/CVF_ACTIVE_CONTINUITY_READ_BUDGET_MIGRATION.json",
            self.first_read,
            self.startup_guard,
        ):
            path = self.repo_root / rel
            path.parent.mkdir(parents=True, exist_ok=True)

        self.authority_baseline_path = "docs/baselines/TEST_FIXTURE_BASELINE.md"
        self.authority_work_order_path = "docs/work_orders/TEST_FIXTURE_WORK_ORDER.md"
        self.authority_baseline_sha256 = self._write_authority_fixture(self.authority_baseline_path, "fixture baseline content\n")
        self.authority_work_order_sha256 = self._write_authority_fixture(self.authority_work_order_path, "fixture work order content\n")

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
            "currentAuthority": {
                "baselinePath": self.authority_baseline_path, "baselineSha256": self.authority_baseline_sha256,
                "workOrderPath": self.authority_work_order_path, "workOrderSha256": self.authority_work_order_sha256,
            },
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
        (self.repo_root / "docs/reference/CVF_ACTIVE_CONTINUITY_READ_BUDGET_STANDARD_2026-08-10.md").write_text(
            "# CVF Active Continuity Read-Budget Standard\n",
            encoding="utf-8",
        )
        (self.repo_root / "governance/compat/CVF_ACTIVE_CONTINUITY_READ_BUDGET_MIGRATION.json").write_text(
            json.dumps(
                {
                    "schemaVersion": "1.0",
                    "status": "ACTIVE_MIGRATION_DEBT",
                    "expiresOn": "2099-01-01",
                    "removalAction": "REMOVE_ROW_IN_T2_AFTER_SURFACE_COMPACTION",
                    "entries": [],
                }
            ),
            encoding="utf-8",
        )

    def _write_authority_fixture(self, rel_path: str, content: str) -> str:
        abs_path = self.repo_root / rel_path
        abs_path.parent.mkdir(parents=True, exist_ok=True)
        abs_path.write_text(content, encoding="utf-8")
        return hashlib.sha256(abs_path.read_bytes()).hexdigest()

    def _write_migration_registry(self, entries: list[dict], *, expires_on: str = "2099-01-01") -> None:
        (self.repo_root / "governance/compat/CVF_ACTIVE_CONTINUITY_READ_BUDGET_MIGRATION.json").write_text(
            json.dumps(
                {
                    "schemaVersion": "1.0",
                    "status": "ACTIVE_MIGRATION_DEBT",
                    "expiresOn": expires_on,
                    "removalAction": "REMOVE_ROW_IN_T2_AFTER_SURFACE_COMPACTION",
                    "entries": entries,
                }
            ),
            encoding="utf-8",
        )

    def _migration_row_for(self, rel_path: str, *, target_lines: int, target_bytes: int) -> dict:
        abs_path = self.repo_root / rel_path
        data = abs_path.read_bytes()
        text = data.decode("utf-8")
        return {
            "path": rel_path,
            "sha256": hashlib.sha256(data).hexdigest(),
            "lineCount": len(text.splitlines()),
            "byteCount": len(data),
            "approvedMaxLines": len(text.splitlines()),
            "approvedMaxBytes": len(data),
            "targetMaxLines": target_lines,
            "targetMaxBytes": target_bytes,
            "enabled": True,
        }

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
                "governance/compat/CVF_ACTIVE_CONTINUITY_READ_BUDGET_MIGRATION.json"
            )
        )
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


class ActiveContinuityReadBudgetTests(unittest.TestCase):
    """Adversarial fixtures for the T1 active continuity read-budget rules.

    Reuses ActiveSessionStateTests.setUp fixtures via composition so these
    tests never touch the real repository continuity files.
    """

    def setUp(self) -> None:
        self._base = ActiveSessionStateTests()
        self._base.setUp()
        self.repo_root = self._base.repo_root

    def tearDown(self) -> None:
        self._base.tearDown()

    def _classify(self) -> dict:
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            return MODULE._classify()

    # 1. all compliant budgets pass (covered by test_compliant_session_state_passes
    #    in ActiveSessionStateTests, reused here as a budget-specific assertion)
    def test_compliant_budgets_pass(self) -> None:
        report = self._classify()
        self.assertEqual(report["readBudgetViolationCount"], 0)
        self.assertTrue(report["compliant"])

    @staticmethod
    def _file_at_exact_lines(path, n: int) -> None:
        path.write_text("\n".join(f"L{i}" for i in range(n)) + "\n", encoding="utf-8")

    @staticmethod
    def _file_at_exact_bytes(path, n: int, line_count: int) -> None:
        # (line_count - 1) short "a\n" lines, then one final unterminated line
        # padded with 'x' so total byte count is exactly n and total line
        # count (splitlines()) is exactly line_count. Written as raw bytes
        # (newline="") so Windows text-mode CRLF translation cannot inflate
        # the on-disk byte count the checker reads via read_bytes().
        prefix = "a\n" * (line_count - 1)
        prefix_bytes = len(prefix.encode("utf-8"))
        remaining = n - prefix_bytes
        assert remaining >= 0, "requested byte target too small for requested line count"
        content = prefix + ("x" * remaining)
        assert len(content.encode("utf-8")) == n
        assert len(content.splitlines()) == line_count
        path.write_bytes(content.encode("utf-8"))

    # 2. each line budget fails at N+1 (exact boundary, not "way over")
    def test_bootstrap_line_budget_fails_at_n_plus_1(self) -> None:
        bootstrap_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
        self._file_at_exact_lines(bootstrap_path, MODULE.CVF_ACTIVE_CONTINUITY_BOOTSTRAP_MAX_LINES + 1)

        report = self._classify()
        self.assertTrue(
            any("bootstrap read-budget" in issue for issue in report["readBudgetViolations"])
        )

    def test_bootstrap_line_budget_passes_at_exact_n(self) -> None:
        bootstrap_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
        self._file_at_exact_lines(bootstrap_path, MODULE.CVF_ACTIVE_CONTINUITY_BOOTSTRAP_MAX_LINES)

        report = self._classify()
        self.assertFalse(
            any("bootstrap read-budget" in issue for issue in report["readBudgetViolations"])
        )

    def test_front_door_line_budget_fails_at_n_plus_1_without_migration_row(self) -> None:
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        self._file_at_exact_lines(front_door_path, MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES + 1)

        report = self._classify()
        self.assertTrue(
            any("CVF_SESSION_MEMORY.md exceeds read-budget" in issue for issue in report["readBudgetViolations"])
        )

    def test_handoff_line_budget_fails_at_n_plus_1_without_migration_row(self) -> None:
        handoff_path = self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md"
        self._file_at_exact_lines(handoff_path, MODULE.CVF_ACTIVE_CONTINUITY_HANDOFF_MAX_LINES + 1)

        report = self._classify()
        self.assertTrue(
            any("AGENT_HANDOFF_V8_2026-05-17.md exceeds read-budget" in issue for issue in report["readBudgetViolations"])
        )

    def test_handoff_line_budget_passes_at_exact_n(self) -> None:
        handoff_path = self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md"
        self._file_at_exact_lines(handoff_path, MODULE.CVF_ACTIVE_CONTINUITY_HANDOFF_MAX_LINES)

        report = self._classify()
        self.assertFalse(
            any("AGENT_HANDOFF_V8_2026-05-17.md exceeds read-budget" in issue for issue in report["readBudgetViolations"])
        )

    # 3. each byte budget fails at N+1 even when line count passes
    def test_front_door_byte_budget_fails_at_n_plus_1_with_line_count_passing(self) -> None:
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        self._file_at_exact_bytes(
            front_door_path,
            MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES + 1,
            line_count=3,
        )
        actual_lines, actual_bytes = MODULE.acrb.file_lines_bytes(front_door_path)
        self.assertLessEqual(actual_lines, MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES)
        self.assertEqual(actual_bytes, MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES + 1)

        report = self._classify()
        self.assertTrue(
            any("CVF_SESSION_MEMORY.md exceeds read-budget" in issue for issue in report["readBudgetViolations"])
        )

    def test_bootstrap_byte_budget_fails_at_n_plus_1_with_line_count_passing(self) -> None:
        bootstrap_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json"
        self._file_at_exact_bytes(
            bootstrap_path,
            MODULE.acrb.CVF_ACTIVE_CONTINUITY_BOOTSTRAP_MAX_BYTES + 1,
            line_count=3,
        )
        actual_lines, actual_bytes = MODULE.acrb.file_lines_bytes(bootstrap_path)
        self.assertLessEqual(actual_lines, MODULE.CVF_ACTIVE_CONTINUITY_BOOTSTRAP_MAX_LINES)
        self.assertEqual(actual_bytes, MODULE.acrb.CVF_ACTIVE_CONTINUITY_BOOTSTRAP_MAX_BYTES + 1)

        report = self._classify()
        self.assertTrue(
            any("bootstrap read-budget" in issue for issue in report["readBudgetViolations"])
            or any("CVF_ACTIVE_SESSION_BOOTSTRAP_READ_MODEL_MAX_BYTES" in issue for issue in report["bootstrapViolations"])
        )

    def test_handoff_byte_budget_fails_at_n_plus_1_with_line_count_passing(self) -> None:
        handoff_path = self.repo_root / "AGENT_HANDOFF_V8_2026-05-17.md"
        self._file_at_exact_bytes(
            handoff_path,
            MODULE.CVF_ACTIVE_CONTINUITY_HANDOFF_MAX_BYTES + 1,
            line_count=3,
        )
        actual_lines, actual_bytes = MODULE.acrb.file_lines_bytes(handoff_path)
        self.assertLessEqual(actual_lines, MODULE.CVF_ACTIVE_CONTINUITY_HANDOFF_MAX_LINES)
        self.assertEqual(actual_bytes, MODULE.CVF_ACTIVE_CONTINUITY_HANDOFF_MAX_BYTES + 1)

        report = self._classify()
        self.assertTrue(
            any("AGENT_HANDOFF_V8_2026-05-17.md exceeds read-budget" in issue for issue in report["readBudgetViolations"])
        )

    # 4. 13 required reads fail and 12 pass
    def test_thirteen_required_first_reads_fail(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["requiredFirstReads"] = [self._base.first_read] * 13
        state_path.write_text(json.dumps(state), encoding="utf-8")

        report = self._classify()
        self.assertTrue(
            any("requiredFirstReads has 13 raw entries" in issue for issue in report["readBudgetViolations"])
        )

    def test_twelve_required_first_reads_pass(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["requiredFirstReads"] = [self._base.first_read] * 12
        state_path.write_text(json.dumps(state), encoding="utf-8")

        report = self._classify()
        self.assertEqual(report["readBudgetViolationCount"], 0)

    # 5. exact migration debt passes
    def test_exact_migration_debt_passes(self) -> None:
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        base = front_door_path.read_text(encoding="utf-8")
        padding = "\n".join(f"padding line {i}" for i in range(MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES))
        front_door_path.write_text(base + "\n" + padding + "\n", encoding="utf-8")

        row = self._base._migration_row_for(
            "CVF_SESSION_MEMORY.md",
            target_lines=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES,
            target_bytes=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES,
        )
        self._base._write_migration_registry([row])

        report = self._classify()
        self.assertEqual(report["readBudgetViolationCount"], 0)

    # 6. hash, line, byte, max, expiry, path and duplicate-row drift each fail
    # Consolidated matrix: each case drifts exactly one migration-row field
    # (or the registry-level expiresOn) away from the true current facts and
    # expects the listed violation fragment(s) to all appear; setup is
    # otherwise identical across cases.
    def test_migration_row_drift_matrix(self) -> None:
        cases = (
            ("sha256 drift", lambda row: row.update(sha256="0" * 64), None, ("sha256 does not match",)),
            ("lineCount drift", lambda row: row.update(lineCount=row["lineCount"] + 1), None, ("lineCount", "does not match current")),
            ("byteCount drift", lambda row: row.update(byteCount=row["byteCount"] + 1), None, ("byteCount", "does not match current")),
            ("approvedMaxLines below current", lambda row: row.update(approvedMaxLines=row["lineCount"] - 1), None, ("approvedMaxLines must be a strict integer exactly equal",)),
            ("targetMaxLines wrong", lambda row: row.update(targetMaxLines=row["targetMaxLines"] + 1), None, ("targetMaxLines must equal canonical budget",)),
            ("registry expired", lambda row: row, "2000-01-01", ("is expired as of",)),
        )
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        base = front_door_path.read_text(encoding="utf-8")
        padding = "\n".join(f"padding line {i}" for i in range(MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES))
        front_door_path.write_text(base + "\n" + padding + "\n", encoding="utf-8")
        for label, mutate, expires_on, expected_fragments in cases:
            with self.subTest(label=label):
                row = self._base._migration_row_for("CVF_SESSION_MEMORY.md", target_lines=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES, target_bytes=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES)
                mutate(row)
                self._base._write_migration_registry([row], **({"expires_on": expires_on} if expires_on else {}))
                violations = self._classify()["readBudgetViolations"]
                self.assertTrue(all(any(f in issue for issue in violations) for f in expected_fragments), f"{label}: {violations}")

    def test_migration_row_unknown_path_fails(self) -> None:
        row = {
            "path": "SOME_UNKNOWN_FILE.md",
            "sha256": "0" * 64,
            "lineCount": 1,
            "byteCount": 1,
            "approvedMaxLines": 1,
            "approvedMaxBytes": 1,
            "targetMaxLines": 1,
            "targetMaxBytes": 1,
            "enabled": True,
        }
        self._base._write_migration_registry([row])

        report = self._classify()
        self.assertTrue(
            any("is not a recognized front-door/handoff continuity surface" in issue for issue in report["readBudgetViolations"])
        )

    def test_migration_row_duplicate_path_fails(self) -> None:
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        base = front_door_path.read_text(encoding="utf-8")
        padding = "\n".join(f"padding line {i}" for i in range(MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES))
        front_door_path.write_text(base + "\n" + padding + "\n", encoding="utf-8")

        row = self._base._migration_row_for(
            "CVF_SESSION_MEMORY.md",
            target_lines=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES,
            target_bytes=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES,
        )
        self._base._write_migration_registry([row, dict(row)])

        report = self._classify()
        self.assertTrue(
            any("duplicate path" in issue for issue in report["readBudgetViolations"])
        )

    # 7. a compliant surface cannot retain a migration waiver
    def test_compliant_surface_cannot_retain_migration_waiver(self) -> None:
        row = self._base._migration_row_for(
            "CVF_SESSION_MEMORY.md",
            target_lines=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES,
            target_bytes=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES,
        )
        self._base._write_migration_registry([row])

        report = self._classify()
        self.assertTrue(
            any(
                "already within its canonical budget" in issue
                for issue in report["readBudgetViolations"]
            )
        )

    # 8. full-state oversize is advisory, not T1 enforcement failure
    def test_full_state_oversize_is_advisory_only(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["oversizePadding"] = "x" * (MODULE.acrb.CVF_ACTIVE_CONTINUITY_FULL_STATE_ADVISORY_BYTES + 1000)
        state_path.write_text(json.dumps(state), encoding="utf-8")

        report = self._classify()
        self.assertTrue(
            any(
                "ADVISORY" in issue and "full-state advisory threshold" in issue
                for issue in report["fullStateAggregateAdvisories"]
            )
        )
        self.assertEqual(report["readBudgetViolationCount"], 0)

    # 9. unconditional full-state/history startup wording fails
    def test_unconditional_full_read_wording_fails(self) -> None:
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        base = front_door_path.read_text(encoding="utf-8")
        front_door_path.write_text(
            base + "\nAlways read the full state aggregate by default.\n",
            encoding="utf-8",
        )

        report = self._classify()
        self.assertTrue(
            any(
                "unconditional full-state/history read wording" in issue
                for issue in report["readBudgetViolations"]
            )
        )

    # 10. progressive targeted-lookup wording passes
    def test_progressive_targeted_lookup_wording_passes(self) -> None:
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        base = front_door_path.read_text(encoding="utf-8")
        front_door_path.write_text(
            base + "\nPerform a targeted state lookup only when a current fact is missing.\n",
            encoding="utf-8",
        )

        report = self._classify()
        self.assertEqual(report["readBudgetViolationCount"], 0)

    def test_missing_standard_or_migration_file_fails(self) -> None:
        (self.repo_root / "docs/reference/CVF_ACTIVE_CONTINUITY_READ_BUDGET_STANDARD_2026-08-10.md").unlink()

        report = self._classify()
        self.assertTrue(
            any(
                "CVF_ACTIVE_CONTINUITY_READ_BUDGET_STANDARD_2026-08-10.md is missing" in issue
                for issue in report["readBudgetViolations"]
            )
        )

    # F4: strict migration registry typing
    def test_migration_top_level_null_fails(self) -> None:
        (self.repo_root / "governance/compat/CVF_ACTIVE_CONTINUITY_READ_BUDGET_MIGRATION.json").write_text(
            "null", encoding="utf-8"
        )
        report = self._classify()
        self.assertTrue(
            any("top-level value must be a JSON object" in issue for issue in report["readBudgetViolations"])
        )

    def test_migration_top_level_list_fails(self) -> None:
        (self.repo_root / "governance/compat/CVF_ACTIVE_CONTINUITY_READ_BUDGET_MIGRATION.json").write_text(
            "[]", encoding="utf-8"
        )
        report = self._classify()
        self.assertTrue(
            any("top-level value must be a JSON object" in issue for issue in report["readBudgetViolations"])
        )

    def test_migration_top_level_string_fails(self) -> None:
        (self.repo_root / "governance/compat/CVF_ACTIVE_CONTINUITY_READ_BUDGET_MIGRATION.json").write_text(
            '"not an object"', encoding="utf-8"
        )
        report = self._classify()
        self.assertTrue(
            any("top-level value must be a JSON object" in issue for issue in report["readBudgetViolations"])
        )

    def test_migration_missing_schema_version_fails(self) -> None:
        self._base._write_migration_registry([])
        migration_path = self.repo_root / "governance/compat/CVF_ACTIVE_CONTINUITY_READ_BUDGET_MIGRATION.json"
        migration = json.loads(migration_path.read_text(encoding="utf-8"))
        del migration["schemaVersion"]
        migration_path.write_text(json.dumps(migration), encoding="utf-8")

        report = self._classify()
        self.assertTrue(
            any("missing required top-level fields" in issue for issue in report["readBudgetViolations"])
        )

    def test_migration_wrong_schema_version_fails(self) -> None:
        migration_path = self.repo_root / "governance/compat/CVF_ACTIVE_CONTINUITY_READ_BUDGET_MIGRATION.json"
        self._base._write_migration_registry([])
        migration = json.loads(migration_path.read_text(encoding="utf-8"))
        migration["schemaVersion"] = "2.0"
        migration_path.write_text(json.dumps(migration), encoding="utf-8")

        report = self._classify()
        self.assertTrue(
            any("schemaVersion must equal '1.0'" in issue for issue in report["readBudgetViolations"])
        )

    def test_migration_compact_expires_on_date_fails(self) -> None:
        self._base._write_migration_registry([], expires_on="20990101")
        report = self._classify()
        self.assertTrue(
            any("expiresOn must match YYYY-MM-DD" in issue for issue in report["readBudgetViolations"])
        )

    def test_migration_approved_max_bytes_below_current_fails(self) -> None:
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        self._file_at_exact_lines(front_door_path, MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES + 5)
        row = self._base._migration_row_for(
            "CVF_SESSION_MEMORY.md",
            target_lines=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES,
            target_bytes=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES,
        )
        row["approvedMaxBytes"] = row["byteCount"] - 1
        self._base._write_migration_registry([row])

        report = self._classify()
        self.assertTrue(
            any("approvedMaxBytes must be a strict integer exactly equal" in issue for issue in report["readBudgetViolations"])
        )

    def test_migration_approved_max_lines_above_current_fails(self) -> None:
        # F4 strict equality: approvedMaxLines greater than current lineCount
        # must fail closed, not be treated as a permissive upper bound.
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        self._file_at_exact_lines(front_door_path, MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES + 5)
        row = self._base._migration_row_for(
            "CVF_SESSION_MEMORY.md",
            target_lines=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES,
            target_bytes=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES,
        )
        row["approvedMaxLines"] = row["lineCount"] + 1
        self._base._write_migration_registry([row])

        report = self._classify()
        self.assertTrue(
            any("approvedMaxLines must be a strict integer exactly equal" in issue for issue in report["readBudgetViolations"])
        )

    def test_migration_approved_max_bytes_above_current_fails(self) -> None:
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        self._file_at_exact_lines(front_door_path, MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES + 5)
        row = self._base._migration_row_for(
            "CVF_SESSION_MEMORY.md",
            target_lines=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES,
            target_bytes=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES,
        )
        row["approvedMaxBytes"] = row["byteCount"] + 1
        self._base._write_migration_registry([row])

        report = self._classify()
        self.assertTrue(
            any("approvedMaxBytes must be a strict integer exactly equal" in issue for issue in report["readBudgetViolations"])
        )

    def test_migration_approved_max_exactly_equal_current_passes(self) -> None:
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        self._file_at_exact_lines(front_door_path, MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES + 5)
        row = self._base._migration_row_for(
            "CVF_SESSION_MEMORY.md",
            target_lines=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES,
            target_bytes=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES,
        )
        self.assertEqual(row["approvedMaxLines"], row["lineCount"])
        self.assertEqual(row["approvedMaxBytes"], row["byteCount"])
        self._base._write_migration_registry([row])

        report = self._classify()
        self.assertEqual(report["readBudgetViolationCount"], 0)

    def test_migration_bool_as_int_for_line_count_fails(self) -> None:
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        self._file_at_exact_lines(front_door_path, MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES + 5)
        row = self._base._migration_row_for(
            "CVF_SESSION_MEMORY.md",
            target_lines=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES,
            target_bytes=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES,
        )
        row["lineCount"] = True  # bool is an int subclass in Python; must be rejected
        self._base._write_migration_registry([row])

        report = self._classify()
        self.assertTrue(
            any("lineCount" in issue and "does not match current" in issue for issue in report["readBudgetViolations"])
        )

    def test_migration_bool_as_int_for_approved_max_fails(self) -> None:
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        self._file_at_exact_lines(front_door_path, MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES + 5)
        row = self._base._migration_row_for(
            "CVF_SESSION_MEMORY.md",
            target_lines=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES,
            target_bytes=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES,
        )
        row["approvedMaxLines"] = True
        self._base._write_migration_registry([row])

        report = self._classify()
        self.assertTrue(
            any("approvedMaxLines must be a strict integer exactly equal" in issue for issue in report["readBudgetViolations"])
        )

    # F6: requiredFirstReads raw-list inspected before filtering
    def test_required_first_reads_mixed_type_bypass_is_caught(self) -> None:
        state_path = self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        # 13 raw entries: 3 are non-string/empty, so naive filtering would
        # leave only 10 clean strings (or some count <=12) and hide the cap.
        state["requiredFirstReads"] = (
            [self._base.first_read] * 10 + [None, 123, ""]
        )
        state_path.write_text(json.dumps(state), encoding="utf-8")

        violations = self._classify()["readBudgetViolations"]
        self.assertTrue(any("requiredFirstReads has 13 raw entries" in issue for issue in violations))
        for index in (10, 11, 12):
            with self.subTest(index=index):
                self.assertTrue(any(f"requiredFirstReads[{index}] must be a non-empty string path" in issue for issue in violations))

    # F2/F3/F5: order-independence, imperative, mixed negated + forbidden clause, and safe-negation wording cases
    def test_wording_matrix(self) -> None:
        cases = (
            ("The history and state must, by default, always be read in full.", True, "reordered words still fails"),
            ("Do not always read the full state by default; use a targeted lookup instead.", False, "safe negation does not false positive"),
            ("Read the full state.", True, "direct imperative"),
            ("You must read the complete handoff.", True, "must imperative"),
            ("Read the entire historical handoff.", True, "entire imperative"),
            ("Do not use a targeted lookup; always read the full state by default.", True, "mixed negated + forbidden clause"),
            ("Never read the full state by default.", False, "never negation"),
            ("Avoid reading the full state by default.", False, "avoid negation"),
            ("This is notably not a concern for state history.", False, "substring negation trap"),
            ("Resolve the full machine-readable state registry only if a current fact is missing.", False, "only-if qualifier"),
            ("Use targeted lookup only if a fact is missing; always read the full state by default.", True, "mixed qualifier clause + forbidden positive clause"),
            ("Resolve the full state only if a current fact is missing.", False, "safe single-clause only-if"),
            ("Reading the full state is not optional.", True, "not-optional is a mandate, not safe negation"),
            ("Read the full state without exception.", True, "without-exception is not read negation"),
            ("Without delay, always read the full state by default.", True, "without-delay is not read negation"),
            ("Do not use a targeted lookup, and always read the full state by default.", True, "comma-and mixed negation"),
            ("Use targeted lookup only if a fact is missing, and always read the full state by default.", True, "comma-and mixed qualifier"),
            ("Perform a targeted lookup without reading the full state.", False, "without-reading is safe negation"),
            ("Use targeted lookup only if a fact is missing, and the full state must always be read by default.", True, "reordered comma-and positive clause"),
            ("Use targeted lookup only if a fact is missing, and every session read the full state.", True, "every-session comma-and positive clause"),
            ("Do not under any circumstances ever read the full state.", False, "long safe negation"),
            ("Do not, under any circumstances, read the full state.", False, "punctuated long safe negation"),
            ("Never, ever read the full state by default.", False, "punctuated never negation"),
            ("Do not use a targeted lookup, always read the full state by default.", True, "comma-splice positive clause"),
        )
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        base = front_door_path.read_text(encoding="utf-8")
        for sentence, expect_violation, label in cases:
            with self.subTest(label=label):
                front_door_path.write_text(base + "\n" + sentence + "\n", encoding="utf-8")
                found = any("unconditional full-state/history read wording" in issue for issue in self._classify()["readBudgetViolations"])
                self.assertEqual(found, expect_violation, f"{label}: {sentence!r}")

    # F3: string/null/missing approved maxima and unknown entry fields
    def test_migration_entry_malformed_field_matrix(self) -> None:
        cases = (
            (lambda row: row.update(approvedMaxLines=str(row["lineCount"])), "approvedMaxLines must be a strict integer exactly equal", "approvedMaxLines as string"),
            (lambda row: row.update(approvedMaxBytes=None), "approvedMaxBytes must be a strict integer exactly equal", "approvedMaxBytes as null"),
            (lambda row: row.pop("approvedMaxLines"), "missing required fields", "approvedMaxLines missing"),
            (lambda row: row.update(unexpectedField="unexpected"), "has unknown fields", "unknown entry field"),
        )
        front_door_path = self.repo_root / "CVF_SESSION_MEMORY.md"
        self._file_at_exact_lines(front_door_path, MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES + 5)
        for mutate, expected_fragment, label in cases:
            with self.subTest(label=label):
                row = self._base._migration_row_for("CVF_SESSION_MEMORY.md", target_lines=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES, target_bytes=MODULE.CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES)
                mutate(row)
                self._base._write_migration_registry([row])
                violations = self._classify()["readBudgetViolations"]
                self.assertTrue(any(expected_fragment in issue for issue in violations), f"{label}: {violations}")


class CurrentAuthorityDeterministicNegativeTests(unittest.TestCase):
    # Real chmod/symlinks are unreliable cross-platform, so mock Path methods.
    def setUp(self) -> None:
        self._base = ActiveSessionStateTests()
        self._base.setUp()
        self.repo_root = self._base.repo_root
        self.baseline_rel = self._base.authority_baseline_path
        self.valid_authority = {
            "baselinePath": self.baseline_rel,
            "baselineSha256": self._base.authority_baseline_sha256,
            "workOrderPath": self._base.authority_work_order_path,
            "workOrderSha256": self._base.authority_work_order_sha256,
        }

    def tearDown(self) -> None:
        self._base.tearDown()

    def _validate(self, value: dict) -> list[str]:
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            return MODULE._validate_current_authority(value)

    def test_read_failure_on_hash_verification_is_typed_violation_not_silent_pass(self) -> None:
        real_read_bytes = Path.read_bytes
        baseline_name = Path(self.baseline_rel).name
        def _raise_for_baseline(path_self: Path, *args, **kwargs):
            if path_self.name == baseline_name:
                raise OSError("simulated read failure for deterministic proof")
            return real_read_bytes(path_self, *args, **kwargs)
        with patch.object(MODULE, "REPO_ROOT", self.repo_root), \
                patch.object(Path, "read_bytes", _raise_for_baseline):
            violations = MODULE._validate_current_authority(self.valid_authority)
        self.assertTrue(any("baselineSha256 could not be verified" in v and "OSError" in v for v in violations), violations)

    def test_symlink_authority_path_fails_closed_deterministically(self) -> None:
        baseline_name = Path(self.baseline_rel).name
        real_is_symlink = Path.is_symlink
        def _symlink_for_baseline(path_self: Path) -> bool:
            return True if path_self.name == baseline_name else real_is_symlink(path_self)
        with patch.object(MODULE, "REPO_ROOT", self.repo_root), \
                patch.object(Path, "is_symlink", _symlink_for_baseline):
            violations = MODULE._validate_current_authority(self.valid_authority)
        self.assertTrue(any("must not be a symlink" in v and self.baseline_rel in v for v in violations), violations)

    def test_valid_authority_fixture_passes_with_zero_violations(self) -> None:
        self.assertEqual(self._validate(self.valid_authority), [])


if __name__ == "__main__":
    unittest.main()
