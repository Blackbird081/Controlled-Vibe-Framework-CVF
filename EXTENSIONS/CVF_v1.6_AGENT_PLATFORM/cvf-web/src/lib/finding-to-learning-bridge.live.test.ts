// RT2 live proof test — exercises buildFindingToLearningRecord with a real
// governance finding input derived from the RT1 completion review finding.
// Route wiring is deferred (route.ts at 1000-line hard limit), so this
// direct function test is the live proof for RT2.
import { describe, expect, it } from 'vitest';
import {
  buildFindingToLearningRecord,
  FINDING_TO_LEARNING_BRIDGE_VERSION,
} from './finding-to-learning-bridge';

describe('RT2 live proof — buildFindingToLearningRecord with RT1 finding input', () => {
  it('produces a well-formed record for the RT1 RULE_GAP finding', () => {
    const record = buildFindingToLearningRecord({
      sourceId: 'rt1-rule-gap-finding-001',
      sourceArtifact: 'docs/reviews/CVF_RT1_LEARNING_PLANE_RUNTIME_WIRING_COMPLETION_2026-05-31.md',
      sourceSummary: 'Gap between finding guard taxonomy and live intake bridge caller — no code path called LearningSignalIntakeBridge.intake() before RT2.',
      lane: 'GOVERNANCE_CONTROL_PLANE',
      defectClass: 'RULE_GAP',
      severity: 'medium',
      disposition: 'N/A_WITH_REASON',
      nextControlAction: 'RT2 cvf.findingToLearningSignalBridge.rt2.v1 closes caller gap',
      evidenceBasis: 'check_finding_to_governance_learning.py taxonomy + learning-signal-intake-bridge.ts LPF source',
    });

    console.log('[RT2 live proof]', {
      recordId: record.recordId,
      bridgeVersion: record.bridgeVersion,
      lane: record.lane,
      defectClass: record.defectClass,
      feedbackClass: record.feedbackClass,
      disposition: record.disposition,
      requiresGovernanceWorkOrder: record.requiresGovernanceWorkOrder,
      autonomousMutationAuthorized: record.autonomousMutationAuthorized,
    });

    expect(record.bridgeVersion).toBe(FINDING_TO_LEARNING_BRIDGE_VERSION);
    expect(record.lane).toBe('GOVERNANCE_CONTROL_PLANE');
    expect(record.defectClass).toBe('RULE_GAP');
    expect(record.feedbackClass).toBe('ACCEPT');
    expect(record.disposition).toBe('N/A_WITH_REASON');
    expect(record.requiresGovernanceWorkOrder).toBe(false);
    expect(record.autonomousMutationAuthorized).toBe(false);
    expect(record.recordId.length).toBeGreaterThan(0);
    expect(record.sourceSummary).toContain('intake bridge');
  });
});
