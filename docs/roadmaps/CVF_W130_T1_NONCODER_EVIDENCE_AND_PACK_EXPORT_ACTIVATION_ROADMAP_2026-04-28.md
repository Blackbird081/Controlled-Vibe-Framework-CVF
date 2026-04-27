<!-- Memory class: SUMMARY_RECORD -->

# CVF W130-T1 Noncoder Evidence And Pack Export Activation Roadmap

> Date: 2026-04-28
> Status: AUTHORIZED — ready to begin
> Scope class: NONCODER UX / OUTPUT DISCOVERABILITY / ANALYTICS LANE EXIT
> Predecessor: W129-T1 CLOSED DELIVERED + ROLLOUT COMPLETE 2026-04-28
> Authorization: `docs/baselines/CVF_GC018_W130_T1_NONCODER_EVIDENCE_AND_PACK_EXPORT_ACTIVATION_AUTHORIZATION_2026-04-28.md`
> Wave ID: W130

---

## 0. Why This Is Next

W129 proved that every capability lane shipped in W122–W128 is working correctly:

- `entry_routing=healthy` — strong intent routing works
- `clarification_recovery=healthy` — clarification loop recovers weak-confidence
- `followup_continuity=healthy` — iteration memory fires correctly

But two lanes remain `no_data` after the full rollout:

- `evidence_export` — 0 `evidence_exported` events across all synthetic passes
- `deliverable_pack` — 0 `deliverable_pack_exported` events across all synthetic passes

This is not a measurement failure. The events exist, the analytics wiring exists, the export buttons exist. The problem is **discoverability**: the export affordances are buried under secondary UI elements, and noncoder users do not encounter them naturally in the execution flow.

W130 closes this gap by making evidence copy and pack download the default, prominent exit from a noncoder execution session.

---

## 1. Product Claim Target

W130 should make this bounded claim true:

> After a noncoder completes an execution in CVF, the natural next action is
> to save their governance evidence and download their deliverable pack.
> Both `evidence_export` and `deliverable_pack` W128 lanes report measured
> (non-`no_data`) status after W130.

This is bounded to:
- `ResultViewer` UX changes only
- existing `evidence_exported` + `deliverable_pack_exported` analytics events
- the W128 lane thresholds already in place

---

## 2. Current State Readout

As of W129 closure:

```
evidence_export:       no_data  (0 evidence_exported events)
deliverable_pack:      no_data  (0 deliverable_pack_exported events)
entry_routing:         healthy
clarification_recovery:healthy
trusted_form:          healthy
followup_continuity:   healthy (thin: 3 events)
```

The `ResultViewer` component already has:
- `data-testid="download-pack-btn"` — deliverable pack download
- `data-testid="pack-view-toggle"` — Result/Pack tab toggle
- `data-testid="deliverable-pack-preview"` — pack preview panel
- Evidence copy/download in the export dropdown

None of these are exposed as the primary post-execution CTA for noncoder users.

---

## 3. Non-Goals

- No new routing capability
- No clarification loop changes
- No iteration memory flow changes
- No changes to `deliverable-pack.ts` core logic
- No new feature flags
- No server-side telemetry
- No governance execution path changes
- No new AI providers or model configuration

---

## 4. Checkpoints

### CP0 — Export Activation Contract Lock

**Deliver**

Produce `docs/reviews/CVF_W130_EXPORT_ACTIVATION_CONTRACT_2026-04-28.md` and lock:

1. Exact UX change for the export nudge in `ResultViewer`
2. Exact tab behavior change for noncoder pack priority
3. Minimum analytics event counts for W128 lane exit
4. Acceptance criteria for E2E spec

**Acceptance**

- Contract is explicit about which UI elements change and how
- Analytics wiring is confirmed (existing events, no new events needed)
- No ambiguity about what "lane exit" means in measurable terms

### CP1 — ResultViewer Noncoder Export Nudge

**Deliver**

Modify `ResultViewer.tsx` to add a **"Save your results"** section that appears
prominently after a completed execution when the noncoder flag
(`NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY`) is enabled.

This section must:
- show a short CTA encouraging the user to copy their evidence receipt
- show a short CTA encouraging the user to download their deliverable pack
- fire `evidence_exported` when the evidence CTA is used
- fire `deliverable_pack_exported` when the pack CTA is used
- only appear when `output` is present (same guard as follow-up section)
- be placed above the follow-up section (higher priority for first-time noncoder use)

**Acceptance**

- Export nudge visible in browser when iteration memory is on and execution has output
- `npx vitest run src/components/ResultViewer.test.tsx` — all existing tests pass + new nudge tests added
- `evidence_exported` and `deliverable_pack_exported` trackEvent calls confirmed in code

