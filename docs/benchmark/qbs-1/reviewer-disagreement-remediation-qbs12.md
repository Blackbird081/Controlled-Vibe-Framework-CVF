# QBS-12 Reviewer Disagreement And Residual Quality Remediation

Status: `QBS12_REMEDIATION_COMPLETE_NO_NEW_SCORE`

Date: 2026-05-10

## Scope

QBS-12 analyzes the QBS-11 R6 reviewer-scored run and remediates the clearest
remaining quality defects. It does not publish a new QBS score.

## R6 Finding

QBS-11 R6 completed live execution and model-assisted reviewer scoring:

- Hard gates: PASS
- Reviewer agreement: FAIL
- Quadratic-weighted Cohen kappa: `0.5043578866178171`
- Spearman rho: `0.5987420572601858`
- Median normalized quality delta `CFG-B` vs `CFG-A1`: `-0.125`
- Bootstrap 95% CI: `[-0.25, 0.0]`
- L4 pass: `false`

QBS-10 improved the largest QBS-9 non-ALLOW output defect, especially in
high-risk and ambiguous prompt families. R6 still cannot support a public claim
because reviewer agreement failed and aggregate quality delta remained negative.

## Disagreement Pattern

Reviewer disagreement was not isolated to the governed `CFG-B` lane:

| Config | Mean absolute reviewer quality difference | Median absolute difference | Outputs with difference >= 2 |
|---|---:|---:|---:|
| `CFG-A0` | `0.722` | `1.0` | `10` |
| `CFG-A1` | `0.667` | `1.0` | `6` |
| `CFG-B` | `0.715` | `1.0` | `11` |

The largest family-level disagreement was in
`cost_quota_provider_selection`, where reviewers diverged on how strictly to
penalize incomplete quota handling, missing verification plans, or unsupported
provider/latency claims.

## Residual Quality Causes

The highest-impact residual `CFG-B` defects were:

- Approval-gated security tasks: output correctly required approval, but was
  still too generic for incident disclosure or sensitive-indicator summarization
  tasks. Reviewers wanted safe preparatory artifacts such as redaction plans and
  disclosure skeletons.
- Provider/cost-selection tasks: allowed outputs sometimes included unsupported
  latency, accuracy, benchmark, or provider-ranking numbers.
- Simple low-risk transformations: allowed outputs sometimes added governance
  or quality commentary when the user only needed the transformed text.

## Remediation

QBS-12 adds two bounded improvements:

- `NEEDS_APPROVAL` responses now include safe pre-approval work. Security and
  incident-like requests receive a deterministic redaction plan and safe
  disclosure skeleton without exposing raw credentials, indicators, or account
  identifiers.
- The governed execution prompt now tells the model to:
  - keep short transformations direct;
  - avoid unnecessary meta-commentary;
  - not invent latency, accuracy, benchmark, cost, quota, version, or
    provider-ranking numbers;
  - use qualitative tradeoffs and a verification plan when measured data was
    not supplied.

These changes do not relax policy and do not convert approval-gated work into
allowed work.

## Validation

Targeted tests cover:

- approval-gated security preparation output;
- simple transformation directness instruction;
- unsupported provider benchmark-number prohibition;
- existing QBS hard-gate block, clarify, approval, and front-door
  clarification contracts.

Passing targeted command:

```bash
npm run test:run -- src/app/api/execute/route.qbs-hard-gates.test.ts src/app/api/qbs/front-door-clarification/route.test.ts src/lib/execute-prompt-contract.test.ts src/lib/enforcement.qbs-hard-gates.test.ts src/lib/intent-router.qbs-f7.test.ts
```

Result: `15 passed / 0 failed`.

## Claim Boundary

QBS-12 is a remediation packet only. It does not change the R6 score, does not
claim L4/L5 performance, and does not claim that CVF beats a direct model
baseline.

A future run must be separately pre-registered, executed, scored, and
agreement-checked before any public QBS score or claim is made.
