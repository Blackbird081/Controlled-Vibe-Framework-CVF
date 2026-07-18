# CVF FPC-T3-C03 Interlock Expected-Chain Manifest

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-27

rawMemoryReleased: false

## Purpose

Record the source-verified expected-chain manifest required before any future
FPC-T3-C03 extension to `governance/compat/check_system_loop_interlock.py`.

This reference is the human-readable companion to:

`docs/reference/CVF_FPC_T3_C03_INTERLOCK_EXPECTED_CHAIN_MANIFEST_2026-06-27.json`

## Scope / Applies To

This manifest applies only to the five foundation-plane system-chain interlock
candidates that are already source-routed through FPC-T2, FPC-T3, and
FPC-SCG-T1 through T4.

It does not authorize checker implementation, registry mutation, runtime work,
provider/live proof, public-sync, downstream use-case adapter work, generated
session-state mutation in the material commit, or MPI-T6 runtime work.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
| FPC-T3-C03 requires a stable expected-chain manifest before checker extension | `docs/reference/CVF_FPC_T3_FOUNDATION_CHECKER_TEMPLATE_COVERAGE_PLAN_2026-06-13.md` | `### FPC-T3-C03: Interlock Registry Coverage Checker Extension` | `FPC-T3-C03` | FPC-T3 coverage plan | ACCEPT |
| Current next move selects expected-chain manifest source verification | `docs/reference/CVF_FOUNDATION_PLANE_SYSTEM_CHAIN_GAP_PRIORITY_GUIDANCE_2026-06-27.md` | `Recommended next work order candidate` | `FPC-SCG-T5 Interlock Registry Expected-Chain Manifest Source Verification` | foundation-plane gap priority guidance | ACCEPT |
| System-loop registry fields define the comparison contract | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_STANDARD_2026-06-02.md` | `## Required Registry Fields` | `id` | system-loop interlock standard | ACCEPT |
| Existing checker validates current registry structure only | `governance/compat/check_system_loop_interlock.py` | function definition | `validate_registry` | system-loop interlock checker | ACCEPT |
| FPC-T2 accepted C01 through C04 as proposal-only interlock entries | `docs/reviews/CVF_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_COMPLETION_2026-06-13.md` | `## Decision Result` | `ADD_INTERLOCK_ENTRY` | FPC-T2 completion review | ACCEPT |
| FPC-T2 kept C05 machine-check-first until FPC-T3-C01 exists | `docs/reviews/CVF_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_COMPLETION_2026-06-13.md` | `## Decision Result` | `MACHINE_CHECK_FIRST` | FPC-T2 completion review | ACCEPT |
| FPC-T3-C04+C01 closed the epistemic process checker prerequisite | `docs/reviews/CVF_FPC_T3_C04_C01_EPISTEMIC_WORK_ORDER_AND_PROCESS_PACKET_GUARD_COMPLETION_2026-06-13.md` | `## Claim Update` | `check_epistemic_process_packet.py` | FPC-T3-C04+C01 completion review | ACCEPT |
| Current registry contains C01 active interlock | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | `connections[]` | `governance-hook-chain-to-learning-intake` | system-loop interlock registry | ACCEPT |
| Current registry contains C02 active interlock | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | `connections[]` | `memory-consolidation-to-learning-signal` | system-loop interlock registry | ACCEPT |
| Current registry contains C03 active interlock | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | `connections[]` | `memory-knowledge-graph-to-retrieval` | system-loop interlock registry | ACCEPT |
| Current registry contains C04 active interlock | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | `connections[]` | `dir-dice-to-downstream-adapter-eligibility` | system-loop interlock registry | ACCEPT |
| Current registry contains C05 active interlock | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | `connections[]` | `epistemic-process-to-claim-update` | system-loop interlock registry | ACCEPT |

## Expected Chain Manifest

| Candidate | Expected registry id | Source disposition | Current registry disposition | Future checker disposition |
|---|---|---|---|---|
| FPC-T2-C01 | `governance-hook-chain-to-learning-intake` | `ADD_INTERLOCK_ENTRY` | `PRESENT_ACTIVE` | `ELIGIBLE_FOR_EXPECTED_CHAIN_CHECK` |
| FPC-T2-C02 | `memory-consolidation-to-learning-signal` | `ADD_INTERLOCK_ENTRY` | `PRESENT_ACTIVE` | `ELIGIBLE_FOR_EXPECTED_CHAIN_CHECK` |
| FPC-T2-C03 | `memory-knowledge-graph-to-retrieval` | `ADD_INTERLOCK_ENTRY` | `PRESENT_ACTIVE` | `ELIGIBLE_FOR_EXPECTED_CHAIN_CHECK` |
| FPC-T2-C04 | `dir-dice-to-downstream-adapter-eligibility` | `ADD_INTERLOCK_ENTRY` | `PRESENT_ACTIVE` | `ELIGIBLE_FOR_EXPECTED_CHAIN_CHECK` |
| FPC-T2-C05 | `epistemic-process-to-claim-update` | `MACHINE_CHECK_FIRST_THEN_REGISTRY_ELIGIBLE` | `PRESENT_ACTIVE` | `ELIGIBLE_FOR_EXPECTED_CHAIN_CHECK` |

