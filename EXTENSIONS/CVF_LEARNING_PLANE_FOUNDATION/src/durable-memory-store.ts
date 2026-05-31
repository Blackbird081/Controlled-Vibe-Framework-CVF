import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { classifyMemoryTier, type MemoryTier } from "./memory-tier-classifier.contract";
import {
  evaluateRuntimeMemoryAction,
  type RuntimeMemoryActorRole,
  type RuntimeMemorySensitivity,
} from "./runtime-memory-hierarchy";

export const DURABLE_MEMORY_STORE_VERSION = "cvf.durableMemoryStore.m1.v1";

export type DurableMemoryTier = Extract<MemoryTier, "skill" | "long-term">;
export type DurableMemoryLifecycleState =
  | "semantic"
  | "procedural"
  | "expired"
  | "disputed"
  | "forgotten";

export type DurableMemoryOperation = "write" | "read";

export interface DurableMemoryRecord {
  id: string;
  tier: DurableMemoryTier;
  scope: string;
  actorId: string;
  summary: string;
  lifecycleState: DurableMemoryLifecycleState;
  provenanceScore: number;
  createdAt: number;
  updatedAt: number;
}

export interface DurableMemoryReceipt {
  contractVersion: typeof DURABLE_MEMORY_STORE_VERSION;
  operation: DurableMemoryOperation;
  decision: "allowed" | "denied";
  reason: string;
  tier?: MemoryTier;
  scope: string;
  memoryIds: readonly string[];
  excluded: readonly { id: string; reason: string }[];
  durablePersistence: boolean;
  crossSession: boolean;
  summaryOnly: true;
  canReinject: false;
  rawMemoryReleased: false;
  receiptId: string;
}

export interface DurableMemoryWriteInput {
  id: string;
  tier?: string;
  scope: string;
  actorId: string;
  actorRole: RuntimeMemoryActorRole;
  summary: string;
  lifecycleState?: DurableMemoryLifecycleState;
  provenanceScore?: number;
  containsSecret?: boolean;
  policyDecision?: "allow" | "deny" | "require_human_approval";
  actorAuthorized?: boolean;
  sensitivity?: RuntimeMemorySensitivity;
  now?: number;
}

export interface DurableMemoryReadInput {
  scope: string;
  actorId: string;
  actorRole: RuntimeMemoryActorRole;
  tier?: string;
  query?: string;
  maxResults?: number;
  actorAuthorized?: boolean;
  sensitivity?: RuntimeMemorySensitivity;
}

export interface DurableMemoryWriteResult {
  receipt: DurableMemoryReceipt;
  record?: DurableMemoryRecord;
}

export interface DurableMemoryReadResult {
  receipt: DurableMemoryReceipt;
  records: readonly DurableMemoryRecord[];
}

export interface DurableMemoryStore {
  write(input: DurableMemoryWriteInput): DurableMemoryWriteResult;
  read(input: DurableMemoryReadInput): DurableMemoryReadResult;
  clear(): void;
  list(): readonly DurableMemoryRecord[];
}

const BLOCKED_LIFECYCLE_STATES = new Set(["expired", "disputed", "forgotten"]);
const ALLOWED_LIFECYCLE_STATES = new Set(["semantic", "procedural"]);
const MIN_PROVENANCE_SCORE = 0.7;

export function createInProcessDurableMemoryStore(options: {
  now?: () => number;
} = {}): DurableMemoryStore {
  return new InProcessDurableMemoryStore(options.now ?? (() => Date.now()));
}

export function createFileBackedDurableMemoryStore(
  filePath: string,
  options: { now?: () => number } = {},
): DurableMemoryStore {
  return new FileBackedDurableMemoryStore(filePath, options.now ?? (() => Date.now()));
}

function isDurableTier(tier: MemoryTier): tier is DurableMemoryTier {
  return tier === "skill" || tier === "long-term";
}

