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
   - Operational enforcement reference: `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`.
   - Automated continuation gate reference: `governance/compat/check_depth_audit_continuation_compat.py`.
12. Baseline update is mandatory after every accepted fix/update:
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
14. Agent handoff is mandatory whenever governed work pauses or transfers before closure:
   - This rule applies to pause/resume, agent-to-agent transfer, and mid-tranche stop states.
   - Transition classification must be determined first using `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`.
   - The governing context-continuity model is `memory = repository of facts, history, and durable evidence`, `handoff = governance-filtered summary and transfer checkpoint`, and `context loading = phase-bounded loading of only what the current step needs`.
   - In CVF, handoff is context quality control by phase for multi-agent continuation, not only work transfer.
   - The handoff must truthfully state repo truth, tranche truth, latest completed commit, next governed move, and explicit scope limits.
   - The canonical handoff template is `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`.
   - The canonical context-continuity reference is `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`.
   - Operational enforcement reference: `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md`.
15. Fast-lane governance is allowed only for low-risk additive work inside an already-authorized tranche:
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
17. Governed file size discipline is mandatory for maintainability across CVF:
   - Governed source, test, frontend, and active markdown files must stay within the active class-specific size thresholds unless an approved exception exists.
   - Oversized files must be split by responsibility or tranche unless they are explicitly registered as legacy debt with rationale and follow-up.
   - Dedicated rotation guards remain authoritative for long-lived logs and traces.
   - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`.
   - Automated enforcement reference: `governance/compat/check_governed_file_size.py`.
18. Canonical test partition ownership is mandatory once a large governed test surface has been split:
   - After tranche-local or subsystem-local tests are extracted into a canonical file, the old monolithic file must not re-absorb that surface.
   - Canonical ownership and forbidden legacy files must be recorded in a machine-readable registry.
   - Canonical operational rule: `governance/toolkit/05_OPERATION/CVF_TEST_PARTITION_OWNERSHIP_GUARD.md`.
   - Automated enforcement reference: `governance/compat/check_test_partition_ownership.py`.

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
