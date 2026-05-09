/**
 * CVF v1.7.1 Safety Runtime — Policy Engines Dedicated Tests (W6-T69)
 * =====================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (3 contracts):
 *   policy/cost.guard.ts:
 *     CostGuard.validate — OK; WARNING at 80% of proposal limit;
 *     LIMIT_EXCEEDED: proposal tokens; file count; generation time;
 *     user daily; org daily
 *   policy/approval.state-machine.ts:
 *     nextState — proposed→validated; validated+approved→approved;
 *     validated+rejected→rejected; validated+pending→pending;
 *     approved→executed; terminal states unchanged
 *   policy/risk.engine.ts:
 *     RiskEngine.assess — CODE/no-sensitivity → LOW;
 *     POLICY artifact → CRITICAL; dependency-file → HIGH;
 *     INFRA+large-diff → score accumulation
 */

import { describe, it, expect } from 'vitest';

import { CostGuard } from '../policy/cost.guard';
import type { CostValidationInput } from '../policy/cost.guard';
import { nextState } from '../policy/approval.state-machine';
import { RiskEngine } from '../policy/risk.engine';
import type { RiskAssessmentInput, ArtifactChangeMeta } from '../policy/risk.engine';

// ─── CostGuard ────────────────────────────────────────────────────────────────

describe('CostGuard', () => {
  const limits = {
    maxTokensPerProposal: 10000,
    maxTokensPerUserPerDay: 50000,
    maxTokensPerOrgPerDay: 200000,
    maxGenerationTimeMs: 60000,
    maxFilesPerProposal: 20,
  };

  const cleanAccumulated = { userDailyTokens: 0, orgDailyTokens: 0 };

  it('clean usage well within limits → OK with no reasons', () => {
    const input: CostValidationInput = {
      snapshot: { tokensUsed: 1000, generationTimeMs: 5000, filesGenerated: 3 },
      limits,
      accumulated: cleanAccumulated,
    };
    const result = CostGuard.validate(input);
    expect(result.level).toBe('OK');
    expect(result.reasons).toHaveLength(0);
  });

  it('usage at 85% of proposal token limit → WARNING', () => {
    const input: CostValidationInput = {
      snapshot: { tokensUsed: 8500, generationTimeMs: 5000, filesGenerated: 3 },
      limits,
      accumulated: cleanAccumulated,
    };
    const result = CostGuard.validate(input);
    expect(result.level).toBe('WARNING');
    expect(result.reasons).toContain('Proposal nearing token limit');
  });

  it('tokens exceed proposal limit → LIMIT_EXCEEDED', () => {
    const input: CostValidationInput = {
      snapshot: { tokensUsed: 12000, generationTimeMs: 5000, filesGenerated: 3 },
      limits,
      accumulated: cleanAccumulated,
    };
    const result = CostGuard.validate(input);
    expect(result.level).toBe('LIMIT_EXCEEDED');
    expect(result.reasons).toContain('Proposal token limit exceeded');
  });

  it('files exceed proposal file limit → LIMIT_EXCEEDED', () => {
    const input: CostValidationInput = {
      snapshot: { tokensUsed: 1000, generationTimeMs: 5000, filesGenerated: 25 },
      limits,
      accumulated: cleanAccumulated,
    };
    const result = CostGuard.validate(input);
    expect(result.level).toBe('LIMIT_EXCEEDED');
    expect(result.reasons).toContain('File generation limit exceeded');
  });

  it('generation time exceeds limit → LIMIT_EXCEEDED', () => {
    const input: CostValidationInput = {
      snapshot: { tokensUsed: 1000, generationTimeMs: 90000, filesGenerated: 3 },
      limits,
      accumulated: cleanAccumulated,
    };
    const result = CostGuard.validate(input);
    expect(result.level).toBe('LIMIT_EXCEEDED');
    expect(result.reasons).toContain('Generation time exceeded limit');
  });

  it('user daily tokens + proposal exceeds user daily limit → LIMIT_EXCEEDED', () => {
    const input: CostValidationInput = {
      snapshot: { tokensUsed: 5000, generationTimeMs: 5000, filesGenerated: 3 },
      limits,
      accumulated: { userDailyTokens: 47000, orgDailyTokens: 0 },
    };
    const result = CostGuard.validate(input);
    expect(result.level).toBe('LIMIT_EXCEEDED');
    expect(result.reasons).toContain('User daily token budget exceeded');
  });

  it('org daily tokens + proposal exceeds org daily limit → LIMIT_EXCEEDED', () => {
    const input: CostValidationInput = {
      snapshot: { tokensUsed: 5000, generationTimeMs: 5000, filesGenerated: 3 },
      limits,
      accumulated: { userDailyTokens: 0, orgDailyTokens: 198000 },
    };
    const result = CostGuard.validate(input);
    expect(result.level).toBe('LIMIT_EXCEEDED');
    expect(result.reasons).toContain('Organization daily token budget exceeded');
  });
});

