# CVF MASTER POLICY

**Effective:** 12/02/2026  
**Amendment (Workspace Isolation Rule):** 2026-03-02  
**Applies to:** Internal teams & Enterprise deployments

---

## 1. PURPOSE

This policy governs the use of AI agents
within the organization under Controlled Vibe Framework (CVF).

The objective is to:
- Reduce operational risk
- Prevent uncontrolled AI usage
- Ensure traceability
- Maintain accountability

---

## 2. SCOPE

This policy applies to:

- All AI agents used for company work
- All departments
- All environments (dev, staging, production, local, cloud, SaaS tools)
- All CVF versions
- All skill libraries

Personal AI usage unrelated to company work is excluded.

---

## 3. CORE REQUIREMENTS

1. All AI agents must be registered.
2. All agents must declare risk level.
3. Self-UAT is mandatory before operational use.
4. No AI output may bypass human accountability.
5. All incidents must be documented.
6. Every software project must implement automated test coverage with:
   - a runnable coverage command,
   - a declared baseline report,
   - enforced minimum threshold in CI/local gate.
7. Before any Build/Execute action that modifies artifacts, Skill Preflight is mandatory:
   - identify applicable skill(s) first,
   - verify each skill has a valid Skill Mapping Record and is allowed for current phase/risk,
   - log the declaration in trace before coding starts using `governance/toolkit/03_CONTROL/SKILL_PREFLIGHT_RECORD.md`,
   - if no suitable skill exists, STOP and create an intake/escalation record.
8. Workspace isolation is mandatory for all downstream projects using CVF:
   - DO NOT open or build downstream projects directly inside the CVF repository root.
   - Keep CVF as a framework core repository only; place each downstream project in a separate sibling workspace.
   - Approved patterns:
     - shared core: `D:\Work\.Controlled-Vibe-Framework-CVF` + `D:\Work\<ProjectName>`
     - per-project clone: `D:\Work\.Controlled-Vibe-Framework-CVF` (cloned as isolated core) + separate project folder
   - A leading `.` in CVF core folder naming is allowed as an isolation convention; it is not required for hidden mode.
   - Operational enforcement reference: `governance/toolkit/05_OPERATION/CVF_WORKSPACE_ISOLATION_GUARD.md`.
9. Document naming under CVF governance is mandatory:
   - Long-term governance and review records stored in `docs/` or `governance/` must follow CVF naming conventions.
   - Non-exempt governance records must use the `CVF_` prefix.
   - This rule applies equally to humans and AI agents.
   - Operational enforcement reference: `governance/toolkit/05_OPERATION/CVF_DOCUMENT_NAMING_GUARD.md`.
10. Document storage classification under CVF governance is mandatory:
   - New long-term documents created in `docs/` must be placed in the correct taxonomy folder.
   - `docs/INDEX.md` is the canonical storage map.
   - This rule applies equally to humans and AI agents.
   - Operational enforcement reference: `governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md`.
   - Automated docs gate reference: `governance/compat/check_docs_governance_compat.py`.
11. Depth audit is mandatory before deepening any roadmap phase:
   - This rule applies to all phases, not only deep policy branches.
   - Any new semantic layer, `CF-*` expansion, or comparable roadmap deepening must be justified by explicit depth-audit scoring.
   - The default should be `defer` unless the proposal demonstrates real risk reduction, decision value, and machine-enforceable closure.
   - Low-yield continuation classes such as validation/test-only breadth, packaging-only continuation, and truth/claim-expansion continuation must also record why a lateral shift is not better and what real decision boundary still improves.
   - Operational enforcement reference: `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`.
   - Automated continuation gate reference: `governance/compat/check_depth_audit_continuation_compat.py`.
   - Automated stop-boundary semantics reference: `governance/compat/check_gc018_stop_boundary_semantics.py`.
12. `GC-015` Baseline update is mandatory after every accepted fix/update:
   - Every real fix/update must produce a baseline update artifact, not only a normal log entry.
   - Acceptable forms: new baseline snapshot, baseline delta/addendum, or post-fix assessment linked to the prior baseline.
   - `docs/CVF_INCREMENTAL_TEST_LOG.md` does not replace this requirement.
   - Operational enforcement reference: `governance/toolkit/05_OPERATION/CVF_BASELINE_UPDATE_GUARD.md`.
13. Structural change audit is mandatory before any major restructuring execution:
   - This rule applies to major module merges, physical moves, ownership-plane transfers, package unification, or boundary-changing consolidation work.
   - Execution must follow the mandatory sequence:
     1. create a structural audit packet,
     2. create an independent review of that audit,
     3. obtain explicit user or authority decision,
     4. only then execute the structural change.
   - Each audit must classify the proposed change as `coordination package`, `wrapper/re-export merge`, or `physical merge`.
   - Operational enforcement reference: `governance/toolkit/05_OPERATION/CVF_STRUCTURAL_CHANGE_AUDIT_GUARD.md`.
