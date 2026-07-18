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


MODULE_PATH = Path(__file__).resolve().with_name("check_next_move_freshness.py")
SPEC = importlib.util.spec_from_file_location("check_next_move_freshness", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {MODULE_PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


HANDOFF_NAME = "AGENT_HANDOFF_TEST.md"


def _write_surfaces(
    root: Path,
    *,
    active_next: str,
    front_next: str | None = None,
    handoff_next: str | None = None,
    handoff_startup: str | None = None,
) -> None:
    (root / "CVF_SESSION").mkdir(parents=True, exist_ok=True)
    state = {
        "activeHandoff": HANDOFF_NAME,
        "nextAllowedMove": active_next,
        "modelGatewayC02P2DynamicModelRegistryBoundaryDispatch20260615": {
            "status": "CLOSED_PASS_BOUNDED",
            "workOrder": "docs/work_orders/CVF_AGENT_WORK_ORDER_MODEL_GATEWAY_C02_P2_DYNAMIC_MODEL_REGISTRY_BOUNDARY_2026-06-15.md",
            "nextAllowedMove": "P2 is closed. Model Gateway C-02 P3 may open only through fresh authorization.",
        },
        "roadmapStateReconciliationT3Closure20260616": (
            "RSF-T3 is CLOSED_PASS_BOUNDED at material commit abc12345."
        ),
    }
    (root / "CVF_SESSION" / "ACTIVE_SESSION_STATE.json").write_text(
        json.dumps(state),
        encoding="utf-8",
    )
    (root / "CVF_SESSION_MEMORY.md").write_text(
        "# Front Door\n\n## Next Allowed Move\n\n"
        f"{front_next if front_next is not None else active_next}\n",
        encoding="utf-8",
    )
    startup = handoff_startup or (
        "Startup acknowledged: current mode=`mode`; active handoff=`AGENT_HANDOFF_TEST.md`; "
        "next allowed move=fresh operator authorization only."
    )
    (root / HANDOFF_NAME).write_text(
        f"{startup}\n\n## Next Allowed Move\n\n"
        f"{handoff_next if handoff_next is not None else active_next}\n",
        encoding="utf-8",
    )


class NextMoveFreshnessTests(unittest.TestCase):
    def _run(self, root: Path, argv: list[str]) -> tuple[int, str]:
        out = io.StringIO()
        with patch.object(MODULE, "REPO_ROOT", root), \
            patch.object(sys, "argv", ["check_next_move_freshness.py", *argv]), \
            redirect_stdout(out):
            code = MODULE.main()
        return code, out.getvalue()

    def test_allows_closed_target_only_as_blocked_context(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                active_next=(
                    "Do not redispatch Model Gateway C-02 P2 from stale continuity text; "
                    "C-02 P2 is already closed. Next allowed move: fresh authorization only."
                ),
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)

    def test_allows_soft_wrapped_do_not_redispatch_context(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                active_next="Next allowed move: fresh operator authorization only.",
                handoff_next=(
                    "Next allowed move: fresh authorization only. Do not\n"
                    "redispatch Model Gateway C-02 P2 from stale continuity text."
                ),
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 0)
            self.assertIn("COMPLIANT", text)

    def test_rejects_active_state_dispatch_to_closed_target(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                active_next="Next allowed move: dispatch Model Gateway C-02 P2 to Claude.",
                front_next="Next allowed move: fresh operator authorization only.",
                handoff_next="Next allowed move: fresh operator authorization only.",
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("Model Gateway C-02 P2", text)

    def test_rejects_stale_dispatch_inside_long_next_allowed_value(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                active_next=(
                    "RSF-T3 is CLOSED_PASS_BOUNDED at material commit abc12345. "
                    "Next allowed move: dispatch Model Gateway C-02 P2 to Claude."
                ),
                front_next="Next allowed move: fresh operator authorization only.",
                handoff_next="Next allowed move: fresh operator authorization only.",
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("dispatch Model Gateway C-02 P2", text)

    def test_rejects_front_door_fresh_auth_open_for_closed_target(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                active_next="Next allowed move: fresh operator authorization only.",
                front_next=(
                    "Fresh authorization only: Model Gateway C-02 P2 may open through "
                    "fresh GC-018."
                ),
                handoff_next="Next allowed move: fresh operator authorization only.",
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("front-door Next Allowed Move", text)

    def test_rejects_handoff_next_move_to_closed_target(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                active_next="Next allowed move: fresh operator authorization only.",
                handoff_next="Next move: Model Gateway C02 P2 worker may execute.",
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("active handoff Next Allowed Move", text)

    def test_rejects_handoff_startup_ack_to_closed_target(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                active_next="Next allowed move: fresh operator authorization only.",
                handoff_next="Next allowed move: fresh operator authorization only.",
                handoff_startup=(
                    "Startup acknowledged: current mode=`mode`; active handoff=`AGENT_HANDOFF_TEST.md`; "
                    "next allowed move=Model Gateway C-02 P2 DISPATCHED_TO_CLAUDE."
                ),
            )
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("startup acknowledgment", text)

    def test_advisory_exit_zero_on_violation_without_enforce(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                active_next="Next allowed move: dispatch Model Gateway C-02 P2.",
                front_next="Next allowed move: fresh operator authorization only.",
                handoff_next="Next allowed move: fresh operator authorization only.",
            )
            code, text = self._run(root, [])
            self.assertEqual(code, 0)
            self.assertIn("ADVISORY", text)

    def test_missing_surface_fails_in_enforce_mode(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_surfaces(
                root,
                active_next="Next allowed move: fresh operator authorization only.",
            )
            (root / "CVF_SESSION_MEMORY.md").write_text("# Front Door\n", encoding="utf-8")
            code, text = self._run(root, ["--enforce"])
            self.assertEqual(code, 1)
            self.assertIn("missing ## Next Allowed Move", text)


if __name__ == "__main__":
    unittest.main()
