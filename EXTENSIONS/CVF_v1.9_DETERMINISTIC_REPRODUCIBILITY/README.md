# CVF v1.9 — Deterministic Reproducibility Engine

> **Layer:** 2.5 — Safety Runtime
> **Status:** Governance Spec ✍️
> **Extends:** v1.8 (Safety Hardening) — additive, does NOT modify v1.8
> **Folder:** `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/`

## Export Readiness

**Status**: CANDIDATE (Phase A)  
**Target Date**: 2026-05-01  
**Blockers**: None  
**Documentation**: [Export Surface Definition](../../docs/reference/CVF_PREPUBLIC_DETERMINISTIC_REPRODUCIBILITY_EXPORT_SURFACE_2026-04-08.md)

This package is part of the CVF pre-public packaging lane. It is not yet published to a public registry.

### Installation (Future)

Once published to npm:

```bash
npm install cvf-deterministic-reproducibility
```

For now, reference as a local workspace dependency within the CVF monorepo.

### Usage Example

```typescript
import { computeDeterministicHash, ReplayEngine } from 'cvf-deterministic-reproducibility';

// Compute deterministic hash
const commitHash = computeDeterministicHash(
  executionId,
  riskHash,
  mutationFingerprint,
  snapshotId
);

// Replay execution for forensic audit
const replayEngine = new ReplayEngine();
const result = replayEngine.replay(executionId, {
  currentFileHashes: { 'file.ts': 'abc123...' },
  currentRiskScore: 0.5
});

console.log(result.status); // 'EXACT' | 'DRIFT' | 'FAILED'
```

---

## What is CVF v1.9?

CVF v1.9 makes every AI execution **replayable, auditable, and reproducible**.

**Core principle:**
```
AI is probabilistic. Kernel must be deterministic.

Every execution must be:  Replayable. Deterministic. Auditable. Reproducible.
```

v1.9 does not change v1.8 behavior. It **adds a determinism layer** on top of the v1.8 execution kernel.

---

## What v1.9 Adds (Additive Only)

| Capability | How |
|-----------|-----|
| Replayable executions | `execution.replay.ts` — replay any past execution exactly |
| Frozen context | `context.freezer.ts` — context hash-locked before ANALYSIS phase |
| Forensic audit | `ExecutionRecord` with 9 immutable fields |
| Commit signing | `deterministic.hash.ts` — deterministic from context |
| Replay validation | `replay.validator.ts` — verifies replay matches original |

---

## Relationship with Other Versions

```
v1.8 (Safety Hardening)            — provides: ExecutionContext, phase isolation, commit hash
  ↓ extended by (additive)
v1.9 (Deterministic Reproducibility) — THIS spec — adds: forensic, replay, context freeze
  ↓ used by
v2.0 (Non-Coder Safety Runtime)    — abstracts away complexity for non-coders
```

---

## Files in this folder

- **SPEC.md** — ExecutionRecord schema, Context Freezer, Replay Engine
- **INTEGRATION_NOTES.md** — confirms additive relationship with v1.8
