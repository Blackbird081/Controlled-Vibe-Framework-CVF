# CVF MSEA-R72D Governance Cost Metric And Monthly Readout Specification

Memory class: governance-cost-metric-specification
Status: ACTIVE
Date: 2026-07-08

## Purpose

Define reproducible governance cost metrics and propose a monthly readout design covering product-source touches, governance-artifact touches, checker additions and deletions, public CI status, and a ceremony ratio. This artifact acts as a non-implementing proposal and establishes a reproducible metric spine.

## Scope / Applies To

This specification defines proxy metrics using the repository itself as the data source.
Metrics automation, scheduled execution, or new checker/script implementation remain future work.

## Source Verification Block

| Claimed item | Claim type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| GCI metric boundary keeps direct checker-script counts separate from checker tests and support modules | EXISTS | `docs/reference/governance_control_index/CVF_GOVERNANCE_CONTROL_INDEX.md` | section `Baseline Measurement`; metric-boundary paragraph | direct checker scripts | Governance Control Index | ACCEPT |
| R72C case matrix used worker-return line count as a disclosed ceremony-cost proxy | EXISTS | `docs/reference/CVF_MSEA_R72C_FAST_LANE_CALIBRATION_AND_RISK_CLASS_ROUTER_CASE_MATRIX_2026-07-08.md` | section `Methodology And Evidence-Limit Disclosure` | ceremony-cost proxy | R72C case matrix | ACCEPT |

## Governance Cost Metrics

### Metric: product-source touches
* **metricDefinition**: The number of unique file path edits in the last 30 days within product paths (`EXTENSIONS/`, `scripts/`, `src/`).
* **computationCommand**: `git log --since="30 days ago" --name-only --format="" | Where-Object { $_ -match '^(EXTENSIONS/|scripts/|src/)' } | Sort-Object -Unique | Measure-Object | Select-Object -ExpandProperty Count`
* **reproducibilityEvidence**: `134`
* **boundaryNote**: Evaluates actual source paths rather than governance paths.
* **readoutCadence**: Monthly, triggered on the first of each month.
* **candidateImplementation**: `governance/compat/check_product_source_metric.py`

### Metric: governance-artifact touches
* **metricDefinition**: The number of unique file path edits in the last 30 days within governance paths (`docs/`, `governance/`, `CVF_SESSION/`, `*.md`).
* **computationCommand**: `git log --since="30 days ago" --name-only --format="" | Where-Object { $_ -match '^(docs/|governance/|CVF_SESSION/|[^/]+\.md$)' } | Sort-Object -Unique | Measure-Object | Select-Object -ExpandProperty Count`
* **reproducibilityEvidence**: `3541`
* **boundaryNote**: Includes all tracking files, handoffs, and governance tools.
* **readoutCadence**: Monthly, triggered on the first of each month.
* **candidateImplementation**: `governance/compat/check_governance_artifact_metric.py`

### Metric: checker additions
* **metricDefinition**: The number of direct checker scripts added in the last 30 days.
* **computationCommand**: `git log --diff-filter=A --since="30 days ago" --name-only --format="" | Where-Object { $_ -match '^governance/compat/check_.*\.py$' } | Sort-Object -Unique | Measure-Object | Select-Object -ExpandProperty Count`
* **reproducibilityEvidence**: `62`
* **boundaryNote**: Per AC11 and the GCI Metric Boundary, this strictly excludes `test_check_*.py` and non-`check_*.py` support modules.
* **readoutCadence**: Monthly, triggered on the first of each month.
* **candidateImplementation**: `governance/compat/check_checker_lifecycle_metric.py`

### Metric: checker deletions
* **metricDefinition**: The number of direct checker scripts deleted in the last 30 days.
* **computationCommand**: `git log --diff-filter=D --since="30 days ago" --name-only --format="" | Where-Object { $_ -match '^governance/compat/check_.*\.py$' } | Sort-Object -Unique | Measure-Object | Select-Object -ExpandProperty Count`
* **reproducibilityEvidence**: `0`
* **boundaryNote**: Per AC11 and the GCI Metric Boundary, this strictly excludes `test_check_*.py` and non-`check_*.py` support modules.
* **readoutCadence**: Monthly, triggered on the first of each month.
* **candidateImplementation**: `governance/compat/check_checker_lifecycle_metric.py`

### Metric: public CI status
* **metricDefinition**: The latest visible GitHub Actions run set on the public repository `main` branch, summarized by workflow result.
* **computationCommand**: `gh run list --repo Blackbird081/Controlled-Vibe-Framework-CVF --branch main --limit 5`
* **reproducibilityEvidence**: `CVF Public Surface=success; CVF Static CI Gate=success; CVF CI Pipeline=failure; Documentation & Testing=failure; CVF CI=failure; observed at public-main run timestamp 2026-07-07T14:19:20Z`
* **boundaryNote**: Refresh read-only against the public repository main branch; do not infer public-main CI from the private provenance branch.
* **readoutCadence**: Monthly, triggered on the first of each month.
* **candidateImplementation**: `governance/compat/check_public_ci_status_metric.py`

### Metric: ceremony ratio
* **metricDefinition**: The ratio of overhead (ceremony) to output, proxied by the total line count of worker returns divided by the total line count of work orders.
* **computationCommand**: `$wr=(Get-ChildItem docs/reviews -Filter '*WORKER_RETURN*.md' -File | Get-Content | Measure-Object -Line).Lines; $wo=(Get-ChildItem docs/work_orders -Filter '*WORK_ORDER*.md' -File | Get-Content | Measure-Object -Line).Lines; [math]::Round($wr/$wo,2)`
* **reproducibilityEvidence**: `60613 worker-return lines / 144270 work-order lines = 0.42`
* **boundaryNote**: Explicit numerator/denominator formula computing the ratio dynamically across all matching governance files.
* **readoutCadence**: Monthly, triggered on the first of each month.
* **candidateImplementation**: `governance/compat/check_ceremony_ratio_metric.py`

## Monthly Readout Design

* Readout trigger: Scheduled GitHub Actions workflow (monthly) or manual dispatch.
* Aggregation format: Markdown report under `docs/audits/`.
* Output constraint: Proposal only. No script, checker, or hook is created or edited during this tranche.

## Epistemic Process Block

### Expected Result / Prediction
The extraction of governance cost metrics from the repository using standard Git commands will produce reliable, reproducible proxy metrics.

### Evidence Comparison
The metrics values were successfully derived from running the documented Git commands locally against the current repository state, confirming the expectation.

### Contradiction Or Gap Disposition
No contradictions found; all metrics are reproducible.

### Claim Update
The specification defines reproducible metrics without implementing automation.

## Claim Boundary

This document records a metric specification and readout-design proposal only.
Metrics automation, checker addition, and Fast Lane widening require later tranches.
No runtime behavior, public-release posture, provider behavior, or GitHub merge is claimed.
