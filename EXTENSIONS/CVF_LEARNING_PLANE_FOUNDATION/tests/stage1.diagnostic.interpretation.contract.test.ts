import { describe, expect, it } from "vitest";

import { createStage1DiagnosticInterpretationContract } from "../src/index";
import type { ExternalAssetIntakeValidationResult } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/external.asset.intake.profile.contract";
import type { PlannerTriggerHeuristicsResult } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/planner.trigger.heuristics.contract";
import type { ProvisionalEvaluationSignal } from "../src/provisional.evaluation.signal.contract";

const FIXED_NOW = "2026-04-12T13:00:00.000Z";

function makeIntakeValidation(
  overrides: Partial<ExternalAssetIntakeValidationResult> = {},
): ExternalAssetIntakeValidationResult {
  return {
    stage: "external_intake_profile",
    valid: true,
    issues: [],
    normalizedProfile: {
      source_ref: "docs/source.md",
      source_kind: "document_bundle",
      source_quality: "internal_design_draft",
      officially_verified: false,
      provenance_notes: "Promoted draft.",
      candidate_asset_type: "W7SkillAsset",
      description_or_trigger: "Normalize intake.",
      instruction_body: "Use bounded intake.",
      references: [],
      examples: [],
      tools: [],
      templates: [],
    },
    ...overrides,
  };
}

function makePlanner(
  overrides: Partial<PlannerTriggerHeuristicsResult> = {},
): PlannerTriggerHeuristicsResult {
  return {
    candidate_refs: ["asset.imagegen"],
    confidence: 0.96,
    missing_inputs: [],
    clarification_needed: false,
    negative_matches: [],
    ...overrides,
  };
}

function makeSignal(
  overrides: Partial<ProvisionalEvaluationSignal> = {},
): ProvisionalEvaluationSignal {
  return {
    signalId: "sig-1",
    capturedAt: FIXED_NOW,
    name: "weak_trigger_definition",
    category: "planner_quality",
    captureSource: "planner/trigger-test",
    evidenceType: "planner_analysis",
    phase: ["DESIGN"],
    severity: "medium",
    recommendedRemediation: "Clarify missing inputs.",
    summary: "Weak trigger definition.",
    signalHash: "hash-sig-1",
    ...overrides,
  };
}

describe("Stage1DiagnosticInterpretationContract", () => {
  const contract = createStage1DiagnosticInterpretationContract({
    now: () => FIXED_NOW,
  });

  it("attributes invalid intake to INTAKE_SHAPE", () => {
    const result = contract.interpret({
      intakeValidation: makeIntakeValidation({ valid: false, issues: [{ field: "tools", code: "REQUIRED_WHEN", message: "tools required" }] }),
      plannerTrigger: makePlanner(),
      provisionalSignal: null,
      runtimeIndicator: "WEAK",
    });

    expect(result.primaryAttribution).toBe("INTAKE_SHAPE");
    expect(result.likelyPreRuntimeStructure).toBe(true);
    expect(result.stage1ReducedAmbiguity).toBe(true);
  });

  it("attributes missing inputs to MISSING_CLARIFICATION when planner still needs clarification", () => {
    const result = contract.interpret({
      intakeValidation: makeIntakeValidation(),
      plannerTrigger: makePlanner({
        candidate_refs: ["foundry.customize"],
        confidence: 0.62,
        missing_inputs: ["resource group"],
        clarification_needed: true,
      }),
      provisionalSignal: null,
      runtimeIndicator: "NOT_PROVIDED",
    });

    expect(result.primaryAttribution).toBe("MISSING_CLARIFICATION");
    expect(result.likelyMissingClarification).toBe(true);
  });

  it("attributes weak trigger quality when provisional signal is present", () => {
    const result = contract.interpret({
      intakeValidation: makeIntakeValidation(),
      plannerTrigger: makePlanner({
        candidate_refs: [],
        confidence: 0.2,
        clarification_needed: true,
      }),
      provisionalSignal: makeSignal(),
      runtimeIndicator: "NOT_PROVIDED",
    });

    expect(result.primaryAttribution).toBe("PLANNER_TRIGGER_QUALITY");
    expect(result.likelyPlannerQuality).toBe(true);
  });

  it("attributes clean pre-runtime evidence plus weak runtime to RUNTIME_OR_PROVIDER_BEHAVIOR", () => {
    const result = contract.interpret({
      intakeValidation: makeIntakeValidation(),
      plannerTrigger: makePlanner(),
      provisionalSignal: null,
      runtimeIndicator: "WEAK",
    });

    expect(result.primaryAttribution).toBe("RUNTIME_OR_PROVIDER_BEHAVIOR");
    expect(result.likelyRuntimeOrProviderBehavior).toBe(true);
  });

  it("uses MIXED when runtime weakness and planner weakness coexist", () => {
    const result = contract.interpret({
      intakeValidation: makeIntakeValidation(),
      plannerTrigger: makePlanner({
        candidate_refs: [],
        confidence: 0.2,
        clarification_needed: true,
      }),
      provisionalSignal: makeSignal({ severity: "high" }),
      runtimeIndicator: "WEAK",
    });

    expect(result.primaryAttribution).toBe("MIXED");
  });

  it("returns UNRESOLVED when no dominant cause is isolated", () => {
    const result = contract.interpret({
      intakeValidation: makeIntakeValidation(),
      plannerTrigger: makePlanner(),
      provisionalSignal: null,
      runtimeIndicator: "AMBIGUOUS",
    });

    expect(result.primaryAttribution).toBe("UNRESOLVED");
    expect(result.stage1ReducedAmbiguity).toBe(false);
  });
});
