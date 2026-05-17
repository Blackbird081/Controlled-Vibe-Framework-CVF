# CVF v1.8 — Governance Model

> **Source:** Adapted from `CVF AI Runtime/GOVERNANCE.md`
> **Layer:** 2.5 — Safety Runtime
> **Note:** Numeric scores map to R0–R3 notation per `governance/compat/risk_level_mapping.md`

---

## I. Risk Score Formula

```
Risk Score = (Impact × Scope × Uncertainty) + Reversibility_Modifier
```

| Dimension | Range | Scale |
|-----------|-------|-------|
| Impact | 0–5 | 0=cosmetic → 5=core system behavior change |
| Scope | 0–5 | 0=1 file → 5=global/system-wide |
| Uncertainty | 0–5 | 0=deterministic fix → 5=speculative redesign |
| Reversibility | -2 to +2 | -2=trivial rollback → +2=irreversible mutation risk |

### Risk Levels (mapped to CVF R-levels)

| Score | Level | CVF R-Level | Action |
|-------|-------|-------------|--------|
| 0–2 | LOW (auto) | R0 | Auto-approve |
| 3–5 | LOW (guarded) | R1 | Guarded auto execution |
| 6–10 | MODERATE | R2 | Human in loop |
| 11–15 | HIGH | R3 | Escalation required |
| 16+ | CRITICAL | R3+ | Hard stop |

---

## II. Mutation Budget Model

Each execution has a fixed budget. AI cannot exceed it.

| Mode | File Budget | Line Budget | Scope |
|------|-------------|-------------|-------|
| SAFE | max 2 files | max 50 lines | Single domain |
| BALANCED | max 5 files | max 150 lines | Cross-domain allowed |
| CREATIVE | max 10 files | max 300 lines | Broad scope |

**Budget enforcement:**
- Budget set at INTENT phase, immutable thereafter
- PLANNING phase validates proposed plan against budget
- MUTATION_SANDBOX rejects any action exceeding budget

---

## III. Escalation Tiers

| Level | Trigger | Response |
|-------|---------|----------|
| L0 — Logging | Any execution | Auto-log to audit trail |
| L1 — Warning | Risk score 6–10 (R2) | Human notification |
| L2 — Escalation | Risk score 11–15 (R3) | Human approval required |
| L3 — Hard Stop | Risk 16+ (R3+) or anomaly | Execution halted, rollback |

---

## IV. Behavior Drift Monitor

Tracks across N executions:
- Average risk trend
- Mutation size growth
- Escalation frequency
- Rollback frequency
- Role boundary violations

**DriftScore** = weighted composite. If DriftScore > threshold:
- Force SAFE mode
- Reduce mutation budget
- Increase confirmation requirements

→ AI autonomy shrinks automatically when drift detected.

---

## V. Stability Index

```
stabilityIndex = 100
  - (rollbackRate × 20)
  - (anomalyRate × 25)
  - (riskEscalationRate × 15)
  - (mutationVolatility × 20)
  - (driftScore × 20)
```

| Threshold | Action |
|-----------|--------|
| < 70 | Global SAFE mode enforced |
| < 50 | Creative mode disabled |
