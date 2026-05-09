/**
 * Guard Engine Singleton
 * =======================
 * Shared guard engine instance used by all API routes.
 * Prevents audit log fragmentation by ensuring a single engine
 * handles all guard evaluations.
 *
 * Sprint 6 — Task 6.5
 *
 * @module lib/guard-engine-singleton
 */

import { createGuardEngine, type GuardRuntimeEngine } from 'cvf-guard-contract';

let _engine: GuardRuntimeEngine | null = null;

/**
 * Get the shared guard engine instance.
 * Creates it on first call, reuses thereafter.
 */
export function getSharedGuardEngine(): GuardRuntimeEngine {
  if (!_engine) {
    _engine = createGuardEngine();
  }
  return _engine;
}

/**
 * Reset the shared engine (for testing only).
 */
export function resetSharedGuardEngine(): void {
  _engine = null;
}
