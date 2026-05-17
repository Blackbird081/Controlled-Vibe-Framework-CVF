# CVF Post-W7 Canonical Exclusion Template — "Not In This Wave"

Memory class: POINTER_RECORD

> Purpose: reusable template to declare explicit out-of-scope items in every post-W7 GC-018 continuation candidate packet
> Authority: P0 governance hardening deliverable per `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`
> Baseline: v3.0-W7T10

---

## Usage Rule

Every post-W7 GC-018 packet MUST include one "Not In This Wave" block using this template. Omitting this block fails gate G3.

Copy the block below into the GC-018 packet and fill in each entry.

---

## Template Block

```text
Not In This Wave
- wave: <W{N}-T{N}>
- family: <Candidate A | B | C | D>

Explicitly excluded:
- item: <Agent Definition merge work>
  - reason: excluded unless blocking dependency proven with code-traceable evidence
- item: <L0-L4 risk-model migration>
  - reason: out of scope unless opened as a separate, explicitly justified proposal
- item: <omnibus post-W7 continuation>
  - reason: forbidden; one proposal family per GC-018 only
- item: <benchmark target numbers as current baseline truth>
  - reason: performance numbers remain PROPOSAL ONLY until benchmark evidence exists (Candidate C must close first)
- item: <Candidate D reputation/marketplace expansion>
  - reason: HOLD until first structural family and performance baseline are underway or closed
- item: <[wave-specific exclusion 1]>
  - reason: [wave-specific justification]
- item: <[wave-specific exclusion 2]>
  - reason: [wave-specific justification]

Exclusion enforcement:
- reviewer must confirm each item above is absent from scope before authorizing
- if any item appears in the implementation artifact list, the GC-018 packet is invalid and must be re-issued
```

---

## Permanent Exclusions (apply to every post-W7 wave)

These items are ALWAYS excluded unless a separate, explicitly justified proposal is opened:

| Item | Exclusion Rule |
|---|---|
| Omnibus bundled post-W7 continuation | Forbidden — one family per GC-018 |
| Agent Definition merge work | Excluded from W8-T1; requires blocking-dependency proof |
| L0–L4 risk-model migration | Requires separate proposal |
| Benchmark targets as current baseline truth | Requires Candidate C instrumentation evidence first |
| Candidate D (Reputation / Marketplace expansion) | HOLD — later wave only |

---

## Related Controls

- `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md` — gate G3
- `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_POST_W7_OPEN_TARGETS_2026-03-28.md` — pass conditions 1, 3, 8
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
- `docs/reference/CVF_POST_W7_GC018_DRAFTING_CHECKLIST.md`
