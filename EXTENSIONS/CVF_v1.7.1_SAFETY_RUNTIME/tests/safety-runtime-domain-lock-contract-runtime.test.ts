/**
 * CVF v1.7.1 Safety Runtime — Domain Lock & Contract Runtime Layer Tests (W6-T75)
 * ==================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (7 contracts):
 *   kernel/01_domain_lock/scope_resolver.ts:
 *     ScopeResolver.resolve — analytical→low/no-creative; creative→medium/creative-allowed;
 *       sensitive→high/no-creative
 *   kernel/01_domain_lock/domain_classifier.ts:
 *     DomainClassifier.classify — Vietnamese keywords → creative/analytical/procedural/sensitive;
 *       generic → informational
 *   kernel/01_domain_lock/boundary_rules.ts:
 *     BoundaryRules.validateInput — restricted domain→false; empty input→false; valid→true
 *   kernel/02_contract_runtime/consumer_authority_matrix.ts:
 *     ConsumerAuthorityMatrix.isConsumerAllowed — default list (assistant→true, user→false);
 *       explicit allowed_consumers override
 *   kernel/02_contract_runtime/output_validator.ts:
 *     OutputValidator.validate — empty→false; code-blocks blocked; links blocked;
 *       too-long→false; json-format invalid→false; valid text→true
 *   kernel/02_contract_runtime/transformation_guard.ts:
 *     TransformationGuard.validate — allow_transform=false+requested→throws;
 *       allow_transform=false+not-requested→no throw
 *   kernel/02_contract_runtime/io_contract_registry.ts:
 *     IOContractRegistry — register+get; register-duplicate throws; upsert replaces
 */

import { describe, it, expect } from 'vitest';

import { ScopeResolver } from '../kernel-architecture/kernel/01_domain_lock/scope_resolver';
import { DomainClassifier } from '../kernel-architecture/kernel/01_domain_lock/domain_classifier';
import { BoundaryRules } from '../kernel-architecture/kernel/01_domain_lock/boundary_rules';
import { ConsumerAuthorityMatrix } from '../kernel-architecture/kernel/02_contract_runtime/consumer_authority_matrix';
import { OutputValidator } from '../kernel-architecture/kernel/02_contract_runtime/output_validator';
import { TransformationGuard } from '../kernel-architecture/kernel/02_contract_runtime/transformation_guard';
import { IOContractRegistry } from '../kernel-architecture/kernel/02_contract_runtime/io_contract_registry';
import type { DomainContextObject } from '../kernel-architecture/kernel/01_domain_lock/domain_context_object';
import type { IOContract } from '../kernel-architecture/kernel/02_contract_runtime/contract.types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeCtx(domain_type: DomainContextObject['domain_type']): DomainContextObject {
  return {
    domain_id: 'test',
    domain_type,
    input_class: 'text',
    allowed_output_types: ['text'],
    risk_ceiling: 'low',
    boundary_conditions: [],
    refusal_policy_id: 'v1',
    creative_allowed: false,
  };
}

function makeContract(overrides: Partial<IOContract> = {}): IOContract {
  return {
    contract_id: 'c1',
    domain_id: 'd1',
    expected_output_format: 'text',
    max_tokens: 500,
    allow_external_links: true,
    allow_code_blocks: true,
    ...overrides,
  };
}

// ─── ScopeResolver ───────────────────────────────────────────────────────────

describe('ScopeResolver.resolve', () => {
  const resolver = new ScopeResolver();

  it('analytical domain → risk_ceiling="low", creative_allowed=false', () => {
    const result = resolver.resolve(makeCtx('analytical'));
    expect(result.risk_ceiling).toBe('low');
    expect(result.creative_allowed).toBe(false);
  });

  it('creative domain → risk_ceiling="medium", creative_allowed=true', () => {
    const result = resolver.resolve(makeCtx('creative'));
    expect(result.risk_ceiling).toBe('medium');
    expect(result.creative_allowed).toBe(true);
  });

  it('sensitive domain → risk_ceiling="high", creative_allowed=false', () => {
    const result = resolver.resolve(makeCtx('sensitive'));
    expect(result.risk_ceiling).toBe('high');
    expect(result.creative_allowed).toBe(false);
  });
});

// ─── DomainClassifier ────────────────────────────────────────────────────────

describe('DomainClassifier.classify', () => {
  const classifier = new DomainClassifier();

  it('"sáng tác" keyword → "creative"', () => {
    expect(classifier.classify('hãy sáng tác một bài thơ')).toBe('creative');
  });

  it('"phân tích" keyword → "analytical"', () => {
    expect(classifier.classify('phân tích dữ liệu này')).toBe('analytical');
  });

  it('"hướng dẫn" keyword → "procedural"', () => {
    expect(classifier.classify('hướng dẫn tôi cách làm')).toBe('procedural');
  });

  it('"nhạy cảm" keyword → "sensitive"', () => {
    expect(classifier.classify('thông tin nhạy cảm về tài chính')).toBe('sensitive');
  });

  it('generic input → "informational"', () => {
    expect(classifier.classify('hello world')).toBe('informational');
  });
});

