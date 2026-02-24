"use client";

import { GovernanceEvent, SessionInfo, SessionState } from "@/lib/sessionManager";

interface Props {
  sessionInfo: SessionInfo;
  finalState: SessionState;
  events: GovernanceEvent[];
}

export default function GovernanceExportButton({
  sessionInfo,
  finalState,
  events,
}: Props) {
  const handleExport = () => {
    const exportPayload = {
      exportSchema: "cvf-audit-v1",
      exportedAt: new Date().toISOString(),
      sessionInfo,
      finalState,
      events,
    };

    const dataStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `cvf-audit-${sessionInfo.sessionId}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
    >
      Export Full Governance Record (JSON)
    </button>
  );
}

