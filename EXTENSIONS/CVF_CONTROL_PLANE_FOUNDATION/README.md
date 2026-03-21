# CVF Control Plane Foundation

Status: coordination package shell for `W1-T1 / CP1` in the whitepaper-completion roadmap.

## Purpose

- create one stable control-plane import surface without physically merging source modules
- preserve lineage for intent, knowledge, reporting, and deterministic context-freezing modules
- keep `CVF_v1.7_CONTROLLED_INTELLIGENCE` out of the initial package body

## Source lineage

- `EXTENSIONS/CVF_ECO_v1.0_INTENT_VALIDATION/`
- `EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE/`
- `EXTENSIONS/CVF_ECO_v2.1_GOVERNANCE_CANVAS/`
- `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/`

Reference-only selected control-plane surfaces remain outside the package body:

- `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE/`

## Execution class

- `coordination package`

## Current-cycle guardrail

- rollback unit is this package only
- source modules remain canonical for implementation ownership
- physical consolidation is out of scope for `CP1`
