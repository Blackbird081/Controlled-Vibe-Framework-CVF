// __tests__/sessionManager.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionManager } from "@/lib/sessionManager";
import { GovernanceStrategyAdapter } from "@/lib/strategy/governanceStrategy.adapter";

// Mock crypto.randomUUID for deterministic tests
vi.stubGlobal("crypto", {
    randomUUID: () => "test-uuid-" + Math.random().toString(36).slice(2, 8),
});

// ============================================================
// LIFECYCLE
// ============================================================
describe("SessionManager — Lifecycle", () => {
    let session: SessionManager;

    beforeEach(() => {
        session = new SessionManager(70);
    });

    it("initializes with correct defaults", () => {
        const state = session.getState();
        expect(state.rLevel).toBe("R0");
        expect(state.phase).toBe("discovery");
        expect(state.autonomy).toBe(70);
        expect(state.step).toBe(0);
        expect(state.escalated).toBe(false);
        expect(state.requireHuman).toBe(false);
        expect(state.hardStop).toBe(false);
        expect(session.getStatus()).toBe("ACTIVE");
    });

    it("logs initial STEP_ADVANCED event on creation", () => {
        const events = session.getEvents();
        expect(events.length).toBe(1);
        expect(events[0].type).toBe("STEP_ADVANCED");
    });

    it("transitions to FROZEN after endSession()", () => {
        session.endSession();
        expect(session.getStatus()).toBe("FROZEN");
    });

    it("logs SESSION_FROZEN event on endSession()", () => {
        session.endSession();
        const events = session.getEvents();
        const lastEvent = events[events.length - 1];
        expect(lastEvent.type).toBe("SESSION_FROZEN");
        expect(lastEvent.metadata?.note).toBe("Session Frozen");
    });

    it("prevents double freeze", () => {
        session.endSession();
        const eventCount = session.getEvents().length;
        session.endSession(); // second call — silently ignored
        expect(session.getEvents().length).toBe(eventCount);
    });

    it("blocks all mutations after freeze", () => {
        session.endSession();
        const stateBefore = session.getState();

        session.setPhase("execution");
        session.updateRisk("R3");
        session.nextStep();

        const stateAfter = session.getState();
        expect(stateAfter).toEqual(stateBefore);
    });

    it("read methods still work after freeze", () => {
        session.endSession();
        expect(session.getState()).toBeDefined();
        expect(session.getEvents()).toBeDefined();
        expect(session.getSessionInfo()).toBeDefined();
        expect(session.getStatus()).toBe("FROZEN");
    });
});

// ============================================================
// PHASE
// ============================================================
describe("SessionManager — Phase", () => {
    let session: SessionManager;

    beforeEach(() => {
        session = new SessionManager(70);
    });

    it("changes phase and logs event", () => {
        session.setPhase("planning");
        expect(session.getState().phase).toBe("planning");
        const events = session.getEvents();
        expect(events[events.length - 1].type).toBe("PHASE_CHANGED");
    });

    it("guards duplicate phase — no event logged", () => {
        const eventsBeforeCount = session.getEvents().length;
        session.setPhase("discovery"); // same as current
        expect(session.getEvents().length).toBe(eventsBeforeCount);
    });

    it("supports all 4 phases", () => {
        const phases = ["discovery", "planning", "execution", "verification"] as const;
        for (const p of phases) {
            session.setPhase(p);
            expect(session.getState().phase).toBe(p);
        }
    });
});

// ============================================================
// RISK + STRATEGY
// ============================================================
describe("SessionManager — Risk & Strategy", () => {
    let session: SessionManager;

    beforeEach(() => {
        session = new SessionManager(70);
        const adapter = new GovernanceStrategyAdapter("balanced");
        session.attachStrategy(adapter, "balanced");
    });

    it("updates risk and logs event", () => {
        session.updateRisk("R2");
        expect(session.getState().rLevel).toBe("R2");
        const events = session.getEvents();
        const riskEvent = events.find((e) => e.type === "RISK_UPDATED");
        expect(riskEvent).toBeDefined();
        expect(riskEvent?.metadata?.newRisk).toBe("R2");
    });

    it("guards duplicate risk — no event logged", () => {
        session.updateRisk("R2");
        const countAfterFirst = session.getEvents().length;
        session.updateRisk("R2"); // duplicate
        expect(session.getEvents().length).toBe(countAfterFirst);
    });

    it("evaluates strategy on risk update — autonomy changes", () => {
        session.updateRisk("R3");
        const state = session.getState();
        // Balanced R3: decay = (3-2+1)*10 = 20 → 70-20=50
        expect(state.autonomy).toBe(50);
        expect(state.escalated).toBe(true);
        expect(state.hardStop).toBe(true);
    });

    it("autonomy recovers when risk decreases", () => {
        session.updateRisk("R3"); // autonomy → 50
        session.updateRisk("R0"); // recovery: (2-0)*5=10 → 50+10=60
        expect(session.getState().autonomy).toBe(60);
    });

    it("guards escalation events — only logs on state change", () => {
        session.updateRisk("R3"); // escalated: false→true → log ESCALATED
        const eventsAfterR3 = session.getEvents();
        const escalatedCount1 = eventsAfterR3.filter((e) => e.type === "ESCALATED").length;
        expect(escalatedCount1).toBe(1);

        // Change to R2 then back to R3 — should log again since state toggled
        session.updateRisk("R2"); // balanced R2: escalate=false
        session.updateRisk("R3"); // escalate: false→true → log ESCALATED
        const escalatedCount2 = session.getEvents().filter((e) => e.type === "ESCALATED").length;
        expect(escalatedCount2).toBe(2);
    });
});

