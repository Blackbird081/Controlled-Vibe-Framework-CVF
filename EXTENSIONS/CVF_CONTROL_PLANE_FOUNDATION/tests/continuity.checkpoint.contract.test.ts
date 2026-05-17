import { describe, expect, it } from "vitest";
import {
  validateCheckpoint,
  type ContinuityCheckpoint,
} from "../src/continuity.checkpoint.contract";

const checkpoint = (
  overrides: Partial<ContinuityCheckpoint> = {},
): ContinuityCheckpoint => ({
  checkpointId: "checkpoint-001",
  taskId: "task-001",
  agentId: "codex",
  phaseBoundary: "BUILD_TO_REVIEW",
  closedDecisions: [
    {
      decisionId: "decision-001",
      decision: "Use schema-only implementation.",
      reasoning: "Runtime behavior is out of scope.",
      irrevocable: true,
    },
  ],
  openItems: [
    {
      itemId: "item-001",
      description: "Run final verification.",
      nextPhase: "REVIEW",
    },
  ],
  artifactMemory: [
    {
      path: "docs/roadmaps/example.md",
      hash: "hash-001",
      role: "evidence",
    },
  ],
  reinjectionPolicy: "on-request",
  evidenceReceiptIds: ["receipt-001"],
  ...overrides,
});

describe("ContinuityCheckpoint", () => {
  it("passes validation for a valid checkpoint with all fields", () => {
    expect(validateCheckpoint(checkpoint()).valid).toBe(true);
  });

  it("allows empty closedDecisions and openItems", () => {
    expect(
      validateCheckpoint(checkpoint({ closedDecisions: [], openItems: [] })).valid,
    ).toBe(true);
  });

  it("passes when an irrevocable decision is not in openItems", () => {
    const result = validateCheckpoint(checkpoint());
    expect(result.valid).toBe(true);
  });

  it("fails when a closed decision ID also appears in openItems", () => {
    const result = validateCheckpoint(
      checkpoint({
        openItems: [
          {
            itemId: "decision-001",
            description: "Should not reopen.",
            nextPhase: "BUILD",
          },
        ],
      }),
    );

    expect(result.valid).toBe(false);
  });

  it("fails expired reinjection without evidence receipts", () => {
    const result = validateCheckpoint(
      checkpoint({ reinjectionPolicy: "expired", evidenceReceiptIds: [] }),
    );

    expect(result.violations).toContain(
      "expired reinjectionPolicy requires at least one evidenceReceiptId",
    );
  });

  it("passes always reinjection without evidence receipts", () => {
    expect(
      validateCheckpoint(
        checkpoint({ reinjectionPolicy: "always", evidenceReceiptIds: [] }),
      ).valid,
    ).toBe(true);
  });

  it("accepts artifactMemory role evidence", () => {
    expect(checkpoint().artifactMemory[0]?.role).toBe("evidence");
  });

  it("accepts empty artifactMemory", () => {
    expect(validateCheckpoint(checkpoint({ artifactMemory: [] })).valid).toBe(true);
  });

  it("fails empty phaseBoundary", () => {
    expect(validateCheckpoint(checkpoint({ phaseBoundary: "" })).violations).toContain(
      "phaseBoundary must be non-empty",
    );
  });

  it("passes openItems with future phase references", () => {
    const result = validateCheckpoint(
      checkpoint({
        openItems: [
          {
            itemId: "future-001",
            description: "Continue in later roadmap.",
            nextPhase: "FUTURE_GC018",
          },
        ],
      }),
    );

    expect(result.valid).toBe(true);
  });

  it("fails empty checkpointId", () => {
    expect(validateCheckpoint(checkpoint({ checkpointId: "" })).valid).toBe(false);
  });

  it("fails empty taskId", () => {
    expect(validateCheckpoint(checkpoint({ taskId: " " })).violations).toContain(
      "taskId must be non-empty",
    );
  });

  it("fails empty agentId", () => {
    expect(validateCheckpoint(checkpoint({ agentId: "" })).violations).toContain(
      "agentId must be non-empty",
    );
  });

  it("reports duplicate closed decision IDs", () => {
    const decision = checkpoint().closedDecisions[0]!;
    const result = validateCheckpoint(
      checkpoint({ closedDecisions: [decision, decision] }),
    );

    expect(result.violations).toContain("duplicate closed decision id decision-001");
  });

  it("reports duplicate open item IDs", () => {
    const openItem = checkpoint().openItems[0]!;
    const result = validateCheckpoint(checkpoint({ openItems: [openItem, openItem] }));

    expect(result.violations).toContain("duplicate open item id item-001");
  });

  it("allows output artifact role", () => {
    const result = validateCheckpoint(
      checkpoint({
        artifactMemory: [{ path: "out.md", hash: "hash-out", role: "output" }],
      }),
    );

    expect(result.valid).toBe(true);
  });

  it("allows input artifact role", () => {
    const result = validateCheckpoint(
      checkpoint({
        artifactMemory: [{ path: "input.md", hash: "hash-in", role: "input" }],
      }),
    );

    expect(result.valid).toBe(true);
  });

  it("returns multiple violations together", () => {
    const result = validateCheckpoint(
      checkpoint({
        checkpointId: "",
        taskId: "",
        reinjectionPolicy: "expired",
        evidenceReceiptIds: [],
      }),
    );

    expect(result.violations.length).toBeGreaterThanOrEqual(3);
  });
});
