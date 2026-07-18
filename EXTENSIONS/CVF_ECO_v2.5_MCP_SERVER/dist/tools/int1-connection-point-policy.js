export const INT1_CONTRACT = 'cvf.genericMcpAdapter.int1.v1';
export const INT1_ALLOWED_EVENT_TYPES = new Set([
    'intent.received',
    'plan.created',
    'tool.requested',
    'execution.state',
    'result.produced',
]);
const INT1_FORBIDDEN_PLAN_PATTERNS = [
    'delete_all',
    'drop_database',
    'rm -rf',
    'format_disk',
];
function resolveConnectionPointMode(mode) {
    if (mode === 'advisory' || mode === 'enforce') {
        return { mode };
    }
    if (typeof mode === 'string' && mode.trim().length > 0) {
        return {
            mode: 'advisory',
            modeWarning: `invalid_connection_point_mode: "${mode}". Fallback to advisory.`,
        };
    }
    return { mode: 'advisory' };
}
function buildConnectionPointProgressionDecision(advisoryDecision, mode, modeWarning) {
    if (mode === 'advisory') {
        return {
            mode,
            advisoryDecision,
            progressionDisposition: 'ADVISORY_ONLY',
            acceptedForProgression: false,
            requiresReview: advisoryDecision === 'REVIEW_RECOMMENDED',
            blocked: false,
            reason: 'advisory_mode',
            modeWarning,
        };
    }
    if (advisoryDecision === 'ALLOW_ADVISORY') {
        return {
            mode,
            advisoryDecision,
            progressionDisposition: 'ALLOW_PROGRESSION',
            acceptedForProgression: true,
            requiresReview: false,
            blocked: false,
            reason: 'enforce_mode_allow',
            modeWarning,
        };
    }
    if (advisoryDecision === 'REVIEW_RECOMMENDED') {
        return {
            mode,
            advisoryDecision,
            progressionDisposition: 'REVIEW_HOLD',
            acceptedForProgression: false,
            requiresReview: true,
            blocked: false,
            reason: 'enforce_mode_review_hold',
            modeWarning,
        };
    }
    return {
        mode,
        advisoryDecision,
        progressionDisposition: 'REJECT_BLOCK',
        acceptedForProgression: false,
        requiresReview: false,
        blocked: true,
        reason: 'enforce_mode_reject_block',
        modeWarning,
    };
}
export function validateInt1Plan(args) {
    const { mode, modeWarning } = resolveConnectionPointMode(args.connectionPointMode);
    const forbiddenStepsDetected = args.planSteps.filter(step => INT1_FORBIDDEN_PLAN_PATTERNS.some(pattern => step.toLowerCase().includes(pattern)));
    const riskScore = Math.min(args.planSteps.length * 0.1 + args.toolsRequired.length * 0.2, 3.0);
    const advisoryDecision = forbiddenStepsDetected.length > 0
        ? 'REJECT_ADVISORY'
        : riskScore > 2.0
            ? 'REVIEW_RECOMMENDED'
            : 'ALLOW_ADVISORY';
    const connectionPointProgression = buildConnectionPointProgressionDecision(advisoryDecision, mode, modeWarning);
    return {
        contractVersion: INT1_CONTRACT,
        tool: 'cvf_validate_plan',
        connectionPointMode: mode,
        connectionPointProgression,
        advisoryDecision,
        planRisk: riskScore.toFixed(2),
        forbiddenStepsDetected,
        stepCount: args.planSteps.length,
        toolCount: args.toolsRequired.length,
        runtimeExecutionAuthorized: false,
        evaluatedAt: new Date().toISOString(),
    };
}
export function emitInt1AgentEvent(args) {
    if (!INT1_ALLOWED_EVENT_TYPES.has(args.eventType)) {
        return {
            contractVersion: INT1_CONTRACT,
            tool: 'cvf_emit_agent_event',
            accepted: false,
            eventType: args.eventType,
            rejectionReason: `unsupported_event_type: "${args.eventType}" not in [${[...INT1_ALLOWED_EVENT_TYPES].join(', ')}]`,
            emittedAt: new Date().toISOString(),
        };
    }
    return {
        contractVersion: INT1_CONTRACT,
        tool: 'cvf_emit_agent_event',
        accepted: true,
        eventType: args.eventType,
        eventId: `int1-evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        agentId: args.agentId,
        runtimeExecutionAuthorized: false,
        emittedAt: new Date().toISOString(),
    };
}
//# sourceMappingURL=int1-connection-point-policy.js.map