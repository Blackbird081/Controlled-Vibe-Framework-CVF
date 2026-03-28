# CVF W1-T5 — AI Boardroom Reverse Prompting Execution Plan

Memory class: SUMMARY_RECORD
> Date: `2026-03-22`
> Tranche: `W1-T5 — AI Boardroom Reverse Prompting Contract`
> Authorized by: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T5_2026-03-22.md`
> Parent roadmap: `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`

---

## Tranche Goal

Deliver one bounded usable AI Boardroom Reverse Prompting slice — the first contract in the control plane that **generates** targeted clarification questions from `ControlPlaneIntakeResult` signals rather than merely accepting pre-provided clarifications.

---

## Control Points

| CP | Name | Lane | Deliverables |
|---|---|---|---|
| CP1 | Reverse Prompting Contract Baseline | Full Lane | `reverse.prompting.contract.ts`, ~10 tests, audit + review + delta docs |
| CP2 | Clarification Refinement Contract | Fast Lane | `clarification.refinement.contract.ts`, ~5 tests, audit + review + delta docs |
| CP3 | Tranche Closure Review | Full Lane | tranche closure audit + review + delta + tranche closure summary |

---

## CP1 — Reverse Prompting Contract Baseline (Full Lane)

### Source deliverable

`EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/reverse.prompting.contract.ts`

### Contract signature

```typescript
ReversePromptingContract.generate(intakeResult: ControlPlaneIntakeResult): ReversePromptPacket
```

### Signal surface analyzed

| Signal | Source field | Question category triggered |
|---|---|---|
| Intent not valid | `intent.valid === false` | `intent_clarity` (high) |
| Domain is general/unknown | `intent.intent.domain === "general"` | `domain_specificity` (high) |
| No retrieval chunks | `retrieval.chunkCount === 0` | `context_gap` (high) |
| Context truncated | `packagedContext.truncated === true` | `scope_boundary` (medium) |
| Warnings present | `warnings.length > 0` | `risk_acknowledgement` (medium) |

### Key types

- `QuestionCategory`: `intent_clarity | domain_specificity | scope_boundary | risk_acknowledgement | context_gap`
- `QuestionPriority`: `high | medium | low`
- `ClarificationQuestion`: `{ questionId, category, priority, question, signal }`
- `SignalAnalysis`: `{ intentValid, domainDetected, retrievalEmpty, contextTruncated, hasWarnings, warningCount }`
- `ReversePromptPacket`: `{ packetId, createdAt, sourceRequestId, questions[], totalQuestions, highPriorityCount, signalAnalysis }`

### Injectable dependency

```typescript
analyzeSignals?: (result: ControlPlaneIntakeResult) => SignalAnalysis
```

Default: deterministic rule-based analyzer using `ControlPlaneIntakeResult` fields.

---

## CP2 — Clarification Refinement Contract (Fast Lane)

### Source deliverable

`EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/clarification.refinement.contract.ts`

### Contract signature

```typescript
ClarificationRefinementContract.refine(
  packet: ReversePromptPacket,
  answers: ClarificationAnswer[]
): RefinedIntakeRequest
```

### Key types

- `ClarificationAnswer`: `{ questionId, answer }`
- `RefinementEnrichment`: `{ category, questionId, answer, applied }`
- `RefinedIntakeRequest`: `{ refinedId, createdAt, sourcePacketId, originalRequestId, refinedVibe, enrichments[], answeredCount, skippedCount, confidenceBoost }`

### Confidence boost calculation

`confidenceBoost = answeredCount / totalQuestions` (capped at 1.0). This is a deterministic approximation — injectable for production NLP-based scoring.

---

## CP3 — Tranche Closure (Full Lane)

- Test evidence: ~15 new tests (target CPF: 99 → ~114; total: 157 → ~172)
- All governance artifacts issued per GC-022 memory classification
- Whitepaper gap: `AI Boardroom / CEO Orchestrator` moves from `PARTIAL` (design/orchestration slice only) toward deeper interactive behavior

---

## Governance Artifacts (this tranche)

| File | Type | CP |
|---|---|---|
| `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W1_T5_2026-03-22.md` | FULL_RECORD | Pre-tranche |
| `docs/roadmaps/CVF_W1_T5_REVERSE_PROMPTING_EXECUTION_PLAN_2026-03-22.md` | SUMMARY_RECORD | Pre-tranche |
| `docs/baselines/CVF_WHITEPAPER_GC018_W1_T5_AUTHORIZATION_DELTA_2026-03-22.md` | SUMMARY_RECORD | Pre-tranche |
| `docs/audits/CVF_W1_T5_CP1_REVERSE_PROMPTING_CONTRACT_AUDIT_2026-03-22.md` | FULL_RECORD | CP1 |
| `docs/reviews/CVF_GC019_W1_T5_CP1_REVERSE_PROMPTING_CONTRACT_REVIEW_2026-03-22.md` | FULL_RECORD | CP1 |
| `docs/baselines/CVF_W1_T5_CP1_REVERSE_PROMPTING_CONTRACT_IMPLEMENTATION_DELTA_2026-03-22.md` | SUMMARY_RECORD | CP1 |
| `docs/audits/CVF_W1_T5_CP2_CLARIFICATION_REFINEMENT_CONTRACT_AUDIT_2026-03-22.md` | FULL_RECORD | CP2 |
| `docs/reviews/CVF_GC019_W1_T5_CP2_CLARIFICATION_REFINEMENT_CONTRACT_REVIEW_2026-03-22.md` | FULL_RECORD | CP2 |
| `docs/baselines/CVF_W1_T5_CP2_CLARIFICATION_REFINEMENT_CONTRACT_IMPLEMENTATION_DELTA_2026-03-22.md` | SUMMARY_RECORD | CP2 |
| `docs/audits/CVF_W1_T5_CP3_TRANCHE_CLOSURE_AUDIT_2026-03-22.md` | FULL_RECORD | CP3 |
| `docs/reviews/CVF_GC019_W1_T5_CP3_TRANCHE_CLOSURE_REVIEW_2026-03-22.md` | FULL_RECORD | CP3 |
| `docs/baselines/CVF_W1_T5_CP3_TRANCHE_CLOSURE_DELTA_2026-03-22.md` | SUMMARY_RECORD | CP3 |
| `docs/reviews/CVF_W1_T5_REVERSE_PROMPTING_TRANCHE_CLOSURE_REVIEW_2026-03-22.md` | FULL_RECORD | CP3 |
