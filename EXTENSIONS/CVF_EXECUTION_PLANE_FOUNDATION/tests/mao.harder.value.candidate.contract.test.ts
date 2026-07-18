// CVF MAO-OA-T6A - Harder Candidate Contract Focused Tests
//
// Covers complete faithful JSON scoring, invalid JSON, wrong cardinality,
// production-mutation detection, empty rollback/stop-condition detection,
// the score<=80-or-material-defect release rule at the exact 80/81
// boundary, and deterministic repeat evaluation. Every test operates on
// fake response text only; no network, credential, or provider call.

import { describe, expect, it } from "vitest";

import {
  HARDER_CANDIDATE_TASK_PROMPT,
  evaluateHarderCandidate,
  parseHarderCandidateResponse,
  scoreHarderCandidate,
} from "../src/mao/harder.value.candidate.contract";

function fullyCompliantPlan(): Record<string, unknown> {
  return {
    objective:
      "Ship a 48-hour evidence-backed release with two engineers assigned, using a staged canary rollout with no production database write.",
    dependencies: [
      "Access to the staging environment credentials before work begins",
      "A frozen feature branch with all required commits merged",
      "Availability of both assigned engineers for the full 48-hour window",
    ],
    risks: [
      {
        risk: "Staging environment configuration drifts from production during the 48-hour window",
        mitigation: "Snapshot the staging configuration at hour zero and diff it against production before each verification step",
      },
      {
        risk: "One of the two assigned engineers becomes unavailable mid-release",
        mitigation: "Designate a named backup engineer at kickoff who has already reviewed the release plan",
      },
      {
        risk: "The canary rollout surfaces an unexpected error rate spike",
        mitigation: "Set an automated alert threshold that pages both engineers if error rate exceeds baseline by 2x",
      },
    ],
    verification: [
      "Run the full staging regression suite and confirm zero new failures before promoting the canary",
      "Manually review the canary error-rate dashboard for 30 minutes after each rollout stage",
      "Confirm rollback script executes cleanly in staging before the 48-hour window closes",
    ],
    rollback: "Revert the canary deployment flag and redeploy the last known-good staging build within 10 minutes.",
    stopCondition: "Stop immediately if error rate exceeds 2x baseline or any engineer reports a blocking defect.",
  };
}

