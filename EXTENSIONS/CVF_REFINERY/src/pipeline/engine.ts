import type { Clock, IdFactory } from "../deps.js";
import type { SourceEnvelope, SourceScope } from "../types/source-envelope.js";
import type { RuleManifestRef, RefineryPacket } from "../types/refinery-packet.js";
import type { PipelineContext } from "./pipeline-context.js";
import type { RefineryStage, StageDeps } from "./stage.js";
import { buildRefineryPacket } from "./packet-builder.js";
import { intakeStage } from "../stages/intake-stage.js";
import { normalizeStage } from "../stages/normalize-stage.js";
import { schemaStage } from "../stages/schema-stage.js";
import { duplicateStage } from "../stages/duplicate-stage.js";
import { conflictStage } from "../stages/conflict-stage.js";
import { qualityStage } from "../stages/quality-stage.js";
import { integrityStage } from "../stages/integrity-stage.js";
import { lineageStage } from "../stages/lineage-stage.js";
import { packetStage } from "../stages/packet-stage.js";

/**
 * The complete required stage chain. Callers cannot obtain
 * READY_FOR_KERNEL by omitting stages: RefineryEngine.run always executes
 * exactly this ordered chain and ignores any caller-supplied stage list.
 * There is deliberately no public API to substitute or skip a stage.
 */
export const REQUIRED_STAGE_CHAIN: readonly RefineryStage[] = Object.freeze([
  intakeStage,
  normalizeStage,
  schemaStage,
  duplicateStage,
  conflictStage,
  qualityStage,
  integrityStage,
  lineageStage,
  packetStage,
]);

export interface RefineryRunInput {
  sourceEnvelopes: SourceEnvelope[];
  rawRecords: Array<Record<string, unknown>>;
  ruleManifest: RuleManifestRef;
  declaredScope?: SourceScope;
  declaredOwner?: string;
}

export interface RefineryRunResult {
  packet: RefineryPacket;
  completedStages: string[];
}

export class RefineryEngine {
  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
  ) {}

  run(input: RefineryRunInput): RefineryRunResult {
    const deps: StageDeps = { clock: this.clock, ids: this.ids };

    const sourceEnvelopes = input.sourceEnvelopes.map((item) => structuredClone(item));
    const rawRecords = input.rawRecords.map((item) => structuredClone(item));
    const first = sourceEnvelopes[0];

    const declaredScope: SourceScope = input.declaredScope
      ? structuredClone(input.declaredScope)
      : first
        ? structuredClone(first.scope)
        : { organization: "" };
    const declaredOwner = input.declaredOwner ?? first?.owner ?? "";

    let context: PipelineContext = {
      sourceEnvelopes,
      rawRecords,
      normalizedRecords: [],
      duplicateGroups: [],
      conflictSets: [],
      qualityFindings: [],
      integrityResults: [],
      schemaValid: false,
      lineage: [],
      declaredScope,
      declaredOwner,
      ruleManifest: structuredClone(input.ruleManifest),
    };

    const completedStages: string[] = [];

    if (sourceEnvelopes.length > 0) {
      for (const stage of REQUIRED_STAGE_CHAIN) {
        context = stage.run(context, deps);
        completedStages.push(stage.id);
      }
    }

    const packet = buildRefineryPacket(context, deps, completedStages.length);

    return { packet, completedStages };
  }
}