// ============================================================
// STEP
// ============================================================
describe("SessionManager — Step", () => {
    let session: SessionManager;

    beforeEach(() => {
        session = new SessionManager(70);
    });

    it("increments step and logs event", () => {
        session.nextStep();
        expect(session.getState().step).toBe(1);
        session.nextStep();
        expect(session.getState().step).toBe(2);
    });

    it("logs STEP_ADVANCED event each time", () => {
        session.nextStep();
        session.nextStep();
        const stepEvents = session.getEvents().filter((e) => e.type === "STEP_ADVANCED");
        expect(stepEvents.length).toBe(3); // 1 initial + 2 nextStep calls
    });
});

// ============================================================
// STRATEGY ATTACHMENT
// ============================================================
describe("SessionManager — Strategy Attachment", () => {
    let session: SessionManager;

    beforeEach(() => {
        session = new SessionManager(70);
    });

    it("works without strategy attached", () => {
        session.updateRisk("R3");
        // No strategy → no autonomy change
        expect(session.getState().autonomy).toBe(70);
        expect(session.getState().escalated).toBe(false);
    });

    it("updates profile info on attachStrategy", () => {
        const adapter = new GovernanceStrategyAdapter("conservative");
        session.attachStrategy(adapter, "conservative");
        expect(session.getSessionInfo().profile).toBe("conservative");
    });

    it("reEvaluateStrategy re-runs current risk with attached strategy", () => {
        session.updateRisk("R3");
        // No strategy → autonomy unchanged
        expect(session.getState().autonomy).toBe(70);

        const adapter = new GovernanceStrategyAdapter("balanced");
        session.attachStrategy(adapter, "balanced");
        session.reEvaluateStrategy();

        // Now strategy is attached → R3 should decay autonomy
        expect(session.getState().autonomy).toBe(50);
        expect(session.getState().escalated).toBe(true);
    });

    it("blocks strategy attachment when frozen", () => {
        session.endSession();
        const adapter = new GovernanceStrategyAdapter("balanced");
        session.attachStrategy(adapter, "balanced");
        // Profile should not change
        expect(session.getSessionInfo().profile).toBe("balanced"); // default from constructor
    });
});

// ============================================================
// IMMUTABILITY
// ============================================================
describe("SessionManager — Immutability", () => {
    it("getState returns a copy (external mutation doesn't affect internal)", () => {
        const session = new SessionManager(70);
        const state1 = session.getState();
        state1.autonomy = 999;
        const state2 = session.getState();
        expect(state2.autonomy).toBe(70); // internal state unaffected
    });

    it("getEvents returns a copy", () => {
        const session = new SessionManager(70);
        const events1 = session.getEvents();
        events1.push({} as any);
        const events2 = session.getEvents();
        expect(events2.length).toBe(1); // internal events unaffected
    });

    it("getSessionInfo returns a copy", () => {
        const session = new SessionManager(70);
        const info1 = session.getSessionInfo();
        info1.profile = "hacked";
        const info2 = session.getSessionInfo();
        expect(info2.profile).toBe("balanced"); // default
    });
});

// ============================================================
// INPUT VALIDATION
// ============================================================
describe("SessionManager — Input Validation", () => {
    it("throws on negative initialAutonomy", () => {
        expect(() => new SessionManager(-10)).toThrow(RangeError);
    });

    it("throws on initialAutonomy > 100", () => {
        expect(() => new SessionManager(150)).toThrow(RangeError);
    });

    it("accepts boundary values 0 and 100", () => {
        expect(() => new SessionManager(0)).not.toThrow();
        expect(() => new SessionManager(100)).not.toThrow();
    });
});

// ============================================================
// AUDIT TRAIL COMPLETENESS
// ============================================================
describe("SessionManager — Audit Trail", () => {
    it("full scenario produces correct event sequence", () => {
        const session = new SessionManager(70);
        const adapter = new GovernanceStrategyAdapter("balanced");
        session.attachStrategy(adapter, "balanced");

        session.setPhase("planning");
        session.updateRisk("R2");
        session.nextStep();
        session.updateRisk("R3");
        session.endSession();

        const events = session.getEvents();
        const types = events.map((e) => e.type);

        expect(types).toEqual([
            "STEP_ADVANCED",      // init
            "PHASE_CHANGED",      // → planning
            "RISK_UPDATED",       // → R2
            "AUTONOMY_ADJUSTED",  // balanced R2 decay
            "STEP_ADVANCED",      // nextStep
            "RISK_UPDATED",       // → R3
            "AUTONOMY_ADJUSTED",  // balanced R3 decay
            "ESCALATED",          // R3 escalate
            "REQUIRES_HUMAN",     // R3 requireHuman
            "HARD_STOP",          // R3 hardStop
            "SESSION_FROZEN",     // freeze
        ]);
    });

    it("all events have required fields", () => {
        const session = new SessionManager(70);
        session.updateRisk("R2");
        session.endSession();

        for (const event of session.getEvents()) {
            expect(event.id).toBeDefined();
            expect(event.sessionId).toBeDefined();
            expect(event.timestamp).toBeGreaterThan(0);
            expect(event.step).toBeGreaterThanOrEqual(0);
            expect(event.phase).toBeDefined();
            expect(event.rLevel).toBeDefined();
            expect(event.autonomy).toBeGreaterThanOrEqual(0);
            expect(event.type).toBeDefined();
        }
    });
});
