# CVF NCR S05 Standalone Supervisor Source Contract

Memory class: POINTER_RECORD
docType: reference
Status: SOURCE_CONTRACT_ONLY_NOT_RUNTIME_ADMITTED
Date: 2026-10-03
Batch ID: CVF-NCR-S05-S1-SUPERVISOR-SOURCE

## Purpose

Author a standalone, parameterized supervisor source contract/component and six inert fixture sources. Accept source identity, explicit data/state contracts, fail-closed backend seams and complete static review evidence only. No C1 dependency/cache completion, upstream integration or runtime containment claim.

## Scope / Applies To

Project-specific source specification, not a new governance standard or a host capability claim. Version `local-supervisor-source@0.1.0`; Python standard-library source only, zero source execution in S1.

## Target / Source

New sibling source workspace `D:\UNG DUNG AI\TOOL AI 2026\CVF-NCR-S05-S1-SOURCE-20261003`. Retained design `docs/reference/CVF_NCR_S05_CONTROL_FIXTURE_DESIGN_2026-10-03.md` provides six fixture *planning constraints*, not verified native API semantics. docs/reviews/CVF_CVF_NCR_S05_CONTROL_FIXTURE_DESIGN_LOCAL_REVIEW_2026-10-03.md retains C1 STOP and all limitations. Operator's new instruction is recorded in `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-inputs-2026-10-03.json`. No provider memory is authority.

## Architecture And Authority Change

Old problem `cvf-ncr-c1-metadata-footprint` remains STOP at ordinal2 with its original blocker and counters; nothing in this packet is its ordinal3 or a resolution. Previous option D applied to the C1-scoped candidate lacking an independent contract. The operator now explicitly instructs Local to create a work order. This packet supplies the previously missing separate technical contract, rather than merely renaming the candidate.

| Dimension | Stopped C1 design | This source component admission |
|---|---|---|
| Objective | establish C1 dependency/cache/rights/preparation readiness | implement versioned, caller-parameterized source data/state interfaces |
| Authority | documentary design, no source writes | exact new sibling root/files, after bound release and pre-dispatch PASS |
| Deliverable | component metadata/design disposition | inert Python source, six fixture sources, exact hashes and static requirement mapping |
| Acceptance | unresolved C1 preparation/control contract | source structure and mandatory refusal at unimplemented native/disk/network seams |
| Integration | VieNeu/HyperFrames/model/browser/component identity | none: no upstream names, preset constants or C1 defaults in source logic |
| Blocker effect | old blocker retained | source can be accepted while old blocker stays wholly unresolved |

Independence test: removing all VieNeu/HyperFrames/dependency metadata leaves every source acceptance criterion meaningful. Implementing this source contract does not change C1 admission. The old stopped key/counters are preserved as historical constraints, not reset into this source lifecycle. New initial identity `local-supervisor-source-contract` denotes this concrete independent contract only; no C1 successor is released. If implementation introduces C1-specific behavior or claims to reduce its blocker, reject as scope/identity violation rather than silently reroute.


## Protocol / Contract / Requirements

1. `validate_envelope(data)` validates a versioned pure-data envelope: exact absolute owned root, allowlisted relative outputs, artifact hashes, positive finite caller limits, integer attempt cap, explicit stage/effect identifiers and custody owner. Reject missing, UNKNOWN, traversal, duplicate/case-colliding outputs, malformed hash, unsupported version and non-finite limits. No default values from C1/P1 or presets.
2. `decide_admission(envelope, capabilities)` returns structured ALLOW_SOURCE_PLAN or NO_GO plus reason IDs and required evidence. A Boolean capability flag or hash alone never proves OS enforcement. OS-dependent launch authority always remains NO_GO in S1.
3. `SupervisorPlan` is a data/state machine: NEW -> VALIDATED -> SOURCE_PLAN_ONLY, or REJECTED. Planned job states (suspended/bound/resumed/cancelled/closed) are described as inert records; no subprocess/native call occurs in any function or import path. A monotonic deadline is caller input and never reset by phase; committed bytes and working set are separate fields.
4. `WindowsJobBackend` defines an explicit interface and fail-closed unavailable implementation. Native job membership, handle lifecycle, ABI definitions and committed-memory semantics require later source evidence and effects admission. Methods requiring an OS action raise a named NotAdmitted error or return NO_GO; no speculative ctypes binding is accepted as a verified backend.
5. `BoundaryAdmission` refuses missing disk allocation, zero-egress, privilege or custody proof. No polling/working-set/socket-success fallback, blanket firewall reset or automatic deletion. An accepted source plan cannot enable any OS action.
6. Fixtures are inert source builders/assertion descriptions, covering the six finite contracts below. They must not allocate memory, create data files, attempt sockets or processes. Their output plans name the proposed runtime observations and NOT_EXECUTED_PLANNED status, including positive/negative/unknown outcomes.

