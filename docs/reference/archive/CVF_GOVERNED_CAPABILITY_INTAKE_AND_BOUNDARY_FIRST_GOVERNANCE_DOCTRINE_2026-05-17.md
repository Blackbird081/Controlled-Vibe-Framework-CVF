# CVF Governed Capability Intake And Boundary-First Governance Doctrine

Memory class: POINTER_RECORD

Document type: CANONICAL - CVF-NATIVE DOCTRINE

Status: official doc-only promotion from CVF ADD Phase A and the
2026-05-17 Claude-Codex unabsorbed-knowledge consensus.

## Purpose

This doctrine defines how CVF decides whether a new capability may enter the
framework, how agents should act inside approved boundaries, and how work
briefs should be normalized before design or implementation authority is used.

It consolidates three consensus items:

- ADD-A: Governed Capability Intake;
- ADD-D: Boundary-First Governance;
- ADD-BRIEF: Brief Normalization.

This document is doctrine only. It does not implement runtime behavior, change
provider routing, alter release gates, or authorize public claims.

## Scope

This doctrine applies when CVF evaluates:

- external tools, CLIs, provider utilities, and MCP-style capabilities;
- skills, generated workflows, and agent harness patterns;
- knowledge helpers, code intelligence helpers, and context providers;
- new execution adapters or runtime surfaces;
- agent work that must proceed inside an explicit governance boundary.

It should be used by future roadmaps as the first question before absorption:
what capability is being introduced, who owns it, what is allowed, what is
blocked, and what evidence is required?

## Owner / Source

Owner: CVF governance doctrine layer.

Primary future consumers:

- roadmap authors;
- GC-018 authorization packets;
- release and closure reviewers;
- capability intake reviewers;
- runtime owner surfaces that later implement typed intake records.

Source is the Claude-Codex accepted CVF ADD Phase A synthesis. The source is
not promoted directly; this file is the CVF-native normalized doctrine.

## Source

This doctrine is promoted from:

- `.private_reference/legacy/CVF ADD/REVIEW FOLDER/CVF_ADD_PHASE_A_GOVERNED_CAPABILITY_AND_BOUNDARY_GOVERNANCE_SYNTHESIS_2026-05-07.md`
- `docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md`
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CLAUDE_REVIEW_2026-05-17.md`
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CODEX_RESPONSE_TO_CLAUDE_2026-05-17.md`
- `docs/roadmaps/CVF_UNABSORBED_KNOWLEDGE_FINAL_CONSENSUS_ROADMAP_2026-05-17.md`

No external source is promoted as-is. External patterns are normalized into CVF
language and remain subordinate to CVF governance.

## Governed Capability Intake

A governed capability is any external or newly introduced skill, tool, provider
utility, workflow, harness, file corpus, execution helper, knowledge helper, or
adapter that can expand what an agent can do.

CVF does not trust a capability because it exists. A capability becomes
eligible only after CVF records provenance, risk, owner surface, allowed
operations, blocked operations, and evidence requirements.

### Intake Lifecycle

| Step | Required Decision | Owner Surface |
|---|---|---|
| Discover | What capability is being introduced and from where? | Doctrine or review packet |
| Classify | Is it knowledge, tool use, provider routing, execution, UI, or memory? | Architecture / owner map |
| Risk-bind | What can go wrong if it is wrong, excessive, stale, or hidden? | Policy engine / risk classifier |
| Boundary-bind | What is allowed, blocked, deferred, or operator-visible? | Governance rules |
| Adapter-bind | Which existing CVF surface may use it, if any? | Provider, tool, context, or runtime layer |
| Evidence-bind | What receipt, audit trace, test, or live proof is required? | W7 / release gate |
| Evaluate | Did it improve CVF without widening claims? | Roadmap closure |
| Retire | When should it be removed or ignored? | Reopen / retirement note |

### Minimal Record Shape

Future implementation should preserve a compact record with these fields:

```yaml
governed_capability:
  capability_id: string
  capability_name: string
  source_provenance: string
  source_class: repo|folder|document_bundle|tool|provider|generated_harness|other
  capability_class: tool|skill|provider_utility|agent_harness|knowledge_helper|workflow|runtime_adapter
  risk_class: R0|R1|R2|R3
  owner_surface: string
  allowed_operations: []
  blocked_operations: []
  sandbox_tier: none|read_only|workspace_bound|network_bound|operator_bound
  policy_binding: string
  evidence_requirement: none|doc_review|unit|e2e|live_governance
  freshness_status: current|stale|unknown
  evaluation_status: proposed|accepted|deferred|rejected|retired
  retirement_condition: string
```

This shape is advisory until a future runtime roadmap implements it.

## Protocol / Contract / Requirements

