"""
Focused tests for check_dice_machine_candidates.py.

Covers FPC-T3-C02 requirements:
- no-op pass when the changed range does not touch DICE/DIR paths;
- marker and test-function coverage for DICE-MC-01 through DICE-MC-10;
- focused pytest is invoked only for applicable DICE/DIR changes;
- CLI --base/--head/--enforce/--json behavior;
- checker implementation stays read-only and network-free.
"""

from __future__ import annotations

import io
import json
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from governance.compat import check_dice_machine_candidates as checker


def _complete_marker_text() -> str:
    lines: list[str] = []
    for index in range(1, 11):
        marker = f"DICE-MC-{index:02d}"
        function_marker = marker.replace("-", "_")
        lines.append(f"# {marker}: test marker")
        lines.append(f"def test_{function_marker}_example() -> None:")
        lines.append("    assert True")
    return "\n".join(lines)


class TestDiceMachineCandidateMarkers(unittest.TestCase):

    def test_complete_marker_text_passes(self) -> None:
        self.assertEqual(
            checker.diagnose_dice_machine_candidate_markers(_complete_marker_text()),
            [],
        )

    def test_missing_marker_is_detected(self) -> None:
        text = _complete_marker_text().replace("DICE-MC-07", "DICE-MC-XX")
        violations = checker.diagnose_dice_machine_candidate_markers(text)
        self.assertIn("DICE-MC-07", [item["marker"] for item in violations])

    def test_marker_without_test_function_is_detected(self) -> None:
        text = _complete_marker_text().replace("DICE_MC_04", "DICE_MC_XX")
        violations = checker.diagnose_dice_machine_candidate_markers(text)
        self.assertIn("DICE-MC-04", [item["marker"] for item in violations])


class TestDiceMachineCandidateCli(unittest.TestCase):

    def _run_main(
        self,
        argv: list[str],
        *,
        changed: dict[str, set[str]],
        marker_text: str,
        pytest_returncode: int = 0,
    ) -> tuple[int, str]:
        pytest_result = {
            "command": f"python -m pytest {checker.DICE_TEST_PATH} -q",
            "returncode": pytest_returncode,
            "stdout": "",
            "stderr": "",
            "passed": pytest_returncode == 0,
        }
        with mock.patch.object(sys, "argv", ["check_dice_machine_candidates.py", *argv]), \
             mock.patch.object(checker, "_get_changed_name_status", return_value=changed), \
             mock.patch.object(checker, "_get_worktree_name_status", return_value={}), \
             mock.patch.object(checker, "_read_rel", return_value=marker_text), \
             mock.patch.object(checker.Path, "exists", return_value=True), \
             mock.patch.object(checker, "_run_focused_pytest", return_value=pytest_result):
            output = io.StringIO()
            with redirect_stdout(output):
                rc = checker.main()
            return rc, output.getvalue()

    def test_non_applicable_change_returns_zero_without_pytest(self) -> None:
        with mock.patch.object(checker, "_run_focused_pytest") as run_pytest:
            rc, output = self._run_main(
                ["--base", "BASE", "--head", "HEAD", "--enforce"],
                changed={"docs/reference/not_dice.md": {"M"}},
                marker_text=_complete_marker_text(),
            )
            self.assertEqual(rc, 0)
            self.assertIn("Checked DICE/DIR paths: 0", output)
            run_pytest.assert_not_called()

    def test_applicable_change_runs_pytest_and_passes(self) -> None:
        rc, output = self._run_main(
            ["--base", "BASE", "--head", "HEAD", "--enforce"],
            changed={checker.DICE_SOURCE_PATH: {"M"}},
            marker_text=_complete_marker_text(),
        )
        self.assertEqual(rc, 0)
        self.assertIn("Focused pytest: returncode=0", output)

    def test_enforce_returns_nonzero_for_marker_gap(self) -> None:
        rc, output = self._run_main(
            ["--base", "BASE", "--head", "HEAD", "--enforce"],
            changed={checker.DICE_SOURCE_PATH: {"M"}},
            marker_text=_complete_marker_text().replace("DICE-MC-09", "DICE-MC-XX"),
        )
        self.assertEqual(rc, 2)
        self.assertIn("DICE-MC-09", output)

    def test_enforce_returns_nonzero_for_pytest_failure(self) -> None:
        rc, output = self._run_main(
            ["--base", "BASE", "--head", "HEAD", "--enforce"],
            changed={checker.DICE_TEST_PATH: {"M"}},
            marker_text=_complete_marker_text(),
            pytest_returncode=1,
        )
        self.assertEqual(rc, 2)
        self.assertIn("focused DICE-MC pytest failed", output)

    def test_json_report_is_structured(self) -> None:
        rc, output = self._run_main(
            ["--base", "BASE", "--head", "HEAD", "--json", "--no-pytest"],
            changed={checker.DICE_SOURCE_PATH: {"M"}},
            marker_text=_complete_marker_text(),
        )
        self.assertEqual(rc, 0)
        report = json.loads(output)
        self.assertEqual(report["violationCount"], 0)
        self.assertEqual(report["range"]["base"], "BASE")
        self.assertEqual(report["range"]["head"], "HEAD")
        self.assertEqual(report["pytest"], None)


class TestDiceMachineCandidateReadOnlyBoundary(unittest.TestCase):

    def test_checker_source_has_no_write_or_network_primitives(self) -> None:
        source = Path(checker.__file__).read_text(encoding="utf-8")
        forbidden_tokens = (
            ".write_text(",
            ".write_bytes(",
            "open(",
            "requests.",
            "urllib.",
            "socket.",
            "http.client",
        )
        for token in forbidden_tokens:
            with self.subTest(token=token):
                self.assertNotIn(token, source)


if __name__ == "__main__":
    unittest.main()
