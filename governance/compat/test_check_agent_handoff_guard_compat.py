#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_agent_handoff_guard_compat.py")
SPEC = importlib.util.spec_from_file_location("check_agent_handoff_guard_compat", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class AgentHandoffGuardCompatTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_root = Path(self.temp_dir.name)

        required_paths = [
            "governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md",
            "governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md",
            "docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md",
            "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md",
            "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md",
            "docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md",
            "governance/compat/run_local_governance_hook_chain.py",
            "AGENT_HANDOFF.md",
        ]
        for rel in required_paths:
            path = self.repo_root / rel
            path.parent.mkdir(parents=True, exist_ok=True)

        (self.repo_root / "governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md").write_text(
            "Continue\nPause\nBreak\nShift handoff\nAgent transfer\nEscalation handoff\nClosure\nBefore writing a handoff\n",
            encoding="utf-8",
        )
        (self.repo_root / "governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md").write_text(
            "docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md\ngovernance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md\nPause / Resume Interpretation\ncontext quality control by phase for multi-agent continuation\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md").write_text(
            "governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md\nWhen To Use\nMinimum Handoff Fields\nTracked remote branch\nExternal agent memory files\nPhase-bounded context to load first\ncontext quality control by phase for multi-agent continuation\n",
            encoding="utf-8",
        )
        (self.repo_root / "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md").write_text(
            "Agent handoff is mandatory whenever governed work pauses or transfers before closure\ngovernance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md\ngovernance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md\ndocs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md\ndocs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md\ncontext quality control by phase for multi-agent continuation\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md").write_text(
            "GC-020\ngovernance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md\ngovernance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md\ndocs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md\ndocs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md\nmemory keeps durable truth, handoff compresses transition truth, and context loading should stay phase-bounded\n",
            encoding="utf-8",
        )
        (self.repo_root / "docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md").write_text(
            "memory = repository of facts, history, and durable evidence\nhandoff = governance-filtered summary and transfer checkpoint\ncontext loading = phase-bounded loading of only what the current step needs\nhandoff is context quality control by phase for multi-agent continuation\nrepository state and tracked remote state\nExternal memory outside the repo is non-canonical convenience only\n",
            encoding="utf-8",
        )
        (self.repo_root / "governance/compat/run_local_governance_hook_chain.py").write_text(
            "governance/compat/check_agent_handoff_guard_compat.py\n",
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_report_passes_with_tracked_remote_branch_marker(self) -> None:
        (self.repo_root / "AGENT_HANDOFF.md").write_text(
            "Remote tracking branch: origin/cvf-next\nExact remote SHA must be derived live from git when needed; do not hand-maintain it in handoff\nExternal agent memory files: non-canonical convenience only\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root), patch.object(
            MODULE, "_resolve_tracked_remote_ref", return_value="origin/cvf-next"
        ):
            report = MODULE._classify([])

        self.assertTrue(report["compliant"])
        self.assertEqual(report["dynamicViolationCount"], 0)

    def test_report_fails_when_tracked_remote_branch_is_missing(self) -> None:
        (self.repo_root / "AGENT_HANDOFF.md").write_text(
            "Remote tracking branch: origin/other-branch\nExact remote SHA must be derived live from git when needed; do not hand-maintain it in handoff\nExternal agent memory files: non-canonical convenience only\n",
            encoding="utf-8",
        )

        with patch.object(MODULE, "REPO_ROOT", self.repo_root), patch.object(
            MODULE, "_resolve_tracked_remote_ref", return_value="origin/cvf-next"
        ):
            report = MODULE._classify([])

        self.assertFalse(report["compliant"])
        self.assertEqual(report["dynamicViolationCount"], 1)


if __name__ == "__main__":
    unittest.main()
