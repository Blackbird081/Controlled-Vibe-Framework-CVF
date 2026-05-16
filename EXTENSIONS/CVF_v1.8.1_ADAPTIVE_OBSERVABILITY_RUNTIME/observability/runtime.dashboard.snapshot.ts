import {
  OBSERVABILITY_ALLOWED_ACTIONS,
  OBSERVABILITY_FORBIDDEN_INTERVENTIONS,
  type ObserveOnlyAction,
  type ForbiddenInterventionAction,
} from "./observe.only.signal.contract.js";

export type DashboardMode =
  | "READ_ONLY_MODE"
  | "CLI_TUI_MODE"
  | "WEB_UI_MODE"
  | "GOVERNED_ACTION_MODE";

export type DashboardSeverity =
  | "INFO"
  | "NOTICE"
  | "WARNING"
  | "HIGH"
  | "CRITICAL";

export type SessionStatus =
  | "STARTING"
  | "ACTIVE"
  | "IDLE"
  | "BLOCKED"
  | "WAITING_FOR_APPROVAL"
  | "ERROR"
  | "ENDED"
  | "UNKNOWN";

export type ContextWarningLevel =
  | "NORMAL"
  | "NOTICE"
  | "WARNING"
  | "HIGH"
  | "CRITICAL"
  | "UNKNOWN";

export type RateLimitStatus =
  | "NORMAL"
  | "NOTICE"
  | "WARNING"
  | "HIGH"
  | "CRITICAL"
  | "UNKNOWN";

export type ProcessStatus = "RUNNING" | "IDLE" | "EXITED" | "ORPHANED" | "UNKNOWN";
export type PortStatus = "OPEN" | "CLOSED" | "ORPHANED" | "UNKNOWN";
export type OrphanStatus = "TRUE" | "FALSE" | "UNKNOWN";

export interface SourceTaggedRecord {
  readonly source: string;
  readonly correlationId: string;
  readonly observedAt: string;
  readonly receiptId?: string;
}

export interface AgentSessionPanelRecord extends SourceTaggedRecord {
  readonly sessionId: string;
  readonly agentType: string;
  readonly provider: string;
  readonly projectPath: string;
  readonly workspaceId?: string;
  readonly status: SessionStatus;
  readonly startedAt: string;
  readonly lastActivityAt: string;
  readonly riskLevel: DashboardSeverity;
}

export interface TokenContextPanelRecord extends SourceTaggedRecord {
  readonly sessionId: string;
  readonly provider: string;
  readonly model: string;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly totalTokens: number | null;
  readonly contextWindowSize: number | null;
  readonly contextUsedPercent: number | null;
  readonly contextWarningLevel: ContextWarningLevel;
  readonly estimatedCost: number | null;
  readonly verifiedSource: boolean;
}

export interface RateLimitPanelRecord extends SourceTaggedRecord {
  readonly provider: string;
  readonly model: string;
  readonly requestLimitStatus: RateLimitStatus;
  readonly tokenLimitStatus: RateLimitStatus;
  readonly resetWindow: string | null;
  readonly quotaPressureLevel: RateLimitStatus;
}

export interface ProcessPanelRecord extends SourceTaggedRecord {
  readonly pid: number;
  readonly parentPid: number | null;
  readonly sessionId: string | null;
  readonly command: string;
  readonly cwd: string;
  readonly status: ProcessStatus;
  readonly childProcessCount: number;
  readonly riskLevel: DashboardSeverity;
}

export interface PortPanelRecord extends SourceTaggedRecord {
  readonly port: number;
  readonly protocol: string;
  readonly pid: number | null;
  readonly sessionId: string | null;
  readonly status: PortStatus;
  readonly ownerProcess: string;
  readonly orphanStatus: OrphanStatus;
  readonly riskLevel: DashboardSeverity;
}

export interface DashboardAlert extends SourceTaggedRecord {
  readonly alertId: string;
  readonly severity: DashboardSeverity;
  readonly eventType: string;
  readonly message: string;
  readonly recommendedAction: string;
  readonly policyRequired: boolean;
  readonly createdAt: string;
}

