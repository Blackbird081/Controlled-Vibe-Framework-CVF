import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assertAllPolicyBActionsRepresented,
  assertAuthorityEnvelopePreserved,
  assertLegalTransition,
  assertReclaimExclusivity,
  buildExperimentReceipt,
  computeAggregateComparison,
  decidePolicyA,
  decidePolicyB,
  evaluateQualityAdmission,
  runFullMatrix,
  runOne,
  RuntimeTopologyExperimentError,
  selectCheaperAdmittedRun,
  type AuthorityEnvelope,
  type ExperimentFixture,
  type RunRecord,
} from "../src/runtime.topology.experiment.contract";

const FIXTURE_PATH = join(
  __dirname,
  "fixtures",
  "runtime.topology.experiment.tasks.v1.json",
);

function loadFixtures(): ExperimentFixture[] {
  const raw = JSON.parse(readFileSync(FIXTURE_PATH, "utf-8"));
  return raw.fixtures as ExperimentFixture[];
}

function baseEnvelope(overrides: Partial<AuthorityEnvelope> = {}): AuthorityEnvelope {
  return {
    workOrderId: "ACEL-G2-TOPOLOGY-EXPERIMENT-T1",
    ownedPaths: ["src/owned.ts"],
    forbiddenPaths: ["src/forbidden.ts"],
    riskCeiling: "R1",
    sandboxTier: 1,
    providerExecutionAuthority: "FORBIDDEN",
    ...overrides,
  };
}

function baseFixture(overrides: Partial<ExperimentFixture> = {}): ExperimentFixture {
  return {
    taskId: "TEST-TASK",
    taskClass: "BOUNDED_RESEARCH",
    fixtureVersion: "v1",
    preselectedTopology: "NO_DELEGATE",
    runtimeEvidence: {
      observedLoadFactor: 0.1,
      crossModuleCouplingScore: 0.1,
      priorAttemptFailed: false,
      independentSubtaskCount: 1,
      executorHealthDegraded: false,
    },
    dynamicOracleAction: "NO_DELEGATE",
    outcomeOracle: { expectAdmitted: true, criticalDefects: 0 },
    authorityEnvelope: baseEnvelope(),
    ...overrides,
  };
}

describe("RuntimeTopologyExperimentContract fixture corpus", () => {
  const fixtures = loadFixtures();

  it("loads exactly eight fixtures", () => {
    expect(fixtures).toHaveLength(8);
  });

  it("has exactly two fixtures per task class", () => {
    const classes = ["BOUNDED_RESEARCH", "LOCAL_IMPLEMENTATION", "COUPLED_REASONING", "FAULT_FINDING"];
    for (const taskClass of classes) {
      expect(fixtures.filter((f) => f.taskClass === taskClass)).toHaveLength(2);
    }
  });

  it("has eight unique task ids", () => {
    const ids = new Set(fixtures.map((f) => f.taskId));
    expect(ids.size).toBe(8);
  });
});

describe("Policy A (fixed)", () => {
  it("always uses the fixture's preselected topology", () => {
    const fixture = baseFixture({ preselectedTopology: "DELEGATE" });
    expect(decidePolicyA(fixture)).toBe("DELEGATE");
  });

  it("ignores runtime evidence entirely", () => {
    const fixture = baseFixture({
      preselectedTopology: "NO_DELEGATE",
      runtimeEvidence: {
        observedLoadFactor: 0.99,
        crossModuleCouplingScore: 0.99,
        priorAttemptFailed: true,
        independentSubtaskCount: 5,
        executorHealthDegraded: true,
      },
    });
    expect(decidePolicyA(fixture)).toBe("NO_DELEGATE");
  });
});

