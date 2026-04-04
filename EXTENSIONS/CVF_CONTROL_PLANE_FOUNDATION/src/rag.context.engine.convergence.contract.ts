import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

// Classification of each RAG/context contract surface relative to W9-T1 scope.
// FIXED_INPUT: surface is delivered and frozen; W9-T1 reads but does not restructure it.
// IN_SCOPE: surface is a new declaration owned by W9-T1; declared here for the first time.
export type RagContextSurfaceStatus = "FIXED_INPUT" | "IN_SCOPE";

export interface RagContextSurfaceEntry {
  surfaceId: string;
  sourceFile: string;
  status: RagContextSurfaceStatus;
  description: string;
  rationale: string;
}

// Declares the canonical ordered RAG retrieval path and authority ownership.
// Aligns retrieval authority against the W8-T1 frozen gateway boundary (pass condition 5).
export interface RagRetrievalAuthorityDeclaration {
  authorityId: string;
  declaredAt: string;
  retrievalPath: string[];     // ordered canonical RAG steps: query → rank → package
  rankingAuthority: string;    // canonical owner of knowledge ranking
  queryAuthority: string;      // canonical owner of knowledge querying
  packagingAuthority: string;  // canonical owner of context packaging
  gatewayAlignment: string;    // alignment statement against W8-T1 frozen gateway boundary
  authorityHash: string;
}

// Declares the deterministic context packaging API as canonical.
// Normalizes the packaging surface against the existing ContextPackagerContract.
export interface DeterministicContextPackagingDeclaration {
  declarationId: string;
  declaredAt: string;
  canonicalPackagingContract: string;  // canonical packaging contract reference
  deterministicApis: string[];         // canonical deterministic API surfaces declared
  packageHashAlgorithm: string;        // how package hash is computed
  idDerivation: string;                // how package ID is derived from hash
  declarationHash: string;
}

export interface RagContextEngineConvergenceReport {
  reportId: string;
  generatedAt: string;
  surfaces: RagContextSurfaceEntry[];
  fixedInputCount: number;
  inScopeCount: number;
  ragRetrievalAuthority: RagRetrievalAuthorityDeclaration;
  deterministicContextPackaging: DeterministicContextPackagingDeclaration;
  reportHash: string;
}

export interface RagContextEngineConvergenceContractDependencies {
  now?: () => string;
}

// --- Canonical RAG/Context surface registry ---
// 25 existing CPF RAG and context contract files are FIXED_INPUT.
// 2 new surfaces declared IN_SCOPE by W9-T1.

