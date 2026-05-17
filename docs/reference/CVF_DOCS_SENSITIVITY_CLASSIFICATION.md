# CVF Documentation Sensitivity Classification

Memory class: POINTER_RECORD
Status: canonical classification for documentation exposure readiness
Date: 2026-04-08
Context: W62-T1 CP1 — Sensitive content audit for PUBLIC_DOCS_MIRROR boundary definition

---

## Purpose

Classify all documentation files by exposure readiness to:

1. Protect sensitive governance artifacts from accidental public exposure
2. Define clear boundaries for future public docs mirror
3. Enable safe curation of public-facing content

---

## Classification Levels

### PUBLIC_READY

Files that are safe for immediate public exposure without modification.

**Criteria**:
- No internal governance details
- No sensitive workflow or handoff information
- No PII or internal references
- Product-facing or educational content only

### NEEDS_REVIEW

Files that may be suitable for public exposure after per-file review and redaction.

**Criteria**:
- Contains mix of public-facing and internal content
- May reference internal governance but not core to the document
- Requires link updates or content redaction before public exposure

### PRIVATE_ONLY

Files that must remain in private core and never be publicly exposed.

**Criteria**:
- Governance artifacts (audits, reviews, baselines, roadmaps)
- Internal workflow and handoff documents
- Sensitive decision records or evidence trails
- Internal templates and checklists

---

## Classification Registry

### Root-Level Documentation

| File | Classification | Notes |
|------|---------------|-------|
| `README.md` | PUBLIC_READY | Main entry point, product-facing |
| `START_HERE.md` | PUBLIC_READY | Quick navigation, no sensitive content |
| `ARCHITECTURE.md` | PUBLIC_READY | System overview, architectural concepts |
| `CVF_ECOSYSTEM_ARCHITECTURE.md` | PUBLIC_READY | Ecosystem view, no internal details |
| `CVF_LITE.md` | PUBLIC_READY | Quick start guide |
| `CHANGELOG.md` | PUBLIC_READY | Version history, public-facing |
| `LICENSE` | PUBLIC_READY | License file |
| `AGENT_HANDOFF.md` | PRIVATE_ONLY | Internal agent continuation state |
| `CLAUDE.md` | NEEDS_REVIEW | Contains governance references, needs cleanup |

### docs/ Root Files

| File | Classification | Notes |
|------|---------------|-------|
| `docs/GET_STARTED.md` | PUBLIC_READY | Getting started guide |
| `docs/HOW_TO_APPLY_CVF.md` | PUBLIC_READY | Application guide |
| `docs/VERSION_COMPARISON.md` | PUBLIC_READY | Version comparison |
| `docs/VERSIONING.md` | PUBLIC_READY | Versioning policy |
| `docs/CHEAT_SHEET.md` | PUBLIC_READY | Quick reference |
| `docs/INDEX.md` | PRIVATE_ONLY | Internal navigation, references private docs |
| `docs/BUG_HISTORY.md` | PRIVATE_ONLY | Internal bug tracking |
| `docs/CVF_INCREMENTAL_TEST_LOG.md` | PRIVATE_ONLY | Internal test evidence |
| `docs/CVF_ARCHITECTURE_DECISIONS.md` | PRIVATE_ONLY | Internal ADR log |
| `docs/CVF_CORE_KNOWLEDGE_BASE.md` | NEEDS_REVIEW | Mix of public concepts and internal references |

### docs/guides/

| File | Classification | Notes |
|------|---------------|-------|
| `docs/guides/CVF_QUICK_ORIENTATION.md` | PUBLIC_READY | Quick orientation guide |
| `docs/guides/solo-developer.md` | PUBLIC_READY | Solo developer guide |
| `docs/guides/enterprise.md` | PUBLIC_READY | Enterprise guide |
| `docs/guides/team-setup.md` | PUBLIC_READY | Team setup guide |
| `docs/guides/README.md` | PUBLIC_READY | Guides index |
| `docs/guides/CVF_HOSTED_DEPLOYMENT_GUIDE_V1_6.md` | PUBLIC_READY | Deployment guide |
| `docs/guides/POST_MC5_ORIENTATION.md` | PUBLIC_READY | Post-MC5 orientation guide |

