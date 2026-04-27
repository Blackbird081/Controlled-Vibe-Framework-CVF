# CVF GC-018 — W129-T1 Authorization

> Type: TRANCHE AUTHORIZATION
> Tranche: W129-T1 — Noncoder Controlled Rollout And First Signal Capture
> Date: 2026-04-27
> Predecessor closure: W128-T1 CLOSED DELIVERED 2026-04-27
> Operator: CVF core team

---

## 1. Authorization Decision

**AUTHORIZED.** W129-T1 may begin immediately.

---

## 2. Predecessor State

W122–W128 completed the noncoder surface and readout stack:

| Wave | Delivery |
|---|---|
| W122 | Intent-first front door + routing facade |
| W123 | Iteration memory + follow-up continuity |
| W124 | Clarification loop + safe routing recovery |
| W125 | Deliverable packs + handoff productization |
| W126 | Trusted form-template routing expansion |
| W127 | Adoption metrics instrumentation (6 metrics, 4 analytics events) |
| W128 | Rollout readout + optimization loop (6 lanes, threshold bands, AnalyticsDashboard) |

All noncoder feature flags are currently **off by default** (rollout-safe posture).
The W128 readout exists but has no real traffic to report on — `no_data` everywhere.

The natural next step is to move from **build-and-measure** to **controlled enable and signal capture**.

---

## 3. Proposed Tranche

**W129-T1 — Noncoder Controlled Rollout And First Signal Capture**

Roadmap: `docs/roadmaps/CVF_W129_T1_NONCODER_CONTROLLED_ROLLOUT_AND_FIRST_SIGNAL_CAPTURE_ROADMAP_2026-04-27.md`

Enable the highest-confidence noncoder flag first (intent-first front door),
add a rollout session marker so pre/post rollout traffic is distinguishable,
and produce the first signal readout from real or simulated governed sessions.

Deliverables:

- CP0: Rollout playbook lock (flag order, enable criteria, hold criteria)
- CP1: First flag enable (`NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR = true`) + readout baseline
- CP2: Rollout event instrumentation (`rollout_flag_enabled`, `rollout_session_start`)
- CP3: First signal readout (live-governed sessions → W128 threshold logic applied)
- CP4: Signal capture doc (`CVF_W129_FIRST_SIGNAL_READOUT_2026-04-27.md`)
- CP5: Handoff + continuation rule

---

## 4. GC-018 Depth Audit

| Dimension | Score (0–2) | Rationale |
|---|---|---|
| Risk reduction | 2 | Controlled flag-by-flag enable avoids big-bang rollout risk; playbook prevents ad-hoc flag flipping |
| Decision value | 2 | First real or simulated signals let us close the `no_data` state in W128 lanes |
| Machine enforceability | 1 | Rollout events are typed and tested; flag order is locked in playbook; signal readout is deterministic |
| Operational efficiency | 2 | Operator can validate the first flag is working before enabling the next one |
| Portfolio priority | 2 | Without real signals the W127/W128 analytics stack has no product value |

**Total: 9/10 — AUTHORIZED**

---

## 5. Scope Authorization

Authorized scope is bounded to:

- Locking and documenting the rollout flag order and criteria
- Enabling `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` as the first live flag
- Adding two lightweight analytics events: `rollout_flag_enabled`, `rollout_session_start`
- Running a governed session batch against the enabled flag and reading W128 lane output
- Producing a first signal readout doc with bounded conclusions
- No new capability lanes in this tranche

Not authorized in this tranche:

- Enabling all noncoder flags simultaneously
- Server-side telemetry or persistent analytics backend
- A/B testing framework or experimentation controller
- Automated flag flip logic
- New routing or clarification capability
- New UI components beyond a rollout status badge (if needed)

---

## 6. Hard Contracts (binding throughout execution)

1. Only one feature flag may be enabled per CP; the playbook governs the order
2. Rollout can be paused or rolled back if any W128 lane shows `action_required`
3. Signal readout must use the W128 threshold contract — no new threshold invention
4. No governance/execution path claims may be made based on simulated sessions alone
5. Every live evidence use must call real `/api/execute` with `DASHSCOPE_API_KEY` or alias
6. No raw API key values may be printed or committed

---

## 7. Checkpoints

| CP | Deliverable | Acceptance |
|---|---|---|
| CP0 | `docs/reviews/CVF_W129_ROLLOUT_PLAYBOOK_2026-04-27.md` | Flag order locked; enable + hold criteria per flag; first-flag selection justified |
| CP1 | `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true` in `.env` + readout baseline | W128 readout shows intent-routing lane active; no regression in other lanes |
| CP2 | `analytics.ts` — `rollout_flag_enabled` + `rollout_session_start` event types | Both events fire correctly; unit tests pass |
| CP3 | Live-governed session batch — intent-first path exercised | ≥3 governed sessions via Alibaba lane; W128 lane readout exits `no_data` for entry_routing |
| CP4 | `docs/reviews/CVF_W129_FIRST_SIGNAL_READOUT_2026-04-27.md` | Readout answers: which lanes have data, what signals say, recommended next flag or hold |
| CP5 | `AGENT_HANDOFF.md` + `AGENTS.md` + GC-026 closure | W129 boundary language added; next continuation candidate named |

---

## 8. Verification Gate

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web

npx vitest run \
  src/lib/analytics.test.ts \
  src/lib/noncoder-metrics.test.ts \
  src/lib/noncoder-rollout-readout.test.ts

python scripts/run_cvf_release_gate_bundle.py --json
```

---

## 9. Risk Classification

**R1 (Low)** — enabling one feature flag behind an env variable does not change
the governed execution path, DLP rules, or approval flow. The flag gates UI
rendering only. Rollout events are additive to the existing event stream.

---

## 10. Boundary Language (binding)

W129-T1 is a controlled rollout and first signal tranche. It does not claim:

- full noncoder rollout completion (only the first flag is enabled here)
- statistically significant adoption data
- automatic optimization of the noncoder path
- governance enforcement changes

It advances the product from `all flags off / no data` to
`first flag on / first signals captured`.

---

## 11. Authorization Trail

- Predecessor: W128-T1 GC-018 `docs/reviews/CVF_W128_GC018_HANDOFF_2026-04-27.md`
- Predecessor closed: `docs/baselines/CVF_GC026_TRACKER_SYNC_W128_T1_CLOSED_2026-04-27.md`
- Roadmap: `docs/roadmaps/CVF_W129_T1_NONCODER_CONTROLLED_ROLLOUT_AND_FIRST_SIGNAL_CAPTURE_ROADMAP_2026-04-27.md`
