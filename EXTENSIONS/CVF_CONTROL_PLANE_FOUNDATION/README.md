# CVF Control Plane Foundation

Status: coordination package shell for `W1-T1 / CP1-CP4` in the whitepaper-completion roadmap.

## Purpose

- create one stable control-plane import surface without physically merging source modules
- preserve lineage for intent, knowledge, reporting, and deterministic context-freezing modules
- keep `CVF_v1.7_CONTROLLED_INTELLIGENCE` out of the initial package body
- expose one reviewable governance-canvas evidence surface for tranche-local reporting
- expose one narrow wrapper surface for selected `CVF_v1.7_CONTROLLED_INTELLIGENCE` helpers and types

## Source lineage

- `EXTENSIONS/CVF_ECO_v1.0_INTENT_VALIDATION/`
- `EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE/`
- `EXTENSIONS/CVF_ECO_v2.1_GOVERNANCE_CANVAS/`
- `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/`

Canonical controlled-intelligence ownership remains outside the package body:

- `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE/`

## Execution class

- `coordination package`

## Current-cycle guardrail

- rollback unit is this package only
- source modules remain canonical for implementation ownership
- physical consolidation is out of scope for `CP1`

## Current-cycle reporting surface

- `createControlPlaneEvidenceSurface()` builds a tranche-local text/markdown review surface from governance-canvas sessions
- the reporting surface stays additive and does not modify active-path governance-core behavior

## Current-cycle selected controlled-intelligence alignment

- `CP4` re-exports a narrow set of selected `CVF_v1.7_CONTROLLED_INTELLIGENCE` mapping, context-boundary, and reasoning-boundary helpers/types
- runtime-critical reasoning execution remains source-owned in `CVF_v1.7_CONTROLLED_INTELLIGENCE`
- the wrapper stays additive and does not claim physical consolidation
