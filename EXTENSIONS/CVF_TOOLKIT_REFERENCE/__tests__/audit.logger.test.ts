// __tests__/audit.logger.test.ts
import { auditLogger } from "../02_TOOLKIT_CORE/audit.logger"

describe("Audit Logger", () => {

    describe("log()", () => {

        it("should add a record with timestamp", () => {
            const before = auditLogger.getAll().length
            auditLogger.log({
                eventType: "SKILL_INVOCATION",
                operatorId: "op-audit-001",
                skillId: "skill-audit-001",
                details: { action: "test" }
            })
            const after = auditLogger.getAll()
            expect(after.length).toBe(before + 1)
            const last = after[after.length - 1]
            expect(last.timestamp).toBeDefined()
            expect(last.eventType).toBe("SKILL_INVOCATION")
        })
    })

    describe("getAll()", () => {

        it("should return all logged records", () => {
            const all = auditLogger.getAll()
            expect(Array.isArray(all)).toBe(true)
            expect(all.length).toBeGreaterThan(0)
        })
    })

    describe("filterBySkill()", () => {

        it("should return only records matching the given skillId", () => {
            auditLogger.log({
                eventType: "RISK_CLASSIFICATION",
                skillId: "filter-skill-A",
                details: { test: true }
            })
            auditLogger.log({
                eventType: "RISK_CLASSIFICATION",
                skillId: "filter-skill-B",
                details: { test: true }
            })
            const filtered = auditLogger.filterBySkill("filter-skill-A")
            expect(filtered.length).toBeGreaterThanOrEqual(1)
            filtered.forEach(r => expect(r.skillId).toBe("filter-skill-A"))
        })

        it("should return empty array when no records match", () => {
            const filtered = auditLogger.filterBySkill("nonexistent-skill-xyz")
            expect(filtered).toEqual([])
        })
    })

    describe("filterByOperator()", () => {

        it("should return only records matching the given operatorId", () => {
            auditLogger.log({
                eventType: "APPROVAL_GRANTED",
                operatorId: "filter-op-A",
                details: { test: true }
            })
            auditLogger.log({
                eventType: "APPROVAL_GRANTED",
                operatorId: "filter-op-B",
                details: { test: true }
            })
            const filtered = auditLogger.filterByOperator("filter-op-A")
            expect(filtered.length).toBeGreaterThanOrEqual(1)
            filtered.forEach(r => expect(r.operatorId).toBe("filter-op-A"))
        })

        it("should return empty array when no records match", () => {
            const filtered = auditLogger.filterByOperator("nonexistent-op-xyz")
            expect(filtered).toEqual([])
        })
    })

    describe("export()", () => {

        it("should return a valid JSON string of all records", () => {
            const exported = auditLogger.export()
            expect(typeof exported).toBe("string")
            const parsed = JSON.parse(exported)
            expect(Array.isArray(parsed)).toBe(true)
            expect(parsed.length).toBe(auditLogger.getAll().length)
        })

        it("should contain proper formatting (indented JSON)", () => {
            const exported = auditLogger.export()
            // JSON.stringify with indent 2 produces newlines
            expect(exported).toContain("\n")
        })
    })
})
