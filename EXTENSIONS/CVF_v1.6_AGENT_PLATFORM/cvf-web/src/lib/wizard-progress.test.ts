/**
 * Wizard Progress & Context Tips — Tests
 * Track 3.3: Progress tracking, time estimation, context tips
 */

import { describe, test, expect } from 'vitest';
import {
  calculateStepStatus,
  calculateProgress,
  getEstimatedTime,
  getFriendlyProgressMessage,
  getContextTips,
  canAdvanceStep,
  getFirstIncompleteStep,
  type StepInfo,
} from './wizard-progress';

// ─── Helpers ──────────────────────────────────────────────────────────

function step(overrides: Partial<StepInfo> = {}): StepInfo {
  return {
    name: 'Test Step',
    fields: [
      { id: 'f1', required: true, filled: false },
      { id: 'f2', required: true, filled: false },
      { id: 'f3', required: false, filled: false },
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// calculateStepStatus
// ═══════════════════════════════════════════════════════════════════════

describe('calculateStepStatus', () => {
  test('not_started when step is ahead of current', () => {
    const s = calculateStepStatus(3, step(), 1);
    expect(s.status).toBe('not_started');
  });

  test('in_progress when is current step', () => {
    const s = calculateStepStatus(1, step(), 1);
    expect(s.status).toBe('in_progress');
  });

  test('completed when all fields filled', () => {
    const s = calculateStepStatus(0, step({
      fields: [
        { id: 'f1', required: true, filled: true },
        { id: 'f2', required: false, filled: true },
      ],
    }), 2);
    expect(s.status).toBe('completed');
    expect(s.completionPercent).toBe(100);
  });

  test('skipped step', () => {
    const s = calculateStepStatus(1, step({ skipped: true }), 2);
    expect(s.status).toBe('skipped');
    expect(s.completionPercent).toBe(100);
  });

  test('completionPercent calculation', () => {
    const s = calculateStepStatus(0, step({
      fields: [
        { id: 'f1', required: true, filled: true },
        { id: 'f2', required: true, filled: false },
        { id: 'f3', required: false, filled: true },
      ],
    }), 0);
    expect(s.completionPercent).toBe(67); // 2/3
    expect(s.filledFields).toBe(2);
    expect(s.totalFields).toBe(3);
    expect(s.requiredFilled).toBe(1);
    expect(s.requiredTotal).toBe(2);
  });

  test('empty step is 100% complete', () => {
    const s = calculateStepStatus(0, step({ fields: [] }), 0);
    expect(s.completionPercent).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// calculateProgress
// ═══════════════════════════════════════════════════════════════════════

describe('calculateProgress', () => {
  test('overall percent reflects all steps', () => {
    const steps: StepInfo[] = [
      step({
        fields: [
          { id: 'a', required: true, filled: true },
          { id: 'b', required: true, filled: true },
        ],
      }),
      step({
        fields: [
          { id: 'c', required: true, filled: false },
          { id: 'd', required: false, filled: false },
        ],
      }),
    ];
    const p = calculateProgress(steps, 1, 'en');
    expect(p.overallPercent).toBe(50); // 2/4
    expect(p.totalSteps).toBe(2);
  });

  test('canSubmit is false when required fields are missing', () => {
    const steps: StepInfo[] = [
      step({ fields: [{ id: 'a', required: true, filled: false }] }),
    ];
    const p = calculateProgress(steps, 0, 'en');
    expect(p.canSubmit).toBe(false);
  });

  test('canSubmit is true when all required filled', () => {
    const steps: StepInfo[] = [
      step({ fields: [{ id: 'a', required: true, filled: true }] }),
      step({ fields: [{ id: 'b', required: false, filled: false }] }),
    ];
    const p = calculateProgress(steps, 1, 'en');
    expect(p.canSubmit).toBe(true);
  });

  test('canSubmit with skipped steps', () => {
    const steps: StepInfo[] = [
      step({ fields: [{ id: 'a', required: true, filled: true }] }),
      step({ skipped: true, fields: [{ id: 'b', required: true, filled: false }] }),
    ];
    const p = calculateProgress(steps, 1, 'en');
    expect(p.canSubmit).toBe(true);
  });

  test('friendlyMessage included', () => {
    const steps: StepInfo[] = [step()];
    const p = calculateProgress(steps, 0, 'en');
    expect(p.friendlyMessage).toBeTruthy();
  });

  test('estimatedTimeRemaining included', () => {
    const steps: StepInfo[] = [step()];
    const p = calculateProgress(steps, 0, 'en');
    expect(p.estimatedTimeRemaining).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// getEstimatedTime
// ═══════════════════════════════════════════════════════════════════════

describe('getEstimatedTime', () => {
  test('0 fields = ready', () => {
    expect(getEstimatedTime(0, 'en')).toBe('Ready!');
    expect(getEstimatedTime(0, 'vi')).toBe('Sẵn sàng!');
  });

  test('1-3 fields = less than 1 minute', () => {
    expect(getEstimatedTime(3, 'en')).toBe('Less than 1 minute');
  });

  test('4 fields = about 1 minute', () => {
    expect(getEstimatedTime(4, 'en')).toBe('About 1 minute');
  });

  test('many fields = about N minutes', () => {
    const result = getEstimatedTime(20, 'en');
    expect(result).toMatch(/About \d+ minutes/);
  });

  test('Vietnamese', () => {
    expect(getEstimatedTime(3, 'vi')).toBe('Dưới 1 phút');
    expect(getEstimatedTime(4, 'vi')).toBe('Khoảng 1 phút');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// getFriendlyProgressMessage
// ═══════════════════════════════════════════════════════════════════════

describe('getFriendlyProgressMessage', () => {
  test('ready when canSubmit and >= 80%', () => {
    expect(getFriendlyProgressMessage(90, true, 'en')).toContain('ready');
  });

  test('almost there at >= 80% but not submittable', () => {
    expect(getFriendlyProgressMessage(85, false, 'en')).toContain('Almost');
  });

  test('good progress at >= 50%', () => {
    expect(getFriendlyProgressMessage(55, false, 'en')).toContain('Good progress');
  });

  test('keep going at >= 20%', () => {
    expect(getFriendlyProgressMessage(25, false, 'en')).toContain('Keep going');
  });

  test('get started at < 20%', () => {
    expect(getFriendlyProgressMessage(5, false, 'en')).toContain('started');
  });

  test('Vietnamese messages', () => {
    expect(getFriendlyProgressMessage(90, true, 'vi')).toContain('sẵn sàng');
    expect(getFriendlyProgressMessage(5, false, 'vi')).toContain('bắt đầu');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// getContextTips
// ═══════════════════════════════════════════════════════════════════════

describe('getContextTips', () => {
  test('warning for missing required field', () => {
    const tips = getContextTips(
      step({ fields: [{ id: 'f1', required: true, filled: false }] }),
      {},
      'en',
    );
    expect(tips.some(t => t.type === 'warning' && t.fieldId === 'f1')).toBe(true);
  });

  test('suggestion for short value on required field', () => {
    const tips = getContextTips(
      step({ fields: [{ id: 'f1', required: true, filled: true }] }),
      { f1: 'hi' },
      'en',
    );
    expect(tips.some(t => t.type === 'suggestion' && t.fieldId === 'f1')).toBe(true);
  });

  test('info when all required fields filled', () => {
    const tips = getContextTips(
      step({ fields: [{ id: 'f1', required: true, filled: true }] }),
      { f1: 'Sufficient value here' },
      'en',
    );
    expect(tips.some(t => t.type === 'info' && t.fieldId === '_step')).toBe(true);
  });

  test('no tips for optional empty fields', () => {
    const tips = getContextTips(
      step({ fields: [{ id: 'f1', required: false, filled: false }] }),
      {},
      'en',
    );
    // No warning for optional fields
    expect(tips.filter(t => t.type === 'warning').length).toBe(0);
  });

  test('Vietnamese tips', () => {
    const tips = getContextTips(
      step({ fields: [{ id: 'f1', required: true, filled: false }] }),
      {},
      'vi',
    );
    expect(tips[0].tip).toMatch(/bắt buộc/);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// canAdvanceStep
// ═══════════════════════════════════════════════════════════════════════

describe('canAdvanceStep', () => {
  test('true when all required filled', () => {
    expect(canAdvanceStep(
      step({ fields: [{ id: 'f1', required: true, filled: true }] }),
      { f1: 'value' },
    )).toBe(true);
  });

  test('false when required missing', () => {
    expect(canAdvanceStep(
      step({ fields: [{ id: 'f1', required: true, filled: false }] }),
      {},
    )).toBe(false);
  });

  test('true when only optional fields exist', () => {
    expect(canAdvanceStep(
      step({ fields: [{ id: 'f1', required: false, filled: false }] }),
      {},
    )).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// getFirstIncompleteStep
// ═══════════════════════════════════════════════════════════════════════

describe('getFirstIncompleteStep', () => {
  test('returns first incomplete step index', () => {
    const steps: StepInfo[] = [
      step({ fields: [{ id: 'a', required: true, filled: true }] }),
      step({ fields: [{ id: 'b', required: true, filled: false }] }),
      step({ fields: [{ id: 'c', required: true, filled: false }] }),
    ];
    expect(getFirstIncompleteStep(steps, { a: 'val' })).toBe(1);
  });

  test('returns last step when all complete', () => {
    const steps: StepInfo[] = [
      step({ fields: [{ id: 'a', required: true, filled: true }] }),
      step({ fields: [{ id: 'b', required: true, filled: true }] }),
    ];
    expect(getFirstIncompleteStep(steps, { a: 'v', b: 'v' })).toBe(1);
  });

  test('skips skipped steps', () => {
    const steps: StepInfo[] = [
      step({ fields: [{ id: 'a', required: true, filled: true }] }),
      step({ skipped: true, fields: [{ id: 'b', required: true, filled: false }] }),
      step({ fields: [{ id: 'c', required: true, filled: false }] }),
    ];
    expect(getFirstIncompleteStep(steps, { a: 'v' })).toBe(2);
  });
});
