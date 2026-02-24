// __tests__/governanceStrategy.engine.test.ts
import { describe, it, expect } from "vitest";
import { evaluateStrategy } from "@/lib/strategy/governanceStrategy.engine";
import {
    BalancedStrategy,
    ConservativeStrategy,
    ExploratoryStrategy,
} from "@/lib/strategy/governanceStrategy.config";
import type {
    StrategyInput,
    GovernanceStrategyConfig,
} from "@/lib/strategy/governanceStrategy.types";

// ============================================================
// Helper
// ============================================================
function evaluate(
    rLevel: "R0" | "R1" | "R2" | "R3",
    currentAutonomy: number,
    strategy: GovernanceStrategyConfig,
    sessionStep = 0
) {
    const input: StrategyInput = { rLevel, currentAutonomy, sessionStep };
    return evaluateStrategy(input, strategy);
}

// ============================================================
// BALANCED PROFILE
// ============================================================
describe("evaluateStrategy — Balanced Profile", () => {
    const S = BalancedStrategy;

    it("R0 — no escalation, no warning, autonomy recovers", () => {
        const d = evaluate("R0", 70, S);
        expect(d.escalate).toBe(false);
        expect(d.requireHuman).toBe(false);
        expect(d.hardStop).toBe(false);
        expect(d.warning).toBe(false);
        expect(d.critical).toBe(false);
        // Recovery: (decayStartAt=R2=2, rValue=0) → recoveryAmount = (2-0)*5 = 10
        expect(d.newAutonomy).toBe(80); // 70+10, clamp(80, 20, 80) = 80
    });

    it("R1 — no escalation, no warning, autonomy recovers slightly", () => {
        const d = evaluate("R1", 70, S);
        expect(d.escalate).toBe(false);
        expect(d.warning).toBe(false);
        // Recovery: (2-1)*5 = 5 → 70+5=75, clamp(75,20,80)=75
        expect(d.newAutonomy).toBe(75);
    });

    it("R2 — no escalation, warning triggered, autonomy decays", () => {
        const d = evaluate("R2", 70, S);
        expect(d.escalate).toBe(false);
        expect(d.warning).toBe(true);
        expect(d.critical).toBe(false);
        // Decay: (rValue=2 - decayStartAt=2 + 1)*10 = 10 → 70-10=60
        expect(d.newAutonomy).toBe(60);
    });

    it("R3 — full escalation, hardStop, critical, heavy decay", () => {
        const d = evaluate("R3", 70, S);
        expect(d.escalate).toBe(true);
        expect(d.requireHuman).toBe(true);
        expect(d.hardStop).toBe(true);
        expect(d.warning).toBe(true);
        expect(d.critical).toBe(true);
        // Decay: (3-2+1)*10 = 20 → 70-20=50
        expect(d.newAutonomy).toBe(50);
    });
});

// ============================================================
// CONSERVATIVE PROFILE
// ============================================================
describe("evaluateStrategy — Conservative Profile", () => {
    const S = ConservativeStrategy;

    it("R0 — recovery capped at maxAutonomy=60", () => {
        const d = evaluate("R0", 55, S);
        // decayStartAt=R1=1, rValue=0 → recovery=(1-0)*5=5 → 55+5=60, clamp(60,10,60)=60
        expect(d.newAutonomy).toBe(60);
        expect(d.escalate).toBe(false);
    });

    it("R1 — decay starts early (decayStartAt=R1)", () => {
        const d = evaluate("R1", 60, S);
        // Decay: (1-1+1)*10=10 → 60-10=50
        expect(d.newAutonomy).toBe(50);
        expect(d.warning).toBe(true); // warnAt=R1
    });

    it("R2 — escalation + requireHuman + heavy decay", () => {
        const d = evaluate("R2", 60, S);
        expect(d.escalate).toBe(true); // autoEscalateAt=R2
        expect(d.requireHuman).toBe(true); // requireHumanAt=R2
        expect(d.critical).toBe(true); // criticalAt=R2
        // Decay: (2-1+1)*10=20 → 60-20=40
        expect(d.newAutonomy).toBe(40);
    });

    it("R3 — hardStop + extreme decay", () => {
        const d = evaluate("R3", 60, S);
        expect(d.hardStop).toBe(true);
        expect(d.escalate).toBe(true);
        // Decay: (3-1+1)*10=30 → 60-30=30
        expect(d.newAutonomy).toBe(30);
    });
});

