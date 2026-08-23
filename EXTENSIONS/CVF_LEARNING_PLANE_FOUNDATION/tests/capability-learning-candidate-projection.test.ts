/**
 * RSPB-AI-T6 - Focused tests for capability-learning-candidate-projection.ts
 *
 * Covers: valid composition, authority mismatch, stale projection,
 * malformed/hostile/proxy/symbol-keyed input, secret rejection,
 * self-promotion rejection, unbound references, scope/ref normalization,
 * determinism, input mutation after call, bridge no-mutation invariants,
 * and existing bridge regression.
 */

import { describe, expect, it } from 'vitest';
import {
  CAPABILITY_LEARNING_CANDIDATE_PROJECTION_VERSION,
  projectCapabilityLearningCandidate,
} from '../src/capability-learning-candidate-projection';
import {
  LEARNING_SIGNAL_INTAKE_BRIDGE_VERSION,
  createLearningSignalIntakeBridge,
} from '../src/learning-signal-intake-bridge';

// ---  Fixtures 

const NOW = '2026-08-16T10:00:00Z';

/**
 * Minimal structurally valid T5 projection. All authority invariants are
 * satisfied: authorityNotice='PROJECTION_ONLY', authorityMutation=false,
 * staleness='CURRENT'.
 */
function makeProjection(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 'cvf.capabilityCaseEvidenceProjection.v1',
    caseProjectionVersion: 'cvf.capabilityCaseProjection.v1',
    domainEvidenceProjectionVersion: 'cvf.domainEvidenceProjection.v1',
    authorityNotice: 'PROJECTION_ONLY',
    authorityMutation: false,
    caseId: 'case-001',
    requestId: 'req-001',
    workspaceId: 'ws-001',
    workOrderId: null,
    projectionId: 'proj-001',
    sourceRefs: ['route:route-001', 'readiness:readiness-001'],
    staleness: 'CURRENT',
    currentDisposition: 'READY',
    evidence: [
      {
        evidenceId: 'ev-001',
        sourceRef: 'src-ref-001',
        observation: 'Capability test passed in isolated environment.',
        observedAt: '2026-08-16T09:00:00Z',
        digest: null,
        reproductionBoundary: null,
      },
    ],
    findings: [
      {
        findingId: 'f-001',
        claim: 'Capability is stable in current environment.',
        severity: 'LOW',
        confidence: 0.85,
        verificationState: 'VERIFIED',
        evidenceRefs: ['ev-001'],
        remediation: null,
      },
    ],
    paths: [],
    projectionDigest: 'a'.repeat(64),
    generatedAt: '2026-08-16T09:30:00Z',
    issues: [],
    ...overrides,
  };
}

function makeObservation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    observedProblem: 'Capability projection lacked downstream learning seam.',
    method: 'Code review of T5 output and Learning Plane bridge inspection.',
    result: 'No consumer for T5 projection in Learning Plane at time of review.',
    failureMode: null,
    reusableLesson: 'T5 projection must be consumed by a learning seam before review closure.',
    packageScope: ['cvf-learning-plane-foundation'],
    environmentScope: ['node-v22'],
    linkedFindingRefs: ['f-001'],
    linkedEvidenceRefs: ['ev-001'],
    environmentSpecificity: 'PACKAGE_SPECIFIC',
    expiresAt: null,
    revalidationCondition: null,
    ...overrides,
  };
}

// ---  Valid composition 

