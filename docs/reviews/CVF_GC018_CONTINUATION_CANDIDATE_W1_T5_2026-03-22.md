# CVF GC-018 Continuation Candidate — W1-T5 AI Boardroom Reverse Prompting Contract

Memory class: FULL_RECORD

> Governance control: `GC-018`
> Date: `2026-03-22`
> Type: continuation candidate — new tranche authorization request
> Parent roadmap: `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`
> Predecessor tranche: `W1-T4 — Control-Plane AI Gateway Slice` (CLOSED through CP3)

---

## 1. Authorization Request

Open `W1-T5` as the next bounded realization-first control-plane tranche to deliver **one usable AI Boardroom Reverse Prompting slice**.

---

## 2. Justification

### Why now

- `W1-T4` closed the AI Gateway boundary — external signals now reach intake in a governed form
- `W1-T3` delivered `BoardroomContract` — but it only processes **pre-provided** clarifications; it never generates questions
- The whitepaper explicitly names "AI Boardroom / **Reverse Prompting**" as a distinct capability — not just session-based review
- No existing contract generates targeted clarification questions from intake analysis signals
- This is the highest-impact remaining interactive behavior gap in the control plane

### What this delivers

1. `ReversePromptingContract` — analyzes `ControlPlaneIntakeResult` signals (intent validity, domain confidence, retrieval gaps, context truncation, warnings) and generates priority-ordered clarification questions as a `ReversePromptPacket`
2. `ClarificationRefinementContract` — takes `ReversePromptPacket` + user answers and builds an enriched `RefinedIntakeRequest` for re-intake with higher confidence

### What this does NOT deliver

- full multi-round session orchestration loop (deferred — requires UI/async integration)
- real NLP confidence scoring (uses rule-based signals — injectable for production)
- learning-plane feedback integration (deferred to W4)

### Realization assessment

| Criterion | Met? |
|---|---|
| one runtime behavior materially improved | YES — intake now generates targeted questions instead of silently accepting low-confidence results |
| one real consumer path unlocked | YES — `ControlPlaneIntakeResult → ReversePromptPacket → RefinedIntakeRequest` |
| no tranche that only adds wrapper layer | YES — `ReversePromptingContract` generates questions using intake signals, not just re-labels them |

---

## 3. Scope Boundary

### In scope

- new `CVF_CONTROL_PLANE_FOUNDATION/src/reverse.prompting.contract.ts`
- new `CVF_CONTROL_PLANE_FOUNDATION/src/clarification.refinement.contract.ts`
- barrel export updates in `CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`
- ~15 new tests
- tranche-local governance docs (3 CPs)

### Out of scope

- multi-round session loop orchestration
- UI delivery of questions
- NLP-based confidence scoring
- learning-plane feedback
- any execution-plane changes

---

## 4. Existing Ingredients

| Module | Role |
|---|---|
| `CVF_CONTROL_PLANE_FOUNDATION` (W1-T1 through W1-T4) | host package |
| `ControlPlaneIntakeResult` (W1-T2/CP1) | primary input signal surface |
| `ClarificationEntry` types (W1-T3/CP2, boardroom.contract.ts) | answer structure already defined |
| `computeDeterministicHash` | hash infrastructure |
| `GatewaySignalRequest` (W1-T4/CP1) | used by `ClarificationRefinementContract` to rebuild refined request |

---

## 5. Control Points

| CP | Name | Lane | Scope |
|---|---|---|---|
| CP1 | Reverse Prompting Contract Baseline | Full Lane | `ReversePromptingContract` — ControlPlaneIntakeResult → ReversePromptPacket |
| CP2 | Clarification Refinement Contract | Fast Lane | `ClarificationRefinementContract` — ReversePromptPacket + answers → RefinedIntakeRequest |
| CP3 | Tranche Closure Review | Full Lane | receipts, test evidence, remaining-gap notes |

---

## 6. Depth Audit

- Risk reduction: `3` (closes named whitepaper "Reverse Prompting" capability; low-confidence intake now has an explicit interactive feedback path)
- Decision value: `3` (adds first interactive/generative behavior to the control plane; enables multi-round clarification workflows)
- Machine enforceability: `3` (rule-based signals from existing `ControlPlaneIntakeResult`; deterministic and testable; injectable for production NLP)
- Operational efficiency: `2` (enriched re-intake reduces downstream boardroom AMEND_PLAN/ESCALATE decisions)
- Portfolio priority: `3` (AI Boardroom / CEO Orchestrator is one of the most important PARTIAL whitepaper modules)
- Total: `14`
- Decision: `AUTHORIZE`

---

## 7. Authorization Decision

**AUTHORIZE** — `W1-T5` may proceed as a bounded realization-first control-plane tranche for one usable reverse prompting slice. Rule-based question generation uses injectable signal analyzers (default: deterministic rule-based; production: injectable NLP confidence scorer). Full multi-round session orchestration is deferred. Future work beyond this tranche requires fresh `GC-018`.
