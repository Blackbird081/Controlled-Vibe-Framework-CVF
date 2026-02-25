import { describe, it, expect, beforeEach } from "vitest"
import { DIContainer } from "../core/container"

describe("DIContainer", () => {
    let di: DIContainer

    beforeEach(() => {
        di = new DIContainer()
    })

    it("should register and resolve a service", () => {
        const mockRepo = { save: async () => { }, getById: async () => null, list: async () => [], updateState: async () => { }, updateDecision: async () => { } }
        di.register("proposalRepo" as any, () => mockRepo)
        const resolved = di.resolve("proposalRepo" as any)
        expect(resolved).toBe(mockRepo)
    })

    it("should return same instance (singleton)", () => {
        let callCount = 0
        di.register("proposalRepo" as any, () => { callCount++; return { id: callCount } })
        const a = di.resolve("proposalRepo" as any)
        const b = di.resolve("proposalRepo" as any)
        expect(a).toBe(b)
        expect(callCount).toBe(1)
    })

    it("should throw for unregistered service", () => {
        expect(() => di.resolve("proposalRepo" as any)).toThrow("Service not registered")
    })

    it("should support registerInstance", () => {
        const instance = { mock: true }
        di.registerInstance("eventBus" as any, instance as any)
        expect(di.resolve("eventBus" as any)).toBe(instance)
    })

    it("should check registration with has", () => {
        expect(di.has("proposalRepo")).toBe(false)
        di.register("proposalRepo" as any, () => ({}) as any)
        expect(di.has("proposalRepo")).toBe(true)
    })

    it("should reset all registrations", () => {
        di.register("proposalRepo" as any, () => ({}) as any)
        di.reset()
        expect(di.has("proposalRepo")).toBe(false)
    })
})