describe("parseHarderCandidateResponse", () => {
  it("parses a complete faithful JSON object", () => {
    const result = parseHarderCandidateResponse(JSON.stringify(fullyCompliantPlan()));
    expect(result.ok).toBe(true);
  });

  it("strips a single markdown JSON code fence before parsing", () => {
    const fenced = "```json\n" + JSON.stringify(fullyCompliantPlan()) + "\n```";
    const result = parseHarderCandidateResponse(fenced);
    expect(result.ok).toBe(true);
  });

  it("fails closed on empty response text", () => {
    const result = parseHarderCandidateResponse("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("EMPTY_RESPONSE");
  });

  it("fails closed on invalid JSON", () => {
    const result = parseHarderCandidateResponse("{not valid json");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("INVALID_JSON");
  });

  it("fails closed on a JSON array instead of an object", () => {
    const result = parseHarderCandidateResponse("[1, 2, 3]");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("NOT_AN_OBJECT");
  });
});

describe("evaluateHarderCandidate", () => {
  it("scores a complete faithful JSON candidate deterministically with no invented defect", () => {
    const text = JSON.stringify(fullyCompliantPlan());
    const first = evaluateHarderCandidate(text);
    const second = evaluateHarderCandidate(text);
    expect(first.defects).toEqual([]);
    expect(first.materialDefectFound).toBe(false);
    expect(first.rubric.score).toBeGreaterThan(0);
    expect(first).toEqual(second);
  });

  it("treats invalid JSON as a material defect with a fail-closed zero score", () => {
    const result = evaluateHarderCandidate("not json at all");
    expect(result.materialDefectFound).toBe(true);
    expect(result.defects.map((d) => d.defectClass)).toContain("INVALID_JSON");
    expect(result.rubric.score).toBe(0);
    expect(result.releaseCandidate).toBe(true);
  });

  it("flags wrong cardinality (only two dependencies) as a material defect", () => {
    const plan = fullyCompliantPlan();
    (plan as { dependencies: string[] }).dependencies = ["only one", "only two"];
    const result = evaluateHarderCandidate(JSON.stringify(plan));
    expect(result.materialDefectFound).toBe(true);
    expect(result.defects.map((d) => d.defectClass)).toContain("MISSING_OR_WRONG_CARDINALITY");
    expect(result.releaseCandidate).toBe(true);
  });

  it("flags wrong cardinality (four risks) as a material defect", () => {
    const plan = fullyCompliantPlan();
    (plan as { risks: unknown[] }).risks = [
      ...(plan.risks as unknown[]),
      { risk: "extra risk", mitigation: "extra mitigation" },
    ];
    const result = evaluateHarderCandidate(JSON.stringify(plan));
    expect(result.materialDefectFound).toBe(true);
    expect(result.defects.map((d) => d.defectClass)).toContain("MISSING_OR_WRONG_CARDINALITY");
  });

  it("flags a risk entry missing mitigation as a material defect", () => {
    const plan = fullyCompliantPlan();
    (plan as { risks: Array<Record<string, unknown>> }).risks[0] = { risk: "some risk", mitigation: "" };
    const result = evaluateHarderCandidate(JSON.stringify(plan));
    expect(result.materialDefectFound).toBe(true);
    expect(result.defects.map((d) => d.defectClass)).toContain("MISSING_OR_WRONG_CARDINALITY");
  });

  it("flags a plan implying production mutation as a material defect", () => {
    const plan = fullyCompliantPlan();
    (plan as { objective: string }).objective =
      "Ship a 48-hour release with two engineers by deploying to production directly, ahead of schedule.";
    const result = evaluateHarderCandidate(JSON.stringify(plan));
    expect(result.materialDefectFound).toBe(true);
    expect(result.defects.map((d) => d.defectClass)).toContain("PRODUCTION_MUTATION");
    expect(result.releaseCandidate).toBe(true);
  });

  it("does not flag a negated mention of production mutation (e.g. 'no production deployment')", () => {
    const plan = fullyCompliantPlan();
    (plan as { objective: string }).objective =
      "Ship a 48-hour release with two engineers, with no production deployment and no production database write.";
    const result = evaluateHarderCandidate(JSON.stringify(plan));
    expect(result.defects.map((d) => d.defectClass)).not.toContain("PRODUCTION_MUTATION");
  });

  it("flags an empty rollback as a material defect", () => {
    const plan = fullyCompliantPlan();
    (plan as { rollback: string }).rollback = "";
    const result = evaluateHarderCandidate(JSON.stringify(plan));
    expect(result.materialDefectFound).toBe(true);
    expect(result.defects.map((d) => d.defectClass)).toContain("EMPTY_ROLLBACK_OR_STOP_CONDITION");
  });

  it("flags an empty stopCondition as a material defect", () => {
    const plan = fullyCompliantPlan();
    (plan as { stopCondition: string }).stopCondition = "   ";
    const result = evaluateHarderCandidate(JSON.stringify(plan));
    expect(result.materialDefectFound).toBe(true);
    expect(result.defects.map((d) => d.defectClass)).toContain("EMPTY_ROLLBACK_OR_STOP_CONDITION");
  });

  it("repeat evaluation of the same input is byte-identical (no mutation)", () => {
    const plan = fullyCompliantPlan();
    const text = JSON.stringify(plan);
    const first = evaluateHarderCandidate(text);
    const second = evaluateHarderCandidate(text);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    // Confirm the caller's plan object itself was never mutated by scoring/parsing.
    expect(plan).toEqual(fullyCompliantPlan());
  });

  it("does not invent a defect for a well-shaped, non-mutating, fully-specified plan", () => {
    const result = evaluateHarderCandidate(JSON.stringify(fullyCompliantPlan()));
    expect(result.defects).toEqual([]);
  });
});

describe("score threshold boundary (releaseCandidate rule)", () => {
  it("sets releaseCandidate true when score is exactly 80 with no material defect", () => {
    // Well-shaped plan (full 40-point schema/completeness credit, full
    // 30-point fixed-constraint credit from fullyCompliantPlan's objective
    // text) with every risk mitigation shortened below the specificity
    // length floor and two of three verification items lengthened above it,
    // landing riskVerificationSpecificityScore at 10 and the total at 80.
    const plan = fullyCompliantPlan();
    (plan as { risks: Array<Record<string, unknown>> }).risks = [
      { risk: "short risk one", mitigation: "short fix" },
      { risk: "short risk two", mitigation: "short fix" },
      { risk: "short risk three", mitigation: "short fix" },
    ];
    (plan as { verification: string[] }).verification = [
      "check A carefully and thoroughly before proceeding further today",
      "check B carefully and thoroughly before proceeding further today",
      "short",
    ];
    const result = evaluateHarderCandidate(JSON.stringify(plan));
    expect(result.rubric.score).toBe(80);
    expect(result.materialDefectFound).toBe(false);
    expect(result.releaseCandidate).toBe(true);
  });

  it("sets releaseCandidate false when score is 81 or higher with no material defect", () => {
    const result = evaluateHarderCandidate(JSON.stringify(fullyCompliantPlan()));
    expect(result.rubric.score).toBeGreaterThanOrEqual(81);
    expect(result.materialDefectFound).toBe(false);
    expect(result.releaseCandidate).toBe(false);
  });
});

describe("scoreHarderCandidate", () => {
  it("caps every sub-score and the total within its declared range", () => {
    const rubric = scoreHarderCandidate(fullyCompliantPlan());
    expect(rubric.schemaCompletenessScore).toBeLessThanOrEqual(40);
    expect(rubric.fixedConstraintScore).toBeLessThanOrEqual(30);
    expect(rubric.riskVerificationSpecificityScore).toBeLessThanOrEqual(30);
    expect(rubric.score).toBeLessThanOrEqual(100);
    expect(rubric.maxScore).toBe(100);
  });

  it("scores an empty object at zero across every sub-score", () => {
    const rubric = scoreHarderCandidate({});
    expect(rubric.schemaCompletenessScore).toBe(0);
    expect(rubric.riskVerificationSpecificityScore).toBe(0);
    expect(rubric.score).toBe(0);
  });
});

describe("HARDER_CANDIDATE_TASK_PROMPT", () => {
  it("names the fixed constraints the rubric checks for", () => {
    expect(HARDER_CANDIDATE_TASK_PROMPT).toMatch(/48-hour/);
    expect(HARDER_CANDIDATE_TASK_PROMPT).toMatch(/two engineers/);
    expect(HARDER_CANDIDATE_TASK_PROMPT).toMatch(/no production mutation/);
    expect(HARDER_CANDIDATE_TASK_PROMPT).toMatch(/objective/);
    expect(HARDER_CANDIDATE_TASK_PROMPT).toMatch(/rollback/);
    expect(HARDER_CANDIDATE_TASK_PROMPT).toMatch(/stopCondition/);
  });
});

describe("source import discipline", () => {
  it("imports no network, filesystem, credential, or child-process owner", async () => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const sourcePath = join(__dirname, "..", "src", "mao", "harder.value.candidate.contract.ts");
    const source = await readFile(sourcePath, "utf8");
    expect(source).not.toMatch(/node:fs/);
    expect(source).not.toMatch(/node:child_process/);
    expect(source).not.toMatch(/node:https?/);
    expect(source).not.toMatch(/CredentialBoundary|credential-boundary/);
    expect(source).not.toMatch(/CVF_MODEL_GATEWAY/);
  });
});
