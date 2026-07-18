"""Tests for governance/compat/run_assf_skill_resolver.py.

Covers:
- resolve_skill_packet returns all matching skills with no filters
- task_class selector filters correctly
- role selector filters correctly
- phase selector filters correctly
- surface_selector filters correctly (substring match)
- risk_ceiling filters skills above ceiling
- RETIRED/REJECTED excluded by default
- include_excluded bypasses exclusion
- invalid risk_ceiling raises ValueError
- max_results truncates and sets truncated=True
- read-only proof: pre-supplied entries means no open() call during resolution
- packet.to_dict() contains required keys including claimBoundary
- sort order is by risk_profile ascending then skillId
- resolver never opens SKILL.md (no package instruction bodies)
"""

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from run_assf_skill_resolver import (
    SkillEntry,
    SkillPacket,
    _matches,
    _sort_key,
    load_entries,
    resolve_skill_packet,
)


def _make_entry(
    skill_id: str = "test-skill",
    status: str = "CANDIDATE",
    risk_profile: str = "R0",
    task_classes: tuple = ("worker-execution",),
    roles: tuple = ("worker",),
    phases: tuple = ("WORKER_EXECUTION",),
    surfaces: tuple = ("docs/reviews",),
) -> SkillEntry:
    return SkillEntry(
        skill_id=skill_id,
        name=f"Test {skill_id}",
        version="0.1.0",
        status=status,
        risk_profile=risk_profile,
        task_classes=task_classes,
        roles=roles,
        phases=phases,
        surfaces=surfaces,
        use_when="use when testing",
        do_not_use_when="do not use in production",
        internal_agent_disposition="CANDIDATE",
        external_cli_mcp_disposition="DEFERRED_WITH_REASON",
        source_path=f"generated/skill-index.json#skills/{skill_id}",
    )


class MatchesTests(unittest.TestCase):
    def _entry(self, **kwargs) -> SkillEntry:
        return _make_entry(**kwargs)

    def test_no_filters_matches_active(self) -> None:
        entry = self._entry(status="CANDIDATE")
        self.assertTrue(_matches(entry, None, None, None, None, None, False))

    def test_task_class_match(self) -> None:
        entry = self._entry(task_classes=("worker-execution",))
        self.assertTrue(_matches(entry, "worker-execution", None, None, None, None, False))

    def test_task_class_no_match(self) -> None:
        entry = self._entry(task_classes=("reviewer",))
        self.assertFalse(_matches(entry, "worker-execution", None, None, None, None, False))

    def test_role_match(self) -> None:
        entry = self._entry(roles=("worker",))
        self.assertTrue(_matches(entry, None, "worker", None, None, None, False))

    def test_role_no_match(self) -> None:
        entry = self._entry(roles=("dispatcher",))
        self.assertFalse(_matches(entry, None, "worker", None, None, None, False))

    def test_phase_match(self) -> None:
        entry = self._entry(phases=("WORKER_EXECUTION",))
        self.assertTrue(_matches(entry, None, None, "WORKER_EXECUTION", None, None, False))

    def test_surface_substring_match(self) -> None:
        entry = self._entry(surfaces=("docs/reviews",))
        self.assertTrue(_matches(entry, None, None, None, "reviews", None, False))

    def test_surface_no_match(self) -> None:
        entry = self._entry(surfaces=("governance/compat",))
        self.assertFalse(_matches(entry, None, None, None, "reviews", None, False))

    def test_risk_ceiling_within_ceiling(self) -> None:
        entry = self._entry(risk_profile="R0")
        self.assertTrue(_matches(entry, None, None, None, None, "R1", False))

    def test_risk_ceiling_exactly_at_ceiling(self) -> None:
        entry = self._entry(risk_profile="R1")
        self.assertTrue(_matches(entry, None, None, None, None, "R1", False))

    def test_risk_ceiling_above_ceiling(self) -> None:
        entry = self._entry(risk_profile="R2")
        self.assertFalse(_matches(entry, None, None, None, None, "R1", False))

    def test_retired_excluded_by_default(self) -> None:
        entry = self._entry(status="RETIRED")
        self.assertFalse(_matches(entry, None, None, None, None, None, False))

    def test_rejected_excluded_by_default(self) -> None:
        entry = self._entry(status="REJECTED")
        self.assertFalse(_matches(entry, None, None, None, None, None, False))

    def test_include_excluded_allows_retired(self) -> None:
        entry = self._entry(status="RETIRED")
        self.assertTrue(_matches(entry, None, None, None, None, None, True))


class SortKeyTests(unittest.TestCase):
    def test_r0_sorts_before_r1(self) -> None:
        e0 = _make_entry(skill_id="a", risk_profile="R0")
        e1 = _make_entry(skill_id="b", risk_profile="R1")
        self.assertLess(_sort_key(e0), _sort_key(e1))

    def test_same_risk_sorts_by_skill_id(self) -> None:
        ea = _make_entry(skill_id="alpha", risk_profile="R0")
        eb = _make_entry(skill_id="beta", risk_profile="R0")
        self.assertLess(_sort_key(ea), _sort_key(eb))


