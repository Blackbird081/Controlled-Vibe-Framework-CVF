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

---

# PHIEN BAN TIENG VIET

> Muc dich: Checklist nhanh (copy/paste). Ap dung cho moi agent environment.

---

## 0) Checklist chung

- [ ] Chon version (v1.1 core / v1.5.2 skills / v1.6 UI)
- [ ] Chon mode (Simple / Governance / Full)
- [ ] Dinh nghia scope IN/OUT
- [ ] Liet ke gia dinh
- [ ] Dinh nghia success criteria
- [ ] Xac nhan stop conditions
- [ ] Chi chay Phase A dau tien

---

## 1) Review code

**Mode:** Full

- [ ] Phase A: Muc tieu + gia dinh
- [ ] Phase B: Tieu chi review + muc do
- [ ] Phase C: Findings co file/line
- [ ] Phase D: Tong ket rui ro + next steps

**Prompt:**
```text
CVF MODE: FULL
Task: Review [module] cho bugs/security/regressions.
Constraints: Khong neu loi neu khong co bang chung.
Bat dau Phase A.
```

---

## 2) Refactor (khong doi behavior)

**Mode:** Governance

- [ ] Lam ro requirements
- [ ] Xac dinh pham vi duoc doi
- [ ] Giu API va behavior
- [ ] Summary truoc/sau

**Prompt:**
```text
CVF MODE: GOVERNANCE
Task: Refactor [file] de de doc, khong doi behavior.
Constraints: Giu API va hieu nang.
```

---

## 3) Security Audit

**Mode:** Full

- [ ] Phase A: Threat model + scope
- [ ] Phase B: Ke hoach audit
- [ ] Phase C: Findings co bang chung
- [ ] Phase D: Roadmap khac phuc

**Prompt:**
```text
CVF MODE: FULL
Task: Audit bao mat [system/module].
Constraints: Tap trung injection/auth/data leakage.
Bat dau Phase A.
```

---

## 4) Migration (App)

**Mode:** Full

- [ ] Phase A: Hien trang vs muc tieu
- [ ] Phase B: Strategy + rollback
- [ ] Phase C: Tung buoc thuc thi
- [ ] Phase D: Checklist verify

**Prompt:**
```text
CVF MODE: FULL
Task: Migrate [old] -> [new].
Constraints: Low downtime, bao toan du lieu.
Bat dau Phase A.
```

---

## 5) Debugging

**Mode:** Governance

- [ ] Hoi repro steps + logs
- [ ] Tim root cause truoc
- [ ] Dua ra fix rui ro thap
- [ ] Checklist verify

**Prompt:**
```text
CVF MODE: GOVERNANCE
Task: Debug [issue].
Constraints: Khong doi behavior ngoai scope.
```

---

## 6) Performance Tuning

**Mode:** Full

- [ ] Phase A: Baseline + metrics
- [ ] Phase B: Ke hoach do va toi uu
- [ ] Phase C: Implement changes
- [ ] Phase D: Bao cao gains/regressions

**Prompt:**
```text
CVF MODE: FULL
Task: Toi uu [module] cho [metric].
Constraints: Khong co regression functional.
Bat dau Phase A.
```

---

## 7) Incident Post-Mortem

**Mode:** Governance

- [ ] Timeline
- [ ] Impact + detection
- [ ] Root cause
- [ ] Prevention actions

**Prompt:**
```text
CVF MODE: GOVERNANCE
Task: Viet post-mortem cho [incident].
Constraints: Khong blame.
```

---

## 8) Data Migration

**Mode:** Full

- [ ] Phase A: Xac nhan source/target schema
- [ ] Phase B: Migration + rollback
- [ ] Phase C: Step-by-step
- [ ] Phase D: Validation queries/checks

**Prompt:**
```text
CVF MODE: FULL
Task: Migrate data tu [source] sang [target].
Constraints: Idempotent steps + validation.
Bat dau Phase A.
```

---

## 9) Feature Build (Standard)

**Mode:** Full

- [ ] Phase A: Muc tieu + gia dinh + scope
- [ ] Phase B: Kien truc + decisions
- [ ] Phase C: Implement + tests
- [ ] Phase D: Review + acceptance

**Prompt:**
```text
CVF MODE: FULL
Task: Build [feature].
Constraints: Co tests + usage.
Bat dau Phase A.
```
