# CVF Control Plane Foundation

Status: control-plane foundation shell for the closed `W1-T1 / CP1-CP5` tranche, now canonically extended by the closed `W1-T2 / CP1-CP5` usable-intake tranche.

## Purpose

- create one stable control-plane import surface without physically merging source modules
- preserve lineage for intent, knowledge, reporting, and deterministic context-freezing modules
- keep `CVF_v1.7_CONTROLLED_INTELLIGENCE` out of the initial package body
- expose one reviewable governance-canvas evidence surface for tranche-local reporting
- expose one narrow wrapper surface for selected `CVF_v1.7_CONTROLLED_INTELLIGENCE` helpers and types
- expose one callable intake contract baseline spanning intent validation, retrieval, and deterministic packaged context for `W1-T2 / CP1`
- expose standalone retrieval, packaging, and consumer-path contracts delivered through `W1-T2 / CP2-CP4`

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

## Current-cycle usable intake baseline

- `W1-T2 / CP1` adds `createControlPlaneIntakeContract()` as a bounded behavioral contract
- the contract validates the intake vibe, performs source-backed retrieval, and returns deterministic packaged context
- the package still does not claim full `AI Gateway` target-state completion

## Current-cycle retrieval and packaging contracts

- `W1-T2 / CP2` adds `createRetrievalContract()` as one unified retrieval contract with source/metadata filtering
- `W1-T2 / CP3` adds `createPackagingContract()` as one deterministic packaging contract with token budgeting, deterministic hashing, and optional context freezing
- these contracts deepen the usable intake slice without claiming full target-state `Knowledge Layer` or `Context Builder & Packager` completion

## Current-cycle consumer path proof

- `W1-T2 / CP4` adds `createConsumerContract()` as one real downstream consumer path proving the intake pipeline is operationally meaningful
- `KnowledgeFacade.consume()` is the caller-facing consumer entry point
- governed `ConsumptionReceipt` evidence remains bounded to the usable intake slice and does not claim execution-runtime completion

## Current-cycle selected controlled-intelligence alignment

- `CP4` re-exports a narrow set of selected `CVF_v1.7_CONTROLLED_INTELLIGENCE` mapping, context-boundary, and reasoning-boundary helpers/types
- runtime-critical reasoning execution remains source-owned in `CVF_v1.7_CONTROLLED_INTELLIGENCE`
- the wrapper stays additive and does not claim physical consolidation

## Tranche closure checkpoint

- `W1-T1 / CP5` closed the first approved control-plane tranche as a documentation-only checkpoint
- `W1-T2 / CP5` now closes the usable-intake tranche after `CP1-CP4` implementation and receipt reconciliation
- the package now stands as the canonical control-plane foundation plus one closed usable-intake slice, but not the full whitepaper target-state control plane
- any additional control-plane completion work now requires a new governed packet
