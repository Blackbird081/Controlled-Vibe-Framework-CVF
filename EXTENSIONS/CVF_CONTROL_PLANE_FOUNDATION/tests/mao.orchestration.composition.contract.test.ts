// CVF MAO-OA-T1 - Pure Orchestration Composition Contract Tests
//
// Proves: package-root discoverability of the composition contract and
// resolver; deterministic frozen composition on an accepted graph; graph
// compile-failure short-circuit (role resolution stays null); preserved
// REJECTED and OPERATOR_APPROVAL_REQUIRED resolver outcomes; and source-level
// absence of forbidden owner tokens (event/evidence ledger, delegation
// adapter, lifecycle controller, reviewer/dissent/closer, storage) inside
// orchestration.composition.contract.ts. Does not duplicate the existing
// mao.role.resolver.contract.test.ts table-driven resolver coverage.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  composeOrchestrationPlan,
  resolveRole,
} from "../src/index";
import type { MaoOrchestrationCompositionInput } from "../src/index";
import type {
  MaoAuthorityEnvelopeInput,
  MaoTaskDefinitionInput,
} from "../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/task.graph.contract";

function authorityInput(overrides: Partial<MaoAuthorityEnvelopeInput> = {}): MaoAuthorityEnvelopeInput {
  return {
    workOrderId: "docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_OA_T1_PACKAGE_ROOT_AND_ORCHESTRATION_COMPOSITION_CONTRACT_2026-07-16.md",
    route: "SINGLE_AGENT_SINGLE_ROLE",
    riskLevel: "R1",
    budget: {
      maxInvocations: 5,
      maxConcurrentRoles: 3,
      maxRevisionDepth: 1,
      tokenCostCeiling: null,
      wallClockCeilingMs: null,
    },
    closerActorId: "reviewer-1",
    approvalCheckpoints: [],
    ...overrides,
  };
}

function task(
  taskId: string,
  role: MaoTaskDefinitionInput["role"],
  riskLevel: MaoTaskDefinitionInput["riskLevel"],
  fileScope: string[] = [`src/${taskId}.ts`],
  requiresIsolatedSourcePacket?: boolean,
): MaoTaskDefinitionInput {
  return { taskId, role, riskLevel, fileScope, requiresIsolatedSourcePacket };
}

function compositionInput(
  overrides: Partial<MaoOrchestrationCompositionInput["graphInput"]> = {},
  receiptId = "seed-1",
): MaoOrchestrationCompositionInput {
  return {
    graphInput: {
      authority: authorityInput(),
      tasks: [task("t1", "worker", "R1")],
      ...overrides,
    },
    receiptId,
  };
}

// --- Package-root discoverability ---

describe("orchestration composition package-root discoverability", () => {
  it("exposes composeOrchestrationPlan and resolveRole through the package root import path", () => {
    expect(typeof composeOrchestrationPlan).toBe("function");
    expect(typeof resolveRole).toBe("function");
  });
});

// --- Accepted graph composition ---

describe("composeOrchestrationPlan accepted graph", () => {
  it("compiles the graph then resolves a role receipt for a single-task R1 graph", () => {
    const result = composeOrchestrationPlan(compositionInput());
    expect(result.graphResult.ok).toBe(true);
    expect(result.roleResolution).not.toBeNull();
    if (result.roleResolution) {
      expect(result.roleResolution.decision).toBe("SINGLE_WORKER_ADMITTED");
    }
  });

  it("passes the compiled graph and caller-supplied receiptId to resolveRole", () => {
    const input = compositionInput({}, "distinct-seed");
    const result = composeOrchestrationPlan(input);
    if (result.graphResult.ok && result.roleResolution) {
      const directReceipt = resolveRole({ graph: result.graphResult.graph, receiptId: "distinct-seed" });
      expect(result.roleResolution).toEqual(directReceipt);
    }
  });
});

// --- Determinism and frozen result ---