const RAG_CONTEXT_SURFACES: RagContextSurfaceEntry[] = [
  // RAG Core (4)
  {
    surfaceId: "knowledge-query",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.query.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge query — relevance-filtered item retrieval against candidate pool",
    rationale: "Delivered in W1-T10; frozen baseline; W9-T1 declares retrieval authority over this surface without restructuring it",
  },
  {
    surfaceId: "knowledge-query-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.query.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge query batch — batch aggregation of knowledge query results",
    rationale: "Delivered in W2-T37; frozen baseline; batch variant of knowledge query",
  },
  {
    surfaceId: "knowledge-ranking",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge ranking — composite scoring with relevance, tier, and recency weights",
    rationale: "Delivered in W1-T12; frozen baseline; W9-T1 declares ranking authority ownership over this surface",
  },
  {
    surfaceId: "retrieval",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/retrieval.contract.ts",
    status: "FIXED_INPUT",
    description: "Retrieval contract — ranked knowledge packaging into typed context",
    rationale: "Delivered in W1-T22; frozen baseline; terminal RAG step before context packaging",
  },
  // RAG Consumer Pipelines (8)
  {
    surfaceId: "knowledge-query-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.query.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge query consumer pipeline — single-request consumer bridge",
    rationale: "Delivered and frozen; consumer-side bridge for knowledge query results",
  },
  {
    surfaceId: "knowledge-query-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.query.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge query consumer pipeline batch — batch consumer bridge",
    rationale: "Delivered and frozen; batch variant of knowledge query consumer pipeline",
  },
  {
    surfaceId: "knowledge-query-batch-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.query.batch.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge query batch consumer pipeline — consumer bridge for batch query results",
    rationale: "Delivered and frozen; consumer bridge for knowledge query batch contract",
  },
  {
    surfaceId: "knowledge-query-batch-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.query.batch.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge query batch consumer pipeline batch — batch-of-batch consumer bridge",
    rationale: "Delivered and frozen; batch aggregation of knowledge query batch consumer pipeline",
  },
  {
    surfaceId: "knowledge-ranking-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge ranking consumer pipeline — single-request ranking consumer bridge",
    rationale: "Delivered and frozen; consumer-side bridge for knowledge ranking results",
  },
  {
    surfaceId: "knowledge-ranking-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge ranking consumer pipeline batch — batch ranking consumer bridge",
    rationale: "Delivered and frozen; batch variant of knowledge ranking consumer pipeline",
  },
  {
    surfaceId: "retrieval-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/retrieval.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Retrieval consumer pipeline — single-request retrieval consumer bridge",
    rationale: "Delivered in W2-T38; frozen baseline; terminal RAG consumer bridge",
  },
  {
    surfaceId: "retrieval-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/retrieval.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Retrieval consumer pipeline batch — batch retrieval consumer bridge",
    rationale: "Delivered in W2-T38; frozen baseline; batch variant of retrieval consumer pipeline",
  },
  // Context Core (4)
  {
    surfaceId: "context-packager",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract.ts",
    status: "FIXED_INPUT",
    description: "Context packager — typed segment assembly with per-type caps and token budget enforcement",
    rationale: "Delivered in W2-T32; frozen baseline; W9-T1 declares its deterministic API as canonical without restructuring it",
  },
  {
    surfaceId: "context-build",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.build.contract.ts",
    status: "FIXED_INPUT",
    description: "Context build contract — context assembly from ranked knowledge and structured inputs",
    rationale: "Delivered in W2-T32; frozen baseline; upstream context construction step",
  },
  {
    surfaceId: "context-build-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.build.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Context build batch — batch context build aggregation",
    rationale: "Delivered in W2-T36; frozen baseline; batch variant of context build",
  },
  {
    surfaceId: "context-enrichment",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.enrichment.contract.ts",
    status: "FIXED_INPUT",
    description: "Context enrichment — augments context packages with governance metadata and policy annotations",
    rationale: "Delivered in W2-T34/W2-T35; frozen baseline; enrichment layer on top of packaged context",
  },
  // Context Consumer Pipelines (8)
  {
    surfaceId: "context-packager-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Context packager consumer pipeline — single-request packaging consumer bridge",
    rationale: "Delivered and frozen; consumer-side bridge for context packager results",
  },
  {
    surfaceId: "context-packager-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Context packager consumer pipeline batch — batch packaging consumer bridge",
    rationale: "Delivered and frozen; batch variant of context packager consumer pipeline",
  },
  {
    surfaceId: "context-build-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.build.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Context build consumer pipeline — single-request build consumer bridge",
    rationale: "Delivered and frozen; consumer bridge for context build results",
  },
  {
    surfaceId: "context-build-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.build.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Context build consumer pipeline batch — batch build consumer bridge",
    rationale: "Delivered and frozen; batch variant of context build consumer pipeline",
  },
  {
    surfaceId: "context-build-batch-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.build.batch.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Context build batch consumer pipeline — consumer bridge for batch build results",
    rationale: "Delivered and frozen; consumer bridge for context build batch contract",
  },
  {
    surfaceId: "context-build-batch-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.build.batch.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Context build batch consumer pipeline batch — batch-of-batch build consumer bridge",
    rationale: "Delivered and frozen; batch aggregation of context build batch consumer pipeline",
  },
  {
    surfaceId: "context-enrichment-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.enrichment.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Context enrichment consumer pipeline — single-request enrichment consumer bridge",
    rationale: "Delivered and frozen; consumer-side bridge for context enrichment results",
  },
  {
    surfaceId: "context-enrichment-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.enrichment.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Context enrichment consumer pipeline batch — batch enrichment consumer bridge",
    rationale: "Delivered and frozen; batch variant of context enrichment consumer pipeline",
  },
  // Gateway freeze from W8-T1 (1)
  {
    surfaceId: "model-gateway-boundary",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/model.gateway.boundary.contract.ts",
    status: "FIXED_INPUT",
    description: "Model gateway boundary — Knowledge Layer entrypoint and execution authority declaration (W8-T1)",
    rationale: "Delivered and frozen by W8-T1 CLOSED DELIVERED; W9-T1 consumes gateway stability output as FIXED INPUT per pass condition 5; must not be re-opened",
  },
  // IN_SCOPE surfaces — new W9-T1 declarations
  {
    surfaceId: "rag-retrieval-authority",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/rag.context.engine.convergence.contract.ts",
    status: "IN_SCOPE",
    description: "RAG retrieval authority — canonical ordered retrieval path and knowledge ranking authority ownership declaration (W9-T1 first declaration)",
    rationale: "Previously undeclared; W9-T1 declares the canonical retrieval path (KnowledgeQueryContract → KnowledgeRankingContract → RetrievalContract → ContextPackagerContract) and ownership boundaries; owned by Control Plane",
  },
  {
    surfaceId: "context-packaging-deterministic-api",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/rag.context.engine.convergence.contract.ts",
    status: "IN_SCOPE",
    description: "Deterministic context packaging API — ContextPackagerContract.pack() declared as canonical deterministic surface with hash-derived packageId (W9-T1 first declaration)",
    rationale: "Previously implicit; W9-T1 makes the deterministic packaging contract explicit: pack() → packageHash → packageId derivation is the canonical packaging API; no structural change to the delivered contract",
  },
];

