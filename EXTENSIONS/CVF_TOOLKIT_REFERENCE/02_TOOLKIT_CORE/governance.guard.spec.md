# GOVERNANCE GUARD SPEC
# CVF-Toolkit Core Module
# Status: Authoritative Specification
# Toolkit Version: 1.0.0

## 1. PURPOSE

`governance.guard` is the central enforcement engine.

It validates:

- Risk classification
- Phase legality
- Operator permissions
- Skill lifecycle state
- Change control compliance
- Freeze status
- Environment restrictions

> If any validation fails → execution must stop.

## 2. DEPENDENCIES

This module depends on:

- `risk.classifier.ts`
- `phase.controller.ts`
- `skill.registry.ts`
- `operator.policy.ts`
- `change.controller.ts`
- `audit.logger.ts`

> No circular dependency allowed.

## 3. CORE INTERFACE

```ts
export interface GovernanceContext {
  operatorId: string
  operatorRole: string
  skillId: string
  skillVersion: string
  environment: "dev" | "staging" | "prod"
  requestedPhase: "P0" | "P1" | "P2" | "P3" | "P4" | "P5" | "P6"
  changeId?: string
  agentId?: string
}

export interface GovernanceDecision {
  allowed: boolean
  riskLevel: "R1" | "R2" | "R3" | "R4"
  enforcedPhase: string
  requiresUAT: boolean
  requiresApproval: boolean
  requiresFreeze: boolean
  reasons?: string[]
}
```

## 4. MAIN ENTRY FUNCTION

```ts
export async function enforceGovernance(
  context: GovernanceContext
): Promise<GovernanceDecision>
```

This function must:

1. Validate skill existence
2. Validate skill status == released
3. Validate operator permission
4. Classify risk
5. Validate risk–capability alignment
6. Validate phase transition
7. Validate change compliance (if applicable)
8. Validate freeze rules
9. Validate environment restriction
10. Log audit
11. Return decision

> If violation → throw `GovernanceViolationError`.

## 5. VALIDATION STEPS (ORDER IS MANDATORY)

### STEP 1 — Skill Validation

`skill.registry.get(skillId)`

Reject if:
- Not found
- Version mismatch
- Status != released

### STEP 2 — Operator Validation

`operator.policy.validate(operatorRole, skill.requiredRole)`

Reject if insufficient privilege.

### STEP 3 — Risk Classification

`risk.classifier.classify(skill, context)`

Output riskLevel.

Reject if:
- Agent capability < skill capability
- Risk > agent maxRiskAllowed

### STEP 4 — Phase Enforcement

`phase.controller.transitionPhase(state, requestedPhase)`

Reject illegal transition (P0–P6 sequential enforcement).

### STEP 5 — Change Compliance

If skill.version modified OR provider changed:

`change.controller.validate(changeId)`

Reject if:
- No approved change
- Approval incomplete
- UAT incomplete
- Freeze missing

### STEP 6 — Freeze Enforcement

If risk >= R3 OR environment == prod:

Validate freeze status.

Reject if freeze not active.

### STEP 7 — Environment Rule

Apply environment risk caps:

| Environment | Max Risk             |
| ----------- | -------------------- |
| dev         | R3                   |
| staging     | R2                   |
| prod        | R1 (unless approved) |

Reject if violation.

### STEP 8 — Audit Logging

Log event:

```ts
audit.logger.logGovernanceEvent({
  operatorId,
  skillId,
  riskLevel,
  environment,
  phase,
  decision: "allowed" | "rejected"
})
```

Audit must execute even if rejected.

## 6. RETURN STRUCTURE

If allowed:
```json
{
  "allowed": true,
  "riskLevel": "R2",
  "enforcedPhase": "P3",
  "requiresUAT": true,
  "requiresApproval": false,
  "requiresFreeze": false
}
```

If rejected: Throw `GovernanceViolationError(reasons[])`

## 7. NON-BYPASSABLE RULE

The following modules MUST call governance.guard before execution:

- skill.executor.ts
- provider.executor.ts
- financial.engine.ts
- release.manager.ts
- change.controller.ts (pre-implementation)
- agent.orchestrator.ts

Direct provider calls are prohibited.

## 8. FINANCIAL DOMAIN ENFORCEMENT

If `skill.domain == "financial"`:

- Enforce minimum R2
- Enforce extended audit if R3+
- Enforce freeze if R3+
- Enforce multi-approval if R4

## 9. MULTI-AGENT RISK DOMINANCE

If context.agentId present:

- Retrieve all active agent risk results
- Effective risk = MAX(all risks)
- Apply enforcement on effective risk

## 10. ERROR TYPES

Must define:

- GovernanceViolationError
- PhaseViolationError
- RiskViolationError
- OperatorViolationError
- ChangeViolationError
- FreezeViolationError
- EnvironmentViolationError

All must extend BaseGovernanceError.

## 11. EXTENSION PROTECTION RULE

Extensions cannot:

- Override enforceGovernance
- Modify risk result
- Skip validation steps
- Catch and suppress GovernanceViolationError

Attempt must throw SecurityException.

## 12. COMPLIANCE CHECKLIST

✔ Skill validation enforced
✔ Operator validation enforced
✔ Risk classification enforced
✔ Phase gating enforced
✔ Change compliance enforced
✔ Freeze protocol enforced
✔ Environment restriction enforced
✔ Audit logging enforced
✔ Non-bypassable design enforced
