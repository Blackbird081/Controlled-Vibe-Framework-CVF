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

// Declares the knowledge-native retrieval authority as canon (W77-T1).
// Registers StructuralIndexContract, KnowledgeContextAssemblyContract, and
// KnowledgeContextAssemblyConsumerPipelineContract into the canon retrieval authority surface.
// This is the TOP-LEVEL canon retrieval authority after W77. The legacy W9-T1 raw-text
// baseline path (declareRagRetrievalAuthority) remains available as a subpath record.
// Default policy: HYBRID / NO SINGLE DEFAULT — closed by N2 (W78-T1) + N3 (W79-T1).
export interface KnowledgeNativeRetrievalAuthorityDeclaration {
  declarationId: string;
  declaredAt: string;
  knowledgeNativePath: string[];          // ordered steps for the knowledge-native retrieval path
  structuralIndexAuthority: string;       // StructuralIndexContract as peer retrieval mode inside Query
  assemblyAuthority: string;              // KnowledgeContextAssemblyContract: ranked retrieval → final packaging
  consumerBridgeAuthority: string;        // KnowledgeContextAssemblyConsumerPipelineContract: preferred consumer bridge
  packagingAuthority: string;             // ContextPackagerContract remains packaging authority; no new layer
  noNewLayerStatement: string;            // explicit no-new-layer declaration
  defaultPolicyStatus: string;            // policy decision after N2+N3 closure
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
  knowledgeNativeRetrievalAuthority: KnowledgeNativeRetrievalAuthorityDeclaration;
  reportHash: string;
}

export interface RagContextEngineConvergenceContractDependencies {
  now?: () => string;
}

