# CVF Quality Benchmark Suite Claim Ladder

Status: `PUBLIC_METHODOLOGY`

This document defines which quality claims CVF may make from benchmark and live
evidence.

## Claim Levels

| Level | Claim | Required Evidence |
|---|---|---|
| L1 | Provider/model live operability | A live provider smoke test succeeds for the named provider/model. |
| L2 | Governed path operability | A live `/api/execute` call succeeds with a CVF governance receipt. |
| L3 | Provider/model canary certification | 3 consecutive PASS canary receipts for the named provider/model. |
| L4 | CVF quality uplift | A powered direct-vs-governed benchmark meets L4 thresholds. |
| L5 | CVF control value | L4 plus safety, control, traceability, and cost hard gates. |
| L6 | Cross-provider confidence | L4/L5 across 3 provider families and named models. |

Two-provider results may be described as `TWO_PROVIDER_CORROBORATION`, not L6.

## Run Classes

| Run Class | Purpose | Allowed Claim |
|---|---|---|
| `CALIBRATION_PILOT` | Validate harness, corpus, rubric, and scoring workflow. | Directional only. |
| `POWERED_SINGLE_PROVIDER` | Prove L4/L5 for one named provider/model. | Bounded L4/L5. |
| `POWERED_MULTI_PROVIDER` | Prove L6 confidence across 3 provider families. | Bounded L6. |
| `REGRESSION_MONITOR` | Maintain, renew, or downgrade an existing claim. | Maintenance only. |

A 20-task run is calibration only. It cannot support a public quality claim.

## Verdicts

| Verdict | Meaning |
|---|---|
| `PASS_STRONG` | Material uplift/control value with all hard gates passed. |
| `PASS_BOUNDED` | Value is proven with a material limitation. |
| `MIXED` | Some value exists, but no broad quality claim is supported. |
| `FAIL` | No measured value, or a hard gate failed. |
| `INVALID` | Evidence, corpus, rubric, pairing, or run integrity failed. |

## Non-Claims

QBS cannot claim:

- CVF is better than all direct model use.
- All models from a provider are covered.
- CVF guarantees safety.
- CVF eliminates cost risk.
- CVF is enterprise-ready.
- All agents and tools are controlled.

Every claim must name the provider/model, corpus version, run class, criteria
version, and run date.

## Expiration

QBS claims expire after the earliest of:

- 90 days
- provider model change or deprecation
- material CVF route, policy, prompt, or risk-classification change
- corpus or rubric change
- pricing table change greater than 25%
- observed runtime reliability drift

Expired claim status:

```text
STALE_PENDING_REVALIDATION
```