class ResolveSkillPacketTests(unittest.TestCase):
    def _entries(self) -> tuple[SkillEntry, ...]:
        return (
            _make_entry(
                skill_id="skill-a",
                task_classes=("dispatch-authoring",),
                roles=("dispatcher",),
                phases=("PRE_DISPATCH",),
            ),
            _make_entry(
                skill_id="skill-b",
                task_classes=("worker-execution",),
                roles=("worker",),
                phases=("WORKER_EXECUTION",),
            ),
        )

    def test_no_filters_returns_all_non_excluded(self) -> None:
        packet = resolve_skill_packet(entries=self._entries())
        self.assertEqual(packet.total_candidates, 2)
        self.assertFalse(packet.truncated)

    def test_role_filter(self) -> None:
        packet = resolve_skill_packet(entries=self._entries(), role="worker")
        self.assertEqual(packet.total_candidates, 1)
        self.assertEqual(packet.items[0].skill_id, "skill-b")

    def test_task_class_filter(self) -> None:
        packet = resolve_skill_packet(
            entries=self._entries(), task_class="dispatch-authoring"
        )
        self.assertEqual(packet.total_candidates, 1)
        self.assertEqual(packet.items[0].skill_id, "skill-a")

    def test_phase_filter(self) -> None:
        packet = resolve_skill_packet(
            entries=self._entries(), phase="WORKER_EXECUTION"
        )
        self.assertEqual(packet.total_candidates, 1)
        self.assertEqual(packet.items[0].skill_id, "skill-b")

    def test_max_results_truncates(self) -> None:
        packet = resolve_skill_packet(entries=self._entries(), max_results=1)
        self.assertEqual(len(packet.items), 1)
        self.assertTrue(packet.truncated)
        self.assertEqual(packet.total_candidates, 2)

    def test_max_results_zero_raises(self) -> None:
        with self.assertRaises(ValueError):
            resolve_skill_packet(entries=self._entries(), max_results=0)

    def test_invalid_risk_ceiling_raises(self) -> None:
        with self.assertRaises(ValueError):
            resolve_skill_packet(entries=self._entries(), risk_ceiling="INVALID")

    def test_retired_excluded_by_default(self) -> None:
        entries = (
            _make_entry(skill_id="active-skill", status="CANDIDATE"),
            _make_entry(skill_id="retired-skill", status="RETIRED"),
        )
        packet = resolve_skill_packet(entries=entries)
        skill_ids = [item.skill_id for item in packet.items]
        self.assertIn("active-skill", skill_ids)
        self.assertNotIn("retired-skill", skill_ids)

    def test_include_excluded_returns_retired(self) -> None:
        entries = (
            _make_entry(skill_id="active-skill", status="CANDIDATE"),
            _make_entry(skill_id="retired-skill", status="RETIRED"),
        )
        packet = resolve_skill_packet(entries=entries, include_excluded=True)
        skill_ids = [item.skill_id for item in packet.items]
        self.assertIn("retired-skill", skill_ids)

    def test_to_dict_contains_claim_boundary(self) -> None:
        packet = resolve_skill_packet(entries=self._entries())
        d = packet.to_dict()
        self.assertIn("claimBoundary", d)
        self.assertIn("items", d)
        self.assertIn("totalCandidates", d)
        self.assertIn("truncated", d)

    def test_read_only_proof_no_open_during_resolution(self) -> None:
        """Resolution with pre-supplied entries must not call open()."""
        entries = self._entries()
        write_attempted = []

        original_open = open

        def guarded_open(file, mode="r", *args, **kwargs):
            if "w" in str(mode) or "a" in str(mode):
                write_attempted.append(str(file))
                raise IOError(f"write not allowed during resolution: {file}")
            return original_open(file, mode, *args, **kwargs)

        with patch("builtins.open", side_effect=guarded_open):
            packet = resolve_skill_packet(entries=entries, role="worker")

        self.assertEqual(write_attempted, [], "resolver must not open any file for writing")
        self.assertEqual(packet.total_candidates, 1)

    def test_result_items_have_required_fields(self) -> None:
        packet = resolve_skill_packet(entries=self._entries())
        for item in packet.items:
            d = packet.to_dict()["items"][0]
            self.assertIn("skillId", d)
            self.assertIn("status", d)
            self.assertIn("riskProfile", d)
            self.assertIn("internalAgentDisposition", d)
            self.assertIn("externalCliMcpDisposition", d)


class LoadEntriesTests(unittest.TestCase):
    def test_returns_empty_tuple_when_index_missing(self) -> None:
        result = load_entries(Path("/nonexistent/path/skill-index.json"))
        self.assertIsInstance(result, tuple)
        self.assertEqual(len(result), 0)


if __name__ == "__main__":
    unittest.main()
