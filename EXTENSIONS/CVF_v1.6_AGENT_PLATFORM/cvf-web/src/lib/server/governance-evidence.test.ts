import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { getGovernanceEvidenceReport } from './governance-evidence';

const roots: string[] = [];

function writeRepoFile(repoRoot: string, repoPath: string, content: string) {
    const absolutePath = resolve(repoRoot, repoPath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content);
}

function makeWorkspace(options: { withAllSources?: boolean } = {}) {
    const repoRoot = mkdtempSync(join(tmpdir(), 'cvf-evidence-'));
    roots.push(repoRoot);

    if (options.withAllSources) {
        writeRepoFile(repoRoot, 'docs/reviews/CVF_W149_CLOSURE_DECISION_2026-05-08.md', [
            '| CP7 release gate | `python scripts/run_cvf_release_gate_bundle.py --json` | PASS |',
        ].join('\n'));
        writeRepoFile(repoRoot, 'docs/reviews/CVF_W141_CLOSURE_DECISION_2026-05-08.md', 'Status: CLOSED DELIVERED');
        writeRepoFile(repoRoot, 'docs/reviews/CVF_W149_TRUSTED_FORM_DIRECT_API_ALIBABA_EVIDENCE_2026-05-08.json', JSON.stringify({
            capturedAt: '2026-05-07T21:33:19.589Z',
            provider: 'alibaba',
            model: 'qwen-plus',
            attempted: 40,
            accepted: 40,
            usefulByHeuristic: 40,
            records: [
                { receiptPresent: true },
                { receiptPresent: true },
            ],
        }));
        writeRepoFile(repoRoot, 'docs/reviews/CVF_W149_TRUSTED_FORM_UI_ALIBABA_EVIDENCE_2026-05-08.json', JSON.stringify({
            capturedAt: '2026-05-07T21:12:21.687Z',
            provider: 'alibaba',
            model: 'qwen-plus',
            attemptedJourneys: 40,
            acceptedWithReceipt: 40,
            journeyLog: [
                { pageSnippet: 'Receipt: rcpt-env-one Policy: pol-20260507-0001' },
                { pageSnippet: 'Receipt: rcpt-env-two Policy: pol-20260507-0002' },
            ],
        }));
        writeRepoFile(repoRoot, 'docs/reviews/CVF_W149_TRUSTED_FORM_DEEPSEEK_CONFIRMATORY_EVIDENCE_2026-05-08.json', JSON.stringify({
            capturedAt: '2026-05-07T21:16:51.186Z',
            provider: 'deepseek',
            model: 'deepseek-chat',
            attempted: 12,
            accepted: 12,
            usefulByHeuristic: 12,
            records: [{ receiptPresent: true }],
        }));
        writeRepoFile(repoRoot, 'docs/reviews/CVF_W141_TRUSTED_FORM_WIZARD_DISAMBIGUATION_ALIBABA_EVIDENCE_2026-05-08.json', JSON.stringify({
            capturedAt: '2026-05-07T18:00:00.000Z',
            provider: 'alibaba',
            model: 'qwen-plus',
            attemptedJourneys: 12,
            acceptedWithReceipt: 12,
            journeyLog: [{ pageSnippet: 'Policy: pol-20260507-0100' }],
        }));
    }

    return repoRoot;
}

describe('getGovernanceEvidenceReport', () => {
    afterEach(() => {
        for (const root of roots.splice(0)) {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('summarizes latest recorded release gate and provider lane evidence', () => {
        const repoRoot = makeWorkspace({ withAllSources: true });

        const report = getGovernanceEvidenceReport({
            repoRoot,
            now: () => '2026-05-08T00:00:00.000Z',
        });

        expect(report.generatedAt).toBe('2026-05-08T00:00:00.000Z');
        expect(report.releaseGate.status).toBe('pass');
        expect(report.providerLanes).toHaveLength(4);
        expect(report.providerLanes.map((lane) => lane.status)).toEqual(['pass', 'pass', 'pass', 'pass']);
        expect(report.providerLanes.find((lane) => lane.id === 'w149-alibaba-direct')).toMatchObject({
            attempted: 40,
            accepted: 40,
            receipts: 2,
            useful: 40,
        });
        expect(report.policySnapshots[0].policyIds).toEqual(['pol-20260507-0001', 'pol-20260507-0002']);
    });

    it('marks missing evidence sources without throwing', () => {
        const repoRoot = makeWorkspace();

        const report = getGovernanceEvidenceReport({ repoRoot });

        expect(report.releaseGate.status).toBe('unknown');
        expect(report.providerLanes.every((lane) => lane.status === 'missing')).toBe(true);
        expect(report.evidenceReceipts.every((receipt) => receipt.status === 'missing')).toBe(true);
    });
});
