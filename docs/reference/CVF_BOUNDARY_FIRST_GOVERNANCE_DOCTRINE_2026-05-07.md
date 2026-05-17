# CVF Boundary-First Governance Doctrine

Memory class: POINTER_RECORD

Document type: CANONICAL — CVF-NATIVE DOCTRINE

Status: official docs absorption from CVF ADD, Phase A, 2026-05-07.

Source lineage: CVF ADD arbitration and synthesis normalized boundary,
approval, redaction, minimal-response, and restricted-path material from AI
first, Human System Harness, Hermes Agent, and related sources.

## Purpose

Boundary-first governance defines how CVF agents should act when a roadmap and
governance boundary are clear.

The agent's job is to optimize inside the boundary. The operator should not be
asked to make routine technical choices that agents can audit and resolve under
CVF rules.

## Core Rule

CVF starts from the allowed operating envelope, not from the agent's preferred
action.

The correct sequence is:

1. identify the boundary;
2. classify whether it is hard, soft, communicative, or path-restricted;
3. choose the best allowed action;
4. record any material tradeoff;
5. stop only when the next move requires true authorization or scope change.

## Policy Classes

| Class | Meaning | Required Agent Behavior |
|---|---|---|
| Hard prohibition | The action is not allowed. | Stop or choose a compliant alternative. |
| Soft constraint | The action is allowed only under limits. | Optimize inside the limits and record tradeoffs. |
| Communication policy | The wording or claim boundary is constrained. | State the outcome accurately without overclaiming. |
| Restricted execution path | Only certain paths are allowed. | Follow the allowed path and record path adherence. |

## Agent Autonomy Rule

Agent-side audit is part of CVF execution.

Agents should ask the operator only when:

- authorization is absent or contradictory;
- scope/value boundary changes;
- private/public publication posture changes;
- runtime behavior would change without an approved roadmap;
- evidence contradicts an existing public claim;
- secrets, legal, financial, safety, or policy risk requires explicit approval.

Agents should not ask the operator to decide ordinary module placement, wording,
source disposition, or safe implementation route when the roadmap and canonical
rules already provide enough context.

## W7 Evaluation Signal Candidates

Three candidate signals should be preserved for future W7/runtime work:

- `path_lock_signal`: a restricted path was selected and followed.
- `minimal_response_match`: the agent kept output/action bounded when policy
  required minimality.
- `restricted_path_count`: number of restricted-path gates crossed during the
  task.

These are doctrine candidates only until a future runtime schema roadmap
implements them.

## Claim Boundary

This doctrine improves governance semantics. It does not prove live governance
behavior by itself.

Any future claim that CVF enforces these classes at runtime must use the
repository's live-governance proof policy.

## Relationship To Capability Intake

Capability intake decides whether a new capability is eligible. Boundary-first
governance decides how agents behave once the eligible action space is known.

Together they form the Phase A CVF ADD absorption core:

- capability power is not trusted by default;
- agent autonomy is exercised inside explicit boundaries;
- operator review happens at final result and true authorization gates.

