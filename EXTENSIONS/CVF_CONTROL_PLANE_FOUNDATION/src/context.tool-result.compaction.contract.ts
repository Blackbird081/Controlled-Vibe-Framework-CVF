export interface ToolResultContextInput {
  id: string;
  content: string;
  source?: string;
}

export type ToolResultCompactionDisposition = "NOT_REQUIRED" | "COMPACTED" | "REFUSE_LATE_COMPACTION";

export interface ToolResultCompactionReceipt {
  disposition: ToolResultCompactionDisposition;
  reason: string;
  contextWindowTokens: number;
  promptHeadroomTokens: number;
  perResultCapChars: number;
  aggregateCapChars: number;
  originalChars: number;
  emittedChars: number;
  singleResultCompactions: number;
  aggregateCompactions: number;
  importantTailPreserved: boolean;
}

export interface ToolResultCompactionResult {
  results: ToolResultContextInput[];
  receipt: ToolResultCompactionReceipt;
}

export interface ToolResultCompactionOptions {
  contextWindowTokens?: number;
  basePromptTokens: number;
  hardPerResultCapChars?: number;
  hardAggregateCapChars?: number;
}

const DEFAULT_CONTEXT_WINDOW_TOKENS = 32_000;
const MIN_PER_RESULT_CHARS = 2_000;
const MIN_AGGREGATE_CHARS = 4_000;
const MIN_SAFE_HEADROOM_TOKENS = 8_000;
const COMPACTION_RECOMMENDATION_RATIO = 0.85;

export function compactToolResultsForContext(
  inputs: readonly ToolResultContextInput[],
  options: ToolResultCompactionOptions,
): ToolResultCompactionResult {
  const contextWindowTokens = validPositive(options.contextWindowTokens) ?? DEFAULT_CONTEXT_WINDOW_TOKENS;
  const promptHeadroomTokens = Math.max(0, contextWindowTokens - Math.max(0, options.basePromptTokens));
  const perResultCapChars = Math.max(
    MIN_PER_RESULT_CHARS,
    Math.min(options.hardPerResultCapChars ?? 20_000, Math.floor(contextWindowTokens * 4 * 0.30)),
  );
  const aggregateCapChars = Math.max(
    MIN_AGGREGATE_CHARS,
    Math.min(options.hardAggregateCapChars ?? 64_000, Math.floor(contextWindowTokens * 4 * 0.50)),
  );
  const originalChars = inputs.reduce((sum, item) => sum + item.content.length, 0);
  const originalTokens = Math.ceil(originalChars / 4);
  const compactionNeeded = inputs.some((item) => item.content.length > perResultCapChars)
    || originalChars > aggregateCapChars;

  if (
    compactionNeeded
    && options.basePromptTokens + originalTokens >= contextWindowTokens * COMPACTION_RECOMMENDATION_RATIO
    && promptHeadroomTokens < MIN_SAFE_HEADROOM_TOKENS
  ) {
    return refusal(
      "headroom_too_tight_for_safe_late_compaction",
      contextWindowTokens,
      promptHeadroomTokens,
      perResultCapChars,
      aggregateCapChars,
      originalChars,
    );
  }

  let singleResultCompactions = 0;
  let aggregateCompactions = 0;
  let importantTailPreserved = false;
  const results = inputs.map((item) => {
    if (item.content.length <= perResultCapChars) return { ...item };
    singleResultCompactions += 1;
    importantTailPreserved = true;
    return { ...item, content: preserveHeadAndTail(item.content, perResultCapChars) };
  });

  let emittedChars = results.reduce((sum, item) => sum + item.content.length, 0);
  for (let index = results.length - 1; index >= 0 && emittedChars > aggregateCapChars; index -= 1) {
    const current = results[index];
    const target = Math.max(MIN_PER_RESULT_CHARS, current.content.length - (emittedChars - aggregateCapChars));
    if (target >= current.content.length) continue;
    emittedChars -= current.content.length - target;
    current.content = preserveHeadAndTail(current.content, target);
    aggregateCompactions += 1;
    importantTailPreserved = true;
  }

  if (emittedChars > aggregateCapChars) {
    return refusal(
      "aggregate_cap_cannot_be_met_without_destroying_minimum_result_evidence",
      contextWindowTokens,
      promptHeadroomTokens,
      perResultCapChars,
      aggregateCapChars,
      originalChars,
    );
  }

  return {
    results,
    receipt: {
      disposition: singleResultCompactions + aggregateCompactions > 0 ? "COMPACTED" : "NOT_REQUIRED",
      reason: singleResultCompactions + aggregateCompactions > 0
        ? "two_pass_tool_result_compaction_applied"
        : "tool_results_within_share_caps",
      contextWindowTokens,
      promptHeadroomTokens,
      perResultCapChars,
      aggregateCapChars,
      originalChars,
      emittedChars,
      singleResultCompactions,
      aggregateCompactions,
      importantTailPreserved,
    },
  };
}

function preserveHeadAndTail(content: string, cap: number): string {
  if (content.length <= cap) return content;
  const marker = "\n...[CVF_TOOL_RESULT_COMPACTED]...\n";
  if (cap <= marker.length) return content.slice(-cap);
  const available = cap - marker.length;
  const head = Math.ceil(available / 2);
  const tail = Math.floor(available / 2);
  return `${content.slice(0, head)}${marker}${content.slice(content.length - tail)}`;
}

function refusal(
  reason: string,
  contextWindowTokens: number,
  promptHeadroomTokens: number,
  perResultCapChars: number,
  aggregateCapChars: number,
  originalChars: number,
): ToolResultCompactionResult {
  return {
    results: [],
    receipt: {
      disposition: "REFUSE_LATE_COMPACTION",
      reason,
      contextWindowTokens,
      promptHeadroomTokens,
      perResultCapChars,
      aggregateCapChars,
      originalChars,
      emittedChars: 0,
      singleResultCompactions: 0,
      aggregateCompactions: 0,
      importantTailPreserved: false,
    },
  };
}

function validPositive(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}
