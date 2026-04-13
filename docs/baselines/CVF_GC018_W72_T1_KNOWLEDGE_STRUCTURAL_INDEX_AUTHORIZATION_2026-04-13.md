# CVF GC-018 W72-T1 — Knowledge Structural Index Authorization

Memory class: FULL_RECORD

> Date: 2026-04-13
> Candidate ID: GC018-W72-T1-KNOWLEDGE-STRUCTURAL-INDEX
> Doctrine audit: `docs/baselines/CVF_W72_T1_KNOWLEDGE_STRUCTURAL_INDEX_GC021_FAST_LANE_AUDIT_2026-04-13.md`
> Intake packet: `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_SYNTHESIS_NOTE_2026-04-13.md`
> Branch: `main`
> Prior authorization: `docs/baselines/CVF_GC018_W67_T1_EXTERNAL_ASSET_PRODUCTIZATION_AUTHORIZATION_2026-04-13.md`

---

## Prerequisites Confirmed

| Prerequisite | Status |
|---|---|
| Doctrine/governance documentation step complete (per handoff sequence) | CONFIRMED — Fast Lane audit filed: `CVF_W72_T1_KNOWLEDGE_STRUCTURAL_INDEX_GC021_FAST_LANE_AUDIT_2026-04-13.md` |
| Synthesis note and promotion map used as intake (not source folders) | CONFIRMED — see Fast Lane audit §6 |
| Wave type explicitly declared as `implementation-capability` | CONFIRMED — structural-index as Knowledge Layer enhancement |
| First implementation candidate confirmed as Graphify structural-index | CONFIRMED — per handoff §required-sequence step 4 |
| No-new-surface rule confirmed | CONFIRMED — StructuralIndexContract is additive sibling in existing CPF barrel |
| CPF baseline clean (2026-04-13) | CONFIRMED — 2999 tests, 0 failures |
| GC-023 compliance pre-checked | CONFIRMED — new files under all thresholds; barrel delta ~15 lines |
| PVV/API-key work remains paused | CONFIRMED — no overlap; CPF Knowledge Layer is separate surface |
| Boundary: no existing contract edits | CONFIRMED — additive only |

---

## GC-018 Continuation Candidate

```
GC-018 Continuation Candidate
- Candidate ID: GC018-W72-T1-KNOWLEDGE-STRUCTURAL-INDEX
- Date: 2026-04-13
- Parent doctrine audit: docs/baselines/CVF_W72_T1_KNOWLEDGE_STRUCTURAL_INDEX_GC021_FAST_LANE_AUDIT_2026-04-13.md
- Intake packet: docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_SYNTHESIS_NOTE_2026-04-13.md
- Proposed scope: W72-T1 — Knowledge Layer Structural Index Enhancement
  Add StructuralIndexContract + StructuralIndexBatchContract to CPF Knowledge Layer.
  StructuralIndexContract.index() performs bounded BFS traversal over a declared
  set of entities and directed relations (depends_on | related_to | extends | supersedes),
  returning neighbors up to maxDepth with deterministic hash.
  StructuralIndexBatchContract.batch() wraps multiple index requests following
  the established CPF batch contract pattern.
  Both contracts are additive siblings of KnowledgeQueryContract and
  KnowledgeRankingContract in control.plane.knowledge.barrel.ts.
- Continuation class: REALIZATION
- Active test baseline: CPF 2999 / EPF 1301 / GEF 625 / LPF 1493 all pass (2026-04-13)
- Weighted total: baseline verified
- Lowest dimension: Knowledge Layer structural navigation (real gap, confirmed by synthesis note)
- Quality-first decision: EXPAND_NOW
- Why expansion is the right move now:
    The synthesis note established a real structural-index gap in Knowledge Layer.
    The gap is bounded, the owner surface is mature and tested (2999 CPF tests),
    and the batch contract pattern is well-established (W33-T1 is the direct analogue).
    Implementing now closes a documented gap with minimal blast radius.
- Quality protection commitments:
    - tsc + vitest must pass before commit
    - GC-023 file-size compliance at every commit
    - No changes to existing contracts or tests
    - No changes to cvf-web, provider adapters, or PVV surfaces
    - No new guard family, no CLI surface, no whitepaper edit
- Why now: the synthesis lane is freshly closed and the intake packet is
    the cleanest possible starting point. Delay introduces drift risk.
- Active-path impact: NONE — no provider execution, no PVV lane, no runtime change
- Risk if deferred: the structural-index gap remains open; future agents
    re-litigate the Graphify assessment instead of implementing from the synthesis note
- Lateral alternative considered: YES — doctrine-only wave (no code)
- Why not lateral shift: doctrine documentation step already completed (Fast Lane audit).
    The synthesis note already serves as the CVF-native doctrine document.
    An additional prose-only wave would produce redundancy, not value.
- Real decision boundary improved: YES — Knowledge Layer gains a structural
    retrieval mode; future context packaging can use graph-informed inputs
- Expected enforcement class: CONTRACT (governed batch contract with deterministic hash)
- Required evidence if approved:
    - tsc clean
    - all new tests pass
    - no regressions in existing CPF tests
    - control.plane.knowledge.barrel.ts exports StructuralIndexContract + batch
    - GC-023 violations: 0
```

---

## Authorization Decision

**AUTHORIZED — proceed with W72-T1 implementation immediately.**

Scope is tightly bounded:
- CPF Knowledge Layer only: 2 new source files + 2 new test files + barrel export additions
- No edits to existing CPF contracts or tests
- No changes to EPF, GEF, LPF, or cvf-web
- No provider adapters, PVV lanes, or execution plane changes
- No new architecture surface, no new guard family, no CLI surface

---

*Filed: 2026-04-13*
*Authorization: OPERATOR (GC018-W72-T1-KNOWLEDGE-STRUCTURAL-INDEX)*
