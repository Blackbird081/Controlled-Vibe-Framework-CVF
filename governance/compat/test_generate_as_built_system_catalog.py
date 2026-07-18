from __future__ import annotations

import importlib.util
import json
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("generate_as_built_system_catalog.py")
SPEC = importlib.util.spec_from_file_location("generate_as_built_system_catalog", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def test_normalize_text_strips_trailing_whitespace_and_crlf() -> None:
    raw = "line one \r\nline two\t\r\n\r\n\r\n"
    normalized = MODULE._normalize_text(raw)
    assert normalized == "line one\nline two\n"
    assert "\r" not in normalized


def test_normalize_text_single_trailing_newline() -> None:
    assert MODULE._normalize_text("a") == "a\n"
    assert MODULE._normalize_text("a\n\n\n") == "a\n"


def test_sort_key_uses_stable_id() -> None:
    entities = [{"stableId": "cvf.asc.plane.z.v1"}, {"stableId": "cvf.asc.plane.a.v1"}]
    ordered = sorted(entities, key=MODULE._sort_key)
    assert [e["stableId"] for e in ordered] == ["cvf.asc.plane.a.v1", "cvf.asc.plane.z.v1"]


def test_build_catalog_aggregate_is_sorted_and_deterministic(tmp_path, monkeypatch) -> None:
    entries_dir = tmp_path / "entries"
    entries_dir.mkdir()
    (entries_dir / "b.json").write_text(json.dumps({"stableId": "cvf.asc.plane.b.v1", "entityType": "PLANE"}), encoding="utf-8")
    (entries_dir / "a.json").write_text(json.dumps({"stableId": "cvf.asc.plane.a.v1", "entityType": "PLANE"}), encoding="utf-8")
    aggregate_path = tmp_path / "aggregate.json"

    monkeypatch.setattr(MODULE, "CATALOG_ENTRIES_DIR", entries_dir)
    monkeypatch.setattr(MODULE, "CATALOG_AGGREGATE_PATH", aggregate_path)

    payload1, sha1 = MODULE.build_catalog_aggregate()
    payload2, sha2 = MODULE.build_catalog_aggregate()

    assert sha1 == sha2, "generator must be byte-stable across repeated runs"
    assert [e["stableId"] for e in payload1["entities"]] == ["cvf.asc.plane.a.v1", "cvf.asc.plane.b.v1"]
    assert payload1["entityCount"] == 2

    written = aggregate_path.read_bytes()
    assert written.endswith(b"\n") and not written.endswith(b"\n\n")
    assert b"\r" not in written


def test_build_gap_index_counts_by_status(tmp_path, monkeypatch) -> None:
    gap_dir = tmp_path / "gap_entries"
    gap_dir.mkdir()
    (gap_dir / "g1.json").write_text(
        json.dumps({"stableId": "cvf.asc.gap.g1.v1", "currentStatus": "OPEN_CONFIRMED_GAP"}), encoding="utf-8"
    )
    (gap_dir / "g2.json").write_text(
        json.dumps({"stableId": "cvf.asc.gap.g2.v1", "currentStatus": "OPEN_CONFIRMED_GAP"}), encoding="utf-8"
    )
    index_path = tmp_path / "index.json"

    monkeypatch.setattr(MODULE, "GAP_ENTRIES_DIR", gap_dir)
    monkeypatch.setattr(MODULE, "GAP_INDEX_PATH", index_path)

    payload, _sha = MODULE.build_gap_index()
    assert payload["gapCount"] == 2
    assert payload["countsByStatus"] == {"OPEN_CONFIRMED_GAP": 2}


def test_build_catalog_aggregate_empty_dir_is_zero_entities(tmp_path, monkeypatch) -> None:
    entries_dir = tmp_path / "empty_entries"
    entries_dir.mkdir()
    aggregate_path = tmp_path / "aggregate.json"
    monkeypatch.setattr(MODULE, "CATALOG_ENTRIES_DIR", entries_dir)
    monkeypatch.setattr(MODULE, "CATALOG_AGGREGATE_PATH", aggregate_path)

    payload, _sha = MODULE.build_catalog_aggregate()
    assert payload["entityCount"] == 0
    assert payload["entities"] == []
