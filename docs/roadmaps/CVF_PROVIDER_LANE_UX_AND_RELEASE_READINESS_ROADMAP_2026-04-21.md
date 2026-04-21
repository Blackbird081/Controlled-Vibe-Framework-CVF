# CVF Provider Lane UX And Release Readiness Roadmap

Memory class: SUMMARY_RECORD

> Date: 2026-04-21
> Status: FULLY DELIVERED 2026-04-21 — CP1-CP4 closed
> Context: post-W110-T2 provider lane certification closure

---

## Goal

Turn provider lane certification from a backend/docs capability into a clear operator and user-facing product surface.

W110-T2 already delivered:

- canonical lane status taxonomy
- provider readiness matrix
- generalized live canary runner
- certification evaluator
- `laneStatus` in `/api/providers`

The next step is not to prove multi-provider operability again. That is already proven.

The next step is to make provider choice understandable and release-safe:

- users can see which lanes are certified or experimental
- operators know when and how to run canaries
- release checks can report provider readiness without spending paid API credits by default
- DeepSeek has a clean path from `CANARY_PASS` to `CERTIFIED` if the operator chooses to pay for repeat canaries

---

## Current Provider Truth

Canonical matrix:

- `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md`

Current lane state:

| Provider | Model | Status | Meaning |
|---|---|---|---|
| Alibaba | `qwen-turbo` | `CERTIFIED` | latest 3 saved canaries are PASS 6/6 |
| DeepSeek | `deepseek-chat` | `CERTIFIED` | latest 3 saved canaries are PASS 6/6 |

Claim boundary:

> Multi-provider operability is proven. Provider parity is not claimed. Provider economics remain user-selected.

This roadmap must preserve that claim boundary in UI text, docs, runbooks, and release output.

Delivery status:

- CP1 Provider Status UI: DELIVERED
- CP2 Operator Runbook: DELIVERED
- CP3 Release Readiness Gate: DELIVERED
- CP4 DeepSeek Certification Repeat: DELIVERED — DeepSeek promoted to `CERTIFIED`

Implementation delta: `docs/baselines/CVF_W110_T3_PROVIDER_LANE_UX_RELEASE_READINESS_DELTA_2026-04-21.md`

---

## Non-Goals

This roadmap is not for:

- adding another provider
- changing provider adapters beyond status display needs
- forcing DeepSeek certification without operator consent
- running paid live canaries in default CI
- claiming all providers have equal speed, cost, quality, or reliability
- reopening core architecture planes

---

## Step 1 — Provider Status UI

Purpose:

- surface provider lane state where users already choose providers
- make `CERTIFIED`, `CANARY_PASS`, `EXPERIMENTAL`, and `UNCONFIGURED` visible and understandable
- keep user choice tied to cost/performance tradeoffs, not hidden framework defaults

Target surfaces:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/Settings.tsx`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ProviderSwitcher.tsx`
- any shared provider status component if the agent chooses to extract one

Required behavior:

- fetch or receive `laneStatus` from `/api/providers`
- show a compact provider badge:
  - `Certified`
  - `Canary Pass`
  - `Experimental`
  - `Unconfigured`
  - `Blocked`
  - `Degraded`
- do not rank providers as "best", "fastest", or "cheapest"
- show provider economics language in small supporting text:
  - "User-paid provider lane"
  - "Certification reflects CVF canary evidence, not universal provider parity"

Suggested UI copy:

| Status | Suggested copy |
|---|---|
| `CERTIFIED` | `Certified by repeated CVF canary` |
| `CANARY_PASS` | `Latest CVF canary passed` |
| `EXPERIMENTAL` | `Integrated; certification evidence pending` |
| `UNCONFIGURED` | `Add API key to enable` |
| `BLOCKED` | `Configured but blocked by provider/account` |
| `DEGRADED` | `Previous proof exists; latest canary failed` |

Exit:

- users can see lane status before choosing a provider
- no UI text implies provider parity

---

## Step 2 — Provider Details / Evidence Links

Purpose:

- let operators inspect why a provider has its current status
- connect UI state to evidence receipts rather than magic labels

Minimum viable behavior:

- add a provider details panel, tooltip, or expandable row in Settings
- show:
  - provider
  - model
  - lane status
  - readiness note
  - latest receipt path or docs link
  - certification window summary, e.g. `3/3 PASS` or `1/3 PASS`

Recommended source:

- `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md`
- `/api/providers` for runtime configured/unconfigured status

Optional implementation:

- add a static provider lane metadata map in `cvf-web`
- keep the source small and easy to update

Exit:

- status labels are explainable from the product surface

---

## Step 3 — Operator Runbook

Purpose:

- document how an operator maintains provider lane readiness
- prevent accidental paid API usage or stale status claims

Create:

- `docs/reference/CVF_PROVIDER_LANE_OPERATOR_RUNBOOK.md`

Required sections:

1. **When To Run Smoke**
   - after credential rotation
   - after provider settings change
   - before release if provider status is used in release notes

2. **When To Run Full Canary**
   - before promoting a lane to `CERTIFIED`
   - after changing `/api/execute` provider routing
   - after modifying locked front-door template outputs

3. **When To Save Receipt**
   - certification evidence
   - release evidence
   - regression investigation

4. **When Not To Save Receipt**
   - exploratory debugging
   - known missing-key checks
   - failed local setup unrelated to provider behavior

