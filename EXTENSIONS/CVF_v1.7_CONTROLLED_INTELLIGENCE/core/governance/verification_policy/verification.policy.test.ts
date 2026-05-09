/**
 * CVF v1.7 Controlled Intelligence — Verification Policy Dedicated Tests (W6-T44)
 * =================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage:
 *   evaluatePhaseExit (phase.exit.criteria.ts):
 *     - all fields true → true
 *     - testsPassed=false → false
 *     - diffWithinScope=false → false
 *     - riskValidated=false → false
 *     - logsClean=false → false
 *     - eleganceChecked=false → false
 *     - proofAttached=false → false
 *   validateProofArtifact (proof.of.correctness.ts):
 *     - all fields populated → true
 *     - testResults empty → false
 *     - diffSnapshot empty → false
 *     - riskReference empty → false
 *     - outputSample empty → false
 *   runVerification (verification.engine.ts):
 *     - all pass → approved=true, reasons=undefined
 *     - criteria fail → approved=false, reasons contains phase reason
 *     - proof fail → approved=false, reasons contains proof reason
 *     - both fail → approved=false, two reasons
 *   DefaultVerificationRules + VerificationRuleType (verification.rules.ts):
 *     - array has 6 rules
 *     - all rules have required=true
 *     - all rules have non-empty id/type/description
 *     - VR-001 type=TEST_PASS, VR-002 type=DIFF_SCOPE, VR-003 type=RISK_VALIDATION
 *     - VR-004 type=LOG_CLEAN, VR-005 type=ELEGANCE_CHECK, VR-006 type=PROOF_ATTACHED
 *     - enum values match string literals
 */

import { describe, it, expect } from 'vitest';

import { evaluatePhaseExit } from './phase.exit.criteria.js';
import { validateProofArtifact } from './proof.of.correctness.js';
import { runVerification } from './verification.engine.js';
import {
  DefaultVerificationRules,
  VerificationRuleType,
} from './verification.rules.js';
import type { PhaseExitCriteria } from './phase.exit.criteria.js';
import type { ProofArtifact } from './proof.of.correctness.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function allPassCriteria(): PhaseExitCriteria {
  return {
    testsPassed: true,
    diffWithinScope: true,
    riskValidated: true,
    logsClean: true,
    eleganceChecked: true,
    proofAttached: true,
  };
}

function fullProof(): ProofArtifact {
  return {
    testResults: 'all 174 tests passed',
    diffSnapshot: 'diff --git ...',
    riskReference: 'R0',
    outputSample: 'sample output',
    timestamp: new Date(),
  };
}

// ─── evaluatePhaseExit ────────────────────────────────────────────────────────

describe('evaluatePhaseExit', () => {
  it('all fields true → true', () => {
    expect(evaluatePhaseExit(allPassCriteria())).toBe(true);
  });

  it('testsPassed=false → false', () => {
    expect(evaluatePhaseExit({ ...allPassCriteria(), testsPassed: false })).toBe(false);
  });

  it('diffWithinScope=false → false', () => {
    expect(evaluatePhaseExit({ ...allPassCriteria(), diffWithinScope: false })).toBe(false);
  });

  it('riskValidated=false → false', () => {
    expect(evaluatePhaseExit({ ...allPassCriteria(), riskValidated: false })).toBe(false);
  });

  it('logsClean=false → false', () => {
    expect(evaluatePhaseExit({ ...allPassCriteria(), logsClean: false })).toBe(false);
  });

  it('eleganceChecked=false → false', () => {
    expect(evaluatePhaseExit({ ...allPassCriteria(), eleganceChecked: false })).toBe(false);
  });

  it('proofAttached=false → false', () => {
    expect(evaluatePhaseExit({ ...allPassCriteria(), proofAttached: false })).toBe(false);
  });

  it('all fields false → false', () => {
    expect(
      evaluatePhaseExit({
        testsPassed: false,
        diffWithinScope: false,
        riskValidated: false,
        logsClean: false,
        eleganceChecked: false,
        proofAttached: false,
      })
    ).toBe(false);
  });
});

// ─── validateProofArtifact ────────────────────────────────────────────────────

describe('validateProofArtifact', () => {
  it('all fields populated → true', () => {
    expect(validateProofArtifact(fullProof())).toBe(true);
  });

  it('testResults empty string → false', () => {
    expect(validateProofArtifact({ ...fullProof(), testResults: '' })).toBe(false);
  });

  it('diffSnapshot empty string → false', () => {
    expect(validateProofArtifact({ ...fullProof(), diffSnapshot: '' })).toBe(false);
  });

  it('riskReference empty string → false', () => {
    expect(validateProofArtifact({ ...fullProof(), riskReference: '' })).toBe(false);
  });

  it('outputSample empty string → false', () => {
    expect(validateProofArtifact({ ...fullProof(), outputSample: '' })).toBe(false);
  });

  it('multiple empty fields → false', () => {
    expect(
      validateProofArtifact({ ...fullProof(), testResults: '', diffSnapshot: '' })
    ).toBe(false);
  });
});

