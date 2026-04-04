import { describe, expect, it } from 'vitest';
import {
  classifyHandoffTransition,
  createHandoffCheckpoint,
  requiresFormalHandoff,
  resolveHandoffCheckpoint,
} from './agent-handoff';

describe('agent handoff runtime helpers', () => {
  it('classifies same-worker immediate continuation as CONTINUE', () => {
    expect(
      classifyHandoffTransition({
        sameWorkerContinuesImmediately: true,
        meaningfulStatePresent: false,
      }),
    ).toBe('CONTINUE');
  });

  it('classifies short same-worker interruption as BREAK', () => {
    expect(
      classifyHandoffTransition({
        sameWorkerWillResumeLater: true,
        meaningfulStatePresent: false,
      }),
    ).toBe('BREAK');
  });

  it('classifies agent ownership change as AGENT_TRANSFER', () => {
    expect(
      classifyHandoffTransition({
        ownershipChanges: true,
        nextOwnerType: 'AGENT',
        meaningfulStatePresent: true,
      }),
    ).toBe('AGENT_TRANSFER');
  });

  it('classifies pending approval as ESCALATION_HANDOFF', () => {
    expect(
      classifyHandoffTransition({
        approvalOrDecisionPending: true,
        meaningfulStatePresent: true,
      }),
    ).toBe('ESCALATION_HANDOFF');
  });

  it('requires formal handoff for pause-class transitions', () => {
    expect(requiresFormalHandoff('PAUSE')).toBe(true);
    expect(requiresFormalHandoff('SHIFT_HANDOFF')).toBe(true);
    expect(requiresFormalHandoff('AGENT_TRANSFER')).toBe(true);
    expect(requiresFormalHandoff('ESCALATION_HANDOFF')).toBe(true);
    expect(requiresFormalHandoff('BREAK')).toBe(false);
  });

  it('creates and resolves a handoff checkpoint', () => {
    const checkpoint = createHandoffCheckpoint({
      transition: 'PAUSE',
      reason: 'Pipeline stopped before closure.',
      currentOwnerId: 'agent-a',
      nextGovernedMove: 'Resume after user returns.',
    });

    expect(checkpoint.transition).toBe('PAUSE');
    expect(checkpoint.formalHandoffRequired).toBe(true);
    expect(checkpoint.status).toBe('OPEN');

    const resolved = resolveHandoffCheckpoint(checkpoint, 'RESUMED');
    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolution).toBe('RESUMED');
  });
});
