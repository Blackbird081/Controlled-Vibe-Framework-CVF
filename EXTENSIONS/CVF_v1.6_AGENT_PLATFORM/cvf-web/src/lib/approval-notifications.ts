/**
 * Approval Notification System
 * Polls for approval status changes and triggers callbacks
 */

export interface ApprovalNotification {
    type: 'created' | 'step_approved' | 'step_rejected' | 'sla_warning' | 'escalated' | 'final_approved' | 'final_rejected';
    requestId: string;
    message: string;
    timestamp: string;
    role?: string;
}

export interface ApprovalStatusSnapshot {
    requestId: string;
    status: string;
    currentStep: number;
    totalSteps: number;
    slaDeadline?: string;
    escalated?: boolean;
}

type NotificationCallback = (notification: ApprovalNotification) => void;

const SLA_WARNING_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

export class ApprovalNotificationManager {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private callbacks: NotificationCallback[] = [];
    private lastSnapshots: Map<string, ApprovalStatusSnapshot> = new Map();
    private pollIntervalMs: number;
    private trackedRequestIds: Set<string> = new Set();

    constructor(pollIntervalMs = 5000) {
        this.pollIntervalMs = pollIntervalMs;
    }

    /** Register a callback for notifications */
    subscribe(callback: NotificationCallback): () => void {
        this.callbacks.push(callback);
        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        };
    }

    /** Add a request ID to track */
    track(requestId: string): void {
        this.trackedRequestIds.add(requestId);
    }

    /** Remove a request ID from tracking */
    untrack(requestId: string): void {
        this.trackedRequestIds.delete(requestId);
        this.lastSnapshots.delete(requestId);
    }

    /** Start polling */
    start(): void {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => this.poll(), this.pollIntervalMs);
    }

    /** Stop polling */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /** Check if polling is active */
    isPolling(): boolean {
        return this.intervalId !== null;
    }

    /** Number of tracked requests */
    get trackedCount(): number {
        return this.trackedRequestIds.size;
    }

    private emit(notification: ApprovalNotification): void {
        for (const cb of this.callbacks) {
            try {
                cb(notification);
            } catch {
                // ignore callback errors
            }
        }
    }

    async poll(): Promise<void> {
        if (this.trackedRequestIds.size === 0) return;

        for (const requestId of this.trackedRequestIds) {
            try {
                const response = await fetch(`/api/governance/evaluate?request_id=${requestId}`);
                if (!response.ok) continue;

                const data = await response.json();
                const current: ApprovalStatusSnapshot = {
                    requestId,
                    status: data.status || data.data?.status || 'PENDING',
                    currentStep: data.data?.current_step ?? 0,
                    totalSteps: data.data?.total_steps ?? 4,
                    slaDeadline: data.data?.sla_deadline,
                    escalated: data.data?.escalated ?? false,
                };

                const prev = this.lastSnapshots.get(requestId);
                this.detectChanges(prev, current);
                this.lastSnapshots.set(requestId, current);

                // Auto-untrack completed requests
                if (current.status === 'APPROVED' || current.status === 'REJECTED') {
                    this.trackedRequestIds.delete(requestId);
                }
            } catch {
                // network error, skip this cycle
            }
        }
    }

    private detectChanges(prev: ApprovalStatusSnapshot | undefined, current: ApprovalStatusSnapshot): void {
        const now = new Date().toISOString();

        // New request (no previous snapshot)
        if (!prev) {
            this.emit({
                type: 'created',
                requestId: current.requestId,
                message: `Approval request ${current.requestId} created`,
                timestamp: now,
            });
            return;
        }

        // Step progressed
        if (current.currentStep > prev.currentStep) {
            this.emit({
                type: 'step_approved',
                requestId: current.requestId,
                message: `Step ${prev.currentStep + 1} approved for ${current.requestId}`,
                timestamp: now,
            });
        }

        // Step rejected (status changed to rejected while in progress)
        if (current.status === 'STEP_REJECTED' && prev.status !== 'STEP_REJECTED') {
            this.emit({
                type: 'step_rejected',
                requestId: current.requestId,
                message: `Step rejected for ${current.requestId}`,
                timestamp: now,
            });
        }

        // Escalation detected
        if (current.escalated && !prev.escalated) {
            this.emit({
                type: 'escalated',
                requestId: current.requestId,
                message: `Request ${current.requestId} auto-escalated`,
                timestamp: now,
            });
        }

        // SLA warning
        if (current.slaDeadline) {
            const deadline = new Date(current.slaDeadline).getTime();
            const remaining = deadline - Date.now();
            if (remaining > 0 && remaining < SLA_WARNING_THRESHOLD_MS) {
                const prevDeadline = prev.slaDeadline ? new Date(prev.slaDeadline).getTime() : 0;
                const prevRemaining = prevDeadline - Date.now();
                // Only emit once when crossing threshold
                if (!prev.slaDeadline || prevRemaining >= SLA_WARNING_THRESHOLD_MS) {
                    this.emit({
                        type: 'sla_warning',
                        requestId: current.requestId,
                        message: `SLA deadline approaching for ${current.requestId} (${Math.round(remaining / 60000)} min remaining)`,
                        timestamp: now,
                    });
                }
            }
        }

        // Final approved
        if (current.status === 'APPROVED' && prev.status !== 'APPROVED') {
            this.emit({
                type: 'final_approved',
                requestId: current.requestId,
                message: `Request ${current.requestId} fully approved`,
                timestamp: now,
            });
        }

        // Final rejected
        if (current.status === 'REJECTED' && prev.status !== 'REJECTED') {
            this.emit({
                type: 'final_rejected',
                requestId: current.requestId,
                message: `Request ${current.requestId} rejected`,
                timestamp: now,
            });
        }
    }

    /** Clear all state */
    dispose(): void {
        this.stop();
        this.callbacks = [];
        this.lastSnapshots.clear();
        this.trackedRequestIds.clear();
    }
}

/** Singleton instance */
let _instance: ApprovalNotificationManager | null = null;

export function getApprovalNotificationManager(): ApprovalNotificationManager {
    if (!_instance) {
        _instance = new ApprovalNotificationManager();
    }
    return _instance;
}
