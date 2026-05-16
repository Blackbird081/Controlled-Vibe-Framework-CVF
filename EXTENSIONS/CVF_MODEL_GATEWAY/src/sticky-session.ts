export interface StickySessionRecord {
  sessionId: string;
  providerId: string;
  modelId: string;
  boundAt: string;
  expiresAt: string;
}

export interface StickySessionLookupOptions {
  policyOverride?: boolean;
}

export class StickySessionStore {
  private readonly records = new Map<string, StickySessionRecord>();

  constructor(
    private readonly ttlMs: number = 30 * 60 * 1000,
    private readonly now: () => Date = () => new Date(),
  ) {}

  bind(sessionId: string, providerId: string, modelId: string): StickySessionRecord {
    const boundAt = this.now();
    const record: StickySessionRecord = {
      sessionId,
      providerId,
      modelId,
      boundAt: boundAt.toISOString(),
      expiresAt: new Date(boundAt.getTime() + this.ttlMs).toISOString(),
    };
    this.records.set(sessionId, record);
    return { ...record };
  }

  get(sessionId: string, options: StickySessionLookupOptions = {}): StickySessionRecord | undefined {
    if (options.policyOverride) {
      return undefined;
    }
    const record = this.records.get(sessionId);
    if (!record) {
      return undefined;
    }
    if (Date.parse(record.expiresAt) <= this.now().getTime()) {
      this.records.delete(sessionId);
      return undefined;
    }
    return { ...record };
  }

  clear(sessionId: string): void {
    this.records.delete(sessionId);
  }
}
