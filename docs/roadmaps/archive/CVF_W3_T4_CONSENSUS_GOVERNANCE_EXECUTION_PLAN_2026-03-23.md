# CVF W3-T4 Execution Plan — Governance Consensus Slice

Memory class: SUMMARY_RECORD
> Date: `2026-03-23`
> Tranche: `W3-T4 — Governance Consensus Slice`
> Authorization: GC-018 (14/15 — AUTHORIZED)

---

## Objective

Deliver the first governed Consensus Decision contract. Closes the last W3-T1 explicit defer ("Consensus — concept-only, no operational source exists"). Connects governance audit signals (W3-T3) to a decision verdict surface for downstream governance enforcement.

---

## Consumer Path

```
GovernanceAuditSignal[] { auditTrigger, signalHash, ... } (from W3-T3 CP1)
    ↓ GovernanceConsensusContract (W3-T4 CP1)
ConsensusDecision { decisionId, issuedAt, verdict, criticalCount, totalSignals, consensusScore, decisionHash }
    ↓ GovernanceConsensusSummaryContract (W3-T4 CP2, Fast Lane)
GovernanceConsensusSummary { summaryId, createdAt, totalDecisions, proceedCount, pauseCount, escalateCount, dominantVerdict, summaryHash }
```

---

## Control Points

| CP | Lane | Contract | Deliverable |
|---|---|---|---|
| CP1 | Full Lane | `GovernanceConsensusContract` | First Consensus Decision surface in CVF |
| CP2 | Fast Lane (GC-021) | `GovernanceConsensusSummaryContract` | Aggregation of consensus decisions |
| CP3 | Full Lane | Tranche Closure | Governance artifact chain |

---

## Consensus Verdict Model

`ConsensusVerdict`: `"PROCEED" | "PAUSE" | "ESCALATE"`

Decision logic (from signals[]):
- ESCALATE if `criticalThresholdCount > 0`
- PAUSE if `alertActiveCount > 0` (and no CRITICAL_THRESHOLD)
- PROCEED otherwise (only ROUTINE or NO_ACTION)

`consensusScore` = `(criticalThresholdCount / totalSignals) * 100`, rounded to 2dp; `0` for empty batch.

Dominant verdict for CP2 summary: frequency-first, ESCALATE > PAUSE > PROCEED.

---

## Package

`EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION` (GEF)
Tests: +16; GEF: 38 → 54
