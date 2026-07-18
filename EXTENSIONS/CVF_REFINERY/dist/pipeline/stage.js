export function buildLineageEvent(deps, fields) {
    return {
        lineage_event_id: deps.ids.nextId("LE"),
        stage: fields.stage,
        operation: fields.operation,
        input_references: [...fields.inputReferences],
        output_references: [...fields.outputReferences],
        rule_id: fields.ruleId ?? null,
        rule_version: fields.ruleVersion ?? null,
        performed_at_utc: deps.clock.nowUtcIso(),
        performed_by: "cvf-refinery",
        details: fields.details ? structuredClone(fields.details) : {},
    };
}
