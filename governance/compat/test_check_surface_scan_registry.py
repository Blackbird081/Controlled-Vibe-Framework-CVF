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
        ):
            (self.repo_root / rel_path).mkdir(parents=True, exist_ok=True)

        (self.repo_root / "docs" / "reference" / "CVF_PREPUBLIC_P3_READINESS.md").write_text("p3\n", encoding="utf-8")
        (self.repo_root / "docs" / "reference" / "CVF_PUBLIC_STRUCTURE_OVERVIEW.md").write_text("overview\n", encoding="utf-8")
        (self.repo_root / "EXTENSIONS" / "CVF_EXECUTION_PLANE_FOUNDATION" / "src" / "epf.dispatch.barrel.ts").write_text("export {};\n", encoding="utf-8")
        for rel_path, text in (
            (
                "governance/toolkit/05_OPERATION/CVF_SURFACE_SCAN_CONTINUITY_GUARD.md",
                "GC-041\ngovernance/compat/CVF_SURFACE_SCAN_REGISTRY.json\nAGENT_HANDOFF.md\ndocs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md\ngovernance/compat/check_surface_scan_registry.py\n",
            ),
            (
                "AGENT_HANDOFF.md",
                "governance/compat/CVF_SURFACE_SCAN_REGISTRY.json\nDo not open a fresh tranche before consulting the canonical scan continuity registry.\n",
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
                    "scopePaths": ["EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src", "AGENT_HANDOFF.md"],
                    "canonicalSource": "AGENT_HANDOFF.md",
                    "nextAction": "skip",
                    "reopenCondition": "gc-018",
                    "evidenceRefs": ["AGENT_HANDOFF.md", "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md"]
                },
                {
                    "id": "epf_dispatch_batch_wave",
                    "surfaceClass": "BATCH_BARREL_FAMILY",
                    "status": "FULLY_CLOSED",
                    "lastScannedAt": "2026-04-05",
                    "scopePaths": ["EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/epf.dispatch.barrel.ts", "AGENT_HANDOFF.md"],
                    "canonicalSource": "AGENT_HANDOFF.md",
                    "nextAction": "skip",
                    "reopenCondition": "gc-018",
                    "evidenceRefs": ["AGENT_HANDOFF.md", "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md"]
                },
                {
                    "id": "gef_plane_scan",
                    "surfaceClass": "PLANE_SCAN",
                    "status": "NOT_YET_SCANNED",
                    "lastScannedAt": "2026-04-05",
                    "scopePaths": ["EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION", "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md"],
                    "canonicalSource": "AGENT_HANDOFF.md",
                    "nextAction": "scan",
                    "reopenCondition": "n/a",
                    "evidenceRefs": ["AGENT_HANDOFF.md", "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md"]
                },
                {
                    "id": "lpf_plane_scan",
                    "surfaceClass": "PLANE_SCAN",
                    "status": "NOT_YET_SCANNED",
                    "lastScannedAt": "2026-04-05",
                    "scopePaths": ["EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION", "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md"],
                    "canonicalSource": "AGENT_HANDOFF.md",
                    "nextAction": "scan",
                    "reopenCondition": "n/a",
                    "evidenceRefs": ["AGENT_HANDOFF.md", "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md"]
                },
                {
                    "id": "relocation_lane",
                    "surfaceClass": "POSTURE_LANE",
                    "status": "CLOSED_BY_DEFAULT",
                    "lastScannedAt": "2026-04-05",
                    "scopePaths": ["docs/reference/CVF_PREPUBLIC_P3_READINESS.md", "docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md"],
                    "canonicalSource": "AGENT_HANDOFF.md",
                    "nextAction": "closed",
                    "reopenCondition": "override",
                    "evidenceRefs": ["AGENT_HANDOFF.md", "docs/reference/CVF_PREPUBLIC_P3_READINESS.md", "docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md"]
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
                    with patch.object(MODULE, "HANDOFF_PATH", self.repo_root / "AGENT_HANDOFF.md"):
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

    def test_rejects_missing_handoff_marker(self) -> None:
        (self.repo_root / "AGENT_HANDOFF.md").write_text("governance/compat/CVF_SURFACE_SCAN_REGISTRY.json\n", encoding="utf-8")
        report = self._build_report()
        self.assertFalse(report["compliant"])
        self.assertIn("missing_marker", {v["type"] for v in report["violations"]})


if __name__ == "__main__":
    unittest.main()
