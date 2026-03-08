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