Any future capability absorption packet should answer these questions before
implementation begins:

1. What capability is being introduced?
2. What source provenance supports it?
3. Which existing CVF owner surface owns it?
4. What operations are explicitly allowed?
5. What operations are explicitly blocked?
6. What sandbox or adapter posture is required?
7. What evidence is needed before closure?
8. What claim boundary prevents overstatement?

If any answer is missing, the capability remains proposed or deferred.

## Owner Surface Binding

Every absorbed capability must bind to an existing CVF owner surface.

If no owner exists, the capability is deferred instead of creating a new owner
by implication.

Common bindings:

- architecture/reference docs define doctrine;
- policy engine and risk classifier define permission;
- provider/model gateway defines provider routing and live-call posture;
- tool/runtime adapter layer defines executable use;
- knowledge layer defines stored or retrieved knowledge;
- context builder defines context packaging;
- W7/evidence layer defines proof and receipts;
- release gate defines claim readiness.

## Boundary-First Governance

Boundary-first governance means CVF starts from the permitted operating
envelope, not from the agent's preferred action.

Agents should choose the best allowed path inside the boundary. Operators
should not be asked to decide ordinary technical route choices when the roadmap,
owner surface, and governance rules already provide enough context.

### Policy Classes

| Class | Meaning | Required Agent Behavior |
|---|---|---|
| Hard prohibition | The action is not allowed. | Stop, record blocker, or choose a compliant alternative if one exists. |
| Soft constraint | The action is allowed only under limits. | Optimize inside the limits and record material tradeoffs. |
| Communication policy | The wording or claim boundary is constrained. | State the outcome accurately without overclaiming. |
| Restricted execution path | Only certain paths are allowed. | Follow the allowed path and record adherence. |

## Agent Autonomy Rule

Agent-side audit is part of CVF execution.

Agents should ask the operator only when:

- authorization is absent or contradictory;
- scope, cost, publication posture, or value boundary changes;
- runtime behavior would change without an approved roadmap;
- evidence contradicts an existing public claim;
- secrets, legal, financial, safety, or policy risk requires explicit approval;
- the available owner surface is missing or ambiguous.

Agents should not ask the operator to decide ordinary module placement, wording,
safe implementation route, or source disposition when canonical rules already
provide enough context.

## Brief Normalization

Before design or implementation authority is used, agents should normalize the
work brief into a bounded working record.

The normalized brief should include:

- goal;
- constraints;
- evidence requirements;
- current owner surfaces;
- acceptance criteria;
- open risks;
- assumptions that affect acceptance or safety.

Brief normalization should detect solution bias before implementation, preserve
operator intent, and let agents resolve technical route decisions inside CVF
rules.

## Relationship To W7 Signals

Boundary-first governance preserves three W7 signal candidates for future
schema work:

- `path_lock_signal`: a restricted path was selected and followed;
- `minimal_response_match`: the agent kept output or action bounded when policy
  required minimality;
- `restricted_path_count`: restricted-path gates encountered, crossed, or
  rejected.

These signals are not implemented by this doctrine. They require a later schema
roadmap.

## Non-Goals

This doctrine does not:

- approve any specific external tool;
- create a new provider abstraction;
- authorize CLI execution;
- implement W7 signals;
- implement an observability plane;
- change public claims;
- replace release-quality live governance proof;
- promote private CVF ADD source files into canon as-is.

## Runtime Activation Boundary

Docs promotion is complete with this file. Runtime activation is separate.

Any future runtime claim must define concrete code surfaces, tests, ownership,
proof requirements, and live governance boundaries before behavior is claimed.

## Enforcement / Verification

This doctrine is enforced through future review practice, not through a new
runtime hook in this packet.

Verification expectations for future packets:

- doc-only promotion: docs governance and markdown structural checks;
- runtime implementation: fresh GC-018, owner-surface mapping, focused tests,
  and release-quality proof if a live governance behavior claim is made;
- public claim change: public-surface review and claim-boundary evidence;
- W7 schema change: separate schema roadmap and backward-compatibility tests.

## Claim Boundary

This doctrine is now the canonical CVF reference for governed capability
intake, boundary-first governance, and brief normalization.

It does not prove live governance behavior by itself.

## Related Artifacts

- `docs/reviews/CVF_ADD_A_D_BRIEF_DOCTRINE_PROMOTION_2026-05-17.md`
- `docs/roadmaps/CVF_UNABSORBED_KNOWLEDGE_FINAL_CONSENSUS_ROADMAP_2026-05-17.md`
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CLAUDE_REVIEW_2026-05-17.md`
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CODEX_RESPONSE_TO_CLAUDE_2026-05-17.md`
- `docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md`
