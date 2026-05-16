import { describe, expect, it } from "vitest";

import {
  KnowledgeVaultIntakeContract,
  createKnowledgeVaultIntakeContract,
} from "../src/knowledge.vault.intake.contract";
import type { KnowledgeVaultRegistryEntry } from "../src/knowledge.vault.intake.types";

const FIXED_NOW = "2026-05-16T15:40:00.000Z";
const fixedNow = () => FIXED_NOW;

describe("KnowledgeVaultIntakeContract.intake", () => {
  it("normalizes markdown frontmatter into a governed registry entry and receipt", () => {
    const result = makeContract().intake({
      sourcePath: "vault/product/scope.md",
      requester: "operator",
      markdown: makeMarkdown({ id: "asset-scope", title: "MVP Scope", governance: "allow" }),
    });

    expect(result.valid).toBe(true);
    expect(result.entry.assetId).toBe("asset-scope");
    expect(result.entry.metadataComplete).toBe(true);
    expect(result.entry.classification.policyResult).toBe("allow");
    expect(result.entry.contextEligible).toBe(true);
    expect(result.receipt.receiptType).toBe("knowledge_vault_intake");
    expect(result.receipt.provenance.sourcePath).toBe("vault/product/scope.md");
  });

  it("marks incomplete metadata instead of silently trusting raw vault files", () => {
    const result = makeContract().intake({
      sourcePath: "vault/incomplete.md",
      requester: "operator",
      markdown: "No frontmatter, just notes.",
    });

    expect(result.valid).toBe(false);
    expect(result.entry.metadataComplete).toBe(false);
    expect(result.issues).toContain("title is required");
    expect(result.entry.contextEligible).toBe(false);
  });

  it("blocks restricted or blocked assets from context eligibility", () => {
    const restricted = makeContract().intake({
      sourcePath: "vault/security.md",
      requester: "operator",
      markdown: makeMarkdown({
        id: "asset-security",
        title: "Restricted Security Note",
        sensitivity: "restricted",
        governance: "allow",
      }),
    });

    expect(restricted.entry.classification.policyResult).toBe("blocked");
    expect(restricted.entry.contextEligible).toBe(false);
    expect(restricted.receipt.blocked).toBe(true);
  });
});

describe("KnowledgeVaultIntakeContract.buildGraph", () => {
  it("builds explicit frontmatter edges and derived wikilink edges", () => {
    const contract = makeContract();
    const active = intake(contract, { id: "asset-a", relatedTo: ["asset-b"], body: "See [[asset-c]]." });
    const related = intake(contract, { id: "asset-b", title: "Related" });
    const view = contract.buildGraph([active, related], "operator");

    expect(view.nodes).toHaveLength(2);
    expect(view.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: "asset-a", to: "asset-b", relation: "related_to", confidence: "explicit" }),
      expect.objectContaining({ from: "asset-a", to: "asset-c", relation: "mentions", confidence: "derived" }),
    ]));
    expect(view.weakEdges).toContain("asset-a->asset-c");
    expect(view.receipt.receiptType).toBe("graph_construction");
  });
});

describe("KnowledgeVaultIntakeContract.packageContextSnapshot", () => {
  it("packages only governed registry entries and produces a context receipt", () => {
    const contract = makeContract();
    const active = intake(contract, { id: "asset-active", relatedTo: ["asset-linked"], body: "Active context." });
    const linked = intake(contract, { id: "asset-linked", title: "Linked", body: "Linked context." });
    const snapshot = contract.packageContextSnapshot({
      requestId: "req-1",
      requester: "operator",
      activeAssetId: active.assetId,
      entries: [linked, active],
      tokenBudget: 100,
    });

    expect(snapshot.activeAsset?.id).toBe("asset-active");
    expect(snapshot.includedAssets.map((item) => item.id)).toEqual(["asset-active", "asset-linked"]);
    expect(snapshot.receipt.receiptType).toBe("context_snapshot");
    expect(snapshot.governanceFilters).toContain("sensitivity_check");
  });

  it("excludes review-required, superseded, conflicted, and over-budget assets deterministically", () => {
    const contract = makeContract();
    const active = intake(contract, { id: "asset-active", body: "Active context." });
    const review = intake(contract, { id: "asset-review", governance: "review_required" });
    const superseded = intake(contract, { id: "asset-old", status: "superseded" });
    const conflicted = intake(contract, { id: "asset-conflict", conflictsWith: ["asset-active"] });
    const large = intake(contract, { id: "asset-large", body: "x".repeat(1000) });

    const snapshot = contract.packageContextSnapshot({
      requestId: "req-2",
      requester: "operator",
      activeAssetId: active.assetId,
      entries: [active, review, superseded, conflicted, large],
      tokenBudget: 20,
    });

    expect(snapshot.includedAssets.map((item) => item.id)).toEqual(["asset-active"]);
    expect(snapshot.excludedAssets).toEqual(expect.arrayContaining([
      { id: "asset-review", reason: "approval_requirement_check" },
      { id: "asset-old", reason: "superseded" },
      { id: "asset-conflict", reason: "unresolved_conflict" },
      { id: "asset-large", reason: "token_budget_exceeded" },
    ]));
    expect(snapshot.truncationApplied).toBe(true);
  });
});

