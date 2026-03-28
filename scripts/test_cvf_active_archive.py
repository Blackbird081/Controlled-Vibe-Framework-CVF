#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("cvf_active_archive.py")
SPEC = importlib.util.spec_from_file_location("cvf_active_archive", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CvfActiveArchiveTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        self.original_audit_registry_path = MODULE.AUDIT_RETENTION_REGISTRY_PATH
        (self.repo_root / "docs" / "reviews" / "cvf_phase_governance").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "logs").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "governance" / "compat").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "AGENT_HANDOFF.md").write_text(
            "# handoff\n",
            encoding="utf-8",
        )

        (self.repo_root / "docs" / "CVF_INCREMENTAL_TEST_LOG.md").write_text(
            "active log\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_TRACE_2026-03-07.md").write_text(
            "active trace\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "CVF_OLD_REVIEW_2026-03-01.md").write_text(
            "old dated file\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "audits").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "audits" / "CVF_W1_T1_CP1_FOUNDATION_AUDIT_2026-03-26.md").write_text(
            "foundation audit\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "audits" / "CVF_W1_T2_CP1_COMPONENT_AUDIT_2026-03-26.md").write_text(
            "component audit\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "baselines").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "baselines" / "CVF_CORE_COMPAT_BASELINE.md").write_text(
            "core baseline\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "baselines" / "CVF_TESTER_BASELINE_2026-02-25.md").write_text(
            "tester baseline\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "baselines" / "CVF_CONFORMANCE_GOLDEN_BASELINE_2026-03-07.json").write_text(
            "{}\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "baselines" / "README.md").write_text(
            "# baselines\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs" / "logs" / "CVF_INCREMENTAL_TEST_LOG_ARCHIVE_2026_PART_01.md").write_text(
            "archive file\n",
            encoding="utf-8",
        )
        (self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json").write_text(
            json.dumps(
                {
                    "classes": [
                        {"id": "GLOBAL_APPEND_ONLY_LOG_WINDOW", "description": "global"},
                        {"id": "SCOPED_APPEND_ONLY_TRACE_WINDOW", "description": "scoped"}
                    ],
                    "windows": [
                        {
                            "id": "incremental_test_log_active_window",
                            "windowClass": "GLOBAL_APPEND_ONLY_LOG_WINDOW",
                            "activePath": "docs/CVF_INCREMENTAL_TEST_LOG.md",
                            "archiveDir": "docs/logs",
                            "archivePattern": "^CVF_INCREMENTAL_TEST_LOG_ARCHIVE_\\d{4}_PART_\\d{2}\\.md$",
                            "rotationGuard": "governance/toolkit/05_OPERATION/CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md",
                            "rotationCheck": "governance/compat/check_incremental_test_log_rotation.py",
                            "rotationScript": "scripts/rotate_cvf_incremental_test_log.py",
                            "protectionMode": "PERMANENT_ACTIVE_WINDOW",
                            "status": "ACTIVE"
                        },
                        {
                            "id": "phase_governance_conformance_trace_active_window",
                            "windowClass": "SCOPED_APPEND_ONLY_TRACE_WINDOW",
                            "activePath": "docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md",
                            "archiveDir": "docs/reviews/cvf_phase_governance/logs",
                            "archivePattern": "^CVF_CONFORMANCE_TRACE_ARCHIVE_\\d{4}_PART_\\d{2}\\.md$",
                            "rotationGuard": "governance/toolkit/05_OPERATION/CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md",
                            "rotationCheck": "governance/compat/check_conformance_trace_rotation.py",
                            "rotationScript": "scripts/rotate_cvf_conformance_trace.py",
                            "protectionMode": "PERMANENT_ACTIVE_WINDOW",
                            "status": "ACTIVE"
                        }
                    ]
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        (self.repo_root / "governance" / "compat" / "CVF_AUDIT_RETENTION_REGISTRY.json").write_text(
            json.dumps(
                {
                    "version": 1,
                    "lastReviewed": "2026-03-28",
                    "retainEvidencePaths": [
                        "docs/audits/CVF_W1_T1_CP1_FOUNDATION_AUDIT_2026-03-26.md"
                    ],
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        MODULE.AUDIT_RETENTION_REGISTRY_PATH = self.repo_root / "governance" / "compat" / "CVF_AUDIT_RETENTION_REGISTRY.json"
        MODULE.load_audit_retain_evidence_paths.cache_clear()

    def tearDown(self) -> None:
        MODULE.AUDIT_RETENTION_REGISTRY_PATH = self.original_audit_registry_path
        MODULE.load_audit_retain_evidence_paths.cache_clear()
        self.temp_dir.cleanup()

    def test_scan_root_keeps_dedicated_active_windows_permanent(self) -> None:
        cutoff = datetime(2026, 3, 25)

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"):
                MODULE.load_active_window_paths.cache_clear()
                result = MODULE.scan_root(self.repo_root / "docs", cutoff)

        permanent_paths = {path.relative_to(self.repo_root).as_posix() for path in result.permanent}
        archive_candidates = {info.rel_path for info in result.archive_candidates}

        self.assertIn("docs/CVF_INCREMENTAL_TEST_LOG.md", permanent_paths)
        self.assertIn(
            "docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md",
            permanent_paths,
        )
        self.assertNotIn("docs/CVF_INCREMENTAL_TEST_LOG.md", archive_candidates)
        self.assertNotIn(
            "docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md",
            archive_candidates,
        )

    def test_scan_root_still_flags_ordinary_old_dated_docs(self) -> None:
        cutoff = datetime(2026, 3, 25)

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"):
                MODULE.load_active_window_paths.cache_clear()
                result = MODULE.scan_root(self.repo_root / "docs", cutoff)

        archive_candidates = {info.rel_path for info in result.archive_candidates}
        self.assertIn("docs/CVF_OLD_REVIEW_2026-03-01.md", archive_candidates)

    def test_scan_root_keeps_foundational_baselines_permanent(self) -> None:
        cutoff = datetime(2026, 3, 25)

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"):
                MODULE.load_active_window_paths.cache_clear()
                result = MODULE.scan_root(self.repo_root / "docs", cutoff)

        permanent_paths = {path.relative_to(self.repo_root).as_posix() for path in result.permanent}
        self.assertIn("docs/baselines/CVF_CORE_COMPAT_BASELINE.md", permanent_paths)
        self.assertIn("docs/baselines/CVF_TESTER_BASELINE_2026-02-25.md", permanent_paths)
        self.assertIn("docs/baselines/CVF_CONFORMANCE_GOLDEN_BASELINE_2026-03-07.json", permanent_paths)

    def test_audit_retention_registry_blocks_retain_evidence_audit(self) -> None:
        audit_info = MODULE.FileInfo(
            path=self.repo_root / "docs" / "audits" / "CVF_W1_T1_CP1_FOUNDATION_AUDIT_2026-03-26.md",
            rel_path="docs/audits/CVF_W1_T1_CP1_FOUNDATION_AUDIT_2026-03-26.md",
            date=datetime(2026, 3, 21),
            size=(self.repo_root / "docs" / "audits" / "CVF_W1_T1_CP1_FOUNDATION_AUDIT_2026-03-26.md").stat().st_size,
        )

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "AUDIT_RETENTION_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_AUDIT_RETENTION_REGISTRY.json"):
                MODULE.load_audit_retain_evidence_paths.cache_clear()
                risk = MODULE.evaluate_candidate_risk(audit_info, moving_rel_paths=set(), markdown_link_index={})

        self.assertTrue(risk.blocked)
        self.assertEqual(risk.reason, "audit_retain_evidence")

    def test_unregistered_old_audit_can_remain_archive_safe(self) -> None:
        audit_info = MODULE.FileInfo(
            path=self.repo_root / "docs" / "audits" / "CVF_W1_T2_CP1_COMPONENT_AUDIT_2026-03-26.md",
            rel_path="docs/audits/CVF_W1_T2_CP1_COMPONENT_AUDIT_2026-03-26.md",
            date=datetime(2026, 3, 21),
            size=(self.repo_root / "docs" / "audits" / "CVF_W1_T2_CP1_COMPONENT_AUDIT_2026-03-26.md").stat().st_size,
        )

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "AUDIT_RETENTION_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_AUDIT_RETENTION_REGISTRY.json"):
                MODULE.load_audit_retain_evidence_paths.cache_clear()
                risk = MODULE.evaluate_candidate_risk(audit_info, moving_rel_paths=set(), markdown_link_index={})

        self.assertFalse(risk.blocked)

    def test_scan_root_excludes_dedicated_archive_zones(self) -> None:
        cutoff = datetime(2026, 3, 25)

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"):
                MODULE.load_active_window_paths.cache_clear()
                result = MODULE.scan_root(self.repo_root / "docs", cutoff)

        archive_candidates = {info.rel_path for info in result.archive_candidates}
        permanent_paths = {path.relative_to(self.repo_root).as_posix() for path in result.permanent}

        self.assertNotIn("docs/logs/CVF_INCREMENTAL_TEST_LOG_ARCHIVE_2026_PART_01.md", archive_candidates)
        self.assertNotIn("docs/logs/CVF_INCREMENTAL_TEST_LOG_ARCHIVE_2026_PART_01.md", permanent_paths)

    def test_refresh_baseline_writes_incremental_snapshot_file(self) -> None:
        cutoff = datetime(2026, 3, 25)
        baseline_path = self.repo_root / "governance" / "compat" / "CVF_ACTIVE_ARCHIVE_BASELINE.json"

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"):
                MODULE.load_active_window_paths.cache_clear()
                MODULE.iter_link_scan_source_rel_paths.cache_clear()
                MODULE.extract_resolved_markdown_targets_for_source.cache_clear()
                written_path = MODULE.write_archive_baseline(cutoff, full_scan=True)

        self.assertEqual(written_path, baseline_path)
        self.assertTrue(baseline_path.exists())
        baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
        self.assertEqual(baseline["scopeMode"], "full")
        self.assertIn("docs/CVF_OLD_REVIEW_2026-03-01.md", baseline["files"])
        self.assertEqual(
            baseline["files"]["docs/CVF_OLD_REVIEW_2026-03-01.md"]["bucket"],
            "archive_candidate",
        )

    def test_refresh_baseline_without_prior_state_uses_bootstrap_scope(self) -> None:
        cutoff = datetime(2026, 3, 25)
        baseline_path = self.repo_root / "governance" / "compat" / "CVF_ACTIVE_ARCHIVE_BASELINE.json"

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"):
                MODULE.load_active_window_paths.cache_clear()
                MODULE.iter_link_scan_source_rel_paths.cache_clear()
                MODULE.extract_resolved_markdown_targets_for_source.cache_clear()
                written_path = MODULE.write_archive_baseline(cutoff, full_scan=False)

        self.assertEqual(written_path, baseline_path)
        baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
        self.assertEqual(baseline["scopeMode"], "bootstrap")
        self.assertEqual(
            baseline["files"]["docs/CVF_OLD_REVIEW_2026-03-01.md"]["reason"],
            "baseline_frozen_keep",
        )

    def test_incremental_plan_reuses_unchanged_blocked_candidate_from_baseline(self) -> None:
        cutoff = datetime(2026, 3, 25)
        baseline_path = self.repo_root / "governance" / "compat" / "CVF_ACTIVE_ARCHIVE_BASELINE.json"
        baseline_path.write_text(
            json.dumps(
                {
                    "version": 1,
                    "generatedAt": "2026-03-28T10:00:00",
                    "gitHead": None,
                    "cutoffDate": "2026-03-25",
                    "ageThresholdDays": 3,
                    "scopeMode": "incremental",
                    "managedRoots": ["docs", "ECOSYSTEM/strategy"],
                    "files": {
                        "docs/CVF_OLD_REVIEW_2026-03-01.md": {
                            "bucket": "archive_candidate",
                            "date": "2026-03-01",
                            "signature": MODULE.compute_file_signature(self.repo_root / "docs" / "CVF_OLD_REVIEW_2026-03-01.md"),
                            "blocked": True,
                            "reason": "protected_reference",
                            "liveReferenceSources": ["AGENT_HANDOFF.md"],
                            "markdownLinkSources": [],
                            "protectedReferenceSources": ["AGENT_HANDOFF.md"],
                        }
                    },
                },
                indent=2,
            ),
            encoding="utf-8",
        )

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"):
                MODULE.load_active_window_paths.cache_clear()
                MODULE.iter_link_scan_source_rel_paths.cache_clear()
                MODULE.extract_resolved_markdown_targets_for_source.cache_clear()
                with patch.object(MODULE, "collect_incremental_changed_paths", return_value=set()):
                    with patch.object(MODULE, "evaluate_candidate_risk", side_effect=AssertionError("should reuse baseline result")):
                        scans, risks, metadata = MODULE.build_plan(cutoff, full_scan=False)

        self.assertEqual(metadata.scope_mode, "incremental")
        self.assertEqual(metadata.reused_candidate_count, 1)
        self.assertEqual(metadata.evaluated_candidate_count, 0)
        self.assertTrue(risks["docs/CVF_OLD_REVIEW_2026-03-01.md"].blocked)

    def test_incremental_plan_rechecks_newly_aged_candidate(self) -> None:
        cutoff = datetime(2026, 3, 25)
        baseline_path = self.repo_root / "governance" / "compat" / "CVF_ACTIVE_ARCHIVE_BASELINE.json"
        baseline_path.write_text(
            json.dumps(
                {
                    "version": 1,
                    "generatedAt": "2026-03-24T10:00:00",
                    "gitHead": None,
                    "cutoffDate": "2026-03-24",
                    "ageThresholdDays": 3,
                    "scopeMode": "incremental",
                    "managedRoots": ["docs", "ECOSYSTEM/strategy"],
                    "files": {
                        "docs/CVF_OLD_REVIEW_2026-03-01.md": {
                            "bucket": "active_dated",
                            "date": "2026-03-01",
                            "signature": MODULE.compute_file_signature(self.repo_root / "docs" / "CVF_OLD_REVIEW_2026-03-01.md"),
                        }
                    },
                },
                indent=2,
            ),
            encoding="utf-8",
        )

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            with patch.object(MODULE, "ACTIVE_WINDOW_REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"):
                MODULE.load_active_window_paths.cache_clear()
                MODULE.iter_link_scan_source_rel_paths.cache_clear()
                MODULE.extract_resolved_markdown_targets_for_source.cache_clear()
                with patch.object(MODULE, "collect_incremental_changed_paths", return_value=set()):
                    with patch.object(
                        MODULE,
                        "evaluate_candidate_risk",
                        return_value=MODULE.CandidateRisk(
                            info=MODULE.FileInfo(
                                path=self.repo_root / "docs" / "CVF_OLD_REVIEW_2026-03-01.md",
                                rel_path="docs/CVF_OLD_REVIEW_2026-03-01.md",
                                date=datetime(2026, 3, 1),
                                size=(self.repo_root / "docs" / "CVF_OLD_REVIEW_2026-03-01.md").stat().st_size,
                            ),
                            blocked=False,
                            reason=None,
                        ),
                    ) as mock_eval:
                        scans, risks, metadata = MODULE.build_plan(cutoff, full_scan=False)

        self.assertEqual(metadata.scope_mode, "incremental")
        self.assertEqual(metadata.reused_candidate_count, 0)
        self.assertEqual(metadata.evaluated_candidate_count, 1)
        self.assertEqual(mock_eval.call_count, 1)
        self.assertFalse(risks["docs/CVF_OLD_REVIEW_2026-03-01.md"].blocked)

    def test_rewrite_active_references_for_moves_updates_exact_path_mentions(self) -> None:
        source_path = self.repo_root / "docs" / "reference_note.md"
        source_path.write_text(
            "see docs/baselines/CVF_SAMPLE_DELTA_2026-03-01.md for details\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            changed = MODULE.rewrite_active_references_for_moves(
                {
                    "docs/baselines/CVF_SAMPLE_DELTA_2026-03-01.md": "docs/baselines/archive/CVF_SAMPLE_DELTA_2026-03-01.md"
                }
            )

        self.assertEqual(changed, 1)
        self.assertIn(
            "docs/baselines/archive/CVF_SAMPLE_DELTA_2026-03-01.md",
            source_path.read_text(encoding="utf-8"),
        )

    def test_rewrite_active_references_for_moves_updates_relative_markdown_links(self) -> None:
        source_path = self.repo_root / "docs" / "reference_link_note.md"
        source_path.write_text(
            "[delta](../docs/baselines/CVF_SAMPLE_DELTA_2026-03-01.md)\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "PROJECT_ROOT", self.repo_root):
            changed = MODULE.rewrite_active_references_for_moves(
                {
                    "docs/baselines/CVF_SAMPLE_DELTA_2026-03-01.md": "docs/baselines/archive/CVF_SAMPLE_DELTA_2026-03-01.md"
                }
            )

        self.assertEqual(changed, 1)
        self.assertIn(
            "[delta](baselines/archive/CVF_SAMPLE_DELTA_2026-03-01.md)",
            source_path.read_text(encoding="utf-8"),
        )


if __name__ == "__main__":
    unittest.main()
