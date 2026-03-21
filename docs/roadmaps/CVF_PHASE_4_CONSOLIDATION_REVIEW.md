# CVF Phase 4 — Mandatory Physical Consolidation Review
> **Date:** 2026-03-21
> **Roadmap Ref:** `docs/roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md` — Phase 4
> **Status:** DECISION PACKET — Pending User Sign-off
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

### Option A — Keep Extension-Based Physical Layout (FEDERATED)

**Description:** Extensions remain in `EXTENSIONS/` as independent directories. Facades delegate to existing modules. Phase 0 merges proceed as planned within `EXTENSIONS/`.

| Dimension | Assessment |
|-----------|-----------|
| **Operational cost** | 🟢 LOW — No migration overhead. Build/deploy unchanged. |
| **Developer ergonomics** | 🟡 MEDIUM — 39 directories need familiarity, but facades provide entry points. |
| **Build/test complexity** | 🟢 LOW — Each extension has own `package.json`/tsconfig. Independent testing. |
| **Rollback complexity** | 🟢 LOW — Changes are always extension-scoped. |
| **Governance clarity** | 🟢 HIGH — Phase 0 ownership matrix + facades define clear boundaries. |
| **Ownership clarity** | 🟢 HIGH — Each module has explicit plane ownership. |
| **Extension lineage** | 🟢 PRESERVED — Version history intact per extension. |

**Pros:**
- No migration risk
- Git history fully preserved
- Independent module testing continues
- Facade layer already provides clean entry points
- Phase 0 merges can proceed incrementally within EXTENSIONS/

**Cons:**
- 39 directories may feel overwhelming to newcomers
- Some directory names carry version history that's no longer meaningful
- `import` paths require path mapping or relative traversal

---

### Option B — Partial Consolidation (HYBRID)

**Description:** Merge the 6 overlap pairs from Phase 0 into consolidated modules. Keep active-path critical modules (`GUARD_CONTRACT`, `PHASE_GOV_PROTOCOL`, `AGENT_PLATFORM`) in place. Consolidate remaining ecosystem modules by plane.

**Proposed consolidation:**
1. `CVF_v1.6.1_GOVERNANCE_ENGINE` + `CVF_ECO_v1.1_NL_POLICY` → `CVF_POLICY_ENGINE`
2. `CVF_ECO_v2.3_AGENT_IDENTITY` + `CVF_v1.2_CAPABILITY_EXTENSION` → `CVF_AGENT_DEFINITION`
3. `CVF_v1.2.1_EXTERNAL_INTEGRATION` + `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` → `CVF_MODEL_GATEWAY`
4. `CVF_v1.7.1_SAFETY_RUNTIME` + `CVF_ECO_v2.0_AGENT_GUARD_SDK` → `CVF_TRUST_SANDBOX`
5. `CVF_ECO_v3.0_TASK_MARKETPLACE` + `CVF_ECO_v3.1_REPUTATION` → `CVF_AGENT_LEDGER`
6. *(Audit/Consensus — future, from ADDING proposals)*

| Dimension | Assessment |
|-----------|-----------|
| **Operational cost** | 🟡 MEDIUM — 6 merge operations with import rewiring. |
| **Developer ergonomics** | 🟢 HIGH — Reduces from 39 to ~33 directories with clearer names. |
| **Build/test complexity** | 🟡 MEDIUM — Merged modules need new test suites. |
| **Rollback complexity** | 🟡 MEDIUM — Each merge independently reversible (Phase 3 proved this). |
| **Governance clarity** | 🟢 HIGH — Merged modules eliminate ambiguous ownership. |
| **Ownership clarity** | 🟢 HIGH — Plane assignments already defined. |
| **Extension lineage** | 🟡 PARTIAL — Original modules archived as git history. |

**Pros:**
- Eliminates 6 known overlap pairs
- Cleaner module names
- Active-path modules untouched
- Each merge is independently testable and reversible

**Cons:**
- Requires import path updates across consumers
- Test migration needed for each merged module
- 6 separate PRs/batches to manage

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

| Criterion | A: Federated | B: Partial | C: Full |
|-----------|:---:|:---:|:---:|
| Migration risk | 🟢 None | 🟡 Low | 🔴 High |
| Rollback safety | 🟢 Trivial | 🟢 Good | 🔴 Poor |
| Developer onboarding | 🟡 39 dirs | 🟢 33 dirs | 🟢 5 top-level |
| Git history preservation | 🟢 Full | 🟡 Partial | 🔴 Lost |
| Build pipeline changes | 🟢 None | 🟡 Some | 🔴 Complete |
| Governance alignment | 🟢 High | 🟢 High | 🟢 High |
| Time to execute | 🟢 ~0h | 🟡 ~1-2 weeks | 🔴 ~4-8 weeks |
| Phase 0 merges addressed | ❌ Deferred | ✅ All 6 | ✅ All 6 |
| Facade utility | ✅ Used | ✅ Used | ❌ Replaced |

---

## Recommendation

> [!IMPORTANT]
> **Recommended: Option B — Partial Consolidation**

**Justification:**
1. **Evidence-based:** Phase 0 identified exactly 6 overlap pairs, all documented with merge targets and owner planes.
2. **Proven reversible:** Phase 3 demonstrated that re-export → merge → re-export is safe and independently reversible.
3. **Low risk:** Active-path modules (`GUARD_CONTRACT`, `PHASE_GOV_PROTOCOL`, `AGENT_PLATFORM`) remain untouched.
4. **Incremental:** Each merge is a standalone, testable batch — not a big-bang.
5. **Preserves investment:** Facade layer (Phase 2) continues to provide plane-level APIs above the merged modules.

**Implementation order** (if Option B approved):
1. Governance overlaps first (highest governance value)
2. Execution overlaps next (most used)
3. Learning overlaps last (lowest criticality per Phase 0)

---

## Decision Required

| Option | Your Call |
|--------|----------|
| **A** — Stay Federated (0 merges, keep facades only) | ☐ |
| **B** — Partial Consolidation (6 merges + facades) | ☐ ← Recommended |
| **C** — Full Consolidation (plane-based tree) | ☐ |

> [!CAUTION]
> This decision is **permanent for the current cycle**. A different option requires a new roadmap and Phase 4 re-review.
