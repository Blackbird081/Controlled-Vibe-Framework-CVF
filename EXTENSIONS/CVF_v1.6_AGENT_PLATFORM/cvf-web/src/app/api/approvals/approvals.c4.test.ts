import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp } from 'node:fs/promises';

const appendAuditEventMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/lib/control-plane-events', () => ({
    appendAuditEvent: appendAuditEventMock,
}));

import { GET, POST } from './route';
import { getApprovalStore } from './store';

describe('C4.2 — Lazy expiry on GET /api/approvals', () => {
    let tempDir: string;

    beforeEach(async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-approvals-c4-'));
        process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
        getApprovalStore().clear();
        appendAuditEventMock.mockClear();
    });

    it('does not expire a pending request whose expiresAt is in the future', async () => {
        const store = getApprovalStore();
        store.set('apr-1', {
            id: 'apr-1',
            templateId: 'tpl-a',
            templateName: 'Template A',
            intent: 'build something',
            reason: 'test',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            status: 'pending',
            submittedAt: new Date().toISOString(),
        });

        const res = await GET();
        const body = await res.json() as { success: boolean; data: { id: string; status: string }[] };

        expect(body.success).toBe(true);
        expect(body.data[0].status).toBe('pending');
        expect(appendAuditEventMock).not.toHaveBeenCalled();
    });

    it('auto-expires a pending request whose expiresAt is in the past', async () => {
        const store = getApprovalStore();
        store.set('apr-2', {
            id: 'apr-2',
            templateId: 'tpl-b',
            templateName: 'Template B',
            intent: 'deploy',
            reason: 'urgent',
            expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
            status: 'pending',
            submittedAt: new Date(Date.now() - 90000).toISOString(),
        });

        const res = await GET();
        const body = await res.json() as { success: boolean; data: { id: string; status: string }[] };

        expect(body.success).toBe(true);
        expect(body.data[0].status).toBe('expired');
    });

    it('emits APPROVAL_EXPIRED audit event for each auto-expired request', async () => {
        const store = getApprovalStore();
        store.set('apr-3', {
            id: 'apr-3',
            templateId: 'tpl-c',
            templateName: 'Template C',
            intent: 'run migrations',
            reason: 'db update needed',
            expiresAt: new Date(Date.now() - 5000).toISOString(),
            status: 'pending',
            submittedAt: new Date(Date.now() - 90000).toISOString(),
        });
        store.set('apr-4', {
            id: 'apr-4',
            templateId: 'tpl-d',
            templateName: 'Template D',
            intent: 'export data',
            reason: 'analytics',
            expiresAt: new Date(Date.now() - 1000).toISOString(),
            status: 'pending',
            submittedAt: new Date(Date.now() - 90000).toISOString(),
        });

        await GET();

        expect(appendAuditEventMock).toHaveBeenCalledTimes(2);
        const calls = appendAuditEventMock.mock.calls.map((c: unknown[]) => c[0] as Record<string, unknown>);
        expect(calls.every((c) => c['eventType'] === 'APPROVAL_EXPIRED')).toBe(true);
        expect(calls.every((c) => c['outcome'] === 'EXPIRED')).toBe(true);
    });

    it('does not re-expire an already-expired request', async () => {
        const store = getApprovalStore();
        store.set('apr-5', {
            id: 'apr-5',
            templateId: 'tpl-e',
            templateName: 'Template E',
            intent: 'review',
            reason: 'manual check',
            expiresAt: new Date(Date.now() - 5000).toISOString(),
            status: 'expired',
            submittedAt: new Date(Date.now() - 90000).toISOString(),
        });

        await GET();

        expect(appendAuditEventMock).not.toHaveBeenCalled();
    });

    it('POST creates record with expiresAt 24h from submittedAt', async () => {
        const before = Date.now();
        const res = await POST(new Request('http://localhost/api/approvals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ templateId: 'tpl-f', intent: 'test intent' }),
        }) as unknown as NextRequest);
        const after = Date.now();

        const body = await res.json() as { success: boolean; expiresAt: string; submittedAt: string };
        expect(body.success).toBe(true);
        const expiryMs = new Date(body.expiresAt).getTime();
        const submittedMs = new Date(body.submittedAt).getTime();
        const delta = expiryMs - submittedMs;
        expect(delta).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 100);
        expect(delta).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 100);
        expect(submittedMs).toBeGreaterThanOrEqual(before);
        expect(submittedMs).toBeLessThanOrEqual(after);
    });

    it('POST stores optional toolId, toolPayload, riskLevel, phase', async () => {
        const res = await POST(new Request('http://localhost/api/approvals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                templateId: 'tpl-g',
                templateName: 'Deploy Prod',
                intent: 'deploy to production',
                toolId: 'tool-deploy',
                toolPayload: { server: 'prod-01', version: '1.2.3' },
                riskLevel: 'R3',
                phase: 'BUILD',
                reason: 'hotfix',
            }),
        }) as unknown as NextRequest);

        expect(res.status).toBe(201);
        const body = await res.json() as { success: boolean; id: string };
        expect(body.success).toBe(true);

        const record = getApprovalStore().get(body.id);
        expect(record?.toolId).toBe('tool-deploy');
        expect(record?.toolPayload).toEqual({ server: 'prod-01', version: '1.2.3' });
        expect(record?.riskLevel).toBe('R3');
        expect(record?.phase).toBe('BUILD');
    });
});
