# CVF NCR S05 Standalone Supervisor Source Contract

Memory class: POINTER_RECORD
docType: reference
Status: SOURCE_CONTRACT_ONLY_NOT_RUNTIME_ADMITTED
Date: 2026-10-03
Batch ID: CVF-NCR-S05-S1-SUPERVISOR-SOURCE-R1

## Purpose

Author a standalone, parameterized supervisor source contract/component and six inert fixture sources. Accept source identity, explicit data/state contracts, fail-closed backend seams and complete static review evidence only. No C1 dependency/cache completion, upstream integration or runtime containment claim.

## Scope / Applies To

Project-specific source specification, not a new governance standard or a host capability claim. Version `local-supervisor-source@0.2.0`; Python standard-library source only, zero source execution in S1.

## Target / Source

New sibling source workspace `D:\UNG DUNG AI\TOOL AI 2026\CVF-NCR-S05-S1-SOURCE-R1-20261003`. Retained design `docs/reference/CVF_NCR_S05_CONTROL_FIXTURE_DESIGN_2026-10-03.md` provides six fixture *planning constraints*, not verified native API semantics. docs/reviews/CVF_CVF_NCR_S05_CONTROL_FIXTURE_DESIGN_LOCAL_REVIEW_2026-10-03.md retains C1 STOP and all limitations. Operator's new instruction is recorded in `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-r1-inputs-2026-10-03.json`. No provider memory is authority.

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

## Consolidated Repair Contract - R1

This is one repair of the existing local-supervisor-source-contract; no source acceptance or backend/effect authority is claimed. F-01..F-07 and DV-STARTUP/READ-AHEAD/CREATION/EVIDENCE are consolidated in `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-local-findings-2026-10-03.json`, raw SHA-256 `357a4b4e6696633471e7d4b00fd1a5cba75f835615d8efe6a9c970aa8a2f524f`. Old source and worker returns are frozen evidence, not accepted implementation. Preserve the old fourteen raw hashes and both original CVF artifact hashes before and after the turn; drift => BLOCKED, no writes to the old root.

| Finding | Chosen R1 requirement | Distinct static counterexample plan |
|---|---|---|
| F-01 | Use sibling-relative package imports only in supervisor.py; no absolute fallback and no catch hiding dependency ImportError. README names the package posture as documentation only. Allow stdlib math/ntpath/re; do not implement a loader, sys.path mutation or import of worker source for checking. | dependency ImportError propagates; ambient module named envelope_contract cannot be a fallback path; inspect imports without executing them |
| F-02 | Deadline input and proposed accumulated elapsed must be finite nonnegative numbers (bool rejected); safely reject overflow/oversized integer conversion. Compute candidate total and remaining before mutating elapsed/log; malformed input, illegal state and overflow leave snapshot data unchanged. Retain one caller-supplied aggregate deadline, cumulative accounting without reset; past deadline returns remaining=0 and records exceeded status, never enables an action. No clock/enforcement proof. | NaN, +/-Infinity, finite-sum overflow, negative/bool/oversized integer, repeated phase, valid 5+3 within 20, valid over-budget phase; all planned only |
| F-03 | Input domain is an ordinary JSON-shaped tree (dict/list/string/bool/null/int/float); reject unsupported field/element types before hashing/set membership. Validate version/stage/effect strings, finite values and integer caps without leaking TypeError/OverflowError. Traversal of data must reject cycles/unsupported objects and nesting deeper than64 container levels (root level0) with structured reason IDs; no arbitrary-object coercion; phase labels must be nonempty ordinary strings before recording. | []/{} version or stage, nested-list effect, huge integer limit, malformed limits and unsupported/deep container; structured rejection planned |
| F-04 | Nonempty outputs and artifact_hashes must have exactly the same case-sensitive relative path spellings, one hash per output, no missing/extra entries. Detect duplicate/casefold-colliding hash keys as well as outputs before joining. Both validators use fullmatch for exactly64 lowercase ASCII hex characters, no whitespace/newline. A hash is source identity only. | empty map, missing/extra key, case-only key mismatch, duplicate casefold key, 63/65 chars, terminal newline/CRLF, non-string digest |
| F-05 | validate is legal only in NEW; check state before assignments. Validated envelope stored as an isolated ordinary-data copy. Before sealing, revalidate retained data and inspect decision; invalid/tampered data must become REJECTED with reasons, never SOURCE_PLAN_ONLY. Illegal method calls leave existing data/counters/log unchanged. Boundary NO_GO is still compatible with a valid inert source plan; every launch authority stays NO_GO. | second validate after VALIDATED/sealed/rejected; tampered version/limits/hash before seal; capability true cannot authorize launch |
| F-06 | Conservative lexical Windows ASCII-letter drive-root/relative-path policy: reject control/invalid chars, repeated/empty segments, traversal, root or segment trailing dot/space, ADS colon, reserved device stem CON/PRN/AUX/NUL/COM1..9/LPT1..9 (including extensions and COM/LPT followed by superscript1/2/3); device comparison uses a case-insensitive stem before the first dot with stem trailing spaces/dots trimmed. Apply to root segments, outputs and hash keys. Reject casefold-colliding paths and file-versus-descendant collisions after casefold. String comparisons are lexical only; no filesystem-equivalence or custody-certification claim. | CON, NUL.txt, COM1.log, a versus a/b and A/b, root trailing dot/space, traversal/ADS/drive escape; ordinary valid distinct files planned |
| F-07 | UNKNOWN means a whole string whose strip().casefold() equals unknown, anywhere in JSON keys/values; substring matches are allowed (e.g. KnownUnknownsTeam). Document and apply the same sentinel policy in envelope and boundary proof validation. Required named fields still require valid types/nonblank values. | unknown/UNKNOWN/ padded sentinel rejects; legitimate substring in owner/path passes sentinel rule subject to other guards |