## Future Checker Boundary

A future FPC-T3-C03 checker extension may compare the JSON manifest's
`expectedChains[].expectedRegistryId` values against current registry
`connections[].id` values and require the matching `expectedStatus`.

The future checker must not infer missing planes outside this manifest without
a later source-verified manifest update.

## Verification

| Check | Evidence | Result |
|---|---|---|
| Current registry validity | `python governance/compat/check_system_loop_interlock.py --enforce` | PASS before manifest authoring |
| Manifest candidate presence | registry readout for five expected ids | PASS |
| Checker mutation | no checker source edit in this tranche | PASS |
| Registry mutation | no registry JSON edit in this tranche | PASS |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance foundation-plane manifest. Public-sync is not
authorized.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | local repository tools |
| Session or invocation | 2026-06-27 FPC-SCG-T5 interlock expected-chain manifest source verification |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, rg, apply_patch, Python, governance gates |
| Target paths | `docs/reference/CVF_FPC_T3_C03_INTERLOCK_EXPECTED_CHAIN_MANIFEST_2026-06-27.json`; `docs/reference/CVF_FPC_T3_C03_INTERLOCK_EXPECTED_CHAIN_MANIFEST_2026-06-27.md`; `docs/reference/CVF_FOUNDATION_PLANE_SYSTEM_CHAIN_GAP_PRIORITY_GUIDANCE_2026-06-27.md`; `docs/baselines/CVF_GC018_FPC_SCG_T5_INTERLOCK_EXPECTED_CHAIN_MANIFEST_SOURCE_VERIFICATION_2026-06-27.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_SCG_T5_INTERLOCK_EXPECTED_CHAIN_MANIFEST_SOURCE_VERIFICATION_FOR_CODEX_2026-06-27.md`; `docs/reviews/CVF_FPC_SCG_T5_INTERLOCK_EXPECTED_CHAIN_MANIFEST_SOURCE_VERIFICATION_COMPLETION_2026-06-27.md` |
| Allowed scope source | operator next-move instruction; active session state; FPC guidance; GC-018 baseline; work order |
| Before status evidence | `git rev-parse --short HEAD` = `49fa5a69` |
| After status evidence | source verification artifacts authored; gates run before commit |
| Diff evidence | `git diff --name-status` |
| Approval boundary | bounded expected-chain manifest source verification only |
| Claim boundary | manifest/reference only; no checker implementation, registry mutation, runtime/provider/public/use-case/MPI-T6 readiness claim |
| Agent type | Codex single-agent dispatcher/implementer/reviewer |
| Invocation ID | `fpc-scg-t5-interlock-expected-chain-manifest-source-verification-2026-06-27` |
| Expected manifest | `docs/reference/CVF_FPC_T3_C03_INTERLOCK_EXPECTED_CHAIN_MANIFEST_2026-06-27.json`; `docs/reference/CVF_FPC_T3_C03_INTERLOCK_EXPECTED_CHAIN_MANIFEST_2026-06-27.md`; `docs/reference/CVF_FOUNDATION_PLANE_SYSTEM_CHAIN_GAP_PRIORITY_GUIDANCE_2026-06-27.md`; `docs/baselines/CVF_GC018_FPC_SCG_T5_INTERLOCK_EXPECTED_CHAIN_MANIFEST_SOURCE_VERIFICATION_2026-06-27.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_SCG_T5_INTERLOCK_EXPECTED_CHAIN_MANIFEST_SOURCE_VERIFICATION_FOR_CODEX_2026-06-27.md`; `docs/reviews/CVF_FPC_SCG_T5_INTERLOCK_EXPECTED_CHAIN_MANIFEST_SOURCE_VERIFICATION_COMPLETION_2026-06-27.md` |
| Actual changed set | `docs/reference/CVF_FPC_T3_C03_INTERLOCK_EXPECTED_CHAIN_MANIFEST_2026-06-27.json`; `docs/reference/CVF_FPC_T3_C03_INTERLOCK_EXPECTED_CHAIN_MANIFEST_2026-06-27.md`; `docs/reference/CVF_FOUNDATION_PLANE_SYSTEM_CHAIN_GAP_PRIORITY_GUIDANCE_2026-06-27.md`; `docs/baselines/CVF_GC018_FPC_SCG_T5_INTERLOCK_EXPECTED_CHAIN_MANIFEST_SOURCE_VERIFICATION_2026-06-27.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_SCG_T5_INTERLOCK_EXPECTED_CHAIN_MANIFEST_SOURCE_VERIFICATION_FOR_CODEX_2026-06-27.md`; `docs/reviews/CVF_FPC_SCG_T5_INTERLOCK_EXPECTED_CHAIN_MANIFEST_SOURCE_VERIFICATION_COMPLETION_2026-06-27.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Claim Boundary

This reference records a source-verified expected-chain manifest only. It does
not mutate the system-loop registry, implement checker behavior, prove runtime
or provider behavior, authorize public-sync, or certify any plane as complete
beyond the cited source artifacts.
