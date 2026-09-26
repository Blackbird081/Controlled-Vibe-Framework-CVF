from __future__ import annotations

import importlib.util
import subprocess
import sys
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("check_gate_to_role_closeability.py")
SPEC = importlib.util.spec_from_file_location("check_gate_to_role_closeability", MODULE_PATH)
checker = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = checker
SPEC.loader.exec_module(checker)

CATALOG_PATH = Path(__file__).with_name("agent_autorun_command_catalog.py")
CATALOG_SPEC = importlib.util.spec_from_file_location("agent_autorun_command_catalog_closeability_test", CATALOG_PATH)
catalog = importlib.util.module_from_spec(CATALOG_SPEC)
assert CATALOG_SPEC and CATALOG_SPEC.loader
sys.modules[CATALOG_SPEC.name] = catalog
CATALOG_SPEC.loader.exec_module(catalog)


def contract(rows: str, *, policy: str = "BOUNDED_PATH_FAMILIES", split: str = "COVERED_BY_BOUNDED_PATH_FAMILY") -> str:
    return f"""Status: DISPATCH_READY
## Gate-To-Role Closeability Contract

closeabilityContractVersion: cvf.gate-role-closeability@1.0.0
closeabilityDisposition: CLOSEABLE
implementationTopologyPolicy: {policy}
foreseeableFileSplitDisposition: {split}
returnTimeRecheck: REQUIRED_BEFORE_REPAIR

| gateId | mustPassBy | repairOwner | repairPhase | mutationSurface | topology | commitOwner | commitPhase | dependsOn |
|---|---|---|---|---|---|---|---|---|
{rows}
"""


def valid_rows() -> str:
    ids = [
        ("authorization_review", "PRE_DISPATCH", "NONE"),
        ("pre_dispatch_gate", "PRE_DISPATCH", "authorization_review"),
        ("dispatch_continuity", "IMPLEMENTATION", "pre_dispatch_gate"),
        ("focused_checker_tests", "WORKER_RETURN", "dispatch_continuity"),
        ("adif_integrity", "WORKER_RETURN", "focused_checker_tests"),
        ("pre_implementation_autorun", "WORKER_RETURN", "adif_integrity"),
        ("worker_return_fast", "REVIEW", "pre_implementation_autorun"),
        ("reviewer_fast", "PRE_MATERIAL_COMMIT", "worker_return_fast"),
        ("pre_commit", "PRE_MATERIAL_COMMIT", "reviewer_fast"),
        ("terminal_completion_review", "PRE_MATERIAL_COMMIT", "pre_commit"),
        ("continuity", "CONTINUITY_COMMIT", "terminal_completion_review"),
        ("committed_range_closure", "POST_MATERIAL_CLOSURE", "continuity"),
    ]
    rows = []
    for gate, deadline, dep in ids:
        repair_owner = "owner"
        mutation_surface = "paths"
        commit_owner = "closer"
        commit_phase = "CONTINUITY_COMMIT" if gate == "continuity" else "MATERIAL_COMMIT"
        if gate == "dispatch_continuity":
            repair_owner = "session-sync-steward"
            mutation_surface = "AGENT_HANDOFF_V60_2026-09-08.md material-SHA marker"
            commit_owner = "session-sync-steward"
            commit_phase = "DISPATCH_CONTINUITY_COMMIT"
        if gate == "continuity":
            repair_owner = "session-sync-steward"
            commit_owner = "session-sync-steward"
        rows.append(
            f"| {gate} | {deadline} | {repair_owner} | {deadline} | {mutation_surface} | "
            f"EXACT_PATHS | {commit_owner} | {commit_phase} | {dep} |"
        )
    return "\n".join(rows)


def codes(text: str) -> set[str]:
    return {item.code for item in checker.check_work_order("docs/work_orders/x.md", text)}


def test_valid_contract_passes() -> None:
    assert codes(contract(valid_rows())) == set()


def test_missing_contract_fails() -> None:
    assert "contract_missing" in codes("Status: DISPATCH_READY\n")


def test_missing_mandatory_gate_fails() -> None:
    rows = valid_rows().replace(next(line for line in valid_rows().splitlines() if "| pre_commit |" in line) + "\n", "")
    assert "mandatory_gates_missing" in codes(contract(rows))


