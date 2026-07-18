# CVF Finding To Governance Learning Trigger Standard

Memory class: POINTER_RECORD

Status: canonical and machine-enforced standard for turning findings into
governance/control-plane or runtime-learning follow-up.

## Purpose

This standard removes the human-reminder dependency from CVF learning loops.
When an agent, reviewer, operator, or log records material findings, the same
artifact must classify whether each finding is already covered, needs a written
rule, needs a machine gate, needs earlier phase placement, or belongs in
runtime/data-learning follow-up.

## Scope

This applies to new or changed CVF logs, reviews, assessments, and audits that
record findings, known issues, defects, quality findings, or post-run problems.

It applies to governance/control-plane learning and to runtime/data-learning
candidate routing. It does not authorize automatic runtime behavior changes,
provider prompt changes, memory reinjection, model tuning, or public claims.

Runtime/provider/cost learning candidates should be normalized through the
Learning Signal Intake Bridge before any follow-up roadmap claims a Learning
Plane route.

## Owner Surface

Owner surface: CVF governance control chain, Learning Plane candidate routing,
agent autorun workflow, reviewer closeout, and operational session logs.

## Protocol

Any applicable artifact that contains a finding section must include:

- `## Finding-To-Governance Learning Disposition`
- a row or paragraph for each material finding;
- defect class;
- learning lane;
- disposition;
- next control action;
- whether the finding was handled in this batch or deferred.

Generalizable finding promotion:

- if a finding describes a repeated, future-agent, reusable, systemic,
  rule/template, guard, phase-gate, orchestration, or machine-check failure, it
  must be promoted into a reusable CVF control;
- acceptable promotions are `RULE_EXISTS`, `RULE_ADDED`, `TEMPLATE_UPDATED`,
  `STANDARD_UPDATED`, `STANDARD_ADDED`, `MACHINE_CHECK_ADDED`,
  `MACHINE_CHECK_CANDIDATE`, `PHASE_GATE_PLACEMENT_GAP`, or
  `DESIGN_REVIEW_REQUIRED`;
- `N/A_WITH_REASON` is allowed only when the artifact explains why the finding
  is not generalizable or why promotion would be unsafe/out of scope;
- do not leave a reusable finding as documentation-only worker commentary.

Minimum learning lanes:

- `GOVERNANCE_CONTROL_PLANE`
- `RUNTIME_BEHAVIOR_LEARNING`
- `PROVIDER_OUTPUT_LEARNING`
- `COST_ECONOMICS_LEARNING`
- `DOCUMENTATION_ONLY_LEARNING`

Minimum disposition values:

- `RULE_EXISTS`
- `RULE_ADDED`
- `MACHINE_CHECK_ADDED`
- `MACHINE_CHECK_CANDIDATE`
- `TEMPLATE_UPDATED`
- `STANDARD_UPDATED`
- `STANDARD_ADDED`
- `PHASE_GATE_PLACEMENT_GAP`
- `DESIGN_REVIEW_REQUIRED`
- `RUNTIME_LEARNING_CANDIDATE`
- `N/A_WITH_REASON`

Minimum defect classes:

- `WORKER_EXECUTION_ERROR`
- `ORCHESTRATOR_PACKET_GAP`
- `RULE_GAP`
- `MACHINE_GATE_GAP`
- `PHASE_GATE_PLACEMENT_GAP`
- `OPERATOR_SCOPE_CLARITY_GAP`
- `RUNTIME_SIGNAL_GAP`

## Enforcement

The mandatory guard is:

```powershell
python governance/compat/check_finding_to_governance_learning.py --base <baseHead> --head HEAD --enforce
```

The guard runs in the autorun workflow and local governance hook chain. It
fails applicable changed logs/reviews/assessments/audits when findings are
present without learning disposition.

Archive-qualified artifacts under `archive/` are excluded from this guard.
Moving historical files into archive is preservation, not a new finding-bearing
closure claim. If archived evidence is promoted back to active status or used
as current closure evidence, the active artifact must satisfy this standard.

## Boundaries

This standard forces routing and disposition. It does not decide that every
finding must become a machine check. Some findings are design-review items, some
belong in runtime/data learning, and some are out of scope with an explicit
reason.

## Failure Modes

Closure is blocked when:

- a changed applicable artifact contains `Findings`, `Quality Findings`,
  `Known Issues`, or a finding table without a learning disposition section;
- the disposition section lacks defect class, lane, disposition, or next action;
- runtime/provider/cost findings are treated as governance-rule-only fixes when
  the artifact itself says the issue comes from runtime behavior, provider
  output, or cost evidence;
- a finding closes as worker blame without saying whether CVF rule/gate/phase
  placement also failed.
- a repeated, future-agent, reusable, systemic, rule/template, guard,
  phase-gate, orchestration, or machine-check finding is not promoted to a
  reusable CVF control or explicitly closed with `N/A_WITH_REASON`.

## Related Artifacts

- `docs/reference/CVF_AGENT_ERROR_TO_GOVERNANCE_LEARNING_PHILOSOPHY_2026-05-28.md`
- `docs/reference/CVF_IDE_EXTENSION_MULTI_PROVIDER_EXECUTION_LOG_STANDARD_2026-05-29.md`
- `docs/reference/CVF_LEARNING_SIGNAL_INTAKE_BRIDGE_STANDARD_2026-05-29.md`
- `docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md`
- `governance/compat/check_finding_to_governance_learning.py`
- `governance/compat/run_agent_autorun_workflow_gate.py`
- `governance/compat/run_local_governance_hook_chain.py`

## Claim Boundary

This is a governance-learning trigger standard. It makes findings actionable and
machine-visible; it does not prove that runtime learning, model learning, or
provider behavior changed.
