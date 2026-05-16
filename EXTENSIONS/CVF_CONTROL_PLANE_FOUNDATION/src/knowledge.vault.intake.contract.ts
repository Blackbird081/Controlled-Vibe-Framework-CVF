import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type {
  ContextSnapshotAsset,
  ContextSnapshotRequest,
  KnowledgeDriftSignal,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  KnowledgeGraphView,
  KnowledgeToolCall,
  KnowledgeToolDecision,
  KnowledgeVaultAssetInput,
  KnowledgeVaultContextSnapshot,
  KnowledgeVaultIntakeContractDependencies,
  KnowledgeVaultIntakeResult,
  KnowledgeVaultReceipt,
  KnowledgeVaultRegistryEntry,
  NormalizedKnowledgeVaultMetadata,
  ReinjectionProposal,
  VaultDriftType,
  VaultEdgeRelation,
  VaultMutationType,
  VaultPolicyResult,
  VaultReceiptType,
  VaultRiskLevel,
} from "./knowledge.vault.intake.types";

export class KnowledgeVaultIntakeContract {
  private readonly now: () => string;
  private readonly estimateTokens: (content: string) => number;

  constructor(dependencies: KnowledgeVaultIntakeContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.estimateTokens = dependencies.estimateTokens ?? ((content) => Math.ceil(content.length / 4));
  }

  intake(input: KnowledgeVaultAssetInput): KnowledgeVaultIntakeResult {
    const timestamp = this.now();
    const parsed = parseMarkdown(input.markdown);
    const metadata = normalizeMetadata(parsed.frontmatter, input.sourcePath);
    const sourceHash = computeDeterministicHash("knowledge-vault-source", input.sourcePath, parsed.body);
    const issues = validateMetadata(metadata);
    const policyResult = classifyPolicy(metadata);
    const contextEligible = policyResult === "allow" && metadata.status !== "superseded";
    const eligibilityReasons = contextEligible
      ? ["registry entry is governed source-of-truth eligible"]
      : buildEligibilityReasons(metadata, policyResult, issues);

    const entry: KnowledgeVaultRegistryEntry = {
      assetId: metadata.cvf_asset_id,
      sourcePath: input.sourcePath,
      sourceHash,
      metadataComplete: issues.length === 0,
      metadata,
      classification: {
        sensitivity: metadata.sensitivity,
        riskLevel: metadata.risk_level,
        governanceLevel: metadata.governance_level,
        policyResult,
      },
      contentExcerpt: excerpt(parsed.body),
      wikilinks: extractWikilinks(parsed.body),
      contextEligible,
      eligibilityReasons,
    };

    return {
      valid: issues.length === 0 && policyResult !== "blocked",
      issues,
      entry,
      receipt: this.createReceipt({
        receiptType: "knowledge_vault_intake",
        timestamp,
        requester: input.requester,
        assetIds: [entry.assetId],
        operation: "intake",
        policyResult,
        riskLevel: metadata.risk_level,
        entry,
        blocked: policyResult === "blocked",
        reason: policyResult === "blocked" ? "asset is blocked by governance classification" : undefined,
      }),
    };
  }

  buildGraph(entries: readonly KnowledgeVaultRegistryEntry[], requester: string): KnowledgeGraphView {
    const timestamp = this.now();
    const nodes = entries.map((entry): KnowledgeGraphNode => ({
      id: entry.assetId,
      title: entry.metadata.title,
      type: entry.metadata.type,
      status: entry.metadata.status,
      sourcePath: entry.sourcePath,
      domain: entry.metadata.domain,
      sensitivity: entry.metadata.sensitivity,
      riskLevel: entry.metadata.risk_level,
      eligible: entry.contextEligible,
    }));

    const edges = entries.flatMap((entry) => [
      ...edgeList(entry, "belongs_to", entry.metadata.belongs_to),
      ...edgeList(entry, "related_to", entry.metadata.related_to),
      ...edgeList(entry, "depends_on", entry.metadata.depends_on),
      ...edgeList(entry, "supersedes", entry.metadata.supersedes),
      ...edgeList(entry, "superseded_by", entry.metadata.superseded_by),
      ...edgeList(entry, "conflicts_with", entry.metadata.conflicts_with),
      ...entry.wikilinks.map((target): KnowledgeGraphEdge => ({
        from: entry.assetId,
        to: target,
        relation: "mentions",
        source: "wikilink",
        confidence: "derived",
        requiresReview: true,
      })),
    ]);

    return {
      nodes,
      edges,
      blockedNodes: nodes.filter((node) => !node.eligible).map((node) => node.id),
      weakEdges: edges.filter((edge) => edge.requiresReview).map((edge) => `${edge.from}->${edge.to}`),
      conflictFlags: edges
        .filter((edge) => edge.relation === "conflicts_with")
        .map((edge) => `${edge.from}->${edge.to}`),
      receipt: this.createReceipt({
        receiptType: "graph_construction",
        timestamp,
        requester,
        assetIds: entries.map((entry) => entry.assetId),
        operation: "build_graph",
        policyResult: entries.some((entry) => entry.classification.policyResult === "blocked")
          ? "review_required"
          : "allow",
        riskLevel: maxRisk(entries.map((entry) => entry.metadata.risk_level)),
        entry: entries[0],
      }),
    };
  }

