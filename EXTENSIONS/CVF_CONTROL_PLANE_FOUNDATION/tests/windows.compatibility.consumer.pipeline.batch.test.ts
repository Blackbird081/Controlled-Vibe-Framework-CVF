import { describe, expect, it } from "vitest";

import {
  WindowsCompatibilityConsumerPipelineBatchContract,
  createWindowsCompatibilityConsumerPipelineBatchContract,
} from "../src/windows.compatibility.consumer.pipeline.batch.contract";
import { createWindowsCompatibilityConsumerPipelineContract } from "../src/windows.compatibility.consumer.pipeline.contract";

const FIXED_NOW = "2026-04-12T19:30:00.000Z";
const fixedNow = () => FIXED_NOW;

const pipeline = createWindowsCompatibilityConsumerPipelineContract({
  now: fixedNow,
});

const nativeResult = pipeline.execute({
  intakeValidation: {
    stage: "external_intake_profile",
    valid: true,
    issues: [],
    normalizedProfile: {
      source_ref: "skills/windows.skill.md",
      source_kind: "document_bundle",
      source_quality: "internal_design_draft",
      officially_verified: false,
      provenance_notes: "Windows skill draft.",
      candidate_asset_type: "W7SkillAsset",
      description_or_trigger: "Use Windows-native execution.",
      instruction_body: "```powershell\nGet-ChildItem -Force\n```",
      references: [],
      examples: [],
      tools: [],
      templates: [],
      execution_environment: {
        os: "windows",
        shell: "powershell",
        shell_version: "5.1+",
        script_type: "ps1",
        compatibility: "native",
      },
    },
  },
  governanceFitPassed: true,
  existingIntakePolicyPassed: true,
  commandsValidated: true,
  unsupportedOperatorsRemoved: true,
  exitCodeHandlingExplicit: true,
  deterministicExecution: true,
  w7RecordsGeneratable: true,
  guardPolicyCompatible: true,
  noUnauthorizedAccessPath: true,
  scopeBoundedCommands: true,
});

const rejectedResult = pipeline.execute({
  intakeValidation: {
    stage: "external_intake_profile",
    valid: false,
    issues: [
      {
        field: "execution_environment",
        code: "REQUIRED_WHEN",
        message:
          "execution_environment is required when candidate_asset_type is W7SkillAsset and executable code blocks are present.",
      },
    ],
    normalizedProfile: {
      source_ref: "skills/linux.skill.md",
      source_kind: "document_bundle",
      source_quality: "community_analysis",
      officially_verified: false,
      provenance_notes: "Linux draft.",
      candidate_asset_type: "W7SkillAsset",
      description_or_trigger: "Use shell execution.",
      instruction_body: "```bash\nls -la\n```",
      references: [],
      examples: [],
      tools: [],
      templates: [],
      execution_environment: undefined,
    },
  },
  governanceFitPassed: true,
  existingIntakePolicyPassed: true,
  commandsValidated: false,
  unsupportedOperatorsRemoved: false,
  exitCodeHandlingExplicit: false,
  deterministicExecution: false,
});

describe("WindowsCompatibilityConsumerPipelineBatchContract", () => {
  const contract = new WindowsCompatibilityConsumerPipelineBatchContract({
    now: fixedNow,
  });

  it("instantiates and factory works", () => {
    expect(() => new WindowsCompatibilityConsumerPipelineBatchContract()).not.toThrow();
    expect(
      createWindowsCompatibilityConsumerPipelineBatchContract({ now: fixedNow }).batch([]),
    ).toBeDefined();
  });

  it("aggregates native, rejected, and blocker counts", () => {
    const batch = contract.batch([nativeResult, rejectedResult]);

    expect(batch.totalResults).toBe(2);
    expect(batch.nativeCount).toBe(1);
    expect(batch.rejectedCount).toBe(1);
    expect(batch.blockerCount).toBe(1);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("keeps batchId distinct from batchHash", () => {
    const batch = contract.batch([nativeResult]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });
});
