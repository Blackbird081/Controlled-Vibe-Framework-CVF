"""Static runtime-family fixtures for the manifest exporter."""

from __future__ import annotations

from runtime_evidence_manifest.common import REPO_ROOT


SCHEMA_VERSION = "2026-03-07"
REQUEST_ID = "REQ-20260307-002"
TRACE_BATCH = "CVF_CROSS_EXTENSION_CONFORMANCE_BATCH_2026-03-07"

RUNTIME_ADAPTER_HUB_RECEIPTS = [
    {
        "receiptId": "RESUMED:proposal-runtime-adapter-hub-001:validate_resume_token",
        "action": "RESUMED",
        "sourceProposalId": "proposal-runtime-adapter-hub-001",
        "step": "validate_resume_token",
        "recordedAt": 1772863200000,
    },
    {
        "receiptId": "RESUMED:proposal-runtime-adapter-hub-001:emit_release_evidence",
        "action": "RESUMED",
        "sourceProposalId": "proposal-runtime-adapter-hub-001",
        "step": "emit_release_evidence",
        "recordedAt": 1772863201000,
    },
    {
        "receiptId": "INTERRUPTED:proposal-runtime-adapter-hub-001:stage_local_receipt_log",
        "action": "INTERRUPTED",
        "sourceProposalId": "proposal-runtime-adapter-hub-001",
        "step": "stage_local_receipt_log",
        "recordedAt": 1772863202000,
    },
]

SAFETY_HARDENING_ROLLBACK_RECEIPTS = [
    {
        "receiptId": "ROLLBACK_REQUIRED:durable-recovery-001:verification_anomaly",
        "action": "ROLLBACK_REQUIRED",
        "sourceProposalId": "durable-recovery-001",
        "step": "verification_anomaly",
        "recordedAt": 1772863100000,
    },
    {
        "receiptId": "ROLLBACK_REQUIRED:durable-recovery-002:mutation_not_applied",
        "action": "ROLLBACK_REQUIRED",
        "sourceProposalId": "durable-recovery-002",
        "step": "mutation_not_applied",
        "recordedAt": 1772863101000,
    },
    {
        "receiptId": "ROLLBACK_REQUIRED:durable-recovery-003:force_rollback",
        "action": "ROLLBACK_REQUIRED",
        "sourceProposalId": "durable-recovery-003",
        "step": "force_rollback",
        "recordedAt": 1772863102000,
    },
]

SAFETY_RUNTIME_SESSION_RECEIPTS = [
    {
        "receiptId": "CHECKPOINT_CREATED:session-runtime-001:create_checkpoint",
        "action": "CHECKPOINT_CREATED",
        "sourceProposalId": "session-runtime-001",
        "step": "create_checkpoint",
        "recordedAt": 1772863000000,
    },
    {
        "receiptId": "RESUMED:session-runtime-001:resume_session",
        "action": "RESUMED",
        "sourceProposalId": "session-runtime-001",
        "step": "resume_session",
        "recordedAt": 1772863001000,
    },
    {
        "receiptId": "AUDIT_LINKED:session-runtime-001:record_audit_linkage",
        "action": "AUDIT_LINKED",
        "sourceProposalId": "session-runtime-001",
        "step": "record_audit_linkage",
        "recordedAt": 1772863002000,
    },
]

AGENT_PLATFORM_GOVERNANCE_RECEIPTS = [
    {
        "receiptId": "SNAPSHOT_RESOLVED:agent-platform-001:resolve_registry_binding",
        "action": "SNAPSHOT_RESOLVED",
        "sourceProposalId": "agent-platform-001",
        "step": "resolve_registry_binding",
        "recordedAt": 1772863300000,
    },
    {
        "receiptId": "SNAPSHOT_RESOLVED:agent-platform-001:resolve_uat_binding",
        "action": "SNAPSHOT_RESOLVED",
        "sourceProposalId": "agent-platform-001",
        "step": "resolve_uat_binding",
        "recordedAt": 1772863301000,
    },
    {
        "receiptId": "ENFORCEMENT_EVALUATED:agent-platform-001:evaluate_governance_route",
        "action": "ENFORCEMENT_EVALUATED",
        "sourceProposalId": "agent-platform-001",
        "step": "evaluate_governance_route",
        "recordedAt": 1772863302000,
    },
]

