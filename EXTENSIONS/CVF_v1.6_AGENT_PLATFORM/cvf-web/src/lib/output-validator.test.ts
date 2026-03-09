/**
 * Output Validator — Tests
 * Track 1.2: Post-response validation + auto-retry logic
 */

import { describe, test, expect } from 'vitest';
import {
  validateOutput,
  shouldRetry,
  MAX_RETRIES,
  type OutputValidationInput,
  type RetryState,
} from './output-validator';

// ─── Helper ───────────────────────────────────────────────────────────

function input(overrides: Partial<OutputValidationInput> = {}): OutputValidationInput {
  return {
    output: '## Analysis\n\nHere is a detailed, structured response with **key points**:\n\n1. First point about the requirements\n2. Second point about implementation\n3. Third actionable recommendation\n\nThis covers the requested scope comprehensively.',
    intent: 'analyze requirements and provide recommendations',
    templateName: 'Business Strategy',
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// validateOutput — core
// ═══════════════════════════════════════════════════════════════════════

describe('validateOutput', () => {
  test('PASS for well-structured response', () => {
    const r = validateOutput(input());
    expect(r.decision).toBe('PASS');
    expect(r.issues).toHaveLength(0);
    expect(r.retryable).toBe(false);
  });

  test('RETRY for empty output', () => {
    const r = validateOutput(input({ output: '' }));
    expect(r.decision).toBe('RETRY');
    expect(r.issues).toContain('EMPTY_OUTPUT');
    expect(r.retryable).toBe(true);
    expect(r.retryHint).toBeDefined();
  });

  test('RETRY for whitespace-only output', () => {
    const r = validateOutput(input({ output: '   \n\n  ' }));
    expect(r.decision).toBe('RETRY');
    expect(r.issues).toContain('EMPTY_OUTPUT');
  });

  test('RETRY for too-short output', () => {
    const r = validateOutput(input({ output: 'Short.', expectedMinLength: 50 }));
    expect(r.decision).toBe('RETRY');
    expect(r.issues).toContain('TOO_SHORT');
  });

  test('WARN for too-long output', () => {
    const longOutput = '## Title\n\n' + 'x'.repeat(60000);
    const r = validateOutput(input({ output: longOutput, expectedMaxLength: 50000 }));
    expect(r.issues).toContain('TOO_LONG');
  });

  test('uses default min/max when not specified', () => {
    const r = validateOutput(input({ output: 'a'.repeat(30), expectedMinLength: undefined }));
    expect(r.issues).toContain('TOO_SHORT');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Structure detection
// ═══════════════════════════════════════════════════════════════════════

describe('validateOutput — structure', () => {
  test('WARN for long unstructured text', () => {
    const plain = 'This is a long paragraph without any formatting or structure. '.repeat(10);
    const r = validateOutput(input({ output: plain }));
    expect(r.issues).toContain('MISSING_STRUCTURE');
  });

  test('PASS with markdown headings', () => {
    const md = '## Section\n\n' + 'Content here with enough text to pass length checks. '.repeat(5);
    const r = validateOutput(input({ output: md }));
    expect(r.issues).not.toContain('MISSING_STRUCTURE');
  });

  test('PASS with numbered lists', () => {
    const list = '1. First item\n2. Second item\n3. Third item\n' + 'More content. '.repeat(10);
    const r = validateOutput(input({ output: list }));
    expect(r.issues).not.toContain('MISSING_STRUCTURE');
  });

  test('PASS with bullet lists', () => {
    const list = '- Item A\n- Item B\n- Item C\n' + 'More content. '.repeat(10);
    const r = validateOutput(input({ output: list }));
    expect(r.issues).not.toContain('MISSING_STRUCTURE');
  });

  test('PASS with code blocks', () => {
    const code = 'Here is code:\n```\nconst x = 1;\n```\n' + 'More content. '.repeat(10);
    const r = validateOutput(input({ output: code }));
    expect(r.issues).not.toContain('MISSING_STRUCTURE');
  });

  test('PASS with bold text', () => {
    const bold = '**Important** point here. ' + 'More content. '.repeat(15);
    const r = validateOutput(input({ output: bold }));
    expect(r.issues).not.toContain('MISSING_STRUCTURE');
  });

  test('skips structure check for short responses', () => {
    const short = 'Short plain text answer.';
    const r = validateOutput(input({ output: short, expectedMinLength: 10 }));
    expect(r.issues).not.toContain('MISSING_STRUCTURE');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Safety detection
// ═══════════════════════════════════════════════════════════════════════

describe('validateOutput — safety', () => {
  test('RETRY for rm -rf pattern', () => {
    const r = validateOutput(input({
      output: '## Steps\n\n1. Run rm -rf /tmp/data to clean up\n2. Continue with setup. '.repeat(3),
    }));
    expect(r.decision).toBe('RETRY');
    expect(r.issues).toContain('UNSAFE_CONTENT');
  });

  test('RETRY for exposed credentials', () => {
    const r = validateOutput(input({
      output: '## Config\n\nSet api_key: "sk-abc123456789xyz" in your env file. '.repeat(3),
    }));
    expect(r.issues).toContain('UNSAFE_CONTENT');
  });

  test('PASS for safe technical content', () => {
    const r = validateOutput(input({
      output: '## Architecture\n\n1. Use React for frontend\n2. Node.js for backend\n3. PostgreSQL for database\n\n' + 'Detailed explanation here. '.repeat(5),
    }));
    expect(r.issues).not.toContain('UNSAFE_CONTENT');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Intent alignment
// ═══════════════════════════════════════════════════════════════════════

describe('validateOutput — intent', () => {
  test('no issue when keywords match', () => {
    const r = validateOutput(input({
      intent: 'analyze sales data and create report',
      output: '## Sales Data Analysis Report\n\nAfter analyzing the sales data, here are the key findings:\n\n1. Revenue trends show growth\n2. Customer segments identified\n3. Recommendations for improvement\n\n' + 'Detailed analysis content. '.repeat(5),
    }));
    expect(r.issues).not.toContain('INTENT_MISMATCH');
  });

  test('INTENT_MISMATCH when response is off-topic', () => {
    const r = validateOutput(input({
      intent: 'analyze sales data revenue customer segments',
      output: '## Weather Forecast\n\nToday will be sunny with temperatures around 25°C.\n\nTomorrow rain is expected.\n\nNext week looks cloudy.\n\n' + 'More weather info here. '.repeat(10),
    }));
    expect(r.issues).toContain('INTENT_MISMATCH');
  });

  test('skips intent check for short output', () => {
    const r = validateOutput(input({
      intent: 'build a complex multi-tenant SaaS platform',
      output: 'OK, noted.',
      expectedMinLength: 5,
    }));
    expect(r.issues).not.toContain('INTENT_MISMATCH');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Repetition detection
// ═══════════════════════════════════════════════════════════════════════

describe('validateOutput — repetition', () => {
  test('RETRY for highly repetitive content', () => {
    const repeated = ('This is the exact same sentence repeated many times.\n').repeat(20);
    const r = validateOutput(input({ output: repeated }));
    expect(r.issues).toContain('REPETITIVE_CONTENT');
  });

  test('PASS for varied content', () => {
    const varied = [
      '## Introduction\nFirst unique paragraph about the topic.',
      'Second paragraph with different content and insights.',
      'Third paragraph covering implementation details.',
      'Fourth paragraph about testing strategies.',
      'Fifth paragraph summarizing key recommendations.',
    ].join('\n\n');
    const r = validateOutput(input({ output: varied }));
    expect(r.issues).not.toContain('REPETITIVE_CONTENT');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Quality hint
// ═══════════════════════════════════════════════════════════════════════

describe('validateOutput — qualityHint', () => {
  test('excellent for long, clean response', () => {
    const excellent = [
      '## Comprehensive Analysis',
      '',
      'Here are detailed recommendations for your requirements:',
      '',
      '1. The first area to address is the overall system architecture, which needs modular design.',
      '2. Performance benchmarks show a 40% improvement opportunity in the data layer.',
      '3. Security audit reveals three medium-priority items that should be resolved before launch.',
      '4. The user experience testing indicates navigation flow can be streamlined significantly.',
      '5. Cost analysis suggests moving to a serverless model will reduce operational expenses.',
      '',
      '### Implementation Timeline',
      '',
      'Phase one covers the architectural refactoring over two weeks.',
      'Phase two handles the performance optimization work in parallel.',
      'Phase three addresses the security findings with targeted fixes.',
      'The final phase integrates user experience improvements across all touchpoints.',
      '',
      '### Budget Estimation',
      '',
      'Total estimated effort is 120 person-hours across all phases.',
    ].join('\n');
    const r = validateOutput(input({ output: excellent, intent: 'comprehensive analysis with recommendations', expectedMinLength: 50 }));
    expect(r.qualityHint).toBe('excellent');
  });

  test('good for clean response at minimum length', () => {
    const good = '## Summary\n\n1. Key point one\n2. Key point two\n3. Conclusion here.';
    const r = validateOutput(input({ output: good, expectedMinLength: 50 }));
    expect(r.qualityHint).toBe('good');
  });

  test('needs_improvement for empty', () => {
    const r = validateOutput(input({ output: '' }));
    expect(r.qualityHint).toBe('needs_improvement');
  });

  test('decent for single minor issue', () => {
    const longPlain = 'Just a long unstructured text without any formatting. '.repeat(10);
    const r = validateOutput(input({ output: longPlain }));
    if (r.issues.length === 1) {
      expect(r.qualityHint).toBe('decent');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// shouldRetry
// ═══════════════════════════════════════════════════════════════════════

describe('shouldRetry', () => {
  test('retry on first RETRY result', () => {
    const validation = validateOutput(input({ output: '' }));
    const state: RetryState = { attempt: 0, previousIssues: [] };
    const r = shouldRetry(validation, state);
    expect(r.retry).toBe(true);
    expect(r.adjustedHint).toBeDefined();
  });

  test('no retry when max attempts reached', () => {
    const validation = validateOutput(input({ output: '' }));
    const state: RetryState = { attempt: MAX_RETRIES, previousIssues: [] };
    const r = shouldRetry(validation, state);
    expect(r.retry).toBe(false);
  });

  test('no retry when not retryable', () => {
    const validation = validateOutput(input());
    const state: RetryState = { attempt: 0, previousIssues: [] };
    const r = shouldRetry(validation, state);
    expect(r.retry).toBe(false);
  });

  test('no retry when same issues persist', () => {
    const validation = validateOutput(input({ output: '' }));
    const state: RetryState = { attempt: 1, previousIssues: ['EMPTY_OUTPUT'] };
    const r = shouldRetry(validation, state);
    expect(r.retry).toBe(false);
  });

  test('MAX_RETRIES is 2', () => {
    expect(MAX_RETRIES).toBe(2);
  });
});
