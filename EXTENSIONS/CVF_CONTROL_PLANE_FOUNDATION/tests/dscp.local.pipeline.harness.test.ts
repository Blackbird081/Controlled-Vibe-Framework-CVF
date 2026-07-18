import { describe, it, expect } from "vitest";
import { buildGovernedArtifactDescriptor } from "../src/dscp.governed.artifact.descriptor";
import { createGovernedContextPackerContract } from "../src/dscp.governed.context.packer";
import { buildGovernedRetrievalReceipt } from "../src/dscp.governed.retrieval.receipt";
import { buildLPFGovernedPackage } from "../src/dscp.lpf.adapter";
import { buildECOGovernedPackRequest } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/dscp.eco.adapter";
import { packageMemoryContext } from "../../CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager";
import type { RAGDocument, RAGResult } from "../../CVF_ECO_v1.4_RAG_PIPELINE/src/types";
import type { GovernanceContextEnvelope } from "../src/dscp.governed.context.contract";

// --- DSCP-T9: Local Pipeline Harness ---
// Tranche: DSCP-T9
// Authorization: docs/baselines/CVF_GC018_DSCP_T9_LOCAL_PIPELINE_HARNESS_2026-06-08.md
// Deterministic local harness only; no provider call or external I/O.

const DETERMINISTIC_NOW = () => "2026-06-08T00:00:00.000Z";
const DETERMINISTIC_TOKENS = (s: string) => s.length;

