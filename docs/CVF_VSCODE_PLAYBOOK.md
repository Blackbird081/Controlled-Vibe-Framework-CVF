# CVF VS Code Playbook (Checklist)

> Purpose: Fast, copy/paste checklists for common tasks in VS Code.
> Note: This playbook is agent-agnostic. The same CVF rules apply in any agent environment.

---

## 0) Universal CVF Checklist

- [ ] Select version (v1.1 core / v1.5.2 skills / v1.6 UI)
- [ ] Pick mode (Simple / Governance / Full)
- [ ] Define scope IN/OUT
- [ ] List assumptions
- [ ] Define success criteria
- [ ] Confirm stop conditions
- [ ] Run Phase A only

---

## 1) Code Review

**Mode:** Full

- [ ] Phase A: Restate goal and assumptions
- [ ] Phase B: Define review criteria and severity scale
- [ ] Phase C: Findings with file/line references
- [ ] Phase D: Risk summary + next steps

**Prompt stub:**
```text
CVF MODE: FULL
Task: Review [module] for bugs/security/regressions.
Constraints: No speculative issues. Provide severity.
Start Phase A only.
```

---

## 2) Refactor (No behavior change)

**Mode:** Governance

- [ ] Clarify requirements
- [ ] Identify allowed changes
- [ ] Preserve API and behavior
- [ ] Provide before/after summary

**Prompt stub:**
```text
CVF MODE: GOVERNANCE
Task: Refactor [file] for readability, no behavior change.
Constraints: Preserve API and performance.
```

---

## 3) Security Audit

**Mode:** Full

- [ ] Phase A: Threat model + scope
- [ ] Phase B: Audit plan + areas
- [ ] Phase C: Findings with evidence
- [ ] Phase D: Remediation roadmap

**Prompt stub:**
```text
CVF MODE: FULL
Task: Security audit of [system/module].
Constraints: Focus on injection/auth/data leakage.
Start Phase A only.
```

---

## 4) Migration (App)

**Mode:** Full

- [ ] Phase A: Current vs target state
- [ ] Phase B: Strategy + rollback plan
- [ ] Phase C: Step-by-step tasks
- [ ] Phase D: Verification checklist

**Prompt stub:**
```text
CVF MODE: FULL
Task: Migrate [old] -> [new].
Constraints: Low downtime, data integrity.
Start Phase A only.
```

---

## 5) Debugging

**Mode:** Governance

- [ ] Ask for repro steps and logs
- [ ] Isolate root cause first
- [ ] Provide minimal-risk fix
- [ ] Provide verification steps

**Prompt stub:**
```text
CVF MODE: GOVERNANCE
Task: Debug [issue].
Constraints: Do not change behavior outside scope.
```

---

## 6) Performance Tuning

**Mode:** Full

- [ ] Phase A: Define baseline + metrics
- [ ] Phase B: Measurement plan
- [ ] Phase C: Implement changes
- [ ] Phase D: Report gains + regressions

**Prompt stub:**
```text
CVF MODE: FULL
Task: Optimize [module] for [metric].
Constraints: No functional regressions.
Start Phase A only.
```

---

## 7) Incident Post-Mortem

**Mode:** Governance

- [ ] Timeline of events
- [ ] Impact and detection
- [ ] Root cause
- [ ] Prevention actions

**Prompt stub:**
```text
CVF MODE: GOVERNANCE
Task: Write post-mortem for [incident].
Constraints: No blame language.
```

---

## 8) Data Migration

**Mode:** Full

- [ ] Phase A: Confirm source/target schema
- [ ] Phase B: Migration + rollback
- [ ] Phase C: Step-by-step tasks
- [ ] Phase D: Validation queries/checks

**Prompt stub:**
```text
CVF MODE: FULL
Task: Migrate data from [source] to [target].
Constraints: Idempotent steps + validation.
Start Phase A only.
```

---

## 9) Feature Build (Standard)

**Mode:** Full

- [ ] Phase A: Goals, assumptions, scope
- [ ] Phase B: Architecture + decisions
- [ ] Phase C: Implement + tests
- [ ] Phase D: Review + acceptance

**Prompt stub:**
```text
CVF MODE: FULL
Task: Build [feature].
Constraints: Provide tests and usage example.
Start Phase A only.
```
