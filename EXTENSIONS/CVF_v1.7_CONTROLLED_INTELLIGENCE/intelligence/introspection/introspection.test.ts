/**
 * CVF v1.7 Controlled Intelligence — Introspection Dedicated Tests (W6-T47)
 * ===========================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage:
 *   runSelfCheck (self.check.ts):
 *     - empty sessionId → blocker
 *     - unknown role → blocker
 *     - riskScore < 0 → blocker (out of range)
 *     - riskScore > 1 → blocker (out of range)
 *     - riskScore >= 0.9 (HARD_RISK_THRESHOLD) → blocker
 *     - riskScore >= 0.7 < 0.9 (ESCALATION_THRESHOLD) → warning, valid=true
 *     - entropyScore < 0 → blocker
 *     - entropyScore > 0.35 → warning, valid=true
 *     - all valid → valid=true, no warnings, no blockers
 *   checkReasoningConsistency (self.check.ts):
 *     - no duplicates → consistent=true, issues=undefined
 *     - adjacent duplicate → issue with index
 *     - multiple adjacent duplicates → multiple issues
 *     - empty array → consistent
 *     - single step → consistent
 *   generateDeviationReport (deviation.report.ts):
 *     - HIGH keyword in issues → severity=HIGH
 *     - MEDIUM keyword in issues → severity=MEDIUM
 *     - >3 issues with no keyword → severity=MEDIUM
 *     - simple issues ≤3, no keyword → severity=LOW
 *     - sessionId preserved in report
 *     - issues array preserved
 *     - timestamp is a number
 *   proposeCorrection (correction.plan.ts):
 *     - LOW severity → requiresGovernanceApproval=false
 *     - MEDIUM severity → requiresGovernanceApproval=true
 *     - HIGH severity → requiresGovernanceApproval=true
 *     - suggestedActions derived from issues list
 *     - severity preserved in plan
 *     - empty issues → empty suggestedActions
 */

import { describe, it, expect } from 'vitest';

import { runSelfCheck, checkReasoningConsistency } from './self.check.js';
import { generateDeviationReport } from './deviation.report.js';
import { proposeCorrection } from './correction.plan.js';
import { AgentRole } from '../role_transition_guard/role.types.js';

// ─── runSelfCheck ─────────────────────────────────────────────────────────────

describe('runSelfCheck', () => {
  it('all valid → valid=true, no warnings, no blockers', () => {
    const result = runSelfCheck('session-ok', AgentRole.BUILD, 0.5, 0.1);
    expect(result.valid).toBe(true);
    expect(result.blockers).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('empty sessionId → blocker', () => {
    const result = runSelfCheck('', AgentRole.BUILD, 0.5, 0.1);
    expect(result.valid).toBe(false);
    expect(result.blockers.some((b) => b.includes('Session ID'))).toBe(true);
  });

  it('whitespace-only sessionId → blocker', () => {
    const result = runSelfCheck('   ', AgentRole.BUILD, 0.5, 0.1);
    expect(result.valid).toBe(false);
  });

  it('unknown role → blocker', () => {
    const result = runSelfCheck('s1', 'UNKNOWN_ROLE' as AgentRole, 0.5, 0.1);
    expect(result.valid).toBe(false);
    expect(result.blockers.some((b) => b.includes('Unknown role'))).toBe(true);
  });

  it('riskScore < 0 → blocker (out of range)', () => {
    const result = runSelfCheck('s1', AgentRole.PLAN, -0.1, 0.1);
    expect(result.valid).toBe(false);
    expect(result.blockers.some((b) => b.includes('out of range'))).toBe(true);
  });

  it('riskScore > 1 → blocker (out of range)', () => {
    const result = runSelfCheck('s1', AgentRole.PLAN, 1.1, 0.1);
    expect(result.valid).toBe(false);
  });

  it('riskScore >= 0.9 → blocker (exceeds hard threshold)', () => {
    const result = runSelfCheck('s1', AgentRole.PLAN, 0.9, 0.1);
    expect(result.valid).toBe(false);
    expect(result.blockers.some((b) => b.includes('hard threshold'))).toBe(true);
  });

  it('riskScore >= 0.7 < 0.9 → warning, still valid', () => {
    const result = runSelfCheck('s1', AgentRole.REVIEW, 0.75, 0.1);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes('escalation zone'))).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it('entropyScore < 0 → blocker', () => {
    const result = runSelfCheck('s1', AgentRole.BUILD, 0.5, -0.1);
    expect(result.valid).toBe(false);
    expect(result.blockers.some((b) => b.includes('entropyScore'))).toBe(true);
  });

  it('entropyScore > 0.35 → warning, still valid', () => {
    const result = runSelfCheck('s1', AgentRole.BUILD, 0.5, 0.4);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes('entropy'))).toBe(true);
  });
});

// ─── checkReasoningConsistency ────────────────────────────────────────────────