| Fixture | Finite planning constraint |
|---|---|
| FX-D1 | 64 MiB capacity; 16 MiB overhead; 80 MiB total; 96 MiB attempted; outside-root denial |
| FX-M1 | 256 MiB committed limit; positive 64 MiB; single 384 MiB and four children each 96 MiB planned |
| FX-T1 | 20 s deadline; cancel at 5 s; supervisor death and orphan check; 2 s end tolerance |
| FX-B1 | planned pre-resume job membership and breakaway-denial assertions |
| FX-N1 | planned DNS/TCP/UDP denial; 2 s timeout is NOT_PROVEN, never PASS |
| FX-L1 | 1 MiB log / 2 MiB evidence; fixture 600 s within aggregate3600 s; counters never reset |

## Exact Source Files

Fourteen exact relative paths: `README.md`, `src/supervisor.py`, `src/envelope_contract.py`, `src/windows_job.py`, `src/boundary_admission.py`, `fixtures/fx_d1.py`, `fixtures/fx_m1.py`, `fixtures/fx_t1.py`, `fixtures/fx_b1.py`, `fixtures/fx_n1.py`, `fixtures/fx_l1.py`, `evidence/source-manifest.json`, `evidence/requirement-map.json`, `WORKER_RETURN.md`. Root plus src/fixtures/evidence directories only. Total raw source/evidence/return bytes <=1 MiB; Python <=1200 lines each; Markdown/JSON <=600 lines each. No bytecode, cache, environment, hidden files or Git initialization. Source manifest hashes the other thirteen frozen files; Local separately hashes manifest bytes. Return must not contain a manifest digest that would cause a circular hash dependency.

## Effect Admission And First-Write Check

Before the first write, after released packet/gate verification, worker must recheck exact root absence, resolved parent and reparse/ownership conditions with bounded filesystem inspection; do not inventory host OS, installed tools or user documents. Existing root, parent escape/reparse ambiguity or inaccessible state => stop before writing. The earlier absence check is historical only. Create files with exclusive creation; never overwrite. Record any partial creations; no deletion/cleanup grant. Retain sources pending Local review, no seven-day expiry grant. Cooperative timebox120 minutes/one worker turn; zero task-initiated provider calls/paid service spend, actual session/resource costs UNKNOWN.

## Static Acceptance And Evidence

REQ-1: complete fourteen-file ledger with raw SHA-256/bytes, external write inventory, identity/interface version and limits; no additional files.
REQ-2: symbols above, all six fixture mappings, source syntax examined without import/evaluation/bytecode, and static positive/negative/unknown plans. All OS-dependent operations visibly unavailable; source does not contain enabled native/process/network effects.
REQ-3: full governed worker return and independent Local review pending. Valid consolidated NO_GO for backend/runtime capability is compatible with complete source-contract delivery; absent mandatory source symbols are not complete.

Local independently reviews the actual returned sources and different assertion/mutation plans after return; never runs them in S1. A syntax/AST or hash PASS is not behavioural, OS, rights, runtime or resource proof. S2 requires a different admitted host/effect contract, including OI-05/OI-06/OI-08; no S2 grant here.

## Boundaries / Non-Goals

Worker may create only the new sibling source root `D:\UNG DUNG AI\TOOL AI 2026\CVF-NCR-S05-S1-SOURCE-20261003`, subdirectories src/fixtures/evidence, its fourteen allowlisted files, and two new CVF return/evidence files. Source text authoring plus read-only syntax/hash inspection only. Do not run/import/compile source or fixtures, launch processes, call native APIs, fetch/install/build, import upstream, create runtime roots or VHD/quota/ACL/firewall, infer/audio/render/provider/public/deploy, stage/commit or delegate. Ordinary new source-file writes are the only admitted effects after release; costs UNKNOWN.

