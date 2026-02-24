// lib/storage/sessionSerializer.ts
/**
 * Serialize / Deserialize SessionManager state for persistence.
 */
import type {
    SessionInfo,
    SessionState,
    GovernanceEvent,
    SessionStatus,
} from "@/lib/sessionManager";

export interface SerializedSession {
    version: string;
    sessionInfo: SessionInfo;
    state: SessionState;
    events: GovernanceEvent[];
    status: SessionStatus;
}

export interface SessionSummary {
    sessionId: string;
    profile: string;
    startedAt: number;
    status: SessionStatus;
    eventCount: number;
    rLevel: string;
    phase: string;
}

export function serializeSession(
    sessionInfo: SessionInfo,
    state: SessionState,
    events: GovernanceEvent[],
    status: SessionStatus
): SerializedSession {
    return {
        version: "cvf-session-v2",
        sessionInfo: { ...sessionInfo },
        state: { ...state },
        events: events.map((e) => ({ ...e })),
        status,
    };
}

export function toSessionSummary(data: SerializedSession): SessionSummary {
    return {
        sessionId: data.sessionInfo.sessionId,
        profile: data.sessionInfo.profile,
        startedAt: data.sessionInfo.startedAt,
        status: data.status,
        eventCount: data.events.length,
        rLevel: data.state.rLevel,
        phase: data.state.phase,
    };
}
