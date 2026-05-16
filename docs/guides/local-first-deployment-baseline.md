# Local-First Deployment Baseline

Memory class: POINTER_RECORD

Status: CURRENT RECOMMENDED NEXT STEP

Date: 2026-05-16

This guide turns the current CVF state into a practical local-first deployment
baseline. It is meant for operators and evaluators who want to run CVF, inspect
governance behavior, and understand the current quality boundary without
reading the private provenance archive.

## Purpose

Explain how to use the current public CVF state as a local-first governance
baseline without overstating output-quality claims.

## Quick Summary

Use the current CVF state as a local-first baseline: run the web app, supply
keys only through trusted local settings or environment variables, run live
proof when making governance claims, and state clearly that output-quality
parity with direct provider output has not been proven.

## Scope

This guide covers operator setup, live governance proof, demo flow, known
limits, and the recommended operating decision. It does not authorize new
runtime behavior or new provider certification.

## Claim Boundary

Allowed: CVF is a governance-first local deployment baseline with bounded live
proof. Not allowed: CVF has output-quality parity, broad EVT-4 superiority, or
a clean full EVT-4 no-degrade result.

## Source

Predecessor evidence behind this baseline:

- `docs/evidence/current-cvf-quality-status.md` — current quality posture
- `docs/evidence/local-first-release-gate-proof-2026-05-16.md` — release-gate proof
- `docs/evidence/claim-boundaries.md` — public claim boundary
- `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md` — known limits register

## Decision

Treated as the current recommended next step for operators evaluating CVF
locally. Future updates to the recommended baseline require fresh evidence
under `docs/evidence/` and explicit revision of this guide.

## Evidence

The release-gate command in section 3 and the public receipts under
`docs/evidence/provider-lane-receipts/` are the operational evidence backing
this baseline. The known-limits section makes explicit which claims are not
backed by evidence.

## 1. What This Baseline Claims

Allowed claim:

CVF is a governance-first local deployment baseline. It provides a governed
request path, provider boundary, DLP/output-validation posture, audit receipts,
and structured non-coder deliverable contracts.

Plain-language user value:

- users can start from guided work surfaces instead of blank prompts;
- important checks are visible before a result is accepted;
- receipts make it easier to review what happened later;
- handoff packets reduce guesswork when another person continues the work;
- new approved knowledge should appear as clearer web guidance, not as hidden
  complexity.

Not allowed:

- CVF has output-quality parity with direct provider output.
- CVF improves output quality across EVT-4.
- The full EVT-4 roadmap-completion run was clean no-degrade.
- Focused sample checks prove broad metric superiority.

See:

- `docs/evidence/current-cvf-quality-status.md`
- `docs/evidence/local-first-release-gate-proof-2026-05-16.md`
- `docs/evidence/claim-boundaries.md`

## 2. Operator Setup

Install and run the web control surface:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm ci
npm run dev
```

Open:

```text
http://localhost:3000
```

UI-only walkthroughs are useful for navigation, template review, settings, and
evidence surface inspection. They do not prove live governance behavior.

## 3. Live Governance Proof

Use this when you need to claim CVF governed a real provider call.

Set one operator-supplied DashScope-compatible key. Do not commit or print raw
key values.

Accepted environment variables:

```text
DASHSCOPE_API_KEY
ALIBABA_API_KEY
CVF_ALIBABA_API_KEY
CVF_BENCHMARK_ALIBABA_KEY
```

Run:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Expected release-quality posture:

- the command must include live governance E2E;
- the command must fail if no DashScope-compatible live key is available;
- mock UI checks are not a substitute for governance proof.

Latest public proof:

- `docs/evidence/local-first-release-gate-proof-2026-05-16.md`

## 4. Demo Path

Use this short demo when showing CVF to a collaborator.

### Step 1 - Show The Current Claim Boundary

Open:

```text
docs/evidence/current-cvf-quality-status.md
```

Say:

> CVF is strongest as a governance-first local baseline. It preserves receipts,
> auditability, and safety checks, while output-quality parity is not proven.

### Step 2 - Start The Local UI

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm run dev
```

Open:

```text
http://localhost:3000
```

Show:

- template gallery;
- provider/settings posture;
- governance/safety surfaces;
- non-coder workflows.

### Step 3 - Explain The Smallest Useful Flow

```text
request -> risk check -> governed provider call -> validation -> audit receipt
```

The point is not that CVF makes every output better. The point is that a real
AI workflow becomes bounded, auditable, and easier to review.

### Step 4 - Run Live Proof When Needed

Only if a key is configured:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

After it passes, cite the release gate as governance operability evidence, not
as output-quality parity evidence.

## 5. Known Limits To State Up Front

Current known limits:

- Full EVT-4 roadmap-completion regression was `19/20`, not a clean `20/20`.
- The full run had one intermittent `EVT4-03` CFG-B `EMPTY_OUTPUT` /
  output-validation `422`.
- The isolated EVT4-03 diagnostic completed with a live receipt, but the lane
  remained weak.
- Focused QH checks verify structure and live receipt behavior, not broad
  metric superiority.
- Public QBS quality score is not claimed.

## 6. Recommended Operating Decision

Use the current CVF state as a good local-first governance baseline.

Do not continue general output-quality tuning by default. Any future quality
work should be a fresh narrow tranche against one weak lane, such as:

- feature-priority reliability/output validation;
- competitor-review specificity;
- ops-plan consistency;
- channel-choice activation depth.

## 7. Review Checklist

Before showing or adopting CVF, confirm:

- [ ] README and claim boundaries are understood.
- [ ] Operator has supplied provider keys only through environment variables.
- [ ] Live governance proof was run if making runtime governance claims.
- [ ] Public claims cite curated evidence, not private handoffs or raw logs.
- [ ] Output-quality parity is not claimed.
- [ ] Remaining weak lanes are treated as future roadmap candidates, not hidden
      blockers.
