/**
 * Local, in-memory, append-only, deep-cloned record store. Records are
 * immutable snapshots once inserted (Required Invariant 5): insert()
 * rejects overwriting an existing key, and get() always returns a fresh
 * deep clone so callers cannot mutate stored state through the returned
 * reference.
 */
export class ImmutableStore {
    records = new Map();
    insert(key, value) {
        if (this.records.has(key)) {
            throw new Error(`KERNEL_STORE_DUPLICATE_KEY: ${key}`);
        }
        this.records.set(key, structuredClone(value));
    }
    get(key) {
        const value = this.records.get(key);
        return value === undefined ? undefined : structuredClone(value);
    }
    has(key) {
        return this.records.has(key);
    }
    all() {
        return [...this.records.values()].map((value) => structuredClone(value));
    }
}
