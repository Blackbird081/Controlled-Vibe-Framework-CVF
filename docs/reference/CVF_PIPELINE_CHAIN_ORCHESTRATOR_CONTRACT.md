# CVF Pipeline Chain Orchestrator Contract

Memory class: FULL_RECORD

Status: ACTIVE

docType: contract

Date: 2026-05-29

Contract version: `cvf.pipelineChainOrchestrator.el1.v1`

---

## Purpose

Define the canonical CVF Pipeline Chain Orchestrator contract: a governed
5-stage sequential dispatch (Intake Gate → Orchestrator → Worker Draft/Execute
→ Reviewer → Closure Gate) with MA1-compatible handoff, receipt at each stage,
and explicit human-intervention escalation.

This contract formalizes the CVF 28.05 prototype pipeline (`cvf_cli.py`
lines 56–166) into a governed, source-verified, MA1-compatible interface.

## Scope / Applies To

Applies to: CVF pipeline orchestration surface. Target: contract definition
and TypeScript interface only. No runtime provider call logic is implemented
in this contract.

## S1 — Purpose and Claim Boundary

### Purpose

CVF has 5+ governance surfaces: Intake Gate (policy check, risk level, Guard
Contract scan), Orchestrator (work order decomposition), Worker Draft/Execute,
Reviewer (quality gate), and Closure Gate (evidence receipt). These surfaces
are individually defined but no contract chains them into a sequential dispatch
with governed handoff and receipt at each stage.

This contract defines the canonical 5-stage pipeline and mandates MA1-compatible
transfer packets and governance receipts at each boundary.

This contract closes CVF 28.05 Gap D: the pipeline stages are defined in
`cvf_cli.py` prototype but not normatively governed.

### Claim Boundary

This contract is a documentation and TypeScript interface artifact. It does not
implement or execute provider calls, does not spawn subagents, does not mutate
runtime provider routing, and does not claim autonomous pipeline execution.

`runtimeExecutionAuthorized=false`

---

## S2 — Five-Stage Pipeline Definition

### Stage Map

| Stage | Order | MA1 Role | Input | Output | Receipt Required |
| --- | --- | --- | --- | --- | --- |
| `intake_gate` | 1 | Orchestrator | `operatorPrompt: string` | `IntakeResult` | `intakeReceipt` |
| `orchestrator` | 2 | Orchestrator | `IntakeResult` | `WorkOrder[]` | `orchestrationReceipt` |
| `worker` | 3 | Implementer | `WorkOrder` | `WorkerDraftResult` + `WorkerExecutionResult` | `workerReceipt` |
| `reviewer` | 4 | Reviewer | `WorkerExecutionResult` | `ReviewerDecision` | `reviewReceipt` |
| `closure_gate` | 5 | Auditor | `ReviewerDecision` | `ClosureResult` | `closureReceipt` |

### Stage 1 — Intake Gate

**MA1 role:** Orchestrator
**Input:** `operatorPrompt: string` — raw operator request
**Processing:**
- Policy check: scan for prohibited content (security, DLP, risk)
- Risk level assignment: `R0` / `R1` / `R2` / `R3`
- Guard Contract scan: verify structural completeness
- Model tier advisory reference: consult LHW12-T1 `modelTierAdvisoryType` for
  initial model assignment recommendation
**Output:** `IntakeResult { approved: boolean; riskLevel: RiskLevel; modelTierAdvisory?: modelTierAdvisoryType; guardContractResult: string }`
**Receipt:** `intakeReceipt` — governance evidence receipt with intake decision
**Failure path:** `IntakePolicyViolation` if policy/security check fails → stop pipeline, emit denial receipt

### Stage 2 — Orchestrator

**MA1 role:** Orchestrator
**Input:** `IntakeResult`
**Processing:**
- Decompose operator intent into one or more `WorkOrder` objects
- Assign worker scope based on LHW12-T3 `workerLifecycleAdvisoryType` and
  `spawnAuthorizationAdvisory`
- Confirm budget tier against CB1 constraints
**Output:** `WorkOrder[] { id: string; task: string; scope: string; assignedRole: CVFRole }[]`
**Receipt:** `orchestrationReceipt` — work order list with decomposition trace
**Failure path:** if no valid work orders produced → return to Intake Gate for clarification

### Stage 3 — Worker (Draft / Execute)

**MA1 role:** Implementer
**Input:** `WorkOrder`
**Processing:**
- Sub-stage A: Draft — read codebase, generate draft output
- Sub-stage B: Execute — run terminal commands, compile, test
- Worker timeout detection: if execution exceeds configured timeout →
  `WorkerTimeoutException` (see EL-2 contract)
- Worker lifecycle boundary: respect `workerLifecycleAdvisoryType.lifecyclePhase`
  and `spawnAuthorizationAdvisory`
**Output:** `WorkerDraftResult { draftContent: string }` + `WorkerExecutionResult { success: boolean; output: string; diagnostic?: ExecutionDiagnostic }`
**Receipt:** `workerReceipt` — combined draft + execution evidence
**Failure path:** `WorkerTimeoutException` → EL-2 handler; re-dispatch to fresh worker context (max 2 retries)

