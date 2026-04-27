<!-- Memory class: SUMMARY_RECORD -->

# CVF W123-T1 Noncoder Iteration Memory And Follow-Up Continuity Roadmap

> Date: 2026-04-27
> Status: CLOSED DELIVERED — All CPs delivered; vitest 77/77 targeted pass; Playwright 6 passed / 1 skipped; release gate bundle PASS 7/7 on 2026-04-27
> Scope class: NONCODER CONTINUITY / FOLLOW-UP PRODUCTIZATION / PROJECT MEMORY
> Predecessor: W119-T1 CLOSED DELIVERED 2026-04-23; W122-T1 CLOSED DELIVERED 2026-04-27
> Authorization: `docs/baselines/CVF_GC018_W123_T1_NONCODER_ITERATION_MEMORY_AND_FOLLOW_UP_CONTINUITY_AUTHORIZATION_2026-04-27.md`
> Closure tracker: `docs/baselines/CVF_GC026_TRACKER_SYNC_W123_T1_CLOSED_2026-04-27.md`
> Wave ID: W123

---

## 0. Why This Is Next

CVF has already proven two important noncoder claims:

- W119 proved a non-coder can complete a governed first useful workflow and leave
  with visible evidence on the active Web `/api/execute` path.
- W122 proved a non-coder can start from an intent-first front door and be
  routed into the right trusted wizard-family starter path without manual
  catalog-first selection.

The next bottleneck is no longer entry quality. It is continuity quality.

Today, a non-coder can start and finish one governed run, and they can trigger a
follow-up from the current result screen. But the continuity model is still too
fragile for repeat work:

- follow-up context is threaded through `_previousOutput`, but largely as an
  in-flight prompt concern
- iteration context is still anchored in page state, not a first-class thread
- execution history exists, but it is not yet a real "continue this work"
  surface
- knowledge continuity is present on the API path, but not yet positioned as a
  project default the user can trust over repeated runs
- evidence receipts are visible per run, but not yet framed as a chain the user
  can carry across a multi-step project

The next high-value move is to make continuation itself feel native:

> A non-coder returns to prior work, continues from the right output with the
> right context, and keeps governance evidence and project knowledge continuity
> without rebuilding the task from scratch.

---

## 1. Product Claim Target

W123 should make this bounded claim true:

> A non-coder can reopen a completed CVF result, continue the same work in a
> persistent local thread, preserve prior output + knowledge context + evidence
> continuity, and run a governed follow-up without manually reconstructing
> context.

This is bounded to:

- browser-local persisted continuity using the existing Web client store
- the active governed Web `/api/execute` path only
- the current template and wizard execution model already delivered in W119/W122
- continuity across runs on the same device/browser, not cross-device sync
- project memory as a local product surface, not a multi-user collaboration
  system

This wave does **not** claim:

- server-backed project workspaces
- universal cross-browser or cross-device resume
- organization-wide project sharing
- provider parity
- a full document/version-management system

---

## 2. Current State Readout

As of the current repo state after W122:

- `useExecutionStore` already persists `executions` + `currentExecution` to
  browser localStorage via Zustand persist in
  `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/store.ts`
- `ResultViewer` already exposes a follow-up action and threads the next prompt
  from the current result in
  `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ResultViewer.tsx`
- `/api/execute` already supports `_previousOutput` prompt threading, covered by
  `route.followup.test.ts`
- Home already keeps an ephemeral `iterationContext` and starter handoff state
  in `src/app/(dashboard)/home/page.tsx`
- History already lists executions and can reopen an execution via Home in
  `src/app/(dashboard)/history/page.tsx`
- route-returned `governanceEvidenceReceipt` already exposes continuity-relevant
  metadata such as `decision`, `riskLevel`, `knowledgeCollectionId`, and
  provider/model provenance

The gap is not missing primitives. The gap is that these primitives are still
assembled as single-run UX, not as a true continuation model.

Concretely:

- there is no first-class thread/project identity connecting run N to run N+1
- follow-up chains are not surfaced as durable objects in history
- evidence receipts are visible per run but not navigable as a continuity chain
- knowledge collection continuity is not positioned as the default project memory
  anchor
- there is no strong "continue this work" contract from history back into a
  governed continuation flow

---

## 3. Non-Goals

- No external database or server-backed project store
- No cross-device sync promise
- No org/team collaboration model
- No broad execution-engine or governance-runtime reopen
- No form/template corpus expansion as part of W123
- No provider-lane claim expansion
- No replacement of the existing W122 intent-first front door
- No requirement to persist arbitrary drafts for every wizard step in this wave
- No reopening of knowledge-store architecture beyond threading existing
  `knowledgeCollectionId` continuity correctly

---

## 4. Checkpoints

### CP0 — Pre-flight, Data-Boundary Lock, And Feature Flag

**Deliver**

Before continuity implementation starts, lock the bounded data model and rollout
surface:

1. Produce a short review artifact:
   `docs/reviews/W123_CONTINUITY_SURFACE_INVENTORY.md`
   covering the current continuity surfaces:
   `store.ts`, `ResultViewer.tsx`, `home/page.tsx`, `history/page.tsx`,
   `route.followup.test.ts`, and any helper added by W123.
