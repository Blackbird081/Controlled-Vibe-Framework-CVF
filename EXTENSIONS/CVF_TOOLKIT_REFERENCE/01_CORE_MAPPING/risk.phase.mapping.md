# RISK & PHASE MAPPING SPEC
# CVF → CVF-Toolkit Integration
# Status: Authoritative Mapping
# Toolkit Version: 1.0.0
# CVF Lock: See 00_CANONICAL_REFERENCE/cvf_version.lock
1. PURPOSE

This document defines:

How CVF Risk Model is mapped into Toolkit

How Phase Model is implemented

How Risk influences Phase enforcement

How both integrate into execution flow

This file is binding and must be implemented exactly as defined.

2. CVF RISK MODEL (CANONICAL INTERPRETATION)

CVF defines risk as a function of:

Impact scope

Reversibility

Financial consequence

Governance consequence

System stability risk

Toolkit MUST classify every request before execution.

3. TOOLKIT RISK LEVELS

Toolkit defines 4 operational risk tiers:

| Risk Level | Code | Description                        |
| ---------- | ---- | ---------------------------------- |
| LOW        | R1   | Informational, no system impact    |
| MEDIUM     | R2   | Analytical, no structural change   |
| HIGH       | R3   | Structural logic impact            |
| CRITICAL   | R4   | Production/system-wide consequence |

4. RISK CLASSIFICATION ENGINE
Implemented in:
risk.classifier.ts

Classification Inputs:

Requested skill

Data domain (financial / system / governance)

Operator role

Target environment (dev / staging / prod)

Change flag (true/false)

Mandatory Output:

{
  riskLevel: R1 | R2 | R3 | R4,
  requiresApproval: boolean,
  requiresUAT: boolean,
  allowedPhases: Phase[],
  requiresFreeze: boolean
}

5. PHASE MODEL (CVF → TOOLKIT)

Toolkit implements 7 phases:

| Phase               | Code | Description                    |
| ------------------- | ---- | ------------------------------ |
| DESIGN              | P0   | Specification & definition     |
| BUILD               | P1   | Implementation                 |
| INTERNAL VALIDATION | P2   | Testing & internal review      |
| UAT                 | P3   | User Acceptance Testing        |
| APPROVED            | P4   | Formal approval granted        |
| PRODUCTION          | P5   | Live production deployment     |
| FROZEN              | P6   | Locked, no modification allowed|
Phase enforcement is mandatory.

6. PHASE TRANSITION RULES

Allowed transitions:

P0 → P1 (design approved internally)
P1 → P2 (build complete)
P2 → P3 (internal tests passed)
P3 → P4 (uatPassed = true)
P4 → P5 (approvalGranted = true)
P5 → P6 (freeze triggered)
P6 → P0 (only via formal rollback)

Not allowed:
P0 → P2 or higher
P1 → P3 or higher
P2 → P4 or higher
P3 → P5 or higher
P4 → P6 (must go through P5)
Any backward transition (except P6 → P0 rollback)

Any illegal transition must throw governance exception.

7. RISK → PHASE ENFORCEMENT MATRIX

| Risk | Max Allowed Phase Without Approval | UAT Required       | Freeze Required      |
| ---- | ---------------------------------- | ------------------ | -------------------- |
| R1   | P5 (Production)                    | No                 | No                   |
| R2   | P5 (Production)                    | Yes (P3)           | No                   |
| R3   | P4 (Approved)                      | Yes (P3)           | Yes (P6)             |
| R4   | P2 (Internal Validation)           | Mandatory Extended | Yes (P6) + Multi-Approval |

Interpretation:

R1 may flow normally to production.

R2 must pass UAT (P3) before production.

R3 cannot auto-release beyond P4 without approval.

R4 cannot advance beyond P2 without formal multi-approval.

8. RISK IMPACT ON EXECUTION FLOW
Before Model Invocation:

If:
riskLevel >= R3

Then:

Must validate operator role >= Manager

Must validate change request exists

Must enforce phase gate

If:
riskLevel == R4

Then:

Must require 2 approvals

Must enforce freeze

Must log extended audit

9. FINANCIAL DOMAIN RISK OVERRIDE

Financial calculations override baseline risk:

| Operation                | Minimum Risk |
| ------------------------ | ------------ |
| Data fetch (read-only)   | R1           |
| Financial ratio calc     | R2           |
| Forecast generation      | R3           |
| Portfolio recommendation | R4           |
| Auto trade execution     | R4           |

This override is enforced in:
financial.extension/financial.risk.profile.ts

10. PHASE CONTROLLER CONTRACT

Implemented in:
phase.controller.ts

Must expose:

transitionPhase(state: PhaseState, targetPhase: CVFPhase): PhaseState
activateFreeze(state: PhaseState): PhaseState

CVFPhase enum: P0_DESIGN | P1_BUILD | P2_INTERNAL_VALIDATION | P3_UAT | P4_APPROVED | P5_PRODUCTION | P6_FROZEN

Must throw:

PhaseViolationError
RiskPhaseMismatchError

11. RELEASE BLOCK CONDITIONS

Production (P5) is blocked if:

riskLevel >= R3 and approval missing

UAT (P3) failed

Approval (P4) not granted

Change request not logged

Audit logger inactive

Freeze (P6) is blocked if:

Production (P5) not reached

Release and freeze cannot be forced.

12. MULTI-AGENT CONSIDERATION

If multiple agents:

Highest risk among agents dominates

Phase must align with highest-risk agent

Audit logs must include agent ID

13. ENVIRONMENT RULES

| Environment | Max Risk Without Manual Approval |
| ----------- | -------------------------------- |
| dev         | R3                               |
| staging     | R2                               |
| prod        | R1                               |

Prod environment has strictest enforcement.

14. NON-NEGOTIABLE RULES

No execution without risk classification.

No phase transition without controller.

No release without freeze if risk >= R3.

Risk cannot be downgraded manually.

Extensions cannot redefine risk core logic.

15. COMPLIANCE CHECKLIST

Toolkit compliant if:

✔ Risk classification enforced before execution
✔ Phase transitions validated
✔ Risk-phase matrix applied
✔ Financial override active
✔ Release blocking active
✔ Environment restrictions active




