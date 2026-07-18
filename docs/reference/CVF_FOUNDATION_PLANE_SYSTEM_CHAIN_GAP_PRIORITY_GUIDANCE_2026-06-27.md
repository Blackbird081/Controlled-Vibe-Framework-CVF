# CVF Foundation Plane System-Chain Gap Priority Guidance

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference_guidance

Date: 2026-06-27

Owner: Codex

rawMemoryReleased: false

## Purpose

Record the operator-prioritized assessment that the next roadmap or tranche
must target CVF foundation-plane system-chain gaps before downstream use-case,
runtime, provider, or public-surface expansion.

This file is a routing reference for the next GC-018 and work order. It is not
itself a dispatch packet and does not authorize source, registry, runtime,
provider, public-sync, or generated-state mutation.

## Scope / Applies-To

This guidance applies to foundation-plane roadmap selection, GC-018 scoping,
work-order authoring, and tranche sequencing for CVF system-chain completion.

It applies when an agent or operator is deciding whether to open foundation
interlock, checker, runtime, use-case, provider, public-sync, or MPI follow-up
work after the MPI-T5 current-state reconciliation.

It does not apply as implementation authority for registry edits, runtime
changes, provider/live proof, generated state mutation, public export, or
downstream use-case work.

## Operator Direction

The operator direction on 2026-06-27 is:

1. Treat CVF foundation quality and plane-to-system completion as the highest
   priority.
2. Record the current assessment as a governed file so future agents do not
   reopen the same discussion from chat memory.
3. Use this assessment as the guide for the next roadmap or next tranche.
4. Prioritize closing the plane system-chain gaps below.

## Source Authority

| Source | Path | Role |
|---|---|---|
| Master Architecture closure roadmap | `docs/roadmaps/CVF_MASTER_ARCHITECTURE_CLOSURE_ROADMAP_2026-04-05.md` | canonical architecture closure posture for Control, Execution, Governance, and Learning planes |
| Foundation Planes system completion roadmap | `docs/roadmaps/CVF_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_COMPLETION_ROADMAP_2026-06-13.md` | current FPC status, candidate chain, and FPC-T3-C04+C01 closure update |
| FPC-T1 audit matrix | `docs/reference/CVF_FPC_T1_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_AUDIT_MATRIX_2026-06-13.md` | plane-by-plane workflow-chain, interlock, and machine-check posture |
| FPC-T2 decision matrix | `docs/reference/CVF_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_MATRIX_2026-06-13.md` | C01 through C05 interlock candidate evidence and dispositions |
| FPC-T2 completion | `docs/reviews/CVF_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_COMPLETION_2026-06-13.md` | accepted decision that C01-C04 are proposal-only registry candidates and C05 required C01 first |
| FPC-T3 coverage plan | `docs/reference/CVF_FPC_T3_FOUNDATION_CHECKER_TEMPLATE_COVERAGE_PLAN_2026-06-13.md` | remaining checker/template candidate priorities C02, C03, C05, C06, C07 |
| FPC-T3-C04+C01 completion | `docs/reviews/CVF_FPC_T3_C04_C01_EPISTEMIC_WORK_ORDER_AND_PROCESS_PACKET_GUARD_COMPLETION_2026-06-13.md` | evidence that C04 template anchor and C01 epistemic process checker are implemented |
| System-loop interlock registry | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | current registered ACTIVE interlock connections |
| MPI-T5 current-state completion | `docs/reviews/CVF_MPI_T5_CURRENT_STATE_RECONCILIATION_COMPLETION_2026-06-27.md` | current memory-access checker reconciliation and no MPI-T6 runtime reopen boundary |
| FPC-SCG-T2 completion | `docs/reviews/CVF_FPC_SCG_T2_RAW_MEMORY_RELEASE_INVARIANT_AUTORUN_COVERAGE_COMPLETION_2026-06-27.md` | FPC-T3-C06 raw-memory-release invariant checker closure |
| FPC-SCG-T3 completion | `docs/reviews/CVF_FPC_SCG_T3_DICE_MACHINE_CANDIDATE_CHECKER_COMPLETION_2026-06-27.md` | FPC-T3-C02 DICE machine-candidate checker closure |
| FPC-SCG-T4 completion | `docs/reviews/CVF_FPC_SCG_T4_WORKER_RETURN_FAST_GATE_EPISTEMIC_FIXTURE_COMPLETION_2026-06-27.md` | FPC-T3-C05 worker-return fast-gate epistemic fixture closure |
| FPC-SCG-T5 completion | `docs/reviews/CVF_FPC_SCG_T5_INTERLOCK_EXPECTED_CHAIN_MANIFEST_SOURCE_VERIFICATION_COMPLETION_2026-06-27.md` | FPC-T3-C03 expected-chain manifest source-verification closure |
| FPC-T3-C03 expected-chain manifest | `docs/reference/CVF_FPC_T3_C03_INTERLOCK_EXPECTED_CHAIN_MANIFEST_2026-06-27.json` | stable expected-chain manifest for later checker extension |
| FPC-SCG-T6 completion | `docs/reviews/CVF_FPC_SCG_T6_INTERLOCK_EXPECTED_CHAIN_CHECKER_EXTENSION_COMPLETION_2026-06-27.md` | FPC-T3-C03 manifest-backed checker-extension closure |
| FPC-SCG-T7 acceptance ledger | `docs/reference/CVF_FPC_SCG_T7_FOUNDATION_SYSTEM_CHAIN_ACCEPTANCE_LEDGER_2026-06-27.json` | bounded foundation system-chain acceptance ledger and downstream reopen gates |
| FPC-SCG-T7 checker | `governance/compat/check_fpc_system_chain_acceptance_ledger.py` | local governance checker for acceptance ledger, closure chain, and parked downstream gates |
| FPC-SCG-T7 completion | `docs/reviews/CVF_FPC_SCG_T7_FOUNDATION_SYSTEM_CHAIN_ACCEPTANCE_LEDGER_AND_DOWNSTREAM_REOPEN_GATE_COMPLETION_2026-06-27.md` | T7 closure evidence |
| Active session state | `CVF_SESSION/ACTIVE_SESSION_STATE.json` | current next-move and parked-boundary routing |

