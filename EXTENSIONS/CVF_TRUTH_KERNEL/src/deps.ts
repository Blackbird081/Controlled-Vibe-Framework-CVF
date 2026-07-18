/**
 * Deterministic dependency boundary. TruthKernel accepts these as
 * constructor injection; no evaluator, resolver, or issuer may call a
 * global wall-clock or a random-number source directly.
 */
export interface Clock {
  nowUtcIso(): string;
}

export interface IdFactory {
  nextId(prefix: string): string;
}

export class DeterministicClock implements Clock {
  private cursor: number;
  private readonly stepMs: number;

  constructor(startUtcIso: string, stepMs = 0) {
    this.cursor = Date.parse(startUtcIso);
    if (Number.isNaN(this.cursor)) {
      throw new Error(`KERNEL_INVALID_CLOCK_START: ${startUtcIso}`);
    }
    this.stepMs = stepMs;
  }

  nowUtcIso(): string {
    const iso = new Date(this.cursor).toISOString().replace(/\.\d{3}Z$/, "Z");
    this.cursor += this.stepMs;
    return iso;
  }
}

export class SequentialIdFactory implements IdFactory {
  private readonly counters = new Map<string, number>();

  nextId(prefix: string): string {
    const current = this.counters.get(prefix) ?? 0;
    const next = current + 1;
    this.counters.set(prefix, next);
    return `${prefix}-${String(next).padStart(6, "0")}`;
  }
}
