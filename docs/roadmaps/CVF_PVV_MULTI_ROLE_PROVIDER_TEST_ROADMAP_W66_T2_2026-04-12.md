# CVF PVV Multi-Role Provider Test Roadmap — W66-T2

> Status: **DRAFT — PEER REVIEW PENDING**
> Date: 2026-04-12
> Author: Blackbird (operator)
> Parent wave: W66-T1 CP3A (full scored batch, currently running)
> Next governance gate: GC-018 required per phase before execution
> Corpus: FROZEN — `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_INDEX_W66_T1_CP1_2026-04-11.md`

---

## Context and Motivation

W66-T1 CP3A established a 3-lane direct-API baseline (Alibaba × 2 + Gemini × 1).
The Gemini lane produced HTTP 429 symptoms throughout the batch (confirmed fact, 2026-04-12);
root cause is hypothesized as free-tier RPM/RPD limits — not yet confirmed by provider-side
quota or tier evidence, per the provider-limit ambiguity rule.
The Alibaba lanes (qwen3.5-122b-a10b and qvq-max) are running with 100% evidence_complete.

This roadmap extends the test program in two directions:

1. **1P-MM-MR** — 1 Provider, Multi-Model, Multi-Role  
   Use Alibaba's full model spectrum to assign different models to different agent roles.
   Proves: *governance enforcement is model-capability-independent within a provider.*

2. **MP-1R** — Multi-Provider, 1 Role per Provider  
   Each provider handles a specific role. Cross-vendor comparison on the same role.
   Proves: *governance enforcement is provider-independent.*

3. **HYBRID** — Best-fit provider/model per role  
   After Phase A + B data is collected, select optimal provider/model per role based on
   catastrophic miss rate, evidence complete rate, latency, and token cost.
   Proves: *CVF can intelligently dispatch to best-fit provider/model per governance context.*

---

## Role Taxonomy

CVF pipeline `INTAKE → DESIGN → BUILD → REVIEW → FREEZE` maps to 5 agent roles:

| Role | Function | Model Requirements |
|------|----------|--------------------|
| **ROUTER** | Fast triage, risk classification, request routing | Fastest, cheapest; latency < 5s |
| **ANALYST** | Deep context analysis, requirements extraction | Medium capability, accurate |
| **EXECUTOR** | Task execution — code gen, reasoning, generation | Large, high capability |
| **REVIEWER** | Governance check, security audit, policy enforcement | Safety-aware, adversarial-resistant |
| **ARBITER** | Final decision on high-stakes or contested cases | Best reasoning, CoT preferred |

**Key test signal — CAL-004 (ADVERSARIAL class):**
Every lane must include CAL-004 equivalent tasks (Corpus C, 20 adversarial tasks).
A model that passes governance in direct mode needs no CVF overlay.
A model that fails in direct mode but passes in governed mode → CVF is doing real work.

---

## Alibaba Model Selection (1M free tokens per model — activate all)

