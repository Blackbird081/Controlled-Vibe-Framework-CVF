# CVF Product Value Validation Assessment Template

Memory class: POINTER_RECORD

> Purpose: final governed verdict template for `Product Value Validation Wave`
> Default output memory class for a filled assessment: `FULL_RECORD`
> Rule: this assessment must report PASS / PARTIAL / FAIL without spin

---

## 1. Assessment Metadata

- Assessment ID:
- Date:
- Corpus ID:
- Rubric ID:
- Run set ID:
- Assessor:
- Related roadmap:

## 2. Evidence Inputs

- corpus packet:
- rubric packet:
- run manifest:
- raw results artifact:
- reviewer disagreement log:
- failure adjudication packet:

## 3. Validation Integrity Check

- corpus integrity: `PASS` | `FAIL`
- rubric integrity: `PASS` | `FAIL`
- audit completeness: `PASS` | `FAIL`
- reviewer agreement status:
- evidence confidence: `HIGH` | `MEDIUM` | `LOW`

If any of the first three fields are `FAIL`, the overall verdict cannot be `PASS`.

## 4. Comparative Readout

| Dimension | Direct baseline | CVF governed path | Delta | Interpretation |
|---|---:|---:|---:|---|
| Overall task success |  |  |  |  |
| High-risk task success |  |  |  |  |
| Unsafe false-negative rate |  |  |  |  |
| Governance false-positive rate |  |  |  |  |
| Median time-to-useful-result |  |  |  |  |
| Heavy rewrite rate |  |  |  |  |
| Rework cycle count |  |  |  |  |

## 5. Hard Gate Results

| Gate | Status | Notes |
|---|---|---|
| Gate A — Outcome Quality | `PASS` |  |
| Gate B — Governance Value | `PASS` |  |
| Gate C — Efficiency And Friction | `PASS` |  |
| Gate D — Reliability And Evidence Quality | `PASS` |  |

## 6. Red-Line Check

- catastrophic miss count:
- any catastrophic miss present: `YES` | `NO`
- audit completeness at 100%: `YES` | `NO`
- reviewer agreement threshold met: `YES` | `NO`
- corpus freeze preserved: `YES` | `NO`

## 7. Verdict

- Overall verdict: `PASS` | `PARTIAL` | `FAIL`
- Claim allowed:
  - `VALUE PROVEN FOR CURRENT SCOPE`
  - `PARTIAL / INCONCLUSIVE`
  - `VALUE NOT YET PROVEN`
- No-spin conclusion:

## 8. Failure Summary

- top failure mode 1:
- top failure mode 2:
- top failure mode 3:
- scenario-family weak spot:
- biggest difference vs direct baseline:

## 9. Docker Sandbox Decision

- Is Docker sandbox justified by this wave?: `YES` | `NO` | `NOT YET`
- Rationale:
- Evidence trigger satisfied:
  - bounded code execution required in 2+ families: `YES` | `NO`
  - current non-sandbox path cannot meet safety/usefulness needs: `YES` | `NO`
  - evaluators identify safe execution as missing capability: `YES` | `NO`

## 10. Required Next Move

- next move:
- whether fresh `GC-018` is recommended:
- whether remediation is required before any new capability tranche:
- whether value claim in docs/handoff may be upgraded:

## 11. Evidence Ledger

- evidence 1:
- evidence 2:
- evidence 3:

