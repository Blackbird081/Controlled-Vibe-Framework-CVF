import { describe, expect, it } from 'vitest';
import {
    buildReceiptIntegrityAnchor,
    canonicalizeReceiptForIntegrity,
} from './receipt-integrity-anchor';

const baseReceipt = {
    receiptId: 'rcpt-env-test',
    evidenceMode: 'live' as const,
    routeId: '/api/execute',
    decision: 'ALLOW',
    riskLevel: 'R1',
    provider: 'alibaba',
    model: 'qwen-turbo',
    routingDecision: 'ALLOW',
    policySnapshotId: 'policy-snapshot-test',
    envelopeId: 'env-test',
    knowledgeCollectionId: null,
    generatedAt: '2026-06-06T00:00:00.000Z',
};

describe('receipt integrity anchor', () => {
    it('canonicalizes object keys deterministically', () => {
        const canonicalA = canonicalizeReceiptForIntegrity(baseReceipt);
        const canonicalB = canonicalizeReceiptForIntegrity({
            model: 'qwen-turbo',
            provider: 'alibaba',
            routeId: '/api/execute',
            evidenceMode: 'live',
            receiptId: 'rcpt-env-test',
            generatedAt: '2026-06-06T00:00:00.000Z',
            envelopeId: 'env-test',
            policySnapshotId: 'policy-snapshot-test',
            routingDecision: 'ALLOW',
            riskLevel: 'R1',
            decision: 'ALLOW',
            knowledgeCollectionId: null,
        });

        expect(canonicalA).toEqual(canonicalB);
    });

    it('returns a hash and unsigned status without a signing secret', () => {
        const anchor = buildReceiptIntegrityAnchor({ receipt: baseReceipt });

        expect(anchor).toMatchObject({
            schemaVersion: 'cvf.receiptIntegrity.v1',
            canonicalization: 'stable-json-v1',
            digestAlgorithm: 'sha256',
            hmacAlgorithm: 'hmac-sha256',
            signatureStatus: 'UNSIGNED',
            externalAnchorStatus: 'NOT_PROVIDED',
            redactionApplied: true,
            claimBoundary: 'local_receipt_integrity_only_no_third_party_immutability_without_external_anchor',
        });
        expect(anchor.receiptHash).toMatch(/^[a-f0-9]{64}$/);
        expect(anchor.signatureDigest).toBeUndefined();
    });

    it('signs when a secret is configured without returning the secret', () => {
        const anchor = buildReceiptIntegrityAnchor({
            receipt: baseReceipt,
            signingSecret: 'rta1-test-secret',
            externalAnchorId: 'anchor-123',
            externalAnchorUrl: 'https://anchor.example/123',
        });

        expect(anchor.signatureStatus).toBe('SIGNED');
        expect(anchor.signatureDigest).toMatch(/^[a-f0-9]{64}$/);
        expect(anchor.externalAnchorStatus).toBe('PROVIDED');
        expect(anchor.externalAnchorId).toBe('anchor-123');
        expect(anchor.externalAnchorUrl).toBe('https://anchor.example/123');
        expect(JSON.stringify(anchor)).not.toContain('rta1-test-secret');
    });
});
