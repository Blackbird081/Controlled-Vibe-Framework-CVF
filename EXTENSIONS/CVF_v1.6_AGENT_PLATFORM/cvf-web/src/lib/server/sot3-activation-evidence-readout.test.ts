import { describe, expect, it } from 'vitest';
import {
    computeSot3EvidenceRecordIntegrityHash,
    deriveSot3EvidenceRecordId,
    SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION,
    type Sot3ActivationEvidenceRecord,
} from '../sot3-activation-evidence-store';
import {
    getSot3ActivationEvidenceReadout,
    type Sot3ActivationEvidenceReadoutStorePort,
} from './sot3-activation-evidence-readout';

function buildRecord(overrides: Partial<Sot3ActivationEvidenceRecord> = {}): Sot3ActivationEvidenceRecord {
    const base = {
        recordId: deriveSot3EvidenceRecordId({
            requestId: overrides.requestId ?? 'req-1',
            actorId: 'usr_a',
            organization: overrides.organization ?? 'org_a',
            team: overrides.team ?? 'team_a',
            mode: overrides.mode ?? 'ENFORCE',
        }),
        requestId: 'req-1',
        actorId: 'usr_a',
        organization: 'org_a',
        team: 'team_a' as string | null,
        mode: 'ENFORCE' as const,
        terminalOutcome: 'APPROVED' as const,
        failureStage: null,
        createdAtUtc: '2026-07-13T00:00:00.000Z',
        diagnosticClass: 'PERSISTED' as const,
        schemaVersion: SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION,
        traces: [],
        ...overrides,
    };
    const { integrityHash: _ignored, ...rest } = base as Sot3ActivationEvidenceRecord;
    const integrityHash = computeSot3EvidenceRecordIntegrityHash(rest);
    return { ...rest, integrityHash };
}

function fakeStore(records: Sot3ActivationEvidenceRecord[]): Sot3ActivationEvidenceReadoutStorePort {
    return { list: () => records };
}

function throwingStore(error: unknown): Sot3ActivationEvidenceReadoutStorePort {
    return {
        list: () => {
            throw error;
        },
    };
}

