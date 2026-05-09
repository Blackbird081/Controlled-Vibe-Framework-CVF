/**
 * W99-T1: OPERATOR authority matrix — non-coder verb coverage tests (OFU-1 fix)
 */
import { describe, it, expect } from 'vitest';
import { AuthorityGateGuard } from './authority-gate.guard';

const guard = new AuthorityGateGuard();

function makeCtx(action: string) {
  return {
    requestId: 'w99-test',
    agentId: 'test-agent',
    role: 'OPERATOR' as const,
    phase: 'BUILD' as const,
    action,
    riskLevel: 'R1' as const,
  };
}

describe('W99-T1 OPERATOR BUILD — non-coder action verbs (OFU-1)', () => {
  const newVerbs = [
    'design',
    'plan',
    'analyze',
    'perform',
    'assess',
    'research',
    'develop',
    'draft',
  ];

  for (const verb of newVerbs) {
    it(`OPERATOR BUILD ALLOW: intent containing "${verb}"`, () => {
      const result = guard.evaluate(makeCtx(`${verb} a user-facing feature`));
      expect(result.decision).toBe('ALLOW');
    });
  }

  it('OPERATOR BUILD still ALLOW for existing verb: create', () => {
    expect(guard.evaluate(makeCtx('create a new module')).decision).toBe('ALLOW');
  });

  it('OPERATOR BUILD still ALLOW for existing verb: build', () => {
    expect(guard.evaluate(makeCtx('build the app')).decision).toBe('ALLOW');
  });

  it('OPERATOR BUILD BLOCK for unrecognized verb: destroy', () => {
    expect(guard.evaluate(makeCtx('destroy all records')).decision).toBe('BLOCK');
  });

  it('OPERATOR INTAKE unaffected — analyze still ALLOW', () => {
    const result = guard.evaluate({
      requestId: 'w99-intake',
      agentId: 'test-agent',
      role: 'OPERATOR',
      phase: 'INTAKE',
      action: 'analyze the requirements',
      riskLevel: 'R1',
    });
    expect(result.decision).toBe('ALLOW');
  });
});
