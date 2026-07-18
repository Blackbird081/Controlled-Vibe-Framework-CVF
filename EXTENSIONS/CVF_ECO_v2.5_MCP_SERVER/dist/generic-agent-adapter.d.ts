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
export declare const GENERIC_AGENT_ADAPTER_VERSION = "cvf.genericAgentAdapter.is1.v1";
export type AgentEventType = "INTENT" | "PLAN" | "TOOL_CALL" | "EXECUTION" | "RESULT";
export type ControlPoint = "CP1_INTENT" | "CP2_PLAN" | "CP3_TOOL" | "CP4_RUNTIME" | "CP5_RESULT";
export type ControlPointStatus = "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY";
export declare const CONTROL_POINT_COVERAGE: Record<ControlPoint, ControlPointStatus>;
export interface AgentFrameworkEvent {
    eventId: string;
    eventType: AgentEventType;
    agentId: string;
    frameworkName: string;
    payload: Record<string, unknown>;
    timestamp: string;
}
export interface AdapterMappingResult {
    contractVersion: typeof GENERIC_AGENT_ADAPTER_VERSION;
    eventId: string;
    eventType: AgentEventType;
    controlPoint: ControlPoint;
    controlPointStatus: ControlPointStatus;
    cvfIntakeRoute: string;
    advisoryAction: string;
    requiresGovernanceCheck: boolean;
    runtimeAdapterAuthorized: false;
}
/**
 * Maps an external agent framework event to a CVF governance intake advisory.
 *
 * Returns the control point, CVF intake route, and advisory action for the caller.
 * Does not execute the governance check — that is the responsibility of the caller
 * routing to the CVF owner surface.
 */
export declare function mapAgentEventToCvf(event: AgentFrameworkEvent): AdapterMappingResult;
/**
 * Maps all events in a batch, returning one AdapterMappingResult per event.
 */
export declare function mapAgentEventBatch(events: AgentFrameworkEvent[]): AdapterMappingResult[];
//# sourceMappingURL=generic-agent-adapter.d.ts.map