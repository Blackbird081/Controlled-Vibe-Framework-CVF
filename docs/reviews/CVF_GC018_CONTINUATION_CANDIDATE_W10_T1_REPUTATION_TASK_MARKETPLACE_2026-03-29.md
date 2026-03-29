# CVF GC-018 Continuation Candidate — W10-T1: Reputation Signal and Task Marketplace Learning Expansion

Memory class: FULL_RECORD

> Date: 2026-03-29
> Wave: W10 — Tranche: T1
> Decision baseline: `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_POST_W7_OPEN_TARGETS_2026-03-28.md`
> Planning baseline: `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`
> Checklist used: `docs/reference/CVF_POST_W7_GC018_DRAFTING_CHECKLIST.md`
> Upstream structural inputs: W8-T1 (CLOSED DELIVERED), W8-T2 (CLOSED DELIVERED), W9-T1 (CLOSED DELIVERED)

---

## GC-018 Continuation Candidate

- Candidate ID: `W10-T1-CANDIDATE-D`
- Date: `2026-03-29`
- Parent roadmap / wave: `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`
- Proposed scope: Reputation signal contract and task marketplace integration — build reputation scoring on top of delivered LPF substrate (TruthScore, FeedbackLedger, EvaluationEngine) and introduce task allocation routing driven by agent reputation and capacity signals
- Continuation class: STRUCTURAL
- Why now: canonical decision pack `POST_W7_OPEN_TARGETS_DECISION_PACK_2026-03-28` designates Candidate D as the later-wave learning expansion; P5 entry conditions are now satisfied — W8-T1 (Candidate A, P3) CLOSED DELIVERED and W9-T1 (Candidate B, P4) CLOSED DELIVERED; W8-T2 (Candidate C, P2) CLOSED DELIVERED; all upstream structural families are closed; this is the final post-W7 roadmap candidate
- Active-path impact: `LIMITED` — learning-plane expansion on top of already-delivered LPF substrate; no W7 chain STRUCTURAL impact; reputation signal and task marketplace are additive new surfaces
- Risk if deferred: agent reputation remains unquantified; task routing defaults to arbitrary assignment rather than evidence-backed allocation; learning-plane substrate (TruthScore, FeedbackLedger, EvaluationEngine, GovernanceSignal) delivers data without a downstream consumer that closes the reputation feedback loop; fragmentation risk increases as more agents are onboarded
- Lateral alternative considered: NO
- Why not lateral shift: Candidate D is the last post-W7 structural candidate; no lateral structural alternative exists; deferring only delays the reputation feedback loop closure without yielding architecture benefit
- Real decision boundary improved: YES
- Boundary improvement note: agent reputation scoring authority and task allocation ownership are declared for the first time as governed contract surfaces; reputation class (TRUSTED / RELIABLE / PROVISIONAL / UNTRUSTED) becomes a first-class signal in learning-plane routing
- Expected enforcement class: `GOVERNANCE_DECISION_GATE` | `CI_REPO_GATE`
- Required evidence if approved:
  - ReputationSignalContract committed and tests pass (dedicated test file, GC-023 compliant)
  - TaskMarketplaceContract committed and tests pass (dedicated test file, GC-023 compliant)
  - Batch aggregation contracts for both (Fast Lane GC-021)
  - W7 chain non-destabilization verified (all 7 links READ_ONLY or ADDITIVE)
  - Not-in-this-wave exclusions confirmed at CP execution time
  - LPF substrate surfaces confirmed as FIXED INPUT (no restructuring)

---

## Depth Audit

- Risk reduction: `1` — reputation/marketplace fragmentation is a real but non-critical gap; the learning-plane substrate is delivered but has no downstream reputation consumer; the risk grows slowly as agent count scales
- Decision value: `2` — reputation scoring and task allocation are real, non-speculative decision boundaries; TruthScore and FeedbackLedger already produce the data; binding that data to a reputation surface is a genuine new governance authority
- Machine enforceability: `2` — reputation scores and task allocation records follow the established CPF/LPF deterministic hash contract pattern; outputs are typed, testable, and schema-verifiable
- Operational efficiency: `1` — reputation-driven task routing reduces manual overhead but is not an immediate operational bottleneck today
- Portfolio priority: `1` — final post-W7 structural candidate; all upstream families (A, B, C) are CLOSED DELIVERED; lowest priority in the sequence by design; entry conditions satisfied
- Total: `7`
- Decision: CONTINUE
- Reason: all P5 entry conditions satisfied; delivered LPF substrate provides the necessary fixed inputs; machine-enforceable contract outputs; bounded additive-only scope; final post-W7 roadmap candidate

---

## Authorization Boundary

- Authorized now: YES
- Next batch name: `W10-T1 — Reputation Signal and Task Marketplace Learning Expansion`
- Reopen trigger: N/A

