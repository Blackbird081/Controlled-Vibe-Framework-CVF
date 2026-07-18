import type {
  DurableMemoryReadInput,
  DurableMemoryReceipt,
  DurableMemoryRecord,
  DurableMemoryStore,
} from "./durable-memory-store";

export interface MemoryDurableReadinessResult {
  receipt: DurableMemoryReceipt;
  records: readonly DurableMemoryRecord[];
}

/**
 * Bounded readiness helper that wraps the existing durable store read path.
 * Does not bypass or change the fail-closed write semantics in the store.
 */
export function readMemory(
  store: DurableMemoryStore,
  input: DurableMemoryReadInput,
): MemoryDurableReadinessResult {
  const result = store.read(input);
  const { receipt } = result;

  if (receipt.summaryOnly !== true || receipt.rawMemoryReleased !== false || receipt.canReinject !== false) {
    throw new Error("Durable memory readiness invariant violated: summary-only receipt expected");
  }

  return {
    receipt: {
      ...receipt,
      memoryIds: [...receipt.memoryIds],
      excluded: [...receipt.excluded],
    },
    records: result.records.map((record) => ({ ...record })),
  };
}
