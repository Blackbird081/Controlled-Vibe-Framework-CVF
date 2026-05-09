# CVF v1.9 — Deterministic Reproducibility Specification

> **Source:** Adapted from `CVF AI Runtime/CVF 1.9.0_Deterministic Reproducibility Engine.md`
> **Layer:** 2.5 — Safety Runtime

---

## I. ExecutionRecord Schema (9 Immutable Fields)

Every execution in v1.9 produces an `ExecutionRecord`, immutable after COMMIT:

```typescript
ExecutionRecord {
  executionId:          string  // Unique ID from INTENT phase
  timestamp:            number  // UTC ms, locked at creation
  role:                 string  // Locked at INTENT
  mode:                 'SAFE' | 'BALANCED' | 'CREATIVE'
  frozenContextHash:    string  // Hash of frozen context (files, env, policy version)
  riskHash:             string  // From RiskObject, locked at RISK_ASSESSMENT
  mutationFingerprint:  string  // From MUTATION_SANDBOX
  snapshotId:           string  // Pre-mutation snapshot reference
  commitHash:           string  // Deterministic: hash(executionId+risk+mutation+snapshot)
}
```

All fields immutable after COMMIT. Any replay must produce the same `commitHash`.

---

## II. Context Freezer

**Problem:** LLM reasoning depends on context. Context changes → different result → not reproducible.

**Solution:** Before ANALYSIS phase begins, freeze:
- File list + file hashes
- Environment state
- Policy version
- Active skill bindings

This produces `frozenContextHash`. If context changes between original and replay:
- Replay validator reports drift
- Record is flagged as non-deterministic

---

## III. Replay Engine

Any past execution can be replayed:

```typescript
replay(executionId) → ReplayResult {
  matches: boolean          // true if commitHash matches original
  contextDrift: string[]    // files/env that changed
  riskDrift: number         // difference in risk score
  status: 'EXACT' | 'DRIFT' | 'FAILED'
}
```

Replay is audit-only — does **not** re-apply mutations.

---

## IV. Treeview (Implementation Reference)

```
core/
└── reproducibility/
    ├── execution.snapshot.ts   ← creates ExecutionRecord
    ├── context.freezer.ts      ← freezes context, generates frozenContextHash
    ├── execution.replay.ts     ← replay engine
    ├── deterministic.hash.ts   ← deterministic commit hash generation
    └── replay.validator.ts     ← validates replay vs original
```

Treeview for v2.0 (runtime layer):
```
runtime/
└── mode/ + intent/  ← see CVF_v2.0_NONCODER_SAFETY_RUNTIME/
```
