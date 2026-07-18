/**
 * CVF Generic Agent Adapter (IS1)
 *
 * Maps framework-agnostic agent events to CVF governance control point advisories.
 * Per LHW18 T2: frameworks call IN to CVF — not the reverse.
 * Per LHW19 T1: 5 control points (CP1-CP5) define the integration boundary.
 *
 * This adapter is advisory only — it does not execute governance checks or
 * spawn agent processes. `runtimeAdapterAuthorized: false` always.
 */
export const GENERIC_AGENT_ADAPTER_VERSION = "cvf.genericAgentAdapter.is1.v1";
export const CONTROL_POINT_COVERAGE = {
    CP1_INTENT: "IMPLEMENTED",
    CP2_PLAN: "PARTIAL",
    CP3_TOOL: "IMPLEMENTED",
    CP4_RUNTIME: "IMPLEMENTED",
    CP5_RESULT: "IMPLEMENTED",
};
// ─── Event → Control Point mapping ───────────────────────────────────────────
function resolveControlPoint(eventType) {
    switch (eventType) {
        case "INTENT": return "CP1_INTENT";
        case "PLAN": return "CP2_PLAN";
        case "TOOL_CALL": return "CP3_TOOL";
        case "EXECUTION": return "CP4_RUNTIME";
        case "RESULT": return "CP5_RESULT";
    }
}
function resolveCvfIntakeRoute(cp) {
    switch (cp) {
        case "CP1_INTENT": return "CVF_ECO_v1.0_INTENT_VALIDATION → /api/execute intake";
        case "CP2_PLAN": return "CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL → cvf_advance_pipeline_stage";
        case "CP3_TOOL": return "CVF_ECO_v2.5_MCP_SERVER → cvf_invoke_cli_stage (whitelist)";
        case "CP4_RUNTIME": return "EL-2 worker-timeout-handler + EL-3 reviewer-deadlock-handler";
        case "CP5_RESULT": return "CVF_GUARD_CONTRACT → GovernanceEvidenceReceipt decision field";
    }
}
function resolveAdvisoryAction(cp, status) {
    if (status === "IMPLEMENTED") {
        return `Route event through ${cp} — CVF owner surface active.`;
    }
    if (status === "PARTIAL") {
        return `Route event through ${cp} — partial coverage. Plan risk evaluation advisory only; full gate requires separate tranche.`;
    }
    return `Route event through ${cp} — advisory only. Implementation tranche required before enforcement.`;
}
// ─── Adapter function ─────────────────────────────────────────────────────────
/**
 * Maps an external agent framework event to a CVF governance intake advisory.
 *
 * Returns the control point, CVF intake route, and advisory action for the caller.
 * Does not execute the governance check — that is the responsibility of the caller
 * routing to the CVF owner surface.
 */
export function mapAgentEventToCvf(event) {
    const cp = resolveControlPoint(event.eventType);
    const status = CONTROL_POINT_COVERAGE[cp];
    const cvfIntakeRoute = resolveCvfIntakeRoute(cp);
    const advisoryAction = resolveAdvisoryAction(cp, status);
    return {
        contractVersion: GENERIC_AGENT_ADAPTER_VERSION,
        eventId: event.eventId,
        eventType: event.eventType,
        controlPoint: cp,
        controlPointStatus: status,
        cvfIntakeRoute,
        advisoryAction,
        requiresGovernanceCheck: true,
        runtimeAdapterAuthorized: false,
    };
}
/**
 * Maps all events in a batch, returning one AdapterMappingResult per event.
 */
export function mapAgentEventBatch(events) {
    return events.map(mapAgentEventToCvf);
}
//# sourceMappingURL=generic-agent-adapter.js.map