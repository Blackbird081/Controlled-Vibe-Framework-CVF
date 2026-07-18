import { buildLineageEvent } from "../pipeline/stage.js";
function scopeKeyFor(scope) {
    return JSON.stringify({
        organization: scope.organization,
        country: scope.country ?? null,
        project: scope.project ?? null,
        customer: scope.customer ?? null,
    });
}
const DISTANT_PAST = -8640000000000000;
const DISTANT_FUTURE = 8640000000000000;
function windowsOverlap(aFrom, aUntil, bFrom, bUntil) {
    const af = aFrom ? Date.parse(aFrom) : DISTANT_PAST;
    const au = aUntil ? Date.parse(aUntil) : DISTANT_FUTURE;
    const bf = bFrom ? Date.parse(bFrom) : DISTANT_PAST;
    const bu = bUntil ? Date.parse(bUntil) : DISTANT_FUTURE;
    return af < bu && bf < au;
}
export const conflictStage = {
    id: "conflict",
    lineageStage: "CONFLICT",
    run(context, deps) {
        const bySource = new Map(context.sourceEnvelopes.map((item) => [item.source_id, item]));
        const groupsByScopeField = new Map();
        for (const record of context.normalizedRecords) {
            const envelope = bySource.get(record.source_id);
            if (!envelope)
                continue;
            const scopeKey = scopeKeyFor(envelope.scope);
            for (const [field, value] of Object.entries(record.canonical_fields)) {
                if (value === undefined)
                    continue;
                const key = `${scopeKey}::${field}`;
                const candidate = {
                    record_id: record.record_id,
                    source_id: record.source_id,
                    value,
                    valid_from_utc: envelope.valid_from_utc ?? null,
                    valid_until_utc: envelope.valid_until_utc ?? null,
                };
                const list = groupsByScopeField.get(key) ?? [];
                list.push(candidate);
                groupsByScopeField.set(key, list);
            }
        }
        const conflictSets = [];
        for (const [key, candidates] of groupsByScopeField) {
            const [scopeKey, field] = key.split("::");
            const uniqueValues = new Set(candidates.map((item) => JSON.stringify(item.value)));
            if (uniqueValues.size < 2)
                continue;
            const hasOverlap = candidates.some((a, index) => candidates
                .slice(index + 1)
                .some((b) => windowsOverlap(a.valid_from_utc, a.valid_until_utc, b.valid_from_utc, b.valid_until_utc)));
            if (!hasOverlap)
                continue;
            conflictSets.push({
                conflict_set_id: deps.ids.nextId("CS"),
                field,
                scope_key: scopeKey,
                candidates: candidates.map((item) => structuredClone(item)),
                resolution_status: "UNRESOLVED",
                resolution_reference: null,
            });
        }
        const event = buildLineageEvent(deps, {
            stage: "CONFLICT",
            operation: "conflict_sets_evaluated",
            inputReferences: context.normalizedRecords.map((item) => item.record_id),
            outputReferences: conflictSets.map((item) => item.conflict_set_id),
            details: { conflict_set_count: conflictSets.length },
        });
        return {
            ...context,
            conflictSets,
            lineage: [...context.lineage, event],
        };
    },
};
