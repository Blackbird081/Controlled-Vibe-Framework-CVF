# CVF LHW15-T1 Runtime Observability Trend Advisory Connector Spec

Memory class: FULL_RECORD

Contract version: `cvf.runtimeObservabilityTrendAdvisory.lhw15.t1.v1`

Status: CLOSED_PASS_BOUNDED

docType: connector_spec

Date: 2026-05-30

---

## Scope/Target/Owner Boundary

- **Scope:** Documentation-only connector spec. No code file. No EXTENSIONS/ change.
- **Target:** CVF governance agents consuming W4 `OperationalBenchmarkReport` output.
- **Owner:** `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/operational-benchmark-suite.ts` (W4).
- **Applies-to:** Any governance agent or surface that reads offline benchmark reports and needs trend classification guidance.

## Purpose

Close the remaining LH1 trigger for the `abtop` family (line 132) by defining
a runtime observability trend advisory type. W4 delivered an offline governance
benchmark scorecard with call-level pass rate and event-model denominator
separation. The remaining gap is a trend-over-time advisory: how agents and
governance surfaces can classify whether observed execution metrics indicate
a stable, degrading, or recovering posture without requiring a live dashboard.

LH1 source: `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` line 132
W4 owner surface: `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/operational-benchmark-suite.ts`

Rejection label for this wave:
`abtop` live dashboard execution is rejected from this LHW wave (doc-only scope)
— requires live route; eligible for separate live-proof roadmap post-LHW.

---

## Advisory Type Definition

### `runtimeObservabilityTrendAdvisoryType`

Six values covering all observable trend states:

| Value | Meaning |
| --- | --- |
| `trend_stable` | Consecutive benchmark windows show pass rate within threshold; no governance action required |
| `trend_degrading` | Pass rate declining across two or more consecutive windows; governance review recommended |
| `trend_recovering` | Pass rate improving after a prior `trend_degrading` event; continue monitoring |
| `insufficient_data` | Fewer than two consecutive benchmark windows available; trend cannot be assessed |
| `above_threshold` | Latest window pass rate exceeds configured alert threshold; governance can de-escalate |
| `below_threshold` | Latest window pass rate falls below configured alert threshold; escalation advisory issued |

### `trendReadoutGuidance`

String field describing the recommended governance action based on the current
advisory type. Examples:

- `trend_stable` → `"No action required. Benchmark pass rate is within governance threshold across observed windows."`
- `trend_degrading` → `"Governance review recommended. Submit a WorkerTimeoutReadout or ReviewerDeadlockReadout for the affected surface before the next benchmark window."`
- `insufficient_data` → `"Collect at least two consecutive benchmark windows before asserting a trend posture."`

---

## Connector Advisory Shape

```typescript
// Advisory readout only — no runtime execution, no live dashboard.
interface RuntimeObservabilityTrendAdvisory {
  contractVersion: 'cvf.runtimeObservabilityTrendAdvisory.lhw15.t1.v1';
  trendAdvisoryType: RuntimeObservabilityTrendAdvisoryType;
  trendReadoutGuidance: string;
  windowCount: number;           // Number of benchmark windows observed
  latestPassRate: number | null; // Pass rate of the most recent window (0.0–1.0)
  runtimeExecutionAuthorized: false; // invariant — advisory only
}

type RuntimeObservabilityTrendAdvisoryType =
  | 'trend_stable'
  | 'trend_degrading'
  | 'trend_recovering'
  | 'insufficient_data'
  | 'above_threshold'
  | 'below_threshold';
```

---

## Integration Guidance

This advisory type is designed to be surfaced alongside W4 `OperationalBenchmarkReport`
output. When a governance agent reads an `OperationalBenchmarkReport`, it may
additionally emit a `RuntimeObservabilityTrendAdvisory` if:

1. Two or more consecutive reports are available for comparison.
2. The `taskCompletionRate` or `policyViolationRate` metrics show directional change.
3. The observed pass rate falls outside the `[0.85, 1.0]` threshold band.

No live provider call, no dashboard query, and no database read is required.
The advisory is computed from existing offline benchmark report records.

---

## Invariants

- `runtimeExecutionAuthorized: false` — this advisory never authorizes provider execution.
- `rawMemoryReleased: false` — trend data is advisory-only; no memory promotion.
- No code file in this connector spec.
- No EXTENSIONS/ directory change.
- No receipt envelope change.
- No public-sync.

---

## LH1 Trigger Closure

**Closed:** `abtop` — LH1 line 132
**Status:** ABSORBED (doc-only connector scope)
**W4 absorption already covers:** offline benchmark scorecard, call-level pass rate,
event-model denominator separation.
**This spec closes:** runtime observability trend classification advisory.

---

## Claim Boundary

This spec is documentation-only. It does not claim:
- Live dashboard query or execution
- Automated trend enforcement or alerting
- Provider behavior or hosted readiness
- Production readiness or public release readiness
