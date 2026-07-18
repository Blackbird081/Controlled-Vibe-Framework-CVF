from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from check_plcs_companion_routing_block import (  # noqa: E402
    ROUTING_MATRIX_ANCHOR,
    is_in_scope_work_order,
    parse_block_fields,
    validate_text,
)


VALID_C01 = f"""# CVF Agent Work Order - FPC-T2-C01

Status: DISPATCH_READY

Mission: implement FPC-T2 C01 ADD_INTERLOCK_ENTRY registry-edit work order.

## PLCS Companion Routing Block

plcs_routing_row: C01 Control Plane hook-chain-to-learning-intake
plcs_routing_disposition: ADD_INTERLOCK_ENTRY
cclv_disposition: CENTRAL_FACTS_REQUIRED
parallel_lane_risk: medium: hook-chain output can become checker-local without learning-intake routing evidence
plcs_cross_reference: {ROUTING_MATRIX_ANCHOR}
registry_edit_boundary: routing evidence boundary only before registry mutation
c05_boundary: DEFERRED_PENDING_FPC_T3_C01
"""


def test_unrelated_prfc_checker_work_order_is_exempt() -> None:
    text = """# PRFC-T3 checker

Status: DISPATCH_READY

This mentions future FPC-T2 C01-C04 registry-edit work orders but does not
dispatch an interlock registry edit.
"""
    assert not is_in_scope_work_order("docs/work_orders/CVF_AGENT_WORK_ORDER_PRFC_T3.md", text)
    assert validate_text("docs/work_orders/CVF_AGENT_WORK_ORDER_PRFC_T3.md", text) == []


def test_missing_block_fails_for_in_scope_c01() -> None:
    text = """# FPC-T2-C01

Status: DISPATCH_READY

Implement FPC-T2 C01 ADD_INTERLOCK_ENTRY registry-edit work order.
"""
    violations = validate_text("docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_T2_C01.md", text)
    assert any("PLCS Companion Routing Block" in violation for violation in violations)


def test_incomplete_block_reports_required_fields() -> None:
    text = """# FPC-T2-C02

Status: DISPATCH_READY

Implement FPC-T2 C02 ADD_INTERLOCK_ENTRY registry-edit work order.

## PLCS Companion Routing Block

plcs_routing_row: C02 Memory-to-Learning signal interlock
"""
    violations = validate_text("docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_T2_C02.md", text)
    assert any("cclv_disposition" in violation for violation in violations)
    assert any("c05_boundary" in violation for violation in violations)


def test_valid_c01_block_passes() -> None:
    assert validate_text("docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_T2_C01.md", VALID_C01) == []


def test_valid_c03_requires_local_view_medium_risk() -> None:
    text = f"""# CVF Agent Work Order - FPC-T2-C03

Status: DISPATCH_READY

Mission: implement FPC-T2 C03 ADD_INTERLOCK_ENTRY registry-edit work order.

## PLCS Companion Routing Block

plcs_routing_row: C03 Memory-to-Retrieval signal interlock
plcs_routing_disposition: ADD_INTERLOCK_ENTRY
cclv_disposition: LOCAL_VIEW_REQUIRED
parallel_lane_risk: medium: retrieval evidence remains local
plcs_cross_reference: {ROUTING_MATRIX_ANCHOR}
registry_edit_boundary: routing evidence boundary only before registry mutation
c05_boundary: DEFERRED_PENDING_FPC_T3_C01
"""
    assert validate_text("docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_T2_C03.md", text) == []


def test_wrong_candidate_defaults_fail() -> None:
    text = VALID_C01.replace("CENTRAL_FACTS_REQUIRED", "LOCAL_VIEW_REQUIRED")
    violations = validate_text("docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_T2_C01.md", text)
    assert any("CENTRAL_FACTS_REQUIRED" in violation for violation in violations)


def test_c05_boundary_must_remain_deferred() -> None:
    text = VALID_C01.replace("DEFERRED_PENDING_FPC_T3_C01", "READY")
    violations = validate_text("docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_T2_C01.md", text)
    assert any("DEFERRED_PENDING_FPC_T3_C01" in violation for violation in violations)


def test_table_format_is_supported() -> None:
    block = f"""
| Field | Disposition |
|---|---|
| plcs_routing_row | C04 DIR/DICE-to-downstream-adapter eligibility interlock |
| plcs_routing_disposition | ADD_INTERLOCK_ENTRY |
| cclv_disposition | CENTRAL_FACTS_REQUIRED |
| parallel_lane_risk | high: downstream adapter work requires separate authorization |
| plcs_cross_reference | {ROUTING_MATRIX_ANCHOR} |
| registry_edit_boundary | routing evidence boundary only |
| c05_boundary | DEFERRED_PENDING_FPC_T3_C01 |
"""
    fields = parse_block_fields(block)
    assert fields["plcs_routing_row"].startswith("C04")
    assert fields["c05_boundary"] == "DEFERRED_PENDING_FPC_T3_C01"