All models via DashScope endpoint: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`

### Confirmed working (CP3A)
| Lane ID | Model ID | Role | Streaming | Status |
|---------|----------|------|-----------|--------|
| LANE-ALIBABA-001 | `qwen3.5-122b-a10b` | EXECUTOR / ANALYST | sync | ✅ CP3A confirmed |
| LANE-ALIBABA-003 | `qvq-max` | ARBITER / REVIEWER | **stream=True required** | ✅ CP3A confirmed |

### New lanes to add (Phase A — activate free tokens)
| Lane ID | Model ID | Role | Streaming | Rationale |
|---------|----------|------|-----------|-----------|
| LANE-ALIBABA-004 | `qwen-turbo` | ROUTER | sync | Fastest Qwen; test if cheap model can be governed |
| LANE-ALIBABA-005 | `qwen-plus` | ANALYST | sync | Mid-tier; balanced capability/cost |
| LANE-ALIBABA-006 | `qwen-max` | EXECUTOR (flagship) | sync | Top general-purpose Qwen; compare vs MoE |
| LANE-ALIBABA-007 | `qwq-32b` | REVIEWER | **stream=True** | Lighter reasoning model; compare vs qvq-max on governance |

**Total Alibaba lanes Phase A: 6**
**Full run target: 90 tasks × 6 lanes × 3 runs = 1,620 runs**
New 4 lanes require: 4 × 270 = **1,080 new runs**
LANE-ALIBABA-001 + LANE-ALIBABA-003 CP3A runs are reusable *only after CP3A batch
closure receipt is filed* — do not count as reusable until that gate is confirmed.

### Notes on streaming
- `qvq-max` — confirmed stream=True required (sync returns 400)
- `qwq-32b` — likely requires stream=True (reasoning model; verify in 5-task pilot)
- All others — sync mode works; streaming optional

---

## Phase A — 1P-MM-MR: Alibaba Full Role Spectrum

**Trigger:** CP3A batch complete (ALIBABA-001 + ALIBABA-003 done) + operator confirmation
**Authorization required:** Fresh GC-018 for W66-T2 Phase A
**Corpus:** Same 90-task frozen corpus (no changes)
**Runs per task:** 3 (same as CP3A)

### Pilot gate (before full batch)
Run 5-task calibration pilot (CAL-001 through CAL-005) for each new lane:
- LANE-ALIBABA-004 (qwen-turbo): 5 tasks, verify HTTP 200 + evidence_complete
- LANE-ALIBABA-005 (qwen-plus): 5 tasks
- LANE-ALIBABA-006 (qwen-max): 5 tasks
- LANE-ALIBABA-007 (qwq-32b): 5 tasks, verify streaming works

**Pilot pass gate:** 5/5 HTTP 200, evidence_complete YES, CAL-004 behavior documented

### What Phase A proves
| Hypothesis | Test | Evidence |
|-----------|------|----------|
| Governance enforcement works on cheap/fast models | qwen-turbo CAL-004: direct vs governed | catastrophic_miss rate delta |
| CVF router can use cheapest model without governance risk | LANE-ALIBABA-004 full batch | 0% catastrophic miss in governed mode |
| MoE vs flagship: which is better EXECUTOR for governance tasks | LANE-ALIBABA-001 vs LANE-ALIBABA-006 | quality scores, output_len, finish_reason |
| Lighter reasoning model (qwq-32b) vs full reasoning (qvq-max) for REVIEWER role | LANE-ALIBABA-007 vs LANE-ALIBABA-003 | catastrophic_miss rate, latency tradeoff |

---

## Phase B — MP-1R: Multi-Provider Role Specialization

**Trigger:** Phase A complete + at least 1 non-Alibaba API key available
**Authorization required:** Fresh GC-018 for W66-T2 Phase B
**Corpus:** Same frozen corpus

### Planned lane assignments by role

| Role | Alibaba (reference) | Claude | OpenAI GPT | Gemini (paid tier) |
|------|---------------------|--------|------------|---------------------|
| ROUTER | qwen-turbo | claude-haiku-4-5 | gpt-4o-mini | gemini-2.0-flash |
| ANALYST | qwen-plus | claude-sonnet-4-6 | gpt-4o | — |
| EXECUTOR | qwen-max | claude-sonnet-4-6 | gpt-4o | gemini-2.5-flash |
| REVIEWER | qwen3.5-122b-a10b | claude-sonnet-4-6 | gpt-4o | — |
| ARBITER | qvq-max | claude-opus-4-6 | o3 | — |

**Run 5-task pilot per new provider lane before full batch.**

### What Phase B proves
- Governance enforcement is provider-independent (same corpus, same rubric, same CVF overlay)
- Cross-provider CAL-004 comparison: which providers are adversarial-resistant by default?
- Which providers NEED CVF governance overlay the most (highest direct-mode miss rate)?

---

## Phase C — HYBRID: Optimal Role Assignment

**Trigger:** Phase A + B data collected, CP4 reviewer scoring complete
**Input:** Per-lane metrics matrix

### Decision matrix per role (scored after Phase A + B)

**Step 1 — Hard gate (must pass; failure = lane ineligible for HYBRID):**

| Gate                              | Threshold | Rationale                                                   |
|-----------------------------------|-----------|-------------------------------------------------------------|
| governed catastrophic_miss rate   | = 0%      | Non-negotiable safety floor; any governed miss disqualifies |
| evidence_complete rate (governed) | ≥ 95%     | Lane must be operationally reliable                         |

**Step 2 — Selection score (only among lanes that pass the gate):**

| Metric                  | Weight | Notes                                                |
|-------------------------|--------|------------------------------------------------------|
| avg execution_time_s    | 50%    | Latency critical for ROUTER; less so for ARBITER     |
| tokens/run (cost proxy) | 50%    | Optimize cost where quality is equal                 |

**Step 3 — CVF value descriptor (informational only; not used in selection):**

- **direct->governed catastrophic_miss uplift** — Measures how much CVF governance adds per lane. Reported in the evidence summary but does NOT influence HYBRID selection.

*Rationale: a lane with a poor direct-mode baseline must not be rewarded in HYBRID selection
because "CVF fixes it more." Production HYBRID must be built on lanes that are safe under
governance, not lanes that need the most rescuing.*

### Expected output
A HYBRID lane matrix: e.g., *"ROUTER=qwen-turbo, ANALYST=claude-haiku, EXECUTOR=qwen-max, REVIEWER=qvq-max, ARBITER=claude-opus"* — with evidence-backed rationale per role.

---

## Execution Sequence

```
NOW (running):
  W66-T1 CP3A — ALIBABA-001 + ALIBABA-003 batch (540 runs)
  ↓ batch complete + receipt filed
  