// --- Contract ---

export class RagContextEngineConvergenceContract {
  private readonly now: () => string;

  constructor(dependencies: RagContextEngineConvergenceContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  classifyRagContextSurfaces(): RagContextSurfaceEntry[] {
    return RAG_CONTEXT_SURFACES.map((s) => ({ ...s }));
  }

  declareRagRetrievalAuthority(): RagRetrievalAuthorityDeclaration {
    const declaredAt = this.now();

    const retrievalPath = [
      "1. KnowledgeQueryContract.query() — filters and sorts candidate items by relevance threshold",
      "2. KnowledgeRankingContract.rank() — applies composite scoring (relevance + tier + recency weights)",
      "3. RetrievalContract — packages ranked items into typed context ready for packaging",
      "4. ContextPackagerContract.pack() — assembles deterministic TypedContextPackage with per-type caps",
    ];

    const authorityHash = computeDeterministicHash(
      "w9-t1-cp1-rag-retrieval-authority",
      declaredAt,
      `path-steps:${retrievalPath.length}`,
      "ranking-owner:KnowledgeRankingContract",
      "query-owner:KnowledgeQueryContract",
      "packaging-owner:ContextPackagerContract",
      "gateway-freeze:W8-T1-model-gateway-boundary",
    );

    const authorityId = computeDeterministicHash(
      "w9-t1-cp1-rag-retrieval-authority-id",
      authorityHash,
      declaredAt,
    );

    return {
      authorityId,
      declaredAt,
      retrievalPath,
      rankingAuthority:
        "KnowledgeRankingContract (CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.contract.ts) — " +
        "owns composite scoring across relevance, tier, and recency dimensions; " +
        "ranking weights are caller-injectable for testability; " +
        "authority declared canonical by W9-T1",
      queryAuthority:
        "KnowledgeQueryContract (CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.query.contract.ts) — " +
        "owns relevance-threshold filtering and deterministic result ordering; " +
        "authority declared canonical by W9-T1",
      packagingAuthority:
        "ContextPackagerContract (CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract.ts) — " +
        "owns deterministic TypedContextPackage assembly with per-type token caps; " +
        "terminal packaging step in the canonical RAG retrieval path; " +
        "authority declared canonical by W9-T1",
      gatewayAlignment:
        "W8-T1 frozen gateway boundary consumed as FIXED INPUT: " +
        "model-gateway execution authority scope declares ContextPackagerContract output (TypedContextPackage) " +
        "as the canonical Knowledge Layer output handed off to AI Gateway via ControlPlaneConsumerPipelineContract; " +
        "W9-T1 retrieval authority aligns to this frozen handoff — no re-opening of W8-T1 gateway surfaces",
      authorityHash,
    };
  }

  declareDeterministicContextPackagingApi(): DeterministicContextPackagingDeclaration {
    const declaredAt = this.now();

    const deterministicApis = [
      "ContextPackagerContract.pack(request: ContextPackagerRequest): TypedContextPackage",
      "TypedContextPackage.packageHash — deterministic hash of builtAt, contextId, segments count, estimatedTokens, query",
      "TypedContextPackage.packageId — deterministic hash derived from packageHash + builtAt",
      "TypedContextPackage.segments — deterministically ordered by typePriorityOrder; stable for same inputs",
      "TypedContextPackage.perTypeTokens — deterministic per-type token breakdown for all 6 segment types",
    ];

    const declarationHash = computeDeterministicHash(
      "w9-t1-cp1-context-packaging-deterministic-api",
      declaredAt,
      `api-count:${deterministicApis.length}`,
      "canonical:ContextPackagerContract.pack",
      "hash-seed:w1-t12-cp2-context-packager",
      "id-seed:w1-t12-cp2-package-id",
    );

    const declarationId = computeDeterministicHash(
      "w9-t1-cp1-context-packaging-declaration-id",
      declarationHash,
      declaredAt,
    );

    return {
      declarationId,
      declaredAt,
      canonicalPackagingContract:
        "ContextPackagerContract (CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract.ts) — " +
        "TypedContextPackage is the canonical deterministic context packaging output type; " +
        "declared canonical by W9-T1",
      deterministicApis,
      packageHashAlgorithm:
        "computeDeterministicHash(" +
        "'w1-t12-cp2-context-packager', " +
        "`${builtAt}:${contextId}`, " +
        "`segments:${count}:tokens:${estimatedTokens}`, " +
        "`query:${query}`" +
        ") — seed 'w1-t12-cp2-context-packager' is the frozen canonical seed for context packaging",
      idDerivation:
        "computeDeterministicHash(" +
        "'w1-t12-cp2-package-id', " +
        "packageHash, " +
        "builtAt" +
        ") — packageId is always derived from packageHash + builtAt; " +
        "packageId != packageHash by construction",
      declarationHash,
    };
  }

  generateConvergenceReport(): RagContextEngineConvergenceReport {
    const generatedAt = this.now();
    const surfaces = this.classifyRagContextSurfaces();
    const ragRetrievalAuthority = this.declareRagRetrievalAuthority();
    const deterministicContextPackaging = this.declareDeterministicContextPackagingApi();

    const fixedInputCount = surfaces.filter((s) => s.status === "FIXED_INPUT").length;
    const inScopeCount = surfaces.filter((s) => s.status === "IN_SCOPE").length;

    const reportHash = computeDeterministicHash(
      "w9-t1-cp1-convergence-report",
      generatedAt,
      `surfaces:${surfaces.length}`,
      `fixed:${fixedInputCount}`,
      `in-scope:${inScopeCount}`,
      ragRetrievalAuthority.authorityHash,
      deterministicContextPackaging.declarationHash,
    );

    const reportId = computeDeterministicHash(
      "w9-t1-cp1-convergence-report-id",
      reportHash,
      generatedAt,
    );

    return {
      reportId,
      generatedAt,
      surfaces,
      fixedInputCount,
      inScopeCount,
      ragRetrievalAuthority,
      deterministicContextPackaging,
      reportHash,
    };
  }
}

export function createRagContextEngineConvergenceContract(
  dependencies?: RagContextEngineConvergenceContractDependencies,
): RagContextEngineConvergenceContract {
  return new RagContextEngineConvergenceContract(dependencies);
}