function isDurableMemoryRecord(value: unknown): value is DurableMemoryRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<DurableMemoryRecord>;
  return typeof record.id === "string" &&
    (record.tier === "skill" || record.tier === "long-term") &&
    typeof record.scope === "string" &&
    typeof record.actorId === "string" &&
    typeof record.summary === "string" &&
    typeof record.lifecycleState === "string" &&
    ALLOWED_LIFECYCLE_STATES.has(record.lifecycleState) &&
    typeof record.provenanceScore === "number" &&
    Number.isFinite(record.provenanceScore) &&
    typeof record.createdAt === "number" &&
    Number.isFinite(record.createdAt) &&
    typeof record.updatedAt === "number" &&
    Number.isFinite(record.updatedAt);
}

function hasRawPayload(input: DurableMemoryWriteInput): boolean {
  const raw = input as DurableMemoryWriteInput & {
    content?: unknown;
    rawContent?: unknown;
    value?: unknown;
  };
  return typeof raw.content === "string" ||
    typeof raw.rawContent === "string" ||
    typeof raw.value === "string";
}

function makeReceipt(
  input: {
    operation: DurableMemoryOperation;
    decision: "allowed" | "denied";
    reason: string;
    scope: string;
    tier?: MemoryTier;
    memoryIds?: readonly string[];
    excluded?: readonly { id: string; reason: string }[];
    durablePersistence?: boolean;
    crossSession?: boolean;
  },
): DurableMemoryReceipt {
  const ids = input.memoryIds ?? [];
  return {
    contractVersion: DURABLE_MEMORY_STORE_VERSION,
    operation: input.operation,
    decision: input.decision,
    reason: input.reason,
    tier: input.tier,
    scope: input.scope,
    memoryIds: [...ids],
    excluded: [...(input.excluded ?? [])],
    durablePersistence: input.durablePersistence ?? false,
    crossSession: input.crossSession ?? false,
    summaryOnly: true,
    canReinject: false,
    rawMemoryReleased: false,
    receiptId: `m1-${input.operation}-${randomUUID()}`,
  };
}

