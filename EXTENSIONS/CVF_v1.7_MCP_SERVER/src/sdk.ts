/**
 * CVF SDK — M5.1
 *
 * Single barrel export for all CVF modules.
 * Consumers import everything from '@cvf/mcp-server/sdk':
 *
 *   import { createGuardEngine, parseVibe, generateSystemPrompt } from '@cvf/mcp-server/sdk';
 *
 * @module sdk
 */

// ─── Guards ───────────────────────────────────────────────────────────
export {
  GuardRuntimeEngine,
  createGuardEngine,
  PhaseGateGuard,
  RiskGateGuard,
  AuthorityGateGuard,
  MutationBudgetGuard,
  ScopeGuard,
  AuditTrailGuard,
  PHASE_ROLE_MATRIX,
  PHASE_DESCRIPTIONS,
  RISK_DESCRIPTIONS,
  RESTRICTED_ACTIONS,
  DEFAULT_MUTATION_BUDGETS,
  ESCALATION_THRESHOLD,
  PROTECTED_PATHS,
  CVF_ROOT_INDICATORS,
  PHASE_ORDER,
  RISK_NUMERIC,
  DEFAULT_GUARD_RUNTIME_CONFIG,
} from './guards/index.js';

export type {
  Guard,
  GuardResult,
  GuardRequestContext,
  GuardPipelineResult,
  GuardAuditEntry,
  GuardRuntimeConfig,
  GuardDecision,
  GuardSeverity,
  CVFPhase,
  CVFRiskLevel,
  CVFRole,
} from './guards/types.js';

// ─── Persistence ──────────────────────────────────────────────────────
export { JsonFileAdapter } from './persistence/json-file.adapter.js';
export type {
  PersistenceAdapter,
  SessionState,
} from './persistence/persistence.interface.js';
export type { JsonFileAdapterOptions } from './persistence/json-file.adapter.js';

// ─── System Prompt ────────────────────────────────────────────────────
export {
  generateSystemPrompt,
  MCP_TOOL_DESCRIPTIONS,
} from './prompt/system-prompt.js';
export type {
  PromptContext,
  GeneratedPrompt,
} from './prompt/system-prompt.js';

// ─── CLI ──────────────────────────────────────────────────────────────
export {
  runCli,
  parseArgs,
  executeCommand,
  formatOutput,
} from './cli/cli.js';
export type { CliResult } from './cli/cli.js';

// ─── Registry ─────────────────────────────────────────────────────────
export {
  UnifiedGuardRegistry,
  createUnifiedRegistry,
} from './registry/guard-registry.js';
export type {
  GuardMetadata,
  GuardCategory,
  RegisteredGuard,
  RegistryStats,
} from './registry/guard-registry.js';

export {
  SkillGuardWire,
  createDefaultSkillGuardWire,
} from './registry/skill-guard-wire.js';
export type {
  SkillGuardMapping,
  SkillGuardCheckResult,
} from './registry/skill-guard-wire.js';

// ─── Vibe Translator ─────────────────────────────────────────────────
export { parseVibe } from './vibe-translator/vibe-parser.js';
export type {
  ParsedVibe,
  VibeActionType,
  VibeEntity,
  VibeConstraint,
} from './vibe-translator/vibe-parser.js';

export { generateClarifications } from './vibe-translator/clarification-engine.js';
export type {
  ClarificationQuestion,
  ClarificationResult,
} from './vibe-translator/clarification-engine.js';

export {
  generateConfirmationCard,
  formatCardAsText,
  RISK_LABELS,
  PHASE_LABELS,
} from './vibe-translator/confirmation-card.js';
export type {
  ConfirmationCard,
  ConfirmationStep,
} from './vibe-translator/confirmation-card.js';

// ─── Session Memory ───────────────────────────────────────────────────
export { SessionMemory } from './memory/session-memory.js';
export type {
  MemoryEntry,
  SessionMemoryConfig,
  SessionSnapshot,
} from './memory/session-memory.js';
