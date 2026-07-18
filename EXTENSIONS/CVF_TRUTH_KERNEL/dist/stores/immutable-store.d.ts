/**
 * Local, in-memory, append-only, deep-cloned record store. Records are
 * immutable snapshots once inserted (Required Invariant 5): insert()
 * rejects overwriting an existing key, and get() always returns a fresh
 * deep clone so callers cannot mutate stored state through the returned
 * reference.
 */
export declare class ImmutableStore<T> {
    private readonly records;
    insert(key: string, value: T): void;
    get(key: string): T | undefined;
    has(key: string): boolean;
    all(): T[];
}