export interface DashboardEvent extends SourceTaggedRecord {
  readonly eventId: string;
  readonly eventType: string;
  readonly severity: DashboardSeverity;
  readonly category: string;
  readonly policyRequired: boolean;
  readonly payload: Record<string, string | number | boolean | null>;
  readonly createdAt: string;
}

export interface RuntimeDashboardSnapshot {
  readonly mode: DashboardMode;
  readonly generatedAt: string;
  readonly refreshPolicy: {
    readonly defaultRefreshIntervalMs: number;
    readonly minimumRefreshIntervalMs: number;
    readonly maximumRefreshIntervalMs: number;
    readonly readOnlySafe: true;
  };
  readonly panels: {
    readonly sessions: readonly AgentSessionPanelRecord[];
    readonly tokenContext: readonly TokenContextPanelRecord[];
    readonly rateLimits: readonly RateLimitPanelRecord[];
    readonly processes: readonly ProcessPanelRecord[];
    readonly ports: readonly PortPanelRecord[];
    readonly alerts: readonly DashboardAlert[];
    readonly events: readonly DashboardEvent[];
  };
  readonly summary: {
    readonly activeSessions: number;
    readonly alertsBySeverity: Record<DashboardSeverity, number>;
    readonly highestSeverity: DashboardSeverity;
    readonly policyRequiredCount: number;
  };
  readonly allowedActions: readonly ObserveOnlyAction[];
  readonly blockedInterventions: readonly ForbiddenInterventionAction[];
  readonly claimBoundary: string;
}

export interface RuntimeDashboardInput {
  readonly mode?: DashboardMode;
  readonly generatedAt: string;
  readonly sessions?: readonly AgentSessionPanelRecord[];
  readonly tokenContext?: readonly TokenContextPanelRecord[];
  readonly rateLimits?: readonly RateLimitPanelRecord[];
  readonly processes?: readonly ProcessPanelRecord[];
  readonly ports?: readonly PortPanelRecord[];
  readonly events?: readonly DashboardEvent[];
}

const DEFAULT_REFRESH_POLICY = {
  defaultRefreshIntervalMs: 2_000,
  minimumRefreshIntervalMs: 1_000,
  maximumRefreshIntervalMs: 30_000,
  readOnlySafe: true as const,
};

const EMPTY_SEVERITY_COUNTS: Record<DashboardSeverity, number> = {
  INFO: 0,
  NOTICE: 0,
  WARNING: 0,
  HIGH: 0,
  CRITICAL: 0,
};

export function buildRuntimeDashboardSnapshot(
  input: RuntimeDashboardInput,
): RuntimeDashboardSnapshot {
  const sessions = input.sessions ?? [];
  const tokenContext = input.tokenContext ?? [];
  const rateLimits = input.rateLimits ?? [];
  const processes = input.processes ?? [];
  const ports = input.ports ?? [];
  const generatedEvents = [
    ...sessions.map((record) => eventFromSession(record, input.generatedAt)),
    ...tokenContext.flatMap((record) => eventsFromTokenContext(record, input.generatedAt)),
    ...rateLimits.flatMap((record) => eventsFromRateLimit(record, input.generatedAt)),
    ...processes.flatMap((record) => eventsFromProcess(record, input.generatedAt)),
    ...ports.flatMap((record) => eventsFromPort(record, input.generatedAt)),
  ];
  const events = [...generatedEvents, ...(input.events ?? [])];
  const alerts = events
    .filter((event) => severityRank(event.severity) >= severityRank("NOTICE"))
    .map((event) => alertFromEvent(event));
  const counts = alerts.reduce(
    (acc, alert) => {
      acc[alert.severity] += 1;
      return acc;
    },
    { ...EMPTY_SEVERITY_COUNTS },
  );
  const highestSeverity = alerts.reduce(
    (highest, alert) =>
      severityRank(alert.severity) > severityRank(highest) ? alert.severity : highest,
    "INFO" as DashboardSeverity,
  );

  return {
    mode: input.mode ?? "READ_ONLY_MODE",
    generatedAt: input.generatedAt,
    refreshPolicy: DEFAULT_REFRESH_POLICY,
    panels: {
      sessions,
      tokenContext,
      rateLimits,
      processes,
      ports,
      alerts,
      events,
    },
    summary: {
      activeSessions: sessions.filter((session) => session.status === "ACTIVE").length,
      alertsBySeverity: counts,
      highestSeverity,
      policyRequiredCount: alerts.filter((alert) => alert.policyRequired).length,
    },
    allowedActions: OBSERVABILITY_ALLOWED_ACTIONS,
    blockedInterventions: OBSERVABILITY_FORBIDDEN_INTERVENTIONS,
    claimBoundary:
      "Observability sees and explains runtime state; governance decides and execution acts only after authorization.",
  };
}

