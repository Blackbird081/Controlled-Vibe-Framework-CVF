export type ProviderHealthState =
  | "healthy"
  | "degraded"
  | "rate_limited"
  | "unavailable"
  | "unknown";

export interface ProviderHealthRecord {
  providerId: string;
  state: ProviderHealthState;
  consecutiveFailures: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastStatusCode?: number;
  reason?: string;
}

export class ProviderHealthMonitor {
  private readonly records = new Map<string, ProviderHealthRecord>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  get(providerId: string): ProviderHealthRecord {
    return {
      providerId,
      state: "unknown",
      consecutiveFailures: 0,
      ...this.records.get(providerId),
    };
  }

  recordSuccess(providerId: string): ProviderHealthRecord {
    const next: ProviderHealthRecord = {
      providerId,
      state: "healthy",
      consecutiveFailures: 0,
      lastSuccessAt: this.now().toISOString(),
    };
    this.records.set(providerId, next);
    return this.get(providerId);
  }

  recordFailure(providerId: string, statusCode?: number, reason?: string): ProviderHealthRecord {
    const previous = this.get(providerId);
    const consecutiveFailures = previous.consecutiveFailures + 1;
    const state = this.classifyFailure(statusCode, consecutiveFailures);
    const next: ProviderHealthRecord = {
      providerId,
      state,
      consecutiveFailures,
      lastSuccessAt: previous.lastSuccessAt,
      lastFailureAt: this.now().toISOString(),
      lastStatusCode: statusCode,
      reason,
    };
    this.records.set(providerId, next);
    return this.get(providerId);
  }

  isUsable(providerId: string): boolean {
    const state = this.get(providerId).state;
    return state === "healthy" || state === "degraded" || state === "unknown";
  }

  private classifyFailure(statusCode: number | undefined, consecutiveFailures: number): ProviderHealthState {
    if (statusCode === 429) {
      return "rate_limited";
    }
    if (consecutiveFailures >= 3) {
      return "unavailable";
    }
    return "degraded";
  }
}
