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
export declare class DeterministicClock implements Clock {
    private cursor;
    private readonly stepMs;
    constructor(startUtcIso: string, stepMs?: number);
    nowUtcIso(): string;
}
export declare class SequentialIdFactory implements IdFactory {
    private readonly counters;
    nextId(prefix: string): string;
}