GOVERNANCE_ENGINE_RECEIPTS = [
    {
        "receiptId": "POLICY_EVALUATED:governance-engine-001:evaluate_policy_dsl",
        "action": "POLICY_EVALUATED",
        "sourceProposalId": "governance-engine-001",
        "step": "evaluate_policy_dsl",
        "recordedAt": 1772863400000,
    },
    {
        "receiptId": "ENFORCEMENT_ROUTED:governance-engine-001:route_enforcement_decision",
        "action": "ENFORCEMENT_ROUTED",
        "sourceProposalId": "governance-engine-001",
        "step": "route_enforcement_decision",
        "recordedAt": 1772863401000,
    },
    {
        "receiptId": "APPROVAL_SNAPSHOTTED:governance-engine-001:record_approval_state",
        "action": "APPROVAL_SNAPSHOTTED",
        "sourceProposalId": "governance-engine-001",
        "step": "record_approval_state",
        "recordedAt": 1772863402000,
    },
]

SKILL_GOVERNANCE_RECEIPTS = [
    {
        "receiptId": "CANDIDATE_FILTERED:skill-governance-001:filter_revoked_skill",
        "action": "CANDIDATE_FILTERED",
        "sourceProposalId": "skill-governance-001",
        "step": "filter_revoked_skill",
        "recordedAt": 1772863500000,
    },
    {
        "receiptId": "PHASE_GUARDED:skill-governance-001:enforce_phase_compatibility",
        "action": "PHASE_GUARDED",
        "sourceProposalId": "skill-governance-001",
        "step": "enforce_phase_compatibility",
        "recordedAt": 1772863501000,
    },
    {
        "receiptId": "MIGRATION_ORCHESTRATED:skill-governance-001:resolve_successor_chain",
        "action": "MIGRATION_ORCHESTRATED",
        "sourceProposalId": "skill-governance-001",
        "step": "resolve_successor_chain",
        "recordedAt": 1772863502000,
    },
]

PHASE_GOVERNANCE_RECEIPTS = [
    {
        "receiptId": "INTEGRITY_VERIFIED:phase-governance-001:artifact_integrity",
        "action": "INTEGRITY_VERIFIED",
        "sourceProposalId": "phase-governance-001",
        "step": "artifact_integrity",
        "recordedAt": 1772863600000,
    },
    {
        "receiptId": "PIPELINE_EXECUTED:phase-governance-001:verification_pipeline",
        "action": "PIPELINE_EXECUTED",
        "sourceProposalId": "phase-governance-001",
        "step": "verification_pipeline",
        "recordedAt": 1772863601000,
    },
    {
        "receiptId": "AUDIT_EMITTED:phase-governance-001:phase_report_snapshot",
        "action": "AUDIT_EMITTED",
        "sourceProposalId": "phase-governance-001",
        "step": "phase_report_snapshot",
        "recordedAt": 1772863602000,
    },
]

DEFAULT_MANIFEST_JSON = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_MULTI_RUNTIME_EVIDENCE_MANIFEST_2026-03-07.json"
DEFAULT_MANIFEST_MD = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_MULTI_RUNTIME_EVIDENCE_LOG_2026-03-07.md"

RUNTIME_FAMILY_ORDER = (
    "CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL",
    "CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE",
    "CVF_v1.6.1_GOVERNANCE_ENGINE",
    "CVF_v1.6_AGENT_PLATFORM",
    "CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY",
    "CVF_v1.8_SAFETY_HARDENING",
    "CVF_v1.7.3_RUNTIME_ADAPTER_HUB",
    "CVF_v1.7.1_SAFETY_RUNTIME",
)

