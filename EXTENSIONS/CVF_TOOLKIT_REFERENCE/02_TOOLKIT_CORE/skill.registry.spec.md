# SKILL REGISTRY SPEC
# CVF-Toolkit Core Module
# Status: Authoritative Specification
# Toolkit Version: 1.0.0

## 1. PURPOSE

Manages and validates all skill definitions within the CVF governance framework.
Skills represent business-level capabilities — independent from AI model providers.

## 2. CORE INTERFACE

```ts
export type SkillRiskLevel = "R1" | "R2" | "R3" | "R4"

export interface SkillDefinition {
  id: string
  name: string
  version: string
  description: string
  riskLevel: SkillRiskLevel
  domain: string
  requiredPhase: number
  requiresApproval: boolean
  allowedRoles: string[]
  allowedEnvironments: ("dev" | "staging" | "prod")[]
  requiresUAT: boolean
  freezeOnRelease: boolean
}
```

## 3. REGISTRY OPERATIONS

### 3.1 Register Skill
```ts
register(skill: SkillDefinition): void
```
- Validates required fields
- Rejects duplicate id
- Stores skill in registry

### 3.2 Retrieve Skill
```ts
get(skillId: string): SkillDefinition
```
- Returns skill or throws SkillViolationError

### 3.3 List Skills
```ts
list(): SkillDefinition[]
```
- Returns all registered skills

## 4. VALIDATION RULES

On registration:
- `id` must be non-empty, lowercase, kebab-case
- `version` must follow SemVer format
- `riskLevel` must be valid R1–R4
- `domain` must be specified
- `allowedRoles` must be non-empty
- `allowedEnvironments` must be non-empty

## 5. IMMUTABILITY RULE

Once registered, a skill definition cannot be mutated.
To update: de-register, then re-register with incremented version.

## 6. COMPLIANCE CHECKLIST

✔ Registration enforced
✔ Duplicate rejection enforced
✔ Retrieval with error handling
✔ Version tracking
✔ Domain field required
✔ Immutability post-registration
