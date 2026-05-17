Memory class: SUMMARY_RECORD

# ADR: Agent Handoff Contract Relationship

Date: 2026-05-17

Status: ACCEPTED LOCALLY.

## Purpose

Document how `agent.handoff.contract.ts` relates to the existing Control Plane
Foundation agent contracts.

## Context

The V8 absorption queue reduced GAP-AGENT to the concrete missing bridge:
cross-agent handoff records and delegation receipts. CPF already has agent
definition, governed session, scope resolution, and orchestration contracts.
The gap is a shared record that allows one governed agent to hand work to
another without losing policy continuity or evidence references.

## Scope

Owner surface:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`

Related CPF contracts:

- `agent.governed.session.contract.ts`
- `agent.definition.boundary.contract.ts`
- `agent.scope.resolution.batch.contract.ts`
- `orchestration.contract.ts`

## Decision

Add `AgentHandoffRecord` as a bridge contract. The handoff record captures the
source agent, target agent, task, context snapshot, inherited policy ceiling,
acceptance evidence, and generated receipt ID.

The contract does not replace any existing CPF agent contract:

- agent definitions still own declared role/capability boundaries;
- governed sessions still own action decisions and execution receipts;
- scope resolution still owns resolved capability/domain summaries;
- orchestration still owns task assignment and dependency planning.

`verifyPolicyContinuity` is a validation helper that blocks policy downgrade in
the returned boolean. It is not runtime enforcement by itself.

## Alternatives

- Fold handoff state into governed sessions. Rejected because handoff is a
  cross-agent bridge and should not overload action-decision receipts.
- Add a new orchestration runtime. Rejected because Step 9 is schema/bridge
  work only.
- Treat handoff as free-form markdown. Rejected because the deferred item
  requires a typed receipt-bearing protocol.

## Gate / Boundary

The implementation gate is CPF test and typecheck coverage. The boundary is:
the contract records and validates handoff shape; it does not authorize agent
execution or cause target-agent action.

## Active Boundary

The active boundary is a typed handoff bridge only. Existing CPF agent contracts
continue to own role, scope, session, and orchestration decisions.

## Latest Work / Changes

Step 9 adds `agent.handoff.contract.ts`, focused tests, and this ADR as the
relationship record for the four existing CPF agent contracts.

## Next Action / Approval Gate

Future agent-handoff behavior beyond typed validation requires a fresh GC-018
and a concrete runtime roadmap.

## Consequences

- Cross-agent handoffs can retain closed decisions, open items, artifact refs,
  evidence receipt IDs, and policy continuity in one typed record.
- Future delegation contracts can reference handoff receipts without replacing
  existing CPF agent surfaces.
- Callers must still enforce acknowledgment and execution gating.

## Claim Boundary

Bridge contract only. No new agent authority, runtime execution engine, release
gate, GA posture, or public claim change is introduced.

## Verification

Verified through:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.handoff.contract.test.ts`
- `npm test`
- `npm run check`