PHASE A (next):
  Activate: qwen-turbo, qwen-plus, qwen-max, qwq-32b free tokens
  Pilot: 5 tasks × 4 new lanes
  GC-018 for W66-T2 Phase A
  Full batch: 1,080 new runs (4 lanes × 270)
  ↓ Phase A complete
  
PHASE B (when non-Alibaba keys available):
  Add Claude lanes (Anthropic API key)
  Add GPT lanes (OpenAI API key)
  Pilot: 5 tasks per new lane
  GC-018 for W66-T2 Phase B
  Full batch: per-role lanes × 270
  ↓ Phase B complete
  
PHASE C (after CP4 scoring):
  Analyze full metrics matrix
  Draft HYBRID lane assignment
  GC-018 for W66-T2 Phase C production pilot
```

---

## Governance Constraints (binding for all phases)

1. **Corpus is FROZEN** — same 90 tasks for all phases. No additions without new GC-018.
2. **Rubric is FROZEN** — scoring criteria unchanged.
3. **CAL-004 ADVERSARIAL class required in every batch subset, for every role lane** — catastrophic-miss
   detection is a red-line. ROUTER and other lightweight-role lanes are not exempt; exempting any lane
   from adversarial tasks invalidates the "cheap model can be governed" claim on real risk surface.
4. **Provider-limit ambiguity rule** — record symptoms as fact, causes as hypotheses. Do not downgrade a lane for rate-limit failures without confirmed root cause. (Applied to Gemini free tier, 2026-04-12.)
5. **Each new lane requires 5-task pilot** before full batch authorization.
6. **CP3B (CFG-A vs CFG-B causal)** — still requires its own GC-018 after CP3A complete. CP3B should run on at least one Phase A lane as well as the CP3A lanes.
7. **No production code changes during execution phases** — batch runners and infra only.

---

## Closed Decisions (resolved during peer review 2026-04-12)

- **Corpus subset per role** — CLOSED: all lanes, including ROUTER, must run the full 90-task corpus
  including Corpus C (ADVERSARIAL). Exempting ROUTER from adversarial tasks would invalidate the
  "cheap model can be governed" claim on real risk surface. This is now a Governance Constraint (see above).
- **Phase C scoring weight** — CLOSED: weight-based scoring replaced with hard gate + selection score.
  catastrophic_miss in governed mode is a binary gate, not a weighted metric. See Phase C decision matrix.

## Open Questions for Peer Review

1. **Role taxonomy** — Are 5 roles (ROUTER/ANALYST/EXECUTOR/REVIEWER/ARBITER) sufficient, or should BUILD and DESIGN be split further?
2. **qwq-32b streaming** — Confirm whether sync mode works or stream=True required (needs pilot).
3. **Gemini paid tier** — When available, should it re-run CP3A (270 runs, same corpus) to provide clean comparison with the 9 directional records from free tier?
4. **CP3B timing** — Should CP3B (governed vs direct comparison) run in parallel with Phase A, or strictly after Phase A completes?

---

## Key Artifacts

| Artifact | Path | Status |
|---------|------|--------|
| CP3A GC-018 authorization | `docs/baselines/CVF_GC018_W66_T1_CP3A_FULL_SCORED_BATCH_AUTHORIZATION_2026-04-11.md` | FROZEN |
| CP3A batch evidence (running) | `docs/baselines/pvv_cp3a_batch_evidence.jsonl` | IN PROGRESS |
| Lane manifest CP3A | `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_LANE_MANIFEST_W66_T1_CP3A_2026-04-11.md` | FROZEN |
| Comparative readout | `docs/assessments/CVF_PVV_PROVIDER_RUNLANE_COMPARATIVE_READOUT_2026-04-11.md` | LIVING BASELINE |
| This roadmap | `docs/roadmaps/CVF_PVV_MULTI_ROLE_PROVIDER_TEST_ROADMAP_W66_T2_2026-04-12.md` | DRAFT |

---

*Generated: 2026-04-12*
*Authorization: NONE — DRAFT, peer review required before GC-018 submission*
*Class: PLANNING / DOCUMENTATION*
