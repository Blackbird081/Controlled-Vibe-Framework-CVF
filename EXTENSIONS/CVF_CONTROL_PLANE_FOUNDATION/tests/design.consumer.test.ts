/**
 * CPF Design & Design Consumer — Dedicated Tests (W6-T27)
 * =========================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   DesignContract.design:
 *     - createdAt set to injected now()
 *     - intakeRequestId = intakeResult.requestId
 *     - consumerId = intakeResult.consumerId
 *     - vibeOriginal = intakeResult.intent.intent.rawVibe
 *     - domainDetected = intakeResult.intent.intent.domain
 *     - baseRisk: general → R0; finance → R3; invalid intent → R2
 *     - assessTaskRisk: BUILD + R0 → R1; BUILD + R1 → R1 (unchanged)
 *     - no context → analyze + implement tasks (no "Design solution" task)
 *     - R0 general, no context → 2 tasks (no review)
 *     - R2 domain → includes REVIEW task
 *     - R3 domain → includes REVIEW task
 *     - totalTasks = tasks.length
 *     - riskSummary and roleSummary counts accurate
 *     - planHash deterministic for same inputs and timestamp
 *     - planId = planHash
 *     - warnings: no-context warning when chunks empty
 *     - warnings: invalid-intent warning when intent.valid = false
 *     - warnings: R3 warning when R3 tasks present
 *     - factory createDesignContract returns working instance
 *
 *   DesignConsumerContract.consume:
 *     - createdAt set to injected now()
 *     - pipelineStages.length = 4
 *     - pipelineStages includes INTAKE, DESIGN, BOARDROOM, ORCHESTRATION stages
 *     - boardroomTransition result recorded on the receipt
 *     - orchestrationBlocked = false on PROCEED path
 *     - orchestrationBlocked = true and totalAssignments = 0 when boardroom blocks continuation
 *     - consumerId = intake.consumerId
 *     - receiptId = evidenceHash
 *     - designPlan, boardroomSession, orchestrationResult all present
 *     - evidenceHash is truthy
 *     - factory createDesignConsumerContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  DesignContract,
  createDesignContract,
} from "../src/design.contract";
import type { DesignTask } from "../src/design.contract";
import {
  DesignConsumerContract,
  createDesignConsumerContract,
} from "../src/design.consumer.contract";
import { ControlPlaneIntakeContract } from "../src/intake.contract";
import type { ControlPlaneIntakeResult } from "../src/intake.contract";
import type { ValidatedIntent } from "../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T05:00:00.000Z";
const fixedNow = () => FIXED_NOW;

function makeValidatedIntent(
  domain: ValidatedIntent["intent"]["domain"],
  valid = true,
): ValidatedIntent {
  return {
    intent: {
      domain,
      action: "build",
      object: "feature",
      limits: {},
      requireApproval: false,
      confidence: valid ? 0.9 : 0.2,
      rawVibe: `build a ${domain} feature`,
    },
    rules: [],
    constraints: [],
    timestamp: Date.now(),
    pipelineVersion: "1.0",
    valid,
    errors: valid ? [] : ["low confidence"],
  };
}

function makeIntake(
  domain: ValidatedIntent["intent"]["domain"] = "general",
  options: {
    valid?: boolean;
    hasChunks?: boolean;
    warnings?: string[];
    consumerId?: string;
  } = {},
): ControlPlaneIntakeResult {
  const { valid = true, hasChunks = false, warnings = [], consumerId } = options;
  const chunks = hasChunks
    ? [{ id: "c1", source: "s", content: "text", relevanceScore: 1.0 }]
    : [];
  return {
    requestId: "req-123",
    createdAt: FIXED_NOW,
    consumerId,
    intent: makeValidatedIntent(domain, valid),
    retrieval: {
      query: "build a feature",
      chunkCount: chunks.length,
      totalCandidates: chunks.length,
      retrievalTimeMs: 0,
      tiersSearched: [],
      chunks,
    },
    packagedContext: {
      chunks,
      totalTokens: chunks.length * 1,
      tokenBudget: 256,
      truncated: false,
      snapshotHash: "a".repeat(32),
    },
    warnings,
  };
}

// Get a real intake result via ControlPlaneIntakeContract (for DesignConsumerContract tests)
function makeRealIntake(): ControlPlaneIntakeResult {
  const c = new ControlPlaneIntakeContract({ now: fixedNow });
  return c.execute({ vibe: "build a feature", consumerId: "cons-1" });
}

// ─── DesignContract.design ────────────────────────────────────────────────────

describe("DesignContract.design", () => {
  const contract = new DesignContract({ now: fixedNow });

  it("createdAt set to injected now()", () => {
    expect(contract.design(makeIntake()).createdAt).toBe(FIXED_NOW);
  });

  it("intakeRequestId = intakeResult.requestId", () => {
    const intake = makeIntake();
    expect(contract.design(intake).intakeRequestId).toBe(intake.requestId);
  });

  it("consumerId = intakeResult.consumerId", () => {
    const intake = makeIntake("general", { consumerId: "user-9" });
    expect(contract.design(intake).consumerId).toBe("user-9");
  });

  it("vibeOriginal = intakeResult.intent.intent.rawVibe", () => {
    const intake = makeIntake("general");
    expect(contract.design(intake).vibeOriginal).toBe(intake.intent.intent.rawVibe);
  });

  it("domainDetected = intakeResult.intent.intent.domain", () => {
    expect(contract.design(makeIntake("finance")).domainDetected).toBe("finance");
  });

  describe("baseRisk derivation from domain", () => {
    it("general domain → R0", () => {
      const plan = contract.design(makeIntake("general"));
      // R0 domain: analyze task = R0 (but BUILD task bumped to R1)
      expect(plan.riskSummary.R3).toBe(0);
      expect(plan.riskSummary.R2).toBe(0);
    });

    it("finance domain → R3 tasks", () => {
      const plan = contract.design(makeIntake("finance"));
      expect(plan.riskSummary.R3).toBeGreaterThan(0);
    });

    it("invalid intent → R2 tasks", () => {
      const plan = contract.design(makeIntake("general", { valid: false }));
      expect(plan.riskSummary.R2).toBeGreaterThan(0);
    });
  });

  describe("assessTaskRisk: BUILD phase adjustment", () => {
    it("BUILD task with R0 base → risk elevated to R1", () => {
      const plan = contract.design(makeIntake("general"));
      const buildTask = plan.tasks.find((t) => t.targetPhase === "BUILD");
      expect(buildTask?.riskLevel).toBe("R1");
    });

    it("BUILD task with R1 base → stays R1", () => {
      const plan = contract.design(makeIntake("privacy")); // R1 base
      const buildTask = plan.tasks.find((t) => t.targetPhase === "BUILD");
      expect(buildTask?.riskLevel).toBe("R1");
    });
  });

  describe("task decomposition", () => {
    it("no context + general domain → 2 tasks (no Design solution, no Review)", () => {
      const plan = contract.design(makeIntake("general", { hasChunks: false }));
      expect(plan.totalTasks).toBe(2);
    });

    it("with context → includes Design solution task (architect role)", () => {
      const plan = contract.design(makeIntake("general", { hasChunks: true }));
      const designTask = plan.tasks.find((t) => t.title.startsWith("Design solution"));
      expect(designTask).toBeDefined();
    });

    it("R2 domain → includes REVIEW task", () => {
      const plan = contract.design(makeIntake("code_security"));
      const reviewTask = plan.tasks.find((t) => t.targetPhase === "REVIEW");
      expect(reviewTask).toBeDefined();
      expect(reviewTask?.assignedRole).toBe("reviewer");
    });

    it("R3 domain → includes REVIEW task", () => {
      const plan = contract.design(makeIntake("finance"));
      expect(plan.tasks.find((t) => t.targetPhase === "REVIEW")).toBeDefined();
    });

    it("totalTasks = plan.tasks.length", () => {
      const plan = contract.design(makeIntake("general"));
      expect(plan.totalTasks).toBe(plan.tasks.length);
    });
  });

  describe("riskSummary and roleSummary", () => {
    it("riskSummary counts match tasks", () => {
      const plan = contract.design(makeIntake("general"));
      const total = Object.values(plan.riskSummary).reduce((a, b) => a + b, 0);
      expect(total).toBe(plan.tasks.length);
    });

    it("roleSummary counts match tasks", () => {
      const plan = contract.design(makeIntake("general"));
      const total = Object.values(plan.roleSummary).reduce((a, b) => a + b, 0);
      expect(total).toBe(plan.tasks.length);
    });

    it("roleSummary.architect >= 1 (always has analyze task)", () => {
      expect(contract.design(makeIntake("general")).roleSummary.architect).toBeGreaterThanOrEqual(1);
    });
  });

  it("planHash deterministic for same inputs and timestamp", () => {
    const intake = makeIntake("general");
    const p1 = contract.design(intake);
    const p2 = contract.design(intake);
    expect(p1.planHash).toBe(p2.planHash);
  });

  it("planId = planHash", () => {
    const plan = contract.design(makeIntake("general"));
    expect(plan.planId).toBe(plan.planHash);
  });

  describe("warnings", () => {
    it("includes no-context warning when chunks empty", () => {
      const plan = contract.design(makeIntake("general", { hasChunks: false }));
      expect(plan.warnings.some((w) => w.includes("no retrieved context"))).toBe(true);
    });

    it("includes invalid-intent warning when intent.valid = false", () => {
      const plan = contract.design(makeIntake("general", { valid: false }));
      expect(plan.warnings.some((w) => w.includes("low-confidence or invalid"))).toBe(true);
    });

    it("includes R3 warning when R3 tasks present", () => {
      const plan = contract.design(makeIntake("finance"));
      expect(plan.warnings.some((w) => w.includes("R3"))).toBe(true);
    });

    it("includes intake-warnings count when intake has warnings", () => {
      const plan = contract.design(makeIntake("general", { warnings: ["some warning"] }));
      expect(plan.warnings.some((w) => w.includes("1 warning(s)"))).toBe(true);
    });
  });

  it("factory createDesignContract returns working instance", () => {
    const c = createDesignContract({ now: fixedNow });
    const plan = c.design(makeIntake("general"));
    expect(plan.createdAt).toBe(FIXED_NOW);
    expect(plan.tasks.length).toBeGreaterThan(0);
  });
});

// ─── DesignConsumerContract.consume ───────────────────────────────────────────

describe("DesignConsumerContract.consume", () => {
  const intake = makeRealIntake();
  const contract = new DesignConsumerContract({ now: fixedNow });

  it("createdAt set to injected now()", () => {
    const receipt = contract.consume(intake);
    expect(receipt.createdAt).toBe(FIXED_NOW);
  });

  it("pipelineStages.length = 4", () => {
    expect(contract.consume(intake).pipelineStages).toHaveLength(4);
  });

  it("pipelineStages[0].stage = 'INTAKE'", () => {
    expect(contract.consume(intake).pipelineStages[0].stage).toBe("INTAKE");
  });

  it("pipelineStages includes DESIGN, BOARDROOM, ORCHESTRATION", () => {
    const stages = contract.consume(intake).pipelineStages.map((s) => s.stage);
    expect(stages).toContain("DESIGN");
    expect(stages).toContain("BOARDROOM");
    expect(stages).toContain("ORCHESTRATION");
  });

  it("consumerId = intake.consumerId", () => {
    const receipt = contract.consume(intake);
    expect(receipt.consumerId).toBe(intake.consumerId);
  });

  it("receiptId = evidenceHash", () => {
    const receipt = contract.consume(intake);
    expect(receipt.receiptId).toBe(receipt.evidenceHash);
  });

  it("designPlan, boardroomSession, orchestrationResult all present", () => {
    const receipt = contract.consume(intake);
    expect(receipt.designPlan).toBeDefined();
    expect(receipt.boardroomSession).toBeDefined();
    expect(receipt.boardroomTransition).toBeDefined();
    expect(receipt.orchestrationResult).toBeDefined();
  });

  it("evidenceHash is truthy", () => {
    expect(contract.consume(intake).evidenceHash.length).toBeGreaterThan(0);
  });

  it("PROCEED path records boardroomTransition and keeps orchestration unblocked", () => {
    const receipt = contract.consume(intake);
    expect(receipt.boardroomTransition.action).toBe("PROCEED_TO_ORCHESTRATION");
    expect(receipt.orchestrationBlocked).toBe(false);
    expect(receipt.orchestrationResult.totalAssignments).toBe(
      receipt.designPlan.totalTasks,
    );
  });

  it("blocked boardroom path returns orchestrationBlocked = true and zero assignments", () => {
    const blockedReceipt = createDesignConsumerContract({
      now: fixedNow,
      clarifications: [{ question: "Missing answer" }],
    }).consume(intake);

    expect(blockedReceipt.boardroomSession.decision.decision).toBe("AMEND_PLAN");
    expect(blockedReceipt.boardroomTransition.action).toBe("RETURN_TO_DESIGN");
    expect(blockedReceipt.orchestrationBlocked).toBe(true);
    expect(blockedReceipt.orchestrationResult.totalAssignments).toBe(0);
    expect(
      blockedReceipt.orchestrationResult.warnings.some((warning) =>
        warning.includes("Orchestration blocked by boardroom transition gate"),
      ),
    ).toBe(true);
  });

  it("factory createDesignConsumerContract returns working instance", () => {
    const c = createDesignConsumerContract({ now: fixedNow });
    const receipt = c.consume(intake);
    expect(receipt.createdAt).toBe(FIXED_NOW);
    expect(receipt.pipelineStages).toHaveLength(4);
  });
});