2. Confirm storage mode for W123 is **browser-local persistence only** via the
   existing Zustand store.
3. Add rollout flag contract:
   `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true|false`
   with default `false` until W123 closes.
4. Lock the continuity unit:
   - `threadId` = continuity chain of related executions
   - `rootExecutionId` = first execution in that chain
   - `parentExecutionId` = direct previous execution when the new run is a
     follow-up
   - optional `projectLabel` = user-facing name for the thread

**Acceptance**

- pre-flight artifact merged before CP1
- local-only storage boundary is explicit
- feature flag is declared and documented
- continuity schema terms are fixed before UI work starts

### CP1 — Execution Continuity Model

**Deliver**

Create the minimal continuity model required for repeat work without inventing a
new platform layer.

Expected implementation shape:

- extend `Execution` metadata or add a tightly scoped continuity helper so each
  execution can carry:
  - `threadId`
  - `rootExecutionId`
  - `parentExecutionId?`
  - `projectLabel?`
  - `knowledgeCollectionId?`
  - `evidenceReceiptSnapshot?`
  - `starterSource?` (`template`, `wizard`, `intent-router`, `history-followup`)
- add store helpers/selectors such as:
  - `getThreadExecutions(threadId)`
  - `getRootExecution(rootExecutionId)`
  - `continueExecution(executionId, continuationInput)`
  - `setProjectLabel(threadId, label)`

This checkpoint should stay sympathetic to the current architecture:

- reuse `useExecutionStore`
- keep browser persistence through Zustand
- avoid creating a separate persistence system unless a small helper file
  materially reduces complexity

**Acceptance**

- every new follow-up execution can be linked to a parent/root chain
- continuity metadata survives reload because it lives in the persisted store
- no unrelated governance/store architecture is reopened

### CP2 — Follow-Up Continuity From Result To Next Run

**Deliver**

Turn the existing follow-up affordance into a true continuation workflow.

Expected behavior:

- when a non-coder runs follow-up from `ResultViewer`, the next execution is
  recorded as a child of the selected result
- `_previousOutput` remains part of the execution prompt path
- prior `knowledgeCollectionId` becomes the default knowledge target for the
  next run when applicable
- prior evidence receipt is snapshotted into the continuity chain
- the new execution is recoverable after reload as part of the same thread

This is the core product move for W123: follow-up becomes a durable chain, not
just a transient UI callback.

**Acceptance**

- follow-up creates linked execution metadata
- prompt threading remains correct
- continuity survives page refresh
- targeted tests prove no loss of follow-up context

### CP3 — History Becomes A Continue-Work Surface

**Deliver**

Upgrade the current history experience so it supports continuation, not only
inspection.

Expected behavior:

- history can group or at least clearly label executions by thread/project
- a user can re-open a prior execution and choose a clear "continue this work"
  path
- history preserves enough context to restore the right continuation anchor
  without forcing the user to restate the task
- project/thread naming is visible and editable in a bounded way

This checkpoint should prefer narrow UI changes:

- do not build a new standalone workspace/project subsystem
- extend `HistoryList`, `history/page.tsx`, and Home handoff behavior only as
  needed

**Acceptance**

- history is usable as a continuation entry surface
- at least one clear continue-work CTA exists
- thread/project labeling is visible on persisted runs

### CP4 — Knowledge Continuity As Project Default

**Deliver**

Make existing knowledge continuity explicit and reliable across a thread.

Expected behavior:

- if an execution used `knowledgeCollectionId`, the continuation path keeps that
  collection as the default unless the user deliberately changes it
- the active knowledge collection is visible in the continuity UI
- history/reopen flows preserve the knowledge anchor
- follow-up on a knowledge-assisted run does not silently drop into
  collection-less execution

This checkpoint should reuse the existing knowledge path, not invent a new
store:

- no new ingestion pipeline
- no new knowledge persistence backend
- only continuity threading and visibility improvements

**Acceptance**

- knowledge-assisted follow-up preserves collection continuity
- the user can see which collection is being carried forward
- targeted tests cover continuity and opt-out behavior

### CP5 — Evidence Continuity Chain

**Deliver**

Promote evidence receipts from per-run artifacts to a visible continuity chain.

Expected behavior:

- each execution in a thread can retain its own evidence receipt snapshot
- a continuation flow can show "previous governed run" vs "current governed run"
  at a minimal, readable level
- follow-up continuity does not lose risk/provider/policy provenance

Concrete W123 parity object:

> For a parent run and its follow-up child run, W123 must preserve a declared
> continuity object that includes:
> `{threadId, rootExecutionId, parentExecutionId, templateId, knowledgeCollectionId?, previousReceiptId?}`
>
> The child run may differ in `decision`, `riskLevel`, or generated output, but
> it must not lose the chain anchor that explains where the follow-up came from.

This is intentionally a continuity-chain assertion, not a "same receipt values"
assertion.

**Acceptance**

- evidence continuity object is defined and testable
- users can inspect prior/current receipt context at follow-up time
- no raw keys or unsafe receipt expansion is introduced