5. **Downgrade Protocol**
   - latest canary fails after prior pass -> `DEGRADED`
   - auth/billing/rate-limit blocks execution -> `BLOCKED`
   - no key -> `UNCONFIGURED`

6. **DeepSeek Certification Path**
   - run two more saved DeepSeek canaries only if operator agrees to cost/time
   - if both pass, evaluator should report `CERTIFIED`
   - if either fails, keep or downgrade status according to evaluator result

Exit:

- future agents can operate provider certification without asking the user for the whole policy again

---

## Step 4 — Release Readiness Gate

Purpose:

- make provider lane readiness visible in release checks without default paid calls

Create or extend a local release helper:

- candidate: `scripts/check_cvf_provider_release_readiness.py`
- or integrate into an existing release packet/export script if that is cleaner

Required behavior:

- run `scripts/evaluate_cvf_provider_lane_certification.py --json`
- fail only if matrix/evaluator cannot run or canonical expected providers are absent
- do not call live provider APIs
- print:
  - certified lanes
  - canary-pass lanes
  - degraded/blocked lanes
  - latest receipt paths

Recommended exit policy:

| Outcome | Exit |
|---|---|
| evaluator runs and at least one lane is `CERTIFIED` | `0` |
| no certified lane but at least one `CANARY_PASS` | `0` with warning |
| all known lanes missing receipts | `1` |
| evaluator or matrix parse fails | `1` |

Exit:

- release output can say provider readiness was checked without spending provider credits

---

## Step 5 — DeepSeek Optional Certification Repeat

Purpose:

- give the operator a bounded path to promote DeepSeek from `CANARY_PASS` to `CERTIFIED`

This step is optional and user-cost-aware.

Prerequisite:

- operator explicitly agrees to run two additional saved DeepSeek canaries

Commands:

```bash
python scripts/run_cvf_provider_live_canary.py --provider deepseek --save-receipt
python scripts/run_cvf_provider_live_canary.py --provider deepseek --save-receipt
python scripts/evaluate_cvf_provider_lane_certification.py
```

Expected promotion:

- if DeepSeek has 3 consecutive PASS 6/6 receipts, evaluator reports `CERTIFIED`

If not:

- keep `CANARY_PASS` if latest full pass exists but window is below 3
- mark `DEGRADED` if latest canary fails after prior full pass
- do not change the architecture claim; CVF multi-provider operability remains proven

Exit:

- DeepSeek status is either promoted or explicitly left at the evidence-backed status

---

## Step 6 — Canon Sync

Purpose:

- prevent docs from drifting after provider UX/release readiness changes

Required updates after implementation:

- `README.md`
- `AGENT_HANDOFF.md`
- `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md`
- `docs/reference/CVF_PROVIDER_LANE_OPERATOR_RUNBOOK.md`
- release readiness output docs if created

Required wording:

> Provider lane status is evidence-backed. CVF proves governed multi-provider operability; users choose provider economics.

Exit:

- future agents see the same state in README, handoff, matrix, and runbook

---

## Recommended Control Points

### CP1 — UI Status Display

Deliver:

- Settings/ProviderSwitcher lane badges
- provider status copy that avoids parity claims
- targeted tests for status rendering if the surface already has tests

Suggested verification:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm run test:run -- src/app/api/providers/route.test.ts
npm run build
```

### CP2 — Operator Runbook

Deliver:

- `docs/reference/CVF_PROVIDER_LANE_OPERATOR_RUNBOOK.md`
- runbook links to matrix, evaluator, and canary runner

Suggested verification:

```bash
python scripts/evaluate_cvf_provider_lane_certification.py
```

### CP3 — Release Readiness Gate

Deliver:

- release readiness script or integration
- no paid API calls by default
- test or dry-run output

Suggested verification:

```bash
python scripts/check_cvf_provider_release_readiness.py
```

### CP4 — Optional DeepSeek Promotion

Deliver only if operator approves paid live runs:

- two additional saved DeepSeek canaries
- evaluator output after runs
- matrix update if status changes

Suggested verification:

```bash
python scripts/evaluate_cvf_provider_lane_certification.py
```

---

## Evidence Requirements

Each completed control point should leave:

- a baseline delta under `docs/baselines/`
- a short review or assessment if UI/release semantics materially change
- test output recorded in the relevant test log if the active tranche requires it
- saved canary receipts only for intentional certification/release evidence

Do not commit or print API keys.

---

## Risk Notes

- Provider status UI can accidentally look like a provider ranking; avoid that.
- DeepSeek repeat canaries are slow and paid; do not run them without operator approval.
- CI must remain free by default; live provider calls should be opt-in.
- Static `laneStatus` maps can drift from receipt evidence; prefer evaluator/matrix sync where practical.
- A provider being slow or expensive is not a CVF architecture failure.

---

## Success Definition

This roadmap is complete when:

1. Provider lane status is visible in user/operator provider selection surfaces.
2. Evidence links or explanations are available from the product/docs surface.
3. A provider lane operator runbook exists.
4. Release readiness can report lane certification without live paid calls.
5. Optional DeepSeek certification repeat has either been completed with operator approval or explicitly deferred.
6. README, handoff, matrix, and runbook agree on the claim boundary.

---

*Filed: 2026-04-21 — next-agent roadmap after provider lane certification closure*
