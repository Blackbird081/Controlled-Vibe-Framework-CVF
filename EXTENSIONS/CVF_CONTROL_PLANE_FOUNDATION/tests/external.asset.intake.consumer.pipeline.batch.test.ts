import { describe, expect, it } from "vitest";

import {
  ExternalAssetIntakeConsumerPipelineBatchContract,
  createExternalAssetIntakeConsumerPipelineBatchContract,
} from "../src/external.asset.intake.consumer.pipeline.batch.contract";
import { createExternalAssetIntakeConsumerPipelineContract } from "../src/external.asset.intake.consumer.pipeline.contract";

const FIXED_NOW = "2026-04-12T12:00:00.000Z";
const fixedNow = () => FIXED_NOW;

const pipeline = createExternalAssetIntakeConsumerPipelineContract({
  now: fixedNow,
});

const validResult = pipeline.execute({
  profile: {
    source_ref: "docs/reference/CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md",
    source_kind: "document_bundle",
    source_quality: "internal_design_draft",
    officially_verified: false,
    provenance_notes: "Promoted draft.",
    candidate_asset_type: "W7SkillAsset",
    description_or_trigger: "Normalize intake.",
    instruction_body: "Use bounded intake.",
  },
});

const windowsSkillResult = pipeline.execute({
  profile: {
    source_ref: "skills/windows.skill.md",
    source_kind: "document_bundle",
    source_quality: "internal_design_draft",
    officially_verified: false,
    provenance_notes: "Windows draft.",
    candidate_asset_type: "W7SkillAsset",
    description_or_trigger: "Use Windows-native execution.",
    instruction_body: "```powershell\nGet-ChildItem -Force\n```",
    execution_environment: {
      os: "windows",
      shell: "powershell",
      shell_version: "5.1+",
      script_type: "ps1",
      compatibility: "native",
    },
  },
});

const invalidToolResult = pipeline.execute({
  profile: {
    source_ref: "skills/tooling.md",
    source_kind: "document_bundle",
    source_quality: "community_analysis",
    officially_verified: false,
    provenance_notes: "Community notes.",
    candidate_asset_type: "W7ToolAsset",
    description_or_trigger: "Tool candidate.",
    instruction_body: "Compile into tool asset.",
  },
});

describe("ExternalAssetIntakeConsumerPipelineBatchContract", () => {
  const contract = new ExternalAssetIntakeConsumerPipelineBatchContract({
    now: fixedNow,
  });

  it("instantiates and factory works", () => {
    expect(() => new ExternalAssetIntakeConsumerPipelineBatchContract()).not.toThrow();
    expect(
      createExternalAssetIntakeConsumerPipelineBatchContract({ now: fixedNow }).batch([]),
    ).toBeDefined();
  });

  it("aggregates valid, invalid, and tool-asset counts", () => {
    const batch = contract.batch([validResult, windowsSkillResult, invalidToolResult]);

    expect(batch.totalProfiles).toBe(3);
    expect(batch.validCount).toBe(2);
    expect(batch.invalidCount).toBe(1);
    expect(batch.toolAssetCount).toBe(1);
    expect(batch.createdAt).toBe(FIXED_NOW);
  });

  it("keeps batchId distinct from batchHash", () => {
    const batch = contract.batch([validResult]);
    expect(batch.batchId).not.toBe(batch.batchHash);
  });
});
