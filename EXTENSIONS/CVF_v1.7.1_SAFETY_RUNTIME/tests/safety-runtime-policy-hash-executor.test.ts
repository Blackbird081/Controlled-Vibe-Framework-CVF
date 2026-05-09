/**
 * CVF v1.7.1 Safety Runtime — Policy Hash, Policy Executor & Kernel Entrypoint Tests (W6-T70)
 * =============================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (3 contracts):
 *   policy/policy.hash.ts:
 *     generatePolicyHash — returns 64-char hex string; same inputs → same hash;
 *     different version → different hash; different rules → different hash
 *   policy/policy.executor.ts:
 *     executePolicy — first-matching rule returns decision; no-match → "pending";
 *     registered rule returning null → skipped → "pending"
 *   kernel-architecture/runtime/kernel_runtime_entrypoint.ts:
 *     KernelRuntimeEntrypoint — constructs without throw;
 *     getPolicyVersion() returns non-empty string;
 *     getTelemetry() returns object with session and policyVersion fields
 */

import { describe, it, expect } from 'vitest';

import { generatePolicyHash } from '../policy/policy.hash';
import { executePolicy } from '../policy/policy.executor';
import { registerPolicy } from '../policy/policy.registry';
import { KernelRuntimeEntrypoint } from '../kernel-architecture/runtime/kernel_runtime_entrypoint';
import type { PolicyRule, ProposalPayload } from '../types/index';
// ProposalPayload is { [key: string]: unknown } — used via makeProposal helper

// ─── generatePolicyHash ────────────────────────────────────────────────────

describe('generatePolicyHash', () => {
  function makeRule(id: string): PolicyRule {
    return {
      id,
      description: `Rule ${id}`,
      evaluate: () => null,
    };
  }

  it('returns a 64-character lowercase hex string (SHA-256)', () => {
    const hash = generatePolicyHash('v1', [makeRule('r1')]);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('same inputs → same hash (deterministic)', () => {
    const rules = [makeRule('r1'), makeRule('r2')];
    const h1 = generatePolicyHash('v1', rules);
    const h2 = generatePolicyHash('v1', rules);
    expect(h1).toBe(h2);
  });

  it('different version → different hash', () => {
    const rules = [makeRule('r1')];
    const h1 = generatePolicyHash('v1', rules);
    const h2 = generatePolicyHash('v2', rules);
    expect(h1).not.toBe(h2);
  });

  it('different rules → different hash', () => {
    const h1 = generatePolicyHash('v1', [makeRule('r1')]);
    const h2 = generatePolicyHash('v1', [makeRule('r2')]);
    expect(h1).not.toBe(h2);
  });
});

// ─── executePolicy ────────────────────────────────────────────────────────────

describe('executePolicy', () => {
  const TEST_POLICY_VERSION = 'executor-test-v1';

  function makeProposal(overrides: Record<string, unknown> = {}): ProposalPayload {
    return { action: 'deploy', riskLevel: 'low', ...overrides };
  }

  it('first rule returning a decision → executePolicy returns that decision', () => {
    registerPolicy(TEST_POLICY_VERSION, [
      { id: 'r-approve', description: 'Approve deploy', evaluate: () => 'approved' },
      { id: 'r-reject', description: 'Reject always', evaluate: () => 'rejected' },
    ]);

    const result = executePolicy(makeProposal(), TEST_POLICY_VERSION);
    expect(result).toBe('approved');
  });

  it('all rules return null → executePolicy returns "pending" (safety default)', () => {
    const version = 'executor-test-v2';
    registerPolicy(version, [
      { id: 'r-null-1', description: 'Skip', evaluate: () => null },
      { id: 'r-null-2', description: 'Skip too', evaluate: () => null },
    ]);

    const result = executePolicy(makeProposal(), version);
    expect(result).toBe('pending');
  });

  it('first rule null, second rule returns decision → second rule applies', () => {
    const version = 'executor-test-v3';
    registerPolicy(version, [
      { id: 'r-skip', description: 'Skip', evaluate: () => null },
      { id: 'r-reject', description: 'Reject', evaluate: () => 'rejected' },
    ]);

    const result = executePolicy(makeProposal(), version);
    expect(result).toBe('rejected');
  });
});

// ─── KernelRuntimeEntrypoint ──────────────────────────────────────────────────

describe('KernelRuntimeEntrypoint', () => {
  it('constructs without throwing', () => {
    expect(() => new KernelRuntimeEntrypoint()).not.toThrow();
  });

  it('getPolicyVersion() returns non-empty string (default "v1")', () => {
    const entrypoint = new KernelRuntimeEntrypoint();
    const version = entrypoint.getPolicyVersion();
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });

  it('getTelemetry() returns object with session and policyVersion fields', () => {
    const entrypoint = new KernelRuntimeEntrypoint();
    const telemetry = entrypoint.getTelemetry();
    expect(telemetry).toBeDefined();
    expect(typeof telemetry).toBe('object');
    expect(telemetry).toHaveProperty('session');
    expect(telemetry).toHaveProperty('policyVersion');
  });

  it('custom policyVersion option is reflected in getPolicyVersion()', () => {
    const entrypoint = new KernelRuntimeEntrypoint({ policyVersion: 'v2' });
    expect(entrypoint.getPolicyVersion()).toBe('v2');
  });
});
