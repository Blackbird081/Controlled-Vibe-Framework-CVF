/**
 * CPF RAG and Context Engine Convergence Contract — Dedicated Tests (W9-T1 CP1)
 * ==============================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 * GC-024: partition entry added to CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json.
 *
 * Coverage:
 *   RagContextEngineConvergenceContract.classifyRagContextSurfaces:
 *     - returns 43 total surfaces (40 FIXED_INPUT + 3 IN_SCOPE)
 *     - 40 surfaces classified FIXED_INPUT
 *     - 3 surfaces classified IN_SCOPE
 *     - rag-retrieval-authority classified IN_SCOPE
 *     - context-packaging-deterministic-api classified IN_SCOPE
 *     - knowledge-native-retrieval-authority classified IN_SCOPE
 *     - each of the 40 FIXED_INPUT surface IDs is present and FIXED_INPUT
 *     - every surface has non-empty surfaceId, sourceFile, description, rationale
 *
 *   RagContextEngineConvergenceContract.declareRagRetrievalAuthority:
 *     - retrievalPath is non-empty
 *     - first step references KnowledgeQueryContract
 *     - retrieval path includes KnowledgeRankingContract step
 *     - packagingAuthority references ContextPackagerContract
 *     - gatewayAlignment references W8-T1
 *     - declaredAt set to injected now()
 *     - authorityHash deterministic for same timestamp
 *     - authorityId is truthy
 *
 *   RagContextEngineConvergenceContract.declareDeterministicContextPackagingApi:
 *     - canonicalPackagingContract references ContextPackagerContract
 *     - deterministicApis is non-empty
 *     - deterministicApis includes pack method
 *     - packageHashAlgorithm is non-empty
 *     - idDerivation is non-empty
 *     - declaredAt set to injected now()
 *     - declarationHash deterministic for same timestamp
 *     - declarationId is truthy
 *
 *   RagContextEngineConvergenceContract.declareKnowledgeNativeRetrievalAuthority (W77-T1):
 *     - knowledgeNativePath is non-empty
 *     - structuralIndexAuthority references StructuralIndexContract
 *     - assemblyAuthority references KnowledgeContextAssemblyContract
 *     - consumerBridgeAuthority references KnowledgeContextAssemblyConsumerPipelineContract
 *     - packagingAuthority references ContextPackagerContract
 *     - defaultPolicyStatus declares NOT_DECIDED
 *     - noNewLayerStatement is non-empty
 *     - declaredAt set to injected now()
 *     - declarationHash deterministic for same timestamp
 *     - declarationId is truthy
 *
 *   RagContextEngineConvergenceContract.generateConvergenceReport:
 *     - fixedInputCount = 40
 *     - inScopeCount = 3
 *     - surfaces.length = 43
 *     - ragRetrievalAuthority is present
 *     - deterministicContextPackaging is present
 *     - knowledgeNativeRetrievalAuthority is present
 *     - generatedAt set to injected now()
 *     - reportHash deterministic for same timestamp
 *     - reportId is truthy
 *
 *   Factory:
 *     - createRagContextEngineConvergenceContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  RagContextEngineConvergenceContract,
  createRagContextEngineConvergenceContract,
} from "../src/rag.context.engine.convergence.contract";
import type { KnowledgeNativeRetrievalAuthorityDeclaration } from "../src/rag.context.engine.convergence.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-29T10:00:00.000Z";
const fixedNow = () => FIXED_NOW;

const contract = new RagContextEngineConvergenceContract({ now: fixedNow });

const EXPECTED_FIXED_SURFACE_IDS = [
  "knowledge-query",
  "knowledge-query-batch",
  "knowledge-ranking",
  "retrieval",
  "knowledge-query-consumer-pipeline",
  "knowledge-query-consumer-pipeline-batch",
  "knowledge-query-batch-consumer-pipeline",
  "knowledge-query-batch-consumer-pipeline-batch",
  "knowledge-ranking-consumer-pipeline",
  "knowledge-ranking-consumer-pipeline-batch",
  "retrieval-consumer-pipeline",
  "retrieval-consumer-pipeline-batch",
  "context-packager",
  "context-build",
  "context-build-batch",
  "context-enrichment",
  "context-packager-consumer-pipeline",
  "context-packager-consumer-pipeline-batch",
  "context-build-consumer-pipeline",
  "context-build-consumer-pipeline-batch",
  "context-build-batch-consumer-pipeline",
  "context-build-batch-consumer-pipeline-batch",
  "context-enrichment-consumer-pipeline",
  "context-enrichment-consumer-pipeline-batch",
  "model-gateway-boundary",
  // W77-T1 additions — W72-W76 knowledge-native surfaces + retroactive knowledge-ranking-batch
  "knowledge-ranking-batch",
  "knowledge-structural-index",
  "knowledge-structural-index-batch",
  "knowledge-compiled-artifact",
  "knowledge-compiled-artifact-batch",
  "w7-memory-record",
  "w7-memory-record-batch",
  "knowledge-maintenance",
  "knowledge-maintenance-batch",
  "knowledge-refactor",
  "knowledge-refactor-batch",
  "knowledge-context-assembly",
  "knowledge-context-assembly-batch",
  "knowledge-context-assembly-consumer-pipeline",
  "knowledge-context-assembly-consumer-pipeline-batch",
];

// ─── classifyRagContextSurfaces ───────────────────────────────────────────────

describe("RagContextEngineConvergenceContract.classifyRagContextSurfaces", () => {
  const surfaces = contract.classifyRagContextSurfaces();

  it("returns 43 total surfaces", () => {
    expect(surfaces).toHaveLength(43);
  });

  it("40 surfaces are classified FIXED_INPUT", () => {
    const fixed = surfaces.filter((s) => s.status === "FIXED_INPUT");
    expect(fixed).toHaveLength(40);
  });

  it("3 surfaces are classified IN_SCOPE", () => {
    const inScope = surfaces.filter((s) => s.status === "IN_SCOPE");
    expect(inScope).toHaveLength(3);
  });

  it("rag-retrieval-authority is IN_SCOPE", () => {
    const entry = surfaces.find((s) => s.surfaceId === "rag-retrieval-authority");
    expect(entry?.status).toBe("IN_SCOPE");
  });

  it("context-packaging-deterministic-api is IN_SCOPE", () => {
    const entry = surfaces.find((s) => s.surfaceId === "context-packaging-deterministic-api");
    expect(entry?.status).toBe("IN_SCOPE");
  });

  it("knowledge-native-retrieval-authority is IN_SCOPE", () => {
    const entry = surfaces.find((s) => s.surfaceId === "knowledge-native-retrieval-authority");
    expect(entry?.status).toBe("IN_SCOPE");
  });

  it.each(EXPECTED_FIXED_SURFACE_IDS)("surface '%s' is FIXED_INPUT", (id) => {
    const entry = surfaces.find((s) => s.surfaceId === id);
    expect(entry?.status).toBe("FIXED_INPUT");
  });

  it("every surface has non-empty surfaceId", () => {
    surfaces.forEach((s) => expect(s.surfaceId.length).toBeGreaterThan(0));
  });

  it("every surface has non-empty sourceFile", () => {
    surfaces.forEach((s) => expect(s.sourceFile.length).toBeGreaterThan(0));
  });

  it("every surface has non-empty description", () => {
    surfaces.forEach((s) => expect(s.description.length).toBeGreaterThan(0));
  });

  it("every surface has non-empty rationale", () => {
    surfaces.forEach((s) => expect(s.rationale.length).toBeGreaterThan(0));
  });
});

// ─── declareKnowledgeNativeRetrievalAuthority (W77-T1) ───────────────────────

describe("RagContextEngineConvergenceContract.declareKnowledgeNativeRetrievalAuthority", () => {
  const decl: KnowledgeNativeRetrievalAuthorityDeclaration =
    contract.declareKnowledgeNativeRetrievalAuthority();

  it("knowledgeNativePath is non-empty", () => {
    expect(decl.knowledgeNativePath.length).toBeGreaterThan(0);
  });

  it("structuralIndexAuthority references StructuralIndexContract", () => {
    expect(decl.structuralIndexAuthority).toContain("StructuralIndexContract");
  });

  it("assemblyAuthority references KnowledgeContextAssemblyContract", () => {
    expect(decl.assemblyAuthority).toContain("KnowledgeContextAssemblyContract");
  });

  it("consumerBridgeAuthority references KnowledgeContextAssemblyConsumerPipelineContract", () => {
    expect(decl.consumerBridgeAuthority).toContain("KnowledgeContextAssemblyConsumerPipelineContract");
  });

  it("packagingAuthority references ContextPackagerContract", () => {
    expect(decl.packagingAuthority).toContain("ContextPackagerContract");
  });

  it("defaultPolicyStatus declares NOT_DECIDED", () => {
    expect(decl.defaultPolicyStatus).toContain("NOT_DECIDED");
  });

  it("noNewLayerStatement is non-empty", () => {
    expect(decl.noNewLayerStatement.length).toBeGreaterThan(0);
  });

  it("declaredAt set to injected now()", () => {
    expect(decl.declaredAt).toBe(FIXED_NOW);
  });

  it("declarationHash deterministic for same timestamp", () => {
    const decl2 = contract.declareKnowledgeNativeRetrievalAuthority();
    expect(decl.declarationHash).toBe(decl2.declarationHash);
  });

  it("declarationId is truthy", () => {
    expect(decl.declarationId.length).toBeGreaterThan(0);
  });
});

// ─── declareRagRetrievalAuthority ─────────────────────────────────────────────

describe("RagContextEngineConvergenceContract.declareRagRetrievalAuthority", () => {
  const auth = contract.declareRagRetrievalAuthority();

  it("retrievalPath is non-empty", () => {
    expect(auth.retrievalPath.length).toBeGreaterThan(0);
  });

  it("first step references KnowledgeQueryContract", () => {
    expect(auth.retrievalPath[0]).toContain("KnowledgeQueryContract");
  });

  it("retrieval path includes KnowledgeRankingContract step", () => {
    expect(auth.retrievalPath.some((s) => s.includes("KnowledgeRankingContract"))).toBe(true);
  });

  it("packagingAuthority references ContextPackagerContract", () => {
    expect(auth.packagingAuthority).toContain("ContextPackagerContract");
  });

  it("gatewayAlignment references W8-T1", () => {
    expect(auth.gatewayAlignment).toContain("W8-T1");
  });

  it("declaredAt set to injected now()", () => {
    expect(auth.declaredAt).toBe(FIXED_NOW);
  });

  it("authorityHash deterministic for same timestamp", () => {
    const auth2 = contract.declareRagRetrievalAuthority();
    expect(auth.authorityHash).toBe(auth2.authorityHash);
  });

  it("authorityId is truthy", () => {
    expect(auth.authorityId.length).toBeGreaterThan(0);
  });
});

// ─── declareDeterministicContextPackagingApi ──────────────────────────────────

describe("RagContextEngineConvergenceContract.declareDeterministicContextPackagingApi", () => {
  const decl = contract.declareDeterministicContextPackagingApi();

  it("canonicalPackagingContract references ContextPackagerContract", () => {
    expect(decl.canonicalPackagingContract).toContain("ContextPackagerContract");
  });

  it("deterministicApis is non-empty", () => {
    expect(decl.deterministicApis.length).toBeGreaterThan(0);
  });

  it("deterministicApis includes pack method", () => {
    expect(decl.deterministicApis.some((a) => a.includes("pack"))).toBe(true);
  });

  it("packageHashAlgorithm is non-empty", () => {
    expect(decl.packageHashAlgorithm.length).toBeGreaterThan(0);
  });

  it("idDerivation is non-empty", () => {
    expect(decl.idDerivation.length).toBeGreaterThan(0);
  });

  it("declaredAt set to injected now()", () => {
    expect(decl.declaredAt).toBe(FIXED_NOW);
  });

  it("declarationHash deterministic for same timestamp", () => {
    const decl2 = contract.declareDeterministicContextPackagingApi();
    expect(decl.declarationHash).toBe(decl2.declarationHash);
  });

  it("declarationId is truthy", () => {
    expect(decl.declarationId.length).toBeGreaterThan(0);
  });
});

// ─── generateConvergenceReport ────────────────────────────────────────────────

describe("RagContextEngineConvergenceContract.generateConvergenceReport", () => {
  const report = contract.generateConvergenceReport();

  it("fixedInputCount = 40", () => {
    expect(report.fixedInputCount).toBe(40);
  });

  it("inScopeCount = 3", () => {
    expect(report.inScopeCount).toBe(3);
  });

  it("surfaces.length = 43", () => {
    expect(report.surfaces).toHaveLength(43);
  });

  it("ragRetrievalAuthority is present", () => {
    expect(report.ragRetrievalAuthority).toBeDefined();
    expect(report.ragRetrievalAuthority.retrievalPath.length).toBeGreaterThan(0);
  });

  it("deterministicContextPackaging is present", () => {
    expect(report.deterministicContextPackaging).toBeDefined();
    expect(report.deterministicContextPackaging.deterministicApis.length).toBeGreaterThan(0);
  });

  it("knowledgeNativeRetrievalAuthority is present", () => {
    expect(report.knowledgeNativeRetrievalAuthority).toBeDefined();
    expect(report.knowledgeNativeRetrievalAuthority.knowledgeNativePath.length).toBeGreaterThan(0);
    expect(report.knowledgeNativeRetrievalAuthority.defaultPolicyStatus).toContain("NOT_DECIDED");
  });

  it("generatedAt set to injected now()", () => {
    expect(report.generatedAt).toBe(FIXED_NOW);
  });

  it("reportHash deterministic for same timestamp", () => {
    const report2 = contract.generateConvergenceReport();
    expect(report.reportHash).toBe(report2.reportHash);
  });

  it("reportId is truthy", () => {
    expect(report.reportId.length).toBeGreaterThan(0);
  });
});

// ─── Factory ─────────────────────────────────────────────────────────────────

describe("createRagContextEngineConvergenceContract", () => {
  it("returns a working instance", () => {
    const c = createRagContextEngineConvergenceContract({ now: fixedNow });
    const report = c.generateConvergenceReport();
    expect(report.generatedAt).toBe(FIXED_NOW);
    expect(report.fixedInputCount).toBe(40);
    expect(report.inScopeCount).toBe(3);
    expect(report.knowledgeNativeRetrievalAuthority.defaultPolicyStatus).toContain("NOT_DECIDED");
  });
});
