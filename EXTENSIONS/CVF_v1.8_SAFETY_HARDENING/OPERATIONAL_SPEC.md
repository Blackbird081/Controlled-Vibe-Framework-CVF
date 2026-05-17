# CVF v1.8 — Operational Specification (Enterprise Strict)

> **Source:** Adapted from `CVF AI Runtime/CVF 1.8_OPERATIONAL SPECIFICATION.md`
> **Layer:** 2.5 — Safety Runtime

---

## I. ExecutionContext Schema

Every execution has this immutable structure:

```typescript
ExecutionContext {
  executionId:      string   // Unique, generated at INTENT phase
  role:             string   // Locked at INTENT, cannot change
  mode:             'SAFE' | 'BALANCED' | 'CREATIVE'
  currentPhase:     Phase    // One of the 7 phases
  riskObject:       RiskObject  // Locked after RISK_ASSESSMENT
  mutationBudget:   Budget      // Set at INTENT, immutable
  snapshotId:       string   // Created before MUTATION_SANDBOX
  anomalyFlags:     string[]
  escalationLevel:  0 | 1 | 2 | 3
}
```

---

## II. Allowed Phase Transitions (Strict)

```
INTENT → ANALYSIS
ANALYSIS → RISK_ASSESSMENT
RISK_ASSESSMENT → PLANNING
PLANNING → MUTATION_SANDBOX
MUTATION_SANDBOX → VERIFICATION
VERIFICATION → COMMIT
VERIFICATION → ROLLBACK (on failure)
```

**Anything else = HARD ABORT.**
No backward transitions. No phase skipping. No re-entering mutation after verification.

---

## III. Commit Signature (Deterministic)

```typescript
commitHash = hash(
  executionId +
  risk.hash +
  mutationFingerprint +
  snapshotId
)
```

Every commit is uniquely and deterministically tied to its full execution context. Cannot be forged or reused.

---

## IV. Hard Safety Guarantees

AI **cannot:**
- Expand scope mid-run
- Recalculate risk after RISK_ASSESSMENT phase
- Add files beyond approved plan
- Perform hidden refactoring
- Mutate during VERIFICATION
- Retry mutation after failure

Kernel **guarantees:**
- Snapshot always exists before mutation
- Rollback always available
- Drift monitored across executions
- Stability index recalculated after each execution

---

## V. Enterprise Position

After v1.8, CVF satisfies all enterprise-grade requirements:

| Enterprise requirement | CVF v1.8 solution |
|----------------------|------------------|
| Deterministic behavior | Phase state machine + immutable risk |
| Audit trail | commitHash bound to full ExecutionContext |
| Rollback guarantee | Snapshot before every MUTATION_SANDBOX |
| Bounded mutation | Budget set at INTENT, enforced at PLANNING |
| Non-escalating autonomy | Drift Monitor auto-reduces budget |
| Drift control | Stability Index with automatic SAFE mode |
