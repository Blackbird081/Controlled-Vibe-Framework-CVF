import {
    MaoFileRunStore,
    buildReadModel,
    type MaoDurableRunListSuccess,
    type MaoDurableRunResumeSuccess,
    type MaoDurableRunStoreFailure,
    type MaoEventLedgerEntry,
    type MaoGeneratedReadModel,
    type MaoReadModelTaskState,
    type MaoTerminalOutcome,
} from 'cvf-execution-plane-foundation';

export type MaoDurableRunReadoutState = 'AVAILABLE' | 'EMPTY' | 'UNAVAILABLE';

export type MaoDurableRunReadoutDiagnosticClass = 'MAO_RUN_STORE_NOT_CONFIGURED' | 'MAO_RUN_STORE_DISCOVERY_FAILED';

export interface MaoDurableRunReadoutTask {
    taskId: string;
    state: MaoReadModelTaskState['state'];
    terminalOutcome: MaoTerminalOutcome | null;
    lastEventId: string;
    lastSequence: number;
}

export interface MaoDurableRunReadoutRun {
    taskGraphId: string;
    eventCount: number;
    taskCount: number;
    timeoutCount: number;
    latestEventAt: string | null;
    tasks: MaoDurableRunReadoutTask[];
}

export interface MaoDurableRunReadoutReport {
    state: MaoDurableRunReadoutState;
    generatedAt: string;
    boundary: string;
    diagnosticClass: MaoDurableRunReadoutDiagnosticClass | null;
    totalRuns: number;
    runs: MaoDurableRunReadoutRun[];
}

export interface MaoDurableRunReadoutStorePort {
    listRunIds(): Promise<MaoDurableRunListSuccess | MaoDurableRunStoreFailure>;
    resumeRun(taskGraphId: string): Promise<MaoDurableRunResumeSuccess | MaoDurableRunStoreFailure>;
}

interface MaoDurableRunReadoutOptions {
    store?: MaoDurableRunReadoutStorePort;
    now?: () => string;
}

const READOUT_BOUNDARY =
    'Read-only durable-event projection over an existing MAO run store: run discovery, generated task state, TIMEOUT_DETECTED counts, and event recency only. It never exposes evidence records, evidence milestones, evidence freshness, heartbeat, live-process status, or raw graph authority/event/store detail, and never launches, cancels, retries, or queues a worker.';

const RUN_LIMIT = 50;
const TASK_LIMIT = 100;

function projectTask(taskState: MaoReadModelTaskState): MaoDurableRunReadoutTask {
    return {
        taskId: taskState.taskId,
        state: taskState.state,
        terminalOutcome: taskState.terminalOutcome,
        lastEventId: taskState.lastEventId,
        lastSequence: taskState.lastSequence,
    };
}

function latestEventTimestamp(events: readonly MaoEventLedgerEntry[]): string | null {
    let latest: string | null = null;
    for (const event of events) {
        if (latest === null || event.occurredAt > latest) {
            latest = event.occurredAt;
        }
    }
    return latest;
}

function timeoutCountFor(events: readonly MaoEventLedgerEntry[]): number {
    let count = 0;
    for (const event of events) {
        if (event.eventType === 'TIMEOUT_DETECTED') count += 1;
    }
    return count;
}

function projectRun(
    taskGraphId: string,
    readModel: MaoGeneratedReadModel,
    events: readonly MaoEventLedgerEntry[],
): MaoDurableRunReadoutRun {
    return {
        taskGraphId,
        eventCount: events.length,
        taskCount: readModel.taskStates.length,
        timeoutCount: timeoutCountFor(events),
        latestEventAt: latestEventTimestamp(events),
        tasks: readModel.taskStates.slice(0, TASK_LIMIT).map(projectTask),
    };
}

function sortRuns(runs: MaoDurableRunReadoutRun[]): MaoDurableRunReadoutRun[] {
    return [...runs].sort((left, right) => {
        if (left.latestEventAt !== right.latestEventAt) {
            if (left.latestEventAt === null) return 1;
            if (right.latestEventAt === null) return -1;
            return left.latestEventAt < right.latestEventAt ? 1 : -1;
        }
        return left.taskGraphId.localeCompare(right.taskGraphId);
    });
}

function unavailableReport(now: () => string, diagnosticClass: MaoDurableRunReadoutDiagnosticClass): MaoDurableRunReadoutReport {
    return {
        state: 'UNAVAILABLE',
        generatedAt: now(),
        boundary: READOUT_BOUNDARY,
        diagnosticClass,
        totalRuns: 0,
        runs: [],
    };
}

export async function getMaoDurableRunReadout(
    options: MaoDurableRunReadoutOptions = {},
): Promise<MaoDurableRunReadoutReport> {
    const now = options.now ?? (() => new Date().toISOString());

    let store: MaoDurableRunReadoutStorePort | undefined = options.store;

    if (!store) {
        const configuredPath = process.env.CVF_MAO_DURABLE_RUN_PATH;
        if (typeof configuredPath !== 'string' || configuredPath.trim().length === 0) {
            return unavailableReport(now, 'MAO_RUN_STORE_NOT_CONFIGURED');
        }
        store = new MaoFileRunStore(configuredPath);
    }

    const discovery = await store.listRunIds();
    if (!discovery.ok) {
        return unavailableReport(now, 'MAO_RUN_STORE_DISCOVERY_FAILED');
    }

    if (discovery.taskGraphIds.length === 0) {
        return {
            state: 'EMPTY',
            generatedAt: now(),
            boundary: READOUT_BOUNDARY,
            diagnosticClass: null,
            totalRuns: 0,
            runs: [],
        };
    }

    const runs: MaoDurableRunReadoutRun[] = [];
    for (const taskGraphId of discovery.taskGraphIds) {
        const resumed = await store.resumeRun(taskGraphId);
        if (!resumed.ok) {
            return unavailableReport(now, 'MAO_RUN_STORE_DISCOVERY_FAILED');
        }

        const readModel = buildReadModel({
            graph: resumed.graph,
            entries: resumed.events,
            generatedAt: now(),
        });

        runs.push(projectRun(taskGraphId, readModel, resumed.events));
    }

    const sorted = sortRuns(runs);
    const bounded = sorted.slice(0, RUN_LIMIT);

    return {
        state: 'AVAILABLE',
        generatedAt: now(),
        boundary: READOUT_BOUNDARY,
        diagnosticClass: null,
        totalRuns: sorted.length,
        runs: bounded,
    };
}