describe("Policy B (dynamic) - all five actions", () => {
  it("chooses NO_DELEGATE as a positive decision under low load/coupling", () => {
    const fixture = baseFixture();
    expect(decidePolicyB(fixture)).toBe("NO_DELEGATE");
  });

  it("chooses DELEGATE under high load", () => {
    const fixture = baseFixture({
      runtimeEvidence: {
        observedLoadFactor: 0.8,
        crossModuleCouplingScore: 0.2,
        priorAttemptFailed: false,
        independentSubtaskCount: 1,
        executorHealthDegraded: false,
      },
    });
    expect(decidePolicyB(fixture)).toBe("DELEGATE");
  });

  it("chooses PARALLELIZE with multiple loosely coupled subtasks", () => {
    const fixture = baseFixture({
      runtimeEvidence: {
        observedLoadFactor: 0.3,
        crossModuleCouplingScore: 0.2,
        priorAttemptFailed: false,
        independentSubtaskCount: 3,
        executorHealthDegraded: false,
      },
    });
    expect(decidePolicyB(fixture)).toBe("PARALLELIZE");
  });

  it("chooses RECLAIM when the executor is degraded", () => {
    const fixture = baseFixture({
      runtimeEvidence: {
        observedLoadFactor: 0.5,
        crossModuleCouplingScore: 0.3,
        priorAttemptFailed: false,
        independentSubtaskCount: 1,
        executorHealthDegraded: true,
      },
    });
    expect(decidePolicyB(fixture)).toBe("RECLAIM");
  });

  it("chooses ESCALATE when a prior attempt failed", () => {
    const fixture = baseFixture({
      runtimeEvidence: {
        observedLoadFactor: 0.4,
        crossModuleCouplingScore: 0.5,
        priorAttemptFailed: true,
        independentSubtaskCount: 1,
        executorHealthDegraded: false,
      },
    });
    expect(decidePolicyB(fixture)).toBe("ESCALATE");
  });

  it("fails closed on malformed runtime evidence", () => {
    const fixture = baseFixture({
      runtimeEvidence: {
        // @ts-expect-error intentional malformed input for fail-closed test
        observedLoadFactor: "high",
        crossModuleCouplingScore: 0.1,
        priorAttemptFailed: false,
        independentSubtaskCount: 1,
        executorHealthDegraded: false,
      },
    });
    expect(() => decidePolicyB(fixture)).toThrow(RuntimeTopologyExperimentError);
    expect(() => decidePolicyB(fixture)).toThrow(/unknown input/);
  });
});

describe("Quality admission precedes cost comparison", () => {
  it("admits a run only when action matches oracle, invariants pass and defects are zero", () => {
    const fixture = baseFixture();
    const result = evaluateQualityAdmission(fixture, "B_DYNAMIC", "NO_DELEGATE", true);
    expect(result.admitted).toBe(true);
  });

  it("does not admit when the selected action diverges from the oracle", () => {
    const fixture = baseFixture({ dynamicOracleAction: "DELEGATE" });
    const result = evaluateQualityAdmission(fixture, "B_DYNAMIC", "NO_DELEGATE", true);
    expect(result.admitted).toBe(false);
    expect(result.actionMatchesOracle).toBe(false);
  });

  it("does not admit when invariants fail even if the action matches", () => {
    const fixture = baseFixture();
    const result = evaluateQualityAdmission(fixture, "B_DYNAMIC", "NO_DELEGATE", false);
    expect(result.admitted).toBe(false);
  });

  it("does not admit when critical defects are nonzero", () => {
    const fixture = baseFixture({ outcomeOracle: { expectAdmitted: true, criticalDefects: 1 } });
    const result = evaluateQualityAdmission(fixture, "B_DYNAMIC", "NO_DELEGATE", true);
    expect(result.admitted).toBe(false);
    expect(result.criticalDefects).toBe(1);
  });

  it("never lets a cheaper unadmitted run win a comparison", () => {
    const cheapFailed: RunRecord = {
      taskId: "cheap-failed",
      taskClass: "BOUNDED_RESEARCH",
      policy: "B_DYNAMIC",
      repetition: 1,
      runtimeEvidence: baseFixture().runtimeEvidence,
      routeAction: "NO_DELEGATE",
      admitted: false,
      qualityOracle: {
        actionMatchesOracle: false,
        invariantsPassed: true,
        outcomeOraclePassed: false,
        criticalDefects: 0,
      },
      orchestrationMetrics: {
        decisionCorrect: false,
        firstPassAdmission: false,
        retryCount: 1,
        simulatedContextTransferUnits: 0,
        orchestrationSteps: 0,
        deterministicIntegrationEffort: 0,
      },
      authorityEnvelope: baseEnvelope(),
      evidenceClass: "PROPOSAL_ONLY",
      recordHash: "cheap-failed-hash",
    };
    const expensiveAdmitted: RunRecord = {
      ...cheapFailed,
      taskId: "expensive-admitted",
      admitted: true,
      orchestrationMetrics: {
        ...cheapFailed.orchestrationMetrics,
        deterministicIntegrationEffort: 99,
      },
    };

    const winner = selectCheaperAdmittedRun([cheapFailed, expensiveAdmitted]);
    expect(winner?.taskId).toBe("expensive-admitted");
  });

  it("returns null when no candidate is admitted", () => {
    const fixture = baseFixture({ dynamicOracleAction: "DELEGATE" });
    const record = runOne({ fixture, policy: "B_DYNAMIC", repetition: 1 });
    expect(record.admitted).toBe(false);
    expect(selectCheaperAdmittedRun([record])).toBeNull();
  });
});