describe('projectCapabilityLearningCandidate - valid composition', () => {
  it('returns VALID status with a pending candidate and intake record for valid inputs', () => {
    const result = projectCapabilityLearningCandidate(makeProjection(), makeObservation(), NOW);

    expect(result.status).toBe('VALID');
    expect(result.issues).toHaveLength(0);
    expect(result.candidate).not.toBeNull();
    expect(result.intakeRecord).not.toBeNull();
  });

  it('candidate has all required pending/null/false authority invariants', () => {
    const result = projectCapabilityLearningCandidate(makeProjection(), makeObservation(), NOW);
    const c = result.candidate!;

    expect(c.schemaVersion).toBe(CAPABILITY_LEARNING_CANDIDATE_PROJECTION_VERSION);
    expect(c.reviewStatus).toBe('PENDING');
    expect(c.deduplicationStatus).toBe('PENDING');
    expect(c.contradictionStatus).toBe('PENDING');
    expect(c.promotionTarget).toBeNull();
    expect(c.autonomousMutationAuthorized).toBe(false);
    expect(c.independentReviewRequired).toBe(true);
    expect(c.governanceWorkOrderRequired).toBe(true);
  });

  it('candidate binds T5 projection fields: caseId, projectionId, projectionDigest, sourceRefs', () => {
    const proj = makeProjection();
    const result = projectCapabilityLearningCandidate(proj, makeObservation(), NOW);
    const c = result.candidate!;

    expect(c.caseId).toBe('case-001');
    expect(c.projectionId).toBe('proj-001');
    expect(c.projectionDigest).toBe('a'.repeat(64));
    expect([...c.sourceRefs]).toEqual(
      [...(proj['sourceRefs'] as string[])].sort(),
    );
  });

  it('intake record uses lane RUNTIME_BEHAVIOR_LEARNING, defect class RUNTIME_SIGNAL_GAP, disposition RUNTIME_LEARNING_CANDIDATE', () => {
    const result = projectCapabilityLearningCandidate(makeProjection(), makeObservation(), NOW);
    const r = result.intakeRecord!;

    expect(r.lane).toBe('RUNTIME_BEHAVIOR_LEARNING');
    expect(r.defectClass).toBe('RUNTIME_SIGNAL_GAP');
    expect(r.disposition).toBe('RUNTIME_LEARNING_CANDIDATE');
    expect(r.autonomousMutationAuthorized).toBe(false);
    expect(r.requiresGovernanceWorkOrder).toBe(true);
    expect(r.bridgeVersion).toBe(LEARNING_SIGNAL_INTAKE_BRIDGE_VERSION);
  });

  it('candidate candidateId and candidateDigest are non-empty strings', () => {
    const result = projectCapabilityLearningCandidate(makeProjection(), makeObservation(), NOW);
    const c = result.candidate!;

    expect(typeof c.candidateId).toBe('string');
    expect(c.candidateId.length).toBeGreaterThan(0);
    expect(typeof c.candidateDigest).toBe('string');
    expect(c.candidateDigest.length).toBeGreaterThan(0);
  });

  it('generatedAt matches the provided now timestamp', () => {
    const result = projectCapabilityLearningCandidate(makeProjection(), makeObservation(), NOW);
    expect(result.candidate!.generatedAt).toBe(NOW);
  });

  it('observation fields are preserved in candidate', () => {
    const obs = makeObservation();
    const result = projectCapabilityLearningCandidate(makeProjection(), obs, NOW);
    const c = result.candidate!;

    expect(c.observedProblem).toBe(obs['observedProblem']);
    expect(c.method).toBe(obs['method']);
    expect(c.result).toBe(obs['result']);
    expect(c.reusableLesson).toBe(obs['reusableLesson']);
    expect(c.failureMode).toBeNull();
    expect(c.environmentSpecificity).toBe('PACKAGE_SPECIFIC');
  });
});

// ---  Authority mismatch 

describe('projectCapabilityLearningCandidate - authority mismatch', () => {
  it('rejects projection with authorityNotice != PROJECTION_ONLY', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection({ authorityNotice: 'ACCEPTED' }),
      makeObservation(),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.candidate).toBeNull();
    expect(result.intakeRecord).toBeNull();
    expect(result.issues.some((i) => i.code === 'AUTHORITY_MISMATCH')).toBe(true);
  });

  it('rejects projection with authorityMutation != false', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection({ authorityMutation: true }),
      makeObservation(),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'AUTHORITY_MISMATCH')).toBe(true);
  });

  it('rejects projection with authorityMutation as string false', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection({ authorityMutation: 'false' }),
      makeObservation(),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'AUTHORITY_MISMATCH')).toBe(true);
  });
});

// ---  Stale / invalid projection 