describe("composeOrchestrationPlan determinism", () => {
  it("produces deeply equal results across two independent calls with the same immutable input", () => {
    const input = compositionInput();
    const first = composeOrchestrationPlan(input);
    const second = composeOrchestrationPlan(input);
    expect(first).toEqual(second);
  });

  it("returns a frozen top-level result object", () => {
    const result = composeOrchestrationPlan(compositionInput());
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("returns a frozen top-level result object on compile failure too", () => {
    const result = composeOrchestrationPlan(compositionInput({ tasks: [] }));
    expect(Object.isFrozen(result)).toBe(true);
  });
});

// --- Negative case: graph compile failure ---

describe("composeOrchestrationPlan compile failure", () => {
  it("returns the unchanged graph failure and a null role resolution for an empty task set", () => {
    const result = composeOrchestrationPlan(compositionInput({ tasks: [] }));
    expect(result.graphResult.ok).toBe(false);
    if (!result.graphResult.ok) {
      expect(result.graphResult.reason).toBe("EMPTY_TASK_SET");
    }
    expect(result.roleResolution).toBeNull();
  });
});

// --- Negative case: resolver REJECTED preserved verbatim ---

describe("composeOrchestrationPlan resolver REJECTED preservation", () => {
  it("preserves a REJECTED resolver decision without reinterpretation", () => {
    // R2 single task with no reviewer role is rejected by resolveRole.
    const result = composeOrchestrationPlan(
      compositionInput({ tasks: [task("t1", "worker", "R2")] }),
    );
    expect(result.graphResult.ok).toBe(true);
    expect(result.roleResolution).not.toBeNull();
    if (result.roleResolution) {
      expect(result.roleResolution.decision).toBe("REJECTED");
      expect(result.roleResolution.riskReason).toBe("HIGH_RISK_SPECIALIST_CHAIN_REQUIRED");
      expect(result.roleResolution.approvalRequired).toBe(false);
    }
  });
});

// --- Negative case: resolver OPERATOR_APPROVAL_REQUIRED preserved verbatim ---

describe("composeOrchestrationPlan resolver OPERATOR_APPROVAL_REQUIRED preservation", () => {
  it("preserves an OPERATOR_APPROVAL_REQUIRED resolver decision without reinterpretation", () => {
    const result = composeOrchestrationPlan(
      compositionInput({
        authority: authorityInput({ route: "MULTI_AGENT_MULTI_ROLE" }),
        tasks: [
          task("t1", "worker", "R3", ["src/a.ts"]),
          task("t2", "specialist", "R3", ["src/b.ts"]),
          task("t3", "reviewer", "R3", ["review/a.md"], true),
        ],
      }),
    );
    expect(result.graphResult.ok).toBe(true);
    expect(result.roleResolution).not.toBeNull();
    if (result.roleResolution) {
      expect(result.roleResolution.decision).toBe("OPERATOR_APPROVAL_REQUIRED");
      expect(result.roleResolution.riskReason).toBe("HIGH_RISK_CHECKPOINT_REQUIRED");
      expect(result.roleResolution.approvalRequired).toBe(true);
    }
  });
});

// --- Forbidden-owner source inspection ---

describe("orchestration composition contract source forbidden-owner absence", () => {
  it("does not import or reference event/evidence ledger, delegation adapter, lifecycle controller, reviewer/dissent/closer, or storage owners", () => {
    const sourcePath = fileURLToPath(
      new URL("../src/mao/orchestration.composition.contract.ts", import.meta.url),
    );
    const source = readFileSync(sourcePath, "utf-8");
    const forbiddenTokens = [
      "event.ledger.contract",
      "evidence.readout.contract",
      "delegation.adapter.contract",
      "lifecycle.controller.contract",
      "reviewer.isolation.contract",
      "dissent.revision.contract",
      "closer.interlock.contract",
      "MaoEventLedger",
      "MaoEvidenceLedger",
      "MaoDelegationAdapter",
      "MaoLifecycleController",
    ];
    for (const token of forbiddenTokens) {
      expect(source).not.toContain(token);
    }
  });

  it("does not perform storage, network, or filesystem I/O in the composition function itself", () => {
    const sourcePath = fileURLToPath(
      new URL("../src/mao/orchestration.composition.contract.ts", import.meta.url),
    );
    const source = readFileSync(sourcePath, "utf-8");
    const ioTokens = ["readFileSync", "writeFileSync", "fetch(", "require(", "process.env"];
    for (const token of ioTokens) {
      expect(source).not.toContain(token);
    }
  });
});
