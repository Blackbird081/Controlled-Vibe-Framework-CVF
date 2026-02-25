import { describe, it, expect, beforeEach } from "vitest"
import { LifecycleEngine } from "../core/lifecycle.engine"
import { EventBus } from "../core/event-bus"
import { registerPolicy } from "../policy/policy.registry"
import type { CVFEvent } from "../core/event-bus"
import type { PolicyRule } from "../types/index"

let testCounter = 0
function uniqueVersion() {
    return `lifecycle-test-v${++testCounter}-${Date.now()}`
}

describe("LifecycleEngine Integration", () => {
    let engine: LifecycleEngine
    let bus: EventBus
    let events: CVFEvent[]

    beforeEach(() => {
        bus = new EventBus()
        events = []
        bus.onAll((e) => events.push(e))
        engine = new LifecycleEngine({ eventBus: bus })
    })

    function registerTestPolicy(
        version: string,
        rules: PolicyRule[]
    ) {
        registerPolicy(version, rules)
    }

    it("should run the full lifecycle and return a decision", async () => {
        const v = uniqueVersion()
        registerTestPolicy(v, [
            {
                id: "approve-low-cost",
                description: "Approve low cost proposals",
                evaluate: (p) =>
                    (p.estimatedCost as number) <= 100 ? "approved" : null,
            },
        ])

        const result = await engine.submit({
            id: `t-1-${v}`,
            payload: { estimatedCost: 50 },
            policyVersion: v,
        })

        expect(result.status).toBe("approved")
        expect(result.policyHash).toBeDefined()
        expect(result.state).toBeDefined()
    })

    it("should reject high-cost proposals", async () => {
        const v = uniqueVersion()
        registerTestPolicy(v, [
            {
                id: "reject-high-cost",
                description: "Reject high cost",
                evaluate: (p) =>
                    (p.estimatedCost as number) > 10000 ? "rejected" : null,
            },
        ])

        const result = await engine.submit({
            id: `t-2-${v}`,
            payload: { estimatedCost: 50000 },
            policyVersion: v,
        })

        expect(result.status).toBe("rejected")
    })

    it("should default to pending for unmatched proposals", async () => {
        const v = uniqueVersion()
        registerTestPolicy(v, [
            {
                id: "only-matches-specific",
                description: "Only matches specific action",
                evaluate: (p) =>
                    p.action === "deploy" ? "approved" : null,
            },
        ])

        const result = await engine.submit({
            id: `t-3-${v}`,
            payload: { action: "unknown" },
            policyVersion: v,
        })

        expect(result.status).toBe("pending")
    })

    it("should emit proposal:submitted event", async () => {
        const v = uniqueVersion()
        registerTestPolicy(v, [
            { id: "r1", description: "approve all", evaluate: () => "approved" },
        ])

        await engine.submit({
            id: `t-4-${v}`,
            payload: {},
            policyVersion: v,
        })

        const submitted = events.find((e) => e.type === "proposal:submitted")
        expect(submitted).toBeDefined()
        expect(
            (submitted?.data as { proposalId: string }).proposalId
        ).toBe(`t-4-${v}`)
    })

    it("should emit proposal:decided event", async () => {
        const v = uniqueVersion()
        registerTestPolicy(v, [
            { id: "r1", description: "approve all", evaluate: () => "approved" },
        ])

        await engine.submit({
            id: `t-5-${v}`,
            payload: {},
            policyVersion: v,
        })

        const decided = events.find((e) => e.type === "proposal:decided")
        expect(decided).toBeDefined()
        expect((decided?.data as { decision: string }).decision).toBe("approved")
    })

    it("should emit proposal:executed for non-simulated runs", async () => {
        const v = uniqueVersion()
        registerTestPolicy(v, [
            { id: "r1", description: "approve all", evaluate: () => "approved" },
        ])

        await engine.submit({
            id: `t-6-${v}`,
            payload: {},
            policyVersion: v,
        })

        const executed = events.find((e) => e.type === "proposal:executed")
        expect(executed).toBeDefined()
    })

    it("should NOT emit proposal:executed for simulate-only runs", async () => {
        const v = uniqueVersion()
        registerTestPolicy(v, [
            { id: "r1", description: "approve all", evaluate: () => "approved" },
        ])

        await engine.submit({
            id: `t-7-${v}`,
            payload: {},
            policyVersion: v,
            simulateOnly: true,
        })

        const executed = events.find((e) => e.type === "proposal:executed")
        expect(executed).toBeUndefined()
    })

    it("should emit 3 events for a full lifecycle", async () => {
        const v = uniqueVersion()
        registerTestPolicy(v, [
            { id: "r1", description: "approve all", evaluate: () => "approved" },
        ])

        await engine.submit({
            id: `t-8-${v}`,
            payload: {},
            policyVersion: v,
        })

        const types = events.map((e) => e.type)
        expect(types).toContain("proposal:submitted")
        expect(types).toContain("proposal:decided")
        expect(types).toContain("proposal:executed")
    })
})
