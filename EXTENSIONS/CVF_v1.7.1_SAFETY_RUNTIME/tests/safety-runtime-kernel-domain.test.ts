/**
 * CVF v1.7.1 Safety Runtime — Kernel Domain & Creative Dedicated Tests (W6-T59)
 * ==============================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (6 pure-logic contracts):
 *   kernel/05_creative_control/creative_provenance.tagger.ts:
 *     CreativeProvenanceTagger.tag — prepends [creative:controlled] marker
 *   kernel/05_creative_control/audit.logger.ts:
 *     AuditLogger.log / getEvents — event accumulation with fields
 *   kernel/05_creative_control/trace.reporter.ts:
 *     TraceReporter.generateReport — aggregates lineage + events
 *   kernel/01_domain_lock/domain_classifier.ts:
 *     DomainClassifier.classify — keyword-based Vietnamese + default
 *   kernel/01_domain_lock/boundary_rules.ts:
 *     BoundaryRules.validateInput — restricted/empty/valid branches
 *   kernel/01_domain_lock/scope_resolver.ts:
 *     ScopeResolver.resolve — creative/sensitive/informational risk+flag
 */

import { describe, it, expect } from 'vitest';

import { CreativeProvenanceTagger } from '../kernel-architecture/kernel/05_creative_control/creative_provenance.tagger';
import { AuditLogger } from '../kernel-architecture/kernel/05_creative_control/audit.logger';
import { TraceReporter } from '../kernel-architecture/kernel/05_creative_control/trace.reporter';
import { LineageStore } from '../kernel-architecture/kernel/05_creative_control/lineage.store';
import { DomainClassifier } from '../kernel-architecture/kernel/01_domain_lock/domain_classifier';
import { BoundaryRules } from '../kernel-architecture/kernel/01_domain_lock/boundary_rules';
import { ScopeResolver } from '../kernel-architecture/kernel/01_domain_lock/scope_resolver';

// ─── CreativeProvenanceTagger ─────────────────────────────────────────────────

describe('CreativeProvenanceTagger', () => {
  const tagger = new CreativeProvenanceTagger();

  it('prepends [creative:controlled] marker to output', () => {
    const result = tagger.tag('hello world');
    expect(result).toMatch(/^\[creative:controlled\]/);
  });

  it('original output follows the tag on second line', () => {
    const result = tagger.tag('my content');
    expect(result).toBe('[creative:controlled]\nmy content');
  });
});

// ─── AuditLogger ──────────────────────────────────────────────────────────────

describe('AuditLogger', () => {
  it('log + getEvents returns entry with type, message, timestamp', () => {
    const logger = new AuditLogger();
    logger.log('ALLOW', 'request approved');
    const events = logger.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('ALLOW');
    expect(events[0].message).toBe('request approved');
    expect(typeof events[0].timestamp).toBe('number');
  });

  it('multiple log calls accumulate in order', () => {
    const logger = new AuditLogger();
    logger.log('BLOCK', 'first');
    logger.log('ALLOW', 'second');
    const events = logger.getEvents();
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('BLOCK');
    expect(events[1].type).toBe('ALLOW');
  });

  it('empty logger → getEvents returns []', () => {
    const logger = new AuditLogger();
    expect(logger.getEvents()).toHaveLength(0);
  });
});

// ─── TraceReporter ────────────────────────────────────────────────────────────

describe('TraceReporter', () => {
  it('generateReport returns lineage nodes from store and events from logger', () => {
    const store = new LineageStore();
    const logger = new AuditLogger();

    store.add({ id: 'n1', type: 'input', domain: 'analytical', parentIds: [], timestamp: 1 });
    logger.log('TRACE', 'node n1 processed');

    const reporter = new TraceReporter(store, logger);
    const report = reporter.generateReport();

    expect(report.lineage).toHaveLength(1);
    expect(report.lineage[0].id).toBe('n1');
    expect(report.events).toHaveLength(1);
    expect(report.events[0].message).toBe('node n1 processed');
  });

  it('empty deps → report has empty lineage and events arrays', () => {
    const reporter = new TraceReporter(new LineageStore(), new AuditLogger());
    const report = reporter.generateReport();
    expect(report.lineage).toHaveLength(0);
    expect(report.events).toHaveLength(0);
  });
});

// ─── DomainClassifier ────────────────────────────────────────────────────────

describe('DomainClassifier', () => {
  const classifier = new DomainClassifier();

  it('"sáng tác" keyword → "creative"', () => {
    expect(classifier.classify('tôi muốn sáng tác một bài thơ')).toBe('creative');
  });

  it('"phân tích" keyword → "analytical"', () => {
    expect(classifier.classify('hãy phân tích đoạn văn này')).toBe('analytical');
  });

  it('"hướng dẫn" keyword → "procedural"', () => {
    expect(classifier.classify('hướng dẫn cách làm bánh')).toBe('procedural');
  });

  it('"nhạy cảm" keyword → "sensitive"', () => {
    expect(classifier.classify('chủ đề nhạy cảm về sức khỏe')).toBe('sensitive');
  });

  it('no keyword match → "informational" (default)', () => {
    expect(classifier.classify('what is the weather today')).toBe('informational');
  });
});

// ─── BoundaryRules ────────────────────────────────────────────────────────────

describe('BoundaryRules', () => {
  const rules = new BoundaryRules();

  function makeCtx(domain_type: string) {
    return {
      domain_id: 'test',
      domain_type: domain_type as any,
      input_class: 'text' as const,
      allowed_output_types: [],
      risk_ceiling: 'low' as const,
      boundary_conditions: [],
      refusal_policy_id: 'p1',
      creative_allowed: false,
    };
  }

  it('restricted domain type → validateInput returns false', () => {
    expect(rules.validateInput('valid input', makeCtx('restricted'))).toBe(false);
  });

  it('empty string input → validateInput returns false', () => {
    expect(rules.validateInput('', makeCtx('informational'))).toBe(false);
  });

  it('whitespace-only input → validateInput returns false', () => {
    expect(rules.validateInput('   ', makeCtx('informational'))).toBe(false);
  });

  it('valid input + non-restricted domain → validateInput returns true', () => {
    expect(rules.validateInput('what is a contract?', makeCtx('informational'))).toBe(true);
  });
});

// ─── ScopeResolver ────────────────────────────────────────────────────────────

describe('ScopeResolver', () => {
  const resolver = new ScopeResolver();

  function makeCtx(domain_type: string) {
    return {
      domain_id: 'test',
      domain_type: domain_type as any,
      input_class: 'text' as const,
      allowed_output_types: [],
      risk_ceiling: 'low' as const,
      boundary_conditions: [],
      refusal_policy_id: 'p1',
      creative_allowed: false,
    };
  }

  it('creative domain → risk_ceiling="medium", creative_allowed=true', () => {
    const resolved = resolver.resolve(makeCtx('creative'));
    expect(resolved.risk_ceiling).toBe('medium');
    expect(resolved.creative_allowed).toBe(true);
  });

  it('sensitive domain → risk_ceiling="high", creative_allowed=false', () => {
    const resolved = resolver.resolve(makeCtx('sensitive'));
    expect(resolved.risk_ceiling).toBe('high');
    expect(resolved.creative_allowed).toBe(false);
  });

  it('informational domain → risk_ceiling="low", creative_allowed=false', () => {
    const resolved = resolver.resolve(makeCtx('informational'));
    expect(resolved.risk_ceiling).toBe('low');
    expect(resolved.creative_allowed).toBe(false);
  });
});
