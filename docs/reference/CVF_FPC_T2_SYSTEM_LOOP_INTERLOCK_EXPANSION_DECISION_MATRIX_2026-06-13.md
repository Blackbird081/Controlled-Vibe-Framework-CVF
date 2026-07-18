# CVF FPC-T2 System-Loop Interlock Expansion Decision Matrix

Memory class: FULL_RECORD

Status: WORKER_RETURN_SUBMITTED_UNCOMMITTED

docType: reference

Date: 2026-06-13

Worker: Claude

Snapshot time: 2026-06-13 (execution HEAD 1831606b)

Commit mode: WORKER_MUST_NOT_COMMIT

rawMemoryReleased=false

## Purpose

Evaluate each FPC-T2 candidate produced by FPC-T1 and assign exactly one
approved disposition per candidate. This matrix is a decision record only. It
does not authorize interlock registry edits, checker implementation,
runtime/source/test mutation, downstream use-case adapter work, live proof,
public-sync, readiness/cost/quality claims, memory reinjection, high-risk
promotion, or autonomous mutation.

## Scope / Target / Owner Boundary

Target: candidates FPC-T2-C01 through FPC-T2-C05 from the FPC-T1 audit matrix.

Owner boundary: Claude owns this decision matrix and the paired worker-return
packet only. Codex owns review, closure conversion, session-state sync, any
later registry-edit work order, and any FPC-T3 authorization.

## Source Authority

| Source | Path | Role |
| --- | --- | --- |
| FPC-T1 audit matrix | `docs/reference/CVF_FPC_T1_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_AUDIT_MATRIX_2026-06-13.md` | candidate definitions, plane evidence, reconciliation constraints |
| FPC-T1 completion | `docs/reviews/CVF_FPC_T1_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_AUDIT_COMPLETION_2026-06-13.md` | Codex-accepted candidate list after repair |
| FPC roadmap | `docs/roadmaps/CVF_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_COMPLETION_ROADMAP_2026-06-13.md` | disposition vocabulary, FPC-T2 purpose, MLW3 reconciliation requirement |
| GC-018 | `docs/baselines/CVF_GC018_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_2026-06-13.md` | authorization, claim boundary, forbidden scope |
| Work order | `docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_FOR_CLAUDE_2026-06-13.md` | required deliverables, acceptance criteria |
| System-loop interlock standard | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_STANDARD_2026-06-02.md` | registry field contract, interlock validity requirements |
| System-loop interlock registry | `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | existing 15 connections; read-only input |
| MLW3 contract | `docs/reference/CVF_MLW3_EVIDENCE_TO_TRUTH_LEARNING_SIGNAL_PIPELINE_2026-06-05.md` | evidence-to-learning surface; C05 reconciliation anchor |
| MLW3-RT1 completion | `docs/reviews/CVF_MLW3_RT1_EVIDENCE_TO_LEARNING_RUNTIME_PROOF_COMPLETION_2026-06-05.md` | route-visible `evidenceToLearningReadout` proof |
| Agent front-door instructions | `AGENTS.md` | provider-specific memory boundary |

No provider-specific agent file, external Document Translator source, external
Policy_Local source, or uncited inference is used as source authority.

## Corpus Completeness And Report Integrity

Corpus task class: DECISION_EVALUATION

Corpus root: FPC-T2 candidates as enumerated in FPC-T1 matrix, plus the
interlock registry JSON and MLW3 contract.

Snapshot time: 2026-06-13 at execution HEAD `1831606b`.

### Source File Manifest (Inline)

| File | Terminal status |
| --- | --- |
| `docs/reference/CVF_FPC_T1_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_AUDIT_MATRIX_2026-06-13.md` | READ |
| `docs/reviews/CVF_FPC_T1_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_AUDIT_COMPLETION_2026-06-13.md` | READ |
| `docs/roadmaps/CVF_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_COMPLETION_ROADMAP_2026-06-13.md` | READ |
| `docs/baselines/CVF_GC018_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_2026-06-13.md` | READ |
| `docs/work_orders/CVF_AGENT_WORK_ORDER_FPC_T2_SYSTEM_LOOP_INTERLOCK_EXPANSION_DECISION_FOR_CLAUDE_2026-06-13.md` | READ |
| `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_STANDARD_2026-06-02.md` | READ |
| `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` | READ (full registry, 15 connections) |
| `docs/reference/CVF_MLW3_EVIDENCE_TO_TRUTH_LEARNING_SIGNAL_PIPELINE_2026-06-05.md` | READ |
| `docs/reviews/CVF_MLW3_RT1_EVIDENCE_TO_LEARNING_RUNTIME_PROOF_COMPLETION_2026-06-05.md` | READ |