// ============================================================
// EXPLORATORY PROFILE
// ============================================================
describe("evaluateStrategy — Exploratory Profile", () => {
    const S = ExploratoryStrategy;

    it("R0 — high recovery, no restrictions", () => {
        const d = evaluate("R0", 70, S);
        expect(d.escalate).toBe(false);
        expect(d.warning).toBe(false);
        // decayStartAt=R3=3, rValue=0 → recovery=(3-0)*5=15 → 70+15=85, clamp(85,30,100)=85
        expect(d.newAutonomy).toBe(85);
    });

    it("R1 — still recovery, no warning", () => {
        const d = evaluate("R1", 70, S);
        // recovery=(3-1)*5=10 → 70+10=80
        expect(d.newAutonomy).toBe(80);
        expect(d.warning).toBe(false); // warnAt=R2
    });

    it("R2 — recovery still, but warning", () => {
        const d = evaluate("R2", 70, S);
        // recovery=(3-2)*5=5 → 70+5=75
        expect(d.newAutonomy).toBe(75);
        expect(d.warning).toBe(true); // warnAt=R2
        expect(d.escalate).toBe(false); // autoEscalateAt=R3
    });

    it("R3 — escalation, decay, but NO hardStop", () => {
        const d = evaluate("R3", 70, S);
        expect(d.escalate).toBe(true); // autoEscalateAt=R3
        expect(d.hardStop).toBe(false); // hardStopAtR3=false
        expect(d.requireHuman).toBe(false); // requireHumanAt=undefined
        expect(d.critical).toBe(true); // criticalAt=R3
        // Decay: (3-3+1)*10=10 → 70-10=60
        expect(d.newAutonomy).toBe(60);
    });
});

// ============================================================
// EDGE CASES
// ============================================================
describe("evaluateStrategy — Edge Cases", () => {
    const S = BalancedStrategy;

    it("recovery caps at maxAutonomy", () => {
        // Start at 78, recovery would push to 88, but maxAutonomy=80
        const d = evaluate("R0", 78, S);
        expect(d.newAutonomy).toBe(80);
    });

    it("decay caps at minAutonomy", () => {
        // Start at 25, R3 decays by 20, min = 20
        const d = evaluate("R3", 25, S);
        expect(d.newAutonomy).toBe(20); // clamp(5, 20, 80) → 20
    });

    it("autonomy at minAutonomy — decay doesn't go below", () => {
        const d = evaluate("R3", 20, S);
        expect(d.newAutonomy).toBe(20); // clamp(0, 20, 80) → 20
    });

    it("autonomy at maxAutonomy — recovery no-op", () => {
        const d = evaluate("R0", 80, S);
        expect(d.newAutonomy).toBe(80); // clamp(90, 20, 80) → 80
    });

    it("recovery cycle: R3 → R0 → R0 (blocked by guard in SessionManager)", () => {
        // This tests the engine only — SessionManager guard is separate
        const d1 = evaluate("R3", 70, S);
        expect(d1.newAutonomy).toBe(50);
        const d2 = evaluate("R0", 50, S);
        expect(d2.newAutonomy).toBe(60); // 50+10=60
        const d3 = evaluate("R0", 60, S);
        expect(d3.newAutonomy).toBe(70); // 60+10=70
    });

    it("sessionStep does not affect current logic", () => {
        const d1 = evaluate("R2", 70, S, 0);
        const d2 = evaluate("R2", 70, S, 100);
        expect(d1).toEqual(d2);
    });

    it("extreme autonomy values are clamped", () => {
        const d = evaluate("R0", 200, S);
        expect(d.newAutonomy).toBe(80); // Even starting above max, clamped
    });

    it("negative autonomy values are clamped", () => {
        const d = evaluate("R3", 0, S);
        expect(d.newAutonomy).toBe(20); // Even starting at 0, clamped to min
    });
});