describe('projectCapabilityLearningCandidate - stale/invalid T5 projection', () => {
  it('rejects projection with staleness STALE', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection({ staleness: 'STALE' }),
      makeObservation(),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.candidate).toBeNull();
    expect(result.issues.some((i) => i.code === 'STALE_PROJECTION')).toBe(true);
  });

  it('rejects projection with staleness INVALID', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection({ staleness: 'INVALID' }),
      makeObservation(),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'STALE_PROJECTION')).toBe(true);
  });

  it('rejects projection with missing projectionDigest', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection({ projectionDigest: '' }),
      makeObservation(),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'INVALID_PROJECTION')).toBe(true);
  });

  it('rejects projection with empty sourceRefs', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection({ sourceRefs: [] }),
      makeObservation(),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'INVALID_PROJECTION')).toBe(true);
  });

  it('rejects secret-like sourceRefs without reflecting them', () => {
    const secret = 'apiKey=supersecret123';
    const result = projectCapabilityLearningCandidate(
      makeProjection({ sourceRefs: [secret] }),
      makeObservation(),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it('rejects non-string and sparse sourceRefs without throwing', () => {
    const sparse = new Array(2);
    sparse[1] = 'route:route-001';
    expect(() => projectCapabilityLearningCandidate(
      makeProjection({ sourceRefs: [42] }), makeObservation(), NOW,
    )).not.toThrow();
    expect(projectCapabilityLearningCandidate(
      makeProjection({ sourceRefs: [42] }), makeObservation(), NOW,
    ).status).toBe('INVALID');
    expect(projectCapabilityLearningCandidate(
      makeProjection({ sourceRefs: sparse }), makeObservation(), NOW,
    ).status).toBe('INVALID');
  });

  it('rejects malformed nested finding accessors without throwing', () => {
    const hostileFinding = Object.defineProperty({}, 'findingId', {
      enumerable: true,
      get: () => { throw new Error('accessor executed'); },
    });
    expect(() => projectCapabilityLearningCandidate(
      makeProjection({ findings: [hostileFinding] }), makeObservation(), NOW,
    )).not.toThrow();
    expect(projectCapabilityLearningCandidate(
      makeProjection({ findings: [hostileFinding] }), makeObservation(), NOW,
    ).status).toBe('INVALID');
  });

  it('rejects nested proxy evidence without throwing', () => {
    const hostileEvidence = new Proxy({}, {
      get: () => { throw new Error('proxy trap executed'); },
    });
    expect(() => projectCapabilityLearningCandidate(
      makeProjection({ evidence: [hostileEvidence] }), makeObservation(), NOW,
    )).not.toThrow();
    expect(projectCapabilityLearningCandidate(
      makeProjection({ evidence: [hostileEvidence] }), makeObservation(), NOW,
    ).status).toBe('INVALID');
  });

  it('rejects projections carrying upstream issues or invalid disposition', () => {
    expect(projectCapabilityLearningCandidate(
      makeProjection({ issues: [{ code: 'INVALID_FIELD' }] }), makeObservation(), NOW,
    ).status).toBe('INVALID');
    expect(projectCapabilityLearningCandidate(
      makeProjection({ currentDisposition: 'INVALID' }), makeObservation(), NOW,
    ).status).toBe('INVALID');
  });
});

// ---  Unbound references 

describe('projectCapabilityLearningCandidate - missing/unknown finding or evidence refs', () => {
  it('rejects when linkedFindingRefs contains an unknown finding ID', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ linkedFindingRefs: ['f-999'] }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'UNBOUND_REFERENCE')).toBe(true);
  });

  it('rejects when linkedEvidenceRefs contains an unknown evidence ID', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ linkedEvidenceRefs: ['ev-999'] }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'UNBOUND_REFERENCE')).toBe(true);
  });

  it('succeeds when linked refs are empty arrays (no binding required)', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ linkedFindingRefs: [], linkedEvidenceRefs: [] }),
      NOW,
    );
    expect(result.status).toBe('VALID');
  });
});

// ---  Secret rejection 

describe('projectCapabilityLearningCandidate - secret-like value rejection', () => {
  it('rejects secret-like value in observedProblem', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ observedProblem: 'Found issue with apiKey=supersecret123' }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'SECRET_LIKE_VALUE_REJECTED')).toBe(true);
  });

  it('rejects secret-like value in method', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ method: 'Used bearer Token123456789012 to call API' }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'SECRET_LIKE_VALUE_REJECTED')).toBe(true);
  });

  it('rejects secret-like value in reusableLesson', () => {
    const fakeSecret = ['sk', 'ABCDEFGHIJKLMNOPQRST'].join('-');
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ reusableLesson: `Do not embed ${fakeSecret} in logs` }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'SECRET_LIKE_VALUE_REJECTED')).toBe(true);
  });

  it('rejects secret-like scope item', () => {
    const fakeSecret = ['sk', 'ABCDEFGHIJKL1234'].join('-');
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ packageScope: [fakeSecret] }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
  });
});

// ---  Attempted selfpromotion 

