# CVF Runtime Enforcement Engine — Plan (v1.6)

> **Date:** 2026-02-08  
> **Scope:** Phase 5 / Task 36 — Enforcement gap bridge  
> **Goal:** Bridge **spec → runtime enforcement** so CVF rules are not just textual.

---

## 1) Why this matters

CVF v1.x defines strong governance, but v1.6 runtime only enforces ~30% of it.  
This plan adds a **runtime enforcement layer** that checks policies **before** execution and validates outputs **after** execution.

---

## 2) Enforcement Pipeline (Proposed)

```
User Input / Spec / Skill
          ↓
Spec Completeness Gate (SpecGate)
          ↓
Risk & Authority Gate (R0–R4 + role)
          ↓
Scope & Phase Gate (Workflow phase)
          ↓
Execution Allowed
          ↓
Output Validation (UAT + format + compliance)
          ↓
User Review / Iteration
```

---

## 3) Runtime Policies (MVP)

**Input-side**
- Spec completeness (required fields)
- Risk level vs mode (Simple/Governance/Full)
- Budget check (usage/quota)

**Output-side**
- Phase checklist compliance
- Output format validation
- Pre-UAT (self-check) before user UAT

---

## 4) Integration Points (v1.6)

| Component | Hook | Purpose |
|----------|------|---------|
| `useAgentChat` | before `callRealAI` | block invalid/risky/spec-incomplete |
| `SpecExport` | before Send | ensure completeness & warnings |
| `MultiAgentPanel` | before each agent | enforce role/risk/phase |
| `API /execute` | server-side guard | protect hosted deployments |

---

## 5) Data Contracts

**Enforcement Input**
```
mode: 'simple' | 'governance' | 'full'
specGate: PASS | CLARIFY | FAIL
riskLevel: R0-R4
budgetOk: boolean
phase: A/B/C/D
```

**Enforcement Output**
```
status: ALLOW | CLARIFY | BLOCK | NEEDS_APPROVAL
reasons: string[]
requiredActions: string[]
```

---

## 6) Migration Plan

1. Add enforcement API in `src/lib/enforcement.ts`  
2. Hook into `useAgentChat` (client)  
3. Hook into `/api/execute` (server)  
4. Extend Multi-Agent pipeline  
5. Add UI badges + audit log for enforcement decisions  

---

## 7) Success Criteria

- Block R2+ in Simple mode (already done, keep)  
- Block spec FAIL before sending AI  
- Show explicit reason + required action  
- Output UAT coverage visible per domain  

---

## 8) Risk

- Over-blocking can reduce usability → require clear UI feedback  
- Need strong error messaging to reduce confusion  

