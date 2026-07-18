#!/usr/bin/env python3
"""Command chain catalog for CVF local governance hooks."""

from __future__ import annotations

PRE_COMMIT_CHECKS: list[tuple[str, list[str]]] = [
        (
            "closure packaging preflight",
            ["python", "governance/compat/check_closure_packaging_preflight.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "agent packet authority and encoding",
            ["python", "governance/compat/check_agent_packet_authority_and_encoding.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "core guard self-protection",
            ["python", "governance/compat/check_core_guard_self_protection.py", "--enforce"],
        ),
        (
            "governed file size compatibility",
            ["python", "governance/compat/check_governed_file_size.py", "--enforce"],
        ),
        (
            "system chain map freshness",
            ["python", "governance/compat/check_system_chain_map_freshness.py", "--enforce"],
        ),
        (
            "as-built system catalog drift",
            ["python", "governance/compat/check_as_built_system_catalog_drift.py", "--enforce"],
        ),
        (
            "governed python automation size",
            ["python", "governance/compat/check_python_automation_size.py", "--enforce"],
        ),
        (
            "governed exception registry integrity",
            ["python", "governance/compat/check_governed_exception_registry.py", "--enforce"],
        ),
        (
            "active archive hygiene compatibility",
            [
                "python",
                "governance/compat/check_active_archive_hygiene.py",
                "--max-stale",
                "10",
                "--fail-on-changed-stale",
                "--enforce",
            ],
        ),
        (
            "active session state compatibility",
            ["python", "governance/compat/check_active_session_state.py", "--enforce"],
        ),
        (
            "next-move freshness",
            ["python", "governance/compat/check_next_move_freshness.py", "--enforce"],
        ),
        (
            "docs governance compatibility",
            ["python", "governance/compat/check_docs_governance_compat.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "markdown structural completeness",
            ["python", "governance/compat/check_markdown_structural_completeness.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "governed artifact checker read-ahead",
            ["python", "governance/compat/check_governed_artifact_checker_read_ahead.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "work-order dispatch quality",
            ["python", "governance/compat/check_work_order_dispatch_quality.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "worker experience retrospective",
            ["python", "governance/compat/check_worker_experience_retrospective.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "review cost control",
            ["python", "governance/compat/check_review_cost_control.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "worker-return quality gate",
            ["python", "governance/compat/check_worker_return_quality_gate.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "dispatch prompt envelope",
            ["python", "governance/compat/check_dispatch_prompt_envelope.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "dispatch packet lifecycle hygiene",
            ["python", "governance/compat/check_dispatch_packet_lifecycle_hygiene.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "source intake decision packet preflight",
            ["python", "governance/compat/check_source_intake_decision_packet_preflight.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "PLCS companion routing block",
            ["python", "governance/compat/check_plcs_companion_routing_block.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "agent operation trace integrity",
            ["python", "governance/compat/check_agent_operation_trace.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "agent handoff boundary",
            ["python", "governance/compat/check_agent_handoff_boundary.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "agent workspace design boundary",
            ["python", "governance/compat/check_agent_workspace_design.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "agent workspace state",
            ["python", "governance/compat/check_agent_workspace_state.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "agent workspace skeleton",
            ["python", "governance/compat/check_agent_workspace_skeleton.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "agent workspace runtime boundary",
            ["python", "governance/compat/check_agent_workspace_runtime_boundary.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "machine closure package",
            ["python", "governance/compat/check_machine_closure_package.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "roadmap closure freshness",
            ["python", "governance/compat/check_roadmap_closure_freshness.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "multi-provider execution log quality",
            ["python", "governance/compat/check_multi_provider_execution_log.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "finding-to-governance learning quality",
            ["python", "governance/compat/check_finding_to_governance_learning.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "external-agent absorption table",
            ["python", "governance/compat/check_external_agent_absorption_table.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "external knowledge intake routing",
            ["python", "governance/compat/check_external_knowledge_intake_routing.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "external absorption core",
            ["python", "governance/compat/check_external_absorption_core.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "external absorption value conversion",
            ["python", "governance/compat/check_external_absorption_value_conversion.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "external absorption overlap discipline",
            ["python", "governance/compat/check_external_absorption_overlap_discipline.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "source mirror migration",
            ["python", "governance/compat/check_source_mirror_migration.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "Delta mutating profile boundary",
            ["python", "governance/compat/check_delta_mutating_profile_boundary.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "Delta execution claim boundary",
            ["python", "governance/compat/check_delta_execution_claim_boundary.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "foundation storage layout",
            ["python", "governance/compat/check_foundation_storage_layout.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "public export disposition quality",
            ["python", "governance/compat/check_public_export_disposition.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "absorption blind-spot control presence",
            ["python", "governance/compat/check_absorption_blindspot_control_presence.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "corpus completeness and report integrity",
            ["python", "governance/compat/check_corpus_completeness_report_integrity.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "rescan intelligence hardening",
            ["python", "governance/compat/check_rescan_intelligence_hardening.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "memory consolidation artifact quality",
            ["python", "governance/compat/check_memory_consolidation_artifact_quality.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "corpus-to-knowledge-map reconciliation",
            ["python", "governance/compat/check_corpus_to_knowledge_map_reconciliation.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "corpus intelligence classification",
            ["python", "governance/compat/check_corpus_intelligence_classification.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "corpus packet source hash (NR-04)",
            ["python", "governance/compat/check_corpus_packet_source_hash.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "corpus packet normalized path (NR-05)",
            ["python", "governance/compat/check_corpus_packet_normalized_path.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "corpus packet disposition canonical (NR-11)",
            ["python", "governance/compat/check_corpus_packet_disposition_canonical.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "corpus scan registry",
            ["python", "governance/compat/check_corpus_scan_registry.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "ASSF certified metadata admission",
            ["python", "governance/compat/check_assf_certified_metadata_admission.py"],
        ),
        (
            "ASSF package candidate anatomy",
            ["python", "governance/compat/check_assf_package_candidate_anatomy.py", "--enforce"],
        ),
        (
            "ASSF external-agent metadata readout",
            ["python", "governance/compat/check_assf_external_agent_metadata_readout.py", "--enforce"],
        ),
        (
            "external provider skill usage trace",
            ["python", "governance/compat/check_external_provider_skill_usage_trace.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "CVF skill usage receipt trace",
            ["python", "governance/compat/check_cvf_skill_usage_receipt_trace.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "skill truth packets",
            ["python", "governance/compat/check_skill_truth_packets.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "package skill productionization pipeline",
            ["python", "governance/compat/check_package_skill_productionization_pipeline.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "skill control plane inventory",
            ["python", "governance/compat/check_skill_control_plane_inventory.py", "--enforce"],
        ),
        (
            "CVF Web skill control plane projection",
            [
                "python",
                "governance/compat/check_cvf_web_skill_control_plane_projection.py",
                "--enforce",
            ],
        ),
        (
            "changed corpus registry coverage",
            ["python", "governance/compat/check_changed_corpus_registry_coverage.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "system loop interlock",
            ["python", "governance/compat/check_system_loop_interlock.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "FPC system-chain acceptance ledger",
            ["python", "governance/compat/check_fpc_system_chain_acceptance_ledger.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "FPC parked reopen inventory",
            ["python", "governance/compat/check_fpc_parked_reopen_inventory.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "KIOD runtime candidate reopen inventory",
            ["python", "governance/compat/check_kiod_runtime_candidate_reopen_inventory.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "truth foundation claim guard",
            ["python", "governance/compat/check_truth_foundation_claim_guard.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "ERH CI public-evaluation workflow chain",
            ["python", "governance/compat/check_erh_ci_public_evaluation_workflow.py", "--enforce"],
        ),
        (
            "ERH public-surface drift workflow chain",
            ["python", "governance/compat/check_erh_public_surface_drift_workflow.py", "--enforce"],
        ),
        (
            "public doc drift phrase compatibility",
            ["python", "governance/compat/check_public_doc_drift_phrases.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
        ),
        (
            "ERH dependency risk workflow chain",
            ["python", "governance/compat/check_erh_dependency_risk_workflow.py", "--enforce"],
        ),
        (
            "ERH cvf-web dependency audit workflow chain",
            ["python", "governance/compat/check_erh_cvf_web_dependency_audit_workflow.py", "--enforce"],
        ),
        (
            "ERH SAF1 safety workflow chain",
            ["python", "governance/compat/check_erh_safety_workflow_chain.py", "--enforce"],
        ),
        (
            "ERH SAF2 output safety workflow chain",
            ["python", "governance/compat/check_erh_output_safety_workflow_chain.py", "--enforce"],
        ),
        (
            "ERH DUR1 durable evidence policy snapshot workflow chain",
            ["python", "governance/compat/check_erh_durable_evidence_policy_snapshot.py", "--enforce"],
        ),
        (
            "ERH DUR2 external storage adapter workflow chain",
            ["python", "governance/compat/check_erh_external_storage_adapter.py", "--enforce"],
        ),
        (
            "governed pack contract compatibility",
            ["python", "governance/compat/check_governed_pack_contract.py", "--enforce"],
        ),
        (
            "continuation chain compatibility",
            ["python", "governance/compat/check_continuation_chain.py", "--enforce"],
        ),
        (
            "execute route step sequence compatibility",
            ["python", "governance/compat/check_execute_route_step_sequence.py", "--enforce"],
        ),
        (
            "anti-collusion evidence trace (GC-046 Phase 0.C)",
            ["python", "governance/compat/check_anti_collusion_evidence_trace.py", "--enforce", "--base", "HEAD", "--head", "HEAD"],
        ),
        (
            "public catalog update advisory (GC-024)",
            ["python", "governance/compat/check_catalog_update_advisory.py"],
        ),
    (
        "dispatch scaffold provenance",
        ["python", "governance/compat/check_dispatch_scaffold_provenance.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
    ),
    (
        "MinerU receipt boundary",
        ["python", "governance/compat/check_mineru_receipt_boundary.py", "--base", "HEAD", "--head", "HEAD", "--enforce"],
    ),
    ]
