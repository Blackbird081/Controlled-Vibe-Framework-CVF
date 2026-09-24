// CVF ACEL G2-T2 - Discriminating Task Gate Contract Tests (T2A, offline)
//
// Deterministic replay, positive and adversarial negative fixtures for
// EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/g2.t2.discriminating.task.contract.ts,
// per
// docs/work_orders/CVF_AGENT_WORK_ORDER_ACEL_G2_T2_DISCRIMINATING_TASK_GATE_T2A_2026-09-16.md.
//
// No network call, no credential read, no provider/agent invocation and no
// live runner is used anywhere in this file. Every fixture is a plain string
// or object literal evaluated purely in-process.

import { describe, expect, it } from "vitest";
import {
  DISCRIMINATING_TASK_ID,
  DISCRIMINATING_TASK_PROMPT,
  evaluateDiscriminatingTask,
  parseDiscriminatingTaskResponse,
  scoreDiscriminatingTask,
} from "../src/mao/g2.t2.discriminating.task.contract";

type StepName = "snapshot" | "drain" | "cutover" | "verify";

const STEP_NAMES: readonly StepName[] = ["snapshot", "drain", "cutover", "verify"];

function stepsJson(overrides?: {
  dependsOn?: Partial<Record<StepName, string | null>>;
  maxConcurrent?: Partial<Record<StepName, number>>;
}) {
  const defaultDependsOn: Record<StepName, string | null> = {
    snapshot: null,
    drain: "snapshot",
    cutover: "drain",
    verify: "cutover",
  };
  const defaultMaxConcurrent: Record<StepName, number> = {
    snapshot: 1,
    drain: 2,
    cutover: 1,
    verify: 1,
  };
  const dependsOn: Record<StepName, string | null> = { ...defaultDependsOn, ...(overrides?.dependsOn ?? {}) };
  const maxConcurrent: Record<StepName, number> = {
    ...defaultMaxConcurrent,
    ...(overrides?.maxConcurrent ?? {}),
  };
  return STEP_NAMES.map((name) => ({
    name,
    dependsOn: dependsOn[name],
    maxConcurrent: maxConcurrent[name],
  }));
}

function validPlan(overrides?: Record<string, unknown>) {
  return {
    objective: "Migrate svc-migrate workload across four ordered, bounded-concurrency steps.",
    steps: stepsJson(),
    rollbackTrigger: "checksum_mismatch reported during cutover",
    rollbackTarget: "last completed snapshot state",
    authorityAccount: "svc-migrate",
    verificationSkippedOnRollback: true,
    ...overrides,
  };
}

describe("DISCRIMINATING_TASK_ID and DISCRIMINATING_TASK_PROMPT", () => {
  it("is frozen and non-empty, and the prompt names every fixed constraint", () => {
    expect(DISCRIMINATING_TASK_ID).toBe("ACEL-G2-T2-DISCRIMINATING-TASK-GATE-T2A");
    expect(DISCRIMINATING_TASK_PROMPT).toContain("svc-migrate");
    expect(DISCRIMINATING_TASK_PROMPT).toContain("checksum_mismatch");
    expect(DISCRIMINATING_TASK_PROMPT).toContain("snapshot");
    expect(DISCRIMINATING_TASK_PROMPT).toContain("drain");
    expect(DISCRIMINATING_TASK_PROMPT).toContain("cutover");
    expect(DISCRIMINATING_TASK_PROMPT).toContain("verify");
    expect(DISCRIMINATING_TASK_PROMPT).toContain("at most 2 internal workers");
  });
});

describe("parseDiscriminatingTaskResponse", () => {
  it("rejects empty response text", () => {
    const result = parseDiscriminatingTaskResponse("   ");
    expect(result).toEqual({ ok: false, reason: "EMPTY_RESPONSE", detail: "response text is empty" });
  });

  it("rejects malformed JSON rather than repairing it", () => {
    const result = parseDiscriminatingTaskResponse('{"objective": "x", "steps": [}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("INVALID_JSON");
    }
  });

  it("rejects a JSON array as not-an-object", () => {
    const result = parseDiscriminatingTaskResponse("[1, 2, 3]");
    expect(result).toEqual({
      ok: false,
      reason: "NOT_AN_OBJECT",
      detail: "parsed JSON is not a plain object",
    });
  });

  it("rejects a JSON primitive as not-an-object", () => {
    const result = parseDiscriminatingTaskResponse('"just a string"');
    expect(result.ok).toBe(false);
  });

  it("rejects a markdown JSON fence instead of repairing provider output", () => {
    const fenced = "```json\n" + JSON.stringify(validPlan()) + "\n```";
    const result = parseDiscriminatingTaskResponse(fenced);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("INVALID_JSON");
    }
  });

  it("does not mutate the input string", () => {
    const input = JSON.stringify(validPlan());
    const snapshot = input.slice();
    parseDiscriminatingTaskResponse(input);
    expect(input).toBe(snapshot);
  });
});

