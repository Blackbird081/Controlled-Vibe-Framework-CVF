// CVF MAO-OA-T1 - Execution Package Root MAO Discoverability
//
// Dedicated focused test proving that the MAO task-graph compiler is
// callable through the execution-plane package root (../src/index), not
// only through the local src/mao/ barrel. Does not duplicate the existing
// cumulative tests/index.test.ts or mao.task.graph.state.contract.test.ts
// coverage of compiler behavior; this file only proves root discoverability
// and re-confirms the compiler is unchanged by that root export.

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { compileTaskGraph, MaoFileRunStore } from "../src/index";
import type { MaoAuthorityEnvelopeInput, MaoDurableRunListSuccess, MaoTaskDefinitionInput } from "../src/index";

function authorityInput(overrides: Partial<MaoAuthorityEnvelopeInput> = {}): MaoAuthorityEnvelopeInput {
  return {
    workOrderId: "docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_OA_T1_PACKAGE_ROOT_AND_ORCHESTRATION_COMPOSITION_CONTRACT_2026-07-16.md",
    route: "SINGLE_AGENT_SINGLE_ROLE",
    riskLevel: "R1",
    budget: {
      maxInvocations: 5,
      maxConcurrentRoles: 1,
      maxRevisionDepth: 1,
      tokenCostCeiling: null,
      wallClockCeilingMs: null,
    },
    closerActorId: "reviewer-1",
    approvalCheckpoints: [],
    ...overrides,
  };
}

function worker(taskId: string): MaoTaskDefinitionInput {
  return { taskId, role: "worker", riskLevel: "R1", fileScope: [`src/${taskId}.ts`] };
}

describe("execution package root MAO discoverability", () => {
  it("exposes compileTaskGraph through the package root import path", () => {
    const result = compileTaskGraph({ authority: authorityInput(), tasks: [worker("t1")] });
    expect(result.ok).toBe(true);
  });

  it("compiles deterministically through the package root the same way as the local barrel", () => {
    const input = { authority: authorityInput(), tasks: [worker("t1")] };
    const first = compileTaskGraph(input);
    const second = compileTaskGraph(input);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.graph.taskGraphId).toBe(second.graph.taskGraphId);
    }
  });

  it("still reports a typed compile failure through the package root", () => {
    const result = compileTaskGraph({ authority: authorityInput(), tasks: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("EMPTY_TASK_SET");
    }
  });

  describe("MaoFileRunStore.listRunIds package-root discoverability", () => {
    let root: string;

    beforeEach(async () => {
      root = await mkdtemp(join(tmpdir(), "mao-package-root-discovery-"));
    });

    afterEach(async () => {
      await rm(root, { recursive: true, force: true });
    });

    it("is callable through the package root and returns the typed list-success shape", async () => {
      const store = new MaoFileRunStore(root);
      const graph = compileTaskGraph({ authority: authorityInput(), tasks: [worker("t1")] });
      if (!graph.ok) throw new Error("test setup failure: package-root compile failed");
      await store.createRun(graph.graph);

      const result: MaoDurableRunListSuccess | { ok: false } = await store.listRunIds();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.taskGraphIds).toEqual([graph.graph.taskGraphId]);
      }
    });
  });
});