// ─── runVerification ──────────────────────────────────────────────────────────

describe('runVerification', () => {
  it('all pass → approved=true, reasons=undefined', () => {
    const result = runVerification({
      criteria: allPassCriteria(),
      proof: fullProof(),
    });
    expect(result.approved).toBe(true);
    expect(result.reasons).toBeUndefined();
  });

  it('criteria fail → approved=false with phase exit reason', () => {
    const result = runVerification({
      criteria: { ...allPassCriteria(), testsPassed: false },
      proof: fullProof(),
    });
    expect(result.approved).toBe(false);
    expect(result.reasons).toBeDefined();
    expect(result.reasons!.some((r) => r.includes('Phase exit'))).toBe(true);
  });

  it('proof fail → approved=false with proof reason', () => {
    const result = runVerification({
      criteria: allPassCriteria(),
      proof: { ...fullProof(), testResults: '' },
    });
    expect(result.approved).toBe(false);
    expect(result.reasons).toBeDefined();
    expect(result.reasons!.some((r) => r.includes('Proof'))).toBe(true);
  });

  it('both fail → approved=false, two reasons', () => {
    const result = runVerification({
      criteria: { ...allPassCriteria(), logsClean: false },
      proof: { ...fullProof(), outputSample: '' },
    });
    expect(result.approved).toBe(false);
    expect(result.reasons!.length).toBe(2);
  });

  it('approved=false when criteria all false', () => {
    const result = runVerification({
      criteria: {
        testsPassed: false,
        diffWithinScope: false,
        riskValidated: false,
        logsClean: false,
        eleganceChecked: false,
        proofAttached: false,
      },
      proof: fullProof(),
    });
    expect(result.approved).toBe(false);
  });
});

// ─── DefaultVerificationRules + VerificationRuleType ─────────────────────────

describe('DefaultVerificationRules', () => {
  it('array has exactly 6 rules', () => {
    expect(DefaultVerificationRules).toHaveLength(6);
  });

  it('all rules have required=true', () => {
    for (const rule of DefaultVerificationRules) {
      expect(rule.required).toBe(true);
    }
  });

  it('all rules have non-empty id, type, description', () => {
    for (const rule of DefaultVerificationRules) {
      expect(rule.id).toBeTruthy();
      expect(rule.type).toBeTruthy();
      expect(rule.description).toBeTruthy();
    }
  });

  it('VR-001 type=TEST_PASS', () => {
    const rule = DefaultVerificationRules.find((r) => r.id === 'VR-001');
    expect(rule).toBeDefined();
    expect(rule!.type).toBe(VerificationRuleType.TEST_PASS);
  });

  it('VR-002 type=DIFF_SCOPE', () => {
    const rule = DefaultVerificationRules.find((r) => r.id === 'VR-002');
    expect(rule!.type).toBe(VerificationRuleType.DIFF_SCOPE);
  });

  it('VR-003 type=RISK_VALIDATION', () => {
    const rule = DefaultVerificationRules.find((r) => r.id === 'VR-003');
    expect(rule!.type).toBe(VerificationRuleType.RISK_VALIDATION);
  });

  it('VR-004 type=LOG_CLEAN', () => {
    const rule = DefaultVerificationRules.find((r) => r.id === 'VR-004');
    expect(rule!.type).toBe(VerificationRuleType.LOG_CLEAN);
  });

  it('VR-005 type=ELEGANCE_CHECK', () => {
    const rule = DefaultVerificationRules.find((r) => r.id === 'VR-005');
    expect(rule!.type).toBe(VerificationRuleType.ELEGANCE_CHECK);
  });

  it('VR-006 type=PROOF_ATTACHED', () => {
    const rule = DefaultVerificationRules.find((r) => r.id === 'VR-006');
    expect(rule!.type).toBe(VerificationRuleType.PROOF_ATTACHED);
  });

  it('all rule IDs are unique', () => {
    const ids = DefaultVerificationRules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('VerificationRuleType enum', () => {
  it('TEST_PASS value is string "TEST_PASS"', () => {
    expect(VerificationRuleType.TEST_PASS).toBe('TEST_PASS');
  });

  it('DIFF_SCOPE value is string "DIFF_SCOPE"', () => {
    expect(VerificationRuleType.DIFF_SCOPE).toBe('DIFF_SCOPE');
  });

  it('RISK_VALIDATION value is string "RISK_VALIDATION"', () => {
    expect(VerificationRuleType.RISK_VALIDATION).toBe('RISK_VALIDATION');
  });

  it('LOG_CLEAN value is string "LOG_CLEAN"', () => {
    expect(VerificationRuleType.LOG_CLEAN).toBe('LOG_CLEAN');
  });

  it('ELEGANCE_CHECK value is string "ELEGANCE_CHECK"', () => {
    expect(VerificationRuleType.ELEGANCE_CHECK).toBe('ELEGANCE_CHECK');
  });

  it('PROOF_ATTACHED value is string "PROOF_ATTACHED"', () => {
    expect(VerificationRuleType.PROOF_ATTACHED).toBe('PROOF_ATTACHED');
  });
});
