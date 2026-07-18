# CVF Learning Signal Chain - Reference Front Door

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-20

EPISTEMIC_PROCESS_NA_WITH_REASON: reference front door - it indexes contracts
and makes no evidence comparison claim.

## Purpose

Stable entry point for the Learning Signal Chain (LSC) family of reference
contracts. LSC reconciles worker-experience tokens, finding-to-governance
rows, and future Learning Plane projections into one signal model that
extends the existing Learning Plane intake bridge instead of creating a
second learning-signal core.

## Scope

Applies to: documentation/reference contracts under
`docs/reference/learning_signal_chain/` only. Covers field-ownership,
mapping, de-dup, and source-layout rules for Learning Signal Chain
tranches. Does not cover ledger store, generator, drift checker, CLI/MCP
adapter, or runtime implementation, which remain future, separately
authorized tranches.

## Chain

`OBSERVED -> CAPTURED -> NORMALIZED -> TRIAGED -> OWNER_MAPPED ->
LEARNING_PROPOSAL -> EVALUATED -> GOVERNANCE_DECISION ->
WORK_ORDER_OR_CONTROL -> CLOSED_OR_DEFERRED`

`EVALUATED` maps to existing MLW5 (audit/feedback validation) and MLW6
(simulation/failure gate) evidence; it does not name a new evaluator.

## Current Contracts

| Tranche | Surface | Status |
|---|---|---|
| LSC-T1 | [CVF_LSC_T1_SIGNAL_LEDGER_SOURCE_LAYOUT_AND_DEDUP_CONTRACT.md](CVF_LSC_T1_SIGNAL_LEDGER_SOURCE_LAYOUT_AND_DEDUP_CONTRACT.md) | source-layout and de-dup contract only; no ledger store implemented |
| LSC-T1 template | [CVF_LEARNING_SIGNAL_LEDGER_ENTRY_TEMPLATE.json](CVF_LEARNING_SIGNAL_LEDGER_ENTRY_TEMPLATE.json) | documentation-only JSON shape; not an active runtime schema |
| LSC-T2 | [CVF_LSC_T2_MULTI_ROLE_CAPTURE_CONTRACT_AND_ELIGIBILITY_MATRIX.md](CVF_LSC_T2_MULTI_ROLE_CAPTURE_CONTRACT_AND_ELIGIBILITY_MATRIX.md) | multi-role capture eligibility and no-signal assertion contract only; no checker, helper, ledger store, or CLI/MCP adapter implemented |
| LSC-T3 | [CVF_LSC_T3_FAST_HELPER_READOUT.md](CVF_LSC_T3_FAST_HELPER_READOUT.md) | fast helper readout: `signalReadout` list in AAF helper JSON and human output; surfaces helper-detectable unresolved signals using LSC-T4 vocabulary; advisory and read-only; no ledger store, generator, drift checker, CLI/MCP adapter, or runtime implementation |
| LSC-T4 | [CVF_LSC_T4_PROMOTION_THRESHOLD_POLICY.md](CVF_LSC_T4_PROMOTION_THRESHOLD_POLICY.md) | promotion threshold policy: readout-only, watch-for-repeat, governance-proposal, rule/checker/work-order candidate, and closure-blocker outcomes; doc-only vocabulary; no ledger store, checker, helper, or runtime implementation |
| LSC-T6 | [CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT.md](CVF_LSC_T6_EXTERNAL_AGENT_CLI_MCP_SIGNAL_CONTRACT.md) | external-agent CLI/MCP signal IO contract: five-field `externalAgentSignalEvent`, exact `externalAgentNoSignalAssertion`, normalization defaults, readout relationship, absorption routing, latency boundary, and mutation boundary; adapter-contract-only and documentation/reference-only; no CLI/MCP adapter behavior, ledger store, generator, drift checker, runtime mutation, provider/live proof, or public-sync implemented |
| LSC-T5/T7 | [CVF_LSC_T5_T7_LEARNING_PLANE_BRIDGE_LATENCY_GUARD.md](CVF_LSC_T5_T7_LEARNING_PLANE_BRIDGE_LATENCY_GUARD.md) | Learning Plane bridge and latency guard: bridge eligibility matrix mapping LSC-T4 outcomes to RT2/RT3/MLW3 proposal-only chain, `EVALUATED` route through MLW5/MLW6, latency guard rules (capture cheap, FAST_PATH signals add no gate cost, governed promotion is batched), `latencyGuardDisposition` advisory field in AAF helper readout; no runtime Learning Plane mutation, RT2/RT3 source edits, ledger/generator/adapter implementation, provider/live proof, or public-sync |

## Source Authority

LSC contracts extend, and never parallel, the Learning Plane intake bridge:

- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts`
  (`LearningSignalIntakeInput`, `LearningSignalIntakeRecord`).

## What This Front Door Does Not Authorize

No ledger store, generator, drift checker, CLI/MCP adapter, runtime bridge,
provider/live proof, public-sync, or reopening of AAF-T6, AAF-T7, CGE-T3,
ACE-R1, MLW7, or MLW8. The only helper readout indexed here is the bounded
LSC-T3 AAF helper output; it is advisory, read-only, and not a runtime bridge.

## Related Surfaces

- `docs/roadmaps/CVF_LSC_T0_LEARNING_SIGNAL_CHAIN_RECONCILIATION_ROADMAP_2026-06-20.md`
- `docs/reference/worker_experience_retrospective/README.md`
- `governance/compat/check_worker_experience_retrospective.py`
- `docs/reference/CVF_JSON_GENERATED_AGGREGATE_DISCIPLINE_STANDARD_2026-06-12.md`

## Claim Boundary

This front door indexes LSC reference contracts only. It does not implement
runtime, provider, public-sync, or readiness behavior.
