#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("build_session_sync_pack.py")
SPEC = importlib.util.spec_from_file_location("build_session_sync_pack", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _plan(protected: tuple[str, ...]):
    """Build a minimal PathPlan-like object with the protected paths set."""
    return MODULE._STEWARD.PathPlan(
        changed_paths=protected,
        material_paths=(),
        protected_session_paths=protected,
        trace_artifact_paths=(),
        mixed_material_and_session=False,
        exact_manifest_collision_risk=False,
        handoff_sync_only=bool(protected),
    )


class AuthorizedProtectedPathsTests(unittest.TestCase):
    def test_parses_protected_paths_block(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            handoff = root / "AGENT_HANDOFF_TEST.md"
            handoff.write_text(
                "## Core Guard Self-Protection Authorization\n\n"
                "Authorized scope: test.\n\n"
                "Protected paths:\n\n"
                "- `CVF_SESSION_MEMORY.md`\n"
                "- `CVF_SESSION/ACTIVE_SESSION_STATE.json`\n\n"
                "Operator authorization: test.\n",
                encoding="utf-8",
            )
            with patch.object(MODULE, "REPO_ROOT", root):
                paths = MODULE.authorized_protected_paths("AGENT_HANDOFF_TEST.md")
        self.assertEqual(
            paths,
            ("CVF_SESSION_MEMORY.md", "CVF_SESSION/ACTIVE_SESSION_STATE.json"),
        )

    def test_returns_empty_when_no_auth_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            handoff = root / "AGENT_HANDOFF_TEST.md"
            handoff.write_text("## Some Other Section\n\nno marker here\n", encoding="utf-8")
            with patch.object(MODULE, "REPO_ROOT", root):
                paths = MODULE.authorized_protected_paths("AGENT_HANDOFF_TEST.md")
        self.assertEqual(paths, ())

    def test_returns_empty_for_missing_handoff(self) -> None:
        self.assertEqual(MODULE.authorized_protected_paths(None), ())


class MissingAuthorizationTests(unittest.TestCase):
    def test_flags_unauthorized_protected_path(self) -> None:
        missing = MODULE._missing_authorizations(
            ("CVF_SESSION_MEMORY.md", "CVF_SESSION/new-entry.json"),
            ("CVF_SESSION_MEMORY.md",),
        )
        self.assertEqual(missing, ("CVF_SESSION/new-entry.json",))

    def test_no_missing_when_all_authorized(self) -> None:
        missing = MODULE._missing_authorizations(
            ("CVF_SESSION_MEMORY.md",),
            ("CVF_SESSION_MEMORY.md", "AGENT_HANDOFF_V19_2026-06-15.md"),
        )
        self.assertEqual(missing, ())


class MainModeTests(unittest.TestCase):
    def _run_main(self, argv: list[str], *, plan, drift, authorized):
        out = io.StringIO()
        with patch.object(MODULE, "build_path_plan", return_value=plan), \
            patch.object(
                MODULE, "validate_aggregate_matches_sources", return_value=drift
            ), \
            patch.object(MODULE, "_active_handoff_path", return_value="AGENT_HANDOFF.md"), \
            patch.object(MODULE, "authorized_protected_paths", return_value=authorized), \
            patch.object(sys, "argv", ["build_session_sync_pack.py", *argv]), \
            redirect_stdout(out):
            code = MODULE.main()
        return code, out.getvalue()

    def test_suggest_exit_zero_even_with_drift(self) -> None:
        code, text = self._run_main(
            ["--suggest"],
            plan=_plan(("CVF_SESSION_MEMORY.md",)),
            drift=["aggregate drifted"],
            authorized=("CVF_SESSION_MEMORY.md",),
        )
        self.assertEqual(code, 0)
        self.assertIn("DRIFT", text)

    def test_enforce_exit_zero_on_clean(self) -> None:
        code, text = self._run_main(
            ["--enforce"],
            plan=_plan(("CVF_SESSION_MEMORY.md",)),
            drift=[],
            authorized=("CVF_SESSION_MEMORY.md",),
        )
        self.assertEqual(code, 0)
        self.assertIn("COMPLIANT", text)

    def test_enforce_exit_one_on_drift(self) -> None:
        code, text = self._run_main(
            ["--enforce"],
            plan=_plan(("CVF_SESSION_MEMORY.md",)),
            drift=["aggregate drifted from sources"],
            authorized=("CVF_SESSION_MEMORY.md",),
        )
        self.assertEqual(code, 1)
        self.assertIn("VIOLATION", text)

    def test_enforce_exit_one_on_missing_authorization(self) -> None:
        code, text = self._run_main(
            ["--enforce"],
            plan=_plan(("CVF_SESSION/unauthorized.json",)),
            drift=[],
            authorized=("CVF_SESSION_MEMORY.md",),
        )
        self.assertEqual(code, 1)
        self.assertIn("MISSING", text)

    def test_plan_only_skips_drift(self) -> None:
        code, text = self._run_main(
            ["--plan-only"],
            plan=_plan(("CVF_SESSION_MEMORY.md",)),
            drift=["this drift must not be evaluated"],
            authorized=("CVF_SESSION_MEMORY.md",),
        )
        self.assertEqual(code, 0)
        self.assertIn("PLAN-ONLY", text)
        self.assertNotIn("this drift must not be evaluated", text)

    def test_default_mode_behaves_like_suggest(self) -> None:
        code, text = self._run_main(
            [],
            plan=_plan(()),
            drift=[],
            authorized=(),
        )
        self.assertEqual(code, 0)
        self.assertIn("ADVISORY", text)

    def test_manifest_prints_paste_block(self) -> None:
        code, text = self._run_main(
            ["--suggest"],
            plan=_plan(("CVF_SESSION_MEMORY.md",)),
            drift=[],
            authorized=(),
        )
        self.assertEqual(code, 0)
        self.assertIn("Protected paths:", text)
        self.assertIn("`CVF_SESSION_MEMORY.md`", text)


class AuthorEntryModeTests(unittest.TestCase):
    def _run_author_entry(self, root: Path, state_key: str):
        out = io.StringIO()
        with patch.object(MODULE, "REPO_ROOT", root), \
            patch.object(MODULE, "_active_handoff_path", return_value="AGENT_HANDOFF.md"), \
            patch.object(sys, "argv", [
                "build_session_sync_pack.py",
                "--author-entry",
                "--state-key",
                state_key,
            ]), \
            redirect_stdout(out):
            code = MODULE.main()
        return code, out.getvalue()

    def test_author_entry_requires_state_key(self) -> None:
        err = io.StringIO()
        with patch.object(sys, "argv", ["build_session_sync_pack.py", "--author-entry"]), \
            patch("sys.stderr", err):
            with self.assertRaises(SystemExit) as raised:
                MODULE.main()
        self.assertEqual(raised.exception.code, 2)
        self.assertIn("--author-entry requires --state-key", err.getvalue())

    def test_next_state_order_uses_existing_entry_sources(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries = root / "CVF_SESSION" / "state" / "entries"
            entries.mkdir(parents=True)
            (entries / "alpha.json").write_text(
                json.dumps(MODULE.source_entry("alpha", "a", 41)),
                encoding="utf-8",
            )
            (entries / "beta.json").write_text(
                json.dumps(MODULE.source_entry("beta", "b", 7)),
                encoding="utf-8",
            )
            with patch.object(MODULE, "REPO_ROOT", root):
                self.assertEqual(MODULE._next_state_order(), 42)

    def test_author_entry_prints_schema_template_and_all_marker_surfaces(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries = root / "CVF_SESSION" / "state" / "entries"
            entries.mkdir(parents=True)
            (entries / "existing.json").write_text(
                json.dumps(MODULE.source_entry("existing", "x", 12)),
                encoding="utf-8",
            )

            code, text = self._run_author_entry(root, "exampleClosure20260616")

        self.assertEqual(code, 0)
        self.assertIn("Read-only", text)
        self.assertIn("Path: CVF_SESSION/state/entries/exampleClosure20260616.json", text)
        self.assertIn('"stateOrder": 13', text)
        self.assertIn('"stateKey": "exampleClosure20260616"', text)
        self.assertIn('"value": "<replace with concise session-state value>"', text)
        self.assertIn("Path: CVF_SESSION/state/entries/nextAllowedMove.json", text)
        self.assertIn("Current mode marker:", text)
        self.assertIn("Current mode:", text)
        self.assertIn("startup acknowledgment", text)
        self.assertIn("## Current Mode", text)
        self.assertIn('"currentMode": "<replace_with_current_mode_marker>"', text)

    def test_author_entry_skips_manifest_and_drift_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            out = io.StringIO()
            with patch.object(MODULE, "REPO_ROOT", root), \
                patch.object(MODULE, "build_path_plan", side_effect=AssertionError), \
                patch.object(
                    MODULE,
                    "validate_aggregate_matches_sources",
                    side_effect=AssertionError,
                ), \
                patch.object(sys, "argv", [
                    "build_session_sync_pack.py",
                    "--author-entry",
                    "--state-key",
                    "noManifest",
                ]), \
                redirect_stdout(out):
                code = MODULE.main()
        self.assertEqual(code, 0)
        self.assertIn("State Entry Skeleton", out.getvalue())


if __name__ == "__main__":
    unittest.main()
