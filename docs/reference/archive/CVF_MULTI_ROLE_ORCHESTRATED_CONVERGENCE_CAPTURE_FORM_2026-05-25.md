# CVF Multi-Role Orchestrated Convergence Capture Form

Memory class: TEMPLATE_RECORD

docType: reference

Date: 2026-05-25

Status: CANONICAL_TEMPLATE

Companion to:

- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/reference/CVF_AGENT_ROLE_ASSIGNMENT_MATRIX_2026-05-19.md`
- `docs/reference/CVF_AGENT_DELEGATION_AND_SUBAGENT_BOUNDARY_STANDARD_2026-05-19.md`
- `docs/reference/CVF_VIBE_TO_SPEC_CONVERSATION_CAPTURE_FORM_2026-05-25.md`

---

## Purpose

Standardize how CVF captures internal agent, role, worker, reviewer, auditor,
and orchestrator convergence before implementation begins.

This form exists because a two-agent rebuttal pattern is too narrow for CVF's
actual architecture. CVF's intended operating model is:

```text
Operator / CEO intent
  -> Orchestrator decomposes and assigns bounded role lanes
  -> Role agents or subagents work independently within scope
  -> Reviewers and auditors challenge evidence and claims
  -> Integrator resolves dispositions
  -> Operator receives the final delivery packet
```

The form controls the process without claiming a live autonomous subagent
runtime. It is a governed operating protocol and evidence template.

## Scope / Target / Owner Boundary

Owner: CVF orchestration, role assignment, delegation, and convergence surface.

In scope:

- multi-role or N-agent architecture convergence;
- disputed roadmap, implementation, claim, or product-scope decisions;
- orchestrator-to-worker assignment capture;
- independent role outputs and evidence ledgers;
- rebuttal, disposition, integration, and operator delivery capture.

Out of scope:

- runtime scheduler implementation;
- live subagent isolation;
- autonomous worker pools;
- provider prompt reinjection;
- deployment authority;
- treating role templates as independent governance authority.

This form does not replace Agent Work Orders, GC-018, GC-020 handoff, review
packets, or completion packets. It connects them when multiple roles must
converge before execution.

## When To Use This Form

Use this form when any condition applies:

- more than one role lane must evaluate a decision;
- an architecture proposal receives a material rebuttal;
- implementation scope could widen or cross owner surfaces;
- a roadmap may be superseded by later reasoning;
- a worker/subagent output needs integration before operator delivery;
- a claim is important enough that adversarial review is required;
- simulated multi-role execution happens inside one agent session and must be
  auditable.

Do not use this form for:

- trivial one-agent answers;
- single-file mechanical fixes with no disputed scope;
- pure implementation after a work order is already accepted;
- runtime user Vibe-to-Spec conversations. Use
  `CVF_VIBE_TO_SPEC_CONVERSATION_CAPTURE_FORM_2026-05-25.md` for that surface.

## Role Model

The form supports N roles. Not every role is required every time.

| Role | Function | Required when |
| --- | --- | --- |
| Operator / CEO | Sets business intent, accepts final packet, grants waivers | any external authority, scope expansion, or public claim |
| Orchestrator | Decomposes work, assigns lanes, owns stop conditions | any multi-role or delegated flow |
| Planner | Breaks work into dependency-aware steps | complex or sequenced scope |
| Worker / Implementer | Produces scoped output, patch, audit, or analysis | execution or source review is needed |
| Specialist Subagent | Handles bounded specialist lane | domain/tool boundary justifies delegation |
| Reviewer | Challenges correctness, risk, and evidence | contested scope or closure claim |
| Auditor / Governance | Checks protocol, evidence, taxonomy, and live-proof rules | governance, proof, public, or handoff surfaces |
| Integrator | Resolves role outputs into a convergence statement | two or more role outputs must be reconciled |

One human or model may wear multiple roles only if the artifact declares this
explicitly and records how conflict of interest was controlled.

## Core Control Rules

1. Delegation transfers execution, not authority.
2. Every active role must have bounded scope and expected output.
3. Role outputs are candidate evidence until reviewed or integrated.
4. Disagreement must be captured as findings with evidence, not as preference.
5. The integrator must record accept, reject, defer, or unresolved disposition
   for each material role finding.
6. Operator delivery is the final packet, not the raw internal debate.
7. No implementation may begin from a convergence packet unless the required
   roadmap, GC-018, and work order gates are satisfied.
8. Surface identity must be verified before role evaluation begins. If the
   operator verdict refers to a different artifact than the convergence target,
   the loop stops and the target must be corrected.

## Form Structure

Copy and complete the structure below for a multi-role convergence event.

```text
# CVF Multi-Role Orchestrated Convergence - <Topic>

Memory class: REVIEW_RESULT_RECORD

docType: review

Date: <YYYY-MM-DD>

Status: <DRAFT | IN_REVIEW | CONVERGED | HOLD | REJECTED>

## 0. Surface Fidelity Gate

Before any agent role evaluates the artifact, all participants confirm:

- Source code path that generates the artifact under review:
- Output file path or response field where the artifact appears:
- Audience the artifact serves:
  - [ ] Non-coder reading directly
  - [ ] External agent receiving copy-paste from non-coder
  - [ ] CVF-aware agent consuming structured response
  - [ ] Auditor reviewing evidence
  - [ ] Other:
- Language layer the artifact belongs to:
  - [ ] Layer 1 UI Shell (i18n catalog, user toggle)
  - [ ] Layer 2 Guided Wizard (per-workflow presentation catalog)
  - [ ] Layer 3 User Chat + Agent Response (matched per request)
  - [ ] Layer 4 Engine Room (always-English invariant)
