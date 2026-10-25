#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_surface_scan_registry.py")
SPEC = importlib.util.spec_from_file_location("check_surface_scan_registry", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class SurfaceScanRegistryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

        for rel_path in (
            "governance/compat",
            "governance/toolkit/05_OPERATION",
            "docs/reference",
            ".github/workflows",
            "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src",
            "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src",
            "EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION",
            "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION",
            "CVF_SESSION/handoffs/archive",
        ):
            (self.repo_root / rel_path).mkdir(parents=True, exist_ok=True)

        (self.repo_root / "docs" / "reference" / "CVF_PREPUBLIC_P3_READINESS.md").write_text("p3\n", encoding="utf-8")
        (self.repo_root / "docs" / "reference" / "CVF_PUBLIC_STRUCTURE_OVERVIEW.md").write_text("overview\n", encoding="utf-8")
        (self.repo_root / "EXTENSIONS" / "CVF_EXECUTION_PLANE_FOUNDATION" / "src" / "epf.dispatch.barrel.ts").write_text("export {};\n", encoding="utf-8")
        for rel_path, text in (
            (
                "governance/toolkit/05_OPERATION/CVF_SURFACE_SCAN_CONTINUITY_GUARD.md",
                "GC-041\ngovernance/compat/CVF_SURFACE_SCAN_REGISTRY.json\nCVF_SESSION/ACTIVE_SESSION_STATE.json\ndocs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md\ngovernance/compat/check_surface_scan_registry.py\n",
            ),
            (
                "CVF_SESSION/ACTIVE_SESSION_STATE.json",
                "{\"activeHandoff\":\"AGENT_HANDOFF_V8_2026-05-17.md\"}\n",
            ),
            (
                "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
                "Canonical scan continuity registry\ngovernance/compat/CVF_SURFACE_SCAN_REGISTRY.json\n",
            ),
            (
                "docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md",
                "GC-041\ngovernance/compat/CVF_SURFACE_SCAN_REGISTRY.json\n",
            ),
            (
                "docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md",
                "scan continuity registry\n",
            ),
            (
                "governance/compat/run_local_governance_hook_chain.py",
                "governance/compat/check_surface_scan_registry.py\n",
            ),
            (
                ".github/workflows/documentation-testing.yml",
                "surface-scan-continuity\nSurface Scan Continuity\ngovernance/compat/check_surface_scan_registry.py\n",
            ),
        ):
            path = self.repo_root / rel_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8")
        (self.repo_root / "CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md").write_text("archived\n", encoding="utf-8")

        registry = {
            "classes": [
                {"id": "BATCH_BARREL_FAMILY", "description": "batch"},
                {"id": "PLANE_SCAN", "description": "plane"},
                {"id": "POSTURE_LANE", "description": "lane"}
            ],
            "surfaces": [
                {
                    "id": "cpf_batch_barrel_families",
                    "surfaceClass": "BATCH_BARREL_FAMILY",
                    "status": "FULLY_CLOSED",
                    "lastScannedAt": "2026-04-05",
                    "scopePaths": ["EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src", "CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md"],
                    "canonicalSource": "CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md",
                    "nextAction": "skip",
                    "reopenCondition": "gc-018",
                    "evidenceRefs": ["CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md", "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md"]
                },
                {
                    "id": "epf_dispatch_batch_wave",
                    "surfaceClass": "BATCH_BARREL_FAMILY",
                    "status": "FULLY_CLOSED",
                    "lastScannedAt": "2026-04-05",
                    "scopePaths": ["EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/epf.dispatch.barrel.ts", "CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md"],
                    "canonicalSource": "CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md",
                    "nextAction": "skip",
                    "reopenCondition": "gc-018",
                    "evidenceRefs": ["CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md", "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md"]
                },
                {
                    "id": "gef_plane_scan",
                    "surfaceClass": "PLANE_SCAN",
                    "status": "NOT_YET_SCANNED",
                    "lastScannedAt": "2026-04-05",
                    "scopePaths": ["EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION", "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md"],
                    "canonicalSource": "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
                    "nextAction": "scan",
                    "reopenCondition": "n/a",
                    "evidenceRefs": ["docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md"]
                },
                {
                    "id": "lpf_plane_scan",
                    "surfaceClass": "PLANE_SCAN",
                    "status": "NOT_YET_SCANNED",
                    "lastScannedAt": "2026-04-05",
                    "scopePaths": ["EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION", "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md"],
                    "canonicalSource": "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
                    "nextAction": "scan",
                    "reopenCondition": "n/a",
                    "evidenceRefs": ["docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md"]
                },
                {
                    "id": "relocation_lane",
                    "surfaceClass": "POSTURE_LANE",
                    "status": "CLOSED_BY_DEFAULT",
                    "lastScannedAt": "2026-04-05",
                    "scopePaths": ["docs/reference/CVF_PREPUBLIC_P3_READINESS.md", "docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md"],
                    "canonicalSource": "CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md",
                    "nextAction": "closed",
                    "reopenCondition": "override",
                    "evidenceRefs": ["CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md", "docs/reference/CVF_PREPUBLIC_P3_READINESS.md", "docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md"]
                }
            ]
        }
        (self.repo_root / "governance" / "compat" / "CVF_SURFACE_SCAN_REGISTRY.json").write_text(
            json.dumps(registry, indent=2),
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _build_report(self) -> dict:
        with patch.object(MODULE, "REPO_ROOT", self.repo_root):
            with patch.object(MODULE, "REGISTRY_PATH", self.repo_root / "governance" / "compat" / "CVF_SURFACE_SCAN_REGISTRY.json"):
                with patch.object(MODULE, "GUARD_PATH", self.repo_root / "governance" / "toolkit" / "05_OPERATION" / "CVF_SURFACE_SCAN_CONTINUITY_GUARD.md"):
                    with patch.object(MODULE, "ACTIVE_STATE_PATH", self.repo_root / "CVF_SESSION" / "ACTIVE_SESSION_STATE.json"):
                        with patch.object(MODULE, "TRACKER_PATH", self.repo_root / "docs" / "reference" / "CVF_WHITEPAPER_PROGRESS_TRACKER.md"):
                            with patch.object(MODULE, "BOOTSTRAP_PATH", self.repo_root / "docs" / "reference" / "CVF_SESSION_GOVERNANCE_BOOTSTRAP.md"):
                                with patch.object(MODULE, "CONTEXT_MODEL_PATH", self.repo_root / "docs" / "reference" / "CVF_CONTEXT_CONTINUITY_MODEL.md"):
                                    with patch.object(MODULE, "HOOK_CHAIN_PATH", self.repo_root / "governance" / "compat" / "run_local_governance_hook_chain.py"):
                                        with patch.object(MODULE, "WORKFLOW_PATH", self.repo_root / ".github" / "workflows" / "documentation-testing.yml"):
                                            return MODULE.build_report()

    def test_accepts_compliant_registry(self) -> None:
        report = self._build_report()
        self.assertTrue(report["compliant"])

    def test_rejects_missing_required_surface(self) -> None:
        registry_path = self.repo_root / "governance" / "compat" / "CVF_SURFACE_SCAN_REGISTRY.json"
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
        registry["surfaces"] = [entry for entry in registry["surfaces"] if entry["id"] != "gef_plane_scan"]
        registry_path.write_text(json.dumps(registry, indent=2), encoding="utf-8")
        report = self._build_report()
        self.assertFalse(report["compliant"])
        self.assertIn("required_surface_missing", {v["type"] for v in report["violations"]})

    def test_rejects_missing_active_state_marker(self) -> None:
        (self.repo_root / "CVF_SESSION/ACTIVE_SESSION_STATE.json").write_text("{}\n", encoding="utf-8")
        report = self._build_report()
        self.assertFalse(report["compliant"])
        self.assertIn("missing_marker", {v["type"] for v in report["violations"]})



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

PROFILE_SUBJECT = globals().get("MODULE") or profile_import.import_module("check_surface_scan_registry")


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
        self.kind = "surface_scan_registry"
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

    def test_registry_schema_contract_is_not_skipped(self):
        if self.registry is None:
            self.assertFalse((self.root / "docs/reviews/private.md").exists())
            return
        invalid = {"worklines": "invalid"} if self.kind == "progress_tracker_sync" else {"classes": {}, "surfaces": []} if self.kind == "surface_scan_registry" else {"classes": [], "windows": "invalid"}
        self.write(self.registry_rel, profile_json.dumps(invalid))
        self.assertFalse(self.report()["compliant"])


if __name__ == "__main__":
    unittest.main()
