# CVF Pre-Public MCP Server Export Surface — 2026-04-08

Memory class: POINTER_RECORD
Status: canonical candidate-scoped implementation reference for `CVF_ECO_v2.5_MCP_SERVER` in the first-wave export lane.

## Purpose

- preserve the first explicit public-surface tightening for `CVF_ECO_v2.5_MCP_SERVER`
- keep the candidate aligned to the shortlist packaging boundary
- document what is in scope versus what stays deferred

## Canonical Entry Rule

Preferred entry:

- MCP server binary:
  - `dist/index.js` (via `bin` field in package.json)
- SDK barrel:
  - `src/sdk.ts` (programmatic access to all modules)

## Public API Surface

### MCP Tools (7 tools exposed via stdio transport)

1. `cvf_check_phase_gate` — Check if action is allowed in current CVF phase
2. `cvf_check_risk_gate` — Evaluate risk level (R0-R3) of an action
3. `cvf_check_authority` — Verify role authorization for an action
4. `cvf_validate_output` — Validate AI output quality and safety
5. `cvf_advance_phase` — Request phase advancement (DISCOVERY → REVIEW)
6. `cvf_get_audit_log` — Retrieve session audit trail
7. `cvf_evaluate_full` — Run full 6-guard pipeline on an action

### SDK Exports (via `src/sdk.ts`)

**Guards Module**:
- `GuardRuntimeEngine` — Main guard evaluation engine
- `createGuardEngine` — Factory function
- 6 guard classes: `PhaseGateGuard`, `RiskGateGuard`, `AuthorityGateGuard`, `MutationBudgetGuard`, `ScopeGuard`, `AuditTrailGuard`
- Constants: `PHASE_ROLE_MATRIX`, `PHASE_DESCRIPTIONS`, `RISK_DESCRIPTIONS`, `RESTRICTED_ACTIONS`, `DEFAULT_MUTATION_BUDGETS`, `ESCALATION_THRESHOLD`, `PROTECTED_PATHS`, `CVF_ROOT_INDICATORS`, `PHASE_ORDER`, `RISK_NUMERIC`, `DEFAULT_GUARD_RUNTIME_CONFIG`
- Types: `Guard`, `GuardResult`, `GuardRequestContext`, `GuardPipelineResult`, `GuardAuditEntry`, `GuardRuntimeConfig`, `GuardDecision`, `GuardSeverity`, `CVFPhase`, `CVFRiskLevel`, `CVFRole`

**Persistence Module**:
- `JsonFileAdapter` — JSON file storage adapter
- Types: `PersistenceAdapter`, `SessionState`, `JsonFileAdapterOptions`

**System Prompt Module**:
- `generateSystemPrompt` — Context-aware prompt generator
- `MCP_TOOL_DESCRIPTIONS` — Tool descriptions for prompts
- Types: `PromptContext`, `GeneratedPrompt`

**CLI Module**:
- `runCli`, `parseArgs`, `executeCommand`, `formatOutput` — CLI wrapper functions
- Type: `CliResult`

**Registry Module**:
- `UnifiedGuardRegistry`, `createUnifiedRegistry` — Guard registry
- `SkillGuardWire`, `createDefaultSkillGuardWire` — Skill-to-guard mapping
- Types: `GuardMetadata`, `GuardCategory`, `RegisteredGuard`, `RegistryStats`, `SkillGuardMapping`, `SkillGuardCheckResult`

**Vibe Translator Module**:
- `parseVibe` — Natural language intent parser (EN/VI)
- `generateClarifications` — Slot filling + active clarification
- `generateConfirmationCard`, `formatCardAsText` — Structured confirmation cards
- Constants: `RISK_LABELS`, `PHASE_LABELS`
- Types: `ParsedVibe`, `VibeActionType`, `VibeEntity`, `VibeConstraint`, `ClarificationQuestion`, `ClarificationResult`, `ConfirmationCard`, `ConfirmationStep`

**Session Memory Module**:
- `SessionMemory` — Cross-request state persistence
- Types: `MemoryEntry`, `SessionMemoryConfig`, `SessionSnapshot`

**Non-coder Module** (5 Golden Screens):
- `generateVibeBoxScreen`, `generateIntentionMapScreen`, `generateLiveDashboardScreen`, `generateHITLScreen`, `generateAuditLedgerScreen` — Screen generators
- Types: `VibeBoxScreen`, `IntentionMapScreen`, `IntentionMapNode`, `LiveDashboardScreen`, `HITLScreen`, `HITLNotification`, `AuditLedgerScreen`, `AuditLedgerEntry`

**Non-coder Module** (Smart Onboarding):
- `getPersonaQuestions`, `buildPersonaProfile`, `getMaxRiskForAutonomy`, `getDefaultRedLines`, `mergeRedLines`, `checkRedLine`, `PersonalDictionary`, `completeOnboarding` — Onboarding functions
- Types: `AutonomyLevel`, `PersonaProfile`, `PersonaQuestion`, `RedLineConfig`, `DictionaryEntry`, `OnboardingResult`

## Explicitly Out Of Scope

- Internal implementation details in `src/guards/`, `src/persistence/`, etc. (only SDK barrel is public)
- Integration tests (`src/integration/`)
- Development dependencies and build artifacts
- SQLite-backed persistence (only JSON file adapter is supported)

## Package Consequences

- package manifest exposes `bin` field for MCP server binary
- package manifest exposes `src/sdk.ts` as SDK entry point
- package README explains MCP server usage and SDK programmatic access
- package boundary tests lock the exact allowed export surface

## Still Deferred

- `READY_FOR_EXPORT` uplift
- public package publication
- npm registry configuration
- public CI/CD setup
- version bumps (keep current 2.5.0)

## Related Artifacts

- `docs/reference/CVF_PREPUBLIC_EXPORT_SHORTLIST_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/package.json`
- `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/README.md`
- `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/sdk.ts`

