import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_agent_workspace_design.py")
SPEC = importlib.util.spec_from_file_location("check_agent_workspace_design", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


VALID_CONTROL_BLOCK = """
## Agent Workspace Design Control Block

| Field | Disposition |
|---|---|
| Workspace purpose | machine-check workspace work-order pre-build boundary only |
| Contract source | `docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md` |
| Front door | `docs/reference/agent_workspace/README.md` |
| Design standard | `docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md` |
| Storage class | stable foundation file plus dated execution evidence |
| Handoff fields | CF-01 through CF-09 remain inherited from AHB-T2 |
| State ownership | no new runtime state file in this batch |
| Guard owner | `governance/compat/check_agent_workspace_design.py` |
| Build boundary | runtime source: no; provider proof: no; public-sync: no; registry edits: no |
"""


def _types(issues: list[dict[str, str]]) -> set[str]:
    return {issue["type"] for issue in issues}


def test_workspace_work_order_without_control_block_fails() -> None:
    text = """
# Work Order

Status: DISPATCH_READY

Scope: Design an agent-interaction workspace.
"""

    issues = MODULE._validate_work_order("docs/work_orders/CVF_AGENT_WORK_ORDER_AHB_TN2.md", text)

    assert "agent_workspace_design_control_block_missing" in _types(issues)


def test_valid_workspace_design_work_order_passes() -> None:
    text = f"""
# Work Order

Status: CLOSED_PASS_BOUNDED

Scope: Agent Workspace Design checker.

{VALID_CONTROL_BLOCK}
"""

    issues = MODULE._validate_work_order("docs/work_orders/CVF_AGENT_WORK_ORDER_AHB_TN2.md", text)

    assert not issues


def test_missing_required_field_fails() -> None:
    text = f"""
# Work Order

Status: DISPATCH_READY

Scope: workspace design.

{VALID_CONTROL_BLOCK.replace("| State ownership | no new runtime state file in this batch |", "")}
"""

    issues = MODULE._validate_work_order("docs/work_orders/CVF_AGENT_WORK_ORDER_AHB_TN2.md", text)

    assert "agent_workspace_design_field_missing" in _types(issues)


def test_build_boundary_must_name_all_high_risk_surfaces() -> None:
    text = f"""
# Work Order

Status: DISPATCH_READY

Scope: workspace build.

{VALID_CONTROL_BLOCK.replace("runtime source: no; provider proof: no; public-sync: no; registry edits: no", "runtime source: no")}
"""

    issues = MODULE._validate_work_order("docs/work_orders/CVF_AGENT_WORK_ORDER_AHB_TN2.md", text)

    assert "agent_workspace_build_boundary_incomplete" in _types(issues)


def test_non_workspace_work_order_is_ignored() -> None:
    text = """
# Work Order

Status: DISPATCH_READY

Scope: update a documentation note.
"""

    issues = MODULE._validate_work_order("docs/work_orders/CVF_AGENT_WORK_ORDER_NOTE.md", text)

    assert not issues


def test_standard_requires_machine_enforced_markers() -> None:
    text = """
# CVF Agent Interaction Workspace Design Standard

Status: ACTIVE_STANDARD
"""

    issues = MODULE._validate_standard(MODULE.STANDARD_PATH, text)

    assert "standard_marker_missing" in _types(issues)


def test_hook_binding_missing_marker_fails() -> None:
    issues = MODULE._validate_binding(MODULE.HOOK_CHAIN_PATH, "no workspace checker")

    assert "hook_binding_missing" in _types(issues)
