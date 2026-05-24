export const MEMORY_CONTEXT_PACKAGER_VERSION =
  "cvf.memoryContextPackager.phase2a.v1";

export interface MemoryContextItem {
  id: string;
  summary: string;
  scope: string;
  constraints?: readonly string[];
  tokenEstimate: number;
}

export interface ExcludedMemoryItem {
  id: string;
  reason: string;
}

export interface MemoryContextPackageInput {
  purpose: string;
  scope: string;
  riskLevel: string;
  approvedMemory: readonly MemoryContextItem[];
  excludedMemory: readonly ExcludedMemoryItem[];
  policyDecision: string;
  tokenBudget: number;
}

export interface MemoryContextBlock {
  contractVersion: typeof MEMORY_CONTEXT_PACKAGER_VERSION;
  text: string;
  sourceMemoryIds: readonly string[];
  excludedMemory: readonly ExcludedMemoryItem[];
  tokenEstimate: number;
  rawMemoryReleased: false;
}

export function packageMemoryContext(
  input: MemoryContextPackageInput,
): MemoryContextBlock {
  const included: MemoryContextItem[] = [];
  const excluded: ExcludedMemoryItem[] = [...input.excludedMemory];
  let usedTokens = 0;

  for (const item of input.approvedMemory) {
    if (usedTokens + item.tokenEstimate > input.tokenBudget) {
      excluded.push({ id: item.id, reason: "token_budget_exceeded" });
      continue;
    }
    included.push(item);
    usedTokens += item.tokenEstimate;
  }

  const constraints = included.flatMap((item) => item.constraints ?? []);
  const approvedLines = included.length === 0
    ? ["- none"]
    : included.map((item) => `- ${item.id}: ${item.summary}`);
  const constraintLines = constraints.length === 0
    ? ["- none"]
    : constraints.map((constraint) => `- ${constraint}`);
  const excludedLines = excluded.length === 0
    ? ["- none"]
    : excluded.map((item) => `- ${item.id}: ${item.reason}`);

  return {
    contractVersion: MEMORY_CONTEXT_PACKAGER_VERSION,
    text: [
      "[MEMORY_CONTEXT]",
      `purpose: ${input.purpose}`,
      `scope: ${input.scope}`,
      `risk_level: ${input.riskLevel}`,
      `policy_decision: ${input.policyDecision}`,
      "approved_memory:",
      ...approvedLines,
      "constraints:",
      ...constraintLines,
      "excluded_memory:",
      ...excludedLines,
      `source_memory_ids: ${included.map((item) => item.id).join(", ") || "none"}`,
      "[/MEMORY_CONTEXT]",
    ].join("\n"),
    sourceMemoryIds: included.map((item) => item.id),
    excludedMemory: excluded,
    tokenEstimate: usedTokens,
    rawMemoryReleased: false,
  };
}