// ─── BoundaryRules ───────────────────────────────────────────────────────────

describe('BoundaryRules.validateInput', () => {
  const rules = new BoundaryRules();

  it('restricted domain → returns false', () => {
    expect(rules.validateInput('hello', makeCtx('restricted'))).toBe(false);
  });

  it('empty input → returns false', () => {
    expect(rules.validateInput('', makeCtx('analytical'))).toBe(false);
  });

  it('valid input + non-restricted domain → returns true', () => {
    expect(rules.validateInput('analyze this', makeCtx('analytical'))).toBe(true);
  });
});

// ─── ConsumerAuthorityMatrix ─────────────────────────────────────────────────

describe('ConsumerAuthorityMatrix.isConsumerAllowed', () => {
  const matrix = new ConsumerAuthorityMatrix();

  it('no explicit consumers (default list) → assistant allowed', () => {
    expect(matrix.isConsumerAllowed(makeContract())).toBe(true); // default role = assistant
  });

  it('no explicit consumers → user not in default list → false', () => {
    expect(matrix.isConsumerAllowed(makeContract(), 'user')).toBe(false);
  });

  it('explicit allowed_consumers override → user allowed when listed', () => {
    const contract = makeContract({ allowed_consumers: ['user', 'assistant'] });
    expect(matrix.isConsumerAllowed(contract, 'user')).toBe(true);
    expect(matrix.isConsumerAllowed(contract, 'integration')).toBe(false);
  });
});

// ─── OutputValidator ─────────────────────────────────────────────────────────

describe('OutputValidator.validate', () => {
  const validator = new OutputValidator();

  it('empty output → false', () => {
    expect(validator.validate('', makeContract())).toBe(false);
  });

  it('output with code block + allow_code_blocks=false → false', () => {
    const contract = makeContract({ allow_code_blocks: false });
    expect(validator.validate('here ```code```', contract)).toBe(false);
  });

  it('output with http link + allow_external_links=false → false', () => {
    const contract = makeContract({ allow_external_links: false });
    expect(validator.validate('see http://example.com', contract)).toBe(false);
  });

  it('output length > max_tokens * 4 → false', () => {
    const contract = makeContract({ max_tokens: 5 }); // limit = 20 chars
    expect(validator.validate('x'.repeat(21), contract)).toBe(false);
  });

  it('expected_output_format="json" + invalid JSON → false', () => {
    const contract = makeContract({ expected_output_format: 'json' });
    expect(validator.validate('not json', contract)).toBe(false);
  });

  it('valid text output satisfying all constraints → true', () => {
    const contract = makeContract({ allow_code_blocks: true, allow_external_links: true });
    expect(validator.validate('clean output text', contract)).toBe(true);
  });
});

// ─── TransformationGuard ─────────────────────────────────────────────────────

describe('TransformationGuard.validate', () => {
  const guard = new TransformationGuard();

  it('allow_transform=false + transformRequested=true → throws contract violation', () => {
    const contract = makeContract({ contract_id: 'no-transform', allow_transform: false });
    expect(() => guard.validate(contract, true)).toThrow('no-transform');
  });

  it('allow_transform=false + transformRequested=false → no throw', () => {
    const contract = makeContract({ allow_transform: false });
    expect(() => guard.validate(contract, false)).not.toThrow();
  });
});

// ─── IOContractRegistry ──────────────────────────────────────────────────────

describe('IOContractRegistry', () => {
  it('register + get returns the registered contract', () => {
    const registry = new IOContractRegistry();
    const contract = makeContract({ contract_id: 'io-1' });
    registry.register(contract);
    expect(registry.get('io-1')).toBe(contract);
  });

  it('register duplicate contract_id → throws "IO contract already exists"', () => {
    const registry = new IOContractRegistry();
    registry.register(makeContract({ contract_id: 'dup' }));
    expect(() => registry.register(makeContract({ contract_id: 'dup' }))).toThrow(
      'IO contract already exists',
    );
  });

  it('upsert replaces existing contract', () => {
    const registry = new IOContractRegistry();
    registry.register(makeContract({ contract_id: 'upsert-id', max_tokens: 100 }));
    registry.upsert(makeContract({ contract_id: 'upsert-id', max_tokens: 999 }));
    expect(registry.get('upsert-id')?.max_tokens).toBe(999);
  });
});