14. `GC-020` Agent handoff is mandatory whenever governed work pauses or transfers before closure:
   - This rule applies to pause/resume, agent-to-agent transfer, and mid-tranche stop states.
   - Transition classification must be determined first using `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`.
   - The governing context-continuity model is `memory = repository of facts, history, and durable evidence`, `handoff = governance-filtered summary and transfer checkpoint`, and `context loading = phase-bounded loading of only what the current step needs`.
   - In CVF, handoff is context quality control by phase for multi-agent continuation, not only work transfer.
   - The handoff must truthfully state repo truth, tranche truth, latest completed commit, next governed move, and explicit scope limits.
   - The canonical handoff template is `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`.
   - The canonical context-continuity reference is `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`.
   - Operational enforcement reference: `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md`.
15. `GC-021` Fast-lane governance is allowed only for low-risk additive work inside an already-authorized tranche:
   - `GC-018` still opens the wave or tranche.
   - `GC-019` full-lane handling remains mandatory for physical merges, ownership transfer, target-state claim expansion, runtime-authority changes, or concept-to-module work.
   - Fast lane is allowed only when the change stays additive, remains inside the approved tranche scope, and keeps rollback bounded.
   - Fast-lane selection controls evidence burden only; durable memory class is still governed separately by `GC-022`.
   - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_FAST_LANE_GOVERNANCE_GUARD.md`.
   - Canonical templates: `docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md` and `docs/reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md`.
16. Memory governance is mandatory for evidence-bearing records intended to support later CVF memory:
   - Every memory-bearing record must classify itself as `FULL_RECORD`, `SUMMARY_RECORD`, or `POINTER_RECORD`.
   - The chosen class must match the document's storage role and the canonical `docs/` taxonomy.
   - Do not preserve full-detail durable history when a truthful summary or pointer-only record is sufficient.
   - Memory class follows artifact role, not whether the change used `Fast Lane` or `Full Lane`.
   - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md`.
   - Canonical classification reference: `docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md`.
17. `GC-023` governed file size discipline is mandatory for maintainability across CVF:
   - Governed source, test, frontend, and active markdown files must stay within the active class-specific size thresholds unless an approved exception exists.
   - Oversized files must be split by responsibility or tranche unless they are explicitly registered as legacy debt with rationale and follow-up.
   - Dedicated rotation guards remain authoritative for long-lived logs and traces.
   - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`.
   - Automated enforcement reference: `governance/compat/check_governed_file_size.py`.
18. `GC-024` canonical test partition ownership is mandatory once a large governed test surface has been split:
   - After tranche-local or subsystem-local tests are extracted into a canonical file, the old monolithic file must not re-absorb that surface.
   - Canonical ownership and forbidden legacy files must be recorded in a machine-readable registry.
   - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_TEST_PARTITION_OWNERSHIP_GUARD.md`.
   - Automated enforcement reference: `governance/compat/check_test_partition_ownership.py`.
19. `GC-025` Session governance bootstrap is mandatory before governed work starts or resumes in a fresh session:
   - Workers must first load the canonical bootstrap reference instead of rereading every governance guard by default.
   - The bootstrap must route workers to the relevant controls based on task class and transition state.
   - In CVF, `memory` preserves durable truth, `handoff` preserves transition truth, and `bootstrap` preserves minimal governance routing truth.
   - The canonical bootstrap reference is `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`.
   - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_SESSION_GOVERNANCE_BOOTSTRAP_GUARD.md`.
   - Automated enforcement reference: `governance/compat/check_session_governance_bootstrap.py`.
20. `GC-026` Progress tracker sync is mandatory after any governed tranche or authorization state change that alters canonical progress posture:
   - Workers must update the canonical tracker for the affected workline so session bootstrap does not read stale progress truth.
   - Workers must also leave one short standardized sync note instead of relying on tracker edits alone.
   - This rule is intentionally lighter than a full status-review rewrite, but stronger than an optional tracker refresh.
   - Canonical template: `docs/reference/CVF_GC026_PROGRESS_TRACKER_SYNC_TEMPLATE.md`.
   - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_PROGRESS_TRACKER_SYNC_GUARD.md`.
   - Automated enforcement reference: `governance/compat/check_progress_tracker_sync.py`.
