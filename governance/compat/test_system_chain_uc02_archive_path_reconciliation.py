from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = REPO_ROOT / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))


def _load_module(name: str, rel_path: str):
    module_path = REPO_ROOT / rel_path
    spec = importlib.util.spec_from_file_location(name, module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


BOOTSTRAP = _load_module(
    "run_cvf_packet_posture_state_bootstrap", "scripts/run_cvf_packet_posture_state_bootstrap.py"
)
RELEASE_PACKET = _load_module("export_cvf_release_packet", "scripts/export_cvf_release_packet.py")
REMEDIATION_LOG = _load_module(
    "export_cvf_remediation_receipt_log", "scripts/export_cvf_remediation_receipt_log.py"
)


def test_release_gate_declared_before_local_and_secondary_packets() -> None:
    assert BOOTSTRAP.RELEASE_GATE == REPO_ROOT / "scripts" / "run_cvf_runtime_evidence_release_gate.py"
    assert BOOTSTRAP.LOCAL_PACKET == REPO_ROOT / "scripts" / "run_cvf_cross_family_packet_coverage_conformance.py"
    assert BOOTSTRAP.SECONDARY_PACKETS == (
        REPO_ROOT / "scripts" / "run_cvf_secondary_packet_cross_family_coverage_conformance.py"
    )


def test_bootstrap_runs_release_gate_exactly_once_before_either_packet_family(monkeypatch) -> None:
    call_order: list[str] = []

    def fake_run(command, env_overrides=None):
        path = Path(command[-1])
        if path == BOOTSTRAP.RELEASE_GATE:
            call_order.append("release_gate")
            assert env_overrides is None
        elif path == BOOTSTRAP.LOCAL_PACKET:
            call_order.append("local_packet")
            assert env_overrides == {"CVF_SKIP_RUNTIME_EVIDENCE_RELEASE_GATE": "1"}
        elif path == BOOTSTRAP.SECONDARY_PACKETS:
            call_order.append("secondary_packets")
            assert env_overrides == {"CVF_SKIP_RUNTIME_EVIDENCE_RELEASE_GATE": "1"}
        else:
            raise AssertionError(f"unexpected command: {command}")
        return 0, "ok"

    monkeypatch.setattr(BOOTSTRAP, "_run", fake_run)
    monkeypatch.setattr(Path, "write_text", lambda self, *a, **k: None, raising=False)

    exit_code = BOOTSTRAP.main()

    assert exit_code == 0
    assert call_order == ["release_gate", "local_packet", "secondary_packets"]
    assert call_order.count("release_gate") == 1


def test_release_gate_failure_stops_both_families_and_cache_write(monkeypatch) -> None:
    call_order: list[str] = []
    cache_write_called = {"value": False}

    def fake_run(command, env_overrides=None):
        path = Path(command[-1])
        if path == BOOTSTRAP.RELEASE_GATE:
            call_order.append("release_gate")
            return 1, "release gate failed"
        call_order.append("unexpected_child_family_call")
        return 0, "ok"

    def fake_write_text(*args, **kwargs):
        cache_write_called["value"] = True

    monkeypatch.setattr(BOOTSTRAP, "_run", fake_run)
    monkeypatch.setattr(Path, "write_text", fake_write_text, raising=False)

    try:
        BOOTSTRAP.main()
        assert False, "expected SystemExit on release gate failure"
    except SystemExit as exc:
        assert exc.code == 1

    assert call_order == ["release_gate"]
    assert cache_write_called["value"] is False


def test_local_packet_failure_stops_secondary_family(monkeypatch) -> None:
    call_order: list[str] = []

    def fake_run(command, env_overrides=None):
        path = Path(command[-1])
        if path == BOOTSTRAP.RELEASE_GATE:
            call_order.append("release_gate")
            return 0, "ok"
        if path == BOOTSTRAP.LOCAL_PACKET:
            call_order.append("local_packet")
            return 1, "local packet failed"
        call_order.append("unexpected_secondary_call")
        return 0, "ok"

    monkeypatch.setattr(BOOTSTRAP, "_run", fake_run)

    try:
        BOOTSTRAP.main()
        assert False, "expected SystemExit on local packet failure"
    except SystemExit as exc:
        assert exc.code == 1

    assert call_order == ["release_gate", "local_packet"]


def test_release_packet_historical_inputs_resolve_to_archive_owner() -> None:
    archive = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "archive"
    historical_input_paths = (
        RELEASE_PACKET.DEFAULT_TRACE,
        RELEASE_PACKET.DEFAULT_BASELINE,
        RELEASE_PACKET.DEFAULT_EXECUTIVE,
        RELEASE_PACKET.DEFAULT_REMEDIATION_JSON,
        RELEASE_PACKET.DEFAULT_REMEDIATION_LOG,
    )
    for path in historical_input_paths:
        assert path.parent == archive, f"{path} must resolve under the archive owner"
        assert path.exists(), f"{path} must exist as an indexed archive artifact"


def test_release_packet_live_outputs_remain_outside_archive() -> None:
    archive = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "archive"
    live_output_paths = (
        RELEASE_PACKET.DEFAULT_MANIFEST,
        RELEASE_PACKET.DEFAULT_TEST_LOG,
        RELEASE_PACKET.DEFAULT_ROADMAP,
        RELEASE_PACKET.DEFAULT_RUNTIME_EVIDENCE_MANIFEST,
        RELEASE_PACKET.DEFAULT_RUNTIME_EVIDENCE_LOG,
        RELEASE_PACKET.DEFAULT_OUTPUT,
    )
    for path in live_output_paths:
        assert archive not in path.parents, f"{path} must not be redirected into archive"


def test_v19_family_historical_input_resolves_to_archive_owner() -> None:
    from runtime_evidence_manifest.fixtures import RUNTIME_FAMILY_CONFIG

    archive = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "archive"
    v19_config = RUNTIME_FAMILY_CONFIG["CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY"]
    assert v19_config["defaultArtifact"].parent == archive
    assert v19_config["defaultLog"].parent == archive
    assert v19_config["defaultArtifact"].exists()
    assert v19_config["defaultLog"].exists()


def test_other_families_remain_live_generated_outputs() -> None:
    from runtime_evidence_manifest.fixtures import RUNTIME_FAMILY_CONFIG

    archive = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "archive"
    for family_id, config in RUNTIME_FAMILY_CONFIG.items():
        if family_id == "CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY":
            continue
        assert config["defaultArtifact"].parent != archive
        assert config["defaultLog"].parent != archive


def test_remediation_log_default_input_resolves_to_archive_owner() -> None:
    archive = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "archive"
    assert REMEDIATION_LOG.DEFAULT_INPUT.parent == archive
    assert REMEDIATION_LOG.DEFAULT_INPUT.exists()


def test_remediation_log_default_output_remains_live() -> None:
    archive = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "archive"
    assert REMEDIATION_LOG.DEFAULT_OUTPUT.parent != archive


def test_remediation_log_explicit_input_still_supported(monkeypatch, tmp_path: Path) -> None:
    input_path = tmp_path / "explicit-input.json"
    output_path = tmp_path / "explicit-output.md"
    input_path.write_text(
        '{"schemaVersion":"test","adapter":"test","receiptCount":0,"receipts":[]}',
        encoding="utf-8",
    )
    monkeypatch.setattr(REMEDIATION_LOG, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "export_cvf_remediation_receipt_log.py",
            "--input",
            str(input_path),
            "--output",
            str(output_path),
        ],
    )

    assert REMEDIATION_LOG.main() == 0
    assert output_path.exists()
    assert "source artifact: `explicit-input.json`" in output_path.read_text(encoding="utf-8")


