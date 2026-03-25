# B* Merge 4 Audit — CVF_TRUST_SANDBOX
> **Date:** 2026-03-21
> **Status:** AUDIT COMPLETE — Awaiting user approval before execution
> **Merge Target:** `CVF_v1.7.1_SAFETY_RUNTIME` + `CVF_ECO_v2.0_AGENT_GUARD_SDK` → `CVF_TRUST_SANDBOX`
> **Auditor:** AI Assistant (directed by project owner)

---

## 1. Proposal

- Change ID: `BSTAR-M4-TRUST-SANDBOX-20260321`
- Proposed target: `EXTENSIONS/CVF_TRUST_SANDBOX/`
- Proposed change class: `coordination package`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_PHASE_4_CONSOLIDATION_REVIEW.md`
  - `docs/roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md`

---

## 2. Scope

- Source modules:
  - `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/`
  - `EXTENSIONS/CVF_ECO_v2.0_AGENT_GUARD_SDK/`
- Affected consumers:
  - current safety-runtime integration consumers
  - future users looking for one trust/sandbox umbrella
- Active-path impact:
  - indirect but meaningful because `CVF_v1.7.1_SAFETY_RUNTIME` is broadly referenced across runtime evidence and integration lines
- Out of scope:
  - moving `CVF_v1.7.1_SAFETY_RUNTIME` internals
  - replacing existing safety runtime release/evidence anchors
  - replatforming the small SDK into the large runtime

---

## 3. Module Profiles

### CVF_v1.7.1_SAFETY_RUNTIME

| Attribute | Value |
|---|---|
| Language | TypeScript |
| Location | `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/` |
| Package | `cvf-safety-runtime` |
| Scripts | `build`, `lint`, `format:check`, `check`, `test` |
| Scale | large runtime with core, policy, simulation, security, adapters, UI, kernel-architecture |
| Evidence status | active in release/conformance lines |

### CVF_ECO_v2.0_AGENT_GUARD_SDK

| Attribute | Value |
|---|---|
| Language | TypeScript |
| Location | `EXTENSIONS/CVF_ECO_v2.0_AGENT_GUARD_SDK/` |
| Package | `@cvf/agent-guard-sdk` |
| Scripts | `test` |
| Scale | compact SDK with guard module, risk module, session manager, audit logger |
| Responsibility | lightweight governance evaluation entrypoint |

---

## 4. Consumer Analysis

### CVF_v1.7.1_SAFETY_RUNTIME

- direct repo consumers found:
  - `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE/integration/risk.bridge.ts`
  - `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE/integration/risk.bridge.test.ts`
  - multiple `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` cross-extension conformance tests
  - `cvf-web` copied/ported configuration references
- active-path critical consumers:
  - indirect but strong ecosystem consumers

### CVF_ECO_v2.0_AGENT_GUARD_SDK

- direct repo consumers found:
  - package-local tests only
- active-path critical consumers:
  - none found

---

## 5. Overlap Classification

- conceptual overlap:
  - high
  - both live in the trust / guard / risk / sandbox domain
- interface overlap:
  - medium
  - both expose guard/risk-oriented surfaces
- implementation overlap:
  - medium at concept level, low at safe merge level
  - the SDK is a compact governance SDK
  - the safety runtime is a large, integrated runtime family

### Conclusion

There is enough semantic overlap to justify one umbrella, but not enough safe implementation alignment to justify a physical move in the current cycle.

---

## 6. Risk Assessment

- structural risk:
  - low for coordination package
  - high for wrapper-only strategy if it implies false API equivalence
  - very high for physical merge
- runtime risk:
  - high if safety runtime internals move
- test / CI risk:
  - high because safety runtime has broad existing suites and external evidence anchors
- rollback risk:
  - trivial for coordination package
- release / readiness risk:
  - high if safety runtime lineage is destabilized

---

## 7. Recommendation

- recommended change class:
  - `coordination package`
- why this class is better than the alternatives:
  - closes ownership ambiguity without destabilizing the large runtime family
  - avoids pretending the SDK and the runtime should collapse into a single internal tree right now
  - keeps current evidence anchors intact
- why preserving lineage is preferable:
  - `CVF_v1.7.1_SAFETY_RUNTIME` already participates in active release-grade evidence chains

### Recommended target shape

Create `EXTENSIONS/CVF_TRUST_SANDBOX/` as a coordination unit:

- unified README
- positioning doc:
  - when to use the full safety runtime
  - when to use the lightweight guard SDK
- optional small index/export docs, but no forced runtime unification yet

Do **not** physically merge the SDK into the safety runtime in the current cycle.

---

## 8. Verification Plan

- commands:
  - `cd EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME && npm run test`
  - `cd EXTENSIONS/CVF_ECO_v2.0_AGENT_GUARD_SDK && npm run test`
  - typecheck any new coordination package entrypoints
- success criteria:
  - no changes required in existing safety-runtime consumers
  - coordination package clarifies the split between full runtime and lightweight SDK
- evidence artifacts to update:
  - `docs/roadmaps/CVF_PHASE_4_CONSOLIDATION_REVIEW.md`
  - `docs/CVF_INCREMENTAL_TEST_LOG.md`
  - structural change review packet

---

## 9. Rollback Plan

- rollback unit:
  - `EXTENSIONS/CVF_TRUST_SANDBOX/`
- rollback trigger:
  - coordination package adds ambiguity rather than reducing it
- rollback steps:
  - delete coordination package
  - restore roadmap/review links
- rollback success criteria:
  - source runtime and SDK remain untouched and independently valid

---

## 10. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - this pair should be handled as an ownership umbrella, not as a filesystem merge, in the current cycle
