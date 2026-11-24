import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Text Encoding Exception: Unicode output fixtures verify exact UTF-8 hashing.
import { webcrypto } from 'node:crypto';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import { createReceiptArchive, hashExactOutput, restoreReceiptArchive } from './execution-receipt-archive';
import { summarizeRolePlan } from '@/components/ProcessingScreen.partial-output';
import { generateDeliverablePack, serializePackToMarkdown } from './deliverable-pack';
import { parseReviewerVerdict } from './mao-role-plan-prompts';

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
    it('carries a closed diagnosis from parser through summary, history and exported pack while retaining the draft', async () => {
        const parsed = parseReviewerVerdict('private text {broken}');
        const rolePlan = summarizeRolePlan({ reviewerVerdict: 'REVISE', revisionApplied: true, revisionReviewed: true,
            recheckVerdict: parsed.verdict, recheckDiagnostic: parsed.diagnostic, stoppedEarly: null, promptContract: 'role-plan-review-v4', steps: [1, 2, 3, 4] })!;
        const output = 'Draft body retained';
        const archive = (await createReceiptArchive('exec-diag', output, { ...receipt, rolePlan }))!;
        const restored = await restoreReceiptArchive(JSON.parse(JSON.stringify(archive)), 'exec-diag', output, snapshot);
        expect(restored?.rolePlan).toEqual(rolePlan);
        const pack = generateDeliverablePack({ id: 'exec-diag', templateId: 'documentation', templateName: 'Documentation',
            intent: 'Write documentation', input: {}, status: 'completed', createdAt: new Date(), output }, restored);
        const markdown = serializePackToMarkdown(pack);
        expect(pack.mainOutput).toBe(output);
        expect(markdown).toContain('**Recheck diagnostic**: INVALID_JSON');
        expect(markdown).toContain('**Final model review**: UNCONFIRMED');
        expect(markdown).not.toContain('private text');
    });
    it('rejects arbitrary or verdict-inconsistent diagnostic metadata on save and restore', async () => {
        const rolePlan = { reviewerVerdict: 'UNPARSEABLE' as const, reviewerDiagnostic: 'INVALID_JSON' as const,
            revisionApplied: false, revisionReviewed: null, recheckVerdict: null, stoppedEarly: null, promptContract: 'role-plan-review-v4', stepCount: 2 };
        const archive = (await createReceiptArchive('exec-diag', 'body', { ...receipt, rolePlan }))!;
        for (const bad of [{ ...rolePlan, reviewerDiagnostic: 'RAW PRIVATE TEXT' }, { ...rolePlan, reviewerVerdict: 'PASS' },
            { ...rolePlan, recheckDiagnostic: 'INVALID_JSON' }, { ...rolePlan, rawReview: 'private text' }]) {
            expect(await createReceiptArchive('exec-diag', 'body', { ...receipt, rolePlan: bad as never })).toBeUndefined();
            expect(await restoreReceiptArchive({ ...archive, receipt: { ...archive.receipt, rolePlan: bad } }, 'exec-diag', 'body', snapshot)).toBeUndefined();
        }
    });
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
    it('keeps legacy and diagnosed pilot role plans, rejecting malformed metadata on both boundaries', async () => {
        const output = 'Pilot draft';
        const legacy = { reviewerVerdict: 'REVISE' as const, revisionApplied: true, revisionReviewed: true,
            recheckVerdict: 'UNPARSEABLE' as const, stoppedEarly: null, promptContract: 'role-plan-review-v4', stepCount: 4 };
        const pilot = { ...receipt, receiptIntegrity: { ...receipt.receiptIntegrity!, signatureStatus: 'SIGNED' as const },
            htmlPilotEvidence: { receiptId: receipt.receiptId, outputSha256: await hashExactOutput(output), runId: 'a'.repeat(32) } } as GovernanceEvidenceReceipt;
        for (const rolePlan of [legacy, { ...legacy, recheckDiagnostic: 'FINDINGS_FILTERED' as const }]) {
            const archived = (await createReceiptArchive('pilot-diag', output, { ...pilot, rolePlan }))!;
            expect((await restoreReceiptArchive(JSON.parse(JSON.stringify(archived)), 'pilot-diag', output, snapshot))?.rolePlan).toEqual(rolePlan);
            for (const bad of [{ ...rolePlan, recheckDiagnostic: 'PRIVATE-TEXT' }, { ...rolePlan, reviewerDiagnostic: 'INVALID_JSON' },
                { ...rolePlan, recheckDiagnostic: 'INVALID_JSON', recheckVerdict: 'PASS' }, { ...rolePlan, rawReview: 'private' }]) {
                expect(await createReceiptArchive('pilot-diag', output, { ...pilot, rolePlan: bad as never })).toBeUndefined();
                expect(await restoreReceiptArchive({ ...archived, receipt: { ...pilot, rolePlan: bad } }, 'pilot-diag', output, snapshot)).toBeUndefined();
            }
        }
    });

    it('keeps the role-plan verdict summary through save and restore so a history pack keeps the Role Plan Review (F5)', async () => {
        const rolePlan = { reviewerVerdict: 'REVISE' as const, revisionApplied: true, revisionReviewed: false, recheckVerdict: 'NOT_RUN' as const,
            stoppedEarly: 'ATTEMPT_DENIED' as const, promptContract: 'role-plan-review-v4', stepCount: 4 };
        const archive = (await createReceiptArchive('exec-rp', 'role plan output', { ...receipt, rolePlan }))!;
        expect(archive.receipt.rolePlan).toEqual(rolePlan);
        expect(archive.receipt.rolePlan).not.toBe(rolePlan);
        const restored = await restoreReceiptArchive(JSON.parse(JSON.stringify(archive)), 'exec-rp', 'role plan output', snapshot);
        expect(restored?.rolePlan).toEqual(rolePlan);
        const nullable = { ...rolePlan, reviewerVerdict: 'PASS' as const, revisionApplied: false, revisionReviewed: null, recheckVerdict: null, stoppedEarly: null, stepCount: 2 };
        expect((await createReceiptArchive('exec-rp', 'role plan output', { ...receipt, rolePlan: nullable }))?.receipt.rolePlan).toEqual(nullable);
        const plain = (await createReceiptArchive('exec-rp', 'role plan output', receipt))!;
        expect('rolePlan' in plain.receipt).toBe(false);
        expect(await restoreReceiptArchive(plain, 'exec-rp', 'role plan output', snapshot)).toEqual(plain.receipt);
    });

    it('refuses a malformed role-plan summary on save and on restore', async () => {
        const good = { reviewerVerdict: 'PASS', revisionApplied: false, revisionReviewed: null, recheckVerdict: null, stoppedEarly: null, promptContract: 'role-plan-review-v4', stepCount: 2 };
        const missingStepCount: Record<string, unknown> = { ...good };
        delete missingStepCount.stepCount;
        const bad: unknown[] = [
            { ...good, reviewerVerdict: 'APPROVED' }, { ...good, revisionApplied: 'yes' }, { ...good, revisionReviewed: 'no' },
            { ...good, recheckVerdict: 'OK' }, { ...good, stoppedEarly: 'TIMEOUT' }, { ...good, promptContract: 7 },
            { ...good, promptContract: 'x'.repeat(129) }, { ...good, stepCount: -1 }, { ...good, stepCount: 1.5 }, { ...good, stepCount: 17 },
            { ...good, extra: true }, missingStepCount, [], 'PASS', null,
        ];
        const archive = (await createReceiptArchive('exec-rp', 'role plan output', { ...receipt, rolePlan: good as never }))!;
        expect(await restoreReceiptArchive(archive, 'exec-rp', 'role plan output', snapshot)).toBeDefined();
        for (const rolePlan of bad) {
            expect(await createReceiptArchive('exec-rp', 'role plan output', { ...receipt, rolePlan: rolePlan as never })).toBeUndefined();
            expect(await restoreReceiptArchive({ ...archive, receipt: { ...archive.receipt, rolePlan } }, 'exec-rp', 'role plan output', snapshot)).toBeUndefined();
        }
    });
});
