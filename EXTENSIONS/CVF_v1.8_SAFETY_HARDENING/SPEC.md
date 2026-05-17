# CVF v1.8 — Strict Enforcement Specification

> **Source:** Adapted from `CVF AI Runtime/Spec CVF 1.8.0.md`
> **Layer:** 2.5 — Safety Runtime
> **Type:** Governance Spec

---

## Core Philosophy

```
AI is an untrusted executor.
Kernel is the trusted authority.
```

In v1.8, AI:
- **Cannot** mutate directly
- **Cannot** self-escalate
- **Cannot** change phase or role
- **Cannot** reduce risk assessment
- **Cannot** exceed mutation budget
- Violation = **Abort execution**

---

## The 7-Phase Execution Lifecycle (Strict Enforcement)

```
INTENT → ANALYSIS → RISK_ASSESSMENT → PLANNING → MUTATION_SANDBOX → VERIFICATION → COMMIT/ROLLBACK
```

### Hard Rules per Phase

**1. INTENT**
- Generate `executionId`, lock role, initialize `mutationBudget`
- No AI reasoning at this phase

**2. ANALYSIS**
- Allowed: file read, static reasoning, context inspection
- Forbidden: diff, mutation intent, file creation/deletion
- If AI emits mutation → **ABORT**

**3. RISK_ASSESSMENT**
- RiskObject `{score, level, breakdown, hash}` created and **immediately locked**
- Bound to `executionId`
- AI cannot modify risk after this phase — ever

**4. PLANNING**
- Allowed: propose diff structure, file list, LOC estimate
- Forbidden: apply diff
- System validates against: mutationBudget, roleLock, cross-domain boundary

**5. MUTATION_SANDBOX**
- Precondition: snapshot created, risk approved, budget validated
- AI executes **only pre-approved diff** — cannot change plan here
- Computes mutation fingerprint

**6. VERIFICATION**
- Engine checks: phase exit criteria, scope revalidation, risk compliance, elegance guard, anomaly detector
- If any check fails → rollback immediately, no second mutation chance

**7. COMMIT**
- Allowed only if: no anomaly flags, risk unchanged, budget not exceeded, verification passed
- Commit signature = `hash(executionId + risk.hash + mutationFingerprint + snapshotId)`
- Makes commit deterministic and auditable

---

## Hard Safety Guarantees

After v1.8 implementation:

| AI cannot | Kernel guarantees |
|-----------|-----------------|
| Expand scope mid-run | Snapshot always exists |
| Recalculate risk | Rollback always available |
| Add files beyond approved list | Drift monitored across executions |
| Mutate during verification | Stability index recalculated |
| Retry mutation after failure | Budget enforced per execution |
