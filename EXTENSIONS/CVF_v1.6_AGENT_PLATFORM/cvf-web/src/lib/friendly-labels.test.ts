import { describe, expect, it } from 'vitest';
import { friendlyPhase } from './friendly-labels';

describe('friendlyPhase', () => {
  it('returns the canonical intake label for legacy DISCOVERY input', () => {
    expect(friendlyPhase('DISCOVERY', 'en')).toBe('\uD83E\uDDED Intake & Clarify');
  });

  it('keeps canonical FREEZE labeling intact', () => {
    expect(friendlyPhase('FREEZE', 'vi')).toBe('\uD83D\uDD12 Chốt kết quả & Khóa phạm vi');
  });
});