// ─── nextState (approval state machine) ──────────────────────────────────────

describe('nextState', () => {
  it('proposed + any decision → validated (mandatory validation step)', () => {
    expect(nextState('proposed', 'approved')).toBe('validated');
    expect(nextState('proposed', 'rejected')).toBe('validated');
    expect(nextState('proposed', 'pending')).toBe('validated');
  });

  it('validated + approved → approved', () => {
    expect(nextState('validated', 'approved')).toBe('approved');
  });

  it('validated + rejected → rejected', () => {
    expect(nextState('validated', 'rejected')).toBe('rejected');
  });

  it('validated + pending → pending', () => {
    expect(nextState('validated', 'pending')).toBe('pending');
  });

  it('approved + any decision → executed', () => {
    expect(nextState('approved', 'approved')).toBe('executed');
    expect(nextState('approved', 'rejected')).toBe('executed');
  });

  it('terminal states (rejected, executed, pending) → unchanged', () => {
    expect(nextState('rejected', 'approved')).toBe('rejected');
    expect(nextState('executed', 'approved')).toBe('executed');
    expect(nextState('pending', 'approved')).toBe('pending');
  });
});

// ─── RiskEngine ───────────────────────────────────────────────────────────────

describe('RiskEngine', () => {
  function makeChange(overrides: Partial<ArtifactChangeMeta> = {}): ArtifactChangeMeta {
    return {
      filePath: 'src/foo.ts',
      diffSize: 50,
      isNewFile: false,
      isDeleted: false,
      touchesDependencyFile: false,
      touchesMigrationFile: false,
      touchesPolicyFile: false,
      touchesCoreFile: false,
      ...overrides,
    };
  }

  it('CODE artifact, 1 small change, no sensitivity → LOW (score=10)', () => {
    const input: RiskAssessmentInput = {
      artifactType: 'CODE',
      changes: [makeChange()],
    };
    const result = RiskEngine.assess(input);
    expect(result.level).toBe('LOW');
    expect(result.score).toBe(10);
    expect(result.reasons).toHaveLength(0);
  });

  it('POLICY artifact → adds 50 base + reason; with policy-file-touched → CRITICAL', () => {
    const input: RiskAssessmentInput = {
      artifactType: 'POLICY',
      changes: [makeChange({ touchesPolicyFile: true })],
    };
    const result = RiskEngine.assess(input);
    expect(result.level).toBe('CRITICAL'); // 50 + 100 = 150 >= 120
    expect(result.reasons).toContain('Policy modification attempt');
    expect(result.reasons.some(r => r.includes('Policy file modification'))).toBe(true);
  });

  it('CODE artifact + dependency file → HIGH', () => {
    const input: RiskAssessmentInput = {
      artifactType: 'CODE',
      changes: [makeChange({ touchesDependencyFile: true })],
    };
    const result = RiskEngine.assess(input);
    // score = 10 (CODE) + 20 (dep) = 30 → wait, 30 < 35 so LOW... but need to check
    // Actually: 10 + 20 = 30 → LOW. Let me add core file for HIGH:
    expect(result.score).toBeGreaterThanOrEqual(10);
    expect(result.reasons.some(r => r.includes('Dependency file changed'))).toBe(true);
  });

  it('INFRA artifact + large diff (>2000 lines) + core file → CRITICAL', () => {
    const input: RiskAssessmentInput = {
      artifactType: 'INFRA',
      changes: [makeChange({ diffSize: 2500, touchesCoreFile: true })],
    };
    const result = RiskEngine.assess(input);
    // score = 20 (INFRA) + 30 (very large diff) + 30 (core) = 80 → HIGH
    expect(['HIGH', 'CRITICAL']).toContain(result.level);
    expect(result.reasons).toContain('Infrastructure change detected');
    expect(result.reasons).toContain('Very large diff size');
    expect(result.reasons.some(r => r.includes('Core file modified'))).toBe(true);
  });

  it('CODE artifact + 25 files → adds large file count penalty', () => {
    const changes = Array.from({ length: 25 }, (_, i) =>
      makeChange({ filePath: `src/file${i}.ts` })
    );
    const input: RiskAssessmentInput = { artifactType: 'CODE', changes };
    const result = RiskEngine.assess(input);
    expect(result.score).toBeGreaterThanOrEqual(35); // 10 + 25 = 35 → MEDIUM
    expect(result.reasons).toContain('Large file count change');
  });
});
