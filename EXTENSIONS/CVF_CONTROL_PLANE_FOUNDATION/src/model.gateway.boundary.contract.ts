import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

// Classification of each gateway contract surface relative to W8-T1 scope.
// FIXED_INPUT: surface is delivered and frozen by W7; W8-T1 reads but does not restructure it.
// IN_SCOPE: surface is new or explicitly owned by W8-T1; declared here for the first time.
export type GatewaySurfaceStatus = "FIXED_INPUT" | "IN_SCOPE";

// Ownership plane for execution authority declarations.
export type ExecutionPlane = "CONTROL_PLANE" | "EXECUTION_PLANE" | "SHARED";

export interface ModelGatewayBoundaryEntry {
  surfaceId: string;
  sourceFile: string;
  status: GatewaySurfaceStatus;
  description: string;
  rationale: string;
}

// Declares the canonical boundary where the Knowledge Layer hands off to the AI Gateway.
// Knowledge Layer produces ContextPackage (CPF context.packager.contract.ts).
// AI Gateway consumes GatewaySignalRequest (CPF ai.gateway.contract.ts).
// This entrypoint is the first declaration of that boundary in the architecture.
export interface KnowledgeLayerEntrypointDeclaration {
  entrypointId: string;
  declaredAt: string;
  knowledgeLayerOutputContract: string;   // canonical output type produced by Knowledge Layer
  aiGatewayInputContract: string;          // canonical input type consumed by AI Gateway
  ownerPlane: ExecutionPlane;
  conversionNote: string;                  // describes how Knowledge Layer output maps to Gateway input
  entrypointHash: string;
}

// Declares which plane owns which aspect of model-gateway authority.
// Resolves the ambiguity between Control Plane design-time gating and
// Execution Plane build-time invocation.
export interface ModelGatewayExecutionAuthority {
  authorityId: string;
  declaredAt: string;
  controlPlaneOwns: string[];   // surfaces owned by CPF (design-time)
  executionPlaneOwns: string[]; // surfaces owned by EPF (build-time)
  canonicalHandoff: string;     // the locked CPF→EPF handoff contract reference
  authorityHash: string;
}

export interface ModelGatewayBoundaryReport {
  reportId: string;
  generatedAt: string;
  surfaces: ModelGatewayBoundaryEntry[];
  fixedInputCount: number;
  inScopeCount: number;
  knowledgeLayerEntrypoint: KnowledgeLayerEntrypointDeclaration;
  executionAuthority: ModelGatewayExecutionAuthority;
  reportHash: string;
}

export interface ModelGatewayBoundaryContractDependencies {
  now?: () => string;
}

// --- Canonical gateway surface registry ---
// All 18 existing CPF gateway contract files are FIXED_INPUT.
// Two new surfaces declared IN_SCOPE by W8-T1.