  packageContextSnapshot(request: ContextSnapshotRequest): KnowledgeVaultContextSnapshot {
    const timestamp = this.now();
    const approvalRefs = request.approvalRefs ?? [];
    const byId = new Map(request.entries.map((entry) => [entry.assetId, entry]));
    const active = byId.get(request.activeAssetId);
    const ordered = orderForSnapshot(active, request.entries);
    const included: ContextSnapshotAsset[] = [];
    const excluded: Array<{ id: string; reason: string }> = [];
    let usedTokens = 0;

    for (const entry of ordered) {
      const exclusion = exclusionReason(entry, approvalRefs, request.includeSuperseded === true);
      if (exclusion !== undefined) {
        excluded.push({ id: entry.assetId, reason: exclusion });
        continue;
      }

      const asset = toSnapshotAsset(entry, active?.assetId, this.estimateTokens);
      if (usedTokens + asset.tokenEstimate > request.tokenBudget && entry.assetId !== active?.assetId) {
        excluded.push({ id: entry.assetId, reason: "token_budget_exceeded" });
        continue;
      }
      included.push(asset);
      usedTokens += asset.tokenEstimate;
    }

    const policyResult = active === undefined || excluded.some((item) => item.id === request.activeAssetId)
      ? "blocked"
      : "allow";

    return {
      snapshotId: computeDeterministicHash(
        "knowledge-vault-context-snapshot",
        request.requestId,
        included.map((item) => item.id).join(":"),
        excluded.map((item) => `${item.id}:${item.reason}`).join(":"),
      ),
      requestId: request.requestId,
      createdAt: timestamp,
      activeAsset: included.find((item) => item.id === request.activeAssetId) ?? null,
      includedAssets: included,
      excludedAssets: excluded,
      governanceFilters: [
        "sensitivity_check",
        "risk_level_check",
        "domain_boundary_check",
        "supersession_check",
        "conflict_check",
        "approval_requirement_check",
      ],
      truncationApplied: excluded.some((item) => item.reason === "token_budget_exceeded"),
      receipt: this.createReceipt({
        receiptType: "context_snapshot",
        timestamp,
        requester: request.requester,
        assetIds: included.map((item) => item.id),
        operation: "package_context",
        policyResult,
        riskLevel: maxRisk(included.map((item) => byId.get(item.id)?.metadata.risk_level ?? "low")),
        entry: active,
        blocked: policyResult === "blocked",
        reason: policyResult === "blocked" ? "active asset is unavailable or blocked by filters" : undefined,
      }),
    };
  }

  createDriftSignal(
    driftType: VaultDriftType,
    affectedAssets: readonly string[],
    evidenceReceipts: readonly string[],
  ): KnowledgeDriftSignal {
    const severity = driftSeverity(driftType);
    return {
      signalId: computeDeterministicHash(
        "knowledge-vault-drift-signal",
        driftType,
        affectedAssets.join(":"),
        evidenceReceipts.join(":"),
      ),
      driftType,
      affectedAssets,
      severity,
      evidenceReceipts,
      recommendedAction: driftRecommendedAction(driftType),
      autoApplyAllowed: false,
    };
  }

