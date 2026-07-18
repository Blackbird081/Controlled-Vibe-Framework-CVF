from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("run_dispatch_packet_author_fast_gate.py")
SPEC = importlib.util.spec_from_file_location("run_dispatch_packet_author_fast_gate", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class DispatchPacketAuthorFastGateTests(unittest.TestCase):
    def test_gate_sequence_matches_packet_authoring_controls(self) -> None:
        labels = [gate["label"] for gate in MODULE.GATE_COMMANDS]

        self.assertEqual(
            labels,
            [
                "dispatch-quality",
                "structural-completeness",
                "authority-and-encoding",
                "agent-operation-trace",
            ],
        )

    def test_advisory_mode_returns_zero_on_failed_check(self) -> None:
        with patch.object(
            sys,
            "argv",
            ["run_dispatch_packet_author_fast_gate.py", "--base", "abc123", "--head", "HEAD"],
        ), patch.object(MODULE, "_run_check", return_value=False):
            self.assertEqual(MODULE.main(), 0)

    def test_enforce_mode_returns_one_on_failed_check(self) -> None:
        with patch.object(
            sys,
            "argv",
            [
                "run_dispatch_packet_author_fast_gate.py",
                "--base",
                "abc123",
                "--head",
                "HEAD",
                "--enforce",
            ],
        ), patch.object(MODULE, "_run_check", return_value=False):
            self.assertEqual(MODULE.main(), 1)


if __name__ == "__main__":
    unittest.main()
