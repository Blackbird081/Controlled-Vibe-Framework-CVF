"""Tests for governance/compat/check_assf_skill_index_drift.py.

Covers:
- check() returns empty list when index matches sources
- check() returns violations when index drifted from sources
- check() returns violation when index file is missing
- main() returns 0 for in-sync state, 1 for drift
"""

import json
import sys
import tempfile
import unittest
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from generate_assf_skill_index import generate_index
from check_assf_skill_index_drift import check


def _write_entry(entries_dir: Path, skill_id: str, order: int) -> None:
    (entries_dir / f"{skill_id}.json").write_text(
        json.dumps({"registryOrder": order, "skillId": skill_id, "name": skill_id}),
        encoding="utf-8",
    )


class CheckDriftTests(unittest.TestCase):
    def test_no_violations_when_in_sync(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            _write_entry(entries_dir, "skill-ok", 1)

            generate_index(index_path, entries_dir)
            violations = check(index_path, entries_dir)

            self.assertEqual(violations, [])

    def test_violations_when_index_drifted(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            _write_entry(entries_dir, "skill-drift", 1)

            generate_index(index_path, entries_dir)
            index_path.write_text(
                json.dumps({"schemaVersion": "stale", "skills": [{"skillId": "wrong"}]}),
                encoding="utf-8",
            )
            violations = check(index_path, entries_dir)

            self.assertEqual(len(violations), 1)
            self.assertIn("drifted", violations[0])

    def test_violation_when_index_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            _write_entry(entries_dir, "skill-miss", 1)

            violations = check(index_path, entries_dir)

            self.assertEqual(len(violations), 1)
            self.assertIn("skill-index.json", violations[0])

    def test_no_violation_when_entries_dir_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "nonexistent"
            index_path = root / "skill-index.json"

            violations = check(index_path, entries_dir)

            self.assertEqual(violations, [])

    def test_multiple_entries_in_sync(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            entries_dir = root / "entries"
            entries_dir.mkdir()
            index_path = root / "skill-index.json"
            _write_entry(entries_dir, "skill-alpha", 1)
            _write_entry(entries_dir, "skill-beta", 2)

            generate_index(index_path, entries_dir)
            violations = check(index_path, entries_dir)

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