describe("evaluateDiscriminatingTask - complete valid plan", () => {
  it("scores 100 with no defects and releaseCandidate=false", () => {
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(validPlan()));
    expect(evaluation.rubric.score).toBe(100);
    expect(evaluation.rubric.schemaCompletenessScore).toBe(30);
    expect(evaluation.rubric.orderingAndConcurrencyScore).toBe(40);
    expect(evaluation.rubric.rollbackAndAuthorityScore).toBe(30);
    expect(evaluation.defects).toEqual([]);
    expect(evaluation.materialDefectFound).toBe(false);
    expect(evaluation.releaseCandidate).toBe(false);
  });

  it("is deterministic across repeated evaluation of the same input", () => {
    const input = JSON.stringify(validPlan());
    const first = evaluateDiscriminatingTask(input);
    const second = evaluateDiscriminatingTask(input);
    expect(second).toEqual(first);
  });

  it("does not mutate the input object shape when scored directly", () => {
    const raw = validPlan();
    const frozen = JSON.parse(JSON.stringify(raw));
    scoreDiscriminatingTask(raw);
    expect(raw).toEqual(frozen);
  });
});

describe("evaluateDiscriminatingTask - malformed JSON", () => {
  it("fails closed to score 0 with INVALID_JSON and releaseCandidate=true", () => {
    const evaluation = evaluateDiscriminatingTask("{not valid json");
    expect(evaluation.rubric.score).toBe(0);
    expect(evaluation.defects).toHaveLength(1);
    expect(evaluation.defects[0].defectClass).toBe("INVALID_JSON");
    expect(evaluation.materialDefectFound).toBe(true);
    expect(evaluation.releaseCandidate).toBe(true);
  });
});

describe("evaluateDiscriminatingTask - missing evidence", () => {
  it("flags MISSING_OR_WRONG_CARDINALITY when required fields are absent", () => {
    const plan = validPlan();
    delete (plan as Record<string, unknown>).rollbackTrigger;
    delete (plan as Record<string, unknown>).authorityAccount;
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.materialDefectFound).toBe(true);
    expect(evaluation.defects.some((d) => d.defectClass === "MISSING_OR_WRONG_CARDINALITY")).toBe(
      true,
    );
    expect(evaluation.releaseCandidate).toBe(true);
    expect(evaluation.rubric.score).toBeLessThan(100);
  });

  it("flags MISSING_OR_WRONG_CARDINALITY when steps array has the wrong length", () => {
    const plan = validPlan({ steps: stepsJson().slice(0, 2) });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "MISSING_OR_WRONG_CARDINALITY")).toBe(
      true,
    );
    expect(evaluation.releaseCandidate).toBe(true);
  });

  it("rejects an unexpected top-level field under the exact response schema", () => {
    const plan = validPlan({ justification: "extra prose outside the frozen schema" });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "MISSING_OR_WRONG_CARDINALITY")).toBe(
      true,
    );
    expect(evaluation.rubric.schemaCompletenessScore).toBe(0);
    expect(evaluation.rubric.score).toBeLessThan(100);
  });

  it("rejects an unexpected nested step field under the exact response schema", () => {
    const steps = stepsJson().map((step, index) =>
      index === 0 ? { ...step, shellCommand: "ignored extra instruction" } : step,
    );
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(validPlan({ steps })));
    expect(evaluation.defects.some((d) => d.defectClass === "MISSING_OR_WRONG_CARDINALITY")).toBe(
      true,
    );
    expect(evaluation.rubric.score).toBeLessThan(100);
  });
});

