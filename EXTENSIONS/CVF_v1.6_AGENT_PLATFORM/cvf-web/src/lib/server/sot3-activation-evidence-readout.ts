import {
    Sot3ActivationEvidenceStore,
    classifySot3EvidenceError,
    type Sot3ActivationEvidenceRecord,
    type Sot3EvidenceDiagnosticClass,
} from '../sot3-activation-evidence-store';
import type {
    Sot3KnowledgeActivationMode,
    Sot3KnowledgeFailureStage,
    Sot3KnowledgeTerminalOutcome,
} from '../sot3-knowledge-adapter';

export type Sot3ActivationEvidenceReadoutState = 'AVAILABLE' | 'EMPTY' | 'UNAVAILABLE';

export interface Sot3ActivationEvidenceReadoutEntry {
    recordId: string;
    requestId: string;
    organization: string;
    team: string | null;
    mode: Sot3KnowledgeActivationMode;
    terminalOutcome: Sot3KnowledgeTerminalOutcome;
    failureStage: Sot3KnowledgeFailureStage | null;
    createdAtUtc: string;
    diagnosticClass: 'PERSISTED';
    schemaVersion: string;
    traceCount: number;
}

export interface Sot3ActivationEvidenceReadoutReport {
    state: Sot3ActivationEvidenceReadoutState;
    generatedAt: string;
    boundary: string;
    diagnosticClass: Sot3EvidenceDiagnosticClass | null;
    totalRecords: number;
    records: Sot3ActivationEvidenceReadoutEntry[];
    summary: {
        byMode: Record<Sot3KnowledgeActivationMode, number>;
        byOutcome: Record<Sot3KnowledgeTerminalOutcome, number>;
    };
}

export interface Sot3ActivationEvidenceReadoutStorePort {
    list(): Sot3ActivationEvidenceRecord[];
}

interface Sot3ActivationEvidenceReadoutOptions {
    store?: Sot3ActivationEvidenceReadoutStorePort;
    now?: () => string;
}

const READOUT_BOUNDARY =
    'Read-only projection of existing durable SOT3 activation evidence. It never mutates, appends, or exposes traces, integrity hashes, actor identifiers, raw errors, or the configured store path.';

const RECORD_LIMIT = 50;

function emptySummary(): Sot3ActivationEvidenceReadoutReport['summary'] {
    return {
        byMode: { OFF: 0, SHADOW: 0, ENFORCE: 0 },
        byOutcome: { APPROVED: 0, REJECTED: 0, NO_CONTEXT: 0 },
    };
}

function projectRecord(record: Sot3ActivationEvidenceRecord): Sot3ActivationEvidenceReadoutEntry {
    return {
        recordId: record.recordId,
        requestId: record.requestId,
        organization: record.organization,
        team: record.team,
        mode: record.mode,
        terminalOutcome: record.terminalOutcome,
        failureStage: record.failureStage,
        createdAtUtc: record.createdAtUtc,
        diagnosticClass: record.diagnosticClass,
        schemaVersion: record.schemaVersion,
        traceCount: record.traces.length,
    };
}

function sortRecordsDescending(records: Sot3ActivationEvidenceRecord[]): Sot3ActivationEvidenceRecord[] {
    return [...records].sort((left, right) => {
        if (left.createdAtUtc !== right.createdAtUtc) {
            return left.createdAtUtc < right.createdAtUtc ? 1 : -1;
        }
        return left.recordId.localeCompare(right.recordId);
    });
}

export function getSot3ActivationEvidenceReadout(
    options: Sot3ActivationEvidenceReadoutOptions = {},
): Sot3ActivationEvidenceReadoutReport {
    const store = options.store ?? new Sot3ActivationEvidenceStore(process.env.CVF_SOT3_ACTIVATION_EVIDENCE_PATH);
    const now = options.now ?? (() => new Date().toISOString());

    let records: Sot3ActivationEvidenceRecord[];
    try {
        records = store.list();
    } catch (error) {
        return {
            state: 'UNAVAILABLE',
            generatedAt: now(),
            boundary: READOUT_BOUNDARY,
            diagnosticClass: classifySot3EvidenceError(error),
            totalRecords: 0,
            records: [],
            summary: emptySummary(),
        };
    }

    if (records.length === 0) {
        return {
            state: 'EMPTY',
            generatedAt: now(),
            boundary: READOUT_BOUNDARY,
            diagnosticClass: null,
            totalRecords: 0,
            records: [],
            summary: emptySummary(),
        };
    }

    const sorted = sortRecordsDescending(records);
    const bounded = sorted.slice(0, RECORD_LIMIT);
    const summary = emptySummary();
    for (const record of sorted) {
        summary.byMode[record.mode] += 1;
        summary.byOutcome[record.terminalOutcome] += 1;
    }

    return {
        state: 'AVAILABLE',
        generatedAt: now(),
        boundary: READOUT_BOUNDARY,
        diagnosticClass: 'PERSISTED',
        totalRecords: sorted.length,
        records: bounded.map(projectRecord),
        summary,
    };
}