  proposeReinjection(input: {
    readonly requester: string;
    readonly sourceSignal: KnowledgeDriftSignal;
    readonly affectedEntries: readonly KnowledgeVaultRegistryEntry[];
    readonly mutationType: VaultMutationType;
    readonly proposedChange: string;
    readonly reason: string;
  }): ReinjectionProposal {
    const timestamp = this.now();
    const affectedAssets = input.affectedEntries.map((entry) => entry.assetId);
    const forbidden = FORBIDDEN_MUTATIONS.includes(input.mutationType);
    const requiresHumanApproval =
      forbidden ||
      input.mutationType === "append_correction_note" ||
      input.affectedEntries.some((entry) =>
        entry.metadata.sensitivity === "confidential" || entry.metadata.sensitivity === "restricted"
      );
    const riskLevel = forbidden || requiresHumanApproval ? "high" : input.sourceSignal.severity;
    const policyResult = forbidden ? "blocked" : requiresHumanApproval ? "review_required" : "allow";
    const proposalId = computeDeterministicHash(
      "knowledge-vault-reinjection-proposal",
      input.sourceSignal.signalId,
      input.mutationType,
      affectedAssets.join(":"),
    );

    return {
      proposalId,
      sourceSignal: input.sourceSignal.signalId,
      affectedAssets,
      mutationType: input.mutationType,
      proposedChange: input.proposedChange,
      reason: input.reason,
      riskLevel,
      requiresHumanApproval,
      policyResult,
      receipt: this.createReceipt({
        receiptType: "governed_reinjection",
        timestamp,
        requester: input.requester,
        assetIds: affectedAssets,
        operation: input.mutationType,
        policyResult,
        riskLevel,
        entry: input.affectedEntries[0],
        blocked: policyResult === "blocked",
        reason: policyResult === "blocked" ? "forbidden mutation type" : undefined,
      }),
    };
  }

  evaluateKnowledgeToolCall(call: KnowledgeToolCall): KnowledgeToolDecision {
    const reasons: string[] = [];
    if (call.requester.trim().length === 0) reasons.push("missing_identity");
    if (!call.asset.contextEligible && call.operation === "read") reasons.push("blocked_asset");
    if (call.directRawFileWrite === true) reasons.push("direct_raw_file_write");
    if (call.operation === "write" && call.receiptPrepared !== true) reasons.push("mutation_without_receipt");
    if (call.operation === "write" && call.proposedChange?.trim().length === 0) {
      reasons.push("missing_proposed_change");
    }
    if (
      call.asset.metadata.sensitivity === "restricted" &&
      call.approvalRef === undefined
    ) {
      reasons.push("restricted_without_approval");
    }

    const allowed = reasons.length === 0;
    const policyResult: VaultPolicyResult = allowed ? "allow" : "blocked";
    return {
      allowed,
      policyResult,
      reasons,
      receipt: this.createReceipt({
        receiptType: "mcp_knowledge_tool",
        timestamp: this.now(),
        requester: call.requester,
        assetIds: [call.asset.assetId],
        operation: `${call.toolName}:${call.operation}`,
        policyResult,
        riskLevel: call.asset.metadata.risk_level,
        entry: call.asset,
        blocked: !allowed,
        reason: reasons.join(","),
      }),
    };
  }

  private createReceipt(input: {
    readonly receiptType: VaultReceiptType;
    readonly timestamp: string;
    readonly requester: string;
    readonly assetIds: readonly string[];
    readonly operation: string;
    readonly policyResult: VaultPolicyResult;
    readonly riskLevel: VaultRiskLevel;
    readonly entry?: KnowledgeVaultRegistryEntry;
    readonly blocked?: boolean;
    readonly reason?: string;
  }): KnowledgeVaultReceipt {
    return {
      receiptId: computeDeterministicHash(
        "knowledge-vault-receipt",
        input.receiptType,
        input.operation,
        input.assetIds.join(":"),
        input.policyResult,
        input.timestamp,
      ),
      receiptType: input.receiptType,
      timestamp: input.timestamp,
      requester: input.requester,
      assetIds: input.assetIds,
      operation: input.operation,
      policyResult: input.policyResult,
      riskLevel: input.riskLevel,
      provenance: {
        sourcePath: input.entry?.sourcePath ?? "",
        sourceHash: input.entry?.sourceHash ?? "",
        assetVersion: input.entry?.metadata.updated_at ?? "",
        createdAt: input.entry?.metadata.created_at ?? "",
        updatedAt: input.entry?.metadata.updated_at ?? "",
        owner: input.entry?.metadata.owner ?? "",
        domain: input.entry?.metadata.domain ?? "",
      },
      blocked: input.blocked,
      reason: input.reason,
    };
  }
}

