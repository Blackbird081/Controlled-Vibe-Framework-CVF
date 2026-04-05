#!/usr/bin/env python3
"""
CVF Local Governance Hook Chain

Runs the standard local governance checks used by Git hooks in one place so
the hook files stay small and output remains consistent.

Default mode: pre-push
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

HOOK_CHAINS: dict[str, list[tuple[str, list[str]]]] = {
    "pre-commit": [
        (
            "governed file size compatibility",
            ["python", "governance/compat/check_governed_file_size.py", "--enforce"],
        ),
        (
            "governed exception registry integrity",
            ["python", "governance/compat/check_governed_exception_registry.py", "--enforce"],
        ),
        (
            "docs governance compatibility",
            ["python", "governance/compat/check_docs_governance_compat.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
    ],
    "pre-push": [
        (
            "docs governance compatibility",
            ["python", "governance/compat/check_docs_governance_compat.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "governed artifact authoring compatibility",
            ["python", "governance/compat/check_governed_artifact_authoring.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "cpf public surface maintainability",
            ["python", "governance/compat/check_cpf_public_surface_maintainability.py", "--enforce"],
        ),
        (
            "cpf shared batch helper adoption",
            ["python", "governance/compat/check_cpf_batch_helper_adoption.py", "--enforce"],
        ),
        (
            "batch contract determinism",
            ["python", "governance/compat/check_batch_contract_determinism.py", "--enforce"],
        ),
        (
            "canon summary evidence separation",
            ["python", "governance/compat/check_canon_summary_evidence_separation.py", "--enforce"],
        ),
        (
            "bug documentation compatibility",
            ["python", "governance/compat/check_bug_doc_compat.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "test documentation compatibility",
            ["python", "governance/compat/check_test_doc_compat.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "incremental test log rotation compatibility",
            ["python", "governance/compat/check_incremental_test_log_rotation.py", "--enforce"],
        ),
        (
            "baseline update compatibility",
            ["python", "governance/compat/check_baseline_update_compat.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "agent handoff guard compatibility",
            ["python", "governance/compat/check_agent_handoff_guard_compat.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "session governance bootstrap compatibility",
            ["python", "governance/compat/check_session_governance_bootstrap.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "progress tracker sync compatibility",
            ["python", "governance/compat/check_progress_tracker_sync.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "surface scan continuity compatibility",
            ["python", "governance/compat/check_surface_scan_registry.py", "--enforce"],
        ),
        (
            "multi-agent review governance compatibility",
            ["python", "governance/compat/check_multi_agent_review_governance_compat.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "boardroom runtime governance compatibility",
            ["python", "governance/compat/check_boardroom_runtime_governance_compat.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "extension package check compatibility",
            ["python", "governance/compat/check_extension_package_check.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "fast-lane governance compatibility",
            ["python", "governance/compat/check_fast_lane_governance_compat.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "memory governance compatibility",
            ["python", "governance/compat/check_memory_governance_compat.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "depth-audit continuation compatibility",
            ["python", "governance/compat/check_depth_audit_continuation_compat.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "gc-018 stop-boundary semantics compatibility",
            ["python", "governance/compat/check_gc018_stop_boundary_semantics.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "governed file size compatibility",
            ["python", "governance/compat/check_governed_file_size.py", "--enforce"],
        ),
        (
            "test partition ownership compatibility",
            ["python", "governance/compat/check_test_partition_ownership.py", "--enforce"],
        ),
        (
            "guard registry compatibility",
            ["python", "governance/compat/check_guard_registry.py", "--enforce"],
        ),
        (
            "guard authoring standard compatibility",
            ["python", "governance/compat/check_guard_authoring_standard.py", "--enforce"],
        ),
        (
            "active window registry compatibility",
            ["python", "governance/compat/check_active_window_registry.py", "--enforce"],
        ),
        (
            "audit retention registry compatibility",
            ["python", "governance/compat/check_audit_retention_registry.py", "--enforce"],
        ),
        (
            "review retention registry compatibility",
            ["python", "governance/compat/check_review_retention_registry.py", "--enforce"],
        ),
        (
            "foundational guard surfaces compatibility",
            ["python", "governance/compat/check_foundational_guard_surfaces.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "cross-channel guard contract compatibility",
            ["python", "governance/compat/check_guard_contract_compat.py", "--enforce"],
        ),
        (
            "conformance trace rotation compatibility",
            ["python", "governance/compat/check_conformance_trace_rotation.py", "--enforce"],
        ),
        (
            "repository lifecycle classification compatibility",
            ["python", "governance/compat/check_repository_lifecycle_classification.py", "--enforce"],
        ),
        (
            "repository exposure classification compatibility",
            ["python", "governance/compat/check_repository_exposure_classification.py", "--enforce"],
        ),
        (
            "pre-public p3 readiness compatibility",
            ["python", "governance/compat/check_prepublic_p3_readiness.py", "--enforce"],
        ),
    ]
}


def _run_step(label: str, command: list[str]) -> int:
    print(f"[CVF hook] Enforcing {label}...")
    proc = subprocess.run(command, cwd=REPO_ROOT)
    return proc.returncode


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the CVF local governance hook chain")
    parser.add_argument(
        "--hook",
        default="pre-push",
        choices=sorted(HOOK_CHAINS.keys()),
        help="Hook chain to run",
    )
    args = parser.parse_args()

    for label, command in HOOK_CHAINS[args.hook]:
        code = _run_step(label, command)
        if code != 0:
            print(f"[CVF hook] FAILED at: {label}", file=sys.stderr)
            return code

    print(f"[CVF hook] All {args.hook} governance checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
