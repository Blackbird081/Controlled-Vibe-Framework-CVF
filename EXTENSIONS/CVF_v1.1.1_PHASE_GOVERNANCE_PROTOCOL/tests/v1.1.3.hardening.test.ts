/**
 * v1.1.3 Governance Runtime Hardening — Tests
 *
 * Covers:
 *   1. State Machine Hardening (failure states, recovery, retry limits)
 *   2. Authority Matrix (5×5 Phase×Role enforcement)
 *   3. File Scope Guard (file-level access restrictions)
 *   4. AI Commit Guard (mandatory ai_commit enforcement)
 *   5. Mandatory Guard Protection (non-bypassable guards)
 */

import { describe, expect, it } from 'vitest'
import {
  PhaseProtocol,
  PHASE_CAPABILITIES,
  VALID_TRANSITIONS,
  MAX_RETRY_COUNT,
  RetryLimitExceededError,
} from '../governance/phase_protocol/phase.protocol.js'
import { PhaseContext } from '../governance/phase_protocol/phase.context.js'
import { GuardRuntimeEngine } from '../governance/guard_runtime/guard.runtime.engine.js'
import { AuthorityGateGuard, AUTHORITY_MATRIX } from '../governance/guard_runtime/guards/authority.gate.guard.js'
import { PhaseGateGuard, PHASE_ROLE_MATRIX } from '../governance/guard_runtime/guards/phase.gate.guard.js'
import { RiskGateGuard } from '../governance/guard_runtime/guards/risk.gate.guard.js'
import { FileScopeGuard, PROTECTED_PATHS } from '../governance/guard_runtime/guards/file.scope.guard.js'
import { AiCommitGuard } from '../governance/guard_runtime/guards/ai.commit.guard.js'
import { MANDATORY_GUARD_IDS } from '../governance/guard_runtime/guard.runtime.types.js'

// ═══════════════════════════════════════════════════════════════════════════════
// 1. STATE MACHINE HARDENING
// ═══════════════════════════════════════════════════════════════════════════════

