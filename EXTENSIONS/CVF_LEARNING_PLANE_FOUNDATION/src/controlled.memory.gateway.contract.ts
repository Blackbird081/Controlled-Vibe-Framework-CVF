import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export type ControlledMemoryKind = "working" | "episodic" | "semantic" | "procedural";
export type ControlledMemoryScope = "session" | "project" | "user" | "global";
export type ControlledMemorySensitivity = "public" | "internal" | "confidential" | "restricted";
export type ControlledMemoryLifecycleState = "active" | "stale" | "expired" | "blocked" | "contradicted";
export type ControlledMemoryPolicyResult = "allow" | "deny" | "requires_approval";
export type ControlledMemoryDecision = "captured" | "retrieved" | "reinjectable" | "denied" | "requires_approval";

export interface ControlledMemoryPolicyContext {
  traceId: string;
  policyResult: ControlledMemoryPolicyResult;
  actorId: string;
  actorRole: "operator" | "orchestrator" | "worker" | "reviewer" | "system";
  allowedScopes: ControlledMemoryScope[];
  canWrite?: boolean;
  canReadRestricted?: boolean;
  canReinject?: boolean;
  deniedMemoryIds?: string[];
  reason?: string;
}

export interface ControlledMemoryRecord {
  memoryId: string;
  memoryHash: string;
  capturedAt: string;
  kind: ControlledMemoryKind;
  scope: ControlledMemoryScope;
  projectId?: string;
  sessionId?: string;
  sourceEvent: string;
  sourcePath?: string;
  sensitivity: ControlledMemorySensitivity;
  lifecycleState: ControlledMemoryLifecycleState;
  content: string;
  tokenEstimate: number;
  expiresAt?: string;
  provenance: {
    sourceClass: "private_reference" | "external_reference" | "generated_draft" | "canon" | "runtime_event";
    summary: string;
  };
  privacyReport: ControlledMemoryPrivacyReport;
}

export interface ControlledMemoryPrivacyReport {
  filtered: boolean;
  maskedTokenCount: number;
  appliedPatterns: string[];
}

export interface ControlledMemoryCaptureRequest {
  sourceEvent: string;
  content: string;
  kind: ControlledMemoryKind;
  scope: ControlledMemoryScope;
  sensitivity?: ControlledMemorySensitivity;
  projectId?: string;
  sessionId?: string;
  sourcePath?: string;
  ttlDays?: number;
  policy: ControlledMemoryPolicyContext;
  provenance: ControlledMemoryRecord["provenance"];
}

export interface ControlledMemoryQueryRequest {
  query: string;
  policy: ControlledMemoryPolicyContext;
  projectId?: string;
  sessionId?: string;
  includeKinds?: ControlledMemoryKind[];
  maxTokens?: number;
}

export interface ControlledMemoryReinjectionRequest extends ControlledMemoryQueryRequest {
  memoryIds?: string[];
}

export interface ControlledMemoryContextSegment {
  segmentId: string;
  memoryId: string;
  content: string;
  tokenEstimate: number;
  sourceEvent: string;
  provenanceSummary: string;
  sensitivity: ControlledMemorySensitivity;
}

export interface ControlledMemoryReceipt {
  receiptId: string;
  traceId: string;
  decision: ControlledMemoryDecision;
  reason: string;
  createdAt: string;
  actorId: string;
  memoryIds: string[];
  maskedTokenCount: number;
  estimatedTokens: number;
  provenanceRequired: boolean;
}

export interface ControlledMemoryCaptureResult {
  record?: ControlledMemoryRecord;
  receipt: ControlledMemoryReceipt;
}

export interface ControlledMemoryQueryResult {
  records: ControlledMemoryRecord[];
  contextSegments: ControlledMemoryContextSegment[];
  receipt: ControlledMemoryReceipt;
}

export interface ControlledMemoryGatewayDependencies {
  now?: () => string;
  estimateTokens?: (content: string) => number;
}

const SECRET_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, label: "[PII_EMAIL]" },
  { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, label: "[PII_PHONE]" },
  { pattern: /\b(?:sk|pk|api|key|token|secret|bearer|auth)[-_]?[A-Za-z0-9]{12,}\b/gi, label: "[SECRET_MASKED]" },
  { pattern: /password\s*[=:]\s*\S+/gi, label: "[SECRET_MASKED]" },
];

function defaultEstimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

function applyPrivacyFilter(content: string): { content: string; report: ControlledMemoryPrivacyReport } {
  let filtered = content;
  let maskedTokenCount = 0;
  const appliedPatterns: string[] = [];

  for (const { pattern, label } of SECRET_PATTERNS) {
    const matches = filtered.match(pattern);
    if (!matches?.length) {
      continue;
    }
    maskedTokenCount += matches.length;
    if (!appliedPatterns.includes(label)) {
      appliedPatterns.push(label);
    }
    filtered = filtered.replace(pattern, label);
  }

  return {
    content: filtered,
    report: {
      filtered: maskedTokenCount > 0,
      maskedTokenCount,
      appliedPatterns,
    },
  };
}

