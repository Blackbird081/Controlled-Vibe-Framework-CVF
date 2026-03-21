# CVF Phase 4 — Mandatory Physical Consolidation Review
> **Date:** 2026-03-21
> **Revised:** 2026-03-21 (post-EA review)
> **Roadmap Ref:** `docs/roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md` — Phase 4
> **EA Review:** `docs/reviews/CVF_PHASE_4_CONSOLIDATION_OPTION_REVIEW_2026-03-21.md`
> **Status:** ✅ SIGNED OFF — Option B* approved (2026-03-21)
> **Prerequisites:** Phase 0 ✅ | Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅

---

## Purpose

Force a governed, evidence-based decision on CVF's physical layout. The system MUST NOT remain in a "facade-only" state without an explicit architectural ruling.

---

## Evidence Summary from Phases 0–3

| Phase | Key Finding |
|-------|------------|
| **Phase 0** | 39 modules classified → 24 KEEP, 12 MERGE (6 pairs), 1 DEPRECATE. 3 active-path critical modules. |
| **Phase 1** | 16 contracts across 4 planes. Boundary violations documented (BV-01…BV-02). |
| **Phase 2** | 4 plane facades deployed in `CVF_PLANE_FACADES`: Governance, Execution, Knowledge, Learning. |
| **Phase 3** | BV-01 (duplicate types) ✅ CLOSED. BV-02 (dual engine) ✅ CLOSED. Net -146 lines. |

### Current Architecture Metrics

| Metric | Value |
|--------|-------|
| Total extension directories | **39** |
| Active-path critical modules | **3** (`GUARD_CONTRACT`, `PHASE_GOV_PROTOCOL`, `AGENT_PLATFORM`) |
| TypeScript source files (non-test) | **~5,993** estimated `package.json` entries |
| Cross-plane facades | **4** (all functioning via delegation) |
| Remaining planned merges (Phase 0 register) | **6 pairs** (ecosystem-level, all 🟡/🟢 criticality) |
| Duplicate subsystems remaining | **0** (Phase 3 closed all) |

---

## Decision Options

### Option A — Stay Federated (NO consolidation merges)

**Description:** Extensions remain as-is in `EXTENSIONS/` with **0 consolidation merges** in this cycle. Facades provide plane-level APIs. Known overlaps remain under-addressed until a future decision cycle.

| Dimension | Assessment |
|-----------|------------|
| **Operational cost** | 🟢 NONE — No migration, no import rewiring. |
| **Developer ergonomics** | 🟡 MEDIUM — 39 directories remain, facades mitigate. |
| **Build/test complexity** | 🟢 NONE — No changes to build pipeline. |
| **Rollback complexity** | 🟢 TRIVIAL — Nothing to roll back. |
| **Governance clarity** | 🟢 HIGH — Phase 0 matrix + facades. |
| **Ownership clarity** | 🟢 HIGH — Each module has plane ownership. |
| **Extension lineage** | 🟢 FULLY PRESERVED |

**Pros:**
- Zero migration risk
- Git history fully preserved
- Independent module testing continues
- Facade layer already provides clean entry points

**Cons:**
- 6 known overlap pairs remain unaddressed
- 39 directories may feel overwhelming to newcomers
- Can drift into "facade-only but never-decide" posture

---

### Option B* — Partial Consolidation (Current-Cycle Evidence-Backed Merges Only)

**Description:** Merge **5 inventory-backed** overlap pairs from Phase 0. Keep active-path critical modules untouched. Defer the 6th pair (Audit/Consensus) which is proposal-derived, not inventory-backed.

**Current-cycle merges (5 pairs):**
1. `CVF_v1.6.1_GOVERNANCE_ENGINE` + `CVF_ECO_v1.1_NL_POLICY` → `CVF_POLICY_ENGINE`
2. `CVF_ECO_v2.3_AGENT_IDENTITY` + `CVF_v1.2_CAPABILITY_EXTENSION` → `CVF_AGENT_DEFINITION`
3. `CVF_v1.2.1_EXTERNAL_INTEGRATION` + `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` → `CVF_MODEL_GATEWAY`
4. `CVF_v1.7.1_SAFETY_RUNTIME` + `CVF_ECO_v2.0_AGENT_GUARD_SDK` → `CVF_TRUST_SANDBOX`
5. `CVF_ECO_v3.0_TASK_MARKETPLACE` + `CVF_ECO_v3.1_REPUTATION` → `CVF_AGENT_LEDGER`

