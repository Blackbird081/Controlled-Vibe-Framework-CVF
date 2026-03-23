/**
 * CVF v1.7.1 Safety Runtime — Contract Runtime Dedicated Tests (W6-T60)
 * ======================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (4 kernel/02_contract_runtime pure-logic contracts):
 *   contract_validator.ts:
 *     validateDefinition (undefined ok, non-empty ok, empty requiredFields throws)
 *     validateIOContract (valid ok, missing ids throws, domain mismatch throws)
 *   io_contract_registry.ts:
 *     register (immutable), get (found/undefined), upsert (overwrite)
 *   output_validator.ts:
 *     empty output, code block guard, external link guard,
 *     max_tokens guard, JSON format guard, valid output passes
 *   transformation_guard.ts:
 *     transform disabled + requested → throws; transform allowed → passes
 *   consumer_authority_matrix.ts:
 *     default allowed consumers, user not in default, explicit allowed_consumers
 */

import { describe, it, expect } from 'vitest';

import { ContractValidator } from '../kernel-architecture/kernel/02_contract_runtime/contract_validator';
import { IOContractRegistry } from '../kernel-architecture/kernel/02_contract_runtime/io_contract_registry';
import { OutputValidator } from '../kernel-architecture/kernel/02_contract_runtime/output_validator';
import { TransformationGuard } from '../kernel-architecture/kernel/02_contract_runtime/transformation_guard';
import { ConsumerAuthorityMatrix } from '../kernel-architecture/kernel/02_contract_runtime/consumer_authority_matrix';
import type { IOContract } from '../kernel-architecture/kernel/02_contract_runtime/contract.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeContract(overrides: Partial<IOContract> = {}): IOContract {
  return {
    contract_id: overrides.contract_id ?? 'c-001',
    domain_id: overrides.domain_id ?? 'domain-A',
    expected_output_format: overrides.expected_output_format ?? 'text',
    max_tokens: overrides.max_tokens ?? 500,
    allow_external_links: overrides.allow_external_links ?? true,
    allow_code_blocks: overrides.allow_code_blocks ?? true,
    allow_transform: overrides.allow_transform,
    allowed_consumers: overrides.allowed_consumers,
    strict_schema: overrides.strict_schema,
  };
}

// ─── ContractValidator ────────────────────────────────────────────────────────

describe('ContractValidator', () => {
  const validator = new ContractValidator();

  it('validateDefinition(undefined) → no throw', () => {
    expect(() => validator.validateDefinition(undefined)).not.toThrow();
  });

  it('validateDefinition with non-empty requiredFields → no throw', () => {
    expect(() =>
      validator.validateDefinition({ requiredFields: ['id', 'payload'] })
    ).not.toThrow();
  });

  it('validateDefinition with empty requiredFields → throws', () => {
    expect(() =>
      validator.validateDefinition({ requiredFields: [] })
    ).toThrow('requiredFields cannot be empty');
  });

  it('validateIOContract with valid contract and no declaredDomain → no throw', () => {
    expect(() =>
      validator.validateIOContract(makeContract())
    ).not.toThrow();
  });

  it('validateIOContract with missing contract_id → throws "missing identifiers"', () => {
    const contract = makeContract({ contract_id: '' });
    expect(() => validator.validateIOContract(contract)).toThrow('missing identifiers');
  });

  it('validateIOContract with domain mismatch → throws domain mismatch error', () => {
    const contract = makeContract({ domain_id: 'domain-B' });
    expect(() => validator.validateIOContract(contract, 'domain-A')).toThrow(
      "domain 'domain-B' mismatches 'domain-A'"
    );
  });
});

// ─── IOContractRegistry ───────────────────────────────────────────────────────

