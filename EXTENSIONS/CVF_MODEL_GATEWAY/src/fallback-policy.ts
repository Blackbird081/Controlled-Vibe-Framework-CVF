export interface FallbackAttempt {
  providerId: string;
  modelId: string;
  statusCode?: number;
  reason: string;
  at: string;
}

export interface FallbackPolicyConfig {
  maxAttempts?: number;
  retryableStatusCodes?: number[];
}

export interface FallbackDecision {
  shouldFallback: boolean;
  reason: string;
  remainingAttempts: number;
}

const DEFAULT_RETRYABLE_STATUS_CODES = [408, 409, 429, 500, 502, 503, 504];

export class FallbackPolicy {
  private readonly maxAttempts: number;
  private readonly retryableStatusCodes: number[];

  constructor(
    config: FallbackPolicyConfig = {},
    private readonly now: () => Date = () => new Date(),
  ) {
    this.maxAttempts = config.maxAttempts ?? 3;
    this.retryableStatusCodes = config.retryableStatusCodes ?? DEFAULT_RETRYABLE_STATUS_CODES;
  }

  createAttempt(providerId: string, modelId: string, reason: string, statusCode?: number): FallbackAttempt {
    return {
      providerId,
      modelId,
      reason,
      statusCode,
      at: this.now().toISOString(),
    };
  }

  decide(attempts: FallbackAttempt[], latestStatusCode?: number): FallbackDecision {
    const remainingAttempts = Math.max(this.maxAttempts - attempts.length, 0);
    if (remainingAttempts <= 0) {
      return { shouldFallback: false, reason: "max_attempts_reached", remainingAttempts };
    }
    if (latestStatusCode !== undefined && !this.retryableStatusCodes.includes(latestStatusCode)) {
      return { shouldFallback: false, reason: "non_retryable_status", remainingAttempts };
    }
    return { shouldFallback: true, reason: "retryable_or_unknown_failure", remainingAttempts };
  }
}
