import { buildLineageEvent } from "../pipeline/stage.js";
/**
 * Proves that every output produced so far (normalized records, duplicate
 * groups, conflict sets) has at least one lineage event referencing it.
 * Required for READY_FOR_KERNEL eligibility (T2 invariant: incomplete
 * lineage/integrity blocks Kernel-ready status).
 */
export function lineageIsComplete(context) {
    const expectedOutputs = new Set([
        ...context.normalizedRecords.map((item) => item.record_id),
        ...context.duplicateGroups.map((item) => item.duplicate_group_id),
        ...context.conflictSets.map((item) => item.conflict_set_id),
    ]);
    const producedOutputs = new Set(context.lineage.flatMap((event) => event.output_references));
    for (const output of expectedOutputs) {
        if (!producedOutputs.has(output))
            return false;
    }
    return true;
}
export const lineageStage = {
    id: "lineage",
    lineageStage: "LINEAGE",
    run(context, deps) {
        const complete = lineageIsComplete(context);
        const event = buildLineageEvent(deps, {
            stage: "LINEAGE",
            operation: "lineage_completeness_checked",
            inputReferences: context.lineage.map((item) => item.lineage_event_id),
            outputReferences: [],
            details: { lineage_complete: complete },
        });
        return {
            ...context,
            lineage: [...context.lineage, event],
        };
    },
};