Declared exclusions: interlock registry mutation, checker implementation,
runtime/source/test files, external Document Translator, external Policy_Local,
OCR/provider/live proof, public-sync, session-state mutation.

Unresolved files: 0

Unreadable files: 0

Corpus verdict: COMPLETE_WITH_DECLARED_EXCLUSIONS

(COMPLETE_VERIFIED requires zero declared exclusions; this decision matrix has
design-mandated exclusions for the forbidden-scope classes above.)

---

## Candidate Evidence Ledger

Before assigning dispositions, this section records the key evidence facts for
each candidate derived from the required source reads.

### FPC-T2-C01 Evidence

- Upstream loop: Governance hook-chain enforcement loop
  (`governance/compat/run_local_governance_hook_chain.py`) producing machine-
  checked structural completeness, Finding-To-Governance, ASCII encoding,
  machine closure package, active session state compatibility, corpus scan
  registry, and related gate results.
- Downstream target: Learning signal intake / Finding-To-Governance loop
  (`governance/compat/check_finding_to_governance_learning.py`,
  `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/finding-to-learning-bridge.ts`).
- Existing registry coverage: `scan-loop-to-learning-loop` (id:
  `scan-loop-to-learning-loop`, `MACHINE_CHECKED`, ACTIVE) connects the
  **GC-051 Corpus Scan Registry** findings loop to the F2G learning loop.
- Distinction test: The governance hook-chain loop emits gate-level enforcement
  findings (structural completeness violations, ASCII encoding failures, machine
  closure package failures) that arise from governance workflow execution, NOT
  from corpus scan operations. These are worker-authored artifact defects
  detected by the reviewer-fast or pre-commit gates, not corpus scan findings.
  The `scan-loop-to-learning-loop` routing rule specifically routes
  `corpora[].findings[]` from `CVF_CORPUS_SCAN_REGISTRY.json` with
  `defectClass` and `learningLane`. Hook-chain enforcement findings are a
  structurally separate upstream; they are recorded in work-order finding
  tables and Finding-To-Governance Learning Disposition sections, not in the
  corpus scan registry. The distinction is source-backed and clear.
- Source confidence: SOURCE_BACKED

### FPC-T2-C02 Evidence

- Upstream loop: Memory consolidation output loop (MEMCON/MKG7), specifically
  the `memory-runtime-workflow-chain.ts` and conflict/staleness resolution
  results written to durable memory store.
- Downstream target: Learning signal intake bridge
  (`EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts`)
  and/or F2G bridge.
- Existing registry coverage: No active registry connection has
  `upstreamPlane: MEMORY` or `downstreamPlane: MEMORY`. Confirmed by reading
  all 15 connections in the registry JSON.
- Distinction test: The existing `scan-loop-to-learning-loop` connects corpus
  scan findings (GC-051 registry outputs) to F2G. Memory consolidation outputs
  are distinct: they come from the MEMCON/MKG7 durable memory store after
  conflict resolution and staleness review - not from corpus scans.
  `LearningSignalIntakeRecord` in
  `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts`
  is the intake bridge; MEMCON workflow explicitly includes a learning-signal
  output step. No current registry entry covers this path.
- Gap note: The FPC-T1 audit matrix (Row 5) confirmed no Memory-plane interlock
  exists. MLW3 contract covers evidence normalization from receipt/context/audit
  sources, not from memory consolidation workflow outputs directly.
- Source confidence: SOURCE_BACKED

### FPC-T2-C03 Evidence

- Upstream loop: Memory consolidation / knowledge-graph output loop
  (MKG7/KGR1), specifically knowledge-graph-store and knowledge-graph-builder
  outputs in `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/`.
- Downstream target: Retrieval / answer loop via
  `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts`
  and `memory-retrieval-policy.ts`.
- Existing registry coverage: No active registry connection covers the
  Memory-to-Retrieval path. All 15 registry connections reviewed.
- Status of owner surface: MKG7 closed `CLOSED_PASS_BOUNDED`; KGR1 closed
  `CLOSED_PASS_BOUNDED`; retrieval route exists and is `STRUCTURAL_GUARDED`
  (actor auth + provenance >= 0.7 gate in write route). No hook-chain checker
  enforces memory lifecycle invariants.