### Evidence and write-custody correction

New interface version local-supervisor-source@0.2.0; versioned envelope local-supervisor-envelope@2. No old-C1 defaults or upstream integration. Retain six fixture finite planning constraints, explicit unavailable native backend and inert disk/network boundary seams. No runtime test/result is admitted.

New exact root: `D:\UNG DUNG AI\TOOL AI 2026\CVF-NCR-S05-S1-SOURCE-R1-20261003`; old exact root `D:\UNG DUNG AI\TOOL AI 2026\CVF-NCR-S05-S1-SOURCE-20261003` is read-only. Fourteen-file layout retained, with no additional log/test/cache file. Full write records go into the two new CVF return/evidence artifacts and tool output. All sixteen newly admitted file writes require an actual create-exclusive primitive (Python open(path, 'xb') or equivalent verified CREATE_NEW). Directory creation must fail on existing directory. Never use an overwrite-capable Write tool or root-absence as a substitute for file-level exclusivity. No overwrite/append/retry against a created path, no cleanup/deletion or original-file correction.

Prepare source payloads in memory; AST parse/read/hash only, no eval/literal_eval/import/compile/run. Write finalized bytes once per file. Log actor, full resolved path, creation mode, before-state check, result, bytes/hash and command/tool identity for each write; emit mode/result tool evidence at write time, including final return/evidence creation. A record about its own file before that exclusive creation is a planned record until corroborated by the post-write tool event, never self-certification. Self-hash remains outside that file. Record partial successful creations on failure and stop; no rollback/repair/retry authority for an existing path.

Generate source-manifest.json only after the other thirteen source files are finalized; hash raw bytes of those thirteen, never itself. No manifest digest inside the frozen sibling WORKER_RETURN.md. Final CVF evidence records manifest digest and every source ledger row. PROOF-RETURN must explicitly bind the new CVF Markdown return path/raw SHA-256 in proofIds, without a circular JSON-return hash dependency. Preserve original five-literal FAIL as WORKER_REPORTED (missing historical log), later PASS separately, startup reduction and genuine exclusive-creation violation; do not fabricate logs or rewrite original disclosures.

Before authoring, read AGENTS.md and applicable worker role/task orientation plus output checker constants/literals; record actual reads, not template claims. Mandatory output checker sources: check_worker_return_quality_gate.py, check_review_cost_control.py, check_finding_to_governance_learning.py, check_governed_artifact_checker_read_ahead.py, check_external_knowledge_intake_routing.py, check_work_order_acceptance_ledger.py, check_independent_review_probe_admission.py and check_agent_operation_trace.py under governance/compat. Do not use the first gate run to discover literals.

The source root absence observed by Local during packet authoring is historical only. Worker freshly checks target absence, resolved parent, reparse and owner ambiguity before first write, then enforces create-exclusive on each path. Existing target or unclear boundary => stop. Retain bytes pending Local review; no expiry policy or seven-day deletion admission. One cooperative120-minute turn; <=1MiB external total, Python<=1200 lines/file, Markdown/JSON<=600; two CVF returns <=950/620 respectively. Costs UNKNOWN; no new paid/provider operation.

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

