export class DeterministicClock {
    cursor;
    stepMs;
    constructor(startUtcIso, stepMs = 0) {
        this.cursor = Date.parse(startUtcIso);
        if (Number.isNaN(this.cursor)) {
            throw new Error(`KERNEL_INVALID_CLOCK_START: ${startUtcIso}`);
        }
        this.stepMs = stepMs;
    }
    nowUtcIso() {
        const iso = new Date(this.cursor).toISOString().replace(/\.\d{3}Z$/, "Z");
        this.cursor += this.stepMs;
        return iso;
    }
}
export class SequentialIdFactory {
    counters = new Map();
    nextId(prefix) {
        const current = this.counters.get(prefix) ?? 0;
        const next = current + 1;
        this.counters.set(prefix, next);
        return `${prefix}-${String(next).padStart(6, "0")}`;
    }
}
