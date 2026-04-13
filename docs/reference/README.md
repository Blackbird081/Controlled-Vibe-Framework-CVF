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

Current readout note (W71-T1 2026-04-13):

- the 6 canonical docs above are CVF-native; their semantics are implemented in CPF/LPF contracts and wired to the official CVF external-asset governance surface in `cvf-web`
- the full external-asset governance surface in `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web` covers: `POST /api/governance/external-assets/prepare` (intake → classification → normalization → registry-readiness), `POST/GET /api/governance/external-assets/register` (lifecycle-aware registry), `POST /api/governance/external-assets/retire` (lifecycle retirement), and `/governance/external-assets` operator page
- this is an official CVF-native governed surface, not a post-closure experiment
- provider-lane PVV remains a separate paused execution stream and must not be conflated with this governance-preparation surface
