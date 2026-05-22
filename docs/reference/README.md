# CVF Reference Docs

Memory class: POINTER_RECORD

Đây là nơi lưu các tài liệu chuẩn, authoritative, long-lived của CVF.

Đặt vào đây:

- architecture reference
- positioning
- whitepaper
- permanent governance reference
- canonical technical reference

Không đặt vào đây:

- review ngắn hạn
- assessment theo batch/ngày
- roadmap remediation

Rule:

- Tài liệu mới phải dùng naming chuẩn CVF
- Chỉ đặt tài liệu có tính ổn định cao và được dùng làm source of truth

Current canonical docs:

- `CVF_ARCHITECTURE_MAP.md`
- `CVF_ARCHITECTURE_DIAGRAMS.md`
- `CVF_POSITIONING.md`
- `CVF_ADOPTION_STRATEGY.md`
- `CVF_SKILL_LIFECYCLE.md`
- `CVF_WHITEPAPER_GIT_FOR_AI.md`
- `CVF_WEB_TOOLKIT_GUIDE.md`
- `CVF_v16_AGENT_PLATFORM.md`
- `CVF_HYPERVISOR_STRATEGY.md`
- `CVF_PROGRESSIVE_DISCLOSURE_GUIDE.md`
- `CVF_CLAUDE_CODE_TEMPLATES_ANALYSIS_2026-02-18.md`
- `CVF_CLAUDEKIT_SKILLS_ANALYSIS_2026-02-18.md`
- `CVF_IN_VSCODE_GUIDE.md`
- `CVF_CANONICAL_PATH_MAP_2026-03-06.md`
- `CVF_RELEASE_MANIFEST.md`
- `CVF_MODULE_INVENTORY.md`
- `CVF_MATURITY_MATRIX.md`
- `CVF_AGENT_HANDOFF_TEMPLATE.md`
- `CVF_MEMORY_RECORD_CLASSIFICATION.md`
- `CVF_FAST_LANE_AUDIT_TEMPLATE.md`
- `CVF_FAST_LANE_REVIEW_TEMPLATE.md`
- `CVF_RELEASE_READINESS_STATUS_2026-03-20.md`
- `CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`
- `CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md`
- `CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md`
- `CVF_REFERENCE_GOVERNED_LOOP.md`
- `CVF_NONCODER_REFERENCE_GOVERNED_PACKET.md`
- `CVF_GOVERNANCE_STATE_REGISTRY.md`
- `CVF_ENTERPRISE_EVIDENCE_PACK.md`
- `CVF_CONTROL_TO_ARTIFACT_MAPPING.md`
- `CVF_RELEASE_APPROVAL_PACKET_TEMPLATE.md`
- `CVF_CONFORMANCE_SCENARIOS.md`
- `CVF_CONFORMANCE_SCENARIOS.json`
- `CVF_PRODUCT_VALUE_VALIDATION_CORPUS_TEMPLATE.md`
- `CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_TEMPLATE.md`
- `CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_TEMPLATE.md`
- `CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_TEMPLATE.md`
- `CVF_W7_CLI_SCHEMA_CONTRACTS.md` *(deferred by design — CLI not yet built)*
- `CVF_W7_CLI_GOVERNANCE_BINDINGS.md` *(deferred by design — CLI not yet built)*
- `CVF_W7_CLI_MVP_SCOPE.md` *(deferred by design — CLI not yet built)*
- `CVF_W7_CLI_WORKSPACE_AND_STATE.md` *(deferred by design — heavier review still required)*
- `CVF_W7_CLI_COMMAND_SURFACE.md` *(deferred by design — CLI not yet built)*
- `CVF_SEMANTIC_POLICY_INTENT_REGISTRY.md` *(canonical — CVF-native; W71-T1)*
- `CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md` *(canonical — CVF-native; W71-T1)*
- `CVF_W7_EXECUTION_ENVIRONMENT_NORMALIZATION_POLICY.md` *(canonical — CVF-native; W71-T1)*
- `CVF_W7_WINDOWS_COMPATIBILITY_EVALUATION_CHECKLIST.md` *(canonical — CVF-native; W71-T1)*
- `CVF_W7_WINDOWS_POWERSHELL_COMMAND_REFERENCE.md` *(reference appendix)*
- `CVF_PLANNER_TRIGGER_HEURISTICS.md` *(canonical — CVF-native; W71-T1)*
- `CVF_PROVISIONAL_EVALUATION_SIGNAL_CANDIDATES.md` *(bounded invariant — CVF-native; provisional signals stable, weights deferred; W71-T1)*
- `CVF_W7_EXTERNAL_ASSET_COMPILER_GUIDE.md` *(canonical — CVF-native; W71-T1)*
- `CVF_STAGE1_DIAGNOSTIC_INTERPRETATION_PACKET_TEMPLATE.md`
- `CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07.md` *(canonical — CVF-native; CVF ADD Phase A absorption)*
- `CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md` *(canonical — CVF-native; CVF ADD Phase A absorption)*
- `CVF_GOVERNED_CONTEXT_PROFILE_METADATA_DOCTRINE_2026-05-07.md` *(canonical — CVF-native; CVF ADD Phase B absorption)*
- `CVF_AGENT_CONTINUITY_AND_DELEGATION_DOCTRINE_2026-05-07.md` *(canonical — CVF-native; CVF ADD Phase B absorption)*
- `CVF_SCOPED_KNOWLEDGE_PROVIDER_BOUNDARY_DOCTRINE_2026-05-07.md` *(canonical — CVF-native; CVF ADD Phase B absorption)*
- `CVF_EXTENSION_AUTHOR_BOUNDARY.md` *(canonical — public contributor boundary; WPR-1)*
- `CVF_RELEASE_NOTES_V4_0_0_RC_1_2026-05-08.md` *(canonical — release candidate notes; WPR-4)*
- `CVF_PUBLIC_GOVERNANCE_KERNEL_COHERENCE_2026-05-22.md` *(public-safe A2 coherence readout; no freeze lift)*

