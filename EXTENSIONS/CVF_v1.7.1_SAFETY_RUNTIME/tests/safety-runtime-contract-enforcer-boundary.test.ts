/**
 * CVF v1.7.1 Safety Runtime — Contract Enforcer, Runtime Engine & Execution Boundary Tests (W6-T66)
 * ==================================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (4 contracts):
 *   kernel/02_contract_runtime/contract_enforcer.ts:
 *     ContractEnforcer.validateInput — no-contract; missing requiredField; wrong allowedType
 *     ContractEnforcer.validateOutput — wrong outputType throws
 *     ContractEnforcer.enforce — valid output returns string; code-blocks-blocked throws
 *   kernel/02_contract_runtime/contract_runtime_engine.ts:
 *     ContractRuntimeEngine.execute — valid assistant consumer; disallowed consumer throws
 *   adapters/openclaw/provider.registry.ts:
 *     registerProvider + getProvider — returns registered adapter; unknown throws
 *   core/execution.boundary.ts:
 *     runWithinBoundary — success returns value; failure re-throws; suppressError → undefined
 */

import { describe, it, expect } from 'vitest';

import { ContractEnforcer } from '../kernel-architecture/kernel/02_contract_runtime/contract_enforcer';
import { ContractRuntimeEngine } from '../kernel-architecture/kernel/02_contract_runtime/contract_runtime_engine';
import { registerProvider, getProvider } from '../adapters/openclaw/provider.registry';
import { runWithinBoundary } from '../core/execution.boundary';
import type { IOContract } from '../kernel-architecture/kernel/02_contract_runtime/contract.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeContract(overrides: Partial<IOContract> = {}): IOContract {
  return {
    contract_id: 'test-contract',
    domain_id: 'test-domain',
    expected_output_format: 'text',
    max_tokens: 200,
    allow_external_links: true,
    allow_code_blocks: true,
    ...overrides,
  };
}

// ─── ContractEnforcer ────────────────────────────────────────────────────────

describe('ContractEnforcer', () => {
  const enforcer = new ContractEnforcer();

  it('validateInput with undefined contract → no throw', () => {
    expect(() => enforcer.validateInput({ type: 'text' }, undefined)).not.toThrow();
  });

  it('validateInput with missing requiredField → throws "missing field"', () => {
    expect(() =>
      enforcer.validateInput({ type: 'text' }, { requiredFields: ['userId'] })
    ).toThrow("Contract violation: missing field 'userId'");
  });

  it('validateInput with wrong allowedType → throws "type ... not allowed"', () => {
    expect(() =>
      enforcer.validateInput({ type: 'code' }, { allowedTypes: ['text', 'instruction'] })
    ).toThrow("Contract violation: type 'code' not allowed");
  });

  it('validateOutput with correct outputType → no throw', () => {
    expect(() =>
      enforcer.validateOutput({ type: 'text' }, { outputType: 'text' })
    ).not.toThrow();
  });

  it('validateOutput with wrong outputType → throws "output type ... invalid"', () => {
    expect(() =>
      enforcer.validateOutput({ type: 'json' }, { outputType: 'text' })
    ).toThrow("Contract violation: output type 'json' invalid");
  });

  it('enforce with valid plain text output → returns the output string', () => {
    const contract = makeContract({ allow_code_blocks: true, allow_external_links: true });
    const result = enforcer.enforce('hello world', contract);
    expect(result).toBe('hello world');
  });

  it('enforce with code blocks disallowed but output has ``` → throws', () => {
    const contract = makeContract({ allow_code_blocks: false });
    expect(() =>
      enforcer.enforce('```js\nconsole.log("x")\n```', contract)
    ).toThrow(/Contract violation/);
  });
});

// ─── ContractRuntimeEngine ───────────────────────────────────────────────────

describe('ContractRuntimeEngine', () => {
  const engine = new ContractRuntimeEngine();

  it('execute with default consumer (assistant) → returns output string', () => {
    const contract = makeContract();
    const result = engine.execute('hello world', { ioContract: contract });
    expect(result).toBe('hello world');
  });

  it('execute with explicitly allowed "system" consumer → returns output', () => {
    const contract = makeContract({ allowed_consumers: ['system'] });
    const result = engine.execute('output text', { ioContract: contract, consumerRole: 'system' });
    expect(result).toBe('output text');
  });

  it('execute with disallowed "user" consumer (not in default allowed) → throws', () => {
    const contract = makeContract({ allowed_consumers: ['assistant', 'system'] });
    expect(() =>
      engine.execute('output', { ioContract: contract, consumerRole: 'user' })
    ).toThrow(/consumer 'user' not allowed/);
  });
});

// ─── provider.registry ───────────────────────────────────────────────────────

describe('provider.registry', () => {
  it('registerProvider + getProvider → returns the registered adapter', () => {
    const mockAdapter = {
      name: 'test-provider-w66',
      sendMessage: async () => ({ content: 'ok' }),
    };
    registerProvider(mockAdapter);
    const retrieved = getProvider('test-provider-w66');
    expect(retrieved).toBe(mockAdapter);
    expect(retrieved.name).toBe('test-provider-w66');
  });

  it('getProvider with unknown name → throws "Provider X not registered"', () => {
    expect(() => getProvider('nonexistent-provider-xyz')).toThrow(
      'Provider nonexistent-provider-xyz not registered'
    );
  });
});

// ─── runWithinBoundary ────────────────────────────────────────────────────────

describe('runWithinBoundary', () => {
  it('successful fn → returns resolved value', async () => {
    const result = await runWithinBoundary(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('failing fn (no suppressError) → re-throws the original error', async () => {
    await expect(
      runWithinBoundary(() => Promise.reject(new Error('boom')))
    ).rejects.toThrow('boom');
  });

  it('failing fn with suppressError=true → returns undefined without throwing', async () => {
    const result = await runWithinBoundary(
      () => Promise.reject(new Error('suppressed')),
      { suppressError: true }
    );
    expect(result).toBeUndefined();
  });
});
