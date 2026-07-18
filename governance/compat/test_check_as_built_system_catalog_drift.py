from __future__ import annotations

import importlib.util
import json
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_as_built_system_catalog_drift.py")
SPEC = importlib.util.spec_from_file_location("check_as_built_system_catalog_drift", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def test_r91_owned_paths_are_never_fingerprinted_by_this_checker() -> None:
    """This checker must not adopt R91's MAP_PATH-equivalent ownership."""
    for r91_path in MODULE.R91_OWNED_PATHS:
        assert r91_path not in {
            str(MODULE.CATALOG_AGGREGATE_PATH),
            str(MODULE.GAP_INDEX_PATH),
        }
    # This checker's owned paths must be disjoint from R91's owned paths.
    owned = {
        str(MODULE.CATALOG_AGGREGATE_PATH.relative_to(MODULE.REPO_ROOT)).replace("\\", "/"),
        str(MODULE.GAP_INDEX_PATH.relative_to(MODULE.REPO_ROOT)).replace("\\", "/"),
    }
    assert owned.isdisjoint(set(MODULE.R91_OWNED_PATHS))


def test_r91_owned_paths_include_system_chain_map_and_its_dedicated_workflow() -> None:
    """R91's own weekly workflow must be excluded from this checker's wiring
    ownership, matching its exclusion of R91's map/README/standard/checker."""
    assert "docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json" in MODULE.R91_OWNED_PATHS
    assert "governance/compat/check_system_chain_map_freshness.py" in MODULE.R91_OWNED_PATHS
    assert ".github/workflows/system-chain-map-freshness.yml" in MODULE.R91_OWNED_PATHS


def test_wiring_targets_requires_the_dedicated_as_built_catalog_workflow() -> None:
    """Round 2 repair: WIRING_TARGETS must name the catalog family's own
    dedicated workflow, not the shared documentation-testing.yml (which R91
    whole-file-fingerprints, so any additive edit to it causes R91 SOURCE_DRIFT)."""
    target_paths = {path for path, _label in MODULE.WIRING_TARGETS}
    assert ".github/workflows/as-built-system-catalog-freshness.yml" in target_paths
    assert ".github/workflows/documentation-testing.yml" not in target_paths
    # And it must not collide with any R91-owned path.
    assert target_paths.isdisjoint(set(MODULE.R91_OWNED_PATHS))


def test_dedicated_workflow_file_exists_and_wires_the_checker_exactly_once() -> None:
    """The new workflow must exist on disk and reference this checker's
    enforcement command exactly once (path-filter duplication is a real
    wiring defect this gate must catch, not just a unit-test assumption)."""
    workflow_path = MODULE.REPO_ROOT / ".github/workflows/as-built-system-catalog-freshness.yml"
    assert workflow_path.exists(), "the dedicated as-built catalog freshness workflow must exist"
    text = workflow_path.read_text(encoding="utf-8")
    assert text.count(MODULE.THIS_CHECKER_PATH) == 1
    assert "workflow_dispatch" in text
    assert "schedule" in text
    assert "cron" in text
    assert "actions/checkout" in text
    assert "actions/setup-python" in text


def test_validate_catalog_drift_reports_path_missing_when_aggregate_absent(tmp_path, monkeypatch) -> None:
    entries_dir = tmp_path / "entries"
    entries_dir.mkdir()
    aggregate_path = tmp_path / "missing_aggregate.json"
    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(MODULE, "CATALOG_ENTRIES_DIR", entries_dir)
    monkeypatch.setattr(MODULE, "CATALOG_AGGREGATE_PATH", aggregate_path)

    issues = MODULE.validate_catalog_drift()
    assert any(issue.startswith("PATH_MISSING:") for issue in issues)


def test_validate_catalog_drift_reports_missing_entries_dir(tmp_path, monkeypatch) -> None:
    entries_dir = tmp_path / "does_not_exist"
    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(MODULE, "CATALOG_ENTRIES_DIR", entries_dir)

    issues = MODULE.validate_catalog_drift()
    assert any(issue.startswith("PATH_MISSING:") for issue in issues)


def test_validate_gap_readme_reconciliation_flags_missing_gap_id(tmp_path, monkeypatch) -> None:
    index_path = tmp_path / "index.json"
    index_path.write_text(
        json.dumps({"gaps": [{"stableId": "cvf.asc.gap.orphan.v1"}]}), encoding="utf-8"
    )
    readme_path = tmp_path / "README.md"
    readme_path.write_text("# Gap Ledger\n\nno mention of any gap id here\n", encoding="utf-8")

    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(MODULE, "GAP_INDEX_PATH", index_path)
    monkeypatch.setattr(MODULE, "GAP_README_PATH", readme_path)

    issues = MODULE.validate_gap_readme_reconciliation()
    assert any("cvf.asc.gap.orphan.v1" in issue and issue.startswith("README_DRIFT:") for issue in issues)


def test_validate_gap_readme_reconciliation_passes_when_gap_id_present(tmp_path, monkeypatch) -> None:
    index_path = tmp_path / "index.json"
    index_path.write_text(
        json.dumps({"gaps": [{"stableId": "cvf.asc.gap.present.v1"}]}), encoding="utf-8"
    )
    readme_path = tmp_path / "README.md"
    readme_path.write_text("# Gap Ledger\n\n`cvf.asc.gap.present.v1` is documented here\n", encoding="utf-8")

    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(MODULE, "GAP_INDEX_PATH", index_path)
    monkeypatch.setattr(MODULE, "GAP_README_PATH", readme_path)

    issues = MODULE.validate_gap_readme_reconciliation()
    assert issues == []


def test_validate_wiring_flags_missing_reference(tmp_path, monkeypatch) -> None:
    missing_target = tmp_path / "no_reference.py"
    missing_target.write_text("# no reference to the checker here\n", encoding="utf-8")

    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(MODULE, "WIRING_TARGETS", (("no_reference.py", "test target"),))

    issues = MODULE.validate_wiring()
    assert any("does not reference" in issue for issue in issues)


def test_validate_wiring_passes_when_reference_present_exactly_once(tmp_path, monkeypatch) -> None:
    target = tmp_path / "has_reference.py"
    target.write_text(f'"{MODULE.THIS_CHECKER_PATH}"\n', encoding="utf-8")

    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(MODULE, "WIRING_TARGETS", (("has_reference.py", "test target"),))

    issues = MODULE.validate_wiring()
    assert issues == []


def test_validate_wiring_flags_duplicate_reference(tmp_path, monkeypatch) -> None:
    target = tmp_path / "dup_reference.py"
    target.write_text(f'"{MODULE.THIS_CHECKER_PATH}"\n"{MODULE.THIS_CHECKER_PATH}"\n', encoding="utf-8")

    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(MODULE, "WIRING_TARGETS", (("dup_reference.py", "test target"),))

    issues = MODULE.validate_wiring()
    assert any("expected exactly 1" in issue for issue in issues)


def test_classify_buckets_known_prefixes() -> None:
    issues = [
        "PATH_MISSING: x",
        "AGGREGATE_DRIFT: y",
        "wiring: z",
        "GAP_INDEX_DRIFT: w",
    ]
    counts = MODULE._classify(issues)
    assert counts["PATH_MISSING"] == 1
    assert counts["AGGREGATE_DRIFT"] == 1
    assert counts["wiring"] == 1
    assert counts["GAP_INDEX_DRIFT"] == 1