- Gap note: The memory-retrieval path exists as source code but has no
  registered interlock. The `memory-retrieval-policy.ts` enforces structural
  retrieval rules; `memory-readout/route.ts` is the consumer surface.
- Source confidence: SOURCE_BACKED

### FPC-T2-C04 Evidence

- Upstream loop: DIR/DICE authorization gate output loop. DIR-T0/T1/T2
  `CLOSED_PASS_BOUNDED`; DICE-T0/T1 `CLOSED_PASS_BOUNDED`. The
  `document_intelligence_router.py` and `document_intelligence_control_envelope.py`
  produce routing decisions and `operator_review_required` flags.
- Downstream target: Downstream adapter eligibility loops (DT-CVF-T0,
  Policy_Local, corpus ingestion eligibility) - currently parked and not
  authorized.
- Existing registry coverage: No registered interlock entry for DIR/DICE
  outputs. Confirmed by reading all 15 registry connections. FPC-T1 matrix Row
  8 explicitly confirms `NOT_REGISTERED_CANDIDATE`.
- Constraint note: This interlock maps the routing signal only. It must NOT
  pre-authorize use-case adapter work (DT-CVF-T0 is
  `PROPOSED_READY_FOR_FRESH_AUTHORIZATION`; Policy_Local is parked). The
  downstream side of this interlock has no active adapter yet.
- Source confidence: SOURCE_BACKED

### FPC-T2-C05 Evidence

- Upstream loop: Evidence collection / worker-return / audit-finding loop.
  Workers and reviewers gather evidence, compare against expectations, and
  record findings in worker-return packets, completion reviews, and audit
  matrices.
- Downstream target: Claim update / reviewer decision / learning-intake loop.
  Reviewer accepts, repairs, or rejects; finding tables feed F2G.
- Existing coverage: Two surfaces partially cover this path:
  1. `scan-loop-to-learning-loop` routes corpus scan findings to F2G.
  2. MLW3 contract routes **governed execution/audit/context/memory receipts**
     through evidence normalization to learning proposals.
     `evidenceToLearningReadout` (MLW3-RT1) provides route-visible proposal
     metadata. `autonomousMutationAuthorized=false` is enforced.
- Reconciliation analysis (F5 prerequisite from FPC roadmap):
  - MLW3 evidence-to-learning path: covers normalization of runtime evidence
    receipts (execution, audit, context, memory) into truth/evaluation/
    reputation candidates. Inputs are **governed receipt references** from
    `/api/execute` response. It is a runtime signal pipeline for evidence
    already generated during execution.
  - Evidence-to-claim-update path (this candidate): covers the workflow-chain
    discipline that governs how an AGENT, during governed work, compares
    gathered audit findings against its prior expectations, handles
    contradictions, and updates claims before closure. This is a **process
    governance workflow rule** (epistemic process control), not a runtime
    receipt normalization pipeline. The upstream loop is the agent
    evidence-gathering and prediction-comparison step WITHIN a governed work
    order; the output is a updated claim disposition in the work order/
    completion artifact.
  - Verdict on distinction: **PARTIALLY DISTINCT**. The two paths differ in
    upstream loop (runtime API execution receipts vs. agent workflow
    prediction-comparison) and in output shape (normalized learning proposal vs.
    updated claim disposition in governance artifact). However, the downstream
    consumer (learning intake / F2G) is the same or overlapping. The
    distinction at the process level is real, but the structural enforcement
    path does not yet exist. There is no current template or checker that
    requires the prediction-comparison/evidence-uptake/claim-update sections in
    work orders and completions. The Finding-To-Governance standard already
    covers finding-to-learning routing structurally. Adding a new interlock
    entry for a workflow-chain discipline that has no machine enforcement yet
    risks creating a registry entry without a binding routing rule.
  - FPC roadmap default rule: "If the audit-finding to claim-update path is not
    demonstrably distinct from MLW3's runtime evidence-to-learning path, the
    default disposition is `KEEP_STRUCTURAL_ONLY` or `MACHINE_CHECK_FIRST`."
  - Assessment: The path IS partially distinct at the upstream loop level but
    lacks a machine enforcement surface. A registry entry without an enforceable
    routing rule would be structural noise, not a governed interlock.
    `MACHINE_CHECK_FIRST` is the correct disposition: once FPC-T3-C01
    (`check_epistemic_process_packet.py`) adds the enforcement surface, the
    upstream loop output signal becomes concrete and a registry entry can be
    written against that checker.
