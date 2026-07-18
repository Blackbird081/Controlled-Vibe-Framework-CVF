#!/usr/bin/env python3
"""
CVF Local Governance Hook Chain

Runs the standard local governance checks used by Git hooks in one place so
the hook files stay small and output remains consistent.

GC-032 marker: governance/compat/check_governed_artifact_authoring.py is
enforced through governance/compat/local_governance_hook_catalog_pre_push.py.

GC-020 marker: governance/compat/check_agent_handoff_guard_compat.py is
enforced through governance/compat/local_governance_hook_catalog_pre_push.py.

Compatibility marker block for self-checking guards:
- governance/compat/check_agent_handoff_guard_compat.py
- governance/compat/check_boardroom_runtime_governance_compat.py
- governance/compat/check_extension_package_check.py
- governance/compat/check_fast_lane_governance_compat.py
- governance/compat/check_governed_artifact_authoring.py
- governance/compat/check_knowledge_absorption_priority_compat.py
- governance/compat/check_markdown_structural_completeness.py
- governance/compat/check_memory_governance_compat.py
- governance/compat/check_multi_agent_review_governance_compat.py
- governance/compat/check_product_value_validation_guard_compat.py
- governance/compat/check_progress_tracker_sync.py
- governance/compat/check_session_governance_bootstrap.py
- governance/compat/check_template_skill_standard_guard_compat.py

Pre-push catalog marker coverage:
- governance/compat/check_absorption_blindspot_control_presence.py
- governance/compat/check_active_archive_hygiene.py
- governance/compat/check_active_session_state.py
- governance/compat/check_active_window_registry.py
- governance/compat/check_agent_handoff_boundary.py
- governance/compat/check_agent_operation_trace.py
- governance/compat/check_agent_packet_authority_and_encoding.py
- governance/compat/check_agent_workspace_design.py
- governance/compat/check_agent_workspace_runtime_boundary.py
- governance/compat/check_agent_workspace_skeleton.py
- governance/compat/check_agent_workspace_state.py
- governance/compat/check_assf_certified_metadata_admission.py
- governance/compat/check_audit_retention_registry.py
- governance/compat/check_baseline_update_compat.py
- governance/compat/check_batch_contract_determinism.py
- governance/compat/check_bug_doc_compat.py
- governance/compat/check_canon_summary_evidence_separation.py
- governance/compat/check_closure_packaging_preflight.py
- governance/compat/check_conformance_trace_rotation.py
- governance/compat/check_continuation_chain.py
- governance/compat/check_core_guard_self_protection.py
- governance/compat/check_corpus_completeness_report_integrity.py
- governance/compat/check_corpus_intelligence_classification.py
- governance/compat/check_corpus_packet_disposition_canonical.py
- governance/compat/check_corpus_packet_normalized_path.py
- governance/compat/check_corpus_packet_source_hash.py
- governance/compat/check_corpus_to_knowledge_map_reconciliation.py
- governance/compat/check_cpf_batch_helper_adoption.py
- governance/compat/check_cpf_public_surface_maintainability.py
- governance/compat/check_delta_execution_claim_boundary.py
- governance/compat/check_delta_mutating_profile_boundary.py
- governance/compat/check_depth_audit_continuation_compat.py
- governance/compat/check_docs_governance_compat.py
- governance/compat/check_erh_ci_public_evaluation_workflow.py
- governance/compat/check_erh_public_surface_drift_workflow.py
- governance/compat/check_execute_route_step_sequence.py
- governance/compat/check_external_absorption_core.py
- governance/compat/check_external_absorption_value_conversion.py
- governance/compat/check_external_agent_absorption_table.py
- governance/compat/check_external_knowledge_intake_routing.py
- governance/compat/check_finding_to_governance_learning.py
- governance/compat/check_foundation_storage_layout.py
- governance/compat/check_foundational_guard_surfaces.py
- governance/compat/check_gc018_stop_boundary_semantics.py
- governance/compat/check_governed_file_size.py
- governance/compat/check_governed_pack_contract.py
- governance/compat/check_guard_authoring_standard.py
- governance/compat/check_guard_contract_compat.py
- governance/compat/check_guard_registry.py
- governance/compat/check_incremental_test_log_rotation.py
- governance/compat/check_machine_closure_package.py
- governance/compat/check_multi_provider_execution_log.py
- governance/compat/check_next_move_freshness.py
- governance/compat/check_plcs_companion_routing_block.py
- governance/compat/check_prepublic_p3_readiness.py
- governance/compat/check_public_doc_drift_phrases.py
- governance/compat/check_public_export_disposition.py
- governance/compat/check_python_automation_size.py
- governance/compat/check_repository_exposure_classification.py
- governance/compat/check_repository_lifecycle_classification.py
- governance/compat/check_rescan_intelligence_hardening.py
- governance/compat/check_review_retention_registry.py
- governance/compat/check_roadmap_closure_freshness.py
- governance/compat/check_surface_scan_registry.py
- governance/compat/check_system_loop_interlock.py
- governance/compat/check_test_doc_compat.py
- governance/compat/check_test_partition_ownership.py
- governance/compat/check_work_order_dispatch_quality.py
- governance/compat/check_worker_experience_retrospective.py

Default mode: pre-push
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
import subprocess
import sys
import time
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

try:
    from local_governance_hook_catalog import HOOK_CHAINS, PARALLEL_BY_DEFAULT_HOOKS
except ModuleNotFoundError:  # imported as governance.compat.run_local_governance_hook_chain
    from governance.compat.local_governance_hook_catalog import (
        HOOK_CHAINS,
        PARALLEL_BY_DEFAULT_HOOKS,
    )

@dataclass(frozen=True)
class StepResult:
    index: int
    label: str
    command: list[str]
    returncode: int
    duration_s: float
    stdout: str
    stderr: str


def _run_step(label: str, command: list[str], index: int | None = None, total: int | None = None) -> int:
    prefix = f"[{index}/{total}] " if index is not None and total is not None else ""
    print(f"[CVF hook] Enforcing {prefix}{label}...", flush=True)
    proc = subprocess.run(command, cwd=REPO_ROOT)
    return proc.returncode


def _run_step_captured(index: int, total: int, label: str, command: list[str]) -> StepResult:
    started_at = time.perf_counter()
    print(f"[CVF hook] START [{index}/{total}] {label}", flush=True)
    proc = subprocess.run(
        command,
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    duration_s = time.perf_counter() - started_at
    return StepResult(
        index=index,
        label=label,
        command=command,
        returncode=proc.returncode,
        duration_s=duration_s,
        stdout=proc.stdout,
        stderr=proc.stderr,
    )


def _print_step_output(result: StepResult, *, show_success_output: bool) -> None:
    should_print = result.returncode != 0 or show_success_output
    if result.stdout and should_print:
        print(result.stdout.rstrip(), flush=True)
    if result.stderr and should_print:
        print(result.stderr.rstrip(), file=sys.stderr, flush=True)


def _run_parallel_chain(
    chain: list[tuple[str, list[str]]],
    *,
    max_workers: int,
    show_success_output: bool,
) -> int:
    total = len(chain)
    worker_count = max(1, min(max_workers, total))
    print(
        f"[CVF hook] Parallel preflight enabled: {total} checks, max_workers={worker_count}.",
        flush=True,
    )
    failures: list[StepResult] = []
    completed = 0

    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        futures = [
            executor.submit(_run_step_captured, index, total, label, command)
            for index, (label, command) in enumerate(chain, start=1)
        ]
        for future in as_completed(futures):
            result = future.result()
            completed += 1
            status = "PASS" if result.returncode == 0 else "FAIL"
            print(
                f"[CVF hook] {status} [{completed}/{total}] {result.label} "
                f"({result.duration_s:.2f}s)",
                flush=True,
            )
            _print_step_output(result, show_success_output=show_success_output)
            if result.returncode != 0:
                failures.append(result)

    if failures:
        print("[CVF hook] Parallel preflight failures:", file=sys.stderr, flush=True)
        for result in sorted(failures, key=lambda item: item.index):
            print(
                f"  - [{result.index}/{total}] {result.label} exited {result.returncode}",
                file=sys.stderr,
                flush=True,
            )
        return failures[0].returncode

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the CVF local governance hook chain")
    parser.add_argument(
        "--hook",
        default="pre-push",
        choices=sorted(HOOK_CHAINS.keys()),
        help="Hook chain to run",
    )
    parser.add_argument(
        "--parallel",
        action="store_true",
        help="Run the selected hook chain in parallel for local preflight visibility.",
    )
    parser.add_argument(
        "--serial",
        action="store_true",
        help="Force sequential execution even when the selected hook defaults to parallel.",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=6,
        help="Maximum parallel checks when --parallel is set.",
    )
    parser.add_argument(
        "--show-success-output",
        action="store_true",
        help="Print stdout/stderr for passing checks in --parallel mode.",
    )
    args = parser.parse_args()

    chain = HOOK_CHAINS[args.hook]
    use_parallel = (args.parallel or args.hook in PARALLEL_BY_DEFAULT_HOOKS) and not args.serial
    if use_parallel:
        code = _run_parallel_chain(
            chain,
            max_workers=args.max_workers,
            show_success_output=args.show_success_output,
        )
        if code != 0:
            return code
    else:
        total = len(chain)
        for index, (label, command) in enumerate(chain, start=1):
            code = _run_step(label, command, index, total)
            if code != 0:
                print(f"[CVF hook] FAILED at: {label}", file=sys.stderr, flush=True)
                return code

    print(f"[CVF hook] All {args.hook} governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
