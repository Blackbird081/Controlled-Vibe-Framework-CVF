import { createHash, createHmac } from 'crypto';
import type { GovernanceEvidenceReceipt, ReceiptIntegrityAnchor } from '@/lib/ai';

export interface BuildReceiptIntegrityAnchorInput {
    receipt: Omit<GovernanceEvidenceReceipt, 'receiptIntegrity'>;
    signingSecret?: string | null;
    externalAnchorId?: string | null;
    externalAnchorUrl?: string | null;
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function normalizeForStableJson(value: unknown): JsonValue {
    if (value === null || typeof value === 'boolean' || typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (Array.isArray(value)) {
        return value.map((item) => normalizeForStableJson(item));
    }
    if (value && typeof value === 'object') {
        const output: { [key: string]: JsonValue } = {};
        for (const key of Object.keys(value as Record<string, unknown>).sort()) {
            const item = (value as Record<string, unknown>)[key];
            if (item !== undefined) {
                output[key] = normalizeForStableJson(item);
            }
        }
        return output;
    }
    return null;
}

export function canonicalizeReceiptForIntegrity(
    receipt: Omit<GovernanceEvidenceReceipt, 'receiptIntegrity'>,
): string {
    return JSON.stringify(normalizeForStableJson(receipt));
}

function sha256Hex(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
}

function hmacSha256Hex(secret: string, value: string): string {
    return createHmac('sha256', secret).update(value, 'utf8').digest('hex');
}

function cleanOptionalText(value?: string | null): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed.slice(0, 240) : undefined;
}

export function buildReceiptIntegrityAnchor(
    input: BuildReceiptIntegrityAnchorInput,
): ReceiptIntegrityAnchor {
    const canonicalReceipt = canonicalizeReceiptForIntegrity(input.receipt);
    const signingSecret = input.signingSecret?.trim();
    const externalAnchorId = cleanOptionalText(input.externalAnchorId);
    const externalAnchorUrl = cleanOptionalText(input.externalAnchorUrl);
    const signatureDigest = signingSecret ? hmacSha256Hex(signingSecret, canonicalReceipt) : undefined;

    return {
        schemaVersion: 'cvf.receiptIntegrity.v1',
        canonicalization: 'stable-json-v1',
        digestAlgorithm: 'sha256',
        receiptHash: sha256Hex(canonicalReceipt),
        hmacAlgorithm: 'hmac-sha256',
        signatureStatus: signatureDigest ? 'SIGNED' : 'UNSIGNED',
        ...(signatureDigest ? { signatureDigest } : {}),
        externalAnchorStatus: externalAnchorId || externalAnchorUrl ? 'PROVIDED' : 'NOT_PROVIDED',
        ...(externalAnchorId ? { externalAnchorId } : {}),
        ...(externalAnchorUrl ? { externalAnchorUrl } : {}),
        redactionApplied: true,
        claimBoundary: 'local_receipt_integrity_only_no_third_party_immutability_without_external_anchor',
    };
}
