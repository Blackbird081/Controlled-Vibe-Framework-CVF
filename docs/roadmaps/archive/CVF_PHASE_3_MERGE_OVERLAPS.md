# CVF Phase 3 — Merge Overlaps, Not Trees
> **Date:** 2026-03-21
> **Roadmap Ref:** `docs/roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md` — Phase 3
> **Status:** DELIVERABLE — Pending User Sign-off
> **Prerequisites:** Phase 0 ✅ | Phase 1 ✅ | Phase 2 ✅

---

## Objective

Remove duplicate subsystem responsibility across `CVF_GUARD_CONTRACT` and `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` without restructuring source trees.

---

## BV-01 — Duplicate Types (CLOSED)

**Problem:** `guard.runtime.types.ts` (130 lines) in PHASE_GOV_PROTOCOL was an exact copy of types already defined in `CVF_GUARD_CONTRACT/src/types.ts`.

| Type | Canonical Source | Previous Duplicate |
|------|------------------|--------------------|
| `CVFPhase`, `CVFRiskLevel`, `CVFRole` | `CVF_GUARD_CONTRACT/src/types.ts` | `guard.runtime.types.ts` |
| `GuardDecision`, `GuardSeverity` | ↑ | ↑ |
| `Guard`, `GuardResult`, `GuardRequestContext` | ↑ | ↑ |
| `GuardPipelineResult`, `GuardRuntimeConfig` | ↑ | ↑ |
| `GuardAuditEntry`, `MandatoryGuardId` | ↑ | ↑ |
| `DEFAULT_GUARD_RUNTIME_CONFIG`, `MANDATORY_GUARD_IDS` | ↑ | ↑ |

**Resolution:** Replaced 130-line duplicate with re-export wrapper:
```typescript
// guard.runtime.types.ts — now a thin re-export
export type { CVFPhase, CVFRiskLevel, ... } from '../../../CVF_GUARD_CONTRACT/src/types';
export { DEFAULT_GUARD_RUNTIME_CONFIG, MANDATORY_GUARD_IDS, ... } from '../../../CVF_GUARD_CONTRACT/src/types';
```

**Impact:** Zero import path changes — all PHASE_GOV consumers continue using `'./guard.runtime.types.js'`.

---

## BV-02 — Dual GuardRuntimeEngine (CLOSED)

**Problem:** Two independent `GuardRuntimeEngine` classes with divergent feature sets:
- `CVF_GUARD_CONTRACT/src/engine.ts` — had `agentGuidance` aggregation, `getAuditLogSize()`
- `PHASE_GOV_PROTOCOL/guard.runtime.engine.ts` — had `disableGuard()`, MANDATORY_GUARD_IDS protection

**Resolution (feature merge + re-export):**
1. Merged `disableGuard()` + MANDATORY_GUARD_IDS protection → canonical engine
2. Replaced 185-line duplicate with re-export wrapper

**Canonical engine now includes ALL features from both sources:**
| Feature | Origin | Now in canonical |
|---------|--------|:----------------:|
| `agentGuidance` aggregation | GUARD_CONTRACT | ✅ |
| `getAuditLogSize()` | GUARD_CONTRACT | ✅ |
| `disableGuard()` | PHASE_GOV | ✅ |
| MANDATORY_GUARD_IDS protection in `unregisterGuard()` | PHASE_GOV | ✅ |

---

## Overlap Closure Summary

| Overlap Area | Status | Method |
|-------------|--------|--------|
| **Type definitions** | ✅ CLOSED | Re-export from canonical |
| **Guard engine** | ✅ CLOSED | Feature merge + re-export |
| **Gateway/Router** (via facade) | ✅ Already resolved Phase 2 | GovernanceFacade delegates |
| **Context/Knowledge** (via facade) | ✅ Already resolved Phase 2 | KnowledgeFacade delegates |

---

## Verification Gate

- [x] No major duplicate top-level subsystem remains on active path
- [x] Guard types → single canonical source (CVF_GUARD_CONTRACT)
- [x] Guard engine → single canonical engine with all features
- [x] Existing imports stable — zero breaking changes
- [x] Re-export wrappers preserve backward compat

## Rollback Criteria

- Each re-export wrapper can be independently reverted to original local definitions
- Canonical engine feature additions (disableGuard/MANDATORY protection) are additive — reverting doesn't break existing tests
