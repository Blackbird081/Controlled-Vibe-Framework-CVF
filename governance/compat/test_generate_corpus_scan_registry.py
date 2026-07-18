import json
import tempfile
import unittest
from pathlib import Path

from governance.compat.generate_corpus_scan_registry import (
    aggregate_entry,
    build_registry,
    entry_filename,
    render_json,
    validate_aggregate_matches_sources,
)


class GenerateCorpusScanRegistryTests(unittest.TestCase):
    def test_entry_filename_uses_safe_slug(self) -> None:
        self.assertEqual(
            entry_filename("CVF Extraction / EXA T2 source"),
            "CVF-Extraction-EXA-T2-source.json",
        )

    def test_build_registry_sorts_by_registry_order_and_strips_source_fields(self) -> None:
        registry = build_registry(
            {"schemaVersion": "1.0.0"},
            [
                {"registryOrder": 2, "id": "b", "displayName": "B"},
                {"registryOrder": 1, "id": "a", "displayName": "A"},
            ],
        )

        self.assertEqual([entry["id"] for entry in registry["corpora"]], ["a", "b"])
        self.assertNotIn("registryOrder", registry["corpora"][0])

    def test_aggregate_entry_strips_only_source_only_fields(self) -> None:
        self.assertEqual(
            aggregate_entry({"registryOrder": 1, "id": "a", "fileCount": 2}),
            {"id": "a", "fileCount": 2},
        )

    def test_validate_aggregate_matches_sources_detects_drift(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            header = root / "header.json"
            entries = root / "entries"
            aggregate = root / "aggregate.json"
            entries.mkdir()
            header.write_text(render_json({"schemaVersion": "1.0.0"}), encoding="utf-8")
            (entries / "a.json").write_text(
                render_json({"registryOrder": 1, "id": "a"}),
                encoding="utf-8",
            )
            aggregate.write_text(
                json.dumps({"schemaVersion": "1.0.0", "corpora": [{"id": "wrong"}]}),
                encoding="utf-8",
            )

            violations = validate_aggregate_matches_sources(aggregate, header, entries)

        self.assertEqual(len(violations), 1)
        self.assertIn("drifted from per-entry sources", violations[0])


if __name__ == "__main__":
    unittest.main()