### docs/concepts/

| File | Classification | Notes |
|------|---------------|-------|
| `docs/concepts/4-phase-process.md` | PUBLIC_READY | Core concept |
| `docs/concepts/controlled-execution-loop.md` | PUBLIC_READY | Core concept |
| `docs/concepts/core-philosophy.md` | PUBLIC_READY | Core concept |
| `docs/concepts/governance-model.md` | PUBLIC_READY | Governance overview (not internal details) |
| `docs/concepts/risk-model.md` | PUBLIC_READY | Risk model overview |
| `docs/concepts/skill-system.md` | PUBLIC_READY | Skill system overview |
| `docs/concepts/version-evolution.md` | PUBLIC_READY | Version evolution |
| `docs/concepts/README.md` | PUBLIC_READY | Concepts index |
| `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md` | NEEDS_REVIEW | May contain internal governance details |

### docs/tutorials/

| File | Classification | Notes |
|------|---------------|-------|
| `docs/tutorials/first-project.md` | PUBLIC_READY | Tutorial |
| `docs/tutorials/custom-skills.md` | PUBLIC_READY | Tutorial |
| `docs/tutorials/agent-platform.md` | PUBLIC_READY | Tutorial |
| `docs/tutorials/web-ui-setup.md` | PUBLIC_READY | Tutorial |
| `docs/tutorials/README.md` | PUBLIC_READY | Tutorials index |

### docs/case-studies/

| File | Classification | Notes |
|------|---------------|-------|
| `docs/case-studies/01_fintech_credit_approval.md` | PUBLIC_READY | Case study |
| `docs/case-studies/02_healthcare_diagnostics.md` | PUBLIC_READY | Case study |
| `docs/case-studies/03_ecommerce_moderation.md` | PUBLIC_READY | Case study |
| `docs/case-studies/04_enterprise_code_review.md` | PUBLIC_READY | Case study |
| `docs/case-studies/05_saas_customer_success.md` | PUBLIC_READY | Case study |

### docs/cheatsheets/

| File | Classification | Notes |
|------|---------------|-------|
| `docs/cheatsheets/faq.md` | PUBLIC_READY | FAQ |
| `docs/cheatsheets/quick-reference.md` | PUBLIC_READY | Quick reference |
| `docs/cheatsheets/troubleshooting.md` | PUBLIC_READY | Troubleshooting |
| `docs/cheatsheets/version-picker.md` | PUBLIC_READY | Version picker |

### docs/reference/ (Selected High-Traffic Files)

