Memory class: SUMMARY_RECORD

# ADR: Delegation Contract And CPF Relationship

Date: 2026-05-17

Status: ACCEPTED LOCALLY.

## Purpose

Document how ADD-C2 `DelegationContract` relates to existing CPF agent
contracts and the thin EPF boundary guard.

## Context

The V8 queue authorized ADD-C2 after GAP-AGENT-HANDOFF completed. Existing CPF
agent contracts already cover agent definition, governed session decisions,
scope resolution, and orchestration. ADD-C2 adds the integration layer that
records delegated ownership, inherited policy boundaries, blocked actions, and
final-report requirements.

## Scope

Owner surfaces:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/`

Related CPF contracts:

- `agent.governed.session.contract.ts`
- `agent.definition.boundary.contract.ts`
- `agent.scope.resolution.batch.contract.ts`
- `orchestration.contract.ts`

## Decision

Add `DelegationContract` in CPF as the authoritative delegation record shape.
It does not replace existing CPF contracts:

- `agent.definition.boundary.contract.ts` remains the role/capability source.
- `agent.scope.resolution.batch.contract.ts` remains the scope summary source.
- `agent.governed.session.contract.ts` remains the action/session decision
  source.
- `orchestration.contract.ts` remains the assignment/dependency planning
  source.

Add a thin EPF `evaluateDelegatedWriteBoundary` helper so execution-facing code
can reject writes outside delegated ownership or inside forbidden paths without
pulling CPF into EPF.

## Alternatives

- Put all delegation behavior into EPF. Rejected because CPF owns agent
  boundaries and policy inheritance.
- Replace existing CPF agent contracts. Rejected because the queue only
  authorizes an integration layer.
- Treat final reports as free-form. Rejected because changed files and evidence
  receipts are required closure facts.

## Gate / Boundary

The implementation gate is CPF and EPF test/typecheck coverage. The boundary
is: helpers return validation results; they do not execute writes, close tasks,
or create new agent authority.

## Consequences

- Delegated work can declare owned files/modules, forbidden paths, inherited
  risk ceiling, policy IDs, sandbox tier, blocked actions, and final evidence
  requirements.
- EPF can perform a local boundary check without becoming the delegation owner.
- Future runtime callers must decide how to enforce helper results.

## Claim Boundary

Integration layer only. No replacement of CPF agent contracts, runtime
execution engine, release gate change, or GA posture change is introduced.

## Verification

Verified through:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/delegation.contract.test.ts`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/delegation.boundary.guard.contract.test.ts`
- CPF `npm test` and `npm run check`
- EPF `npm test` and `npm run check`
