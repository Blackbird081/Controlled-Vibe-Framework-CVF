import { buildLineageEvent } from "../pipeline/stage.js";
/**
 * Normalization never invents data: unknown/undefined fields pass through
 * untouched rather than being defaulted or guessed. The only transform
 * applied is trimming string values, recorded as an explicit step.
 */
function normalizeFields(fields) {
    const canonical = {};
    let changed = false;
    for (const [key, value] of Object.entries(fields)) {
        if (typeof value === "string") {
            const trimmed = value.trim();
            canonical[key] = trimmed;
            if (trimmed !== value)
                changed = true;
        }
        else {
            canonical[key] = value;
        }
    }
    return { canonical, changed };
}
export const normalizeStage = {
    id: "normalize",
    lineageStage: "NORMALIZE",
    run(context, deps) {
        const bySource = new Map(context.sourceEnvelopes.map((item) => [item.source_id, item]));
        const normalizedRecords = context.rawRecords.map((raw, index) => {
            const sourceId = typeof raw.source_id === "string" ? raw.source_id : "";
            const envelope = bySource.get(sourceId);
            const originalFields = structuredClone(raw);
            const { canonical, changed } = normalizeFields(raw);
            const recordId = deps.ids.nextId("NR");
            const warnings = [];
            if (!envelope) {
                warnings.push("REFINERY_UNKNOWN_SOURCE_REFERENCE");
            }
            return {
                record_id: recordId,
                source_id: sourceId,
                source_record_id: typeof raw.source_record_id === "string" ? raw.source_record_id : null,
                canonical_fields: canonical,
                original_fields: originalFields,
                normalization_steps: changed
                    ? [{ step_id: `NS-${index}`, operation: "trim_string_fields", rule_version: "v1" }]
                    : [],
                warnings,
            };
        });
        const event = buildLineageEvent(deps, {
            stage: "NORMALIZE",
            operation: "records_normalized",
            inputReferences: context.rawRecords.map((_, index) => `RAW-${index}`),
            outputReferences: normalizedRecords.map((item) => item.record_id),
            details: { count: normalizedRecords.length },
        });
        return {
            ...context,
            normalizedRecords,
            lineage: [...context.lineage, event],
        };
    },
};