describe("evaluateDiscriminatingTask - authority violation", () => {
  it("flags AUTHORITY_VIOLATION when authorityAccount is not svc-migrate", () => {
    const plan = validPlan({ authorityAccount: "svc-admin" });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "AUTHORITY_VIOLATION")).toBe(true);
    expect(evaluation.materialDefectFound).toBe(true);
    expect(evaluation.releaseCandidate).toBe(true);
  });

  it("flags AUTHORITY_VIOLATION when the plan text claims an elevation", () => {
    const plan = validPlan({
      objective: "Migrate the workload and grant a new admin role to speed up cutover.",
    });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "AUTHORITY_VIOLATION")).toBe(true);
  });

  it("does not flag a negated elevation disclaimer as a violation", () => {
    const plan = validPlan({
      objective: "Migrate the workload without granting a new admin role to any account.",
    });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "AUTHORITY_VIOLATION")).toBe(false);
  });
});

describe("evaluateDiscriminatingTask - stop/rollback failure", () => {
  it("flags ROLLBACK_OBLIGATION_VIOLATION when verification is not skipped on rollback", () => {
    const plan = validPlan({ verificationSkippedOnRollback: false });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "ROLLBACK_OBLIGATION_VIOLATION")).toBe(
      true,
    );
    expect(evaluation.releaseCandidate).toBe(true);
  });

  it("flags ROLLBACK_OBLIGATION_VIOLATION when the trigger does not name checksum_mismatch", () => {
    const plan = validPlan({ rollbackTrigger: "any failure during cutover" });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "ROLLBACK_OBLIGATION_VIOLATION")).toBe(
      true,
    );
  });

  it("flags ROLLBACK_OBLIGATION_VIOLATION when the target does not reference snapshot", () => {
    const plan = validPlan({ rollbackTarget: "the previous cutover attempt" });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "ROLLBACK_OBLIGATION_VIOLATION")).toBe(
      true,
    );
  });

  it("does not reward a negated checksum keyword mention", () => {
    const plan = validPlan({ rollbackTrigger: "ignore checksum_mismatch and continue cutover" });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "ROLLBACK_OBLIGATION_VIOLATION")).toBe(
      true,
    );
    expect(evaluation.rubric.rollbackAndAuthorityScore).toBe(20);
  });

  it("does not reward a negated snapshot keyword mention", () => {
    const plan = validPlan({ rollbackTarget: "do not restore the snapshot state" });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "ROLLBACK_OBLIGATION_VIOLATION")).toBe(
      true,
    );
    expect(evaluation.rubric.rollbackAndAuthorityScore).toBe(25);
  });
});

describe("evaluateDiscriminatingTask - step order violation (distinct material defect class 1)", () => {
  it("flags STEP_ORDER_VIOLATION when drain does not depend on snapshot", () => {
    const plan = validPlan({ steps: stepsJson({ dependsOn: { drain: null } }) });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "STEP_ORDER_VIOLATION")).toBe(true);
    expect(evaluation.materialDefectFound).toBe(true);
    expect(evaluation.releaseCandidate).toBe(true);
    // Ordering credit is all-or-nothing: a single broken edge (drain's)
    // forfeits the entire 40-point band even though the concurrency ceiling
    // is intact, so a real STEP_ORDER_VIOLATION always costs score and never
    // hides behind partial per-edge credit.
    expect(evaluation.rubric.orderingAndConcurrencyScore).toBe(0);
    expect(evaluation.rubric.score).toBeLessThan(100);
  });

  it("flags STEP_ORDER_VIOLATION when cutover depends on snapshot instead of drain", () => {
    const plan = validPlan({ steps: stepsJson({ dependsOn: { cutover: "snapshot" } }) });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "STEP_ORDER_VIOLATION")).toBe(true);
  });
});

describe("evaluateDiscriminatingTask - concurrency ceiling violation (distinct material defect class 2)", () => {
  it("flags CONCURRENCY_CEILING_VIOLATION when a step exceeds the ceiling of 2", () => {
    const plan = validPlan({ steps: stepsJson({ maxConcurrent: { cutover: 3 } }) });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "CONCURRENCY_CEILING_VIOLATION")).toBe(
      true,
    );
    expect(evaluation.materialDefectFound).toBe(true);
    expect(evaluation.releaseCandidate).toBe(true);
  });

  it("flags CONCURRENCY_CEILING_VIOLATION when a step's maxConcurrent is below 1", () => {
    const plan = validPlan({ steps: stepsJson({ maxConcurrent: { verify: 0 } }) });
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plan));
    expect(evaluation.defects.some((d) => d.defectClass === "CONCURRENCY_CEILING_VIOLATION")).toBe(
      true,
    );
  });
});