export function createKnowledgeVaultIntakeContract(
  dependencies?: KnowledgeVaultIntakeContractDependencies,
): KnowledgeVaultIntakeContract {
  return new KnowledgeVaultIntakeContract(dependencies);
}

const FORBIDDEN_MUTATIONS: readonly VaultMutationType[] = [
  "silent_content_rewrite",
  "direct_agent_file_edit",
  "policy_change_without_review",
  "restricted_asset_reclassification_without_approval",
  "deleting_audit_history",
];

function parseMarkdown(markdown: string): { frontmatter: Record<string, string | string[]>; body: string } {
  if (!markdown.startsWith("---")) return { frontmatter: {}, body: markdown.trim() };
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) return { frontmatter: {}, body: markdown.trim() };
  return {
    frontmatter: parseFrontmatter(markdown.slice(3, end)),
    body: markdown.slice(end + 4).trim(),
  };
}

function parseFrontmatter(raw: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  let activeListKey: string | undefined;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith("- ") && activeListKey !== undefined) {
      result[activeListKey] = [...asList(result[activeListKey]), trimmed.slice(2).trim()];
      continue;
    }
    const [key, ...valueParts] = trimmed.split(":");
    if (key === undefined || valueParts.length === 0) continue;
    const value = valueParts.join(":").trim();
    activeListKey = undefined;
    if (value === "[]") {
      result[key] = [];
    } else if (value.length === 0) {
      result[key] = [];
      activeListKey = key;
    } else {
      result[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  return result;
}

function normalizeMetadata(
  source: Record<string, string | string[]>,
  sourcePath: string,
): NormalizedKnowledgeVaultMetadata {
  const fallbackId = computeDeterministicHash("knowledge-vault-asset-id", sourcePath);
  return {
    cvf_asset_id: text(source.cvf_asset_id, fallbackId),
    title: text(source.title, ""),
    type: enumText(source.type, "external_reference", [
      "markdown_note",
      "project_note",
      "decision_record",
      "requirement_note",
      "architecture_note",
      "policy_note",
      "meeting_note",
      "research_note",
      "external_reference",
    ]),
    status: enumText(source.status, "draft", ["draft", "active", "review", "superseded", "blocked"]),
    source: text(source.source, "external_vault"),
    created_at: text(source.created_at, ""),
    updated_at: text(source.updated_at, ""),
    owner: text(source.owner, ""),
    domain: text(source.domain, ""),
    sensitivity: enumText(source.sensitivity, "internal", ["public", "internal", "confidential", "restricted"]),
    governance_level: enumText(source.governance_level, "review_required", [
      "allow",
      "review_required",
      "approval_required",
      "blocked",
    ]),
    related_to: asList(source.related_to),
    belongs_to: asList(source.belongs_to),
    depends_on: asList(source.depends_on),
    supersedes: asList(source.supersedes),
    superseded_by: asList(source.superseded_by),
    conflicts_with: asList(source.conflicts_with),
    tags: asList(source.tags),
    risk_level: enumText(source.risk_level, "low", ["low", "medium", "high"]),
    context_priority: enumText(source.context_priority, "normal", ["low", "normal", "high"]),
  };
}

function validateMetadata(metadata: NormalizedKnowledgeVaultMetadata): string[] {
  const required: Array<keyof NormalizedKnowledgeVaultMetadata> = [
    "cvf_asset_id",
    "title",
    "created_at",
    "updated_at",
    "owner",
    "domain",
  ];
  return required
    .filter((field) => String(metadata[field]).trim().length === 0)
    .map((field) => `${field} is required`);
}

function classifyPolicy(metadata: NormalizedKnowledgeVaultMetadata): VaultPolicyResult {
  if (metadata.governance_level === "blocked" || metadata.status === "blocked") return "blocked";
  if (metadata.sensitivity === "restricted") return "blocked";
  if (metadata.governance_level === "approval_required" || metadata.governance_level === "review_required") {
    return "review_required";
  }
  if (metadata.risk_level === "high" || metadata.sensitivity === "confidential") return "review_required";
  return "allow";
}

function buildEligibilityReasons(
  metadata: NormalizedKnowledgeVaultMetadata,
  policyResult: VaultPolicyResult,
  issues: readonly string[],
): string[] {
  return [
    ...issues,
    ...(policyResult === "blocked" ? ["blocked_by_policy"] : []),
    ...(policyResult === "review_required" ? ["review_required_before_context_use"] : []),
    ...(metadata.status === "superseded" ? ["superseded"] : []),
  ];
}

function edgeList(
  entry: KnowledgeVaultRegistryEntry,
  relation: VaultEdgeRelation,
  targets: readonly string[],
): KnowledgeGraphEdge[] {
  return targets.map((target) => ({
    from: entry.assetId,
    to: target,
    relation,
    source: "frontmatter",
    confidence: "explicit",
    requiresReview: false,
  }));
}

function orderForSnapshot(
  active: KnowledgeVaultRegistryEntry | undefined,
  entries: readonly KnowledgeVaultRegistryEntry[],
): KnowledgeVaultRegistryEntry[] {
  if (active === undefined) return [...entries];
  const linked = new Set([
    ...active.metadata.related_to,
    ...active.metadata.depends_on,
    ...active.metadata.belongs_to,
    ...active.wikilinks,
  ]);
  return [
    active,
    ...entries
      .filter((entry) => entry.assetId !== active.assetId)
      .sort((a, b) => priorityRank(a, linked) - priorityRank(b, linked)),
  ];
}

function exclusionReason(
  entry: KnowledgeVaultRegistryEntry,
  approvalRefs: readonly string[],
  includeSuperseded: boolean,
): string | undefined {
  if (entry.classification.policyResult === "blocked") return "blocked_by_policy";
  if (entry.classification.policyResult === "review_required" && approvalRefs.length === 0) {
    return "approval_requirement_check";
  }
  if (entry.metadata.status === "superseded" && !includeSuperseded) return "superseded";
  if (entry.metadata.conflicts_with.length > 0 && approvalRefs.length === 0) return "unresolved_conflict";
  return undefined;
}

function toSnapshotAsset(
  entry: KnowledgeVaultRegistryEntry,
  activeId: string | undefined,
  estimateTokens: (content: string) => number,
): ContextSnapshotAsset {
  return {
    id: entry.assetId,
    title: entry.metadata.title,
    excerpt: entry.contentExcerpt,
    relation: entry.assetId === activeId ? "active" : relationFor(entry),
    tokenEstimate: estimateTokens(entry.contentExcerpt),
  };
}

function relationFor(entry: KnowledgeVaultRegistryEntry): ContextSnapshotAsset["relation"] {
  if (entry.metadata.depends_on.length > 0) return "dependency";
  if (entry.metadata.belongs_to.length > 0) return "parent";
  if (entry.metadata.related_to.length > 0 || entry.wikilinks.length > 0) return "linked";
  return "related";
}

function priorityRank(entry: KnowledgeVaultRegistryEntry, linked: Set<string>): number {
  if (linked.has(entry.assetId)) return 1;
  if (entry.metadata.context_priority === "high") return 2;
  if (entry.metadata.context_priority === "normal") return 3;
  return 4;
}

function driftSeverity(driftType: VaultDriftType): VaultRiskLevel {
  if (driftType === "conflicting_asset" || driftType === "context_misuse") return "high";
  if (driftType === "broken_link") return "low";
  return "medium";
}

function driftRecommendedAction(driftType: VaultDriftType): string {
  const actions: Record<VaultDriftType, string> = {
    stale_asset: "review_asset",
    conflicting_asset: "resolve_conflict",
    broken_link: "repair_link",
    superseded_asset: "mark_superseded",
    metadata_mismatch: "update_metadata",
    domain_drift: "review_asset",
    context_misuse: "require_approval",
    repeated_correction: "append_correction_note",
  };
  return actions[driftType];
}

function maxRisk(values: readonly VaultRiskLevel[]): VaultRiskLevel {
  if (values.includes("high")) return "high";
  if (values.includes("medium")) return "medium";
  return "low";
}

function extractWikilinks(body: string): string[] {
  const links = Array.from(body.matchAll(/\[\[([^\]]+)\]\]/g)).map((match) => match[1]?.trim() ?? "");
  return Array.from(new Set(links.filter((link) => link.length > 0)));
}

function excerpt(body: string): string {
  return body.replace(/\s+/g, " ").trim().slice(0, 600);
}

function text(value: string | string[] | undefined, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asList(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter((item) => item.length > 0);
  if (typeof value !== "string" || value.trim().length === 0) return [];
  return value
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter((item) => item.length > 0);
}

function enumText<T extends string>(value: unknown, fallback: T, allowed: readonly T[]): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}
