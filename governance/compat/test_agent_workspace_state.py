import importlib.util
import json
from pathlib import Path


GENERATOR_PATH = Path(__file__).resolve().with_name("generate_agent_workspace_state.py")
GEN_SPEC = importlib.util.spec_from_file_location("generate_agent_workspace_state", GENERATOR_PATH)
GEN = importlib.util.module_from_spec(GEN_SPEC)
assert GEN_SPEC and GEN_SPEC.loader
GEN_SPEC.loader.exec_module(GEN)


def _write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def _valid_core() -> dict[str, object]:
    return {
        "schemaVersion": "0.1.0",
        "status": "ACTIVE_AGENT_WORKSPACE_STATE",
        "frontDoor": "docs/reference/agent_workspace/README.md",
        "designStandard": "docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md",
        "topologyContract": "docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md",
        "handoffContract": "docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md",
        "generatedBy": "governance/compat/generate_agent_workspace_state.py",
        "checker": "governance/compat/check_agent_workspace_state.py",
        "claimBoundary": "test boundary",
        "items": [],
    }


def _valid_item() -> dict[str, object]:
    return {
        "stateOrder": 1,
        "workspaceItemId": "test-item",
        "lane": "parked",
        "itemKind": "parked",
        "status": "PARKED_PENDING_OPERATOR_DECISION",
        "ownerRole": "operator",
        "route": "SINGLE_AGENT_MULTI_ROLE",
        "rolePattern": "operator_decision_to_future_dispatch",
        "phase": "parked",
        "baseHead": "abc1234",
        "changedSetScope": "N/A with reason: test",
        "traceScope": "N/A with reason: test",
        "commitOwner": "N/A with reason: test",
        "sourceWorkOrder": "docs/work_orders/test.md",
        "evidencePaths": ["docs/reference/agent_workspace/README.md"],
        "claimBoundary": "no runtime",
        "nextMoveImpact": "none",
        "resumeCondition": "operator decision",
        "supersedes": [],
        "archivePolicy": "test",
    }


def test_generate_aggregate_from_sources(tmp_path: Path) -> None:
    core = tmp_path / "state" / "ACTIVE_AGENT_WORKSPACE_STATE_CORE.json"
    items = tmp_path / "state" / "items"
    aggregate = tmp_path / "ACTIVE_AGENT_WORKSPACE_STATE.json"
    _write_json(core, _valid_core())
    _write_json(items / "test-item.json", _valid_item())

    GEN.generate_aggregate(aggregate, core, items)

    generated = json.loads(aggregate.read_text(encoding="utf-8"))
    assert generated["items"][0]["workspaceItemId"] == "test-item"
    assert "stateOrder" not in generated["items"][0]


def test_validate_detects_drift(tmp_path: Path) -> None:
    core = tmp_path / "state" / "ACTIVE_AGENT_WORKSPACE_STATE_CORE.json"
    items = tmp_path / "state" / "items"
    aggregate = tmp_path / "ACTIVE_AGENT_WORKSPACE_STATE.json"
    _write_json(core, _valid_core())
    _write_json(items / "test-item.json", _valid_item())
    _write_json(aggregate, {"schemaVersion": "0.1.0", "items": []})

    violations = GEN.validate_aggregate_matches_sources(aggregate, core, items)

    assert violations


def test_invalid_item_kind_fails(tmp_path: Path) -> None:
    core = tmp_path / "state" / "ACTIVE_AGENT_WORKSPACE_STATE_CORE.json"
    items = tmp_path / "state" / "items"
    _write_json(core, _valid_core())
    item = _valid_item()
    item["itemKind"] = "chat_log"
    _write_json(items / "test-item.json", item)

    try:
        GEN.load_source_state(core, items)
    except ValueError as exc:
        assert "itemKind" in str(exc)
    else:
        raise AssertionError("invalid itemKind should fail")


def test_invalid_lane_fails(tmp_path: Path) -> None:
    core = tmp_path / "state" / "ACTIVE_AGENT_WORKSPACE_STATE_CORE.json"
    items = tmp_path / "state" / "items"
    _write_json(core, _valid_core())
    item = _valid_item()
    item["lane"] = "chat_log"
    _write_json(items / "test-item.json", item)

    try:
        GEN.load_source_state(core, items)
    except ValueError as exc:
        assert "lane" in str(exc)
    else:
        raise AssertionError("invalid lane should fail")


def test_supersedes_must_be_list(tmp_path: Path) -> None:
    core = tmp_path / "state" / "ACTIVE_AGENT_WORKSPACE_STATE_CORE.json"
    items = tmp_path / "state" / "items"
    _write_json(core, _valid_core())
    item = _valid_item()
    item["supersedes"] = "old-item"
    _write_json(items / "test-item.json", item)

    try:
        GEN.load_source_state(core, items)
    except ValueError as exc:
        assert "supersedes" in str(exc)
    else:
        raise AssertionError("non-list supersedes should fail")
