/**
 * CVF v1.7.1 Safety Runtime — Validation Schemas & RefusalPolicyRegistry Tests (W6-T79)
 * ========================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (2 contracts):
 *   validation/schemas.ts:
 *     validate<T>() helper — valid data→success+data; invalid→success=false+errors[];
 *       errors use "path: message" format
 *     ProposalEnvelopeSchema — uuid required; source enum; action min/max; confidence range
 *     CreateProposalRequestSchema — instruction min/max/trim
 *     LoginRequestSchema — username min 3; password min 8
 *     RegisterPolicySchema — version regex (^v\d+(\.\d+)*$); rules min 1
 *     LifecycleInputSchema — simulateOnly defaults to false
 *     AISettingsSchema — temperature 0–2; maxTokens positive, max 128000
 *   kernel/04_refusal_router/refusal_policy_registry.ts:
 *     RefusalPolicyRegistry.latestVersion() → "v1"
 *     RefusalPolicyRegistry.get("v1") → correct baselineByRisk + flags
 *     RefusalPolicyRegistry.get(unknown) → throws
 */

import { describe, it, expect } from 'vitest';

import {
  validate,
  ProposalEnvelopeSchema,
  CreateProposalRequestSchema,
  LoginRequestSchema,
  RegisterPolicySchema,
  LifecycleInputSchema,
  AISettingsSchema,
} from '../validation/schemas';
import { RefusalPolicyRegistry } from '../kernel-architecture/kernel/04_refusal_router/refusal_policy_registry';

// ─── validate() helper ────────────────────────────────────────────────────────

describe('validate() helper', () => {
  it('valid data → success=true and data returned', () => {
    const result = validate(CreateProposalRequestSchema, { instruction: 'analyze this' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.instruction).toBe('analyze this');
    }
  });

  it('invalid data → success=false and errors array', () => {
    const result = validate(CreateProposalRequestSchema, { instruction: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('errors use "path: message" format', () => {
    const result = validate(LoginRequestSchema, { username: 'ab', password: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Each error string must contain ": " as separator
      result.errors.forEach((e) => expect(e).toContain(': '));
    }
  });

  it('completely wrong type → errors array with messages', () => {
    const result = validate(CreateProposalRequestSchema, null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});

// ─── ProposalEnvelopeSchema ───────────────────────────────────────────────────

describe('ProposalEnvelopeSchema', () => {
  const valid = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    source: 'openclaw',
    action: 'analyze',
    payload: { key: 'value' },
    createdAt: 1_700_000_000,
    confidence: 0.85,
    riskLevel: 'low',
  };

  it('valid envelope → success', () => {
    expect(validate(ProposalEnvelopeSchema, valid).success).toBe(true);
  });

  it('non-uuid id → failure', () => {
    const result = validate(ProposalEnvelopeSchema, { ...valid, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('invalid source enum → failure', () => {
    const result = validate(ProposalEnvelopeSchema, { ...valid, source: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('confidence > 1 → failure', () => {
    const result = validate(ProposalEnvelopeSchema, { ...valid, confidence: 1.5 });
    expect(result.success).toBe(false);
  });

  it('empty action → failure', () => {
    const result = validate(ProposalEnvelopeSchema, { ...valid, action: '' });
    expect(result.success).toBe(false);
  });
});

// ─── LoginRequestSchema ───────────────────────────────────────────────────────

describe('LoginRequestSchema', () => {
  it('valid credentials → success', () => {
    const result = validate(LoginRequestSchema, { username: 'admin', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('username too short (< 3 chars) → failure', () => {
    const result = validate(LoginRequestSchema, { username: 'ab', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('password too short (< 8 chars) → failure', () => {
    const result = validate(LoginRequestSchema, { username: 'admin', password: 'short' });
    expect(result.success).toBe(false);
  });
});

// ─── RegisterPolicySchema ─────────────────────────────────────────────────────

describe('RegisterPolicySchema', () => {
  const rule = { id: 'rule-1', description: 'No cross-domain calls' };

  it('valid version + rules → success', () => {
    const result = validate(RegisterPolicySchema, { version: 'v1.2.3', rules: [rule] });
    expect(result.success).toBe(true);
  });

  it('version without "v" prefix → failure', () => {
    const result = validate(RegisterPolicySchema, { version: '1.0', rules: [rule] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.includes('Version must match format'))).toBe(true);
    }
  });

  it('empty rules array → failure', () => {
    const result = validate(RegisterPolicySchema, { version: 'v1', rules: [] });
    expect(result.success).toBe(false);
  });

  it('short version "v1" → success', () => {
    const result = validate(RegisterPolicySchema, { version: 'v1', rules: [rule] });
    expect(result.success).toBe(true);
  });
});

// ─── LifecycleInputSchema ─────────────────────────────────────────────────────

describe('LifecycleInputSchema', () => {
  const base = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    payload: {},
    policyVersion: 'v1',
  };

  it('simulateOnly omitted → defaults to false', () => {
    const result = validate(LifecycleInputSchema, base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.simulateOnly).toBe(false);
    }
  });

  it('simulateOnly=true → preserved', () => {
    const result = validate(LifecycleInputSchema, { ...base, simulateOnly: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.simulateOnly).toBe(true);
    }
  });
});

// ─── AISettingsSchema ─────────────────────────────────────────────────────────

describe('AISettingsSchema', () => {
  it('valid settings → success', () => {
    const result = validate(AISettingsSchema, { provider: 'openai', maxTokens: 4096, temperature: 0.7 });
    expect(result.success).toBe(true);
  });

  it('temperature > 2 → failure', () => {
    const result = validate(AISettingsSchema, { provider: 'openai', temperature: 3.0 });
    expect(result.success).toBe(false);
  });

  it('maxTokens > 128000 → failure', () => {
    const result = validate(AISettingsSchema, { provider: 'openai', maxTokens: 200000 });
    expect(result.success).toBe(false);
  });
});

// ─── RefusalPolicyRegistry ────────────────────────────────────────────────────

describe('RefusalPolicyRegistry', () => {
  const registry = new RefusalPolicyRegistry();

  it('latestVersion() → "v1"', () => {
    expect(registry.latestVersion()).toBe('v1');
  });

  it('get("v1") → correct R0/R3/R4 baseline actions', () => {
    const profile = registry.get('v1');
    expect(profile.baselineByRisk.R0).toBe('allow');
    expect(profile.baselineByRisk.R3).toBe('needs_approval');
    expect(profile.baselineByRisk.R4).toBe('block');
  });

  it('get("v1") → clarifyOnSignalsAtR2=true', () => {
    const profile = registry.get('v1');
    expect(profile.clarifyOnSignalsAtR2).toBe(true);
  });

  it('get(unknown version) → throws "Unknown refusal policy version"', () => {
    expect(() => registry.get('v99')).toThrow('Unknown refusal policy version');
  });
});
