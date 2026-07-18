#!/usr/bin/env python3
"""Command catalog for CVF agent autorun workflow gates."""

from __future__ import annotations

from dataclasses import dataclass

@dataclass(frozen=True)
class GateCommand:
    name: str
    command: tuple[str, ...]


@dataclass(frozen=True)
class GateResult:
    index: int
    name: str
    command: tuple[str, ...]
    returncode: int
    duration_s: float
    output: str


@dataclass(frozen=True)
class GitStatusResult:
    returncode: int
    stdout: str
    stderr: str


RANGE_GATE_NAMES = (
    "docs governance compatibility",
    "markdown structural completeness",
    "governed artifact checker read-ahead",
    "work-order dispatch quality",
    "dispatch packet lifecycle hygiene",
    "source intake decision packet preflight",
)


def _range_command(name: str, script: str, base: str, head: str) -> GateCommand:
    return GateCommand(
        name,
        (
            "python",
            script,
            "--base",
            base,
            "--head",
            head,
            "--enforce",
        ),
    )


def _common_commands(base: str, head: str) -> tuple[GateCommand, ...]:
    return (
        GateCommand(
            "closure packaging preflight",
            ("python", "governance/compat/check_closure_packaging_preflight.py", "--base", base, "--head", head, "--enforce"),
        ),
        GateCommand(
            "core guard self-protection",
            ("python", "governance/compat/check_core_guard_self_protection.py", "--base", base, "--head", head, "--enforce"),
        ),
        _range_command(
            "docs governance compatibility",
            "governance/compat/check_docs_governance_compat.py",
            base,
            head,
        ),
        _range_command(
            "markdown structural completeness",
            "governance/compat/check_markdown_structural_completeness.py",
            base,
            head,
        ),
        _range_command(
            "governed artifact checker read-ahead",
            "governance/compat/check_governed_artifact_checker_read_ahead.py",
            base,
            head,
        ),
        _range_command(
            "work-order dispatch quality",
            "governance/compat/check_work_order_dispatch_quality.py",
            base,
            head,
        ),
        _range_command(
            "worker-return quality gate",
            "governance/compat/check_worker_return_quality_gate.py",
            base,
            head,
        ),
        _range_command(
            "ADIF defect registry disclosure",
            "governance/compat/check_adif_defect_registry_disclosure.py",
            base,
            head,
        ),
        _range_command(
            "dispatch packet lifecycle hygiene",
            "governance/compat/check_dispatch_packet_lifecycle_hygiene.py",
            base,
            head,
        ),
        _range_command(
            "source intake decision packet preflight",
            "governance/compat/check_source_intake_decision_packet_preflight.py",
            base,
            head,
        ),
        _range_command(
            "dispatch prompt envelope",
            "governance/compat/check_dispatch_prompt_envelope.py",
            base,
            head,
        ),
        _range_command(
            "PLCS companion routing block",
            "governance/compat/check_plcs_companion_routing_block.py",
            base,
            head,
        ),
        _range_command(
            "agent operation trace integrity",
            "governance/compat/check_agent_operation_trace.py",
            base,
            head,
        ),
        _range_command(
            "agent handoff boundary",
            "governance/compat/check_agent_handoff_boundary.py",
            base,
            head,
        ),
        _range_command(
            "agent workspace design boundary",
            "governance/compat/check_agent_workspace_design.py",
            base,
            head,
        ),
        _range_command(
            "agent workspace state",
            "governance/compat/check_agent_workspace_state.py",
            base,
            head,
        ),
        _range_command(
            "agent workspace skeleton",
            "governance/compat/check_agent_workspace_skeleton.py",
            base,
            head,
        ),
        _range_command(
            "agent workspace runtime boundary",
            "governance/compat/check_agent_workspace_runtime_boundary.py",
            base,
            head,
        ),
        _range_command(
            "machine closure package",
            "governance/compat/check_machine_closure_package.py",
            base,
            head,
        ),
        _range_command(
            "roadmap closure freshness",
            "governance/compat/check_roadmap_closure_freshness.py",
            base,
            head,
        ),
        _range_command(
            "multi-provider execution log quality",
            "governance/compat/check_multi_provider_execution_log.py",
            base,
            head,
        ),
        _range_command(
            "finding-to-governance learning quality",
            "governance/compat/check_finding_to_governance_learning.py",
            base,
            head,
        ),
        _range_command(
            "external-agent absorption table",
            "governance/compat/check_external_agent_absorption_table.py",
            base,
            head,
        ),
        _range_command(
            "external knowledge intake routing",
            "governance/compat/check_external_knowledge_intake_routing.py",
            base,
            head,
        ),
        _range_command(
            "external absorption core",
            "governance/compat/check_external_absorption_core.py",
            base,
            head,
        ),
        _range_command(
            "external absorption value conversion",
            "governance/compat/check_external_absorption_value_conversion.py",
            base,
            head,
        ),
        _range_command(
            "external absorption overlap discipline",
            "governance/compat/check_external_absorption_overlap_discipline.py",
            base,
            head,
        ),
        _range_command(
            "source mirror migration",
            "governance/compat/check_source_mirror_migration.py",
            base,
            head,
        ),
        _range_command(
            "Delta mutating profile boundary",
            "governance/compat/check_delta_mutating_profile_boundary.py",
            base,
            head,
        ),
        _range_command(
            "Delta execution claim boundary",
            "governance/compat/check_delta_execution_claim_boundary.py",
            base,
            head,
        ),
        _range_command(
            "foundation storage layout",
            "governance/compat/check_foundation_storage_layout.py",
            base,
            head,
        ),
        _range_command(
            "public export disposition quality",
            "governance/compat/check_public_export_disposition.py",
            base,
            head,
        ),
        _range_command(
            "corpus completeness and report integrity",
            "governance/compat/check_corpus_completeness_report_integrity.py",
            base,
            head,
        ),
        _range_command(
            "absorption blind-spot control presence",
            "governance/compat/check_absorption_blindspot_control_presence.py",
            base,
            head,
        ),
        _range_command(
            "rescan intelligence hardening",
            "governance/compat/check_rescan_intelligence_hardening.py",
            base,
            head,
        ),
        _range_command(
            "corpus-to-knowledge-map reconciliation",
            "governance/compat/check_corpus_to_knowledge_map_reconciliation.py",
            base,
            head,
        ),
        _range_command(
            "corpus intelligence classification",
            "governance/compat/check_corpus_intelligence_classification.py",
            base,
            head,
        ),
        _range_command(
            "index classification",
            "governance/compat/check_index_classification.py",
            base,
            head,
        ),
        _range_command(
            "memory access claim",
            "governance/compat/check_memory_access_claim.py",
            base,
            head,
        ),
        _range_command(
            "external provider skill usage trace",
            "governance/compat/check_external_provider_skill_usage_trace.py",
            base,
            head,
        ),
        _range_command(
            "CVF skill usage receipt trace",
            "governance/compat/check_cvf_skill_usage_receipt_trace.py",
            base,
            head,
        ),
        _range_command(
            "skill truth packets",
            "governance/compat/check_skill_truth_packets.py",
            base,
            head,
        ),
        _range_command(
            "package skill productionization pipeline",
            "governance/compat/check_package_skill_productionization_pipeline.py",
            base,
            head,
        ),
        GateCommand(
            "skill control plane inventory",
            ("python", "governance/compat/check_skill_control_plane_inventory.py", "--enforce"),
        ),
        GateCommand(
            "CVF Web skill control plane projection",
            (
                "python",
                "governance/compat/check_cvf_web_skill_control_plane_projection.py",
                "--enforce",
            ),
        ),
        _range_command(
            "truth foundation claim guard",
            "governance/compat/check_truth_foundation_claim_guard.py",
            base,
            head,
        ),
        _range_command(
            "raw memory release invariant",
            "governance/compat/check_raw_memory_release_invariant.py",
            base,
            head,
        ),
        _range_command(
            "DICE machine-candidate coverage",
            "governance/compat/check_dice_machine_candidates.py",
            base,
            head,
        ),
        _range_command(
            "corpus packet source hash (NR-04)",
            "governance/compat/check_corpus_packet_source_hash.py",
            base,
            head,
        ),
        _range_command(
            "corpus packet normalized path (NR-05)",
            "governance/compat/check_corpus_packet_normalized_path.py",
            base,
            head,
        ),
        _range_command(
            "corpus packet disposition canonical (NR-11)",
            "governance/compat/check_corpus_packet_disposition_canonical.py",
            base,
            head,
        ),
        _range_command(
            "corpus scan registry",
            "governance/compat/check_corpus_scan_registry.py",
            base,
            head,
        ),
        GateCommand(
            "ASSF certified metadata admission",
            ("python", "governance/compat/check_assf_certified_metadata_admission.py"),
        ),
        GateCommand(
            "ASSF package candidate anatomy",
            ("python", "governance/compat/check_assf_package_candidate_anatomy.py", "--enforce"),
        ),
        GateCommand(
            "ASSF external-agent metadata readout",
            ("python", "governance/compat/check_assf_external_agent_metadata_readout.py", "--enforce"),
        ),
        _range_command(
            "system loop interlock",
            "governance/compat/check_system_loop_interlock.py",
            base,
            head,
        ),
        _range_command(
            "FPC system-chain acceptance ledger",
            "governance/compat/check_fpc_system_chain_acceptance_ledger.py",
            base,
            head,
        ),
        _range_command(
            "FPC parked reopen inventory",
            "governance/compat/check_fpc_parked_reopen_inventory.py",
            base,
            head,
        ),
        _range_command(
            "KIOD runtime candidate reopen inventory",
            "governance/compat/check_kiod_runtime_candidate_reopen_inventory.py",
            base,
            head,
        ),
        GateCommand(
            "ERH CI public-evaluation workflow chain",
            ("python", "governance/compat/check_erh_ci_public_evaluation_workflow.py", "--enforce"),
        ),
        GateCommand(
            "ERH public-surface drift workflow chain",
            ("python", "governance/compat/check_erh_public_surface_drift_workflow.py", "--enforce"),
        ),
        GateCommand(
            "ERH dependency risk workflow chain",
            ("python", "governance/compat/check_erh_dependency_risk_workflow.py", "--enforce"),
        ),
        GateCommand(
            "ERH cvf-web dependency audit workflow chain",
            ("python", "governance/compat/check_erh_cvf_web_dependency_audit_workflow.py", "--enforce"),
        ),
        GateCommand(
            "ERH SAF1 safety workflow chain",
            ("python", "governance/compat/check_erh_safety_workflow_chain.py", "--enforce"),
        ),
        GateCommand(
            "ERH SAF2 output safety workflow chain",
            ("python", "governance/compat/check_erh_output_safety_workflow_chain.py", "--enforce"),
        ),
        GateCommand(
            "ERH DUR1 durable evidence policy snapshot workflow chain",
            ("python", "governance/compat/check_erh_durable_evidence_policy_snapshot.py", "--enforce"),
        ),
        GateCommand(
            "ERH DUR2 external storage adapter workflow chain",
            ("python", "governance/compat/check_erh_external_storage_adapter.py", "--enforce"),
        ),
        GateCommand(
            "active session state compatibility",
            ("python", "governance/compat/check_active_session_state.py", "--enforce"),
        ),
        GateCommand(
            "next-move freshness",
            ("python", "governance/compat/check_next_move_freshness.py", "--enforce"),
        ),
        GateCommand(
            "governed file size compatibility",
            ("python", "governance/compat/check_governed_file_size.py", "--enforce"),
        ),
        GateCommand(
            "system chain map freshness",
            ("python", "governance/compat/check_system_chain_map_freshness.py", "--enforce"),
        ),
        GateCommand(
            "as-built system catalog drift",
            ("python", "governance/compat/check_as_built_system_catalog_drift.py", "--enforce"),
        ),
        GateCommand(
            "governed python automation size",
            ("python", "governance/compat/check_python_automation_size.py", "--enforce"),
        ),
        _range_command(
            "dispatch scaffold provenance",
            "governance/compat/check_dispatch_scaffold_provenance.py",
            base,
            head,
        ),
        _range_command(
            "MinerU receipt boundary",
            "governance/compat/check_mineru_receipt_boundary.py",
            base,
            head,
        ),
    )