describe('checkReasoningConsistency', () => {
  it('empty array → consistent', () => {
    const result = checkReasoningConsistency([]);
    expect(result.consistent).toBe(true);
    expect(result.issues).toBeUndefined();
  });

  it('single step → consistent', () => {
    const result = checkReasoningConsistency(['step-a']);
    expect(result.consistent).toBe(true);
  });

  it('no duplicates → consistent=true, issues=undefined', () => {
    const result = checkReasoningConsistency(['a', 'b', 'c', 'd']);
    expect(result.consistent).toBe(true);
    expect(result.issues).toBeUndefined();
  });

  it('adjacent duplicate → consistent=false, issue with index', () => {
    const result = checkReasoningConsistency(['a', 'b', 'b', 'c']);
    expect(result.consistent).toBe(false);
    expect(result.issues).toBeDefined();
    expect(result.issues!.some((i) => i.includes('index 2'))).toBe(true);
  });

  it('multiple adjacent duplicates → multiple issues', () => {
    const result = checkReasoningConsistency(['x', 'x', 'y', 'y']);
    expect(result.consistent).toBe(false);
    expect(result.issues!.length).toBe(2);
  });

  it('non-adjacent duplicate → no issue (only adjacent checked)', () => {
    const result = checkReasoningConsistency(['a', 'b', 'a']);
    expect(result.consistent).toBe(true);
  });
});

// ─── generateDeviationReport ──────────────────────────────────────────────────

describe('generateDeviationReport', () => {
  it('no issues → LOW severity', () => {
    const report = generateDeviationReport('s1', []);
    expect(report.severity).toBe('LOW');
  });

  it('≤3 issues with no keywords → LOW severity', () => {
    const report = generateDeviationReport('s1', ['minor issue', 'another issue']);
    expect(report.severity).toBe('LOW');
  });

  it('>3 issues with no keywords → MEDIUM severity', () => {
    const report = generateDeviationReport('s1', ['a', 'b', 'c', 'd']);
    expect(report.severity).toBe('MEDIUM');
  });

  it('HIGH keyword "policy" → HIGH severity', () => {
    const report = generateDeviationReport('s1', ['policy violation detected']);
    expect(report.severity).toBe('HIGH');
  });

  it('HIGH keyword "security" → HIGH severity', () => {
    const report = generateDeviationReport('s1', ['security breach']);
    expect(report.severity).toBe('HIGH');
  });

  it('HIGH keyword "critical" → HIGH severity', () => {
    const report = generateDeviationReport('s1', ['critical failure']);
    expect(report.severity).toBe('HIGH');
  });

  it('MEDIUM keyword "risk" → MEDIUM severity', () => {
    const report = generateDeviationReport('s1', ['risk threshold exceeded']);
    expect(report.severity).toBe('MEDIUM');
  });

  it('MEDIUM keyword "entropy" → MEDIUM severity', () => {
    const report = generateDeviationReport('s1', ['entropy too high']);
    expect(report.severity).toBe('MEDIUM');
  });

  it('sessionId preserved in report', () => {
    const report = generateDeviationReport('session-xyz', ['issue']);
    expect(report.sessionId).toBe('session-xyz');
  });

  it('issues array preserved in report', () => {
    const issues = ['issue-a', 'issue-b'];
    const report = generateDeviationReport('s1', issues);
    expect(report.issues).toEqual(issues);
  });

  it('timestamp is a positive number', () => {
    const report = generateDeviationReport('s1', []);
    expect(typeof report.timestamp).toBe('number');
    expect(report.timestamp).toBeGreaterThan(0);
  });
});

// ─── proposeCorrection ────────────────────────────────────────────────────────

describe('proposeCorrection', () => {
  it('LOW severity → requiresGovernanceApproval=false', () => {
    const plan = proposeCorrection(['minor drift'], 'LOW');
    expect(plan.requiresGovernanceApproval).toBe(false);
  });

  it('MEDIUM severity → requiresGovernanceApproval=true', () => {
    const plan = proposeCorrection(['risk escalation'], 'MEDIUM');
    expect(plan.requiresGovernanceApproval).toBe(true);
  });

  it('HIGH severity → requiresGovernanceApproval=true', () => {
    const plan = proposeCorrection(['policy violation'], 'HIGH');
    expect(plan.requiresGovernanceApproval).toBe(true);
  });

  it('suggestedActions derived from issues list', () => {
    const plan = proposeCorrection(['bad step A', 'bad step B'], 'LOW');
    expect(plan.suggestedActions).toHaveLength(2);
    expect(plan.suggestedActions[0]).toContain('bad step A');
    expect(plan.suggestedActions[1]).toContain('bad step B');
  });

  it('severity preserved in plan', () => {
    const plan = proposeCorrection([], 'HIGH');
    expect(plan.severity).toBe('HIGH');
  });

  it('empty issues → empty suggestedActions', () => {
    const plan = proposeCorrection([], 'LOW');
    expect(plan.suggestedActions).toHaveLength(0);
  });
});
