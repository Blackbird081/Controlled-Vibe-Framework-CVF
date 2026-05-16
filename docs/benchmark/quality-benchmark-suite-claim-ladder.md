# CVF Quality Benchmark Suite Claim Ladder

Memory class: POINTER_RECORD

Status: `PUBLIC_METHODOLOGY`

## Purpose

Define which quality claims CVF may make from benchmark and live evidence, so
public claim language stays bounded by the evidence layer that actually
supports it.

## Scope

Public claim levels, run classes, and the rules that bind a claim level to
required evidence. This file does not contain scored-run results.

## Source

Predecessor evidence anchors:

- `docs/benchmark/quality-benchmark-suite-methodology.md`
- `docs/evidence/provider-lanes.md`
- `docs/evidence/latest-release-gate.md`

## Decision

Treated as the authoritative public claim-ladder reference. Public quality
claims must cite a claim level from this file plus the run-class evidence
that justifies the level.

## Evidence

Claim levels and run classes below act as the public rubric for which
evidence unlocks which claim. Each scored run published under
`docs/benchmark/runs/` references this ladder to bound its allowed claim.

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
| `POWERED_SINGLE_PROVIDER` | Prove aggregate L4/L5 for one named provider/model. | Bounded aggregate L4/L5; no family-level claim. |
| `POWERED_FAMILY` | Prove one named task-family claim with expanded family corpus. | Bounded family-level claim for the named family only. |
| `POWERED_MULTI_PROVIDER` | Prove L6 confidence across 3 provider families. | Bounded L6. |
| `REGRESSION_MONITOR` | Maintain, renew, or downgrade an existing claim. | Maintenance only. |

A 20-task run is calibration only. It cannot support a public quality claim.

## Verdicts

| Verdict | Meaning |
|---|---|
| `PASS_STRONG` | Material uplift/control value with all hard gates passed. |
| `PASS_BOUNDED` | Value is proven with a material limitation. |
| `DIRECTIONAL_NOT_BOUNDED` | Directional value appears, but power, confidence interval, or family-level limits prevent a bounded claim. |
| `MIXED` | Some value exists, but no broad quality claim is supported. |
| `FAIL` | No measured value, or a hard gate failed. |
| `INVALID` | Evidence, corpus, rubric, pairing, or run integrity failed. |

L5 `PASS_STRONG` requires confidence bounds on safety and adversarial failure
rates. Raw percentages, such as 6/6 observed successes, are not sufficient by
themselves.

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

## Protocol

Every public claim must (a) name the claim level, (b) name the supporting
run class, (c) cite the run artifact or evidence file that justifies the
level, and (d) carry the expiry trigger conditions listed above.

## Enforcement

Hard-gate enforcement inside the methodology blocks a run from publishing a
level it did not earn. The ladder is enforced at evidence write-time
(QBS scoring) and at public-write-time (READMEs and external docs).

## Related Artifacts

- `quality-benchmark-suite-methodology.md`
- `quality-benchmark-suite-standards-alignment.md`
- `qbs-1/README.md`
- `../evidence/claim-boundaries.md`

## Claim Boundary

This ladder claims only that the listed levels and run classes describe the
public rubric for CVF quality claims. It does not claim any specific level
is currently held, does not authorize publishing a level beyond the evidence
on file, and does not extend the ladder retroactively to runs that did not
pre-register the claimed level.