describe('projectCapabilityLearningCandidate - attempted self-promotion', () => {
  it('rejects input that tries to set reviewStatus to ACCEPTED', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ reviewStatus: 'ACCEPTED' }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'ATTEMPTED_SELF_PROMOTION')).toBe(true);
  });

  it('rejects input that tries to set deduplicationStatus to UNIQUE', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ deduplicationStatus: 'UNIQUE' }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'ATTEMPTED_SELF_PROMOTION')).toBe(true);
  });

  it('rejects input that tries to set promotionTarget to a non-null value', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ promotionTarget: 'some-target' }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'ATTEMPTED_SELF_PROMOTION')).toBe(true);
  });

  it('rejects input that tries to set contradictionStatus to RESOLVED', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ contradictionStatus: 'RESOLVED' }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.code === 'ATTEMPTED_SELF_PROMOTION')).toBe(true);
  });
});

// ---  Malformed / hostile input 

describe('projectCapabilityLearningCandidate - malformed/hostile input', () => {
  it('does not throw on null projection', () => {
    expect(() => projectCapabilityLearningCandidate(null, makeObservation(), NOW)).not.toThrow();
    const result = projectCapabilityLearningCandidate(null, makeObservation(), NOW);
    expect(result.status).toBe('INVALID');
  });

  it('does not throw on undefined projection', () => {
    expect(() => projectCapabilityLearningCandidate(undefined, makeObservation(), NOW)).not.toThrow();
  });

  it('does not throw on number projection', () => {
    expect(() => projectCapabilityLearningCandidate(42, makeObservation(), NOW)).not.toThrow();
  });

  it('does not throw on array projection', () => {
    expect(() => projectCapabilityLearningCandidate([], makeObservation(), NOW)).not.toThrow();
  });

  it('does not throw on null observation', () => {
    expect(() => projectCapabilityLearningCandidate(makeProjection(), null, NOW)).not.toThrow();
    const result = projectCapabilityLearningCandidate(makeProjection(), null, NOW);
    expect(result.status).toBe('INVALID');
  });

  it('does not throw on non-object observation (string)', () => {
    expect(() => projectCapabilityLearningCandidate(makeProjection(), 'bad', NOW)).not.toThrow();
  });

  it('does not throw on proxy projection', () => {
    const proxy = new Proxy({}, {});
    expect(() => projectCapabilityLearningCandidate(proxy, makeObservation(), NOW)).not.toThrow();
    const result = projectCapabilityLearningCandidate(proxy, makeObservation(), NOW);
    expect(result.status).toBe('INVALID');
  });

  it('does not throw on proxy observation', () => {
    const proxy = new Proxy({}, {});
    expect(() => projectCapabilityLearningCandidate(makeProjection(), proxy, NOW)).not.toThrow();
    const result = projectCapabilityLearningCandidate(makeProjection(), proxy, NOW);
    expect(result.status).toBe('INVALID');
  });

  it('does not throw on symbol-keyed observation', () => {
    const sym = Symbol('x');
    const obj = { [sym]: 'value', ...makeObservation() };
    // Symbol-keyed extra fields should not cause a throw
    expect(() => projectCapabilityLearningCandidate(makeProjection(), obj, NOW)).not.toThrow();
  });

  it('does not throw on oversized observedProblem', () => {
    expect(() =>
      projectCapabilityLearningCandidate(
        makeProjection(),
        makeObservation({ observedProblem: 'x'.repeat(5000) }),
        NOW,
      ),
    ).not.toThrow();
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ observedProblem: 'x'.repeat(5000) }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
  });

  it('returns INVALID with issue for invalid now timestamp', () => {
    const result = projectCapabilityLearningCandidate(makeProjection(), makeObservation(), 'not-a-date');
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.path === '$.now')).toBe(true);
  });

  it('rejects projection with non-string caseId', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection({ caseId: 12345 }),
      makeObservation(),
      NOW,
    );
    expect(result.status).toBe('INVALID');
  });

  it('rejects projection with non-array findings', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection({ findings: 'not-an-array' }),
      makeObservation(),
      NOW,
    );
    expect(result.status).toBe('INVALID');
  });

  it('rejects observation with missing required text fields', () => {
    const { observedProblem: _op, ...obs } = makeObservation() as Record<string, unknown>;
    const result = projectCapabilityLearningCandidate(makeProjection(), obs, NOW);
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.path === '$.observation.observedProblem')).toBe(true);
  });

  it('rejects observation with invalid environmentSpecificity', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ environmentSpecificity: 'GLOBAL_SINGLETON' }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
    expect(result.issues.some((i) => i.path === '$.observation.environmentSpecificity')).toBe(true);
  });

  it('rejects observation with non-array packageScope', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ packageScope: 'not-an-array' }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
  });

  it('rejects invalid expiresAt (non-UTC string)', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ expiresAt: '2026-08-16' }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
  });

  it('accepts valid expiresAt UTC string', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ expiresAt: '2026-12-31T00:00:00Z' }),
      NOW,
    );
    expect(result.status).toBe('VALID');
    expect(result.candidate!.expiresAt).toBe('2026-12-31T00:00:00Z');
  });
});

