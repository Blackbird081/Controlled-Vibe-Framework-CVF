import { describe, expect, it } from 'vitest';
import {
  buildFindingToLearningRecord,
  FINDING_TO_LEARNING_BRIDGE_VERSION,
  type FindingToLearningInput,
} from './finding-to-learning-bridge';

const base: FindingToLearningInput = {
  sourceId: 'test-finding-001',
  sourceArtifact: 'docs/reviews/CVF_RT1_TEST.md',
  sourceSummary: 'Protocol gap between finding guard and intake bridge',
  lane: 'GOVERNANCE_CONTROL_PLANE',
  defectClass: 'RULE_GAP',
  severity: 'medium',
  disposition: 'N/A_WITH_REASON',
  nextControlAction: 'RT2 bridge wiring',
  evidenceBasis: 'check_finding_to_governance_learning.py taxonomy',
};

describe('buildFindingToLearningRecord', () => {
  it('returns bridge version constant', () => {
    const r = buildFindingToLearningRecord(base);
    expect(r.bridgeVersion).toBe(FINDING_TO_LEARNING_BRIDGE_VERSION);
    expect(r.bridgeVersion).toBe('cvf.findingToLearningSignalBridge.rt2.v1');
  });

  it('autonomousMutationAuthorized is always false', () => {
    const r = buildFindingToLearningRecord(base);
    expect(r.autonomousMutationAuthorized).toBe(false);
  });

  it('maps N/A_WITH_REASON + medium to ACCEPT feedbackClass', () => {
    const r = buildFindingToLearningRecord(base);
    expect(r.feedbackClass).toBe('ACCEPT');
  });

  it('maps RULE_ADDED disposition to ACCEPT regardless of severity', () => {
    const r = buildFindingToLearningRecord({ ...base, disposition: 'RULE_ADDED', severity: 'high' });
    expect(r.feedbackClass).toBe('ACCEPT');
  });

  it('maps critical severity to REJECT', () => {
    const r = buildFindingToLearningRecord({ ...base, severity: 'critical' });
    expect(r.feedbackClass).toBe('REJECT');
  });

  it('maps RUNTIME_BEHAVIOR_LEARNING to ESCALATE', () => {
    const r = buildFindingToLearningRecord({ ...base, lane: 'RUNTIME_BEHAVIOR_LEARNING' });
    expect(r.feedbackClass).toBe('ESCALATE');
  });

  it('maps MACHINE_CHECK_CANDIDATE to RETRY and requiresGovernanceWorkOrder=true', () => {
    const r = buildFindingToLearningRecord({ ...base, disposition: 'MACHINE_CHECK_CANDIDATE' });
    expect(r.feedbackClass).toBe('RETRY');
    expect(r.requiresGovernanceWorkOrder).toBe(true);
  });

  it('N/A_WITH_REASON does not require governance work order', () => {
    const r = buildFindingToLearningRecord(base);
    expect(r.requiresGovernanceWorkOrder).toBe(false);
  });

  it('passes through all input fields correctly', () => {
    const r = buildFindingToLearningRecord(base);
    expect(r.sourceId).toBe(base.sourceId);
    expect(r.lane).toBe(base.lane);
    expect(r.defectClass).toBe(base.defectClass);
    expect(r.nextControlAction).toBe(base.nextControlAction);
  });

  it('recordId is non-empty string', () => {
    const r = buildFindingToLearningRecord(base);
    expect(typeof r.recordId).toBe('string');
    expect(r.recordId.length).toBeGreaterThan(0);
  });
});
