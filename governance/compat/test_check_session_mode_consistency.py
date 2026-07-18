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


MODULE_PATH = Path(__file__).resolve().with_name("check_session_mode_consistency.py")
SPEC = importlib.util.spec_from_file_location("check_session_mode_consistency", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


HANDOFF_NAME = "AGENT_HANDOFF_TEST.md"


def _write_surfaces(root: Path, *, front=None, handoff=None, core=None) -> None:
    """Write the three session surfaces with the given mode values."""
    front = front or {}
    handoff = handoff or {}
    core = core if core is not None else "mode_x"
    default_front_mode = front.get("mode", front.get("marker", "mode_x"))

    (root / "CVF_SESSION_MEMORY.md").write_text(
        f"Current mode marker: `{front.get('marker', 'mode_x')}`\n\n"
        f"Current mode: `{front.get('mode', 'mode_x')}`.\n\n"
        "## Next Allowed Move\n\n"
        f"Mode: `{front.get('next_allowed_mode', default_front_mode)}`.\n\n"
        "Next allowed move: keep testing.\n",
        encoding="utf-8",
    )

    (root / "CVF_SESSION").mkdir(parents=True, exist_ok=True)
    (root / "CVF_SESSION" / "ACTIVE_SESSION_STATE.json").write_text(
        json.dumps({"activeHandoff": HANDOFF_NAME}), encoding="utf-8"
    )

    (root / HANDOFF_NAME).write_text(
        f"Startup acknowledged: current mode=`{handoff.get('startup', 'mode_x')}`; "
        "active handoff=`AGENT_HANDOFF_TEST.md`.\n\n"
        f"## Current Mode\n\n`{handoff.get('current', 'mode_x')}`\n",
        encoding="utf-8",
    )

    (root / "CVF_SESSION" / "state").mkdir(parents=True, exist_ok=True)
    (root / "CVF_SESSION" / "state" / "ACTIVE_SESSION_STATE_CORE.json").write_text(
        json.dumps({"currentMode": core}), encoding="utf-8"
    )


class ResolveHandoffTests(unittest.TestCase):
    def test_resolves_from_active_state(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(root)
            with patch.object(MODULE, "REPO_ROOT", root):
                self.assertEqual(MODULE.resolve_active_handoff(), HANDOFF_NAME)

    def test_returns_none_when_state_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(MODULE, "REPO_ROOT", Path(tmp)):
                self.assertIsNone(MODULE.resolve_active_handoff())


class CollectAndEvaluateTests(unittest.TestCase):
    def _markers(self, root: Path) -> list:
        with patch.object(MODULE, "REPO_ROOT", root):
            return MODULE.collect_markers()

    def test_all_agree_no_violations(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                front={"marker": "mode_a", "mode": "mode_a"},
                handoff={"startup": "mode_a", "current": "mode_a"},
                core="mode_a",
            )
            readings = self._markers(root)
            self.assertEqual(MODULE.evaluate(readings), [])

    def test_core_drift_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                front={"marker": "mode_new", "mode": "mode_new"},
                handoff={"startup": "mode_new", "current": "mode_new"},
                core="mode_old",
            )
            readings = self._markers(root)
            violations = MODULE.evaluate(readings)
            self.assertTrue(any("disagrees" in v for v in violations))

    def test_handoff_startup_drift_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                front={"marker": "mode_a", "mode": "mode_a"},
                handoff={"startup": "stale_mode", "current": "mode_a"},
                core="mode_a",
            )
            readings = self._markers(root)
            self.assertTrue(any("disagrees" in v for v in MODULE.evaluate(readings)))

    def test_front_next_allowed_mode_drift_detected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                front={
                    "marker": "mode_new",
                    "mode": "mode_new",
                    "next_allowed_mode": "mode_old",
                },
                handoff={"startup": "mode_new", "current": "mode_new"},
                core="mode_new",
            )
            readings = self._markers(root)
            violations = MODULE.evaluate(readings)
            self.assertTrue(any("disagrees" in v for v in violations))

    def test_missing_surface_flagged(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(root)
            # remove the core file to simulate a missing surface
            (root / "CVF_SESSION" / "state" / "ACTIVE_SESSION_STATE_CORE.json").unlink()
            readings = self._markers(root)
            violations = MODULE.evaluate(readings)
            self.assertTrue(any("not found" in v for v in violations))

    def test_trailing_period_normalized(self) -> None:
        # front-door `Current mode:` ends with a period; must still match.
        self.assertEqual(MODULE._normalize_mode("`mode_a`."), "mode_a")
        self.assertEqual(MODULE._normalize_mode("mode_a"), "mode_a")


class MainTests(unittest.TestCase):
    def _run(self, root: Path, argv: list[str]) -> tuple[int, str]:
        out = io.StringIO()
        with patch.object(MODULE, "REPO_ROOT", root), \
            patch.object(sys, "argv", ["check_session_mode_consistency.py", *argv]), \
            redirect_stdout(out):
            code = MODULE.main()
        return code, out.getvalue()

    def test_enforce_exit_zero_when_consistent(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                front={"marker": "m", "mode": "m"},
                handoff={"startup": "m", "current": "m"},
                core="m",
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)

    def test_enforce_exit_one_on_drift(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                front={"marker": "m_new", "mode": "m_new"},
                handoff={"startup": "m_new", "current": "m_new"},
                core="m_old",
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("VIOLATION", text)

    def test_advisory_exit_zero_on_drift(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                front={"marker": "m_new", "mode": "m_new"},
                handoff={"startup": "m_new", "current": "m_new"},
                core="m_old",
            )
            code, text = self._run(root, [])
            self.assertEqual(code, 0)
            self.assertIn("ADVISORY", text)


if __name__ == "__main__":
    unittest.main()
