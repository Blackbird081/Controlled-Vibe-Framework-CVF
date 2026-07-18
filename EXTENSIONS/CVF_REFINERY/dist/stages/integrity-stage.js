import { createHash } from "node:crypto";
import { buildLineageEvent } from "../pipeline/stage.js";
function canonicalRecordsForSource(context, sourceId) {
    return context.rawRecords.filter((record) => record.source_id === sourceId);
}
/** Deterministic content hash: SHA-256 over stably key-sorted JSON. No randomness or wall-clock input. */
export function computeContentHash(records) {
    const sorted = records.map((record) => {
        const keys = Object.keys(record).sort();
        return keys.map((key) => [key, record[key]]);
    });
    return `sha256:${createHash("sha256").update(JSON.stringify(sorted)).digest("hex")}`;
}
export const integrityStage = {
    id: "integrity",
    lineageStage: "INTEGRITY",
    run(context, deps) {
        const results = context.sourceEnvelopes.map((envelope) => {
            const records = canonicalRecordsForSource(context, envelope.source_id);
            const actualHash = computeContentHash(records);
            const pass = actualHash === envelope.content_hash;
            return {
                source_id: envelope.source_id,
                status: pass ? "PASS" : "FAIL",
                expected_hash: envelope.content_hash,
                actual_hash: actualHash,
                failure_token: pass ? null : "INTEGRITY_CHECK_FAILED",
            };
        });
        const event = buildLineageEvent(deps, {
            stage: "INTEGRITY",
            operation: "integrity_checked",
            inputReferences: context.sourceEnvelopes.map((item) => item.source_id),
            outputReferences: results.map((item) => item.source_id),
            details: {
                pass_count: results.filter((item) => item.status === "PASS").length,
                fail_count: results.filter((item) => item.status === "FAIL").length,
            },
        });
        return {
            ...context,
            integrityResults: results,
            lineage: [...context.lineage, event],
        };
    },
};
