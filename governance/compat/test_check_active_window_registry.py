#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_active_window_registry.py")
SPEC = importlib.util.spec_from_file_location("check_active_window_registry", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class CheckActiveWindowRegistryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)
        (self.repo_root / "governance" / "compat").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reference").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reference" / "archive").mkdir(parents=True, exist_ok=True)
        (self.repo_root / ".github" / "workflows").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "scripts").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "logs").mkdir(parents=True, exist_ok=True)
        (self.repo_root / "docs" / "reviews" / "cvf_phase_governance" / "logs").mkdir(parents=True, exist_ok=True)

        (self.repo_root / "docs" / "CVF_INCREMENTAL_TEST_LOG.md").write_text("log\n", encoding="utf-8")
        (self.repo_root / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_TRACE_2026-03-07.md").write_text("trace\n", encoding="utf-8")
        (self.repo_root / "docs" / "reference" / "CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md").write_text("standard\n", encoding="utf-8")
        (self.repo_root / "docs" / "reference" / "CVF_AGENT_ERROR_TO_GOVERNANCE_LEARNING_PHILOSOPHY_2026-05-28.md").write_text("standard\n", encoding="utf-8")
        (self.repo_root / "governance" / "compat" / "check_incremental_test_log_rotation.py").write_text("print('ok')\n", encoding="utf-8")
        (self.repo_root / "governance" / "compat" / "check_conformance_trace_rotation.py").write_text("print('ok')\n", encoding="utf-8")
        (self.repo_root / "governance" / "compat" / "check_active_archive_hygiene.py").write_text("print('ok')\n", encoding="utf-8")
        (self.repo_root / "scripts" / "rotate_cvf_incremental_test_log.py").write_text("print('ok')\n", encoding="utf-8")
        (self.repo_root / "scripts" / "rotate_cvf_conformance_trace.py").write_text("print('ok')\n", encoding="utf-8")
        (self.repo_root / "scripts" / "cvf_active_archive.py").write_text("print('ok')\n", encoding="utf-8")
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md").write_text(
            "**Applies to:** `docs/CVF_INCREMENTAL_TEST_LOG.md` and `docs/logs/CVF_INCREMENTAL_TEST_LOG_ARCHIVE_*.md`\n\n"
            "canonical entrypoint\nactive working window\n",
            encoding="utf-8",
        )
        (self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md").write_text(
            "**Applies to:** `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md` and `docs/reviews/cvf_phase_governance/logs/CVF_CONFORMANCE_TRACE_ARCHIVE_*.md`\n\n"
            "canonical entrypoint\ncurrent working window\n",
            encoding="utf-8",
        )

        for path in (
            self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md",
            self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_ACTIVE_ARCHIVE_GUARD.md",
            self.repo_root / "governance" / "compat" / "run_local_governance_hook_chain.py",
            self.repo_root / ".github" / "workflows" / "documentation-testing.yml",
            self.repo_root / "docs" / "reference" / "CVF_ACTIVE_WINDOW_CLASSIFICATION.md",
        ):
            path.write_text("governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json\ncheck_active_window_registry.py\n", encoding="utf-8")

        self.registry_path = self.repo_root / "governance" / "compat" / "CVF_ACTIVE_WINDOW_REGISTRY.json"
        self.registry_path.write_text(
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

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _build_report(self, baseline=None):
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE, "REGISTRY_PATH", self.registry_path):
                with patch.object(MODULE, "GUARD_DOC_PATH", self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md"):
                    with patch.object(MODULE, "ACTIVE_ARCHIVE_GUARD_PATH", self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_ACTIVE_ARCHIVE_GUARD.md"):
                        with patch.object(MODULE, "HOOK_CHAIN_PATH", self.repo_root / "governance" / "compat" / "run_local_governance_hook_chain.py"):
                            with patch.object(MODULE, "WORKFLOW_PATH", self.repo_root / ".github" / "workflows" / "documentation-testing.yml"):
                                with patch.object(MODULE, "WINDOW_CLASSIFICATION_PATH", self.repo_root / "docs" / "reference" / "CVF_ACTIVE_WINDOW_CLASSIFICATION.md"):
                                    with patch.object(MODULE, "ROTATION_GUARD_DIR", self.repo_root / "governance" / "toolkit" / "05_OPERATION"):
                                        with patch.object(MODULE, "load_json_policy_baseline", return_value=(baseline, "HEAD" if baseline else None)):
                                            return MODULE.build_report()

    def test_accepts_compliant_registry(self) -> None:
        report = self._build_report()
        self.assertTrue(report["compliant"])

    def test_blocks_unregistered_rotation_guard(self) -> None:
        self.registry_path.write_text(json.dumps({"classes": [], "windows": []}, indent=2), encoding="utf-8")
        report = self._build_report()
        self.assertTrue(any(v["type"] == "rotation_guard_not_registered" for v in report["violations"]))

    def test_blocks_baseline_mutation(self) -> None:
        current = json.loads(self.registry_path.read_text(encoding="utf-8"))
        baseline = json.loads(self.registry_path.read_text(encoding="utf-8"))
        current["windows"][0]["archiveDir"] = "docs/other"
        self.registry_path.write_text(json.dumps(current, indent=2), encoding="utf-8")
        report = self._build_report(baseline=baseline)
        self.assertTrue(any(v["type"] == "window_mutated_from_baseline" for v in report["violations"]))

    def test_allows_binding_reference_windows_to_share_archive_hygiene(self) -> None:
        current = json.loads(self.registry_path.read_text(encoding="utf-8"))
        current["classes"].append({"id": "BINDING_REFERENCE_ACTIVE_WINDOW", "description": "binding"})
        current["windows"].extend(
            [
                {
                    "id": "agent_autorun_workflow_control_standard_active_reference",
                    "windowClass": "BINDING_REFERENCE_ACTIVE_WINDOW",
                    "activePath": "docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md",
                    "archiveDir": "docs/reference/archive",
                    "archivePattern": "^CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28\\.md$",
                    "rotationGuard": "governance/compat/check_active_archive_hygiene.py",
                    "rotationCheck": "governance/compat/check_active_archive_hygiene.py",
                    "rotationScript": "scripts/cvf_active_archive.py",
                    "protectionMode": "PERMANENT_ACTIVE_WINDOW",
                    "status": "ACTIVE",
                },
                {
                    "id": "agent_error_to_governance_learning_philosophy_active_reference",
                    "windowClass": "BINDING_REFERENCE_ACTIVE_WINDOW",
                    "activePath": "docs/reference/CVF_AGENT_ERROR_TO_GOVERNANCE_LEARNING_PHILOSOPHY_2026-05-28.md",
                    "archiveDir": "docs/reference/archive",
                    "archivePattern": "^CVF_AGENT_ERROR_TO_GOVERNANCE_LEARNING_PHILOSOPHY_2026-05-28\\.md$",
                    "rotationGuard": "governance/compat/check_active_archive_hygiene.py",
                    "rotationCheck": "governance/compat/check_active_archive_hygiene.py",
                    "rotationScript": "scripts/cvf_active_archive.py",
                    "protectionMode": "PERMANENT_ACTIVE_WINDOW",
                    "status": "ACTIVE",
                },
            ]
        )
        self.registry_path.write_text(json.dumps(current, indent=2), encoding="utf-8")
        report = self._build_report()
        self.assertTrue(report["compliant"], report["violations"])

    def test_blocks_duplicate_dedicated_rotation_guard(self) -> None:
        (self.repo_root / "docs" / "CVF_INCREMENTAL_TEST_LOG_COPY.md").write_text("log\n", encoding="utf-8")
        current = json.loads(self.registry_path.read_text(encoding="utf-8"))
        duplicate = dict(current["windows"][0])
        duplicate["id"] = "incremental_test_log_duplicate_active_window"
        duplicate["activePath"] = "docs/CVF_INCREMENTAL_TEST_LOG_COPY.md"
        current["windows"].append(duplicate)
        self.registry_path.write_text(json.dumps(current, indent=2), encoding="utf-8")
        report = self._build_report()
        self.assertTrue(any(v["type"] == "duplicate_rotation_guard" for v in report["violations"]))



# Explicit public-contract coverage; private defaults and globals remain unchanged.
import contextlib as profile_context
import importlib as profile_import
import io as profile_io
import json as profile_json
import sys as profile_sys
import tempfile as profile_tempfile
import unittest as profile_unittest
from pathlib import Path as ProfilePath
from unittest.mock import patch as profile_patch

PROFILE_SUBJECT = globals().get("MODULE") or profile_import.import_module("check_active_window_registry")


class PublicProfileContractTests(profile_unittest.TestCase):
    def setUp(self):
        self.stack = profile_context.ExitStack()
        self.addCleanup(self.stack.close)
        self.root = ProfilePath(self.stack.enter_context(profile_tempfile.TemporaryDirectory(prefix="cvf-normative-profile-")))
        self.m = PROFILE_SUBJECT
        original = self.m.REPO_ROOT
        self.stack.enter_context(profile_patch.object(self.m, "REPO_ROOT", self.root))
        for name, value in list(vars(self.m).items()):
            if name.endswith(("_PATH", "_DIR")) and isinstance(value, ProfilePath) and value.is_relative_to(original):
                self.stack.enter_context(profile_patch.object(self.m, name, self.root / value.relative_to(original)))
        if hasattr(self.m, "load_json_policy_baseline"):
            self.stack.enter_context(profile_patch.object(self.m, "load_json_policy_baseline", return_value=(None, "test-public-policy")))
        if hasattr(self.m, "_run_git"):
            self.stack.enter_context(profile_patch.object(self.m, "_run_git", return_value=(1, "", "synthetic")))
        self.kind = "active_window_registry"
        self.changed = {"docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_SYNTHETIC.md": ["M"]}
        if hasattr(self.m, "DOC_PATTERNS"):
            first = next(iter(self.m.DOC_PATTERNS))
            prefixes = {"intake": "CVF_MULTI_AGENT_INTAKE_REVIEW_", "session": "CVF_BOARDROOM_SESSION_PACKET_"}
            self.changed = {"docs/reviews/" + prefixes[first] + "SYNTHETIC.md": ["M"]}
        if hasattr(self.m, "REQUIRED_FILES"):
            paths = self.m.REQUIRED_FILES
            markers = self.m.REQUIRED_MARKERS
        elif self.kind == "surface_scan_registry":
            paths = tuple(p.relative_to(self.root).as_posix() for p in self.m._required_files())
            markers = {p.relative_to(self.root).as_posix(): v for p, v in self.m._required_markers().items()}
        elif self.kind == "active_window_registry":
            paths = tuple(getattr(self.m, n).relative_to(self.root).as_posix() for n in ("REGISTRY_PATH", "GUARD_DOC_PATH", "ACTIVE_ARCHIVE_GUARD_PATH", "HOOK_CHAIN_PATH", "WORKFLOW_PATH", "WINDOW_CLASSIFICATION_PATH"))
            registry = self.m.REGISTRY_PATH.relative_to(self.root).as_posix()
            markers = {p: ("check_active_window_registry.py" if p.endswith((".py", ".yml")) else registry,) for p in paths if p != registry}
        else:
            paths = (self.m.TEMPLATE_PATH, self.m.POLICY_PATH)
            markers = {self.m.TEMPLATE_PATH: self.m.REQUIRED_TEMPLATE_MARKERS, self.m.POLICY_PATH: ("GC-018",)}
        self.paths = self.m.public_required_paths(paths)
        self.markers = self.m.public_required_markers(markers)
        for rel in self.paths:
            self.write(rel, "\n".join(self.markers.get(rel, ("normative owner",))))
        self.owner = next(path for path in self.markers if path in self.paths and not path.endswith(".json"))
        self.marker = self.markers[self.owner][0]
        self.public_carrier()
        if self.kind == "progress_tracker_sync":
            self.registry = {"worklines": [{"id": "synthetic", "tracker": "docs/reviews/private.md", "triggerRegexes": [".*"], "commitRegexes": [".*"]}]}
        elif self.kind == "surface_scan_registry":
            self.registry = {"classes": [{"id": "synthetic", "description": "Synthetic scan class"}], "surfaces": [dict(id=value, surfaceClass="synthetic", status="OPEN_CANDIDATE", lastScannedAt="2026-10-26", scopePaths=["CVF_SESSION/private.md"], canonicalSource="docs/reviews/private.md", nextAction="explicit decision", reopenCondition="new evidence", evidenceRefs=["docs/reviews/private.md"]) for value in self.m.REQUIRED_SURFACE_IDS]}
        elif self.kind == "active_window_registry":
            self.registry = {"classes": [{"id": "synthetic", "description": "Synthetic window"}], "windows": [dict(id="synthetic", windowClass="synthetic", activePath="CVF_SESSION/private.md", archiveDir="docs/reviews/archive", archivePattern=".*", rotationGuard="governance/toolkit/05_OPERATION/CVF_SYNTHETIC_ROTATION_GUARD.md", rotationCheck="governance/compat/synthetic_rotation_check.py", rotationScript="scripts/cvf_active_archive.py", protectionMode="PERMANENT_ACTIVE_WINDOW", status="ACTIVE")]}
            self.write(self.registry["windows"][0]["rotationGuard"], "normative rotation contract")
            self.write(self.registry["windows"][0]["rotationCheck"], "normative rotation checker")
        else:
            self.registry = None
        if self.registry is not None:
            rel = self.m.REGISTRY_PATH if isinstance(self.m.REGISTRY_PATH, str) else self.m.REGISTRY_PATH.relative_to(self.root).as_posix()
            self.registry_rel = rel
            self.write(rel, profile_json.dumps(self.registry))

    def write(self, relative, text):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text + "\n", encoding="utf-8")

    def public_carrier(self):
        self.write("governance/toolkit/05_OPERATION/CVF_PUBLIC_CORE_AGENTS.md", "exact public carrier")
        self.write("AGENTS.md", "exact public carrier")

    def report(self, profile="public"):
        if hasattr(self.m, "build_report"):
            return self.m.build_report(profile)
        if self.kind == "progress_tracker_sync":
            return self.m._classify([], self.changed, profile)
        if self.kind == "session_governance_bootstrap":
            return self.m._classify([], profile)
        return self.m._classify(self.changed, profile)

    def test_public_normative_positive_and_private_payload_not_promoted(self):
        report = self.report()
        self.assertTrue(report["compliant"], report)
        self.assertIn("claimBoundary", report)
        self.assertIn("privateEvidenceNotApplicable", report)

    def test_missing_normative_file_and_marker_both_fail(self):
        path = self.root / self.owner
        before = path.read_bytes()
        path.unlink()
        self.assertFalse(self.report()["compliant"])
        path.write_bytes(before)
        path.write_text("", encoding="utf-8")
        self.assertFalse(self.report()["compliant"])

    def test_wrong_carrier_fails(self):
        self.write("AGENTS.md", "private or modified carrier")
        with self.assertRaises(ValueError):
            self.report()

    def test_public_then_default_private_has_no_global_scope_leak(self):
        required_before = tuple(getattr(self.m, "REQUIRED_FILES", ()))
        self.assertTrue(self.report()["compliant"])
        self.assertFalse(self.report("private")["compliant"])
        self.assertEqual(required_before, tuple(getattr(self.m, "REQUIRED_FILES", ())))
        # Exercise main twice, not only the classifier API.
        with profile_context.ExitStack() as stack:
            for name, value in (("_resolve_range", ("base", "HEAD", "test")), ("_get_changed_files", []), ("_get_changed_name_status", self.changed), ("_get_worktree_changed_files", []), ("_get_worktree_name_status", {}), ("_get_commits_in_range", []), ("_get_last_commit", None)):
                if hasattr(self.m, name):
                    stack.enter_context(profile_patch.object(self.m, name, return_value=value))
            for args, expected in ((["--profile", "public", "--enforce", "--json"], 0), (["--enforce", "--json"], 2)):
                with profile_patch.object(profile_sys, "argv", ["checker", *args]), profile_context.redirect_stdout(profile_io.StringIO()):
                    self.assertEqual(self.m.main(), expected)

    def test_public_rotation_guard_and_checker_presence_remain_required(self):
        for field in ("rotationGuard", "rotationCheck"):
            path = self.root / self.registry["windows"][0][field]
            before = path.read_bytes()
            path.unlink()
            self.assertFalse(self.report()["compliant"])
            path.write_bytes(before)

    def test_only_declared_private_effect_scripts_skip_presence(self):
        self.registry["windows"][0]["rotationScript"] = "scripts/public-rotation-tool.py"
        self.write(self.registry_rel, profile_json.dumps(self.registry))
        self.assertFalse(self.report()["compliant"])
        self.write("scripts/public-rotation-tool.py", "public normative helper")
        self.assertTrue(self.report()["compliant"])

    def test_registry_schema_contract_is_not_skipped(self):
        if self.registry is None:
            self.assertFalse((self.root / "docs/reviews/private.md").exists())
            return
        invalid = {"worklines": "invalid"} if self.kind == "progress_tracker_sync" else {"classes": {}, "surfaces": []} if self.kind == "surface_scan_registry" else {"classes": [], "windows": "invalid"}
        self.write(self.registry_rel, profile_json.dumps(invalid))
        self.assertFalse(self.report()["compliant"])


if __name__ == "__main__":
    unittest.main()