### Stage 4 — Reviewer

**MA1 role:** Reviewer
**Input:** `WorkerExecutionResult` + `WorkerDraftResult`
**Processing:**
- Review output quality against acceptance criteria
- Check for logic errors, structural issues, coverage gaps
- Decision: `APPROVE` / `REJECT` / `HOLD`
- Retry counter: after 3 `REJECT` decisions → `ReviewDeadlockException` (see EL-3)
**Output:** `ReviewerDecision { decision: 'APPROVE' | 'REJECT' | 'HOLD'; feedback?: string; retryCount: number }`
**Receipt:** `reviewReceipt` — reviewer verdict with retry count
**Failure path:** `ReviewDeadlockException` after 3 rejections → escalate to Orchestrator
  for micro-task decomposition or model tier upgrade

### Stage 5 — Closure Gate

**MA1 role:** Auditor
**Input:** `ReviewerDecision` + all prior receipts
**Processing:**
- Aggregate all stage receipts into final evidence packet
- Emit `GovernanceEvidenceReceipt` with chain trace
- Freeze execution record
**Output:** `ClosureResult { evidenceReceiptId: string; chainComplete: boolean; allStagesPass: boolean }`
**Receipt:** `closureReceipt` — final governance evidence receipt

---

## S3 — State Handoff Between Stages

### MA1 Transfer Packet Fields

Each stage handoff must include these MA1-compatible fields:

| Handoff field | Intake→Orch | Orch→Worker | Worker→Reviewer | Reviewer→Closure |
| --- | --- | --- | --- | --- |
| `operatorPrompt` | R | O | N | N |
| `riskLevel` | R | R | R | R |
| `workOrders` | N | R | R | R |
| `workerReceipt` | N | N | R | R |
| `reviewerDecision` | N | N | N | R |
| `intakeReceipt` | R | R | R | R |
| `closureReceipt` | N | N | N | R |
| `modelTierAdvisory` | O | R | R | R |
| `workerLifecycleAdvisory` | N | R | R | R |

R = Required, O = Optional, N = Not applicable

### MA1 Section Mapping

Each stage handoff must follow MA1 packet structure:
- `## 0. Surface Fidelity Gate` — verify stage surface before handoff
- `## 1. Authority Chain` — cite pipeline stage + receipt from prior stage
- `## 4. Role Assignment` — assign role for next stage
- `## 8. Integration Decision` — current stage disposition before handoff

---

## S4 — Escalation Signals

### HumanInterventionRequired

The pipeline emits `HumanInterventionRequired` when:
1. Intake Gate blocks with `policy_blocked` diagnostic and risk level ≥ R2
2. Worker timeout retry counter exhausts (2 max retries) → stop, do not re-dispatch
3. Reviewer deadlock counter exceeds threshold (3 rejections) AND micro-task decomposition also fails
4. Closure Gate detects incomplete receipt chain (missing stage receipt)

### Escalation payload (MA1-compatible):
```text
Stage: <current stage>
Reason: <policy_blocked | worker_timeout_exhausted | reviewer_deadlock_unresolved | incomplete_receipt_chain>
Last receipt ID: <receiptId>
Recommended operator action: <action from diagnostic userAction>
```

---

## S5 — Diagnostic Class Bindings

Pipeline stages bind to V3 `ExecutionDiagnosticClass` values:

| Stage | Diagnostic class | Trigger |
| --- | --- | --- |
| `intake_gate` | `policy_blocked` | security/DLP violation |
| `intake_gate` | `invalid_input` | malformed prompt |
| `worker` | `provider_timeout` | execution timeout (EL-2) |
| `worker` | `worker_timeout` | worker unresponsive (EL-2) |
| `reviewer` | `review_deadlock` | 3+ rejections (EL-3) |
| `reviewer` | `review_deadlock_decomposed` | decomposition after deadlock (EL-3) |
| `closure_gate` | `receipt_missing` | incomplete receipt chain |

New diagnostic classes `worker_timeout`, `review_deadlock`, and
`review_deadlock_decomposed` are defined in EL-2 and EL-3 respectively.

---

## S6 — Runtime Boundary

| Binding | Status |
| --- | --- |
| Pipeline 5-stage contract | DOC_ONLY — this contract is normative |
| MA1 handoff between stages | DOC_ONLY — referenced, not enforced |
| Receipt per stage | DOC_ONLY — receipt schema exists; pipeline binding is contract only |
| WorkerTimeout handler | DEFERRED to EL-2 |
| ReviewDeadlock handler | DEFERRED to EL-3 |
| Model tier advisory reference | DOC_ONLY — LHW12-T1 `modelTierAdvisoryType` |
| Worker lifecycle reference | DOC_ONLY — LHW12-T3 `workerLifecycleAdvisoryType` |

This contract does not implement runtime pipeline execution, autonomous agent
spawning, provider call logic, or receipt envelope extensions.

## Claim Boundary

This contract is a documentation and TypeScript interface artifact. It does not
claim autonomous pipeline execution, new provider semantics, new receipt envelope
schema, hosted readiness, production readiness, or public release readiness.
