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

// ─── Event Types (from LHW19 T2 Event Model advisory) ────────────────────────

export type AgentEventType =
  | "INTENT"      // CP1 — user intent submitted
  | "PLAN"        // CP2 — agent plan generated
  | "TOOL_CALL"   // CP3 — tool invocation requested
  | "EXECUTION"   // CP4 — execution runtime event
  | "RESULT";     // CP5 — final output produced

// ─── Control Point Map ────────────────────────────────────────────────────────

export type ControlPoint = "CP1_INTENT" | "CP2_PLAN" | "CP3_TOOL" | "CP4_RUNTIME" | "CP5_RESULT";

export type ControlPointStatus = "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY";

export const CONTROL_POINT_COVERAGE: Record<ControlPoint, ControlPointStatus> = {
  CP1_INTENT:   "IMPLEMENTED",
  CP2_PLAN:     "PARTIAL",
  CP3_TOOL:     "IMPLEMENTED",
  CP4_RUNTIME:  "IMPLEMENTED",
  CP5_RESULT:   "IMPLEMENTED",
} as const;

// ─── Input / Output ───────────────────────────────────────────────────────────

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

// ─── Event → Control Point mapping ───────────────────────────────────────────

function resolveControlPoint(eventType: AgentEventType): ControlPoint {
  switch (eventType) {
    case "INTENT":    return "CP1_INTENT";
    case "PLAN":      return "CP2_PLAN";
    case "TOOL_CALL": return "CP3_TOOL";
    case "EXECUTION": return "CP4_RUNTIME";
    case "RESULT":    return "CP5_RESULT";
  }
}

function resolveCvfIntakeRoute(cp: ControlPoint): string {
  switch (cp) {
    case "CP1_INTENT":   return "CVF_ECO_v1.0_INTENT_VALIDATION → /api/execute intake";
    case "CP2_PLAN":     return "CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL → cvf_advance_pipeline_stage";
    case "CP3_TOOL":     return "CVF_ECO_v2.5_MCP_SERVER → cvf_invoke_cli_stage (whitelist)";
    case "CP4_RUNTIME":  return "EL-2 worker-timeout-handler + EL-3 reviewer-deadlock-handler";
    case "CP5_RESULT":   return "CVF_GUARD_CONTRACT → GovernanceEvidenceReceipt decision field";
  }
}

function resolveAdvisoryAction(cp: ControlPoint, status: ControlPointStatus): string {
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
export function mapAgentEventToCvf(event: AgentFrameworkEvent): AdapterMappingResult {
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
export function mapAgentEventBatch(
  events: AgentFrameworkEvent[],
): AdapterMappingResult[] {
  return events.map(mapAgentEventToCvf);
}