21. `GC-027` Canonical multi-agent intake/rebuttal/decision documentation is mandatory before roadmap intake or implementation selection when multiple agents evaluate the same proposal set:
    - This rule applies when CVF uses separate agents or review passes to evaluate, rebut, and reconcile the same new module, layer, architecture addition, or roadmap candidate.
    - The canonical sequence is: intake review -> cross-agent rebuttal -> pre-integration decision pack -> only then roadmap intake or implementation authorization.
   - Canonical templates: `docs/reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`, `docs/reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`, and `docs/reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`.
   - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_MULTI_AGENT_REVIEW_DOC_GUARD.md`.
    - Automated enforcement reference: `governance/compat/check_multi_agent_review_governance_compat.py`.
    - This rule governs canonical documentation only; it does not replace live `AI Boardroom` deliberation inside the Control Plane.
    - The separate canonical runtime/reference boundary for boardroom deliberation is `docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`.
 22. `GC-028` Live `AI Boardroom` deliberation is a separate high-criticality control and must truthfully gate downstream work:
     - This rule applies when multiple agents or perspectives deliberate inside the live Control Plane before downstream design or orchestration continues.
     - The canonical sequence is: boardroom session packet -> dissent log when needed -> transition decision -> only then the next allowed runtime stage.
     - Canonical templates: `docs/reference/CVF_BOARDROOM_SESSION_PACKET_TEMPLATE.md`, `docs/reference/CVF_BOARDROOM_DISSENT_LOG_TEMPLATE.md`, and `docs/reference/CVF_BOARDROOM_TRANSITION_DECISION_TEMPLATE.md`.
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_BOARDROOM_RUNTIME_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_boardroom_runtime_governance_compat.py`.
     - The canonical runtime/reference protocol is `docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`.
     - Downstream orchestration must remain blocked unless the boardroom transition gate returns `PROCEED_TO_ORCHESTRATION`.
 23. `GC-029` Touched extension packages under `EXTENSIONS/` must pass their own package-level `check` script before push when governed changes affect source, test, or package config files:
     - This rule applies to extension packages with `package.json` and `scripts.check`.
     - The package-level `check` script is mandatory even when focused tests or repo-level governance checks already pass.
     - Touched packages must not rely on “green local test files” as a substitute for package-level verification.
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_EXTENSION_PACKAGE_CHECK_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_extension_package_check.py`.
 24. `GC-030` new or materially revised governance guards must satisfy the canonical authoring standard before commit:
     - This rule applies to any new guard and any existing guard whose rule or enforcement surface is materially revised.
     - Required metadata: `Guard Class`, `Status`, `Applies to`, and `Enforced by`.
     - Required sections: `Purpose`, `Rule`, `Enforcement Surface`, `Related Artifacts`, and `Final Clause`.
     - If a guard claims a `GC-*` control ID, that ID must be synchronized with the control matrix and master policy in the same change batch.
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_GUARD_AUTHORING_STANDARD_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_guard_authoring_standard.py`.
 25. `GC-031` canonical active trace/log windows owned by dedicated rotation guards must be registered by class before archive tooling may rely on them:
     - Every dedicated rotation guard that defines a canonical active window must register that window in `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`.
     - The registry is the source of truth for grouped active-window classification and generic archive protection.
     - Existing protected active-window entries are governed state and must not be silently mutated or removed in the normal commit path.
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_active_window_registry.py`.
 26. `GC-032` governed artifact authoring is mandatory whenever humans or AI agents write governed packets, evidence docs, or canonical continuity records:
     - Authors must read source truth first and may not replace typed evidence with narrative shorthand when upstream contracts define explicit fields.
     - Planning, execution, evidence, and continuity artifacts must remain role-separated; one artifact class may not silently stand in for another.
     - Tranche posture changes must move the relevant continuity surfaces together instead of leaving tracker, handoff, and closure truth out of sync.
     - Canonical authoring standard: `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`.
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_GOVERNED_ARTIFACT_AUTHORING_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_governed_artifact_authoring.py`.
 27. `GC-033` governed package public barrels must remain thin routing surfaces once an intentional split has been made:
     - Public barrels such as `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` must stay re-export-oriented and must not grow back into implementation hotspots.
     - Canonical maintainability authority: `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`.
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_PUBLIC_SURFACE_MAINTAINABILITY_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_cpf_public_surface_maintainability.py`.
 28. `GC-034` governed barrel smoke tests must remain ownership-clean after canonical test surfaces are split:
     - `tests/index.test.ts` style barrel smoke files may cover public-surface reachability, but they must not re-own tranche-local behavior already assigned to dedicated files.
     - Imports must route through the public barrel and approved helpers instead of local tranche contracts.
     - Canonical maintainability authority: `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`.
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_BARREL_SMOKE_OWNERSHIP_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_cpf_public_surface_maintainability.py`.
 29. `GC-035` governed CPF batch families must adopt shared batch helpers and shared fixture builders once those helpers exist:
     - Stable repeated batch logic such as deterministic batch identity and dominant-resolution patterns must route through the shared helper instead of being copied into new tranche files.
     - Stable repeated batch-test fixtures must route through shared builders under `tests/helpers/` instead of being redefined in every file.
     - Canonical maintainability authority: `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`.
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_SHARED_BATCH_HELPER_ADOPTION_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_cpf_batch_helper_adoption.py`.
 30. `GC-036` canonical summary docs must stay separate from typed evidence payloads:
     - Whitepaper, tracker, handoff, index, and active roadmap summary surfaces may cite evidence but must not inline evidence-owned typed fields such as trace/report IDs and hashes.
     - Summary canon should point to baselines, reviews, audits, and assessments rather than duplicating them.
     - Canonical maintainability authority: `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`.
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_CANON_SUMMARY_EVIDENCE_SEPARATION_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_canon_summary_evidence_separation.py`.
 31. `GC-037` visible repository roots and extension roots must be lifecycle-classified before any pre-public relocation or retirement wave begins:
     - This rule applies to repository cleanup work meant to improve public architectural clarity before packaging or external rollout.
     - Lifecycle classification must precede structural movement; do not infer deletion or retirement from legacy-looking names alone.
     - Canonical lifecycle classes are `ACTIVE_CANONICAL`, `MERGED_RETAINED`, `FROZEN_REFERENCE`, and `RETIRE_CANDIDATE`.
     - Canonical reference: `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`.
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_repository_lifecycle_classification.py`.
32. `GC-038` visible repository roots and extension roots must be exposure-classified before any public, mirror, package-export, or selective-distribution decision proceeds:
       - This rule applies to pre-public planning, selective module export planning, and any attempt to decide what CVF should expose externally.
       - Public-by-accident is forbidden; the default model is `private-by-default, selective-publication-only`.
       - Canonical exposure classes are `PUBLIC_DOCS_ONLY`, `PUBLIC_EXPORT_CANDIDATE`, `INTERNAL_ONLY`, and `PRIVATE_ENTERPRISE_ONLY`.
33. `GC-039` no `P3` structural relocation authorization may proceed until pre-public readiness truth is explicit:
       - `P0`, `P1`, and `P2` must be formally closed in a phase-gate registry.
       - Visible root files must be exposure-classified; directory tags alone are insufficient.
       - `PUBLIC_DOCS_ONLY` roots must declare public-content audit status, and `PUBLIC_EXPORT_CANDIDATE` extensions must declare export-readiness status.
       - The publication decision memo must carry a live re-assessment boundary before `P3` may be considered.
     - Canonical reference: `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`.
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_repository_exposure_classification.py`.
34. `GC-040` governed CPF and EPF batch contracts must preserve deterministic identity and nested clock propagation:
     - `batchId` must be derived from `batchHash` only; volatile post-`batchHash` suffixes are forbidden in governed batch identity.
     - batch wrappers that own `now` and instantiate nested non-batch contracts internally must thread `now: this.now` into those nested dependencies.
     - Canonical maintainability authority: `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`.
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_BATCH_CONTRACT_DETERMINISM_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_batch_contract_determinism.py`.
35. `GC-041` tranche-opening scan inheritance is mandatory before a fresh quality assessment or next-surface selection proceeds:
     - workers must consult `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json` before re-scanning by default
     - the same registry must be updated when scan posture materially changes so later agents inherit current surface-state truth
     - `AGENT_HANDOFF.md` and `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` must keep pointing to the canonical scan continuity registry
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_SURFACE_SCAN_CONTINUITY_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_surface_scan_registry.py`.
36. `GC-042` product-value claims and Docker-sandbox justification must use one frozen comparative evidence chain:
     - product value may not be claimed from code volume, benchmark-harness existence, self-scoring, or cherry-picked demos alone
     - comparative validation must freeze corpus, rubric, configuration set, and hard gates before scored runs begin
     - the canonical evidence chain is `corpus -> rubric -> run manifest -> final assessment`
     - Docker sandbox remains deferred-by-default unless this evidence chain or an explicit external requirement produces a real trigger
     - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_PRODUCT_VALUE_VALIDATION_GUARD.md`.
     - Automated enforcement reference: `governance/compat/check_product_value_validation_guard_compat.py`.

---

## 4. GOVERNANCE PRINCIPLES (Enterprise)

1. No agent without registry entry.
2. No production without Self-UAT PASS.
3. No certification without audit.
4. No operation without risk classification.
5. No version change without re-validation.

---

## 5. AUTHORITY STRUCTURE

- Governance Board (final authority)
- CVF Architect
- Agent Owner
- Operator
- Auditor

Separation of Duties is mandatory — see `CVF_SEPARATION_OF_DUTIES.md`.

---

## 6. ACCOUNTABILITY

- Agent Owner is responsible for correct usage.
- IT ensures technical compliance.
- Management approves HIGH/CRITICAL risk agents.

---

## 7. ENFORCEMENT

Violation of this policy results in:

- Immediate BLOCK
- Certification suspension
- Mandatory audit review

Unregistered or uncertified AI usage
may result in suspension of access.
