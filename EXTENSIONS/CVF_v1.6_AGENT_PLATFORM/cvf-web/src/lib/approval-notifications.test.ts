import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApprovalNotificationManager, type ApprovalNotification } from './approval-notifications';

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
});
