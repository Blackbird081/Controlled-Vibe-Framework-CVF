"use client";

import { useGovernanceSession } from "@/hooks/useGovernanceSession";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Phase } from "@/lib/sessionManager";
import { RLevel, StrategyProfileName } from "@/lib/strategy/governanceStrategy.types";
import Link from "next/link";

import TrustIndicator from "@/components/governance/TrustIndicator";
import AutonomyStatusBadge from "@/components/governance/AutonomyStatusBadge";
import GovernanceActionPrompt from "@/components/governance/GovernanceActionPrompt";
import PhaseIndicator from "@/components/governance/PhaseIndicator";
import PhasePermissionNotice from "@/components/governance/PhasePermissionNotice";
import GovernanceProfileSelector from "@/components/governance/GovernanceProfileSelector";
import GovernanceTimeline from "@/components/governance/GovernanceTimeline";
import GovernanceExportButton from "@/components/governance/GovernanceExportButton";
import GovernancePDFExport from "@/components/governance/GovernancePDFExport";
import DarkModeToggle from "@/components/governance/DarkModeToggle";
import AutonomyChart from "@/components/governance/AutonomyChart";
import StrategyComparisonTable from "@/components/governance/StrategyComparisonTable";

export default function HomePage() {
  const {
    session,
    state,
    isFrozen,
    simulateRisk,
    simulatePhase,
    simulateNextStep,
    handleFreezeSession,
    handleNewSession,
    handleProfileChange,
  } = useGovernanceSession();

  // Keyboard shortcuts: Ctrl+1-4 phase, Ctrl+5-8 risk, Ctrl+N step, Ctrl+Shift+F freeze
  useKeyboardShortcuts({
    simulatePhase,
    simulateRisk,
    simulateNextStep,
    handleFreezeSession,
    isFrozen: isFrozen ?? false,
  });

  if (!session || !state) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Initializing session...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10 space-y-8 max-w-4xl mx-auto font-sans" role="main" aria-label="CVF Governance Dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Controlled Vibe Framework – V2.0
        </h1>
        <nav className="flex items-center gap-2" aria-label="Navigation">
          <Link href="/analytics" className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition">📊 Analytics</Link>
          <Link href="/history" className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition">History</Link>
          <DarkModeToggle />
        </nav>
      </div>

      {/* 1. Project Phase */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Project Phase</h2>
        <PhaseIndicator phase={state.phase} />
        <PhasePermissionNotice phase={state.phase} />

        <div className="flex gap-2 flex-wrap pt-2">
          {(["discovery", "planning", "execution", "verification"] as Phase[]).map((p) => (
            <button
              key={p}
              onClick={() => simulatePhase(p)}
              disabled={isFrozen}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition
                ${state.phase === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
                ${isFrozen ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Governance Profile */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Governance Profile</h2>
        <GovernanceProfileSelector
          selected={session.getSessionInfo().profile as StrategyProfileName}
          disabled={isFrozen}
          onChange={handleProfileChange}
        />
        <StrategyComparisonTable activeProfile={session.getSessionInfo().profile as StrategyProfileName} />
      </section>

      {/* 3. Risk Simulation */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Risk Simulation</h2>
        <div className="flex gap-2 flex-wrap">
          {(["R0", "R1", "R2", "R3"] as RLevel[]).map((r) => (
            <button
              key={r}
              onClick={() => simulateRisk(r)}
              disabled={isFrozen}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition
                ${state.rLevel === r
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"}
                ${isFrozen ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Session Step */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Session Step</h2>
        <p className="text-sm text-gray-600">Current Step: <span className="font-semibold">{state.step}</span></p>
        <button
          onClick={simulateNextStep}
          disabled={isFrozen}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition
            ${isFrozen ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          Next Step
        </button>
      </section>

      {/* 5. Governance Status */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Governance Status</h2>
        <TrustIndicator rLevel={state.rLevel} warning={state.warning} critical={state.critical} />
        <AutonomyStatusBadge autonomy={state.autonomy} />
        <AutonomyChart events={session.getEvents()} />
        <GovernanceActionPrompt escalated={state.escalated} requireHuman={state.requireHuman} hardStop={state.hardStop} />
      </section>

      {/* 6. Governance Timeline */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Governance Timeline</h2>
        <GovernanceTimeline events={session.getEvents()} />
      </section>

      {/* 7. Governance Export */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Audit Export</h2>
        <div className="flex gap-2 flex-wrap">
          <GovernanceExportButton
            sessionInfo={session.getSessionInfo()}
            finalState={session.getState()}
            events={session.getEvents()}
          />
          <GovernancePDFExport
            sessionInfo={session.getSessionInfo()}
            finalState={session.getState()}
            events={session.getEvents()}
          />
        </div>
      </section>

      {/* 8. Session Control */}
      <section className="space-y-3 pb-4">
        <h2 className="text-lg font-semibold text-gray-800">Session Control</h2>
        <p className="text-sm text-gray-600">
          Status: <span className={`font-semibold ${isFrozen ? "text-red-600 status-frozen" : "text-green-600 status-active"}`}>
            {session.getStatus()}
          </span>
        </p>
        {!isFrozen && (
          <button
            onClick={handleFreezeSession}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition"
            aria-label="Freeze current session"
          >
            Freeze Session
          </button>
        )}
        {isFrozen && (
          <>
            <p className="text-sm text-red-500 font-medium">
              Session đã bị đóng băng. Không thể thay đổi thêm.
            </p>
            <button
              onClick={handleNewSession}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition"
              aria-label="Start a new session"
            >
              Start New Session
            </button>
          </>
        )}
      </section>

      {/* Keyboard Shortcuts Reference */}
      <footer className="border-t border-gray-200 pt-4 pb-8">
        <details className="text-xs text-gray-400">
          <summary className="cursor-pointer hover:text-gray-600 transition">⌨️ Keyboard Shortcuts</summary>
          <div className="mt-2 grid grid-cols-2 gap-1 text-gray-500">
            <span><kbd className="bg-gray-100 px-1 rounded">Ctrl+1-4</kbd> Phase</span>
            <span><kbd className="bg-gray-100 px-1 rounded">Ctrl+5-8</kbd> Risk R0-R3</span>
            <span><kbd className="bg-gray-100 px-1 rounded">Ctrl+N</kbd> Next Step</span>
            <span><kbd className="bg-gray-100 px-1 rounded">Ctrl+Shift+F</kbd> Freeze</span>
          </div>
        </details>
      </footer>
    </main>
  );
}