/**
 * CPF Model Gateway Boundary Contract — Dedicated Tests (W8-T1 CP2)
 * ==================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 * GC-024: partition entry added to CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json.
 *
 * Coverage:
 *   ModelGatewayBoundaryContract.classifyGatewaySurfaces:
 *     - returns 20 total surfaces (18 FIXED_INPUT + 2 IN_SCOPE)
 *     - all 18 existing gateway files classified as FIXED_INPUT
 *     - knowledge-layer-entrypoint classified as IN_SCOPE
 *     - model-gateway-execution-authority classified as IN_SCOPE
 *     - every surface has non-empty surfaceId, sourceFile, description, rationale
 *
 *   ModelGatewayBoundaryContract.declareKnowledgeLayerEntrypoint:
 *     - ownerPlane = CONTROL_PLANE
 *     - knowledgeLayerOutputContract references ContextPackage
 *     - aiGatewayInputContract references GatewaySignalRequest
 *     - declaredAt set to injected now()
 *     - entrypointHash deterministic for same timestamp
 *     - entrypointId is truthy
 *     - conversionNote is non-empty
 *
 *   ModelGatewayBoundaryContract.declareExecutionAuthority:
 *     - controlPlaneOwns is non-empty array
 *     - executionPlaneOwns is non-empty array
 *     - controlPlaneOwns mentions design-time
 *     - executionPlaneOwns mentions model invocation
 *     - canonicalHandoff references ControlPlaneConsumerPackage and ExecutionPipelineContract
 *     - declaredAt set to injected now()
 *     - authorityHash deterministic for same timestamp
 *     - authorityId is truthy
 *
 *   ModelGatewayBoundaryContract.generateBoundaryReport:
 *     - fixedInputCount = 18
 *     - inScopeCount = 2
 *     - surfaces.length = 20
 *     - knowledgeLayerEntrypoint present
 *     - executionAuthority present
 *     - generatedAt set to injected now()
 *     - reportHash deterministic for same timestamp
 *     - reportId is truthy
 *
 *   Factory:
 *     - createModelGatewayBoundaryContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  ModelGatewayBoundaryContract,
  createModelGatewayBoundaryContract,
} from "../src/model.gateway.boundary.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-29T09:00:00.000Z";
const fixedNow = () => FIXED_NOW;

const contract = new ModelGatewayBoundaryContract({ now: fixedNow });

const EXPECTED_FIXED_SURFACE_IDS = [
  "ai-gateway",
  "ai-gateway-consumer-pipeline",
  "ai-gateway-consumer-pipeline-batch",
  "gateway-auth",
  "gateway-auth-consumer-pipeline",
  "gateway-auth-consumer-pipeline-batch",
  "gateway-auth-log",
  "gateway-auth-log-consumer-pipeline",
  "gateway-auth-log-consumer-pipeline-batch",
  "gateway-consumer",
  "gateway-consumer-pipeline",
  "gateway-consumer-pipeline-batch",
  "gateway-pii-detection",
  "gateway-pii-detection-consumer-pipeline",
  "gateway-pii-detection-consumer-pipeline-batch",
  "gateway-pii-detection-log",
  "gateway-pii-detection-log-consumer-pipeline",
  "gateway-pii-detection-log-consumer-pipeline-batch",
];

// ─── classifyGatewaySurfaces ──────────────────────────────────────────────────

describe("ModelGatewayBoundaryContract.classifyGatewaySurfaces", () => {
  const surfaces = contract.classifyGatewaySurfaces();

  it("returns 20 total surfaces", () => {
    expect(surfaces).toHaveLength(20);
  });

  it("18 surfaces are classified FIXED_INPUT", () => {
    const fixed = surfaces.filter((s) => s.status === "FIXED_INPUT");
    expect(fixed).toHaveLength(18);
  });

  it("2 surfaces are classified IN_SCOPE", () => {
    const inScope = surfaces.filter((s) => s.status === "IN_SCOPE");
    expect(inScope).toHaveLength(2);
  });

  it("knowledge-layer-entrypoint is IN_SCOPE", () => {
    const entry = surfaces.find((s) => s.surfaceId === "knowledge-layer-entrypoint");
    expect(entry?.status).toBe("IN_SCOPE");
  });

  it("model-gateway-execution-authority is IN_SCOPE", () => {
    const entry = surfaces.find((s) => s.surfaceId === "model-gateway-execution-authority");
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

// ─── declareKnowledgeLayerEntrypoint ─────────────────────────────────────────

describe("ModelGatewayBoundaryContract.declareKnowledgeLayerEntrypoint", () => {
  const ep = contract.declareKnowledgeLayerEntrypoint();

  it("ownerPlane = CONTROL_PLANE", () => {
    expect(ep.ownerPlane).toBe("CONTROL_PLANE");
  });

  it("knowledgeLayerOutputContract references ContextPackage", () => {
    expect(ep.knowledgeLayerOutputContract).toContain("ContextPackage");
  });

  it("aiGatewayInputContract references GatewaySignalRequest", () => {
    expect(ep.aiGatewayInputContract).toContain("GatewaySignalRequest");
  });

  it("declaredAt set to injected now()", () => {
    expect(ep.declaredAt).toBe(FIXED_NOW);
  });

  it("entrypointHash deterministic for same timestamp", () => {
    const ep2 = contract.declareKnowledgeLayerEntrypoint();
    expect(ep.entrypointHash).toBe(ep2.entrypointHash);
  });

  it("entrypointId is truthy", () => {
    expect(ep.entrypointId.length).toBeGreaterThan(0);
  });

  it("conversionNote is non-empty", () => {
    expect(ep.conversionNote.length).toBeGreaterThan(0);
  });
});

// ─── declareExecutionAuthority ────────────────────────────────────────────────

describe("ModelGatewayBoundaryContract.declareExecutionAuthority", () => {
  const auth = contract.declareExecutionAuthority();

  it("controlPlaneOwns is a non-empty array", () => {
    expect(auth.controlPlaneOwns.length).toBeGreaterThan(0);
  });

  it("executionPlaneOwns is a non-empty array", () => {
    expect(auth.executionPlaneOwns.length).toBeGreaterThan(0);
  });

  it("controlPlaneOwns mentions design-time", () => {
    expect(auth.controlPlaneOwns.some((s) => s.includes("design-time"))).toBe(true);
  });

  it("executionPlaneOwns mentions model invocation", () => {
    expect(auth.executionPlaneOwns.some((s) => s.includes("model invocation"))).toBe(true);
  });

  it("canonicalHandoff references ControlPlaneConsumerPackage", () => {
    expect(auth.canonicalHandoff).toContain("ControlPlaneConsumerPackage");
  });

  it("canonicalHandoff references ExecutionPipelineContract", () => {
    expect(auth.canonicalHandoff).toContain("ExecutionPipelineContract");
  });

  it("declaredAt set to injected now()", () => {
    expect(auth.declaredAt).toBe(FIXED_NOW);
  });

  it("authorityHash deterministic for same timestamp", () => {
    const auth2 = contract.declareExecutionAuthority();
    expect(auth.authorityHash).toBe(auth2.authorityHash);
  });

  it("authorityId is truthy", () => {
    expect(auth.authorityId.length).toBeGreaterThan(0);
  });
});

// ─── generateBoundaryReport ───────────────────────────────────────────────────

describe("ModelGatewayBoundaryContract.generateBoundaryReport", () => {
  const report = contract.generateBoundaryReport();

  it("fixedInputCount = 18", () => {
    expect(report.fixedInputCount).toBe(18);
  });

  it("inScopeCount = 2", () => {
    expect(report.inScopeCount).toBe(2);
  });

  it("surfaces.length = 20", () => {
    expect(report.surfaces).toHaveLength(20);
  });

  it("knowledgeLayerEntrypoint is present", () => {
    expect(report.knowledgeLayerEntrypoint).toBeDefined();
    expect(report.knowledgeLayerEntrypoint.ownerPlane).toBe("CONTROL_PLANE");
  });

  it("executionAuthority is present", () => {
    expect(report.executionAuthority).toBeDefined();
    expect(report.executionAuthority.controlPlaneOwns.length).toBeGreaterThan(0);
  });

  it("generatedAt set to injected now()", () => {
    expect(report.generatedAt).toBe(FIXED_NOW);
  });

  it("reportHash deterministic for same timestamp", () => {
    const report2 = contract.generateBoundaryReport();
    expect(report.reportHash).toBe(report2.reportHash);
  });

  it("reportId is truthy", () => {
    expect(report.reportId.length).toBeGreaterThan(0);
  });
});

// ─── Factory ─────────────────────────────────────────────────────────────────

describe("createModelGatewayBoundaryContract", () => {
  it("returns a working instance", () => {
    const c = createModelGatewayBoundaryContract({ now: fixedNow });
    const report = c.generateBoundaryReport();
    expect(report.generatedAt).toBe(FIXED_NOW);
    expect(report.fixedInputCount).toBe(18);
    expect(report.inScopeCount).toBe(2);
  });
});
