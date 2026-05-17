// hooks/useGovernanceSession.ts
"use client";

import { useState, useSyncExternalStore, useCallback, useEffect } from "react";
import { SessionManager, Phase, SessionState } from "@/lib/sessionManager";
import { GovernanceStrategyAdapter } from "@/lib/strategy/governanceStrategy.adapter";
import { RLevel, StrategyProfileName } from "@/lib/strategy/governanceStrategy.types";
import { serializeSession } from "@/lib/storage/sessionSerializer";
import { saveSession } from "@/lib/storage/sessionStorage";
import toast from "react-hot-toast";

/**
 * Custom hook for managing a CVF Governance Session.
 * Uses useSyncExternalStore for reactive updates + auto-save + toast notifications.
 */
export function useGovernanceSession() {
    const [session, setSession] = useState<SessionManager | null>(null);

    // Initialize on first render (client-only)
    if (session === null && typeof window !== "undefined") {
        const manager = new SessionManager(70);
        const adapter = new GovernanceStrategyAdapter("balanced");
        manager.attachStrategy(adapter, "balanced");
        setSession(manager);
    }

    // Subscribe to state changes via useSyncExternalStore
    const state = useSyncExternalStore(
        useCallback((cb: () => void) => session?.subscribe(cb) ?? (() => { }), [session]),
        useCallback(() => session?.getSnapshot() ?? null, [session]),
        () => null // server snapshot
    );

    // Auto-save on every state change
    useEffect(() => {
        if (!session || !state) return;

        const data = serializeSession(
            session.getSessionInfo(),
            session.getState(),
            session.getEvents(),
            session.getStatus()
        );
        saveSession(data);
    }, [session, state]);

    const isFrozen = session?.getStatus() === "FROZEN";

    const simulateRisk = useCallback(
        (r: RLevel) => {
            if (!session) return;
            const prevState = session.getState();
            session.updateRisk(r);
            const newState = session.getState();

            // Toast notifications for governance events
            if (newState.hardStop && !prevState.hardStop) {
                toast.error("🛑 HARD STOP — AI đã bị dừng hoàn toàn", { duration: 5000 });
            } else if (newState.requireHuman && !prevState.requireHuman) {
                toast("👤 Cần xác nhận từ người dùng", { icon: "⚠️", duration: 4000 });
            } else if (newState.escalated && !prevState.escalated) {
                toast("⬆️ Escalation triggered", { icon: "🔔", duration: 3000 });
            } else if (newState.warning && !prevState.warning) {
                toast("⚠️ Warning — Risk level elevated", { duration: 3000 });
            }

            if (newState.autonomy < prevState.autonomy) {
                toast(`Autonomy: ${prevState.autonomy} → ${newState.autonomy}`, {
                    icon: "📉", duration: 2000,
                });
            } else if (newState.autonomy > prevState.autonomy) {
                toast(`Autonomy: ${prevState.autonomy} → ${newState.autonomy}`, {
                    icon: "📈", duration: 2000,
                });
            }
        },
        [session]
    );

    const simulatePhase = useCallback(
        (phase: Phase) => {
            if (!session) return;
            const prev = session.getState().phase;
            session.setPhase(phase);
            if (prev !== phase) {
                toast.success(`Phase: ${prev} → ${phase}`, { duration: 2000 });
            }
        },
        [session]
    );

    const simulateNextStep = useCallback(
        () => {
            if (!session) return;
            session.nextStep();
            toast(`Step ${session.getState().step}`, { icon: "➡️", duration: 1500 });
        },
        [session]
    );

    const handleFreezeSession = useCallback(() => {
        const confirmed = window.confirm(
            "Bạn có chắc muốn đóng băng session? Hành động này không thể hoàn tác."
        );
        if (!confirmed) return;
        session?.endSession();
        toast.error("❄️ Session đã bị đóng băng", { duration: 4000 });
    }, [session]);

    const handleNewSession = useCallback(() => {
        const manager = new SessionManager(70);
        const adapter = new GovernanceStrategyAdapter("balanced");
        manager.attachStrategy(adapter, "balanced");
        setSession(manager);
        toast.success("🆕 Session mới đã được tạo", { duration: 2000 });
    }, []);

    const handleProfileChange = useCallback(
        (profile: StrategyProfileName) => {
            if (!session) return;
            const adapter = new GovernanceStrategyAdapter(profile);
            session.attachStrategy(adapter, profile);
            session.reEvaluateStrategy();
            toast.success(`Profile: ${profile}`, { icon: "⚙️", duration: 2000 });
        },
        [session]
    );

    return {
        session,
        state,
        isFrozen,
        simulateRisk,
        simulatePhase,
        simulateNextStep,
        handleFreezeSession,
        handleNewSession,
        handleProfileChange,
    };
}
