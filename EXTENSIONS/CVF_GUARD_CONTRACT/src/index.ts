/**
 * CVF Guard Contract — Barrel Export
 * ===================================
 * SINGLE SOURCE OF TRUTH — import everything from here.
 *
 * Usage:
 *   import { GuardRuntimeEngine, createGuardEngine, type GuardRequestContext } from 'cvf-guard-contract';
 *
 * @module cvf-guard-contract
 */

// Types
export * from './types.js';

// Engine
export { GuardRuntimeEngine } from './engine.js';

// Guards
export { PhaseGateGuard, PHASE_ROLE_MATRIX, PHASE_DESCRIPTIONS } from './guards/phase-gate.guard.js';
export { RiskGateGuard, RISK_DESCRIPTIONS } from './guards/risk-gate.guard.js';
export { AuthorityGateGuard, RESTRICTED_ACTIONS } from './guards/authority-gate.guard.js';
export { MutationBudgetGuard, DEFAULT_MUTATION_BUDGETS, ESCALATION_THRESHOLD } from './guards/mutation-budget.guard.js';
export { ScopeGuard, PROTECTED_PATHS, CVF_ROOT_INDICATORS } from './guards/scope.guard.js';
export { AuditTrailGuard } from './guards/audit-trail.guard.js';

// Factory
import type { GuardRuntimeConfig } from './types.js';
import { GuardRuntimeEngine } from './engine.js';
import { PhaseGateGuard } from './guards/phase-gate.guard.js';
import { RiskGateGuard } from './guards/risk-gate.guard.js';
import { AuthorityGateGuard } from './guards/authority-gate.guard.js';
import { MutationBudgetGuard } from './guards/mutation-budget.guard.js';
import { ScopeGuard } from './guards/scope.guard.js';
import { AuditTrailGuard } from './guards/audit-trail.guard.js';

/**
 * Creates a GuardRuntimeEngine pre-loaded with all 6 canonical guards.
 * Ready to use — just call engine.evaluate(context).
 *
 * This factory is the RECOMMENDED way to create an engine.
 * Both Web UI and MCP Server should use this.
 */
export function createGuardEngine(
  config?: Partial<GuardRuntimeConfig>,
): GuardRuntimeEngine {
  const engine = new GuardRuntimeEngine(config);
  engine.registerGuard(new PhaseGateGuard());
  engine.registerGuard(new RiskGateGuard());
  engine.registerGuard(new AuthorityGateGuard());
  engine.registerGuard(new MutationBudgetGuard());
  engine.registerGuard(new ScopeGuard());
  engine.registerGuard(new AuditTrailGuard());
  return engine;
}