## Claim Boundary

Source contract/component only. No installed/trusted supervisor, native backend, enforcement, dependency/cache closure, rights/consent, host OS, online freshness, audio/render, cost or runtime-ready proof. Retain old C1/P1/preset and stopped chain, but source is independent of those values. DS-01..DS-19 and all OS fixture cases NOT_EXECUTED_PLANNED. DEFERRED_PRIVATE_ONLY.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Local dispatcher/reviewer |
| Provider or surface | private shared CVF workspace |
| Session or invocation | CVF-NCR-S05-S1-SUPERVISOR-SOURCE |
| Working directory | repository root |
| Command or tool surface | local governed reads, scaffold, packet authoring and structural gates |
| Target paths | `docs/reference/CVF_NCR_S05_SUPERVISOR_SOURCE_CONTRACT_2026-10-03.md`; `docs/baselines/CVF_GC018_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_2026-10-03.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_2026-10-03.md`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-inputs-2026-10-03.json` |
| Allowed scope source | operator explicitly instructed orchestrator/reviewer to create work order |
| Before status evidence | prior clean worktree at captured HEAD 64dbfafd53bad6a2ad076bce16cd4851d68b5e27; exact four packet paths/two outputs absent |
| After status evidence | four dispatcher paths; no worker/source root creation |
| Diff evidence | git diff --check; git status --short --untracked-files=all |
| Approval boundary | manual worker relay after actual bound gate; no dispatcher worker/provider invocation |
| Claim boundary | source contract/admission only, no native proof |
| Agent type | INTERNAL_AGENT dispatcher |
| Invocation ID | cvf-ncr-s05-s1-source-dispatch-20261003 |
| Expected manifest | `docs/reference/CVF_NCR_S05_SUPERVISOR_SOURCE_CONTRACT_2026-10-03.md`; `docs/baselines/CVF_GC018_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_2026-10-03.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_2026-10-03.md`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-inputs-2026-10-03.json` |
| Actual changed set | `docs/reference/CVF_NCR_S05_SUPERVISOR_SOURCE_CONTRACT_2026-10-03.md`; `docs/baselines/CVF_GC018_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_2026-10-03.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_2026-10-03.md`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-inputs-2026-10-03.json` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: none |

## Checker Source Read-Ahead Block

| Field | Value |
|---|---|
| applicableCheckersRead | `governance/compat/check_dispatch_prompt_envelope.py`; `governance/compat/check_work_order_dispatch_quality.py`; `governance/compat/check_work_order_acceptance_ledger.py`; `governance/compat/check_dispatch_release_readiness.py`; `governance/compat/check_gate_to_role_closeability.py`; `governance/compat/check_semantic_convergence_control.py`; `governance/compat/check_independent_review_probe_admission.py`; `governance/compat/check_governed_artifact_checker_read_ahead.py`; `governance/compat/check_agent_operation_trace.py`; `governance/compat/check_review_cost_control.py`; `governance/compat/check_markdown_structural_completeness.py`; `governance/compat/check_absorption_blindspot_control_presence.py`; `governance/compat/check_corpus_completeness_report_integrity.py`; `governance/compat/check_delta_execution_claim_boundary.py` |
| literalTokensReviewed | first-section envelope; acceptance ledger; gate-role graph; SCEC predecessor/retained counters/escalation; trace/delta fields; standalone independent-probe declaration |
| gateRunPurpose | Confirm bounded paired design dispatch before release, not first discovery |
| claimBoundary | Declaration/static evidence only; not runtime enforcement |

## Delta Execution Claim Boundary Control Block

| Field | Value |
|---|---|
| claimScope | independent supervisor source contract |
| claimDisposition | CLAIM_REJECTED: no runtime behavior proven |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: no runtime receipt |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: source will be authored only under bound release; no OS action or source execution |
| invocationBoundary | source writing and static local evidence only |
| interceptionBoundary | no implemented enforcement |
| claimLanguage | proposals, UNKNOWN or NO_GO, cases planned |
| forbiddenExpansion | payload/install/build/upstream import/control mutation/voice/render/provider/public/deploy |