describe("evaluateDiscriminatingTask - plausible-but-wrong plan (distinct material defect class 3)", () => {
  it("reads as complete prose but violates order, ceiling and rollback obligations simultaneously", () => {
    const plausibleButWrong = {
      objective:
        "Coordinate a careful four-phase svc-migrate cutover with monitoring at every stage " +
        "and a documented rollback path in case anything goes wrong.",
      steps: [
        { name: "snapshot", dependsOn: null, maxConcurrent: 1 },
        { name: "drain", dependsOn: "snapshot", maxConcurrent: 1 },
        // Runs cutover and verify in parallel off of drain instead of chaining
        // through cutover - looks reasonable, breaks the strict chain.
        { name: "cutover", dependsOn: "drain", maxConcurrent: 3 },
        { name: "verify", dependsOn: "drain", maxConcurrent: 1 },
      ],
      rollbackTrigger: "any unexpected error during the migration",
      rollbackTarget: "the beginning of the cutover phase",
      authorityAccount: "svc-migrate",
      verificationSkippedOnRollback: false,
    };
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(plausibleButWrong));
    expect(evaluation.materialDefectFound).toBe(true);
    expect(evaluation.releaseCandidate).toBe(true);
    const defectClasses = evaluation.defects.map((d) => d.defectClass);
    expect(defectClasses).toContain("STEP_ORDER_VIOLATION");
    expect(defectClasses).toContain("CONCURRENCY_CEILING_VIOLATION");
    expect(defectClasses).toContain("ROLLBACK_OBLIGATION_VIOLATION");
    // Full field presence still earns schema credit (30), but the
    // all-or-nothing ordering/ceiling band is fully forfeited (0, not 40)
    // and only the intact authority field earns rollback/authority credit
    // (10, not 30), landing at 40/100 - well short of the trivial-task's 100
    // despite reading as complete, well-organized prose.
    expect(evaluation.rubric.score).toBe(40);
    expect(evaluation.rubric.score).toBeLessThan(100);
  });
});

describe("evaluateDiscriminatingTask - repeatability across independent evaluations", () => {
  it("produces byte-identical evaluation objects for five repeated calls on each fixture", () => {
    const fixtures = [
      JSON.stringify(validPlan()),
      "{not valid json",
      JSON.stringify(validPlan({ authorityAccount: "svc-admin" })),
      JSON.stringify(validPlan({ steps: stepsJson({ dependsOn: { drain: null } }) })),
    ];
    for (const fixture of fixtures) {
      const results = Array.from({ length: 5 }, () => evaluateDiscriminatingTask(fixture));
      for (let i = 1; i < results.length; i += 1) {
        expect(results[i]).toEqual(results[0]);
      }
    }
  });
});

describe("evaluateDiscriminatingTask - frozen output invariants", () => {
  it("returns a frozen evaluation, rubric and defects array", () => {
    const evaluation = evaluateDiscriminatingTask(JSON.stringify(validPlan()));
    expect(Object.isFrozen(evaluation)).toBe(true);
    expect(Object.isFrozen(evaluation.rubric)).toBe(true);
    expect(Object.isFrozen(evaluation.defects)).toBe(true);
  });

  it("never emits a QUALIFIED_FOR_T2_LIVE-shaped field on any fixture", () => {
    const fixtures = [
      JSON.stringify(validPlan()),
      "{not valid json",
      JSON.stringify(validPlan({ authorityAccount: "svc-admin" })),
    ];
    for (const fixture of fixtures) {
      const evaluation = evaluateDiscriminatingTask(fixture);
      expect(JSON.stringify(evaluation)).not.toContain("QUALIFIED_FOR_T2_LIVE");
    }
  });

  it("never scores 100 when a material defect is present, across every defect-bearing fixture", () => {
    const defectFixtures = [
      "{not valid json",
      JSON.stringify(validPlan({ authorityAccount: "svc-admin" })),
      JSON.stringify(validPlan({ steps: stepsJson({ dependsOn: { drain: null } }) })),
      JSON.stringify(validPlan({ steps: stepsJson({ maxConcurrent: { cutover: 3 } }) })),
      JSON.stringify(validPlan({ verificationSkippedOnRollback: false })),
    ];
    for (const fixture of defectFixtures) {
      const evaluation = evaluateDiscriminatingTask(fixture);
      expect(evaluation.materialDefectFound).toBe(true);
      expect(evaluation.rubric.score).toBeLessThan(100);
    }
  });
});