### CP2 — Pack Tab Priority For Noncoder Sessions

**Deliver**

When `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true`, the `ResultViewer` Pack tab
should be the default active tab (or should have a visual badge/indicator drawing
attention to it).

Preferred approach: make `activeTab` default to `'pack'` when the noncoder flag
is enabled and a pack preview is available.

**Acceptance**

- Pack tab is the default visible tab in noncoder mode
- Result tab is still accessible via click
- `npx vitest run src/components/ResultViewer.test.tsx` — no regression

### CP3 — E2E Proof Spec

**Deliver**

`tests/e2e/w130-evidence-pack-export.live.spec.ts`

Test strategy:

1. Run 3 noncoder journeys: IntentEntry → DynamicForm → live API → ResultViewer
2. For each journey:
   - Wait for export nudge section to appear
   - Click evidence copy CTA → verify `evidence_exported` event fires
   - Click pack download CTA → verify `deliverable_pack_exported` event fires
3. Read W128 lane readout from localStorage analytics
4. Assert `evidence_export` lane is not `no_data`
5. Assert `deliverable_pack` lane is not `no_data`
6. Produce evidence files:
   - `docs/reviews/CVF_W130_EVIDENCE_PACK_EXPORT_EVIDENCE_2026-04-28.md`
   - `docs/reviews/CVF_W130_EVIDENCE_PACK_EXPORT_EVIDENCE_2026-04-28.json`

**Acceptance**

- At least 1 `evidence_exported` event per spec run
- At least 1 `deliverable_pack_exported` event per spec run
- Live API call to `/api/execute` with real Alibaba key confirmed
- `governanceEvidenceReceipt` present in response

### CP4 — Lane Exit Verification

**Deliver**

Run `computeLaneReadout` from the W130 E2E analytics stream and confirm:

- `evidence_export` lane: exits `no_data` (status is `healthy`, `watch`, or `action_required`)
- `deliverable_pack` lane: exits `no_data` (same)
- No lane enters `action_required` as a result of W130 changes

**Acceptance**

- Lane verification is included in the E2E spec output JSON
- W130 evidence file records both lane statuses explicitly

### CP5 — Closure And Handoff Sync

**Deliver**

- Update `AGENT_HANDOFF.md`: W130-T1 CLOSED DELIVERED entry
- Update `AGENTS.md`: W130 boundary language appended
- GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W130_T1_CLOSED_2026-04-28.md`
- Roadmap status: CLOSED DELIVERED

**Acceptance**

- Future agents can identify W130 as CLOSED and read its delivery claims
- Next continuation candidate is named (or deferred with reason)

---

## 5. Verification Plan

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web

# Unit regression — ResultViewer is the primary change surface
npx vitest run \
  src/components/ResultViewer.test.tsx \
  src/lib/noncoder-metrics.test.ts \
  src/lib/noncoder-rollout-readout.test.ts \
  src/lib/deliverable-pack.test.ts

# E2E spec
DASHSCOPE_API_KEY=<key> \
NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true \
NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true \
NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true \
  npx playwright test tests/e2e/w130-evidence-pack-export.live.spec.ts

# Release gate (mandatory live — governance proof always required)
python scripts/run_cvf_release_gate_bundle.py --json
```

---

## 6. Exit Criteria

W130 closes only when:

- `ResultViewer` export nudge is implemented and tested
- Pack tab default is confirmed for noncoder sessions
- E2E spec fires at least 1 `evidence_exported` + 1 `deliverable_pack_exported` per run
- Both lanes exit `no_data` in the W128 readout
- No lane enters `action_required`
- Handoff canon states the outcome unambiguously

---

## 7. Execution Locks

1. W130 is a noncoder export discoverability tranche — no capability expansion
2. No new feature flags
3. No governance execution path changes
4. ResultViewer changes must maintain backward compatibility with non-noncoder sessions
5. All evidence claims must use real `/api/execute` with `DASHSCOPE_API_KEY`

---

## 8. Expected W131 Shapes

W130 exists to justify one of these follow-on shapes, but not to pre-choose them:

1. `W131 — Noncoder Follow-Up Continuity Quality Uplift` (if `followup_continuity` drops to `watch` with real traffic)
2. `W131 — Noncoder First Real-Traffic Readout` (if operator runs live sessions and wants a measured health report)
3. `W131 — Trusted Form Corpus Expansion` (if trusted form match rate shows gaps in real usage)
4. `W131 — Clarification Question Quality Optimization` (if `clarification_recovery` rate drops with diverse real prompts)

W131 should be chosen from measured W128 lane data after W130 export signals accumulate real traffic.
