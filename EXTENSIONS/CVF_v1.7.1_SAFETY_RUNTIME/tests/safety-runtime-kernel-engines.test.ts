/**
 * CVF v1.7.1 Safety Runtime — Kernel Engines Dedicated Tests (W6-T62)
 * ====================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (4 kernel engine contracts):
 *   kernel/04_refusal_router/alternative_route_engine.ts:
 *     AlternativeRouteEngine.suggest — returns standard alternative message
 *   kernel/04_refusal_router/safe_rewrite_engine.ts:
 *     SafeRewriteEngine.rewrite — redacts self-harm keywords, leaves safe text
 *   kernel/05_creative_control/creative.controller.ts:
 *     CreativeController — disable/enable lifecycle; adjust: disabled/no-permission/
 *     permission-granted branches
 *   kernel/01_domain_lock/domain_lock_engine.ts:
 *     DomainLockEngine.lock — valid lock, unknown domain, mismatch, disallowed inputClass
 */

import { describe, it, expect } from 'vitest';

import { AlternativeRouteEngine } from '../kernel-architecture/kernel/04_refusal_router/alternative_route_engine';
import { SafeRewriteEngine } from '../kernel-architecture/kernel/04_refusal_router/safe_rewrite_engine';
import { CreativeController } from '../kernel-architecture/kernel/05_creative_control/creative.controller';
import { DomainLockEngine } from '../kernel-architecture/kernel/01_domain_lock/domain_lock_engine';

// ─── AlternativeRouteEngine ───────────────────────────────────────────────────

describe('AlternativeRouteEngine', () => {
  it('suggest() returns a non-empty alternative route message', () => {
    const engine = new AlternativeRouteEngine();
    const msg = engine.suggest();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).toMatch(/alternative/i);
  });
});

// ─── SafeRewriteEngine ────────────────────────────────────────────────────────

describe('SafeRewriteEngine', () => {
  const engine = new SafeRewriteEngine();

  it('"kill myself" in message → redacted to [self-harm redacted]', () => {
    const result = engine.rewrite('I want to kill myself today');
    expect(result).toContain('[self-harm redacted]');
    expect(result).not.toContain('kill myself');
  });

  it('"suicide" in message → redacted', () => {
    const result = engine.rewrite('thinking about suicide again');
    expect(result).toContain('[self-harm redacted]');
    expect(result).not.toContain('suicide');
  });

  it('clean message without risk keywords → returned unchanged', () => {
    const msg = 'How do I bake a chocolate cake?';
    expect(engine.rewrite(msg)).toBe(msg);
  });
});

// ─── CreativeController ───────────────────────────────────────────────────────

describe('CreativeController', () => {
  function makeCtx(creative_allowed: boolean) {
    return {
      domain_id: 'test',
      domain_type: 'creative' as const,
      input_class: 'text' as const,
      allowed_output_types: [],
      risk_ceiling: 'low' as const,
      boundary_conditions: [],
      refusal_policy_id: 'p1',
      creative_allowed,
    };
  }

  it('disabled (default) → adjust returns output unchanged', () => {
    const ctrl = new CreativeController();
    const result = ctrl.adjust('my output', makeCtx(true), 'R0');
    expect(result).toBe('my output');
  });

  it('enabled but creative_allowed=false → adjust returns output unchanged', () => {
    const ctrl = new CreativeController();
    ctrl.enable();
    const result = ctrl.adjust('my output', makeCtx(false), 'R0');
    expect(result).toBe('my output');
  });

  it('enabled + creative_allowed=true + R0 → tagged output with provenance marker', () => {
    const ctrl = new CreativeController();
    ctrl.enable();
    const result = ctrl.adjust('my output', makeCtx(true), 'R0');
    expect(result).toMatch(/\[creative:controlled\]/);
    expect(result).toContain('creative variation enabled');
  });

  it('disable() after enable() → adjust returns output unchanged again', () => {
    const ctrl = new CreativeController();
    ctrl.enable();
    ctrl.disable();
    const result = ctrl.adjust('my output', makeCtx(true), 'R0');
    expect(result).toBe('my output');
  });
});

// ─── DomainLockEngine ────────────────────────────────────────────────────────

describe('DomainLockEngine', () => {
  const engine = new DomainLockEngine();

  it('valid informational domain + plain message → returns DomainContextObject', () => {
    const ctx = engine.lock({ message: 'What is the capital of France?', declaredDomain: 'informational' });
    expect(ctx.domain_type).toBe('informational');
    expect(ctx.risk_ceiling).toBe('low');
    expect(typeof ctx.domain_id).toBe('string');
  });

  it('unknown declared domain → throws "Unknown declared domain"', () => {
    expect(() =>
      engine.lock({ message: 'hello', declaredDomain: 'galaxy-brain' })
    ).toThrow("Unknown declared domain 'galaxy-brain'");
  });

  it('domain mismatch (informational declared, creative classified) → throws mismatch', () => {
    // DomainClassifier returns 'creative' for "sáng tác"
    expect(() =>
      engine.lock({ message: 'tôi muốn sáng tác bài thơ', declaredDomain: 'informational' })
    ).toThrow("mismatches classified domain");
  });

  it('disallowed inputClass for domain → throws "Input class ... not allowed"', () => {
    // informational domain allows ["text","instruction","mixed"] — not "numeric"
    expect(() =>
      engine.lock({ message: 'hello world', declaredDomain: 'informational', inputClass: 'numeric' })
    ).toThrow("Input class 'numeric' not allowed in domain 'informational'");
  });
});
