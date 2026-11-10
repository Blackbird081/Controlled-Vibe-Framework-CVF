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


/** Opted-in action money dimension. Legacy daily token usage is independent. */
export interface ActionQuotaSnapshot {
  schema: "cvf.actionQuota.v1";
  scopeId: string;
  reservationId: string;
  currency: string;
  totalMicrounits: number;
  stages: Record<string, { allocation: number; state: "RESERVED" | "STARTED" | "SETTLED" | "UNKNOWN" | "RELEASED"; cost: number | null }>;
}

export function validateActionQuota(value: ActionQuotaSnapshot): ActionQuotaSnapshot {
  const money = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
  if (Object.keys(value).sort().join(",") !== "currency,reservationId,schema,scopeId,stages,totalMicrounits" || value.schema !== "cvf.actionQuota.v1" || !value.scopeId || !value.reservationId
      || !/^[A-Z]{3}$/.test(value.currency) || !money(value.totalMicrounits)
      || !value.stages || Object.keys(value.stages).length < 1 || Object.keys(value.stages).length > 2) throw new Error("ACTION_QUOTA_INVALID");
  let total = 0;
  for (const [key, stage] of Object.entries(value.stages)) {
    if (Object.keys(stage).sort().join(",") !== "allocation,cost,state" || !key || !money(stage.allocation) || !["RESERVED", "STARTED", "SETTLED", "UNKNOWN", "RELEASED"].includes(stage.state)
        || (stage.cost !== null && (!money(stage.cost) || stage.cost > stage.allocation))
        || (stage.state === "SETTLED" && stage.cost === null)
        || (stage.state === "RELEASED" && stage.cost !== 0)) throw new Error("ACTION_QUOTA_INVALID");
    total += stage.allocation;
  }
  if (!Number.isSafeInteger(total) || total > value.totalMicrounits) throw new Error("ACTION_QUOTA_INVALID");
  return JSON.parse(JSON.stringify(value)) as ActionQuotaSnapshot;
}

export function reserveActionQuota(input: {
  scopeId: string; reservationId: string; currency: string; totalMicrounits: number;
  stageAllocations: Record<string, number>;
}): ActionQuotaSnapshot {
  if (input.totalMicrounits <= 0 || Object.values(input.stageAllocations).some(n => n <= 0)) throw new Error("ACTION_QUOTA_REQUIRED");
  return validateActionQuota({ schema: "cvf.actionQuota.v1", scopeId: input.scopeId,
    reservationId: input.reservationId, currency: input.currency, totalMicrounits: input.totalMicrounits,
    stages: Object.fromEntries(Object.entries(input.stageAllocations).map(([key, allocation]) =>
      [key, { allocation, state: "RESERVED", cost: null }])) });
}

export function transitionActionQuota(prior: ActionQuotaSnapshot, stageKey: string,
  action: "start" | "settle" | "unknown" | "release", cost: number | null = null): ActionQuotaSnapshot {
  const next = validateActionQuota(prior);
  const stage = next.stages[stageKey];
  if (!stage) throw new Error("ACTION_STAGE_UNKNOWN");
  if (action === "start") {
    if (stage.state !== "RESERVED") throw new Error("ACTION_STAGE_REPLAY");
    stage.state = "STARTED";
  } else if (action === "release") {
    if (stage.state === "RELEASED") return next;
    if (stage.state !== "RESERVED") throw new Error("ACTION_POSSIBLE_SPEND");
    stage.state = "RELEASED"; stage.cost = 0;
  } else if (action === "unknown") {
    if (stage.state !== "STARTED" && stage.state !== "UNKNOWN") throw new Error("ACTION_STAGE_ORDER");
    stage.state = "UNKNOWN"; stage.cost = null;
  } else {
    if (stage.state === "SETTLED" && stage.cost === cost) return next;
    if (stage.state !== "STARTED" && stage.state !== "UNKNOWN") throw new Error("ACTION_SETTLEMENT_CONFLICT");
    if (cost === null) { stage.state = "UNKNOWN"; stage.cost = null; }
    else { stage.state = "SETTLED"; stage.cost = cost; }
  }
  return validateActionQuota(next);
}