RUNTIME_FAMILY_CONFIG = {
    "CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL": {
        "cliKey": "v111",
        "printLabel": "phase governance",
        "versionToken": "v1.1.1",
        "adapter": "PHASE_GOVERNANCE_RUNTIME_EVIDENCE",
        "receipts": PHASE_GOVERNANCE_RECEIPTS,
        "defaultArtifact": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_PHASE_GOVERNANCE_EVIDENCE_2026-03-07.json",
        "defaultLog": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_PHASE_GOVERNANCE_LOG_2026-03-07.md",
    },
    "CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE": {
        "cliKey": "v122",
        "printLabel": "skill governance",
        "versionToken": "v1.2.2",
        "adapter": "SKILL_GOVERNANCE_RUNTIME_EVIDENCE",
        "receipts": SKILL_GOVERNANCE_RECEIPTS,
        "defaultArtifact": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_SKILL_GOVERNANCE_EVIDENCE_2026-03-07.json",
        "defaultLog": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_SKILL_GOVERNANCE_LOG_2026-03-07.md",
    },
    "CVF_v1.6.1_GOVERNANCE_ENGINE": {
        "cliKey": "v161",
        "printLabel": "governance engine",
        "versionToken": "v1.6.1",
        "adapter": "GOVERNANCE_ENGINE_RUNTIME_EVIDENCE",
        "receipts": GOVERNANCE_ENGINE_RECEIPTS,
        "defaultArtifact": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_GOVERNANCE_ENGINE_EVIDENCE_2026-03-07.json",
        "defaultLog": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_GOVERNANCE_ENGINE_LOG_2026-03-07.md",
    },
    "CVF_v1.6_AGENT_PLATFORM": {
        "cliKey": "v16",
        "printLabel": "agent platform",
        "versionToken": "v1.6",
        "adapter": "AGENT_PLATFORM_GOVERNANCE_EVIDENCE",
        "receipts": AGENT_PLATFORM_GOVERNANCE_RECEIPTS,
        "defaultArtifact": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_AGENT_PLATFORM_GOVERNANCE_EVIDENCE_2026-03-07.json",
        "defaultLog": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_AGENT_PLATFORM_GOVERNANCE_LOG_2026-03-07.md",
    },
    "CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY": {
        "cliKey": "v19",
        "printLabel": "deterministic reproducibility",
        "versionToken": "v1.9",
        "adapter": None,
        "receipts": None,
        "defaultArtifact": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_REMEDIATION_RECEIPTS_LOCAL_BASELINE_2026-03-07.json",
        "defaultLog": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_REMEDIATION_RECEIPT_LOG_2026-03-07.md",
    },
    "CVF_v1.8_SAFETY_HARDENING": {
        "cliKey": "v18",
        "printLabel": "safety hardening",
        "versionToken": "v1.8",
        "adapter": "SAFETY_HARDENING_ROLLBACK_EVIDENCE",
        "receipts": SAFETY_HARDENING_ROLLBACK_RECEIPTS,
        "defaultArtifact": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_SAFETY_HARDENING_ROLLBACK_EVIDENCE_2026-03-07.json",
        "defaultLog": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_SAFETY_HARDENING_ROLLBACK_LOG_2026-03-07.md",
    },
    "CVF_v1.7.3_RUNTIME_ADAPTER_HUB": {
        "cliKey": "v173",
        "printLabel": "runtime adapter hub",
        "versionToken": "v1.7.3",
        "adapter": "RUNTIME_ADAPTER_HUB_RELEASE_EVIDENCE",
        "receipts": RUNTIME_ADAPTER_HUB_RECEIPTS,
        "defaultArtifact": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_RUNTIME_ADAPTER_HUB_REMEDIATION_RECEIPTS_2026-03-07.json",
        "defaultLog": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_RUNTIME_ADAPTER_HUB_REMEDIATION_RECEIPT_LOG_2026-03-07.md",
    },
    "CVF_v1.7.1_SAFETY_RUNTIME": {
        "cliKey": "v171",
        "printLabel": "safety runtime",
        "versionToken": "v1.7.1",
        "adapter": "SAFETY_RUNTIME_SESSION_EVIDENCE",
        "receipts": SAFETY_RUNTIME_SESSION_RECEIPTS,
        "defaultArtifact": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_SAFETY_RUNTIME_SESSION_EVIDENCE_2026-03-07.json",
        "defaultLog": REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_SAFETY_RUNTIME_SESSION_LOG_2026-03-07.md",
    },
}

EMITTED_RUNTIME_FAMILIES = tuple(
    runtime_family
    for runtime_family in RUNTIME_FAMILY_ORDER
    if RUNTIME_FAMILY_CONFIG[runtime_family]["receipts"] is not None
)
