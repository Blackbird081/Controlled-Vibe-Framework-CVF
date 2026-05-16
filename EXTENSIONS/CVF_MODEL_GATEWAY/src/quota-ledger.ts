export interface QuotaLimit {
  requestsPerDay?: number;
  estimatedTokensPerDay?: number;
  actualTokensPerDay?: number;
}

export interface QuotaUsage {
  providerId: string;
  modelId: string;
  day: string;
  requestCount: number;
  estimatedTokenCount: number;
  actualTokenCount: number;
}

export interface QuotaRequest {
  providerId: string;
  modelId: string;
  estimatedTokens?: number;
  actualTokens?: number;
}

export interface QuotaDecision {
  allowed: boolean;
  reason: string;
  usage: QuotaUsage;
  limit?: QuotaLimit;
}

export class QuotaLedger {
  private readonly limits = new Map<string, QuotaLimit>();
  private readonly usage = new Map<string, QuotaUsage>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  setLimit(providerId: string, modelId: string, limit: QuotaLimit): void {
    this.limits.set(this.limitKey(providerId, modelId), { ...limit });
  }

  getUsage(providerId: string, modelId: string): QuotaUsage {
    const key = this.usageKey(providerId, modelId);
    return this.usage.get(key) ?? {
      providerId,
      modelId,
      day: this.day(),
      requestCount: 0,
      estimatedTokenCount: 0,
      actualTokenCount: 0,
    };
  }

  canUse(request: QuotaRequest): QuotaDecision {
    const usage = this.getUsage(request.providerId, request.modelId);
    const limit = this.limits.get(this.limitKey(request.providerId, request.modelId));
    if (!limit) {
      return { allowed: true, reason: "no_limit_configured", usage };
    }

    const estimatedTokens = request.estimatedTokens ?? 0;
    const actualTokens = request.actualTokens ?? 0;
    if (limit.requestsPerDay !== undefined && usage.requestCount + 1 > limit.requestsPerDay) {
      return { allowed: false, reason: "requests_per_day_exceeded", usage, limit };
    }
    if (
      limit.estimatedTokensPerDay !== undefined &&
      usage.estimatedTokenCount + estimatedTokens > limit.estimatedTokensPerDay
    ) {
      return { allowed: false, reason: "estimated_tokens_per_day_exceeded", usage, limit };
    }
    if (
      limit.actualTokensPerDay !== undefined &&
      usage.actualTokenCount + actualTokens > limit.actualTokensPerDay
    ) {
      return { allowed: false, reason: "actual_tokens_per_day_exceeded", usage, limit };
    }
    return { allowed: true, reason: "within_quota", usage, limit };
  }

  recordUse(request: QuotaRequest): QuotaUsage {
    const current = this.getUsage(request.providerId, request.modelId);
    const next: QuotaUsage = {
      ...current,
      requestCount: current.requestCount + 1,
      estimatedTokenCount: current.estimatedTokenCount + (request.estimatedTokens ?? 0),
      actualTokenCount: current.actualTokenCount + (request.actualTokens ?? 0),
    };
    this.usage.set(this.usageKey(request.providerId, request.modelId), next);
    return { ...next };
  }

  private day(): string {
    return this.now().toISOString().slice(0, 10);
  }

  private limitKey(providerId: string, modelId: string): string {
    return `${providerId}::${modelId}`;
  }

  private usageKey(providerId: string, modelId: string): string {
    return `${this.day()}::${this.limitKey(providerId, modelId)}`;
  }
}
