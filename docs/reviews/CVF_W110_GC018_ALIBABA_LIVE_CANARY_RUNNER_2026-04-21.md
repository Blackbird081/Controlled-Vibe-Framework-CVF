# CVF W110-T1 GC-018 Continuation Candidate
# Front-Door Live Canary Runner (Alibaba-only)

Memory class: POINTER_RECORD
Date: 2026-04-21
Parent: front-door rewrite wave, Steps 1–4, MATERIALLY DELIVERED (commit bf28ed9b)

---

```text
GC-018 Continuation Candidate
- Candidate ID: CVF-W110-T1-GC018-2026-04-21
- Date: 2026-04-21
- Parent roadmap / wave: front-door rewrite (Steps 1–4), MATERIALLY DELIVERED bf28ed9b
- Proposed scope: Operator-facing Alibaba live canary runner — wraps 6 proven
  front-door scenarios into a triggerable surface that returns pass/fail +
  packet quality summary + evidence receipt; stores receipts in docs/audits/
  alibaba-canary/
- Continuation class: REALIZATION
- Active quality assessment: docs/baselines/CVF_W109_T1_CP1_PLATFORM_PAGES_
  VISUAL_SYNC_DELTA_2026-04-19.md (most recent closed baseline)
- Assessment date: 2026-04-19
- Weighted total: 9.0/10
- Lowest dimension: Portfolio priority (1/2 — not on blocking path)
- Quality-first decision: EXPAND_NOW
- Why expansion is still the better move now: All 6 front-door scenarios prove
  live on Alibaba lane. The scenarios exist but the surface is not reusable —
  every re-run is manual. Canary runner converts proven proof into repeatable
  regression detection before production-facing changes propagate further. No
  existing canary instrument exists. Runner wraps existing test files; no
  mutation to proven governance layer.
- Quality protection commitments: (1) Runner wraps existing test files only —
  no mutation to route.front-door-rewrite.alibaba.live.test.ts. (2) Evidence
  receipts are append-only in docs/audits/alibaba-canary/. (3) Runner is R0
  safe — read-only execution, no state mutation, no new provider contracts.
  (4) Scenario set is locked at 6 for this tranche; additions require a new
  GC-018.
- Why now: Step 4 of front-door roadmap closed (bf28ed9b). Window before
  public-facing changes go further; regression risk is live now.
- Active-path impact: NONE
- Risk if deferred: Alibaba lane regressions caught only by accident or not
  caught until production-facing changes are far along; manual re-run burden
  falls on individual sessions without a portable instrument.
- Lateral alternative considered: YES
- Why not lateral shift: Multi-provider expansion (Anthropic, OpenAI) is
  deferred. Canary runner stays Alibaba-only and reuses governance-approved
  test files as the truth surface — no new architecture, no new provider
  contracts.
- Real decision boundary improved: YES — operators gain a go/no-go instrument
  for Alibaba regression before any change that touches the execute path
- Expected enforcement class: RUNTIME_GUARD
- Required evidence if approved:
  - scripts/run_cvf_alibaba_live_canary.py (runnable, exit-0 on clean lane)
  - docs/audits/alibaba-canary/RECEIPT_<run-id>.json (first clean receipt)
  - docs/audits/alibaba-canary/RECEIPT_<run-id>.md (human-readable summary)

Depth Audit
- Risk reduction: 2 (live runtime regression detection; currently uncovered)
- Decision value: 2 (operator go/no-go before production changes)
- Machine enforceability: 2 (automated pass/fail + structured receipt)
- Operational efficiency: 2 (replaces manual per-session test runs)
- Portfolio priority: 1 (not blocking active path; directly protects it)
- Total: 9
- Decision: CONTINUE
- Reason: High enforceability + decision value; NONE active-path impact;
  proven scenarios already exist as live test files

Authorization Boundary
- Authorized now: YES
- Next batch name: CVF-W110-T1-CP1 (Canary Runner Script + Evidence Receipt)
- If NO, reopen trigger: N/A
```

---

## Locked Scenario Set (W110-T1)

| # | Template ID | Source file | Min output |
|---|---|---|---|
| S1 | `app_builder_complete` | route.front-door-rewrite.alibaba.live.test.ts | 500 chars |
| S2 | `api_design` | route.front-door-rewrite.alibaba.live.test.ts | 450 chars |
| S3 | `code_review` | route.front-door-rewrite.alibaba.live.test.ts | 400 chars |
| S4 | `documentation` | route.front-door-rewrite.alibaba.live.test.ts | 400 chars |
| S5 | `web_ux_redesign_system` | route.front-door-rewrite.alibaba.live.test.ts | 600 chars |
| S6 | `data_analysis` | route.front-door-rewrite.alibaba.live.test.ts | 450 chars |

Scenarios are frozen. Any addition or mutation requires a new GC-018.

## Explicit Exclusions

- Multi-provider expansion (Anthropic, OpenAI): deferred
- UI canary surface (web page for operator triggering): deferred
- `web_build_handoff` scenario: out of scope for this tranche
- Scenario content mutation or new prompt content: not in scope
- `L0–L4` risk-model migration: not in scope