No provider-specific memory file, chat transcript, external app source tree, or
uncited inference is source authority for this guidance.

## Assessment

The Master Architecture closure roadmap records the core planes as
closure-assessed. That does not mean every plane is already a connected,
interlocked, machine-checked workflow-system chain.

The FPC audit and routing matrices are the more precise current basis for
next-tranche selection: a plane can be architecturally closed and still lack a
system-loop interlock, a machine-check owner, or a claim-update path.

## Current Plane Status Summary

| Plane or lane | Current system-chain posture | Gap disposition |
|---|---|---|
| Governance Layer | `SYSTEM_CHAIN_MACHINE_CHECKED` for hook/checker enforcement | needs formal hook-chain-to-learning interlock visibility |
| Execution Plane | `SYSTEM_CHAIN_MACHINE_CHECKED` for ERH sub-loops | Model Gateway and Sandbox remain deferred; not the immediate priority unless separately authorized |
| Corpus / Scan / Extraction Plane | `SYSTEM_CHAIN_MACHINE_CHECKED` with registered interlocks | adequate for current FPC purposes |
| Public Evaluation / Export Boundary Plane | `SYSTEM_CHAIN_MACHINE_CHECKED` with registered interlock | adequate for current FPC purposes |
| Control Plane | `SYSTEM_CHAIN_STRUCTURAL_GUARDED` | needs formal Control/Governance hook-chain-to-learning interlock |
| Memory / Knowledge Plane | `SYSTEM_CHAIN_MACHINE_CHECKED_BOUNDED` for raw-memory assertion discipline; structural interlocks registered by FPC-SCG-T1 | remaining gaps move to downstream P1 checker candidates rather than raw-memory invariant coverage |
| Learning Plane | `SYSTEM_CHAIN_MACHINE_CHECKED_BOUNDED` for worker-return epistemic packet visibility; expected-chain manifest consumed by checker | broader completion claims still require roadmap refresh before downstream runtime/use-case selection |
| Evidence / Metadata Resolution Plane | `SYSTEM_CHAIN_MACHINE_CHECKED_BOUNDED` for worker-return epistemic packet visibility; expected-chain manifest consumed by checker | evidence-to-claim-update interlock is registered and manifest-backed checker coverage is closed bounded |
| Document Intelligence foundation lane | `SYSTEM_CHAIN_MACHINE_CHECKED_BOUNDED` for DICE-MC visibility when DICE/DIR paths change; structural interlock registered by FPC-SCG-T1 | downstream adapter eligibility remains a separate use-case/runtime boundary |
| Use-case adapter layer | downstream boundary, not a CVF plane | Policy_Local and Document Translator remain separate fresh-GC-018 use cases after foundation routing gaps are handled |
| Foundation system-chain acceptance | `FOUNDATION_SYSTEM_CHAIN_ACCEPTED_BOUNDED` by FPC-SCG-T7 ledger and checker | downstream reopen remains a separate operator decision and fresh-GC-018 lane |

