# CVF GC-019 Structural Change Audit Template

> Decision type: `GC-019` structural change audit  
> Purpose: Establish the evidence base for a major structural change before execution begins

---

## 1. Proposal

- Change ID:
- Date:
- Proposed target:
- Proposed change class:
  - `coordination package`
  - `wrapper/re-export merge`
  - `physical merge`
- Active roadmap anchor:

## 2. Scope

- Source modules:
- Affected consumers:
- Active-path impact:
- Out of scope:

## 3. Module Profiles

For each source module record:

- language/runtime
- current location
- package/build system
- tests / coverage
- entrypoints
- current owners / responsibilities

## 4. Consumer Analysis

- who imports or calls each module
- whether coupling is compile-time, runtime, or documentation-only
- whether consumers are active-path critical

## 5. Overlap Classification

- conceptual overlap:
- interface overlap:
- implementation overlap:

## 6. Risk Assessment

- structural risk:
- runtime risk:
- test / CI risk:
- rollback risk:
- release / readiness risk:

## 7. Recommendation

- recommended change class:
- why this class is better than the alternatives:
- why preserving lineage is or is not preferable:

## 8. Verification Plan

- commands:
- success criteria:
- evidence artifacts to update:

## 9. Rollback Plan

- rollback unit:
- rollback trigger:
- rollback commands / steps:
- rollback success criteria:

## 10. Execution Posture

- audit decision:
  - `AUDIT READY`
  - `AUDIT INCOMPLETE`
- ready for independent review:
  - `YES`
  - `NO`
- notes:
