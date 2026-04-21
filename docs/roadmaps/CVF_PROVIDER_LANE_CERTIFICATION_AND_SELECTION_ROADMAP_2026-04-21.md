# CVF Provider Lane Certification And Selection Roadmap

Memory class: SUMMARY_RECORD

> Date: 2026-04-21
> Status: FULLY DELIVERED 2026-04-21 — all four control points closed
> Context: post-Alibaba + post-DeepSeek live canary PASS 6/6

---

## Goal

Move CVF from "multi-provider operability proven" to "provider lane selection is productized, auditable, and user-owned".

CVF has now proven that the same governed front-door canary flow can run on more than one live provider lane:

- Alibaba `qwen-turbo`: live canary PASS 6/6
- DeepSeek `deepseek-chat`: live canary PASS 6/6

The next roadmap must not re-litigate whether CVF can support multi-provider execution. That is now proven at the operability layer.

The next problem is productizing provider choice:

- which lanes are available
- which lanes are certified
- which lanes are experimental or degraded
- which evidence supports each lane
- how users choose speed, cost, quality, and reliability tradeoffs

Delivery status:

- CP1 status taxonomy + readiness matrix: DELIVERED
- CP2 generalized provider live canary runner: DELIVERED
- CP3 certification evaluator: DELIVERED
- CP4 provider status API/docs productization: DELIVERED

Implementation delta: `docs/baselines/CVF_W110_T2_PROVIDER_LANE_CERTIFICATION_DELTA_2026-04-21.md`

---

## Product Claim Boundary

Allowed claim after this roadmap starts:

> CVF has proven multi-provider operability across live provider lanes. Provider-specific speed, output quality, latency, reliability, and cost are lane economics chosen by the user, not CVF architecture blockers.

Do not claim:

- all providers are equally fast
- all providers produce equal output quality
- all providers have equal cost
- all providers are certified
- universal provider parity across every model

The roadmap should preserve this distinction:

- **CVF-owned**: governance, policy routing, evidence receipts, status classification, approval flow, trace capture
- **Provider-owned / user-selected**: model strength, latency, price, billing limits, outage behavior, rate limits

---

## Evidence Already Available

| Lane | Latest proof | Status |
|---|---|---|
| Alibaba `qwen-turbo` | `docs/audits/alibaba-canary/CVF_RECEIPT_20260421-072551-422037.md` | PASS 6/6 |
| DeepSeek `deepseek-chat` | `docs/audits/deepseek-canary/CVF_RECEIPT_20260421-074637-0c0d3e.md` | PASS 6/6 |

Supporting index files:

- `docs/audits/alibaba-canary/INDEX.md`
- `docs/audits/deepseek-canary/INDEX.md`

Existing runner/spec references:

- `scripts/run_cvf_alibaba_live_canary.py`
- `scripts/run_cvf_multi_provider_live_smoke.py`
- `docs/reference/CVF_ALIBABA_LIVE_CANARY_RUNNER_SPEC.md`
- `docs/baselines/CVF_MULTI_PROVIDER_DEEPSEEK_ENABLEMENT_DELTA_2026-04-21.md`

---

## Non-Goals

This roadmap is not for:

- reopening CPF/EPF/GEF/LPF architecture
- proving non-coder value from scratch again
- forcing every provider into equal performance
- hiding provider-specific cost or latency differences
- adding new providers before lane certification is defined
- rewriting every legacy provider integration

---

## Step 1 — Provider Lane Status Model

Purpose:

- create a small canonical status taxonomy for provider lanes
- let CVF distinguish "configured", "live", "certified", "degraded", and "blocked"
- prevent future docs from mixing architecture proof with provider economics

Recommended statuses:

| Status | Meaning |
|---|---|
| `UNCONFIGURED` | no usable key or provider env is available |
| `BLOCKED` | key exists but provider/billing/auth/rate-limit prevents execution |
| `LIVE` | smoke request succeeds against real provider |
| `CANARY_PASS` | locked 6-scenario canary passes once |
| `CERTIFIED` | repeatability threshold is met |
| `DEGRADED` | lane works but fails recent canary or exceeds declared reliability threshold |
| `EXPERIMENTAL` | integration exists but lacks full canary evidence |

