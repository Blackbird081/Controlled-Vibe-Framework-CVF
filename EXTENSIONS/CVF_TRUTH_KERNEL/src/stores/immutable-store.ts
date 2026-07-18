/**
 * Local, in-memory, append-only, deep-cloned record store. Records are
 * immutable snapshots once inserted (Required Invariant 5): insert()
 * rejects overwriting an existing key, and get() always returns a fresh
 * deep clone so callers cannot mutate stored state through the returned
 * reference.
 */
export class ImmutableStore<T> {
  private readonly records = new Map<string, T>();

  insert(key: string, value: T): void {
    if (this.records.has(key)) {
      throw new Error(`KERNEL_STORE_DUPLICATE_KEY: ${key}`);
    }
    this.records.set(key, structuredClone(value));
  }

  get(key: string): T | undefined {
    const value = this.records.get(key);
    return value === undefined ? undefined : structuredClone(value);
  }

  has(key: string): boolean {
    return this.records.has(key);
  }

  all(): T[] {
    return [...this.records.values()].map((value) => structuredClone(value));
  }
}
