<!-- Memory class: SUMMARY_RECORD -->

# CVF W123 Continuity Surface Inventory

> Date: 2026-04-27
> Scope: W123-T1 — Noncoder Iteration Memory And Follow-Up Continuity
> Purpose: Pre-flight lock of continuity surfaces, storage mode, feature flag, and continuity schema before CP1 implementation

---

## 1. Storage Mode (Locked)

**Browser-local persistence only** via the existing Zustand store with `persist` middleware.

- Store key: `cvf-executions-storage` (localStorage)
- No server-side project database, no cross-device sync, no new persistence layer
- Continuity metadata lives inside the existing `Execution` objects in `executions[]`

---

## 2. Feature Flag Contract

```
NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true|false
```

- Default: `false` throughout W123 implementation
- Flip to `true` only after CP6 (live evidence pack) closes
- Controls: continuity thread UI in HistoryList, thread labeling in ResultViewer, "continue this work" CTA in history
- Rollback: flip flag to `false` — no code revert needed

---

## 3. Continuity Schema (Locked)

The canonical continuity object fields added to `Execution`:

| Field | Type | Required | Description |
|---|---|---|---|
| `threadId` | `string` | on follow-up | Shared across all executions in the same continuation chain |
| `rootExecutionId` | `string` | on follow-up | ID of the first execution in the chain |
| `parentExecutionId` | `string` | on follow-up | Direct predecessor execution ID |
| `projectLabel` | `string?` | optional | User-facing name for the thread |
| `knowledgeCollectionId` | `string?` | optional | Collection carried forward into this run |
| `evidenceReceiptSnapshot` | `ExecutionEvidenceSnapshot?` | optional | Snapshot of key receipt fields at run time |
| `starterSource` | `'template' \| 'wizard' \| 'intent-router' \| 'history-followup'` | optional | How this execution was initiated |

Root execution (first in thread): `threadId === rootExecutionId`, no `parentExecutionId`.

---

## 4. Current Continuity Surfaces

### 4.1 `src/lib/store.ts`
- `useExecutionStore` — Zustand store with `persist` middleware
- Existing selectors: `getExecutionById`, `addExecution`, `updateExecution`
- Gap: no thread helpers, no `continueExecution`, no `getThreadExecutions`
- W123 action: extend with thread selectors and `continueExecution` helper

### 4.2 `src/types/index.ts`
- `Execution` interface: `id`, `templateId`, `templateName`, `category`, `input`, `intent`, `output`, `status`, `result`, `qualityScore`, `createdAt`, `completedAt`
- Gap: no continuity fields (`threadId`, `parentExecutionId`, etc.)
- W123 action: add optional continuity fields + `ExecutionEvidenceSnapshot` interface

### 4.3 `src/components/ResultViewer.tsx`
- `onFollowUp?: (refinement: string)` prop already exists (W97-T1)
- `evidenceReceipt?: GovernanceEvidenceReceipt` already visible (W119-T1)
- Gap: follow-up callback does not yet link to a parent thread — is a transient UI callback only
- W123 action: thread follow-up via `parentExecutionId` into the continuation chain

### 4.4 `src/app/(dashboard)/home/page.tsx`
- `iterationContext` ephemeral state already tracks follow-up output
- `handleFollowUp` callback chains `_previousOutput` into next execution
- Gap: follow-up creates a new standalone execution, not a continuation child
- W123 action: propagate continuity fields when creating follow-up execution

### 4.5 `src/app/(dashboard)/history/page.tsx` + `src/components/HistoryList.tsx`
- History lists all executions by `createdAt` desc
- `onSelect` opens the execution result in home
- Gap: no thread grouping, no "continue this work" CTA, no project label display
- W123 action: add thread-group display + continue-work CTA (behind flag)

### 4.6 `src/app/api/execute/route.ts` — `_previousOutput` path
- `route.followup.test.ts` already covers follow-up prompt threading
- Gap: no continuity metadata is threaded through — the API is not aware of thread
- W123 action: no API-side changes needed; continuity metadata is client-side only

### 4.7 New files (to be created in CP1)
- `src/lib/execution-continuity.ts` — continuity helpers (`buildContinuationExecution`, `getThreadExecutions`, etc.)
- `src/lib/execution-continuity.test.ts` — unit tests for CP1/CP5

---

## 5. Out Of Scope Surfaces

- `src/lib/knowledge-retrieval.ts` — knowledge store not modified; `knowledgeCollectionId` threaded by value only
- `src/app/api/execute/route.ts` — no server-side continuity changes
- `src/lib/intent-router.ts` — W122 surface, not touched
- `src/components/OnboardingTour.tsx` — not a continuity surface
- `governance/` — no governance runtime changes
