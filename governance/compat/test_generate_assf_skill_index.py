"""Tests for governance/compat/generate_assf_skill_index.py.

Covers:
- aggregate_entry strips source-only fields
- build_index sorts by registryOrder then skillId
- build_index strips source-only fields in output
- render_json produces deterministic, sort_keys output with trailing newline
- generate_index writes a valid JSON file
- validate_index_matches_sources detects drift
- validate_index_matches_sources returns empty list for in-sync state
- running generator twice yields identical bytes (determinism)
"""

import json
import tempfile
import unittest
from pathlib import Path

import sys
_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from generate_assf_skill_index import (
    SOURCE_ONLY_FIELDS,
    _INDEX_HEADER,
    aggregate_entry,
    build_index,
    generate_index,
    render_json,
    validate_index_matches_sources,
)


class AggregateEntryTests(unittest.TestCase):
    def test_strips_registry_order(self) -> None:
        entry = {"registryOrder": 1, "skillId": "test-skill", "name": "Test"}
        result = aggregate_entry(entry)
        self.assertNotIn("registryOrder", result)
        self.assertEqual(result["skillId"], "test-skill")

    def test_preserves_all_non_source_fields(self) -> None:
        entry = {
            "registryOrder": 5,
            "skillId": "s1",
            "status": "CANDIDATE",
            "riskProfile": "R0",
        }
        result = aggregate_entry(entry)
        self.assertEqual(result, {"skillId": "s1", "status": "CANDIDATE", "riskProfile": "R0"})

    def test_source_only_fields_constant_contains_registry_order(self) -> None:
        self.assertIn("registryOrder", SOURCE_ONLY_FIELDS)

    def test_no_mutation_of_input(self) -> None:
        entry = {"registryOrder": 1, "skillId": "s1"}
        aggregate_entry(entry)
        self.assertIn("registryOrder", entry)


class BuildIndexTests(unittest.TestCase):
    def _make_entries(self):
        return [
            {
                "registryOrder": 2,
                "skillId": "skill-b",
                "name": "B",
                "status": "CANDIDATE",
            },
            {
                "registryOrder": 1,
                "skillId": "skill-a",
                "name": "A",
                "status": "CANDIDATE",
            },
        ]

    def test_sorts_by_registry_order(self) -> None:
        index = build_index(self._make_entries())
        self.assertEqual(
            [s["skillId"] for s in index["skills"]], ["skill-a", "skill-b"]
        )

    def test_strips_source_only_fields_from_skills(self) -> None:
        index = build_index(self._make_entries())
        for skill in index["skills"]:
            self.assertNotIn("registryOrder", skill)

    def test_includes_header_fields(self) -> None:
        index = build_index(self._make_entries())
        for key in _INDEX_HEADER:
            self.assertIn(key, index)

    def test_skills_key_present(self) -> None:
        index = build_index([])
        self.assertIn("skills", index)
        self.assertEqual(index["skills"], [])

    def test_tie_broken_by_skill_id(self) -> None:
        entries = [
            {"registryOrder": 1, "skillId": "z-skill"},
            {"registryOrder": 1, "skillId": "a-skill"},
        ]
        index = build_index(entries)
        self.assertEqual(
            [s["skillId"] for s in index["skills"]], ["a-skill", "z-skill"]
        )


class RenderJsonTests(unittest.TestCase):
    def test_trailing_newline(self) -> None:
        self.assertTrue(render_json({}).endswith("\n"))

    def test_sort_keys(self) -> None:
        raw = render_json({"z": 1, "a": 2})
        parsed = json.loads(raw)
        keys = list(parsed.keys())
        self.assertEqual(keys, sorted(keys))

    def test_deterministic(self) -> None:
        value = {"b": 2, "a": 1, "c": [3, 1, 2]}
        self.assertEqual(render_json(value), render_json(value))


class GenerateIndexTests(unittest.TestCase):
    def _write_entry(self, entries_dir: Path, skill_id: str, order: int) -> None:
        (entries_dir / f"{skill_id}.json").write_text(
            json.dumps(
                {
                    "registryOrder": order,
                    "skillId": skill_id,
                    "name": skill_id,
                    "status": "CANDIDATE",
                }
            ),
            encoding="utf-8",
        )

    def test_generates_valid_json_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            self._write_entry(entries_dir, "skill-x", 1)

            generate_index(index_path, entries_dir)

            self.assertTrue(index_path.exists())
            index = json.loads(index_path.read_text(encoding="utf-8"))
            self.assertIn("skills", index)
            self.assertEqual(len(index["skills"]), 1)
            self.assertEqual(index["skills"][0]["skillId"], "skill-x")

    def test_deterministic_two_runs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            self._write_entry(entries_dir, "skill-y", 1)
            self._write_entry(entries_dir, "skill-z", 2)

            generate_index(index_path, entries_dir)
            first = index_path.read_text(encoding="utf-8")
            generate_index(index_path, entries_dir)
            second = index_path.read_text(encoding="utf-8")

            self.assertEqual(first, second)

    def test_creates_parent_directory(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            nested_index = root / "deep" / "nested" / "skill-index.json"
            self._write_entry(entries_dir, "skill-n", 1)

            generate_index(nested_index, entries_dir)

            self.assertTrue(nested_index.exists())


class ValidateIndexTests(unittest.TestCase):
    def _write_entry(self, entries_dir: Path, skill_id: str, order: int) -> None:
        (entries_dir / f"{skill_id}.json").write_text(
            json.dumps({"registryOrder": order, "skillId": skill_id, "name": skill_id}),
            encoding="utf-8",
        )

    def test_no_violations_when_in_sync(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            self._write_entry(entries_dir, "skill-s", 1)

            generate_index(index_path, entries_dir)
            violations = validate_index_matches_sources(index_path, entries_dir)

            self.assertEqual(violations, [])

    def test_detects_drift(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            self._write_entry(entries_dir, "skill-d", 1)

            generate_index(index_path, entries_dir)
            index_path.write_text(
                json.dumps({"schemaVersion": "wrong", "skills": []}),
                encoding="utf-8",
            )
            violations = validate_index_matches_sources(index_path, entries_dir)

            self.assertEqual(len(violations), 1)
            self.assertIn("drifted", violations[0])

    def test_missing_index_returns_violation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            self._write_entry(entries_dir, "skill-m", 1)

            violations = validate_index_matches_sources(index_path, entries_dir)

            self.assertEqual(len(violations), 1)
            self.assertIn("skill-index.json", violations[0])

    def test_empty_entries_dir_returns_no_violations(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            missing_entries = root / "nonexistent"
            index_path = root / "skill-index.json"

            violations = validate_index_matches_sources(index_path, missing_entries)

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
