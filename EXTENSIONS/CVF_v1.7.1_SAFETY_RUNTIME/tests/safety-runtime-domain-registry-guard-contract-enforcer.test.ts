/**
 * CVF v1.7.1 Safety Runtime — DomainRegistry, DomainGuard & ContractEnforcer Tests (W6-T84)
 * ===========================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (3 contracts):
 *   kernel/01_domain_lock/domain.registry.ts:
 *     DomainRegistry — bootstraps 6 domains on construction; get known→definition;
 *       get unknown→undefined; exists true/false; list returns all 6;
 *       register duplicate→throws
 *   kernel/01_domain_lock/domain_guard.ts:
 *     DomainGuard.validate — no domain→invalid; unknown domain→invalid;
 *       wrong input type→invalid; valid domain+type→valid+domain name
 *     DomainGuard.enforce — valid→no throw; invalid→throws "Domain violation"
 *   kernel/02_contract_runtime/contract_enforcer.ts:
 *     ContractEnforcer.validateInput — no contract→no throw; missing required field→throws;
 *       type not in allowedTypes→throws
 *     ContractEnforcer.validateOutput — no contract→no throw; wrong outputType→throws
 *     ContractEnforcer.enforce — valid IO contract + short output→returns output;
 *       output exceeds max_tokens*4→throws
 */

import { describe, it, expect } from 'vitest';

import { DomainRegistry } from '../kernel-architecture/kernel/01_domain_lock/domain.registry';
import { DomainGuard } from '../kernel-architecture/kernel/01_domain_lock/domain_guard';
import { ContractEnforcer } from '../kernel-architecture/kernel/02_contract_runtime/contract_enforcer';
import type { IOContract } from '../kernel-architecture/kernel/02_contract_runtime/contract.types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeIOContract(overrides: Partial<IOContract> = {}): IOContract {
  return {
    contract_id: 'c1',
    domain_id: 'analytical',
    expected_output_format: 'text',
    max_tokens: 100,
    allow_external_links: false,
    allow_code_blocks: false,
    ...overrides,
  };
}

// ─── DomainRegistry ───────────────────────────────────────────────────────────

describe('DomainRegistry', () => {
  it('constructor bootstraps 6 built-in domains', () => {
    const registry = new DomainRegistry();
    expect(registry.list()).toHaveLength(6);
  });

  it('get("analytical") → definition with riskTolerance="medium"', () => {
    const registry = new DomainRegistry();
    const domain = registry.get('analytical');
    expect(domain).toBeDefined();
    expect(domain?.riskTolerance).toBe('medium');
  });

  it('get("restricted") → definition with empty allowedInputTypes', () => {
    const registry = new DomainRegistry();
    const domain = registry.get('restricted');
    expect(domain?.allowedInputTypes).toHaveLength(0);
  });

  it('get unknown domain → undefined', () => {
    const registry = new DomainRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('exists("creative") → true; exists("unknown") → false', () => {
    const registry = new DomainRegistry();
    expect(registry.exists('creative')).toBe(true);
    expect(registry.exists('unknown')).toBe(false);
  });

  it('register duplicate domain → throws "Domain already exists"', () => {
    const registry = new DomainRegistry();
    expect(() =>
      registry.register({
        name: 'analytical',
        description: 'duplicate',
        allowedInputTypes: [],
        allowedOutputTypes: [],
        riskTolerance: 'low',
      })
    ).toThrow('Domain already exists');
  });
});

// ─── DomainGuard ─────────────────────────────────────────────────────────────

describe('DomainGuard.validate', () => {
  const guard = new DomainGuard();

  it('input with no domain → valid=false, reason includes "Missing"', () => {
    const result = guard.validate({ type: 'question' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing');
  });

  it('unknown domain → valid=false, reason includes "Unknown domain"', () => {
    const result = guard.validate({ domain: 'nonexistent', type: 'question' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Unknown domain');
  });

  it('known domain + disallowed input type → valid=false', () => {
    // "analytical" allows question/data/clarification — "prompt" is not allowed
    const result = guard.validate({ domain: 'analytical', type: 'prompt' });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not allowed');
  });

  it('known domain + allowed input type → valid=true, domain name set', () => {
    // "analytical" allows "question"
    const result = guard.validate({ domain: 'analytical', type: 'question' });
    expect(result.valid).toBe(true);
    expect(result.domain).toBe('analytical');
  });
});

describe('DomainGuard.enforce', () => {
  const guard = new DomainGuard();

  it('valid input → no throw', () => {
    expect(() => guard.enforce({ domain: 'analytical', type: 'question' })).not.toThrow();
  });

  it('invalid input → throws "Domain violation"', () => {
    expect(() => guard.enforce({ type: 'question' })).toThrow('Domain violation');
  });
});

// ─── ContractEnforcer ─────────────────────────────────────────────────────────

describe('ContractEnforcer.validateInput', () => {
  const enforcer = new ContractEnforcer();

  it('no contract → no throw', () => {
    expect(() => enforcer.validateInput({ type: 'question' }, undefined)).not.toThrow();
  });

  it('contract with requiredFields; input missing field → throws "missing field"', () => {
    expect(() =>
      enforcer.validateInput(
        { type: 'question' },
        { requiredFields: ['userId'] }
      )
    ).toThrow("missing field 'userId'");
  });

  it('contract with allowedTypes; input.type not in list → throws "not allowed"', () => {
    expect(() =>
      enforcer.validateInput(
        { type: 'unknown-type' },
        { requiredFields: ['type'], allowedTypes: ['question', 'data'] }
      )
    ).toThrow("not allowed");
  });
});

describe('ContractEnforcer.validateOutput', () => {
  const enforcer = new ContractEnforcer();

  it('no contract → no throw', () => {
    expect(() => enforcer.validateOutput({ type: 'text' }, undefined)).not.toThrow();
  });

  it('contract.outputType mismatch → throws "output type"', () => {
    expect(() =>
      enforcer.validateOutput({ type: 'json' }, { outputType: 'text' })
    ).toThrow('output type');
  });
});

describe('ContractEnforcer.enforce', () => {
  const enforcer = new ContractEnforcer();

  it('valid IO contract + short output → returns output unchanged', () => {
    const output = 'This is a short answer.';
    const result = enforcer.enforce(output, makeIOContract());
    expect(result).toBe(output);
  });

  it('output length > max_tokens * 4 → throws "Contract violation"', () => {
    // max_tokens=100 → limit=400 chars; "x".repeat(500) > 400 → fails
    expect(() =>
      enforcer.enforce('x'.repeat(500), makeIOContract({ max_tokens: 100 }))
    ).toThrow('Contract violation');
  });
});