describe("KnowledgeVaultIntakeContract drift, reinjection, and tool gates", () => {
  it("creates drift signals that recommend but never auto-apply", () => {
    const signal = makeContract().createDriftSignal("conflicting_asset", ["asset-a", "asset-b"], ["receipt-1"]);

    expect(signal.severity).toBe("high");
    expect(signal.recommendedAction).toBe("resolve_conflict");
    expect(signal.autoApplyAllowed).toBe(false);
  });

  it("allows low-risk metadata reinjection proposals and blocks forbidden mutations", () => {
    const contract = makeContract();
    const asset = intake(contract, { id: "asset-a" });
    const signal = contract.createDriftSignal("metadata_mismatch", [asset.assetId], ["receipt-1"]);

    const allowed = contract.proposeReinjection({
      requester: "operator",
      sourceSignal: signal,
      affectedEntries: [asset],
      mutationType: "update_frontmatter",
      proposedChange: "Fix domain metadata.",
      reason: "Registry drift.",
    });
    const blocked = contract.proposeReinjection({
      requester: "operator",
      sourceSignal: signal,
      affectedEntries: [asset],
      mutationType: "direct_agent_file_edit",
      proposedChange: "Agent edits raw file.",
      reason: "Bypass attempt.",
    });

    expect(allowed.policyResult).toBe("allow");
    expect(blocked.policyResult).toBe("blocked");
    expect(blocked.receipt.blocked).toBe(true);
  });

  it("governs MCP-style knowledge tool calls before read or write", () => {
    const contract = makeContract();
    const asset = intake(contract, { id: "asset-a" });

    const read = contract.evaluateKnowledgeToolCall({
      requester: "operator",
      toolName: "read_note",
      operation: "read",
      asset,
    });
    const badWrite = contract.evaluateKnowledgeToolCall({
      requester: "operator",
      toolName: "append_to_note",
      operation: "write",
      asset,
      proposedChange: "Append note.",
      directRawFileWrite: true,
    });

    expect(read.allowed).toBe(true);
    expect(badWrite.allowed).toBe(false);
    expect(badWrite.reasons).toEqual(expect.arrayContaining([
      "direct_raw_file_write",
      "mutation_without_receipt",
    ]));
    expect(badWrite.receipt.receiptType).toBe("mcp_knowledge_tool");
  });

  it("factory returns a working contract", () => {
    expect(createKnowledgeVaultIntakeContract({ now: fixedNow })).toBeInstanceOf(KnowledgeVaultIntakeContract);
  });
});

function makeContract() {
  return createKnowledgeVaultIntakeContract({
    now: fixedNow,
    estimateTokens: (content) => Math.ceil(content.length / 10),
  });
}

function intake(
  contract: KnowledgeVaultIntakeContract,
  options: {
    readonly id: string;
    readonly title?: string;
    readonly governance?: "allow" | "review_required";
    readonly sensitivity?: "internal" | "restricted";
    readonly status?: "active" | "superseded";
    readonly relatedTo?: readonly string[];
    readonly conflictsWith?: readonly string[];
    readonly body?: string;
  },
): KnowledgeVaultRegistryEntry {
  return contract.intake({
    sourcePath: `vault/${options.id}.md`,
    requester: "operator",
    markdown: makeMarkdown(options),
  }).entry;
}

function makeMarkdown(options: {
  readonly id?: string;
  readonly title?: string;
  readonly governance?: "allow" | "review_required";
  readonly sensitivity?: "internal" | "restricted";
  readonly status?: "active" | "superseded";
  readonly relatedTo?: readonly string[];
  readonly conflictsWith?: readonly string[];
  readonly body?: string;
}) {
  return `---
cvf_asset_id: ${options.id ?? "asset-1"}
title: ${options.title ?? "Knowledge Asset"}
type: research_note
status: ${options.status ?? "active"}
source: external_vault
created_at: 2026-05-16
updated_at: 2026-05-16
owner: operator
domain: product
sensitivity: ${options.sensitivity ?? "internal"}
governance_level: ${options.governance ?? "allow"}
risk_level: low
context_priority: normal
related_to: [${(options.relatedTo ?? []).join(", ")}]
conflicts_with: [${(options.conflictsWith ?? []).join(", ")}]
---
${options.body ?? "This is governed knowledge content."}`;
}
