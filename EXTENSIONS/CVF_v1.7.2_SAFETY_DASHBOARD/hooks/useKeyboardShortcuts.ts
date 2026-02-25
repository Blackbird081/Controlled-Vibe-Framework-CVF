// hooks/useKeyboardShortcuts.ts
"use client";

import { useEffect } from "react";
import type { Phase } from "@/lib/sessionManager";
import type { RLevel } from "@/lib/strategy/governanceStrategy.types";

interface ShortcutActions {
    simulatePhase: (phase: Phase) => void;
    simulateRisk: (r: RLevel) => void;
    simulateNextStep: () => void;
    handleFreezeSession: () => void;
    isFrozen: boolean;
}

/**
 * Keyboard shortcuts for power users.
 *
 * Ctrl+1-4: Set phase (discovery/planning/execution/verification)
 * Ctrl+5-8: Set risk (R0/R1/R2/R3)
 * Ctrl+N: Next step
 * Ctrl+Shift+F: Freeze session
 */
export function useKeyboardShortcuts({
    simulatePhase,
    simulateRisk,
    simulateNextStep,
    handleFreezeSession,
    isFrozen,
}: ShortcutActions) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) return;
            if (isFrozen) return;

            const phases: Phase[] = ["discovery", "planning", "execution", "verification"];
            const risks: RLevel[] = ["R0", "R1", "R2", "R3"];

            // Ctrl+1-4: Phase
            if (e.key >= "1" && e.key <= "4") {
                e.preventDefault();
                simulatePhase(phases[parseInt(e.key) - 1]);
                return;
            }

            // Ctrl+5-8: Risk
            if (e.key >= "5" && e.key <= "8") {
                e.preventDefault();
                simulateRisk(risks[parseInt(e.key) - 5]);
                return;
            }

            // Ctrl+N: Next step
            if (e.key === "n" && !e.shiftKey) {
                e.preventDefault();
                simulateNextStep();
                return;
            }

            // Ctrl+Shift+F: Freeze
            if (e.key === "F" && e.shiftKey) {
                e.preventDefault();
                handleFreezeSession();
                return;
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [simulatePhase, simulateRisk, simulateNextStep, handleFreezeSession, isFrozen]);
}
