import { describe, expect, it } from "vitest";

import {
  createStage1DiagnosticInterpretationBatchContract,
  createStage1DiagnosticInterpretationContract,
} from "../src/index";
import type { ExternalAssetIntakeValidationResult } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/external.asset.intake.profile.contract";
import type { PlannerTriggerHeuristicsResult } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/planner.trigger.heuristics.contract";

const FIXED_NOW = "2026-04-12T13:00:00.000Z";
const fixedNow = () => FIXED_NOW;

const intakeBase: ExternalAssetIntakeValidationResult = {
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
};

const plannerBase: PlannerTriggerHeuristicsResult = {
  candidate_refs: ["asset.imagegen"],
  confidence: 0.96,
  missing_inputs: [],
  clarification_needed: false,
  negative_matches: [],
};

const interpreter = createStage1DiagnosticInterpretationContract({ now: fixedNow });

const intakeInterpretation = interpreter.interpret({
  intakeValidation: { ...intakeBase, valid: false, issues: [{ field: "tools", code: "REQUIRED_WHEN", message: "tools required" }] },
  plannerTrigger: plannerBase,
  provisionalSignal: null,
  runtimeIndicator: "WEAK",
});

const runtimeInterpretation = interpreter.interpret({
  intakeValidation: intakeBase,
  plannerTrigger: plannerBase,
  provisionalSignal: null,
  runtimeIndicator: "WEAK",
});

const unresolvedInterpretation = interpreter.interpret({
  intakeValidation: intakeBase,
  plannerTrigger: plannerBase,
  provisionalSignal: null,
  runtimeIndicator: "AMBIGUOUS",
});

describe("Stage1DiagnosticInterpretationBatchContract", () => {
  const contract = createStage1DiagnosticInterpretationBatchContract({
    now: fixedNow,
  });

  it("instantiates and factory works", () => {
    expect(() => createStage1DiagnosticInterpretationBatchContract()).not.toThrow();
    expect(contract.batch([])).toBeDefined();
  });

  it("aggregates attribution families and reduced-ambiguity counts", () => {
    const batch = contract.batch([
      intakeInterpretation,
      runtimeInterpretation,
      unresolvedInterpretation,
    ]);

    expect(batch.totalResults).toBe(3);
    expect(batch.intakeShapeCount).toBe(1);
    expect(batch.runtimeBehaviorCount).toBe(1);
    expect(batch.unresolvedCount).toBe(1);
    expect(batch.reducedAmbiguityCount).toBe(2);
  });

  it("keeps batchId distinct from batchHash", () => {
    const batch = contract.batch([intakeInterpretation]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });
});
