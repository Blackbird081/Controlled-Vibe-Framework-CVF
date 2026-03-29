# CVF GC-018 Continuation Candidate — W8-T2: Performance Benchmark Harness and Acceptance-Policy Baseline

Memory class: FULL_RECORD

> Date: 2026-03-29
> Wave: W8 — Tranche: T2
> Role: parallel prerequisite workstream alongside W8-T1
> Decision baseline: `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_POST_W7_OPEN_TARGETS_2026-03-28.md`
> Planning baseline: `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`
> Checklist used: `docs/reference/CVF_POST_W7_GC018_DRAFTING_CHECKLIST.md`

---

## GC-018 Continuation Candidate

- Candidate ID: `W8-T2-CANDIDATE-C`
- Date: `2026-03-29`
- Parent roadmap / wave: `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`
- Proposed scope: instrumentation-only performance benchmark harness + acceptance-policy baseline — parallel prerequisite workstream; does NOT claim performance targets as current baseline truth
- Continuation class: VALIDATION_TEST
- Why now: canonical decision pack designates Candidate C as a parallel prerequisite workstream that may run alongside W8-T1; without a measurement harness and acceptance policy, all performance claims in the whitepaper remain PROPOSAL ONLY and no future wave can promote performance numbers to baseline truth
- Active-path impact: `NONE` — instrumentation-only; no restructuring of existing contracts or governance authority
- Risk if deferred: performance claims remain permanently unverifiable; Candidate B and later waves cannot establish performance baseline; acceptance policy cannot be enforced by CI
- Lateral alternative considered: YES
- Why not lateral shift: no lateral alternative exists for establishing measurement truth; manually asserting performance numbers without a harness is the exact failure mode this workstream prevents
- Real decision boundary improved: YES
- Boundary improvement note: acceptance-policy baseline is a real decision boundary because acceptable performance is declared by policy rather than left implicit
- Expected enforcement class: `CI_REPO_GATE` | `GOVERNANCE_DECISION_GATE`
- Required evidence if approved:
  - representative execution paths defined
  - instrumentation hooks committed (additive only — no contract restructuring)
  - benchmark harness running against real execution paths
  - acceptance-policy baseline document
  - first governed evidence batch with harness-derived provenance (`reportId`, `reportHash`, `runId`, `measurementId`, `traceId`, numeric `value`)
  - explicit statement that whitepaper performance numbers remain PROPOSAL ONLY until this workstream closes

---

## Depth Audit

- Risk reduction: `1` — medium; without measurement harness, performance risk is unquantifiable; harness existence reduces but does not eliminate performance risk
- Decision value: `1` — acceptance-policy baseline is a real decision boundary but indirect (enables rather than makes the architectural decision)
- Machine enforceability: `2` — instrumentation hooks and benchmark harness are fully machine-checkable; CI gate on acceptance policy is straightforward
- Operational efficiency: `2` — measurement harness directly enables faster performance decision cycles across all future waves
- Portfolio priority: `1` — parallel prerequisite, not the first structural family
- Total: `7`
- Decision: CONTINUE
- Reason: no zero in critical dimensions (Risk reduction = 1, Decision value = 1, Machine enforceability = 2); lateral alternative recorded; real decision boundary improved (acceptance policy); VALIDATION_TEST class continuation justified

---

## Authorization Boundary

- Authorized now: YES
- Next batch name: `W8-T2 — Performance Benchmark Harness and Acceptance-Policy Baseline`
- Reopen trigger: N/A

---

## Ownership Map

- surface: performance benchmark harness
  - current owner: none — does not exist yet
  - action: `create` — new instrumentation-only artifact; additive to existing contract surfaces
  - target owner: Cross-plane architecture / governance performance owners (W8-T2 packet)

- surface: acceptance-policy baseline
  - current owner: none — performance acceptance policy is currently undeclared
  - action: `create` — new governance artifact; declares acceptable performance thresholds as PROPOSAL ONLY until benchmark evidence exists
  - target owner: W8-T2 packet

- surface: whitepaper performance numbers (latency / throughput table)
  - action: `keep` — remain PROPOSAL ONLY; this wave provides first evidence batch but does not promote numbers to baseline truth by itself
  - condition: promotion to baseline truth requires explicit GC-026 tracker sync with benchmark evidence attached

- surface: existing contract schemas and runtime contracts
  - action: `keep` — instrumentation hooks are additive; no structural modification to existing contracts

---

## Not In This Wave

