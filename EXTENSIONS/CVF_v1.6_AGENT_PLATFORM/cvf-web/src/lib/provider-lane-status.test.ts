import { describe, expect, it } from 'vitest';

import { LANE_STATUSES, classifyFromReceipts, type ReceiptSummary } from './provider-lane-status';

const pass = (runId = 'x'): ReceiptSummary => ({ runId, overallStatus: 'PASS', passCount: 6 });
const fail = (runId = 'x', passCount = 3): ReceiptSummary => ({
  runId,
  overallStatus: 'FAIL',
  passCount,
});

describe('classifyFromReceipts', () => {
  it('returns EXPERIMENTAL when receipts list is empty', () => {
    expect(classifyFromReceipts([])).toBe('EXPERIMENTAL');
  });

  it('returns LIVE when only failures exist (no prior pass)', () => {
    expect(classifyFromReceipts([fail('a'), fail('b')])).toBe('LIVE');
  });

  it('returns DEGRADED when latest fails after a prior pass', () => {
    expect(classifyFromReceipts([pass('a'), fail('b')])).toBe('DEGRADED');
  });

  it('returns CANARY_PASS for a single PASS 6/6', () => {
    expect(classifyFromReceipts([fail('a'), pass('b')])).toBe('CANARY_PASS');
  });

  it('returns CANARY_PASS for exactly 2 consecutive PASS 6/6', () => {
    expect(classifyFromReceipts([fail('a'), pass('b'), pass('c')])).toBe('CANARY_PASS');
  });

  it('returns CERTIFIED for 3 consecutive PASS 6/6', () => {
    expect(classifyFromReceipts([fail('a'), pass('b'), pass('c'), pass('d')])).toBe('CERTIFIED');
  });

  it('returns CERTIFIED for more than 3 consecutive PASS 6/6', () => {
    expect(classifyFromReceipts([pass('a'), pass('b'), pass('c'), pass('d')])).toBe('CERTIFIED');
  });

  it('does not count non-consecutive passes toward certification window', () => {
    expect(classifyFromReceipts([pass('a'), pass('b'), fail('c'), pass('d')])).toBe('CANARY_PASS');
  });

  it('classifies Alibaba live history: 1xFAIL + 3xPASS → CERTIFIED', () => {
    const alibaba: ReceiptSummary[] = [
      { runId: 'c0c817', overallStatus: 'FAIL', passCount: 3 },
      { runId: 'a112f7', overallStatus: 'PASS', passCount: 6 },
      { runId: '4a22b6', overallStatus: 'PASS', passCount: 6 },
      { runId: '422037', overallStatus: 'PASS', passCount: 6 },
    ];
    expect(classifyFromReceipts(alibaba)).toBe('CERTIFIED');
  });

  it('classifies DeepSeek live history: 8xFAIL + 1xPASS → CANARY_PASS', () => {
    const deepseek: ReceiptSummary[] = [
      { runId: 'aa1f85', overallStatus: 'FAIL', passCount: 0 },
      { runId: '3bdf2e', overallStatus: 'FAIL', passCount: 3 },
      { runId: '24c8df', overallStatus: 'FAIL', passCount: 3 },
      { runId: 'a06645', overallStatus: 'FAIL', passCount: 5 },
      { runId: '78d233', overallStatus: 'FAIL', passCount: 5 },
      { runId: '82075b', overallStatus: 'FAIL', passCount: 5 },
      { runId: 'ae4bc7', overallStatus: 'FAIL', passCount: 5 },
      { runId: 'cf3596', overallStatus: 'FAIL', passCount: 5 },
      { runId: '0c0d3e', overallStatus: 'PASS', passCount: 6 },
    ];
    expect(classifyFromReceipts(deepseek)).toBe('CANARY_PASS');
  });

  it('exports all 7 canonical lane statuses', () => {
    expect(LANE_STATUSES).toEqual([
      'UNCONFIGURED',
      'BLOCKED',
      'LIVE',
      'CANARY_PASS',
      'CERTIFIED',
      'DEGRADED',
      'EXPERIMENTAL',
    ]);
  });
});
