import { describe, expect, it } from 'vitest';
import { buildEfficiencyOverconstraintFeedbackReadout } from '@/lib/mlw8-efficiency-overconstraint-feedback';

describe('MLW8 efficiency and overconstraint feedback readout', () => {
  it('records context pressure as advisory feedback without automatic optimization', () => {
    const readout = buildEfficiencyOverconstraintFeedbackReadout({
      role: 'builder',
      estimatedContextTokens: 100_000,
      observedSignals: {
        costPressure: true,
        approvalFriction: true,
      },
    });

    expect(readout).toMatchObject({
      contractVersion: 'cvf.mlw8.efficiencyOverconstraintFeedback.rt1.v1',
      efficiencyFeedbackClass: 'CONTEXT_PRESSURE',
      overconstraintFeedbackClass: 'APPROVAL_FRICTION',
      recommendedAction: 'REVIEW_ONLY_RECORD',
      automaticOptimizationAuthorized: false,
      policyRelaxationAuthorized: false,
      evidenceReductionAuthorized: false,
      autonomousMutationAuthorized: false,
    });
    expect(readout.contextBudgetReadout.runtimeExecutionAuthorized).toBe(false);
    expect(readout.learningPlaneReadout.runtimeScoringAuthorized).toBe(false);
    expect(readout.preservationGuardResult.disposition).toBe('PASS');
    expect(readout.boundaries).toEqual(
      expect.arrayContaining([
        'no_prompt_shortening',
        'no_context_compression',
        'no_policy_relaxation',
      ]),
    );
  });

  it('blocks closure-style recommendation when any evidence or safety preservation check fails', () => {
    const readout = buildEfficiencyOverconstraintFeedbackReadout({
      role: 'reviewer',
      estimatedContextTokens: 1_000,
      observedSignals: {
        missingEvidenceFriction: true,
        dlpOrSafetyFriction: true,
      },
      preservationGuard: {
        evidenceFieldsPreserved: false,
        safetyChecksPreserved: false,
      },
    });

    expect(readout.efficiencyFeedbackClass).toBe('EVIDENCE_FRICTION');
    expect(readout.overconstraintFeedbackClass).toBe('DLP_OR_SAFETY_FRICTION');
    expect(readout.preservationGuardResult).toMatchObject({
      disposition: 'BLOCK',
      evidenceFieldsPreserved: false,
      safetyChecksPreserved: false,
    });
    expect(readout.preservationGuardResult.failedChecks).toEqual(
      expect.arrayContaining(['evidenceFieldsPreserved', 'safetyChecksPreserved']),
    );
    expect(readout.recommendedAction).toBe('REQUIRE_GOVERNANCE_REVIEW');
    expect(readout.evidenceReductionAuthorized).toBe(false);
    expect(readout.policyRelaxationAuthorized).toBe(false);
  });

  it('keeps no-signal records non-mutating and routes them to governance review', () => {
    const readout = buildEfficiencyOverconstraintFeedbackReadout({
      role: 'orchestrator',
      estimatedContextTokens: 0,
    });

    expect(readout.efficiencyFeedbackClass).toBe('NO_EFFICIENCY_SIGNAL');
    expect(readout.overconstraintFeedbackClass).toBe('NO_OVERCONSTRAINT_SIGNAL');
    expect(readout.recommendedAction).toBe('REQUIRE_GOVERNANCE_REVIEW');
    expect(readout.automaticOptimizationAuthorized).toBe(false);
    expect(readout.autonomousMutationAuthorized).toBe(false);
    expect(Object.values(readout.preservationGuardResult).filter((value) => value === false)).toEqual([]);
  });
});