export class ControlledMemoryGatewayContract {
  private readonly records = new Map<string, ControlledMemoryRecord>();
  private readonly now: () => string;
  private readonly estimateTokens: (content: string) => number;

  constructor(dependencies: ControlledMemoryGatewayDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.estimateTokens = dependencies.estimateTokens ?? defaultEstimateTokens;
  }

  capture(request: ControlledMemoryCaptureRequest): ControlledMemoryCaptureResult {
    const blocked = this.evaluateWritePolicy(request.policy, request.scope, request.sensitivity ?? "internal");
    if (blocked) {
      return { receipt: this.buildReceipt(request.policy, blocked.decision, blocked.reason, []) };
    }

    const capturedAt = this.now();
    const { content, report } = applyPrivacyFilter(request.content);
    const expiresAt = request.ttlDays
      ? new Date(Date.parse(capturedAt) + request.ttlDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    const memoryHash = computeDeterministicHash(
      "cvf-controlled-memory-record",
      request.sourceEvent,
      request.kind,
      request.scope,
      content,
      request.projectId ?? "",
      request.sessionId ?? "",
    );
    const memoryId = computeDeterministicHash("cvf-controlled-memory-id", memoryHash, capturedAt);
    const record: ControlledMemoryRecord = {
      memoryId,
      memoryHash,
      capturedAt,
      kind: request.kind,
      scope: request.scope,
      projectId: request.projectId,
      sessionId: request.sessionId,
      sourceEvent: request.sourceEvent,
      sourcePath: request.sourcePath,
      sensitivity: request.sensitivity ?? "internal",
      lifecycleState: "active",
      content,
      tokenEstimate: this.estimateTokens(content),
      expiresAt,
      provenance: request.provenance,
      privacyReport: report,
    };
    this.records.set(memoryId, record);
    return {
      record,
      receipt: this.buildReceipt(request.policy, "captured", "memory_captured_after_policy_and_privacy", [record]),
    };
  }

  retrieve(request: ControlledMemoryQueryRequest): ControlledMemoryQueryResult {
    const blocked = this.evaluateReadPolicy(request.policy);
    if (blocked) {
      return this.emptyQueryResult(request.policy, blocked.decision, blocked.reason);
    }
    const selected = this.selectRecords(request);
    return {
      records: selected,
      contextSegments: [],
      receipt: this.buildReceipt(request.policy, "retrieved", "memory_retrieved_after_access_lifecycle_budget", selected),
    };
  }

  reinject(request: ControlledMemoryReinjectionRequest): ControlledMemoryQueryResult {
    const blocked = this.evaluateReinjectionPolicy(request.policy);
    if (blocked) {
      return this.emptyQueryResult(request.policy, blocked.decision, blocked.reason);
    }
    const selected = this.selectRecords(request).filter((record) =>
      request.memoryIds ? request.memoryIds.includes(record.memoryId) : true,
    );
    const contextSegments = selected.map((record) => ({
      segmentId: computeDeterministicHash("cvf-controlled-memory-segment", record.memoryId, request.policy.traceId),
      memoryId: record.memoryId,
      content: record.content,
      tokenEstimate: record.tokenEstimate,
      sourceEvent: record.sourceEvent,
      provenanceSummary: record.provenance.summary,
      sensitivity: record.sensitivity,
    }));
    return {
      records: selected,
      contextSegments,
      receipt: this.buildReceipt(
        request.policy,
        "reinjectable",
        "memory_reinjection_packaged_with_provenance_and_budget",
        selected,
      ),
    };
  }

  markLifecycle(memoryId: string, lifecycleState: ControlledMemoryLifecycleState): ControlledMemoryRecord | undefined {
    const record = this.records.get(memoryId);
    if (!record) {
      return undefined;
    }
    const updated = { ...record, lifecycleState };
    this.records.set(memoryId, updated);
    return { ...updated };
  }

  listRecords(): ControlledMemoryRecord[] {
    return Array.from(this.records.values()).map((record) => ({ ...record }));
  }

  private selectRecords(request: ControlledMemoryQueryRequest): ControlledMemoryRecord[] {
    const maxTokens = request.maxTokens ?? Number.POSITIVE_INFINITY;
    let tokens = 0;
    const loweredQuery = request.query.toLowerCase();
    const selected: ControlledMemoryRecord[] = [];

    for (const record of this.records.values()) {
      const lifecycle = this.resolveLifecycle(record);
      if (lifecycle !== "active") {
        continue;
      }
      if (!request.policy.allowedScopes.includes(record.scope)) {
        continue;
      }
      if (request.policy.deniedMemoryIds?.includes(record.memoryId)) {
        continue;
      }
      if (record.sensitivity === "restricted" && !request.policy.canReadRestricted) {
        continue;
      }
      if (request.projectId && record.projectId !== request.projectId) {
        continue;
      }
      if (request.sessionId && record.sessionId !== request.sessionId) {
        continue;
      }
      if (request.includeKinds && !request.includeKinds.includes(record.kind)) {
        continue;
      }
      if (!this.matchesQuery(record, loweredQuery)) {
        continue;
      }
      if (tokens + record.tokenEstimate > maxTokens) {
        continue;
      }
      tokens += record.tokenEstimate;
      selected.push({ ...record, lifecycleState: lifecycle });
    }
    return selected;
  }

  private matchesQuery(record: ControlledMemoryRecord, loweredQuery: string): boolean {
    if (!loweredQuery.trim()) {
      return true;
    }
    return (
      record.content.toLowerCase().includes(loweredQuery) ||
      record.sourceEvent.toLowerCase().includes(loweredQuery) ||
      record.provenance.summary.toLowerCase().includes(loweredQuery)
    );
  }

  private resolveLifecycle(record: ControlledMemoryRecord): ControlledMemoryLifecycleState {
    if (record.lifecycleState !== "active") {
      return record.lifecycleState;
    }
    if (record.expiresAt && Date.parse(record.expiresAt) <= Date.parse(this.now())) {
      return "expired";
    }
    return "active";
  }

  private evaluateWritePolicy(
    policy: ControlledMemoryPolicyContext,
    scope: ControlledMemoryScope,
    sensitivity: ControlledMemorySensitivity,
  ): { decision: "denied" | "requires_approval"; reason: string } | undefined {
    const common = this.evaluateReadPolicy(policy);
    if (common) {
      return common;
    }
    if (!policy.canWrite) {
      return { decision: "denied", reason: "memory_write_not_authorized" };
    }
    if (!policy.allowedScopes.includes(scope)) {
      return { decision: "denied", reason: "memory_scope_not_authorized" };
    }
    if (sensitivity === "restricted" && !policy.canReadRestricted) {
      return { decision: "requires_approval", reason: "restricted_memory_requires_approval" };
    }
    return undefined;
  }

  private evaluateReadPolicy(
    policy: ControlledMemoryPolicyContext,
  ): { decision: "denied" | "requires_approval"; reason: string } | undefined {
    if (policy.policyResult === "deny") {
      return { decision: "denied", reason: policy.reason ?? "memory_policy_denied" };
    }
    if (policy.policyResult === "requires_approval") {
      return { decision: "requires_approval", reason: policy.reason ?? "memory_policy_requires_approval" };
    }
    return undefined;
  }

  private evaluateReinjectionPolicy(
    policy: ControlledMemoryPolicyContext,
  ): { decision: "denied" | "requires_approval"; reason: string } | undefined {
    const common = this.evaluateReadPolicy(policy);
    if (common) {
      return common;
    }
    if (!policy.canReinject) {
      return { decision: "denied", reason: "memory_reinjection_not_authorized" };
    }
    return undefined;
  }

  private emptyQueryResult(
    policy: ControlledMemoryPolicyContext,
    decision: "denied" | "requires_approval",
    reason: string,
  ): ControlledMemoryQueryResult {
    return { records: [], contextSegments: [], receipt: this.buildReceipt(policy, decision, reason, []) };
  }

  private buildReceipt(
    policy: ControlledMemoryPolicyContext,
    decision: ControlledMemoryDecision,
    reason: string,
    records: ControlledMemoryRecord[],
  ): ControlledMemoryReceipt {
    const createdAt = this.now();
    const estimatedTokens = records.reduce((sum, record) => sum + record.tokenEstimate, 0);
    const maskedTokenCount = records.reduce((sum, record) => sum + record.privacyReport.maskedTokenCount, 0);
    return {
      receiptId: computeDeterministicHash("cvf-controlled-memory-receipt", policy.traceId, decision, reason, createdAt),
      traceId: policy.traceId,
      decision,
      reason,
      createdAt,
      actorId: policy.actorId,
      memoryIds: records.map((record) => record.memoryId),
      maskedTokenCount,
      estimatedTokens,
      provenanceRequired: true,
    };
  }
}

export function createControlledMemoryGatewayContract(
  dependencies?: ControlledMemoryGatewayDependencies,
): ControlledMemoryGatewayContract {
  return new ControlledMemoryGatewayContract(dependencies);
}