## Priority Gap List

### P0 - System-Loop Interlock Registry Gap

Open the next roadmap or work order around source-verified registry planning
and, if authorized, registry edits for the currently accepted interlock
candidates:

| Candidate | Required direction | Current basis |
|---|---|---|
| FPC-T2-C01 | Control/Governance hook-chain enforcement loop to Learning/F2G intake | accepted as `ADD_INTERLOCK_ENTRY` proposal-only |
| FPC-T2-C02 | Memory consolidation output loop to Learning signal intake | accepted as `ADD_INTERLOCK_ENTRY` proposal-only |
| FPC-T2-C03 | Memory consolidation / knowledge-graph output loop to Retrieval / answer loop | accepted as `ADD_INTERLOCK_ENTRY` proposal-only |
| FPC-T2-C04 | DIR/DICE authorization gate output loop to downstream adapter eligibility | accepted as `ADD_INTERLOCK_ENTRY` proposal-only |
| FPC-T2-C05 | Evidence collection / worker-return / audit-finding loop to claim update / reviewer decision / learning intake | was `MACHINE_CHECK_FIRST`; FPC-T3-C04+C01 now satisfies the first prerequisite, so C05 is eligible for a narrow source-verified registry-entry decision |

The next tranche should not treat registry shapes in old matrices as already
applied. It must verify the current registry, current checker state, and current
FPC roadmap status before any edit.

### P1 - Machine-Check Coverage Gap

After or alongside P0, prioritize the remaining machine-check candidates that
turn structural plane posture into enforceable workflow-system posture:

| Candidate | Required direction | Why it matters |
|---|---|---|
| FPC-T3-C06 | CLOSED_BOUNDED by `governance/compat/check_raw_memory_release_invariant.py` | raw-memory-release assertion discipline is now checked in agent autorun and reviewer-fast local governance |
| FPC-T3-C02 | CLOSED_BOUNDED by `governance/compat/check_dice_machine_candidates.py` | DICE-MC-01 through DICE-MC-10 focused coverage is now visible to autorun and reviewer-fast local governance when DICE/DIR paths change |
| FPC-T3-C05 | CLOSED_BOUNDED by `governance/compat/run_worker_return_fast_gate.py` explicit `check_epistemic_process_packet.py --enforce` step | no-commit workers now catch epistemic packet gaps before reviewer intake through the fast gate |
| FPC-T3-C03 | manifest-backed checker extension is CLOSED_BOUNDED by `governance/compat/check_system_loop_interlock.py` and `governance/compat/test_check_system_loop_interlock.py` | detects the five source-verified expected-chain ids from the T5 manifest against registry id/status/automationLevel; future expansion requires later manifest update |

### P2 - Downstream Use-Case Restraint

Policy_Local, Document Translator, DICE runtime expansion, MPI-T6 runtime,
provider/live proof, public-sync, and Model Gateway/Sandbox runtime expansion
should not be selected ahead of P0/P1 unless the next GC-018 explicitly records
why a specific foundation gap is satisfied, inapplicable, or lower value.

