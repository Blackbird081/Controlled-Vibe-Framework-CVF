from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[2] / "scripts" / "run_cvf_system_chain_uc02_current_proof.py"
SPEC = importlib.util.spec_from_file_location("run_cvf_system_chain_uc02_current_proof", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _packet_command(scenario_id: str) -> list[str]:
    return [
        "python",
        "scripts/run_cvf_packet_posture_gate_conformance.py",
        "--gate",
        f"governance/compat/check_fake_{scenario_id.lower()}.py",
    ]


def _write_registry(tmp_path: Path, scenario_ids: list[str], command_override: dict[str, list[str]] | None = None) -> Path:
    command_override = command_override or {}
    scenarios = []
    for scenario_id in scenario_ids:
        scenarios.append(
            {
                "scenarioId": scenario_id,
                "title": f"Fake scenario {scenario_id}",
                "objective": "test objective",
                "workdir": ".",
                "command": command_override.get(scenario_id, _packet_command(scenario_id)),
            }
        )
    registry_path = tmp_path / "registry.json"
    registry_path.write_text(json.dumps({"scenarios": scenarios}), encoding="utf-8")
    return registry_path


def test_exact_nine_target_ids_load_in_canonical_order(tmp_path) -> None:
    shuffled = list(reversed(MODULE.TARGET_SCENARIO_IDS))
    registry_path = _write_registry(tmp_path, shuffled + ["CF-999"])
    scenarios = MODULE.load_target_scenarios(registry_path)
    assert [s.scenario_id for s in scenarios] == list(MODULE.TARGET_SCENARIO_IDS)


def test_missing_scenario_id_raises_selection_error(tmp_path) -> None:
    incomplete = list(MODULE.TARGET_SCENARIO_IDS)[:-1]
    registry_path = _write_registry(tmp_path, incomplete)
    try:
        MODULE.load_target_scenarios(registry_path)
        assert False, "expected ScenarioSelectionError"
    except MODULE.ScenarioSelectionError as exc:
        assert "MISSING_SCENARIO_IDS" in str(exc)
        assert "CF-084" in str(exc)


def test_duplicate_scenario_id_raises_selection_error(tmp_path) -> None:
    scenario_ids = list(MODULE.TARGET_SCENARIO_IDS)
    registry_path = tmp_path / "registry.json"
    scenarios = [
        {
            "scenarioId": scenario_ids[0],
            "title": "dup 1",
            "objective": "x",
            "workdir": ".",
            "command": _packet_command(scenario_ids[0]),
        },
        {
            "scenarioId": scenario_ids[0],
            "title": "dup 2",
            "objective": "x",
            "workdir": ".",
            "command": _packet_command(scenario_ids[0]),
        },
    ] + [
        {
            "scenarioId": sid,
            "title": f"Fake scenario {sid}",
            "objective": "x",
            "workdir": ".",
            "command": _packet_command(sid),
        }
        for sid in scenario_ids[1:]
    ]
    registry_path.write_text(json.dumps({"scenarios": scenarios}), encoding="utf-8")
    try:
        MODULE.load_target_scenarios(registry_path)
        assert False, "expected ScenarioSelectionError"
    except MODULE.ScenarioSelectionError as exc:
        assert "DUPLICATE_SCENARIO_ID" in str(exc)


def test_command_not_routed_through_packet_runner_raises_selection_error(tmp_path) -> None:
    scenario_ids = list(MODULE.TARGET_SCENARIO_IDS)
    override = {scenario_ids[0]: ["python", "scripts/some_other_runner.py"]}
    registry_path = _write_registry(tmp_path, scenario_ids, override)
    try:
        MODULE.load_target_scenarios(registry_path)
        assert False, "expected ScenarioSelectionError"
    except MODULE.ScenarioSelectionError as exc:
        assert "COMMAND_PREFIX_MISMATCH" in str(exc)


def test_command_gate_not_named_check_raises_selection_error(tmp_path) -> None:
    scenario_ids = list(MODULE.TARGET_SCENARIO_IDS)
    override = {
        scenario_ids[0]: [
            "python",
            "scripts/run_cvf_packet_posture_gate_conformance.py",
            "--gate",
            "governance/compat/not_a_checker.py",
        ]
    }
    registry_path = _write_registry(tmp_path, scenario_ids, override)
    try:
        MODULE.load_target_scenarios(registry_path)
        assert False, "expected ScenarioSelectionError"
    except MODULE.ScenarioSelectionError as exc:
        assert "COMMAND_GATE_MISMATCH" in str(exc)


def test_command_preserved_byte_equivalent_from_registry(tmp_path) -> None:
    scenario_ids = list(MODULE.TARGET_SCENARIO_IDS)
    registry_path = _write_registry(tmp_path, scenario_ids)
    scenarios = MODULE.load_target_scenarios(registry_path)
    for scenario_id, scenario in zip(scenario_ids, scenarios):
        assert scenario.command == _packet_command(scenario_id)


def test_run_proof_bootstrap_failure_skips_all_scenarios_and_fails_closed(monkeypatch) -> None:
    scenarios = [
        MODULE.Scenario(scenario_id=sid, title=f"t-{sid}", command=_packet_command(sid), workdir=MODULE.REPO_ROOT)
        for sid in MODULE.TARGET_SCENARIO_IDS
    ]

    def fake_run_command(command, workdir, env_overrides=None):
        if command == MODULE.BOOTSTRAP_COMMAND:
            return 1, "bootstrap failed", 0.1
        raise AssertionError("scenario command must not run when bootstrap fails")

    monkeypatch.setattr(MODULE, "run_command", fake_run_command)
    receipt = MODULE.run_proof(scenarios)
    assert receipt["bootstrapResult"]["result"] == "FAIL"
    assert receipt["overallResult"] == "FAIL"
    assert receipt["scenarioDenominator"] == 9
    assert all(event["result"] == "SKIPPED_BOOTSTRAP_FAILED" for event in receipt["scenarioEvents"])
    assert receipt["passCount"] == 0


def test_run_proof_all_nine_pass_yields_pass_denominator_nine(monkeypatch) -> None:
    scenarios = [
        MODULE.Scenario(scenario_id=sid, title=f"t-{sid}", command=_packet_command(sid), workdir=MODULE.REPO_ROOT)
        for sid in MODULE.TARGET_SCENARIO_IDS
    ]

    def fake_run_command(command, workdir, env_overrides=None):
        if command == MODULE.BOOTSTRAP_COMMAND:
            return 0, "bootstrap ok", 0.2
        return 0, "scenario ok", 0.3

    monkeypatch.setattr(MODULE, "run_command", fake_run_command)
    receipt = MODULE.run_proof(scenarios)
    assert receipt["overallResult"] == "PASS"
    assert receipt["scenarioDenominator"] == 9
    assert receipt["passCount"] == 9
    assert receipt["proofRunInvocationCount"] == 1
    assert len(receipt["scenarioEvents"]) == 9


def test_run_proof_partial_denominator_failure_stays_honest(monkeypatch) -> None:
    scenarios = [
        MODULE.Scenario(scenario_id=sid, title=f"t-{sid}", command=_packet_command(sid), workdir=MODULE.REPO_ROOT)
        for sid in MODULE.TARGET_SCENARIO_IDS
    ]

    call_count = {"n": 0}

    def fake_run_command(command, workdir, env_overrides=None):
        if command == MODULE.BOOTSTRAP_COMMAND:
            return 0, "bootstrap ok", 0.2
        call_count["n"] += 1
        if call_count["n"] == 3:
            return 1, "scenario failed", 0.1
        return 0, "scenario ok", 0.3

    monkeypatch.setattr(MODULE, "run_command", fake_run_command)
    receipt = MODULE.run_proof(scenarios)
    assert receipt["overallResult"] == "FAIL"
    assert receipt["scenarioDenominator"] == 9
    assert receipt["passCount"] == 8
    assert any(event["result"] == "FAIL" for event in receipt["scenarioEvents"])


def test_json_receipt_and_diagnostic_are_secret_free(monkeypatch, tmp_path) -> None:
    scenario_ids = list(MODULE.TARGET_SCENARIO_IDS)
    registry_path = _write_registry(tmp_path, scenario_ids)
    monkeypatch.setattr(MODULE, "SCENARIO_REGISTRY", registry_path)

    def fake_run_command(command, workdir, env_overrides=None):
        return 0, "ok", 0.1

    monkeypatch.setattr(MODULE, "run_command", fake_run_command)

    json_output = tmp_path / "receipt.json"
    diagnostic_output = tmp_path / "diagnostic.json"
    exit_code = MODULE.main(
        [
            "--json-output",
            str(json_output),
            "--diagnostic-output",
            str(diagnostic_output),
        ]
    )
    assert exit_code == 0
    receipt = json.loads(json_output.read_text(encoding="utf-8"))
    assert receipt["scenarioDenominator"] == 9
    assert receipt["overallResult"] == "PASS"
    assert receipt["proofRunInvocationCount"] == 1
    diagnostic = json.loads(diagnostic_output.read_text(encoding="utf-8"))
    assert diagnostic is None

    raw_text = json_output.read_text(encoding="utf-8").lower()
    assert "api_key" not in raw_text
    assert "secret" not in raw_text
    assert "bearer" not in raw_text
    assert "token" not in raw_text
