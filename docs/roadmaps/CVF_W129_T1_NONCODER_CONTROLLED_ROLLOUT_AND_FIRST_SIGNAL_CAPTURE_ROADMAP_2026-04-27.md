<!-- Memory class: SUMMARY_RECORD -->

# CVF W129-T1 Noncoder Controlled Rollout And First Signal Capture Roadmap

> Date: 2026-04-27
> Status: CLOSED DELIVERED — rollout playbook locked; Stage A operator posture documented; dedicated Stage A routing evidence captured; release gate PASS 7/7 on 2026-04-27
> Scope class: NONCODER CONTROLLED ROLLOUT / FIRST SIGNAL CAPTURE / OPERATOR EVIDENCE
> Predecessor: W128-T1 CLOSED DELIVERED 2026-04-27
> Authorization: `docs/baselines/CVF_GC018_W129_T1_NONCODER_CONTROLLED_ROLLOUT_AND_FIRST_SIGNAL_CAPTURE_AUTHORIZATION_2026-04-27.md`
> Wave ID: W129

---

## 0. Why This Is Next

W128 closed the noncoder adoption build-out with the correct conclusion:

- the shipped noncoder lanes are now coherent
- `/analytics -> Noncoder Health` exists
- the decision contract is explicit
- but all lanes are still `no_data`

That means the next correct move is not feature expansion and not product
optimization by intuition. The next correct move is to create the first real
signal.

The repo already says this plainly:

> collect traffic -> re-read the operator surface -> choose the first
> `watch`/`act-now` lane from measured friction

So W129 should focus on converting Day-0 readiness into Day-1 evidence:

> W129 should safely enable the bounded noncoder rollout in a controlled
> environment, collect enough browser-local product signals to move at least one
> lane out of `no_data`, and publish the first measured continuation decision.

---

## 1. Product Claim Target

W129 should make this bounded claim true:

> CVF can run a controlled noncoder rollout, collect the first real usage
> signals from the shipped front door, and use `/analytics -> Noncoder Health`
> to identify the first measured optimization target.

This is bounded to:

- controlled rollout posture only
- browser-local analytics already delivered by W127/W128
- the current Web noncoder lane only
- operator evidence and decision support

This wave does **not** claim:

- statistically significant adoption proof
- server-side telemetry or organization analytics
- automatic feature-flag rollout
- optimization of the next friction lane in the same tranche

---

## 2. Current State Readout

As of W128 closure:

- all noncoder capability lanes W122-W126 are implemented
- W127 metrics are implemented
- W128 readout and recommendation logic are implemented
- all feature flags remain rollout-safe
- Day-0 readout is entirely `no_data`

That means the repo is ready for measurement, but not yet measured.

The specific W128 Day-0 recommendations already point to the correct sequence:

1. enable `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` in a controlled environment
2. enable clarification alongside intent-first
3. let event volume accumulate
4. re-open `/analytics -> Noncoder Health`
5. choose the highest-friction proven lane

W129 should formalize and execute exactly that sequence.

---

## 3. Non-Goals

- No new capability lane
- No expansion of trusted-form corpus
- No clarification rewrite yet
- No continuity UX rewrite yet
- No deliverable-pack redesign yet
- No telemetry backend
- No governance/runtime architecture reopen

---

## 4. Checkpoints

### CP0 — Controlled Rollout Contract Lock

**Deliver**

Produce `docs/reviews/CVF_W129_CONTROLLED_ROLLOUT_CONTRACT_2026-04-27.md` and
lock:

1. which flags participate in the first rollout:
   - `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR`
   - `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP`
   - `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` (optional second-stage only)
2. rollout order
3. minimum observation window
4. minimum event threshold for a lane to stop being treated as `no_data`
5. stop/rollback conditions

**Acceptance**

- rollout order is explicit
- first-stage and second-stage flags are clearly separated
- no hidden operator decisions remain

### CP1 — Rollout Trial Posture

**Deliver**

Define and implement the bounded trial posture for first-signal capture.

Preferred sequence:

1. Stage A: enable `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR`
2. Stage B: enable `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP`
3. Stage C: consider `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` only after
   accepted executions exist

Expected artifacts:

- operator checklist
- flag matrix
- trial notes in docs/reviews or docs/baselines

**Acceptance**

- rollout posture is reproducible by another operator
- flag ordering matches W128 logic
- continuity is not activated before entry routing has some traffic

### CP2 — First Signal Capture

**Deliver**

Publish `docs/reviews/CVF_W129_FIRST_SIGNAL_CAPTURE_2026-04-27.md` with:

- event volume observed
- which lanes still remain `no_data`
- which lanes moved to `healthy`, `watch`, or `action_required`
- caveat if sample size is still too small

Signal requirements should be bounded, for example:

- at least one lane must move out of `no_data`, or
- if not, the packet must explain exactly which rollout precondition is still
  blocking signal capture

**Acceptance**

- first measured lane statuses are documented
- “still no data” is only allowed with an explicit blocking reason

### CP3 — Noncoder Health Re-Read Packet