describe("Authority envelope invariants (fail closed)", () => {
  it("passes when the envelope is byte-identical before and after", () => {
    const envelope = baseEnvelope();
    expect(() => assertAuthorityEnvelopePreserved(envelope, { ...envelope })).not.toThrow();
  });

  it("fails closed on ownedPaths expansion", () => {
    const before = baseEnvelope();
    const after = baseEnvelope({ ownedPaths: [...before.ownedPaths, "src/new-owned.ts"] });
    expect(() => assertAuthorityEnvelopePreserved(before, after)).toThrow(
      /authority-envelope expansion/,
    );
  });

  it("fails closed on forbiddenPaths narrowing", () => {
    const before = baseEnvelope();
    const after = baseEnvelope({ forbiddenPaths: [] });
    expect(() => assertAuthorityEnvelopePreserved(before, after)).toThrow(
      /authority-envelope expansion/,
    );
  });

  it("fails closed on riskCeiling change", () => {
    const before = baseEnvelope();
    const after = baseEnvelope({ riskCeiling: "R3" });
    expect(() => assertAuthorityEnvelopePreserved(before, after)).toThrow(
      /authority-envelope expansion/,
    );
  });

  it("fails closed on sandboxTier change", () => {
    const before = baseEnvelope();
    const after = baseEnvelope({ sandboxTier: 2 });
    expect(() => assertAuthorityEnvelopePreserved(before, after)).toThrow(
      /authority-envelope expansion/,
    );
  });

  it("fails closed if providerExecutionAuthority is not FORBIDDEN", () => {
    const before = baseEnvelope();
    // @ts-expect-error intentional invalid authority for fail-closed test
    const after = baseEnvelope({ providerExecutionAuthority: "ORCHESTRATOR_GRANT_REQUIRED" });
    expect(() => assertAuthorityEnvelopePreserved(before, after)).toThrow(
      /authority-envelope expansion/,
    );
  });

  it("fails closed on workOrderId change", () => {
    const before = baseEnvelope();
    const after = baseEnvelope({ workOrderId: "SOME-OTHER-WORK-ORDER" });
    expect(() => assertAuthorityEnvelopePreserved(before, after)).toThrow(
      /authority-envelope expansion/,
    );
  });
});

describe("Legal transition table (fail closed)", () => {
  it("allows NO_DELEGATE to DELEGATE", () => {
    expect(() => assertLegalTransition("NO_DELEGATE", "DELEGATE")).not.toThrow();
  });

  it("allows a self-loop for every action", () => {
    const actions = ["NO_DELEGATE", "DELEGATE", "PARALLELIZE", "RECLAIM", "ESCALATE"] as const;
    for (const action of actions) {
      expect(() => assertLegalTransition(action, action)).not.toThrow();
    }
  });

  it("rejects ESCALATE to NO_DELEGATE as an illegal transition", () => {
    expect(() => assertLegalTransition("ESCALATE", "NO_DELEGATE")).toThrow(
      /illegal transition/,
    );
  });

  it("rejects PARALLELIZE to NO_DELEGATE as an illegal transition", () => {
    expect(() => assertLegalTransition("PARALLELIZE", "NO_DELEGATE")).toThrow(
      /illegal transition/,
    );
  });

  it("fails closed on an unknown action outside the closed vocabulary", () => {
    expect(() =>
      // @ts-expect-error intentional unknown action for fail-closed test
      assertLegalTransition("NO_DELEGATE", "TELEPORT"),
    ).toThrow(/unknown input/);
  });
});

describe("Reclaim dual-write exclusivity (fail closed)", () => {
  it("passes when exactly one executor retains write authority", () => {
    expect(() => assertReclaimExclusivity("RECLAIM", ["executor-b"])).not.toThrow();
  });

  it("fails closed when both old and new executors retain write authority", () => {
    expect(() =>
      assertReclaimExclusivity("RECLAIM", ["executor-a", "executor-b"]),
    ).toThrow(/reclaim dual-write authority/);
  });

  it("fails closed when no executor retains write authority", () => {
    expect(() => assertReclaimExclusivity("RECLAIM", [])).toThrow(
      /reclaim dual-write authority/,
    );
  });

  it("is a no-op for non-RECLAIM actions", () => {
    expect(() =>
      assertReclaimExclusivity("DELEGATE", ["executor-a", "executor-b"]),
    ).not.toThrow();
  });
});

