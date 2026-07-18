import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { CommandRegistry } from "../../src/command.registry";

function skillIndexPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "cvf-skill-index-"));
  const path = join(dir, "skills-index.json");
  writeFileSync(path, JSON.stringify({
    categories: [{ id: "ops", skills: [{ id: "skill-a", title: "Skill A", domain: "ops", riskLevel: "R1" }] }],
  }));
  return path;
}

describe("cvf skill", () => {
  it("registers the skill command", () => {
    expect(new CommandRegistry().getHandler("skill")).toBeDefined();
  });

  it("lists skills from a read-only index", () => {
    const input = skillIndexPath();
    try {
      const result = new CommandRegistry().execute({ command: "skill", positional: ["list"], flags: { input } });
      expect(result.success).toBe(true);
      expect(result.message).toContain("skill-a");
    } finally {
      rmSync(dirname(input), { recursive: true, force: true });
    }
  });

  it("shows one skill by id", () => {
    const input = skillIndexPath();
    try {
      const result = new CommandRegistry().execute({ command: "skill", positional: ["show", "skill-a"], flags: { input } });
      expect(result.success).toBe(true);
      expect(result.message).toContain("Skill A");
    } finally {
      rmSync(dirname(input), { recursive: true, force: true });
    }
  });

  it("lists certified product outcome runtime plans", () => {
    const result = new CommandRegistry().execute({
      command: "skill",
      positional: ["list"],
      flags: { certified: true },
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("product_brief");
    expect(result.message).toContain("app_builder_complete");
    expect(result.message).toContain("competitor_review");
    expect(result.data).toMatchObject({ plans: expect.any(Array) });
    expect((result.data as { plans: unknown[] }).plans).toHaveLength(10);
  });

  it("shows a certified product outcome runtime plan as JSON", () => {
    const result = new CommandRegistry().execute({
      command: "skill",
      positional: ["plan", "product_brief"],
      flags: { json: true },
    });

    expect(result.success).toBe(true);
    const plan = JSON.parse(result.message);
    expect(plan).toMatchObject({
      skillPackId: "product_brief",
      templateId: "app_builder_complete",
      routeOwner: "cvf-web /api/execute",
    });
    expect(plan.receiptSchemaPath).toContain("receipt.schema.json");
  });

  it("resolves all ten certified product outcome runtime plans", () => {
    const expectedIds = [
      "strategy_analysis",
      "product_brief",
      "sop_generator",
      "proposal_writer",
      "meeting_summarizer",
      "contract_review",
      "landing_page_builder",
      "competitor_review",
      "data_analysis",
      "app_requirements_spec",
    ];

    for (const id of expectedIds) {
      const result = new CommandRegistry().execute({
        command: "skill",
        positional: ["plan", id],
        flags: { json: true },
      });
      expect(result.success, id).toBe(true);
      const plan = JSON.parse(result.message);
      expect(plan.skillPackId).toBe(id);
      expect(plan.receiptSchemaPath).toContain("receipt.schema.json");
      expect(plan.workflowSpecPath).toContain("workflow.spec.md");
    }
  });

  it("selects an exact certified pack by id", () => {
    const result = new CommandRegistry().execute({
      command: "skill",
      positional: ["select", "competitor_review"],
      flags: { json: true },
    });

    expect(result.success).toBe(true);
    const readout = JSON.parse(result.message);
    expect(readout).toMatchObject({
      status: "selected",
      confidence: "exact",
      reason: "exact_certified_pack_match",
      selectedPlan: { skillPackId: "competitor_review" },
    });
    expect(readout.requestContext.readoutVersion).toBe("cvf.productSkillPackRequestContext.v1");
  });

  it("selects by keyword and surfaces R2 human review", () => {
    const result = new CommandRegistry().execute({
      command: "skill",
      positional: ["select", "analyze dataset metrics anomaly trend for Q2"],
      flags: { json: true },
    });

    expect(result.success).toBe(true);
    const readout = JSON.parse(result.message);
    expect(readout.status).toBe("selected");
    expect(readout.selectedPlan.skillPackId).toBe("data_analysis");
    expect(readout.riskLevel).toBe("R2");
    expect(readout.humanReviewRequired).toBe(true);
    expect(readout.userAction).toContain("human review");
  });

  it("reports ready request context when the request has objective, audience, and constraints", () => {
    const result = new CommandRegistry().execute({
      command: "skill",
      positional: [
        "select",
        "write a competitor review for B2B SaaS founders, include pricing risks and output sections",
      ],
      flags: { json: true },
    });

    expect(result.success).toBe(true);
    const readout = JSON.parse(result.message);
    expect(readout.selectedPlan.skillPackId).toBe("competitor_review");
    expect(readout.requestContext.readiness).toBe("ready");
    expect(readout.requestContext.detectedSignals).toContain("active_task_objective");
    expect(readout.requestContext.detectedSignals).toContain("business_goal_or_audience");
    expect(readout.requestContext.detectedSignals).toContain("constraints_or_risks");
  });

  it("reports clarification need for vague requests before wasting provider quota", () => {
    const result = new CommandRegistry().execute({
      command: "skill",
      positional: ["select", "make it better"],
      flags: { json: true },
    });

    expect(result.success).toBe(true);
    const readout = JSON.parse(result.message);
    expect(readout.requestContext.readiness).toBe("needs_clarification");
    expect(readout.requestContext.missingSignals).toContain("problem_statement_or_task_objective");
    expect(readout.requestContext.recommendedNextAction).toContain("Ask for the missing");
  });

  it("reports compaction need for oversized noisy log-style requests", () => {
    const noisyRequest = `analyze data incident for ops team ${"error timeout stack trace ".repeat(180)}`;
    const result = new CommandRegistry().execute({
      command: "skill",
      positional: ["select", noisyRequest],
      flags: { json: true },
    });

    expect(result.success).toBe(true);
    const readout = JSON.parse(result.message);
    expect(readout.requestContext.readiness).toBe("needs_context_compaction");
    expect(readout.requestContext.noiseFlags).toContain("raw_log_stream");
    expect(readout.requestContext.recommendedNextAction).toContain("Compact");
  });

  it("blocks contaminated implementation-heavy pseudo-briefs", () => {
    const contaminated = "Build this now with React and Postgres:\n```tsx\nfunction App() { return <div /> }\n```";
    const result = new CommandRegistry().execute({
      command: "skill",
      positional: ["select", contaminated],
      flags: { json: true },
    });

    expect(result.success).toBe(true);
    const readout = JSON.parse(result.message);
    expect(readout.requestContext.readiness).toBe("blocked_contaminated_brief");
    expect(readout.requestContext.contaminationFlags).toContain("contains_code_block");
    expect(readout.requestContext.recommendedNextAction).toContain("reverse-brief");
  });

  it("returns a no-match readout without pretending a pack fits", () => {
    const result = new CommandRegistry().execute({
      command: "skill",
      positional: ["select", "book a flight and order lunch"],
      flags: { json: true },
    });

    expect(result.success).toBe(true);
    const readout = JSON.parse(result.message);
    expect(readout.status).toBe("no_certified_pack_match");
    expect(readout.reason).toBe("no_certified_pack_match");
    expect(readout.selectedPlan).toBeUndefined();
    expect(readout.userAction).toContain("Clarify");
  });

  it("returns a clear error for a missing skill", () => {
    const input = skillIndexPath();
    try {
      const result = new CommandRegistry().execute({ command: "skill", positional: ["show", "missing"], flags: { input } });
      expect(result.success).toBe(false);
      expect(result.message).toContain("Skill not found");
    } finally {
      rmSync(dirname(input), { recursive: true, force: true });
    }
  });
});
