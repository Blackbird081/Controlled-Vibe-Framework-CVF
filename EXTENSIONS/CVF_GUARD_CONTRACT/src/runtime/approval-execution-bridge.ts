import { createHash } from 'node:crypto';

export interface ApprovalExecutionBinding {
  command: string;
  parameters?: Record<string, unknown>;
  cwd: string;
  environment: Record<string, string>;
  actorId: string;
  sessionId: string;
}

export type ApprovalSettlementDecision = 'approved' | 'denied' | 'timed_out' | 'aborted';

export interface ApprovalSettlement {
  requestId: string;
  decision: ApprovalSettlementDecision;
  bindingHash: string;
  settledAt: string;
  reviewerId?: string;
  reason: string;
}

export interface PendingExecutionApproval {
  requestId: string;
  bindingHash: string;
  createdAt: string;
  expiresAt: string;
  result: Promise<ApprovalSettlement>;
}

interface MutablePendingApproval {
  bindingHash: string;
  createdAt: string;
  expiresAt: string;
  timer: ReturnType<typeof setTimeout>;
  signal?: AbortSignal;
  abortListener?: () => void;
  resolve: (settlement: ApprovalSettlement) => void;
}

export interface ApprovalExecutionBridgeDependencies {
  now?: () => string;
  defaultTimeoutMs?: number;
}

export class ApprovalExecutionBridge {
  private readonly pending = new Map<string, MutablePendingApproval>();
  private readonly now: () => string;
  private readonly defaultTimeoutMs: number;
  private sequence = 0;

  constructor(dependencies: ApprovalExecutionBridgeDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.defaultTimeoutMs = dependencies.defaultTimeoutMs ?? 60_000;
  }

  request(
    binding: ApprovalExecutionBinding,
    options: { timeoutMs?: number; signal?: AbortSignal } = {},
  ): PendingExecutionApproval {
    const createdAt = this.now();
    const timeoutMs = Math.max(1, options.timeoutMs ?? this.defaultTimeoutMs);
    const expiresAt = new Date(Date.parse(createdAt) + timeoutMs).toISOString();
    const bindingHash = this.hashBinding(binding);
    const requestId = `execution-approval-${hashStable({ bindingHash, createdAt, sequence: this.sequence++ })}`;

    if (options.signal?.aborted) {
      return {
        requestId,
        bindingHash,
        createdAt,
        expiresAt,
        result: Promise.resolve(this.makeSettlement(requestId, bindingHash, 'aborted', undefined, 'approval_aborted_before_registration')),
      };
    }

    let resolveResult!: (settlement: ApprovalSettlement) => void;
    const result = new Promise<ApprovalSettlement>((resolve) => { resolveResult = resolve; });
    const timer = setTimeout(() => {
      this.settleInternal(requestId, 'timed_out', undefined, 'approval_timed_out_fail_closed');
    }, timeoutMs);
    const pending: MutablePendingApproval = {
      bindingHash,
      createdAt,
      expiresAt,
      timer,
      signal: options.signal,
      resolve: resolveResult,
    };
    if (options.signal) {
      pending.abortListener = () => {
        this.settleInternal(requestId, 'aborted', undefined, 'approval_aborted_fail_closed');
      };
      options.signal.addEventListener('abort', pending.abortListener, { once: true });
    }
    this.pending.set(requestId, pending);
    return { requestId, bindingHash, createdAt, expiresAt, result };
  }

  settle(requestId: string, decision: 'approved' | 'denied', reviewerId: string): boolean {
    return this.settleInternal(
      requestId,
      decision,
      reviewerId,
      decision === 'approved' ? 'approval_granted' : 'approval_denied_fail_closed',
    );
  }

  listPending(): Array<Omit<PendingExecutionApproval, 'result'>> {
    return [...this.pending.entries()].map(([requestId, pending]) => ({
      requestId,
      bindingHash: pending.bindingHash,
      createdAt: pending.createdAt,
      expiresAt: pending.expiresAt,
    }));
  }

  hashBinding(binding: ApprovalExecutionBinding): string {
    return hashStable({
      command: binding.command,
      parameters: binding.parameters ?? {},
      cwd: binding.cwd,
      environment: binding.environment,
      actorId: binding.actorId,
      sessionId: binding.sessionId,
    });
  }

  private settleInternal(
    requestId: string,
    decision: ApprovalSettlementDecision,
    reviewerId: string | undefined,
    reason: string,
  ): boolean {
    const pending = this.pending.get(requestId);
    if (!pending) return false;
    this.pending.delete(requestId);
    clearTimeout(pending.timer);
    if (pending.signal && pending.abortListener) {
      pending.signal.removeEventListener('abort', pending.abortListener);
    }
    pending.resolve(this.makeSettlement(requestId, pending.bindingHash, decision, reviewerId, reason));
    return true;
  }

  private makeSettlement(
    requestId: string,
    bindingHash: string,
    decision: ApprovalSettlementDecision,
    reviewerId: string | undefined,
    reason: string,
  ): ApprovalSettlement {
    return { requestId, decision, bindingHash, settledAt: this.now(), reviewerId, reason };
  }
}

function hashStable(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function createApprovalExecutionBridge(
  dependencies?: ApprovalExecutionBridgeDependencies,
): ApprovalExecutionBridge {
  return new ApprovalExecutionBridge(dependencies);
}
