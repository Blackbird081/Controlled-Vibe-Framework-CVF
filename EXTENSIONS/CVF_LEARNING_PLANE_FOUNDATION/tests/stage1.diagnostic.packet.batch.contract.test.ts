import { describe, expect, it } from "vitest";

import {
  createStage1DiagnosticPacketBatchContract,
  createStage1DiagnosticPacketContract,
} from "../src/index";
import type { ExternalAssetIntakeValidationResult } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/external.asset.intake.profile.contract";
import type { PlannerTriggerHeuristicsResult } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/planner.trigger.heuristics.contract";

const FIXED_NOW = "2026-04-12T14:00:00.000Z";
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

const packetContract = createStage1DiagnosticPacketContract({ now: fixedNow });

const intakePacket = packetContract.packet({
  taskId: "TASK-001",
  runtimeIndicator: "WEAK",
  intakeValidation: {
    ...intakeBase,
    valid: false,
    issues: [{ field: "tools", code: "REQUIRED_WHEN", message: "tools required" }],
  },
  plannerTrigger: plannerBase,
  provisionalSignal: null,
});

const runtimePacket = packetContract.packet({
  taskId: "TASK-002",
  runtimeIndicator: "WEAK",
  intakeValidation: intakeBase,
  plannerTrigger: plannerBase,
  provisionalSignal: null,
});

const unresolvedPacket = packetContract.packet({
  taskId: "TASK-003",
  runtimeIndicator: "AMBIGUOUS",
  intakeValidation: intakeBase,
  plannerTrigger: plannerBase,
  provisionalSignal: null,
});

describe("Stage1DiagnosticPacketBatchContract", () => {
  const contract = createStage1DiagnosticPacketBatchContract({
    now: fixedNow,
  });

  it("instantiates and factory works", () => {
    expect(() => createStage1DiagnosticPacketBatchContract()).not.toThrow();
    expect(contract.batch([])).toBeDefined();
  });

  it("aggregates next-move families and reduced-ambiguity counts", () => {
    const batch = contract.batch([intakePacket, runtimePacket, unresolvedPacket]);

    expect(batch.totalPackets).toBe(3);
    expect(batch.fixAssetProfileCount).toBe(1);
    expect(batch.reviewRuntimeProviderCount).toBe(1);
    expect(batch.collectMoreEvidenceCount).toBe(1);
    expect(batch.reducedAmbiguityCount).toBe(2);
  });

  it("keeps batchId distinct from batchHash", () => {
    const batch = contract.batch([intakePacket]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });
});
