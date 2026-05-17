# RISK CLASSIFIER SPEC
# CVF-Toolkit Core Module
# Status: Authoritative Specification
# Toolkit Version: 1.0.0

## 1. PURPOSE

This module:

- Classifies operational risk
- Applies financial overrides
- Applies environment caps
- Determines approval/UAT/freeze requirements
- Prevents manual risk downgrade

All risk decisions originate here.

## 2. RISK ENUMS

```ts
export type RiskLevel = "R1" | "R2" | "R3" | "R4"

export interface RiskAssessmentResult {
  riskLevel: RiskLevel
  requiresApproval: boolean
  requiresUAT: boolean
  requiresFreeze: boolean
  environmentCapExceeded: boolean
  reasons: string[]
}
```

## 3. INPUT CONTRACT

```ts
export interface RiskClassificationInput {
  skillId: string
  skillBaseRisk: RiskLevel
  capabilityLevel: "C1" | "C2" | "C3" | "C4"
  domain: string
  operatorRole: string
  environment: "dev" | "staging" | "prod"
  changeType?: string
  providerChange?: boolean
  affectsProduction?: boolean
}
```

## 4. CORE CLASSIFIER FUNCTION

```ts
export function classify(
  input: RiskClassificationInput
): RiskAssessmentResult
```

## 5. RISK COMPUTATION LOGIC

### STEP 1 — Start with Skill Base Risk
`risk = skillBaseRisk`

### STEP 2 — Capability Alignment

| Capability | Max Risk |
| ---------- | -------- |
| C1         | R1       |
| C2         | R2       |
| C3         | R3       |
| C4         | R4       |

If `skillBaseRisk > capabilityMax` → throw `RiskViolationError`.

### STEP 3 — Financial Override

If `domain == "financial"`:

| Operation Context | Min Risk |
| ----------------- | -------- |
| Data fetch        | R1       |
| Ratio calculation | R2       |
| Forecast          | R3       |
| Recommendation    | R4       |
| Trade automation  | R4       |

`Risk = MAX(currentRisk, financialMinimum)`

Add reason: "Financial override applied"

### STEP 4 — Change Escalation

- If `providerChange == true` → `Risk = MAX(risk, R3)`
- If `changeType == "financial"` → `Risk = MAX(risk, R3)`
- If `affectsProduction == true` → `Risk = MAX(risk, R3)`

### STEP 5 — Environment Cap Validation

| Environment | Max Risk Allowed Without Approval |
| ----------- | --------------------------------- |
| dev         | R3                                |
| staging     | R2                                |
| prod        | R1                                |

If `risk > environmentMax`:
- Set `environmentCapExceeded = true`
- Set `requiresApproval = true`
- Do NOT downgrade risk.

### STEP 6 — Approval Requirement

| Risk | Requires Approval |
| ---- | ----------------- |
| R1   | No                |
| R2   | No                |
| R3   | Yes               |
| R4   | Yes (multi)       |

### STEP 7 — UAT Requirement

| Risk | Requires UAT |
| ---- | ------------ |
| R1   | No           |
| R2   | Yes          |
| R3   | Yes          |
| R4   | Extended UAT |

### STEP 8 — Freeze Requirement

Freeze required if:
- `risk >= R3`
- OR `environment == prod`
- OR `affectsProduction == true`

## 6. OUTPUT

```ts
return {
  riskLevel,
  requiresApproval,
  requiresUAT,
  requiresFreeze,
  environmentCapExceeded,
  reasons
}
```

## 7. RISK ESCALATION PRINCIPLES

- Risk can escalate automatically.
- Risk can never downgrade automatically.
- Manual downgrade prohibited.
- Extensions cannot override risk logic.

## 8. MULTI-AGENT DOMINANCE SUPPORT

If used in multi-agent orchestration:

`effectiveRisk = max(allRiskLevels)`

Risk engine does not average. Highest always dominates.

## 9. ERROR CONDITIONS

Throw `RiskViolationError` if:
- Capability mismatch
- Invalid risk input
- Unsupported environment
- Attempted downgrade

## 10. AUDIT REQUIREMENT

Each classification must log:

```json
{
  "skillId": "...",
  "computedRisk": "R2",
  "environment": "staging",
  "overridesApplied": ["financial"],
  "timestamp": "..."
}
```

Logging handled by governance.guard.

## 11. SECURITY RULE

risk.classifier must:
- Be pure function (no side effects)
- Not access DB directly
- Not depend on extension code
- Not allow override injection

## 12. COMPLIANCE CHECKLIST

✔ Base risk applied
✔ Capability alignment enforced
✔ Financial override enforced
✔ Change escalation enforced
✔ Environment caps enforced
✔ Approval/UAT/Freeze flags computed
✔ No downgrade allowed
✔ Multi-agent dominance compatible