function normalizeQuery(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

abstract class BaseDurableMemoryStore implements DurableMemoryStore {
  protected readonly now: () => number;

  protected constructor(now: () => number) {
    this.now = now;
  }

  abstract clear(): void;
  abstract list(): readonly DurableMemoryRecord[];
  protected abstract upsert(record: DurableMemoryRecord): void;

  write(input: DurableMemoryWriteInput): DurableMemoryWriteResult {
    const tier = classifyMemoryTier({ tier: input.tier });
    const scope = input.scope.trim();
    const id = input.id.trim();
    const summary = input.summary.trim();

    if (!input.actorAuthorized || input.policyDecision !== "allow") {
      return {
        receipt: makeReceipt({
          operation: "write",
          decision: "denied",
          reason: "durable_memory_policy_denied",
          scope,
          tier,
          excluded: [{ id: id || "unknown-memory", reason: "policy_denied" }],
        }),
      };
    }

    if (!isDurableTier(tier)) {
      return {
        receipt: makeReceipt({
          operation: "write",
          decision: "denied",
          reason: "durable_memory_tier_not_authorized",
          scope,
          tier,
          excluded: [{ id: id || "unknown-memory", reason: "tier_not_authorized" }],
        }),
      };
    }

    const runtimeDecision = evaluateRuntimeMemoryAction({
      tier,
      action: "write",
      actorRole: input.actorRole,
      sensitivity: input.sensitivity,
      durablePersistenceRequested: true,
    });

    if (runtimeDecision.decision !== "allowed") {
      return {
        receipt: makeReceipt({
          operation: "write",
          decision: "denied",
          reason: runtimeDecision.reason,
          scope,
          tier,
          excluded: [{ id: id || "unknown-memory", reason: runtimeDecision.reason }],
        }),
      };
    }

    const lifecycleState = input.lifecycleState ?? "semantic";
    const provenanceScore = input.provenanceScore ?? 1;
    const exclusionReason = !id
      ? "missing_memory_id"
      : !scope
        ? "missing_scope"
        : !summary
          ? "missing_summary"
          : hasRawPayload(input)
            ? "raw_memory_payload_rejected"
            : input.containsSecret === true
              ? "privacy_filtered"
              : BLOCKED_LIFECYCLE_STATES.has(lifecycleState)
                ? `lifecycle_${lifecycleState}`
                : provenanceScore < MIN_PROVENANCE_SCORE
                  ? "low_provenance_score"
                  : undefined;

    if (exclusionReason) {
      return {
        receipt: makeReceipt({
          operation: "write",
          decision: "denied",
          reason: exclusionReason,
          scope,
          tier,
          excluded: [{ id: id || "unknown-memory", reason: exclusionReason }],
        }),
      };
    }

    const timestamp = input.now ?? this.now();
    const record: DurableMemoryRecord = {
      id,
      tier,
      scope,
      actorId: input.actorId,
      summary,
      lifecycleState,
      provenanceScore,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.upsert(record);

    return {
      receipt: makeReceipt({
        operation: "write",
        decision: "allowed",
        reason: "durable_memory_write_authorized",
        scope,
        tier,
        memoryIds: [id],
        durablePersistence: true,
        crossSession: true,
      }),
      record: cloneRecord(record),
    };
  }

  read(input: DurableMemoryReadInput): DurableMemoryReadResult {
    const tier = classifyMemoryTier({ tier: input.tier });
    const scope = input.scope.trim();

    if (!input.actorAuthorized) {
      return {
        receipt: makeReceipt({
          operation: "read",
          decision: "denied",
          reason: "durable_memory_policy_denied",
          scope,
          tier,
        }),
        records: [],
      };
    }

    if (!isDurableTier(tier)) {
      return {
        receipt: makeReceipt({
          operation: "read",
          decision: "denied",
          reason: "durable_memory_tier_not_authorized",
          scope,
          tier,
        }),
        records: [],
      };
    }

    const runtimeDecision = evaluateRuntimeMemoryAction({
      tier,
      action: "retrieve",
      actorRole: input.actorRole,
      sensitivity: input.sensitivity,
      crossSession: true,
    });

    if (runtimeDecision.decision !== "allowed") {
      return {
        receipt: makeReceipt({
          operation: "read",
          decision: "denied",
          reason: runtimeDecision.reason,
          scope,
          tier,
        }),
        records: [],
      };
    }

    const query = normalizeQuery(input.query);
    const excluded: { id: string; reason: string }[] = [];
    const selected = this.list()
      .filter((record) => {
        if (record.tier !== tier) return false;
        if (record.scope !== scope) {
          excluded.push({ id: record.id, reason: "out_of_scope" });
          return false;
        }
        if (query && !record.summary.toLowerCase().includes(query)) {
          excluded.push({ id: record.id, reason: "low_relevance" });
          return false;
        }
        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, input.maxResults ?? 5)
      .map(cloneRecord);

    return {
      receipt: makeReceipt({
        operation: "read",
        decision: "allowed",
        reason: "durable_memory_read_authorized",
        scope,
        tier,
        memoryIds: selected.map((record) => record.id),
        excluded,
        durablePersistence: true,
        crossSession: true,
      }),
      records: selected,
    };
  }
}

class InProcessDurableMemoryStore extends BaseDurableMemoryStore {
  private readonly records = new Map<string, DurableMemoryRecord>();

  constructor(now: () => number) {
    super(now);
  }

  protected upsert(record: DurableMemoryRecord): void {
    this.records.set(record.id, cloneRecord(record));
  }

  clear(): void {
    this.records.clear();
  }

  list(): readonly DurableMemoryRecord[] {
    return Array.from(this.records.values()).map(cloneRecord);
  }
}

class FileBackedDurableMemoryStore extends BaseDurableMemoryStore {
  private readonly filePath: string;

  constructor(filePath: string, now: () => number) {
    super(now);
    this.filePath = filePath;
  }

  protected upsert(record: DurableMemoryRecord): void {
    const records = new Map(this.list().map((item) => [item.id, item]));
    records.set(record.id, cloneRecord(record));
    this.writeAll(Array.from(records.values()));
  }

  clear(): void {
    this.writeAll([]);
  }

  list(): readonly DurableMemoryRecord[] {
    if (!existsSync(this.filePath)) {
      return [];
    }
    try {
      const parsed = JSON.parse(readFileSync(this.filePath, "utf8")) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(isDurableMemoryRecord).map(cloneRecord);
    } catch {
      return [];
    }
  }

  private writeAll(records: readonly DurableMemoryRecord[]): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  }
}

function cloneRecord(record: DurableMemoryRecord): DurableMemoryRecord {
  return { ...record };
}
