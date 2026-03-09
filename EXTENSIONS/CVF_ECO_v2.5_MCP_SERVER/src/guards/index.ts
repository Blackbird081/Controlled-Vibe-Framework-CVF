/**
 * Guard exports and factory
 * @module guards/index
 */

export * from './types.js';
export { GuardRuntimeEngine } from './engine.js';
export { PhaseGateGuard, PHASE_ROLE_MATRIX, PHASE_DESCRIPTIONS } from './phase-gate.guard.js';
export { RiskGateGuard, RISK_DESCRIPTIONS } from './risk-gate.guard.js';
export { AuthorityGateGuard, RESTRICTED_ACTIONS } from './authority-gate.guard.js';
export { MutationBudgetGuard, DEFAULT_MUTATION_BUDGETS, ESCALATION_THRESHOLD } from './mutation-budget.guard.js';
export { ScopeGuard, PROTECTED_PATHS, CVF_ROOT_INDICATORS } from './scope.guard.js';
export { AuditTrailGuard } from './audit-trail.guard.js';

import type { GuardRuntimeConfig } from './types.js';
import { GuardRuntimeEngine } from './engine.js';
import { PhaseGateGuard } from './phase-gate.guard.js';
import { RiskGateGuard } from './risk-gate.guard.js';
import { AuthorityGateGuard } from './authority-gate.guard.js';
import { MutationBudgetGuard } from './mutation-budget.guard.js';
import { ScopeGuard } from './scope.guard.js';
import { AuditTrailGuard } from './audit-trail.guard.js';

/**
 * Creates a GuardRuntimeEngine pre-loaded with all 6 guards.
 * Ready to use — just call engine.evaluate(context).
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