---

## Ownership Map

- surface: TruthScore contract (W6-T8)
  - current owner: LPF (W6-T8)
  - action: `keep` as FIXED INPUT — consumed by ReputationSignalContract as a read-only scoring source; no modification to TruthScoreContract or its schema
  - target owner: unchanged (LPF W6-T8)

- surface: FeedbackLedger contract (W4-T1)
  - current owner: LPF (W4-T1)
  - action: `keep` as FIXED INPUT — FeedbackLedger outcomes are read-only inputs for reputation scoring; no modification to FeedbackLedgerContract
  - target owner: unchanged (LPF W4-T1)

- surface: EvaluationEngine contract (W5-T?)
  - current owner: LPF
  - action: `keep` as FIXED INPUT — evaluation verdicts consumed read-only; no modification
  - target owner: unchanged (LPF)

- surface: GovernanceSignal contract (LPF)
  - current owner: LPF
  - action: `keep` as FIXED INPUT — governance signal history consumed read-only for reputation scoring input
  - target owner: unchanged (LPF)

- surface: reputation signal contract (NEW)
  - current owner: none — does not exist
  - action: `create` — new ReputationSignalContract in LPF; computes compositeReputationScore (0–100) and reputationClass (TRUSTED / RELIABLE / PROVISIONAL / UNTRUSTED) from TruthScore, FeedbackLedger, EvaluationEngine inputs
  - target owner: W10-T1 packet (LPF Architecture Authority)

- surface: task marketplace contract (NEW)
  - current owner: none — does not exist
  - action: `create` — new TaskMarketplaceContract in LPF; routes task allocation to agents based on reputation scores and capacity signals; produces TaskAllocationRecord
  - target owner: W10-T1 packet (LPF Architecture Authority)

- surface: W8-T1 gateway stability output
  - action: `keep` as FIXED INPUT — W10-T1 inherits W8-T1 frozen gateway boundary; must not re-open
  - target owner: unchanged (W8-T1 Architecture Authority)

- surface: W9-T1 RAG/context convergence output
  - action: `keep` as FIXED INPUT — W10-T1 may read normalized context packaging API as a fixed boundary; must not re-open
  - target owner: unchanged (W9-T1 Architecture Authority)

- surface: W7 governance integration chain (v3.0-W7T10)
  - action: `keep` — delivered baseline; W10-T1 may read but must not structurally modify

---

## Not In This Wave

- item: W7 chain structural modification (any link)
  - reason: W7 governance integration chain is at v3.0-W7T10 baseline; structural modification requires a separate explicitly authorized wave
- item: W8-T1 gateway surface re-opening
  - reason: W8-T1 gateway freeze declarations are FIXED INPUT; re-opening would violate W8-T1 CLOSED status
- item: W9-T1 RAG/context surface re-opening
  - reason: W9-T1 convergence is CLOSED DELIVERED; W10-T1 consumes it as a fixed boundary only
- item: Agent Definition merge work
  - reason: excluded unless blocking dependency proven with code-traceable evidence
- item: L0–L4 risk-model migration
  - reason: out of scope unless opened as a separate, explicitly justified proposal
- item: omnibus post-W7 continuation
  - reason: forbidden; this packet covers Candidate D only
- item: benchmark target numbers as current baseline truth
  - reason: PROPOSAL ONLY; W8-T2 closed the instrumentation wave but numbers remain PROPOSAL ONLY until trace-backed production evidence supports promotion
- item: Candidate A, B, or C re-opening
  - reason: all three are CLOSED DELIVERED; W10-T1 consumes their outputs as FIXED INPUT only
- item: LPF substrate contract modification (TruthScore, FeedbackLedger, EvaluationEngine, GovernanceSignal, PatternDetection, LearningLoop)
  - reason: all delivered LPF contracts are FIXED INPUT for W10-T1; reputation/marketplace surfaces are additive extensions only; any LPF restructuring requires a separate authorized wave

Exclusion enforcement: reviewer must confirm each item is absent from the W10-T1 implementation artifact list before authorizing any CP execution.

---

## Dependency Declaration

- wave: W10-T1
- family: Candidate D

Upstream dependencies (what this wave consumes as fixed inputs):
- dep: W7-T10 governance integration chain
  - status: FIXED
  - consumed as: architecture baseline v3.0-W7T10 — do not modify
- dep: W8-T1 — Trust Isolation and Model Gateway Boundary Convergence (CLOSED DELIVERED)
  - status: FIXED
  - consumed as: gateway stability output — model-gateway execution authority scope and trust/isolation boundary are FIXED INPUT; W10-T1 inherits them unchanged