## Next Roadmap Shape

The recommended next roadmap should be a foundation-system-chain gap closure
roadmap, not a runtime or use-case roadmap.

Minimum scope:

1. Re-read this guidance, the FPC roadmap, FPC-T1 matrix, FPC-T2 matrix and
   completion, FPC-T3-C04+C01 completion, and the live system-loop interlock
   registry.
2. Source-verify whether FPC-T2-C01 through C04 are still absent from the
   registry and whether their proposed upstream/downstream artifacts still
   exist.
3. Treat FPC-T3-C06 as closed bounded unless a future regression removes
   `governance/compat/check_raw_memory_release_invariant.py` or its autorun /
   reviewer-fast wiring.
4. Treat FPC-T3-C02 as closed bounded unless a future regression removes
   `governance/compat/check_dice_machine_candidates.py`, its focused tests, or
   autorun / reviewer-fast wiring.
5. Treat FPC-T3-C05 as closed bounded unless a future regression removes the
   explicit `epistemic process packet` step from `run_worker_return_fast_gate.py`
   or breaks its focused fixture test.
6. Treat FPC-T3-C03 expected-chain manifest source verification as closed
   bounded unless a future regression removes the manifest or invalidates its
   five expected-chain ids.
7. Treat FPC-T3-C03 checker extension as closed bounded unless a future
   regression removes `EXPECTED_CHAIN_MANIFEST_PATH`, stops calling the
   expected-chain comparison from `validate_registry`, or breaks focused
   tests for missing id/status/automationLevel mismatch.
8. Preserve downstream boundaries: no use-case adapter work, no runtime
   provider proof, no MPI-T6 runtime, no public-sync, no generated state
   mutation except session sync after closure.

Completed first work order candidate:

`FPC-SCG-T1 Foundation Plane System-Chain Interlock Registry Decision And Edit`

Completed P1 work order candidate:

`FPC-SCG-T2 Raw Memory Release Invariant Autorun Coverage`

Completed P1 work order candidate:

`FPC-SCG-T3 DICE Machine-Candidate Checker`

Completed P1 work order candidate:

`FPC-SCG-T4 Worker-Return Fast-Gate Epistemic Fixture`

Completed P1 prerequisite candidate:

`FPC-SCG-T5 Interlock Registry Expected-Chain Manifest Source Verification`

Completed P1 work order candidate:

`FPC-SCG-T6 Interlock Registry Expected-Chain Checker Extension`

Recommended next work order candidate:

`FPC-SCG-T7 Foundation Plane System-Chain Acceptance Ledger And Downstream Reopen Gate`

Completed roadmap refresh candidate:

`FPC-SCG-T0 Foundation Plane System-Chain Gap Closure Roadmap Refresh`

T0 refresh result: P0 and P1 are closed bounded through FPC-SCG-T1 through
FPC-SCG-T6. The next useful work is an acceptance/reopen-gate packet that
records foundation acceptance and blocks or authorizes downstream lane reopen
requests through source-verified conditions.

Completed acceptance/reopen-gate candidate:

`FPC-SCG-T7 Foundation Plane System-Chain Acceptance Ledger And Downstream Reopen Gate`

T7 result: foundation system-chain acceptance is bounded and machine-checkable
through `docs/reference/CVF_FPC_SCG_T7_FOUNDATION_SYSTEM_CHAIN_ACCEPTANCE_LEDGER_2026-06-27.json`
and `governance/compat/check_fpc_system_chain_acceptance_ledger.py`. Downstream
runtime/use-case/provider/public and MPI-T6 runtime lanes remain parked until a
fresh operator decision and source-verified GC-018 selects a specific lane and
records that lane's reopen conditions.

Recommended next decision:

Hold, or open a fresh source-verified downstream-lane selection GC-018 only if
the T7 checker passes and the operator selects a specific downstream lane.

Completed provenance-carrier reconciliation candidate:

`FPC-SCG-T8 Foundation System-Chain Acceptance Ledger Provenance Carrier Reconciliation`