**Explicitly deferred:**
6. ~~Audit/Consensus~~ — proposal-derived (from ADDING proposals R3+R5), not equivalently inventory-backed. Requires separate future review.

| Dimension | Assessment |
|-----------|------------|
| **Operational cost** | 🟡 MEDIUM — 5 merge operations with import rewiring. |
| **Developer ergonomics** | 🟢 HIGH — Reduces from 39 to **~34** directories with clearer names. |
| **Build/test complexity** | 🟡 MEDIUM — Merged modules need new test suites. |
| **Rollback complexity** | 🟡 MEDIUM — Each merge independently reversible (Phase 3 proved this). |
| **Governance clarity** | 🟢 HIGH — Merged modules eliminate ambiguous ownership. |
| **Ownership clarity** | 🟢 HIGH — Plane assignments already defined. |
| **Extension lineage** | 🟡 PARTIAL — Original modules archived as git history. |

**Pros:**
- Eliminates 5 inventory-backed overlap pairs
- Cleaner module names
- Active-path modules untouched
- Each merge is independently testable and reversible
- Scope matches evidence — no over-reach

**Cons:**
- Requires import path updates across consumers
- Test migration needed for each merged module
- 5 separate PRs/batches to manage

---

### Option C — Full Consolidation (MONOREPO-STYLE)

**Description:** Restructure everything into a plane-based directory tree:
```
src/
  governance/
  execution/
  control/
  learning/
  ux/
```

| Dimension | Assessment |
|-----------|-----------|
| **Operational cost** | 🔴 HIGH — Mass file migration, all imports rewritten. |
| **Developer ergonomics** | 🟢 HIGH — Clean, predictable tree structure. |
| **Build/test complexity** | 🔴 HIGH — Entire build/test pipeline restructured. |
| **Rollback complexity** | 🔴 HIGH — Difficult to revert partial migrations. |
| **Governance clarity** | 🟢 HIGH — Directory structure = plane structure. |
| **Ownership clarity** | 🟢 HIGH — Plane-oriented. |
| **Extension lineage** | 🔴 LOST — Git history broken for all moved files. |

**Pros:**
- Maximum structural clarity
- Standard monorepo pattern

**Cons:**
- Big-bang migration risk (all-or-nothing)
- All git history effectively lost for moved files
- Facade layer becomes unnecessary overhead
- High probability of breaking changes across all consumers
- No incremental validation path

---

## Side-by-Side Comparison

| Criterion | A: Stay Federated | B*: Partial (5 merges) | C: Full |
|-----------|:---:|:---:|:---:|
| Migration risk | 🟢 None | 🟡 Low | 🔴 High |
| Rollback safety | 🟢 Trivial | 🟢 Good | 🔴 Poor |
| Developer onboarding | 🟡 39 dirs | 🟢 34 dirs | 🟢 5 top-level |
| Git history preservation | 🟢 Full | 🟡 Partial | 🔴 Lost |
| Build pipeline changes | 🟢 None | 🟡 Some | 🔴 Complete |
| Governance alignment | 🟢 High | 🟢 High | 🟢 High |
| Time to execute | 🟢 ~0h | 🟡 ~1-2 weeks | 🔴 ~4-8 weeks |
| Phase 0 merges addressed | ❌ 0 of 5 | ✅ 5 of 5 (+ 1 deferred) | ✅ All |
| Facade utility | ✅ Used | ✅ Used | ❌ Replaced |

---

## Recommendation

> [!IMPORTANT]
> **Recommended: Option B* — Partial Consolidation, current-cycle scope only**

