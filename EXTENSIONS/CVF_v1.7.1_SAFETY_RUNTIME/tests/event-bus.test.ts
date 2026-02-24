import { describe, it, expect, beforeEach } from "vitest"
import { EventBus } from "../core/event-bus"
import type { CVFEvent } from "../core/event-bus"

describe("EventBus", () => {
    let bus: EventBus

    beforeEach(() => {
        bus = new EventBus()
    })

    it("should emit and receive typed events", () => {
        const received: CVFEvent[] = []
        bus.on("proposal:submitted", (e) => received.push(e))

        bus.emitTyped("proposal:submitted", {
            proposalId: "p1",
            source: "api",
            action: "deploy",
        })

        expect(received).toHaveLength(1)
        expect(received[0]?.type).toBe("proposal:submitted")
    })

    it("should not deliver to unrelated listeners", () => {
        const received: CVFEvent[] = []
        bus.on("policy:registered", (e) => received.push(e))

        bus.emitTyped("proposal:submitted", {
            proposalId: "p1",
            source: "api",
            action: "deploy",
        })

        expect(received).toHaveLength(0)
    })

    it("should support wildcard listeners via onAll", () => {
        const all: CVFEvent[] = []
        bus.onAll((e) => all.push(e))

        bus.emitTyped("proposal:submitted", { proposalId: "p1", source: "api", action: "a" })
        bus.emitTyped("proposal:decided", { proposalId: "p1", decision: "approved", policyVersion: "v1" })

        expect(all).toHaveLength(2)
    })

    it("should unsubscribe with off", () => {
        const received: CVFEvent[] = []
        const handler = (e: CVFEvent) => received.push(e)
        bus.on("error", handler)

        bus.emitTyped("error", { source: "test", message: "boom" })
        expect(received).toHaveLength(1)

        bus.off("error", handler)
        bus.emitTyped("error", { source: "test", message: "boom2" })
        expect(received).toHaveLength(1) // still 1
    })

    it("should survive handler errors", () => {
        bus.on("error", () => { throw new Error("handler crash") })
        const received: CVFEvent[] = []
        bus.on("error", (e) => received.push(e))

        // Should not throw
        bus.emitTyped("error", { source: "test", message: "x" })
        expect(received).toHaveLength(1)
    })

    it("should report listener count", () => {
        expect(bus.listenerCount("test")).toBe(0)
        bus.on("test", () => { })
        expect(bus.listenerCount("test")).toBe(1)
        bus.onAll(() => { })
        expect(bus.listenerCount("test")).toBe(2) // type + wildcard
    })

    it("should clear all listeners", () => {
        bus.on("a", () => { })
        bus.on("b", () => { })
        bus.onAll(() => { })
        bus.clear()
        expect(bus.listenerCount("a")).toBe(0)
        expect(bus.listenerCount("b")).toBe(0)
    })
})