// ---  Reordered equivalent refs/scopes -> identical IDs/digests 

describe('projectCapabilityLearningCandidate - normalization / determinism', () => {
  it('reordered linkedFindingRefs produce identical candidateDigest', () => {
    const proj = makeProjection({
      findings: [
        {
          findingId: 'f-001',
          claim: 'Finding 1.',
          severity: 'LOW',
          confidence: 0.8,
          verificationState: 'VERIFIED',
          evidenceRefs: ['ev-001'],
          remediation: null,
        },
        {
          findingId: 'f-002',
          claim: 'Finding 2.',
          severity: 'LOW',
          confidence: 0.7,
          verificationState: 'VERIFIED',
          evidenceRefs: ['ev-001'],
          remediation: null,
        },
      ],
    });

    const r1 = projectCapabilityLearningCandidate(
      proj,
      makeObservation({ linkedFindingRefs: ['f-001', 'f-002'] }),
      NOW,
    );
    const r2 = projectCapabilityLearningCandidate(
      proj,
      makeObservation({ linkedFindingRefs: ['f-002', 'f-001'] }),
      NOW,
    );

    expect(r1.status).toBe('VALID');
    expect(r2.status).toBe('VALID');
    expect(r1.candidate!.candidateDigest).toBe(r2.candidate!.candidateDigest);
    expect(r1.candidate!.candidateId).toBe(r2.candidate!.candidateId);
  });

  it('reordered packageScope items produce identical candidateDigest', () => {
    const r1 = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ packageScope: ['pkg-a', 'pkg-b'] }),
      NOW,
    );
    const r2 = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ packageScope: ['pkg-b', 'pkg-a'] }),
      NOW,
    );
    expect(r1.status).toBe('VALID');
    expect(r2.status).toBe('VALID');
    expect(r1.candidate!.candidateDigest).toBe(r2.candidate!.candidateDigest);
  });

  it('same input produces same candidateId and candidateDigest on repeated calls', () => {
    const r1 = projectCapabilityLearningCandidate(makeProjection(), makeObservation(), NOW);
    const r2 = projectCapabilityLearningCandidate(makeProjection(), makeObservation(), NOW);
    expect(r1.status).toBe('VALID');
    expect(r2.status).toBe('VALID');
    expect(r1.candidate!.candidateId).toBe(r2.candidate!.candidateId);
    expect(r1.candidate!.candidateDigest).toBe(r2.candidate!.candidateDigest);
    expect(r1.intakeRecord!.recordId).toBe(r2.intakeRecord!.recordId);
  });

  it('different now timestamps produce different candidateId but same candidateDigest', () => {
    const r1 = projectCapabilityLearningCandidate(makeProjection(), makeObservation(), '2026-08-16T10:00:00Z');
    const r2 = projectCapabilityLearningCandidate(makeProjection(), makeObservation(), '2026-08-16T11:00:00Z');
    expect(r1.status).toBe('VALID');
    expect(r2.status).toBe('VALID');
    // candidateDigest should be same (time excluded from normalized digest content)
    expect(r1.candidate!.candidateDigest).toBe(r2.candidate!.candidateDigest);
    // candidateId includes time, so they differ
    expect(r1.candidate!.candidateId).not.toBe(r2.candidate!.candidateId);
  });
});

// ---  Input mutation after call 

describe('projectCapabilityLearningCandidate - output immutability', () => {
  it('mutating input observation after call does not affect output candidate', () => {
    const obs = makeObservation();
    const result = projectCapabilityLearningCandidate(makeProjection(), obs, NOW);
    expect(result.status).toBe('VALID');

    const originalProblem = result.candidate!.observedProblem;
    // Mutate the input after the call
    (obs as Record<string, unknown>)['observedProblem'] = 'MUTATED AFTER CALL';

    // Output must be unchanged
    expect(result.candidate!.observedProblem).toBe(originalProblem);
  });

  it('mutating output sourceRefs array does not affect candidate', () => {
    const result = projectCapabilityLearningCandidate(makeProjection(), makeObservation(), NOW);
    expect(result.status).toBe('VALID');
    const refs = result.candidate!.sourceRefs;
    expect(() => {
      (refs as string[]).push('injected-ref');
    }).toThrow();
  });
});