**Deliver**

Publish `docs/reviews/CVF_W129_NONCODER_HEALTH_RE_READ_2026-04-27.md`.

This packet must answer:

1. what `/analytics -> Noncoder Health` now says after rollout
2. which lane has the strongest measured friction signal
3. whether the signal is strong enough to justify optimization
4. which lane should become W130

**Acceptance**

- the next lane is named from measured evidence
- packet distinguishes:
  - enough data to optimize
  - some data but not enough
  - blocked rollout / invalid sample

### CP4 — Continuation Decision Lock

**Deliver**

Lock the next-tranche rule in one short decision note:

- if `weak_fallback_rate` is act-now -> route tuning lane next
- if `route_recovery_rate` is act-now -> clarification rewrite lane next
- if `followup_continuation_rate` is act-now -> continuity UX lane next
- if `deliverable_pack_export_rate` is act-now -> pack discoverability lane next
- if all remain `no_data` -> do not open W130; extend rollout evidence first

**Acceptance**

- continuation logic is deterministic
- W130 cannot be opened from habit alone

### CP5 — Closure And Handoff Sync

**Deliver**

- update `AGENT_HANDOFF.md`
- update `AGENTS.md`
- record whether W130 is authorized in principle or still blocked pending more
  signal

**Acceptance**

- future agents can tell whether the next move is:
  - optimization
  - more traffic collection
  - rollback / hold

---

## 5. Verification Plan

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web

npx vitest run \
  src/lib/noncoder-metrics.test.ts \
  src/lib/noncoder-rollout-readout.test.ts \
  src/lib/analytics.test.ts \
  src/components/AnalyticsDashboard.test.tsx

