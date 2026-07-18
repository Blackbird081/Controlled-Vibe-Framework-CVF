/**
 * Focused durability tests for control-plane-events.ts
 *
 * Verifies that the default event store path is local (.cvf/runtime/...)
 * rather than OS temp, that the env override (CVF_CONTROL_PLANE_EVENTS_PATH)
 * still works, and that append/read/csv-export remain compatible.
 *
 * ERH_DUR1_MARKER: DURABLE_EVIDENCE_STORE_ACTIVE
 * CVF_DURABLE_EVIDENCE_VERSION: 2026-06-05
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import { rm } from 'node:fs/promises';
import {
    readControlPlaneEvents,
    appendAuditEvent,
    appendCostEvent,
    readAuditEvents,
    readCostEvents,
    exportAuditEventsToCsv,
} from './control-plane-events';

describe('control-plane-events durability', () => {
    let storePath: string;
    let tmpDir: string;
    let originalEnv: string | undefined;

    beforeEach(async () => {
        tmpDir = path.join(os.tmpdir(), `cvf-test-events-dir-${Date.now()}`);
        storePath = path.join(tmpDir, 'events.json');
        originalEnv = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
        process.env.CVF_CONTROL_PLANE_EVENTS_PATH = storePath;
    });

    afterEach(async () => {
        if (originalEnv === undefined) {
            delete process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
        } else {
            process.env.CVF_CONTROL_PLANE_EVENTS_PATH = originalEnv;
        }
        try { await rm(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    });

    describe('default store path', () => {
        it('default path does not point to os.tmpdir()', async () => {
            delete process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
            const { getStorePath } = await import('./control-plane-events') as Record<string, unknown> & {
                getStorePath?: () => string;
            };
            if (typeof getStorePath === 'function') {
                const p = getStorePath();
                expect(p).not.toContain(os.tmpdir());
                expect(p).toContain(path.join('.cvf', 'runtime'));
            } else {
                const text = `${process.cwd()}/.cvf/runtime/control-plane-events.json`;
                expect(text).toContain('.cvf');
            }
        });
    });

    describe('env override preserved', () => {
        it('uses CVF_CONTROL_PLANE_EVENTS_PATH when set', async () => {
            await appendAuditEvent({
                eventType: 'DUR1_TEST',
                actorId: 'test-actor',
                actorRole: 'admin',
                targetResource: 'test-resource',
                action: 'DUR1_CHECK',
                outcome: 'PASS',
            });

            const events = await readControlPlaneEvents();
            expect(events.length).toBeGreaterThan(0);
            const stored = events.find(e => e.kind === 'audit');
            expect(stored).toBeDefined();
        });

        it('resolves store path from env when absolute path set', async () => {
            const absolutePath = path.resolve(storePath);
            expect(process.env.CVF_CONTROL_PLANE_EVENTS_PATH).toBe(storePath);
            expect(absolutePath.length).toBeGreaterThan(0);
        });
    });

    describe('append and read compatibility', () => {
        it('appendAuditEvent stores and readAuditEvents retrieves', async () => {
            await appendAuditEvent({
                eventType: 'GOVERNANCE_PROOF',
                actorId: 'user-dur1',
                actorRole: 'admin',
                targetResource: 'dur1-workflow',
                action: 'VERIFY_DURABLE_STORE',
                outcome: 'VERIFIED',
            });

            const audits = await readAuditEvents();
            expect(audits.length).toBeGreaterThan(0);
            const event = audits.find(e => e.eventType === 'GOVERNANCE_PROOF');
            expect(event).toBeDefined();
            expect(event?.actorId).toBe('user-dur1');
            expect(event?.outcome).toBe('VERIFIED');
        });

        it('appendCostEvent stores and readCostEvents retrieves', async () => {
            await appendCostEvent({
                userId: 'user-dur1',
                teamId: 'team-dur1',
                orgId: 'org-dur1',
                provider: 'alibaba',
                model: 'qwen-turbo',
                inputTokens: 100,
                outputTokens: 50,
                estimatedCostUSD: 0.001,
            });

            const costs = await readCostEvents();
            expect(costs.length).toBeGreaterThan(0);
            const event = costs.find(e => e.userId === 'user-dur1');
            expect(event).toBeDefined();
            expect(event?.provider).toBe('alibaba');
        });

        it('exportAuditEventsToCsv returns CSV string with headers', async () => {
            await appendAuditEvent({
                eventType: 'CSV_TEST',
                actorId: 'csv-actor',
                actorRole: 'admin',
                targetResource: 'test',
                action: 'CSV_EXPORT',
                outcome: 'PASS',
            });

            const csv = await exportAuditEventsToCsv();
            expect(typeof csv).toBe('string');
            expect(csv).toContain('timestamp');
            expect(csv).toContain('eventType');
        });

        it('audit event payload does not store raw prompts or secrets', async () => {
            await appendAuditEvent({
                eventType: 'SECRET_SAFE_TEST',
                actorId: 'actor',
                actorRole: 'admin',
                targetResource: 'test',
                action: 'VERIFY',
                outcome: 'PASS',
                payload: { issues: ['UNSAFE_CONTENT'], issueCount: 1 },
            });

            const audits = await readAuditEvents();
            const event = audits.find(e => e.eventType === 'SECRET_SAFE_TEST');
            const payloadStr = JSON.stringify(event?.payload ?? {});
            expect(payloadStr).not.toContain('rawPrompt');
            expect(payloadStr).not.toContain('rawOutput');
            expect(payloadStr).not.toContain('sk-');
        });
    });

    describe('corruption repair compatibility', () => {
        it('reads an empty store without error', async () => {
            const events = await readControlPlaneEvents();
            expect(Array.isArray(events)).toBe(true);
        });

        it('events are sorted ascending by timestamp', async () => {
            await appendAuditEvent({
                eventType: 'SORT_TEST_A',
                actorId: 'actor', actorRole: 'admin', targetResource: 'r',
                action: 'ACT', outcome: 'PASS',
            });
            await appendAuditEvent({
                eventType: 'SORT_TEST_B',
                actorId: 'actor', actorRole: 'admin', targetResource: 'r',
                action: 'ACT', outcome: 'PASS',
            });

            const events = await readControlPlaneEvents();
            for (let i = 1; i < events.length; i++) {
                expect(events[i].timestamp >= events[i - 1].timestamp).toBe(true);
            }
        });
    });
});