const GATEWAY_SURFACES: Omit<ModelGatewayBoundaryEntry, never>[] = [
  {
    surfaceId: "ai-gateway",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/ai.gateway.contract.ts",
    status: "FIXED_INPUT",
    description: "AI Gateway signal normalization — privacy-aware PII/secret masking, env metadata",
    rationale: "Delivered in W1-T4; frozen baseline; W8-T1 reads but does not restructure",
  },
  {
    surfaceId: "ai-gateway-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/ai.gateway.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "AI Gateway consumer pipeline — single-request consumer path",
    rationale: "Delivered and frozen; consumer-side only; no model-facing boundary change",
  },
  {
    surfaceId: "ai-gateway-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/ai.gateway.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "AI Gateway consumer pipeline batch — batch consumer path",
    rationale: "Delivered and frozen; batch variant of consumer pipeline",
  },
  {
    surfaceId: "gateway-auth",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.contract.ts",
    status: "FIXED_INPUT",
    description: "Gateway auth gating — token validation, expiry, revocation",
    rationale: "Delivered and frozen; auth contract is not a model-facing boundary",
  },
  {
    surfaceId: "gateway-auth-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Gateway auth consumer pipeline",
    rationale: "Delivered and frozen; consumer-side auth pipeline",
  },
  {
    surfaceId: "gateway-auth-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Gateway auth consumer pipeline batch",
    rationale: "Delivered and frozen",
  },
  {
    surfaceId: "gateway-auth-log",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.log.contract.ts",
    status: "FIXED_INPUT",
    description: "Gateway auth log — auth event audit trail",
    rationale: "Delivered and frozen; log contract, not a model-facing boundary",
  },
  {
    surfaceId: "gateway-auth-log-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.log.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Gateway auth log consumer pipeline",
    rationale: "Delivered and frozen",
  },
  {
    surfaceId: "gateway-auth-log-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.auth.log.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Gateway auth log consumer pipeline batch",
    rationale: "Delivered and frozen",
  },
  {
    surfaceId: "gateway-consumer",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.consumer.contract.ts",
    status: "FIXED_INPUT",
    description: "Generic gateway consumer contract",
    rationale: "Delivered and frozen; generic consumer wrapper",
  },
  {
    surfaceId: "gateway-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Generic gateway consumer pipeline",
    rationale: "Delivered and frozen",
  },
  {
    surfaceId: "gateway-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Generic gateway consumer pipeline batch",
    rationale: "Delivered and frozen",
  },
  {
    surfaceId: "gateway-pii-detection",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.pii.detection.contract.ts",
    status: "FIXED_INPUT",
    description: "Gateway PII detection — pattern-based PII identification",
    rationale: "Delivered and frozen; PII detection is not a model-facing boundary",
  },
  {
    surfaceId: "gateway-pii-detection-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.pii.detection.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Gateway PII detection consumer pipeline",
    rationale: "Delivered and frozen",
  },
  {
    surfaceId: "gateway-pii-detection-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.pii.detection.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Gateway PII detection consumer pipeline batch",
    rationale: "Delivered and frozen",
  },
  {
    surfaceId: "gateway-pii-detection-log",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.pii.detection.log.contract.ts",
    status: "FIXED_INPUT",
    description: "Gateway PII detection log — PII event audit trail",
    rationale: "Delivered and frozen",
  },
  {
    surfaceId: "gateway-pii-detection-log-consumer-pipeline",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.pii.detection.log.consumer.pipeline.contract.ts",
    status: "FIXED_INPUT",
    description: "Gateway PII detection log consumer pipeline",
    rationale: "Delivered and frozen",
  },
  {
    surfaceId: "gateway-pii-detection-log-consumer-pipeline-batch",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/gateway.pii.detection.log.consumer.pipeline.batch.contract.ts",
    status: "FIXED_INPUT",
    description: "Gateway PII detection log consumer pipeline batch",
    rationale: "Delivered and frozen",
  },
  // IN_SCOPE surfaces — new declarations owned by W8-T1
  {
    surfaceId: "knowledge-layer-entrypoint",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/model.gateway.boundary.contract.ts",
    status: "IN_SCOPE",
    description: "Knowledge Layer → AI Gateway canonical handoff boundary (first declaration)",
    rationale: "Previously undefined; W8-T1 declares this boundary for the first time; owned by Control Plane",
  },
  {
    surfaceId: "model-gateway-execution-authority",
    sourceFile: "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/model.gateway.boundary.contract.ts",
    status: "IN_SCOPE",
    description: "Model-gateway execution authority split — Control Plane vs Execution Plane ownership declaration",
    rationale: "Previously ambiguous; W8-T1 freezes the design-time vs build-time authority boundary",
  },
];

// --- Contract ---

export class ModelGatewayBoundaryContract {
  private readonly now: () => string;