python scripts/run_cvf_release_gate_bundle.py --json
```

Notes:

- W129 is expected to rely mostly on the already-shipped W127/W128 code paths
  plus operator rollout evidence.
- release-quality closure still requires the mandatory live bundle because the
  tranche updates canonical noncoder product posture and continuation rules.

---

## 6. Exit Criteria

W129 closes only when:

- controlled rollout posture is explicitly documented
- at least one noncoder lane is re-read from real observed traffic, or the lack
  of signal is explained with a concrete blocking reason
- the next optimization lane is chosen from measured friction, or continuation
  is explicitly deferred for lack of signal
- handoff canon states the outcome unambiguously

---

## 7. Post-Closure Addendum — Exact Requirements To Unlock Stage B

This section is the canonical operator/agent runbook for the next W129 follow-on
evidence pass. Use it when asking another coding agent (including Claude) to
collect enough live traffic to satisfy the Stage B enable criteria.

### 7.1 Goal

Produce enough explicit Stage A browser-local evidence to determine whether
`NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` may be enabled.

The exact unlock rule from the W129 rollout playbook remains binding:

1. Stage A must have `>=10` `execution_created` events in the browser-local
   analytics stream
2. `entry_routing` must be **not** `action_required`

If both are true, Stage B may be enabled.

If either is false, Stage B must remain OFF.

### 7.2 Hard Boundaries

- Use **real live provider calls only**
- Do **not** treat mock mode as valid evidence
- Do **not** count raw `/api/execute` calls by themselves toward the Stage B
  threshold
- Every counted `execution_created` must come from a **browser-driven UI
  journey**
- Do **not** print or commit raw API key values
- Keep the rollout to **Stage A only** during this evidence pass
- Do **not** enable `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` until the
  threshold below is met

### 7.3 Provider Lane

- Primary lane: Alibaba `qwen-turbo`
- Secondary lane: DeepSeek `deepseek-chat` may be used only if Alibaba is
  unavailable or if a secondary confirmation pass is explicitly desired
- Do not mix providers within the minimum-threshold pass unless there is a
  documented reason

Preferred rule:

> Reach the full Stage B threshold on Alibaba first, then run a separate
> confirmatory DeepSeek pass only if needed.

### 7.4 Environment Preconditions

Before running the pass, the agent must ensure:

1. `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true`
2. `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=false`
3. `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=false`
4. analytics are enabled in browser settings
5. browser-local analytics storage is cleared at the start of the run:
   - `localStorage.removeItem('cvf_analytics_events')`
   - `sessionStorage.clear()`
6. the run uses a single clean browser profile/session for the evidence packet

### 7.5 Required Journey Type

Each counted journey must follow this shape:

1. open `/home`
2. use `IntentEntry`
3. enter a **strong-match** Stage A prompt
4. wait for the governed route preview / enabled CTA
5. click `Bắt đầu với governed path` / `Start with governed path`
6. land on the routed form or wizard
7. submit through the **UI**
8. allow CVF to create the execution in the browser app flow
9. wait until the execution is visible as created/processing/completed

Important:

- A request made with `page.request.post('/api/execute', ...)` is useful for
  live governance proof, but it does **not** satisfy the Stage B unlock count
  by itself
- The Stage B threshold depends on browser-local analytics, so the agent must
  drive the real UI flow

### 7.6 Minimum Volume Requirement

The agent should not aim for exactly `10` attempted runs.

Required operational target:

- **Minimum successful threshold:** `10` `execution_created`
- **Recommended attempted volume:** `12` to `14` UI journeys

Reason:

- this gives headroom for one or two non-counting runs
- it reduces the chance that a borderline run ends below threshold

### 7.7 Strong-Match Prompt Corpus

Use prompts that are known to route strongly through the current Stage A path.
Avoid VN wording that depends on the known `ứng dụng` boundary weakness.

Preferred prompt family: use `app` phrasing.

Locked starter corpus:

1. `Tôi muốn tạo app quản lý công việc cho đội sales`
2. `Tôi muốn xây dựng app quản lý kho hàng cho SME`
3. `Tôi muốn tạo app theo dõi deadline cho agency marketing`
4. `Tôi muốn xây dựng app quản lý đơn hàng nội bộ`
5. `Tôi muốn tạo app quản lý yêu cầu IT cho công ty 50 người`
6. `Tôi muốn xây dựng app quản lý bàn giao công việc`
7. `Tôi muốn tạo app theo dõi onboarding nhân sự`
8. `Tôi muốn xây dựng app quản lý tài liệu nội bộ`
9. `Tôi muốn tạo app quản lý ticket hỗ trợ khách hàng`
10. `Tôi muốn xây dựng app quản lý lịch bảo trì thiết bị`
11. `Tôi muốn tạo app quản lý tồn kho cửa hàng`
12. `Tôi muốn xây dựng app quản lý dự án cho team nhỏ`

If the agent expands this corpus, it must keep the same strong-match posture and
must not switch to ambiguous wording without documenting why.

### 7.8 Required Evidence Files

The pass must publish both:

1. a markdown packet, for example:
   `docs/reviews/CVF_W129_STAGE_A_VOLUME_EVIDENCE_2026-04-27.md`
2. a machine-readable JSON packet, for example:
   `docs/reviews/CVF_W129_STAGE_A_VOLUME_EVIDENCE_2026-04-27.json`

The packet must include at minimum:

- provider lane used
- exact date/time of run
- number of attempted UI journeys
- number of successful `execution_created` events
- event counts for:
  - `rollout_flag_enabled`
  - `rollout_session_start`
  - `intent_routed`
  - `execution_created`
  - `clarification_weak_confidence_detected`
  - `clarification_browse_fallback`
- `computeLaneReadout(...)` result for:
  - `entry_routing`
  - `trusted_form`
  - `clarification_recovery`
  - `followup_continuity`
  - `evidence_export`
  - `deliverable_pack`
- explicit statement:
  - `Stage B ENABLED` or
  - `Stage B NOT ENABLED`
- reason for the decision

### 7.9 Required Readout Method

The lane decision must be computed from the browser-local event stream using the
existing W128 logic, not by human intuition.

Use the effective flag posture:

- `intentFirstEnabled: true`
- `clarificationLoopEnabled: false`
- `iterationMemoryEnabled: false`

The decision method must explicitly check:

1. `execution_created >= 10`
2. `entry_routing.status !== 'action_required'`

Only then may the agent recommend flipping:

`NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true`

### 7.10 Definition Of Done For This Follow-On Pass

This Stage A volume pass is complete only when:

- at least `10` browser-local `execution_created` events are present, and
- `entry_routing` is `healthy` or `watch`, and
- the evidence packet is written, and
- the packet states clearly whether Stage B may be enabled

### 7.11 Refusal / Stop Conditions

The agent must stop and report instead of forcing progress if:

- the UI route no longer produces `intent_routed` reliably
- analytics are disabled and cannot be re-enabled
- the browser-local event stream is being reset between runs unexpectedly
- the run can only be completed by bypassing the UI and using API-only calls
- `entry_routing` becomes `action_required`

### 7.12 Canonical Next Step After A Successful Pass

If the pass succeeds:

1. enable `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true`
2. keep iteration memory OFF
3. run a new Stage B evidence pass
4. only then reassess whether W130 is mature enough for fresh `GC-018`

If the pass does not succeed:

1. keep Stage B OFF
2. continue Stage A traffic collection or routing tuning
3. do **not** open W130 yet

---

## 7. Execution Locks

1. W129 is a rollout-evidence tranche, not an optimization tranche
2. no new capability lane may be added in W129
3. browser-local analytics remains the storage boundary
4. first signal is more important than broad rollout
5. if data quality is too weak, W129 must say so plainly and defer W130
6. the tranche must preserve the W128 rule: do not broaden by habit

---

## 8. Expected W130 Shapes

W129 exists to justify one of these follow-on shapes, but not to pre-choose
them:

1. `W130 — Entry Routing And Trusted Form Fallback Reduction`
2. `W130 — Clarification Question Quality Optimization`
3. `W130 — Follow-Up Continuity Surface Optimization`
4. `W130 — Evidence / Pack Export Discoverability Optimization`

If no lane reaches a justified `watch` or `action_required` state, W130 should
not open yet. In that case the correct outcome is a longer controlled rollout,
not a speculative optimization tranche.