def test_enterprise_evidence_checker_trace_path_resolves_to_archive_owner() -> None:
    checker = _load_module(
        "check_enterprise_evidence_pack", "governance/compat/check_enterprise_evidence_pack.py"
    )
    archive = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "archive"
    assert checker.TRACE_PATH.parent == archive
    assert checker.TRACE_PATH.exists()
    assert checker.RUNTIME_MANIFEST_PATH.parent != archive
    assert checker.RUNTIME_LOG_PATH.parent != archive


def test_enterprise_evidence_checker_archived_trace_input_exists() -> None:
    checker = _load_module(
        "check_enterprise_evidence_pack_required_files",
        "governance/compat/check_enterprise_evidence_pack.py",
    )
    assert checker.TRACE_PATH.exists()
    non_runtime_manifest_canonical = [
        path
        for path in checker.REQUIRED_CANONICAL
        if path not in (checker.RUNTIME_MANIFEST_PATH, checker.RUNTIME_LOG_PATH)
    ]
    missing = [path for path in non_runtime_manifest_canonical if not path.exists()]
    assert missing == [], f"required non-generated canonical artifacts missing: {missing}"


def test_reference_mappings_cite_archived_trace_path() -> None:
    pack_text = (REPO_ROOT / "docs" / "reference" / "CVF_ENTERPRISE_EVIDENCE_PACK.md").read_text(
        encoding="utf-8"
    )
    mapping_text = (
        REPO_ROOT / "docs" / "reference" / "CVF_CONTROL_TO_ARTIFACT_MAPPING.md"
    ).read_text(encoding="utf-8")
    assert "docs/reviews/cvf_phase_governance/archive/CVF_UPGRADE_TRACE_2026-03-07.md" in pack_text
    assert "docs/reviews/cvf_phase_governance/archive/CVF_UPGRADE_TRACE_2026-03-07.md" in mapping_text


def test_phase_governance_readme_distinguishes_input_and_output_sections() -> None:
    readme_text = (
        REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "README.md"
    ).read_text(encoding="utf-8")
    assert "## Historical Inputs (Archived, Read-Only)" in readme_text
    assert "## Generated Outputs (Live, Regenerated By Exporters)" in readme_text