- item: promoting whitepaper performance numbers to current baseline truth
  - reason: hard boundary — this wave provides instrumentation and first evidence batch only; numbers stay PROPOSAL ONLY (pass condition 6)
- item: Candidate A trust/isolation boundary work
  - reason: Candidate A scope; W8-T1 handles this in parallel
- item: Candidate B RAG / Context Engine convergence
  - reason: downstream; depends on W8-T1 gateway stability output
- item: Candidate D reputation / marketplace expansion
  - reason: HOLD — later wave only
- item: L0–L4 risk-model migration
  - reason: out of scope
- item: Agent Definition merge work
  - reason: excluded unless blocking dependency proven
- item: any structural modification to existing runtime, artifact, or planner contracts
  - reason: instrumentation-only; additive hooks only

Exclusion enforcement: reviewer must confirm that no performance numbers are labeled as current truth and no contract is structurally modified before authorizing any CP execution.

---

## Dependency Declaration

- wave: W8-T2
- family: Candidate C (parallel prerequisite)

Upstream dependencies:
- dep: W7-T10 governance integration chain
  - status: FIXED
  - consumed as: architecture baseline v3.0-W7T10 — representative execution paths are derived from this baseline
- dep: POST_W7_OPEN_TARGETS_DECISION_PACK_2026-03-28
  - status: FIXED
  - consumed as: authorization source confirming Candidate C is parallel-capable with W8-T1

Downstream dependents:
- dep: Candidate B — RAG + Context Engine convergence
  - dependency type: MEASUREMENT_BASELINE — Candidate B's context packaging performance claims require evidence from this workstream
  - blocked until: W8-T2 delivers first acceptance-policy baseline and instrumentation evidence
- dep: Candidate D — Reputation / Marketplace expansion
  - dependency type: PERFORMANCE_EVIDENCE
  - blocked until: W8-T2 performance baseline is in motion or closed

W7 chain impact assessment:
- chain link: Runtime
  - impact: ADDITIVE
  - justification: instrumentation hooks are added to representative runtime execution paths; existing runtime contracts are not restructured
- chain link: Artifact
  - impact: READ_ONLY
  - justification: artifact staging is read to identify representative paths; no structural modification
- chain link: Trace
  - impact: ADDITIVE
  - justification: trace-backed evidence collection is the core output of this workstream; trace capture hooks are additive
- chain link: Planner
  - impact: NONE
  - justification: planner contracts are not in scope for instrumentation-only workstream
- chain link: Decision
  - impact: NONE
  - justification: decision contracts are not modified
- chain link: Eval/Builder
  - impact: READ_ONLY
  - justification: eval paths are read to define representative execution paths for benchmarking
- chain link: Memory
  - impact: NONE
  - justification: memory contracts are not in scope

Non-destabilization posture:
- rollback strategy: instrumentation hooks are isolated and removable without affecting base contract behavior; acceptance-policy document is governance-only and does not affect runtime
- destabilization threshold: ACCEPTABLE — ADDITIVE and READ_ONLY impacts only

---

## Performance Constraint (gate G6)

- whitepaper latency / throughput numbers: `PROPOSAL ONLY` — remain unverified until this workstream delivers trace-backed evidence
- acceptance-policy baseline: declares thresholds as TARGET, not as current truth
- evidence gate: CI gate on acceptance policy is active only after first benchmark run produces trace-backed evidence
- this packet does NOT authorize promoting any performance number to baseline truth

---

## Pass Conditions Compliance (from decision pack)

| Condition | Status | Notes |
|---|---|---|
| 1 — no omnibus wave; one family per GC-018 | SATISFIED | this packet covers Candidate C only |
| 2 — W7 schema impact assessment | SATISFIED | all 7 chain links assessed above |
| 3 — Agent Definition excluded | SATISFIED | excluded in Not In This Wave |
| 4 — (Candidate A) gateway surfaces frozen or justified | N/A | Candidate A handles this in W8-T1 |
| 5 — (Candidate B) gateway stability declared | N/A | Candidate B is downstream |
| 6 — no performance numbers as baseline truth | SATISFIED | hard boundary declared above; numbers stay PROPOSAL ONLY |
| 7 — keep/retire/merge-into ownership map included | SATISFIED | Ownership Map above |
| 8 — L0–L4 migration out of scope | SATISFIED | excluded in Not In This Wave |
| 9 — next decision cycle within 7 calendar days | SATISFIED | this packet issued 2026-03-29 |