describe('IOContractRegistry', () => {
  it('register + get returns the stored contract', () => {
    const registry = new IOContractRegistry();
    const contract = makeContract({ contract_id: 'reg-001' });
    registry.register(contract);
    const found = registry.get('reg-001');
    expect(found).toBeDefined();
    expect(found!.contract_id).toBe('reg-001');
  });

  it('register duplicate contract_id → throws "IO contract already exists"', () => {
    const registry = new IOContractRegistry();
    registry.register(makeContract({ contract_id: 'dup-001' }));
    expect(() => registry.register(makeContract({ contract_id: 'dup-001' }))).toThrow(
      'IO contract already exists: dup-001'
    );
  });

  it('get for unknown contractId → returns undefined', () => {
    const registry = new IOContractRegistry();
    expect(registry.get('nonexistent-id')).toBeUndefined();
  });

  it('upsert overwrites existing contract', () => {
    const registry = new IOContractRegistry();
    registry.register(makeContract({ contract_id: 'up-001', max_tokens: 100 }));
    registry.upsert(makeContract({ contract_id: 'up-001', max_tokens: 500 }));
    expect(registry.get('up-001')!.max_tokens).toBe(500);
  });
});

// ─── OutputValidator ──────────────────────────────────────────────────────────

describe('OutputValidator', () => {
  const validator = new OutputValidator();

  it('empty output string → returns false', () => {
    expect(validator.validate('', makeContract())).toBe(false);
  });

  it('output with code block when allow_code_blocks=false → returns false', () => {
    const contract = makeContract({ allow_code_blocks: false });
    expect(validator.validate('```js\nconsole.log(1)\n```', contract)).toBe(false);
  });

  it('output with http link when allow_external_links=false → returns false', () => {
    const contract = makeContract({ allow_external_links: false });
    expect(validator.validate('see https://example.com', contract)).toBe(false);
  });

  it('output longer than max_tokens*4 chars → returns false', () => {
    const contract = makeContract({ max_tokens: 10 });
    expect(validator.validate('x'.repeat(41), contract)).toBe(false);
  });

  it('expected_output_format=json + invalid JSON → returns false', () => {
    const contract = makeContract({ expected_output_format: 'json' });
    expect(validator.validate('not json at all', contract)).toBe(false);
  });

  it('expected_output_format=json + valid JSON → returns true', () => {
    const contract = makeContract({ expected_output_format: 'json' });
    expect(validator.validate('{"key":"value"}', contract)).toBe(true);
  });

  it('normal text within limits → returns true', () => {
    expect(validator.validate('Hello, this is a short response.', makeContract())).toBe(true);
  });
});

// ─── TransformationGuard ─────────────────────────────────────────────────────

describe('TransformationGuard', () => {
  const guard = new TransformationGuard();

  it('allow_transform=false + transformRequested=true → throws', () => {
    const contract = makeContract({ contract_id: 'no-transform', allow_transform: false });
    expect(() => guard.validate(contract, true)).toThrow(
      "transformation is disabled for 'no-transform'"
    );
  });

  it('allow_transform=true + transformRequested=true → no throw', () => {
    const contract = makeContract({ allow_transform: true });
    expect(() => guard.validate(contract, true)).not.toThrow();
  });
});

// ─── ConsumerAuthorityMatrix ─────────────────────────────────────────────────

describe('ConsumerAuthorityMatrix', () => {
  const matrix = new ConsumerAuthorityMatrix();

  it('"assistant" is in default allowed consumers → true', () => {
    expect(matrix.isConsumerAllowed(makeContract())).toBe(true);
  });

  it('"user" is NOT in default allowed consumers → false', () => {
    expect(matrix.isConsumerAllowed(makeContract(), 'user')).toBe(false);
  });

  it('explicit allowed_consumers overrides default', () => {
    const contract = makeContract({ allowed_consumers: ['user'] });
    expect(matrix.isConsumerAllowed(contract, 'user')).toBe(true);
    expect(matrix.isConsumerAllowed(contract, 'assistant')).toBe(false);
  });
});