  constructor(dependencies: ModelGatewayBoundaryContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  classifyGatewaySurfaces(): ModelGatewayBoundaryEntry[] {
    return GATEWAY_SURFACES.map((s) => ({ ...s }));
  }

  declareKnowledgeLayerEntrypoint(): KnowledgeLayerEntrypointDeclaration {
    const declaredAt = this.now();

    const entrypointHash = computeDeterministicHash(
      "w8-t1-cp2-kl-entrypoint",
      declaredAt,
      "output:ContextPackage",
      "input:GatewaySignalRequest",
      "owner:CONTROL_PLANE",
    );

    const entrypointId = computeDeterministicHash(
      "w8-t1-cp2-kl-entrypoint-id",
      entrypointHash,
      declaredAt,
    );

    return {
      entrypointId,
      declaredAt,
      knowledgeLayerOutputContract: "ContextPackage (CVF_CONTROL_PLANE_FOUNDATION/src/context.packager.contract.ts)",
      aiGatewayInputContract: "GatewaySignalRequest (CVF_CONTROL_PLANE_FOUNDATION/src/ai.gateway.contract.ts)",
      ownerPlane: "CONTROL_PLANE",
      conversionNote:
        "The Knowledge Layer produces a ContextPackage containing typed context segments. " +
        "The consumer bridge converts the package content into a GatewaySignalRequest for AI Gateway normalization. " +
        "This conversion is owned by the Control Plane consumer pipeline (ControlPlaneConsumerPipelineContract).",
      entrypointHash,
    };
  }

  declareExecutionAuthority(): ModelGatewayExecutionAuthority {
    const declaredAt = this.now();

    const controlPlaneOwns = [
      "intent validation and risk classification (design-time, INTAKE/DESIGN phases)",
      "phase gate enforcement — no model invocation in non-BUILD phases without explicit override",
      "context packaging and knowledge-layer query gating",
      "ControlPlaneConsumerPipelineContract → produces ControlPlaneConsumerPackage",
      "AI Gateway signal normalization (privacy, PII, env metadata) — pre-invocation only",
    ];

    const executionPlaneOwns = [
      "actual model invocation — ExecutionPipelineContract (build-time, BUILD phase)",
      "runtime execution receipt — ExecutionPipelineReceipt",
      "artifact staging and trace management post-invocation",
      "spec policy enforcement — StructuredSpec through policy.gate.contract.ts",
    ];

    const authorityHash = computeDeterministicHash(
      "w8-t1-cp2-exec-authority",
      declaredAt,
      `cpf-owns:${controlPlaneOwns.length}`,
      `epf-owns:${executionPlaneOwns.length}`,
      "handoff:ControlPlaneConsumerPackage->ExecutionPipelineContract",
    );

    const authorityId = computeDeterministicHash(
      "w8-t1-cp2-exec-authority-id",
      authorityHash,
      declaredAt,
    );

    return {
      authorityId,
      declaredAt,
      controlPlaneOwns,
      executionPlaneOwns,
      canonicalHandoff:
        "CPF ControlPlaneConsumerPipelineContract → ControlPlaneConsumerPackage " +
        "→ EPF ExecutionPipelineContract (locked by W7-T3 CP2 architecture boundary lock)",
      authorityHash,
    };
  }

  generateBoundaryReport(): ModelGatewayBoundaryReport {
    const generatedAt = this.now();
    const surfaces = this.classifyGatewaySurfaces();
    const knowledgeLayerEntrypoint = this.declareKnowledgeLayerEntrypoint();
    const executionAuthority = this.declareExecutionAuthority();

    const fixedInputCount = surfaces.filter((s) => s.status === "FIXED_INPUT").length;
    const inScopeCount = surfaces.filter((s) => s.status === "IN_SCOPE").length;

    const reportHash = computeDeterministicHash(
      "w8-t1-cp2-boundary-report",
      generatedAt,
      `surfaces:${surfaces.length}`,
      `fixed:${fixedInputCount}`,
      `in-scope:${inScopeCount}`,
      knowledgeLayerEntrypoint.entrypointHash,
      executionAuthority.authorityHash,
    );

    const reportId = computeDeterministicHash(
      "w8-t1-cp2-boundary-report-id",
      reportHash,
      generatedAt,
    );

    return {
      reportId,
      generatedAt,
      surfaces,
      fixedInputCount,
      inScopeCount,
      knowledgeLayerEntrypoint,
      executionAuthority,
      reportHash,
    };
  }
}

export function createModelGatewayBoundaryContract(
  dependencies?: ModelGatewayBoundaryContractDependencies,
): ModelGatewayBoundaryContract {
  return new ModelGatewayBoundaryContract(dependencies);
}
