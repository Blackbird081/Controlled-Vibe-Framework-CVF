# CVF Pre-Public Docs Mirror Boundary — 2026-04-02 (Updated 2026-04-08)

Memory class: POINTER_RECORD
Status: canonical boundary reference for a future `PRIVATE_CORE + PUBLIC_DOCS_MIRROR` implementation.
Last Updated: 2026-04-08 (W62-T1 CP2 - Added explicit file lists from sensitivity classification)

## Purpose

- define what a future public docs mirror may include
- prevent `PUBLIC_DOCS_ONLY` from being misread as “mirror the whole `docs/` root”
- preserve evidence-heavy and governance-heavy material inside the private core

## Core Rule

A future public docs mirror is a curated subset, not a wholesale copy of `docs/`.

The exposure class `PUBLIC_DOCS_ONLY` means a surface may participate in public-facing documentation.
It does not mean every file under that root should be mirrored automatically.

## Direct Mirror Candidates (PUBLIC_READY)

These files are safe for immediate public exposure without modification. Total: ~60 files.

### Root Front-Door Files (7 files)

- `README.md`
- `START_HERE.md`
- `ARCHITECTURE.md`
- `LICENSE`
- `CHANGELOG.md`
- `CVF_ECOSYSTEM_ARCHITECTURE.md`
- `CVF_LITE.md`

### Concise Docs-Root Guides (5 files)

- `docs/GET_STARTED.md`
- `docs/HOW_TO_APPLY_CVF.md`
- `docs/VERSION_COMPARISON.md`
- `docs/VERSIONING.md`
- `docs/CHEAT_SHEET.md`

### Learning And Orientation Zones (29 files)

