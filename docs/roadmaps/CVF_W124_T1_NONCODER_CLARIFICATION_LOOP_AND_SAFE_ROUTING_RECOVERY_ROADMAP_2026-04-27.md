<!-- Memory class: SUMMARY_RECORD -->

# CVF W124-T1 Noncoder Clarification Loop And Safe Routing Recovery Roadmap

> Date: 2026-04-27
> Status: IMPLEMENTATION-COMPLETE / CLOSURE-PENDING — all CP0-CP5 delivered 2026-04-27; GC-026 filed
> Scope class: NONCODER ROUTING RECOVERY / CLARIFICATION UX / SAFE ACTIVATION
> Predecessor: W123-T1 CLOSED DELIVERED 2026-04-27; W122-T1 CLOSED DELIVERED 2026-04-27
> Authorization: `docs/baselines/CVF_GC018_W124_T1_NONCODER_CLARIFICATION_LOOP_AND_SAFE_ROUTING_RECOVERY_AUTHORIZATION_2026-04-27.md`
> Wave ID: W124

---

## 0. Why This Is Next

W122 solved the first part of noncoder activation: plain-language intent can now
route a user into a trusted starter path when confidence is strong.

The remaining gap is what happens when confidence is weak.

Today, CVF behaves safely by refusing to guess a governed target on weak input.
That is correct, but still too passive for non-coders. A safe fallback that only
pushes the user back to browse/refine is better than a bad guess, but it still
creates friction:

- the user has to infer what clarification is actually needed
- weak-confidence recovery is not yet a designed product path
- the product knows *something* about phase/risk, but does not yet convert that
  into a helpful next question
- CVF still leaves value on the table between "route strongly" and "send the
  user back to manual navigation"

The next move is to turn safe refusal into guided recovery:

> When CVF cannot route confidently, it asks one or two bounded clarification
> questions that materially improve routing confidence without forcing the user
> back into catalog-first behavior.

---

## 1. Product Claim Target

W124 should make this bounded claim true:

> A non-coder whose first request is ambiguous can answer a short clarification
> loop, after which CVF either routes them into a trusted governed starter path
> or clearly explains why guided browse remains the safer choice.

This is bounded to:

- the existing W122 wizard-family trusted subset
- at most 1–2 clarification turns in the Web client
- plain-language VN/EN recovery on the active Web path
- safe routing recovery, not open-ended conversational planning

This wave does **not** claim:

- free-form multi-turn chat planning
- routing to the full form-template corpus
- automatic guessing after repeated ambiguity
- server-side memory or cross-session conversation threads

---

## 2. Current State Readout

Post-W122, the current routing model already has the right refusal behavior:

- weak confidence no longer guesses a wizard target
- unsupported language degrades safely
- Home/IntentEntry can preview and route on strong confidence
- the catalog remains available as fallback

What is still missing is a recovery layer between:

- `strong route immediately`
- `manual browse entirely by yourself`

Current weak-confidence signals already exist:

- phase classification
- risk framing
- unsupported-language detection
- knowledge of whether no trusted wizard target matched

W124 should build on those signals instead of inventing a second routing system.

---

## 3. Non-Goals

- No chat-agent replanning system
- No provider/runtime architecture reopen
- No expansion beyond the wizard-family routing subset
- No more than 2 clarification questions in this wave
- No hidden auto-routing after repeated ambiguity
- No server-backed memory/thread store

---

## 4. Checkpoints

### CP0 — Clarification Contract Lock

**Deliver**

Produce `docs/reviews/W124_CLARIFICATION_CONTRACT_INVENTORY.md` and lock:

1. weak-confidence reasons that are eligible for clarification
2. reasons that must still go straight to guided browse
3. max clarification depth = `2`
4. feature flag:
   `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true|false`

**Acceptance**

- clarification-eligible vs browse-only cases are explicit
- clarification depth limit is fixed
- rollout flag is declared

### CP1 — Clarification Question Model

**Deliver**

Add a bounded clarification contract on top of W122 routing.

Expected output shape:

- `clarificationNeeded: boolean`
- `clarificationQuestion?: string`
- `clarificationOptions?: string[]`
- `recoveryMode: 'clarify' | 'browse' | 'route'`

Question design constraints:

- short
- answerable by a non-coder
- materially useful for disambiguation
- no jargon-heavy internal CVF wording

**Acceptance**

- clarification contract exists and is typed
- no more than 2 questions are ever needed
- unsupported-language path remains browse/refine unless explicitly rephrased

### CP2 — IntentEntry / QuickStart Clarification UX

**Deliver**

Extend the W122 activation surfaces so weak-confidence users receive the
clarification loop natively.

Expected behavior:

- on weak confidence, the user sees one targeted clarification question
- answering the question retries routing
- if clarity improves, route normally into trusted starter flow
- if not, end in guided browse with a clean explanation

**Acceptance**

- Home and upgraded QuickStart both support the same clarification UX
- no duplicate router logic is introduced
- browse remains available at every step

### CP3 — Safe Recovery And Auditability

**Deliver**

Make clarification outcomes explainable and testable.

Expected behavior:

- the system can explain why it asked a question
- the user can see when routing was recovered vs when browse remained safer
- telemetry/event surface captures:
  - weak-confidence detected
  - clarification asked
  - clarification answered
  - route recovered or browse fallback

**Acceptance**

- clarification path is inspectable in tests
- safe-browse endings are explicit, not silent failures

### CP4 — Recovery Evidence Pack

**Deliver**

Add live evidence proving W124 improves ambiguity handling without unsafe
guessing.

Minimum live cases:

1. ambiguous VN request clarified into trusted wizard route
2. ambiguous EN request clarified into trusted wizard route
3. unsupported/non-VN/non-EN path remains safe fallback
4. ambiguity unresolved after bounded loop ends in guided browse

**Acceptance**

- live E2E proves recovered route and safe non-route cases
- no governance claim is made from mock-only evidence

### CP5 — Closure And Doc Sync

**Deliver**

- update `AGENT_HANDOFF.md`
- publish W124 evidence note
- flip feature flag default to `true` only after closure evidence passes

---

## 5. Verification Plan

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web

npx vitest run \
  src/lib/intent-router.test.ts \
  src/lib/intent-router-clarification.test.ts

npx vitest run \
  src/components/IntentEntry.test.tsx \
  src/components/QuickStart.test.tsx

npx playwright test tests/e2e/noncoder-clarification-recovery.live.spec.ts

python scripts/run_cvf_release_gate_bundle.py --json
```

---

## 6. Exit Criteria

W124 closes only when:

- weak-confidence requests can enter a bounded clarification loop
- strong recovery routes only to trusted wizard targets
- unresolved ambiguity ends in safe guided browse
- clarification UX is shared across main activation surfaces
- live evidence proves both recovered and safe non-route outcomes

---

## 7. Execution Locks

1. clarification depth is capped at `2`
2. trusted routing subset stays wizard-family only
3. unsupported-language cases do not get guessed routes
4. W124 reuses W122 router as its base, not a parallel system

