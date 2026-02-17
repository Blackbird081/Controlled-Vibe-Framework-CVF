# PHASE CONTROLLER SPEC
# CVF-Toolkit Core Module
# Status: Authoritative Specification
# Toolkit Version: 1.0.0

## 1. PURPOSE

This module:

- Implements strict CVF phase sequencing (P0–P6)
- Blocks illegal transitions
- Enforces approval & UAT gates
- Controls freeze logic
- Prevents skipping governance

All deployments must pass through this controller.

## 2. CVF PHASE ENUM

```ts
export type CVFPhase =
  | "P0_DESIGN"
  | "P1_BUILD"
  | "P2_INTERNAL_VALIDATION"
  | "P3_UAT"
  | "P4_APPROVED"
  | "P5_PRODUCTION"
  | "P6_FROZEN"
```

## 3. STATE STRUCTURE

```ts
export interface PhaseState {
  projectId: string
  currentPhase: CVFPhase
  riskLevel: "R1" | "R2" | "R3" | "R4"
  approvalGranted: boolean
  uatPassed: boolean
  freezeActive: boolean
  environment: "dev" | "staging" | "prod"
}
```

## 4. ALLOWED TRANSITIONS MATRIX

| From                   | To                     | Condition                    |
| ---------------------- | ---------------------- | ---------------------------- |
| P0_DESIGN              | P1_BUILD               | design approved internally   |
| P1_BUILD               | P2_INTERNAL_VALIDATION | build complete               |
| P2_INTERNAL_VALIDATION | P3_UAT                 | internal tests passed        |
| P3_UAT                 | P4_APPROVED            | uatPassed = true             |
| P4_APPROVED            | P5_PRODUCTION          | approvalGranted = true       |
| P5_PRODUCTION          | P6_FROZEN              | freeze triggered             |
| Any                    | P0_DESIGN              | only via formal rollback     |

## 5. CORE TRANSITION FUNCTION

```ts
export function transitionPhase(
  state: PhaseState,
  targetPhase: CVFPhase
): PhaseState
```

## 6. TRANSITION LOGIC

### RULE 1 — Freeze Lock

If `state.freezeActive == true`:
- Only allowed transition: `P6_FROZEN → P0_DESIGN` (formal rollback)
- Otherwise throw: `PhaseTransitionError("System frozen")`

### RULE 2 — Sequential Integrity

No skipping allowed.

Example:
- P1 → P4 ❌
- P2 → P5 ❌

Validate: `isNextSequential(state.currentPhase, targetPhase)`

If false → throw `PhaseTransitionError`.

### RULE 3 — Risk-Based Gates

- If `targetPhase == P3_UAT`: risk >= R2 required
- If `targetPhase == P4_APPROVED`: risk >= R3 requires `approvalGranted == true`
- If `targetPhase == P5_PRODUCTION`:
  - `environment == "prod"`
  - `approvalGranted == true`
  - `uatPassed == true`

If not satisfied → block transition.

### RULE 4 — R4 Special Control

If `riskLevel == "R4"`:

Must enforce:
- Dual approval
- Extended UAT
- Explicit freeze plan documented

Transition blocked if any missing.

## 7. FREEZE ACTIVATION

```ts
export function activateFreeze(state: PhaseState): PhaseState
```

Freeze triggers if:
- `risk >= R3`
- OR manual governance trigger
- OR production incident

Set:
- `freezeActive = true`
- `currentPhase = "P6_FROZEN"`

## 8. ROLLBACK PROTOCOL

Rollback only allowed: `P6_FROZEN → P0_DESIGN`

Must log:
- Incident reference
- Root cause summary
- Risk reassessment

## 9. ILLEGAL ACTIONS BLOCKED

The controller must prevent:
- Direct production deployment from build
- Production deployment without UAT
- Downgrading risk via phase jump
- Bypassing approval for R3/R4
- Removing freeze without restart

## 10. AUDIT LOG REQUIREMENT

Each transition must generate:

```json
{
  "projectId": "...",
  "fromPhase": "P2_INTERNAL_VALIDATION",
  "toPhase": "P3_UAT",
  "riskLevel": "R2",
  "approvalStatus": false,
  "uatStatus": true,
  "timestamp": "..."
}
```

Logging handled by governance.guard.

## 11. MULTI-AGENT COMPATIBILITY

If multiple agents participate:

Effective phase = lowest common allowed phase.

Example:
- Agent A at P5
- Agent B at P3
- System cannot claim P5.

Must enforce: `systemPhase = MIN(agentPhases)`

## 12. SECURITY RULES

- No direct state mutation outside this controller
- No override hooks allowed
- No environment-based bypass
- All transitions must be atomic

## 13. COMPLIANCE CHECKLIST

✔ Sequential enforcement
✔ Risk gates enforced
✔ Approval / UAT enforced
✔ Freeze logic enforced
✔ R4 enhanced control
✔ Rollback protocol defined
✔ Audit logging required
✔ Multi-agent compatibility defined