### CP6 — Live Noncoder Continuity Evidence Pack

**Deliver**

Create a W123 evidence pack that proves repeat work, not just first-run value.

Minimum live cases:

1. start from a wizard or template run, accept/completed result, then launch a
   follow-up in the same thread
2. knowledge-assisted run followed by knowledge-preserving continuation
3. reopen from history after reload and continue the same work
4. evidence chain visible across parent + child run

Runner mode:

- Playwright live using Alibaba lane, following the standing governance-proof
  rule
- spec file:
  `tests/e2e/noncoder-followup-continuity.live.spec.ts`

Capture per case:

- starting execution id
- child execution id
- thread/root/parent linkage
- knowledge continuity status
- evidence receipt ids and continuity object fields
- whether the resumed path reduced re-entry friction for the user

**Acceptance**

- a live evidence pack exists
- the evidence clearly distinguishes continuity quality from first-run routing
  quality
- governed follow-up claims remain backed by real provider calls

### CP7 — Closure And Doc Sync

**Deliver**

- update `AGENT_HANDOFF.md` with W123 closure summary
- sync noncoder continuation claim boundaries in docs
- flip `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` default to `true` only after
  CP6 closes
- record W123 closure in `docs/baselines/`

**Acceptance**

- handoff reflects continuity as a closed tranche
- docs do not overclaim beyond browser-local continuity
- rollback remains a flag flip, not a code revert

---

## 5. Verification Plan

Required targeted verification before W123 closes:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web

# CP1 — continuity model/store
npx vitest run \
  src/lib/store.test.ts

# CP2 — follow-up prompt + continuity threading
npx vitest run \
  src/app/api/execute/route.followup.test.ts \
  src/components/ResultViewer.test.tsx

# CP3/CP4/CP5 — continuity UI + chain logic
# These file names are the intended close gates for W123 and should be created
# if they do not already exist in canon.
npx vitest run \
  src/components/HistoryList.test.tsx \
  src/lib/execution-continuity.test.ts

# Existing gates that must remain green
npx vitest run \
  src/lib/front-door-rewrite-regression.test.ts \
  src/lib/templates/governance-enforcement.test.ts \
  src/lib/skill-template-map.test.ts

# CP6 — live continuity proof
npx playwright test tests/e2e/noncoder-followup-continuity.live.spec.ts

# Release gate
python scripts/run_cvf_release_gate_bundle.py --json
```

Implementation note:

- if W123 keeps page-level continuity tests under a different path, that is
  acceptable, but the checkpoint coverage above is mandatory
- any claim about governed continuation behavior must use live provider-backed
  proof

---

## 6. Exit Criteria

W123 closes only when:

- a completed execution can seed a persistent continuation thread
- follow-up runs are linked by `threadId/rootExecutionId/parentExecutionId`
- continuity survives reload in the current browser
- history is a true continue-work surface, not just a list
- knowledge-assisted runs preserve `knowledgeCollectionId` continuity by default
- evidence continuity is visible as a chain across parent and child run
- a live continuity evidence pack exists
- docs/handoff are synchronized
- `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` is wired and rollback-tested

---

## 7. Recommended Execution Order

CP0 → CP1 → CP2 → CP3 → CP4 → CP5 → CP6 → CP7

Reasoning:

- CP0 locks the continuity boundary before touching store/UI
- CP1 defines the smallest viable continuity model
- CP2 makes follow-up durable
- CP3 turns history into a continuation entry point
- CP4 ensures project knowledge continuity is real, not implied
- CP5 formalizes evidence-chain continuity
- CP6 proves the tranche live
- CP7 closes the loop in docs/handoff

---

## 8. Execution Locks For Delegated Agent

W123 is scoped so the next agent should not stop to re-ask product-shape
questions during implementation.

### Locked Execution Decisions

1. **Storage mode**
   W123 is **browser-local persistence only** in this wave. No server-side
   project database, no cross-device sync promise.
2. **Canonical continuation surfaces**
   The primary continuity entry points are:
   - `ResultViewer` follow-up
   - `History` continue-work flow
   - Home resume path when a prior execution/thread is selected
3. **Continuity unit**
   The canonical continuity object is an execution thread, not a new global
   workspace system.
4. **Knowledge continuity**
   Reuse existing `knowledgeCollectionId` threading. Do not invent a parallel
   project-memory backend.
5. **Live proof timing**
   W123 includes its live continuity evidence runner in the same tranche.

### Audit-Grounded Guidance For The Implementer

- Prefer extending `useExecutionStore` over inventing a second persistence
  mechanism.
- Prefer narrow metadata growth on `Execution` or a tightly scoped helper file
  over a broad new domain model.
- Keep continuity visible and understandable to a non-coder; do not surface raw
  internal ids without a user-facing label/context.
- If continuity UI pressure makes `home/page.tsx` too large, extract a sibling
  component instead of bloating the page body.

---

## 9. Intended Success Signal

If W123 works, the product should feel different in one simple way:

> A non-coder no longer experiences CVF as "a place where I can run one task".
> They experience it as "a place where I can come back to ongoing work and keep
> moving without losing context".