// --- Canonical RAG/Context surface registry ---
// 25 original CPF RAG and context contract files are FIXED_INPUT (W9-T1 baseline).
// 15 W72-W76 knowledge-native surfaces added as FIXED_INPUT in W77-T1 (total 40 FIXED_INPUT).
// 2 surfaces declared IN_SCOPE by W9-T1 + 1 declared IN_SCOPE by W77-T1 (total 3 IN_SCOPE).
// Grand total: 43 surfaces.

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
  // Knowledge Native Layer — W72-T1 through W76-T1 delivered surfaces (FIXED_INPUT)
  {
    surfaceId: "knowledge-ranking-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.ranking.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge ranking batch — batch aggregation of knowledge ranking results",
    rationale: "Delivered and frozen; batch variant of knowledge ranking contract; retroactively registered in W77-T1",
  },
  {
    surfaceId: "knowledge-structural-index",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.structural.index.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge structural index — graph-informed structural neighbor index for knowledge items (W72-T1)",
    rationale: "Delivered in W72-T1; frozen; StructuralIndexContract is a peer retrieval mode inside the Query step; registered as canon in W77-T1",
  },
  {
    surfaceId: "knowledge-structural-index-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.structural.index.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge structural index batch — batch aggregation of structural index results (W72-T1)",
    rationale: "Delivered in W72-T1; frozen; batch variant of knowledge structural index contract",
  },
  {
    surfaceId: "knowledge-compiled-artifact",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.compiled.artifact.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge compiled artifact — governed compilation of knowledge content into canonically hashed artifacts (W72-T4)",
    rationale: "Delivered in W72-T4; frozen; implements Step 2 (Compile) + Step 3 (Govern) of the 6-step knowledge lifecycle",
  },
  {
    surfaceId: "knowledge-compiled-artifact-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.compiled.artifact.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge compiled artifact batch — batch aggregation of compiled artifact results (W72-T4)",
    rationale: "Delivered in W72-T4; frozen; batch variant of knowledge compiled artifact contract",
  },
  {
    surfaceId: "w7-memory-record",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/w7.memory.record.contract.ts",
    status: "FIXED_INPUT",
    description: "W7 memory record — palace-hierarchy placement step of the W7 pipeline (W73-T1)",
    rationale: "Delivered in W73-T1; frozen; W7MemoryRecordContract places an asset into the palace hierarchy with optional vocabulary fields",
  },
  {
    surfaceId: "w7-memory-record-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/w7.memory.record.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "W7 memory record batch — batch aggregation of W7 memory record placements (W73-T1)",
    rationale: "Delivered in W73-T1; frozen; batch variant of W7 memory record contract",
  },
  {
    surfaceId: "knowledge-maintenance",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.maintenance.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge maintenance — Step 5 (Maintain) of the 6-step lifecycle: lint, contradiction, drift, orphan, staleness checks (W73-T2)",
    rationale: "Delivered in W73-T2; frozen; KnowledgeMaintenanceContract evaluates approved artifacts for 5 signal types",
  },
  {
    surfaceId: "knowledge-maintenance-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.maintenance.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge maintenance batch — batch aggregation of maintenance evaluation results (W73-T2)",
    rationale: "Delivered in W73-T2; frozen; batch variant of knowledge maintenance contract",
  },
  {
    surfaceId: "knowledge-refactor",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.refactor.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge refactor — Step 6 (Refactor) of the 6-step lifecycle: archive / recompile / review proposals (W74-T1)",
    rationale: "Delivered in W74-T1; frozen; KnowledgeRefactorContract closes the full lifecycle at CPF contract layer",
  },
  {
    surfaceId: "knowledge-refactor-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.refactor.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge refactor batch — batch aggregation of refactor proposal results (W74-T1)",
    rationale: "Delivered in W74-T1; frozen; batch variant of knowledge refactor contract",
  },
  {
    surfaceId: "knowledge-context-assembly",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.context.assembly.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge context assembly — consumer-facing output surface assembling ranked items + structural enrichment into KnowledgeContextPacket (W75-T1)",
    rationale: "Delivered in W75-T1; frozen; KnowledgeContextAssemblyContract is the knowledge-native assembly surface between ranked retrieval and final packaging; registered as canon in W77-T1",
  },
  {
    surfaceId: "knowledge-context-assembly-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.context.assembly.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge context assembly batch — batch aggregation of context assembly results (W75-T1)",
    rationale: "Delivered in W75-T1; frozen; batch variant of knowledge context assembly contract",
  },
  {
    surfaceId: "knowledge-context-assembly-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.context.assembly.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge context assembly consumer pipeline — CPF consumer bridge chaining Ranking → ContextAssembly → ConsumerPackage (W76-T1)",
    rationale: "Delivered in W76-T1; frozen; KnowledgeContextAssemblyConsumerPipelineContract is the preferred CPF knowledge-native consumer bridge; registered as canon in W77-T1",
  },
  {
    surfaceId: "knowledge-context-assembly-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.context.assembly.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Knowledge context assembly consumer pipeline batch — batch aggregation of consumer pipeline results (W76-T1)",
    rationale: "Delivered in W76-T1; frozen; batch variant of knowledge context assembly consumer pipeline contract",
  },
  // IN_SCOPE surfaces — W9-T1 declarations
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
  // IN_SCOPE surfaces — W77-T1 knowledge-native authority declaration
  {
    surfaceId: "knowledge-native-retrieval-authority",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/rag.context.engine.convergence.contract.ts",
    status: "IN_SCOPE",
    description: "Knowledge-native retrieval authority — declares StructuralIndexContract, KnowledgeContextAssemblyContract, and KnowledgeContextAssemblyConsumerPipelineContract as canon knowledge-native retrieval surfaces (W77-T1 first declaration)",
    rationale: "W72-W76 delivered the knowledge-native CPF layer; W77-T1 declares these surfaces as canon retrieval authority, closes the N1 gate of the CVF-native completion matrix; no new layer is created",
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

  declareKnowledgeNativeRetrievalAuthority(): KnowledgeNativeRetrievalAuthorityDeclaration {
    const declaredAt = this.now();

    const knowledgeNativePath = [
      "1. KnowledgeQueryContract.query() + StructuralIndexContract.build() — retrieval phase; structural index is a peer retrieval mode inside Query, not a replacement",
      "2. KnowledgeRankingContract.rank() — composite scoring (relevance + tier + recency); ranks both standard and structurally-enriched items",
      "3. KnowledgeContextAssemblyContract.assemble() — knowledge-native assembly surface; takes RankedKnowledgeItem[] + optional structural enrichment → KnowledgeContextPacket",
      "4. KnowledgeContextAssemblyConsumerPipelineContract.execute() — preferred CPF knowledge-native consumer bridge; chains Ranking → ContextAssembly → ConsumerPackage in one call",
      "5. ContextPackagerContract.pack() — terminal packaging authority; no new packaging layer is created",
    ];

    const declarationHash = computeDeterministicHash(
      "w77-t1-cp1-knowledge-native-retrieval-authority",
      declaredAt,
      `path-steps:${knowledgeNativePath.length}`,
      "structural-index-authority:StructuralIndexContract",
      "assembly-authority:KnowledgeContextAssemblyContract",
      "consumer-bridge-authority:KnowledgeContextAssemblyConsumerPipelineContract",
      "packaging-authority:ContextPackagerContract",
      "default-policy:HYBRID/NO_SINGLE_DEFAULT",
    );

    const declarationId = computeDeterministicHash(
      "w77-t1-cp1-knowledge-native-retrieval-authority-id",
      declarationHash,
      declaredAt,
    );

    return {
      declarationId,
      declaredAt,
      knowledgeNativePath,
      structuralIndexAuthority:
        "StructuralIndexContract (CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.structural.index.contract.ts) — " +
        "a peer retrieval mode inside the Query step; provides graph-informed structural neighbor enrichment; " +
        "does not replace KnowledgeQueryContract; operates alongside it as an optional enrichment source; " +
        "authority declared canon by W77-T1",
      assemblyAuthority:
        "KnowledgeContextAssemblyContract (CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.context.assembly.contract.ts) — " +
        "the knowledge-native assembly surface between ranked retrieval and final packaging; " +
        "takes RankedKnowledgeItem[] plus optional structural enrichment and produces KnowledgeContextPacket; " +
        "authority declared canon by W77-T1",
      consumerBridgeAuthority:
        "KnowledgeContextAssemblyConsumerPipelineContract (CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.context.assembly.consumer.pipeline.contract.ts) — " +
        "the preferred CPF knowledge-native consumer bridge; chains Ranking → ContextAssembly → ConsumerPackage in one execute() call; " +
        "structural enrichment flows into packaged context; authority declared canon by W77-T1",
      packagingAuthority:
        "ContextPackagerContract (CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract.ts) — " +
        "remains the terminal packaging authority; no new packaging layer is created by the knowledge-native path; " +
        "authority unchanged from W9-T1 declaration",
      noNewLayerStatement:
        "No new architectural layer is created by the knowledge-native path. " +
        "StructuralIndexContract is an enrichment peer inside the existing Query step. " +
        "KnowledgeContextAssemblyContract is a new assembly step between ranking and packaging, not a new plane boundary. " +
        "Graph Memory Layer, Persistent Wiki, MemPalace Runtime, and G-GM-* guard families remain rejected.",
      defaultPolicyStatus:
        "HYBRID / NO SINGLE DEFAULT — N2 Benchmark Evidence Closure CLOSED (W78-T1); " +
        "N3 Canon Default Promotion CLOSED (W79-T1); compiled-preferred conditional (Rule 1) " +
        "and raw-source fallback (Rule 2) remain unchanged; no unconditional default is set; " +
        "structural index peer mode confirmed (N1 W77-T1)",
      declarationHash,
    };
  }

  // Legacy W9-T1 raw-text baseline retrieval path. This method is preserved as the canonical
  // record of the pre-knowledge-native authority (W9-T1). After W77-T1, the TOP-LEVEL canon
  // retrieval authority is declareKnowledgeNativeRetrievalAuthority(). This path describes the
  // raw-text subpath (KnowledgeQuery → KnowledgeRanking → RetrievalContract → ContextPackager)
  // and remains valid as the fallback/baseline path inside the knowledge-native authority.
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
    const knowledgeNativeRetrievalAuthority = this.declareKnowledgeNativeRetrievalAuthority();

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
      knowledgeNativeRetrievalAuthority.declarationHash,
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
      knowledgeNativeRetrievalAuthority,
      reportHash,
    };
  }
}

export function createRagContextEngineConvergenceContract(
  dependencies?: RagContextEngineConvergenceContractDependencies,
): RagContextEngineConvergenceContract {
  return new RagContextEngineConvergenceContract(dependencies);
}