// ---  Boundedness guard 

describe('projectCapabilityLearningCandidate - boundedness', () => {
  it('rejects empty observedProblem (zero-length text)', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ observedProblem: '' }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
  });

  it('rejects packageScope exceeding max items', () => {
    const bigScope = Array.from({ length: 65 }, (_, i) => `pkg-${i}`);
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ packageScope: bigScope }),
      NOW,
    );
    expect(result.status).toBe('INVALID');
  });

  it('deduplicates packageScope items', () => {
    const result = projectCapabilityLearningCandidate(
      makeProjection(),
      makeObservation({ packageScope: ['pkg-a', 'pkg-a', 'pkg-b'] }),
      NOW,
    );
    expect(result.status).toBe('VALID');
    expect(result.candidate!.packageScope).toEqual(['pkg-a', 'pkg-b']);
  });
});

// ---  Existing LearningSignalIntakeBridge regression 

describe('LearningSignalIntakeBridge - existing tests unchanged', () => {
  const now = () => '2026-05-29T20:00:00.000Z';

  it('normalizes governance findings into learning feedback without autonomous mutation', () => {
    const bridge = createLearningSignalIntakeBridge({ now });
    const record = bridge.intake({
      sourceId: 'finding-001',
      sourceArtifact: 'docs/logs/CVF_MULTI_PROVIDER_EXECUTION_LOG_2026-05-29_NIGHT_SESSION.md',
      sourceSummary: 'multi-provider attribution required operator reminder',
      lane: 'GOVERNANCE_CONTROL_PLANE',
      defectClass: 'MACHINE_GATE_GAP',
      severity: 'high',
      disposition: 'MACHINE_CHECK_ADDED',
      nextControlAction: 'run multi-provider execution log guard',
      evidenceBasis: 'GIT_VERIFIED',
    });
    expect(record.bridgeVersion).toBe(LEARNING_SIGNAL_INTAKE_BRIDGE_VERSION);
    expect(record.feedbackInput.feedbackClass).toBe('ACCEPT');
    expect(record.feedbackInput.priority).toBe('high');
    expect(record.autonomousMutationAuthorized).toBe(false);
    expect(record.requiresGovernanceWorkOrder).toBe(false);
    expect(record.recordId).toBeTruthy();
  });

  it('routes runtime/provider candidates as escalated feedback requiring a work order', () => {
    const bridge = createLearningSignalIntakeBridge({ now });
    const record = bridge.intake({
      sourceId: 'pm2-empty-stream',
      sourceArtifact: 'scripts/run_pm2_streaming_live_proof.py',
      sourceSummary: 'streaming proof can exit success without enough stream validation',
      lane: 'PROVIDER_OUTPUT_LEARNING',
      defectClass: 'RUNTIME_SIGNAL_GAP',
      severity: 'medium',
      disposition: 'RUNTIME_LEARNING_CANDIDATE',
      nextControlAction: 'create code-hardening work order for streaming proof assertions',
      evidenceBasis: 'TEST_VERIFIED',
    });
    expect(record.feedbackInput.feedbackClass).toBe('ESCALATE');
    expect(record.feedbackInput.priority).toBe('medium');
    expect(record.requiresGovernanceWorkOrder).toBe(true);
    expect(record.autonomousMutationAuthorized).toBe(false);
  });

  it('keeps deterministic ids stable for the same signal input and clock', () => {
    const bridge = createLearningSignalIntakeBridge({ now });
    const input = {
      sourceId: 'cost-ledger-gap',
      sourceArtifact: 'docs/logs/CVF_MULTI_PROVIDER_EXECUTION_LOG_2026-05-29_NIGHT_SESSION.md',
      sourceSummary: 'provider cost was unknown',
      lane: 'COST_ECONOMICS_LEARNING' as const,
      defectClass: 'RUNTIME_SIGNAL_GAP' as const,
      severity: 'low' as const,
      disposition: 'RUNTIME_LEARNING_CANDIDATE' as const,
      nextControlAction: 'add provider economics ledger',
      evidenceBasis: 'OPERATOR_REPORTED',
    };
    expect(bridge.intake(input).recordId).toBe(bridge.intake(input).recordId);
  });
});
