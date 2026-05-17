# API Reference — CVF Toolkit Core

## Module: governance.guard

### `enforceGovernance(context: GovernanceContext): GovernanceDecision`

Main entry point. Validates skill, operator, risk, phase, and change control.

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| operatorId | string | ✅ | Operator performing the action |
| operatorRole | string | ✅ | ANALYST / REVIEWER / APPROVER / ADMIN |
| skillId | string | ✅ | Skill being invoked |
| skillVersion | string | ✅ | Skill version (SemVer) |
| environment | string | ✅ | dev / staging / prod |
| requestedPhase | CVFPhase | ✅ | Current phase P0–P6 |
| changeId | string | ❌ | Change request ID |
| agentId | string | ❌ | Multi-agent context |

**Returns:** `GovernanceDecision`
| Field | Type | Description |
|-------|------|-------------|
| allowed | boolean | Whether the operation is permitted |
| riskLevel | RiskLevel | Computed risk R1–R4 |
| enforcedPhase | string | Active phase |
| requiresUAT | boolean | UAT required |
| requiresApproval | boolean | Approval required |
| requiresFreeze | boolean | Freeze required |
| reasons | string[] | Block reasons (if denied) |

**Throws:** `GovernanceViolationError` (CVF_ERR_001)

---

## Module: risk.classifier

### `classify(input: RiskClassificationInput): RiskAssessmentResult`

Computes effective risk level applying capability mismatch, domain overrides, and environment caps.

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| skillId | string | ✅ | Skill ID |
| skillBaseRisk | RiskLevel | ✅ | Base risk R1–R4 |
| capabilityLevel | string | ✅ | C1–C4 |
| domain | string | ✅ | Domain name |
| operatorRole | string | ✅ | Operator role |
| environment | string | ✅ | Environment |
| changeType | string | ❌ | Type of change |
| providerChange | boolean | ❌ | Provider changed |
| affectsProduction | boolean | ❌ | Production impact |

**Returns:** `RiskAssessmentResult`

---

## Module: phase.controller

### `validateTransition(projectId: string, from: CVFPhase, to: CVFPhase, state: PhaseState): boolean`

Validates if a phase transition is allowed (sequential only, P0→P6).

### `rollback(projectId: string, adminId: string): void`

Rolls back to P0_DESIGN (ADMIN only).

---

## Module: skill.registry

### `register(skill: SkillDefinition): void`
Registers a new skill. Rejects duplicates.

### `get(skillId: string): SkillDefinition`
Returns skill definition or throws `SkillViolationError`.

### `list(): SkillDefinition[]`
Returns all registered skills.

---

## Module: change.controller

### `register(request: ChangeRequest): void`
Registers a new change request.

### `submit(changeId: string): void`
Moves change from draft → submitted.

### `approve(changeId: string, approverId: string): void`
Approves a change. R4 requires multi-approval (2+).

### `reject(changeId: string, rejectedBy: string, reason: string): void`
Rejects a change request.

### `validate(changeId: string): boolean`
Returns whether change is approved.

---

## Module: audit.logger

### `log(record: AuditRecord): void`
Logs an audit event with auto-populated timestamp.

### `getAll(): AuditRecord[]`
Returns all audit records.

---

## Module: freeze.protocol (06_VERSIONING_AND_FREEZE)

### `activate(skillId, version, riskLevel, frozenBy, reason): FreezeState`
Activates freeze on a skill version.

### `isActive(skillId, version): boolean`
Checks if a freeze is active.

### `breakFreeze(request: FreezeBreakRequest, adminRole: string): void`
Admin-only freeze break with justification.

---

## Module: provider.registry (07_AI_PROVIDER_ABSTRACTION)

### `register(provider: AIProvider): void`
Registers an AI provider.

### `invoke(providerName, request: AIRequest): Promise<AIResponse>`
Invokes provider with model approval validation.

### `invokeWithFallback(primary, fallback, request): Promise<AIResponse>`
Tries primary provider, falls back on failure.

### `healthCheck(providerName): Promise<boolean>`
Checks provider health.

---

## Error Codes

| Code | Error Class | Meaning |
|------|-------------|---------|
| CVF_ERR_001 | GovernanceViolationError | Multi-reason governance violation |
| CVF_ERR_002 | PhaseViolationError | Illegal phase transition |
| CVF_ERR_003 | RiskViolationError | Risk level exceeded |
| CVF_ERR_004 | OperatorViolationError | Insufficient permissions |
| CVF_ERR_005 | ChangeViolationError | Change control violation |
| CVF_ERR_006 | FreezeViolationError | Freeze protocol violation |
| CVF_ERR_007 | EnvironmentViolationError | Environment restriction |
| CVF_ERR_008 | SkillViolationError | Skill not found / inactive |
| CVF_ERR_009 | SecurityException | Bypass attempt |
| CVF_ERR_010 | ValidationError | Input validation failure |
| CVF_ERR_011 | ProviderError | AI provider failure |
| CVF_ERR_012 | CertificationError | Certification issue |