- Source confidence: SOURCE_BACKED (distinction analysis from MLW3 contract and
  FPC roadmap F5 clause)

---

## Per-Candidate Decision Table

| Candidate ID | Candidate name | Existing registry coverage | Distinctness decision | Source confidence | Disposition | Registry edit authorization | FPC-T3 dependency | Claim boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FPC-T2-C01 | Control Plane hook-chain-to-learning-intake | `scan-loop-to-learning-loop` covers corpus scan findings to F2G; no entry for governance hook-chain enforcement findings | DISTINCT: hook-chain enforcement findings (artifact defects at gate phase) are structurally separate from corpus scan findings routed through GC-051 | SOURCE_BACKED | `ADD_INTERLOCK_ENTRY` | NOT_AUTHORIZED_BY_FPC_T2_WORK_ORDER | None required; structural enforcement already exists via `check_finding_to_governance_learning.py`; FPC-T3-C01 may later add epistemic section enforcement as an extension | Decision proposes the entry shape; does not prove semantic correctness of agent findings, completeness of all hook-chain outputs, runtime behavior, or autonomous mutation |
| FPC-T2-C02 | Memory-to-Learning signal interlock | No registry entry with `upstreamPlane: MEMORY`; all 15 connections reviewed | DISTINCT: memory consolidation/conflict-resolution outputs are not corpus scan findings; `scan-loop-to-learning-loop` does not cover MEMCON workflow output | SOURCE_BACKED | `ADD_INTERLOCK_ENTRY` | NOT_AUTHORIZED_BY_FPC_T2_WORK_ORDER | FPC-T3-C06 (rawMemoryReleased=false autorun check) is a natural companion; not a prerequisite for the interlock entry itself | Does not prove memory semantic correctness, live learning promotion, autonomous mutation, production readiness, or public claims |
| FPC-T2-C03 | Memory-to-Retrieval signal interlock | No registry entry covering Memory-to-Retrieval path; all 15 connections reviewed | DISTINCT: no existing registered connection covers this path | SOURCE_BACKED | `ADD_INTERLOCK_ENTRY` | NOT_AUTHORIZED_BY_FPC_T2_WORK_ORDER | FPC-T3-C06 companion useful; not blocking | Does not prove retrieval semantic correctness, live KGR behavior, Redis connectivity, production retrieval, or autonomous mutation |
| FPC-T2-C04 | DIR/DICE-to-downstream-adapter eligibility interlock | No registry entry for DIR/DICE upstream; all 15 connections reviewed | DISTINCT: no existing connection covers DIR/DICE authorization gate outputs | SOURCE_BACKED | `ADD_INTERLOCK_ENTRY` | NOT_AUTHORIZED_BY_FPC_T2_WORK_ORDER | FPC-T3-C02 (`check_dice_machine_candidates.py`) is an independent quality improvement; the interlock entry itself does not require it | Does not pre-authorize DT-CVF-T0 or Policy_Local adapter work; does not prove downstream adapter eligibility, live document routing, production use-case, or autonomous mutation |
| FPC-T2-C05 | Evidence-to-claim-update workflow-chain interlock | `scan-loop-to-learning-loop` (partial overlap at downstream); MLW3 evidence-to-learning surface (partial overlap at downstream); no single entry covers the agent prediction-comparison/claim-update process step | PARTIALLY DISTINCT at upstream (process governance, not runtime receipts); not demonstrably distinct at enforcement level because no machine surface yet exists for the prediction-comparison workflow step | SOURCE_BACKED | `MACHINE_CHECK_FIRST` | NOT_AUTHORIZED_BY_FPC_T2_WORK_ORDER | FPC-T3-C01 (`check_epistemic_process_packet.py`) is required first: once the checker defines the upstream output signal (prediction-comparison result, claim update disposition), the registry entry can be written against a concrete enforcement surface | Deferring to FPC-T3-C01 does not reject the epistemic interlock concept; it prevents a structurally hollow registry entry; does not prove reasoning correctness, semantic truth, or autonomous mutation |

---

## Proposed Registry Shapes (ADD_INTERLOCK_ENTRY Candidates Only)

These shapes are PROPOSAL-ONLY. They must not be written to the registry until
a separate registry-edit work order is authorized by Codex. The GC-018 and this
work order do not authorize registry mutation.

### FPC-T2-C01: Proposed Shape