- Generation trigger (user action that creates the artifact):
- Operator verdict, if any, explicitly references this same artifact:
  - [ ] Yes — verdict path:
  - [ ] No — verdict refers to different artifact:

If any field is unknown, convergence pauses until source inspection verifies
the field. Do not proceed with assumed surface identity.

## 1. Trigger

- Operator instruction:
- Proposal or roadmap under review:
- Reason convergence is required:
- Risk if implementation proceeds without convergence:

## 2. Authority Chain

- Active session state:
- Active handoff:
- Predecessor docs:
- Relevant standards:
- GC-018 requirement:

## 3. Role Assignment

| Role | Actor | Scope | Allowed outputs | Forbidden actions |
| --- | --- | --- | --- | --- |
| Orchestrator | | | | |
| Worker / Proposer | | | | |
| Reviewer / Rebutter | | | | |
| Auditor | | | | |
| Integrator | | | | |
| Operator | | final delivery only | accept / hold / reject | perform agent audit |

Conflict note:
<state whether one actor holds multiple roles and how conflict is controlled>

## 4. Source-Fidelity Block

- Existing paths verified:
- Planned new paths clearly marked as NEW:
- Claimed symbols, types, catalogs, or role values verified from:
- Missing or ambiguous source fact:

## 5. Independent Role Outputs

### Role Output <N>: <role name>

- Output artifact:
- Main claim:
- Evidence:
- Risk identified:
- Recommended disposition:

Repeat for each role.

## 6. Disagreement Ledger

| Issue | Position A | Position B / C / N | Evidence | Integrator disposition |
| --- | --- | --- | --- | --- |
| | | | | `ACCEPT_A` / `ACCEPT_B` / `MERGE` / `DEFER` / `UNRESOLVED` |

## 7. Convergence Statement

Numbered decisions:

1. <decision>
2. <decision>
3. <decision>

Rejected options:

- <option>: <reason>

Deferred options:

- <option>: <future gate or tranche>

Unresolved items:

- <item or "none">

## 8. Operator Delivery Packet

Operator-facing summary:

- Decision:
- Required correction before implementation:
- Recommended next governed move:
- What the operator must decide:

Operator choices:

- `ACCEPT`: authorize the next non-implementation step named here.
- `HOLD`: return with a specific objection.
- `REJECT`: reject with reason and restart convergence.

## 9. Downstream Dispatch Rules

- Roadmap action:
- Work order action:
- GC-018 action:
- Live-proof requirement:
- Handoff action:

## 10. Claim Boundary

This convergence packet does not claim:

- implementation;
- live runtime enforcement;
- live subagent isolation;
- product readiness;
- public readiness;
- test or proof completion unless evidence is listed above.
```

## Required Evidence Trace Block

Every material claim must include:

```text
- Claim:
- Command or source read:
- Result:
- Key path:
- Verdict:
- Counter-evidence:
```

When a claim is based on reasoning rather than command evidence, mark it as
`INFERENCE` and cite the source facts used.

## Operator Interface Rule

The operator is not expected to perform internal audit work. The operator
receives the integrated packet and responds at the decision level:

- `ACCEPT`
- `HOLD with specific objection`
- `REJECT with reason`

The operator may add product insight, but agent roles remain responsible for
turning that insight into evidence, roadmap, work order, or implementation
scope.

## Relationship To Vibe-to-Spec

`CVF_VIBE_TO_SPEC_CONVERSATION_CAPTURE_FORM_2026-05-25.md` governs
user-to-agent intent refinement toward a Spec.

This form governs agent-internal convergence after intent, scope, or evidence
becomes contested.

They are parallel patterns:

| Surface | Primary participant | Goal | Output |
| --- | --- | --- | --- |
| Vibe-to-Spec | non-coder user + CVF agent | turn intent into frozen Spec | user-approved Spec |
| Multi-role convergence | orchestrator + N roles | turn contested reasoning into decision | convergence packet |

## Enforcement / Verification

This form is enforced procedurally through:

- Agent Work Orders;
- GC-018 baselines;
- review packets;
- completion packets;
- active handoff sync;
- markdown structural checks;
- public/provenance boundary checks when public claims are involved.

It does not technically enforce runtime identity, role separation, or live
subagent isolation.

## Anti-Patterns

Do not:

1. Collapse N-role convergence into a two-agent-only pattern.
2. Let the orchestrator silently execute specialist work without recording the
   exception.
3. Treat simulated roles inside one model as independent agents without saying
   so.
4. Present raw debate to the operator as if it were a final packet.
5. Allow implementation to begin from unresolved disagreement.
6. Use reviewer silence as approval without an explicit operator waiver.
7. Let any worker write durable truth memory without a memory authority record.

## Related Artifacts

- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/reference/CVF_AGENT_ROLE_ASSIGNMENT_MATRIX_2026-05-19.md`
- `docs/reference/CVF_AGENT_DELEGATION_AND_SUBAGENT_BOUNDARY_STANDARD_2026-05-19.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
- `docs/reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`
- `docs/reference/CVF_VIBE_TO_SPEC_CONVERSATION_CAPTURE_FORM_2026-05-25.md`

## Claim Boundary

This is a template and governance protocol. It does not claim:

- runtime multi-agent scheduling;
- live subagent isolation;
- automated role routing;
- autonomous worker pools;
- implementation of any specific convergence;
- VI5 implementation readiness;
- production readiness.

Any runtime implementation of role orchestration, subagent dispatch,
delegation receipts, or scheduler behavior requires a fresh scoped roadmap,
GC-018, tests, and live proof when governance behavior is claimed.
