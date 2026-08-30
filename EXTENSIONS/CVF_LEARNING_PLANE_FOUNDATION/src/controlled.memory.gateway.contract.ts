import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import {
  applyMemoryPrivacyFilter,
  isApprovedMemoryCaptureSource,
  resolveMemoryRetention,
} from "./controlled.memory.subcontracts";
import {
  buildControlledMemoryOriginKey,
  deriveMemorySourceTrust,
  validateMemoryTrustAdmission,
  type ControlledMemoryLink,
  type ControlledMemoryOrigin,
  type ControlledMemorySegmentClass,
  type ControlledMemorySourceTrust,
} from "./controlled.memory.trust.contract";

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
  origin: ControlledMemoryOrigin;
  originKey: string;
  segmentClass: ControlledMemorySegmentClass;
  sourceTrust: ControlledMemorySourceTrust;
  links: ControlledMemoryLink[];
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
  origin?: Pick<ControlledMemoryOrigin, "principalId">;
  segmentClass?: ControlledMemorySegmentClass;
  sourceTrust?: ControlledMemorySourceTrust;
  links?: ControlledMemoryLink[];
}

export interface ControlledMemoryQueryRequest {
  query: string;
  policy: ControlledMemoryPolicyContext;
  projectId?: string;
  sessionId?: string;
  includeKinds?: ControlledMemoryKind[];
  maxTokens?: number;
  origin?: Pick<ControlledMemoryOrigin, "principalId">;
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

export const CONTROLLED_MEMORY_GATEWAY_ADAPTER_VERSION =
  "phase2b-controlled-memory-gateway-adapter-1";

export interface ControlledMemoryGatewayAdapterSnapshot {
  version: typeof CONTROLLED_MEMORY_GATEWAY_ADAPTER_VERSION;
  source: "learning-plane:controlled-memory-gateway";
  traceId: string;
  actorId: string;
  decision: ControlledMemoryDecision;
  reason: string;
  memoryIds: string[];
  recordCount: number;
  contextSegmentCount: number;
  maskedTokenCount: number;
  estimatedTokens: number;
  persistentStoreCreated: false;
  newMemoryTierCreated: false;
}

export interface ControlledMemoryGatewayDependencies {
  now?: () => string;
  estimateTokens?: (content: string) => number;
}

function defaultEstimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
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
    if (!isApprovedMemoryCaptureSource(request.sourceEvent)) {
      return {
        receipt: this.buildReceipt(
          request.policy,
          "denied",
          "memory_capture_source_not_approved",
          [],
        ),
      };
    }
    const blocked = this.evaluateWritePolicy(request.policy, request.scope, request.sensitivity ?? "internal");
    if (blocked) {
      return { receipt: this.buildReceipt(request.policy, blocked.decision, blocked.reason, []) };
    }

    const segmentClass = request.segmentClass ?? "general";
    const sourceTrust = request.sourceTrust ?? deriveMemorySourceTrust(request.sourceEvent, request.policy.actorRole);
    const links = request.links ?? [];
    const trustBlock = validateMemoryTrustAdmission({ segmentClass, sourceTrust, links });
    if (trustBlock) {
      return { receipt: this.buildReceipt(request.policy, "denied", trustBlock, []) };
    }
    const origin = this.resolveOrigin(request);
    const originKey = buildControlledMemoryOriginKey(origin);
    for (const link of links) {
      const target = this.records.get(link.targetMemoryId);
      if (!target) {
        return { receipt: this.buildReceipt(request.policy, "denied", "memory_link_target_not_found", []) };
      }
      if (target.originKey !== originKey) {
        return { receipt: this.buildReceipt(request.policy, "denied", "memory_link_cross_origin_denied", []) };
      }
    }

    const capturedAt = this.now();
    const { content, report } = applyMemoryPrivacyFilter(request.content);
    const retention = resolveMemoryRetention({
      kind: request.kind,
      sensitivity: request.sensitivity ?? "internal",
      capturedAt,
      ttlDays: request.ttlDays,
    });
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
      expiresAt: retention.expiresAt,
      provenance: request.provenance,
      privacyReport: report,
      origin,
      originKey,
      segmentClass,
      sourceTrust,
      links: links.map((link) => ({ ...link })),
    };
    this.records.set(memoryId, record);
    for (const link of links) {
      if (link.type === "supersedes" || link.type === "corrects") {
        const target = this.records.get(link.targetMemoryId)!;
        this.records.set(target.memoryId, { ...target, lifecycleState: "contradicted" });
      }
    }
    return {
      record,
      receipt: this.buildReceipt(request.policy, "captured", "memory_captured_after_policy_and_privacy", [record]),
    };
  }

  captureWithAdapter(
    request: ControlledMemoryCaptureRequest,
  ): { result: ControlledMemoryCaptureResult; adapter: ControlledMemoryGatewayAdapterSnapshot } {
    const result = this.capture(request);
    return {
      result,
      adapter: buildControlledMemoryGatewayAdapterSnapshot(result),
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

  retrieveWithAdapter(
    request: ControlledMemoryQueryRequest,
  ): { result: ControlledMemoryQueryResult; adapter: ControlledMemoryGatewayAdapterSnapshot } {
    const result = this.retrieve(request);
    return {
      result,
      adapter: buildControlledMemoryGatewayAdapterSnapshot(result),
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

  reinjectWithAdapter(
    request: ControlledMemoryReinjectionRequest,
  ): { result: ControlledMemoryQueryResult; adapter: ControlledMemoryGatewayAdapterSnapshot } {
    const result = this.reinject(request);
    return {
      result,
      adapter: buildControlledMemoryGatewayAdapterSnapshot(result),
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
    const originKey = buildControlledMemoryOriginKey(this.resolveOrigin(request));

    for (const record of this.records.values()) {
      if (record.originKey !== originKey) {
        continue;
      }
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

  private resolveOrigin(request: {
    policy: ControlledMemoryPolicyContext;
    scope?: ControlledMemoryScope;
    projectId?: string;
    sessionId?: string;
    origin?: Pick<ControlledMemoryOrigin, "principalId">;
  }): ControlledMemoryOrigin {
    const scope = request.scope
      ?? (request.sessionId ? "session" : request.projectId ? "project" : request.policy.allowedScopes[0] ?? "session");
    return {
      principalId: request.origin?.principalId ?? request.policy.actorId,
      scope,
      projectId: request.projectId,
      sessionId: request.sessionId,
    };
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

export function buildControlledMemoryGatewayAdapterSnapshot(
  result: ControlledMemoryCaptureResult | ControlledMemoryQueryResult,
): ControlledMemoryGatewayAdapterSnapshot {
  const contextSegments = "contextSegments" in result ? result.contextSegments : [];
  const records = "contextSegments" in result
    ? result.records
    : result.record ? [result.record] : [];

  return {
    version: CONTROLLED_MEMORY_GATEWAY_ADAPTER_VERSION,
    source: "learning-plane:controlled-memory-gateway",
    traceId: result.receipt.traceId,
    actorId: result.receipt.actorId,
    decision: result.receipt.decision,
    reason: result.receipt.reason,
    memoryIds: [...result.receipt.memoryIds],
    recordCount: records.length,
    contextSegmentCount: contextSegments.length,
    maskedTokenCount: result.receipt.maskedTokenCount,
    estimatedTokens: result.receipt.estimatedTokens,
    persistentStoreCreated: false,
    newMemoryTierCreated: false,
  };
}