function eventFromSession(
  record: AgentSessionPanelRecord,
  createdAt: string,
): DashboardEvent {
  const severity = record.riskLevel === "INFO" ? "INFO" : record.riskLevel;
  return buildEvent({
    source: record.source,
    correlationId: record.correlationId,
    sessionId: record.sessionId,
    eventType: `SESSION_${record.status}`,
    severity,
    category: "SESSION_EVENT",
    policyRequired: severityRank(severity) >= severityRank("HIGH"),
    createdAt,
    payload: {
      agentType: record.agentType,
      provider: record.provider,
      status: record.status,
    },
  });
}

function eventsFromTokenContext(
  record: TokenContextPanelRecord,
  createdAt: string,
): readonly DashboardEvent[] {
  if (record.contextWarningLevel === "NORMAL") {
    return [
      buildEvent({
        source: record.source,
        correlationId: record.correlationId,
        sessionId: record.sessionId,
        eventType: "TOKEN_USAGE_UPDATED",
        severity: "INFO",
        category: "TOKEN_EVENT",
        policyRequired: false,
        createdAt,
        payload: {
          provider: record.provider,
          model: record.model,
          contextUsedPercent: record.contextUsedPercent,
          verifiedSource: record.verifiedSource,
        },
      }),
    ];
  }

  const severity = severityFromWarning(record.contextWarningLevel);
  return [
    buildEvent({
      source: record.source,
      correlationId: record.correlationId,
      sessionId: record.sessionId,
      eventType:
        record.contextWarningLevel === "UNKNOWN"
          ? "CONTEXT_USAGE_UNAVAILABLE"
          : `CONTEXT_WINDOW_${record.contextWarningLevel}`,
      severity,
      category: "TOKEN_EVENT",
      policyRequired: severityRank(severity) >= severityRank("HIGH"),
      createdAt,
      payload: {
        provider: record.provider,
        model: record.model,
        contextUsedPercent: record.contextUsedPercent,
        verifiedSource: record.verifiedSource,
      },
    }),
  ];
}

function eventsFromRateLimit(
  record: RateLimitPanelRecord,
  createdAt: string,
): readonly DashboardEvent[] {
  const severity = severityFromWarning(record.quotaPressureLevel);
  const eventType =
    record.quotaPressureLevel === "NORMAL"
      ? "RATE_LIMIT_UPDATED"
      : record.quotaPressureLevel === "UNKNOWN"
        ? "RATE_LIMIT_UNKNOWN"
        : `RATE_LIMIT_${record.quotaPressureLevel}`;

  return [
    buildEvent({
      source: record.source,
      correlationId: record.correlationId,
      eventType,
      severity,
      category: "RATE_LIMIT_EVENT",
      policyRequired: severityRank(severity) >= severityRank("HIGH"),
      createdAt,
      payload: {
        provider: record.provider,
        model: record.model,
        quotaPressureLevel: record.quotaPressureLevel,
      },
    }),
  ];
}

function eventsFromProcess(
  record: ProcessPanelRecord,
  createdAt: string,
): readonly DashboardEvent[] {
  if (record.riskLevel === "INFO") return [];

  return [
    buildEvent({
      source: record.source,
      correlationId: record.correlationId,
      sessionId: record.sessionId ?? undefined,
      eventType: record.status === "ORPHANED" ? "PROCESS_ORPHANED" : "PROCESS_ATTENTION",
      severity: record.riskLevel,
      category: "PROCESS_EVENT",
      policyRequired: severityRank(record.riskLevel) >= severityRank("HIGH"),
      createdAt,
      payload: {
        pid: record.pid,
        status: record.status,
        command: record.command,
      },
    }),
  ];
}