describe('v1.1.3 state machine hardening', () => {

  it('PhaseStage includes failure states', () => {
    expect(PHASE_CAPABILITIES).toHaveProperty('REVIEW_FAILED')
    expect(PHASE_CAPABILITIES).toHaveProperty('SPEC_CONFLICT')
    expect(PHASE_CAPABILITIES).toHaveProperty('VALIDATION_FAILED')
  })

  it('failure states have no artifact capabilities (read-only)', () => {
    expect(PHASE_CAPABILITIES['REVIEW_FAILED']).toHaveLength(0)
    expect(PHASE_CAPABILITIES['SPEC_CONFLICT']).toHaveLength(0)
    expect(PHASE_CAPABILITIES['VALIDATION_FAILED']).toHaveLength(0)
  })

  it('VALID_TRANSITIONS allows PHASE_GATE → REVIEW_FAILED', () => {
    expect(VALID_TRANSITIONS['PHASE_GATE']).toContain('REVIEW_FAILED')
  })

  it('VALID_TRANSITIONS allows STATE_VALIDATION → VALIDATION_FAILED', () => {
    expect(VALID_TRANSITIONS['STATE_VALIDATION']).toContain('VALIDATION_FAILED')
  })

  it('VALID_TRANSITIONS allows SPEC → SPEC_CONFLICT', () => {
    expect(VALID_TRANSITIONS['SPEC']).toContain('SPEC_CONFLICT')
  })

  it('VALID_TRANSITIONS allows recovery: REVIEW_FAILED → IMPLEMENTATION', () => {
    expect(VALID_TRANSITIONS['REVIEW_FAILED']).toContain('IMPLEMENTATION')
  })

  it('VALID_TRANSITIONS allows recovery: SPEC_CONFLICT → SPEC', () => {
    expect(VALID_TRANSITIONS['SPEC_CONFLICT']).toContain('SPEC')
  })

  it('VALID_TRANSITIONS allows recovery: VALIDATION_FAILED → IMPLEMENTATION', () => {
    expect(VALID_TRANSITIONS['VALIDATION_FAILED']).toContain('IMPLEMENTATION')
  })

  it('COMPLETE has no outgoing transitions', () => {
    expect(VALID_TRANSITIONS['COMPLETE']).toHaveLength(0)
  })

  // --- PhaseProtocol transition tests ---

  it('PhaseProtocol allows transition to REVIEW_FAILED from PHASE_GATE', () => {
    const protocol = new PhaseProtocol({ componentName: 'test' })
    protocol.startPhase()
    // Advance through happy path to PHASE_GATE
    protocol.advanceStage('STATE_MACHINE')
    protocol.advanceStage('STATE_DIAGRAM')
    protocol.advanceStage('IMPLEMENTATION')
    protocol.advanceStage('STATE_VALIDATION')
    protocol.advanceStage('UNIT_TESTING')
    protocol.advanceStage('SCENARIO_SIMULATION')
    protocol.advanceStage('PHASE_GATE')
    // Now transition to failure
    expect(() => protocol.advanceStage('REVIEW_FAILED')).not.toThrow()
    expect(protocol.getCurrentStage()).toBe('REVIEW_FAILED')
  })

  it('PhaseProtocol allows recovery from REVIEW_FAILED to IMPLEMENTATION', () => {
    const protocol = new PhaseProtocol({ componentName: 'test' })
    protocol.startPhase()
    protocol.advanceStage('STATE_MACHINE')
    protocol.advanceStage('STATE_DIAGRAM')
    protocol.advanceStage('IMPLEMENTATION')
    protocol.advanceStage('STATE_VALIDATION')
    protocol.advanceStage('UNIT_TESTING')
    protocol.advanceStage('SCENARIO_SIMULATION')
    protocol.advanceStage('PHASE_GATE')
    protocol.advanceStage('REVIEW_FAILED')
    // Recover
    expect(() => protocol.advanceStage('IMPLEMENTATION')).not.toThrow()
    expect(protocol.getCurrentStage()).toBe('IMPLEMENTATION')
  })

  it('PhaseProtocol blocks invalid failure transitions (e.g. SPEC → REVIEW_FAILED)', () => {
    const protocol = new PhaseProtocol({ componentName: 'test' })
    protocol.startPhase()
    expect(() => protocol.advanceStage('REVIEW_FAILED')).toThrow('Invalid phase transition')
  })

  it('PhaseProtocol blocks backward transitions (e.g. IMPLEMENTATION → SPEC)', () => {
    const protocol = new PhaseProtocol({ componentName: 'test' })
    protocol.startPhase()
    protocol.advanceStage('STATE_MACHINE')
    protocol.advanceStage('STATE_DIAGRAM')
    protocol.advanceStage('IMPLEMENTATION')
    expect(() => protocol.advanceStage('SPEC')).toThrow('Invalid phase transition')
  })

  it('PhaseProtocol throws RetryLimitExceededError after MAX_RETRY_COUNT retries', () => {
    const protocol = new PhaseProtocol({ componentName: 'test' })
    protocol.startPhase()
    protocol.advanceStage('STATE_MACHINE')
    protocol.advanceStage('STATE_DIAGRAM')
    protocol.advanceStage('IMPLEMENTATION')
    protocol.advanceStage('STATE_VALIDATION')
    protocol.advanceStage('UNIT_TESTING')
    protocol.advanceStage('SCENARIO_SIMULATION')
    protocol.advanceStage('PHASE_GATE')

    // Retry loop: PHASE_GATE → REVIEW_FAILED → IMPLEMENTATION → ...
    // Since we already advanced through the sunny-path once, those transitions have count = 1.
    // We want to trigger the fail on PHASE_GATE → REVIEW_FAILED.
    // The limit is MAX_RETRY_COUNT (3). We need 3 PHASE_GATE -> REVIEW_FAILED transitions.
    for (let i = 0; i < MAX_RETRY_COUNT; i++) {
        protocol.advanceStage('REVIEW_FAILED');
        protocol.advanceStage('IMPLEMENTATION');

        if (i < MAX_RETRY_COUNT - 1) {
          protocol.advanceStage('STATE_VALIDATION');
          protocol.advanceStage('UNIT_TESTING');
          protocol.advanceStage('SCENARIO_SIMULATION');
          protocol.advanceStage('PHASE_GATE');
        }
    }

    // Next validation should exceed retry limit since IMPLEMENTATION -> STATE_VALIDATION has 1 initial + 2 retries = 3
    expect(() => protocol.advanceStage('STATE_VALIDATION')).toThrow(RetryLimitExceededError);
  })

  it('MAX_RETRY_COUNT is 3', () => {
    expect(MAX_RETRY_COUNT).toBe(3)
  })
})

// ─── PhaseContext transition history ──────────────────────────────────────────

