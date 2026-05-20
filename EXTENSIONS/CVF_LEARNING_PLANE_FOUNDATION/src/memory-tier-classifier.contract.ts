export type MemoryTier =
  | "working"
  | "task"
  | "skill"
  | "organizational"
  | "long-term"
  | "audit"
  | "receipt";

export interface MemoryTierInput {
  tier?: string;
  source?: string;
  artifactType?: string;
  retentionHint?: string;
}

export interface MemoryTierClassification {
  tier: MemoryTier;
  privacyScope: "session" | "user" | "org" | "global";
  persistenceClass: "ephemeral" | "bounded" | "durable" | "append_only";
}

const TIER_CONTRACTS: Record<MemoryTier, MemoryTierClassification> = {
  working: { tier: "working", privacyScope: "session", persistenceClass: "ephemeral" },
  task: { tier: "task", privacyScope: "session", persistenceClass: "bounded" },
  skill: { tier: "skill", privacyScope: "user", persistenceClass: "durable" },
  organizational: { tier: "organizational", privacyScope: "org", persistenceClass: "durable" },
  "long-term": { tier: "long-term", privacyScope: "global", persistenceClass: "durable" },
  audit: { tier: "audit", privacyScope: "org", persistenceClass: "append_only" },
  receipt: { tier: "receipt", privacyScope: "org", persistenceClass: "append_only" },
};

// Claim Boundary:
// This file is a contract classifier only. It performs no runtime memory
// wiring, no retrieval, no provider prompt reinjection, and no persistence.
export function classifyMemoryTier(input: MemoryTierInput): MemoryTier {
  const raw = normalize(input.tier) || normalize(input.artifactType) || normalize(input.source) || normalize(input.retentionHint);
  if (raw.includes("receipt")) return "receipt";
  if (raw.includes("audit")) return "audit";
  if (raw.includes("working") || raw.includes("session")) return "working";
  if (raw.includes("task")) return "task";
  if (raw.includes("skill")) return "skill";
  if (raw.includes("organization") || raw.includes("org")) return "organizational";
  if (raw.includes("long")) return "long-term";
  return "task";
}

export function describeMemoryTier(input: MemoryTierInput): MemoryTierClassification {
  return { ...TIER_CONTRACTS[classifyMemoryTier(input)] };
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/_/g, "-") ?? "";
}