**Justification:**
1. **Evidence-based:** Phase 0 identified exactly 5 evidence-backed overlap pairs with documented merge targets and owner planes.
2. **Scope-honest:** The 6th pair (Audit/Consensus) is deferred because it is proposal-derived, not inventory-backed.
3. **Proven reversible:** Phase 3 demonstrated that re-export → merge → re-export is safe and independently reversible.
4. **Low risk:** Active-path modules (`GUARD_CONTRACT`, `PHASE_GOV_PROTOCOL`, `AGENT_PLATFORM`) remain untouched.
5. **Incremental:** Each merge is a standalone, testable batch — not a big-bang.
6. **Preserves investment:** Facade layer (Phase 2) continues to provide plane-level APIs above the merged modules.

**Implementation order** (if B* approved):
1. Governance overlaps first (highest governance value)
2. Execution overlaps next (most used)
3. Learning overlaps last (lowest criticality per Phase 0)

### Active GC-019 Packet Chain

Current packet chain for the approved `B*` merge pack:

| Merge | Audit | Independent review | Current posture |
|---|---|---|---|
| `Merge 1` `CVF_POLICY_ENGINE` | `docs/audits/CVF_BSTAR_MERGE_1_POLICY_ENGINE_AUDIT_2026-03-21.md` | `docs/reviews/CVF_GC019_BSTAR_MERGE_1_POLICY_ENGINE_REVIEW_2026-03-21.md` | coordination package approved / physical merge rejected |
| `Merge 2` `CVF_AGENT_DEFINITION` | `docs/audits/CVF_BSTAR_MERGE_2_AGENT_DEFINITION_AUDIT_2026-03-21.md` | `docs/reviews/CVF_GC019_BSTAR_MERGE_2_AGENT_DEFINITION_REVIEW_2026-03-21.md` | coordination package approved / physical merge rejected |
| `Merge 3` `CVF_MODEL_GATEWAY` | `docs/audits/CVF_BSTAR_MERGE_3_MODEL_GATEWAY_AUDIT_2026-03-21.md` | `docs/reviews/CVF_GC019_BSTAR_MERGE_3_MODEL_GATEWAY_REVIEW_2026-03-21.md` | wrapper/re-export merge approved / physical merge rejected |
| `Merge 4` `CVF_TRUST_SANDBOX` | `docs/audits/CVF_BSTAR_MERGE_4_TRUST_SANDBOX_AUDIT_2026-03-21.md` | `docs/reviews/CVF_GC019_BSTAR_MERGE_4_TRUST_SANDBOX_REVIEW_2026-03-21.md` | coordination package approved / physical merge rejected |
| `Merge 5` `CVF_AGENT_LEDGER` | `docs/audits/CVF_BSTAR_MERGE_5_AGENT_LEDGER_AUDIT_2026-03-21.md` | `docs/reviews/CVF_GC019_BSTAR_MERGE_5_AGENT_LEDGER_REVIEW_2026-03-21.md` | physical merge approved with compatibility wrappers |

Batch summary review:

- `docs/reviews/CVF_GC019_BSTAR_MERGE_BATCH_REVIEW_2026-03-21.md`

### Current Execution Status

| Merge | Approved class | Execution status |
|---|---|---|
| `Merge 1` `CVF_POLICY_ENGINE` | coordination package | `IMPLEMENTED` |
| `Merge 2` `CVF_AGENT_DEFINITION` | coordination package | `IMPLEMENTED` |
| `Merge 3` `CVF_MODEL_GATEWAY` | wrapper/re-export merge | `PENDING` |
| `Merge 4` `CVF_TRUST_SANDBOX` | coordination package | `PENDING` |
| `Merge 5` `CVF_AGENT_LEDGER` | physical merge | `PENDING` |

---

## Decision Required

| Option | Your Call |
|--------|---------|
| **A** — Stay Federated (0 consolidation merges this cycle) | ☐ |
| **B*** — Partial Consolidation (5 current-cycle merges + 1 deferred) | ☑ **APPROVED** |
| **C** — Full Consolidation (plane-based tree) | ☐ |

> [!CAUTION]
> This decision is **permanent for the current cycle**. A different option requires a new roadmap and Phase 4 re-review.