describe("runOne", () => {
  const fixtures = loadFixtures();

  it("produces an admitted record for every fixture under both policies", () => {
    for (const fixture of fixtures) {
      const recordA = runOne({ fixture, policy: "A_FIXED", repetition: 1 });
      const recordB = runOne({ fixture, policy: "B_DYNAMIC", repetition: 1 });
      expect(recordA.admitted).toBe(true);
      expect(recordB.admitted).toBe(true);
      expect(recordA.evidenceClass).toBe("PROPOSAL_ONLY");
      expect(recordB.evidenceClass).toBe("PROPOSAL_ONLY");
    }
  });

  it("throws on an unknown route action arising from a malformed fixture", () => {
    const fixture = baseFixture({
      // @ts-expect-error intentional unknown preselected topology
      preselectedTopology: "TELEPORT",
    });
    expect(() => runOne({ fixture, policy: "A_FIXED", repetition: 1 })).toThrow(
      RuntimeTopologyExperimentError,
    );
  });
});

describe("runFullMatrix", () => {
  const fixtures = loadFixtures();

  it("produces exactly 32 unique (taskId, policy, repetition) records", () => {
    const records = runFullMatrix(fixtures);
    expect(records).toHaveLength(32);
    const keys = new Set(records.map((r) => `${r.taskId}::${r.policy}::${r.repetition}`));
    expect(keys.size).toBe(32);
  });

  it("represents all five Policy B actions across the matrix", () => {
    const records = runFullMatrix(fixtures);
    const represented = assertAllPolicyBActionsRepresented(records);
    expect(represented.sort()).toEqual(
      ["DELEGATE", "ESCALATE", "NO_DELEGATE", "PARALLELIZE", "RECLAIM"].sort(),
    );
  });

  it("includes a correct NO_DELEGATE decision as a positive Policy B result", () => {
    const records = runFullMatrix(fixtures);
    const noDelegateB = records.filter(
      (r) => r.policy === "B_DYNAMIC" && r.routeAction === "NO_DELEGATE",
    );
    expect(noDelegateB.length).toBeGreaterThan(0);
    expect(noDelegateB.every((r) => r.admitted)).toBe(true);
  });

  it("fails closed on fewer than eight fixtures", () => {
    expect(() => runFullMatrix(fixtures.slice(0, 7))).toThrow(/unknown input/);
  });

  it("fails closed on a duplicate taskId", () => {
    const duplicated = [...fixtures.slice(0, 7), { ...fixtures[7], taskId: fixtures[0].taskId }];
    expect(() => runFullMatrix(duplicated)).toThrow(/duplicate\/missing run/);
  });

  it("fails closed when a task class is missing its required pair", () => {
    const unbalanced = [
      ...fixtures.slice(0, 7),
      { ...fixtures[7], taskClass: fixtures[0].taskClass, taskId: "UNBALANCED-EXTRA" },
    ];
    expect(() => runFullMatrix(unbalanced)).toThrow(/duplicate\/missing run/);
  });
});

describe("computeAggregateComparison", () => {
  it("computes per-policy aggregate metrics restricted to admitted runs", () => {
    const fixtures = loadFixtures();
    const records = runFullMatrix(fixtures);
    const aggregate = computeAggregateComparison(records);
    expect(aggregate).toHaveLength(2);
    for (const row of aggregate) {
      expect(row.evidenceClass).toBe("PROPOSAL_ONLY");
      expect(row.admittedRunCount).toBeLessThanOrEqual(row.totalRunCount);
      expect(row.totalRunCount).toBe(16);
    }
  });
});

describe("buildExperimentReceipt determinism", () => {
  it("produces byte-identical JSON across two invocations with the same generatedAt", () => {
    const fixtures = loadFixtures();
    const options = {
      batchId: "ACEL-G2-TOPOLOGY-EXPERIMENT-T1",
      executionBaseHead: "db9bfd775c8fc4bea2b4d230a2665cd115a5c731",
      runnerCommand: "npm run experiment:g2-topology",
      fixtureManifestHash: "deadbeef",
      fixtures,
      generatedAt: "2026-09-16T00:00:00.000Z",
    };
    const receiptA = buildExperimentReceipt(options);
    const receiptB = buildExperimentReceipt(options);
    expect(JSON.stringify(receiptA)).toBe(JSON.stringify(receiptB));
    expect(receiptA.totalRuns).toBe(32);
    expect(receiptA.uniqueRunKeys).toBe(32);
    expect(receiptA.evidenceClass).toBe("PROPOSAL_ONLY");
  });
});