```
id: governance-hook-chain-to-learning-intake
status: PROPOSED
upstreamLoop: GOVERNANCE_HOOK_CHAIN_ENFORCEMENT_LOOP
upstreamPlane: GOVERNANCE_CONTROL_PLANE
outputArtifact: worker-return packets and completion reviews containing
  Finding-To-Governance Learning Disposition tables (e.g.,
  docs/reviews/CVF_FPC_T1_FOUNDATION_PLANES_WORKFLOW_CHAIN_SYSTEM_AUDIT_COMPLETION_2026-06-13.md)
outputSignal: governance-phase enforcement findings with defectClass, learningLane,
  escalationState, and nextControlAction from Finding-To-Governance Learning
  Disposition tables in governed worker returns and completions
signalContract: docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md
  (Finding-To-Governance Learning Disposition section requirement)
downstreamLoop: LEARNING_SIGNAL_INTAKE_F2G_LOOP
downstreamPlane: LEARNING_PLANE
inputArtifact: EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts
routingRule: When a governed worker return or completion review contains a
  Finding-To-Governance Learning Disposition table, each row with escalationState
  MACHINE_CHECK_CANDIDATE, RULE_GAP, or INTERLOCK_CANDIDATE must produce a
  traceable action artifact (new governance rule, checker candidate, or roadmap
  entry). Reviewer gate must verify the disposition table is present and each
  row has a cited next action. The routing does not authorize autonomous
  rule creation, checker implementation, registry mutation, runtime mutation,
  or public claims.
evidenceRefs:
  - governance/compat/check_finding_to_governance_learning.py
  - EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/finding-to-learning-bridge.ts
  - docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md
automationLevel: STRUCTURAL_GUARDED (check_finding_to_governance_learning.py
  enforces finding structure; no per-interlock hook-chain output shape check yet;
  FPC-T3-C01 may elevate to MACHINE_CHECKED)
claimBoundary: This connection proves governance-phase enforcement findings are
  structurally routed into the F2G learning intake via work-order and completion
  templates. It does not prove semantic correctness of agent findings, completeness
  of all hook-chain outputs, runtime behavior change, live provider behavior,
  autonomous mutation, or public claims.
```

### FPC-T2-C02: Proposed Shape

```
id: memory-consolidation-to-learning-signal
status: PROPOSED
upstreamLoop: MEMORY_CONSOLIDATION_WORKFLOW_LOOP (MEMCON/MKG7)
upstreamPlane: MEMORY_KNOWLEDGE_PLANE
outputArtifact: EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts
  (conflict resolution and staleness review outputs)
outputSignal: memory consolidation result with conflict resolution decision,
  staleness verdict, and MEMCON workflow step completion status; rawMemoryReleased=false
  invariant honored
signalContract: docs/roadmaps/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_ROADMAP_2026-06-12.md
  (MEMCON workflow chain steps defining conflict/staleness review outputs)
downstreamLoop: LEARNING_SIGNAL_INTAKE_F2G_LOOP
downstreamPlane: LEARNING_PLANE
inputArtifact: EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts
routingRule: When a MEMCON workflow produces a conflict resolution decision or
  staleness verdict, the result must be surfaced as a proposal-only learning
  signal candidate (not a direct write). The routing does not authorize
  autonomous memory mutation, truth-model update, learning orchestration,
  runtime promotion, or public claims. rawMemoryReleased=false must be preserved.
evidenceRefs:
  - docs/roadmaps/CVF_MKG7_MEMORY_PLANE_OPERATIONALIZATION_ROADMAP_2026-06-01.md
  - docs/roadmaps/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_ROADMAP_2026-06-12.md
  - EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts
  - EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/learning-signal-intake-bridge.ts
automationLevel: STRUCTURAL_GUARDED (no autorun hook-chain checker for memory
  lifecycle invariants yet; FPC-T3-C06 rawMemoryReleased check would elevate this)
claimBoundary: This connection proves memory consolidation outputs are structurally
  routed into proposal-only learning signal candidates. It does not prove live
  learning promotion, autonomous memory mutation, truth-model correctness,
  production memory readiness, public claims, or Redis live connectivity.
```

### FPC-T2-C03: Proposed Shape

