# B* Merge 3 Audit — CVF_MODEL_GATEWAY
> **Date:** 2026-03-21
> **Status:** AUDIT COMPLETE — Awaiting user approval before execution
> **Merge Target:** `CVF_v1.2.1_EXTERNAL_INTEGRATION` + `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` → `CVF_MODEL_GATEWAY`
> **Auditor:** AI Assistant (directed by project owner)

---

## 1. Proposal

- Change ID: `BSTAR-M3-MODEL-GATEWAY-20260321`
- Proposed target: `EXTENSIONS/CVF_MODEL_GATEWAY/`
- Proposed change class: `wrapper/re-export merge`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_PHASE_4_CONSOLIDATION_REVIEW.md`
  - `docs/roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md`

---

## 2. Scope

- Source modules:
  - `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/`
- Affected consumers:
  - `cvf-web` risk-model build and generated runtime assets
  - release/conformance evidence chains referencing `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
  - any future consumers that should import one unified gateway surface
- Active-path impact:
  - indirect only, mainly through current adapter-hub assets used by `cvf-web`
- Out of scope:
  - moving adapter hub risk-model JSON assets
  - changing provider/runtime semantics
  - rewriting current release-evidence and conformance paths

---

## 3. Module Profiles

### CVF_v1.2.1_EXTERNAL_INTEGRATION

| Attribute | Value |
|---|---|
| Language | TypeScript |
| Location | `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/` |
| Package | `cvf-external-integration` |
| Scripts | `build`, `test`, `test:coverage`, `check` |
| Core responsibilities | external skill intake, adapter transform, validation, certification, governance audit ledger |
| Tests | `2` suites |

### CVF_v1.7.3_RUNTIME_ADAPTER_HUB

| Attribute | Value |
|---|---|
| Language | TypeScript |
| Location | `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/` |
| Package | `cvf-runtime-adapter-hub` |
| Scripts | `typecheck`, `test`, `test:coverage`, `check` |
| Core responsibilities | runtime adapter contracts, provider adapters, explainability, policy parser, risk model JSON, edge security |
| Tests | `6` suites |

---

## 4. Consumer Analysis

### CVF_v1.2.1_EXTERNAL_INTEGRATION

- direct runtime consumers found:
  - none strong in current active path
- repo-level significance:
  - appears in release manifest and architecture decisions
  - independently reassessed as an active extension

### CVF_v1.7.3_RUNTIME_ADAPTER_HUB

- active consumers found:
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/scripts/build-risk-models.js`
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/generated/risk-models.generated.ts`
- release/conformance consumers found:
  - conformance scenarios and release evidence references
- active-path critical consumers:
  - indirect, but real

---

## 5. Overlap Classification

- conceptual overlap:
  - high
  - both modules sit in the execution/provider integration domain
- interface overlap:
  - medium
  - both present ingress points for external/provider-facing integration
- implementation overlap:
  - low to medium
  - adapter-hub focuses on runtime contracts/adapters
  - external integration focuses on skill onboarding/certification pipeline

### Conclusion

This pair has enough API-surface alignment to justify a unified import surface, but not enough implementation duplication to justify an immediate physical merge.

---

## 6. Risk Assessment

- structural risk:
  - medium for wrapper merge
  - high for physical merge because adapter-hub has real active-path coupling
- runtime risk:
  - medium if adapter-hub filesystem layout changes
- test / CI risk:
  - medium because both packages have distinct suites and release evidence assumptions
- rollback risk:
  - low to medium if only wrapper layer is added
- release / readiness risk:
  - medium if risk-model JSON paths or release-evidence contracts move

---

## 7. Recommendation

- recommended change class:
  - `wrapper/re-export merge`
- why this class is better than the alternatives:
  - gives CVF one official gateway entry surface
  - allows gradual migration of consumers without moving current adapter-hub assets
  - preserves release evidence and risk-model path stability
- why preserving lineage is preferable:
  - both source modules remain meaningful product lines with different internal concerns

### Recommended target shape

Create `EXTENSIONS/CVF_MODEL_GATEWAY/` as a unified wrapper:

- re-export stable runtime adapter contracts and adapters from `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
- expose selected intake/validation/certification entrypoints from `CVF_v1.2.1_EXTERNAL_INTEGRATION`
- add unified README and consumer migration guidance

Do **not** perform a physical move of adapter-hub or external-integration files in the current cycle.

---

## 8. Verification Plan

- commands:
  - `cd EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION && npm run check`
  - `cd EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB && npm run check`
  - `cd EXTENSIONS/CVF_MODEL_GATEWAY && npm run check`
  - rebuild `cvf-web` generated risk assets if wrapper introduces link guidance
- success criteria:
  - source package tests remain green
  - wrapper package typechecks and exports expected surfaces
  - existing `cvf-web` risk-model consumer remains unchanged or explicitly migrated
- evidence artifacts to update:
  - `docs/roadmaps/CVF_PHASE_4_CONSOLIDATION_REVIEW.md`
  - `docs/CVF_INCREMENTAL_TEST_LOG.md`
  - structural change review packet

---

## 9. Rollback Plan

- rollback unit:
  - `EXTENSIONS/CVF_MODEL_GATEWAY/`
- rollback trigger:
  - consumer migration confusion
  - wrapper exports introduce churn without reducing ambiguity
- rollback steps:
  - remove wrapper package
  - restore roadmap/review links
- rollback success criteria:
  - original packages continue to build, test, and serve current consumers unchanged

---

## 10. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - wrapper/re-export merge is the safest current-cycle form
  - physical consolidation should be revisited only after a later evidence cycle
