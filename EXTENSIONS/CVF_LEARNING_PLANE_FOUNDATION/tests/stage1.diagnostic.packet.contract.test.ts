import { describe, expect, it } from "vitest";

import { createStage1DiagnosticPacketContract } from "../src/index";
import type { ExternalAssetIntakeValidationResult } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/external.asset.intake.profile.contract";
import type { PlannerTriggerHeuristicsResult } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/planner.trigger.heuristics.contract";

const FIXED_NOW = "2026-04-12T14:00:00.000Z";

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

describe("Stage1DiagnosticPacketContract", () => {
  const contract = createStage1DiagnosticPacketContract({
    now: () => FIXED_NOW,
  });

  it("builds a packet and maps INTAKE_SHAPE to FIX_ASSET_PROFILE", () => {
    const packet = contract.packet({
      taskId: "TASK-001",
      runId: "RUN-001",
      laneId: "LANE-001",
      provider: "alibaba",
      model: "qwen3.5-122b-a10b",
      runtimeIndicator: "WEAK",
      intakeValidation: {
        ...intakeBase,
        valid: false,
        issues: [{ field: "tools", code: "REQUIRED_WHEN", message: "tools required" }],
      },
      plannerTrigger: plannerBase,
      provisionalSignal: null,
    });

    expect(packet.primaryAttribution).toBe("INTAKE_SHAPE");
    expect(packet.recommendedNextMove).toBe("FIX_ASSET_PROFILE");
    expect(packet.noSpinConclusion).toContain("pre-runtime intake shape");
    expect(packet.executionEnvironmentSummary.declared).toBe(false);
  });

  it("maps clean pre-runtime plus weak runtime to REVIEW_RUNTIME_PROVIDER", () => {
    const packet = contract.packet({
      taskId: "TASK-002",
      runtimeIndicator: "WEAK",
      intakeValidation: intakeBase,
      plannerTrigger: plannerBase,
      provisionalSignal: null,
    });

    expect(packet.primaryAttribution).toBe("RUNTIME_OR_PROVIDER_BEHAVIOR");
    expect(packet.recommendedNextMove).toBe("REVIEW_RUNTIME_PROVIDER");
  });

  it("maps unresolved evidence to COLLECT_MORE_EVIDENCE", () => {
    const packet = contract.packet({
      taskId: "TASK-003",
      runtimeIndicator: "AMBIGUOUS",
      intakeValidation: intakeBase,
      plannerTrigger: plannerBase,
      provisionalSignal: null,
    });

    expect(packet.primaryAttribution).toBe("UNRESOLVED");
    expect(packet.recommendedNextMove).toBe("COLLECT_MORE_EVIDENCE");
  });

  it("includes execution-environment summary when declared on the intake profile", () => {
    const packet = contract.packet({
      taskId: "TASK-004",
      runtimeIndicator: "STRONG",
      intakeValidation: {
        ...intakeBase,
        normalizedProfile: {
          ...intakeBase.normalizedProfile,
          execution_environment: {
            os: "windows",
            shell: "powershell",
            shell_version: "5.1+",
            script_type: "ps1",
            compatibility: "native",
          },
        },
      },
      plannerTrigger: plannerBase,
      provisionalSignal: null,
    });

    expect(packet.executionEnvironmentSummary).toEqual({
      declared: true,
      requiredForCase: false,
      os: "windows",
      shell: "powershell",
      compatibility: "native",
      issueFields: [],
    });
  });

  it("calls out missing execution_environment in no-spin conclusion for shell-dependent skill intake", () => {
    const packet = contract.packet({
      taskId: "TASK-005",
      runtimeIndicator: "WEAK",
      intakeValidation: {
        ...intakeBase,
        valid: false,
        issues: [
          {
            field: "execution_environment",
            code: "REQUIRED_WHEN",
            message:
              "execution_environment is required when candidate_asset_type is W7SkillAsset and executable code blocks are present.",
          },
        ],
      },
      plannerTrigger: plannerBase,
      provisionalSignal: null,
    });

    expect(packet.executionEnvironmentSummary).toEqual({
      declared: false,
      requiredForCase: true,
      os: undefined,
      shell: undefined,
      compatibility: undefined,
      issueFields: ["execution_environment"],
    });
    expect(packet.noSpinConclusion).toContain("missing execution-environment declaration");
  });
});
