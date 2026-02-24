import { describe, it, expect } from "vitest"
import { RiskEngine } from "../policy/risk.engine"
import type { RiskAssessmentInput, ArtifactChangeMeta } from "../policy/risk.engine"

function makeChange(overrides: Partial<ArtifactChangeMeta> = {}): ArtifactChangeMeta {
    return {
        filePath: overrides.filePath ?? "src/example.ts",
        diffSize: overrides.diffSize ?? 10,
        isNewFile: overrides.isNewFile ?? false,
        isDeleted: overrides.isDeleted ?? false,
        touchesDependencyFile: overrides.touchesDependencyFile ?? false,
        touchesMigrationFile: overrides.touchesMigrationFile ?? false,
        touchesPolicyFile: overrides.touchesPolicyFile ?? false,
        touchesCoreFile: overrides.touchesCoreFile ?? false,
    }
}

describe("RiskEngine", () => {
    it("should assess LOW risk for small code change", () => {
        const input: RiskAssessmentInput = {
            artifactType: "CODE",
            changes: [makeChange({ diffSize: 5 })],
        }
        const result = RiskEngine.assess(input)
        expect(result.level).toBe("LOW")
        expect(result.score).toBeGreaterThan(0)
    })

    it("should flag infra changes with reason", () => {
        const input: RiskAssessmentInput = {
            artifactType: "INFRA",
            changes: [makeChange({ diffSize: 100 })],
        }
        const result = RiskEngine.assess(input)
        // INFRA base=20, small diff -> LOW
        expect(result.score).toBeGreaterThanOrEqual(20)
        expect(result.reasons).toContain("Infrastructure change detected")
    })

    it("should score highly for POLICY artifact type", () => {
        const input: RiskAssessmentInput = {
            artifactType: "POLICY",
            changes: [makeChange({ diffSize: 10 })],
        }
        const result = RiskEngine.assess(input)
        // POLICY base=50 -> MEDIUM (35-69)
        expect(result.score).toBeGreaterThanOrEqual(50)
        expect(result.reasons).toContain("Policy modification attempt")
    })

    it("should add score for large file count (> 20)", () => {
        const changes = Array.from({ length: 25 }, (_, i) =>
            makeChange({ filePath: `file-${i}.ts`, diffSize: 10 })
        )
        const result = RiskEngine.assess({ artifactType: "CODE", changes })
        expect(result.reasons).toContain("Large file count change")
    })

    it("should add score for very large diff (> 2000 lines)", () => {
        const result = RiskEngine.assess({
            artifactType: "CODE",
            changes: [makeChange({ diffSize: 3000 })],
        })
        expect(result.reasons).toContain("Very large diff size")
    })

    it("should flag dependency file changes", () => {
        const result = RiskEngine.assess({
            artifactType: "CODE",
            changes: [makeChange({ filePath: "package.json", touchesDependencyFile: true })],
        })
        expect(result.reasons).toContain("Dependency file changed: package.json")
    })

    it("should flag migration file changes", () => {
        const result = RiskEngine.assess({
            artifactType: "CODE",
            changes: [makeChange({ filePath: "001_init.sql", touchesMigrationFile: true })],
        })
        expect(result.reasons).toContain("Migration file changed: 001_init.sql")
    })

    it("should flag core file changes", () => {
        const result = RiskEngine.assess({
            artifactType: "CODE",
            changes: [makeChange({ filePath: "core/engine.ts", touchesCoreFile: true })],
        })
        expect(result.reasons).toContain("Core file modified: core/engine.ts")
    })

    it("should flag policy file changes with highest weight", () => {
        const result = RiskEngine.assess({
            artifactType: "CODE",
            changes: [makeChange({ filePath: "policy/rules.ts", touchesPolicyFile: true })],
        })
        expect(result.reasons).toContain("Policy file modification: policy/rules.ts")
        // CODE(10) + policyFile(100) = 110 -> HIGH (70-119)
        expect(result.level).toBe("HIGH")
    })

    it("should compound multiple risk factors", () => {
        const result = RiskEngine.assess({
            artifactType: "INFRA",
            changes: [
                makeChange({ diffSize: 500, touchesCoreFile: true }),
                makeChange({ diffSize: 500, touchesDependencyFile: true }),
            ],
        })
        // INFRA(20) + diff>500(10) + core(30) + dependency(20) = 80+ → HIGH or CRITICAL
        expect(["HIGH", "CRITICAL"]).toContain(result.level)
    })
})