Current readout note (A2 coherence 2026-05-22):

- governance-kernel coherence is audit-equivalent for the current public orientation baseline
- public readers should use `CVF_GOVERNANCE_CONTROL_MATRIX.md`, `CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`, and the Guard Contract runtime workflow, orchestrator, and policy-decision contracts before proposing new kernel-law documents
- do not create `CVF_KERNEL_LAW.md`, `CVF_RUNTIME_AUTHORITY_MODEL.md`, `CVF_EXECUTION_STATE_MODEL.md`, or `CVF_CORE_ONTOLOGY.md` just to mirror older review wording
- this is not a freeze lift, not a provider/runtime expansion, and not a new live governance proof claim

Current readout note (CVF ADD docs absorption 2026-05-07):

- the private CVF ADD review folder is no longer the operating surface for absorbed knowledge
- official docs absorption is complete for Families A, B, C1, C2, D, and E1; E2/Gridex remains excluded
- runtime activation is not started in these docs and is tracked separately by `docs/roadmaps/CVF_ADD_RUNTIME_ACTIVATION_ROADMAP_2026-05-07.md`

Current readout note (W71-T1 2026-04-13):

- the 6 canonical docs above are CVF-native; their semantics are implemented in CPF/LPF contracts and wired to the official CVF external-asset governance surface in `cvf-web`
- the full external-asset governance surface in `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web` covers: `POST /api/governance/external-assets/prepare` (intake → classification → normalization → registry-readiness), `POST/GET /api/governance/external-assets/register` (lifecycle-aware registry), `POST /api/governance/external-assets/retire` (lifecycle retirement), and `/governance/external-assets` operator page
- this is an official CVF-native governed surface, not a post-closure experiment
- provider-lane PVV remains a separate paused execution stream and must not be conflated with this governance-preparation surface