def test_missing_dispatch_continuity_fails() -> None:
    rows = valid_rows().replace(
        next(line for line in valid_rows().splitlines() if "| dispatch_continuity |" in line) + "\n",
        "",
    )
    assert "mandatory_gates_missing" in codes(contract(rows))


def test_dispatch_continuity_cannot_be_bypassed() -> None:
    rows = valid_rows().replace(
        "| focused_checker_tests | WORKER_RETURN | owner | WORKER_RETURN | paths | EXACT_PATHS | closer | MATERIAL_COMMIT | dispatch_continuity |",
        "| focused_checker_tests | WORKER_RETURN | owner | WORKER_RETURN | paths | EXACT_PATHS | closer | MATERIAL_COMMIT | pre_dispatch_gate |",
    )
    assert "dispatch_continuity_bypassed" in codes(contract(rows))


def test_dispatch_continuity_requires_exact_commit_route() -> None:
    rows = valid_rows().replace("| DISPATCH_CONTINUITY_COMMIT |", "| MATERIAL_COMMIT |")
    assert "dispatch_continuity_invalid" in codes(contract(rows))


def test_post_material_closure_cannot_precede_continuity() -> None:
    rows = valid_rows().replace(
        "| committed_range_closure | POST_MATERIAL_CLOSURE | owner | POST_MATERIAL_CLOSURE | paths | EXACT_PATHS | closer | MATERIAL_COMMIT | continuity |",
        "| committed_range_closure | POST_MATERIAL_CLOSURE | owner | POST_MATERIAL_CLOSURE | paths | EXACT_PATHS | closer | MATERIAL_COMMIT | terminal_completion_review |",
    ).replace(
        "| continuity | CONTINUITY_COMMIT | session-sync-steward | CONTINUITY_COMMIT | paths | EXACT_PATHS | session-sync-steward | CONTINUITY_COMMIT | terminal_completion_review |",
        "| continuity | CONTINUITY_COMMIT | session-sync-steward | CONTINUITY_COMMIT | paths | EXACT_PATHS | session-sync-steward | CONTINUITY_COMMIT | committed_range_closure |",
    )
    result = codes(contract(rows))
    assert "terminal_continuity_invalid" in result
    assert "post_material_continuity_bypassed" in result


def test_late_repair_phase_fails() -> None:
    rows = valid_rows().replace("| pre_dispatch_gate | PRE_DISPATCH | owner | PRE_DISPATCH |", "| pre_dispatch_gate | PRE_DISPATCH | owner | REVIEW |")
    assert "late_repair_owner" in codes(contract(rows))


def test_missing_mutation_owner_fails() -> None:
    rows = valid_rows().replace("| focused_checker_tests | WORKER_RETURN | owner |", "| focused_checker_tests | WORKER_RETURN | NONE |")
    assert "owner_surface_missing" in codes(contract(rows))


def test_unknown_dependency_fails() -> None:
    rows = valid_rows().replace(
        "| continuity | CONTINUITY_COMMIT | session-sync-steward | CONTINUITY_COMMIT | paths | EXACT_PATHS | session-sync-steward | CONTINUITY_COMMIT | terminal_completion_review |",
        "| continuity | CONTINUITY_COMMIT | session-sync-steward | CONTINUITY_COMMIT | paths | EXACT_PATHS | session-sync-steward | CONTINUITY_COMMIT | missing_gate |",
    )
    assert "dependency_unknown" in codes(contract(rows))


def test_dependency_cycle_fails() -> None:
    rows = valid_rows().replace("| authorization_review | PRE_DISPATCH | owner | PRE_DISPATCH | paths | EXACT_PATHS | closer | MATERIAL_COMMIT | NONE |", "| authorization_review | PRE_DISPATCH | owner | PRE_DISPATCH | paths | EXACT_PATHS | closer | MATERIAL_COMMIT | continuity |")
    assert "dependency_cycle" in codes(contract(rows))


def test_topology_policy_pair_must_agree() -> None:
    assert "topology_policy_invalid" in codes(contract(valid_rows(), policy="EXACT_PATHS_WITH_NO_FORESEEABLE_SPLIT"))


