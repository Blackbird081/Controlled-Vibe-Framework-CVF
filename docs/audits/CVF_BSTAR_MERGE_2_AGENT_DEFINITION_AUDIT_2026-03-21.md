# B* Merge 2 Audit — CVF_AGENT_DEFINITION
> **Date:** 2026-03-21
> **Status:** AUDIT COMPLETE — Awaiting user approval before execution
> **Merge Target:** `CVF_ECO_v2.3_AGENT_IDENTITY` + `CVF_v1.2_CAPABILITY_EXTENSION` → `CVF_AGENT_DEFINITION`
> **Auditor:** AI Assistant (directed by project owner)

---

## 1. Proposal

- Change ID: `BSTAR-M2-AGENT-DEFINITION-20260321`
- Proposed target: `EXTENSIONS/CVF_AGENT_DEFINITION/`
- Proposed change class: `coordination package`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_PHASE_4_CONSOLIDATION_REVIEW.md`
  - `docs/roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md`

---

## 2. Scope

- Source modules:
  - `EXTENSIONS/CVF_ECO_v2.3_AGENT_IDENTITY/`
  - `EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/`
- Affected consumers:
  - current direct runtime consumers of `CVF_ECO_v2.3_AGENT_IDENTITY`
  - documentation readers and reference links that point to `CVF_v1.2_CAPABILITY_EXTENSION`
- Active-path impact:
  - none directly on current active-path critical modules
- Out of scope:
  - changing capability baseline semantics
  - converting documentation-only capability assets into a new runtime implementation
  - physical move of the `v1.2` documentation package

---

## 3. Module Profiles

### CVF_ECO_v2.3_AGENT_IDENTITY

| Attribute | Value |
|---|---|
| Language | TypeScript |
| Location | `EXTENSIONS/CVF_ECO_v2.3_AGENT_IDENTITY/` |
| Package | `@cvf/agent-identity` |
| Main entry | `src/identity.manager.ts` |
| Core files | `identity.manager.ts`, `agent.registry.ts`, `credential.store.ts`, `types.ts` |
| Tests | `3` vitest files |
| Responsibility | agent registry, credentials, trust levels, permission grants |

### CVF_v1.2_CAPABILITY_EXTENSION

| Attribute | Value |
|---|---|
| Language | Markdown / reference docs |
| Location | `EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/` |
| Package/build | documentation-only, no runtime package |
| Main assets | `CAPABILITY_RISK_MODEL.md`, `SKILL_REGISTRY_MODEL.md`, `SKILL_CONTRACT_SPEC.md` |
| Tests | none |
| Responsibility | frozen capability model, skill/risk governance reference |

---

## 4. Consumer Analysis

### CVF_ECO_v2.3_AGENT_IDENTITY

- direct imports found:
  - package-local tests only
- repo references found:
  - docs/reference and inventory records
  - conformance scenario metadata
- active-path critical consumers:
  - none found

### CVF_v1.2_CAPABILITY_EXTENSION

- runtime imports found:
  - none
- usage mode:
  - documentation/reference only
- active-path critical consumers:
  - none

---

## 5. Overlap Classification

- conceptual overlap:
  - high
  - both modules describe agent profile and what an agent is allowed or expected to do
- interface overlap:
  - low
  - one side exposes runtime identity/permission APIs, the other side exposes reference contracts only
- implementation overlap:
  - none
  - there is no duplicated code path to collapse physically

### Conclusion

This is an ownership and vocabulary overlap, not a code duplication overlap.

---

## 6. Risk Assessment

- structural risk:
  - low for coordination package
  - medium for wrapper merge
  - high-value/low-benefit mismatch for physical merge because one side is docs-only
- runtime risk:
  - low if source module locations remain unchanged
- test / CI risk:
  - low if runtime module remains untouched
- rollback risk:
  - trivial for coordination package
- release / readiness risk:
  - low, provided original reference links remain valid

---

## 7. Recommendation

- recommended change class:
  - `coordination package`
- why this class is better than the alternatives:
  - creates one official ownership umbrella without inventing fake runtime consolidation
  - preserves the frozen documentation package as-is
  - avoids forcing a TypeScript barrel to masquerade as a replacement for capability docs
- why preserving lineage is preferable:
  - the capability extension is a canonical reference asset, not a runtime subtree to relocate

### Recommended target shape

Create `EXTENSIONS/CVF_AGENT_DEFINITION/` as a coordination unit:

- unified README
- index/entry docs pointing to:
  - runtime identity module
  - capability baseline docs
- optional TypeScript barrel for `@cvf/agent-identity`

Do **not** physically merge documentation assets into the runtime package.

---

## 8. Verification Plan

- commands:
  - `cd EXTENSIONS/CVF_ECO_v2.3_AGENT_IDENTITY && npm run test`
  - validate promoted docs links remain resolvable
  - `python governance/compat/check_docs_governance_compat.py --enforce`
- success criteria:
  - identity package tests remain green
  - capability docs remain addressable without path drift
  - new coordination package introduces no import breakage
- evidence artifacts to update:
  - `docs/roadmaps/CVF_PHASE_4_CONSOLIDATION_REVIEW.md`
  - `docs/CVF_INCREMENTAL_TEST_LOG.md`
  - structural change review packet

---

## 9. Rollback Plan

- rollback unit:
  - `EXTENSIONS/CVF_AGENT_DEFINITION/`
- rollback trigger:
  - broken docs links
  - coordination package creates confusing duplicate entrypoints
- rollback steps:
  - delete coordination package
  - restore roadmap/review links
- rollback success criteria:
  - original runtime and docs modules remain unchanged and independently usable

---

## 10. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - this pair should not be treated as a physical merge candidate in the current cycle
