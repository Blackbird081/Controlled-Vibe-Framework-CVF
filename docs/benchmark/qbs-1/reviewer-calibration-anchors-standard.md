# QBS Reviewer Calibration Anchors Standard

Status: `CALIBRATION_ANCHOR_STANDARD`

Date: 2026-06-07

## Purpose

Define the required calibration anchor protocol that must be followed before
any new QBS scored run or calibration-only scoring pass. This formalizes the
requirement from `quality-benchmark-suite-methodology.md` Section 10.1.

## Source Authority

- `docs/benchmark/quality-benchmark-suite-methodology.md` §10 and §10.1
- `docs/benchmark/quality-benchmark-suite-claim-ladder.md` — Reviewer Agreement Gate
- Prior calibration history: QBS-14 through QBS-18 (R8 plan, R8 anchors, R8
  adjudication), QBS-26/QBS-36 (R9 calibration), QBS-37 (R9 post-triangulation
  calibration diagnostics)

## Protocol

### Step 1 — Anchor Set Preparation

Before scoring begins for any new run, prepare a shared anchor set:

- Minimum 10 tasks drawn from the active corpus.
- Tasks must span at least 3 of the 8 defined task families.
- At least 1 negative-control task must be included.
- Reference scores for each anchor task must be produced by an independent
  process (human judgment, existing adjudicated scores, or a registered
  adjudicator ensemble).
- Reference scores must be recorded in a JSON anchor packet before reviewers
  score the anchor set.

### Step 2 — Independent Reviewer Scoring

Each reviewer scores the anchor set independently, without seeing the other
reviewer's scores or the reference scores.

### Step 3 — Anchor Agreement Calculation

Calculate and record:

- Quadratic-weighted Cohen's kappa between reviewer scores.
- Spearman rho between reviewer scores.
- Per-anchor discrepancy table (reviewer A score, reviewer B score, reference
  score, absolute difference).

### Step 4 — Gate Decision

| Anchor Agreement | Decision |
|---|---|
| Kappa >= 0.60 | Proceed to corpus scoring. |
| Kappa 0.40–0.59 | Rubric revision or adjudication required before corpus scoring. Document the revision in a rubric-addendum packet. |
| Kappa < 0.40 | Do not proceed. Redesign the rubric or reviewer composition. |

### Step 5 — Record

Produce a calibration anchor packet JSON with the following fields:

```json
{
  "run_id": "<run-set-id>",
  "anchor_packet_version": "<version>",
  "anchor_task_count": <n>,
  "families_represented": ["<family1>", "..."],
  "negative_control_included": true,
  "reference_source": "<adjudicator-ensemble|human-judgment|prior-adjudicated>",
  "reviewer_a_model": "<model-id>",
  "reviewer_b_model": "<model-id>",
  "anchor_kappa": <value>,
  "anchor_rho": <value>,
  "gate_decision": "PROCEED|REVISE_RUBRIC|DO_NOT_PROCEED",
  "rubric_addendum_ref": "<path or null>",
  "produced_at": "<ISO-8601 date>"
}
```

This JSON file path must be recorded in the run manifest as
`calibration_anchor_ref` before scoring begins.

## Historical Anchor Packets

| Run | Anchor packet | Gate result |
|---|---|---|
| R8 | `reviewer-calibration-anchors-qbs15.json` | Proceeded with adjudication |
| R9 pre-triangulation | `r9-calibration-anchors-qbs26.json` | See QBS-26 |
| R9 post-triangulation | `r9-calibration-reference-qbs36.json` | QBS-37 aggregate gate passed |

## Why This Standard Exists

Reviewer-agreement failure has been the primary cause of QBS gate failure
across R6 through R9. QBS-32 achieved weighted kappa 0.4464 — below the
0.60 public-claim gate. The structural cause identified in QBS-30 and the
rerun remediation proposal was that calibration was performed inconsistently,
anchor sets were mixed across families, and rubric drift accumulated across
runs.

This standard closes the calibration-gap finding from the independent
methodology review (QBS-1 independent review, 2026-05-09) by making the
anchor protocol a machine-checkable pre-run requirement.

## Enforcement

The `check_qbs_claim_gate.py` checker in the provenance repository validates
that a `calibration_anchor_ref` field is present in any JSON QBS result
artifact. Artifacts missing this field are flagged as `CALIBRATION_ANCHOR_MISSING`.

## Claim Boundary

This standard claims only the calibration anchor protocol. It does not claim
any specific run result, output-quality level, or reviewer agreement outcome.