```
id: memory-knowledge-graph-to-retrieval
status: PROPOSED
upstreamLoop: MEMORY_KNOWLEDGE_GRAPH_OUTPUT_LOOP (MKG7/KGR1)
upstreamPlane: MEMORY_KNOWLEDGE_PLANE
outputArtifact: EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge-graph-store.ts
outputSignal: knowledge graph query result or node/edge set from bounded local
  KGR retrieval; provenance >= 0.7 gate honored
signalContract: docs/roadmaps/CVF_KGR1_KNOWLEDGE_GRAPH_RETRIEVAL_ROADMAP_2026-06-01.md
  (KGR1 local retrieval contract and claim boundary)
downstreamLoop: RETRIEVAL_ANSWER_LOOP
downstreamPlane: MEMORY_KNOWLEDGE_PLANE
inputArtifact: EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts
routingRule: When a governed memory readout request passes actor auth and
  provenance >= 0.7 gate, the knowledge-graph query result may be returned as
  summary-only memory readout. The routing does not authorize raw memory release
  (rawMemoryReleased=false), live Redis retrieval, external embedding, autonomous
  mutation, or public claims.
evidenceRefs:
  - docs/roadmaps/CVF_KGR1_KNOWLEDGE_GRAPH_RETRIEVAL_ROADMAP_2026-06-01.md
  - EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/knowledge-graph-store.ts
  - EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-retrieval-policy.ts
  - EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/readout/route.ts
automationLevel: STRUCTURAL_GUARDED (actor auth + provenance gate enforced in
  route; no autorun hook-chain checker for memory lifecycle invariants)
claimBoundary: This connection proves knowledge-graph retrieval outputs are
  structurally routed into a summary-only memory readout response. It does not
  prove live Redis connectivity, external KGR behavior, semantic retrieval
  correctness, production memory readiness, autonomous mutation, or public claims.
```

### FPC-T2-C04: Proposed Shape

```
id: dir-dice-to-downstream-adapter-eligibility
status: PROPOSED
upstreamLoop: DIR_DICE_AUTHORIZATION_GATE_LOOP
upstreamPlane: DOCUMENT_INTELLIGENCE_FOUNDATION_LANE
outputArtifact: EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/document_intelligence_control_envelope.py
outputSignal: DICE authorization decision with operator_review_required flag;
  document type classification and routing decision from DIR
signalContract: docs/roadmaps/CVF_DOCUMENT_INTELLIGENCE_CONTROL_ENVELOPE_ROADMAP_2026-06-13.md
  (DICE-T1 authorization gate contract)
downstreamLoop: DOWNSTREAM_ADAPTER_ELIGIBILITY_LOOP
downstreamPlane: USE_CASE_ADAPTER_LAYER (DT-CVF, Policy_Local, corpus)
inputArtifact: future DT-CVF-T0 or Policy_Local adapter intake contract
  (not yet authorized; inputArtifact is a placeholder for the adapter GC-018)
routingRule: When DICE authorization gate produces a routing decision and
  operator_review_required is surfaced, the downstream adapter work order may
  consume the DICE output as eligibility evidence. A separate adapter GC-018 is
  required before any adapter work begins. This interlock maps the signal path
  only; it does not authorize adapter implementation, OCR/provider execution,
  DT-CVF-T0 dispatch, Policy_Local dispatch, or public claims.
evidenceRefs:
  - docs/roadmaps/CVF_DOCUMENT_INTELLIGENCE_ROUTER_FOUNDATION_ROADMAP_2026-06-13.md
  - docs/roadmaps/CVF_DOCUMENT_INTELLIGENCE_CONTROL_ENVELOPE_ROADMAP_2026-06-13.md
  - EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/document_intelligence_control_envelope.py
  - EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/document_intelligence_router.py
automationLevel: STRUCTURAL_GUARDED (DICE-MC-01 through DICE-MC-10 checked by
  focused test suite; no autorun hook-chain enforcement of DIR/DICE interlock yet;
  FPC-T3-C02 check_dice_machine_candidates.py would elevate this)
claimBoundary: This connection proves DIR/DICE authorization gate outputs are
  structurally designated as an eligibility signal for downstream adapter work.
  It does not authorize DT-CVF-T0, Policy_Local, OCR/provider execution, live
  document routing, production use-case, autonomous mutation, or public claims.
  Downstream adapter use requires a separate GC-018.
```

### FPC-T2-C05: N/A with reason

Disposition is `MACHINE_CHECK_FIRST`. No proposed registry shape is produced
because the upstream output signal (prediction-comparison result, claim update
disposition from agent workflow epistemic section) does not yet have a concrete
enforcement surface. Writing a registry entry against an undefined or unenforced
output signal would create a structurally hollow interlock that cannot be verified
by `check_system_loop_interlock.py`.

Required FPC-T3 prerequisite: `FPC-T3-C01` (`check_epistemic_process_packet.py`)
must be designed and its output signal contract must be defined before a registry
entry for this candidate can be proposed.

---

## C05 MLW3 Reconciliation Section

This section fulfills the FPC-T1 matrix constraint and roadmap F5 prerequisite:
"FPC-T2-C05 must reconcile against the existing MLW3 evidence-to-learning
surface before `ADD_INTERLOCK_ENTRY`."

### MLW3 Evidence-to-Learning Surface Summary

Source: `docs/reference/CVF_MLW3_EVIDENCE_TO_TRUTH_LEARNING_SIGNAL_PIPELINE_2026-06-05.md`
and `docs/reviews/CVF_MLW3_RT1_EVIDENCE_TO_LEARNING_RUNTIME_PROOF_COMPLETION_2026-06-05.md`

| MLW3 attribute | Value |
| --- | --- |
| Upstream trigger | Governed execution/audit/context/memory receipt references from `/api/execute` response |
| Input type | `evidenceReceiptRefs` array (runtime receipt IDs from MLW1/MLW2/audit/execution) |
| Processing | Normalize into truth/evaluation/reputation candidates |
| Output | `evidenceToLearningReadout` with `proposalAction`, `autonomousMutationAuthorized=false` |
| Downstream | Learning Signal Intake Bridge or Finding-to-Learning bridge |
| Enforcement level | `STRUCTURAL_GUARDED` at proposal boundary; `autonomousMutationAuthorized=false` code invariant |
| Registry status | No registered interlock entry (this was noted in FPC-T1 Row 4/7 as a gap) |

### Existing scan-loop-to-learning-loop Summary

Source: `docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json`

| Attribute | Value |
| --- | --- |
| Upstream trigger | GC-051 Corpus Scan Registry findings (`corpora[].findings[]`) |
| Input type | Scan finding with `disposition`, `defectClass`, `learningLane`, `f2gRef` |
| Downstream | F2G learning disposition + learning signal intake candidate |
| Enforcement level | `MACHINE_CHECKED` via `check_corpus_scan_registry.py` and `check_finding_to_governance_learning.py` |

### Evidence-to-Claim-Update (FPC-T2-C05 Candidate)

| Attribute | Value |
| --- | --- |
| Upstream trigger | Agent prediction-comparison step WITHIN a governed work order execution: expected result vs. actual evidence; contradiction handling; claim update decision before closure |
| Input type | Epistemic-process section in worker return or completion: prediction, evidence comparison, contradiction, claim update disposition |
| Downstream | Updated claim disposition in governance artifact (completion, work order); potentially F2G if a learning finding emerges |
| Enforcement level | NONE currently. The work-order template standard requires Finding-To-Governance Learning Disposition tables but does not require a prediction-comparison/evidence-uptake/claim-update section. No template or checker enforces the epistemic input-prediction-comparison structure. |

### Reconciliation Verdict

| Comparison dimension | MLW3 vs C05 | scan-loop vs C05 | Assessment |
| --- | --- | --- | --- |
| Upstream loop | Different: MLW3 uses runtime execution receipts; C05 uses in-workflow agent epistemic comparison step | Different: scan-loop uses GC-051 scan outputs; C05 uses agent work-order epistemic section | Upstream is PARTIALLY DISTINCT |
| Output signal | Different: MLW3 outputs normalized evidence candidates for truth/evaluation/reputation; C05 outputs claim update disposition in governance artifact | Different: scan-loop outputs F2G-compatible finding record; C05 outputs epistemic section in governance artifact | Output signal is DISTINCT |
| Downstream consumer | Overlapping: all three eventually route to F2G / learning intake | Overlapping | Downstream consumer is OVERLAPPING but not identical (C05 primary destination is governance artifact, not just F2G) |
| Enforcement surface | MLW3 has `autonomousMutationAuthorized=false` code invariant + `STRUCTURAL_GUARDED`; scan-loop is `MACHINE_CHECKED` | No enforcement surface exists for C05 epistemic section yet | C05 has NO current enforcement surface |
| Registry viability | Writing C05 as a registry entry requires a concrete `outputSignal`, `signalContract`, and `routingRule` against an enforcement surface | FPC-T3-C01 checker is the prerequisite enforcement surface | Registry entry is NOT YET VIABLE |