describe('v1.1.3 phase context history', () => {

  it('tracks transition history correctly', () => {
    const ctx = new PhaseContext('comp')
    ctx.setStage('STATE_MACHINE')
    ctx.setStage('STATE_DIAGRAM')
    const history = ctx.getTransitionHistory()
    expect(history).toHaveLength(2)
    expect(history[0].from).toBe('SPEC')
    expect(history[0].to).toBe('STATE_MACHINE')
    expect(history[1].from).toBe('STATE_MACHINE')
    expect(history[1].to).toBe('STATE_DIAGRAM')
  })

  it('counts specific transitions for retry detection', () => {
    const ctx = new PhaseContext('comp')
    ctx.setStage('STATE_MACHINE')
    ctx.setStage('SPEC') // simulated recovery
    ctx.setStage('STATE_MACHINE')
    expect(ctx.getTransitionCount('SPEC', 'STATE_MACHINE')).toBe(2)
    expect(ctx.getTransitionCount('STATE_MACHINE', 'SPEC')).toBe(1)
  })

  it('reset clears history', () => {
    const ctx = new PhaseContext('comp')
    ctx.setStage('STATE_MACHINE')
    ctx.reset()
    expect(ctx.getTransitionHistory()).toHaveLength(0)
    expect(ctx.getStage()).toBe('SPEC')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. AUTHORITY MATRIX (5×5 Phase×Role)
// ═══════════════════════════════════════════════════════════════════════════════

describe('v1.1.3 authority matrix guard', () => {
  const guard = new AuthorityGateGuard()

  it('blocks Builder in INTAKE phase', () => {
    const result = guard.evaluate({
      requestId: 'test-1',
      phase: 'INTAKE',
      riskLevel: 'R0',
      role: 'BUILDER',
      action: 'create file',
    })
    expect(result.decision).toBe('BLOCK')
    expect(result.reason).toContain('FORBIDDEN')
  })

  it('blocks Observer in BUILD phase', () => {
    const result = guard.evaluate({
      requestId: 'test-2',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'OBSERVER',
      action: 'read code',
    })
    expect(result.decision).toBe('BLOCK')
    expect(result.reason).toContain('FORBIDDEN')
  })

  it('allows Governor in FREEZE phase', () => {
    const result = guard.evaluate({
      requestId: 'test-3',
      phase: 'FREEZE',
      riskLevel: 'R3',
      role: 'GOVERNOR',
      action: 'lock decisions',
    })
    expect(result.decision).toBe('ALLOW')
  })

  it('blocks Analyst in BUILD phase', () => {
    const result = guard.evaluate({
      requestId: 'test-4',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'ANALYST',
      action: 'analyze',
    })
    expect(result.decision).toBe('BLOCK')
    expect(result.reason).toContain('FORBIDDEN')
  })

  it('allows Builder in BUILD phase with valid action and risk', () => {
    const result = guard.evaluate({
      requestId: 'test-5',
      phase: 'BUILD',
      riskLevel: 'R2',
      role: 'BUILDER',
      action: 'create component',
    })
    expect(result.decision).toBe('ALLOW')
  })

  it('blocks Builder in BUILD phase when risk exceeds R2', () => {
    const result = guard.evaluate({
      requestId: 'test-6',
      phase: 'BUILD',
      riskLevel: 'R3',
      role: 'BUILDER',
      action: 'modify code',
    })
    expect(result.decision).toBe('BLOCK')
    expect(result.reason).toContain('exceeds maximum')
  })

  it('blocks Builder in BUILD phase with unauthorized action', () => {
    const result = guard.evaluate({
      requestId: 'test-7',
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'BUILDER',
      action: 'approve release',
    })
    expect(result.decision).toBe('BLOCK')
    expect(result.reason).toContain('not authorized')
  })

  it('blocks unknown role with CRITICAL severity', () => {
    const result = guard.evaluate({
      requestId: 'test-8',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'UNKNOWN_ROLE' as any,
      action: 'read',
    })
    expect(result.decision).toBe('BLOCK')
    expect(result.severity).toBe('CRITICAL')
  })

  it('AUTHORITY_MATRIX has all 5 roles', () => {
    const roles = Object.keys(AUTHORITY_MATRIX)
    expect(roles).toContain('OBSERVER')
    expect(roles).toContain('ANALYST')
    expect(roles).toContain('BUILDER')
    expect(roles).toContain('REVIEWER')
    expect(roles).toContain('GOVERNOR')
    expect(roles.length).toBeGreaterThanOrEqual(5)
  })

  it('Reviewer can critique in REVIEW with R2', () => {
    const result = guard.evaluate({
      requestId: 'test-9',
      phase: 'REVIEW',
      riskLevel: 'R2',
      role: 'REVIEWER',
      action: 'critique implementation',
    })
    expect(result.decision).toBe('ALLOW')
  })
})

// ─── Phase Gate Guard ────────────────────────────────────────────────────────

describe('v1.1.3 phase gate guard', () => {
  const guard = new PhaseGateGuard()

  it('has 5+ phases in role matrix', () => {
    const phases = Object.keys(PHASE_ROLE_MATRIX)
    expect(phases.length).toBeGreaterThanOrEqual(5)
    expect(phases).toContain('FREEZE')
  })

  it('FREEZE only allows GOVERNOR and HUMAN', () => {
    expect(PHASE_ROLE_MATRIX['FREEZE']).toEqual(['GOVERNOR', 'HUMAN'])
  })

  it('blocks Builder in non-BUILD phase', () => {
    const result = guard.evaluate({
      requestId: 'test-10',
      phase: 'DESIGN',
      riskLevel: 'R0',
      role: 'BUILDER',
      action: 'read',
    })
    expect(result.decision).toBe('BLOCK')
  })

  it('allows Builder in BUILD phase', () => {
    const result = guard.evaluate({
      requestId: 'test-11',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'BUILDER',
      action: 'code',
    })
    expect(result.decision).toBe('ALLOW')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. FILE SCOPE GUARD
// ═══════════════════════════════════════════════════════════════════════════════

describe('v1.1.3 file scope guard', () => {
  const guard = new FileScopeGuard()

  it('blocks Builder from modifying governance/ files', () => {
    const result = guard.evaluate({
      requestId: 'fs-1',
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'BUILDER',
      action: 'modify file',
      targetFiles: ['governance/toolkit/policy.md'],
    })
    expect(result.decision).toBe('BLOCK')
    expect(result.reason).toContain('protected paths')
  })

  it('allows Builder to modify src/ files', () => {
    const result = guard.evaluate({
      requestId: 'fs-2',
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'BUILDER',
      action: 'modify file',
      targetFiles: ['src/components/button.ts'],
    })
    expect(result.decision).toBe('ALLOW')
  })

  it('blocks Reviewer from modifying any files', () => {
    const result = guard.evaluate({
      requestId: 'fs-3',
      phase: 'REVIEW',
      riskLevel: 'R0',
      role: 'REVIEWER',
      action: 'modify test',
      targetFiles: ['src/test.ts'],
    })
    expect(result.decision).toBe('BLOCK')
    expect(result.reason).toContain('read-only')
  })

  it('allows Governor to modify governance files', () => {
    const result = guard.evaluate({
      requestId: 'fs-4',
      phase: 'FREEZE',
      riskLevel: 'R3',
      role: 'GOVERNOR',
      action: 'lock governance',
      targetFiles: ['governance/toolkit/policy.md'],
    })
    expect(result.decision).toBe('ALLOW')
  })

  it('skips check when no target files specified', () => {
    const result = guard.evaluate({
      requestId: 'fs-5',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'BUILDER',
      action: 'modify code',
    })
    expect(result.decision).toBe('ALLOW')
    expect(result.reason).toContain('skipped')
  })

  it('blocks Observer from modifying files', () => {
    const result = guard.evaluate({
      requestId: 'fs-6',
      phase: 'INTAKE',
      riskLevel: 'R0',
      role: 'OBSERVER',
      action: 'create document',
      targetFiles: ['docs/proposal.md'],
    })
    expect(result.decision).toBe('BLOCK')
    expect(result.reason).toContain('read-only')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. AI COMMIT GUARD
// ═══════════════════════════════════════════════════════════════════════════════

describe('v1.1.3 ai commit guard', () => {
  const guard = new AiCommitGuard()

  it('blocks action without ai_commit metadata', () => {
    const result = guard.evaluate({
      requestId: 'ac-1',
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'BUILDER',
      action: 'modify file',
    })
    expect(result.decision).toBe('BLOCK')
    expect(result.severity).toBe('CRITICAL')
    expect(result.reason).toContain('Missing ai_commit')
  })

  it('allows action with valid ai_commit metadata', () => {
    const result = guard.evaluate({
      requestId: 'ac-2',
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'BUILDER',
      action: 'modify file',
      metadata: {
        ai_commit: {
          commitId: 'commit-001',
          agentId: 'builder-1',
          timestamp: Date.now(),
        },
      },
    })
    expect(result.decision).toBe('ALLOW')
  })

  it('blocks action with incomplete ai_commit (missing commitId)', () => {
    const result = guard.evaluate({
      requestId: 'ac-3',
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'BUILDER',
      action: 'create module',
      metadata: {
        ai_commit: {
          agentId: 'builder-1',
          timestamp: Date.now(),
        },
      },
    })
    expect(result.decision).toBe('BLOCK')
    expect(result.reason).toContain('missing required fields')
  })

  it('allows read-only actions without ai_commit', () => {
    const result = guard.evaluate({
      requestId: 'ac-4',
      phase: 'REVIEW',
      riskLevel: 'R0',
      role: 'REVIEWER',
      action: 'read code',
    })
    expect(result.decision).toBe('ALLOW')
    expect(result.reason).toContain('exempt')
  })

  it('allows observe actions without ai_commit', () => {
    const result = guard.evaluate({
      requestId: 'ac-5',
      phase: 'INTAKE',
      riskLevel: 'R0',
      role: 'OBSERVER',
      action: 'observe status',
    })
    expect(result.decision).toBe('ALLOW')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. MANDATORY GUARD PROTECTION
// ═══════════════════════════════════════════════════════════════════════════════

describe('v1.1.3 mandatory guard protection', () => {

  it('MANDATORY_GUARD_IDS contains 3 guards', () => {
    expect(MANDATORY_GUARD_IDS).toHaveLength(3)
    expect(MANDATORY_GUARD_IDS).toContain('authority_gate')
    expect(MANDATORY_GUARD_IDS).toContain('phase_gate')
    expect(MANDATORY_GUARD_IDS).toContain('ai_commit')
  })

  it('GuardRuntimeEngine refuses to unregister mandatory guards', () => {
    const engine = new GuardRuntimeEngine()
    engine.registerGuard(new AuthorityGateGuard())
    expect(() => engine.unregisterGuard('authority_gate')).toThrow('Cannot unregister mandatory guard')
  })

  it('GuardRuntimeEngine refuses to disable mandatory guards', () => {
    const engine = new GuardRuntimeEngine()
    engine.registerGuard(new PhaseGateGuard())
    expect(() => engine.disableGuard('phase_gate')).toThrow('Cannot disable mandatory guard')
  })

  it('GuardRuntimeEngine allows unregistering non-mandatory guards', () => {
    const engine = new GuardRuntimeEngine()
    engine.registerGuard(new RiskGateGuard())
    expect(engine.unregisterGuard('risk_gate')).toBe(true)
    expect(engine.getGuardCount()).toBe(0)
  })

  it('GuardRuntimeEngine allows disabling non-mandatory guards', () => {
    const engine = new GuardRuntimeEngine()
    engine.registerGuard(new FileScopeGuard())
    engine.disableGuard('file_scope')
    const guard = engine.getGuard('file_scope')
    expect(guard?.enabled).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. INTEGRATION: Full Pipeline
// ═══════════════════════════════════════════════════════════════════════════════

describe('v1.1.3 full pipeline integration', () => {

  it('pipeline blocks when ai_commit is missing', () => {
    const engine = new GuardRuntimeEngine({ strictMode: true })
    engine.registerGuard(new AiCommitGuard())
    engine.registerGuard(new PhaseGateGuard())
    engine.registerGuard(new AuthorityGateGuard())

    const result = engine.evaluate({
      requestId: 'int-1',
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'BUILDER',
      action: 'modify code',
    })

    expect(result.finalDecision).toBe('BLOCK')
    expect(result.blockedBy).toBe('ai_commit') // ai_commit has highest priority (5)
  })

  it('pipeline allows when all guards pass', () => {
    const engine = new GuardRuntimeEngine({ strictMode: true })
    engine.registerGuard(new AiCommitGuard())
    engine.registerGuard(new PhaseGateGuard())
    engine.registerGuard(new AuthorityGateGuard())

    const result = engine.evaluate({
      requestId: 'int-2',
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'BUILDER',
      action: 'create module',
      metadata: {
        ai_commit: {
          commitId: 'commit-002',
          agentId: 'builder-1',
          timestamp: Date.now(),
        },
      },
    })

    expect(result.finalDecision).toBe('ALLOW')
  })

  it('pipeline blocks when role is forbidden in phase even with valid ai_commit', () => {
    const engine = new GuardRuntimeEngine({ strictMode: true })
    engine.registerGuard(new AiCommitGuard())
    engine.registerGuard(new PhaseGateGuard())
    engine.registerGuard(new AuthorityGateGuard())

    const result = engine.evaluate({
      requestId: 'int-3',
      phase: 'FREEZE',
      riskLevel: 'R1',
      role: 'BUILDER',
      action: 'modify code',
      metadata: {
        ai_commit: {
          commitId: 'commit-003',
          agentId: 'builder-1',
          timestamp: Date.now(),
        },
      },
    })

    expect(result.finalDecision).toBe('BLOCK')
  })
})