Implementation guidance:

- prefer a typed registry over ad hoc strings
- keep statuses provider-neutral
- include `lastRunAt`, `receiptPath`, `provider`, `model`, and `reason`

Candidate output:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/provider-lane-status.ts`
- focused unit tests for status classification

Exit:

- a lane can be classified without reading arbitrary receipt files manually

---

## Step 2 — Provider Readiness Matrix

Purpose:

- expose the current provider truth in one canonical document and eventually the UI
- separate evidence-backed state from marketing claims

Minimum matrix columns:

| Column | Description |
|---|---|
| Provider | e.g. Alibaba, DeepSeek |
| Model | e.g. `qwen-turbo`, `deepseek-chat` |
| Lane status | taxonomy from Step 1 |
| Latest receipt | link to latest evidence |
| Pass window | e.g. `latest PASS 6/6`, `3 consecutive PASS` |
| Operator note | short note on known tradeoff or blocker |

Candidate docs:

- `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md`
- optional generated JSON: `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.json`

Initial expected rows:

| Provider | Model | Initial status |
|---|---|---|
| Alibaba | `qwen-turbo` | `CERTIFIED` if repeat threshold is set to 3 consecutive PASS; otherwise `CANARY_PASS` |
| DeepSeek | `deepseek-chat` | `CANARY_PASS`; eligible for `CERTIFIED` after repeat threshold |

Exit:

- README and handoff can point to one canonical provider matrix
- future provider additions have a standard slot

---

## Step 3 — Generalize Live Canary Runner

Purpose:

- stop treating provider canaries as one-off scripts
- support a common runner interface for each provider lane

Target command shape:

```bash
python scripts/run_cvf_provider_live_canary.py --provider alibaba --model qwen-turbo --save-receipt
python scripts/run_cvf_provider_live_canary.py --provider deepseek --model deepseek-chat --save-receipt
```

Required behavior:

- reuse the same locked 6 scenario set
- preserve the existing receipt format
- write receipts into provider-specific folders:
  - `docs/audits/alibaba-canary/`
  - `docs/audits/deepseek-canary/`
- never print secrets
- return stable exit codes:
  - `0`: all scenarios PASS
  - `1`: one or more scenarios FAIL
  - `2`: provider key/config missing
  - `3`: provider unsupported

Compatibility requirement:

- keep `scripts/run_cvf_alibaba_live_canary.py` working, either as a wrapper or legacy path
- do not break existing Alibaba receipt format

Exit:

- one command can run provider canary for both Alibaba and DeepSeek

---

## Step 4 — Repeatability Certification Gate

Purpose:

- define when a lane moves from `CANARY_PASS` to `CERTIFIED`
- keep "works once" separate from "operator-safe default"

Recommended threshold:

- `CERTIFIED`: latest 3 saved canary receipts are PASS 6/6
- `CANARY_PASS`: latest saved canary receipt is PASS 6/6 but fewer than 3 consecutive passes
- `DEGRADED`: latest saved canary receipt fails after previous pass
- `BLOCKED`: latest run cannot reach provider due to auth, billing, quota, or network/provider rejection

Initial interpretation:

- Alibaba likely qualifies for `CERTIFIED` because latest index shows 3 PASS 6/6 runs after the first failed run.
- DeepSeek should remain `CANARY_PASS` until it has repeat PASS receipts beyond the latest single 6/6.

Candidate output:

- `scripts/evaluate_cvf_provider_lane_certification.py`
- tests for receipt-window parsing
- update provider readiness matrix from evaluation output

Exit:

- lane certification can be computed from receipts, not hand-written by memory

---

## Step 5 — User-Facing Provider Selection Semantics

Purpose:

- make provider choice explicit in the product surface
- present cost/performance as user-owned tradeoffs

Settings/Provider Switcher should eventually distinguish:

| Label | Meaning |
|---|---|
| `Certified` | repeated canary proof exists |
| `Canary Pass` | latest canary proof exists |
| `Experimental` | integration exists but no full canary proof |
| `Blocked` | configured but not executable |
| `User-paid` | provider billing/cost is external to CVF |

Do not encode absolute claims such as:

- "best"
- "cheapest"
- "fastest"
- "highest quality"

Better phrasing:

- "lower observed latency in latest CVF canary"
- "user-paid provider lane"
- "latest canary PASS"
- "certification pending repeatability"

Exit:

- the UI can honestly communicate provider choice without promising provider parity

---

## Step 6 — Canon Sync

Purpose:

- keep the new multi-provider truth aligned across front-door docs

Required updates after implementation:

- `README.md`
- `AGENT_HANDOFF.md`
- `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md`
- optional release/status doc if the agent opens one under `docs/reference/`

Required wording:

> Multi-provider operability is proven. Provider parity is not claimed. Provider economics remain user-selected.

Exit:

- future agents no longer see stale "multi-provider not proven" language

---

## Recommended Control Points

### CP1 — Status Taxonomy + Matrix

Deliver:

- typed lane status model
- provider readiness matrix doc
- tests for status classification

Suggested verification:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run test:run -- src/lib/provider-lane-status.test.ts
```

