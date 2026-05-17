// __tests__/skill.registry.test.ts
import { SkillDefinition } from "../02_TOOLKIT_CORE/interfaces"

// We need a fresh SkillRegistry instance for isolation.
// The singleton is shared across all tests, so we use unique IDs.
import { skillRegistry } from "../02_TOOLKIT_CORE/skill.registry"

const makeSkill = (id: string, overrides?: Partial<SkillDefinition>): SkillDefinition => ({
    id,
    name: `Skill ${id}`,
    version: "1.0.0",
    description: `Description for ${id}`,
    riskLevel: "R1",
    domain: "general",
    requiredPhase: 1,
    requiresApproval: false,
    allowedRoles: ["ANALYST", "ADMIN"],
    allowedEnvironments: ["dev", "staging"],
    requiresUAT: false,
    freezeOnRelease: false,
    active: true,
    ...overrides
})

describe("Skill Registry", () => {

    describe("register()", () => {

        it("should register a new skill successfully", () => {
            expect(() => {
                skillRegistry.register(makeSkill("sr-reg-001"))
            }).not.toThrow()
        })

        it("should throw when registering a duplicate skill ID", () => {
            skillRegistry.register(makeSkill("sr-reg-dup"))
            expect(() => {
                skillRegistry.register(makeSkill("sr-reg-dup"))
            }).toThrow(/Skill already registered: sr-reg-dup/)
        })
    })

    describe("get()", () => {

        it("should return a registered skill", () => {
            skillRegistry.register(makeSkill("sr-get-001"))
            const skill = skillRegistry.get("sr-get-001")
            expect(skill.id).toBe("sr-get-001")
            expect(skill.name).toBe("Skill sr-get-001")
        })

        it("should throw for a non-existent skill", () => {
            expect(() => {
                skillRegistry.get("nonexistent-skill-xyz")
            }).toThrow(/Skill not found/)
        })

        it("should throw for a deactivated skill", () => {
            skillRegistry.register(makeSkill("sr-get-deact"))
            skillRegistry.deactivate("sr-get-deact")
            expect(() => {
                skillRegistry.get("sr-get-deact")
            }).toThrow(/Skill is deactivated/)
        })
    })

    describe("update()", () => {

        it("should update an existing skill's properties", () => {
            skillRegistry.register(makeSkill("sr-upd-001"))
            skillRegistry.update("sr-upd-001", { description: "Updated description", riskLevel: "R2" })
            // Bypass deactivation check by using list + find
            const all = skillRegistry.list()
            const updated = all.find(s => s.id === "sr-upd-001")
            expect(updated).toBeDefined()
            expect(updated!.description).toBe("Updated description")
            expect(updated!.riskLevel).toBe("R2")
        })

        it("should throw when updating a non-existent skill", () => {
            expect(() => {
                skillRegistry.update("nonexistent-xyz", { description: "nope" })
            }).toThrow(/Skill not found/)
        })

        it("should preserve unchanged fields", () => {
            skillRegistry.register(makeSkill("sr-upd-preserve", { domain: "financial", riskLevel: "R2" }))
            skillRegistry.update("sr-upd-preserve", { description: "New desc" })
            const all = skillRegistry.list()
            const skill = all.find(s => s.id === "sr-upd-preserve")
            expect(skill!.domain).toBe("financial")
            expect(skill!.riskLevel).toBe("R2")
            expect(skill!.description).toBe("New desc")
        })
    })

    describe("deactivate()", () => {

        it("should deactivate an active skill", () => {
            skillRegistry.register(makeSkill("sr-deact-001"))
            skillRegistry.deactivate("sr-deact-001")
            // Verify via list (get() would throw)
            const all = skillRegistry.list()
            const skill = all.find(s => s.id === "sr-deact-001")
            expect(skill).toBeDefined()
            expect(skill!.active).toBe(false)
        })

        it("should throw when deactivating a non-existent skill", () => {
            expect(() => {
                skillRegistry.deactivate("nonexistent-deact-xyz")
            }).toThrow(/Skill not found/)
        })
    })

    describe("list()", () => {

        it("should return all registered skills including deactivated ones", () => {
            const all = skillRegistry.list()
            expect(Array.isArray(all)).toBe(true)
            expect(all.length).toBeGreaterThan(0)
        })
    })

    describe("exists()", () => {

        it("should return true for a registered skill", () => {
            skillRegistry.register(makeSkill("sr-exists-001"))
            expect(skillRegistry.exists("sr-exists-001")).toBe(true)
        })

        it("should return false for a non-registered skill", () => {
            expect(skillRegistry.exists("nonexistent-exists-xyz")).toBe(false)
        })
    })
})