def _pre_implementation_commands(base: str, head: str) -> tuple[GateCommand, ...]:
    """Phase-specific commands prepended only at pre-implementation.

    These run before a worker writes material files so known local defects
    surface early.

    1. forbidden filesystem state (Fix (B)): catches the pattern where a prior
       tranche left untracked files in paths the current work order forbids.
    2. AAF early diagnostics (AAF-T6A): runs the existing read-only AAF helper
       in enforce mode so helper-detectable packet, corpus, worker-experience,
       and signal-readout defects surface at pre-implementation rather than at
       a late reviewer gate. The helper is read-only and advisory; only a
       nonzero helper exit (enforced defects) makes this gate fail through the
       existing command-result aggregation.
    """
    return (
        GateCommand(
            "forbidden filesystem state",
            ("python", "governance/compat/check_forbidden_filesystem_state.py",
             "--base", base, "--head", head, "--enforce"),
        ),
        GateCommand(
            "agent automation assist early diagnostics",
            ("python", "governance/compat/run_agent_automation_assist.py",
             "--base", base, "--head", head, "--json", "--enforce"),
        ),
    )


PRE_PUSH_COMMANDS: tuple[GateCommand, ...] = (
    GateCommand("git remote verification", ("git", "remote", "-v")),
    GateCommand(
        "local pre-push governance hook chain",
        (
            "python",
            "governance/compat/run_local_governance_hook_chain.py",
            "--hook",
            "pre-push",
            "--parallel",
            "--max-workers",
            "6",
        ),
    ),
)