**Final reconciliation verdict:** FPC-T2-C05 is partially distinct from both
MLW3 and `scan-loop-to-learning-loop` at the upstream-loop and output-signal
level. However, it lacks a machine enforcement surface and a concrete output
signal definition. Per FPC roadmap default: `MACHINE_CHECK_FIRST`. FPC-T3-C01
(`check_epistemic_process_packet.py`) must be designed first to define the
upstream signal contract and make the registry entry structurally viable.

---

## No-Registry-Edit Statement

This decision matrix is produced under `WORKER_MUST_NOT_COMMIT` and the GC-018
forbidden scope. The interlock registry file
`docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json` has not
been modified. All proposed registry shapes in this document are proposal-only
decision records. Registry mutation requires a separate work order with explicit
authorization from Codex.

---

## FPC-T3 Dependency Notes

| Candidate | FPC-T3 dependency | Priority per FPC-T1 candidate list |
| --- | --- | --- |
| FPC-T2-C01 | FPC-T3-C01 may extend C01 from STRUCTURAL_GUARDED to MACHINE_CHECKED by enforcing epistemic sections in Finding-To-Governance tables; not blocking for C01 registry entry | FPC-T3-C01 is priority 1 |
| FPC-T2-C02 | FPC-T3-C06 (rawMemoryReleased=false autorun check) would companion C02 interlock; not a prerequisite | FPC-T3-C06 is priority 4 |
| FPC-T2-C03 | FPC-T3-C06 companion; not a prerequisite | FPC-T3-C06 is priority 4 |
| FPC-T2-C04 | FPC-T3-C02 (check_dice_machine_candidates.py) would elevate C04 from STRUCTURAL_GUARDED to MACHINE_CHECKED; not a prerequisite for the registry entry itself | FPC-T3-C02 is priority 2 |
| FPC-T2-C05 | **FPC-T3-C01 is a hard prerequisite**: the `check_epistemic_process_packet.py` checker must define the upstream output signal before a registry entry can be written | FPC-T3-C01 is priority 1 |

FPC-T3 remains parked until FPC-T2 closes or a later operator authorization
explicitly chooses a small independent governance batch. These notes are for
planning purposes only.

---

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| FPC-T2-C05 cannot become a registry entry yet because no enforcement surface exists for the epistemic claim-update workflow step | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | FPC-T3-C01 must design `check_epistemic_process_packet.py` before C05 registry entry is proposed |
| Memory plane (C02/C03) has two distinct candidate interlocks neither covered by existing 15 registry entries | SYSTEM_LOOP_VISIBILITY_GAP | GOVERNANCE_CONTROL_PLANE | INTERLOCK_CANDIDATE | Codex-authorized registry-edit work order required for C02 and C03 |
| DIR/DICE foundation lane (C04) has no registered interlock despite producing authorization gate outputs | SYSTEM_LOOP_VISIBILITY_GAP | GOVERNANCE_CONTROL_PLANE | INTERLOCK_CANDIDATE | Codex-authorized registry-edit work order required for C04; downstream adapter requires separate GC-018 |
| Governance hook-chain enforcement findings (C01) are NOT covered by existing scan-loop-to-learning-loop | SYSTEM_LOOP_VISIBILITY_GAP | GOVERNANCE_CONTROL_PLANE | INTERLOCK_CANDIDATE | Codex-authorized registry-edit work order required for C01 |
| Runtime/provider/cost learning applicability | N/A_WITH_REASON | RUNTIME_BEHAVIOR_LEARNING | N/A_WITH_REASON | FPC-T2 is decision-only; no runtime/provider/cost behavior was changed |

---

## Claim Boundary

This decision matrix decides candidate interlock dispositions only. It does not:

- mutate the interlock registry (`docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json`);
- implement checkers or templates;
- authorize FPC-T3;
- prove semantic truth of any agent's reasoning;
- prove runtime or provider behavior;
- authorize downstream use-case adapter work (DT-CVF-T0, Policy_Local);
- authorize public-sync;
- make production, public, readiness, cost, or quality claims;
- release raw memory (`rawMemoryReleased=false`);
- constitute autonomous mutation.

Proposed registry shapes are planning artifacts only. Each requires a separate
Codex-authorized registry-edit work order before any mutation occurs.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance FPC-T2 decision matrix. Public-sync is not
authorized by this work order or GC-018.

rawMemoryReleased=false
