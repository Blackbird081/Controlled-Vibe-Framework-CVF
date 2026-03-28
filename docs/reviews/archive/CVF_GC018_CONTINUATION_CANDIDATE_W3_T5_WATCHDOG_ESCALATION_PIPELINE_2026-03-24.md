# CVF GC-018 Continuation Candidate — W3-T5 Watchdog Escalation Pipeline Slice

Memory class: FULL_RECORD

> Date: `2026-03-24`
> GC-018 version: `10/10`
> Tranche: `W3-T5 — Watchdog Escalation Pipeline Slice`
> Plane: `Governance Plane`
> Extension: `CVF_GOVERNANCE_EXPANSION_FOUNDATION`

---

## 1. Tranche Summary

Close the gap between the four individually-tested watchdog contracts in GEF and a
single governed end-to-end pipeline contract that chains them.

Current state:
- `WatchdogPulseContract` (W3-T2/CP1) produces `WatchdogPulse` from observability + execution inputs
- `WatchdogAlertLogContract` (W3-T2/CP2) aggregates `WatchdogPulse[]` → `WatchdogAlertLog`
- `WatchdogEscalationContract` (W6-T7/CP1) evaluates `WatchdogAlertLog` → `WatchdogEscalationDecision`
- `WatchdogEscalationLogContract` (W6-T7/CP2) aggregates `WatchdogEscalationDecision[]` → `WatchdogEscalationLog`
- **Gap**: No single pipeline contract chains the full watchdog escalation flow — callers
  must manually instantiate and wire four contracts to produce a governed escalation result

Target state after W3-T5:
- `WatchdogEscalationPipelineContract` drives the full chain:
  `(obs, exec)` → `WatchdogPulse` → `WatchdogAlertLog` → `WatchdogEscalationDecision`
  → `WatchdogEscalationLog` → `WatchdogEscalationPipelineResult`
- `WatchdogEscalationPipelineBatchContract` aggregates multiple pipeline results

---

## 2. Control Points

### CP1 — WatchdogEscalationPipelineContract

Scope:
- `WatchdogEscalationPipelineRequest`: `observabilityInput`, `executionInput`, `policy?`
- `WatchdogEscalationPipelineResult`: `resultId`, `createdAt`, `pulse`, `alertLog`,
  `escalationDecision`, `escalationLog`, `escalationActive`, `dominantAction`, `pipelineHash`
- internal chain: `WatchdogPulseContract → WatchdogAlertLogContract → WatchdogEscalationContract → WatchdogEscalationLogContract`
- `pipelineHash` deterministic from `pulseHash + logHash + decisionHash + escalationLogHash + createdAt`
- injected `now()` propagates to all sub-contracts
- factory `createWatchdogEscalationPipelineContract()`

Lane: `Full Lane`

### CP2 — WatchdogEscalationPipelineBatchContract

Scope:
- `WatchdogEscalationPipelineBatch`: `batchId`, `createdAt`, `totalResults`,
  `results`, `dominantAction`, `escalationActiveCount`, `batchHash`
- `dominantAction` = severity-first across all results (`ESCALATE > MONITOR > CLEAR`)
- `escalationActiveCount` = count of results where `escalationActive === true`
- factory `createWatchdogEscalationPipelineBatchContract()`

Lane: `Fast Lane` (GC-021)

### CP3 — Tranche Closure Review

Lane: `Full Lane`

---

## 3. Rationale

- realization-first: YES — concrete pipeline contract chaining four proven contracts
- bounded scope: YES — two new contracts in existing GEF module, zero new type design needed
- closes deferred gap: YES — W6-T7 implied gap (no end-to-end escalation pipeline); W3-T2 implied gap (watchdog pulse has no governed escalation path)
- test-coverage-ready: YES — all four source contracts already tested; pipeline test pattern established
- no cross-plane risk: YES — GEF-internal only, no imports from CPF/EPF
- governance compliance: YES — all gates will be run
- prior tranche closed: YES — W2-T10 CLOSED DELIVERED (commit 3a1d9d6)

---

## 4. Audit Score (GC-018)

| Criterion | Score |
|-----------|-------|
| Realization-first | 10 |
| Bounded scope | 10 |
| Closes deferred gap | 10 |
| Test-coverage-ready | 10 |
| No cross-plane risk | 10 |
| Governance compliance | 10 |
| Prior tranche closed | 10 |

**Total: 10/10 — AUTHORIZED**

---

## 5. Authorization Boundary

- authorized work: W3-T5 CP1 + CP2 + CP3 as scoped above
- not authorized: changes to `WatchdogPulseContract`, `WatchdogAlertLogContract`,
  `WatchdogEscalationContract`, or `WatchdogEscalationLogContract` internals;
  new module creation; any cross-plane boundary changes
- all CP packets require: audit + review + delta + execution plan update +
  test log update
