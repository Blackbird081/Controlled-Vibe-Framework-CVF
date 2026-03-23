# CVF W6-T6 Pattern Drift Detection Slice — Tranche Execution Plan

Memory class: FULL_RECORD

> Date: `2026-03-23`
> Tranche: `W6-T6 — Pattern Drift Detection Slice`
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W6_T6_2026-03-23.md` (13/15 — AUTHORIZED)

---

## Objective

Deliver the first governed drift detection surface in LPF. The truth model can silently degrade between versions without any signal. This tranche introduces `PatternDriftContract` which compares two `TruthModel` snapshots (baseline vs. current) and produces a governed `PatternDriftSignal` with a `DriftClass`. A log aggregator provides a batch view of drift trends.

---

## Consumer Path

```
TruthModel (baseline)  +  TruthModel (current)  (W4-T2 — LPF)
    ↓ PatternDriftContract   (W6-T6 CP1)
PatternDriftSignal
    ↓ PatternDriftLogContract  (W6-T6 CP2, Fast Lane)
PatternDriftLog
```

---

## Control Points

| CP | Lane | Contract | Deliverable |
|---|---|---|---|
| CP1 | Full Lane | `PatternDriftContract` | First drift detection surface in LPF |
| CP2 | Fast Lane (GC-021) | `PatternDriftLogContract` | Aggregated drift trend log |
| CP3 | Full Lane | Tranche Closure | Governance artifact chain |

---

## DriftClass Model

| Condition | DriftClass |
|---|---|
| `currentHealthSignal` turned `CRITICAL` (was non-critical) OR `confidenceDelta < -0.3` OR trajectory turned `DEGRADING` | `CRITICAL_DRIFT` |
| `dominantPattern` changed OR `healthSignal` changed OR `\|confidenceDelta\| > 0.1` | `DRIFTING` |
| None of the above | `STABLE` |

Dominant drift class for log (severity-first): `CRITICAL_DRIFT > DRIFTING > STABLE`

---

## Package

`EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION` (LPF)

### GC-023 Pre-flight

| File | Current Lines | Limit | Result |
|---|---|---|---|
| `pattern.drift.contract.ts` | new | 700 (hard) | PASS |
| `pattern.drift.log.contract.ts` | new | 700 (hard) | PASS |
| `src/index.ts` | 149 | 700 (hard) | PASS (~175) |
| `learning.pattern.drift.test.ts` | new (dedicated) | 1200 (hard) | PASS |

Tests: +16; dedicated file mandatory (GC-023 — LPF index.test.ts frozen at 1374)
