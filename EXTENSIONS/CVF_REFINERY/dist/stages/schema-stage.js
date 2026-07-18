import { buildLineageEvent } from "../pipeline/stage.js";
import { missingSourceIdentityFields } from "./intake-stage.js";
export function computeSchemaValid(context) {
    if (missingSourceIdentityFields(context).length > 0)
        return false;
    if (!context.ruleManifest.manifest_id || !context.ruleManifest.version)
        return false;
    if (!context.declaredScope.organization)
        return false;
    if (!context.declaredOwner)
        return false;
    for (const record of context.normalizedRecords) {
        if (!record.record_id || !record.source_id)
            return false;
    }
    return true;
}
export const schemaStage = {
    id: "schema",
    lineageStage: "SCHEMA",
    run(context, deps) {
        const schemaValid = computeSchemaValid(context);
        const event = buildLineageEvent(deps, {
            stage: "SCHEMA",
            operation: "schema_validated",
            inputReferences: context.sourceEnvelopes.map((item) => item.source_id),
            outputReferences: context.normalizedRecords.map((item) => item.record_id),
            details: { schema_valid: schemaValid },
        });
        return {
            ...context,
            schemaValid,
            lineage: [...context.lineage, event],
        };
    },
};
