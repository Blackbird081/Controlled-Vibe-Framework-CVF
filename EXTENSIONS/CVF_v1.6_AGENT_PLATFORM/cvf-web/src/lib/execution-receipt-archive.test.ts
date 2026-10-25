import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Text Encoding Exception: Unicode output fixtures verify exact UTF-8 hashing.
import { webcrypto } from 'node:crypto';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import { createReceiptArchive, hashExactOutput, restoreReceiptArchive } from './execution-receipt-archive';

const receipt: GovernanceEvidenceReceipt = {
    receiptId: 'receipt-1', evidenceMode: 'live', routeId: '/api/execute',
    generatedAt: '2026-10-14T00:00:00Z', provider: 'alibaba', model: 'qwen-flash',
    envelopeId: 'canonical-1', canonicalExecutionId: 'canonical-1',
    knowledgeInjected: false, knowledgeChunkCount: 0,
    governanceTrace: [{ stage: 'test', outcome: 'PASS' }] as unknown as GovernanceEvidenceReceipt['governanceTrace'],
    receiptIntegrity: { claimBoundary: 'not-for-archive' } as unknown as GovernanceEvidenceReceipt['receiptIntegrity'],
};
const snapshot = { receiptId: 'receipt-1', provider: 'alibaba', model: 'qwen-flash' };

beforeEach(() => vi.stubGlobal('crypto', webcrypto));
afterEach(() => vi.unstubAllGlobals());

describe('saved receipt archive', () => {
    it('hashes exact Unicode UTF-8 bytes and saves only allowed scalar fields', async () => {
        expect(await hashExactOutput('Tiếng Việt 🐦\n')).toBe('06bb1a20f22af66d0571f8aeeb2d1f0d86c829ae79b70b704db24f9f7293fcca');
        const archive = await createReceiptArchive('exec-1', 'Tiếng Việt 🐦\n', receipt);
        expect(archive?.schemaVersion).toBe('cvf.executionReceiptArchive.v1');
        expect(archive?.outputSha256).toBe('06bb1a20f22af66d0571f8aeeb2d1f0d86c829ae79b70b704db24f9f7293fcca');
        expect(archive?.receipt.evidenceMode).toBe('live');
        expect(archive?.receipt.knowledgeInjected).toBe(false);
        expect(archive?.receipt.knowledgeChunkCount).toBe(0);
        expect(JSON.stringify(archive)).not.toMatch(/governanceTrace|receiptIntegrity|durableMemory|apiKey|runtimeTelemetry/);
        expect(await restoreReceiptArchive(archive, 'exec-1', 'Tiếng Việt 🐦\n', snapshot)).toEqual(archive?.receipt);
    });

    it('rejects changed output, identity, provider, model, nested and malformed scalar values', async () => {
        const archive = (await createReceiptArchive('exec-1', 'original', receipt))!;
        expect(await restoreReceiptArchive(archive, 'exec-1', 'changed', snapshot)).toBeUndefined();
        expect(await restoreReceiptArchive(archive, 'exec-2', 'original', snapshot)).toBeUndefined();
        expect(await restoreReceiptArchive(archive, 'exec-1', 'original', { ...snapshot, provider: 'other' })).toBeUndefined();
        expect(await restoreReceiptArchive(archive, 'exec-1', 'original', { ...snapshot, model: 'other' })).toBeUndefined();
        expect(await restoreReceiptArchive(archive, 'exec-1', 'original', { receiptId: 'receipt-1' })).toBeUndefined();
        expect(await restoreReceiptArchive(archive, 'exec-1', 'original', undefined)).toBeUndefined();
        expect(await restoreReceiptArchive({ ...archive, receipt: { ...archive.receipt, governanceTrace: [] } }, 'exec-1', 'original', snapshot)).toBeUndefined();
        expect(await restoreReceiptArchive({ ...archive, receipt: { ...archive.receipt, knowledgeChunkCount: -1 } }, 'exec-1', 'original', snapshot)).toBeUndefined();
        expect(await restoreReceiptArchive({ ...archive, receipt: { ...archive.receipt, canonicalExecutionId: 'different' } }, 'exec-1', 'original', snapshot)).toBeUndefined();
        expect(await restoreReceiptArchive({ ...archive, receipt: { ...archive.receipt, evidenceMode: 'live-upgraded' } }, 'exec-1', 'original', snapshot)).toBeUndefined();
    });

    it('leaves the archive unavailable when WebCrypto is missing', async () => {
        vi.stubGlobal('crypto', {});
        await expect(createReceiptArchive('exec-1', 'ordinary output', receipt)).rejects.toThrow('WebCrypto');
        vi.stubGlobal('crypto', webcrypto);
        const archive = await createReceiptArchive('exec-1', 'ordinary output', receipt);
        vi.stubGlobal('crypto', {});
        expect(await restoreReceiptArchive(archive, 'exec-1', 'ordinary output', snapshot)).toBeUndefined();
    });

    it('round-trips the complete signed pilot source rather than projecting its signature away', async () => {
        const output = '# Không gian đọc Ánh Sao\n';
        const pilot = { ...receipt, receiptIntegrity: { ...receipt.receiptIntegrity!, signatureStatus: 'SIGNED' as const },
            htmlPilotEvidence: { receiptId: receipt.receiptId, outputSha256: await hashExactOutput(output),
                runId: 'a'.repeat(32) } } as GovernanceEvidenceReceipt;
        const archive = await createReceiptArchive('exec-pilot', output, pilot);
        expect(archive?.schemaVersion).toBe('cvf.executionReceiptArchive.pilot.v2');
        expect(archive?.receipt).toEqual(pilot);
        expect(await restoreReceiptArchive(archive, 'exec-pilot', output, snapshot)).toEqual(pilot);
        expect(await restoreReceiptArchive(archive, 'exec-pilot', `${output}changed`, snapshot)).toBeUndefined();
        expect(await restoreReceiptArchive({ ...archive, receipt: { ...pilot, htmlPilotEvidence: {
            ...pilot.htmlPilotEvidence, outputSha256: '0'.repeat(64) } } }, 'exec-pilot', output, snapshot)).toBeUndefined();
    });
});
