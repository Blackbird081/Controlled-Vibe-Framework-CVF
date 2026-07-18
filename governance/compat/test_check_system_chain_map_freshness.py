from __future__ import annotations

import datetime as dt
import hashlib
import importlib.util
import json
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_system_chain_map_freshness.py")
SPEC = importlib.util.spec_from_file_location("check_system_chain_map_freshness", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def _write_source(tmp_path: Path, name: str, content: str) -> tuple[str, str]:
    source_file = tmp_path / name
    source_file.write_text(content, encoding="utf-8")
    sha = hashlib.sha256(source_file.read_bytes()).hexdigest()
    return name, sha


def _valid_doc(tmp_path: Path) -> dict:
    lanes = []
    for i, lane_id in enumerate(MODULE.CANONICAL_LANE_IDS):
        name, sha = _write_source(tmp_path, f"source_{i}.md", f"hello world {i}\n")
        lanes.append(
            {
                "laneId": lane_id,
                "laneOrder": i + 1,
                "planeRange": "L0-L6",
                "currentPosture": "CURRENT",
                "verdict": f"VERDICT_{i}",
                "implementedBy": "x",
                "invokedBy": "x",
                "testedBy": "x",
                "evidenceOwner": "x",
                "operatorSurface": "x",
                "knownGaps": "x",
                "nextReviewAction": "x",
                "sourceFingerprints": [
                    {"path": name, "sha256": sha, "evidenceRole": "test"}
                ],
            }
        )

    audit_name, audit_sha = _write_source(tmp_path, "audit.md", "audit content\n")
    evidence_name, evidence_sha = _write_source(tmp_path, "evidence.json", "{}\n")
    completion_name, completion_sha = _write_source(tmp_path, "completion.md", "completion content\n")

    return {
        "schemaVersion": "test.v1",
        "mapId": "test-map",
        "sourceAudit": "docs/audits/test.md",
        "reviewerCompletion": "docs/reviews/test.md",
        "lastVerifiedDate": "2026-07-10",
        "maxAgeDays": 30,
        "reminderPolicy": "no auto rewrite",
        "lanes": lanes,
        "auditManifestFingerprint": {"path": audit_name, "sha256": audit_sha, "evidenceRole": "audit"},
        "auditEvidenceFingerprint": {"path": evidence_name, "sha256": evidence_sha, "evidenceRole": "evidence"},
        "reviewerCompletionFingerprint": {"path": completion_name, "sha256": completion_sha, "evidenceRole": "completion"},
    }


def _readme_text(doc: dict) -> str:
    parts = []
    for lane in doc["lanes"]:
        parts.append(f"laneId `{lane['laneId']}` verdict `{lane['verdict']}`")
    return "\n".join(parts)


def _valid_coverage(doc: dict) -> dict:
    use_case_ids = [
        "UC-01-SOT3-BOUNDED-ACTIVATION",
        "UC-02-RUNTIME-TO-ENFORCEMENT-CURRENT-RUN",
    ]
    lanes = []
    for lane in doc["lanes"]:
        static = lane["laneId"] in (
            "DOCTRINE_TO_CONTRACT",
            "ENFORCEMENT_TO_EVIDENCE",
        )
        lanes.append(
            {
                "laneId": lane["laneId"],
                "semanticPosture": lane["currentPosture"],
                "semanticVerdict": lane["verdict"],
                "liveApplicability": "STATIC_RECOMPUTE_REQUIRED" if static else "RUNTIME_LIVE_REQUIRED",
                "requiredProofClass": "STATIC_SOURCE_VERIFIED" if static else "CURRENT_RUNTIME_INVOCATION",
                "observedProofClass": "STATIC_SOURCE_VERIFIED" if static else "LOCAL_DETERMINISTIC_EXECUTION",
                "operationalProofStatus": "NOT_APPLICABLE_STATIC_WITH_REASON" if static else "PARTIAL",
                "reason": "test reason",
                "nextUseCase": "NONE" if static else "UC-02-RUNTIME-TO-ENFORCEMENT-CURRENT-RUN",
                "nextAction": "test action",
            }
        )
    return {
        "schemaVersion": "test.v1",
        "ledgerId": "test-ledger",
        "standard": "standard.md",
        "sourceMap": MODULE.MAP_PATH,
        "lastReviewedDate": "2026-07-14",
        "claimBoundary": "test boundary",
        "useCases": [{"useCaseId": use_case_id} for use_case_id in use_case_ids],
        "lanes": lanes,
    }


def test_valid_fixture_with_matching_hashes_and_age_within_30_passes(monkeypatch, tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    issues = MODULE.validate_schema(doc)
    assert issues == []
    issues = MODULE.validate_source_drift(doc)
    assert issues == []
    issues = MODULE.validate_map_agreement(doc, _readme_text(doc))
    assert issues == []
    issues = MODULE.validate_age(doc, dt.date(2026, 7, 10))
    assert issues == []
    issues = MODULE.validate_age(doc, dt.date(2026, 8, 9))
    assert issues == []
    issues = MODULE.validate_live_proof_coverage(doc, _valid_coverage(doc))
    assert issues == []


def test_live_coverage_semantic_verdict_drift_fails(tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    coverage = _valid_coverage(doc)
    coverage["lanes"][0]["semanticVerdict"] = "STALE_VERDICT"
    issues = MODULE.validate_live_proof_coverage(doc, coverage)
    assert any("semanticVerdict" in issue for issue in issues)


def test_unproven_runtime_lane_without_use_case_fails(tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    coverage = _valid_coverage(doc)
    coverage["lanes"][1]["nextUseCase"] = "NONE"
    issues = MODULE.validate_live_proof_coverage(doc, coverage)
    assert any("has no next use case" in issue for issue in issues)


def test_one_source_path_missing_fails(monkeypatch, tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    doc["lanes"][0]["sourceFingerprints"][0]["path"] = "does_not_exist.md"
    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    issues = MODULE.validate_source_drift(doc)
    assert len(issues) == 1
    assert issues[0].startswith("PATH_MISSING:")


def test_one_source_content_changed_fails(monkeypatch, tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    source_file = tmp_path / doc["lanes"][0]["sourceFingerprints"][0]["path"]
    source_file.write_text("mutated content\n", encoding="utf-8")
    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    issues = MODULE.validate_source_drift(doc)
    assert len(issues) == 1
    assert issues[0].startswith("SOURCE_DRIFT:")


def test_readme_lane_verdict_differs_from_json_fails(tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    readme = _readme_text(doc).replace("VERDICT_0", "SOMETHING_ELSE")
    issues = MODULE.validate_map_agreement(doc, readme)
    assert any("MAP_DRIFT" in issue for issue in issues)


def test_duplicate_lane_id_fails_schema() -> None:
    doc = {
        "schemaVersion": "test.v1",
        "mapId": "test-map",
        "sourceAudit": "docs/audits/test.md",
        "reviewerCompletion": "docs/reviews/test.md",
        "lastVerifiedDate": "2026-07-10",
        "maxAgeDays": 30,
        "reminderPolicy": "no auto rewrite",
        "lanes": [
            {
                "laneId": "DOCTRINE_TO_CONTRACT",
                "laneOrder": 1,
                "planeRange": "x",
                "currentPosture": "CURRENT",
                "verdict": "V",
                "implementedBy": "x",
                "invokedBy": "x",
                "testedBy": "x",
                "evidenceOwner": "x",
                "operatorSurface": "x",
                "knownGaps": "x",
                "nextReviewAction": "x",
                "sourceFingerprints": [{"path": "a.md", "sha256": "a" * 64, "evidenceRole": "x"}],
            },
            {
                "laneId": "DOCTRINE_TO_CONTRACT",
                "laneOrder": 2,
                "planeRange": "x",
                "currentPosture": "CURRENT",
                "verdict": "V",
                "implementedBy": "x",
                "invokedBy": "x",
                "testedBy": "x",
                "evidenceOwner": "x",
                "operatorSurface": "x",
                "knownGaps": "x",
                "nextReviewAction": "x",
                "sourceFingerprints": [{"path": "b.md", "sha256": "b" * 64, "evidenceRole": "x"}],
            },
        ],
    }
    issues = MODULE.validate_schema(doc)
    assert any("duplicate laneId" in issue for issue in issues)
    assert any("expected exactly 5 lanes" in issue for issue in issues)


def test_missing_lane_id_fails_schema(tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    del doc["lanes"][0]["laneId"]
    issues = MODULE.validate_schema(doc)
    assert any("missing required key `laneId`" in issue for issue in issues)


def test_swapped_lane_array_order_fails_schema(tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    doc["lanes"][0], doc["lanes"][1] = doc["lanes"][1], doc["lanes"][0]
    issues = MODULE.validate_schema(doc)
    assert any("lane array order must be exactly" in issue for issue in issues)


def test_swapped_lane_order_value_fails_schema(tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    doc["lanes"][0]["laneOrder"], doc["lanes"][1]["laneOrder"] = (
        doc["lanes"][1]["laneOrder"],
        doc["lanes"][0]["laneOrder"],
    )
    issues = MODULE.validate_schema(doc)
    assert any("laneOrder values must be exactly" in issue for issue in issues)


def test_non_canonical_lane_id_fails_schema(tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    doc["lanes"][0]["laneId"] = "NOT_A_REAL_LANE"
    issues = MODULE.validate_schema(doc)
    assert any("non-canonical laneId" in issue for issue in issues)
    assert any("lane array order must be exactly" in issue for issue in issues)


def test_missing_top_level_fingerprint_source_fails_path_missing(monkeypatch, tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    doc["auditManifestFingerprint"]["path"] = "does_not_exist_top_level.md"
    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    issues = MODULE.validate_source_drift(doc)
    assert len(issues) == 1
    assert issues[0].startswith("PATH_MISSING:")
    assert "top-level `auditManifestFingerprint`" in issues[0]


def test_changed_top_level_fingerprint_source_fails_source_drift(monkeypatch, tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    source_file = tmp_path / doc["reviewerCompletionFingerprint"]["path"]
    source_file.write_text("mutated completion content\n", encoding="utf-8")
    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    issues = MODULE.validate_source_drift(doc)
    assert len(issues) == 1
    assert issues[0].startswith("SOURCE_DRIFT:")
    assert "top-level `reviewerCompletionFingerprint`" in issues[0]


def test_missing_top_level_fingerprint_record_fails_schema(tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    del doc["auditManifestFingerprint"]
    issues = MODULE.validate_schema(doc)
    assert any(
        "missing required top-level key `auditManifestFingerprint`" in issue
        for issue in issues
    )


def test_as_of_date_at_day_30_passes(tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    issues = MODULE.validate_age(doc, dt.date(2026, 8, 9))
    assert issues == []


def test_as_of_date_at_day_31_fails(tmp_path) -> None:
    doc = _valid_doc(tmp_path)
    issues = MODULE.validate_age(doc, dt.date(2026, 8, 10))
    assert len(issues) == 1
    assert issues[0].startswith("AGE_EXPIRED:")


def test_missing_one_hook_catalog_binding_fails(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    for rel_path, _label in MODULE.WIRING_TARGETS:
        full = tmp_path / rel_path
        full.parent.mkdir(parents=True, exist_ok=True)
        if rel_path == "governance/compat/agent_autorun_command_catalog.py":
            full.write_text("# missing the checker reference\n", encoding="utf-8")
        else:
            full.write_text(f"references {MODULE.THIS_CHECKER_PATH}\n", encoding="utf-8")
    issues = MODULE.validate_wiring()
    assert len(issues) == 1
    assert "does not reference" in issues[0]


def test_json_output_is_valid_and_secret_free(monkeypatch, tmp_path, capsys) -> None:
    doc = _valid_doc(tmp_path)
    map_dir = tmp_path / "docs" / "reference" / "system_chain"
    map_dir.mkdir(parents=True, exist_ok=True)
    (map_dir / "CVF_SYSTEM_CHAIN_MAP.json").write_text(json.dumps(doc), encoding="utf-8")
    (map_dir / "CVF_SYSTEM_CHAIN_LIVE_PROOF_COVERAGE.json").write_text(
        json.dumps(_valid_coverage(doc)), encoding="utf-8"
    )
    (map_dir / "README.md").write_text(_readme_text(doc), encoding="utf-8")
    for rel_path, _label in MODULE.WIRING_TARGETS:
        full = tmp_path / rel_path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_text(f"references {MODULE.THIS_CHECKER_PATH}\n", encoding="utf-8")

    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    exit_code = MODULE.main(["--as-of-date", "2026-07-10", "--json"])
    assert exit_code == 0
    out = capsys.readouterr().out
    report = json.loads(out)
    assert report["freshnessState"] == "CURRENT"
    assert "secret" not in out.lower()
    assert "token" not in out.lower()
    assert "api_key" not in out.lower()


def test_checker_run_in_real_repo_after_all_edits_passes() -> None:
    exit_code = MODULE.main(["--as-of-date", "2026-07-10", "--enforce"])
    assert exit_code == 0
