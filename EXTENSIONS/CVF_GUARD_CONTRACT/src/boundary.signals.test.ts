import { describe, expect, it } from 'vitest';
import type { BoundarySignals, GovernanceEvidenceReceipt } from './index';

function baseReceipt(overrides?: Partial<GovernanceEvidenceReceipt>): GovernanceEvidenceReceipt {
  return {
    receiptId: 'rcpt-boundary-signals-001',
    evidenceMode: 'live',
    routeId: 'route-boundary',
    generatedAt: '2026-05-17T00:00:00.000Z',
    ...overrides,
  };
}

function roundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

describe('BoundarySignals evidence receipt schema', () => {
  it('keeps receipts without boundarySignals valid for backward compatibility', () => {
    const receipt: GovernanceEvidenceReceipt = baseReceipt();

    expect(receipt.boundarySignals).toBeUndefined();
    expect(receipt.receiptId).toBe('rcpt-boundary-signals-001');
  });

  it('round-trips a deviated path lock signal with a deviation reason', () => {
    const receipt: GovernanceEvidenceReceipt = baseReceipt({
      boundarySignals: {
        pathLockSignal: {
          restrictedPathId: 'restricted-path-build-write',
          pathFollowed: false,
          deviationReason: 'Operator selected review-only route.',
        },
      },
    });

    const parsed = roundTrip(receipt);

    expect(parsed.boundarySignals?.pathLockSignal).toEqual({
      restrictedPathId: 'restricted-path-build-write',
      pathFollowed: false,
      deviationReason: 'Operator selected review-only route.',
    });
  });

  it('accepts a followed path lock signal without a deviation reason', () => {
    const receipt: GovernanceEvidenceReceipt = baseReceipt({
      boundarySignals: {
        pathLockSignal: {
          restrictedPathId: 'restricted-path-doc-only',
          pathFollowed: true,
        },
      },
    });

    expect(receipt.boundarySignals?.pathLockSignal?.pathFollowed).toBe(true);
    expect(receipt.boundarySignals?.pathLockSignal?.deviationReason).toBeUndefined();
  });

  it('allows restrictedPathCount values where rejected gates exceed crossed gates', () => {
    const signals: BoundarySignals = {
      restrictedPathCount: {
        totalGatesEncountered: 5,
        gatesCrossed: 1,
        gatesRejected: 3,
      },
    };

    const receipt = baseReceipt({ boundarySignals: signals });

    expect(receipt.boundarySignals?.restrictedPathCount).toEqual({
      totalGatesEncountered: 5,
      gatesCrossed: 1,
      gatesRejected: 3,
    });
  });

  it('round-trips a minimal response mismatch signal', () => {
    const receipt: GovernanceEvidenceReceipt = baseReceipt({
      boundarySignals: {
        minimalResponseMatch: {
          policyId: 'policy-minimal-response',
          boundedScope: 'answer-only-without-runtime-change',
          actualScopeMatch: false,
        },
      },
    });

    const parsed = roundTrip(receipt);

    expect(parsed.boundarySignals?.minimalResponseMatch?.actualScopeMatch).toBe(false);
    expect(parsed.boundarySignals?.minimalResponseMatch?.boundedScope).toBe(
      'answer-only-without-runtime-change',
    );
  });
});