function eventsFromPort(
  record: PortPanelRecord,
  createdAt: string,
): readonly DashboardEvent[] {
  if (record.riskLevel === "INFO") return [];

  return [
    buildEvent({
      source: record.source,
      correlationId: record.correlationId,
      sessionId: record.sessionId ?? undefined,
      eventType: record.orphanStatus === "TRUE" ? "PORT_ORPHANED" : "PORT_ATTENTION",
      severity: record.riskLevel,
      category: "PORT_EVENT",
      policyRequired: severityRank(record.riskLevel) >= severityRank("WARNING"),
      createdAt,
      payload: {
        port: record.port,
        protocol: record.protocol,
        pid: record.pid,
        orphanStatus: record.orphanStatus,
      },
    }),
  ];
}

function alertFromEvent(event: DashboardEvent): DashboardAlert {
  const receiptId =
    severityRank(event.severity) >= severityRank("HIGH")
      ? stableId("obs-receipt", event.eventId)
      : event.receiptId;

  return {
    alertId: stableId("obs-alert", event.eventId),
    severity: event.severity,
    source: event.source,
    message: messageForEvent(event),
    recommendedAction: recommendedActionForEvent(event),
    policyRequired: event.policyRequired,
    createdAt: event.createdAt,
    correlationId: event.correlationId,
    observedAt: event.observedAt,
    receiptId,
    eventType: event.eventType,
  };
}

function messageForEvent(event: DashboardEvent): string {
  if (event.eventType === "CONTEXT_USAGE_UNAVAILABLE") {
    return "No verified token metadata is available for this runtime view.";
  }
  if (event.eventType.startsWith("CONTEXT_WINDOW")) {
    return "Context window pressure needs operator attention.";
  }
  if (event.eventType.startsWith("RATE_LIMIT")) {
    return "Provider quota or rate-limit pressure needs attention.";
  }
  if (event.eventType === "PROCESS_ORPHANED") {
    return "A runtime process appears to be orphaned.";
  }
  if (event.eventType === "PORT_ORPHANED") {
    return "An open port appears to be orphaned.";
  }
  if (event.eventType.startsWith("SESSION")) {
    return "Runtime session state changed.";
  }
  return "Runtime signal recorded.";
}

function recommendedActionForEvent(event: DashboardEvent): string {
  if (event.policyRequired) return "Request governed review before taking action.";
  if (event.eventType === "CONTEXT_USAGE_UNAVAILABLE") {
    return "Run a governed workflow to create verified receipts.";
  }
  return "Review the source and receipt before deciding next steps.";
}

function buildEvent(input: {
  readonly source: string;
  readonly correlationId: string;
  readonly sessionId?: string;
  readonly eventType: string;
  readonly severity: DashboardSeverity;
  readonly category: string;
  readonly policyRequired: boolean;
  readonly createdAt: string;
  readonly payload: Record<string, string | number | boolean | null>;
}): DashboardEvent {
  const eventId = stableId(
    "obs-event",
    input.source,
    input.correlationId,
    input.eventType,
    input.severity,
  );

  return {
    eventId,
    eventType: input.eventType,
    source: input.source,
    severity: input.severity,
    category: input.category,
    policyRequired: input.policyRequired,
    payload: input.payload,
    createdAt: input.createdAt,
    correlationId: input.correlationId,
    observedAt: input.createdAt,
    receiptId:
      severityRank(input.severity) >= severityRank("HIGH")
        ? stableId("obs-receipt", eventId)
        : undefined,
  };
}

function severityFromWarning(warning: ContextWarningLevel | RateLimitStatus): DashboardSeverity {
  if (warning === "CRITICAL") return "CRITICAL";
  if (warning === "HIGH") return "HIGH";
  if (warning === "WARNING") return "WARNING";
  if (warning === "NOTICE" || warning === "UNKNOWN") return "NOTICE";
  return "INFO";
}

function severityRank(severity: DashboardSeverity): number {
  const rank: Record<DashboardSeverity, number> = {
    INFO: 0,
    NOTICE: 1,
    WARNING: 2,
    HIGH: 3,
    CRITICAL: 4,
  };
  return rank[severity];
}

function stableId(prefix: string, ...parts: readonly string[]): string {
  return `${prefix}-${parts.join("-").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase()}`;
}