**docs/guides/** (7 files):
- `docs/guides/CVF_QUICK_ORIENTATION.md`
- `docs/guides/solo-developer.md`
- `docs/guides/enterprise.md`
- `docs/guides/team-setup.md`
- `docs/guides/README.md`
- `docs/guides/CVF_HOSTED_DEPLOYMENT_GUIDE_V1_6.md`
- `docs/guides/POST_MC5_ORIENTATION.md`

**docs/concepts/** (8 files):
- `docs/concepts/4-phase-process.md`
- `docs/concepts/controlled-execution-loop.md`
- `docs/concepts/core-philosophy.md`
- `docs/concepts/governance-model.md`
- `docs/concepts/risk-model.md`
- `docs/concepts/skill-system.md`
- `docs/concepts/version-evolution.md`
- `docs/concepts/README.md`

**docs/tutorials/** (5 files):
- `docs/tutorials/first-project.md`
- `docs/tutorials/custom-skills.md`
- `docs/tutorials/agent-platform.md`
- `docs/tutorials/web-ui-setup.md`
- `docs/tutorials/README.md`

**docs/case-studies/** (5 files):
- `docs/case-studies/01_fintech_credit_approval.md`
- `docs/case-studies/02_healthcare_diagnostics.md`
- `docs/case-studies/03_ecommerce_moderation.md`
- `docs/case-studies/04_enterprise_code_review.md`
- `docs/case-studies/05_saas_customer_success.md`

**docs/cheatsheets/** (4 files):
- `docs/cheatsheets/faq.md`
- `docs/cheatsheets/quick-reference.md`
- `docs/cheatsheets/troubleshooting.md`
- `docs/cheatsheets/version-picker.md`

### Selected Reference Documentation (20 files)

Product-facing and explanatory references only:

- `docs/reference/CVF_REFERENCE_GOVERNED_LOOP.md`
- `docs/reference/CVF_ARCHITECTURE_MAP.md`
- `docs/reference/CVF_POSITIONING.md`
- `docs/reference/CVF_NONCODER_REFERENCE_GOVERNED_PACKET.md`
- `docs/reference/CVF_ONE_PAGE_MASTER_BLUEPRINT.md`
- `docs/reference/CVF_MINIMUM_VIABLE_GOVERNANCE_STACK.md`
- `docs/reference/CVF_DEVELOPER_GUIDE.md`
- `docs/reference/CVF_IN_VSCODE_GUIDE.md`
- `docs/reference/CVF_VSCODE_PLAYBOOK.md`
- `docs/reference/CVF_WEB_TOOLKIT_GUIDE.md`
- `docs/reference/CVF_v16_AGENT_PLATFORM.md`
- `docs/reference/CVF_PROGRESSIVE_DISCLOSURE_GUIDE.md`
- `docs/reference/CVF_ADOPTION_STRATEGY.md`
- `docs/reference/CVF_FRAMEWORK_ASSESSMENT.md`
- `docs/reference/CVF_MATURITY_MATRIX.md`
- `docs/reference/CVF_SKILL_LIFECYCLE.md`
- `docs/reference/CVF_SKILL_SPEC.md`
- `docs/reference/CVF_STRATEGIC_COMPASS.md`
- `docs/reference/CVF_ROADMAP.md`
- `docs/reference/CVF_RELEASE_MANIFEST.md`
- `docs/reference/CVF_MODULE_INVENTORY.md`
- `docs/reference/CVF_NEW_MACHINE_SETUP_CHECKLIST.md`
- `docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md`
- `docs/reference/README.md`

## Conditional Mirror Zone (NEEDS_REVIEW)

These files may be suitable for public exposure after per-file review and redaction. Total: ~15 files.

### Root-Level Files Requiring Review

- `CLAUDE.md` - Contains governance references, needs cleanup

### Docs Root Files Requiring Review

- `docs/CVF_CORE_KNOWLEDGE_BASE.md` - Mix of public concepts and internal references

### Concepts Requiring Review

- `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md` - May contain internal governance details

### Reference Files Requiring Review

- `docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md` - May contain internal evidence references
- `docs/reference/CVF_EXPERT_REVIEW_v1.2.md` - May contain internal review details
- `docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md` - Contains internal status, needs update
- `docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md` - Pre-public planning doc
- `docs/reference/CVF_CONFORMANCE_SCENARIOS.md` - May contain internal test details
- And ~7 more files in docs/reference/api/ and docs/reference/resources/

### Review Process

For each NEEDS_REVIEW file:

1. Read full content
2. Identify sensitive sections (governance details, internal references)
3. Determine if redaction is feasible or if file should be PRIVATE_ONLY
4. Update links to point to public-facing alternatives
5. Reclassify as PUBLIC_READY or PRIVATE_ONLY

**Review Rule**: Include only explanatory/product-facing references. Exclude governance-control internals, enforcement templates, internal retention registries, and restructuring packets.

## Private-Core-Only Zone (PRIVATE_ONLY)

These files must remain in the private core and must never be publicly exposed. Total: ~2325 files (96.9%).

### Governance Artifacts (~1800 files)

**Evidence and Decision Records**:
- `docs/audits/` - All 171+ audit documents (W1-W61, P3-P4)
- `docs/reviews/` - All 500+ review documents (GC-018, GC-019, GC-021, tranche closures)
- `docs/baselines/` - All 200+ baseline/delta documents (GC-026 tracker sync)
- `docs/roadmaps/` - All 50+ execution plans and roadmaps
- `docs/assessments/` - All 35+ quality assessments (W7-W61)
- `docs/logs/` - All 10 incremental test log archives
- `docs/proposals/` - All proposals (currently empty)

### Internal Workflow and Handoff

- `AGENT_HANDOFF.md` - Agent continuation state
- `docs/INDEX.md` - Internal navigation
- `docs/BUG_HISTORY.md` - Internal bug tracking
- `docs/CVF_INCREMENTAL_TEST_LOG.md` - Internal test evidence
- `docs/CVF_ARCHITECTURE_DECISIONS.md` - Internal ADR log

### Internal Standards and Controls (~50 files)

**Governance Standards**:
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`
- `docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md`
- `docs/reference/CVF_CONTROL_TO_ARTIFACT_MAPPING.md`
- `docs/reference/CVF_GOVERNANCE_STATE_REGISTRY.md`
- `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`
- `docs/reference/CVF_GUARD_SURFACE_CLASSIFICATION.md`
- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`
- `docs/reference/CVF_QUALITY_ASSESSMENT_STANDARD.md`

**Internal Templates**:
- `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`
- `docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`
- `docs/reference/CVF_BOARDROOM_DISSENT_LOG_TEMPLATE.md`
- `docs/reference/CVF_BOARDROOM_SESSION_PACKET_TEMPLATE.md`
- `docs/reference/CVF_BOARDROOM_TRANSITION_DECISION_TEMPLATE.md`
- `docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md`
- `docs/reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_AUDIT_TEMPLATE.md`
- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_GC026_PROGRESS_TRACKER_SYNC_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`
- `docs/reference/CVF_POST_CLOSURE_REASSESSMENT_TRIGGER_TEMPLATE.md`
- `docs/reference/CVF_RELEASE_APPROVAL_PACKET_TEMPLATE.md`
- `docs/reference/CVF_POST_W7_DEPENDENCY_DECLARATION_PATTERN.md`
- `docs/reference/CVF_POST_W7_EXCLUSION_TEMPLATE.md`
- `docs/reference/CVF_POST_W7_GC018_DRAFTING_CHECKLIST.md`

**Internal Classifications**:
- `docs/reference/CVF_ACTIVE_WINDOW_CLASSIFICATION.md`
- `docs/reference/CVF_AUDIT_RETENTION_CLASSIFICATION.md`
- `docs/reference/CVF_REVIEW_RETENTION_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `docs/reference/CVF_DOCS_SENSITIVITY_CLASSIFICATION.md`

### Internal Planning and Baselines (~75 files)

**Architecture Baselines**:
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` - Internal architecture baseline
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` - Internal progress tracking
- `docs/reference/CVF_WHITEPAPER_GIT_FOR_AI.md` - Internal whitepaper

**Pre-Public Planning** (All CVF_PREPUBLIC_* files):
- `docs/reference/CVF_PREPUBLIC_CORE_GIT_EXPORT_SURFACE_2026-04-03.md`
- `docs/reference/CVF_PREPUBLIC_CURATED_FRONT_DOOR_NAVIGATION_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_DOCS_MIRROR_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_GUARD_CONTRACT_EXPORT_SURFACE_2026-04-03.md`
- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`
- `docs/reference/CVF_PREPUBLIC_RUNTIME_ADAPTER_HUB_EXPORT_SURFACE_2026-04-03.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_WAVE_STATUS_2026-04-03.md`

**Internal Workflow**:
- `docs/reference/CVF_CANONICAL_PATH_MAP_2026-03-06.md`
- `docs/reference/CVF_RESTRUCTURE_ARCHIVE_MANIFEST.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_HYPERVISOR_STRATEGY.md`
- `docs/reference/CVF_INTERNAL_USER_GUIDE.md`
- `docs/reference/CVF_BUILD_PROMPT_V01.md`
- `docs/reference/CVF_PERFORMANCE_ACCEPTANCE_POLICY_BASELINE_2026-03-29.md`
- `docs/reference/CVF_PUBLICATION_DECISION_RECORD_2026-04-03.md`

### Archives and Resources

- `docs/reference/archive/` - All archived internal documents
- `docs/reference/api/` - API documentation (needs per-file review)
- `docs/reference/resources/` - Resources (needs per-file review)

### Governance Toolkit and Compat

- `governance/` - All governance toolkit, policy, operations guards, compat gates (outside docs/)

## Foundation Anchor Interaction

- `v1.0/` and `v1.1/` remain visible private-core foundation anchors
- the docs mirror is not the mechanism for relocating or hiding those roots
- their public/noise reduction comes from curated front-door navigation, not from pretending they belong in a public docs mirror

## Implementation Preconditions

Before any real docs mirror is created:

- replace private-core links that point into audits, reviews, baselines, logs, or internal-only roots
- verify that mirrored pages do not imply full-repo public availability
- ensure no internal workflow, handoff, or governance scratch surfaces are referenced as public entrypoints
- run a dedicated mirror-content pass for each selected `docs/reference/` file

## Summary Statistics

- **PUBLIC_READY**: ~61 files (2.5%) - Safe for immediate public exposure
- **NEEDS_REVIEW**: ~15 files (0.6%) - Requires per-file review before exposure
- **PRIVATE_ONLY**: ~2325 files (96.9%) - Must remain in private core

## Related Artifacts

- `docs/reference/CVF_DOCS_SENSITIVITY_CLASSIFICATION.md` - Full classification registry
- `docs/.publicignore` - Gitignore-style exclusion patterns for future mirror tooling
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/roadmaps/CVF_GC018_W62_T1_DOCS_CURATION_ROADMAP_2026-04-08.md`
