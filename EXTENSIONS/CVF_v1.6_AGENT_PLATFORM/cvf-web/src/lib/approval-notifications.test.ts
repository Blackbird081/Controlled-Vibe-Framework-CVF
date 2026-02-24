import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    ApprovalNotificationManager,
    getApprovalNotificationManager,
    type ApprovalNotification,
} from './approval-notifications';

describe('ApprovalNotificationManager', () => {
    let manager: ApprovalNotificationManager;

    beforeEach(() => {
        manager = new ApprovalNotificationManager(100); // fast polling for tests
        vi.useFakeTimers();
    });

    afterEach(() => {
        manager.dispose();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('starts and stops polling', () => {
        expect(manager.isPolling()).toBe(false);
        manager.start();
        expect(manager.isPolling()).toBe(true);
        manager.stop();
        expect(manager.isPolling()).toBe(false);
    });

    it('tracks and untracks request IDs', () => {
        manager.track('req-001');
        manager.track('req-002');
        expect(manager.trackedCount).toBe(2);
        manager.untrack('req-001');
        expect(manager.trackedCount).toBe(1);
    });

    it('subscribes and unsubscribes callbacks', () => {
        const cb = vi.fn();
        const unsub = manager.subscribe(cb);
        expect(typeof unsub).toBe('function');
        unsub();
        // After unsubscribe, callback should not be called
    });

    it('emits created notification for new request', async () => {
        vi.useRealTimers();
        const notifications: ApprovalNotification[] = [];
        manager.subscribe(n => notifications.push(n));
        manager.track('req-new');

        // Mock fetch
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'PENDING', data: { current_step: 0, total_steps: 4 } }),
        });

        await manager.poll();
        expect(notifications.length).toBe(1);
        expect(notifications[0].type).toBe('created');
        expect(notifications[0].requestId).toBe('req-new');
    });

    it('emits step_approved when step progresses', async () => {
        vi.useRealTimers();
        const notifications: ApprovalNotification[] = [];
        manager.subscribe(n => notifications.push(n));
        manager.track('req-step');

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: { status: 'PENDING', current_step: 1, total_steps: 4 } }),
        });

        // First poll — creates snapshot
        await manager.poll();
        notifications.length = 0;

        // Second poll — step advanced
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: { status: 'PENDING', current_step: 2, total_steps: 4 } }),
        });
        await manager.poll();
        expect(notifications.some(n => n.type === 'step_approved')).toBe(true);
    });

    it('emits final_approved and auto-untracks', async () => {
        vi.useRealTimers();
        const notifications: ApprovalNotification[] = [];
        manager.subscribe(n => notifications.push(n));
        manager.track('req-final');

        // First poll — initial
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: { status: 'PENDING', current_step: 3, total_steps: 4 } }),
        });
        await manager.poll();
        notifications.length = 0;

        // Second poll — approved
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'APPROVED', data: { status: 'APPROVED', current_step: 4, total_steps: 4 } }),
        });
        await manager.poll();
        expect(notifications.some(n => n.type === 'final_approved')).toBe(true);
        // Auto-untracked
        expect(manager.trackedCount).toBe(0);
    });

    it('emits escalated notification', async () => {
        vi.useRealTimers();
        const notifications: ApprovalNotification[] = [];
        manager.subscribe(n => notifications.push(n));
        manager.track('req-esc');

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: { status: 'PENDING', current_step: 1, total_steps: 4, escalated: false } }),
        });
        await manager.poll();
        notifications.length = 0;

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: { status: 'PENDING', current_step: 1, total_steps: 4, escalated: true } }),
        });
        await manager.poll();
        expect(notifications.some(n => n.type === 'escalated')).toBe(true);
    });

    it('handles fetch errors gracefully', async () => {
        vi.useRealTimers();
        const notifications: ApprovalNotification[] = [];
        manager.subscribe(n => notifications.push(n));
        manager.track('req-err');

        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));
        await manager.poll(); // should not throw
        expect(notifications.length).toBe(0);
    });

    it('disposes cleanly', () => {
        manager.track('req-1');
        manager.start();
        manager.subscribe(() => {});
        manager.dispose();
        expect(manager.isPolling()).toBe(false);
        expect(manager.trackedCount).toBe(0);
    });

    it('does not poll when there are no tracked requests', async () => {
        vi.useRealTimers();
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        await manager.poll();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('ignores non-ok responses without emitting notifications', async () => {
        vi.useRealTimers();
        const notifications: ApprovalNotification[] = [];
        manager.subscribe(n => notifications.push(n));
        manager.track('req-non-ok');

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
        await manager.poll();

        expect(notifications.length).toBe(0);
    });

    it('emits step_rejected and final_rejected then auto-untracks', async () => {
        vi.useRealTimers();
        const notifications: ApprovalNotification[] = [];
        manager.subscribe(n => notifications.push(n));
        manager.track('req-reject');

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: { status: 'PENDING', current_step: 1, total_steps: 4 } }),
        }));
        await manager.poll();
        notifications.length = 0;

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: { status: 'STEP_REJECTED', current_step: 1, total_steps: 4 } }),
        }));
        await manager.poll();
        expect(notifications.some(n => n.type === 'step_rejected')).toBe(true);

        notifications.length = 0;
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'REJECTED', data: { status: 'REJECTED', current_step: 1, total_steps: 4 } }),
        }));
        await manager.poll();
        expect(notifications.some(n => n.type === 'final_rejected')).toBe(true);
        expect(manager.trackedCount).toBe(0);
    });

    it('emits SLA warning only once when crossing threshold', async () => {
        vi.setSystemTime(new Date('2026-02-24T00:00:00.000Z'));
        const notifications: ApprovalNotification[] = [];
        manager.subscribe(n => notifications.push(n));
        manager.track('req-sla');

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                data: {
                    status: 'PENDING',
                    current_step: 1,
                    total_steps: 4,
                    sla_deadline: '2026-02-24T03:00:00.000Z',
                },
            }),
        }));
        await manager.poll();
        notifications.length = 0;

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                data: {
                    status: 'PENDING',
                    current_step: 1,
                    total_steps: 4,
                    sla_deadline: '2026-02-24T00:30:00.000Z',
                },
            }),
        }));
        await manager.poll();
        expect(notifications.some(n => n.type === 'sla_warning')).toBe(true);

        notifications.length = 0;
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                data: {
                    status: 'PENDING',
                    current_step: 1,
                    total_steps: 4,
                    sla_deadline: '2026-02-24T00:20:00.000Z',
                },
            }),
        }));
        await manager.poll();
        expect(notifications.some(n => n.type === 'sla_warning')).toBe(false);
    });

    it('continues notifying when one callback throws', async () => {
        vi.useRealTimers();
        const cbOk = vi.fn();
        manager.subscribe(() => {
            throw new Error('callback failed');
        });
        manager.subscribe(cbOk);
        manager.track('req-callback');

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: { status: 'PENDING', current_step: 0, total_steps: 4 } }),
        }));
        await manager.poll();

        expect(cbOk).toHaveBeenCalledTimes(1);
    });

    it('returns singleton instance via getApprovalNotificationManager', () => {
        const instanceA = getApprovalNotificationManager();
        const instanceB = getApprovalNotificationManager();

        expect(instanceA).toBe(instanceB);
        instanceA.dispose();
    });
});
