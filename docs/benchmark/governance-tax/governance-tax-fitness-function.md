# Governance Tax Fitness Function

Memory class: FULL_RECORD

**Track:** EA Track A — Governance Tax Measurement
**Status:** `EA_TRACK_A_INSTRUMENTATION_DEPLOYED`
**Date:** 2026-05-12

## Purpose

Define the public governance-tax fitness function so evaluators and agents can
verify how CVF measures its own latency overhead and where the public budget
threshold sits.

## Scope

Definition, formula, and budget for governance-tax measurement across the CVF
control plane. This file does not contain raw measurement runs; those are
captured separately under the governance-tax instrumentation surface.

## Source

EA Track A — Governance Tax Measurement. Instrumentation is deployed in the
CVF control plane and emits the `governance_tax_ms` family of metrics used by
the fitness function below.

## Protocol

Each governed request emits `pre_processing_ms`, `policy_engine_ms`,
`post_processing_ms`, and `provider_ms`. The fitness function combines the
non-provider components into `governance_tax_ms` and compares against the
public budget defined in the body below.

## Enforcement

Governance-tax violations against the documented budget are surfaced as
operational signals, not as gates that block governed responses. Tightening
the budget requires a fresh tranche.

## Related Artifacts

- `../quality-benchmark-suite-methodology.md`
- `../quality-benchmark-suite-claim-ladder.md`
- `../../evidence/web-governance-path.md`

## Definition

**Governance tax** is the latency overhead introduced by CVF's pre- and post-processing
pipeline relative to the total end-to-end request time. It measures how much time the
governance control plane consumes — independent of provider response time.

```
governance_tax_ms = pre_processing_ms + policy_engine_ms + post_processing_ms
total_ms          = governance_tax_ms + provider_ms
governance_tax_pct = (governance_tax_ms / total_ms) × 100
```

The provider call (`provider_ms`) is explicitly **excluded** from the tax numerator
because provider latency is outside CVF's control and varies by model, load, and
geography. The tax measures only what CVF adds.

## Phase Boundaries

| Phase | Start | End | Includes |
| --- | --- | --- | --- |
| `pre_processing_ms` | `routeStartedAtMs` | `preProcessingEndMs` | Auth, DLP scan, safety filters, quota check, enforcement eval |
| `policy_engine_ms` | `preProcessingEndMs` | `policyEngineEndMs` | Guard engine eval, provider router, knowledge retrieval |
| `provider_ms` | `policyEngineEndMs` | `providerEndMs` | `executeAI` call + retry loop (excluded from tax) |
| `post_processing_ms` | `providerEndMs` | `postProcessingEndMs` | Bypass detection, output validation, telemetry emit |

## Fitness Function

| Grade | Condition | Interpretation |
| --- | --- | --- |
| **GREEN** | `tax_pct < 10%` | Governance overhead is acceptable |
| **AMBER** | `10% ≤ tax_pct < 20%` | Overhead elevated — investigate if sustained |
| **RED** | `tax_pct ≥ 20%` | Overhead is dominant — review pipeline bottleneck |

The threshold of **10%** is the primary fitness gate: governance overhead should not
consume more than one-tenth of the user-perceived wait time. AMBER is a warning band;
RED indicates a structural problem in the governance pipeline.

## Log Format

Each execution appends one JSONL record to `logs/governance-tax/governance-tax.jsonl`:

```json
{
  "request_id": "env-<uuid>",
  "ts": "2026-05-12T10:00:00.000Z",
  "phase_ms": {
    "pre_processing_ms": 22,
    "policy_engine_ms": 35,
    "provider_ms": 480,
    "post_processing_ms": 8
  },
  "governance_tax_ms": 65,
  "total_ms": 545,
  "governance_tax_pct": 11.93,
  "decision": "ALLOW",
  "grade": "AMBER",
  "provider": "alibaba",
  "governance_family": "normal_productivity_app_planning"
}
```

The log is **append-only**. Log rotation and retention policy are left to the operator.
The log path can be overridden via `CVF_TAX_LOG_DIR` environment variable.

## Analysis

Use `scripts/analyze_governance_tax.py` to compute aggregate statistics over the JSONL
log. The script outputs:

- Overall mean/median tax percentage and grade distribution
- Per-decision-type breakdown (ALLOW / BLOCK / CLARIFY / NEEDS_APPROVAL)
- Per-governance-family breakdown
- Per-provider breakdown
- Time-series summary (by hour)
- RED/AMBER flag list for individual requests above threshold

## Claim Boundary

- Governance tax measurement is **observational only** — no claim about absolute
  latency improvement is made from measurement alone.
- Tax percentages depend heavily on provider response time, which varies by model
  load and geography. Comparisons across providers must control for `provider_ms`.
- This fitness function does **not** replace QBS as the quality benchmark. It
  measures overhead, not output quality.
- No L4/L5 claim, QBS claim, or provider-parity claim is derived from tax data alone.