def recheck(
    disposition: str,
    blockers: str,
    route: str,
    redispatch: str,
    *,
    status: str = "COMPLETE_PENDING_REVIEW",
) -> str:
    return f"""Status: {status}
Self-declared worker-return artifact: yes
## Return-Time Closeability Recheck

closeabilityDisposition: {disposition}
outsideAuthorityBlockers: {blockers}
nextRepairRoute: {route}
workerRedispatchAllowed: {redispatch}
"""


def recheck_codes(text: str) -> set[str]:
    return {item.code for item in checker.check_recheck("docs/reviews/x.md", text)}


def test_closeable_return_passes() -> None:
    assert not recheck_codes(recheck("CLOSEABLE", "NONE", "NO_REPAIR_REQUIRED", "NO"))


def test_contradictory_return_blocks_redispatch() -> None:
    assert "contradictory_redispatch" in recheck_codes(recheck("UNCLOSEABLE_PACKET_CONTRADICTION", "F1", "CONSOLIDATED_ORCHESTRATOR_AMENDMENT", "YES", status="BLOCKED_WITH_REASON"))


def test_contradiction_requires_named_blocker() -> None:
    assert "contradiction_without_blocker" in recheck_codes(recheck("UNCLOSEABLE_PACKET_CONTRADICTION", "NONE", "OPERATOR_ESCALATION", "NO", status="BLOCKED_WITH_REASON"))


def test_complete_pending_review_cannot_be_uncloseable() -> None:
    result = recheck_codes(
        recheck("UNCLOSEABLE_PACKET_CONTRADICTION", "F1", "OPERATOR_ESCALATION", "NO")
    )
    assert "uncloseable_status_mismatch" in result
    assert "complete_status_not_closeable" in result


def test_complete_pending_review_rejects_nonmatching_manifest_delta() -> None:
    text = recheck("CLOSEABLE", "NONE", "NO_REPAIR_REQUIRED", "NO") + """
## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Manifest delta | two paths outside the manifest |
"""
    assert "complete_status_manifest_delta" in recheck_codes(text)


def test_complete_pending_review_rejects_disclosed_required_gate_failure() -> None:
    text = recheck("CLOSEABLE", "NONE", "NO_REPAIR_REQUIRED", "NO") + """
### Known Machine-Gate Limitation - run_worker_return_fast_gate.py Cannot Execute A TypeScript Test

The required gate failed because the target runner was incompatible.
"""
    assert "complete_status_required_gate_failed" in recheck_codes(text)


def test_blocked_return_with_named_contradiction_passes() -> None:
    assert not recheck_codes(
        recheck(
            "UNCLOSEABLE_PACKET_CONTRADICTION",
            "F1",
            "CONSOLIDATED_ORCHESTRATOR_AMENDMENT",
            "NO",
            status="BLOCKED_WITH_REASON",
        )
    )


def test_common_autorun_catalog_contains_closeability_guard() -> None:
    commands = catalog._common_commands("BASE", "HEAD")
    selected = [command for command in commands if command.name == "gate-to-role closeability"]
    assert len(selected) == 1
    assert "governance/compat/check_gate_to_role_closeability.py" in selected[0].command


def test_changed_paths_can_target_a_downstream_repository(tmp_path: Path) -> None:
    repo = tmp_path / "downstream"
    repo.mkdir()
    subprocess.run(["git", "init", "-q"], cwd=repo, check=True)
    subprocess.run(["git", "config", "user.email", "cvf-test@example.invalid"], cwd=repo, check=True)
    subprocess.run(["git", "config", "user.name", "CVF Test"], cwd=repo, check=True)
    tracked = repo / "README.md"
    tracked.write_text("baseline\n", encoding="utf-8")
    subprocess.run(["git", "add", "README.md"], cwd=repo, check=True)
    subprocess.run(["git", "commit", "-q", "-m", "baseline"], cwd=repo, check=True)
    tracked.write_text("changed\n", encoding="utf-8")

    assert checker.changed_paths("HEAD", "HEAD", repo) == ("README.md",)
