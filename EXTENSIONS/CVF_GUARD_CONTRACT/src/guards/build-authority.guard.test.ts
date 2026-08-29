import { describe, it, expect } from 'vitest';
import { BuildAuthorityGuard } from './build-authority.guard';
import { GuardRuntimeEngine } from '../engine';
import { createGuardEngine } from '../index';
import type { BuildAuthorityEvidence, GuardRequestContext } from '../types';
import { MANDATORY_GUARD_IDS } from '../types';

function validEvidence(overrides?: Partial<BuildAuthorityEvidence>): BuildAuthorityEvidence {
  return {
    specStatus: 'ACCEPTED',
    acceptedSpecRef: 'docs/specs/SPEC-1.md',
    workOrderStatus: 'VALID',
    workOrderRef: 'docs/work_orders/WO-1.md',
    revoked: false,
    allowedScope: ['src/app'],
    ...overrides,
  };
}

function ctx(overrides?: Partial<GuardRequestContext>): GuardRequestContext {
  return {
    requestId: 'req-1',
    phase: 'BUILD',
    riskLevel: 'R1',
    role: 'AI_AGENT',
    action: 'modify component',
    targetFiles: ['src/app/a.ts'],
    buildAuthority: validEvidence(),
    ...overrides,
  };
}

describe('BuildAuthorityGuard -- applicability', () => {
  const guard = new BuildAuthorityGuard();

  it('allows non-BUILD phase without evidence', () => {
    const result = guard.evaluate(ctx({ phase: 'DESIGN', buildAuthority: undefined, targetFiles: undefined }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows read-only BUILD action without evidence', () => {
    const result = guard.evaluate(ctx({ action: 'read component', buildAuthority: undefined, targetFiles: undefined }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows phase-transition action without evidence', () => {
    const result = guard.evaluate(ctx({ action: 'phase_transition_to_review', buildAuthority: undefined, targetFiles: undefined }));
    expect(result.decision).toBe('ALLOW');
  });
});

describe('BuildAuthorityGuard -- missing/invalid evidence', () => {
  const guard = new BuildAuthorityGuard();

  it('blocks missing buildAuthority evidence', () => {
    const result = guard.evaluate(ctx({ buildAuthority: undefined }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('Missing buildAuthority evidence');
  });

  it('blocks rejected SPEC', () => {
    const result = guard.evaluate(ctx({ buildAuthority: validEvidence({ specStatus: 'REJECTED' }) }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('SPEC is not accepted');
  });

  it('blocks empty acceptedSpecRef even when status is ACCEPTED', () => {
    const result = guard.evaluate(ctx({ buildAuthority: validEvidence({ acceptedSpecRef: '' }) }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('SPEC is not accepted');
  });

  it('blocks whitespace-only acceptedSpecRef', () => {
    const result = guard.evaluate(ctx({ buildAuthority: validEvidence({ acceptedSpecRef: '   ' }) }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks invalid workOrderStatus', () => {
    const result = guard.evaluate(ctx({ buildAuthority: validEvidence({ workOrderStatus: 'INVALID' }) }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('WORK ORDER is not valid');
  });

  it('blocks empty workOrderRef even when status is VALID', () => {
    const result = guard.evaluate(ctx({ buildAuthority: validEvidence({ workOrderRef: '' }) }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('WORK ORDER is not valid');
  });

  it('blocks whitespace-only workOrderRef', () => {
    const result = guard.evaluate(ctx({ buildAuthority: validEvidence({ workOrderRef: '   ' }) }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks malformed non-object evidence without throwing', () => {
    const malformed = ctx({ buildAuthority: 'invalid' as unknown as BuildAuthorityEvidence });
    expect(() => guard.evaluate(malformed)).not.toThrow();
    expect(guard.evaluate(malformed).decision).toBe('BLOCK');
  });
});

describe('BuildAuthorityGuard -- target/scope', () => {
  const guard = new BuildAuthorityGuard();

  it('blocks missing target files for a mutating BUILD action', () => {
    const result = guard.evaluate(ctx({ targetFiles: undefined }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('no target files');
  });

  it('blocks empty target file array', () => {
    const result = guard.evaluate(ctx({ targetFiles: [] }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('no target files');
  });

  it('blocks missing allowed scope', () => {
    const result = guard.evaluate(ctx({ buildAuthority: validEvidence({ allowedScope: [] }) }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('no allowed scope');
  });

  it('blocks malformed string allowedScope without throwing', () => {
    const malformedEvidence = validEvidence({ allowedScope: 'src/app' as unknown as string[] });
    expect(() => guard.evaluate(ctx({ buildAuthority: malformedEvidence }))).not.toThrow();
    expect(guard.evaluate(ctx({ buildAuthority: malformedEvidence })).decision).toBe('BLOCK');
  });

  it('blocks malformed string targetFiles without throwing', () => {
    const malformed = ctx({ targetFiles: 'src/app/a.ts' as unknown as string[] });
    expect(() => guard.evaluate(malformed)).not.toThrow();
    expect(guard.evaluate(malformed).decision).toBe('BLOCK');
  });

  it('blocks absolute-path targets', () => {
    const result = guard.evaluate(ctx({ targetFiles: ['/etc/passwd'] }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('exceed WORK ORDER allowed scope');
  });

  it('blocks windows-drive absolute-path targets', () => {
    const result = guard.evaluate(ctx({ targetFiles: ['C:/src/app/a.ts'] }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks parent-traversal targets', () => {
    const result = guard.evaluate(ctx({ targetFiles: ['src/app/../../etc/passwd'] }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks parent-traversal allowed scope', () => {
    const result = guard.evaluate(
      ctx({
        buildAuthority: validEvidence({ allowedScope: ['../src/app'] }),
        targetFiles: ['src/app/a.ts'],
      }),
    );
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks segment-prefix collision (src/app/ must not cover src/application/)', () => {
    const result = guard.evaluate(
      ctx({
        buildAuthority: validEvidence({ allowedScope: ['src/app'] }),
        targetFiles: ['src/application/a.ts'],
      }),
    );
    expect(result.decision).toBe('BLOCK');
  });

  it('allows exact-file scope match', () => {
    const result = guard.evaluate(
      ctx({
        buildAuthority: validEvidence({ allowedScope: ['src/app/a.ts'] }),
        targetFiles: ['src/app/a.ts'],
      }),
    );
    expect(result.decision).toBe('ALLOW');
  });

  it('allows directory-scope match for a nested file', () => {
    const result = guard.evaluate(
      ctx({
        buildAuthority: validEvidence({ allowedScope: ['src/app/'] }),
        targetFiles: ['src/app/nested/a.ts'],
      }),
    );
    expect(result.decision).toBe('ALLOW');
  });
});

describe('BuildAuthorityGuard -- revocation and expiry', () => {
  const guard = new BuildAuthorityGuard();

  it('blocks revoked WORK ORDER', () => {
    const result = guard.evaluate(ctx({ buildAuthority: validEvidence({ revoked: true }) }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('revoked');
  });

  it('blocks malformed non-boolean revocation state', () => {
    const evidence = validEvidence({ revoked: 'false' as unknown as boolean });
    expect(guard.evaluate(ctx({ buildAuthority: evidence })).decision).toBe('BLOCK');
  });

  it('blocks invalid-timestamp expiry', () => {
    const result = guard.evaluate(ctx({ buildAuthority: validEvidence({ expiresAt: 'not-a-date' }) }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('expired or carries an invalid expiry');
  });

  it('blocks malformed non-string expiry without throwing', () => {
    const evidence = validEvidence({ expiresAt: 123 as unknown as string });
    expect(() => guard.evaluate(ctx({ buildAuthority: evidence }))).not.toThrow();
    expect(guard.evaluate(ctx({ buildAuthority: evidence })).decision).toBe('BLOCK');
  });

  it('blocks already-expired WORK ORDER', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const result = guard.evaluate(ctx({ buildAuthority: validEvidence({ expiresAt: past }) }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks exact-boundary expiry (expiresAt equal to evaluation instant is not strictly after)', () => {
    const now = new Date();
    const guardWithFixedClock = new BuildAuthorityGuard();
    const result = guardWithFixedClock.evaluate(
      ctx({ buildAuthority: validEvidence({ expiresAt: now.toISOString() }) }),
    );
    // expiresAt was computed strictly before guard evaluation's own timestamp,
    // so it must never be treated as valid.
    expect(result.decision).toBe('BLOCK');
  });

  it('allows future expiry', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    const result = guard.evaluate(ctx({ buildAuthority: validEvidence({ expiresAt: future }) }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows omitted expiresAt', () => {
    const result = guard.evaluate(ctx({ buildAuthority: validEvidence({ expiresAt: undefined }) }));
    expect(result.decision).toBe('ALLOW');
  });
});

describe('BuildAuthorityGuard -- valid evidence', () => {
  const guard = new BuildAuthorityGuard();

  it('allows a valid file-scoped mutating BUILD action', () => {
    const result = guard.evaluate(ctx());
    expect(result.decision).toBe('ALLOW');
  });

  it('does not bypass authority for a lowercase BUILD phase alias', () => {
    const result = guard.evaluate(ctx({
      phase: 'build' as unknown as GuardRequestContext['phase'],
      buildAuthority: undefined,
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks malformed empty action in BUILD', () => {
    const result = guard.evaluate(ctx({ action: '' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('never grants execution beyond its own prerequisite (guard result carries no wider authority field)', () => {
    const result = guard.evaluate(ctx());
    expect(result.decision).toBe('ALLOW');
    expect(result.guardId).toBe('build_authority');
    expect(Object.keys(result)).not.toContain('grantsExecution');
  });
});

describe('BuildAuthorityGuard -- shared factory registration', () => {
  it('is mandatory and present in createGuardEngine()', () => {
    expect(MANDATORY_GUARD_IDS).toContain('build_authority');
    const engine = createGuardEngine();
    expect(engine.getGuard('build_authority')).toBeDefined();
  });

  it('rejects disableGuard for build_authority', () => {
    const engine = new GuardRuntimeEngine();
    engine.registerGuard(new BuildAuthorityGuard());
    expect(() => engine.disableGuard('build_authority')).toThrow(/mandatory/i);
  });

  it('rejects unregisterGuard for build_authority', () => {
    const engine = new GuardRuntimeEngine();
    engine.registerGuard(new BuildAuthorityGuard());
    expect(() => engine.unregisterGuard('build_authority')).toThrow(/mandatory/i);
  });
});

describe('BuildAuthorityGuard -- full-engine composition', () => {
  it('blocks a mutation with valid ai_commit metadata but missing BUILD authority', () => {
    const engine = createGuardEngine();
    const result = engine.evaluate({
      requestId: 'req-full-1',
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'AI_AGENT',
      action: 'modify component',
      targetFiles: ['src/app/a.ts'],
      metadata: {
        ai_commit: { commitId: 'c1', agentId: 'agent-1', timestamp: Date.now() },
      },
    });

    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('build_authority');
  });

  it('does not reopen a block already issued by another mandatory guard', () => {
    const engine = createGuardEngine();
    // OBSERVER is forbidden from BUILD by authority_gate regardless of build authority evidence.
    const result = engine.evaluate({
      requestId: 'req-full-2',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'OBSERVER',
      agentId: 'agent-2',
      action: 'modify component',
      targetFiles: ['src/app/a.ts'],
      buildAuthority: validEvidence(),
      metadata: {
        ai_commit: { commitId: 'c2', agentId: 'agent-2', timestamp: Date.now() },
      },
    });

    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).not.toBe('build_authority');
  });

  it('allows a fully valid mutating BUILD request end to end', () => {
    const engine = createGuardEngine();
    const result = engine.evaluate({
      requestId: 'req-full-3',
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'AI_AGENT',
      agentId: 'agent-3',
      action: 'modify component',
      targetFiles: ['src/app/a.ts'],
      buildAuthority: validEvidence(),
      metadata: {
        ai_commit: { commitId: 'c3', agentId: 'agent-3', timestamp: Date.now() },
      },
    });

    expect(result.finalDecision).toBe('ALLOW');
  });
});