describe('getSot3ActivationEvidenceReadout', () => {
    it('returns AVAILABLE with the exact allowlisted projection and no forbidden fields', () => {
        const record = buildRecord({
            requestId: 'req-a',
            traces: [
                {
                    chunkId: 'chunk-1',
                    collectionId: 'coll-1',
                    sourceId: null,
                    terminalOutcome: 'APPROVED',
                    failureStage: null,
                    refineryPacketId: null,
                    refineryPacketHash: null,
                    refineryStatus: null,
                    kernelDecision: null,
                    truthReceipt: null,
                    truthReference: null,
                    flowPackage: null,
                },
            ],
        });

        const report = getSot3ActivationEvidenceReadout({
            store: fakeStore([record]),
            now: () => '2026-07-18T00:00:00.000Z',
        });

        expect(report.state).toBe('AVAILABLE');
        expect(report.generatedAt).toBe('2026-07-18T00:00:00.000Z');
        expect(report.diagnosticClass).toBe('PERSISTED');
        expect(report.totalRecords).toBe(1);
        expect(report.records).toHaveLength(1);

        const entry = report.records[0];
        expect(entry).toMatchObject({
            recordId: record.recordId,
            requestId: 'req-a',
            organization: 'org_a',
            team: 'team_a',
            mode: 'ENFORCE',
            terminalOutcome: 'APPROVED',
            failureStage: null,
            createdAtUtc: '2026-07-13T00:00:00.000Z',
            diagnosticClass: 'PERSISTED',
            schemaVersion: SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION,
            traceCount: 1,
        });
        expect(Object.keys(entry).sort()).toEqual([
            'createdAtUtc',
            'diagnosticClass',
            'failureStage',
            'mode',
            'organization',
            'recordId',
            'requestId',
            'schemaVersion',
            'team',
            'terminalOutcome',
            'traceCount',
        ]);
        expect(entry).not.toHaveProperty('traces');
        expect(entry).not.toHaveProperty('integrityHash');
        expect(entry).not.toHaveProperty('actorId');
        expect(JSON.stringify(report)).not.toContain('integrityHash');
        expect(JSON.stringify(report)).not.toContain('actorId');
        expect(JSON.stringify(report)).not.toContain('chunk-1');
    });

    it('preserves zero as a valid trace count and null team/failure stage', () => {
        const record = buildRecord({
            requestId: 'req-b',
            team: null,
            terminalOutcome: 'NO_CONTEXT',
            failureStage: null,
            traces: [],
        });

        const report = getSot3ActivationEvidenceReadout({ store: fakeStore([record]) });

        expect(report.records[0].traceCount).toBe(0);
        expect(report.records[0].team).toBeNull();
        expect(report.records[0].failureStage).toBeNull();
    });

    it('sorts by createdAtUtc descending with recordId as a deterministic tie-breaker', () => {
        const older = buildRecord({ requestId: 'req-old', createdAtUtc: '2026-07-01T00:00:00.000Z' });
        const newer = buildRecord({ requestId: 'req-new', createdAtUtc: '2026-07-10T00:00:00.000Z' });
        const tieA = buildRecord({ requestId: 'req-tie-a', createdAtUtc: '2026-07-05T00:00:00.000Z' });
        const tieB = buildRecord({ requestId: 'req-tie-b', createdAtUtc: '2026-07-05T00:00:00.000Z' });
        const expectedTieOrder = [tieA, tieB].sort((a, b) => a.recordId.localeCompare(b.recordId));

        const report = getSot3ActivationEvidenceReadout({
            store: fakeStore([older, newer, tieA, tieB]),
        });

        expect(report.records.map((entry) => entry.requestId)).toEqual([
            'req-new',
            expectedTieOrder[0].requestId,
            expectedTieOrder[1].requestId,
            'req-old',
        ]);
    });

    it('caps output at 50 records while reporting the real total', () => {
        const records = Array.from({ length: 60 }, (_, index) =>
            buildRecord({
                requestId: `req-${index}`,
                createdAtUtc: new Date(2026, 0, index + 1).toISOString(),
            }),
        );

        const report = getSot3ActivationEvidenceReadout({ store: fakeStore(records) });

        expect(report.totalRecords).toBe(60);
        expect(report.records).toHaveLength(50);
    });

    it('returns EMPTY with zero records when the store has no records', () => {
        const report = getSot3ActivationEvidenceReadout({ store: fakeStore([]) });

        expect(report.state).toBe('EMPTY');
        expect(report.totalRecords).toBe(0);
        expect(report.records).toEqual([]);
        expect(report.diagnosticClass).toBeNull();
    });

    it('returns UNAVAILABLE with a secret-safe diagnostic class and never leaks raw error text or a path', () => {
        const error = new Error('ENOENT: ok /secret/path/sot3-activation-evidence.json corrupt at line 4');
        const report = getSot3ActivationEvidenceReadout({ store: throwingStore(error) });

        expect(report.state).toBe('UNAVAILABLE');
        expect(report.totalRecords).toBe(0);
        expect(report.records).toEqual([]);
        expect(report.diagnosticClass).toBe('SOT3_EVIDENCE_PERSISTENCE_FAILED');
        expect(JSON.stringify(report)).not.toContain('/secret/path');
        expect(JSON.stringify(report)).not.toContain('ENOENT');
    });

    it('reports a boundary statement asserting no mutation capability', () => {
        const report = getSot3ActivationEvidenceReadout({ store: fakeStore([]) });

        expect(report.boundary.length).toBeGreaterThan(0);
        expect(report.boundary.toLowerCase()).toContain('read-only');
    });
});