### CP2 — Generalized Canary Runner

Deliver:

- `scripts/run_cvf_provider_live_canary.py`
- backward-compatible Alibaba wrapper or preserved legacy runner
- DeepSeek support under same locked scenario set

Suggested verification:

```bash
python scripts/run_cvf_provider_live_canary.py --provider alibaba --model qwen-turbo
python scripts/run_cvf_provider_live_canary.py --provider deepseek --model deepseek-chat
```

### CP3 — Certification Evaluator

Deliver:

- receipt-window evaluator
- certification result output
- matrix update path

Suggested verification:

```bash
python scripts/evaluate_cvf_provider_lane_certification.py
```

### CP4 — UI/Docs Productization

Deliver:

- provider selection labels in Settings/Provider Switcher or provider status route
- canon sync in README + handoff + matrix

Suggested verification:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run test:run
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run build
```

---

## Evidence Requirements

Each completed CP should leave:

- a short delta doc under `docs/baselines/`
- a review or assessment under `docs/reviews/` or `docs/assessments/`
- test commands and outcomes in the relevant test log if the tranche requires it
- saved canary receipts only when live provider tests are intentionally executed

Do not save live receipts for exploratory failed runs unless the run is part of the governed certification evidence trail.

---

## Risk Notes

- Live provider tests spend user-paid credits.
- DeepSeek canary currently passes but has slower observed runtime than Alibaba in the latest receipt. Treat this as provider-lane economics, not CVF failure.
- Keys must remain local; never print or commit secrets.
- CI should not require paid provider keys unless explicitly configured as an operator-owned release gate.
- Any provider outage should degrade the provider lane, not the whole CVF architecture claim.

---

## Stopping Rules

Stop and escalate if:

- implementation requires changing core architecture planes
- generalized runner would print secrets
- provider certification requires paid live calls in default CI
- docs drift toward claiming universal provider parity
- a provider integration requires broad rewrite outside provider boundary

---

## Success Definition

This roadmap is complete when:

1. CVF has a canonical provider lane status taxonomy.
2. Alibaba and DeepSeek appear in a provider readiness matrix with evidence links.
3. A generalized provider canary runner can run the locked 6-scenario set for both lanes.
4. A certification evaluator can distinguish `CANARY_PASS` from `CERTIFIED`.
5. UI/docs communicate provider choice as user-owned cost/performance tradeoff.
6. Canon no longer says multi-provider is unproven.

---

*Filed: 2026-04-21 — next-agent roadmap after multi-provider operability proof*