T8 result: the T7 ledger now records current provenance carrier commits after
the 2026-06-27 rebuild. FPC-SCG-T1 remains anchored to pushed base `75fcad20`;
FPC-SCG-T0 and FPC-SCG-T2 through FPC-SCG-T6 now record `be253923` as the
current material carrier. `governance/compat/check_fpc_system_chain_acceptance_ledger.py`
now rejects stale pre-rebuild material carrier SHAs for required FPC-SCG
closure-chain rows.

Completed post-public-export downstream decision candidate:

`FPC-DSD-T1 Foundation Downstream Post-Public-Export Lane Selection Decision`

DSD-T1 result: downstream implementation remains held after UAP-T2. The
use-case-adapter-public lane already completed the docs-only public
README/catalog/snapshot export; runtime-provider-live, use-case implementation,
package activation, public-sync expansion, and MPI-T6 runtime remain parked
until a fresh source-verified GC-018 proves a lane-specific reopen condition.

Completed parked-reopen-gate systemization roadmap:

`FPC-PRG-T0 Parked Reopen Gate Systemization Roadmap`

PRG-T0 result: the next foundation-maintenance lane is source-verified as
parked reopen gate systemization, not downstream implementation. The next
recommended tranche is `FPC-PRG-T1 Parked Reopen Condition Source Inventory`;
checker implementation is deferred to T2 after the inventory exists. Runtime,
provider-live, use-case implementation, public-sync expansion, adapter,
package, certification, and MPI-T6 runtime work remain parked.

## Acceptance Criteria For The Next Tranche

The next tranche is correctly aligned only if it:

- starts from the FPC source surfaces above;
- lists the exact interlock candidates it will decide or edit;
- proves whether each candidate is currently absent, present, closed bounded, or superseded in
  `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json`;
- distinguishes architecture closure from workflow-system-chain completion;
- records why any non-gap runtime/use-case lane is not being selected;
- keeps all use-case, provider, runtime, public-sync, and MPI-T6 runtime work
  out of scope unless separately authorized.
- if downstream work is selected later, cites the T7 ledger checker evidence
  and records lane-specific reopen conditions before implementation.
- if parked reopen gate systemization continues, starts with PRG-T1 source
  inventory before checker implementation or gate wiring.

## Not Authorized

This guidance does not authorize:

- editing the system-loop interlock registry;
- reopening FPC-T3-C02 without checker/test/autorun/reviewer-fast regression evidence;
- reopening FPC-T3-C05 without fast-gate/checker/test regression evidence;
- reopening FPC-T3-C03 without manifest/checker/test regression evidence;
- opening MPI-T6 runtime work;
- opening Policy_Local or Document Translator source work;
- opening Model Gateway or Sandbox runtime expansion;
- running provider/live proof;
- changing generated session state except through a separate session-sync pass;
- public-sync or push.

## PRG-T0 Parked Reopen Gate Systemization Direction

PRG-T0 records a bounded foundation-maintenance roadmap for converting current
parked-lane reopen discipline into a source inventory and later checker. It
does not reopen implementation lanes.

Recommended next tranche:

`FPC-PRG-T1 Parked Reopen Condition Source Inventory`

PRG-T1 should inventory lane IDs, recorded condition text, owning artifacts,
evidence fields, and forbidden-until-gate-passes lists from the active front
door, active handoff, DSD-T1, T7 ledger, and value-parked standard. PRG-T1
must not implement checker code or hook wiring.

## Epistemic Process Block

Epistemic Process Applicability: EPISTEMIC_PROCESS_NA_WITH_REASON: this is a
source-backed routing guidance artifact that records operator priority and
current governed source posture. It does not run a new empirical experiment,
provider proof, runtime test, or prediction-vs-result evaluation.

Expected Result / Prediction: N/A with reason: no empirical prediction is made.

Evidence Comparison Requirement: N/A with reason: source reads are used for
governed routing, not for a new measured comparison.

Contradiction Or Gap Disposition: Current contradiction resolved by distinction:
Master Architecture closure means plane-level architecture posture, while FPC
system-chain completion requires interlock and machine-check coverage.

