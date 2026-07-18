import { createHash } from "node:crypto";
import type { RefineryRunInput, RuleManifestRef, SourceEnvelope } from "cvf-refinery";
import type { ScenarioInput } from "../orchestrator.js";

export const POLICY_VERSION = "policy-2026-07-13";
export const RULE_VERSION = "rule-2026-07-13";

const RULE_MANIFEST: RuleManifestRef = { manifest_id: "RM-SOT3-T6", version: "v1" };

function sourceEnvelope(overrides: Partial<SourceEnvelope> & Pick<SourceEnvelope, "source_id" | "source_type" | "owner">): SourceEnvelope {
  return {
    captured_at_utc: "2026-07-13T00:00:00Z",
    scope: { organization: "cvf" },
    purpose: ["sot3-t6-integration-proof"],
    confidentiality: "INTERNAL",
    content_hash: "sha256:placeholder",
    raw_reference: { type: "object", location: "memory:sot3-t6" },
    status: "CAPTURED",
    ...overrides,
  };
}

/** Mirrors cvf-refinery's integrity-stage canonical hash so IntegrityResult passes PASS. */
function computeContentHash(records: Array<Record<string, unknown>>): string {
  const sorted = records.map((record) => {
    const keys = Object.keys(record).sort();
    return keys.map((key) => [key, record[key]]);
  });
  return `sha256:${createHash("sha256").update(JSON.stringify(sorted)).digest("hex")}`;
}

function buildScenario(params: {
  scenarioId: string;
  sourceType: SourceEnvelope["source_type"];
  organization: string;
  ownerAndFields: Record<string, unknown>;
}): { refineryInput: RefineryRunInput; scenarioInput: Omit<ScenarioInput, "refineryInput"> } {
  const sourceId = `SRC-${params.scenarioId}`;
  const rawRecords = [{ source_id: sourceId, ...params.ownerAndFields }];
  const envelope = sourceEnvelope({
    source_id: sourceId,
    source_type: params.sourceType,
    owner: `owner-${params.scenarioId.toLowerCase()}`,
    scope: { organization: params.organization },
    content_hash: computeContentHash(rawRecords),
  });

  const refineryInput: RefineryRunInput = {
    sourceEnvelopes: [envelope],
    rawRecords,
    ruleManifest: RULE_MANIFEST,
    declaredScope: { organization: params.organization },
    declaredOwner: envelope.owner,
  };

  return {
    refineryInput,
    scenarioInput: {
      scenarioId: params.scenarioId,
      evidenceProvenanceLabel: "SOURCE_BACKED",
      kernelAuthorizedPolicyVersion: POLICY_VERSION,
      kernelAuthorizedRuleVersion: RULE_VERSION,
      requestedPolicyVersion: POLICY_VERSION,
      requestedRuleVersion: RULE_VERSION,
      distributionRecipient: `recipient-${params.scenarioId.toLowerCase()}`,
      distributionRole: "worker",
      distributionTask: "review",
      distributionPhase: "delivery",
      distributionDose: "summary",
      distributionExpiryUtc: "2026-08-13T00:00:00Z",
      referenceScope: `scope-${params.scenarioId.toLowerCase()}`,
      referenceVersion: "v1",
      referenceValidFromUtc: "2026-07-13T00:00:00Z",
      referenceValidUntilUtc: "2026-08-13T00:00:00Z",
      actionTimeUtcIso: "2026-07-13T00:00:05Z",
    },
  };
}

export function internalScenario(): ScenarioInput {
  const { refineryInput, scenarioInput } = buildScenario({
    scenarioId: "INTERNAL",
    sourceType: "INTERNAL",
    organization: "cvf",
    ownerAndFields: { title: "internal governance memo", severity: "low" },
  });
  return { ...scenarioInput, refineryInput };
}

export function projectScenario(): ScenarioInput {
  const { refineryInput, scenarioInput } = buildScenario({
    scenarioId: "PROJECT",
    sourceType: "PROJECT",
    organization: "cvf-project-x",
    ownerAndFields: { title: "project milestone report", severity: "medium" },
  });
  return { ...scenarioInput, refineryInput };
}

export function marketSourceScenario(): ScenarioInput {
  const { refineryInput, scenarioInput } = buildScenario({
    scenarioId: "MARKET_SOURCE",
    sourceType: "MARKET",
    organization: "cvf-market-watch",
    ownerAndFields: { title: "market signal digest", severity: "high" },
  });
  return { ...scenarioInput, refineryInput };
}
