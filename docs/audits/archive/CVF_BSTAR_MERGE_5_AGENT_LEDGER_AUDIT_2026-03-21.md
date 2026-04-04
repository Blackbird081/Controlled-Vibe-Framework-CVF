# B* Merge 5 Audit — CVF_AGENT_LEDGER
> **Date:** 2026-03-21
> **Status:** AUDIT COMPLETE — Awaiting user approval before execution
> **Merge Target:** `CVF_ECO_v3.0_TASK_MARKETPLACE` + `CVF_ECO_v3.1_REPUTATION` → `CVF_AGENT_LEDGER`
> **Auditor:** AI Assistant (directed by project owner)

---

## 1. Proposal

- Change ID: `BSTAR-M5-AGENT-LEDGER-20260321`
- Proposed target: `EXTENSIONS/CVF_AGENT_LEDGER/`
- Proposed change class: `physical merge`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_PHASE_4_CONSOLIDATION_REVIEW.md`
  - `docs/roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md`

---

## 2. Scope

- Source modules:
  - `EXTENSIONS/CVF_ECO_v3.0_TASK_MARKETPLACE/`
  - `EXTENSIONS/CVF_ECO_v3.1_REPUTATION/`
- Affected consumers:
  - current learning-plane façade semantics
  - any future imports of task ledger / reputation surfaces
- Active-path impact:
  - none direct on current active-path critical modules
- Out of scope:
  - changing learning-plane policy semantics
  - changing plane facade public behavior without compatibility wrappers

---

## 3. Module Profiles

### CVF_ECO_v3.0_TASK_MARKETPLACE

| Attribute | Value |
|---|---|
| Language | TypeScript |
| Location | `EXTENSIONS/CVF_ECO_v3.0_TASK_MARKETPLACE/` |
| Package | `@cvf/task-marketplace` |
| Main entry | `src/marketplace.ts` |
| Responsibility | task listing, bidding, assignment, task results |
| Tests | `3` vitest files |

### CVF_ECO_v3.1_REPUTATION

| Attribute | Value |
|---|---|
| Language | TypeScript |
| Location | `EXTENSIONS/CVF_ECO_v3.1_REPUTATION/` |
| Package | `@cvf/reputation` |
| Main entry | `src/reputation.system.ts` |
| Responsibility | score tracking, event history, summary/leaderboard |
| Tests | `2` vitest files |

---

## 4. Consumer Analysis

### Direct consumers found

- no strong active-path runtime consumers found for either package
- repo references are mostly:
  - docs inventory / roadmap references
  - learning facade delegation comments

### Active-path impact

- active-path critical consumers:
  - none found
- current coupling posture:
  - low

---

## 5. Overlap Classification

- conceptual overlap:
  - high
  - both describe agent work history and its learning consequences
- interface overlap:
  - medium
  - marketplace yields task result history that naturally feeds reputation
- implementation overlap:
  - medium and complementary
  - the packages are separate but structurally close and same-language

### Conclusion

This is the cleanest current-cycle candidate for a physical merge:

- same language/runtime
- small packages
- low external coupling
- naturally complementary domain model

---

## 6. Risk Assessment

- structural risk:
  - low to medium
- runtime risk:
  - low
- test / CI risk:
  - low to medium
  - both packages need suite migration into a new merged package
- rollback risk:
  - manageable if old package wrappers are preserved
- release / readiness risk:
  - low

---

## 7. Recommendation

- recommended change class:
  - `physical merge`
- why this class is better than the alternatives:
  - resolves a real split in one learning-plane subsystem
  - creates a coherent `agent ledger` concept where task history and reputation events belong together
  - blast radius is significantly smaller than other current-cycle pairs
- why preserving lineage is not preferable here:
  - physical separation gives limited value once compatibility wrappers are preserved

### Recommended target shape

Create `EXTENSIONS/CVF_AGENT_LEDGER/` as the new canonical package:

- move task marketplace runtime into merged package
- move reputation runtime into merged package
- keep lightweight compatibility wrappers in original packages for one transition cycle
- preserve package-level tests with migrated suites

---

## 8. Verification Plan

- commands:
  - `cd EXTENSIONS/CVF_AGENT_LEDGER && npm run test`
  - `cd EXTENSIONS/CVF_AGENT_LEDGER && npm run test:coverage`
  - wrapper smoke tests for legacy import compatibility
- success criteria:
  - merged package passes full migrated suite
  - original package entrypoints still resolve through wrappers
  - no learning-facade regression
- evidence artifacts to update:
  - `docs/roadmaps/CVF_PHASE_4_CONSOLIDATION_REVIEW.md`
  - `docs/CVF_INCREMENTAL_TEST_LOG.md`
  - structural change review packet

---

## 9. Rollback Plan

- rollback unit:
  - `CVF_AGENT_LEDGER` merged package plus wrapper updates
- rollback trigger:
  - merged suite regression
  - wrapper incompatibility
- rollback steps:
  - restore original packages as primary modules
  - remove merged package
  - revert facade linkage updates
- rollback success criteria:
  - original packages once again run independently with their pre-merge test suites

---

## 10. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - this is the strongest physical-merge candidate in the current B* cycle