| File | Classification | Notes |
|------|---------------|-------|
| `CVF_REFERENCE_GOVERNED_LOOP.md` | PUBLIC_READY | Core reference, product-facing |
| `CVF_ARCHITECTURE_MAP.md` | PUBLIC_READY | Architecture overview |
| `CVF_POSITIONING.md` | PUBLIC_READY | Product positioning |
| `CVF_NONCODER_REFERENCE_GOVERNED_PACKET.md` | PUBLIC_READY | Non-coder guide |
| `CVF_ONE_PAGE_MASTER_BLUEPRINT.md` | PUBLIC_READY | Quick overview |
| `CVF_MINIMUM_VIABLE_GOVERNANCE_STACK.md` | PUBLIC_READY | Governance overview (not internal) |
| `CVF_DEVELOPER_GUIDE.md` | PUBLIC_READY | Developer guide |
| `CVF_IN_VSCODE_GUIDE.md` | PUBLIC_READY | VS Code guide |
| `CVF_VSCODE_PLAYBOOK.md` | PUBLIC_READY | VS Code playbook |
| `CVF_WEB_TOOLKIT_GUIDE.md` | PUBLIC_READY | Web toolkit guide |
| `CVF_v16_AGENT_PLATFORM.md` | PUBLIC_READY | Agent platform guide |
| `CVF_PROGRESSIVE_DISCLOSURE_GUIDE.md` | PUBLIC_READY | Progressive disclosure guide |
| `CVF_ADOPTION_STRATEGY.md` | PUBLIC_READY | Adoption strategy |
| `CVF_FRAMEWORK_ASSESSMENT.md` | PUBLIC_READY | Framework assessment |
| `CVF_MATURITY_MATRIX.md` | PUBLIC_READY | Maturity matrix |
| `CVF_SKILL_LIFECYCLE.md` | PUBLIC_READY | Skill lifecycle |
| `CVF_SKILL_SPEC.md` | PUBLIC_READY | Skill specification |
| `CVF_STRATEGIC_COMPASS.md` | PUBLIC_READY | Strategic compass |
| `CVF_ROADMAP.md` | PUBLIC_READY | Public roadmap (not internal execution plans) |
| `CVF_RELEASE_MANIFEST.md` | PUBLIC_READY | Release manifest |
| `CVF_MODULE_INVENTORY.md` | PUBLIC_READY | Module inventory |
| `CVF_NEW_MACHINE_SETUP_CHECKLIST.md` | PUBLIC_READY | Setup checklist |
| `CVF_ARCHITECTURE_DIAGRAMS.md` | PUBLIC_READY | Architecture diagrams |
| `CVF_ENTERPRISE_EVIDENCE_PACK.md` | NEEDS_REVIEW | May contain internal evidence references |
| `CVF_EXPERT_REVIEW_v1.2.md` | NEEDS_REVIEW | May contain internal review details |
| `CVF_RELEASE_READINESS_STATUS_2026-03-20.md` | NEEDS_REVIEW | Contains internal status, needs update |
| `CVF_PUBLIC_STRUCTURE_OVERVIEW.md` | NEEDS_REVIEW | Pre-public planning doc |
| `CVF_CONFORMANCE_SCENARIOS.md` | NEEDS_REVIEW | May contain internal test details |
| `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` | PRIVATE_ONLY | Internal architecture baseline |
| `CVF_WHITEPAPER_PROGRESS_TRACKER.md` | PRIVATE_ONLY | Internal progress tracking |
| `CVF_WHITEPAPER_GIT_FOR_AI.md` | PRIVATE_ONLY | Internal whitepaper |
| `CVF_GOVERNANCE_CONTROL_MATRIX.md` | PRIVATE_ONLY | Internal governance controls |
| `CVF_CONTEXT_CONTINUITY_MODEL.md` | PRIVATE_ONLY | Internal continuity model |
| `CVF_MEMORY_RECORD_CLASSIFICATION.md` | PRIVATE_ONLY | Internal memory governance |
| `CVF_CONTROL_TO_ARTIFACT_MAPPING.md` | PRIVATE_ONLY | Internal control mapping |
| `CVF_GOVERNANCE_STATE_REGISTRY.md` | PRIVATE_ONLY | Internal governance state |
| `CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md` | PRIVATE_ONLY | Internal authoring standard |
| `CVF_GUARD_SURFACE_CLASSIFICATION.md` | PRIVATE_ONLY | Internal guard classification |
| `CVF_MAINTAINABILITY_STANDARD.md` | PRIVATE_ONLY | Internal maintainability standard |
| `CVF_QUALITY_ASSESSMENT_STANDARD.md` | PRIVATE_ONLY | Internal quality standard |
| `CVF_AGENT_HANDOFF_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_BOARDROOM_DELIBERATION_PROTOCOL.md` | PRIVATE_ONLY | Internal protocol |
| `CVF_BOARDROOM_DISSENT_LOG_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_BOARDROOM_SESSION_PACKET_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_BOARDROOM_TRANSITION_DECISION_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_FAST_LANE_AUDIT_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_FAST_LANE_REVIEW_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_GC019_STRUCTURAL_CHANGE_AUDIT_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_GC019_STRUCTURAL_CHANGE_REVIEW_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_GC026_PROGRESS_TRACKER_SYNC_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_POST_CLOSURE_REASSESSMENT_TRIGGER_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_RELEASE_APPROVAL_PACKET_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_POST_W7_DEPENDENCY_DECLARATION_PATTERN.md` | PRIVATE_ONLY | Internal pattern |
| `CVF_POST_W7_EXCLUSION_TEMPLATE.md` | PRIVATE_ONLY | Internal template |
| `CVF_POST_W7_GC018_DRAFTING_CHECKLIST.md` | PRIVATE_ONLY | Internal checklist |
| `CVF_ACTIVE_WINDOW_CLASSIFICATION.md` | PRIVATE_ONLY | Internal classification |
| `CVF_AUDIT_RETENTION_CLASSIFICATION.md` | PRIVATE_ONLY | Internal classification |
| `CVF_REVIEW_RETENTION_CLASSIFICATION.md` | PRIVATE_ONLY | Internal classification |
| `CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md` | PRIVATE_ONLY | Internal classification |
| `CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md` | PRIVATE_ONLY | Internal classification |
| `CVF_CANONICAL_PATH_MAP_2026-03-06.md` | PRIVATE_ONLY | Internal path map |
| `CVF_RESTRUCTURE_ARCHIVE_MANIFEST.md` | PRIVATE_ONLY | Internal restructure record |
| `CVF_SESSION_GOVERNANCE_BOOTSTRAP.md` | PRIVATE_ONLY | Internal bootstrap |
| `CVF_HYPERVISOR_STRATEGY.md` | PRIVATE_ONLY | Internal strategy |
| `CVF_INTERNAL_USER_GUIDE.md` | PRIVATE_ONLY | Internal guide |
| `CVF_BUILD_PROMPT_V01.md` | PRIVATE_ONLY | Internal prompt |
| `CVF_PERFORMANCE_ACCEPTANCE_POLICY_BASELINE_2026-03-29.md` | PRIVATE_ONLY | Internal baseline |
| All `CVF_PREPUBLIC_*` files | PRIVATE_ONLY | Pre-public planning docs |

### docs/audits/, docs/reviews/, docs/baselines/, docs/roadmaps/, docs/assessments/, docs/logs/

| Directory | Classification | Notes |
|-----------|---------------|-------|
| `docs/audits/` | PRIVATE_ONLY | All audit documents (W1-W61, P3-P4) |
| `docs/reviews/` | PRIVATE_ONLY | All review documents (GC-018, GC-019, GC-021) |
| `docs/baselines/` | PRIVATE_ONLY | All baseline/delta documents (GC-026 sync) |
| `docs/roadmaps/` | PRIVATE_ONLY | All execution plans and roadmaps |
| `docs/assessments/` | PRIVATE_ONLY | All quality assessments (W7-W61) |
| `docs/logs/` | PRIVATE_ONLY | All incremental test logs |
| `docs/proposals/` | PRIVATE_ONLY | All proposals (currently empty) |

### docs/reference/api/, docs/reference/resources/, docs/reference/archive/

| Directory | Classification | Notes |
|-----------|---------------|-------|
| `docs/reference/api/` | NEEDS_REVIEW | API documentation, needs per-file review |
| `docs/reference/resources/` | NEEDS_REVIEW | Resources, needs per-file review |
| `docs/reference/archive/` | PRIVATE_ONLY | Archived internal documents |

---

## Classification Summary

**PUBLIC_READY**: ~61 files
- Root front-door files (7)
- docs/ root guides (5)
- docs/guides/ (7)
- docs/concepts/ (8)
- docs/tutorials/ (5)
- docs/case-studies/ (5)
- docs/cheatsheets/ (4)
- docs/reference/ selected (20)

**NEEDS_REVIEW**: ~15 files
- Mixed content requiring redaction or link updates

**PRIVATE_ONLY**: ~2325 files
- Governance artifacts (~1800)
- Internal templates and standards (~50)
- Internal reference docs (~75)
- Archive and logs (~400)

---

## Review Process

For files marked `NEEDS_REVIEW`:

1. Read full content
2. Identify sensitive sections (governance details, internal references, PII)
3. Determine if redaction is feasible or if file should be PRIVATE_ONLY
4. Update links to point to public-facing alternatives
5. Reclassify as PUBLIC_READY or PRIVATE_ONLY

---

## Related Artifacts

- `docs/reference/CVF_PREPUBLIC_DOCS_MIRROR_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/.publicignore` (to be created in CP2)
- `docs/roadmaps/CVF_GC018_W62_T1_DOCS_CURATION_ROADMAP_2026-04-08.md`

---

*Classification by: CVF Agent (W62-T1 CP1)*
*Date: 2026-04-08*
