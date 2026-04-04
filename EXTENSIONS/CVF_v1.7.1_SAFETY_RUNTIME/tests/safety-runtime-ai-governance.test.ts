/**
 * CVF v1.7.1 Safety Runtime — AI Governance, Roles & Approval Dedicated Tests (W6-T63)
 * =======================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (5 pure-logic contracts):
 *   ai/audit.logger.ts:
 *     logAIGeneration / getAuditLog — entry fields, cumulative
 *   ai/ai.governance.ts:
 *     setActiveProvider / getActiveProvider — lifecycle and no-provider throw
 *   cvf-ui/lib/roles.ts:
 *     canExecute (ADMIN/OPERATOR=true, VIEWER=false)
 *     canApprove (ADMIN=true, OPERATOR/VIEWER=false)
 *   cvf-ui/system/system.guard.ts + system.policy.ts:
 *     enforceSystemPolicy — default no-throw; emergencyStop=true throws
 *   cvf-ui/approval/approval.state.ts:
 *     transitionApproval — PENDING+approve→APPROVED, PENDING+reject→REJECTED,
 *     non-PENDING throws
 *   adapters/openclaw/telemetry.hook.ts:
 *     logAIInteraction / getAILogs — entry with timestamp
 */

import { afterAll, describe, it, expect } from 'vitest';

import { logAIGeneration, getAuditLog } from '../ai/audit.logger';
import { setActiveProvider, getActiveProvider } from '../ai/ai.governance';
import { canExecute, canApprove } from '../cvf-ui/lib/roles';
import { enforceSystemPolicy } from '../cvf-ui/system/system.guard';
import { systemPolicy } from '../cvf-ui/system/system.policy';
import { transitionApproval } from '../cvf-ui/approval/approval.state';
import { logAIInteraction, getAILogs } from '../adapters/openclaw/telemetry.hook';

// ─── ai/audit.logger ──────────────────────────────────────────────────────────

describe('ai/audit.logger', () => {
  it('logAIGeneration + getAuditLog returns entry with request and responseMeta', () => {
    const before = getAuditLog().length;
    logAIGeneration(
      { userPrompt: 'hello', maxTokens: 100 },
      { content: 'world', model: 'gpt-4o', usage: { totalTokens: 50 } }
    );
    const log = getAuditLog();
    expect(log.length).toBe(before + 1);
    const entry = log[log.length - 1];
    expect(entry.request.userPrompt).toBe('hello');
    expect(entry.responseMeta.model).toBe('gpt-4o');
    expect(entry.responseMeta.totalTokens).toBe(50);
    expect(typeof entry.timestamp).toBe('number');
  });

  it('logAIGeneration with no usage → totalTokens is undefined', () => {
    logAIGeneration({ userPrompt: 'bare' }, { content: 'result' });
    const log = getAuditLog();
    const entry = log[log.length - 1];
    expect(entry.responseMeta.totalTokens).toBeUndefined();
  });

  it('audit log is cumulative across calls', () => {
    const before = getAuditLog().length;
    logAIGeneration({ userPrompt: 'q1' }, { content: 'a1' });
    logAIGeneration({ userPrompt: 'q2' }, { content: 'a2' });
    expect(getAuditLog().length).toBe(before + 2);
  });
});

// ─── ai/ai.governance ─────────────────────────────────────────────────────────

describe('ai/ai.governance', () => {
  it('getActiveProvider with no provider set → throws "No active AI provider set"', () => {
    // Fresh module instance — no provider set yet in this test file
    expect(() => getActiveProvider()).toThrow('No active AI provider set');
  });

  it('setActiveProvider + getActiveProvider returns the set provider', () => {
    const mockProvider = { generate: async () => ({ content: 'mock' }) };
    setActiveProvider(mockProvider);
    expect(getActiveProvider()).toBe(mockProvider);
  });
});

// ─── cvf-ui/lib/roles ─────────────────────────────────────────────────────────

describe('roles', () => {
  it('canExecute: ADMIN and OPERATOR → true', () => {
    expect(canExecute('ADMIN')).toBe(true);
    expect(canExecute('OPERATOR')).toBe(true);
  });

  it('canExecute: VIEWER → false', () => {
    expect(canExecute('VIEWER')).toBe(false);
  });

  it('canApprove: ADMIN → true; OPERATOR/VIEWER → false', () => {
    expect(canApprove('ADMIN')).toBe(true);
    expect(canApprove('OPERATOR')).toBe(false);
    expect(canApprove('VIEWER')).toBe(false);
  });
});

// ─── cvf-ui/system/system.guard ───────────────────────────────────────────────

describe('system.guard', () => {
  afterAll(() => {
    // Reset emergencyStop to avoid contaminating module state
    systemPolicy.emergencyStop = false;
  });

  it('enforceSystemPolicy with emergencyStop=false → no throw', () => {
    systemPolicy.emergencyStop = false;
    expect(() => enforceSystemPolicy()).not.toThrow();
  });

  it('enforceSystemPolicy with emergencyStop=true → throws "emergency stop mode"', () => {
    systemPolicy.emergencyStop = true;
    expect(() => enforceSystemPolicy()).toThrow('emergency stop mode');
  });
});

// ─── cvf-ui/approval/approval.state ──────────────────────────────────────────

describe('transitionApproval', () => {
  it('PENDING + "approve" → "APPROVED"', () => {
    expect(transitionApproval('PENDING', 'approve')).toBe('APPROVED');
  });

  it('PENDING + "reject" → "REJECTED"', () => {
    expect(transitionApproval('PENDING', 'reject')).toBe('REJECTED');
  });

  it('non-PENDING state → throws "Invalid state transition"', () => {
    expect(() => transitionApproval('APPROVED', 'approve')).toThrow('Invalid state transition');
    expect(() => transitionApproval('REJECTED', 'reject')).toThrow('Invalid state transition');
  });
});

// ─── adapters/openclaw/telemetry.hook ────────────────────────────────────────

describe('telemetry.hook', () => {
  it('logAIInteraction + getAILogs returns entry with timestamp', () => {
    const before = getAILogs().length;
    logAIInteraction({ input: 'test input' });
    const logs = getAILogs();
    expect(logs.length).toBe(before + 1);
    const entry = logs[logs.length - 1];
    expect(typeof entry.timestamp).toBe('number');
  });

  it('multiple logAIInteraction calls accumulate', () => {
    const before = getAILogs().length;
    logAIInteraction({ input: 'a' });
    logAIInteraction({ input: 'b' });
    expect(getAILogs().length).toBe(before + 2);
  });
});
