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
export const REQUIRED_STAGE_CHAIN = Object.freeze([
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
export class RefineryEngine {
    clock;
    ids;
    constructor(clock, ids) {
        this.clock = clock;
        this.ids = ids;
    }
    run(input) {
        const deps = { clock: this.clock, ids: this.ids };
        const sourceEnvelopes = input.sourceEnvelopes.map((item) => structuredClone(item));
        const rawRecords = input.rawRecords.map((item) => structuredClone(item));
        const first = sourceEnvelopes[0];
        const declaredScope = input.declaredScope
            ? structuredClone(input.declaredScope)
            : first
                ? structuredClone(first.scope)
                : { organization: "" };
        const declaredOwner = input.declaredOwner ?? first?.owner ?? "";
        let context = {
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
        const completedStages = [];
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
