import { describe, expect, it } from 'vitest';

import * as candidateScreenModule from './external-skill-candidate-screen.ts';
import {
  evaluateExternalSkillCandidateScreen,
  EXTERNAL_SKILL_CANDIDATE_SCREEN_VERSION,
  type ExternalSkillCandidateScreenRecord,
} from './external-skill-candidate-screen.ts';

const baseRecord: ExternalSkillCandidateScreenRecord = {
  candidateId: 'ext.skill.strategy-writer.v1',
  sourceName: 'strategy-writer',
  sourceReference: 'local-catalog://skillsmp/strategy-writer',
  sourceRevisionOrFingerprint: 'skillsmp-2026-02-07',
  operatorUseCase: 'Improve strategy memo drafting for an existing pack.',
  targetUser: 'non-coder founder',
  expectedOutput: 'strategy memo checklist',
  declaredTools: ['none'],
  declaredSideEffects: ['read_only'],
  dataSensitivity: 'public',
  runtimeExpectation: 'documentation_only',
  proposedOwnerSurface: 'docs/reference',
  sourceFamily: 'skillsmp',
  duplicateTargetPack: 'strategy_analysis',
  dilutionRisk: 'low',
  registryReadiness: 'candidate_only',
  valueScreen: 'pass',
  duplicateScreen: 'merge',
  riskScreen: 'low',
  normalizedFieldsComplete: true,
};

describe('external-skill-candidate-screen', () => {
  it('allows a complete docs-only candidate only as a merge pattern', () => {
    const readout = evaluateExternalSkillCandidateScreen(baseRecord);

    expect(readout.contractVersion).toBe(EXTERNAL_SKILL_CANDIDATE_SCREEN_VERSION);
    expect(readout.decision).toBe('ALLOW');
    expect(readout.disposition).toBe('MERGE_AS_PATTERN');
    expect(readout.candidateState).toBe('merge_pattern');
    expect(readout.riskLevel).toBe('R1');
    expect(readout.missingFields).toEqual([]);
    expect(readout.runtimeExecutionAuthorized).toBe(false);
    expect(readout.registryPublicationAuthorized).toBe(false);
    expect(readout.externalFetchAuthorized).toBe(false);
  });

  it('blocks incomplete records before value or risk decisions', () => {
    const readout = evaluateExternalSkillCandidateScreen({
      ...baseRecord,
      sourceReference: '',
      operatorUseCase: '',
      declaredSideEffects: [],
      registryReadiness: undefined,
    });

    expect(readout.decision).toBe('BLOCK');
    expect(readout.disposition).toBe('DEFER_INCOMPLETE');
    expect(readout.candidateState).toBe('incomplete_record');
    expect(readout.missingFields).toEqual(expect.arrayContaining([
      'source_reference',
      'operator_use_case',
      'declared_side_effects',
      'registry_readiness',
    ]));
  });

  it('rejects low-value candidates even when technically well formed', () => {
    const readout = evaluateExternalSkillCandidateScreen({
      ...baseRecord,
      valueScreen: 'fail',
      duplicateScreen: 'unknown',
    });

    expect(readout.decision).toBe('BLOCK');
    expect(readout.disposition).toBe('REJECT_LOW_VALUE_NOW');
    expect(readout.nextSafeAction).toContain('higher-value non-coder job');
  });

  it('rejects pure duplicates to prevent skill library dilution', () => {
    const readout = evaluateExternalSkillCandidateScreen({
      ...baseRecord,
      duplicateScreen: 'duplicate',
      dilutionRisk: 'high',
    });

    expect(readout.decision).toBe('BLOCK');
    expect(readout.disposition).toBe('REJECT_DUPLICATE');
    expect(readout.candidateState).toBe('rejected_duplicate');
  });

  it('defers tool and provider candidates behind runtime gates', () => {
    const readout = evaluateExternalSkillCandidateScreen({
      ...baseRecord,
      candidateId: 'ext.skill.browser-agent.v1',
      declaredTools: ['browser automation tool'],
      declaredSideEffects: ['reads_remote'],
      runtimeExpectation: 'mcp_bridge',
      riskScreen: 'high',
      dilutionRisk: 'high',
    });

    expect(readout.decision).toBe('ESCALATE');
    expect(readout.riskLevel).toBe('R3');
    expect(readout.disposition).toBe('DEFER_RUNTIME_GATED');
    expect(readout.actionApprovalRequired).toBe(true);
    expect(readout.boundaries).toContain('no_runtime_execution');
  });

  it('routes secrets and external writes to stricter deferrals', () => {
    const secret = evaluateExternalSkillCandidateScreen({
      ...baseRecord,
      declaredSideEffects: ['uses_credentials'],
    });

    const publish = evaluateExternalSkillCandidateScreen({
      ...baseRecord,
      declaredSideEffects: ['publishes_publicly'],
    });

    expect(secret.disposition).toBe('DEFER_SECRET_BOUNDARY_REQUIRED');
    expect(secret.actionApprovalRequired).toBe(true);
    expect(publish.disposition).toBe('DEFER_EXPLICIT_APPROVAL_REQUIRED');
    expect(publish.actionApprovalRequired).toBe(true);
  });

  it('rejects hidden side effects and direct import attempts', () => {
    const hidden = evaluateExternalSkillCandidateScreen({
      ...baseRecord,
      declaredSideEffects: ['hidden'],
    });

    const directImport = evaluateExternalSkillCandidateScreen({
      ...baseRecord,
      runtimeExpectation: 'direct_import',
    });

    expect(hidden.decision).toBe('BLOCK');
    expect(hidden.disposition).toBe('REJECT_UNGOVERNABLE');
    expect(directImport.decision).toBe('BLOCK');
    expect(directImport.disposition).toBe('REJECT_DIRECT_IMPORT');
  });

  it('escalates new pack candidates to fresh GC-018 instead of admitting them', () => {
    const readout = evaluateExternalSkillCandidateScreen({
      ...baseRecord,
      duplicateTargetPack: null,
      duplicateScreen: 'new_candidate',
      dilutionRisk: 'medium',
    });

    expect(readout.decision).toBe('ESCALATE');
    expect(readout.disposition).toBe('CANDIDATE_NEW_PACK');
    expect(readout.nextSafeAction).toContain('fresh GC-018');
    expect(readout.runtimeExecutionAuthorized).toBe(false);
  });

  it('does not export runtime execution helpers', () => {
    expect(Object.keys(candidateScreenModule).sort()).toEqual([
      'EXTERNAL_SKILL_CANDIDATE_SCREEN_VERSION',
      'evaluateExternalSkillCandidateScreen',
    ]);
  });
});
