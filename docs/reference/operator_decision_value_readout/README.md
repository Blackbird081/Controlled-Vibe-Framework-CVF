# CVF Operator Decision And Value Readout - Front Door

Memory class: FULL_RECORD

Status: ACTIVE_FRONT_DOOR

docType: reference

Date: 2026-07-12

## Scope / Applies To

Stable retrieval path for the Operator Decision And Value Readout (ODVR)
foundation lane. Indexes the ODVR-T0 contract/schema and the ODVR-T1 local
read-only composer helper. Does not itself define contract content or
implement any UI, Web route, provider call, or new state store.

## Purpose

Give any future agent or operator one stable path to the ODVR-T0 contract,
schema, and the ODVR-T1 local composer helper without needing to rediscover
them via repository search.

## Index

| Artifact | Purpose |
|---|---|
| `CVF_ODVR_T0_SOURCE_OVERLAP_AND_READOUT_CONTRACT.md` | Source/overlap inventory, field authority map, freshness and contradiction semantics, duplicate-owner stop-rule recommendation |
| `CVF_ODVR_T0_READOUT_SCHEMA.json` | JSON Schema for the ODVR readout, with representative current/stale/missing-source/contradicted examples and conditional freshness invariants |
| `governance/compat/run_odvr_readout.py` | ODVR-T1 deterministic local read-only composer and CLI (`python governance/compat/run_odvr_readout.py --json`); prints a schema-valid readout to stdout, writes nothing, calls no provider |
| `governance/compat/test_run_odvr_readout.py` | Focused positive/negative tests for the T1 composer (`python -m unittest governance.compat.test_run_odvr_readout -v`) |

## Authority Chain

1. `docs/roadmaps/CVF_OPERATOR_DECISION_AND_VALUE_READOUT_ROADMAP_2026-07-12.md`
   (material commit `7c6f13ab8`) - authorizes the ODVR tranche sequence.
2. `docs/baselines/CVF_GC018_ODVR_T0_SOURCE_OVERLAP_AND_READOUT_CONTRACT_2026-07-12.md`
   plus `docs/baselines/CVF_GC018_ODVR_T1_DETERMINISTIC_LOCAL_COMPOSER_2026-07-12.md`
   - paired GC-018 baselines for T0 and T1.
3. `docs/work_orders/CVF_AGENT_WORK_ORDER_ODVR_T0_SOURCE_OVERLAP_AND_READOUT_CONTRACT_2026-07-12.md`
   plus `docs/work_orders/CVF_AGENT_WORK_ORDER_ODVR_T1_DETERMINISTIC_LOCAL_COMPOSER_2026-07-12.md`
   - dispatch instructions for T0 and T1.
4. `docs/reviews/CVF_ODVR_T0_SOURCE_OVERLAP_AND_READOUT_CONTRACT_COMPLETION_2026-07-12.md`
   - T0 closure (`REVIEWER_ACCEPTED_AFTER_REPAIR`, material commit `2af788683`).

## Build Boundary

This folder plus `governance/compat/run_odvr_readout.py` and its focused test
are docs/schema plus one local read-only Python helper. Neither authorizes a
Web UI, dashboard, route wiring, provider/API call, live proof,
mutable/generated state, queue, registry, or checker/hook/CI wiring. The
helper is manually invoked; it is not wired into any blocking gate. ODVR-T2
(representative operator value proof) remains parked pending a fresh,
separately authorized GC-018 and source-verified work order.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ODVR foundation front door; no public-sync artifact
is produced or claimed by this document.

## Claim Boundary

Index and authority-chain pointer only. Does not implement, authorize, or
claim any composer, CLI, UI, provider/live proof, public-sync, or
production-readiness behavior.
