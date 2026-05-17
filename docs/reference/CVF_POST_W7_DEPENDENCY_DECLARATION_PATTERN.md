# CVF Post-W7 Canonical Dependency Declaration Pattern

Memory class: POINTER_RECORD

> Purpose: reusable pattern to declare inter-family and intra-wave dependencies in every post-W7 GC-018 continuation candidate packet
> Authority: P0 governance hardening deliverable per `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`
> Baseline: v3.0-W7T10

---

## Usage Rule

Every post-W7 GC-018 packet MUST include one dependency declaration block using this pattern. Omitting this block fails gate G4. If the packet touches the W7 dependency chain, it must also satisfy gate G5.

Copy the block below into the GC-018 packet and fill in each entry.

---

## Template Block

```text
Dependency Declaration
- wave: <W{N}-T{N}>
- family: <Candidate A | B | C | D>

Upstream dependencies (what this wave consumes as fixed inputs):
- dep: <W7-T10 governance integration chain>
  - status: FIXED — do not modify
  - consumed as: architecture baseline v3.0-W7T10
- dep: <[upstream dependency 1]>
  - status: FIXED | IN_MOTION | UNKNOWN
  - consumed as: <description of how this wave uses it>
- dep: <[upstream dependency 2]>
  - status: FIXED | IN_MOTION | UNKNOWN
  - consumed as: <description>

Downstream dependents (what will consume this wave's output):
- dep: <Candidate B — RAG + Context Engine convergence>
  - dependency type: GATEWAY_STABILITY — must declare which AI Gateway assumptions are fixed
  - blocked until: this wave freezes the relevant gateway contract surfaces
- dep: <[downstream family]>
  - dependency type: <type>
  - blocked until: <condition>

W7 chain impact assessment (required if any dep touches Runtime/Artifact/Trace/Planner/Decision/Eval/Memory):
- chain link: Runtime
  - impact: NONE | READ_ONLY | ADDITIVE | STRUCTURAL
  - justification: <why>
- chain link: Artifact
  - impact: NONE | READ_ONLY | ADDITIVE | STRUCTURAL
  - justification: <why>
- chain link: Trace
  - impact: NONE | READ_ONLY | ADDITIVE | STRUCTURAL
  - justification: <why>
- chain link: Planner
  - impact: NONE | READ_ONLY | ADDITIVE | STRUCTURAL
  - justification: <why>
- chain link: Decision
  - impact: NONE | READ_ONLY | ADDITIVE | STRUCTURAL
  - justification: <why>
- chain link: Eval/Builder
  - impact: NONE | READ_ONLY | ADDITIVE | STRUCTURAL
  - justification: <why>
- chain link: Memory
  - impact: NONE | READ_ONLY | ADDITIVE | STRUCTURAL
  - justification: <why>

Non-destabilization posture:
- rollback strategy: <how to revert if this wave's output breaks downstream>
- destabilization threshold: ACCEPTABLE | UNACCEPTABLE
- if UNACCEPTABLE: Candidate B becomes default reconsideration path per roadmap section 6.2
```

---

## Fixed Dependency Order (canonical for all post-W7 waves)

```
P0 governance hardening
  → P1 Candidate A authorization (W8-T1)
  → P2 Candidate C authorization (W8-T2, parallel-capable with P1)
  → P3 Candidate A execution wave
  → P4 Candidate B wave (gateway assumptions declared against P3 output)
  → P5 Candidate D wave (downstream of P3 + P4)
```

Non-negotiable transitions:

- no Candidate A wave without W7 impact assessment (G5)
- no Candidate B wave without declared gateway assumptions (G7)
- no Candidate D wave before the first structural family and performance baseline are underway or closed (G8)
- no risk-model migration hidden inside any of the above phases

---

## Related Controls

- `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md` — gates G4, G5, G7, G8
- `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_POST_W7_OPEN_TARGETS_2026-03-28.md` — pass conditions 2, 4, 5
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
- `docs/reference/CVF_POST_W7_EXCLUSION_TEMPLATE.md`
- `docs/reference/CVF_POST_W7_GC018_DRAFTING_CHECKLIST.md`