- dep: W8-T2 — Performance Benchmark Harness (CLOSED DELIVERED)
  - status: FIXED
  - consumed as: instrumentation baseline — performance evidence discipline and acceptance-policy baseline apply to any W10-T1 artifacts; performance numbers remain PROPOSAL ONLY
- dep: W9-T1 — RAG and Context Engine Convergence (CLOSED DELIVERED)
  - status: FIXED
  - consumed as: context packaging normalization and retrieval authority baseline — W10-T1 task marketplace routing may read normalized context surfaces as fixed boundaries; must not re-open them
- dep: POST_W7_OPEN_TARGETS_DECISION_PACK_2026-03-28 (canonical GC-027 convergence point)
  - status: FIXED
  - consumed as: authorization source and pass conditions 1–9

Downstream dependents:
- dep: none declared in current roadmap — Candidate D is the final post-W7 structural candidate
  - note: post-W10 wave planning is out of scope for this packet; any future wave requires a separate GC-018

W7 chain impact assessment:
- chain link: Runtime
  - impact: READ_ONLY
  - justification: task marketplace reads runtime execution metadata (capacity, active pipeline IDs) to inform allocation decisions; runtime contracts are not modified
- chain link: Artifact
  - impact: ADDITIVE
  - justification: reputation signal and task allocation records are new artifact types in LPF; delivered CPF/LPF artifact contracts are not restructured
- chain link: Trace
  - impact: READ_ONLY
  - justification: reputation scoring may read trace signals to build agent performance history; trace contracts are not modified
- chain link: Planner
  - impact: READ_ONLY
  - justification: task marketplace reads planner context to understand task complexity; planner contracts are not modified
- chain link: Decision
  - impact: ADDITIVE
  - justification: reputation scores become a new upstream input into decision-plane signal routing; no existing decision contracts are modified; new input surface only
- chain link: Eval/Builder
  - impact: READ_ONLY
  - justification: EvaluationEngine and TruthScore outputs are consumed as read-only inputs for reputation scoring; no evaluation or builder contracts modified
- chain link: Memory
  - impact: READ_ONLY
  - justification: memory contracts are not in scope; agent memory state may be a read-only input for reputation signals but no memory contracts are modified

Non-destabilization posture:
- rollback strategy: reputation signal and task marketplace contracts are additive; removing them restores pre-W10-T1 state without breaking v3.0-W7T10, W8-T1, W8-T2, or W9-T1 closed deliverables
- destabilization threshold: ACCEPTABLE — READ_ONLY and ADDITIVE impacts only; no STRUCTURAL impacts on W7 chain
- if UNACCEPTABLE (trigger): if any W7 chain link shows STRUCTURAL impact during execution, escalate immediately and suspend W10-T1

---

## Gateway Contract Declaration (gate G7 — inherited, no new gateway scope)

W10-T1 is a learning-plane expansion and does not introduce new AI Gateway / Knowledge Layer contract scope. All gateway surfaces are inherited as FIXED INPUT from W8-T1:

- surface: model-gateway execution authority scope
  - declaration: FIXED INPUT — frozen by W8-T1; W10-T1 does not modify it
- surface: trust boundary between AI Gateway authority and Knowledge Layer query contracts
  - declaration: FIXED INPUT — declared by W8-T1; W10-T1 does not re-open it
- surface: isolation contracts between gateway and downstream consumers
  - declaration: FIXED INPUT — declared by W8-T1; W10-T1 inherits the same discipline

No new gateway-facing surfaces are added by W10-T1. Task marketplace routing operates within the learning plane only.

---

## Pass Conditions Compliance (from decision pack)

| Condition | Status | Notes |
|---|---|---|
| 1 — no omnibus wave; one family per GC-018 | SATISFIED | this packet covers Candidate D only |
| 2 — W7 schema impact assessment | SATISFIED | all 7 chain links assessed above |
| 3 — Agent Definition excluded unless blocking dep proven | SATISFIED | excluded in Not In This Wave |
| 4 — AI Gateway contract surfaces frozen or justified | SATISFIED | all gateway surfaces declared FIXED INPUT (inherited from W8-T1) |
| 5 — (Candidate B only) gateway stability declared | N/A | Candidate D is learning-plane; no new gateway scope |
| 6 — (Candidate C only) no performance numbers as baseline | N/A — but noted | benchmark numbers remain PROPOSAL ONLY in W10-T1 per Not In This Wave |
| 7 — keep/retire/merge-into ownership map included | SATISFIED | Ownership Map above |
| 8 — (Candidate D) remains downstream of first structural family and performance baseline | SATISFIED | W8-T1 (P3) CLOSED DELIVERED; W8-T2 (P2) CLOSED DELIVERED; W9-T1 (P4) CLOSED DELIVERED; all upstream families closed |
| 9 — next decision cycle within 7 calendar days | SATISFIED | W9-T1 CLOSED 2026-03-29; this packet issued same day |
