/**
 * CVF v1.7 Controlled Intelligence — Role Guard Internals Dedicated Tests (W6-T48)
 * ====================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage:
 *   checkTransitionDepth (depth.limiter.ts):
 *     - transitionCount <= maxDepth → exceeded=false, reason=undefined
 *     - transitionCount === maxDepth → not exceeded (exact limit ok)
 *     - transitionCount > maxDepth → exceeded=true with reason
 *     - default maxDepth=8: count=8 → ok, count=9 → exceeded
 *     - reason string includes maxDepth value
 *   detectRoleLoop (loop.detector.ts):
 *     - history.length < maxRepeat → loopDetected=false
 *     - last maxRepeat roles all same → loopDetected=true with reason
 *     - last roles not all same → loopDetected=false
 *     - default maxRepeat=3: 2 items → no loop, 3 same → loop
 *     - reason string includes role name and count
 *     - mixed history with loop at end → detected
 *     - loop not at end → not detected
 */

import { describe, it, expect } from 'vitest';

import { checkTransitionDepth } from './depth.limiter.js';
import { detectRoleLoop } from './loop.detector.js';
import { AgentRole } from './role.types.js';

// ─── checkTransitionDepth ─────────────────────────────────────────────────────

describe('checkTransitionDepth', () => {
  it('count < maxDepth → exceeded=false', () => {
    const result = checkTransitionDepth(5, 8);
    expect(result.exceeded).toBe(false);
    expect(result.reason).toBeUndefined();
  });

  it('count === maxDepth → not exceeded (exact limit ok)', () => {
    const result = checkTransitionDepth(8, 8);
    expect(result.exceeded).toBe(false);
  });

  it('count > maxDepth → exceeded=true', () => {
    const result = checkTransitionDepth(9, 8);
    expect(result.exceeded).toBe(true);
  });

  it('exceeded=true → reason includes maxDepth value', () => {
    const result = checkTransitionDepth(10, 8);
    expect(result.reason).toContain('8');
  });

  it('default maxDepth=8: count=8 → not exceeded', () => {
    expect(checkTransitionDepth(8).exceeded).toBe(false);
  });

  it('default maxDepth=8: count=9 → exceeded', () => {
    expect(checkTransitionDepth(9).exceeded).toBe(true);
  });

  it('count=0 → not exceeded', () => {
    expect(checkTransitionDepth(0, 5).exceeded).toBe(false);
  });

  it('custom maxDepth respected', () => {
    expect(checkTransitionDepth(3, 3).exceeded).toBe(false);
    expect(checkTransitionDepth(4, 3).exceeded).toBe(true);
  });
});

// ─── detectRoleLoop ───────────────────────────────────────────────────────────

describe('detectRoleLoop', () => {
  it('empty history → no loop', () => {
    expect(detectRoleLoop([]).loopDetected).toBe(false);
  });

  it('history.length < maxRepeat → no loop', () => {
    const result = detectRoleLoop([AgentRole.BUILD, AgentRole.BUILD], 3);
    expect(result.loopDetected).toBe(false);
  });

  it('default maxRepeat=3: 2 items same → no loop', () => {
    expect(detectRoleLoop([AgentRole.PLAN, AgentRole.PLAN]).loopDetected).toBe(false);
  });

  it('default maxRepeat=3: 3 same → loop detected', () => {
    const result = detectRoleLoop([AgentRole.BUILD, AgentRole.BUILD, AgentRole.BUILD]);
    expect(result.loopDetected).toBe(true);
  });

  it('reason includes role name', () => {
    const result = detectRoleLoop([AgentRole.REVIEW, AgentRole.REVIEW, AgentRole.REVIEW]);
    expect(result.reason).toContain('REVIEW');
  });

  it('reason includes repeat count', () => {
    const result = detectRoleLoop([AgentRole.TEST, AgentRole.TEST, AgentRole.TEST]);
    expect(result.reason).toContain('3');
  });

  it('last 3 not all same → no loop', () => {
    const result = detectRoleLoop([
      AgentRole.BUILD, AgentRole.BUILD, AgentRole.PLAN,
    ]);
    expect(result.loopDetected).toBe(false);
  });

  it('mixed history with loop at end → detected', () => {
    const result = detectRoleLoop([
      AgentRole.PLAN, AgentRole.DESIGN,
      AgentRole.BUILD, AgentRole.BUILD, AgentRole.BUILD,
    ]);
    expect(result.loopDetected).toBe(true);
  });

  it('same role repeated but not at end → no loop', () => {
    const result = detectRoleLoop([
      AgentRole.BUILD, AgentRole.BUILD, AgentRole.BUILD,
      AgentRole.REVIEW,
    ]);
    expect(result.loopDetected).toBe(false);
  });

  it('custom maxRepeat=2: 2 same → loop', () => {
    const result = detectRoleLoop([AgentRole.RISK, AgentRole.RISK], 2);
    expect(result.loopDetected).toBe(true);
  });
});
