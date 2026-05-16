export type VaultAssetType =
  | "markdown_note"
  | "project_note"
  | "decision_record"
  | "requirement_note"
  | "architecture_note"
  | "policy_note"
  | "meeting_note"
  | "research_note"
  | "external_reference";

export type VaultAssetStatus = "draft" | "active" | "review" | "superseded" | "blocked";
export type VaultSensitivity = "public" | "internal" | "confidential" | "restricted";
export type VaultRiskLevel = "low" | "medium" | "high";
export type VaultGovernanceLevel = "allow" | "review_required" | "approval_required" | "blocked";
export type VaultPolicyResult = "allow" | "review_required" | "blocked";
export type VaultReceiptType =
  | "knowledge_vault_intake"
  | "metadata_normalization"
  | "graph_construction"
  | "context_snapshot"
  | "mcp_knowledge_tool"
  | "governed_reinjection";

export type VaultEdgeRelation =
  | "belongs_to"
  | "related_to"
  | "depends_on"
  | "supersedes"
  | "superseded_by"
  | "references"
  | "mentions"
  | "conflicts_with"
  | "supports";

export type VaultDriftType =
  | "stale_asset"
  | "conflicting_asset"
  | "broken_link"
  | "superseded_asset"
  | "metadata_mismatch"
  | "domain_drift"
  | "context_misuse"
  | "repeated_correction";

export type VaultMutationType =
  | "update_frontmatter"
  | "append_correction_note"
  | "add_relationship"
  | "mark_superseded"
  | "lower_context_priority"
  | "add_conflict_notice"
  | "silent_content_rewrite"
  | "direct_agent_file_edit"
  | "policy_change_without_review"
  | "restricted_asset_reclassification_without_approval"
  | "deleting_audit_history";

export interface KnowledgeVaultAssetInput {
  readonly sourcePath: string;
  readonly markdown: string;
  readonly requester: string;
}

export interface NormalizedKnowledgeVaultMetadata {
  readonly cvf_asset_id: string;
  readonly title: string;
  readonly type: VaultAssetType;
  readonly status: VaultAssetStatus;
  readonly source: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly owner: string;
  readonly domain: string;
  readonly sensitivity: VaultSensitivity;
  readonly governance_level: VaultGovernanceLevel;
  readonly related_to: readonly string[];
  readonly belongs_to: readonly string[];
  readonly depends_on: readonly string[];
  readonly supersedes: readonly string[];
  readonly superseded_by: readonly string[];
  readonly conflicts_with: readonly string[];
  readonly tags: readonly string[];
  readonly risk_level: VaultRiskLevel;
  readonly context_priority: "low" | "normal" | "high";
}

export interface KnowledgeVaultRegistryEntry {
  readonly assetId: string;
  readonly sourcePath: string;
  readonly sourceHash: string;
  readonly metadataComplete: boolean;
  readonly metadata: NormalizedKnowledgeVaultMetadata;
  readonly classification: {
    readonly sensitivity: VaultSensitivity;
    readonly riskLevel: VaultRiskLevel;
    readonly governanceLevel: VaultGovernanceLevel;
    readonly policyResult: VaultPolicyResult;
  };
  readonly contentExcerpt: string;
  readonly wikilinks: readonly string[];
  readonly contextEligible: boolean;
  readonly eligibilityReasons: readonly string[];
}

export interface KnowledgeVaultReceipt {
  readonly receiptId: string;
  readonly receiptType: VaultReceiptType;
  readonly timestamp: string;
  readonly requester: string;
  readonly assetIds: readonly string[];
  readonly operation: string;
  readonly policyResult: VaultPolicyResult;
  readonly riskLevel: VaultRiskLevel;
  readonly provenance: {
    readonly sourcePath: string;
    readonly sourceHash: string;
    readonly assetVersion: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly owner: string;
    readonly domain: string;
  };
  readonly blocked?: boolean;
  readonly reason?: string;
}

export interface KnowledgeVaultIntakeResult {
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly entry: KnowledgeVaultRegistryEntry;
  readonly receipt: KnowledgeVaultReceipt;
}

export interface KnowledgeGraphNode {
  readonly id: string;
  readonly title: string;
  readonly type: VaultAssetType;
  readonly status: VaultAssetStatus;
  readonly sourcePath: string;
  readonly domain: string;
  readonly sensitivity: VaultSensitivity;
  readonly riskLevel: VaultRiskLevel;
  readonly eligible: boolean;
}

export interface KnowledgeGraphEdge {
  readonly from: string;
  readonly to: string;
  readonly relation: VaultEdgeRelation;
  readonly source: "frontmatter" | "wikilink";
  readonly confidence: "explicit" | "derived";
  readonly requiresReview: boolean;
}

export interface KnowledgeGraphView {
  readonly nodes: readonly KnowledgeGraphNode[];
  readonly edges: readonly KnowledgeGraphEdge[];
  readonly blockedNodes: readonly string[];
  readonly weakEdges: readonly string[];
  readonly conflictFlags: readonly string[];
  readonly receipt: KnowledgeVaultReceipt;
}

export interface ContextSnapshotRequest {
  readonly requestId: string;
  readonly requester: string;
  readonly activeAssetId: string;
  readonly entries: readonly KnowledgeVaultRegistryEntry[];
  readonly tokenBudget: number;
  readonly approvalRefs?: readonly string[];
  readonly includeSuperseded?: boolean;
}

export interface ContextSnapshotAsset {
  readonly id: string;
  readonly title: string;
  readonly excerpt: string;
  readonly relation: "active" | "linked" | "dependency" | "parent" | "related";
  readonly tokenEstimate: number;
}

export interface KnowledgeVaultContextSnapshot {
  readonly snapshotId: string;
  readonly requestId: string;
  readonly createdAt: string;
  readonly activeAsset: ContextSnapshotAsset | null;
  readonly includedAssets: readonly ContextSnapshotAsset[];
  readonly excludedAssets: readonly { readonly id: string; readonly reason: string }[];
  readonly governanceFilters: readonly string[];
  readonly truncationApplied: boolean;
  readonly receipt: KnowledgeVaultReceipt;
}

export interface KnowledgeDriftSignal {
  readonly signalId: string;
  readonly driftType: VaultDriftType;
  readonly affectedAssets: readonly string[];
  readonly severity: VaultRiskLevel;
  readonly evidenceReceipts: readonly string[];
  readonly recommendedAction: string;
  readonly autoApplyAllowed: false;
}

export interface ReinjectionProposal {
  readonly proposalId: string;
  readonly sourceSignal: string;
  readonly affectedAssets: readonly string[];
  readonly mutationType: VaultMutationType;
  readonly proposedChange: string;
  readonly reason: string;
  readonly riskLevel: VaultRiskLevel;
  readonly requiresHumanApproval: boolean;
  readonly policyResult: VaultPolicyResult;
  readonly receipt: KnowledgeVaultReceipt;
}

export interface KnowledgeToolCall {
  readonly toolName: string;
  readonly requester: string;
  readonly operation: "read" | "write";
  readonly asset: KnowledgeVaultRegistryEntry;
  readonly approvalRef?: string;
  readonly proposedChange?: string;
  readonly receiptPrepared?: boolean;
  readonly directRawFileWrite?: boolean;
}

export interface KnowledgeToolDecision {
  readonly allowed: boolean;
  readonly policyResult: VaultPolicyResult;
  readonly reasons: readonly string[];
  readonly receipt: KnowledgeVaultReceipt;
}

export interface KnowledgeVaultIntakeContractDependencies {
  readonly now?: () => string;
  readonly estimateTokens?: (content: string) => number;
}