Claim Update Requirement: This file updates the next-roadmap guidance claim:
the highest-value next tranche should close FPC system-chain gaps before
runtime or downstream use-case expansion.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this guidance cites private provenance paths, active session state, and
internal roadmap/tranche identifiers. A public-safe summary would need separate
public-sync authorization and artifact review.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | local repository tools |
| Session or invocation | 2026-06-28 FPC-DSD-T1 post-public-export downstream hold decision |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, rg, source reads, apply_patch, Python governance gates |
| Target paths | `docs/roadmaps/CVF_FPC_DSD_T1_FOUNDATION_DOWNSTREAM_POST_PUBLIC_EXPORT_LANE_SELECTION_ROADMAP_2026-06-28.md`; `docs/baselines/CVF_GC018_FPC_DSD_T1_FOUNDATION_DOWNSTREAM_POST_PUBLIC_EXPORT_LANE_SELECTION_DECISION_2026-06-28.md`; `docs/reviews/CVF_FPC_DSD_T1_FOUNDATION_DOWNSTREAM_POST_PUBLIC_EXPORT_LANE_SELECTION_DECISION_COMPLETION_2026-06-28.md`; `docs/reference/CVF_FOUNDATION_PLANE_SYSTEM_CHAIN_GAP_PRIORITY_GUIDANCE_2026-06-27.md` |
| Allowed scope source | operator continuation after T8/UAP-T2 and active next move allowing hold or fresh source-verified downstream selection |
| Before status evidence | HEAD `77b30456`; worktree clean before material patch |
| After status evidence | guidance updated to record DSD-T1 hold result after UAP-T2 |
| Diff evidence | `git diff --name-status 77b30456 --` |
| Approval boundary | bounded DSD-T1 decision-only hold and guidance update |
| Claim boundary | records source-verified routing guidance; no registry edit, checker implementation, runtime/provider/live proof, public-sync, generated state mutation, adapter implementation, package activation, or MPI-T6 runtime work |
| Agent type | single-agent dispatcher/implementer/reviewer |
| Invocation ID | `fpc-dsd-t1-post-public-export-lane-selection-2026-06-28` |
| Expected manifest | `docs/roadmaps/CVF_FPC_DSD_T1_FOUNDATION_DOWNSTREAM_POST_PUBLIC_EXPORT_LANE_SELECTION_ROADMAP_2026-06-28.md`; `docs/baselines/CVF_GC018_FPC_DSD_T1_FOUNDATION_DOWNSTREAM_POST_PUBLIC_EXPORT_LANE_SELECTION_DECISION_2026-06-28.md`; `docs/reviews/CVF_FPC_DSD_T1_FOUNDATION_DOWNSTREAM_POST_PUBLIC_EXPORT_LANE_SELECTION_DECISION_COMPLETION_2026-06-28.md`; `docs/reference/CVF_FOUNDATION_PLANE_SYSTEM_CHAIN_GAP_PRIORITY_GUIDANCE_2026-06-27.md` |
| Actual changed set | `docs/roadmaps/CVF_FPC_DSD_T1_FOUNDATION_DOWNSTREAM_POST_PUBLIC_EXPORT_LANE_SELECTION_ROADMAP_2026-06-28.md`; `docs/baselines/CVF_GC018_FPC_DSD_T1_FOUNDATION_DOWNSTREAM_POST_PUBLIC_EXPORT_LANE_SELECTION_DECISION_2026-06-28.md`; `docs/reviews/CVF_FPC_DSD_T1_FOUNDATION_DOWNSTREAM_POST_PUBLIC_EXPORT_LANE_SELECTION_DECISION_COMPLETION_2026-06-28.md`; `docs/reference/CVF_FOUNDATION_PLANE_SYSTEM_CHAIN_GAP_PRIORITY_GUIDANCE_2026-06-27.md` |
| Manifest delta | MATCH |

## Claim Boundary

This file is guidance for selecting and scoping the next roadmap/tranche. It
does not make a runtime capability claim, does not change source or registry
behavior, and does not certify any plane as complete beyond the cited source
artifacts.
