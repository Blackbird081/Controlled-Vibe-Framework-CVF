/**
 * CVF v1.7.1 Safety Runtime — Contract Validator, Domain Lock Engine &
 * Dev-Automation Risk Scorer Tests (W6-T77)
 * ====================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (3 contracts):
 *   kernel/02_contract_runtime/contract_validator.ts:
 *     ContractValidator.validateDefinition — undefined→no throw;
 *       requiredFields=[]→throws; non-empty→no throw
 *     ContractValidator.validateIOContract — missing ids→throws;
 *       domain mismatch→throws; valid+matching domain→no throw
 *   kernel/01_domain_lock/domain_lock_engine.ts:
 *     DomainLockEngine.lock — valid analytical→returns context;
 *       valid creative→creative_allowed=true; unknown domain→throws;
 *       classifier mismatch→throws
 *   skills/dev-automation/risk.scorer.ts:
 *     scoreRisk — clean ADMIN→totalScore=0; high-risk keyword→keywordRisk+=40;
 *       long instruction→lengthRisk>0; devMode=true→devAutomationRisk=15
 */

import { describe, it, expect } from 'vitest';

import { ContractValidator } from '../kernel-architecture/kernel/02_contract_runtime/contract_validator';
import { DomainLockEngine } from '../kernel-architecture/kernel/01_domain_lock/domain_lock_engine';
import { scoreRisk } from '../skills/dev-automation/risk.scorer';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeIOContract(overrides: Record<string, unknown> = {}) {
  return {
    contract_id: 'c1',
    domain_id: 'analytical',
    expected_output_format: 'text' as const,
    max_tokens: 100,
    allow_external_links: false,
    allow_code_blocks: false,
    ...overrides,
  };
}

// ─── ContractValidator ───────────────────────────────────────────────────────

describe('ContractValidator.validateDefinition', () => {
  const validator = new ContractValidator();

  it('undefined definition → no throw', () => {
    expect(() => validator.validateDefinition(undefined)).not.toThrow();
  });

  it('requiredFields=[] (defined but empty) → throws "requiredFields cannot be empty"', () => {
    expect(() => validator.validateDefinition({ requiredFields: [] })).toThrow(
      'requiredFields cannot be empty',
    );
  });

  it('non-empty requiredFields → no throw', () => {
    expect(() =>
      validator.validateDefinition({ requiredFields: ['id', 'action'] }),
    ).not.toThrow();
  });
});

describe('ContractValidator.validateIOContract', () => {
  const validator = new ContractValidator();

  it('missing contract_id → throws "missing identifiers"', () => {
    expect(() =>
      validator.validateIOContract(makeIOContract({ contract_id: '' }) as any),
    ).toThrow('missing identifiers');
  });

  it('declaredDomain mismatch → throws with both domain names in message', () => {
    expect(() =>
      validator.validateIOContract(makeIOContract({ domain_id: 'analytical' }) as any, 'creative'),
    ).toThrow(/analytical.*creative|creative.*analytical/);
  });

  it('valid contract + matching declaredDomain → no throw', () => {
    expect(() =>
      validator.validateIOContract(makeIOContract() as any, 'analytical'),
    ).not.toThrow();
  });
});

// ─── DomainLockEngine ────────────────────────────────────────────────────────

describe('DomainLockEngine.lock', () => {
  const engine = new DomainLockEngine();

  it('valid analytical: "phân tích" → context with domain_type="analytical"', () => {
    const ctx = engine.lock({
      message: 'phân tích dữ liệu này',
      declaredDomain: 'analytical',
      inputClass: 'text',
    });
    expect(ctx.domain_type).toBe('analytical');
    expect(ctx.risk_ceiling).toBe('low');
    expect(ctx.creative_allowed).toBe(false);
  });

  it('valid creative: "sáng tác" → context with creative_allowed=true', () => {
    const ctx = engine.lock({
      message: 'sáng tác bài thơ về mùa xuân',
      declaredDomain: 'creative',
      inputClass: 'text',
    });
    expect(ctx.domain_type).toBe('creative');
    expect(ctx.creative_allowed).toBe(true);
    expect(ctx.risk_ceiling).toBe('medium');
  });

  it('unknown declared domain → throws "Unknown declared domain"', () => {
    expect(() =>
      engine.lock({ message: 'any text', declaredDomain: 'unknown-domain' }),
    ).toThrow('Unknown declared domain');
  });

  it('classifier mismatch: declared=analytical but text classifies as creative → throws', () => {
    expect(() =>
      engine.lock({
        message: 'sáng tác bài thơ',   // classifier → creative
        declaredDomain: 'analytical',
      }),
    ).toThrow('mismatches');
  });
});

// ─── skills/dev-automation/risk.scorer ───────────────────────────────────────

describe('scoreRisk', () => {
  it('clean instruction + ADMIN role → totalScore=0', () => {
    const result = scoreRisk({ instruction: 'list all users', role: 'ADMIN' });
    expect(result.totalScore).toBe(0);
    expect(result.breakdown.keywordRisk).toBe(0);
    expect(result.breakdown.roleRisk).toBe(0);
  });

  it('"delete" keyword → keywordRisk += 40', () => {
    const result = scoreRisk({ instruction: 'delete all records', role: 'ADMIN' });
    expect(result.breakdown.keywordRisk).toBe(40);
    expect(result.totalScore).toBeGreaterThanOrEqual(40);
  });

  it('instruction > 1000 chars → lengthRisk = 10', () => {
    const result = scoreRisk({ instruction: 'x'.repeat(1001), role: 'ADMIN' });
    expect(result.breakdown.lengthRisk).toBe(10);
  });

  it('devMode=true → devAutomationRisk = 15', () => {
    const result = scoreRisk({
      instruction: 'run deployment',
      role: 'ADMIN',
      devMode: true,
    });
    expect(result.breakdown.devAutomationRisk).toBe(15);
    expect(result.totalScore).toBeGreaterThanOrEqual(15);
  });
});