Worker may create only the new sibling source root `D:\UNG DUNG AI\TOOL AI 2026\CVF-NCR-S05-S1-SOURCE-R1-20261003`, subdirectories src/fixtures/evidence, its fourteen allowlisted files, and two new CVF return/evidence files. Source text authoring plus read-only syntax/hash inspection only. Do not run/import/compile source or fixtures, launch processes, call native APIs, fetch/install/build, import upstream, create runtime roots or VHD/quota/ACL/firewall, infer/audio/render/provider/public/deploy, stage/commit or delegate. Ordinary new source-file writes are the only admitted effects after release; costs UNKNOWN.

## Claim Boundary

Source contract/component only. No installed/trusted supervisor, native backend, enforcement, dependency/cache closure, rights/consent, host OS, online freshness, audio/render, cost or runtime-ready proof. Retain old C1/P1/preset and stopped chain, but source is independent of those values. DS-01..DS-19 and all OS fixture cases NOT_EXECUTED_PLANNED. DEFERRED_PRIVATE_ONLY.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Local dispatcher/reviewer |
| Provider or surface | private shared CVF workspace |
| Session or invocation | CVF-NCR-S05-S1-SUPERVISOR-SOURCE-R1 |
| Working directory | repository root |
| Command or tool surface | local governed reads, scaffold, packet authoring and structural gates |
| Target paths | `docs/baselines/CVF_GC018_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_R1_2026-10-03.md`; `docs/reference/CVF_NCR_S05_SUPERVISOR_SOURCE_CONTRACT_R1_2026-10-03.md`; `docs/reviews/CVF_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_LOCAL_REVIEW_2026-10-03.md`; `docs/reviews/CVF_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_WORKER_RETURN_2026-10-03.md`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-local-findings-2026-10-03.json`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-local-static-oracle-2026-10-03.py`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-r1-inputs-2026-10-03.json`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-worker-2026-10-03.json`; `docs/work_orders/CVF_AGENT_WORK_ORDER_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_R1_2026-10-03.md` |
| Allowed scope source | operator explicitly instructed orchestrator/reviewer to create work order |
| Before status evidence | prior clean worktree at captured HEAD c8864ba03df504e7a8aa991f4bd14d7ef37b7a52; exact four packet paths/two outputs absent |
| After status evidence | four dispatcher paths; no worker/source root creation |
| Diff evidence | git diff --check; git status --short --untracked-files=all |
| Approval boundary | manual worker relay after actual bound gate; no dispatcher worker/provider invocation |
| Claim boundary | source contract/admission only, no native proof |
| Agent type | INTERNAL_AGENT dispatcher |
| Invocation ID | cvf-ncr-s05-s1-source-dispatch-20261003 |
| Expected manifest | `docs/baselines/CVF_GC018_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_R1_2026-10-03.md`; `docs/reference/CVF_NCR_S05_SUPERVISOR_SOURCE_CONTRACT_R1_2026-10-03.md`; `docs/reviews/CVF_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_LOCAL_REVIEW_2026-10-03.md`; `docs/reviews/CVF_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_WORKER_RETURN_2026-10-03.md`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-local-findings-2026-10-03.json`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-local-static-oracle-2026-10-03.py`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-r1-inputs-2026-10-03.json`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-worker-2026-10-03.json`; `docs/work_orders/CVF_AGENT_WORK_ORDER_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_R1_2026-10-03.md` |
| Actual changed set | `docs/baselines/CVF_GC018_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_R1_2026-10-03.md`; `docs/reference/CVF_NCR_S05_SUPERVISOR_SOURCE_CONTRACT_R1_2026-10-03.md`; `docs/reviews/CVF_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_LOCAL_REVIEW_2026-10-03.md`; `docs/reviews/CVF_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_WORKER_RETURN_2026-10-03.md`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-local-findings-2026-10-03.json`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-local-static-oracle-2026-10-03.py`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-r1-inputs-2026-10-03.json`; `docs/reviews/evidence/cvf-ncr-s05-s1-supervisor-source-worker-2026-10-03.json`; `docs/work_orders/CVF_AGENT_WORK_ORDER_CVF_NCR_S05_S1_SUPERVISOR_SOURCE_R1_2026-10-03.md` |
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
