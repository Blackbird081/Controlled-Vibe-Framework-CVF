"use client";

import { GovernanceEvent } from "@/lib/sessionManager";

interface Props {
  event: GovernanceEvent;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

function getEventLabel(type: GovernanceEvent["type"]) {
  switch (type) {
    case "PHASE_CHANGED":
      return "Phase Changed";
    case "RISK_UPDATED":
      return "Risk Level Updated";
    case "AUTONOMY_ADJUSTED":
      return "Autonomy Adjusted";
    case "ESCALATED":
      return "Escalation Triggered";
    case "REQUIRES_HUMAN":
      return "Human Approval Required";
    case "HARD_STOP":
      return "AI Hard Stopped";
    case "STEP_ADVANCED":
      return "Step Advanced";
    case "SESSION_FROZEN":
      return "Session Frozen";
    default:
      return type;
  }
}

function getSeverity(type: GovernanceEvent["type"]) {
  if (type === "HARD_STOP" || type === "SESSION_FROZEN") {
    return { label: "Critical", badgeClass: "bg-red-600 text-white", borderClass: "border-red-300" };
  }
  if (type === "ESCALATED" || type === "REQUIRES_HUMAN") {
    return { label: "Warning", badgeClass: "bg-amber-500 text-white", borderClass: "border-amber-300" };
  }
  return { label: "Info", badgeClass: "bg-gray-500 text-white", borderClass: "border-gray-200" };
}

export default function GovernanceEventItem({ event }: Props) {
  const severity = getSeverity(event.type);

  return (
    <div className={`border ${severity.borderClass} rounded-lg p-3 mb-2 bg-white`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">
          {getEventLabel(event.type)}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${severity.badgeClass}`}>
          {severity.label}
        </span>
      </div>

      <div className="text-xs text-gray-500 mt-1">
        Time: {formatTime(event.timestamp)}
      </div>

      <div className="text-xs text-gray-600 mt-1.5">
        Step: {event.step} | Phase: {event.phase} | Risk: {event.rLevel} | Autonomy: {event.autonomy}
      </div>

      {event.metadata && (
        <pre className="mt-1.5 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
          {JSON.stringify(event.metadata, null, 2)}
        </pre>
      )}
    </div>
  );
}