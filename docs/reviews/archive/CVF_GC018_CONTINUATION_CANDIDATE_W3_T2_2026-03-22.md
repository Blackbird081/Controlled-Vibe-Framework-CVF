# CVF GC-018 Continuation Candidate — W3-T2 Governance Watchdog Pulse Slice

Memory class: FULL_RECORD

> Governance control: `GC-018`
> Date: `2026-03-22`
> Proposed tranche: `W3-T2 — Governance Watchdog Pulse Slice`
> Prerequisite: `W3-T1, W4-T7, W2-T7 — all CLOSED DELIVERED`

---

## GC-018 Depth Audit

| Criterion | Score | Rationale |
|---|---|---|
| Risk reduction | 2/3 | Opens W3 governance expansion beyond T1; closes the W3-T1 explicit defer "Watchdog — concept-only, no operational source exists"; now that W4-T7 (observability) and W2-T7 (async execution status) are delivered, operational sources exist for the first time |
| Decision value | 3/3 | Delivers `WatchdogPulseContract` — the first cross-plane health monitor in CVF; combines learning plane observability (W4-T7) with execution plane async status (W2-T7) into a single governed watchdog signal; highest-value remaining governance capability |
| Machine enforceability | 3/3 | TypeScript contracts with cross-plane-independent input interfaces, deterministic hash proof, and unit tests; watchdog health derivation is fully deterministic and testable without external state |
| Operational efficiency | 3/3 | All prerequisites satisfied: W4-T7 (observability snapshot) closed; W2-T7 (async execution status) closed; W3-T1 (governance foundation) closed; cross-plane inputs are now available |
| Portfolio priority | 3/3 | Opens W3 governance expansion; first genuine cross-plane governance surface; bridges learning + execution planes into governance watchdog; moves W3 from T1-only to multi-tranche; highest portfolio impact of remaining candidates |
| **Total** | **14/15** | **AUTHORIZED** |

---

## Proposed Scope

`W3-T2` delivers the governance watchdog pulse slice:

**CP1 — Watchdog Pulse Contract (Full Lane)**
- Input: `WatchdogObservabilityInput + WatchdogExecutionInput` (cross-plane-independent wrappers)
- Output: `WatchdogPulse` — `WatchdogStatus` derived from combined health + execution signals
- Status logic: `CRITICAL` (observability CRITICAL or execution FAILED) > `WARNING` (DEGRADED or RUNNING) > `NOMINAL` (HEALTHY + COMPLETED/PENDING) > `UNKNOWN`
- Cross-plane independence: local input interfaces mirror LearningObservabilitySnapshot + AsyncExecutionStatusSummary without importing from those packages

**CP2 — Watchdog Alert Log Contract (Fast Lane, GC-021)**
- Input: `WatchdogPulse[]`
- Output: `WatchdogAlertLog` — aggregate counts + dominant status + `alertActive` flag
- `alertActive = dominantStatus === "CRITICAL" || dominantStatus === "WARNING"`

**CP3 — W3-T2 Tranche Closure (Full Lane)**

---

## Authorization Boundary

- CP1: Full Lane — new contract baseline
- CP2: Fast Lane (GC-021) — additive aggregation contract
- CP3: Full Lane — tranche closure review

---

## Decision

**AUTHORIZED — Score 14/15**

W3-T2 may proceed immediately. All prerequisites are satisfied. The W3-T1 explicit defer "Watchdog — concept-only, no operational source exists" can now be closed because W4-T7 and W2-T7 deliver the required operational sources.