describe("DSCP-T9 Local Pipeline Harness", () => {
  describe("ECO PASS path", () => {
    it("composes descriptor, adapter, packer, and receipt without releasing content", () => {
      const doc1: RAGDocument = {
        id: "eco-doc-governance",
        title: "CVF Governance Policy",
        content: "governance policy content for test harness",
        tier: "T2_POLICY",
        documentType: "policy",
        domain: "governance",
        tags: ["policy", "cvf"],
        score: 0.92,
        metadata: {},
      };
      const doc2: RAGDocument = {
        id: "eco-doc-operational",
        title: "CVF Operational Log",
        content: "operational log content for test harness",
        tier: "T3_OPERATIONAL",
        documentType: "operational_log",
        domain: "operations",
        tags: ["operational"],
        score: 0.81,
        metadata: {},
      };

      const desc1Result = buildGovernedArtifactDescriptor({
        artifactId: doc1.id,
        sourceHash: "hash-eco-gov-1",
        artifactRole: "corpus_candidate",
        contentClass: "RAGDocument",
        governanceGates: { classificationGate: "PASS", freshnessGate: "PASS", eligibilityGate: "YES" },
      });
      const desc2Result = buildGovernedArtifactDescriptor({
        artifactId: doc2.id,
        sourceHash: "hash-eco-ops-2",
        artifactRole: "corpus_candidate",
        contentClass: "RAGDocument",
        governanceGates: { classificationGate: "PASS", freshnessGate: "PASS", eligibilityGate: "YES" },
      });

      expect(desc1Result.blocked).toBe(false);
      expect(desc2Result.blocked).toBe(false);
      expect(desc1Result.descriptor).not.toBeNull();
      expect(desc2Result.descriptor).not.toBeNull();

      const envelope: GovernanceContextEnvelope = {
        artifactDescriptors: [desc1Result.descriptor!, desc2Result.descriptor!],
        classificationGate: "PASS",
        freshnessGate: "PASS",
        policyDecision: "approved for dscp-t9 harness test",
        authorizationRef: "docs/baselines/CVF_GC018_DSCP_T9_LOCAL_PIPELINE_HARNESS_2026-06-08.md",
      };

      const ragResult: RAGResult = {
        query: "governance policy query",
        documents: [doc1, doc2],
        tiersSearched: ["T2_POLICY", "T3_OPERATIONAL"],
        totalCandidates: 2,
        retrievalTimeMs: 5,
      };

      const govPackRequest = buildECOGovernedPackRequest(ragResult, envelope);

      const packer = createGovernedContextPackerContract({
        packagerDependencies: {
          now: DETERMINISTIC_NOW,
          estimateTokens: DETERMINISTIC_TOKENS,
        },
      });
      const govPackage = packer.pack(govPackRequest);

      expect(govPackage.innerPackage.packageId).not.toBe("BLOCKED");
      expect(govPackage.governanceEvidence.rawContentReleased).toBe(false);
      expect(govPackage.governanceEvidence.canBypassGovernance).toBe(false);
      expect(govPackage.governanceEvidence.sourceArtifactIds).toContain("eco-doc-governance");
      expect(govPackage.governanceEvidence.sourceArtifactIds).toContain("eco-doc-operational");

      const receipt = buildGovernedRetrievalReceipt({
        receiptId: "receipt-eco-pass-1",
        query: ragResult.query,
        queryTimestamp: DETERMINISTIC_NOW(),
        contextPackage: govPackage,
        governanceOutcome: "ANSWER_EMITTED",
        contentDeliveryClass: "DIRECT_ANSWER",
        freshnessDisclosureApplied: false,
        modelResponseHash: "mock-eco-model-hash",
      });

      expect(receipt.contextPackageId).toBe(govPackage.innerPackage.packageId);
      expect(receipt.rawSourceReleased).toBe(false);
      expect(receipt.sourceArtifactIds).toContain("eco-doc-governance");
      expect(receipt.sourceArtifactIds).toContain("eco-doc-operational");
      expect(receipt.governanceGateResults["classificationGate"]).toBe("PASS");
      expect(receipt.governanceGateResults["freshnessGate"]).toBe("PASS");
    });
  });

  describe("ECO blocked gate path", () => {
    it("returns BLOCKED package ID and does not expose source artifact IDs", () => {
      const doc1: RAGDocument = {
        id: "eco-doc-blocked-1",
        title: "Blocked Classification Doc",
        content: "content that triggers classification block",
        tier: "T1_DOCTRINE",
        documentType: "doctrine",
        domain: "blocked-domain",
        tags: [],
        metadata: {},
      };

      const blockedEnvelope: GovernanceContextEnvelope = {
        artifactDescriptors: [],
        classificationGate: "BLOCKED",
        freshnessGate: "PASS",
        policyDecision: "BLOCKED: classification gate failed for dscp-t9 harness",
      };

      const ragResult: RAGResult = {
        query: "blocked classification query",
        documents: [doc1],
        tiersSearched: ["T1_DOCTRINE"],
        totalCandidates: 1,
        retrievalTimeMs: 1,
      };

      const govPackRequest = buildECOGovernedPackRequest(ragResult, blockedEnvelope);

      const packer = createGovernedContextPackerContract({
        packagerDependencies: {
          now: DETERMINISTIC_NOW,
          estimateTokens: DETERMINISTIC_TOKENS,
        },
      });
      const govPackage = packer.pack(govPackRequest);

      expect(govPackage.innerPackage.packageId).toBe("BLOCKED");
      expect(govPackage.governanceEvidence.sourceArtifactIds).toHaveLength(0);
      expect(govPackage.governanceEvidence.rawContentReleased).toBe(false);
      expect(govPackage.governanceEvidence.canBypassGovernance).toBe(false);
    });
  });

  describe("LPF path", () => {
    it("preserves memory lock into DSCP package and receipt with matching source artifact IDs", () => {
      const memBlock = packageMemoryContext({
        purpose: "dscp-t9 harness test",
        scope: "dscp-lpf-pipeline",
        riskLevel: "low",
        approvedMemory: [
          {
            id: "mem-dscp-t9-1",
            summary: "memory item for dscp-t9 harness",
            scope: "dscp",
            tokenEstimate: 50,
          },
        ],
        excludedMemory: [],
        policyDecision: "approved for dscp-t9 lpf harness test",
        tokenBudget: 200,
      });

      expect(memBlock.rawMemoryReleased).toBe(false);
      expect(memBlock.evidence.rawMemoryReleased).toBe(false);

      const lpfEnvelope: GovernanceContextEnvelope = {
        artifactDescriptors: [],
        classificationGate: "PASS",
        freshnessGate: "PASS",
        policyDecision: "approved for lpf harness test",
        authorizationRef: "docs/baselines/CVF_GC018_DSCP_T8_MKE1_CROSS_LANE_WIREIN_2026-06-08.md",
      };

      const artifactId = "lpf-artifact-dscp-t9";
      const govPackage = buildLPFGovernedPackage(memBlock, artifactId, lpfEnvelope);

      expect(govPackage.governanceEvidence.rawContentReleased).toBe(false);
      expect(govPackage.governanceEvidence.canBypassGovernance).toBe(false);
      expect(govPackage.governanceEvidence.sourceArtifactIds).toContain(artifactId);

      const receipt = buildGovernedRetrievalReceipt({
        receiptId: "receipt-lpf-1",
        query: "lpf harness query",
        queryTimestamp: DETERMINISTIC_NOW(),
        contextPackage: govPackage,
        governanceOutcome: "ANSWER_EMITTED",
        contentDeliveryClass: "DIRECT_ANSWER",
        freshnessDisclosureApplied: false,
        modelResponseHash: "mock-lpf-model-hash",
      });

      expect(receipt.rawSourceReleased).toBe(false);
      expect(receipt.sourceArtifactIds).toEqual(govPackage.governanceEvidence.sourceArtifactIds);
      expect(receipt.sourceArtifactIds).toContain(artifactId);
      expect(receipt.contextPackageId).toBe(govPackage.innerPackage.packageId);
    });
  });
});
