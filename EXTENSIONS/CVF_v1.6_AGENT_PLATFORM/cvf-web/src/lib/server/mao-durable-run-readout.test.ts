import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MaoEventLedgerEntry } from 'cvf-execution-plane-foundation';
import { getMaoDurableRunReadout, type MaoDurableRunReadoutStorePort } from './mao-durable-run-readout';

const ORIGINAL_PATH = process.env.CVF_MAO_DURABLE_RUN_PATH;

function event(overrides: Partial<MaoEventLedgerEntry> = {}): MaoEventLedgerEntry {
    return {
        eventId: 'evt-1',
        taskGraphId: 'graph-a',
        taskId: 'task-1',
        eventType: 'TASK_TRANSITIONED',
        occurredAt: '2026-07-18T00:00:00.000Z',
        resultingState: 'running',
        sequence: 1,
        idempotencyKey: null,
        ...overrides,
    };
}

function graph(taskGraphId: string, taskIds: string[]) {
    return {
        taskGraphId,
        authorityEnvelope: {} as never,
        compilerVersion: 'v1',
        tasks: taskIds.map((taskId) => ({ taskId }) as never),
        dependencyManifest: [],
    };
}

describe('getMaoDurableRunReadout', () => {
    beforeEach(() => {
        delete process.env.CVF_MAO_DURABLE_RUN_PATH;
    });

    afterEach(() => {
        if (ORIGINAL_PATH === undefined) {
            delete process.env.CVF_MAO_DURABLE_RUN_PATH;
        } else {
            process.env.CVF_MAO_DURABLE_RUN_PATH = ORIGINAL_PATH;
        }
    });

    it('is UNAVAILABLE without config, creating no store', async () => {
        const report = await getMaoDurableRunReadout();
        expect(report.state).toBe('UNAVAILABLE');
        expect(report.diagnosticClass).toBe('MAO_RUN_STORE_NOT_CONFIGURED');
        expect(report.runs).toEqual([]);
    });

    it('is UNAVAILABLE with a blank config value', async () => {
        process.env.CVF_MAO_DURABLE_RUN_PATH = '   ';
        const report = await getMaoDurableRunReadout();
        expect(report.state).toBe('UNAVAILABLE');
        expect(report.diagnosticClass).toBe('MAO_RUN_STORE_NOT_CONFIGURED');
    });

    it('is EMPTY when discovery finds no runs', async () => {
        const store: MaoDurableRunReadoutStorePort = {
            listRunIds: async () => ({ ok: true, taskGraphIds: [] }),
            resumeRun: async () => ({ ok: false, reason: 'RUN_NOT_FOUND', detail: 'should not be called' }),
        };

        const report = await getMaoDurableRunReadout({ store });
        expect(report.state).toBe('EMPTY');
        expect(report.totalRuns).toBe(0);
    });

    it('maps exact allowlisted fields for a valid replay with deterministic task ordering', async () => {
        const events = [
            event({ eventId: 'e1', taskId: 'b-task', sequence: 1, occurredAt: '2026-07-18T00:00:00.000Z' }),
            event({ eventId: 'e2', taskId: 'a-task', sequence: 2, occurredAt: '2026-07-18T00:05:00.000Z', resultingState: 'succeeded' }),
        ];
        const store: MaoDurableRunReadoutStorePort = {
            listRunIds: async () => ({ ok: true, taskGraphIds: ['graph-a'] }),
            resumeRun: async () => ({ ok: true, graph: graph('graph-a', ['a-task', 'b-task']), events }),
        };

        const report = await getMaoDurableRunReadout({ store, now: () => '2026-07-18T01:00:00.000Z' });

        expect(report.state).toBe('AVAILABLE');
        expect(report.totalRuns).toBe(1);
        const run = report.runs[0];
        expect(run.taskGraphId).toBe('graph-a');
        expect(run.eventCount).toBe(2);
        expect(run.taskCount).toBe(2);
        expect(run.latestEventAt).toBe('2026-07-18T00:05:00.000Z');
        expect(run.tasks.map((t) => t.taskId)).toEqual(['a-task', 'b-task']);
        expect(Object.keys(run.tasks[0]).sort()).toEqual(['lastEventId', 'lastSequence', 'state', 'taskId', 'terminalOutcome'].sort());
    });

    it('derives timeoutCount only from TIMEOUT_DETECTED events', async () => {
        const events = [
            event({ eventId: 'e1', eventType: 'TIMEOUT_DETECTED', resultingState: 'timed_out', sequence: 1 }),
            event({ eventId: 'e2', eventType: 'TASK_TRANSITIONED', resultingState: 'running', sequence: 2 }),
            event({ eventId: 'e3', eventType: 'TIMEOUT_DETECTED', resultingState: 'timed_out', sequence: 3 }),
        ];
        const store: MaoDurableRunReadoutStorePort = {
            listRunIds: async () => ({ ok: true, taskGraphIds: ['graph-a'] }),
            resumeRun: async () => ({ ok: true, graph: graph('graph-a', ['task-1']), events }),
        };

        const report = await getMaoDurableRunReadout({ store });
        expect(report.runs[0].timeoutCount).toBe(2);
    });

    it('returns no partial records when discovery fails', async () => {
        const store: MaoDurableRunReadoutStorePort = {
            listRunIds: async () => ({ ok: false, reason: 'IO_FAILURE', detail: 'disk unavailable at /secret/path' }),
            resumeRun: async () => ({ ok: false, reason: 'RUN_NOT_FOUND', detail: 'unused' }),
        };

        const report = await getMaoDurableRunReadout({ store });
        expect(report.state).toBe('UNAVAILABLE');
        expect(report.runs).toEqual([]);
        expect(report.totalRuns).toBe(0);
    });

    it('returns no partial records when any resumed run fails', async () => {
        const store: MaoDurableRunReadoutStorePort = {
            listRunIds: async () => ({ ok: true, taskGraphIds: ['graph-a', 'graph-b'] }),
            resumeRun: async (taskGraphId: string) => {
                if (taskGraphId === 'graph-a') {
                    return { ok: true, graph: graph('graph-a', ['task-1']), events: [event()] };
                }
                return { ok: false, reason: 'SNAPSHOT_SCHEMA_MISMATCH', detail: 'schema drift at /secret/path/graph-b.json' };
            },
        };

        const report = await getMaoDurableRunReadout({ store });
        expect(report.state).toBe('UNAVAILABLE');
        expect(report.runs).toEqual([]);
    });

    it('never leaks raw detail or the configured path into the diagnostic class', async () => {
        process.env.CVF_MAO_DURABLE_RUN_PATH = '/very/secret/run/store/root';
        const store: MaoDurableRunReadoutStorePort = {
            listRunIds: async () => ({ ok: false, reason: 'IO_FAILURE', detail: '/very/secret/run/store/root is unreadable' }),
            resumeRun: async () => ({ ok: false, reason: 'RUN_NOT_FOUND', detail: 'unused' }),
        };

        const report = await getMaoDurableRunReadout({ store });
        const serialized = JSON.stringify(report);
        expect(serialized).not.toContain('/very/secret/run/store/root');
        expect(serialized).not.toContain('unreadable');
        expect(report.diagnosticClass).toBe('MAO_RUN_STORE_DISCOVERY_FAILED');
    });

    it('caps output at 50 runs and 100 tasks per run', async () => {
        const manyGraphIds = Array.from({ length: 60 }, (_, i) => `graph-${String(i).padStart(2, '0')}`);
        const manyTaskIds = Array.from({ length: 120 }, (_, i) => `task-${String(i).padStart(3, '0')}`);

        const store: MaoDurableRunReadoutStorePort = {
            listRunIds: async () => ({ ok: true, taskGraphIds: manyGraphIds }),
            resumeRun: async (taskGraphId: string) => ({
                ok: true,
                graph: graph(taskGraphId, manyTaskIds),
                events: [event({ taskId: manyTaskIds[0], occurredAt: `2026-07-18T00:00:${taskGraphId.slice(-2)}.000Z` })],
            }),
        };

        const report = await getMaoDurableRunReadout({ store });
        expect(report.totalRuns).toBe(60);
        expect(report.runs.length).toBe(50);
        expect(report.runs[0].tasks.length).toBe(100);
    });

    it('sorts runs by latestEventAt descending, null last, then taskGraphId', async () => {
        const store: MaoDurableRunReadoutStorePort = {
            listRunIds: async () => ({ ok: true, taskGraphIds: ['graph-null', 'graph-early', 'graph-late'] }),
            resumeRun: async (taskGraphId: string) => {
                if (taskGraphId === 'graph-null') {
                    return { ok: true, graph: graph(taskGraphId, ['task-1']), events: [] };
                }
                const occurredAt = taskGraphId === 'graph-late' ? '2026-07-18T02:00:00.000Z' : '2026-07-18T01:00:00.000Z';
                return { ok: true, graph: graph(taskGraphId, ['task-1']), events: [event({ occurredAt })] };
            },
        };

        const report = await getMaoDurableRunReadout({ store });
        expect(report.runs.map((r) => r.taskGraphId)).toEqual(['graph-late', 'graph-early', 'graph-null']);
    });
});
